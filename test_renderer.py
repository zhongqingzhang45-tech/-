from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=['--use-gl=swiftshader', '--enable-webgl', '--no-sandbox']
    )
    page = browser.new_page()

    console_logs = []
    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

    page.goto('http://localhost:3000/lover', wait_until='networkidle', timeout=30000)
    page.wait_for_timeout(5000)

    # 检查 PIXI renderer 的具体类型
    renderer_type = page.evaluate('''() => {
        // 尝试从全局获取 PIXI app
        // 由于 PIXI Application 是动态创建的，我们需要检查 canvas
        const canvas = document.querySelector('canvas');
        if (!canvas) return 'no canvas';
        
        // PIXI v4 的 canvas 有 __pixiId__ 属性
        const pixiId = canvas.__pixiId__;
        
        // 检查 canvas 实际的 context
        // 注意：PIXI 使用 WebGL，但在某些环境下会 fallback 到 Canvas
        const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
        if (gl) {
            return 'WebGL context available';
        }
        
        // 检查是否有 experimental-webgl
        const expgl = canvas.getContext('experimental-webgl');
        if (expgl) {
            return 'Experimental WebGL available';
        }
        
        // PIXI v4 的 renderer 信息
        // 如果 canvas 是 PIXI 创建的，可以通过特定属性识别
        const style = canvas.getAttribute('style');
        return {
            pixiId: pixiId || 'none',
            style: style || 'none',
            contextType: 'unknown'
        };
    }''')
    
    print(f"渲染器类型: {renderer_type}")
    
    # 打印所有 Live2D 相关日志
    print("\n控制台日志:")
    for log in console_logs:
        if 'Live2D' in log or 'PIXI' in log or 'error' in log.lower() or 'warn' in log.lower():
            print(f"  {log}")
    
    page.screenshot(path='/workspace/public/lover_renderer_check.png', full_page=True)
    browser.close()