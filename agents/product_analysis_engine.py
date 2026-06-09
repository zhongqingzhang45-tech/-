"""Agent 4: 卖点分析引擎
输入商品信息，输出痛点/卖点/场景等结构化数据"""
from typing import Dict, Any, Optional
from loguru import logger

from db import Product, ProductAnalysis, get_db
from agents.llm import get_client, prompts


class AnalysisEngine:
    def __init__(self):
        self.llm = get_client()

    def analyze_product(self, product: Product) -> Optional[ProductAnalysis]:
        """对一个商品的分析结果写入数据库并返回"""
        with get_db() as db:
            existing = db.query(ProductAnalysis).filter(
                ProductAnalysis.product_id == product.id
            ).first()
            if existing:
                logger.info(f"[{product.title[:30}... 已有分析结果，跳过")
                return existing

            extra = product.extra or {}
            extra_str = "\n".join(f"{k}: {v}" for k, v in extra.items()) or "（无额外信息）

            user_prompt = prompts.PROMPT_ANALYZE_PRODUCT.format(
                title=product.title,
                price=product.price,
                category=product.category or "未分类",
                platform=product.platform or "通用",
                extra_info=extra_str,
            )
            logger.info(f"开始分析商品: {product.title[:40]}")
            result = self.llm.chat_json(prompts.SYSTEM_ANALYST, user_prompt)

            if not result:
                logger.error(f"商品分析失败")
                return None

            analysis = ProductAnalysis(
                product_id=product.id,
                pain_points=result.get("pain_points", []),
                selling_points=result.get("selling_points", []),
                use_scenarios=result.get("use_scenarios", []),
                target_audience=result.get("target_audience", []),
                buy_reasons=result.get("buy_reasons", []),
                advantages=result.get("advantages", []),
                emotion_triggers=result.get("emotion_triggers", []),
                raw_response=str(result),
            )
            db.add(analysis)
            db.commit()
            db.refresh(analysis)
            logger.success(f"商品分析完成: {len(analysis.selling_points or [])[:3]}个卖点")
            return analysis

    def to_dict(self, analysis: Optional[ProductAnalysis]) -> Dict[str, Any]:
        if not analysis:
            return {}
        return {
            "pain_points": analysis.pain_points or [],
            "selling_points": analysis.selling_points or [],
            "use_scenarios": analysis.use_scenarios or [],
            "target_audience": analysis.target_audience or [],
            "buy_reasons": analysis.buy_reasons or [],
            "advantages": analysis.advantages or [],
            "emotion_triggers": analysis.emotion_triggers or [],
        }
