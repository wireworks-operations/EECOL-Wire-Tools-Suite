from playwright.sync_api import sync_playwright
import time
import os

def run_autofill_verification(page):
    # Go to Cutting Records tool
    page.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
    page.wait_for_timeout(2000)

    # 1. Add an item to the Wire Cut List first
    page.click("#toggleWireList")
    page.wait_for_timeout(500)
    page.click("#addWireListItemBtn")
    page.wait_for_timeout(500)

    page.fill("#wireListOrder", "AUTO123")
    page.fill("#wireListCustomer", "AUTO CUSTOMER")
    page.fill("#wireListWireType", "AUTO-WIRE")
    page.fill("#wireListLength", "50")
    page.click("#saveWireListItemBtn")
    page.wait_for_timeout(1000)

    # 2. Click AutoFill Cut
    page.click("text=AutoFill Cut")
    page.wait_for_timeout(1000)

    # Click OK on the AutoFill Success alert
    page.click("text=OK")
    page.wait_for_timeout(500)

    # 3. Verify fields are filled
    wire_id = page.input_value("#wireId")
    order_num = page.input_value("#orderNumber")
    print(f"DEBUG: Filled Wire ID: {wire_id}, Order: {order_num}")

    page.screenshot(path="verification/screenshots/autofill_filled.png")

    # 4. Fill required fields (cutter name)
    page.fill("#cutterName", "Auto Tester")
    page.fill("#lineCode", "X")
    page.fill("#turnedToLineCode", "Y")

    # 5. Record the cut
    page.click("#recordBtn")
    page.wait_for_timeout(1000)

    # Click OK on Save Success alert
    page.click("text=OK")
    page.wait_for_timeout(1000)

    # 6. Verify Toast and List Item status
    page.screenshot(path="verification/screenshots/autofill_completed.png")

    # Check if item is now in "Completed" filter
    page.select_option("#wireListStatusFilter", "completed")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/screenshots/autofill_list_completed.png")

if __name__ == "__main__":
    os.makedirs("verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_autofill_verification(page)
        finally:
            browser.close()
