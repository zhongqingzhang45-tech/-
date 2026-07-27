from playwright.sync_api import sync_playwright

screenshots_dir = '/workspace/tmp/life-screenshots'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})

    # 4. Subscription page (viewport only, not full_page)
    print('=== Testing Subscription Page ===')
    page.goto('http://localhost:5173/subscription', wait_until='domcontentloaded')
    page.wait_for_timeout(3000)
    page.screenshot(path=f'{screenshots_dir}/04-subscription.png')
    print('Subscription page saved')

    # 5. Chat page
    print('\n=== Testing Chat Page ===')
    page.goto('http://localhost:5173/', wait_until='domcontentloaded')
    page.wait_for_timeout(1000)
    page.evaluate('''() => {
        const state = {
            affinity: 150, familiarity: 80, intimacy: 50, trust: 30,
            daysTogether: 3, firstMeetDate: '2026-07-25',
            lastInteractionDate: '2026-07-28', totalChatCount: 42,
            chatToday: 5, currentMood: 'happy', characterName: '小樱',
            personality: 'gentle', achievements: ['first_chat', 'chat_10']
        };
        localStorage.setItem('life-companion-state', JSON.stringify(state));
    }''')
    page.reload(wait_until='domcontentloaded')
    page.wait_for_timeout(5000)
    page.screenshot(path=f'{screenshots_dir}/05-chat.png')
    print('Chat page saved')

    # 6. Scroll down subscription page for full view
    print('\n=== Subscription page scrolled ===')
    page.goto('http://localhost:5173/subscription', wait_until='domcontentloaded')
    page.wait_for_timeout(3000)
    page.evaluate('window.scrollTo(0, 500)')
    page.wait_for_timeout(500)
    page.screenshot(path=f'{screenshots_dir}/04b-subscription-scrolled.png')
    print('Subscription scrolled saved')

    browser.close()
    print('\n=== Done ===')
