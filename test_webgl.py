from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    # 启动浏览器时强制启用 WebGL
    browser = p.chromium.launch(
        headless=True,
        args=[
            '--use-gl=swiftshader',
            '--enable-webgl',
            '--no-sandbox',
            '--disable-web-security',
        ]
    )
    context = browser.new_context()
    page = context.new_page()

    console_logs = []
    errors = []
    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: errors.append(str(err)))

    print("访问页面...")
    page.goto('http://localhost:3000/lover', wait_until='networkidle', timeout=30000)

    # 等待更多时间让WebGL渲染
    page.wait_for_timeout(10000)

    print("检查WebGL状态...")
    webgl_info = page.evaluate('''() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return { error: 'No canvas found' };
        
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        if (!gl) return { error: 'No WebGL context' };
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return {
            renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
            vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
            version: gl.getParameter(gl.VERSION),
            shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            canvasSize: canvas.width + 'x' + canvas.height
        };
    }''')
    print(f"WebGL信息: {webgl_info}")

    # 检查PIXI App状态
    pixi_info = page.evaluate('''() => {
        if (!window.PIXI) return { error: 'PIXI not loaded' };
        const apps = Object.keys(window).filter(k => k.includes('PIXI'));
        return { apps_found: apps.length };
    }''')
    print(f"PIXI信息: {pixi_info}")

    # 截图
    page.screenshot(path='/workspace/public/lover_webgl_test.png', full_page=True)
    print("截图已保存")

    # 打印错误
    if errors:
        print(f"\n页面错误 ({len(errors)}个):")
        for err in errors[:10]:
            print(f"  {err}")

    # 打印关键日志
    if console_logs:
        print(f"\n控制台日志 ({len(console_logs)}条):")
        for log in console_logs:
            if 'error' in log.lower() or 'failed' in log.lower() or 'Live2D' in log:
                print(f"  {log}")

    browser.close()