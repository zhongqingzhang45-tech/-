"""巨量百应测试登录脚本
- 打开浏览器
- 等待人工扫码登录
- 进入商品广场
- 把当前页面的 DOM 关键字段打印出来，让用户确认
"""
import json
import time
import sys
from pathlib import Path
from loguru import logger

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import Config
from utils.common import ensure_dir
from agents.scrapers.juliang_baiying import PLAZA_URL, LOGIN_URL

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    raise RuntimeError("需要先: pip install playwright && playwright install chromium")


def main(n_pages: int = 1, n_items_per_page: int = 10):
    user_data_dir = str(ensure_dir(Config.DATA_DIR / "browser_profiles" / "juliang_baiying_test"))
    cookies_path = Config.DATA_DIR / "cookies_juliang_test.json"

    with sync_playwright() as pw:
        context = pw.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=False,
            channel="chrome",
            viewport={"width": 1600, "height": 1000},
        )
        page = context.pages[0] if context.pages else context.new_page()
        page.set_default_timeout(60000)

        # ===== 第 1 步：访问首页 =====
        logger.info("打开巨量百应首页")
        page.goto(LOGIN_URL, wait_until="domcontentloaded")
        time.sleep(3)
        logger.info(f"当前 URL: {page.url}")

        # ===== 第 2 步：登录 =====
        if "login" in page.url or "passport" in page.url or "login" in page.url.lower():
            logger.info("需要扫码登录。请在打开的 Chrome 窗口中完成登录")
            logger.info("（提示：有些平台直接扫码即可；有些需要先点「使用抖音账号登录」）")
            # 等待用户完成登录：URL 中出现 creator/home 或 dashboard 等关键字
            try:
                page.wait_for_url(
                    lambda url: (
                        "home" in url
                        or "dashboard" in url
                        or "buyin.jinritemai.com/" in url and "login" not in url and "passport" not in url
                    ),
                    timeout=180_000,
                )
            except Exception:
                logger.error("登录等待超时。检查你是否在 180s 内完成登录")
                context.close()
                return
            logger.success("登录成功！")
            # 保存 cookies 供下次直接免登录
            try:
                cookies_path.write_text(
                    json.dumps(context.cookies(), ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                logger.info(f"cookies 已保存: {cookies_path}")
            except Exception:
                pass

        time.sleep(2)

        # ===== 第 3 步：访问商品广场 =====
        logger.info(f"打开商品广场: {PLAZA_URL}")
        try:
            page.goto(PLAZA_URL, wait_until="domcontentloaded")
        except Exception:
            logger.warning("goto(wait_until=domcontentloaded) 超时，强制继续（有些站点脚本多）")
        time.sleep(8)
        logger.info(f"广场 URL: {page.url}")

        # ===== 第 4 步：探查页面结构（给用户看） =====
        logger.info("--- 页面结构快照（帮你定位元素） ---")
        # 4.1 标题
        title_text = page.evaluate("() => document.title")
        logger.info(f"页面 <title>: {title_text}")

        # 4.2 页面上所有可见 <a>（取前 20 条，看看主要导航）
        anchors = page.evaluate(
            """() => {
                return Array.from(document.querySelectorAll('a[href]'))
                    .slice(0, 20)
                    .map(a => ({text: (a.innerText||'').trim().slice(0,40), href: a.getAttribute('href')}))
                    .filter(x => x.text);
            }"""
        )
        logger.info(f"可见 <a> 链接 ({len(anchors)} 条):")
        for a in anchors:
            logger.info(f"  [{a['text']}] → {a['href']}")

        # 4.3 找所有卡片容器（包含价格/销量等字样的 div）
        card_info = page.evaluate(
            """() => {
                // 找包含中文价格符号或销量/佣金的区块，看其外层节点的 class
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                const results = [];
                let n;
                while ((n = walker.nextNode())) {
                    const txt = (n.nodeValue || '').trim();
                    if (!txt) continue;
                    if (/¥|元|佣金|销量|达人|￥/.test(txt) && txt.length < 80) {
                        let el = n.parentElement;
                        let level = 0;
                        let cls = '';
                        while (el && level < 4) {
                            const c = (el.getAttribute && el.getAttribute('class')) || '';
                            if (c) { cls = c; break; }
                            el = el.parentElement;
                            level++;
                        }
                        results.push({ text: txt.slice(0, 60), class: cls.slice(0, 80) });
                        if (results.length > 40) break;
                    }
                }
                return results;
            }"""
        )
        logger.info(f"命中价格/佣金/销量等文本节点 ({len(card_info)} 条, 抽样展示 15 条):")
        for c in card_info[:15]:
            logger.info(f"  '{c['text']}'  外层 class: {c['class']}")

        # 4.4 取整页前 3000 个字符的纯文本，给你肉眼看是否能看到商品列表
        body_text = page.evaluate("() => (document.body.innerText||document.body.textContent||'').slice(0,3000)")
        logger.info("--- 页面文本前 3000 字预览 ---")
        print(body_text)
        logger.info("--- 预览结束 ---")

        # ===== 第 5 步：等用户确认 =====
        logger.info("浏览器窗口保持打开。")
        logger.info("请你在浏览器里：")
        logger.info("  1) 看看页面是否真的加载了商品列表（卡片 + 价格 + 销量）")
        logger.info("  2) 按浏览器的 F12，点 1-2 张商品卡片，把外层 div 的 class 发给我")
        _ = input("看完后按回车关闭浏览器（直接关掉浏览器也行）... ")

        # 保存登录后的 cookies，下次直接免登录
        try:
            cookies_path.write_text(
                json.dumps(context.cookies(), ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            logger.success(f"cookies 已更新 -> {cookies_path}")
        except Exception:
            pass
        context.close()


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--pages", type=int, default=1, help="预留：翻几页（暂未用）")
    args = p.parse_args()
    main(n_pages=args.pages)
