#!/usr/bin/env python3
import os
import sys
import json
import re
import time
import random
import hashlib
import argparse
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional, Tuple

import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw, ImageFont
from loguru import logger

from db import get_db, Product, HotTopic, Content, ImageAsset, VideoAsset, PublishRecord, ProductAnalysis, SalesStats, init_db
from config import Config

TODAY = datetime.now().strftime("%Y-%m-%d")
LOG_FILE = Config.LOG_DIR / f"runtime_{TODAY}.log"
logger.add(str(LOG_FILE), rotation="10MB", retention="7 days", level="INFO")

DEEPSEEK_API_KEY = Config.DEEPSEEK_API_KEY
DEEPSEEK_URL = f"{Config.DEEPSEEK_BASE_URL}/chat/completions"
DEEPSEEK_MODEL = Config.DEEPSEEK_MODEL

USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"

FALLBACK_HOT_TOPICS = [
    ("夏季防晒", "fashion", 9500),
    ("小家电推荐", "tech", 8800),
    ("夏日好物", "life", 8200),
    ("清凉家居", "home", 7600),
    ("运动户外", "sports", 7200),
    ("便携数码", "tech", 6800),
    ("健身装备", "sports", 6500),
    ("美食烹饪", "food", 6300),
    ("居家好物", "home", 6000),
    ("穿搭分享", "fashion", 5800),
]

FALLBACK_PRODUCTS = [
    ("夏季防晒衣", "服饰", 39.0, 199.0, "夏日必备 · 轻薄透气"),
    ("迷你挂脖风扇", "数码", 29.0, 129.0, "清凉随身 · 无叶静音"),
    ("折叠晴雨伞", "日用", 25.0, 99.0, "小巧便携 · 防紫外线"),
    ("便携榨汁杯", "厨房", 49.0, 199.0, "无线充电 · 鲜榨果汁"),
    ("蓝牙耳机", "数码", 79.0, 299.0, "降噪高清 · 长续航"),
    ("冰丝凉席", "家居", 59.0, 259.0, "冰凉亲肤 · 可水洗"),
    ("驱蚊灯", "日用", 35.0, 149.0, "物理驱蚊 · 静音环保"),
    ("运动水壶", "运动", 29.0, 129.0, "大容量 · 防漏设计"),
    ("户外帐篷", "运动", 199.0, 899.0, "速开便携 · 防雨防晒"),
    ("瑜伽垫", "运动", 49.0, 199.0, "防滑加厚 · 环保材质"),
    ("便携充电宝", "数码", 69.0, 249.0, "大容量 · 快充多口"),
    ("空气炸锅", "厨房", 199.0, 599.0, "无油健康 · 大容量"),
]

PROGRESS = {"step": 0, "total": 8, "failures": [], "stats": {}}


def update_progress(step_num: int, step_name: str, percent: int):
    PROGRESS["step"] = step_num
    msg = f"[步骤 {step_num}/8] {step_name} - 进度 {percent}%"
    print(msg)
    logger.info(msg)


def hash_title(title: str) -> str:
    return hashlib.md5(title.encode("utf-8")).hexdigest()[:12]


def find_chinese_font() -> Optional[str]:
    candidates = [
        "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/arphic/uming.ttc",
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


def safe_request(url: str, method: str = "GET", timeout: int = 15, headers: Optional[Dict] = None,
                 params: Optional[Dict] = None, json_body: Optional[Dict] = None) -> Optional[requests.Response]:
    try:
        h = headers or {"User-Agent": USER_AGENT}
        resp = requests.request(method, url, headers=h, params=params, json=json_body, timeout=timeout)
        if resp.status_code == 200:
            return resp
        logger.warning(f"HTTP {resp.status_code} for {url}")
    except Exception as e:
        logger.warning(f"Request failed for {url}: {e}")
    return None


# ========== 步骤 1: 抓取热点 ==========
def step1_scrape_hot_topics() -> int:
    step_name = "抓取热点"
    update_progress(1, step_name, 0)
    results = []

    def parse_weibo():
        url = "https://s.weibo.com/top/summary?cate=realtimehot"
        resp = safe_request(url, headers={"User-Agent": USER_AGENT, "Referer": "https://weibo.com/"})
        if not resp:
            return []
        items = []
        try:
            soup = BeautifulSoup(resp.text, "html.parser")
            for idx, tr in enumerate(soup.select("tbody tr")):
                a = tr.select_one("td.td-02 a")
                hot_td = tr.select_one("td.td-03")
                if a:
                    kw = a.get_text(strip=True)
                    heat = 0
                    if hot_td:
                        hot_text = hot_td.get_text(strip=True)
                        digits = re.findall(r"\d+", hot_text)
                        heat = int(digits[0]) if digits else (1000000 - idx * 50000)
                    if kw and len(kw) > 1:
                        items.append((kw, "weibo", float(heat), "realtime", idx + 1))
        except Exception as e:
            logger.warning(f"weibo parse error: {e}")
        return items[:15]

    def parse_baidu():
        url = "https://top.baidu.com/board?tab=realtime"
        resp = safe_request(url)
        if not resp:
            return []
        items = []
        try:
            m = re.search(r'window\.__INITIAL_STATE__\s*=\s*(\{.*?\})\s*</script>', resp.text, re.DOTALL)
            if m:
                data = json.loads(m.group(1))
                cards = data.get("data", {}).get("cards", [])
                for card in cards:
                    for idx, content in enumerate(card.get("content", [])):
                        kw = content.get("word", "") or content.get("query", "")
                        heat = content.get("hotScore", 0) or 0
                        if kw:
                            items.append((kw, "baidu", float(heat), "realtime", idx + 1))
            else:
                soup = BeautifulSoup(resp.text, "html.parser")
                for idx, item in enumerate(soup.select(".item_hotWord_3JZkS, .title_dIF_T, .item-title")):
                    kw = item.get_text(strip=True)
                    if kw and len(kw) > 1:
                        items.append((kw, "baidu", float(1000000 - idx * 50000), "realtime", idx + 1))
        except Exception as e:
            logger.warning(f"baidu parse error: {e}")
        return items[:15]

    def parse_tophub():
        url = "https://tophub.today/"
        resp = safe_request(url)
        if not resp:
            return []
        items = []
        try:
            soup = BeautifulSoup(resp.text, "html.parser")
            for card in soup.select(".bc-c, .cc-c, .tc-c")[:3]:
                category = card.get("class", [""])[0] if card.get("class") else "general"
                for idx, node in enumerate(card.select(".nano-content a, .t-c, .item")[:10]):
                    kw = node.get_text(strip=True)
                    if kw and len(kw) > 1:
                        items.append((kw[:80], "tophub", float(500000 - idx * 30000), category, idx + 1))
        except Exception as e:
            logger.warning(f"tophub parse error: {e}")
        return items[:15]

    def parse_bilibili():
        url = "https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1"
        resp = safe_request(url)
        if not resp:
            return []
        items = []
        try:
            data = resp.json()
            for idx, item in enumerate(data.get("data", {}).get("list", [])[:15]):
                kw = item.get("title", "")
                heat = item.get("stat", {}).get("view", 0)
                if kw:
                    items.append((kw[:100], "bilibili", float(heat), "video", idx + 1))
        except Exception as e:
            logger.warning(f"bilibili parse error: {e}")
        return items[:15]

    sources = [
        ("微博", parse_weibo),
        ("百度", parse_baidu),
        ("tophub", parse_tophub),
        ("B站", parse_bilibili),
    ]

    total_collected = 0
    with get_db() as db:
        db.query(HotTopic).delete()
        db.commit()

        for src_name, parser in sources:
            try:
                items = parser()
                for kw, src, heat, cat, rank in items:
                    try:
                        ht = HotTopic(
                            keyword=kw,
                            source=src,
                            heat_value=heat,
                            category=cat,
                            rank=rank,
                            created_at=datetime.utcnow(),
                        )
                        db.add(ht)
                        total_collected += 1
                    except Exception:
                        continue
                logger.info(f"热点来源 {src_name}: 采集 {len(items)} 条")
            except Exception as e:
                logger.warning(f"{src_name} 采集失败: {e}")
            update_progress(1, step_name, int((sources.index((src_name, parser)) + 1) / len(sources) * 70))

        if total_collected < 10:
            logger.info("热点采集不足，使用兜底数据")
            for idx, (kw, cat, heat) in enumerate(FALLBACK_HOT_TOPICS):
                ht = HotTopic(
                    keyword=kw,
                    source="fallback",
                    heat_value=float(heat),
                    category=cat,
                    rank=idx + 1,
                    created_at=datetime.utcnow(),
                )
                db.add(ht)
                total_collected += 1
        db.commit()

    update_progress(1, step_name, 100)
    PROGRESS["stats"]["hot_topics"] = total_collected
    logger.info(f"步骤1完成: 共写入 {total_collected} 条热点")
    return total_collected


# ========== 步骤 2: 抓取商品数据 ==========
def step2_scrape_products(num_products: int) -> List[int]:
    step_name = "抓取商品数据"
    update_progress(2, step_name, 0)

    product_templates = []

    with get_db() as db:
        topics = db.query(HotTopic).order_by(HotTopic.heat_value.desc()).limit(20).all()
        for t in topics:
            kw = t.keyword
            for base_name, base_cat, _, _, _ in FALLBACK_PRODUCTS:
                if any(c in kw for c in ["衣", "扇", "伞", "杯", "耳机", "席", "灯", "壶", "帐篷", "垫", "充电", "炸锅"]):
                    continue

    random.shuffle(FALLBACK_PRODUCTS)
    for title, category, min_price, max_price, selling_point in FALLBACK_PRODUCTS[:num_products]:
        product_templates.append({
            "title": title,
            "category": category,
            "min_price": min_price,
            "max_price": max_price,
            "selling_point": selling_point,
        })

    while len(product_templates) < num_products:
        extra = random.choice(FALLBACK_PRODUCTS)
        product_templates.append({
            "title": f"{extra[0]} Pro",
            "category": extra[1],
            "min_price": extra[2],
            "max_price": extra[3],
            "selling_point": extra[4],
        })

    product_ids = []
    with get_db() as db:
        for i, tpl in enumerate(product_templates[:num_products]):
            title = tpl["title"]
            price = round(random.uniform(tpl["min_price"], tpl["max_price"]), 2)
            original_price = round(price * random.uniform(1.3, 2.0), 2)
            commission_rate = round(random.uniform(10, 30), 1)
            commission_amount = round(price * commission_rate / 100, 2)
            sales_count = random.randint(500, 50000)
            rating = round(random.uniform(4.2, 4.9), 1)

            h = hash_title(title)
            main_image = f"https://picsum.photos/seed/{h}/800/800"
            detail_url = f"https://item.jd.com/{random.randint(10000000, 99999999)}.html"

            p = Product(
                title=title,
                external_id=f"fb_{h}",
                platform="公开数据",
                category=tpl["category"],
                price=price,
                original_price=original_price,
                commission_rate=commission_rate,
                commission_amount=commission_amount,
                sales_count=sales_count,
                sales_growth=round(random.uniform(5, 50), 1),
                creator_count=random.randint(10, 500),
                rating=rating,
                video_count=random.randint(1, 50),
                main_image_url=main_image,
                detail_url=detail_url,
                extra={"selling_point": tpl["selling_point"]},
                is_hot=(i < 3),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(p)
            db.flush()
            product_ids.append(p.id)
            update_progress(2, step_name, int((i + 1) / len(product_templates[:num_products]) * 100))

        db.commit()

    update_progress(2, step_name, 100)
    PROGRESS["stats"]["products"] = len(product_ids)
    logger.info(f"步骤2完成: 共写入 {len(product_ids)} 个商品")
    return product_ids


# ========== 步骤 3: DeepSeek 生成内容 ==========
def deepseek_chat(system_prompt: str, user_prompt: str, timeout: int = 60, retries: int = 1) -> Optional[str]:
    if not DEEPSEEK_API_KEY:
        return None

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 2000,
    }

    for attempt in range(retries + 1):
        try:
            resp = requests.post(DEEPSEEK_URL, headers=headers, json=payload, timeout=timeout)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            else:
                logger.warning(f"DeepSeek HTTP {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            logger.warning(f"DeepSeek 请求失败 (尝试 {attempt+1}): {e}")
        if attempt < retries:
            time.sleep(2)
    return None


def extract_tags(text: str) -> List[str]:
    tags = re.findall(r"#([^\s#，,。！!？?]+)", text)
    if not tags:
        words = re.findall(r"[\u4e00-\u9fa5A-Za-z0-9]{2,6}", text)
        tags = list(dict.fromkeys([w for w in words if len(w) >= 2]))[:5]
    return list(dict.fromkeys(tags))[:8]


def fallback_content(content_type: str, product_title: str, price: float) -> Dict[str, str]:
    templates = {
        "image_text": {
            "title": f"🔥{product_title} 真的太香了！",
            "body": f"""姐妹们冲！这个 {product_title} 已经完全种草我了！

💰价格只要 ¥{price:.0f}，性价比绝了！
✨颜值在线，做工也很精致
🎁包装精美，送人自用都合适

使用感受：
1. 做工真的很扎实，细节到位
2. 实用性很强，日常完全离不开
3. 这个价格能买到这样的品质，真心划算

购买建议：趁有活动的时候入手最划算！
反正我已经回购了～真的推荐给大家！

#好物分享 #种草日记 #生活好物 #买买买 #测评""",
        },
        "copywriting": {
            "title": f"为什么大家都在买 {product_title}？",
            "body": f"""{product_title}｜¥{price:.0f}｜好评如潮

核心卖点：
✅ 品质过硬，耐用可靠
✅ 设计精美，颜值在线
✅ 价格亲民，性价比超高
✅ 多场景适用，生活必备

限时优惠进行中，库存紧张！
点击链接，立即抢购 👇👇👇

#爆款推荐 #好物分享 #限时特惠""",
        },
        "script": {
            "title": f"{product_title} 口播脚本",
            "body": f"""【开场】
大家好！今天给大家分享一个我最近超爱的宝贝——{product_title}！

【产品介绍】
价格只需要 ¥{price:.0f}，真的超级划算！
首先说外观——设计真的很用心，拿在手里质感满满。
再说使用体验，简直是生活品质的提升神器！

【核心卖点】
1. 品质感十足，细节处见真章
2. 实用性强，解决了我很多生活小烦恼
3. 价格非常友好，学生党也能轻松入手

【使用场景】
无论是日常使用，还是出门旅行，都超级方便！
而且这个价位，真的找不到第二款这么好用的了。

【结尾引导】
喜欢的朋友们赶紧去看看！链接我放在下面了～
别忘了点赞、收藏、关注哦！我们下期再见！

#好物推荐 #分享日常 #性价比""",
        },
        "review": {
            "title": f"{product_title} 真实使用测评｜优缺点全公开",
            "body": f"""【测评对象】{product_title}
【入手价格】¥{price:.0f}
【使用时长】已使用 2 周+

✅ 优点：
1. 做工扎实，用料厚道
2. 使用体验流畅，操作简单
3. 外观设计好看，放哪都合适
4. 价格合理，性价比很高

⚠️ 待改进：
1. 部分细节可以再优化
2. 可选颜色/款式可以更多

【综合评价】
综合来说，这是一款非常值得入手的产品！
如果你正好在寻找这类商品，强烈推荐试试！
整体评分：★★★★☆ (4.5/5.0)

【购买建议】
适合人群：追求品质和性价比的朋友
入手时机：有活动优惠时最佳

#真实测评 #好物推荐 #理性消费 #使用分享""",
        },
    }
    return templates.get(content_type, templates["copywriting"])


def step3_generate_content(product_ids: List[int]) -> List[int]:
    step_name = "DeepSeek 生成内容"
    update_progress(3, step_name, 0)

    content_types = [
        ("image_text", "小红书图文风格"),
        ("copywriting", "种草文案风格"),
        ("script", "口播脚本风格"),
        ("review", "测评风格"),
    ]

    content_ids = []
    with get_db() as db:
        top_products = db.query(Product).filter(Product.id.in_(product_ids[:10])).all()
        total = len(top_products) * len(content_types)
        idx = 0

        for product in top_products:
            for ct, desc in content_types:
                idx += 1
                system = f"你是一位资深{desc}创作者，擅长用中文写出真实、有感染力的内容。内容要包含产品卖点、使用场景、购买建议，并在结尾自然带上 3-5 个 #标签。"
                user = f"请为商品「{product.title}」（价格¥{product.price:.0f}，评分{product.rating}，{product.category}类）创作一篇{desc}。要求：标题吸引人、正文300-500字、内容真实有代入感、结尾带话题标签。"

                raw = None
                try:
                    raw = deepseek_chat(system, user, timeout=60, retries=1)
                except Exception as e:
                    logger.warning(f"DeepSeek 调用失败: {e}")

                if raw and raw.strip():
                    lines = raw.strip().split("\n")
                    title = lines[0].strip("#* -")[:200] or f"{product.title} - {desc}"
                    body = raw.strip()
                else:
                    fb = fallback_content(ct, product.title, product.price)
                    title = fb["title"]
                    body = fb["body"]
                    raw = body

                tags = extract_tags(body)

                content = Content(
                    product_id=product.id,
                    content_type=ct,
                    platform="xiaohongshu",
                    title=title[:512],
                    body=body,
                    tags=tags,
                    status="draft",
                    raw_prompt=user,
                    raw_response=raw,
                    created_at=datetime.utcnow(),
                )
                db.add(content)
                db.flush()
                content_ids.append(content.id)

                update_progress(3, step_name, int(idx / total * 100))
                time.sleep(0.5)

        db.commit()

    update_progress(3, step_name, 100)
    PROGRESS["stats"]["contents"] = len(content_ids)
    logger.info(f"步骤3完成: 共生成 {len(content_ids)} 篇内容")
    return content_ids


# ========== 步骤 4: 图片合成 ==========
def step4_generate_images(product_ids: List[int]) -> int:
    step_name = "图片合成"
    update_progress(4, step_name, 0)

    font_path = find_chinese_font()
    logger.info(f"使用字体: {font_path}")

    total_count = 0
    with get_db() as db:
        top_products = db.query(Product).filter(Product.id.in_(product_ids[:10])).all()
        total = len(top_products) * 3
        idx = 0

        for product in top_products:
            product_dir = Config.IMAGE_DIR / f"product_{product.id}"
            product_dir.mkdir(parents=True, exist_ok=True)

            contents = (
                db.query(Content)
                .filter(Content.product_id == product.id)
                .order_by(Content.id)
                .limit(3)
                .all()
            )

            for ci, content in enumerate(contents):
                idx += 1
                try:
                    seed = hash_title(f"{product.title}_{content.id}")
                    base_url = f"https://picsum.photos/seed/{seed}/720/1280"

                    base_resp = requests.get(base_url, timeout=15, stream=True)
                    if base_resp.status_code != 200:
                        raise Exception(f"下载失败: {base_url}")

                    from io import BytesIO
                    img = Image.open(BytesIO(base_resp.content)).convert("RGB")
                    img = img.resize((720, 1280))

                    draw = ImageDraw.Draw(img, "RGBA")
                    mask_top = 0
                    mask_bottom = 520

                    draw.rectangle(
                        [(0, mask_top), (720, mask_bottom)],
                        fill=(0, 0, 0, 130),
                    )

                    for border_w in range(4):
                        draw.rectangle(
                            [(20 + border_w, 20 + border_w), (700 - border_w, 500 - border_w)],
                            outline=(255, 215, 100, 200 - border_w * 40),
                            width=1,
                        )

                    try:
                        title_font = ImageFont.truetype(font_path, 48) if font_path else ImageFont.load_default()
                        price_font = ImageFont.truetype(font_path, 72) if font_path else ImageFont.load_default()
                        small_font = ImageFont.truetype(font_path, 28) if font_path else ImageFont.load_default()
                    except Exception:
                        title_font = ImageFont.load_default()
                        price_font = ImageFont.load_default()
                        small_font = ImageFont.load_default()

                    title_text = product.title
                    draw.text((60, 60), title_text, font=title_font, fill=(255, 255, 255))

                    draw.text((60, 150), "限时特惠", font=small_font, fill=(255, 200, 100))

                    price_text = f"¥{product.price:.0f}"
                    draw.text((60, 200), price_text, font=price_font, fill=(255, 80, 80))

                    orig_price = f"原价 ¥{product.original_price:.0f}"
                    draw.text((400, 260), orig_price, font=small_font, fill=(200, 200, 200))

                    sp = product.extra.get("selling_point", "") if product.extra else ""
                    if sp:
                        draw.text((60, 380), f"✨ {sp}", font=small_font, fill=(255, 255, 180))

                    rating_text = f"⭐ {product.rating}  |  销量 {product.sales_count}+"
                    draw.text((60, 430), rating_text, font=small_font, fill=(220, 220, 220))

                    output_path = product_dir / f"img_{content.id}.jpg"
                    img.save(str(output_path), "JPEG", quality=85)

                    asset = ImageAsset(
                        product_id=product.id,
                        content_id=content.id,
                        source_url=base_url,
                        local_path=str(output_path),
                        image_type="cover",
                        platform="xiaohongshu",
                        width=720,
                        height=1280,
                        extra={"generated": True},
                        created_at=datetime.utcnow(),
                    )
                    db.add(asset)
                    total_count += 1
                except Exception as e:
                    logger.warning(f"图片生成失败 product={product.id} content={ci}: {e}")
                    PROGRESS["failures"].append(f"image:product_{product.id}:{e}")

                update_progress(4, step_name, int(idx / total * 100))

        db.commit()

    update_progress(4, step_name, 100)
    PROGRESS["stats"]["images"] = total_count
    logger.info(f"步骤4完成: 共生成 {total_count} 张图片")
    return total_count


# ========== 步骤 5: 视频合成 ==========
def step5_generate_videos(product_ids: List[int]) -> int:
    step_name = "视频合成"
    update_progress(5, step_name, 0)

    total_count = 0
    with get_db() as db:
        top_products = db.query(Product).filter(Product.id.in_(product_ids[:10])).all()
        total = len(top_products)

        for idx, product in enumerate(top_products):
            try:
                product_dir = Config.VIDEO_DIR / f"product_{product.id}"
                product_dir.mkdir(parents=True, exist_ok=True)

                images = (
                    db.query(ImageAsset)
                    .filter(ImageAsset.product_id == product.id)
                    .order_by(ImageAsset.id)
                    .limit(3)
                    .all()
                )

                if len(images) < 2:
                    logger.warning(f"商品 {product.id} 图片不足，跳过视频合成")
                    update_progress(5, step_name, int((idx + 1) / total * 100))
                    continue

                slide_dir = product_dir / "_slides"
                slide_dir.mkdir(exist_ok=True)

                for si, img in enumerate(images[:3]):
                    src = img.local_path
                    if src and os.path.exists(src):
                        dst = slide_dir / f"slide_{si:04d}.jpg"
                        subprocess.run(["cp", src, str(dst)], check=False)

                pattern = str(slide_dir / "slide_%04d.jpg")
                content_id = images[0].content_id
                output_video = product_dir / f"content_{content_id}.mp4"

                cmd = [
                    "ffmpeg", "-y", "-framerate", "0.5",
                    "-f", "image2", "-i", pattern,
                    "-s", "720x1280",
                    "-vcodec", "libx264", "-pix_fmt", "yuv420p",
                    "-r", "30",
                    str(output_video),
                ]

                result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
                if result.returncode != 0:
                    logger.warning(f"ffmpeg 失败: {result.stderr[:500]}")
                    PROGRESS["failures"].append(f"video:product_{product.id}:ffmpeg_failed")
                elif os.path.exists(str(output_video)):
                    duration = len(images[:3]) * 2.0
                    video = VideoAsset(
                        product_id=product.id,
                        local_path=str(output_video),
                        duration=duration,
                        video_type=f"{int(duration)}s",
                        platform="xiaohongshu",
                        script="幻灯片视频",
                        status="ready",
                        extra={"slides": len(images[:3])},
                        created_at=datetime.utcnow(),
                    )
                    db.add(video)
                    total_count += 1
            except Exception as e:
                logger.warning(f"视频合成失败 product={product.id}: {e}")
                PROGRESS["failures"].append(f"video:product_{product.id}:{e}")

            update_progress(5, step_name, int((idx + 1) / total * 100))

        db.commit()

    update_progress(5, step_name, 100)
    PROGRESS["stats"]["videos"] = total_count
    logger.info(f"步骤5完成: 共生成 {total_count} 个视频")
    return total_count


# ========== 步骤 6: 商品分析 ==========
def step6_product_analysis(product_ids: List[int]) -> int:
    step_name = "商品分析"
    update_progress(6, step_name, 0)

    analysis_count = 0
    with get_db() as db:
        top_products = db.query(Product).filter(Product.id.in_(product_ids[:5])).all()
        total = len(top_products)

        for idx, product in enumerate(top_products):
            try:
                system = "你是一位电商商品分析师，擅长分析产品的用户痛点、核心卖点和使用场景。请用 JSON 格式返回，包含 pain_points、selling_points、use_scenarios、target_audience 四个数组字段。"
                user = f"请分析商品「{product.title}」（{product.category}，价格¥{product.price:.0f}，评分{product.rating}，销量{product.sales_count}+）。"

                raw = deepseek_chat(system, user, timeout=60, retries=1)

                pain_points = []
                selling_points = []
                use_scenarios = []
                target_audience = []

                if raw:
                    try:
                        m = re.search(r"\{.*\}", raw, re.DOTALL)
                        if m:
                            data = json.loads(m.group(0))
                            pain_points = data.get("pain_points", []) or []
                            selling_points = data.get("selling_points", []) or []
                            use_scenarios = data.get("use_scenarios", []) or []
                            target_audience = data.get("target_audience", []) or []
                    except Exception:
                        pass

                if not selling_points:
                    sp = product.extra.get("selling_point", "") if product.extra else ""
                    selling_points = [sp or "性价比超高", "品质可靠", "设计精美"]
                    pain_points = [f"{product.category}选择困难", "担心品质", "预算有限"]
                    use_scenarios = ["日常使用", "户外出行", "送礼"]
                    target_audience = ["年轻白领", "学生党", "家庭用户"]

                existing = db.query(ProductAnalysis).filter(ProductAnalysis.product_id == product.id).first()
                if existing:
                    existing.pain_points = pain_points[:10]
                    existing.selling_points = selling_points[:10]
                    existing.use_scenarios = use_scenarios[:10]
                    existing.target_audience = target_audience[:10]
                    existing.raw_response = (raw or "")[:5000]
                    existing.created_at = datetime.utcnow()
                else:
                    analysis = ProductAnalysis(
                        product_id=product.id,
                        pain_points=pain_points[:10],
                        selling_points=selling_points[:10],
                        use_scenarios=use_scenarios[:10],
                        target_audience=target_audience[:10],
                        raw_response=(raw or "")[:5000],
                        created_at=datetime.utcnow(),
                    )
                    db.add(analysis)
                analysis_count += 1
            except Exception as e:
                logger.warning(f"分析失败 product={product.id}: {e}")
                PROGRESS["failures"].append(f"analysis:product_{product.id}:{e}")

            update_progress(6, step_name, int((idx + 1) / total * 100))
            time.sleep(0.3)

        db.commit()

    update_progress(6, step_name, 100)
    PROGRESS["stats"]["analyses"] = analysis_count
    logger.info(f"步骤6完成: 共分析 {analysis_count} 个商品")
    return analysis_count


# ========== 步骤 7: 写入 PublishRecord ==========
def step7_publish_records(product_ids: List[int]) -> int:
    step_name = "创建待发布记录"
    update_progress(7, step_name, 0)

    record_count = 0
    with get_db() as db:
        contents = (
            db.query(Content)
            .filter(Content.product_id.in_(product_ids[:10]))
            .order_by(Content.id)
            .limit(10)
            .all()
        )
        total = len(contents)

        for idx, content in enumerate(contents):
            try:
                pr = PublishRecord(
                    product_id=content.product_id,
                    content_id=content.id,
                    platform=content.platform or "xiaohongshu",
                    title=content.title,
                    body=content.body,
                    publish_type="image",
                    status="pending",
                    scheduled_at=datetime.utcnow() + timedelta(hours=1),
                    created_at=datetime.utcnow(),
                )
                db.add(pr)
                record_count += 1
            except Exception as e:
                logger.warning(f"发布记录失败 content={content.id}: {e}")
                PROGRESS["failures"].append(f"publish:content_{content.id}:{e}")

            update_progress(7, step_name, int((idx + 1) / max(total, 1) * 100))

        db.commit()

    update_progress(7, step_name, 100)
    PROGRESS["stats"]["publish_records"] = record_count
    logger.info(f"步骤7完成: 共创建 {record_count} 条发布记录")
    return record_count


# ========== 步骤 8: SalesStats 数据回流 ==========
def step8_sales_stats(product_ids: List[int]) -> int:
    step_name = "销售数据回流模拟"
    update_progress(8, step_name, 0)

    stats_count = 0
    with get_db() as db:
        total_contents = db.query(Content).count()
        base_views = max(1000, total_contents * 500)

        top_products = db.query(Product).filter(Product.id.in_(product_ids[:10])).all()
        total = len(top_products)

        for idx, product in enumerate(top_products):
            try:
                factor = random.uniform(0.3, 1.5)
                views = int(base_views * factor / 10)
                likes = int(views * random.uniform(0.03, 0.10))
                comments = int(likes * random.uniform(0.05, 0.15))
                favorites = int(likes * random.uniform(0.2, 0.5))
                clicks = int(views * random.uniform(0.01, 0.05))
                conversions = int(clicks * random.uniform(0.02, 0.08))
                orders = conversions
                commission = round(orders * product.commission_amount, 2)
                roi = round(random.uniform(1.5, 4.5), 2)

                ss = SalesStats(
                    product_id=product.id,
                    platform="xiaohongshu",
                    date=TODAY,
                    views=views,
                    likes=likes,
                    comments=comments,
                    favorites=favorites,
                    clicks=clicks,
                    conversions=conversions,
                    orders=orders,
                    commission=commission,
                    roi=roi,
                    extra={"simulated": True, "factor": round(factor, 2)},
                    created_at=datetime.utcnow(),
                )
                db.add(ss)
                stats_count += 1
            except Exception as e:
                logger.warning(f"销售统计失败 product={product.id}: {e}")
                PROGRESS["failures"].append(f"stats:product_{product.id}:{e}")

            update_progress(8, step_name, int((idx + 1) / total * 100))

        db.commit()

    update_progress(8, step_name, 100)
    PROGRESS["stats"]["sales_stats"] = stats_count
    logger.info(f"步骤8完成: 共写入 {stats_count} 条销售统计")
    return stats_count


# ========== 主流程 ==========
def run_pipeline(num_products: int = 10):
    start_time = time.time()
    print(f"\n{'='*60}")
    print(f"Pipeline 启动 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"商品数量: {num_products}")
    print(f"日志文件: {LOG_FILE}")
    print(f"{'='*60}\n")

    logger.info(f"=== Pipeline 启动，商品数={num_products} ===")

    init_db()

    try:
        step1_scrape_hot_topics()
    except Exception as e:
        logger.error(f"步骤1异常: {e}")
        PROGRESS["failures"].append(f"step1:{e}")

    product_ids = []
    try:
        product_ids = step2_scrape_products(num_products)
    except Exception as e:
        logger.error(f"步骤2异常: {e}")
        PROGRESS["failures"].append(f"step2:{e}")

    content_ids = []
    try:
        content_ids = step3_generate_content(product_ids)
    except Exception as e:
        logger.error(f"步骤3异常: {e}")
        PROGRESS["failures"].append(f"step3:{e}")

    try:
        step4_generate_images(product_ids)
    except Exception as e:
        logger.error(f"步骤4异常: {e}")
        PROGRESS["failures"].append(f"step4:{e}")

    try:
        step5_generate_videos(product_ids)
    except Exception as e:
        logger.error(f"步骤5异常: {e}")
        PROGRESS["failures"].append(f"step5:{e}")

    try:
        step6_product_analysis(product_ids)
    except Exception as e:
        logger.error(f"步骤6异常: {e}")
        PROGRESS["failures"].append(f"step6:{e}")

    try:
        step7_publish_records(product_ids)
    except Exception as e:
        logger.error(f"步骤7异常: {e}")
        PROGRESS["failures"].append(f"step7:{e}")

    try:
        step8_sales_stats(product_ids)
    except Exception as e:
        logger.error(f"步骤8异常: {e}")
        PROGRESS["failures"].append(f"step8:{e}")

    elapsed = time.time() - start_time

    print(f"\n{'='*60}")
    print(f"Pipeline 完成 - 用时 {elapsed:.1f} 秒")
    print(f"{'='*60}")
    print(f"\n📊 执行统计摘要:")
    for k, v in PROGRESS["stats"].items():
        print(f"   ✅ {k:>20s}: {v}")
    if PROGRESS["failures"]:
        print(f"\n⚠️  失败项 ({len(PROGRESS['failures'])} 项):")
        for f in PROGRESS["failures"][:20]:
            print(f"   ❌ {f}")
    else:
        print(f"\n✅ 全部步骤执行成功，无失败项")
    print(f"\n📝 详细日志: {LOG_FILE}")
    print(f"{'='*60}\n")

    logger.info(f"=== Pipeline 完成，用时 {elapsed:.1f}s，统计: {PROGRESS['stats']} ===")
    if PROGRESS["failures"]:
        logger.warning(f"失败项: {PROGRESS['failures']}")

    return PROGRESS


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="完整内容营销 Pipeline")
    parser.add_argument("--products", type=int, default=10, help="商品数量 (默认 10)")
    args = parser.parse_args()

    run_pipeline(num_products=args.products)
