from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})

    errors = []
    page.on('console', lambda msg: errors.append(f'{msg.type}: {msg.text}') if msg.type == 'error' else None)
    page.on('pageerror', lambda err: errors.append(f'PAGE ERROR: {err}'))

    page.goto('http://localhost:5173/', wait_until='domcontentloaded')
    page.wait_for_timeout(5000)

    html = page.evaluate('() => { const el = document.getElementById("app"); return el ? el.innerHTML.substring(0, 2000) : "NO APP DIV"; }')
    print('=== App HTML (first 2000 chars) ===')
    print(html)

    print(f'\n=== Console/Page Errors ({len(errors)}) ===')
    for err in errors[:30]:
        print(err)

    app_exists = page.evaluate('() => !!document.getElementById("app")')
    print(f'\n#app exists: {app_exists}')

    body_text = page.evaluate('() => document.body.innerText.substring(0, 500)')
    print(f'\nBody text: "{body_text}"')

    browser.close()
