import os
from playwright.sync_api import sync_playwright

def run_cuj():
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()

        # Open Standalone Cut List
        page.goto("http://localhost:3000/src/pages/wire-cut-list/wire-cut-list.html")
        page.wait_for_timeout(1000)

        # Clear and reload
        page.evaluate("window.eecolDB ? window.eecolDB.clear('wireCutList') : null")
        page.reload()
        page.wait_for_timeout(1000)

        # Add Item
        page.locator("#addWireListItemBtnDirect").click()
        page.wait_for_timeout(500)
        page.locator("#wireListOrder").fill("ES6-DEMO")
        page.locator("#wireListLine").fill("001")
        page.locator("#wireListCustomer").fill("MODULE CORP")
        page.locator("#wireListWireType").fill("RW90-1000")
        page.locator("#wireListLength").fill("500")
        page.locator("#saveWireListItemBtn").click()
        page.wait_for_timeout(1000)

        page.screenshot(path="/home/jules/verification/screenshots/es6_verification.png")
        page.wait_for_timeout(1000)

        context.close()
        browser.close()

if __name__ == "__main__":
    run_cuj()
