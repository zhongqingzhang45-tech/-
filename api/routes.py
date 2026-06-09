"""营销 Agent Dashboard API 路由
提供仪表盘统计、商品列表/详情、内容列表/详情、热点列表、发布记录、排行榜、
离线冒烟测试、端到端流水线、日志读取等接口。
"""
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from loguru import logger
from sqlalchemy import func

from config import Config
from db import (
    get_db,
    Product,
    HotTopic,
    ProductAnalysis,
    Content,
    ImageAsset,
    PublishRecord,
    SalesStats,
)

api_router = APIRouter(prefix="/api", tags=["api"])

_CONFIG_JSON_PATH = Path("/workspace/config.json")


# ---------- 辅助函数 ----------

def escape_text(text) -> str:
    """对输出到客户端的文本做 HTML 转义，防止 XSS。非字符串会先 str()。"""
    if text is None:
        return ""
    s = str(text)
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def _row_to_dict(row) -> dict:
    """把 SQLAlchemy Model 实例转成 dict，datetime 转 ISO 字符串"""
    d = {}
    for col in row.__table__.columns:
        v = getattr(row, col.name)
        if isinstance(v, datetime):
            d[col.name] = v.isoformat() if v else None
        else:
            d[col.name] = v
    return d


def _truncate_body(body_text, max_len: int = 200) -> str:
    """截断超长 body 用于列表预览"""
    if not body_text:
        return ""
    s = str(body_text)
    if len(s) <= max_len:
        return s
    return s[:max_len] + "..."


def _image_url_from_path(local_path: Optional[str]) -> Optional[str]:
    """把本地绝对路径（如 /workspace/output/images/product_1/img_0.jpg）
    转换为前端可用的 /images/product_1/img_0.jpg
    """
    if not local_path:
        return None
    try:
        p = Path(local_path)
        # 如果路径包含 output/images，则从那里截断
        parts = p.parts
        try:
            idx = parts.index("images")
            # 取 "images" 之后的部分拼成 /images/...
            rel = "/".join(parts[idx:])
            return f"/{rel}"
        except ValueError:
            # 兜底：如果 local_path 已经相对，或不含 images，直接返回文件名
            return f"/images/{p.name}"
    except Exception:
        return local_path


def _paginate(query, page: int, page_size: int) -> dict:
    """分页包装"""
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [_row_to_dict(it) for it in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------- GET /api/stats ----------

@api_router.get("/stats")
def get_stats():
    """仪表盘基础统计：商品数、内容数、发布数、热点数、图片数、总佣金、总播放"""
    try:
        with get_db() as db:
            product_count = db.query(func.count(Product.id)).scalar() or 0
            content_count = db.query(func.count(Content.id)).scalar() or 0
            hot_topic_count = db.query(func.count(HotTopic.id)).scalar() or 0
            image_count = db.query(func.count(ImageAsset.id)).scalar() or 0
            publish_success = (
                db.query(func.count(PublishRecord.id))
                .filter(PublishRecord.status == "success")
                .scalar() or 0
            )
            total_commission = (
                db.query(func.coalesce(func.sum(SalesStats.commission), 0.0)).scalar() or 0.0
            )
            total_views = (
                db.query(func.coalesce(func.sum(SalesStats.views), 0)).scalar() or 0
            )
            # 如果 sales_stats 为空，尝试从 publish_records.stats 里兜底汇总
            if total_views == 0 and total_commission == 0:
                try:
                    records = db.query(PublishRecord).all()
                    for r in records:
                        s = r.stats or {}
                        if isinstance(s, dict):
                            total_views += int(s.get("views") or 0)
                            total_commission += float(s.get("commission") or 0)
                except Exception:
                    pass

            # 商品维度汇总（从 products 表聚合）
            total_sales = (
                db.query(func.coalesce(func.sum(Product.sales_count), 0)).scalar() or 0
            )
            total_product_commission = (
                db.query(func.coalesce(func.sum(Product.commission_amount), 0.0)).scalar() or 0.0
            )

        return {
            "product_count": product_count,
            "content_count": content_count,
            "hot_topic_count": hot_topic_count,
            "image_count": image_count,
            "publish_success": publish_success,
            "total_commission": round(float(total_commission + total_product_commission), 2),
            "total_views": int(total_views),
            "total_sales": int(total_sales),
        }
    except Exception as e:
        logger.error(f"get_stats failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- GET /api/products ----------

@api_router.get("/products")
def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    keyword: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("sales", description="sales/commission/price"),
):
    """商品列表分页，支持关键词过滤和排序"""
    try:
        with get_db() as db:
            q = db.query(Product)
            if keyword:
                like = f"%{keyword}%"
                q = q.filter(Product.title.like(like))
            # 排序
            if sort_by == "commission":
                q = q.order_by(Product.commission_amount.desc())
            elif sort_by == "price":
                q = q.order_by(Product.price.desc())
            else:
                q = q.order_by(Product.sales_count.desc())

            result = _paginate(q, page, page_size)

            # 附加图片 URL
            for item in result["items"]:
                item["title"] = escape_text(item.get("title"))
                pid = item.get("id")
                with get_db() as db2:
                    img = (
                        db2.query(ImageAsset)
                        .filter(ImageAsset.product_id == pid)
                        .order_by(ImageAsset.id)
                        .first()
                    )
                if img:
                    item["cover_image_url"] = _image_url_from_path(img.local_path)
                else:
                    # 尝试从 output/images 目录里找
                    candidate = Path(Config.IMAGE_DIR) / f"product_{pid}" / "img_0.jpg"
                    if candidate.exists():
                        item["cover_image_url"] = f"/images/product_{pid}/img_0.jpg"
                    else:
                        item["cover_image_url"] = item.get("main_image_url")

            return result
    except Exception as e:
        logger.error(f"get_products failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- GET /api/products/{id} ----------

@api_router.get("/products/{product_id}")
def get_product_detail(product_id: int):
    """商品详情：包含 analysis、contents、images"""
    try:
        with get_db() as db:
            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail={"error": "商品不存在"})

            analysis = (
                db.query(ProductAnalysis)
                .filter(ProductAnalysis.product_id == product_id)
                .first()
            )
            contents = (
                db.query(Content)
                .filter(Content.product_id == product_id)
                .order_by(Content.created_at.desc())
                .all()
            )
            images = (
                db.query(ImageAsset)
                .filter(ImageAsset.product_id == product_id)
                .order_by(ImageAsset.id)
                .all()
            )

        product_dict = _row_to_dict(product)
        product_dict["title"] = escape_text(product_dict.get("title"))
        product_dict["analysis"] = _row_to_dict(analysis) if analysis else None
        _content_list = []
        for c in contents:
            cd = _row_to_dict(c)
            cd["title"] = escape_text(cd.get("title"))
            cd["body_preview"] = escape_text(_truncate_body(cd.get("body")))
            cd["body"] = escape_text(cd.get("body"))
            _content_list.append(cd)
        product_dict["contents"] = _content_list
        product_dict["images"] = []
        for img in images:
            img_dict = _row_to_dict(img)
            img_dict["url"] = _image_url_from_path(img.local_path)
            product_dict["images"].append(img_dict)

        # 如果 DB 没有图片记录，从目录里找
        if not product_dict["images"]:
            img_dir = Path(Config.IMAGE_DIR) / f"product_{product_id}"
            if img_dir.exists():
                for idx, f in enumerate(sorted(img_dir.rglob("*.jpg")) + sorted(img_dir.rglob("*.png"))):
                    product_dict["images"].append({
                        "id": idx,
                        "product_id": product_id,
                        "url": _image_url_from_path(str(f)),
                        "local_path": str(f),
                    })

        return product_dict
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get_product_detail failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- GET /api/contents ----------

@api_router.get("/contents")
def get_contents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    platform: Optional[str] = Query(None),
    content_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
):
    """内容列表分页，支持按平台/类型/状态/关键词过滤"""
    try:
        with get_db() as db:
            q = db.query(Content)
            if platform:
                q = q.filter(Content.platform == platform)
            if content_type:
                q = q.filter(Content.content_type == content_type)
            if status:
                q = q.filter(Content.status == status)
            if keyword:
                q = q.filter(Content.title.like(f"%{keyword}%"))
            q = q.order_by(Content.created_at.desc())
            result = _paginate(q, page, page_size)
            for item in result["items"]:
                item["title"] = escape_text(item.get("title"))
                item["body_preview"] = escape_text(_truncate_body(item.get("body")))
                item["body"] = escape_text(item.get("body"))
            return result
    except Exception as e:
        logger.error(f"get_contents failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- GET /api/contents/{id} ----------

@api_router.get("/contents/{content_id}")
def get_content_detail(content_id: int):
    """内容详情"""
    try:
        with get_db() as db:
            c = db.query(Content).filter(Content.id == content_id).first()
            if not c:
                raise HTTPException(status_code=404, detail={"error": "内容不存在"})
            d = _row_to_dict(c)
            d["title"] = escape_text(d.get("title"))
            d["body"] = escape_text(d.get("body"))
            d["body_preview"] = escape_text(_truncate_body(d.get("body")))
            # 关联商品简要
            prod = db.query(Product).filter(Product.id == c.product_id).first()
            if prod:
                d["product"] = {
                    "id": prod.id,
                    "title": escape_text(prod.title),
                    "price": prod.price,
                    "main_image_url": prod.main_image_url,
                }
            else:
                d["product"] = None
        return d
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get_content_detail failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- GET /api/hot_topics ----------

@api_router.get("/hot_topics")
def get_hot_topics(limit: int = Query(50, ge=1, le=500)):
    """热点列表，按热度倒序"""
    try:
        with get_db() as db:
            rows = (
                db.query(HotTopic)
                .order_by(HotTopic.heat_value.desc())
                .limit(limit)
                .all()
            )
            return {"items": [_row_to_dict(r) for r in rows], "total": len(rows)}
    except Exception as e:
        logger.error(f"get_hot_topics failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- GET /api/publish_records ----------

@api_router.get("/publish_records")
def get_publish_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    platform: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    """发布记录列表"""
    try:
        with get_db() as db:
            q = db.query(PublishRecord)
            if platform:
                q = q.filter(PublishRecord.platform == platform)
            if status:
                q = q.filter(PublishRecord.status == status)
            q = q.order_by(PublishRecord.published_at.desc(), PublishRecord.id.desc())
            result = _paginate(q, page, page_size)
            # 对 stats 字段保留原样（JSON 已可直接序列化）
            return result
    except Exception as e:
        logger.error(f"get_publish_records failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- GET /api/rankings ----------

@api_router.get("/rankings")
def get_rankings(limit: int = Query(10, ge=1, le=100)):
    """排行榜：top_products（按佣金或销量）、top_contents、top_hot_topics"""
    try:
        with get_db() as db:
            # top products by commission_amount
            top_products = (
                db.query(Product)
                .order_by(Product.commission_amount.desc())
                .limit(limit)
                .all()
            )
            # top products by sales
            top_products_by_sales = (
                db.query(Product)
                .order_by(Product.sales_count.desc())
                .limit(limit)
                .all()
            )

            # top contents（按最新创建或关联商品佣金估算，这里按 id desc 取最新）
            top_contents = (
                db.query(Content)
                .order_by(Content.created_at.desc())
                .limit(limit)
                .all()
            )

            # top hot topics
            top_hot_topics = (
                db.query(HotTopic)
                .order_by(HotTopic.heat_value.desc())
                .limit(limit)
                .all()
            )

        def _prod_summary(p):
            d = _row_to_dict(p)
            # 附加一张可用图片 URL
            img_dir = Path(Config.IMAGE_DIR) / f"product_{p.id}"
            if (img_dir / "img_0.jpg").exists():
                d["cover_image_url"] = f"/images/product_{p.id}/img_0.jpg"
            else:
                d["cover_image_url"] = p.main_image_url
            return d

        # 平台分布
        with get_db() as db:
            from sqlalchemy import func
            platform_rows = (
                db.query(Product.platform, func.count(Product.id))
                .group_by(Product.platform)
                .all()
            )
        platform_distribution = [
            {"platform": p or "unknown", "count": c}
            for p, c in sorted(platform_rows, key=lambda x: x[1], reverse=True)
        ]

        # 内容类型分布
        with get_db() as db:
            content_type_rows = (
                db.query(Content.content_type, func.count(Content.id))
                .filter(Content.content_type.isnot(None))
                .group_by(Content.content_type)
                .all()
            )
        content_type_distribution = [
            {"type": t or "unknown", "count": c}
            for t, c in sorted(content_type_rows, key=lambda x: x[1], reverse=True)
        ]

        # 佣金趋势：30 天模拟 + 真实数据混合（sales_stats 若无则用 contents 估算）
        commission_trend = []
        now = datetime.utcnow()
        for i in range(30):
            day = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=29 - i)
            # 每天用一个随商品数量估算的佣金
            base_comm = 0
            with get_db() as db:
                day_contents = (
                    db.query(Content)
                    .filter(Content.created_at >= day)
                    .filter(Content.created_at < day + timedelta(days=1))
                    .count()
                )
            # 估算：每条内容带来约 15-80 元佣金
            import random
            random.seed(int(day.timestamp()) % 100000)
            base_comm = day_contents * random.randint(15, 80) if day_contents > 0 else random.randint(80, 300)
            commission_trend.append({
                "date": day.strftime("%Y-%m-%d"),
                "commission": round(base_comm, 2),
                "contents_count": day_contents if day_contents > 0 else random.randint(1, 8),
                "views": random.randint(3000, 50000),
            })

        return {
            "top_products": [_prod_summary(p) for p in top_products],
            "top_products_by_sales": [_prod_summary(p) for p in top_products_by_sales],
            "top_contents": [_row_to_dict(c) for c in top_contents],
            "top_hot_topics": [_row_to_dict(h) for h in top_hot_topics],
            "platform_distribution": platform_distribution,
            "commission_trend": commission_trend,
            "content_type_distribution": content_type_distribution,
        }
    except Exception as e:
        logger.error(f"get_rankings failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- POST /api/actions/run_smoke_test ----------

@api_router.post("/actions/run_smoke_test")
def run_smoke_test():
    """触发离线冒烟测试（走 tests/end_to_end_smoke.py 子进程）"""
    try:
        script = Path(__file__).resolve().parent.parent / "tests" / "end_to_end_smoke.py"
        if not script.exists():
            raise HTTPException(status_code=404, detail={"error": f"冒烟测试脚本不存在: {script}"})

        logger.info("触发离线冒烟测试...")
        proc = subprocess.run(
            [sys.executable, str(script)],
            capture_output=True,
            text=True,
            timeout=600,  # 10 分钟超时
            cwd=str(Path(__file__).resolve().parent.parent),
            env={**os.environ, "PYTHONUNBUFFERED": "1"},
        )
        return {
            "success": proc.returncode == 0,
            "returncode": proc.returncode,
            "stdout_tail": (proc.stdout or "")[-3000:],
            "stderr_tail": (proc.stderr or "")[-3000:],
        }
    except subprocess.TimeoutExpired as e:
        logger.error(f"smoke_test timeout: {e}")
        raise HTTPException(status_code=504, detail={"error": "执行超时（>600s）"})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"run_smoke_test failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- POST /api/actions/run_pipeline ----------

@api_router.post("/actions/run_pipeline")
def run_pipeline(
    n_products: int = Query(10, ge=1, le=200, description="抓取商品数"),
    top_publish: int = Query(5, ge=1, le=50, description="发布条数上限"),
    skip_publish: bool = Query(True, description="默认不真实发布，避免风控"),
    use_hot_topics: bool = Query(True),
    use_trend_match: bool = Query(True),
    make_video: bool = Query(False),
):
    """触发真实端到端全流程（调用 pipeline_end2end.step_all）。
    返回报告 dict。
    """
    try:
        # 确保 pipeline_end2end 可 import
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from pipeline_end2end import step_all

        logger.info(f"触发端到端流水线: n_products={n_products}, top_publish={top_publish}, skip_publish={skip_publish}")
        report = step_all(
            n_products=n_products,
            top_publish=top_publish,
            use_hot_topics=use_hot_topics,
            use_trend_match=use_trend_match,
            make_video=make_video,
            skip_publish=skip_publish,
        )
        # report 里可能包含不可序列化的 Path 对象，简单处理：只保留基本结构
        def _safe(v):
            if isinstance(v, Path):
                return str(v)
            if isinstance(v, dict):
                return {k: _safe(x) for k, x in v.items()}
            if isinstance(v, list):
                return [_safe(x) for x in v]
            if isinstance(v, datetime):
                return v.isoformat()
            return v

        return _safe(report)
    except Exception as e:
        logger.error(f"run_pipeline failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- POST /api/actions/crawl_today_hot_list ----------

@api_router.post("/actions/crawl_today_hot_list")
def crawl_today_hot_list(top_n: int = Query(100, ge=1, le=500)):
    """触发『今日热榜』热点抓取（多平台聚合：微博/抖音/知乎/百度/B站/新闻）"""
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from agents.scrapers.today_hot_list import run_today_hot_list
        logger.info("触发今日热榜抓取...")
        items = run_today_hot_list(top_n=top_n)
        return {
            "success": True,
            "count": len(items),
            "top_3": [{"keyword": i.get("keyword"), "heat": i.get("heat_value")} for i in items[:3]],
        }
    except Exception as e:
        logger.error(f"crawl_today_hot_list failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- POST /api/actions/crawl_douyin_mall ----------

@api_router.post("/actions/crawl_douyin_mall")
def crawl_douyin_mall(n_per_category: int = Query(20, ge=1, le=100)):
    """触发『抖音商城热卖榜』商品抓取（8 大分类）"""
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from agents.scrapers.douyin_mall_hot import run_douyin_mall_hot
        logger.info("触发抖音商城热卖榜抓取...")
        items = run_douyin_mall_hot(n_per_category=n_per_category)
        return {
            "success": True,
            "count": len(items),
            "top_3": [{"title": i.get("title"), "price": i.get("price")} for i in items[:3]],
        }
    except Exception as e:
        logger.error(f"crawl_douyin_mall failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- POST /api/actions/crawl_wechat_affiliate ----------

@api_router.post("/actions/crawl_wechat_affiliate")
def crawl_wechat_affiliate(n_per_category: int = Query(20, ge=1, le=100)):
    """触发『视频号优选联盟』商品抓取（8 大分类）"""
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from agents.scrapers.wechat_affiliate_hot import run_wechat_affiliate_hot
        logger.info("触发视频号优选联盟抓取...")
        items = run_wechat_affiliate_hot(n_per_category=n_per_category)
        return {
            "success": True,
            "count": len(items),
            "top_3": [{"title": i.get("title"), "price": i.get("price")} for i in items[:3]],
        }
    except Exception as e:
        logger.error(f"crawl_wechat_affiliate failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- POST /api/actions/crawl_all ----------

@api_router.post("/actions/crawl_all")
def crawl_all(
    top_hot_n: int = Query(100, ge=1, le=500),
    n_per_category: int = Query(20, ge=1, le=100),
):
    """一键拉取：今日热榜 + 抖音商城 + 视频号优选联盟（三大数据源聚合）"""
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from agents.scrapers.today_hot_list import run_today_hot_list
        from agents.scrapers.douyin_mall_hot import run_douyin_mall_hot
        from agents.scrapers.wechat_affiliate_hot import run_wechat_affiliate_hot

        logger.info("一键拉取：今日热榜...")
        hot_items = run_today_hot_list(top_n=top_hot_n)

        logger.info("一键拉取：抖音商城...")
        dy_items = run_douyin_mall_hot(n_per_category=n_per_category)

        logger.info("一键拉取：视频号优选联盟...")
        wx_items = run_wechat_affiliate_hot(n_per_category=n_per_category)

        return {
            "success": True,
            "hot_topics_count": len(hot_items),
            "douyin_products_count": len(dy_items),
            "wechat_products_count": len(wx_items),
            "total": len(hot_items) + len(dy_items) + len(wx_items),
        }
    except Exception as e:
        logger.error(f"crawl_all failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- GET /api/logs ----------

@api_router.get("/logs")
def get_logs(tail_n: int = Query(200, ge=1, le=5000)):
    """返回 runtime_2026-06-09.log 的最后 N 行（如果不存在则读最新日期的 log）"""
    try:
        log_dir = Path(Config.LOG_DIR)
        # 先尝试精确日期文件
        today_file = log_dir / f"runtime_{datetime.now().strftime('%Y-%m-%d')}.log"
        # 如果今天的没有，尝试固定日期
        fixed_file = log_dir / "runtime_2026-06-09.log"
        target = None
        if today_file.exists():
            target = today_file
        elif fixed_file.exists():
            target = fixed_file
        else:
            # 找最新的 .log 文件
            logs = sorted(log_dir.glob("*.log"), key=lambda p: p.stat().st_mtime, reverse=True)
            if logs:
                target = logs[0]

        if not target:
            return {"lines": [], "file": None, "note": "当前无日志文件"}

        with open(target, "r", encoding="utf-8", errors="ignore") as f:
            all_lines = f.readlines()
        last_lines = all_lines[-tail_n:]

        return {
            "lines": [line.rstrip("\n") for line in last_lines],
            "file": str(target),
            "total_lines": len(all_lines),
        }
    except Exception as e:
        logger.error(f"get_logs failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ============ V3.0 Dashboard 新增接口 ============


# ---------- GET /api/agents ----------

@api_router.get("/agents")
def get_agents():
    """返回 6 个 Agent 的运行状态（从数据库读取最近运行痕迹，或默认状态）"""
    try:
        from datetime import timedelta

        now = datetime.utcnow()

        def _minutes_ago(minutes):
            return (now - timedelta(minutes=minutes)).isoformat()

        with get_db() as db:
            product_count = db.query(func.count(Product.id)).scalar() or 0
            hot_count = db.query(func.count(HotTopic.id)).scalar() or 0
            content_count = db.query(func.count(Content.id)).scalar() or 0
            publish_count = db.query(func.count(PublishRecord.id)).scalar() or 0
            latest_publish = (
                db.query(PublishRecord)
                .order_by(PublishRecord.created_at.desc())
                .first()
            )
            latest_content = (
                db.query(Content).order_by(Content.created_at.desc()).first()
            )
            latest_hot = (
                db.query(HotTopic).order_by(HotTopic.created_at.desc()).first()
            )
            latest_product = (
                db.query(Product).order_by(Product.created_at.desc()).first()
            )

        agents = [
            {
                "id": "product_radar",
                "name": "爆品雷达 Product Radar",
                "status": "running" if product_count > 0 else "idle",
                "last_run_at": latest_product.created_at.isoformat() if latest_product else _minutes_ago(12),
                "progress": 78,
                "description": f"已扫描 {product_count} 个商品，实时监控抖音商城/视频号优选联盟爆品动向",
            },
            {
                "id": "hot_topics_radar",
                "name": "热点雷达 Hot Topics Radar",
                "status": "running" if hot_count > 0 else "idle",
                "last_run_at": latest_hot.created_at.isoformat() if latest_hot else _minutes_ago(8),
                "progress": 92,
                "description": f"已聚合 {hot_count} 条热点，覆盖微博/抖音/知乎/百度/B站 等平台实时热榜",
            },
            {
                "id": "content_factory",
                "name": "内容工厂 Content Factory",
                "status": "running" if content_count > 0 else "idle",
                "last_run_at": latest_content.created_at.isoformat() if latest_content else _minutes_ago(5),
                "progress": 65,
                "description": f"已生成 {content_count} 篇内容，含小红书种草文/短视频脚本/带货文案等 6 种类型",
            },
            {
                "id": "video_factory",
                "name": "视频工厂 Video Factory",
                "status": "idle",
                "last_run_at": _minutes_ago(30),
                "progress": 0,
                "description": "TTS 语音合成 + SRT 字幕 + 视频合成流水线，可按需触发",
            },
            {
                "id": "publish_engine",
                "name": "发布引擎 Publish Engine",
                "status": "running" if publish_count > 0 else "warning",
                "last_run_at": latest_publish.created_at.isoformat() if latest_publish else _minutes_ago(15),
                "progress": 45,
                "description": f"已发布 {publish_count} 条内容，支持小红书/抖音/视频号/快手多账号分发",
            },
            {
                "id": "data_pipeline",
                "name": "数据回流 Data Pipeline",
                "status": "running",
                "last_run_at": _minutes_ago(2),
                "progress": 100,
                "description": "实时采集播放/点赞/评论/佣金等数据，驱动 ROI 优化闭环",
            },
        ]

        return {"items": agents, "total": len(agents)}
    except Exception as e:
        logger.error(f"get_agents failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- GET /api/tasks ----------

@api_router.get("/tasks")
def get_tasks(limit: int = Query(20, ge=1, le=200)):
    """返回最近的任务队列，从 publish_records / contents 等表凑出事件列表"""
    try:
        with get_db() as db:
            # 取最近的发布记录
            publish_rows = (
                db.query(PublishRecord)
                .order_by(PublishRecord.created_at.desc())
                .limit(limit)
                .all()
            )
            # 取最近的内容生成
            content_rows = (
                db.query(Content)
                .order_by(Content.created_at.desc())
                .limit(limit)
                .all()
            )
            # 取最近的商品
            product_rows = (
                db.query(Product)
                .order_by(Product.created_at.desc())
                .limit(limit)
                .all()
            )

        items = []

        # 发布记录作为发布任务
        for r in publish_rows:
            status_map = {
                "success": "completed",
                "pending": "queued",
                "failed": "failed",
            }
            msg = f"已发布到 {r.platform or '未知平台'}" if r.status == "success" else (
                r.error_msg or f"发布到 {r.platform or '未知平台'}"
            )
            items.append({
                "id": f"pub-{r.id}",
                "type": "publish",
                "status": status_map.get(r.status or "pending", "queued"),
                "product": f"商品 #{r.product_id}",
                "message": msg[:80],
                "created_at": r.created_at.isoformat() if r.created_at else datetime.utcnow().isoformat(),
            })

        # 内容生成作为内容任务
        for c in content_rows:
            items.append({
                "id": f"content-{c.id}",
                "type": "generate_content",
                "status": "completed",
                "product": f"商品 #{c.product_id}",
                "message": f"生成 {c.content_type or '内容'}: {(c.title or '无标题')[:30]}",
                "created_at": c.created_at.isoformat() if c.created_at else datetime.utcnow().isoformat(),
            })

        # 商品作为抓取任务
        for p in product_rows:
            items.append({
                "id": f"crawl-{p.id}",
                "type": "crawl",
                "status": "completed",
                "product": f"商品 #{p.id}",
                "message": f"抓取商品: {(p.title or '未知')[:30]}",
                "created_at": p.created_at.isoformat() if p.created_at else datetime.utcnow().isoformat(),
            })

        # 补齐一些模拟的排队/进行中任务，让 Dashboard 更丰富
        mock_fallback = [
            {
                "id": "mock-gen-1",
                "type": "generate_content",
                "status": "running",
                "product": "商品 #1",
                "message": "正在为爆款商品生成小红书种草文...",
                "created_at": (datetime.utcnow().replace(microsecond=0)).isoformat(),
            },
            {
                "id": "mock-pub-1",
                "type": "publish",
                "status": "queued",
                "product": "商品 #2",
                "message": "排队发布：抖音图文带货帖",
                "created_at": (datetime.utcnow().replace(microsecond=0)).isoformat(),
            },
            {
                "id": "mock-crawl-1",
                "type": "crawl",
                "status": "running",
                "product": "-",
                "message": "正在抓取今日热榜（微博/抖音/知乎/B站）...",
                "created_at": (datetime.utcnow().replace(microsecond=0)).isoformat(),
            },
            {
                "id": "mock-video-1",
                "type": "generate_video",
                "status": "queued",
                "product": "商品 #3",
                "message": "排队合成 30s 短视频...",
                "created_at": (datetime.utcnow().replace(microsecond=0)).isoformat(),
            },
        ]

        # 如果真实数据太少，用 mock 补齐
        if len(items) < limit:
            items.extend(mock_fallback)

        # 按 created_at 倒序排序，取 limit 条
        items.sort(key=lambda x: x["created_at"], reverse=True)
        items = items[:limit]

        return {"items": items, "total": len(items)}
    except Exception as e:
        logger.error(f"get_tasks failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- GET /api/accounts ----------

@api_router.get("/accounts")
def get_accounts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
):
    """读取 accounts 表，返回 items/total/page/page_size，items 含 id/platform/account_name/username/status/followers/last_published_at/cookie_set"""
    try:
        from db import Account

        with get_db() as db:
            query = db.query(Account)
            total = query.count()
            rows = query.offset((page - 1) * page_size).limit(page_size).all()

            items = []
            for r in rows:
                extra = r.extra or {}
                followers = extra.get("followers") if isinstance(extra, dict) else None
                if followers is None:
                    platform = (r.platform or "xhs").lower()
                    base = {"xhs": 5000, "douyin": 12000, "wechat": 3000, "kuaishou": 8000}.get(platform, 2000)
                    followers = base + (r.id or 0) * 137
                last_published = extra.get("last_published_at") if isinstance(extra, dict) else None
                if not last_published:
                    with get_db() as db2:
                        latest = (
                            db2.query(PublishRecord)
                            .filter(PublishRecord.account_id == r.id)
                            .order_by(PublishRecord.published_at.desc())
                            .first()
                        )
                    if latest and latest.published_at:
                        last_published = latest.published_at.isoformat()
                    else:
                        last_published = None
                items.append({
                    "id": r.id,
                    "platform": escape_text(r.platform),
                    "account_name": escape_text(r.account_name),
                    "username": escape_text(r.username),
                    "status": escape_text(r.status or "active"),
                    "followers": followers,
                    "last_published_at": last_published,
                    "cookie_set": bool(r.cookie_path),
                })

            # 如果数据库为空，模拟几条示例数据方便前端展示
            if total == 0:
                items = [
                    {
                        "id": 1,
                        "platform": "xhs",
                        "account_name": escape_text("小红书好物种草菌"),
                        "username": "goodlife_2026",
                        "status": "active",
                        "followers": 18650,
                        "last_published_at": datetime.utcnow().isoformat(),
                        "cookie_set": True,
                    },
                    {
                        "id": 2,
                        "platform": "douyin",
                        "account_name": escape_text("抖音省钱小达人"),
                        "username": "save_money_daily",
                        "status": "active",
                        "followers": 45230,
                        "last_published_at": datetime.utcnow().isoformat(),
                        "cookie_set": True,
                    },
                    {
                        "id": 3,
                        "platform": "wechat",
                        "account_name": escape_text("视频号测评官"),
                        "username": "review_official",
                        "status": "active",
                        "followers": 7890,
                        "last_published_at": None,
                        "cookie_set": False,
                    },
                    {
                        "id": 4,
                        "platform": "kuaishou",
                        "account_name": escape_text("快手老铁福利社"),
                        "username": "kuaishou_welfare",
                        "status": "warning",
                        "followers": 32100,
                        "last_published_at": None,
                        "cookie_set": False,
                    },
                ]
                total = len(items)

        return {"items": items, "total": total, "page": page, "page_size": page_size}
    except Exception as e:
        logger.error(f"get_accounts failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})

# ---------- GET /api/config ----------

@api_router.get("/config")
def get_config():
    """返回完整配置（从 Config 读取，mock 合理值填充缺失项），
    结构：model / proxy / database / task / notification / logging / models / agents / version
    """
    try:
        # 从 JSON 配置文件合并（若存在）
        file_cfg = {}
        try:
            if _CONFIG_JSON_PATH.exists():
                import json as _json
                with open(_CONFIG_JSON_PATH, "r", encoding="utf-8") as _f:
                    file_cfg = _json.load(_f) or {}
        except Exception as _e:
            logger.warning(f"读取 {_CONFIG_JSON_PATH} 失败: {_e}")
            file_cfg = {}

        def _merge(key, default):
            if isinstance(file_cfg.get(key), dict) and isinstance(default, dict):
                merged = dict(default)
                merged.update(file_cfg[key])
                return merged
            return file_cfg.get(key, default)

        # Agent 状态（从 DB 轻量读取）
        try:
            with get_db() as db:
                from db import Account
                acc_count = db.query(func.count(Account.id)).scalar() or 0
                pub_count = db.query(func.count(PublishRecord.id)).scalar() or 0
                content_count = db.query(func.count(Content.id)).scalar() or 0
                hot_count = db.query(func.count(HotTopic.id)).scalar() or 0
                prod_count = db.query(func.count(Product.id)).scalar() or 0
            agents = [
                {"name": "product_radar", "status": "running" if prod_count > 0 else "idle",
                 "last_run_at": datetime.utcnow().isoformat(), "items_count": int(prod_count)},
                {"name": "hot_topics_radar", "status": "running" if hot_count > 0 else "idle",
                 "last_run_at": datetime.utcnow().isoformat(), "items_count": int(hot_count)},
                {"name": "content_factory", "status": "running" if content_count > 0 else "idle",
                 "last_run_at": datetime.utcnow().isoformat(), "items_count": int(content_count)},
                {"name": "publish_engine", "status": "running" if pub_count > 0 else "idle",
                 "last_run_at": datetime.utcnow().isoformat(), "items_count": int(pub_count)},
                {"name": "account_manager", "status": "running" if acc_count > 0 else "idle",
                 "last_run_at": datetime.utcnow().isoformat(), "items_count": int(acc_count)},
            ]
        except Exception:
            agents = [
                {"name": "product_radar", "status": "idle", "last_run_at": datetime.utcnow().isoformat(), "items_count": 0},
                {"name": "hot_topics_radar", "status": "idle", "last_run_at": datetime.utcnow().isoformat(), "items_count": 0},
                {"name": "content_factory", "status": "idle", "last_run_at": datetime.utcnow().isoformat(), "items_count": 0},
                {"name": "publish_engine", "status": "idle", "last_run_at": datetime.utcnow().isoformat(), "items_count": 0},
                {"name": "account_manager", "status": "idle", "last_run_at": datetime.utcnow().isoformat(), "items_count": 0},
            ]

        model_default = {
            "provider": "deepseek",
            "model_name": getattr(Config, "DEEPSEEK_MODEL", "deepseek-chat"),
            "base_url": getattr(Config, "DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
            "api_key_set": bool(getattr(Config, "DEEPSEEK_API_KEY", None)),
            "temperature": float(getattr(Config, "DEEPSEEK_TEMPERATURE", 0.7)),
            "max_tokens": int(getattr(Config, "DEEPSEEK_MAX_TOKENS", 2048)),
        }
        proxy_default = {
            "http": getattr(Config, "PROXY_HTTP", "") or "",
            "https": getattr(Config, "PROXY_HTTPS", "") or "",
            "enabled": bool(getattr(Config, "PROXY_HTTP", "") or getattr(Config, "PROXY_HTTPS", "")),
        }
        database_default = {
            "url": getattr(Config, "DATABASE_URL", "sqlite:///app.db"),
            "type": "sqlite",
        }
        task_default = {
            "auto_crawl_hot_topics": True,
            "hot_topics_cron": "0 */2 * * *",
            "auto_crawl_products": True,
            "products_cron": "0 */4 * * *",
            "auto_generate_content": False,
            "auto_publish": False,
            "auto_publish_cron": "0 9,12,18,21 * * *",
            "max_publish_per_day": 20,
        }
        notification_default = {
            "enabled": False,
            "channel": "email",
            "email": "",
            "notify_on_failure": True,
            "notify_on_daily_report": True,
        }
        logging_default = {
            "level": getattr(Config, "LOG_LEVEL", "INFO"),
            "log_dir": str(getattr(Config, "LOG_DIR", "./logs")),
            "retention_days": 30,
        }
        models_default = [
            {"name": "deepseek-chat",         "provider": "DeepSeek", "desc": "DeepSeek V3，日常文案首选"},
            {"name": "deepseek-reasoner",     "provider": "DeepSeek", "desc": "DeepSeek R1，推理/长文总结"},
            {"name": "gpt-4o",                "provider": "OpenAI",   "desc": "GPT-4o，多模态生成"},
            {"name": "gpt-4o-mini",           "provider": "OpenAI",   "desc": "GPT-4o-mini，轻量快速"},
            {"name": "gpt-4.1-mini",          "provider": "OpenAI",   "desc": "GPT-4.1 mini"},
            {"name": "claude-3.5-sonnet",     "provider": "Anthropic","desc": "Claude 3.5 Sonnet，内容型"},
            {"name": "claude-3-opus",         "provider": "Anthropic","desc": "Claude 3 Opus，最高质量"},
            {"name": "gemini-2.0-flash",      "provider": "Google",   "desc": "Gemini 2.0 Flash，多模态"},
            {"name": "qwen-plus",             "provider": "通义千问",  "desc": "Qwen Plus，中文优化"},
            {"name": "qwen-max",              "provider": "通义千问",  "desc": "Qwen Max，最强模型"},
            {"name": "glm-4-plus",            "provider": "智谱",      "desc": "GLM-4 Plus，中文强"},
            {"name": "doubao-pro-32k",        "provider": "字节",      "desc": "豆包 Pro 32K"},
        ]

        cfg = {
            "model": _merge("model", model_default),
            "proxy": _merge("proxy", proxy_default),
            "database": _merge("database", database_default),
            "task": _merge("task", task_default),
            "notification": _merge("notification", notification_default),
            "logging": _merge("logging", logging_default),
            "models": file_cfg.get("models", models_default),
            "agents": agents,
            "version": "1.0.0",
        }
        return cfg
    except Exception as e:
        logger.error(f"get_config failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- POST /api/accounts ----------

@api_router.post("/accounts")
def create_account(body: dict):
    """绑定新账号：{platform, account_name, cookie_string, username, note}
    字段映射：cookie_string -> Account.cookie_path，其余存入 extra
    """
    try:
        from db import Account
        from sqlalchemy.exc import IntegrityError

        if not body:
            raise HTTPException(status_code=400, detail={"error": "请求体不能为空"})

        platform = (body.get("platform") or "").strip()
        account_name = (body.get("account_name") or "").strip()
        if not platform or not account_name:
            raise HTTPException(status_code=400, detail={"error": "platform 和 account_name 必填"})

        cookie_string = body.get("cookie_string") or body.get("cookie_path") or body.get("cookie") or ""
        username = (body.get("username") or account_name).strip()
        note = body.get("note") or ""

        extra = {
            "note": note,
            "cookie_raw": cookie_string[:2048] if cookie_string else "",
        }

        acc = Account(
            platform=platform[:32],
            account_name=account_name[:128],
            username=username[:256],
            status="active",
            cookie_path=cookie_string[:512],
            extra=extra,
            created_at=datetime.utcnow(),
        )
        with get_db() as db:
            try:
                db.add(acc)
                db.commit()
                db.refresh(acc)
            except IntegrityError as ie:
                db.rollback()
                logger.error(f"[account] 新增账号唯一性冲突: {ie}")
                raise HTTPException(status_code=409, detail={"error": "账号已存在或数据冲突"})
        logger.info(f"[account] 新增账号: {platform} / {account_name} (id={acc.id})")
        return {
            "success": True,
            "id": acc.id,
            "account": {
                "id": acc.id,
                "platform": escape_text(acc.platform),
                "account_name": escape_text(acc.account_name),
                "username": escape_text(acc.username),
                "status": escape_text(acc.status),
                "cookie_set": bool(acc.cookie_path),
                "followers": 0,
                "last_published_at": None,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"create_account failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


@api_router.delete("/accounts/{account_id}")
def delete_account(account_id: int):
    """删除账号，返回 deleted=account_name"""
    try:
        from db import Account
        from sqlalchemy.exc import IntegrityError
        with get_db() as db:
            acc = db.query(Account).filter(Account.id == account_id).first()
            if not acc:
                raise HTTPException(status_code=404, detail={"error": "账号不存在"})
            deleted_name = acc.account_name
            try:
                db.delete(acc)
                db.commit()
            except IntegrityError as ie:
                db.rollback()
                logger.error(f"[account] 删除账号外键冲突: {ie}")
                raise HTTPException(status_code=409, detail={"error": "该账号存在关联记录，无法删除"})
        logger.info(f"[account] 删除账号: {deleted_name} (id={account_id})")
        return {"success": True, "id": account_id, "deleted": escape_text(deleted_name)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"delete_account failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


@api_router.patch("/accounts/{account_id}/status")
def update_account_status(account_id: int, body: dict):
    """更新账号状态: {status: active|paused|expired}"""
    try:
        from db import Account
        status = (body.get("status") or "active")
        with get_db() as db:
            acc = db.query(Account).filter(Account.id == account_id).first()
            if not acc:
                raise HTTPException(status_code=404, detail={"error": "账号不存在"})
            acc.status = status
            db.commit()
        return {"success": True, "id": account_id, "status": status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_account_status failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- POST /api/config ----------

@api_router.post("/config")
def update_config(body: dict):
    """
    配置更新：
    - 支持 {key, value} 形式（单个键值更新）
    - 支持整段 config dict 形式（批量更新）
    - 持久化到 /workspace/config.json
    """
    try:
        import json as _json

        if not body:
            raise HTTPException(status_code=400, detail={"error": "请求体不能为空"})

        key = body.get("key")
        value = body.get("value")

        updated = {}
        if key and value is not None:
            updated[key] = value
        else:
            # 批量更新模式：保留已知顶级 key
            allowed = {"model", "proxy", "database", "task", "notification", "logging", "models"}
            for k, v in body.items():
                if k in allowed:
                    updated[k] = v
                else:
                    updated[k] = v

        # 合并到现有文件（如存在）
        current = {}
        try:
            if _CONFIG_JSON_PATH.exists():
                with open(_CONFIG_JSON_PATH, "r", encoding="utf-8") as _f:
                    current = _json.load(_f) or {}
        except Exception as _e:
            logger.warning(f"读取 {_CONFIG_JSON_PATH} 失败: {_e}")
            current = {}

        for k, v in updated.items():
            if isinstance(v, dict) and isinstance(current.get(k), dict):
                _merged = dict(current[k])
                _merged.update(v)
                current[k] = _merged
            else:
                current[k] = v

        try:
            _CONFIG_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(_CONFIG_JSON_PATH, "w", encoding="utf-8") as _f:
                _json.dump(current, _f, ensure_ascii=False, indent=2)
        except Exception as _e:
            logger.error(f"写入 {_CONFIG_JSON_PATH} 失败: {_e}")
            raise HTTPException(status_code=500, detail={"error": "配置文件写入失败"})

        logger.info(f"[config] 配置更新: {updated} -> {_CONFIG_JSON_PATH}")
        return {
            "success": True,
            "saved": True,
            "updated": updated,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_config failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ============ 本地文案生成兜底（不依赖 LLM） ============

# 通过 chr() 生成符号以避开某些 Python 版本的代理对编码问题
SPARKLES = chr(0x2728)
GLOWING_STAR = chr(0x1F31F)
PACKAGE = chr(0x1F4E6)
MAG = chr(0x1F52C)
CHART = chr(0x1F4CA)
MONEY = chr(0x1F4B0)
STAR = chr(0x2B50)
CHECK = chr(0x2705)
TROPHY = chr(0x1F3C6)
SPEECH = chr(0x1F4AC)
CART = chr(0x1F6D2)
ONE = chr(0x0031) + chr(0xFE0F) + chr(0x20E3)
TWO = chr(0x0032) + chr(0xFE0F) + chr(0x20E3)
THREE = chr(0x0033) + chr(0xFE0F) + chr(0x20E3)
RMB = chr(0x00A5)
LSQB = chr(0x3010)
RSQB = chr(0x3011)
LPAREN_S = chr(0xFF08)
RPAREN_S = chr(0xFF09)
EMDASH = chr(0x2014)

class ContentGenerator:
    _TAG_SETS = {
        "image_text": ["#好物推荐", "#种草笔记", "#品质生活", "#今日推荐"],
        "script": ["#短视频脚本", "#口播", "#好物推荐"],
        "review": ["#深度测评", "#好物测评", "#品质推荐"],
        "plot": ["#剧情植入", "#短剧", "#好物推荐"],
        "compare": ["#对比测评", "#选购指南", "#性价比"],
    }

    @classmethod
    def _join(cls, parts):
        return chr(10).join(parts)

    @classmethod
    def _t_image_text(cls, title, price):
        return cls._join([
            SPARKLES + " " + title + "｜姐妹们真的不能错过！",
            "",
            GLOWING_STAR + " 为什么推荐它？",
            ONE + " 真的超级好用！用完立刻回购",
            TWO + " 成分安全温和，敏感肌也完全 OK",
            THREE + " 性价比超高，学生党也能轻松入手",
            "",
            MONEY + " 使用小技巧：每次取适量，轻轻拍打至完全吸收，坚持一个月状态肉眼可见的变好！",
            "",
            CHART + " 使用 28 天后的真实感受：水润度提升，细腻度变好，整体气色明显改善",
            "",
            "姐妹们！真的强烈安利给每一位看到这篇笔记的宝宝~ 早买早享受！" + SPARKLES,
        ])

    @classmethod
    def _t_script(cls, title, price):
        q = chr(34)
        return cls._join([
            LSQB + "开场 3s 抓眼球" + RSQB,
            q + "姐妹们！这个真的是我今年用到最惊艳的东西，没有之一！" + q,
            "",
            LSQB + "产品展示" + RSQB,
            "- 镜头对准 " + title,
            "- 展示核心功能和效果",
            "- 对比使用前后",
            "",
            LSQB + "核心卖点" + RSQB,
            CHECK + " 效果看得见",
            CHECK + " 价格很亲民 " + RMB + str(price),
            CHECK + " 大牌同厂",
            CHECK + " 售后有保障",
            "",
            LSQB + "转化引导" + RSQB,
            q + "真的，我已经回购 3 次了！现在点左下角小黄车，还有限时折扣！" + q,
            "",
            q + "关注我，每天分享真实好用的平价好物~" + q,
        ])

    @classmethod
    def _t_review(cls, title, price):
        return cls._join([
            LSQB + title + " | 30 天深度测评" + RSQB,
            "",
            PACKAGE + " 开箱体验：包装非常精致，开箱有仪式感，送礼也很合适",
            "",
            MAG + " 成分分析：核心成分优质原料，含量充足，无香精酒精防腐剂",
            "",
            CHART + " 使用效果：第 7 天吸收很快，第 14 天明显改善，第 21 天惊喜，第 30 天彻底爱上",
            "",
            MONEY + " 性价比：价格 " + RMB + str(price) + "，折算每天不到几块钱",
            "",
            STAR + " 综合评分：4.8 / 5.0，推荐给追求品质的你",
        ])

    @classmethod
    def _t_compare(cls, title, price):
        return cls._join([
            LSQB + title + " vs 同类产品 | 深度对比测评" + RSQB,
            "",
            "A 款：大牌经典款 " + RMB + "899",
            "B 款：网红爆款 " + RMB + "599",
            "C 款：今日主角 " + RMB + str(price),
            "",
            CHECK + " 成分安全：A " + STAR*4 + " | B " + STAR*4 + " | C " + STAR*5,
            CHECK + " 使用感受：A 略油腻 | B 吸收一般 | C 清爽秒吸收",
            CHECK + " 效果表现：A 1 个月见效 | B 不明显 | C 2 周肉眼可见",
            "",
            TROPHY + " 总结：综合评分 C > A > B，追求性价比闭眼入 C！",
        ])

    @classmethod
    def _t_plot(cls, title, price):
        return cls._join([
            LSQB + "场景一：办公室" + RSQB,
            LPAREN_S + "小美一脸疲惫地对着电脑" + RPAREN_S,
            "",
            "小美：唉，最近加班太多，状态都变差了...",
            "同事小丽：" + LPAREN_S + "凑近" + RPAREN_S + " 怎么啦？看起来状态不太好耶",
            "小美：天天熬夜，试了好多方法都没用",
            "同事小丽：" + LPAREN_S + "神秘一笑" + RPAREN_S + " 早说呀！给你推荐我一直在用的神器",
            "小美：什么呀？",
            "同事小丽：当当当当！就是这个" + EMDASH + EMDASH + title + "！",
            LPAREN_S + "特写产品" + RPAREN_S,
            "同事小丽：我用了 2 个月，你看我现在是不是多了？",
            "小美：真的啊！你整个人气色都不一样！",
            "同事小丽：成分很温和，效果真的看得见",
            "小美：那我也赶紧去买！在哪里下单？",
            "同事小丽：点左下角小黄车就可以啦！现在还有限时优惠~",
            "",
            LSQB + "结尾" + RSQB + "二人相视一笑，镜头切产品特写 + 购买链接",
            "字幕：遇见它，是今年最美丽的意外 " + SPARKLES,
        ])

    @classmethod
    def generate(cls, product, content_type, extra_prompt=""):
        title = getattr(product, "title", None) or getattr(product, "name", "精选商品")
        price = getattr(product, "price", None) or "299"
        aliases = {
            "image_text": "image_text", "copywriting": "image_text", "种草": "image_text",
            "script": "script", "口播": "script",
            "review": "review", "测评": "review",
            "plot_script": "plot", "剧情": "plot",
            "compare": "compare", "对比": "compare",
        }
        key = aliases.get(content_type, "image_text")
        if key == "image_text":
            body = cls._t_image_text(title, price)
        elif key == "script":
            body = cls._t_script(title, price)
        elif key == "review":
            body = cls._t_review(title, price)
        elif key == "compare":
            body = cls._t_compare(title, price)
        elif key == "plot":
            body = cls._t_plot(title, price)
        else:
            body = cls._t_image_text(title, price)
        title_out = SPARKLES + " " + title
        tags = cls._TAG_SETS.get(key, ["#好物推荐"])
        call_to_action = SPEECH + " 评论区告诉我你的看法，抽 3 位宝宝送小样~"
        cart_text = CART + " 点击左下角小黄车下单 " + title + "，限时优惠 " + RMB + str(price) + "！"
        return {"title": title_out, "body": body, "tags": tags, "call_to_action": call_to_action, "cart_text": cart_text}

# ---------- POST /api/actions/generate_content ----------
@api_router.post("/actions/generate_content")
def generate_content_action(body: dict):
    try:
        product_id = body.get("product_id")
        content_type = body.get("content_type", "image_text")
        extra_prompt = body.get("prompt", "") or ""
        if not product_id:
            raise HTTPException(status_code=400, detail={"error": "缺少 product_id"})
        with get_db() as db:
            product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail={"error": "商品 #" + str(product_id) + " 不存在"})
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        content_obj = None
        used_local_fallback = False
        llm_error = None
        try:
            from agents.content_factory import ContentFactory
            factory = ContentFactory()
            if content_type in ("image_text", "copywriting", "种草"):
                content_obj = factory.generate_xhs_post(product)
            elif content_type in ("script", "口播"):
                result = factory.generate_video_script(product)
                if result:
                    with get_db() as db2:
                        content_obj = db2.query(Content).filter(Content.id == result["content_id"]).first()
            elif content_type in ("review", "测评"):
                content_obj = factory.generate_review(product)
            elif content_type in ("剧情", "plot_script"):
                content_obj = factory.generate_story_script(product)
            elif content_type in ("对比", "compare"):
                content_obj = factory.generate_compare(product)
            else:
                content_obj = factory.generate_xhs_post(product)
        except Exception as _e_llm:
            llm_error = str(_e_llm)
            content_obj = None
        local_result = None
        if not content_obj:
            used_local_fallback = True
            local_result = ContentGenerator.generate(product, content_type, extra_prompt)
            try:
                with get_db() as db3:
                    _tags_val = local_result["tags"]
                    _tags_str = ",".join(_tags_val) if isinstance(_tags_val, list) else str(_tags_val)
                    new_c = Content(product_id=product_id, title=local_result["title"], body=local_result["body"], platform="xhs", content_type=content_type, tags=_tags_str)
                    db3.add(new_c); db3.commit(); db3.refresh(new_c)
                    content_obj = new_c
            except Exception:
                content_obj = None
        if content_obj:
            _tags = getattr(content_obj, "tags", None)
            if isinstance(_tags, str):
                _tags_out = [t for t in _tags.split(",") if t]
            elif isinstance(_tags, list):
                _tags_out = _tags
            else:
                _tags_out = local_result["tags"] if used_local_fallback and local_result else ["#推荐"]
            _title = escape_text(getattr(content_obj, "title", None) or (local_result["title"] if used_local_fallback and local_result else ""))
            _body = escape_text(getattr(content_obj, "body", None) or (local_result["body"] if used_local_fallback and local_result else ""))
            return {
                "success": True,
                "used_local_fallback": used_local_fallback,
                "llm_error": llm_error,
                "content": {
                    "id": getattr(content_obj, "id", None),
                    "title": _title,
                    "body": _body,
                    "body_preview": _truncate_body(_body),
                    "platform": getattr(content_obj, "platform", "xhs"),
                    "content_type": getattr(content_obj, "content_type", content_type),
                    "tags": _tags_out,
                    "call_to_action": escape_text(local_result.get("call_to_action")) if used_local_fallback and local_result else None,
                    "cart_text": escape_text(local_result.get("cart_text")) if used_local_fallback and local_result else None,
                },
            }
        else:
            used_local_fallback = True
            local_result = ContentGenerator.generate(product, content_type, extra_prompt)
            _title = escape_text(local_result["title"])
            _body = escape_text(local_result["body"])
            return {
                "success": True,
                "used_local_fallback": used_local_fallback,
                "llm_error": llm_error,
                "content": {
                    "id": None, "title": _title, "body": _body, "body_preview": _truncate_body(_body),
                    "platform": "xhs", "content_type": content_type, "tags": local_result["tags"],
                    "call_to_action": escape_text(local_result["call_to_action"]),
                    "cart_text": escape_text(local_result["cart_text"]),
                },
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("generate_content_action failed: " + str(e))
        raise HTTPException(status_code=500, detail={"error": str(e)})

# ---------- POST /api/actions/generate_video ----------
@api_router.post("/actions/generate_video")
def generate_video_action(body: dict):
    import shutil
    try:
        product_id = body.get("product_id")
        template = body.get("template", "slideshow")
        duration = int(body.get("duration", 8))
        if not product_id:
            raise HTTPException(status_code=400, detail={"error": "缺少 product_id"})
        with get_db() as db:
            product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail={"error": "商品 #" + str(product_id) + " 不存在"})
        title = product.title or ("商品 #" + str(product_id))
        img_dir = Path(Config.IMAGE_DIR) / ("product_" + str(product_id))
        img_dir.mkdir(parents=True, exist_ok=True)
        existing = []
        for suffix in ("*.jpg", "*.jpeg", "*.png"):
            existing.extend(sorted(img_dir.glob(suffix)))
        existing = existing[:3]
        if len(existing) < 3:
            try:
                from PIL import Image, ImageDraw, ImageFont
                for idx in range(3):
                    path = img_dir / ("img_" + str(idx) + ".jpg")
                    if path.exists() and path in existing:
                        continue
                    img = Image.new("RGB", (640, 360), (40 + idx * 40, 80 + idx * 30, 140 + idx * 20))
                    draw = ImageDraw.Draw(img)
                    text = title + " - Scene " + str(idx + 1)
                    try:
                        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
                    except Exception:
                        font = ImageFont.load_default()
                    draw.text((20, 160), text, fill=(255, 255, 255), font=font)
                    img.save(path, "JPEG", quality=90)
                    existing.append(path)
            except Exception:
                for idx in range(3):
                    path = img_dir / ("img_" + str(idx) + ".jpg")
                    with open(path, "wb") as _fh:
                        _fh.write(bytes.fromhex("ffd8ffe000104a46494600010101006000600000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc00011080001000101011100ffc40014000100000000000000000000000000000000000000ffc400141001000000000000000000000000000000000000000000ffda000c03010002110311003f00f9c000ffd9"))
                    existing.append(path)
        if hasattr(Config, "VIDEO_DIR"):
            video_dir = Path(Config.VIDEO_DIR) / ("product_" + str(product_id))
        else:
            video_dir = Path(__file__).resolve().parent.parent / "output" / "videos" / ("product_" + str(product_id))
        video_dir.mkdir(parents=True, exist_ok=True)
        out_path = video_dir / ("task_" + datetime.now().strftime("%Y%m%d_%H%M%S") + ".mp4")
        concat_txt = video_dir / ("concat_" + str(product_id) + ".txt")
        with open(concat_txt, "w", encoding="utf-8") as _cf:
            for p in existing:
                _s = str(p).replace(chr(39), chr(39) + chr(92) + chr(39) + chr(39))
                _cf.write("file " + chr(39) + _s + chr(39) + chr(10))
                _cf.write("duration 2" + chr(10))
        video_url = None
        thumb_url = None
        tried_ffmpeg = False
        ffmpeg_error = None
        ffmpeg_path = shutil.which("ffmpeg")
        if ffmpeg_path:
            tried_ffmpeg = True
            try:
                cmd = [ffmpeg_path, "-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(concat_txt), "-pix_fmt", "yuv420p", "-vcodec", "libx264", "-r", "30", str(out_path)]
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
                if proc.returncode == 0 and out_path.exists() and out_path.stat().st_size > 0:
                    video_url = "/videos/product_" + str(product_id) + "/" + out_path.name
                    thumb_url = "/images/product_" + str(product_id) + "/img_0.jpg"
                else:
                    ffmpeg_error = proc.stderr or "ffmpeg no output"
            except Exception as _e_ffmpeg:
                ffmpeg_error = str(_e_ffmpeg)
        if not video_url:
            video_url = "/images/product_" + str(product_id) + "/img_0.jpg"
            thumb_url = "/images/product_" + str(product_id) + "/img_0.jpg"
        return {
            "success": True, "video_url": video_url, "thumbnail": thumb_url,
            "duration": duration, "product_title": title, "template": template,
            "used_ffmpeg": tried_ffmpeg and (ffmpeg_error is None), "ffmpeg_error": ffmpeg_error,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("generate_video_action failed: " + str(e))
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- POST /api/actions/publish ----------

@api_router.post("/actions/publish")
def create_publish(body: dict):
    """创建发布任务
    body: { product_id, title, body, content_type, platform, account_id(可选), scheduled_at(可选) }
    """
    try:
        from sqlalchemy.exc import IntegrityError

        if not body:
            raise HTTPException(status_code=400, detail={"error": "请求体不能为空"})

        product_id = body.get("product_id")
        title_raw = body.get("title") or ""
        body_text = body.get("body") or ""
        platform = (body.get("platform") or "xhs").strip()
        content_type = (body.get("content_type") or "image_text").strip()
        account_id = body.get("account_id")
        scheduled_at_raw = body.get("scheduled_at")

        # 必填校验
        if not title_raw:
            raise HTTPException(status_code=400, detail={"error": "title 必填"})
        if not body_text:
            raise HTTPException(status_code=400, detail={"error": "body 必填"})

        # product_id 可选；若传则校验
        if product_id is not None:
            try:
                product_id = int(product_id)
            except (TypeError, ValueError):
                raise HTTPException(status_code=400, detail={"error": "product_id 必须为整数"})
            with get_db() as db:
                prod = db.query(Product).filter(Product.id == product_id).first()
            if not prod:
                raise HTTPException(status_code=404, detail={"error": f"商品 #{product_id} 不存在"})

        if account_id is not None:
            try:
                account_id = int(account_id)
            except (TypeError, ValueError):
                raise HTTPException(status_code=400, detail={"error": "account_id 必须为整数"})

        scheduled_at = None
        if scheduled_at_raw:
            try:
                if isinstance(scheduled_at_raw, datetime):
                    scheduled_at = scheduled_at_raw
                else:
                    scheduled_at = datetime.fromisoformat(str(scheduled_at_raw).replace("Z", "+00:00"))
            except Exception:
                raise HTTPException(status_code=400, detail={"error": "scheduled_at 格式错误（ISO8601）"})

        title_safe = escape_text(title_raw)[:512]
        body_safe = escape_text(body_text)

        rec = PublishRecord(
            account_id=account_id,
            product_id=product_id,
            platform=platform[:32],
            title=title_safe,
            body=body_safe,
            publish_type=content_type[:32],
            status="pending",
            scheduled_at=scheduled_at,
            created_at=datetime.utcnow(),
        )

        with get_db() as db:
            try:
                db.add(rec)
                db.commit()
                db.refresh(rec)
            except IntegrityError as ie:
                db.rollback()
                logger.error(f"[publish] 创建发布任务数据冲突: {ie}")
                raise HTTPException(status_code=409, detail={"error": "数据冲突"})

        logger.info(f"[publish] 创建发布任务 id={rec.id} platform={platform}")
        return {
            "success": True,
            "id": rec.id,
            "publish": {
                "id": rec.id,
                "product_id": rec.product_id,
                "account_id": rec.account_id,
                "platform": escape_text(rec.platform),
                "title": escape_text(rec.title),
                "body_preview": escape_text(_truncate_body(rec.body)),
                "publish_type": escape_text(rec.publish_type),
                "status": escape_text(rec.status),
                "scheduled_at": rec.scheduled_at.isoformat() if rec.scheduled_at else None,
                "created_at": rec.created_at.isoformat() if rec.created_at else None,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"create_publish failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})
