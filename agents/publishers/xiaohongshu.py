"""小红书发布器
流程：扫码登录 → 发布图文笔记
"""
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger

from config import Config
from utils.common import ensure_dir

XHS_BASE = "https://www.xiaohongshu.com"
XHS_CREATOR = "https://creator.xiaohongshu.com"
XHS_PUBLISH = "https://creator.xiaohongshu.com/publish/publish?source=official"


class XiaohongshuPublisher:
    """
    小红书发布器。三种登录方式可选：

    1) user_data_dir 持久化浏览器配置（默认）—— 第一次需手动扫码，后续免登录
    2) 提供 cookies_file_path（JSON 数组，Playwright 格式）—— 程序启动时注入
    3) 提供 raw_cookie_string（"a=xxx; b=yyy"，从浏览器 DevTools 复制）—— 自动转为 Playwright cookies
    """

    def __init__(
        self,
        headless: bool = False,
        user_data_dir: Optional[str] = None,
        cookies_file_path: Optional[str] = None,
        raw_cookie_string: Optional[str] = None,
    ):
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise RuntimeError("playwright 未安装")
        self._pw_cls = sync_playwright
        self._pw = None
        self._context = None
        self.page = None
        self.headless = headless
        self.user_data_dir = user_data_dir or str(
            ensure_dir(Config.DATA_DIR / "browser_profiles" / "xiaohongshu")
        )
        self._cookies_path = Path(cookies_file_path) if cookies_file_path else (Config.DATA_DIR / "cookies_xhs.json")
        self._raw_cookie_string = raw_cookie_string

    def __enter__(self):
        self._pw = self._pw_cls().start()
        self._context = self._pw.chromium.launch_persistent_context(
            user_data_dir=self.user_data_dir,
            headless=self.headless,
            channel="chrome",
            viewport={"width": 1440, "height": 900},
        )
        self.page = self._context.pages[0] if self._context.pages else self._context.new_page()
        self.page.set_default_timeout(30000)
        logger.info(f"小红书浏览器已启动 (headless={self.headless})")

        # 注入 cookies（文件 / 原始字符串）
        loaded = self._inject_cookies_from_file() or self._inject_cookies_from_raw_string()
        if loaded:
            logger.success(f"已加载 cookies: {self._cookies_path.name}")
        return self

    # ---------- Cookie 工具 ----------
    def _inject_cookies_from_file(self) -> bool:
        """从 Playwright JSON 格式的 cookie 文件加载"""
        if not self._cookies_path or not self._cookies_path.exists():
            return False
        try:
            cookies = json.loads(self._cookies_path.read_text(encoding="utf-8"))
            if not isinstance(cookies, list) or not cookies:
                return False
            # 补全必需字段：domain / path
            for c in cookies:
                c.setdefault("domain", ".xiaohongshu.com")
                c.setdefault("path", "/")
            self._context.add_cookies(cookies)
            return True
        except Exception as e:
            logger.warning(f"加载 cookie 文件失败: {e}")
            return False

    def _inject_cookies_from_raw_string(self) -> bool:
        """把 'a=1; b=2' 这种从浏览器 DevTools 复制的 cookie 字符串注入进去"""
        if not self._raw_cookie_string:
            return False
        try:
            cookies = []
            for part in self._raw_cookie_string.split(";"):
                part = part.strip()
                if not part or "=" not in part:
                    continue
                name, value = part.split("=", 1)
                cookies.append({
                    "name": name.strip(),
                    "value": value.strip(),
                    "domain": ".xiaohongshu.com",
                    "path": "/",
                })
            if cookies:
                self._context.add_cookies(cookies)
                return True
            return False
        except Exception as e:
            logger.warning(f"解析 cookie 字符串失败: {e}")
            return False

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            if self._context:
                self.save_cookies()
                self._context.close()
        finally:
            if self._pw:
                self._pw.stop()
            logger.info("小红书浏览器已关闭")

    def save_cookies(self):
        try:
            cookies = self._context.cookies()
            self._cookies_path.write_text(
                json.dumps(cookies, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except Exception as e:
            logger.warning(f"保存 cookies 失败: {e}")

    def login(self, wait_seconds: int = 180) -> bool:
        self.page.goto(XHS_CREATOR, wait_until="domcontentloaded")
        time.sleep(2)
        url = self.page.url
        if "login" not in url and "sign" not in url and "creator" in url:
            logger.success("检测到小红书已登录状态")
            return True
        logger.info("请在浏览器中使用小红书 APP 扫码登录（或手机号+验证码）...")
        try:
            self.page.wait_for_url("**/creator.xiaohongshu.com/**", timeout=wait_seconds * 1000)
            logger.success("小红书登录成功")
            self.save_cookies()
            return True
        except Exception:
            logger.error("等待登录超时")
            return False

    def publish_image_note(
        self,
        title: str,
        body: str,
        image_paths: List[str],
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """发布一条图文笔记"""
        if not image_paths:
            return {"success": False, "error": "没有图片"}

        logger.info(f"开始发布小红书笔记: {title[:30]}")
        try:
            self.page.goto(XHS_PUBLISH, wait_until="domcontentloaded")
            time.sleep(3)

            # 上传图片
            # 优先找带 accept="image/*" 的 input，找不到就退而求其次
            file_input = None
            for sel in [
                'input[type="file"][accept*="image"]',
                'input[type="file"]',
            ]:
                try:
                    loc = self.page.locator(sel).first
                    if loc.count() > 0:
                        file_input = loc
                        break
                except Exception:
                    continue
            if file_input is None:
                return {"success": False, "error": "找不到图片上传控件"}

            real_paths = [str(Path(p).resolve()) for p in image_paths if Path(p).exists()]
            if not real_paths:
                return {"success": False, "error": "提供的图片路径都不存在"}
            file_input.set_input_files(real_paths)
            logger.info(f"图片上传中 ({len(real_paths)} 张)...")
            time.sleep(6)

            # 填写标题
            title_sel_list = [
                'input[placeholder*="标题"]',
                'input[placeholder*="填写"]',
                'input[placeholder*="title"]',
                'textarea[placeholder*="标题"]',
            ]
            for sel in title_sel_list:
                try:
                    loc = self.page.locator(sel).first
                    if loc.count() > 0:
                        loc.fill(title[:20])
                        break
                except Exception:
                    continue

            # 填写正文
            body_sel_list = [
                'div[contenteditable="true"]',
                'textarea[placeholder*="正文"]',
                'textarea[placeholder*="描述"]',
            ]
            for sel in body_sel_list:
                try:
                    loc = self.page.locator(sel).first
                    if loc.count() > 0:
                        loc.fill(body[:1800])
                        break
                except Exception:
                    continue
            time.sleep(2)

            # 打话题标签（如果页面上有话题输入框）
            if tags:
                for tag in tags[:3]:
                    try:
                        # 小红书常以一个可点击的 #话题 下拉触发
                        self.page.keyboard.type("#" + tag, delay=50)
                        self.page.keyboard.press("Enter")
                        time.sleep(0.5)
                    except Exception:
                        continue

            time.sleep(2)

            # 发布按钮（文本或 aria-label 相关）
            published = False
            for sel in [
                'button:has-text("发布")',
                'div:has-text("发布")',
                'button:has-text("发表")',
            ]:
                try:
                    loc = self.page.locator(sel).first
                    if loc.count() > 0 and loc.is_visible():
                        loc.click()
                        published = True
                        break
                except Exception:
                    continue

            time.sleep(3)
            return {
                "success": published,
                "title": title,
                "note_url": self.page.url,
                "images": real_paths,
            }
        except Exception as e:
            logger.error(f"小红书发布失败: {e}")
            return {"success": False, "error": str(e)}


def run_publish(title: str, body: str, images: List[str], tags: Optional[List[str]] = None) -> Dict[str, Any]:
    with XiaohongshuPublisher(headless=False) as pub:
        if not pub.login():
            return {"success": False, "error": "登录失败"}
        return pub.publish_image_note(title, body, images, tags)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="小红书图文笔记发布")
    parser.add_argument("--title", required=True)
    parser.add_argument("--body", required=True)
    parser.add_argument("--images", nargs="+", required=True, help="图片路径（一个或多个）")
    parser.add_argument("--tags", nargs="*", default=[])
    args = parser.parse_args()
    r = run_publish(args.title, args.body, args.images, args.tags)
    print(json.dumps(r, ensure_ascii=False, indent=2))
