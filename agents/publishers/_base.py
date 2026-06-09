"""Publisher 基类：封装 Playwright 浏览器上下文管理"""
from pathlib import Path
from typing import Optional
from loguru import logger

from config import Config
from db import Account
from utils.common import ensure_dir


class BasePublisher:
    platform: str = ""

    def __init__(self, account: Account):
        self.account = account
        self.context = None
        self.page = None
        self._browser = None

    def _make_context_dir(self) -> Path:
        d = ensure_dir(Config.DATA_DIR / "browser_profiles" / f"{self.platform}_{self.account.id}")
        return d

    def launch_sync(self, headless: bool = False):
        """同步启动 Chromium（用 playwright.sync_api）"""
        from playwright.sync_api import sync_playwright
        pw = sync_playwright().start()
        self._browser = pw.chromium.launch_persistent_context(
            user_data_dir=str(self._make_context_dir()),
            headless=headless,
            channel="chrome",
            viewport={"width": 1280, "height": 800},
        )
        self.context = self._browser
        self.page = self._browser.pages[0] if self._browser.pages else self._browser.new_page()
        logger.info(f"浏览器已启动 (headless={headless})")

    def close_sync(self):
        if self._browser:
            try:
                self._browser.close()
            except Exception:
                pass
            self._browser = None
            self.context = None
            self.page = None
            logger.info("浏览器已关闭")

    def save_cookies(self, path: Optional[Path] = None) -> bool:
        if not self.context:
            return False
        path = path or Path(Config.DATA_DIR / f"cookies_{self.platform}_{self.account.id}.json")
        try:
            cookies = self.context.cookies()
            import json
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(cookies, ensure_ascii=False, indent=2), encoding="utf-8")
            logger.info(f"Cookies 已保存 -> {path}")
            return True
        except Exception as e:
            logger.error(f"保存 cookies 失败: {e}")
            return False

    def load_cookies(self, path: Optional[Path] = None) -> bool:
        path = path or Path(Config.DATA_DIR / f"cookies_{self.platform}_{self.account.id}.json")
        if not path.exists():
            return False
        try:
            import json
            cookies = json.loads(path.read_text(encoding="utf-8"))
            if self.context:
                for c in cookies:
                    if "sameSite" in c:
                        del c["sameSite"]
                self.context.add_cookies(cookies)
                logger.info(f"Cookies 已加载 -> {path}")
                return True
        except Exception as e:
            logger.error(f"加载 cookies 失败: {e}")
        return False

    def wait_and_click(self, selector: str, timeout: float = 10):
        self.page.wait_for_selector(selector, timeout=int(timeout * 1000))
        self.page.click(selector)

    def wait_and_fill(self, selector: str, value: str, timeout: float = 10):
        self.page.wait_for_selector(selector, timeout=int(timeout * 1000))
        self.page.fill(selector, value)
