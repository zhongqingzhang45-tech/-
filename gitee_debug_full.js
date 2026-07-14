const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // 监听 console
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('Console error:', msg.text());
  });

  // 监听 dialog
  page.on('dialog', async dialog => {
    console.log('Dialog:', dialog.message());
    await dialog.dismiss();
  });

  try {
    console.log('[Step 1] 打开登录页');
    await page.goto('https://gitee.com/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/gitee_d1_login.png', fullPage: true });

    console.log('[Step 2] 输入账号密码');
    await page.fill('input[name="user[login]"]', 'lifeos20');
    await page.waitForTimeout(500);
    await page.fill('input[name="user[password]"]', 'sz13001300');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/gitee_d2_filled.png', fullPage: true });

    console.log('[Step 3] 点击登录');
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/login') && r.request().method() === 'POST', { timeout: 15000 }).catch(() => null),
      page.click('button[type="submit"]').catch(() => page.click('.submit.button').catch(() => {}))
    ]);
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/gitee_d3_after.png', fullPage: true });
    
    const url = page.url();
    console.log('  URL:', url);
    
    const bodyText = await page.textContent('body');
    console.log('  页面文本前500字:', bodyText.replace(/\s+/g, ' ').substring(0, 500));
    
    if (response) {
      console.log('  响应状态:', response.status());
      const respBody = await response.text().catch(() => '');
      console.log('  响应体前300字:', respBody.substring(0, 300));
    }
    
    // 检查是否有错误提示
    const errorEl = await page.$('.error.message, .flash_error, .ui.error.message');
    if (errorEl) {
      console.log('  错误提示:', await errorEl.textContent());
    }

  } catch (error) {
    console.error('错误:', error.message);
    try {
      await page.screenshot({ path: '/tmp/gitee_d_error.png', fullPage: true });
    } catch (e) {}
  } finally {
    await browser.close();
  }
})();
