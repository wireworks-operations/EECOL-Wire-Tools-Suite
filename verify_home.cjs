const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'verification/screenshots/home_fixed_v2.png', fullPage: true });
    console.log('Screenshot captured successfully');
  } catch (e) {
    console.error('Failed to capture screenshot:', e);
  }
  await browser.close();
})();
