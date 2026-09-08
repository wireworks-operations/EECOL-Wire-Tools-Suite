import os
import glob
from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000/src/pages/wire-cut-list/wire-cut-list.html")
    page.wait_for_timeout(500)

    # Clear DB for clean demo
    page.evaluate("window.eecolDB ? window.eecolDB.clear('wireCutList') : null")
    page.reload()
    page.wait_for_timeout(1000)

    # Click Add Item
    page.locator("#addWireListItemBtnDirect").click()
    page.wait_for_timeout(500)

    # Fill item details
    page.locator("#wireListOrder").fill("ORD-998877")
    page.wait_for_timeout(300)
    page.locator("#wireListLine").fill("001")
    page.wait_for_timeout(300)
    page.locator("#wireListCustomer").fill("WESTERN ELECTRIC")
    page.wait_for_timeout(300)
    page.locator("#wireListWireType").fill("ACWU90 4/0")
    page.wait_for_timeout(300)
    page.locator("#wireListCoilCode").fill("Z-ALPHA")
    page.wait_for_timeout(300)
    page.locator("#wireListLength").fill("350")
    page.wait_for_timeout(300)
    page.locator("#wireListReelSize").fill("42")
    page.wait_for_timeout(300)
    page.locator("#wireListFullPick").select_option("yes")
    page.wait_for_timeout(300)
    page.locator("#wireListReReel").select_option("yes")
    page.wait_for_timeout(300)
    page.locator("#wireListUrgency").select_option("rush")
    page.wait_for_timeout(300)

    # Save Item
    page.locator("#saveWireListItemBtn").click()
    page.wait_for_timeout(1000)

    # Take screenshot of rendered item card with badges
    page.screenshot(path="/home/jules/verification/screenshots/coil_rereel_fullpick_final.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.close_page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()

    print("CUJ execution finished successfully!")
