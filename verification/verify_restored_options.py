import os
import time
from playwright.sync_api import sync_playwright

def run_verification():
    print("🚀 Starting Restored Options Verification...")

    os.makedirs("verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Page 1: Standalone Wire Cut List
        page = context.new_page()
        page.goto("http://localhost:3000/src/pages/wire-cut-list/wire-cut-list.html")
        page.wait_for_timeout(1000)

        # Clear DB
        page.evaluate("window.eecolDB ? window.eecolDB.clear('wireCutList') : null")
        page.reload()
        page.wait_for_timeout(1000)

        # 1. Add Item with Full Pick and Re-Reel checked
        print("Adding Item 'FULL-REREEL-1' with Full Pick and Re-Reel...")
        page.locator("#addWireListItemBtnDirect").click()
        page.wait_for_timeout(300)

        page.locator("#wireListOrder").fill("REREEL1")
        page.locator("#wireListLine").fill("1")
        page.locator("#wireListCustomer").fill("TEST CORP")
        page.locator("#wireListWireType").fill("TK6/3")
        page.locator("#wireListLength").fill("100")
        page.locator("#wireListReelSize").fill("36")
        page.locator("#wireListFullPick").check()
        page.locator("#wireListReReel").check()
        page.locator("#saveWireListItemBtn").click()
        page.wait_for_timeout(500)

        item_card = page.locator(".wire-list-item", has_text="REREEL1").first

        # Verify badges
        fp_badge = item_card.locator("text=📦 Full Pick")
        rr_badge = item_card.locator("text=🔄 Re-Reel")

        if fp_badge.is_visible() and rr_badge.is_visible():
            print("✅ Verified '📦 Full Pick' and '🔄 Re-Reel' badges display on item card!")
        else:
            print("❌ Full Pick or Re-Reel badges missing on card!")
            exit(1)

        # 2. Verify Clear Active Status in Context Menu
        print("Testing Make Active and Clear Active Status...")
        item_card.click(button="right")
        page.wait_for_timeout(300)

        page.locator("#ctxActive").click()
        page.wait_for_timeout(300)

        if item_card.locator("text=🌟 Active").is_visible():
            print("✅ Verified item set as Active!")
        else:
            print("❌ Item failed to set as Active!")
            exit(1)

        # Right click to clear active status
        item_card.click(button="right")
        page.wait_for_timeout(300)

        clear_active_btn = page.locator("#ctxClearActive")
        if clear_active_btn.is_visible():
            print("✅ Verified '🛑 Clear Active Status' button is present in context menu!")
            clear_active_btn.click()
            page.wait_for_timeout(300)
        else:
            print("❌ '🛑 Clear Active Status' button missing in context menu!")
            exit(1)

        if not item_card.locator("text=🌟 Active").is_visible():
            print("✅ Verified Active status successfully cleared!")
        else:
            print("❌ Active status failed to clear!")
            exit(1)

        # 3. Test AutoFill with Re-Reel sync to Cutting Records page
        print("Testing AutoFill with Re-Reel option on Cutting Records page...")
        page2 = context.new_page()
        page2.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
        page2.wait_for_timeout(1000)

        # Trigger autofill from page 1
        page.bring_to_front()
        item_card.locator("button:has-text('AutoFill Cut')").click()
        page.wait_for_timeout(500)

        # Check Cutting Records page
        page2.bring_to_front()
        page2.wait_for_timeout(500)

        re_reel_checked = page2.locator("#reReel").is_checked()
        full_pick_checked = page2.locator("#fullPick").is_checked()

        if re_reel_checked:
            print("✅ Verified Re-Reel checkbox successfully synced to Cutting Records form!")
        else:
            print("❌ Re-Reel checkbox not checked on Cutting Records page!")
            exit(1)

        # Take screenshot
        screenshot_path = "verification/screenshots/wire_cut_list_restored_options.png"
        page.screenshot(path=screenshot_path)
        print(f"📸 Screenshot saved to {screenshot_path}")

        # Clean up database
        page.evaluate("window.eecolDB ? window.eecolDB.clear('wireCutList') : null")
        page.wait_for_timeout(300)

        print("🎉 Restored Options Verification Passed Successfully!")
        context.close()
        browser.close()

if __name__ == "__main__":
    run_verification()
