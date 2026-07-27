from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    page.set_default_timeout(60000)

    errors = []
    page.on('console', lambda msg: errors.append(f'{msg.type}: {msg.text}') if msg.type == 'error' else None)
    page.on('pageerror', lambda err: errors.append(f'PAGE ERROR: {err}'))

    # 1. Landing page
    print('=== Landing Page ===')
    page.goto('http://localhost:5173/', wait_until='domcontentloaded', timeout=60000)
    page.wait_for_timeout(5000)
    texts = page.evaluate('() => document.body.innerText')
    for kw in ['Life', 'AI 伴侣', '开始创建', '她会记住你', '陪伴你的日常', '一起成长']:
        print(f'  {"✓" if kw in texts else "✗"} "{kw}"')

    # 2. Create page
    print('\n=== Create Page ===')
    page.goto('http://localhost:5173/create', wait_until='domcontentloaded', timeout=60000)
    page.wait_for_timeout(5000)
    texts = page.evaluate('() => document.body.innerText')
    for kw in ['创建', '姓名', '温柔', '傲娇']:
        print(f'  {"✓" if kw in texts else "✗"} "{kw}"')

    # 3. Companion page
    print('\n=== Companion Page ===')
    page.goto('http://localhost:5173/', wait_until='domcontentloaded', timeout=60000)
    page.evaluate('''() => {
        localStorage.setItem('life-companion-state', JSON.stringify({
            affinity: 150, familiarity: 80, intimacy: 50, trust: 30,
            daysTogether: 3, firstMeetDate: '2026-07-25',
            lastInteractionDate: '2026-07-28', totalChatCount: 42,
            chatToday: 5, currentMood: 'happy', characterName: '小樱',
            personality: 'gentle', achievements: ['first_chat', 'chat_10']
        }));
    }''')
    page.goto('http://localhost:5173/companion', wait_until='domcontentloaded', timeout=60000)
    page.wait_for_timeout(5000)
    texts = page.evaluate('() => document.body.innerText')
    for kw in ['小樱', '关系等级', '好感度', '陪伴天数', '关于她', '记忆', '成就']:
        print(f'  {"✓" if kw in texts else "✗"} "{kw}"')

    # 4. Subscription page
    print('\n=== Subscription Page ===')
    page.goto('http://localhost:5173/subscription', wait_until='domcontentloaded', timeout=60000)
    page.wait_for_timeout(5000)
    texts = page.evaluate('() => document.body.innerText')
    for kw in ['免费版', 'Pro 会员', 'Premium', '最受欢迎', '7 天免费试用', '升级会员']:
        print(f'  {"✓" if kw in texts else "✗"} "{kw}"')

    # 5. Chat page
    print('\n=== Chat Page ===')
    page.goto('http://localhost:5173/', wait_until='domcontentloaded', timeout=60000)
    page.wait_for_timeout(5000)
    texts = page.evaluate('() => document.body.innerText')
    for kw in ['小樱', 'Lv.']:
        print(f'  {"✓" if kw in texts else "✗"} "{kw}"')

    print(f'\n=== Errors ({len(errors)}) ===')
    for err in errors[:10]:
        print(err)

    # Re-screenshot
    screenshots_dir = '/workspace/tmp/life-screenshots'
    page.goto('http://localhost:5173/', wait_until='domcontentloaded', timeout=60000)
    page.wait_for_timeout(3000)
    page.screenshot(path=f'{screenshots_dir}/01-landing-fixed.png', full_page=True)
    print('\nLanding screenshot re-saved')

    page.goto('http://localhost:5173/subscription', wait_until='domcontentloaded', timeout=60000)
    page.wait_for_timeout(3000)
    page.screenshot(path=f'{screenshots_dir}/04-subscription-fixed.png')
    print('Subscription screenshot re-saved')

    browser.close()
    print('\n=== Done ===')
