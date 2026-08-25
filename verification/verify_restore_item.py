import os
import time
from playwright.sync_api import sync_playwright

def run_verification():
    print("🚀 Starting Wire Cut List Restore Verification...")

    os.makedirs("verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        page = context.new_page()
        page.goto("http://localhost:3000/src/pages/wire-cut-list/wire-cut-list.html")
        page.wait_for_timeout(1000)

        # Clear DB
        page.evaluate("window.eecolDB ? window.eecolDB.clear('wireCutList') : null")
        page.reload()
        page.wait_for_timeout(1000)

        # 1. Add Item
        print("Adding Item 'ORD-RESTORE'...")
        page.locator("#addWireListItemBtnDirect").click()
        page.wait_for_timeout(300)

        page.locator("#wireListOrder").fill("ORD-RESTORE")
        page.locator("#wireListLine").fill("1")
        page.locator("#wireListCustomer").fill("RESTORE CORP")
        page.locator("#wireListWireType").fill("RW90")
        page.locator("#wireListLength").fill("500")
        page.locator("#saveWireListItemBtn").click()
        page.wait_for_timeout(500)

        item_card = page.locator(".wire-list-item", has_text="ORD-RESTORE").first

        # 2. Mark Completed
        print("Marking item as completed...")
        item_card.locator("button:has-text('Complete')").click()
        page.wait_for_timeout(500)

        # Dismiss alert modal if present
        ok_btn = page.locator("#modalButtons button", has_text="OK")
        if ok_btn.is_visible():
            ok_btn.click()
            page.wait_for_timeout(500)

        # Item should disappear from 'Active' view
        if page.locator("text=ORD-RESTORE").is_visible():
            print("❌ Item ORD-RESTORE still visible in Active view after completion!")
            exit(1)
        else:
            print("✅ Verified item hidden from Active list upon completion!")

        # 3. Switch filter to Completed
        print("Switching filter to Completed...")
        page.locator("#wireListStatusFilter").select_option("completed")
        page.wait_for_timeout(500)

        restore_btn = item_card.locator("button:has-text('Restore')")
        if restore_btn.is_visible():
            print("✅ Verified item visible in Completed list with 'Restore' button!")
        else:
            print("❌ Restore button missing in Completed view!")
            exit(1)

        # 4. Click Restore
        print("Clicking Restore button...")
        restore_btn.click()
        page.wait_for_timeout(500)

        # Verify filter auto-switched to active and item is restored
        filter_val = page.locator("#wireListStatusFilter").input_value()
        if filter_val == "active" and page.locator(".wire-list-item", has_text="ORD-RESTORE").is_visible():
            print("✅ Verified item successfully restored to Active list!")
        else:
            print(f"❌ Failed to restore item to active list. Current filter: {filter_val}")
            exit(1)

        # Take screenshot
        screenshot_path = "verification/screenshots/wire_cut_list_restore.png"
        page.screenshot(path=screenshot_path)
        print(f"📸 Screenshot saved to {screenshot_path}")

        # Clean up database
        page.evaluate("window.eecolDB ? window.eecolDB.clear('wireCutList') : null")
        page.wait_for_timeout(300)

        print("🎉 Wire Cut List Restore Verification Passed Successfully!")
        context.close()
        browser.close()

if __name__ == "__main__":
    run_verification()
