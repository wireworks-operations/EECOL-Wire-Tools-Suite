import time
from playwright.sync_api import sync_playwright

def run_verification():
    print("🚀 Starting Group Management & Progressive Disclosure verification...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 900})

        page = context.new_page()
        page.goto("http://localhost:3000/src/pages/wire-cut-list/wire-cut-list.html")
        page.wait_for_timeout(1000)

        # Clear existing DB data for clean slate test
        page.evaluate("window.eecolDB.clear('wireCutList')")
        page.reload()
        page.wait_for_timeout(1000)

        # 1. Add item with Group Name directly in Add Item Modal
        print("Adding Item 1 with group 'Batch Group Alpha' directly in modal...")
        page.locator("#addWireListItemBtnDirect").click()
        page.wait_for_timeout(500)

        page.locator("#wireListOrder").fill("GRP1001")
        page.locator("#wireListLine").fill("001")
        page.locator("#wireListCustomer").fill("ALPHA CUST")
        page.locator("#wireListGroup").fill("Batch Group Alpha")
        page.locator("#wireListWireType").fill("TK6/3CU")
        page.locator("#wireListLength").fill("100")

        page.locator("#saveWireListItemBtn").click()
        page.wait_for_timeout(1000)

        # Verify group container was rendered with "Batch Group Alpha"
        group_header = page.locator("text=Batch Group Alpha")
        assert group_header.is_visible(), "Group container for 'Batch Group Alpha' not rendered!"
        print("✅ Verified item created with Group Name directly in Add Item modal!")

        # 2. Add Item 2 with same group name using datalist/autocomplete
        print("Adding Item 2 to 'Batch Group Alpha'...")
        page.locator("#addWireListItemBtnDirect").click()
        page.wait_for_timeout(500)

        page.locator("#wireListOrder").fill("GRP1002")
        page.locator("#wireListLine").fill("002")
        page.locator("#wireListCustomer").fill("ALPHA CUST")
        page.locator("#wireListGroup").fill("Batch Group Alpha")
        page.locator("#wireListWireType").fill("ACWU90")
        page.locator("#wireListLength").fill("200")

        page.locator("#saveWireListItemBtn").click()
        page.wait_for_timeout(1000)

        # 3. Test Progressive Disclosure in Group Modal
        print("Testing Group Modal progressive disclosure...")
        # Right click Item 1 card to open context menu and click "Add to Group..."
        item1_card = page.locator("text=GRP1001 / 001").first
        item1_card.click(button="right")
        page.wait_for_timeout(500)

        page.locator("#ctxGroup").click()
        page.wait_for_timeout(500)

        # Expand progressive disclosure panel
        toggle_btn = page.locator("#toggleGroupSettingsBtn")
        assert toggle_btn.is_visible(), "Toggle Group Settings button is missing!"
        toggle_btn.click()
        page.wait_for_timeout(500)

        settings_content = page.locator("#groupSettingsContent")
        assert settings_content.is_visible(), "Group Settings content failed to expand!"
        print("✅ Verified progressive disclosure panel expanded!")

        # Take screenshot of expanded Group Settings modal
        page.screenshot(path="verification/screenshots/group_settings_expanded.png")
        print("📸 Screenshot saved: group_settings_expanded.png")

        # Rename group to "Batch Group Omega"
        print("Renaming group to 'Batch Group Omega'...")
        rename_input = page.locator("#renameGroupNameInput")
        rename_input.fill("Batch Group Omega")
        page.locator("#renameGroupBtn").click()
        page.wait_for_timeout(1000)

        # Verify group container header updated to "Batch Group Omega"
        renamed_header = page.locator(".wire-group-container", has_text="Batch Group Omega")
        assert renamed_header.is_visible(), "Renamed group header 'Batch Group Omega' is not visible!"
        print("✅ Verified group renamed across all assigned items!")

        # 4. Test Delete / Disband Group via Progressive Disclosure
        print("Testing Delete / Disband Group via Progressive Disclosure...")
        item2_card = page.locator("text=GRP1002 / 002").first
        item2_card.click(button="right")
        page.wait_for_timeout(500)

        page.locator("#ctxGroup").click()
        page.wait_for_timeout(500)

        page.locator("#toggleGroupSettingsBtn").click()
        page.wait_for_timeout(500)

        # Click Delete / Disband button
        page.locator("#deleteGroupBtn").click()
        page.wait_for_timeout(500)

        # Confirm modal alert/dialog
        ok_btn = page.locator("#modalButtons button", has_text="OK")
        if ok_btn.is_visible():
            ok_btn.click()
            page.wait_for_timeout(500)

        # Verify group header "Batch Group Omega" is gone and items are standalone
        assert page.locator(".wire-group-container", has_text="Batch Group Omega").count() == 0, "Group container should no longer exist!"
        assert page.locator("text=GRP1001 / 001").is_visible(), "Item GRP1001 should revert to standalone!"
        assert page.locator("text=GRP1002 / 002").is_visible(), "Item GRP1002 should revert to standalone!"
        print("✅ Verified group disbanded and items reverted to standalone cards!")

        # Final screenshot
        page.screenshot(path="verification/screenshots/group_disbanded_standalone.png")
        print("📸 Screenshot saved: group_disbanded_standalone.png")

        # Clean up
        page.evaluate("window.eecolDB.clear('wireCutList')")

        print("🎉 GROUP MANAGEMENT VERIFICATION PASSED SUCCESSFULLY!")
        context.close()
        browser.close()

if __name__ == "__main__":
    run_verification()
