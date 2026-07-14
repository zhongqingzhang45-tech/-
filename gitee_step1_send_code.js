const { chromium } = require('playwright');
const fs = require('fs');

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
      page.click('button[type="submit"]').catch(() => 
        page.click('.submit.button').catch(() => {})
      )
    ]);
    await page.waitForTimeout(3000);

    const url = page.url();
    console.log('  当前URL:', url);

    if (url.includes('two-factor') || url.includes('verify')) {
      console.log('[Step 3] 检测到两步验证页面');
      await page.screenshot({ path: '/tmp/gitee_2fa_page.png', fullPage: true });
      
      const bodyText = await page.textContent('body');
      console.log('  页面文本:', bodyText.replace(/\s+/g, ' ').substring(0, 300));
      
      const buttons = await page.$$('button');
      console.log('  按钮列表:');
      for (const btn of buttons) {
        const text = (await btn.textContent()).trim();
        const disabled = await btn.isDisabled();
        if (text) console.log('    -', text, disabled ? '(disabled)' : '');
      }
      
      const inputs = await page.$$('input');
      console.log('  输入框列表:');
      for (const input of inputs) {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        console.log('    - type=' + type + ', name=' + name + ', placeholder=' + placeholder);
      }
      
      console.log('');
      console.log('[Step 4] 尝试点击发送验证码');
      
      let sendBtn = null;
      for (const btn of buttons) {
        const text = (await btn.textContent()).trim();
        if (text.includes('发送') || text.includes('获取') || text.includes('验证码')) {
          sendBtn = btn;
          break;
        }
      }
      
      if (sendBtn) {
        console.log('  找到发送验证码按钮，点击...');
        await sendBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/tmp/gitee_2fa_after_send.png', fullPage: true });
        
        const bodyText2 = await page.textContent('body');
        console.log('  点击后文本:', bodyText2.replace(/\s+/g, ' ').substring(0, 300));
      } else {
        console.log('  未找到发送验证码按钮');
      }
      
      await context.storageState({ path: '/tmp/gitee_storage_state.json' });
      console.log('');
      console.log('  已保存浏览器状态到 /tmp/gitee_storage_state.json');
      console.log('  请提供收到的短信验证码（6位数字）');
    } else {
      console.log('  未检测到两步验证，可能已经登录成功');
      const pageContent = await page.content();
      if (pageContent.includes('退出') || pageContent.includes('我的工作台')) {
        console.log('  登录成功!');
        await context.storageState({ path: '/tmp/gitee_storage_state.json' });
      }
    }

  } catch (error) {
    console.error('错误:', error.message);
    try {
      await page.screenshot({ path: '/tmp/gitee_error_step1.png', fullPage: true });
    } catch (e) {}
  } finally {
    await browser.close();
  }
})();
