"""Agent 5: 内容工厂
批量生成图文/文案/脚本"""
from typing import List, Dict, Any, Optional
from loguru import logger

from db import Product, ProductAnalysis, Content, get_db
from agents.llm import get_client, prompts
from agents.product_analysis_engine import AnalysisEngine


CONTENT_TYPES = ["image_text", "copywriting", "script", "review", "plot_script", "compare"]
PLATFORMS = ["xhs", "douyin", "wechat", "kuaishou"]


class ContentFactory:
    def __init__(self):
        self.llm = get_client()
        self.analysis_engine = AnalysisEngine()

    # ---- 小红书种草文 ----
    def generate_xhs_post(self, product: Product, analysis: Optional[ProductAnalysis] = None) -> Optional[Content]:
        analysis = analysis or self.analysis_engine.analyze_product(product)
        if not analysis:
            return None
        a = self.analysis_engine.to_dict(analysis)

        user_prompt = prompts.PROMPT_WRITE_XHS.format(
            title=product.title,
            price=product.price,
            category=product.category or "好物",
            selling_points="、".join(a["selling_points"][:5]),
            pain_points="、".join(a["pain_points"][:5]),
            use_scenarios="、".join(a["use_scenarios"][:3]),
            target_audience="、".join(a["target_audience"][:3]),
            emotion_triggers="、".join(a["emotion_triggers"][:3]),
        )
        logger.info(f"[内容工厂: 生成小红书文案 -> {product.title[:30]}")
        result = self.llm.chat_json(prompts.SYSTEM_WRITER_XHS, user_prompt)
        if not result:
            return None

        content = Content(
            product_id=product.id,
            content_type="image_text",
            platform="xhs",
            title=result.get("title", ""),
            body=result.get("body", ""),
            call_to_action=result.get("call_to_action", ""),
            tags=result.get("tags", []),
            cart_text=result.get("cart_text", ""),
            raw_prompt=user_prompt,
            raw_response=str(result),
            status="draft",
        )
        with get_db() as db:
            db.add(content)
            db.commit()
            db.refresh(content)
        logger.success(f"小红书文案生成完成: {content.title or '(无标题)")
        return content

    # ---- 短视频脚本 ----
    def generate_video_script(self, product: Product, analysis: Optional[ProductAnalysis] = None,
                              duration: int = 30) -> Optional[Dict[str, Any]]:
        """返回脚本 dict 并写入 Content 表"""
        analysis = analysis or self.analysis_engine.analyze_product(product)
        if not analysis:
            return None
        a = self.analysis_engine.to_dict(analysis)

        user_prompt = prompts.PROMPT_WRITE_VIDEO_SCRIPT.format(
            duration=duration,
            title=product.title,
            selling_points="、".join(a["selling_points"][:5]),
            pain_points="、".join(a["pain_points"][:3]),
            use_scenarios="、".join(a["use_scenarios"][:3]),
        )
        logger.info(f"[内容工厂] 生成 {duration}s 短视频脚本 -> {product.title[:30]}")
        result = self.llm.chat_json(prompts.SYSTEM_WRITER_VIDEO, user_prompt)
        if not result or "script" not in result:
            return None

        script_lines = result.get("script", [])
        total_duration = result.get("total_duration", duration)
        flat_text = "\n".join(
            f"{item.get('line', '')}" for item in script_lines
        )

        content = Content(
            product_id=product.id,
            content_type="script",
            platform="wechat",
            title=f"{product.title[:20]} - {duration}s口播",
            body=flat_text,
            call_to_action="点击小黄车，好物带回家！",
            tags=["好物推荐", "种草", product.category or "购物分享"],
            cart_text="戳小黄车下单",
            raw_prompt=user_prompt,
            raw_response=str(result),
            status="draft",
        )
        with get_db() as db:
            db.add(content)
            db.commit()
            db.refresh(content)

        return {
            "content_id": content.id,
            "lines": script_lines,
            "total_duration": total_duration,
            "text": flat_text,
        }

    def list_contents(self, product_id: int = None, platform: str = None,
                       content_type: str = None, limit: int = 20) -> List[Content]:
        with get_db() as db:
            q = db.query(Content)
            if product_id:
                q = q.filter(Content.product_id == product_id)
            if platform:
                q = q.filter(Content.platform == platform)
            if content_type:
                q = q.filter(Content.content_type == content_type)
            return q.order_by(Content.created_at.desc()).limit(limit).all()
