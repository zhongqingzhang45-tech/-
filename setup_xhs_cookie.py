"""小红书 Cookie 配置向导

用 3 种方式配置你的小红书登录凭据：
  1) 弹浏览器扫码登录，自动保存 cookies
  2) 粘贴 cookie 字符串（从浏览器 DevTools 复制），脚本帮你转为 Playwright JSON
  3) 直接粘贴 JSON（从已有 cookies_xhs.json 文件）

用法:
    python3 setup_xhs_cookie.py            # 选择模式
    python3 setup_xhs_cookie.py --mode 1   # 浏览器扫码
    python3 setup_xhs_cookie.py --mode 2   # 粘贴 cookie 字符串
"""
import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from loguru import logger
from config import Config
from utils.common import ensure_dir

XHS_COOKIE_FILE = Config.DATA_DIR / "cookies_xhs.json"
XHS_RAW_FILE = Config.DATA_DIR / "cookies_xhs_raw.txt"


def mode_browser_scan():
    """方式 1: 弹浏览器扫码登录，自动保存 cookies"""
    try:
        from agents.publishers.xiaohongshu import XiaohongshuPublisher
    except Exception as e:
        logger.error(f"依赖缺失: {e}。请先安装 playwright: pip install playwright && playwright install chromium")
        return False

    ensure_dir(XHS_COOKIE_FILE.parent)

    # 如果用户之前已有 cookies，先读一下看是否还能用
    reuse_cookies = XHS_COOKIE_FILE if XHS_COOKIE_FILE.exists() else None

    logger.info("启动浏览器（注意: 这步需要你本机有 Chrome 浏览器）")
    logger.info("如果是远程/服务器环境且无法弹浏览器，请改用 --mode 2 手动粘贴 cookie")

    with XiaohongshuPublisher(headless=False) as pub:
        # 不传入 cookies_path 也没事；但若之前已有，会自动加载
        ok = pub.login(wait_seconds=300)
        if ok:
            logger.success(f"已登录并保存 cookies: {XHS_COOKIE_FILE}")
        else:
            logger.error("登录失败")
        return ok


def mode_paste_cookie_string():
    """方式 2: 用户粘贴浏览器里复制的 'a=1; b=2' 字符串"""
    ensure_dir(XHS_COOKIE_FILE.parent)

    print("""
================================================================================
📝 操作提示（Chrome / Edge）:

  1) 在浏览器打开 https://creator.xiaohongshu.com 并手动登录
  2) 按 F12 打开 DevTools → Network 面板
  3) 刷新页面，点击任意一条请求 → 右侧找到 Cookie 请求头
  4) 全选复制（形如: 'a1=xxx; a2=yyy; web_session=zzz; ...'）
  5) 粘贴到下面，回车结束，再空一行或输入 EOF 提交
================================================================================
""")
    print("粘贴 cookie 字符串（粘贴完后按回车，再单独输入 END 并回车）:")

    lines = []
    while True:
        try:
            line = input().strip()
        except (EOFError, KeyboardInterrupt):
            break
        if line.upper() == "END":
            break
        lines.append(line)

    raw = " ".join(lines).strip()
    if not raw or "=" not in raw:
        logger.error("没读到有效 cookie，退出")
        return False

    XHS_RAW_FILE.write_text(raw, encoding="utf-8")
    logger.info(f"原始 cookie 已保存: {XHS_RAW_FILE}")

    # 解析并转为 Playwright cookies JSON
    cookies = []
    for part in raw.split(";"):
        part = part.strip()
        if not part or "=" not in part:
            continue
        name, value = part.split("=", 1)
        cookies.append({
            "name": name.strip(),
            "value": value.strip(),
            "domain": ".xiaohongshu.com",
            "path": "/",
            "httpOnly": False,
            "secure": True,
        })

    XHS_COOKIE_FILE.write_text(
        json.dumps(cookies, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    logger.success(f"已写入 {len(cookies)} 条 cookie -> {XHS_COOKIE_FILE}")
    logger.info("可以运行: python3 setup_xhs_cookie.py --verify 验证是否生效")
    return True


def verify_cookies():
    """验证现有 cookies 能否正常登录"""
    if not XHS_COOKIE_FILE.exists():
        logger.error(f"没找到 cookie 文件: {XHS_COOKIE_FILE}")
        return False

    try:
        from agents.publishers.xiaohongshu import XiaohongshuPublisher
    except Exception as e:
        logger.error(f"依赖缺失: {e}")
        return False

    logger.info("使用 cookies 打开 creator 后台验证...")
    with XiaohongshuPublisher(
        headless=False,
        cookies_file_path=str(XHS_COOKIE_FILE),
    ) as pub:
        ok = pub.login(wait_seconds=60)
        if ok:
            logger.success("✅ cookies 有效，已成功进入创作者后台")
        else:
            logger.error("❌ cookies 失效，请重新登录并更新")
        return ok


def main():
    p = argparse.ArgumentParser(description="小红书 Cookie 配置向导")
    p.add_argument("--mode", type=int, default=None, choices=[1, 2],
                   help="1=浏览器扫码  2=粘贴 cookie 字符串")
    p.add_argument("--verify", action="store_true", help="只验证现有 cookies 是否有效")
    args = p.parse_args()

    if args.verify:
        sys.exit(0 if verify_cookies() else 1)

    mode = args.mode
    if mode is None:
        print("""
选择配置方式:
  [1] 弹浏览器扫码登录（推荐，最快，需要有桌面环境）
  [2] 手动粘贴浏览器 Cookie 字符串（服务器/远程环境用）
""")
        try:
            mode = int(input("输入 1 或 2: ").strip())
        except (EOFError, ValueError):
            logger.error("输入无效")
            sys.exit(1)

    if mode == 1:
        ok = mode_browser_scan()
    elif mode == 2:
        ok = mode_paste_cookie_string()
    else:
        logger.error("未知模式")
        ok = False

    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
