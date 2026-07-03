from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:3000/src/pages/wire-weight-estimator/wire-weight-estimator.html")
    page.wait_for_timeout(500)

    # 1. Verify page title and initial state
    print("Checking page content...")
    title = page.locator('#toolTitle')
    if "EECOL Wire Weight Calculator" in title.inner_text():
        print("✅ Page title verified")

    # 2. Test the _esc sanitizer via console
    print("Testing _esc sanitizer...")
    escaped = page.evaluate("_esc('<b>test/slash</b>')")
    expected = "&lt;b&gt;test&#x2F;slash&lt;&#x2F;b&gt;"
    if escaped == expected:
        print(f"✅ Sanitizer verified: {escaped}")
    else:
        print(f"❌ Sanitizer failed: expected {expected}, got {escaped}")

    # 3. Test reverse tabnabbing protection
    print("Testing reverse tabnabbing protection...")
    opener_is_null = page.evaluate("""
        () => {
            const win = safeOpenPrintWindow('Test', '<html></html>');
            const isNull = win.opener === null;
            win.close();
            return isNull;
        }
    """)
    if opener_is_null:
        print("✅ Reverse tabnabbing protection verified")
    else:
        print("❌ Reverse tabnabbing protection failed")

    # 4. Interact with the UI to show functionality is restored
    print("Testing UI functionality...")
    page.locator('#knownLength').fill('1000')
    page.wait_for_timeout(500)
    page.select_option('#cableType', 'TK90')
    page.wait_for_timeout(500)
    page.select_option('#wireDesignation', '14/3CU')
    page.wait_for_timeout(500)
    page.click('#calculateWeightBtn')
    page.wait_for_timeout(500)

    # Take screenshot of final result
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    page.screenshot(path="/home/jules/verification/screenshots/wire_weight_verified.png")
    print("✅ Screenshot saved")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        os.makedirs("/home/jules/verification/videos", exist_ok=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
