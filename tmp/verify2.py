from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = ctx.new_page()
    page.set_default_timeout(30000)

    # 1. Landing page
    print('=== Landing Page ===')
    page.goto('http://localhost:5173/', wait_until='commit')
    page.wait_for_timeout(8000)
    texts = page.evaluate('() => document.body.innerText')
    for kw in ['Life', 'AI 伴侣', '开始创建', '她会记住你', '陪伴你的日常', '一起成长']:
        print(f'  {"✓" if kw in texts else "✗"} "{kw}"')

    # 2. Create page
    print('\n=== Create Page ===')
    page.goto('http://localhost:5173/create', wait_until='commit')
    page.wait_for_timeout(8000)
    texts = page.evaluate('() => document.body.innerText')
    for kw in ['创建', '姓名', '温柔', '傲娇']:
        print(f'  {"✓" if kw in texts else "✗"} "{kw}"')

    # 3. Companion page
    print('\n=== Companion Page ===')
    page.goto('http://localhost:5173/', wait_until='commit')
    page.evaluate('''() => {
        localStorage.setItem('life-companion-state', JSON.stringify({
            affinity: 150, familiarity: 80, intimacy: 50, trust: 30,
            daysTogether: 3, firstMeetDate: '2026-07-25',
            lastInteractionDate: '2026-07-28', totalChatCount: 42,
            chatToday: 5, currentMood: 'happy', characterName: '小樱',
            personality: 'gentle', achievements: ['first_chat', 'chat_10']
        }));
    }''')
    page.goto('http://localhost:5173/companion', wait_until='commit')
    page.wait_for_timeout(8000)
    texts = page.evaluate('() => document.body.innerText')
    for kw in ['小樱', '关系等级', '好感度', '陪伴天数', '关于她', '记忆', '成就']:
        print(f'  {"✓" if kw in texts else "✗"} "{kw}"')

    # 4. Subscription page
    print('\n=== Subscription Page ===')
    page.goto('http://localhost:5173/subscription', wait_until='commit')
    page.wait_for_timeout(8000)
    texts = page.evaluate('() => document.body.innerText')
    for kw in ['免费版', 'Pro 会员', 'Premium', '最受欢迎', '7 天免费试用', '升级会员']:
        print(f'  {"✓" if kw in texts else "✗"} "{kw}"')

    browser.close()
    print('\n=== Done ===')
