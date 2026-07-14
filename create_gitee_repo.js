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
    await page.screenshot({ path: '/tmp/gitee_01_login.png', fullPage: true });

    const loginPageTitle = await page.title();
    console.log('  页面标题:', loginPageTitle);

    console.log('[Step 2] 输入账号密码并登录');
    await page.fill('input[name="user[login]"]', 'lifeos20');
    await page.fill('input[name="user[password]"]', 'sz13001300');
    await page.screenshot({ path: '/tmp/gitee_02_filled.png', fullPage: true });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
      page.click('button[type="submit"]').catch(() => 
        page.click('.submit.button').catch(() => 
          page.click('input[type="submit"]')
        )
      )
    ]);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/gitee_03_after_login.png', fullPage: true });

    const url = page.url();
    console.log('  当前URL:', url);

    if (url.includes('two-factor') || url.includes('verify')) {
      console.log('[Step 2.5] 检测到两步验证页面');
      const pageContent = await page.content();
      
      if (pageContent.includes('短信') || pageContent.includes('手机') || pageContent.includes('验证码')) {
        console.log('  需要短信验证码，请在 Gitee 账号绑定的手机上查看');
        console.log('  由于是自动化环境，无法手动输入验证码');
        console.log('  正在尝试查找是否有"信任此设备"或跳过选项...');
      }
      
      const hasSmsCode = await page.$('input[type="text"][inputmode="numeric"], input[name*="code"], input[name*="captcha"]');
      if (hasSmsCode) {
        console.log('  找到验证码输入框，需要用户手动输入');
        console.log('  由于无法在无头环境中接收短信，将尝试改用其他方式');
        await browser.close();
        process.exit(2);
      }
    }

    console.log('[Step 3] 检查登录状态');
    const pageContent = await page.content();
    const isLoggedIn = pageContent.includes('退出') || 
                       pageContent.includes('我的工作台') || 
                       pageContent.includes('创建仓库') ||
                       pageContent.includes('lifeos20');
    
    if (isLoggedIn) {
      console.log('  登录成功!');
    } else {
      console.log('  登录可能失败，页面标题:', await page.title());
      console.log('  页面内容前500字:', pageContent.substring(0, 500));
      await browser.close();
      process.exit(1);
    }

    console.log('[Step 4] 访问创建仓库页面');
    await page.goto('https://gitee.com/projects/new', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/gitee_04_new_project.png', fullPage: true });

    const currentUrl = page.url();
    console.log('  创建页URL:', currentUrl);

    if (currentUrl.includes('login')) {
      console.log('  跳转到登录页，登录状态失效');
      await browser.close();
      process.exit(1);
    }

    console.log('[Step 5] 填写仓库信息');
    
    const nameInput = await page.waitForSelector('input[id="project_name"], input[name="project[name]"]', { timeout: 20000 });
    if (!nameInput) {
      console.log('  未找到仓库名称输入框，页面内容:', (await page.content()).substring(0, 500));
      await browser.close();
      process.exit(1);
    }
    
    await nameInput.fill('lifeos');
    await page.waitForTimeout(500);

    const descInput = await page.$('textarea[id="project_description"], textarea[name="project[description]"]');
    if (descInput) {
      await descInput.fill('LifeOS - 二次元虚拟伴侣项目，基于 Next.js + Prisma + Live2D 构建');
    }

    try {
      const publicRadio = await page.$('input[name="project[public]"][value="1"], label:has-text("公开")');
      if (publicRadio) {
        await publicRadio.click();
      }
    } catch (e) {
      console.log('  未找到公开/私有选项，使用默认');
    }

    await page.screenshot({ path: '/tmp/gitee_05_filled_project.png', fullPage: true });

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
    await page.screenshot({ path: '/tmp/gitee_06_after_create.png', fullPage: true });

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
      if (errorMatch) {
        console.log('  错误信息:', errorMatch[0]);
      }
      console.log('  页面内容预览:', content.substring(0, 800));
    }

  } catch (error) {
    console.error('错误:', error.message);
    console.error(error.stack);
    try {
      await page.screenshot({ path: '/tmp/gitee_error.png', fullPage: true });
    } catch (e) {}
  } finally {
    await browser.close();
  }
})();
