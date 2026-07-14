const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-CN'
  });
  const page = await context.newPage();

  try {
    console.log('[Step 1] 打开 Gitee 登录页');
    await page.goto('https://gitee.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/gitee_v2_login.png', fullPage: true });

    console.log('[Step 2] 输入账号密码');
    await page.fill('input[name="user[login]"]', 'lifeos20');
    await page.waitForTimeout(500);
    await page.fill('input[name="user[password]"]', 'sz13001300');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: '/tmp/gitee_v2_filled.png', fullPage: true });

    console.log('[Step 3] 点击登录');
    const loginBtn = await page.$('button[type="submit"], .submit.button');
    if (loginBtn) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
        loginBtn.click()
      ]);
    }
    await page.waitForTimeout(5000);
    
    const url = page.url();
    console.log('  当前URL:', url);
    await page.screenshot({ path: '/tmp/gitee_v2_after.png', fullPage: true });

    const bodyText = await page.textContent('body');
    
    if (url.includes('two-factor') || url.includes('verify')) {
      console.log('[Step 4] 检测到验证页面');
      console.log('  页面文本:', bodyText.replace(/\s+/g, ' ').substring(0, 800));
      
      console.log('');
      console.log('  所有按钮:');
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = (await btn.textContent()).trim();
        const disabled = await btn.isDisabled();
        if (text) console.log('    - ' + text + (disabled ? ' (disabled)' : ''));
      }
      
      console.log('');
      console.log('  所有链接:');
      const links = await page.$$('a');
      for (const link of links) {
        const text = (await link.textContent()).trim();
        const href = await link.getAttribute('href');
        if (text && text.length < 40) {
          console.log('    - ' + text + ' -> ' + href);
        }
      }
      
      await context.storageState({ path: '/tmp/gitee_v2_state.json' });
      console.log('');
      console.log('  状态已保存');
    } else if (bodyText.includes('退出') || bodyText.includes('我的工作台')) {
      console.log('[Step 4] 登录成功!');
      await context.storageState({ path: '/tmp/gitee_v2_state.json' });
    } else {
      console.log('[Step 4] 登录状态不确定');
      console.log('  页面标题:', await page.title());
      const errorMatch = bodyText.match(/(错误|失败|不正确|超限|频繁|验证码)[^<]{0,100}/i);
      if (errorMatch) console.log('  可能的错误:', errorMatch[0].trim());
    }

  } catch (error) {
    console.error('错误:', error.message);
    try {
      await page.screenshot({ path: '/tmp/gitee_v2_error.png', fullPage: true });
    } catch (e) {}
  } finally {
    await browser.close();
  }
})();
