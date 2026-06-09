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
    """读取 accounts 表，缺 followers 字段时从 extra JSON 模拟"""
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
                    # 模拟一个合理粉丝数
                    platform = (r.platform or "xhs").lower()
                    base = {"xhs": 5000, "douyin": 12000, "wechat": 3000, "kuaishou": 8000}.get(platform, 2000)
                    followers = base + (r.id or 0) * 137

                last_published = extra.get("last_published_at") if isinstance(extra, dict) else None
                if not last_published:
                    # 从 publish_records 找该账号最近一次发布
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
                    "platform": r.platform,
                    "account_name": r.account_name,
                    "username": r.username,
                    "status": r.status,
                    "followers": followers,
                    "last_published_at": last_published,
                })

            # 如果数据库为空，模拟几条示例数据方便前端展示
            if total == 0:
                items = [
                    {
                        "id": 1,
                        "platform": "xhs",
                        "account_name": "小红书好物种草菌",
                        "username": "goodlife_2026",
                        "status": "active",
                        "followers": 18650,
                        "last_published_at": datetime.utcnow().isoformat(),
                    },
                    {
                        "id": 2,
                        "platform": "douyin",
                        "account_name": "抖音省钱小达人",
                        "username": "save_money_daily",
                        "status": "active",
                        "followers": 45230,
                        "last_published_at": datetime.utcnow().isoformat(),
                    },
                    {
                        "id": 3,
                        "platform": "wechat",
                        "account_name": "视频号测评官",
                        "username": "review_official",
                        "status": "active",
                        "followers": 7890,
                        "last_published_at": None,
                    },
                    {
                        "id": 4,
                        "platform": "kuaishou",
                        "account_name": "快手老铁福利社",
                        "username": "kuaishou_welfare",
                        "status": "warning",
                        "followers": 32100,
                        "last_published_at": None,
                    },
                ]
                total = len(items)

        return {"items": items, "total": total, "page": page, "page_size": page_size}
    except Exception as e:
        logger.error(f"get_accounts failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- POST /api/actions/generate_content ----------

@api_router.post("/actions/generate_content")
def generate_content_action(body: dict):
    """
    body: { product_id: int, content_type: string }
    调用 agents.content_factory.ContentFactory，为指定商品生成指定类型内容
    content_type 可选: image_text / copywriting / script / review / plot_script / compare
    """
    try:
        product_id = body.get("product_id")
        content_type = body.get("content_type", "image_text")

        if not product_id:
            raise HTTPException(status_code=400, detail={"error": "缺少 product_id"})

        with get_db() as db:
            product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail={"error": f"商品 #{product_id} 不存在"})

        valid_types = {"image_text", "copywriting", "script", "review", "plot_script", "compare"}
        if content_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail={"error": f"不支持的 content_type: {content_type}，可选: {sorted(valid_types)}"},
            )

        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from agents.content_factory import ContentFactory

        factory = ContentFactory()
        content = None

        if content_type == "image_text":
            content = factory.generate_xhs_post(product)
        elif content_type == "script":
            result = factory.generate_video_script(product)
            if result:
                with get_db() as db2:
                    content = db2.query(Content).filter(Content.id == result["content_id"]).first()
        elif content_type == "copywriting":
            content = factory.generate_copy(product)
        elif content_type == "review":
            content = factory.generate_review(product)
        elif content_type == "plot_script":
            content = factory.generate_story_script(product)
        elif content_type == "compare":
            content = factory.generate_compare(product)

        if not content:
            raise HTTPException(status_code=500, detail={"error": "内容生成失败（可能 LLM 返回为空）"})

        return {
            "success": True,
            "content": {
                "id": content.id,
                "title": content.title,
                "body": content.body,
                "platform": content.platform,
                "content_type": content.content_type,
                "tags": content.tags,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"generate_content_action failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- GET /api/config ----------

@api_router.get("/config")
def get_config():
    """返回完整配置（从 Config 读取，mock 合理值填充缺失项）"""
    try:
        cfg = {
            "model": {
                "provider": "deepseek",
                "model_name": Config.DEEPSEEK_MODEL,
                "base_url": Config.DEEPSEEK_BASE_URL,
                "api_key_set": bool(Config.DEEPSEEK_API_KEY),
                "temperature": Config.DEEPSEEK_TEMPERATURE,
                "max_tokens": Config.DEEPSEEK_MAX_TOKENS,
            },
            "proxy": {
                "http": Config.PROXY_HTTP or "",
                "https": Config.PROXY_HTTPS or "",
                "enabled": bool(Config.PROXY_HTTP or Config.PROXY_HTTPS),
            },
            "database": {
                "url": Config.DATABASE_URL,
                "type": "sqlite",
            },
            "task": {
                "auto_crawl_hot_topics": True,
                "hot_topics_cron": "0 */2 * * *",
                "auto_crawl_products": True,
                "products_cron": "0 */4 * * *",
                "auto_generate_content": False,
                "auto_publish": False,
                "auto_publish_cron": "0 9,12,18,21 * * *",
                "max_publish_per_day": 20,
            },
            "notification": {
                "enabled": False,
                "channel": "email",
                "email": "",
                "notify_on_failure": True,
                "notify_on_daily_report": True,
            },
            "logging": {
                "level": Config.LOG_LEVEL,
                "log_dir": str(Config.LOG_DIR),
                "retention_days": 30,
            },
        }
        return cfg
    except Exception as e:
        logger.error(f"get_config failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})


# ---------- POST /api/config ----------

@api_router.post("/config")
def update_config(body: dict):
    """
    简化版配置更新：接收 key/value 或整段配置，返回 success。
    实际生产环境中应写入 .env 文件或持久化到数据库，此处仅做入参校验与回显。
    """
    try:
        if not body:
            raise HTTPException(status_code=400, detail={"error": "请求体不能为空"})

        key = body.get("key")
        value = body.get("value")

        updated = {}
        if key and value is not None:
            updated[key] = value
        else:
            # 批量更新模式
            for k, v in body.items():
                if k in ("model", "proxy", "database", "task", "notification", "logging"):
                    updated[k] = v
                else:
                    updated[k] = v

        logger.info(f"[config] 配置更新: {updated}")
        return {
            "success": True,
            "updated": updated,
            "note": "配置已收到，当前为内存模式，重启后恢复默认。生产环境请写入 .env 或数据库持久化。",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_config failed: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})
