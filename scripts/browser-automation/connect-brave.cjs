const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0] || await browser.newContext();
  const page = context.pages()[0] || await context.newPage();

  console.log('Braveに接続しました');

  // テストでXを開く
  await page.goto('https://x.com', { waitUntil: 'domcontentloaded' });
  console.log('Xを開きました');

  // 5秒待機して確認
  await page.waitForTimeout(5000);
  console.log('現在のURL:', page.url());

  await browser.close();
}

main().catch(console.error);
