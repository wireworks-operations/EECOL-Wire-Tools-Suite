import os
import time
from playwright.sync_api import sync_playwright

def run_verification():
    print("🚀 Starting Wire Cut List Grouping Verification...")

    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        page = context.new_page()
        page.goto("http://localhost:3000/src/pages/wire-cut-list/wire-cut-list.html")
        page.wait_for_timeout(1000)

        # Ensure clean state
        page.evaluate("window.eecolDB ? window.eecolDB.clear('wireCutList') : null")
        page.reload()
        page.wait_for_timeout(1000)

        # 1. Add Item 1
        print("Adding Item 1 (ORD-G1)...")
        page.locator("#addWireListItemBtnDirect").click()
        page.wait_for_timeout(300)

        page.locator("#wireListOrder").fill("ORD-G1")
        page.locator("#wireListLine").fill("1")
        page.locator("#wireListCustomer").fill("ALPHA CORP")
        page.locator("#wireListWireType").fill("TK6/3")
        page.locator("#wireListLength").fill("100")
        page.locator("#saveWireListItemBtn").click()
        page.wait_for_timeout(500)

        # 2. Add Item 2
        print("Adding Item 2 (ORD-G2)...")
        page.locator("#addWireListItemBtnDirect").click()
        page.wait_for_timeout(300)

        page.locator("#wireListOrder").fill("ORD-G2")
        page.locator("#wireListLine").fill("1")
        page.locator("#wireListCustomer").fill("BETA CORP")
        page.locator("#wireListWireType").fill("RW90")
        page.locator("#wireListLength").fill("200")
        page.locator("#saveWireListItemBtn").click()
        page.wait_for_timeout(500)

        # 3. Right-click Item 1 and add to a new group "RUN_ALPHA"
        print("Adding ORD-G1 to new group 'RUN_ALPHA'...")
        item1_card = page.locator(".wire-list-item", has_text="ORD-G1").first
        item1_card.click(button="right")
        page.wait_for_timeout(300)

        page.locator("#ctxGroup").click()
        page.wait_for_timeout(300)

        page.locator("#groupNameInput").fill("RUN_ALPHA")
        page.locator("#saveGroupBtn").click()
        page.wait_for_timeout(500)

        # Check that ORD-G1 has badge 📁 RUN_ALPHA
        badge1 = item1_card.locator("text=📁 RUN_ALPHA")
        if badge1.is_visible():
            print("✅ Verified ORD-G1 displays Group Badge '📁 RUN_ALPHA'!")
        else:
            print("❌ Badge '📁 RUN_ALPHA' missing on ORD-G1")
            exit(1)

        # 4. Right-click Item 2 and add to existing group "RUN_ALPHA"
        print("Adding ORD-G2 to existing group 'RUN_ALPHA'...")
        item2_card = page.locator(".wire-list-item", has_text="ORD-G2").first
        item2_card.click(button="right")
        page.wait_for_timeout(300)

        page.locator("#ctxGroup").click()
        page.wait_for_timeout(300)

        # Check if dropdown contains RUN_ALPHA
        page.locator("#groupSelect").select_option(value="RUN_ALPHA")
        page.locator("#saveGroupBtn").click()
        page.wait_for_timeout(500)

        # Check that ORD-G2 now also has badge 📁 RUN_ALPHA
        badge2 = item2_card.locator("text=📁 RUN_ALPHA")
        if badge2.is_visible():
            print("✅ Verified ORD-G2 joined existing group and displays '📁 RUN_ALPHA' badge!")
        else:
            print("❌ Badge '📁 RUN_ALPHA' missing on ORD-G2")
            exit(1)

        # 5. Set ORD-G1 to Active and verify active status is individual
        print("Setting ORD-G1 to Active...")
        item1_card.click(button="right")
        page.wait_for_timeout(300)
        page.locator("#ctxActive").click()
        page.wait_for_timeout(500)

        # Verify ORD-G1 has 'Active' badge and ORD-G2 does NOT have 'Active' badge
        if item1_card.locator("text=🌟 Active").is_visible() and not item2_card.locator("text=🌟 Active").is_visible():
            print("✅ Verified active status remains individual within groups!")
        else:
            print("❌ Active status leak detected between grouped items.")
            exit(1)

        # Take screenshot
        screenshot_path = "verification/screenshots/wire_cut_list_groups.png"
        page.screenshot(path=screenshot_path)
        print(f"📸 Screenshot saved to {screenshot_path}")

        # 6. Remove ORD-G2 from group
        print("Removing ORD-G2 from group...")
        item2_card.click(button="right")
        page.wait_for_timeout(300)
        page.locator("#ctxGroup").click()
        page.wait_for_timeout(300)

        page.locator("#removeFromGroupBtn").click()
        page.wait_for_timeout(500)

        if not item2_card.locator("text=📁 RUN_ALPHA").is_visible():
            print("✅ Verified ORD-G2 successfully removed from group!")
        else:
            print("❌ Group badge still present on ORD-G2 after removal")
            exit(1)

        # Clean up database
        page.evaluate("window.eecolDB ? window.eecolDB.clear('wireCutList') : null")
        page.wait_for_timeout(300)

        print("🎉 Wire Cut List Grouping Verification Passed Successfully!")
        context.close()
        browser.close()

if __name__ == "__main__":
    run_verification()
