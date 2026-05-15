import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000/EECOL-Wire-Tools-Suite';

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
  '/about',
  '/reports',
  '/database'
];

test('Final Parity Check', async ({ page }) => {
  for (const tool of tools) {
    console.log(`Auditing: ${tool}`);
    await page.goto(`${BASE_URL}${tool}`);
    await page.waitForLoadState('networkidle');
    const name = tool === '/' ? 'home' : tool.replace('/', '');
    await page.screenshot({ path: `verification/screenshots/final_${name}.png`, fullPage: true });

    // Basic verification of header and common elements
    const header = page.locator('h1');
    await expect(header).toBeVisible();
  }
});
