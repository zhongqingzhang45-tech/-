from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    page.set_default_timeout(30000)

    errors = []
    page.on('pageerror', lambda err: errors.append(f'PAGE ERROR: {err}'))

    # Check companion page
    print('=== Companion Page Debug ===')
    page.goto('http://localhost:5173/companion', wait_until='commit')
    page.wait_for_timeout(8000)

    html = page.evaluate('() => { const el = document.getElementById("app"); return el ? el.innerHTML.substring(0, 1500) : "NO APP DIV"; }')
    print('App HTML:')
    print(html[:1000])

    print(f'\nPage Errors ({len(errors)}):')
    for err in errors[:5]:
        print(err)

    # Check create page
    print('\n=== Create Page Debug ===')
    errors.clear()
    page.goto('http://localhost:5173/create', wait_until='commit')
    page.wait_for_timeout(8000)

    html = page.evaluate('() => { const el = document.getElementById("app"); return el ? el.innerHTML.substring(0, 1500) : "NO APP DIV"; }')
    print('App HTML:')
    print(html[:1000])

    print(f'\nPage Errors ({len(errors)}):')
    for err in errors[:5]:
        print(err)

    browser.close()
