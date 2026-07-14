const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log('[Step 1] 打开 Gitee 登录页');
    await page.goto('https://gitee.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/gitee_login1.png', fullPage: true });

    console.log('[Step 2] 输入账号密码并登录');
    await page.fill('input[name="user[login]"]', 'lifeos20');
    await page.fill('input[name="user[password]"]', 'sz13001300');
    
    await page.click('button[type="submit"]').catch(() => {});
    await page.waitForTimeout(5000);
    
    const url = page.url();
    console.log('  当前URL:', url);
    await page.screenshot({ path: '/tmp/gitee_login2.png', fullPage: true });

    const bodyText = await page.textContent('body');
    console.log('  页面文本:', bodyText.replace(/\s+/g, ' ').substring(0, 500));
    
    const errorMsg = bodyText.match(/(错误|失败|不正确|超限|频繁)[^<]{0,80}/i);
    if (errorMsg) console.log('  可能的错误:', errorMsg[0]);

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await browser.close();
  }
})();
