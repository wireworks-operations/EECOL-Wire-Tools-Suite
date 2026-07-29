import sys
import time
from playwright.sync_api import sync_playwright

def run_verification():
    print("🚀 Starting Machine Maintenance Checklist 'Fill Last' verification...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="verification/videos"
        )

        page = context.new_page()

        # =====================================================================
        # PART 1: Single-Page Checklist Verification
        # =====================================================================
        print("\n--- Testing Single-Page Maintenance Checklist ---")
        page.goto("http://localhost:3000/src/pages/machine-maintenance-checklist/machine-maintenance-checklist.html")
        page.wait_for_timeout(1000)

        # Ensure database is clean
        print("Cleaning maintenanceLogs store...")
        page.evaluate("window.eecolDB.clear('maintenanceLogs')")
        page.wait_for_timeout(500)

        # 1. Verify "⚡ Fill Last" button is present
        fill_last_btn = page.locator("#fillLastBtn")
        if fill_last_btn.is_visible():
            print("✅ 'Fill Last' button is visible on Single-Page checklist.")
        else:
            print("❌ 'Fill Last' button is NOT visible on Single-Page checklist.")
            sys.exit(1)

        # 2. Click "Fill Last" when empty -> check fallback modal
        print("Clicking 'Fill Last' with no previous completed logs...")
        fill_last_btn.click()
        page.wait_for_timeout(500)

        modal_title = page.locator("#modalTitle").text_content()
        modal_msg = page.locator("#modalMessage").text_content()
        print(f"Modal title: '{modal_title}', Message: '{modal_msg}'")

        if "No Entries Found" in modal_title or "No previous completed" in modal_msg:
            print("✅ Fallback alert modal successfully displayed when no previous entries exist.")
        else:
            print("❌ Expected fallback alert modal, but got different content.")
            sys.exit(1)

        # Dismiss fallback modal
        page.locator("#modalButtons button", has_text="OK").click()
        page.wait_for_timeout(500)

        # 3. Complete and submit a daily checklist
        print("Filling checklist to save a completed entry...")
        page.locator("#globalInspectedBy").fill("Lucas Verification Tests")
        page.locator("#comments").fill("Comments for previous day's log")

        # Check some boxes
        # For Machine 4 (Telus Machine), Item 0 (Frame Welds & Covers) -> OK
        telus_ok = page.locator('.ok-checkbox[data-machine="4"][data-item="0"]')
        telus_ok.check()
        # For Machine 5 (Big B1 Machine), Item 1 (Hoses & Cables) -> NG
        b1_ng = page.locator('.not-ok-checkbox[data-machine="5"][data-item="1"]')
        b1_ng.check()

        # We need to fill all required checkboxes to complete successfully
        # Let's populate the remaining required checkboxes with 'OK' so validateChecklist passes
        skip_lists = {
            1: [1,2,3,4,5,6,7], # Manual Hand Coiler skips
            2: [3,4,5,7],       # Green Electric Hand Coiler skips
            3: [3,4,5]          # Blue Electric Hand Coiler skips
        }

        print("Checking all other checklist items...")
        for machine in range(1, 7):
            skips = skip_lists.get(machine, [])
            for item in range(13):
                if item in skips:
                    continue
                # If we haven't checked it already
                ok_box = page.locator(f'.ok-checkbox[data-machine="{machine}"][data-item="{item}"]')
                ng_box = page.locator(f'.not-ok-checkbox[data-machine="{machine}"][data-item="{item}"]')
                if not ok_box.is_checked() and not ng_box.is_checked():
                    ok_box.check()

        page.screenshot(path="verification/screenshots/single_checklist_filled.png")
        print("📸 Screenshot saved: single_checklist_filled.png")

        # Click Complete
        print("Clicking 'Complete' to save checklist...")
        page.locator("#completeBtn").click()
        page.wait_for_timeout(1000)

        # Dismiss success modal
        success_ok = page.locator("#modalButtons button", has_text="OK")
        if success_ok.is_visible():
            success_ok.click()
            page.wait_for_timeout(500)

        # 4. Clear/Reset fields and reload
        print("Reloading page to reset form...")
        page.reload()
        page.wait_for_timeout(1000)

        # Verify form is empty (except for auto-restored current_session, so let's clear current_session)
        page.evaluate("window.eecolDB.delete('maintenanceLogs', 'current_session')")
        page.reload()
        page.wait_for_timeout(1000)

        # Verify fields are empty
        inspected_by = page.locator("#globalInspectedBy").input_value()
        comments_val = page.locator("#comments").input_value()
        print(f"Empty state: Inspector='{inspected_by}', Comments='{comments_val}'")

        # 5. Click "⚡ Fill Last" and verify confirmation + refill
        print("Clicking 'Fill Last' to refill from saved log...")
        fill_last_btn.click()
        page.wait_for_timeout(500)

        # Verify confirmation modal
        confirm_title = page.locator("#modalTitle").text_content()
        print(f"Confirmation modal title: '{confirm_title}'")
        if "Confirm" in confirm_title or "Fill Last" in confirm_title:
            print("✅ Confirmation modal correctly shown.")
        else:
            print("❌ Confirmation modal title mismatch.")
            sys.exit(1)

        # Accept confirmation
        page.locator("#modalButtons button", has_text="OK").click()
        page.wait_for_timeout(1000)

        # Dismiss success/filled notification
        success_filled_ok = page.locator("#modalButtons button", has_text="OK")
        if success_filled_ok.is_visible():
            success_filled_ok.click()
            page.wait_for_timeout(500)

        # Verify fields are correctly refilled
        refilled_inspector = page.locator("#globalInspectedBy").input_value()
        refilled_comments = page.locator("#comments").input_value()
        refilled_telus_ok = page.locator('.ok-checkbox[data-machine="4"][data-item="0"]').is_checked()
        refilled_b1_ng = page.locator('.not-ok-checkbox[data-machine="5"][data-item="1"]').is_checked()

        print(f"Refilled state: Inspector='{refilled_inspector}', Comments='{refilled_comments}'")
        print(f"Refilled checkboxes: Telus OK checked={refilled_telus_ok}, Big B1 NG checked={refilled_b1_ng}")

        if refilled_inspector == "Lucas Verification Tests" and refilled_comments == "Comments for previous day's log":
            print("✅ Inspected By and Comments successfully refilled!")
        else:
            print("❌ Field refill mismatch!")
            sys.exit(1)

        if refilled_telus_ok and refilled_b1_ng:
            print("✅ Checkbox states (OK & NG) successfully refilled!")
        else:
            print("❌ Checkbox refill mismatch!")
            sys.exit(1)

        page.screenshot(path="verification/screenshots/single_checklist_refilled.png")
        print("📸 Screenshot saved: single_checklist_refilled.png")


        # =====================================================================
        # PART 2: Multi-Page Checklist Verification
        # =====================================================================
        print("\n--- Testing Multi-Page Maintenance Checklist ---")
        page.goto("http://localhost:3000/src/pages/machine-maintenance-checklist/machine-maintenance-checklist-multi.html")
        page.wait_for_timeout(1000)

        # 1. Verify "⚡ Fill Last" button is present
        fill_last_btn_multi = page.locator("#fillLastBtn")
        if fill_last_btn_multi.is_visible():
            print("✅ 'Fill Last' button is visible on Multi-Page checklist.")
        else:
            print("❌ 'Fill Last' button is NOT visible on Multi-Page checklist.")
            sys.exit(1)

        # 2. Click "Fill Last" -> verify confirmation modal
        # Since we completed a checklist in Part 1 (which stored a valid log),
        # this multi-page form should pull the record we just completed!
        print("Clicking 'Fill Last' on Multi-Page checklist...")
        fill_last_btn_multi.click()
        page.wait_for_timeout(500)

        confirm_title_multi = page.locator("#modalTitle").text_content()
        print(f"Multi-Page confirmation modal title: '{confirm_title_multi}'")
        if "Confirm" in confirm_title_multi or "Fill Last" in confirm_title_multi:
            print("✅ Confirmation modal correctly shown.")
        else:
            print("❌ Confirmation modal title mismatch on multi-page.")
            sys.exit(1)

        # Accept confirmation
        page.locator("#modalButtons button", has_text="OK").click()
        page.wait_for_timeout(1000)

        # Dismiss success/filled notification
        success_filled_ok_multi = page.locator("#modalButtons button", has_text="OK")
        if success_filled_ok_multi.is_visible():
            success_filled_ok_multi.click()
            page.wait_for_timeout(500)

        # Verify multi-page fields are refilled
        # The multi-page checklist maps state[`machine-${i}`] fields:
        # inspectedBy, comments, checks
        refilled_inspected_1 = page.locator("#inspectedBy-1").input_value()
        refilled_comments_1 = page.locator("#comments-1").input_value()
        refilled_telus_ok_multi = page.locator('.ok-checkbox[data-machine="4"][data-item="0"]').is_checked()
        refilled_b1_ng_multi = page.locator('.not-ok-checkbox[data-machine="5"][data-item="1"]').is_checked()

        print(f"Multi-Page Refilled Machine-1: Inspector='{refilled_inspected_1}', Comments='{refilled_comments_1}'")
        print(f"Multi-Page Refilled checkboxes: Telus OK checked={refilled_telus_ok_multi}, Big B1 NG checked={refilled_b1_ng_multi}")

        # Note: In Part 1, the completed record structure saved `globalInspectedBy` and `comments` globally,
        # but the checks are saved under machine-1 to machine-6 checks arrays.
        # So the checks should be perfectly refilled! Let's verify that checks were restored.
        if refilled_telus_ok_multi and refilled_b1_ng_multi:
            print("✅ Checkbox states successfully refilled in Multi-Page checklist!")
        else:
            print("❌ Checkbox refill mismatch in Multi-Page checklist!")
            sys.exit(1)

        page.screenshot(path="verification/screenshots/multi_checklist_refilled.png")
        print("📸 Screenshot saved: multi_checklist_refilled.png")

        print("\n🎉 All Verification Tests Passed Successfully!")

        context.close()
        browser.close()

if __name__ == "__main__":
    run_verification()
