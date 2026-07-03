const { test, expect } = require('@playwright/test');

test('Wire Weight Estimator page loads and sanitizer works', async ({ page }) => {
  // Go to the wire weight estimator page
  await page.goto('http://localhost:3000/src/pages/wire-weight-estimator/wire-weight-estimator.html');

  // If the page loads without error, the syntax fix is verified
  await expect(page.locator('#toolTitle')).toContainText('EECOL Wire Weight Calculator');

  // Verify _esc function works by checking if it's available and returns expected output
  const escaped = await page.evaluate(() => {
    return _esc('<b>test/slash</b>');
  });

  // Expected: &lt;b&gt;test&#x2F;slash&lt;&#x2F;b&gt;
  expect(escaped).toBe('&lt;b&gt;test&#x2F;slash&lt;&#x2F;b&gt;');
  console.log('Sanitizer verified:', escaped);
});

test('Reverse tabnabbing protection in safeOpenPrintWindow', async ({ page }) => {
  await page.goto('http://localhost:3000/src/pages/wire-weight-estimator/wire-weight-estimator.html');

  // Mock window.open to return a dummy window object
  await page.evaluate(() => {
    const originalOpen = window.open;
    window.open = function() {
      const win = {
        opener: window,
        document: {
          open: () => {},
          write: () => {},
          close: () => {},
          title: ''
        },
        print: () => {}
      };
      return win;
    };
  });

  // Call printWeightResults which calls safeOpenPrintWindow (eventually or via fallback)
  // Actually, printWeightResults in wire-weight-estimator.js calls window.open directly in fallback
  // or printWireWeightResults from print.js.

  // Let's test the utility directly if possible, or trigger the print.
  const openerIsNull = await page.evaluate(() => {
    const dummyHtml = '<html></html>';
    // We need to make sure we are testing the one I modified.
    // src/utils/sanitize.js exposes safeOpenPrintWindow to window.
    const win = safeOpenPrintWindow('Test', dummyHtml);
    return win.opener === null;
  });

  expect(openerIsNull).toBe(true);
  console.log('Reverse tabnabbing protection verified');
});
