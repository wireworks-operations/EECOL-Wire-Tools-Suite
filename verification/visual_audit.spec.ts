import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/EECOL-Wire-Tools-Suite';

const tools = [
  '/',
  '/cutting-records',
  '/inventory-records',
  '/mark-calculator',
  '/stop-mark',
  '/weight',
  '/reel-capacity',
  '/reel-size',
  '/shipping-manifest',
  '/reel-labels',
  '/maintenance',
  '/advanced-math',
  '/about'
];

test('Capture Screenshots for Consistency Audit', async ({ page }) => {
  for (const tool of tools) {
    await page.goto(`${BASE_URL}${tool}`);
    await page.waitForLoadState('networkidle');
    const name = tool === '/' ? 'home' : tool.replace('/', '');
    await page.screenshot({ path: `verification/screenshots/refactor_${name}.png`, fullPage: true });
  }
});
