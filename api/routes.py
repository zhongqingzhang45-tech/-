"""营销 Agent Dashboard API 路由
提供仪表盘统计、商品列表/详情、内容列表/详情、热点列表、发布记录、排行榜、
离线冒烟测试、端到端流水线、日志读取等接口。
"""
import os
import subprocess
import sys
from datetime import datetime
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


# ---------- 辅助函数 ----------

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
                # 默认返回第一张可用图片的 URL，给前端做封面
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
        product_dict["analysis"] = _row_to_dict(analysis) if analysis else None
        product_dict["contents"] = [_row_to_dict(c) for c in contents]
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
            return _paginate(q, page, page_size)
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
            # 关联商品简要
            prod = db.query(Product).filter(Product.id == c.product_id).first()
            if prod:
                d["product"] = {
                    "id": prod.id,
                    "title": prod.title,
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

        return {
            "top_products": [_prod_summary(p) for p in top_products],
            "top_products_by_sales": [_prod_summary(p) for p in top_products_by_sales],
            "top_contents": [_row_to_dict(c) for c in top_contents],
            "top_hot_topics": [_row_to_dict(h) for h in top_hot_topics],
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
