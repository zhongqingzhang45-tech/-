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
from agents.publishers.douyin import DouyinPublisher
from agents.publishers.kuaishou import KuaishouPublisher
from agents.scrapers.juliang_baiying import run_crawl
from agents.scrapers.douyin_openapi_cli import crawl_via_openapi
from agents.hot_topics_radar import run_radar as run_radar_hot
from agents.trend_matching_engine import TrendMatcher
from agents.dashboard import run_dashboard_report
from utils.common import ensure_dir

# ---------- Step 1a: 浏览器方式抓（Playwright，老方案保留） ----------
def step_crawl(n: int, output: Optional[str] = None) -> Path:
    out = run_crawl(n=n, output_path=output)
    return out

# ---------- Step 1b: OpenAPI 方式抓（新方案，推荐） ----------
def step_crawl_api(
    n: int,
    title: str = "",
    sort_type: str = "sales",
    access_token: str = "",
    output: Optional[str] = None,
) -> Path:
    items = crawl_via_openapi(
        access_token=access_token,
        title=title,
        sort_type=sort_type,
        n=n,
        output_file=output,
    )
    return Path(output) if output else Config.DATA_DIR / "products.json"


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


def step_generate(products_json_path: str, top_n: int = 10, all_types: bool = False) -> List[Dict[str, Any]]:
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

        # 生成内容（6 种类型或仅小红书）
        try:
            if all_types:
                counters = content_factory.generate_all(product)
                # 取其中 xhs post 作为主内容返回
                with get_db() as db:
                    xhs_content = (
                        db.query(Content)
                        .filter(Content.product_id == product.id)
                        .filter(Content.platform == "xhs")
                        .order_by(Content.created_at.desc())
                        .first()
                    )
            else:
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
def step_publish(
    ready_json: Optional[str] = None,
    limit: int = 5,
    headless: bool = False,
    cookies_file: Optional[str] = None,
    raw_cookie: Optional[str] = None,
) -> List[Dict[str, Any]]:
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
    with XiaohongshuPublisher(
        headless=headless,
        cookies_file_path=cookies_file,
        raw_cookie_string=raw_cookie,
    ) as pub:
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
def step_all(n_products: int, top_publish: int,
              use_hot_topics: bool = True,
              use_trend_match: bool = True,
              make_video: bool = False,
              publish_platforms: Optional[List[str]] = None,
              skip_publish: bool = False) -> Dict[str, Any]:
    report: Dict[str, Any] = {}

    # === Step 1: 抓商品（OpenAPI 优先，失败回退 Playwright） ===
    logger.info("=== Step 1: 抓取商品 ===")
    try:
        json_path = step_crawl_api(n=n_products, output=None)
    except Exception as e:
        logger.warning(f"OpenAPI 抓取失败: {e}，回退到浏览器方式")
        json_path = step_crawl(n=n_products)
    report["products_json"] = str(json_path)

    # === Step 2: 抓热点（可选） ===
    if use_hot_topics:
        logger.info("=== Step 2: 抓取热点 ===")
        try:
            n_hot = run_radar_hot(top_n=30)
            report["hot_topics_count"] = n_hot
        except Exception as e:
            logger.warning(f"热点抓取失败: {e}")

    # === Step 3: 趋势匹配（可选） ===
    if use_trend_match:
        logger.info("=== Step 3: 趋势匹配 ===")
        try:
            matched = TrendMatcher().match_from_db(top_n=max(20, n_products))
            report["trend_matches"] = len(matched)
            logger.info(f"已匹配 {len(matched)} 条热点-商品组合")
        except Exception as e:
            logger.warning(f"趋势匹配失败: {e}")

    # === Step 4: 内容生成 ===
    logger.info("=== Step 4: 生成内容（6 种类型） ===")
    ready = step_generate(str(json_path), top_n=n_products, all_types=True)
    ready_json = Config.DATA_DIR / f"xhs_posts_ready_{int(__import__('time').time())}.json"
    ready_json.write_text(json.dumps(ready, ensure_ascii=False, indent=2), encoding="utf-8")
    report["ready_json"] = str(ready_json)

    # === Step 5: 图片重组（为每条内容生成图片素材） ===
    logger.info("=== Step 5: 图片重组 ===")
    try:
        recomposer = ImageRecomposer()
        img_paths = recomposer.compose_from_products_json(str(json_path), count=min(20, n_products))
        report["images_generated"] = len(img_paths)
    except Exception as e:
        logger.warning(f"图片重组失败: {e}")
        img_paths = []

    # === Step 6: 视频混剪（可选） ===
    if make_video:
        logger.info("=== Step 6: 视频混剪 ===")
        try:
            from agents.video.video_composer import VideoComposer
            video_dir = Config.DATA_DIR / "videos"
            video_dir.mkdir(parents=True, exist_ok=True)
            for post in ready[:min(3, top_publish)]:
                try:
                    vc = VideoComposer(output_dir=str(video_dir))
                    title = post.get("title", "")
                    body = post.get("body", "")
                    video_path = vc.compose_slideshow_from_text(
                        title=title, body=body, image_paths=img_paths[:5],
                        duration_s=30, vertical=True,
                    )
                    logger.info(f"视频已生成: {video_path}")
                except Exception as e:
                    logger.warning(f"生成视频失败: {e}")
        except Exception as e:
            logger.warning(f"视频生成失败: {e}")

    # === Step 7: 矩阵发布 ===
    if not skip_publish:
        logger.info(f"=== Step 7: 矩阵发布 ({publish_platforms or ['xhs']}) ===")
        platforms = publish_platforms or ["xhs"]
        publish_results = {}
        # 每条内容发布到各平台
        posts_ready = ready[:top_publish]
        for pf in platforms:
            try:
                if pf == "xhs":
                    res = step_publish(str(ready_json), limit=top_publish)
                    publish_results["xhs"] = res
                elif pf == "douyin":
                    res = step_publish_douyin(posts_ready, image_paths=img_paths, limit=top_publish)
                    publish_results["douyin"] = res
                elif pf == "kuaishou":
                    res = step_publish_kuaishou(posts_ready, image_paths=img_paths, limit=top_publish)
                    publish_results["kuaishou"] = res
                else:
                    logger.warning(f"未识别的发布平台: {pf}")
            except Exception as e:
                logger.error(f"{pf} 发布失败: {e}")
                publish_results[pf] = {"error": str(e)}
        report["publish"] = publish_results

    # === Step 8: 数据回流 + 排行榜 ===
    logger.info("=== Step 8: 数据回流 & 排行榜 ===")
    try:
        ranks = run_dashboard_report(limit=20)
        report["top_products_count"] = len(ranks.get("top_products", []))
        report["top_contents_count"] = len(ranks.get("top_contents", []))
    except Exception as e:
        logger.warning(f"数据回流失败: {e}")

    return report


# ---------- 新增：矩阵发布辅助 ----------
def step_publish_douyin(posts: List[Dict[str, Any]], image_paths: List[str] = None,
                         limit: int = 5) -> List[Dict[str, Any]]:
    """发布到抖音（图文）"""
    results: List[Dict[str, Any]] = []
    posts = posts[:limit]
    try:
        with DouyinPublisher(headless=False) as pub:
            if not pub.login():
                return [{"success": False, "error": "抖音登录失败"}]
            for post in posts:
                r = pub.publish_image_note(
                    title=post.get("title", ""),
                    body=post.get("body", ""),
                    image_paths=image_paths or [],
                    tags=post.get("tags", []),
                )
                results.append(r)
    except Exception as e:
        logger.error(f"抖音发布流程异常: {e}")
        results.append({"success": False, "error": str(e)})
    return results


def step_publish_kuaishou(posts: List[Dict[str, Any]], image_paths: List[str] = None,
                           limit: int = 5) -> List[Dict[str, Any]]:
    """发布到快手（图文）"""
    results: List[Dict[str, Any]] = []
    posts = posts[:limit]
    try:
        with KuaishouPublisher(headless=False) as pub:
            if not pub.login():
                return [{"success": False, "error": "快手登录失败"}]
            for post in posts:
                r = pub.publish_image_note(
                    title=post.get("title", ""),
                    body=post.get("body", ""),
                    image_paths=image_paths or [],
                    tags=post.get("tags", []),
                )
                results.append(r)
    except Exception as e:
        logger.error(f"快手发布流程异常: {e}")
        results.append({"success": False, "error": str(e)})
    return results


def main():
    parser = argparse.ArgumentParser(description="巨量百应 → 小红书 全自动流水线")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("crawl", help="[Playwright 老方案] 浏览器抓取（需本地 Chrome 扫码登录）")
    sp.add_argument("-n", "--num", type=int, default=100)
    sp.add_argument("-o", "--output", type=str, default=None)

    sp = sub.add_parser(
        "crawl_api",
        help="[OpenAPI 新方案，推荐] 通过抖音电商开放平台抓取（需要 access_token）",
    )
    sp.add_argument("-n", "--num", type=int, default=100, help="要抓取的商品总数")
    sp.add_argument("--title", type=str, default="", help="搜索关键词，如 '防晒衣'")
    sp.add_argument("--sort", type=str, default="sales",
                    choices=["sales", "commission", "ratio", "price_asc", "default"],
                    help="排序方式")
    sp.add_argument("--token", type=str, default="", help="access_token；也可通过 DOUYIN_ACCESS_TOKEN 环境变量")
    sp.add_argument("-o", "--output", type=str, default=None)

    sp = sub.add_parser("generate")
    sp.add_argument("--json", required=True, help="products.json 路径")
    sp.add_argument("--top", type=int, default=10, help="选前N个生成内容")

    sp = sub.add_parser("publish", help="发布小红书图文笔记（支持 cookie 免登录）")
    sp.add_argument("--json", default=None, help="xhs_posts_ready_xxx.json 路径；不传则从数据库读草稿")
    sp.add_argument("--limit", type=int, default=5, help="最多发布条数")
    sp.add_argument("--cookies", type=str, default=None,
                    help=f"cookies_xhs.json 路径（默认: data/cookies_xhs.json）")
    sp.add_argument("--raw-cookie", type=str, default=None,
                    help="直接传 cookie 字符串（'a=1; b=2'）")
    sp.add_argument("--headless", action="store_true", help="无头模式（需 cookies 已配置好且验证过）")

    sp = sub.add_parser("all", help="一键全流程：抓商品→热点→趋势匹配→内容→图片→视频→矩阵发布→数据回流")
    sp.add_argument("-n", "--num", type=int, default=20, help="抓取商品数")
    sp.add_argument("--top", type=int, default=5, help="发布条数")
    sp.add_argument("--no-hot", action="store_true", help="关闭热点雷达")
    sp.add_argument("--no-match", action="store_true", help="关闭趋势匹配")
    sp.add_argument("--with-video", action="store_true", help="开启视频混剪（需要 ffmpeg）")
    sp.add_argument("--skip-publish", action="store_true", help="只生成内容/图片/视频，不发布")
    sp.add_argument("--platforms", nargs="+", default=["xhs"],
                    choices=["xhs", "douyin", "kuaishou"],
                    help="发布到的平台（如 --platforms xhs douyin）")

    sp = sub.add_parser("dashboard", help="数据回流 + 输出排行榜（爆品/内容/账号/佣金）")
    sp.add_argument("--limit", type=int, default=20, help="每个排行榜显示条数")

    sp = sub.add_parser("hot", help="抓取热点（抖音热榜/微博热搜/百度热搜/小红书热词）")
    sp.add_argument("-n", "--num", type=int, default=50)

    sp = sub.add_parser("match", help="趋势匹配（把热点和商品做配对）")
    sp.add_argument("--top", type=int, default=30, help="取前N条配对")
    sp.add_argument("--use-llm", action="store_true", help="调用 LLM 二次确认")

    args = parser.parse_args()
    init_db()

    if args.cmd == "crawl":
        p = step_crawl(args.num, args.output)
        print(f"输出文件: {p}")
    elif args.cmd == "crawl_api":
        p = step_crawl_api(
            n=args.num,
            title=args.title,
            sort_type=args.sort,
            access_token=args.token,
            output=args.output,
        )
        print(f"输出文件: {p}")
    elif args.cmd == "generate":
        step_generate(args.json, top_n=args.top)
    elif args.cmd == "publish":
        r = step_publish(
            args.json,
            limit=args.limit,
            headless=args.headless,
            cookies_file=args.cookies,
            raw_cookie=args.raw_cookie,
        )
        print(json.dumps(r, ensure_ascii=False, indent=2))
    elif args.cmd == "all":
        r = step_all(
            n_products=args.num,
            top_publish=args.top,
            use_hot_topics=not args.no_hot,
            use_trend_match=not args.no_match,
            make_video=args.with_video,
            publish_platforms=args.platforms,
            skip_publish=args.skip_publish,
        )
        print(json.dumps(r, ensure_ascii=False, indent=2))
    elif args.cmd == "dashboard":
        ranks = run_dashboard_report(limit=args.limit)
        out_path = Config.DATA_DIR / "dashboard_ranks.json"
        out_path.write_text(json.dumps(ranks, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"已写入排行榜 -> {out_path}")
    elif args.cmd == "hot":
        n = run_radar_hot(top_n=args.num)
        print(f"已写入 {n} 条热点")
    elif args.cmd == "match":
        matches = TrendMatcher().match_from_db(top_n=args.top, use_llm=args.use_llm)
        out_path = Config.DATA_DIR / "trend_matches.json"
        out_path.write_text(json.dumps(matches, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"已写入 {len(matches)} 条匹配 -> {out_path}")


if __name__ == "__main__":
    main()
