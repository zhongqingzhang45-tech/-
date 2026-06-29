from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=['--use-gl=swiftshader', '--enable-webgl', '--no-sandbox']
    )
    page = browser.new_page()

    page.goto('http://localhost:3000/lover', wait_until='networkidle', timeout=30000)
    page.wait_for_timeout(5000)

    # 检查所有 canvas 的 context
    canvas_info = page.evaluate('''() => {
        const canvases = document.querySelectorAll('canvas');
        const results = [];
        canvases.forEach((c, i) => {
            const gl = c.getContext('webgl');
            const gl2 = c.getContext('webgl2');
            const ctx2d = c.getContext('2d');
            results.push({
                index: i,
                id: c.id || 'no-id',
                width: c.width,
                height: c.height,
                hasWebGL: !!gl,
                hasWebGL2: !!gl2,
                has2D: !!ctx2d,
                contextType: c.getContextAttributes ? JSON.stringify(c.getContextAttributes()) : 'N/A'
            });
        });
        return results;
    }''')
    
    print(f"Canvas信息: {canvas_info}")
    
    # 检查 PIXI app.renderer 类型
    renderer_info = page.evaluate('''() => {
        const container = document.querySelector('[class*="live2d"]') || document.querySelector('canvas');
        if (!container) return { error: 'No container found' };
        
        // 尝试查找 PIXI app
        if (window.PIXI && window.PIXI.Application) {
            // 查找 canvas 上的 PIXI 引用
            const canvas = document.querySelector('canvas');
            if (canvas && canvas._pixiApp) {
                return { rendererType: canvas._pixiApp.renderer.type };
            }
        }
        
        // 检查是否有 PIXI 警告
        const warnings = [];
        if (window.PIXI) {
            warnings.push('PIXI loaded: ' + !!window.PIXI.Application);
        }
        return { warnings };
    }''')
    
    print(f"渲染器信息: {renderer_info}")
    
    page.screenshot(path='/workspace/public/lover_debug.png', full_page=True)
    browser.close()