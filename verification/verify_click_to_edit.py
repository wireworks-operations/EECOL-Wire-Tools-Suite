import time
from playwright.sync_api import sync_playwright

def run_verification():
    print("🚀 Starting click-to-edit Wire Cut List verification...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )

        page1 = context.new_page()
        page1.goto("http://localhost:3000/src/pages/wire-cut-list/wire-cut-list.html")
        page1.wait_for_timeout(1000)

        # Let's add an item first
        print("Opening Add Item modal...")
        page1.locator("#addWireListItemBtnDirect").click()
        page1.wait_for_timeout(500)

        # Fill out the modal fields
        page1.locator("#wireListOrder").fill("ORD5555")
        page1.locator("#wireListLine").fill("1")
        page1.locator("#wireListCustomer").fill("LUCAS ENTERPRISES")
        page1.locator("#wireListWireType").fill("TK3/3CU")
        page1.locator("#wireListLength").fill("250")
        page1.locator("#wireListReelSize").fill("45")
        page1.locator("#wireListUrgency").select_option("rush")
        page1.locator("#wireListDescription").fill("CLICK TEST DESCRIPTION")
        page1.locator("#wireListOrderComments").fill("CLICK TEST ORDER COMMENTS")
        page1.locator("#wireListShipperComments").fill("CLICK TEST SHIPPER COMMENTS")
        page1.wait_for_timeout(500)

        # Save Item
        print("Saving new item to Wire Cut List...")
        page1.locator("#saveWireListItemBtn").click()
        page1.wait_for_timeout(1000)

        # Wait for the item to render on page
        item_selector = ".wire-list-item"
        page1.wait_for_selector(item_selector)

        # Click the item entry itself to open the edit modal
        print("Clicking on the item entry card...")
        page1.locator(item_selector).first.click()
        page1.wait_for_timeout(500)

        # Verify that the edit modal is open and has the order number ORD5555
        modal_title = page1.locator("#wireModalTitle")
        order_num_input = page1.locator("#wireListOrder")

        if "Edit" in modal_title.inner_text() and order_num_input.input_value() == "ORD5555":
            print("✅ Verified click-to-edit opens the modal successfully!")
        else:
            print("❌ Failed: Click-to-edit modal was not opened correctly or did not populate with the correct data.")
            context.close()
            browser.close()
            exit(1)

        # Close the modal
        page1.locator("#cancelWireListItemBtn").click()
        page1.wait_for_timeout(500)

        # Verify right-click context menu edit option is gone
        print("Checking right-click menu...")
        page1.locator(item_selector).first.click(button="right")
        page1.wait_for_timeout(500)

        edit_option = page1.locator("#ctxEdit")
        if not edit_option.is_visible():
            print("✅ Verified that the 'Edit' option is no longer present in the context menu!")
        else:
            print("❌ Failed: 'Edit' option is still present in the context menu.")
            context.close()
            browser.close()
            exit(1)

        page1.screenshot(path="/home/jules/verification/screenshots/click_to_edit_verified.png")
        print("📸 Screenshot saved: click_to_edit_verified.png")

        # Clean up database
        print("Cleaning up database entries...")
        page1.evaluate("window.eecolDB.clear('wireCutList')")
        page1.wait_for_timeout(500)

        print("🎉 Click-to-edit Verification Passed Successfully!")

        context.close()
        browser.close()

if __name__ == "__main__":
    run_verification()
