const { chromium } = require('playwright');

const VERIFY_CODE = process.argv[2] || '15364388627';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const storageState = '/tmp/gitee_storage_state.json';
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
    storageState: storageState
  });
  const page = await context.newPage();

  try {
    console.log('[Step 1] 恢复浏览器状态，回到 2FA 页面');
    await page.goto('https://gitee.com/login/two-factor', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const url = page.url();
    console.log('  当前URL:', url);
    await page.screenshot({ path: '/tmp/gitee_2fa_step2.png', fullPage: true });

    console.log('[Step 2] 输入验证码:', VERIFY_CODE);
    
    const codeDigits = VERIFY_CODE.split('');
    for (let i = 0; i < Math.min(codeDigits.length, 6); i++) {
      const input = await page.$(`input[name="num${i + 1}"]`);
      if (input) {
        await input.fill(codeDigits[i]);
        await page.waitForTimeout(200);
      }
    }
    
    await page.screenshot({ path: '/tmp/gitee_2fa_filled.png', fullPage: true });

    console.log('[Step 3] 点击验证按钮');
    const verifyBtn = await page.$('button:has-text("验证"), button[type="submit"]');
    if (verifyBtn) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
        verifyBtn.click()
      ]);
    } else {
      console.log('  未找到验证按钮，尝试按 Enter');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }
    
    await page.screenshot({ path: '/tmp/gitee_after_verify.png', fullPage: true });
    
    const afterUrl = page.url();
    console.log('  验证后URL:', afterUrl);

    if (afterUrl.includes('two-factor') || afterUrl.includes('login')) {
      console.log('  验证失败，仍在验证/登录页');
      const bodyText = await page.textContent('body');
      const errorMatch = bodyText.match(/(错误|失败|不正确|invalid|error)[^<]{0,80}/i);
      if (errorMatch) console.log('  错误信息:', errorMatch[0]);
      await browser.close();
      process.exit(1);
    }

    console.log('[Step 4] 验证成功！现在创建仓库');
    
    await page.goto('https://gitee.com/projects/new', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/gitee_new_project.png', fullPage: true });

    const newProjUrl = page.url();
    console.log('  创建页URL:', newProjUrl);

    if (newProjUrl.includes('login')) {
      console.log('  跳转到登录页，登录状态失效');
      await browser.close();
      process.exit(1);
    }

    console.log('[Step 5] 填写仓库信息');
    const nameInput = await page.waitForSelector('input[id="project_name"], input[name="project[name]"]', { timeout: 20000 });
    if (!nameInput) {
      console.log('  未找到仓库名称输入框');
      await browser.close();
      process.exit(1);
    }
    
    await nameInput.fill('lifeos');
    await page.waitForTimeout(500);

    const descInput = await page.$('textarea[id="project_description"], textarea[name="project[description]"]');
    if (descInput) {
      await descInput.fill('LifeOS - 二次元虚拟伴侣项目，基于 Next.js + Prisma + Live2D 构建');
    }

    await page.screenshot({ path: '/tmp/gitee_project_filled.png', fullPage: true });

    console.log('[Step 6] 提交创建');
    const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
        submitBtn.click()
      ]);
    } else {
      console.log('  未找到提交按钮');
      await browser.close();
      process.exit(1);
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/gitee_project_created.png', fullPage: true });

    const finalUrl = page.url();
    console.log('  最终URL:', finalUrl);

    if (finalUrl.includes('lifeos20/lifeos') && !finalUrl.includes('new')) {
      console.log('');
      console.log('========================================');
      console.log('  ✓ 仓库创建成功!');
      console.log('  仓库地址: https://gitee.com/lifeos20/lifeos');
      console.log('========================================');
      console.log('');
    } else {
      console.log('  仓库可能创建失败');
      const content = await page.content();
      const errorMatch = content.match(/(错误|失败|已存在|exist|error)[^<]{0,100}/i);
      if (errorMatch) console.log('  错误信息:', errorMatch[0]);
      console.log('  页面预览:', content.substring(0, 600));
    }

  } catch (error) {
    console.error('错误:', error.message);
    console.error(error.stack);
    try {
      await page.screenshot({ path: '/tmp/gitee_error_step2.png', fullPage: true });
    } catch (e) {}
  } finally {
    await browser.close();
  }
})();
