from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
    page.wait_for_timeout(1000)

    # Click on Quick Statistics accordion to show expanded MD3 card state
    page.click("#toggleStats")
    page.wait_for_timeout(300)

    # Fill in sample main data
    page.fill("#orderNumber", "1234567")
    page.wait_for_timeout(200)
    page.fill("#customerName", "EECOL CALGARY MAIN")
    page.wait_for_timeout(200)
    page.fill("#wireId", "TK6/3CU 1KV")
    page.wait_for_timeout(200)
    page.fill("#cutLength", "150")
    page.wait_for_timeout(200)

    # Click MD3 Chip Buttons
    page.click("#btnSingleUnitCut")
    page.wait_for_timeout(200)
    page.click("#btnCutInSystem")
    page.wait_for_timeout(200)

    # Click Package Type Segmented Toggle (Switch to Reel)
    page.click("#segGroupCoilOrReel button[data-value='reel']")
    page.wait_for_timeout(300)

    # Expand Optional Details Progressive Disclosure panel
    page.click("#toggleOptionalDetails")
    page.wait_for_timeout(300)

    page.fill("#turnedToLineCode", "002")
    page.wait_for_timeout(200)
    page.fill("#orderComments", "Urgent job for site B")
    page.wait_for_timeout(200)

    # Fill line code and cutter
    page.fill("#lineCode", "001")
    page.wait_for_timeout(200)
    page.fill("#cutterName", "LUCAS")
    page.wait_for_timeout(300)

    # Take screenshot of the modernized MD3 re-design
    page.screenshot(path="/home/jules/verification/screenshots/md3_modernized.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 1000},
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
