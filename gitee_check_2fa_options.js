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

    console.log('[Step 2] 输入账号密码并登录');
    await page.fill('input[name="user[login]"]', 'lifeos20');
    await page.fill('input[name="user[password]"]', 'sz13001300');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
      page.click('button[type="submit"]').catch(() => {})
    ]);
    await page.waitForTimeout(3000);

    const url = page.url();
    console.log('  当前URL:', url);

    if (url.includes('two-factor') || url.includes('verify')) {
      console.log('[Step 3] 检测到两步验证页面');
      
      const bodyText = await page.textContent('body');
      console.log('  页面文本:', bodyText.replace(/\s+/g, ' ').substring(0, 600));
      
      console.log('');
      console.log('  所有按钮:');
      const buttons = await page.$$('button, a[role="button"]');
      for (const btn of buttons) {
        const text = (await btn.textContent()).trim();
        const tag = await btn.evaluate(el => el.tagName);
        if (text) console.log('    [' + tag + '] ' + text);
      }
      
      console.log('');
      console.log('  所有链接:');
      const links = await page.$$('a');
      for (const link of links) {
        const text = (await link.textContent()).trim();
        const href = await link.getAttribute('href');
        if (text && text.length < 50) {
          console.log('    ' + text + ' -> ' + href);
        }
      }
      
      await page.screenshot({ path: '/tmp/gitee_2fa_options.png', fullPage: true });
      console.log('');
      console.log('  截图已保存到 /tmp/gitee_2fa_options.png');
    }

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await browser.close();
  }
})();
