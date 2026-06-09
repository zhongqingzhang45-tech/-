"""Agent 2：热点雷达

抓 5 个来源的热榜/热搜，写入 hot_topics 表：
  - douyin   抖音热榜
  - weibo    微博热搜
  - baidu    百度热搜
  - xhs      小红书搜索热词
  - wechat   微信热点（搜狗微信热榜 / 读秒热点）

使用：HTTP + HTML/JSON 解析，不依赖 Selenium。
"""
import json
import re
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger

from config import Config
from utils.common import ensure_dir
from utils.http_client import http_get
from db import get_db, HotTopic


# ---------- 各源抓取器 ----------

def _parse_douyin_hot(raw: Dict[str, Any]) -> List[Dict[str, Any]]:
    """抖音热榜 JSON 结构适配
    文档中 hot list 的典型字段：word / hot_value / group_id / position
    """
    items = []
    data = (raw.get("data") if isinstance(raw, dict) else None) or {}
    candidates = data.get("word_list") or data.get("hot_list") or data.get("words") or raw.get("data", [])
    if not isinstance(candidates, list):
        return []
    for idx, it in enumerate(candidates):
        if not isinstance(it, dict):
            continue
        items.append({
            "keyword": str(it.get("word") or it.get("keyword") or it.get("title") or "").strip(),
            "heat_value": float(it.get("hot_value") or it.get("hot") or it.get("heat") or 0),
            "heat_growth": float(it.get("heat_growth") or it.get("growth") or it.get("delta") or 0),
            "category": str(it.get("category") or it.get("tag") or ""),
            "external_id": str(it.get("group_id") or it.get("id") or ""),
            "rank": int(it.get("position") or it.get("rank") or (idx + 1)),
        })
    return items


def _parse_weibo_hot(raw: Dict[str, Any]) -> List[Dict[str, Any]]:
    items = []
    data = raw.get("data") if isinstance(raw, dict) else None
    cards = (data.get("cards") if isinstance(data, dict) else None) or []
    for card in cards:
        groups = card.get("card_group") or []
        for g in groups:
            title = g.get("title") or g.get("desc") or ""
            keyword = title.strip()
            if not keyword:
                continue
            items.append({
                "keyword": keyword,
                "heat_value": float(g.get("hot_num") or g.get("hot_value") or 0),
                "heat_growth": 0,
                "category": g.get("icon_desc") or g.get("category") or "",
                "external_id": str(g.get("mblogid") or g.get("id") or ""),
                "rank": len(items) + 1,
            })
    return items


def _parse_baidu_hot(raw: Dict[str, Any]) -> List[Dict[str, Any]]:
    items = []
    data = raw.get("data") if isinstance(raw, dict) else None
    arr = (data.get("cards") if isinstance(data, dict) else None) or data.get("list") or []
    for idx, it in enumerate(arr):
        if not isinstance(it, dict):
            continue
        keyword = str(it.get("keyword") or it.get("word") or it.get("title") or "").strip()
        if not keyword:
            continue
        items.append({
            "keyword": keyword,
            "heat_value": float(it.get("hot_value") or it.get("hotScore") or it.get("hot") or 0),
            "heat_growth": float(it.get("heat_growth") or it.get("growth") or 0),
            "category": str(it.get("category") or it.get("tag") or it.get("type") or ""),
            "external_id": str(it.get("id") or ""),
            "rank": int(it.get("rank") or it.get("pos") or (idx + 1)),
        })
    return items


def _fallback_html_parse(html: str) -> List[Dict[str, Any]]:
    """通用 HTML 兜底解析。抽取带数字的条目（热榜常见样式）"""
    items = []
    # 匹配 "38. 某某话题 1,234,567" 之类
    for m in re.finditer(r"(\d{1,3})[\.、]\s*([^<>\n\r]{2,40})[^\n\r]{0,30}(\d[\d,]{3,12})?", html):
        rank = int(m.group(1))
        keyword = m.group(2).strip()
        heat_str = (m.group(3) or "0").replace(",", "")
        try:
            heat = float(heat_str)
        except Exception:
            heat = 0
        if rank and keyword and rank <= 50:
            items.append({
                "keyword": keyword,
                "heat_value": heat,
                "heat_growth": 0,
                "category": "",
                "external_id": "",
                "rank": rank,
            })
    return items


SOURCE_CONFIG = {
    "douyin": {
        "url": "https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/",
        "parse": _parse_douyin_hot,
    },
    "weibo": {
        "url": "https://weibo.com/ajax/side/hotSearch",
        "parse": _parse_weibo_hot,
    },
    "baidu": {
        "url": "https://top.baidu.com/board?tab=realtime",
        "parse": _parse_baidu_hot,
    },
    # 小红书 / 微信：直接从公开索引页抓 HTML，解析关键词
    "xhs": {
        "url": "https://www.xiaohongshu.com/search_result?keyword=热门",
        "parse": lambda raw: _fallback_html_parse(raw if isinstance(raw, str) else json.dumps(raw, ensure_ascii=False)),
    },
    "wechat": {
        "url": "https://tophub.today/n/KqndgxeLl9",  # 搜狗/读秒微信热榜镜像
        "parse": lambda raw: _fallback_html_parse(raw if isinstance(raw, str) else json.dumps(raw, ensure_ascii=False)),
    },
}


class HotTopicRadar:
    """热点雷达：抓 5 个来源，统一入库到 hot_topics"""

    def __init__(self, sources: Optional[List[str]] = None):
        self.sources = sources or list(SOURCE_CONFIG.keys())

    def fetch_source(self, source: str) -> List[Dict[str, Any]]:
        cfg = SOURCE_CONFIG.get(source)
        if not cfg:
            logger.warning(f"未知来源: {source}")
            return []
        try:
            resp = http_get(cfg["url"], timeout=15, headers={
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
            })
            # 尝试解析 JSON；失败则把 HTML 原样交给 parse
            try:
                payload = resp.json()
                items = cfg["parse"](payload)
            except Exception:
                items = cfg["parse"](resp.text)
            for it in items:
                it["source"] = source
            logger.info(f"[hot] {source} -> {len(items)} 条")
            return items
        except Exception as e:
            logger.warning(f"[hot] {source} 抓取失败: {e}")
            return []

    def fetch_all(self) -> List[Dict[str, Any]]:
        all_items: List[Dict[str, Any]] = []
        for source in self.sources:
            all_items.extend(self.fetch_source(source))
            time.sleep(0.5)
        return all_items

    def save_to_db(self, items: List[Dict[str, Any]]) -> int:
        if not items:
            return 0
        saved = 0
        with get_db() as db:
            today = datetime.utcnow().date().isoformat()
            # 先删当天该 source 的旧数据（幂等）
            existing = db.query(HotTopic).filter(
                HotTopic.created_at >= f"{today} 00:00:00"
            ).all()
            for e in existing:
                db.delete(e)
            db.commit()

            for it in items:
                if not it.get("keyword"):
                    continue
                ht = HotTopic(
                    keyword=str(it["keyword"])[:256],
                    source=str(it.get("source") or ""),
                    heat_value=float(it.get("heat_value") or 0),
                    heat_growth=float(it.get("heat_growth") or 0),
                    category=str(it.get("category") or "")[:128],
                    external_id=str(it.get("external_id") or "")[:128],
                    rank=int(it.get("rank") or 0),
                    extra={"source_url": SOURCE_CONFIG.get(it.get("source"), {}).get("url", "")},
                )
                db.add(ht)
                saved += 1
            db.commit()
        logger.success(f"热点已写入 DB: {saved} 条")
        return saved

    def run(self, top_n: int = 50) -> List[Dict[str, Any]]:
        items = self.fetch_all()
        items.sort(key=lambda x: float(x.get("heat_value") or 0), reverse=True)
        items = items[:max(top_n, 1)]
        self.save_to_db(items)
        return items

    def get_today_hot(self, source: Optional[str] = None) -> List[Dict[str, Any]]:
        """从 DB 读当天的热点"""
        with get_db() as db:
            q = db.query(HotTopic)
            if source:
                q = q.filter(HotTopic.source == source)
            rows = q.order_by(HotTopic.heat_value.desc()).limit(100).all()
            return [{
                "keyword": r.keyword, "heat_value": r.heat_value, "heat_growth": r.heat_growth,
                "source": r.source, "category": r.category, "rank": r.rank,
                "created_at": r.created_at.isoformat() if r.created_at else "",
            } for r in rows]


def run_radar(top_n: int = 50) -> int:
    radar = HotTopicRadar()
    items = radar.run(top_n=top_n)
    return len(items)
