"""主流程编排器：串联所有 Agent"""
from typing import List, Optional, Dict, Any
from pathlib import Path
from loguru import logger

from db import Product, Content, VideoAsset, ImageAsset, Account, get_db
from agents.product_analysis_engine import AnalysisEngine
from agents.content_factory import ContentFactory
from agents.image_recomposer import ImageRecomposer
from agents.video.video_composer import VideoComposer
from agents.video.tts_engine import TTS
from agents.video.srt_generator import build_srt_from_lines, save_srt
from agents.publishers import VideoChannelPublisher
from config import Config


class MarketingPipeline:
    """
    完整链路:
    Product -> 分析 -> 文案生成 -> 图片合成 -> 视频合成 -> 发布
    """

    def __init__(self, product: Product):
        self.product = product
        self.analysis_engine = AnalysisEngine()
        self.content_factory = ContentFactory()
        self.image_recomposer = ImageRecomposer(product)
        self.video_composer = VideoComposer(product)
        self.results: Dict[str, Any] = {"product_title": product.title}

    # ---- Step 1: 商品分析 ----
    def step_analyze(self) -> bool:
        logger.info(f"[Pipeline] Step 1: 分析商品 -> {self.product.title[:30]}")
        analysis = self.analysis_engine.analyze_product(self.product)
        if not analysis:
            logger.error("商品分析失败")
            return False
        self.results["analysis"] = self.analysis_engine.to_dict(analysis)
        self.results["analysis_id"] = analysis.id
        return True

    # ---- Step 2: 批量生成文案 ----
    def step_generate_content(self, platforms: List[str] = None) -> List[Content]:
        platforms = platforms or ["xhs", "wechat"]
        contents = []
        logger.info(f"[Pipeline] Step 2: 生成文案 platforms={platforms}")
        for platform in platforms:
            if platform == "xhs":
                c = self.content_factory.generate_xhs_post(self.product)
            elif platform == "wechat":
                c = self.content_factory.generate_video_script(self.product, duration=30)
                if c:
                    self.results["video_script"] = c
                    with get_db() as db:
                        c = db.query(Content).filter(Content.id == c["content_id"]).first()
            else:
                continue
            if c:
                contents.append(c)
        self.results["contents"] = contents
        return contents

    # ---- Step 3: 下载图片素材 ----
    def step_download_images(self, max_images: int = 6) -> List[Path]:
        logger.info("[Pipeline] Step 3: 下载商品图片")
        paths = self.image_recomposer.download_assets(max_images=max_images)
        self.results["downloaded_images"] = [str(p) for p in paths]
        return paths

    # ---- Step 4: 合成图文 ----
    def step_compose_images(self, platform: str = "wechat",
                             title: str = "",
                             sell_points: Optional[List[str]] = None) -> List[Path]:
        logger.info(f"[Pipeline] Step 4: 合成 {platform} 图文")
        title = title or (self.results.get("contents", [None])[0].title
                          if self.results.get("contents") else self.product.title)
        points = sell_points or self.results.get("analysis", {}).get("selling_points", [])[:3]
        paths = self.image_recomposer.compose_for_platform(platform, title, points)
        self.results["composed_images"] = [str(p) for p in paths]
        return paths

    # ---- Step 5: 合成视频 ----
    def step_compose_video(self, duration: int = 30) -> Optional[VideoAsset]:
        logger.info(f"[Pipeline] Step 5: 合成 {duration}s 带货视频")
        script = self.results.get("video_script")
        if not script:
            script = self.content_factory.generate_video_script(self.product, duration=duration)
        if not script:
            logger.error("没有脚本，无法生成视频")
            return None
        asset = self.video_composer.compose_from_script(script, platform="wechat")
        self.results["video_asset"] = asset
        return asset

    # ---- Step 6: 发布视频号 ----
    def step_publish_video(
        self,
        account_id: int,
        video_path: Optional[str] = None,
        title: str = "",
        description: str = "",
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        logger.info("[Pipeline] Step 6: 发布视频号")
        video_path = video_path or (self.results.get("video_asset").local_path
                                    if self.results.get("video_asset") else None)
        if not video_path or not Path(video_path).exists():
            return {"success": False, "error": "视频文件不存在"}

        with get_db() as db:
            account = db.query(Account).filter(
                Account.id == account_id,
                Account.platform == "wechat"
            ).first()
            if not account:
                return {"success": False, "error": f"账号 {account_id} 不存在或不是视频号账号"}

        title = title or (self.results.get("contents", [None])[0].title
                          if self.results.get("contents") else self.product.title)
        description = description or (self.results.get("contents", [None])[0].body
                                     if self.results.get("contents") else "")
        tags = tags or (self.results.get("contents", [None])[0].tags
                        if self.results.get("contents") else [])

        pub = VideoChannelPublisher(account)
        pub.launch_sync(headless=False)
        try:
            if not pub.is_logged_in():
                pub.login()
            result = pub.publish_video(
                video_path=str(video_path),
                title=title,
                description=description,
                tags=tags,
            )
            pub.save_cookies()
            return result
        finally:
            pub.close_sync()

    # ---- 一键全流程（不含发布） ----
    def run_full(self, platforms: List[str] = None, video_duration: int = 30) -> Dict[str, Any]:
        logger.info(f"=== 开始全流程: {self.product.title[:40]} ===")
        steps = []
        steps.append(("analyze", self.step_analyze()))
        steps.append(("download_images", bool(self.step_download_images())))

        for platform in (platforms or ["wechat"]):
            self.step_compose_images(platform)

        steps.append(("generate_content", bool(self.results.get("contents"))))
        steps.append(("compose_video", bool(self.step_compose_video(duration=video_duration))))

        self.results["steps"] = dict(steps)
        logger.success(f"=== 全流程完成 === 耗时任务: {[k for k,v in steps if not v]}")
        return self.results
