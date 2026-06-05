from playwright.sync_api import sync_playwright
import time
import os

def run_cuj(page):
    # Go to landing page
    page.goto("http://localhost:3000/index.html")
    page.wait_for_timeout(1000)

    # Scroll to footer to see version bump
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/v0.8.0.5_footer.png")

    # Go to Cutting Records
    page.click("text=Wire Cut Records")
    page.wait_for_timeout(1000)

    # Enter some data in lowercase to test normalization UI-side (indirectly)
    page.fill("#wireId", "test-wire-99")
    page.fill("#cutLength", "15.5")
    page.fill("#lineCode", "A")
    page.fill("#turnedToLineCode", "B")
    page.fill("#cutterName", "sentinel bot")
    page.fill("#orderNumber", "ORD1234")
    page.fill("#customerName", "acme corp")
    page.wait_for_timeout(1000)

    # Record the cut
    page.click("#recordBtn")
    page.wait_for_timeout(1000)

    # Click OK on success modal
    page.click("text=OK")
    page.wait_for_timeout(1000)

    # Check the history list for normalized values
    page.screenshot(path="/home/jules/verification/screenshots/v0.8.0.5_normalized_record.png")

    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
