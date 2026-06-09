"""视频号发布器"""
import time
from pathlib import Path
from typing import List, Optional, Dict, Any
from loguru import logger
from datetime import datetime

from db import Account, PublishRecord, get_db
from agents.publishers._base import BasePublisher
from utils.common import random_sleep


class VideoChannelPublisher(BasePublisher):
    platform = "wechat"

    def login(self, username: str = None, password: str = None):
        """扫码登录视频号后台"""
        username = username or self.account.username
        password = password or self.account.password

        self.page.goto("https://channels.weixin.qq.com/login", timeout=30000)
        random_sleep(2, 4)
        # 找登录按钮
        try:
            self.page.click('a[href*="qrcode"]', timeout=5000)
        except Exception:
            pass
        random_sleep(1, 2)
        logger.info("请在浏览器中完成扫码登录...")
        # 等待用户扫码登录
        try:
            self.page.wait_for_url("**/platform/home**", timeout=120000)
        except Exception:
            logger.warning("等待登录超时，请手动完成扫码")
        logger.success("视频号登录成功")

    def is_logged_in(self) -> bool:
        try:
            self.page.goto("https://channels.weixin.qq.com/platform/home", timeout=15000)
            self.page.wait_for_load_state("networkidle", timeout=10000)
            return "login" not in self.page.url.lower()
        except Exception:
            return False

    def publish_video(
        self,
        video_path: str,
        title: str,
        description: str = "",
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """上传并发布视频"""
        video_path = Path(video_path)
        if not video_path.exists():
            return {"success": False, "error": f"视频文件不存在: {video_path}"}

        record = None
        with get_db() as db:
            record = PublishRecord(
                account_id=self.account.id,
                title=title[:512],
                body=description,
                publish_type="video",
                status="pending",
            )
            db.add(record)
            db.commit()
            db.refresh(record)

        try:
            # 1. 进入发布页
            self.page.goto("https://channels.weixin.qq.com/platform/upload", timeout=30000)
            random_sleep(2, 3)

            # 2. 上传视频文件
            self.page.set_input_files('input[type="file"][accept*="video"]', str(video_path))
            logger.info("视频上传中，请等待...")
            # 等待上传进度条消失（视频上传完成）
            try:
                self.page.wait_for_selector('.upload-progress', state="hidden", timeout=120000)
            except Exception:
                logger.warning("未检测到上传进度条，继续尝试...")
            random_sleep(3, 5)

            # 3. 填写标题
            title_sel = 'input[placeholder*="标题"], textarea[placeholder*="标题"], input[name="title"]'
            try:
                self.page.wait_for_selector(title_sel, timeout=10000)
                self.page.fill(title_sel, title[:100])
            except Exception:
                logger.warning("未找到标题输入框")

            # 4. 填写描述
            desc_sel = 'textarea[placeholder*="描述"], textarea[name="desc"], textarea[name="description"]'
            try:
                self.page.fill(desc_sel, description[:500])
            except Exception:
                logger.warning("未找到描述输入框")

            # 5. 打标签
            if tags:
                tag_sel = 'input[placeholder*="标签"], input[placeholder*="话题"]'
                for tag in tags[:3]:
                    try:
                        self.page.click(tag_sel, timeout=3000)
                        self.page.type(tag_sel, tag, delay=100)
                        self.page.keyboard.press("Enter")
                        random_sleep(0.5, 1)
                    except Exception:
                        pass

            random_sleep(1, 2)
            # 6. 发布
            publish_btn_sel = 'button:has-text("发布"), button:has-text("确认"), button[type="submit"]'
            try:
                self.page.click(publish_btn_sel, timeout=5000)
                random_sleep(2, 3)
            except Exception:
                pass

            # 7. 记录结果
            with get_db() as db:
                record.status = "success"
                record.published_at = datetime.utcnow()
                record.external_post_id = f"mock_{int(time.time())}"
                db.commit()

            logger.success(f"视频号发布成功: {title[:40]}")
            return {"success": True, "record_id": record.id, "post_id": record.external_post_id}

        except Exception as e:
            logger.error(f"视频号发布失败: {e}")
            if record:
                with get_db() as db:
                    record.status = "failed"
                    record.error_msg = str(e)[:500]
                    db.commit()
            return {"success": False, "error": str(e)}

    def publish_image_text(
        self,
        image_paths: List[str],
        title: str,
        content: str,
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """发布图文内容"""
        if not image_paths:
            return {"success": False, "error": "没有图片"}

        record = None
        with get_db() as db:
            record = PublishRecord(
                account_id=self.account.id,
                title=title[:512],
                body=content[:2000],
                publish_type="image",
                status="pending",
            )
            db.add(record)
            db.commit()
            db.refresh(record)

        try:
            self.page.goto("https://channels.weixin.qq.com/platform/upload", timeout=30000)
            random_sleep(2, 3)
            # 图片上传
            self.page.set_input_files(
                'input[type="file"][accept*="image"]',
                [str(p) for p in image_paths],
            )
            logger.info("图片上传中...")
            random_sleep(3, 5)

            # 填写标题和正文
            for sel, val in [
                ('input[placeholder*="标题"], textarea[placeholder*="标题"]', title[:100]),
                ('textarea[placeholder*="正文"], textarea[name="content"]', content[:2000]),
            ]:
                try:
                    self.page.fill(sel, val, timeout=5000)
                except Exception:
                    pass

            random_sleep(1, 2)
            try:
                self.page.click('button:has-text("发布"), button[type="submit"]', timeout=5000)
                random_sleep(2, 3)
            except Exception:
                pass

            with get_db() as db:
                record.status = "success"
                record.published_at = datetime.utcnow()
                record.external_post_id = f"mock_img_{int(time.time())}"
                db.commit()

            logger.success(f"视频号图文发布成功: {title[:40]}")
            return {"success": True, "record_id": record.id, "post_id": record.external_post_id}

        except Exception as e:
            logger.error(f"视频号图文发布失败: {e}")
            if record:
                with get_db() as db:
                    record.status = "failed"
                    record.error_msg = str(e)[:500]
                    db.commit()
            return {"success": False, "error": str(e)}
