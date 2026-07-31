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

        # Page 1: Standalone Wire Cut List page
        print("Opening Standalone Wire Cut List page...")
        page2 = context.new_page()
        page2.goto("http://127.0.0.1:3000/src/pages/wire-cut-list/wire-cut-list.html")
        page2.wait_for_timeout(1000)

        # Verify "Add Item" button is visible
        add_btn = page2.locator("#addWireListItemBtnDirect")
        if add_btn.is_visible():
            print("✅ Verified Add Item button is visible on Standalone page.")
        else:
            print("❌ Add Item button is missing from Standalone page.")
            context.close()
            browser.close()
            exit(1)

        # 1. Click "+ Add Item" on the standalone page to open its modal
        print("Opening Add Item modal...")
        add_btn.click()
        page2.wait_for_timeout(500)

        # Fill out the modal fields on the standalone page
        page2.locator("#wireListOrder").fill("ORD9999")
        page2.locator("#wireListLine").fill("1")
        page2.locator("#wireListCustomer").fill("LUCAS CORP")
        page2.locator("#wireListWireType").fill("TK6/3CU")
        page2.locator("#wireListLength").fill("250")
        page2.locator("#wireListReelSize").fill("36")
        page2.locator("#wireListUrgency").select_option("normal")
        page2.locator("#wireListDescription").fill("E2E DEACTIVATION TEST")
        page2.locator("#wireListOrderComments").fill("TEST DEACTIVATE COMMENTS")
        page2.locator("#wireListShipperComments").fill("TEST SHIPPER COMMENTS")
        page2.wait_for_timeout(500)

        # Save Item
        print("Saving new item to Wire Cut List...")
        page2.locator("#saveWireListItemBtn").click()
        page2.wait_for_timeout(1000)

        # Verify ORD9999 item is listed in the standalone workspace
        item_text_locator = "text=ORD9999 / 1"
        item_locator = page2.locator(".wire-list-item", has_text="ORD9999 / 1")
        if item_locator.is_visible():
            print("✅ Standalone page successfully loaded and rendered the new item!")
        else:
            print("❌ Newly added item ORD9999 is missing from the standalone list.")
            context.close()
            browser.close()
            exit(1)

        page2.screenshot(path="/home/jules/verification/screenshots/wire_cut_list_standalone.png")
        print("📸 Screenshot saved: wire_cut_list_standalone.png")

        # 2. Right-click the item to open context menu
        print("Right-clicking the item...")
        item_locator.click(button="right")
        page2.wait_for_timeout(500)

        # Verify Make Active is visible, and Clear Active Status is hidden
        ctx_active = page2.locator("#ctxActive")
        ctx_deactivate = page2.locator("#ctxDeactivate")

        if ctx_active.is_visible() and not ctx_deactivate.is_visible():
            print("✅ Verified: 'Make Active' is visible and 'Clear Active Status' is hidden for inactive item.")
        else:
            print(f"❌ Context menu visibility mismatch. Make Active visible: {ctx_active.is_visible()}, Clear Active Status visible: {ctx_deactivate.is_visible()}")
            context.close()
            browser.close()
            exit(1)

        # Click "Make Active"
        print("Clicking 'Make Active'...")
        ctx_active.click()
        page2.wait_for_timeout(500)

        # Verify Success Toast is shown
        toast_container = page2.locator("#toastContainer")
        if toast_container.is_visible() and "set as Active" in toast_container.inner_text():
            print("✅ Verified success toast notification for activation!")
        else:
            print("❌ Success toast notification missing or incorrect.")
            context.close()
            browser.close()
            exit(1)

        page2.wait_for_timeout(2000) # wait for toast to fade or just check the DOM

        # Right-click again
        print("Right-clicking the item again...")
        item_locator.click(button="right")
        page2.wait_for_timeout(500)

        # Verify Clear Active Status is visible, and Make Active is hidden
        if ctx_deactivate.is_visible() and not ctx_active.is_visible():
            print("✅ Verified: 'Clear Active Status' is visible and 'Make Active' is hidden for active item.")
        else:
            print(f"❌ Context menu visibility mismatch after activating. Make Active visible: {ctx_active.is_visible()}, Clear Active Status visible: {ctx_deactivate.is_visible()}")
            context.close()
            browser.close()
            exit(1)

        # Click "Clear Active Status"
        print("Clicking 'Clear Active Status'...")
        ctx_deactivate.click()
        page2.wait_for_timeout(500)

        # Verify Warning Toast is shown
        if toast_container.is_visible() and "active status removed" in toast_container.inner_text():
            print("✅ Verified warning toast notification for deactivation!")
        else:
            print("❌ Warning/deactivation toast notification missing or incorrect.")
            context.close()
            browser.close()
            exit(1)

        # Page 3: Main Cutting Records page (cross-tab integration test)
        print("Opening Cutting Records page to test cross-tab autofill...")
        page1 = context.new_page()
        page1.goto("http://127.0.0.1:3000/src/pages/cutting-records/cutting-records.html")
        page1.wait_for_timeout(1000)

        # Go back to standalone page and trigger AutoFill
        page2.bring_to_front()
        page2.wait_for_timeout(500)
        autofill_btn = page2.locator("button:has-text('AutoFill Cut')").first
        autofill_btn.click()
        page2.wait_for_timeout(1000)

        # Switch back to Cutting Records to check values
        page1.bring_to_front()
        page1.wait_for_timeout(1000)

        order_num_val = page1.locator("#orderNumber").input_value()
        customer_val = page1.locator("#customerName").input_value()
        wire_id_val = page1.locator("#wireId").input_value()
        cut_length_val = page1.locator("#cutLength").input_value()

        print(f"Autofilled Form Fields: Order={order_num_val}, Customer={customer_val}, Wire={wire_id_val}, Length={cut_length_val}")

        if order_num_val == "ORD9999" and customer_val == "LUCAS CORP" and wire_id_val == "TK6/3CU" and cut_length_val == "250":
            print("✅ Verified cross-tab autofill still works perfectly!")
        else:
            print("❌ Form cross-tab autofill verification failed.")
            context.close()
            browser.close()
            exit(1)

        # Take final screenshot showing successful autofill on Cutting Records page
        page1.screenshot(path="/home/jules/verification/screenshots/verification.png")
        print("📸 Screenshot saved: verification.png")

        # Clean up by deleting the item from page 2
        print("Cleaning up database entries...")
        page2.bring_to_front()
        page2.evaluate("window.eecolDB.clear('wireCutList')")
        page2.wait_for_timeout(500)

        print("🎉 Standalone Wire Cut List Verification Passed Successfully!")

        context.close()
        browser.close()

if __name__ == "__main__":
    run_verification()
