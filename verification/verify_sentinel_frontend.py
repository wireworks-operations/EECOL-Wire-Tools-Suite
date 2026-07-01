from playwright.sync_api import sync_playwright
import time
import subprocess
import os

def run_cuj(page):
    # Go to a page that has the custom modal system initialized
    page.goto("http://localhost:3000/src/pages/inventory-records/inventory-records.html")
    page.wait_for_timeout(1000)

    # Take initial screenshot
    page.screenshot(path="/home/jules/verification/screenshots/inventory_initial.png")

    print("Simulating onversionchange to trigger custom modal...")
    # Trigger onversionchange
    page.evaluate("""
        async () => {
            const dbInstance = EECOLIndexedDB.getInstance();
            await dbInstance.isReady();
            const currentVersion = dbInstance.db.version;

            // Open another connection with a higher version
            indexedDB.open('EECOLTools_v2', currentVersion + 1);
        }
    """)

    # Wait for the modal to appear
    page.wait_for_selector("#customModal:not(.hidden)", timeout=5000)
    page.wait_for_timeout(1000)

    # Take screenshot of the custom modal
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    # Ensure directories exist
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    server_process = subprocess.Popen(["npx", "http-server", ".", "-p", "3000"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2)

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
            server_process.terminate()
