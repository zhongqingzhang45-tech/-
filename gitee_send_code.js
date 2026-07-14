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

  try {
    console.log('[Step 1] 登录 Gitee');
    await page.goto('https://gitee.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="user[login]"]', 'lifeos20');
    await page.waitForTimeout(300);
    await page.fill('input[name="user[password]"]', 'sz13001300');
    await page.waitForTimeout(300);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
      page.click('button[type="submit"]').catch(() => {})
    ]);
    await page.waitForTimeout(4000);
    
    const url = page.url();
    console.log('  URL:', url);
    
    if (!url.includes('two-factor')) {
      console.log('  未进入 2FA，直接检查登录状态');
      const bodyText = await page.textContent('body');
      if (bodyText.includes('退出') || bodyText.includes('我的工作台')) {
        console.log('  已登录！');
      } else {
        console.log('  登录失败');
        await browser.close();
        process.exit(1);
      }
    } else {
      console.log('[Step 2] 在 2FA 页面尝试其他验证方式');
      await page.screenshot({ path: '/tmp/gitee_2fa_main.png', fullPage: true });
      
      console.log('  点击"设备不在身边"');
      const noDeviceLink = await page.$('a:has-text("设备不在身边")');
      if (noDeviceLink) {
        await noDeviceLink.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/tmp/gitee_2fa_nodevice.png', fullPage: true });
        
        const bodyText = await page.textContent('body');
        console.log('  页面文本:', bodyText.replace(/\s+/g, ' ').substring(0, 800));
        
        const buttons = await page.$$('button');
        console.log('  按钮:');
        for (const btn of buttons) {
          const text = (await btn.textContent()).trim();
          if (text) console.log('    - ' + text);
        }
      } else {
        console.log('  未找到"设备不在身边"链接');
      }
      
      console.log('');
      console.log('[Step 3] 点击发送验证码');
      const sendBtn = await page.$('button:has-text("发送验证码")');
      if (sendBtn) {
        await sendBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/gitee_2fa_after_send.png', fullPage: true });
        console.log('  已点击发送验证码');
      }
      
      await context.storageState({ path: '/tmp/gitee_2fa_ready.json' });
      console.log('  状态已保存，等待用户提供验证码');
    }

  } catch (error) {
    console.error('错误:', error.message);
    console.error(error.stack);
    try {
      await page.screenshot({ path: '/tmp/gitee_error_debug.png', fullPage: true });
    } catch (e) {}
  } finally {
    await browser.close();
  }
})();
