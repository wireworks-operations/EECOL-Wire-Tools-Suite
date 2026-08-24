import os
import time
from playwright.sync_api import sync_playwright

def run_verification():
    print("🚀 Starting Click-to-Edit & Context Menu Verification...")

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
        print("Adding Item 'CLICK-EDIT-1'...")
        page.locator("#addWireListItemBtnDirect").click()
        page.wait_for_timeout(300)

        page.locator("#wireListOrder").fill("CLICK-EDIT-1")
        page.locator("#wireListLine").fill("1")
        page.locator("#wireListCustomer").fill("TEST CORP")
        page.locator("#wireListWireType").fill("RW90")
        page.locator("#wireListLength").fill("300")
        page.locator("#saveWireListItemBtn").click()
        page.wait_for_timeout(500)

        item_card = page.locator(".wire-list-item", has_text="CLICK-EDIT-1").first

        # 2. Left-click card to trigger Edit Modal
        print("Clicking card to open edit modal...")
        item_card.click()
        page.wait_for_timeout(500)

        modal = page.locator("#wireListItemModal")
        order_input_val = page.locator("#wireListOrder").input_value()

        if modal.is_visible() and order_input_val == "CLICK-EDIT-1":
            print("✅ Verified left-clicking card opens edit modal populated with item details!")
        else:
            print("❌ Left-clicking card failed to open populated edit modal!")
            exit(1)

        # Close modal
        page.locator("#cancelWireListItemBtn").click()
        page.wait_for_timeout(300)

        # 3. Right-click card to open context menu
        print("Right-clicking card to verify context menu...")
        item_card.click(button="right")
        page.wait_for_timeout(300)

        ctx_menu = page.locator("#wireListContextMenu")
        if not ctx_menu.is_visible():
            print("❌ Context menu failed to appear!")
            exit(1)

        # Verify #ctxEdit is NOT present
        ctx_edit = page.locator("#ctxEdit")
        if not ctx_edit.is_visible():
            print("✅ Verified 'Edit' option is removed from right-click context menu!")
        else:
            print("❌ 'Edit' option still present in context menu!")
            exit(1)

        # Verify remaining options
        ctx_active = page.locator("#ctxActive")
        ctx_group = page.locator("#ctxGroup")
        ctx_remove = page.locator("#ctxRemove")

        if ctx_active.is_visible() and ctx_group.is_visible() and ctx_remove.is_visible():
            print("✅ Verified context menu contains Make Active, Add to Group, and Remove options!")
        else:
            print("❌ Context menu options missing!")
            exit(1)

        # Take screenshot
        screenshot_path = "verification/screenshots/wire_cut_list_click_edit.png"
        page.screenshot(path=screenshot_path)
        print(f"📸 Screenshot saved to {screenshot_path}")

        # Clean up database
        page.evaluate("window.eecolDB ? window.eecolDB.clear('wireCutList') : null")
        page.wait_for_timeout(300)

        print("🎉 Click-to-Edit & Context Menu Verification Passed Successfully!")
        context.close()
        browser.close()

if __name__ == "__main__":
    run_verification()
