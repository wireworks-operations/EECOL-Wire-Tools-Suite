import time
import os
from playwright.sync_api import sync_playwright

def run_cuj():
    print("🚀 Running CUJ verification for Wire Cut List Contrast & Banner...")
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )

        page_list = context.new_page()
        page_list.goto("http://localhost:3000/src/pages/wire-cut-list/wire-cut-list.html")
        page_list.wait_for_timeout(500)

        page_records = context.new_page()
        page_records.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
        page_records.wait_for_timeout(500)

        # 1. Add item
        page_list.bring_to_front()
        page_list.click("#addWireListItemBtnDirect")
        page_list.wait_for_timeout(500)

        page_list.fill("#wireListOrder", "CONTRAST99")
        page_list.fill("#wireListCustomer", "ECLIPSE INDUSTRIAL")
        page_list.fill("#wireListWireType", "350MCM CU")
        page_list.fill("#wireListLength", "180")
        page_list.click("#saveWireListItemBtn")
        page_list.wait_for_timeout(1000)

        # 2. Test dark contrast color (#1e293b)
        page_list.evaluate("async () => await updateWireListItemColor(wireCutList[0].id, '#1e293b')")
        page_list.wait_for_timeout(1000)
        page_list.screenshot(path="/home/jules/verification/screenshots/verification_dark_contrast.png")

        # 3. Test light contrast color (#fffbeb)
        page_list.evaluate("async () => await updateWireListItemColor(wireCutList[0].id, '#fffbeb')")
        page_list.wait_for_timeout(1000)
        page_list.screenshot(path="/home/jules/verification/screenshots/verification_light_contrast.png")

        # 4. Set active
        page_list.evaluate("async () => await setActiveWireListItem(wireCutList[0].id)")
        page_list.wait_for_timeout(1000)

        page_records.bring_to_front()
        page_records.wait_for_timeout(1000)
        page_records.screenshot(path="/home/jules/verification/screenshots/verification_banner_active.png")

        # 5. Complete active item
        page_list.bring_to_front()
        page_list.evaluate("async () => await completeWireListItem(wireCutList[0].id, true)")
        page_list.wait_for_timeout(1000)

        page_records.bring_to_front()
        page_records.reload()
        page_records.wait_for_timeout(1000)
        page_records.screenshot(path="/home/jules/verification/screenshots/verification_banner_cleared.png")

        context.close()
        browser.close()

if __name__ == "__main__":
    run_cuj()
