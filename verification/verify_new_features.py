from playwright.sync_api import sync_playwright
import time
import os

def run_feature_verification(page):
    # Go to Cutting Records tool
    page.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
    page.wait_for_timeout(2000)

    # 1. Add an item with Reel Size
    page.click("#toggleWireList")
    page.wait_for_timeout(500)
    page.click("#addWireListItemBtn")
    page.wait_for_timeout(500)

    page.fill("#wireListOrder", "REEL789")
    page.fill("#wireListCustomer", "REEL CUSTOMER")
    page.fill("#wireListWireType", "TECK-REEL")
    page.fill("#wireListLength", "100")
    page.fill("#wireListReelSize", "45") # New field
    page.click("#saveWireListItemBtn")
    page.wait_for_timeout(1000)

    # 2. Verify Reel Size is rendered in list
    page.screenshot(path="verification/screenshots/reel_size_in_list.png")

    # 3. Test AutoFill with Reel Size
    page.click("text=AutoFill Cut")
    page.wait_for_timeout(1000)
    page.click("text=OK")
    page.wait_for_timeout(500)

    # Verify main form reel fields
    reel_type = page.input_value("#coilOrReel")
    reel_size = page.input_value("#reelSize")
    print(f"DEBUG: Form Reel Type: {reel_type}, Size: {reel_size}")
    page.screenshot(path="verification/screenshots/autofill_reel_data.png")

    # 4. Test "Make Active"
    # Re-open list if closed by autofill scroll
    page.evaluate("window.scrollTo(0, 0)")
    # Trigger context menu (right click)
    page.click(".wire-list-item", button="right")
    page.wait_for_timeout(500)
    page.click("#ctxActive")
    page.wait_for_timeout(500)

    # Verify pulse class and badge
    page.screenshot(path="verification/screenshots/active_item_highlight.png")

    # 5. Test Pastel Color Presets
    page.click(".wire-list-item", button="right")
    page.wait_for_timeout(500)
    # Click the first pastel preset (should be the first button in the grid)
    page.click("#pastelPresets button:first-child")
    page.wait_for_timeout(500)
    page.screenshot(path="verification/screenshots/pastel_color_applied.png")

if __name__ == "__main__":
    os.makedirs("verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_feature_verification(page)
        finally:
            browser.close()
