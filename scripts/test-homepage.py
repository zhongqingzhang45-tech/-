from playwright.sync_api import sync_playwright
import time
import os
import json

os.makedirs('/tmp/test-screenshots', exist_ok=True)

results = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    
    console_errors = []
    def on_console(msg):
        if msg.type == 'error':
            console_errors.append(msg.text)
    
    page.on('console', on_console)
    
    print("Navigating to /lover...")
    page.goto('http://localhost:3000/lover')
    page.wait_for_load_state('networkidle')
    time.sleep(5)
    
    page.screenshot(path='/tmp/test-screenshots/00-initial.png')
    print(f"Initial screenshot saved. Console errors: {len(console_errors)}")
    for e in console_errors[:5]:
        print(f"  - {e[:120]}")
    
    chars_to_test = [
        ("HaruGreeter", "春（迎宾）"),
        ("lafei", "拉菲"),
        ("lingbo", "绫波"),
        ("z23", "Z23"),
        ("len", "镜音连"),
        ("haruto", "遥斗"),
        ("jin", "仁"),
    ]
    
    for char_id, char_name in chars_to_test:
        print(f"\n--- Testing: {char_name} ({char_id}) ---")
        
        errors_before = len(console_errors)
        
        try:
            char_btn = page.locator(f'button[role="option"]:has-text("{char_name}")')
            if char_btn.count() > 0:
                char_btn.click()
                time.sleep(4)
                
                ss_path = f'/tmp/test-screenshots/{char_id}.png'
                page.screenshot(path=ss_path)
                
                new_errors = console_errors[errors_before:]
                success = len(new_errors) == 0
                
                print(f"  Screenshot: {ss_path}")
                print(f"  New errors: {len(new_errors)}")
                for e in new_errors[:3]:
                    print(f"    - {e[:100]}")
                
                results.append({
                    'id': char_id,
                    'name': char_name,
                    'success': success,
                    'errors': new_errors[:5]
                })
            else:
                print(f"  Button not found!")
                results.append({
                    'id': char_id,
                    'name': char_name,
                    'success': False,
                    'errors': ['Button not found']
                })
        except Exception as e:
            print(f"  Error: {e}")
            results.append({
                'id': char_id,
                'name': char_name,
                'success': False,
                'errors': [str(e)]
            })
    
    browser.close()

print("\n\n=== SUMMARY ===")
for r in results:
    status = "✅" if r['success'] else "❌"
    print(f"{status} {r['name']} ({r['id']})")
    if not r['success']:
        for e in r['errors']:
            print(f"     - {e[:80]}")

print(f"\nTotal: {len([r for r in results if r['success']])}/{len(results)} working")
