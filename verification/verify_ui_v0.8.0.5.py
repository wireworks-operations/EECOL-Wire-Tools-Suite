from playwright.sync_api import Page, expect, sync_playwright
import time
import subprocess
import os

def verify_version_and_ui(page: Page):
    # 1. Arrange: Go to the index page.
    # Use environment variable for URL or default to localhost:3000
    base_url = os.getenv("APP_URL", "http://localhost:3000")
    page.goto(f"{base_url}/index.html")

    # 2. Assert: Check for version 0.8.0.5 in the footer
    # We look for the text specifically in the footer area to be precise
    footer = page.locator("div.mt-auto")
    footer_version = footer.locator("p:text('v0.8.0.5')")
    expect(footer_version).to_be_visible()

    # 3. Screenshot: Capture the footer area
    # Use a relative path for the screenshot
    screenshot_dir = os.path.join(os.path.dirname(__file__), "screenshots")
    os.makedirs(screenshot_dir, exist_ok=True)
    screenshot_path = os.path.join(screenshot_dir, "v0.8.0.5_footer_verified.png")
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

if __name__ == "__main__":
    # Start the dev server if not already running
    # In a real CI, the server might be started externally
    server_process = subprocess.Popen(["npx", "http-server", ".", "-p", "3000"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2) # Give it time to start

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_version_and_ui(page)
            print("✅ UI Verification Passed: v0.8.0.5 is visible.")
        except Exception as e:
            print(f"❌ UI Verification Failed: {e}")
            exit(1)
        finally:
            browser.close()
            server_process.terminate()
