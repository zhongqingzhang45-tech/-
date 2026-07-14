const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    storageState: '/tmp/gitee_v2_state.json'
  });
  const page = await context.newPage();

  try {
    console.log('[Step 1] 恢复状态并回到验证页');
    await page.goto('https://gitee.com/login/two-factor', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const url = page.url();
    console.log('  当前URL:', url);
    await page.screenshot({ path: '/tmp/gitee_v2_2fa.png', fullPage: true });

    console.log('[Step 2] 点击"设备不在身边"');
    const noDeviceLink = await page.$('a:has-text("设备不在身边")');
    if (noDeviceLink) {
      await noDeviceLink.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/tmp/gitee_v2_nodevice.png', fullPage: true });
      
      const bodyText = await page.textContent('body');
      console.log('  点击后文本:', bodyText.replace(/\s+/g, ' ').substring(0, 600));
      
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
    console.log('[Step 3] 尝试点击发送验证码');
    const sendBtn = await page.$('button:has-text("发送验证码")');
    if (sendBtn) {
      const disabled = await sendBtn.isDisabled();
      console.log('  发送按钮状态:', disabled ? '禁用' : '可用');
      if (!disabled) {
        console.log('  点击发送验证码...');
        await sendBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/tmp/gitee_v2_after_send.png', fullPage: true });
      }
    }

  } catch (error) {
    console.error('错误:', error.message);
    try {
      await page.screenshot({ path: '/tmp/gitee_v2_error2.png', fullPage: true });
    } catch (e) {}
  } finally {
    await browser.close();
  }
})();
