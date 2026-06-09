"""巨量百应（抖音精选联盟）商品抓取器
流程：登录 → 商品广场 → 抓取 Top N 商品 → 输出 products.json
"""
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger

from config import Config
from utils.common import ensure_dir, safe_filename

# 巨量百应相关URL
LOGIN_URL = "https://buyin.jinritemai.com/"
HOME_URL = "https://buyin.jinritemai.com/dashboard/home-page"
PLAZA_URL = "https://buyin.jinritemai.com/dashboard/goods-square"  # 商品广场

# 商品数据列默认字段（以页面实际为准）
DEFAULT_FIELDS = [
    "title", "price", "commission_rate", "commission_amount",
    "sales_count", "creator_count", "rating", "main_image_url",
    "detail_url", "platform", "category", "raw"
]


class JuliangBaiyingCrawler:
    def __init__(self, headless: bool = False, user_data_dir: Optional[str] = None):
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise RuntimeError("playwright 未安装，请先: pip install playwright && playwright install chromium")

        self._pw_cls = sync_playwright
        self._pw = None
        self._context = None
        self.page = None
        self.headless = headless
        self.user_data_dir = user_data_dir or str(
            ensure_dir(Config.DATA_DIR / "browser_profiles" / "juliang_baiying")
        )
        self._cookies_path = Config.DATA_DIR / "cookies_juliang.json"

    # ------------ 浏览器控制 ------------
    def __enter__(self):
        self._pw = self._pw_cls().start()
        # 使用 chromium + 持久用户数据目录，减少扫码登录频率
        self._context = self._pw.chromium.launch_persistent_context(
            user_data_dir=self.user_data_dir,
            headless=self.headless,
            channel="chrome",
            viewport={"width": 1440, "height": 900},
        )
        self.page = self._context.pages[0] if self._context.pages else self._context.new_page()
        self.page.set_default_timeout(30000)
        logger.info(f"浏览器已启动 (headless={self.headless})")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            if self._context:
                self.save_cookies()
                self._context.close()
        finally:
            if self._pw:
                self._pw.stop()
            logger.info("浏览器已关闭")

    def save_cookies(self):
        try:
            cookies = self._context.cookies()
            self._cookies_path.write_text(
                json.dumps(cookies, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
        except Exception as e:
            logger.warning(f"保存 cookies 失败: {e}")

    def load_cookies(self):
        if not self._cookies_path.exists():
            return False
        try:
            cookies = json.loads(self._cookies_path.read_text(encoding="utf-8"))
            self._context.add_cookies(cookies)
            logger.info(f"已加载 cookies ({len(cookies)} 条)")
            return True
        except Exception as e:
            logger.warning(f"加载 cookies 失败: {e}")
            return False

    # ------------ 登录 ------------
    def login(self, wait_seconds: int = 120) -> bool:
        """访问首页 → 若未登录则等待用户扫码"""
        self.page.goto(LOGIN_URL, wait_until="domcontentloaded")
        time.sleep(2)
        # 判断是否已登录：URL 中出现 /dashboard 或 /home
        current = self.page.url
        if "dashboard" in current or "home-page" in current:
            logger.success("检测到已登录状态")
            return True
        logger.info("请在浏览器中使用抖音扫码登录巨量百应...")
        # 等待跳转到已登录页面
        try:
            self.page.wait_for_url("**/dashboard/**", timeout=wait_seconds * 1000)
            logger.success("巨量百应登录成功")
            self.save_cookies()
            return True
        except Exception:
            logger.error("等待登录超时，请检查网络或重新扫码")
            return False

    # ------------ 访问商品广场 ------------
    def go_goods_square(self) -> bool:
        try:
            self.page.goto(PLAZA_URL, wait_until="domcontentloaded")
            time.sleep(3)
            # 等待列表容器渲染
            for sel in [
                "div[class*='goods']",
                "div[class*='Goods']",
                "div[class*='Square']",
                "div[class*='list']",
                "table",
            ]:
                try:
                    self.page.wait_for_selector(sel, timeout=8000)
                    logger.info(f"商品广场已加载 (匹配选择器: {sel})")
                    return True
                except Exception:
                    continue
            # 不再严格校验容器，由抓取逻辑容错
            logger.warning("未识别到商品列表容器，仍尝试抓取")
            return True
        except Exception as e:
            logger.error(f"商品广场访问失败: {e}")
            return False

    # ------------ 抓取页面商品 ------------
    def _parse_current_page(self) -> List[Dict[str, Any]]:
        """在当前页面提取商品信息（尽力而为，字段缺失以 null 填充）"""
        js = """
        () => {
            const items = [];
            // 策略1：查找所有类名包含 'item' / 'card' / 'goods' 的 div
            const candidates = document.querySelectorAll(
                "div[class*='Item'], div[class*='item'], div[class*='Card'], div[class*='card'], div[class*='goods'], div[class*='Goods']"
            );
            candidates.forEach(node => {
                // 必须含有 <a> 跳转链接
                const links = node.querySelectorAll("a[href]");
                if (!links.length) return;
                const link = links[0];
                const detail = link.getAttribute("href") || "";
                const imgs = node.querySelectorAll("img[src]");
                const img = imgs[0] ? (imgs[0].getAttribute("src") || "") : "";
                // 文本
                const text = (node.innerText || node.textContent || "").trim();
                items.push({
                    raw_text: text.slice(0, 800),
                    detail_url: detail,
                    main_image_url: img,
                });
            });
            // 去重（按 detail_url）
            const seen = new Set();
            const unique = [];
            for (const it of items) {
                if (!it.detail_url || seen.has(it.detail_url)) continue;
                seen.add(it.detail_url);
                unique.push(it);
            }
            return unique.slice(0, 60);  // 单页最多取 60 条
        }
        """
        try:
            raw_items = self.page.evaluate(js) or []
        except Exception as e:
            logger.warning(f"evaluate 失败: {e}")
            return []

        products = []
        for idx, item in enumerate(raw_items):
            text = item.get("raw_text", "")
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            if not lines:
                continue
            product = self._text_to_product(lines, item)
            if product:
                products.append(product)
        return products

    @staticmethod
    def _text_to_product(lines: List[str], item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """把页面原始文本 + 链接/图片 解析成结构化商品"""
        title = ""
        price = 0.0
        commission_rate = 0.0
        commission_amount = 0.0
        sales_count = 0
        creator_count = 0
        rating = 0.0

        import re
        for line in lines:
            # 价格 ¥ / 元
            m = re.search(r"¥\s*([\d.]+)|([\d.]+)\s*元", line)
            if m and price == 0.0:
                price = float(m.group(1) or m.group(2))
            # 佣金比例 xx%
            m = re.search(r"佣金.*?([\d.]+)\s*%|([\d.]+)\s*%.*?佣", line)
            if m and commission_rate == 0.0:
                commission_rate = float(m.group(1) or m.group(2))
            # 单件佣金
            m = re.search(r"([\d.]+)\s*(?:元|¥)\s*佣|佣\s*([\d.]+)", line)
            if m and commission_amount == 0.0:
                commission_amount = float(m.group(1) or m.group(2) or 0)
            # 销量/件数
            m = re.search(r"销量.*?([\d.]+)\s*(w|万|k|千)?|([\d.]+)\s*(w|万|k|千)\s*.*?[销件量]", line, re.I)
            if m and sales_count == 0:
                n = float(m.group(1) or m.group(3) or 0)
                unit = (m.group(2) or m.group(4) or "").lower()
                if unit in ("w", "万"):
                    n *= 10000
                elif unit in ("k", "千"):
                    n *= 1000
                sales_count = int(n)
            # 达人数
            m = re.search(r"(\d+)\s*位达人|达人\s*(\d+)|([\d.]+)\s*.*?达人", line)
            if m and creator_count == 0:
                n = float(m.group(1) or m.group(2) or m.group(3) or 0)
                creator_count = int(n)
            # 评分
            m = re.search(r"(评分|分|rat).*?([\d.]+)|([\d.]+)\s*分", line)
            if m and rating == 0.0:
                rating = float(m.group(2) or m.group(3) or 0)
            # 标题（最长的一行一般是商品标题）
            if 4 < len(line) <= 80 and "¥" not in line and "%" not in line and "元" not in line:
                if len(line) > len(title):
                    title = line

        if not title:
            title = lines[0][:80]

        detail_url = item.get("detail_url") or ""
        if detail_url and detail_url.startswith("/"):
            detail_url = "https://buyin.jinritemai.com" + detail_url

        return {
            "title": title,
            "price": price,
            "commission_rate": commission_rate,
            "commission_amount": commission_amount,
            "sales_count": sales_count,
            "creator_count": creator_count,
            "rating": rating,
            "main_image_url": item.get("main_image_url") or "",
            "detail_url": detail_url,
            "platform": "douyin_juliang",
            "category": "",
            "raw": {
                "raw_lines": lines,
            },
        }

    # ------------ 翻页 ------------
    def _goto_next_page(self) -> bool:
        """点击 '下一页' / '>' 按钮；找不到则返回 False"""
        selectors = [
            "button:has-text('下一页')",
            "a:has-text('下一页')",
            "div[class*='next']",
            "a[aria-label='Next']",
            "li[class*='next']",
        ]
        for sel in selectors:
            try:
                loc = self.page.locator(sel).first
                if loc.count() and loc.is_visible():
                    loc.click()
                    time.sleep(2.5)
                    return True
            except Exception:
                continue
        return False

    # ------------ 主入口 ------------
    def crawl_top_n(self, n: int = 100, max_pages: int = 20) -> List[Dict[str, Any]]:
        """抓取前 n 个商品，跨页累积"""
        if not self.login():
            return []
        if not self.go_goods_square():
            return []

        all_products: List[Dict[str, Any]] = []
        seen = set()

        for page_no in range(1, max_pages + 1):
            logger.info(f"抓取第 {page_no} 页...")
            time.sleep(1.5)
            items = self._parse_current_page()
            logger.info(f"本页解析出 {len(items)} 个商品")
            new_count = 0
            for it in items:
                key = it.get("detail_url") or it.get("title")
                if key and key not in seen:
                    seen.add(key)
                    all_products.append(it)
                    new_count += 1
                if len(all_products) >= n:
                    break
            logger.info(f"累计已收集 {len(all_products)} 条 / 目标 {n}")
            if len(all_products) >= n:
                break
            if not self._goto_next_page():
                logger.info("无下一页，提前结束")
                break
        return all_products[:n]


# ---------- CLI 入口 ----------
def run_crawl(n: int = 100, output_path: Optional[str] = None, headless: bool = False) -> Path:
    """同步运行：登录 + 抓商品 + 输出 JSON"""
    output = Path(output_path) if output_path else Config.DATA_DIR / "products.json"
    output.parent.mkdir(parents=True, exist_ok=True)

    with JuliangBaiyingCrawler(headless=headless) as crawler:
        products = crawler.crawl_top_n(n=n)

    output.write_text(
        json.dumps(products, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    logger.success(f"已写入 {len(products)} 条商品 -> {output}")
    return output


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="巨量百应商品抓取")
    parser.add_argument("-n", "--num", type=int, default=100, help="抓取商品数量")
    parser.add_argument("-o", "--output", type=str, default=None, help="输出文件路径")
    parser.add_argument("--headless", action="store_true", help="无头模式")
    args = parser.parse_args()
    run_crawl(n=args.num, output_path=args.output, headless=args.headless)
