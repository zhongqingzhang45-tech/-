from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    page.set_default_timeout(60000)

    errors = []
    page.on('console', lambda msg: errors.append(f'{msg.type}: {msg.text}') if msg.type == 'error' else None)
    page.on('pageerror', lambda err: errors.append(f'PAGE ERROR: {err}'))
    page.on('requestfailed', lambda req: errors.append(f'REQ FAIL: {req.url} - {req.failure}'))

    page.goto('http://localhost:5173/', wait_until='domcontentloaded', timeout=60000)
    page.wait_for_timeout(5000)

    html = page.evaluate('() => { const el = document.getElementById("app"); return el ? el.innerHTML.substring(0, 3000) : "NO APP DIV"; }')
    print('=== App HTML ===')
    print(html[:2000])

    print(f'\n=== Errors ({len(errors)}) ===')
    for err in errors[:15]:
        print(err)

    browser.close()
