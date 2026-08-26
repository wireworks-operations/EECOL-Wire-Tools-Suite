from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
    page.wait_for_timeout(1000)

    # Click on Quick Statistics accordion to show expanded MD3 card state
    page.click("#toggleStats")
    page.wait_for_timeout(500)

    # Fill in some sample data to demonstrate MD3 inputs
    page.fill("#orderNumber", "1234567")
    page.wait_for_timeout(300)
    page.fill("#customerName", "EECOL CALGARY MAIN")
    page.wait_for_timeout(300)
    page.fill("#wireId", "TK6/3CU 1KV")
    page.wait_for_timeout(300)
    page.fill("#cutLength", "150")
    page.wait_for_timeout(300)
    page.fill("#lineCode", "001")
    page.wait_for_timeout(300)
    page.fill("#turnedToLineCode", "002")
    page.wait_for_timeout(300)
    page.fill("#cutterName", "LUCAS")
    page.wait_for_timeout(500)

    # Take screenshot of the new MD3 re-design
    page.screenshot(path="/home/jules/verification/screenshots/md3_cutting_records.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 950},
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
