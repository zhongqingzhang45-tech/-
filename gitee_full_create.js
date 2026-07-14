const { chromium } = require('playwright');

const VERIFY_CODE = process.argv[2] || '';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
    await page.waitForTimeout(3000);
    
    const url = page.url();
    console.log('  URL:', url);

    if (!url.includes('two-factor')) {
      console.log('  没有 2FA，检查是否登录成功');
      const bodyText = await page.textContent('body');
      if (bodyText.includes('退出') || bodyText.includes('我的工作台')) {
        console.log('  登录成功，直接创建仓库');
      } else {
        console.log('  登录失败');
        await browser.close();
        process.exit(1);
      }
    } else {
      console.log('[Step 2] 2FA 验证');
      
      if (!VERIFY_CODE) {
        console.log('  点击发送验证码...');
        const sendBtn = await page.$('button:has-text("发送验证码")');
        if (sendBtn) {
          await sendBtn.click();
          await page.waitForTimeout(2000);
        }
        await page.screenshot({ path: '/tmp/gitee_2fa_enter_code.png', fullPage: true });
        console.log('  截图已保存，请提供验证码');
        console.log('  用法: node script.js <6位验证码>');
        await context.storageState({ path: '/tmp/gitee_2fa_state.json' });
        await browser.close();
        process.exit(0);
      }
      
      console.log('  输入验证码:', VERIFY_CODE);
      const digits = VERIFY_CODE.split('');
      for (let i = 0; i < Math.min(digits.length, 6); i++) {
        const input = await page.$(`input[name="num${i + 1}"]`);
        if (input) {
          await input.fill(digits[i]);
          await page.waitForTimeout(150);
        }
      }
      
      await page.screenshot({ path: '/tmp/gitee_2fa_filled.png', fullPage: true });
      
      console.log('  点击验证...');
      const verifyBtn = await page.$('button:has-text("验证"), button[type="submit"]');
      if (verifyBtn) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
          verifyBtn.click()
        ]);
      }
      await page.waitForTimeout(3000);
      
      const afterUrl = page.url();
      console.log('  验证后URL:', afterUrl);
      await page.screenshot({ path: '/tmp/gitee_after_verify.png', fullPage: true });
      
      if (afterUrl.includes('two-factor') || afterUrl.includes('login')) {
        console.log('  验证失败');
        const bodyText = await page.textContent('body');
        const err = bodyText.match(/(错误|失败|不正确|invalid)[^<]{0,80}/i);
        if (err) console.log('  错误:', err[0]);
        await browser.close();
        process.exit(1);
      }
    }

    console.log('[Step 3] 创建仓库');
    await page.goto('https://gitee.com/projects/new', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/gitee_new_repo.png', fullPage: true });
    
    const newUrl = page.url();
    console.log('  创建页URL:', newUrl);
    
    if (newUrl.includes('login')) {
      console.log('  未登录');
      await browser.close();
      process.exit(1);
    }
    
    const nameInput = await page.waitForSelector('input[id="project_name"], input[name="project[name]"]', { timeout: 20000 });
    if (!nameInput) {
      console.log('  未找到名称输入框');
      await browser.close();
      process.exit(1);
    }
    
    await nameInput.fill('lifeos20');
    await page.waitForTimeout(500);
    
    const descInput = await page.$('textarea[id="project_description"], textarea[name="project[description]"]');
    if (descInput) {
      await descInput.fill('LifeOS - 二次元虚拟伴侣项目，基于 Next.js + Prisma + Live2D 构建');
    }
    
    await page.screenshot({ path: '/tmp/gitee_repo_filled.png', fullPage: true });
    
    console.log('  提交创建...');
    const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
        submitBtn.click()
      ]);
    }
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/tmp/gitee_repo_created.png', fullPage: true });
    
    const finalUrl = page.url();
    console.log('  最终URL:', finalUrl);
    
    if (finalUrl.includes('/lifeos20') && !finalUrl.includes('/new')) {
      console.log('');
      console.log('========================================');
      console.log('  ✓ 仓库创建成功!');
      console.log('  ' + finalUrl);
      console.log('========================================');
    } else {
      console.log('  可能创建失败');
      const content = await page.content();
      const err = content.match(/(错误|失败|已存在|exist|error)[^<]{0,100}/i);
      if (err) console.log('  错误:', err[0]);
    }

  } catch (error) {
    console.error('错误:', error.message);
    try {
      await page.screenshot({ path: '/tmp/gitee_error_full.png', fullPage: true });
    } catch (e) {}
  } finally {
    await browser.close();
  }
})();
