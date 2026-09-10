import time
from playwright.sync_api import sync_playwright

def run_verification():
    print("🚀 Starting Coil Code & Complete AutoFill verification...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Page 1: Cutting Records
        page1 = context.new_page()
        page1.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
        page1.wait_for_timeout(1000)

        # Page 2: Standalone Wire Cut List
        page2 = context.new_page()
        page2.goto("http://localhost:3000/src/pages/wire-cut-list/wire-cut-list.html")
        page2.wait_for_timeout(1000)

        # 1. Open Add Item modal in Standalone Cut List
        print("Opening Add Item modal on Standalone list page...")
        page2.locator("#addWireListItemBtnDirect").click()
        page2.wait_for_timeout(500)

        # Fill modal fields including Coil Code
        page2.locator("#wireListOrder").fill("ORD1234")
        page2.locator("#wireListLine").fill("001")
        page2.locator("#wireListCoilCode").fill("a") # testing auto-uppercase
        page2.locator("#wireListCustomer").fill("TEST CUST")
        page2.locator("#wireListWireType").fill("TK6/3CU")
        page2.locator("#wireListLength").fill("250")
        page2.locator("#wireListFullPick").select_option("yes")
        page2.locator("#wireListReReel").select_option("yes")

        # Verify auto-uppercase worked on Coil Code input
        coil_input_val = page2.locator("#wireListCoilCode").input_value()
        print(f"Coil input value: '{coil_input_val}'")
        assert coil_input_val == "A", f"Expected 'A', got '{coil_input_val}'"

        # Save item
        print("Saving list item...")
        page2.locator("#saveWireListItemBtn").click()
        page2.wait_for_timeout(1000)

        # Verify Coil Badge is visible
        coil_badge = page2.locator("span", has_text="Coil: A")
        assert coil_badge.is_visible(), "Coil badge 'Coil: A' is not visible on item card!"
        print("✅ Verified 'Coil: A' badge is rendered on card!")

        # Take screenshot of active list card with Coil badge
        page2.screenshot(path="verification/screenshots/coil_badge_card.png")
        print("📸 Screenshot saved: coil_badge_card.png")

        # Verify standalone AutoFill Cut button is NOT present
        autofill_btn = page2.locator("button", has_text="AutoFill Cut")
        assert autofill_btn.count() == 0, "Standalone 'AutoFill Cut' button should have been removed!"
        print("✅ Verified standalone 'AutoFill Cut' button is removed!")

        # 2. Test search filter by Coil Code
        print("Testing search filter with Coil Code 'A'...")
        search_input = page2.locator("#wireListSearch")
        search_input.fill("A")
        page2.wait_for_timeout(500)
        assert page2.locator("text=ORD1234 / 001").is_visible(), "Search by Coil Code failed!"

        search_input.fill("NONEXISTENT")
        page2.wait_for_timeout(500)
        assert not page2.locator("text=ORD1234 / 001").is_visible(), "Filtering nonexistent search failed!"

        search_input.fill("")
        page2.wait_for_timeout(500)

        # 3. Test 'Complete' button triggers AutoFill AND completes item
        print("Testing 'Complete' button...")
        complete_btn = page2.locator("button", has_text="Complete").first
        complete_btn.click()
        page2.wait_for_timeout(1000)

        # Dismiss alert if present
        ok_btn = page2.locator("#modalButtons button", has_text="OK")
        if ok_btn.is_visible():
            ok_btn.click()
            page2.wait_for_timeout(500)

        # Switch to Cutting Records tab to verify autofill worked
        page1.bring_to_front()
        page1.wait_for_timeout(1000)

        order_val = page1.locator("#orderNumber").input_value()
        cust_val = page1.locator("#customerName").input_value()
        wire_val = page1.locator("#wireId").input_value()
        len_val = page1.locator("#cutLength").input_value()

        print(f"Cutting Records Autofilled: Order={order_val}, Cust={cust_val}, Wire={wire_val}, Len={len_val}")
        assert order_val == "ORD1234", f"Expected ORD1234, got {order_val}"
        assert cust_val == "TEST CUST", f"Expected TEST CUST, got {cust_val}"

        print("✅ Verified 'Complete' button triggered AutoFill to Cutting Records tab!")

        # Switch back to standalone list and verify item status updated to completed
        page2.bring_to_front()
        page2.locator("#wireListStatusFilter").select_option("completed")
        page2.wait_for_timeout(500)
        assert page2.locator("text=ORD1234 / 001").is_visible(), "Item should be under Completed filter!"
        print("✅ Verified item status updated to 'completed'!")

        # Take screenshot of completed list with Coil badge
        page2.screenshot(path="verification/screenshots/coil_autofill_verified.png")
        print("📸 Screenshot saved: coil_autofill_verified.png")

        # Clean up DB
        page2.evaluate("window.eecolDB.clear('wireCutList')")

        print("🎉 ALL VERIFICATIONS PASSED SUCCESSFULLY!")
        context.close()
        browser.close()

if __name__ == "__main__":
    run_verification()
