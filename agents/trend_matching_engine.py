"""Agent 3: 趋势匹配引擎
基于热点话题与商品信息，快速生成热点-商品配对，并可选使用 LLM 二次确认与生成推荐话术"""
import math
import re
from typing import List, Dict, Any, Optional, Tuple
from loguru import logger

from db import Product, HotTopic, ProductAnalysis, get_db
from agents.llm import get_client, prompts


class TrendMatcher:
    def __init__(self):
        self.llm = None

    # -------------------- 工具方法 --------------------

    def _normalize(self, text: Optional[str]) -> str:
        if not text:
            return ""
        return text.strip().lower()

    def _tokenize_keyword(self, keyword: str) -> List[str]:
        """将热点关键词拆分为匹配 token，用于包含式命中检测"""
        kw = self._normalize(keyword)
        if not kw:
            return []
        tokens = [kw]
        for sub in re.split(r"[｜|/,，。、\s_-]+", kw):
            sub = sub.strip()
            if sub and sub != kw and len(sub) >= 2:
                tokens.append(sub)
        return list(dict.fromkeys(tokens))

    def _get_selling_points(self, product: Product) -> List[str]:
        """从 ProductAnalysis 或 extra 中取卖点"""
        analysis = getattr(product, "analysis", None)
        if analysis and getattr(analysis, "selling_points", None):
            return list(analysis.selling_points)
        extra = product.extra or {}
        sp = extra.get("selling_points")
        if isinstance(sp, list):
            return [str(x) for x in sp]
        if isinstance(sp, str):
            return [sp]
        return []

    def _get_use_scenarios(self, product: Product) -> List[str]:
        analysis = getattr(product, "analysis", None)
        if analysis and getattr(analysis, "use_scenarios", None):
            return list(analysis.use_scenarios)
        extra = product.extra or {}
        sc = extra.get("use_scenarios")
        if isinstance(sc, list):
            return [str(x) for x in sc]
        return []

    # -------------------- 打分核心 --------------------

    def _match_one(
        self,
        topic: HotTopic,
        product: Product,
    ) -> Tuple[float, List[str]]:
        """对一个 (topic, product) 计算得分与命中 token 列表"""
        hot_keyword = self._normalize(topic.keyword)
        hot_category = self._normalize(topic.category)
        kw_tokens = self._tokenize_keyword(topic.keyword)

        title_norm = self._normalize(product.title)
        category_norm = self._normalize(product.category)
        selling_points = [self._normalize(x) for x in self._get_selling_points(product)]
        use_scenarios = [self._normalize(x) for x in self._get_use_scenarios(product)]

        product_text_pool = " ".join([title_norm, category_norm] + selling_points + use_scenarios)

        matched_tokens: List[str] = []
        keyword_hit_count = 0

        for token in kw_tokens:
            if not token:
                continue
            if token in product_text_pool:
                matched_tokens.append(token)
                keyword_hit_count += 1

        if not matched_tokens and hot_keyword and hot_keyword in product_text_pool:
            matched_tokens.append(hot_keyword)
            keyword_hit_count += 1

        category_match = 0
        if hot_category and category_norm and (
            hot_category == category_norm
            or hot_category in category_norm
            or category_norm in hot_category
            or (hot_category and hot_category in product_text_pool)
        ):
            category_match = 1
        if category_match == 0 and hot_keyword and category_norm and hot_keyword in category_norm:
            category_match = 1

        selling_points_hit = 0
        for sp in selling_points:
            if not sp:
                continue
            if hot_keyword and hot_keyword in sp:
                selling_points_hit += 1
                continue
            for token in kw_tokens:
                if token and token in sp:
                    selling_points_hit += 1
                    break

        base_score = keyword_hit_count * 3 + category_match * 2 + selling_points_hit * 1
        heat_value = float(topic.heat_value or 0.0)
        score = base_score * math.log(heat_value + 1.0)

        return round(score, 4), matched_tokens

    def _recommend_angle(
        self,
        topic: HotTopic,
        product: Product,
        matched_tokens: List[str],
    ) -> str:
        """无 LLM 时，基于命中内容生成一个推荐角度"""
        keyword = topic.keyword or "热点"
        if matched_tokens:
            token_str = "、".join(matched_tokens[:3])
            return f"紧扣「{keyword}」热点，突出商品在 {token_str} 上的契合度"
        if topic.category and topic.category == product.category:
            return f"同属「{topic.category}」类目，借势「{keyword}」热度自然种草"
        return f"借势「{keyword}」热点，主打「{product.title[:20]}」的实用价值"

    def _default_reason(
        self,
        topic: HotTopic,
        product: Product,
        matched_tokens: List[str],
    ) -> str:
        parts = []
        if matched_tokens:
            parts.append(f"关键词命中 {len(matched_tokens)} 处：{','.join(matched_tokens)}")
        if topic.category and product.category and topic.category == product.category:
            parts.append(f"类目一致：{topic.category}")
        parts.append(f"热点热度值 {topic.heat_value}")
        return "；".join(parts)

    # -------------------- LLM 二次确认 --------------------

    def _llm_enrich(
        self,
        match_items: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        if not match_items:
            return match_items

        client = get_client()
        batch = []
        for item in match_items:
            batch.append({
                "product_title": item.get("title"),
                "product_category": item.get("category"),
                "hot_keyword": item.get("hot_keyword"),
                "hot_category": item.get("hot_category", ""),
                "heat_value": item.get("heat_value"),
                "score": item.get("score"),
                "matched_tokens": item.get("matched_tokens", []),
            })

        user_prompt = prompts.PROMPT_MATCH_TREND.format(
            pair_list=str(batch)
        )
        try:
            result = client.chat_json(prompts.SYSTEM_MATCHER, user_prompt)
        except Exception as e:
            logger.error(f"LLM 趋势匹配二次确认失败: {e}")
            return match_items

        if not isinstance(result, dict) and not isinstance(result, list):
            return match_items

        enriched_list = result.get("matches") if isinstance(result, dict) else result
        if not isinstance(enriched_list, list):
            return match_items

        by_key = {}
        for idx, item in enumerate(match_items):
            key = (item.get("product_id"), item.get("hot_keyword"))
            by_key[key] = idx

        for row in enriched_list:
            if not isinstance(row, dict):
                continue
            pid = row.get("product_id")
            hk = row.get("hot_keyword")
            idx = by_key.get((pid, hk))
            if idx is None:
                for i, it in enumerate(match_items):
                    if it.get("product_id") == pid or it.get("hot_keyword") == hk:
                        idx = i
                        break
            if idx is None:
                continue
            match_items[idx]["match_reason"] = row.get("match_reason") or match_items[idx]["match_reason"]
            match_items[idx]["recommended_angle"] = row.get("recommended_angle") or match_items[idx]["recommended_angle"]

        return match_items

    # -------------------- 主方法 --------------------

    def match_products(
        self,
        topics: List[HotTopic],
        products: List[Product],
        top_n: int = 10,
        use_llm: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        对 (topics × products) 进行打分匹配，返回 top-N 配对列表
        """
        if not topics or not products:
            logger.warning("topics 或 products 为空，跳过匹配")
            return []

        all_pairs: List[Dict[str, Any]] = []

        for topic in topics:
            for product in products:
                score, matched_tokens = self._match_one(topic, product)
                if score <= 0:
                    continue
                all_pairs.append({
                    "product_id": product.id,
                    "title": product.title,
                    "category": product.category or "",
                    "platform": product.platform or "",
                    "price": product.price,
                    "commission_rate": product.commission_rate,
                    "sales_count": product.sales_count,
                    "hot_keyword": topic.keyword,
                    "hot_category": topic.category or "",
                    "heat_value": topic.heat_value,
                    "heat_growth": topic.heat_growth,
                    "score": score,
                    "match_reason": self._default_reason(topic, product, matched_tokens),
                    "matched_tokens": matched_tokens,
                    "recommended_angle": self._recommend_angle(topic, product, matched_tokens),
                })

        all_pairs.sort(key=lambda x: x["score"], reverse=True)
        top_items = all_pairs[:top_n]

        if use_llm:
            try:
                top_items = self._llm_enrich(top_items)
            except Exception as e:
                logger.warning(f"LLM 二次确认失败，回退到规则匹配: {e}")

        logger.info(f"趋势匹配完成: {len(topics)} 热点 × {len(products)} 商品 → 选出 {len(top_items)} 对")
        return top_items

    # -------------------- 写入 DB --------------------

    def save_to_product(self, matches: List[Dict[str, Any]]) -> None:
        """把 last_matched_topics 写入 Product.extra"""
        by_product: Dict[int, List[Dict[str, Any]]] = {}
        for m in matches:
            pid = m.get("product_id")
            if not pid:
                continue
            by_product.setdefault(pid, []).append({
                "hot_keyword": m.get("hot_keyword"),
                "category": m.get("hot_category"),
                "heat_value": m.get("heat_value"),
                "score": m.get("score"),
                "match_reason": m.get("match_reason"),
                "recommended_angle": m.get("recommended_angle"),
                "matched_tokens": m.get("matched_tokens", []),
            })

        with get_db() as db:
            for pid, topic_list in by_product.items():
                product = db.query(Product).filter(Product.id == pid).first()
                if not product:
                    continue
                extra = product.extra or {}
                extra["last_matched_topics"] = topic_list
                extra["last_matched_count"] = len(topic_list)
                product.extra = extra
            db.commit()
            logger.info(f"已把匹配结果写入 {len(by_product)} 个商品的 extra.last_matched_topics")

    def match_from_db(self, top_n: int = 20, use_llm: bool = False) -> List[Dict[str, Any]]:
        """直接从数据库读当天热点和商品做匹配"""
        from datetime import datetime, timedelta
        with get_db() as db:
            today = datetime.utcnow() - timedelta(days=1)
            topics = (
                db.query(HotTopic)
                .filter(HotTopic.created_at >= today)
                .order_by(HotTopic.heat_value.desc())
                .limit(50)
                .all()
            )
            products = (
                db.query(Product)
                .order_by(Product.id.desc())
                .limit(max(top_n, 10))
                .all()
            )
        logger.info(f"match_from_db: {len(topics)} 条热点 × {len(products)} 个商品")
        if not topics or not products:
            return []
        matches = self.match_products(topics, products, top_n=top_n, use_llm=use_llm)
        self.save_to_product(matches)
        return matches
