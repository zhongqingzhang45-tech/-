"""抖音发布器
- 扫码登录（保留 cookies）
- 发布图文笔记
- 发布视频
- 支持通过 cookies 文件免扫码
"""
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional

from loguru import logger

from config import Config

DOUYIN_CREATOR = "https://creator.douyin.com/"
DOUYIN_PUBLISH = "https://creator.douyin.com/content/manage/publish"
DOUYIN_MEDIA = "https://www.douyin.com/"


class DouyinPublisher:
    def __init__(self, headless: bool = False, cookies_file: Optional[str] = None):
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise RuntimeError("需要安装 playwright: pip install playwright && playwright install chromium")
        self._pw_cls = sync_playwright
        self.headless = headless
        self.cookies_file = Path(cookies_file) if cookies_file else (Config.DATA_DIR / "cookies_douyin.json")

    def __enter__(self):
        self._pw = self._pw_cls().start()
        self._browser = self._pw.chromium.launch(channel="chrome", headless=self.headless)
        self._context = self._browser.new_context(viewport={"width": 1440, "height": 900})
        self.page = self._context.new_page()
        # 加载已有 cookies
        if self.cookies_file.exists():
            try:
                cookies = json.loads(self.cookies_file.read_text(encoding="utf-8"))
                if isinstance(cookies, list):
                    self._context.add_cookies(cookies)
                    logger.info(f"已加载抖音 cookies: {len(cookies)} 条")
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
                logger.info(f"已保存抖音 cookies -> {self.cookies_file}")
                self._context.close()
        finally:
            if self._browser:
                self._browser.close()
            if self._pw:
                self._pw.stop()

    def login(self, wait_seconds: int = 180) -> bool:
        self.page.goto(DOUYIN_CREATOR, wait_until="domcontentloaded")
        time.sleep(3)
        url = self.page.url
        # 若已登录，URL 中应包含 creator 且无 login 字段
        if "creator" in url and "login" not in url:
            logger.success("已检测到登录态")
            return True
        logger.info("等待扫码登录抖音创作者后台 ...")
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

    def _fill_creator_editor(self, title: str, body: str, tags: List[str]) -> bool:
        """在创作者后台编辑页填写标题/正文/话题"""
        try:
            # 抖音发布页面元素选择器可能随时变化，这里采用通用文字匹配 + input
            # 标题
            title_input = self.page.locator("textarea,input").first
            if title_input.count() > 0:
                title_input.fill(title[:30])
            # 正文（描述）
            desc_input = self.page.locator("textarea").nth(1) if self.page.locator("textarea").count() > 1 else None
            if desc_input:
                desc_input.fill(f"{body[:400]}\n\n" + " ".join(f"#{t}" for t in tags[:3]))
            return True
        except Exception as e:
            logger.warning(f"填写抖音编辑器失败: {e}")
            return False

    def publish_image_note(self, title: str, body: str,
                            image_paths: List[str],
                            tags: Optional[List[str]] = None) -> Dict[str, Any]:
        """发布图文笔记"""
        tags = tags or []
        try:
            self.page.goto(DOUYIN_PUBLISH, wait_until="domcontentloaded")
            time.sleep(4)
            # 上传图片
            for img in image_paths[:9]:
                try:
                    with self.page.expect_file_chooser(timeout=15000) as fc_info:
                        # 点击 "上传图片" 类按钮
                        self.page.locator("button,input[type='file']").filter(
                            has_text="图片"
                        ).click() if self.page.locator("button").filter(has_text="图片").count() > 0 \
                            else self.page.locator("input[type='file']").first.click()
                    fc_info.value.set_files(img)
                    time.sleep(2)
                except Exception as e:
                    logger.warning(f"上传图片失败 {img}: {e}")
                    continue
            # 填写标题/正文
            self._fill_creator_editor(title, body, tags)
            # 点击发布（这里用可配置的文案匹配，且不自动点击，避免误发）
            logger.info("内容已准备好，你可以在浏览器中检查后点击 '发布' 按钮。若需自动点击，请将 AUTO_PUBLISH=1。")
            if Config.get_env_int("AUTO_PUBLISH", 0) == 1:
                try:
                    self.page.locator("button:has-text('发布'),button:has-text('确认发布')").first.click()
                    time.sleep(3)
                except Exception as e:
                    logger.warning(f"自动点击发布失败: {e}")
            return {"success": True, "title": title, "images": len(image_paths)}
        except Exception as e:
            logger.error(f"发布图文失败: {e}")
            return {"success": False, "error": str(e)}

    def publish_video(self, title: str, body: str, video_path: str,
                       tags: Optional[List[str]] = None) -> Dict[str, Any]:
        """发布视频（相似流程，先上传视频再填文案）"""
        tags = tags or []
        try:
            self.page.goto(DOUYIN_PUBLISH, wait_until="domcontentloaded")
            time.sleep(4)
            with self.page.expect_file_chooser(timeout=20000) as fc_info:
                self.page.locator("input[type='file']").first.click()
            fc_info.value.set_files(video_path)
            time.sleep(6)  # 上传+转码
            self._fill_creator_editor(title, body, tags)
            logger.info("视频上传完成并已填写内容，请在浏览器中检查后点击发布。")
            if Config.get_env_int("AUTO_PUBLISH", 0) == 1:
                try:
                    self.page.locator("button:has-text('发布'),button:has-text('确认发布')").first.click()
                except Exception as e:
                    logger.warning(f"自动点击发布失败: {e}")
            return {"success": True, "title": title, "video": video_path}
        except Exception as e:
            logger.error(f"发布视频失败: {e}")
            return {"success": False, "error": str(e)}
