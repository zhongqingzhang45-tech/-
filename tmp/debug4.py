from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    page.set_default_timeout(30000)

    all_logs = []
    page.on('console', lambda msg: all_logs.append(f'{msg.type}: {msg.text}'))
    page.on('pageerror', lambda err: all_logs.append(f'PAGEERROR: {err}'))

    print('=== Create Page ===')
    page.goto('http://localhost:5173/create', wait_until='commit')
    page.wait_for_timeout(10000)

    html = page.evaluate('() => { const el = document.getElementById("app"); return el ? el.innerHTML.substring(0, 800) : "NO APP"; }')
    print(f'HTML: {html[:500]}')

    print(f'\nLogs ({len(all_logs)}):')
    for log in all_logs:
        print(log)

    # Also check landing page
    all_logs.clear()
    print('\n=== Landing Page ===')
    page.goto('http://localhost:5173/', wait_until='commit')
    page.wait_for_timeout(10000)

    html = page.evaluate('() => { const el = document.getElementById("app"); return el ? el.innerHTML.substring(0, 800) : "NO APP"; }')
    print(f'HTML: {html[:500]}')

    print(f'\nLogs ({len(all_logs)}):')
    for log in all_logs:
        print(log)

    browser.close()
