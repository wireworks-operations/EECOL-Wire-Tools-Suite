import time
from playwright.sync_api import sync_playwright

def record_demo():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="verification/videos",
            record_video_size={"width": 1280, "height": 720},
            viewport={"width": 1280, "height": 720}
        )

        page = context.new_page()
        print("Navigating to Standalone Wire Cut List...")
        page.goto("http://localhost:3000/src/pages/wire-cut-list/wire-cut-list.html")
        page.wait_for_selector("#wireCutListItems")
        time.sleep(1)

        # Take screenshot of Wire Cut List
        screenshot_path = "verification/operational_wire_cut_list.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to {screenshot_path}")

        # Navigate to Cutting Records
        print("Navigating to Cutting Records...")
        page.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
        page.wait_for_selector("#recordsPage")
        time.sleep(1)

        screenshot_records = "verification/operational_cutting_records.png"
        page.screenshot(path=screenshot_records, full_page=True)
        print(f"Screenshot saved to {screenshot_records}")

        context.close()
        browser.close()
        print("Video recorded successfully!")

if __name__ == "__main__":
    record_demo()
