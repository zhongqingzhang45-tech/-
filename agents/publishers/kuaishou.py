"""快手发布器（与抖音发布器结构一致）
- 登录态复用 cookies
- 支持图文/视频发布
"""
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional

from loguru import logger

from config import Config

KS_CREATOR = "https://creator.kuaishou.com/"
KS_PUBLISH = "https://creator.kuaishou.com/rest/n/creator/photo/publish"
KS_EDIT = "https://creator.kuaishou.com/"


class KuaishouPublisher:
    def __init__(self, headless: bool = False, cookies_file: Optional[str] = None):
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise RuntimeError("需要安装 playwright: pip install playwright && playwright install chromium")
        self._pw_cls = sync_playwright
        self.headless = headless
        self.cookies_file = Path(cookies_file) if cookies_file else (Config.DATA_DIR / "cookies_kuaishou.json")

    def __enter__(self):
        self._pw = self._pw_cls().start()
        self._browser = self._pw.chromium.launch(channel="chrome", headless=self.headless)
        self._context = self._browser.new_context(viewport={"width": 1440, "height": 900})
        self.page = self._context.new_page()
        if self.cookies_file.exists():
            try:
                cookies = json.loads(self.cookies_file.read_text(encoding="utf-8"))
                if isinstance(cookies, list):
                    self._context.add_cookies(cookies)
                    logger.info(f"已加载快手 cookies: {len(cookies)} 条")
            except Exception as e:
                logger.warning(f"加载 cookies 失败: {e}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            if self._context:
                cookies = self._context.cookies()
                self.cookies_file.write_text(
                    json.dumps(cookies, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                self._context.close()
        finally:
            if self._browser:
                self._browser.close()
            if self._pw:
                self._pw.stop()

    def login(self, wait_seconds: int = 180) -> bool:
        self.page.goto(KS_CREATOR, wait_until="domcontentloaded")
        time.sleep(3)
        url = self.page.url
        if "creator" in url and "login" not in url:
            logger.success("已检测到登录态")
            return True
        logger.info("等待扫码登录快手创作者中心 ...")
        try:
            self.page.wait_for_url(
                lambda u: "creator" in u and "login" not in u,
                timeout=wait_seconds * 1000,
            )
            logger.success("登录成功")
            return True
        except Exception as e:
            logger.error(f"登录等待超时: {e}")
            return False

    def publish_image_note(self, title: str, body: str,
                            image_paths: List[str],
                            tags: Optional[List[str]] = None) -> Dict[str, Any]:
        tags = tags or []
        try:
            self.page.goto(KS_EDIT, wait_until="domcontentloaded")
            time.sleep(4)
            # 上传图片
            for img in image_paths[:9]:
                try:
                    with self.page.expect_file_chooser(timeout=15000) as fc_info:
                        loc = self.page.locator("button:has-text('图片'),input[type='file']").first
                        if loc.count() > 0:
                            loc.click()
                        else:
                            self.page.locator("input[type='file']").first.click()
                    fc_info.value.set_files(img)
                    time.sleep(2)
                except Exception as e:
                    logger.warning(f"上传图片失败 {img}: {e}")
                    continue
            # 标题 + 描述
            try:
                self.page.locator("input[type='text'],textarea").first.fill(title[:30])
                self.page.locator("textarea").nth(0).fill(f"{body[:400]}\n\n" + " ".join(f"#{t}" for t in tags[:3]))
            except Exception as e:
                logger.warning(f"填写快手内容失败: {e}")
            logger.info("快手图文已准备好，请在浏览器中检查后点击发布。若设 AUTO_PUBLISH=1 会自动点击。")
            if Config.get_env_int("AUTO_PUBLISH", 0) == 1:
                try:
                    self.page.locator("button:has-text('发布')").first.click()
                except Exception:
                    pass
            return {"success": True, "title": title}
        except Exception as e:
            logger.error(f"发布图文失败: {e}")
            return {"success": False, "error": str(e)}

    def publish_video(self, title: str, body: str, video_path: str,
                       tags: Optional[List[str]] = None) -> Dict[str, Any]:
        tags = tags or []
        try:
            self.page.goto(KS_EDIT, wait_until="domcontentloaded")
            time.sleep(4)
            with self.page.expect_file_chooser(timeout=20000) as fc_info:
                self.page.locator("input[type='file']").first.click()
            fc_info.value.set_files(video_path)
            time.sleep(6)
            try:
                self.page.locator("input[type='text']").first.fill(title[:30])
                self.page.locator("textarea").nth(0).fill(f"{body[:400]}\n\n" + " ".join(f"#{t}" for t in tags[:3]))
            except Exception as e:
                logger.warning(f"填写快手视频描述失败: {e}")
            if Config.get_env_int("AUTO_PUBLISH", 0) == 1:
                try:
                    self.page.locator("button:has-text('发布')").first.click()
                except Exception:
                    pass
            return {"success": True, "title": title, "video": video_path}
        except Exception as e:
            logger.error(f"发布视频失败: {e}")
            return {"success": False, "error": str(e)}
