import time
from playwright.sync_api import sync_playwright

def run_verification():
    print("🚀 Starting Standalone Wire Cut List verification...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create a single browser context so localStorage and IndexedDB are shared
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )

        # Page 1: Cutting Records
        page1 = context.new_page()
        page1.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
        page1.wait_for_timeout(1000)

        # 1. Verify "Add Cut" and "Open Wire List" buttons are visible
        add_btn = page1.locator("#addWireListItemBtnDirect")
        open_btn = page1.locator("#openWireListBtn")

        if add_btn.is_visible() and open_btn.is_visible():
            print("✅ Verified action buttons are visible on Cutting Records page.")
        else:
            print("❌ Action buttons are missing from Cutting Records page.")
            context.close()
            browser.close()
            exit(1)

        # Take screenshot of the Cutting Records page with action buttons
        page1.screenshot(path="/home/jules/verification/screenshots/cutting_records_actions.png")
        print("📸 Screenshot saved: cutting_records_actions.png")

        # 2. Click "+ Add Cut" to open the Wire Cut List Item Modal
        print("Opening Add Item modal...")
        add_btn.click()
        page1.wait_for_timeout(500)

        # Fill out the modal fields
        page1.locator("#wireListOrder").fill("ORD1234")
        page1.locator("#wireListLine").fill("2")
        page1.locator("#wireListCustomer").fill("ACME CORP")
        page1.locator("#wireListWireType").fill("TK6/3CU")
        page1.locator("#wireListLength").fill("150")
        page1.locator("#wireListReelSize").fill("40")
        page1.locator("#wireListUrgency").select_option("rush")
        page1.locator("#wireListDescription").fill("TEST DESCRIPTION")
        page1.locator("#wireListOrderComments").fill("TEST ORDER COMMENTS")
        page1.locator("#wireListShipperComments").fill("TEST SHIPPER COMMENTS")
        page1.wait_for_timeout(500)

        # Save Item
        print("Saving new item to Wire Cut List...")
        page1.locator("#saveWireListItemBtn").click()
        page1.wait_for_timeout(1000)

        # Dismiss success modal if it appears
        ok_btn = page1.locator("#modalButtons button", has_text="OK")
        if ok_btn.is_visible():
            ok_btn.click()
            page1.wait_for_timeout(500)

        # Page 2: Standalone Wire Cut List
        print("Opening Standalone Wire Cut List page...")
        page2 = context.new_page()
        page2.goto("http://localhost:3000/src/pages/wire-cut-list/wire-cut-list.html")
        page2.wait_for_timeout(1000)

        # Verify ORD1234 item is listed in the standalone workspace
        item_text_selector = "text=ORD1234 / 2"
        if page2.locator(item_text_selector).is_visible():
            print("✅ Standalone page successfully loaded and rendered the new item!")
        else:
            print("❌ Newly added item ORD1234 is missing from the standalone list.")
            context.close()
            browser.close()
            exit(1)

        # Take screenshot of the Standalone Wire Cut List page
        page2.screenshot(path="/home/jules/verification/screenshots/wire_cut_list_standalone.png")
        print("📸 Screenshot saved: wire_cut_list_standalone.png")

        # 3. Test AutoFill Cut trigger
        print("Testing AutoFill Cut button interaction...")
        autofill_btn = page2.locator("button:has-text('AutoFill Cut')").first
        autofill_btn.click()
        page2.wait_for_timeout(1000)

        # Check that eecolWireListAutofillId is present or autofilled successfully
        # Switch back to page 1 to check if fields were autofilled
        page1.bring_to_front()
        page1.wait_for_timeout(1000)

        order_num_val = page1.locator("#orderNumber").input_value()
        customer_val = page1.locator("#customerName").input_value()
        wire_id_val = page1.locator("#wireId").input_value()
        cut_length_val = page1.locator("#cutLength").input_value()

        print(f"Autofilled Form Fields: Order={order_num_val}, Customer={customer_val}, Wire={wire_id_val}, Length={cut_length_val}")

        if order_num_val == "ORD1234" and customer_val == "ACME CORP" and wire_id_val == "TK6/3CU" and cut_length_val == "150":
            print("✅ Verified that AutoFill successfully populated the fields in the primary Cutting Records tab!")
        else:
            print("❌ Form autofill verification failed or values did not match.")
            context.close()
            browser.close()
            exit(1)

        # Take final screenshot showing successful autofill on Cutting Records page
        page1.screenshot(path="/home/jules/verification/screenshots/verification.png")
        print("📸 Screenshot saved: verification.png")

        # Clean up by deleting the item from page 2 (via context menu or direct delete in IndexedDB)
        print("Cleaning up database entries...")
        page2.bring_to_front()
        page2.evaluate("window.eecolDB.clear('wireCutList')")
        page2.wait_for_timeout(500)

        print("🎉 Standalone Wire Cut List Verification Passed Successfully!")

        context.close()
        browser.close()

if __name__ == "__main__":
    run_verification()
