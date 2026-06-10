const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0] || await context.newPage();

  await page.goto('https://x.com', { waitUntil: 'domcontentloaded' });
  console.log('Xを開きました:', await page.url());

  // ブラウザは閉じない（ユーザーが操作するため）
  console.log('Braveは開いたままにしています');
})();