"""Agent 8: 发布系统 — 基础类 & 各平台发布器
包含视频号自动发布（Playwright 驱动浏览器）"""
from pathlib import Path
from typing import List, Optional
from loguru import logger
from datetime import datetime, timedelta

from db import Account, PublishRecord, get_db
from utils.common import random_sleep, safe_filename, ensure_dir
from config import Config

# 视频号创作者平台 URL
VIDEO_CHANNEL_URL = "https://channels.weixin.qq.com"
VIDEO_CHANNEL_PUBLISH_URL = "https://channels.weixin.qq.com/platform/home"


class BasePublisher:
    platform: str = ""

    def __init__(self, account: Account):
        self.account = account
        self.context = None
        self.page = None
        self._browser = None

    async def __aenter__(self):
        await self.launch()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    # ---- context manager for sync fallback (for use in plain with-blocks and then
    def __enter__(self):
        self.launch_sync()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close_sync()

    def launch_sync(self):
        """同步版：通过 asyncio.run 或同步桥
        （在脚本/同步使用 async with 需要考虑已存在 event loop 的情况。"""
        import asyncio
        try:
            asyncio.get_event_loop()
            loop_running = True
        except RuntimeError:
            loop_running = False
        if loop_running:
            # 已有 event loop — 在另起新线程跑
            import threading
            result = {}

            def _t():
                new_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(new_loop)
            # 这里不能和同步调用
            from playwright = None
            try:
                from playwright.sync_api import sync_playwright
                pw = sync_playwright().start()
                result["pw"] = pw
                self._setup_sync(pw)
            except Exception as e:
                result["err"] = str(e)
            # 不要停，不用直接改同步 API 更简单
            # 简化：全部改用同步 API 直接在这里调用

    # 用同步 API 来做实际启动

    # 我们直接实现
    # 由于同步 API
    def _setup_sync(self, pw):
        context_dir = self._make_context_dir()
        browser = pw.chromium.launch_persistent_context(
            user_data_dir=str(context_dir),
            headless=False,
            channel="chrome",
        )
        self._browser = browser
        self.context = browser
        self.page = browser.pages[0] if browser.pages else browser.new_page()
