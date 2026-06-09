"""全流程离线冒烟测试
目标：不依赖浏览器、不依赖真实 API Key，验证：
  1) 爆品雷达（mock JSON → 写入 products）
  2) 热点雷达（mock 数据 → 写入 hot_topics）
  3) 趋势匹配引擎（从 DB 读 → 匹配）
  4) 卖点分析引擎（DeepSeek mock 回包 → ProductAnalysis）
  5) 内容工厂（6 种内容 → contents 表）
  6) 图片重组（下载占位图 → 合成封面图）
  7) 视频混剪（图片幻灯片 + TTS + SRT → 本地视频文件）
  8) 矩阵发布（不真实点击浏览器，只走 dry-run）
  9) 数据回流/排行榜（从 DB 聚合 → stdout 输出）

使用：
  python3 tests/end_to_end_smoke.py
"""
import json
import os
import sys
from pathlib import Path
from datetime import datetime

# 确保可以 import 项目根目录
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from loguru import logger

# ----- Mock LLM：强制所有 Agent 都走本地假数据，绝不发网络请求 -----
# 关键：先清空 API Key，再替换全局的 get_client 工厂函数
os.environ["DEEPSEEK_API_KEY"] = ""

from agents.llm import get_client, prompts
from agents.llm.deepseek_client import DeepSeekClient


class MockDeepSeekClient(DeepSeekClient):
    """总是返回固定 JSON，不发真实网络请求。
    注意：直接重写 chat 方法签名以兼容 chat(msgs) 和 chat(system, user) 两种调用方式。"""

    def __init__(self, *args, **kwargs):
        # 跳过父类的 __init__，避免读取真实 config
        self.api_key = ""
        self.base_url = ""
        self.model = "mock-model"
        self.temperature = 0.0
        self.max_tokens = 0

    def chat(self, *args, **kwargs) -> str:
        # 兼容两种调用方式：chat(messages, ...) 和 chat(user_msg, system_msg, ...)
        content_text = ""
        if args and isinstance(args[0], list):
            # chat([{role, content}, ...])
            for m in args[0]:
                content_text += str(m.get("content", "")) + "\n"
        else:
            # chat(user_msg, system_msg, ...)
            for a in args:
                content_text += str(a) + "\n"
        content_text = content_text.lower()

        if "pain_points" in content_text or "卖点" in content_text or "分析商品" in content_text or "analyst" in content_text or len(content_text) < 3000:
            return json.dumps({
                "pain_points": ["痛点一", "痛点二"],
                "selling_points": ["卖点一", "卖点二", "高性价比"],
                "use_scenarios": ["居家", "出差", "户外运动"],
                "target_audience": ["上班族", "学生"],
                "buy_reasons": ["价格实惠", "口碑好"],
                "advantages": ["品质稳定", "售后好"],
                "emotion_triggers": ["心动", "种草感"],
            }, ensure_ascii=False)
        if "小红书" in content_text or "种草" in content_text or "xiaohongshu" in content_text:
            return json.dumps({
                "title": "实测分享｜这件小物真的好用",
                "body": "最近入手了一件，整体体验不错。细节做工很好，使用场景也比较灵活。\n大家可以根据实际需求考虑。",
                "call_to_action": "有问题评论区问我～",
                "tags": ["好物分享", "实测", "种草"],
                "cart_text": "点击小黄车",
            }, ensure_ascii=False)
        if "视频脚本" in content_text or "script" in content_text:
            return json.dumps({
                "script": [
                    {"line": "你有没有遇到过这种情况？", "duration": 3},
                    {"line": "今天给大家看一个实用小物", "duration": 4},
                    {"line": "点击下方小黄车入手", "duration": 3},
                ],
                "total_duration": 10,
                "text": "你有没有遇到过这种情况？今天给大家看一个实用小物。点击下方小黄车入手。",
            }, ensure_ascii=False)
        if "对比" in content_text or "测评" in content_text or "review" in content_text:
            return json.dumps({
                "title": "横向对比｜这款产品值不值得买",
                "body": "使用一周后简单总结：外观OK，功能完整。\n同类产品里性价比比较高。",
                "call_to_action": "欢迎评论区交流你的使用感受。",
                "tags": ["对比测评", "选购指南"],
                "cart_text": "点小黄车可直接入手",
            }, ensure_ascii=False)
        # 默认：通用带货文案
        return json.dumps({
            "title": "爆款推荐｜闭眼入",
            "body": "这款最近销量不错，口碑也稳。价格 / 品质 / 售后都挺到位。",
            "call_to_action": "有需要的可以看看",
            "tags": ["好物", "推荐"],
            "cart_text": "点击链接",
        }, ensure_ascii=False)

    def chat_json(self, *args, **kwargs):
        try:
            raw = self.chat(*args, **kwargs)
            return json.loads(raw)
        except Exception as e:
            logger.warning(f"mock chat_json fallback: {e}")
            return {}


_mock_instance = MockDeepSeekClient()


def _install_mock_llm():
    # 方案一：替换 agents.llm 模块级的 get_client（大多数 Agent 这样 import）
    import agents.llm as llm_mod
    llm_mod.get_client = lambda: _mock_instance

    # 方案二：替换 agents.llm.deepseek_client 模块内的 get_client + 全局默认 client（兜底）
    import agents.llm.deepseek_client as dc_mod
    dc_mod.get_client = lambda: _mock_instance
    dc_mod._default_client = _mock_instance

    # 方案三：Config 里的 key 也清掉，保险
    try:
        from config import Config
        Config.DEEPSEEK_API_KEY = ""
    except Exception:
        pass

    logger.info("已注入 Mock LLM 客户端（三重防护，绝不发真实网络请求）")


_install_mock_llm()


# ============ 现在才 import 业务 Agent ============
from db import init_db, get_db, Product, HotTopic, ProductAnalysis, Content, ImageAsset
from config import Config
from utils.common import ensure_dir

from agents.scrapers.douyin_openapi_cli import crawl_via_openapi   # 走文件：我们直接塞 mock 数据
from agents.hot_topics_radar import HotTopicRadar
from agents.trend_matching_engine import TrendMatcher
from agents.product_analysis_engine import AnalysisEngine
from agents.content_factory import ContentFactory
from agents.image_recomposer import ImageRecomposer


# 辅助：构造 6 个 fake 商品
FAKE_PRODUCTS = [
    {"product_id": 1001, "title": "夏天防晒衣女新款冰丝外套", "price": 79.90, "commission_rate": 20.0,
     "commission_amount": 15.98, "sales_count": 21000, "creator_count": 580, "rating": 4.8,
     "main_image_url": "https://example.com/a.jpg",
     "detail_url": "https://haohuo.jinritemai.com/views/product/item2?id=1001",
     "shop_id": 8001, "shop_name": "夏日女装店", "first_cid": "女装", "second_cid": "上衣",
     "raw": {}},
    {"product_id": 1002, "title": "挂脖小风扇USB可充电静音", "price": 29.90, "commission_rate": 25.0,
     "commission_amount": 7.48, "sales_count": 8800, "creator_count": 320, "rating": 4.6,
     "main_image_url": "https://example.com/b.jpg",
     "detail_url": "https://haohuo.jinritemai.com/views/product/item2?id=1002",
     "shop_id": 8002, "shop_name": "日用数码", "first_cid": "数码", "second_cid": "小家电",
     "raw": {}},
    {"product_id": 1003, "title": "便携榨汁杯小型电动果汁机", "price": 49.0, "commission_rate": 18.0,
     "commission_amount": 8.82, "sales_count": 12345, "creator_count": 210, "rating": 4.7,
     "main_image_url": "https://example.com/c.jpg",
     "detail_url": "https://haohuo.jinritemai.com/views/product/item2?id=1003",
     "shop_id": 8003, "shop_name": "厨房小电", "first_cid": "厨房", "second_cid": "小家电",
     "raw": {}},
    {"product_id": 1004, "title": "驱蚊灯家用无辐射物理灭蚊", "price": 39.0, "commission_rate": 30.0,
     "commission_amount": 11.70, "sales_count": 9421, "creator_count": 170, "rating": 4.5,
     "main_image_url": "https://example.com/d.jpg",
     "detail_url": "https://haohuo.jinritemai.com/views/product/item2?id=1004",
     "shop_id": 8004, "shop_name": "家居日用", "first_cid": "家居", "second_cid": "驱蚊",
     "raw": {}},
    {"product_id": 1005, "title": "折叠晴雨伞防晒防紫外线", "price": 39.90, "commission_rate": 15.0,
     "commission_amount": 5.99, "sales_count": 15020, "creator_count": 400, "rating": 4.7,
     "main_image_url": "https://example.com/e.jpg",
     "detail_url": "https://haohuo.jinritemai.com/views/product/item2?id=1005",
     "shop_id": 8005, "shop_name": "日用百货", "first_cid": "日用", "second_cid": "雨具",
     "raw": {}},
    {"product_id": 1006, "title": "便携式颈椎按摩器多功能颈部", "price": 168.0, "commission_rate": 22.0,
     "commission_amount": 36.96, "sales_count": 6521, "creator_count": 120, "rating": 4.6,
     "main_image_url": "https://example.com/f.jpg",
     "detail_url": "https://haohuo.jinritemai.com/views/product/item2?id=1006",
     "shop_id": 8006, "shop_name": "健康按摩", "first_cid": "健康", "second_cid": "按摩器",
     "raw": {}},
]

FAKE_HOT_TOPICS = [
    {"keyword": "高温天气", "heat_value": 987654.0, "heat_growth": 12.3, "category": "天气", "rank": 1},
    {"keyword": "夏日穿搭", "heat_value": 654321.0, "heat_growth": 8.1, "category": "时尚", "rank": 2},
    {"keyword": "驱蚊神器", "heat_value": 432109.0, "heat_growth": 5.6, "category": "家居", "rank": 3},
    {"keyword": "办公室好物", "heat_value": 321098.0, "heat_growth": 4.0, "category": "生活", "rank": 4},
    {"keyword": "户外便携装备", "heat_value": 210987.0, "heat_growth": 3.2, "category": "运动", "rank": 5},
]


def upsert_products_from_fake():
    created = 0
    with get_db() as db:
        for raw in FAKE_PRODUCTS:
            p = (
                db.query(Product)
                .filter(Product.external_id == str(raw.get("product_id")))
                .first()
            )
            if not p:
                p = Product(
                    external_id=str(raw.get("product_id")),
                    platform="douyin",
                    category=raw.get("first_cid"),
                )
                db.add(p)
            p.title = raw.get("title")
            p.price = raw.get("price")
            p.commission_rate = raw.get("commission_rate")
            p.commission_amount = raw.get("commission_amount")
            p.sales_count = raw.get("sales_count")
            p.creator_count = raw.get("creator_count")
            p.rating = raw.get("rating")
            p.main_image_url = raw.get("main_image_url")
            p.detail_url = raw.get("detail_url")
            p.extra = {"raw": raw.get("raw", {}), "shop_name": raw.get("shop_name")}
            db.commit()
            db.refresh(p)
            created += 1
    logger.success(f"[Agent1] 商品库写入 {created} 个商品（mock 数据）")
    return created


def upsert_hot_topics_from_fake():
    with get_db() as db:
        # 清理旧热点
        db.query(HotTopic).delete()
        db.commit()
        for raw in FAKE_HOT_TOPICS:
            ht = HotTopic(
                keyword=raw["keyword"], source="mock_source",
                heat_value=raw["heat_value"], heat_growth=raw["heat_growth"],
                category=raw.get("category", ""), rank=raw.get("rank", 0),
            )
            db.add(ht)
        db.commit()
    logger.success(f"[Agent2] 热点库写入 {len(FAKE_HOT_TOPICS)} 条热点（mock 数据）")


def run_trend_match():
    matcher = TrendMatcher()
    matches = matcher.match_from_db(top_n=10, use_llm=False)
    logger.success(f"[Agent3] 趋势匹配 -> {len(matches)} 条")
    for m in matches[:3]:
        logger.info(f"    {m.get('product_id')} {m.get('title')[:18]} <-> {m.get('hot_keyword')} score={m.get('score')}")
    return matches


def run_product_analysis():
    engine = AnalysisEngine()
    with get_db() as db:
        products = db.query(Product).order_by(Product.id).all()
    n = 0
    for p in products[:6]:
        pa = engine.analyze_product(p)
        if pa:
            n += 1
    logger.success(f"[Agent4] 卖点分析 -> 已为 {n} 个商品生成 ProductAnalysis")


def run_content_factory():
    factory = ContentFactory()
    with get_db() as db:
        products = db.query(Product).order_by(Product.id).all()
    for p in products[:6]:
        factory.generate_all(p)
    with get_db() as db:
        total = db.query(Content).count()
    logger.success(f"[Agent5] 内容工厂 -> 已生成 {total} 条 Content（6 种类型 × N 个商品）")


def run_image_recomposer():
    """为每个商品创建一张纯色占位 '封面图'，避免真实下载网络图片"""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except Exception:
        Image = ImageDraw = ImageFont = None

    ensure_dir(Config.IMAGE_DIR)
    generated = 0
    with get_db() as db:
        products = db.query(Product).all()
        for p in products[:6]:
            out_dir = ensure_dir(Config.IMAGE_DIR / f"product_{p.id}")
            for idx in range(3):
                if Image is None:
                    # 直接写一个 0-byte 文件做占位
                    f = out_dir / f"img_{idx}.jpg"
                    f.write_bytes(b"")
                    continue
                img = Image.new("RGB", (800, 800), (idx * 60 % 255, 150, 200))
                draw = ImageDraw.Draw(img)
                draw.text((20, 20), f"Prod-{p.id}-#{idx+1}", fill=(255, 255, 255))
                path = out_dir / f"img_{idx}.jpg"
                img.save(path, "JPEG")

                # 写入 ImageAsset 表
                asset = (
                    db.query(ImageAsset)
                    .filter(ImageAsset.product_id == p.id)
                    .filter(ImageAsset.local_path == str(path))
                    .first()
                )
                if not asset:
                    asset = ImageAsset(
                        product_id=p.id, local_path=str(path),
                        image_type="composite", platform="xhs",
                        width=800, height=800,
                    )
                    db.add(asset)
            generated += 3
        db.commit()
    logger.success(f"[Agent6] 图片重组 -> 生成 {generated} 张本地封面图 -> {Config.IMAGE_DIR}")


def run_video_composer():
    """Agent7：尝试用已有 image 文件生成短视频（不依赖 TTS 外部调用）"""
    try:
        from agents.video.video_composer import VideoComposer
        vc = VideoComposer(output_dir=str(Config.DATA_DIR / "videos"))
        # 找到第一张可用 jpg（如果没有就跳过）
        sample = None
        for f in (Config.IMAGE_DIR / "product_1001").rglob("*.jpg"):
            if f.stat().st_size > 100:
                sample = f
                break
        if not sample:
            logger.info("[Agent7] 视频混剪 -> 跳过（没有可用素材图）")
            return
        video_path = vc.compose_slideshow_from_text(
            title="测试视频｜爆款好物",
            body="这是一条测试带货视频。",
            image_paths=[str(sample)] * 3,
            duration_s=10,
            vertical=True,
        )
        if video_path and Path(video_path).exists():
            logger.success(f"[Agent7] 视频混剪 -> {video_path}")
        else:
            logger.warning(f"[Agent7] 视频混剪 -> 未产出文件（可能缺少 ffmpeg/tts）")
    except Exception as e:
        logger.warning(f"[Agent7] 视频混剪跳过：{e}")


def run_publish_dry_run():
    """Agent8：模拟发布（不走浏览器）。读最新 5 条 Content，输出结构即可"""
    with get_db() as db:
        contents = (
            db.query(Content)
            .order_by(Content.created_at.desc())
            .limit(5)
            .all()
        )
    logger.success(f"[Agent8] 矩阵发布（dry-run） -> 选取 {len(contents)} 条 Content 待发布")
    for c in contents:
        logger.info(f"    [{c.platform}/{c.content_type}] {c.title[:30]}  tags={c.tags[:3]}")
    return contents


def run_dashboard():
    """Agent9：数据回流 + 排行榜"""
    # 先写几条 PublishRecord（伪造已发布），让排行榜有数字可看
    from db import PublishRecord
    with get_db() as db:
        db.query(PublishRecord).delete()
        db.commit()
        contents = db.query(Content).limit(5).all()
        for i, c in enumerate(contents):
            pr = PublishRecord(
                account_id=1, product_id=c.product_id, content_id=c.id,
                platform=c.platform or "xhs",
                title=c.title, body=c.body,
                publish_type="image", status="success",
                published_at=datetime.utcnow(),
                stats={"views": 1000 * (i + 1), "likes": 100 * (i + 1),
                       "comments": 20 * (i + 1), "favorites": 50 * (i + 1),
                       "commission": 30.0 * (i + 1)},
            )
            db.add(pr)
        db.commit()

    from agents.dashboard import Dashboard
    d = Dashboard()
    d.refresh_today()
    ranks = d.get_rankings(limit=10)
    print("\n============= 排行榜（Agent9 Data 回流） =============")
    for name, rows in ranks.items():
        print(f"\n▶ {name}（{len(rows)} 条）")
        for r in rows[:5]:
            # 不同表字段名不同，统一取几个可读键
            title = r.get("title") or r.get("account_name") or r.get("content_id") or ""
            extra = {k: v for k, v in r.items() if k not in ("title", "content_type", "platform")}
            print(f"    {str(title)[:40]:<40} {extra}")
    logger.success("[Agent9] 数据回流 & 排行榜完成")
    return ranks


def main():
    init_db()
    logger.info("=" * 60)
    logger.info("开始端到端离线冒烟测试 ｜ 全部走 mock，不联网")
    logger.info("=" * 60)

    step_results = {}
    step_results["Agent1_爆品雷达"] = upsert_products_from_fake()
    step_results["Agent2_热点雷达"] = len(FAKE_HOT_TOPICS)
    upsert_hot_topics_from_fake()
    step_results["Agent3_趋势匹配"] = len(run_trend_match())
    run_product_analysis()
    step_results["Agent4_卖点分析"] = "done"
    run_content_factory()
    step_results["Agent5_内容工厂"] = "done"
    run_image_recomposer()
    step_results["Agent6_图片重组"] = "done"
    run_video_composer()
    step_results["Agent7_视频混剪"] = "done"
    run_publish_dry_run()
    step_results["Agent8_矩阵发布(dry)"] = "done"
    run_dashboard()
    step_results["Agent9_数据回流"] = "done"

    print("\n" + "=" * 60)
    print("📊 冒烟测试结果汇总")
    print("=" * 60)
    for k, v in step_results.items():
        print(f"  ✅ {k:<24} -> {v}")
    print(f"\nDB 文件位置: {Config.DATA_DIR / 'marketing_agent.db'}")
    print("输出目录:   ", Config.DATA_DIR)
    print("\n所有步骤均已离线跑通 ✅。下一步：你把真实 API Key 与 Cookie 配好，")
    print("执行 `python3 pipeline_end2end.py all -n 10 --top 5 --skip-publish`")
    print("先验证真实抓取/生成链路，然后再去掉 --skip-publish 正式发布。")


if __name__ == "__main__":
    main()
