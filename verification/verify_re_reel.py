import time
import os
from playwright.sync_api import sync_playwright

def run_re_reel_verification():
    print("🚀 Starting Re-Reel and Full Pick integration verification...")

    # Make sure screenshot directory exists in BOTH app and home
    os.makedirs("/app/verification/screenshots", exist_ok=True)
    os.makedirs("/app/verification/videos", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create context to record video
        context = browser.new_context(
            record_video_dir="/app/verification/videos"
        )

        # Page 1: Cutting Records
        page1 = context.new_page()
        page1.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
        page1.wait_for_timeout(1000)

        # Let's verify that the new "Re-Reel" checkbox exists in Cutting Records HTML
        re_reel_checkbox = page1.locator("#reReel")
        if re_reel_checkbox.is_visible(timeout=5000):
            print("✅ Verified 'Re-Reel' checkbox exists on Cutting Records form.")
        else:
            print("❌ 'Re-Reel' checkbox is missing on Cutting Records form.")
            context.close()
            browser.close()
            exit(1)

        # Page 2: Standalone Wire Cut List
        page2 = context.new_page()
        page2.goto("http://localhost:3000/src/pages/wire-cut-list/wire-cut-list.html")
        page2.wait_for_timeout(1000)

        # CRITICAL: Clear DB before running to ensure fresh state
        print("Clearing IndexedDB wireCutList table...")
        page2.evaluate("window.eecolDB.clear('wireCutList')")
        page2.wait_for_timeout(500)

        # Open the Add Item Modal (using the correct button ID on standalone page: addWireListItemBtnDirect)
        print("Opening Add Item modal on Standalone Cut List page...")
        page2.locator("#addWireListItemBtnDirect").click()
        page2.wait_for_timeout(500)

        # Verify new select dropdowns 'wireListReReel' and 'wireListFullPick' are present
        re_reel_sel = page2.locator("#wireListReReel")
        full_pick_sel = page2.locator("#wireListFullPick")

        if re_reel_sel.is_visible() and full_pick_sel.is_visible():
            print("✅ Verified 'Re-Reel' and 'Full Pick' dropdowns exist on modal.")
        else:
            print("❌ Modal is missing 'Re-Reel' or 'Full Pick' dropdowns.")
            context.close()
            browser.close()
            exit(1)

        # Verify placement or structure (Urgency element is present)
        urgency_sel = page2.locator("#wireListUrgency")
        if urgency_sel.is_visible():
            print("✅ Verified 'Urgency' select dropdown exists.")

        # Fill modal fields (using conforming 7-char alphanumeric order number)
        page2.locator("#wireListOrder").fill("RE12345")
        page2.locator("#wireListLine").fill("1")
        page2.locator("#wireListCustomer").fill("LUCAS WIRE CO")
        page2.locator("#wireListWireType").fill("REEL-WIRE")
        page2.locator("#wireListLength").fill("250")
        page2.locator("#wireListReelSize").fill("36")
        page2.locator("#wireListReReel").select_option("yes")
        page2.locator("#wireListFullPick").select_option("yes")
        page2.locator("#wireListUrgency").select_option("rush")
        page2.locator("#wireListDescription").fill("This is a Re-Reel and Full Pick test cut.")
        page2.wait_for_timeout(500)

        # Take screenshot of the filled modal showing field values and positioning
        page2.screenshot(path="verification/screenshots/wire_cut_list_modal_filled.png")
        print("📸 Screenshot saved: wire_cut_list_modal_filled.png")

        # Save the list item
        print("Saving the list item...")
        page2.locator("#saveWireListItemBtn").click()
        page2.wait_for_timeout(1000)

        # Dismiss success modal if present
        ok_btn = page2.locator("#modalButtons button", has_text="OK")
        if ok_btn.is_visible():
            ok_btn.click()
            page2.wait_for_timeout(500)

        # Verify the item renders and displays the Re-Reel / Full Pick badges
        card_text = page2.locator(".wire-list-item").first.text_content()
        print(f"Rendered Card Text: {card_text}")
        if "[🔄 RE-REEL]" in card_text and "[⚡ FULL PICK]" in card_text:
            print("✅ Visual indicators [🔄 RE-REEL] and [⚡ FULL PICK] are correctly rendered on the item card.")
        else:
            print("❌ Card indicators missing or incorrect.")
            context.close()
            browser.close()
            exit(1)

        # Take screenshot of the list containing our newly rendered card
        page2.screenshot(path="verification/screenshots/wire_cut_list_cards_new.png")
        print("📸 Screenshot saved: wire_cut_list_cards_new.png")

        # Now click the "AutoFill Cut" button on the card to push the data over to the other tab
        print("Clicking AutoFill Cut button on the list card...")
        autofill_btn = page2.locator("button:has-text('AutoFill Cut')").first
        autofill_btn.click()
        page2.wait_for_timeout(1000)

        # Switch context back to page 1 to verify autofilled state
        page1.bring_to_front()
        page1.wait_for_timeout(1000)

        # Dismiss success modal on Cutting Records page first
        page1_ok_btn = page1.locator("#modalButtons button", has_text="OK")
        if page1_ok_btn.is_visible():
            page1_ok_btn.click()
            page1.wait_for_timeout(500)

        # Verify the fields populated
        order_num = page1.locator("#orderNumber").input_value()
        customer = page1.locator("#customerName").input_value()
        is_re_reel_checked = page1.locator("#reReel").is_checked()
        is_full_pick_checked = page1.locator("#fullPick").is_checked()

        print(f"Autofill outcomes: Order={order_num}, Customer={customer}, Re-Reel Checked={is_re_reel_checked}, Full Pick Checked={is_full_pick_checked}")

        if order_num == "RE12345" and customer == "LUCAS WIRE CO" and is_re_reel_checked and is_full_pick_checked:
            print("✅ SUCCESS! Re-Reel and Full Pick successfully autofilled and communicated to Cutting Records form.")
        else:
            print("❌ Autofill check failed or checkbox state was not communicated.")
            context.close()
            browser.close()
            exit(1)

        # Scroll down so we can see the checked checkboxes
        page1.locator("#reReel").scroll_into_view_if_needed()
        page1.wait_for_timeout(1000)
        page1.screenshot(path="verification/screenshots/cutting_records_autofilled.png")
        print("📸 Screenshot saved: cutting_records_autofilled.png")

        # Cleanup DB
        print("Cleaning up database entries...")
        page2.bring_to_front()
        page2.evaluate("window.eecolDB.clear('wireCutList')")
        page2.wait_for_timeout(500)

        print("🎉 All verifications passed perfectly!")
        context.close()
        browser.close()

if __name__ == "__main__":
    run_re_reel_verification()
