"""端到端流水线：抓巨量百应商品 → DeepSeek分析 → 生成小红书文案 + 图片 → 发布小红书

用法:
    # 1. 抓取商品
    python pipeline_end2end.py crawl -n 100

    # 2. 从 products.json 生成 N 条小红书内容
    python pipeline_end2end.py generate --json data/products.json --top 10

    # 3. 发布已生成的图文内容
    python pipeline_end2end.py publish --limit 5

    # 4. 一键全流程（首次使用需要扫码登录）
    python pipeline_end2end.py all -n 10 --top 5
"""
import json
import argparse
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

from loguru import logger

# 把项目根目录加到 Python 路径
sys.path.insert(0, str(Path(__file__).parent))

from config import Config
from db import init_db, get_db, Product, Content, ImageAsset
from agents.content_factory import ContentFactory
from agents.image_recomposer import ImageRecomposer
from agents.publishers.xiaohongshu import XiaohongshuPublisher
from agents.scrapers.juliang_baiying import run_crawl
from utils.common import ensure_dir

# ---------- Step 1: 抓取 ----------
def step_crawl(n: int, output: Optional[str] = None) -> Path:
    out = run_crawl(n=n, output_path=output)
    return out


# ---------- Step 2: 从 products.json 生成内容 + 图片 ----------
def _upsert_product(p: Dict[str, Any]) -> Product:
    """把 JSON 中的商品写入或找到 DB 中的 Product"""
    with get_db() as db:
        title = p.get("title") or ""
        detail = p.get("detail_url") or ""
        existing = None
        if detail:
            existing = db.query(Product).filter(Product.detail_url == detail).first()
        if not existing and title:
            existing = db.query(Product).filter(Product.title == title).first()
        if existing:
            return existing
        prod = Product(
            title=title[:500],
            platform=p.get("platform") or "douyin_juliang",
            category=p.get("category") or "",
            price=float(p.get("price") or 0),
            commission_rate=float(p.get("commission_rate") or 0),
            commission_amount=float(p.get("commission_amount") or 0),
            sales_count=int(p.get("sales_count") or 0),
            creator_count=int(p.get("creator_count") or 0),
            rating=float(p.get("rating") or 0),
            main_image_url=p.get("main_image_url") or "",
            detail_url=p.get("detail_url") or "",
            extra={"raw": p.get("raw")},
            is_hot=True,
        )
        db.add(prod)
        db.commit()
        db.refresh(prod)
        return prod


def step_generate(products_json_path: str, top_n: int = 10) -> List[Dict[str, Any]]:
    """读取 JSON，选前 top_n（按销量或佣金排序），生成文案+图文图片"""
    init_db()

    data = json.loads(Path(products_json_path).read_text(encoding="utf-8"))
    if isinstance(data, dict) and "products" in data:
        data = data["products"]

    # 排序：佣金或销量优先
    def score(p: Dict[str, Any]) -> float:
        return float(p.get("sales_count") or 0) + float(p.get("commission_amount") or 0) * 100

    data_sorted = sorted(data, key=score, reverse=True)[:top_n]
    logger.info(f"将为 {len(data_sorted)} 个商品生成内容")

    results = []
    content_factory = ContentFactory()

    for idx, raw_prod in enumerate(data_sorted, 1):
        logger.info(f"[{idx}/{len(data_sorted)}] 处理商品: {raw_prod.get('title','')[:40]}")
        try:
            product = _upsert_product(raw_prod)
        except Exception as e:
            logger.error(f"写入商品失败: {e}")
            continue

        # 生成小红书文案
        try:
            xhs_content = content_factory.generate_xhs_post(product)
        except Exception as e:
            logger.error(f"文案生成失败: {e}")
            continue
        if not xhs_content:
            logger.warning("无返回文案，跳过")
            continue

        # 下载商品图片（主图或详情页提供的图片URL）
        recomposer = ImageRecomposer(product)
        extra = raw_prod.get("raw") or {}
        raw_lines = extra.get("raw_lines", []) if isinstance(extra, dict) else []
        img_urls = []
        if raw_prod.get("main_image_url"):
            img_urls.append(raw_prod["main_image_url"])
        # 如果 extra 里包含图片链接也一起放进来
        for l in raw_lines:
            if isinstance(l, str) and (l.startswith("http") and ("img" in l or "p3" in l or "p9" in l)):
                img_urls.append(l)

        try:
            recomposer.download_assets(image_urls=img_urls)
            img_paths = []
            out_dir = ensure_dir(Config.IMAGE_DIR / f"product_{product.id}")
            if out_dir.exists():
                img_paths = sorted(out_dir.rglob("*.jpg")) + sorted(out_dir.rglob("*.png"))
                img_paths = [str(p) for p in img_paths if p.is_file()][:9]
            # 没下载到图也没关系（后续可以手放图）
        except Exception as e:
            logger.warning(f"下载/合成图片失败: {e}")
            img_paths = []

        results.append({
            "product_id": product.id,
            "content_id": xhs_content.id,
            "title": xhs_content.title,
            "body": xhs_content.body,
            "tags": xhs_content.tags,
            "images": img_paths,
            "main_image_url": product.main_image_url,
        })

    out_json = Config.DATA_DIR / f"xhs_posts_ready_{int(__import__('time').time())}.json"
    out_json.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.success(f"生成 {len(results)} 条小红书内容 -> {out_json}")
    return results


# ---------- Step 3: 发布 ----------
def step_publish(ready_json: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
    if ready_json:
        posts = json.loads(Path(ready_json).read_text(encoding="utf-8"))
    else:
        # 直接从 DB 读 status='draft' 的 Content
        init_db()
        with get_db() as db:
            rows = (
                db.query(Content)
                .filter(Content.platform == "xhs")
                .filter(Content.status == "draft")
                .limit(limit)
                .all()
            )
        posts = []
        for r in rows:
            prod = db.query(Product).filter(Product.id == r.product_id).first()
            # 取该商品目录下的图片
            img_dir = Config.DATA_DIR / "images" / f"product_{r.product_id}"
            imgs = [str(p) for p in img_dir.rglob("*.jpg")]
            posts.append({
                "product_id": r.product_id,
                "content_id": r.id,
                "title": r.title,
                "body": r.body,
                "tags": r.tags or [],
                "images": imgs[:9],
            })

    posts = posts[:limit]
    if not posts:
        logger.warning("没有可发布的内容")
        return []

    results = []
    with XiaohongshuPublisher(headless=False) as pub:
        if not pub.login():
            return [{"success": False, "error": "登录失败"}]
        for idx, p in enumerate(posts, 1):
            logger.info(f"[发布 {idx}/{len(posts)}] {str(p.get('title',''))[:40]}")
            try:
                r = pub.publish_image_note(
                    title=str(p.get("title"))[:20],
                    body=str(p.get("body"))[:1800],
                    image_paths=[str(i) for i in (p.get("images") or [])][:9],
                    tags=list(p.get("tags") or [])[:3],
                )
                results.append({**p, "publish_result": r})
                # 同账号两篇之间留足间隔，避免风控
                sleep_sec = 45 + int(__import__('random').random() * 60)
                logger.info(f"等待 {sleep_sec}s 后发布下一条 (防风控)...")
                __import__('time').sleep(sleep_sec)
            except Exception as e:
                logger.error(f"发布异常: {e}")
                results.append({**p, "publish_result": {"success": False, "error": str(e)}})

    out = Config.DATA_DIR / f"xhs_publish_result_{int(__import__('time').time())}.json"
    out.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    return results


# ---------- 一键全流程 ----------
def step_all(n_products: int, top_publish: int) -> Dict[str, Any]:
    logger.info("=== Step 1: 抓取商品 ===")
    json_path = step_crawl(n=n_products)

    logger.info("=== Step 2: 生成内容 ===")
    ready = step_generate(str(json_path), top_n=n_products)
    ready_json = Config.DATA_DIR / f"xhs_posts_ready_{int(__import__('time').time())}.json"
    ready_json.write_text(json.dumps(ready, ensure_ascii=False, indent=2), encoding="utf-8")

    logger.info(f"=== Step 3: 发布 {top_publish} 条 ===")
    result = step_publish(str(ready_json), limit=top_publish)

    return {"products_json": str(json_path), "ready_json": str(ready_json), "published": result}


def main():
    parser = argparse.ArgumentParser(description="巨量百应 → 小红书 全自动流水线")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("crawl")
    sp.add_argument("-n", "--num", type=int, default=100)
    sp.add_argument("-o", "--output", type=str, default=None)

    sp = sub.add_parser("generate")
    sp.add_argument("--json", required=True, help="products.json 路径")
    sp.add_argument("--top", type=int, default=10, help="选前N个生成内容")

    sp = sub.add_parser("publish")
    sp.add_argument("--json", default=None, help="可选: xhs_posts_ready_xxx.json")
    sp.add_argument("--limit", type=int, default=5)

    sp = sub.add_parser("all")
    sp.add_argument("-n", "--num", type=int, default=20, help="抓取商品数")
    sp.add_argument("--top", type=int, default=5, help="发布条数")

    args = parser.parse_args()
    init_db()

    if args.cmd == "crawl":
        p = step_crawl(args.num, args.output)
        print(f"输出文件: {p}")
    elif args.cmd == "generate":
        step_generate(args.json, top_n=args.top)
    elif args.cmd == "publish":
        r = step_publish(args.json, limit=args.limit)
        print(json.dumps(r, ensure_ascii=False, indent=2))
    elif args.cmd == "all":
        r = step_all(args.num, args.top)
        print(json.dumps(r, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
