from playwright.sync_api import sync_playwright
import time
import os

os.makedirs('/tmp/test-screenshots', exist_ok=True)

def test_model(page, char_name, char_id):
    print(f"\n=== Testing: {char_name} ({char_id}) ===")
    
    try:
        page.click('button:has-text("角色")')
        time.sleep(0.5)
    except:
        pass
    
    try:
        page.click(f'button[role="option"]:has-text("{char_name}")')
    except:
        print(f"  Could not find character button for {char_name}")
        return False
    
    time.sleep(3)
    
    screenshot_path = f'/tmp/test-screenshots/{char_id}.png'
    page.screenshot(path=screenshot_path)
    print(f"  Screenshot saved: {screenshot_path}")
    
    errors = []
    def on_console(msg):
        if msg.type == 'error':
            errors.append(msg.text)
    
    page.on('console', on_console)
    
    if errors:
        print(f"  Console errors: {len(errors)}")
        for e in errors[:5]:
            print(f"    - {e[:100]}")
    
    return True

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    
    print("Navigating to /lover...")
    page.goto('http://localhost:3000/lover')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    
    page.screenshot(path='/tmp/test-screenshots/01-initial.png')
    print("Initial screenshot saved")
    
    console_errors = []
    def capture_errors(msg):
        if msg.type == 'error':
            console_errors.append(msg.text)
    
    page.on('console', capture_errors)
    
    if console_errors:
        print(f"\nConsole errors on page load: {len(console_errors)}")
        for e in console_errors[:10]:
            print(f"  - {e[:150]}")
    
    test_cases = [
        ("春（迎宾）", "HaruGreeter"),
        ("拉菲", "lafei"),
        ("镜音连", "len"),
    ]
    
    for name, cid in test_cases:
        test_model(page, name, cid)
    
    browser.close()
    print("\n=== Test complete ===")
