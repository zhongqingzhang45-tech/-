"""
验证聊天重构的 Playwright 自动化脚本
1. 确认页面无 Hydration 错误
2. 确认设置按钮已删除
3. 确认聊天 API 调用正常（即使 LLM 未配置，也应有错误回退消息）
"""
from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    console_errors = []
    network_requests = []

    def on_console(msg):
        text = msg.text
        if "Hydration" in text or "#425" in text or "#418" in text or "#423" in text:
            console_errors.append(f"[{msg.type}] {text}")

    def on_request(req):
        if "/api/chat" in req.url:
            network_requests.append(f"{req.method} {req.url}")

    def on_response(resp):
        if "/api/chat" in resp.url:
            network_requests.append(f"RESPONSE {resp.url} -> {resp.status}")

    page.on("console", on_console)
    page.on("request", on_request)
    page.on("response", on_response)

    # 导航到页面
    page.goto("http://localhost:3002/lover")
    page.wait_for_load_state("networkidle")

    # 等待加载完成
    page.wait_for_timeout(2000)

    print("=== 页面加载验证 ===")
    print(f"页面标题: {page.title()}")
    print(f"当前 URL: {page.url}")

    # 检查设置按钮是否已删除
    settings_btn = page.locator('button[title="设置"], button:has-text("⚙️")')
    print(f"\n=== 设置面板删除验证 ===")
    print(f"设置按钮存在: {settings_btn.count() > 0} (期望: False)")

    # 截图
    page.screenshot(path="/workspace/scripts/verify_result.png", full_page=False)
    print(f"\n截图已保存: /workspace/scripts/verify_result.png")

    # 测试发送消息
    print(f"\n=== 聊天 API 调用验证 ===")
    input_box = page.locator('input[placeholder="输入消息..."], textarea[placeholder="输入消息..."]').first
    if input_box.count() > 0:
        input_box.fill("你好呀，测试消息")
        send_btn = page.locator('button:has-text("发送")').first
        if send_btn.count() > 0:
            send_btn.click()
            page.wait_for_timeout(3000)
            print(f"网络请求: {network_requests}")
        else:
            print("发送按钮未找到")
    else:
        print("输入框未找到")

    # 检查控制台错误
    print(f"\n=== 控制台错误 ===")
    if console_errors:
        for err in console_errors:
            print(f"  ❌ {err}")
    else:
        print("  ✅ 无 Hydration 错误")

    browser.close()
    print("\n✅ 验证完成")
