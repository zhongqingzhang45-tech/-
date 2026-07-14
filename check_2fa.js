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

  await page.goto('https://gitee.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.fill('input[name="user[login]"]', 'lifeos20');
  await page.fill('input[name="user[password]"]', 'sz13001300');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]').catch(() => {})
  ]);
  await page.waitForTimeout(3000);

  const url = page.url();
  console.log('URL:', url);

  if (url.includes('two-factor')) {
    console.log('=== 2FA 页面元素 ===');
    
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text.trim()) console.log('Button:', text.trim());
    }
    
    const links = await page.$$('a');
    for (const link of links) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      if (text && text.trim()) {
        console.log('Link:', text.trim(), '->', href);
      }
    }

    const inputs = await page.$$('input');
    for (const input of inputs) {
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      console.log('Input: type=' + type + ', name=' + name + ', placeholder=' + placeholder);
    }

    const bodyText = await page.textContent('body');
    console.log('');
    console.log('=== 页面文本 ===');
    console.log(bodyText.replace(/\s+/g, ' ').substring(0, 500));
    
    await page.screenshot({ path: '/tmp/gitee_2fa_detail.png', fullPage: true });
  }

  await browser.close();
})();
