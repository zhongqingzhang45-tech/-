from playwright.sync_api import sync_playwright
import os

screenshots_dir = '/workspace/tmp/life-screenshots'
os.makedirs(screenshots_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})

    errors = []
    page.on('console', lambda msg: errors.append(f'{msg.type}: {msg.text}') if msg.type == 'error' else None)

    # 1. Landing page
    print('=== Testing Landing Page ===')
    page.goto('http://localhost:5173/', wait_until='domcontentloaded')
    page.wait_for_timeout(3000)
    page.screenshot(path=f'{screenshots_dir}/01-landing.png', full_page=True)
    print(f'Title: {page.title()}')

    # 2. Create page
    print('\n=== Testing Create Page ===')
    page.goto('http://localhost:5173/create', wait_until='domcontentloaded')
    page.wait_for_timeout(3000)
    page.screenshot(path=f'{screenshots_dir}/02-create-step1.png', full_page=True)
    print('Create page saved')

    # 3. Companion page
    print('\n=== Testing Companion Page ===')
    page.goto('http://localhost:5173/companion', wait_until='domcontentloaded')
    page.wait_for_timeout(3000)
    page.screenshot(path=f'{screenshots_dir}/03-companion.png', full_page=True)
    print('Companion page saved')

    # 4. Subscription page
    print('\n=== Testing Subscription Page ===')
    page.goto('http://localhost:5173/subscription', wait_until='domcontentloaded')
    page.wait_for_timeout(3000)
    page.screenshot(path=f'{screenshots_dir}/04-subscription.png', full_page=True)
    print('Subscription page saved')

    # 5. Chat page (set localStorage first)
    print('\n=== Testing Chat Page ===')
    page.goto('http://localhost:5173/', wait_until='domcontentloaded')
    page.wait_for_timeout(1000)
    page.evaluate('''() => {
        const state = {
            affinity: 150,
            familiarity: 80,
            intimacy: 50,
            trust: 30,
            daysTogether: 3,
            firstMeetDate: '2026-07-25',
            lastInteractionDate: '2026-07-28',
            totalChatCount: 42,
            chatToday: 5,
            currentMood: 'happy',
            characterName: '小樱',
            personality: 'gentle',
            achievements: ['first_chat', 'chat_10']
        };
        localStorage.setItem('life-companion-state', JSON.stringify(state));
    }''')
    page.reload(wait_until='domcontentloaded')
    page.wait_for_timeout(5000)
    page.screenshot(path=f'{screenshots_dir}/05-chat.png', full_page=True)
    print('Chat page saved')

    print(f'\n=== Console Errors ({len(errors)}) ===')
    for err in errors[:20]:
        print(err)

    browser.close()
    print('\n=== All screenshots saved ===')
