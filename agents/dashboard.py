"""Agent 9 数据回流 & 佣金统计系统

功能：
1) 扫描 publish_records，抓取发布后数据（播放/点赞/评论/收藏/点击/转化/佣金）
2) 写入 sales_stats，按 product_id+日期 聚合
3) 生成排行榜：
   - top_products_sales   —— 爆品榜（按佣金）
   - top_contents          —— 内容榜（按互动指数）
   - top_accounts          —— 账号榜（按发布数+表现）
   - top_commission        —— 佣金榜

用法：
  from agents.dashboard import Dashboard
  dashboard = Dashboard()
  dashboard.refresh_today()
  print(dashboard.get_rankings())
"""
import json
from datetime import datetime, date
from typing import Dict, List, Any, Optional
from loguru import logger

from db import get_db, Product, Content, PublishRecord, SalesStats, Account


class Dashboard:
    """数据回流 + 排行榜"""

    def __init__(self):
        pass

    # ---------- 抓取（当前版本：基于 publish_records 与模拟数据回流） ----------
    def refresh_today(self, platform: Optional[str] = None) -> int:
        """
        刷新当天的统计数据。
        因为自动化抓抖音/小红书后台数据依赖页面权限，
        这里提供一个**可替换的 hook**：
          - 默认：以 publish_records.stats 聚合（若已填）
          - 重载 fetch_external_stats(platform, publish_record) 可实现外部数据拉取
        """
        today = date.today().isoformat()
        updated = 0
        with get_db() as db:
            q = db.query(PublishRecord)
            if platform:
                q = q.filter(PublishRecord.platform == platform)
            records = q.all()
            for rec in records:
                # 1. 读取已有 stats，或通过外部 hook 获取
                stats = dict(rec.stats or {})
                external = self.fetch_external_stats(rec.platform, rec) or {}
                stats.update(external)
                rec.stats = stats

                # 2. 写入 sales_stats 聚合
                product_id = rec.product_id or self._guess_product_id(db, rec)
                views = int(stats.get("views") or stats.get("play") or 0)
                likes = int(stats.get("likes") or 0)
                comments = int(stats.get("comments") or 0)
                favorites = int(stats.get("favorites") or 0)
                clicks = int(stats.get("clicks") or 0)
                conversions = int(stats.get("conversions") or 0)
                orders = int(stats.get("orders") or 0)
                commission = float(stats.get("commission") or 0)
                roi = float(stats.get("roi") or 0)

                ss = db.query(SalesStats).filter(
                    SalesStats.product_id == product_id,
                    SalesStats.platform == rec.platform,
                    SalesStats.date == today,
                ).first()
                if ss is None:
                    ss = SalesStats(
                        product_id=product_id,
                        platform=rec.platform,
                        date=today,
                        views=views, likes=likes, comments=comments,
                        favorites=favorites, clicks=clicks,
                        conversions=conversions, orders=orders,
                        commission=commission, roi=roi,
                    )
                    db.add(ss)
                else:
                    ss.views, ss.likes, ss.comments = views, likes, comments
                    ss.favorites, ss.clicks = favorites, clicks
                    ss.conversions, ss.orders = conversions, orders
                    ss.commission, ss.roi = commission, roi
                updated += 1
            db.commit()
        logger.success(f"已刷新 {updated} 条记录的统计")
        return updated

    def fetch_external_stats(self, platform: str, rec: PublishRecord) -> Optional[Dict[str, Any]]:
        """
        【外部数据 hook】
        你可以在这里：
          - 打开创作者后台，读取该条内容的发布后数据
          - 调用联盟 OpenAPI 读取订单与佣金
          - 或者从第三方统计平台抓取

        返回 dict 示例：{"views":1234,"likes":45,"comments":3,"clicks":20,"conversions":2,"orders":2,"commission":19.9,"roi":1.8}
        """
        return None

    @staticmethod
    def _guess_product_id(db, rec: PublishRecord) -> Optional[int]:
        if rec.product_id:
            return rec.product_id
        # 通过 content_id 反向查
        if rec.content_id:
            c = db.query(Content).filter(Content.id == rec.content_id).first()
            if c:
                return c.product_id
        return None

    # ---------- 排行榜 ----------
    def get_rankings(self, limit: int = 20) -> Dict[str, Any]:
        with get_db() as db:
            # 爆品榜（按佣金）
            products = db.query(Product).all()
            # 每个产品汇总 sales_stats
            prod_rows = []
            for p in products:
                rows = db.query(SalesStats).filter(SalesStats.product_id == p.id).all()
                total_commission = sum(r.commission or 0 for r in rows)
                total_views = sum(r.views or 0 for r in rows)
                total_likes = sum(r.likes or 0 for r in rows)
                total_orders = sum(r.orders or 0 for r in rows)
                prod_rows.append({
                    "product_id": p.id,
                    "title": p.title[:30],
                    "commission": round(total_commission, 2),
                    "views": total_views,
                    "likes": total_likes,
                    "orders": total_orders,
                    "score": round(total_commission * 0.6 + total_views * 0.001 + total_likes * 0.05, 2),
                })
            prod_rows.sort(key=lambda x: x["score"], reverse=True)

            # 内容榜（按互动 = likes + comments * 3 + favorites * 2）
            contents = db.query(Content).all()
            content_rows = []
            for c in contents:
                recs = db.query(PublishRecord).filter(PublishRecord.content_id == c.id).all()
                views = sum(int((r.stats or {}).get("views") or 0) for r in recs)
                likes = sum(int((r.stats or {}).get("likes") or 0) for r in recs)
                comments = sum(int((r.stats or {}).get("comments") or 0) for r in recs)
                favorites = sum(int((r.stats or {}).get("favorites") or 0) for r in recs)
                content_rows.append({
                    "content_id": c.id,
                    "product_id": c.product_id,
                    "title": (c.title or "")[:30],
                    "platform": c.platform,
                    "content_type": c.content_type,
                    "views": views, "likes": likes,
                    "comments": comments, "favorites": favorites,
                    "engagement": likes + comments * 3 + favorites * 2,
                })
            content_rows.sort(key=lambda x: x["engagement"], reverse=True)

            # 账号榜
            accs = db.query(Account).all()
            acc_rows = []
            for a in accs:
                recs = db.query(PublishRecord).filter(PublishRecord.account_id == a.id).all()
                total_views = sum(int((r.stats or {}).get("views") or 0) for r in recs)
                total_commission = sum(float((r.stats or {}).get("commission") or 0) for r in recs)
                acc_rows.append({
                    "account_id": a.id,
                    "account_name": a.account_name,
                    "platform": a.platform,
                    "publish_count": len(recs),
                    "total_views": total_views,
                    "total_commission": round(total_commission, 2),
                })
            acc_rows.sort(key=lambda x: x["total_commission"], reverse=True)

            # 佣金榜（同爆品榜排序，按佣金纯字段）
            commission_rows = sorted(
                [{
                    "product_id": r["product_id"],
                    "title": r["title"],
                    "commission": r["commission"],
                    "orders": r["orders"],
                } for r in prod_rows],
                key=lambda x: x["commission"], reverse=True,
            )

            return {
                "top_products": prod_rows[:limit],
                "top_contents": content_rows[:limit],
                "top_accounts": acc_rows[:limit],
                "top_commission": commission_rows[:limit],
            }

    def print_report(self, limit: int = 15) -> None:
        ranks = self.get_rankings(limit=limit)
        print("\n========== 营销日报：排行榜 ==========\n")

        print("🔥 爆品榜（综合得分 = 佣金*0.6 + 播放*0.001 + 点赞*0.05）")
        for i, r in enumerate(ranks["top_products"][:10], 1):
            print(f"  {i:>2}. {r['title']:<30} ¥{r['commission']:>8}  播放{r['views']}  点赞{r['likes']}")

        print("\n📝 内容榜（互动 = 点赞 + 评论*3 + 收藏*2）")
        for i, r in enumerate(ranks["top_contents"][:10], 1):
            print(f"  {i:>2}. [{r['platform']}/{r['content_type']}] {r['title']:<30} 互动{r['engagement']}")

        print("\n👤 账号榜（按佣金）")
        for i, r in enumerate(ranks["top_accounts"][:10], 1):
            print(f"  {i:>2}. {r['account_name']:<20} 发布{r['publish_count']:>3}条  ¥{r['total_commission']:>8}")

        print("\n💰 佣金榜")
        for i, r in enumerate(ranks["top_commission"][:10], 1):
            print(f"  {i:>2}. {r['title']:<30} ¥{r['commission']:>8}  订单{r['orders']}")

        print("")


def run_dashboard_report(limit: int = 20) -> Dict[str, Any]:
    d = Dashboard()
    d.refresh_today()
    d.print_report(limit=limit)
    return d.get_rankings(limit=limit)
