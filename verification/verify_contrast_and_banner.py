import time
import os
from playwright.sync_api import sync_playwright

def verify():
    print("🚀 Starting verification for contrast colors and active order banner clearing...")

    os.makedirs("verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Open Standalone Wire Cut List
        page_list = context.new_page()
        page_list.goto("http://localhost:3000/src/pages/wire-cut-list/wire-cut-list.html")
        page_list.wait_for_timeout(1000)

        # Open Cutting Records page
        page_records = context.new_page()
        page_records.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
        page_records.wait_for_timeout(1000)

        # Step 1: Add a new item on wire cut list page
        page_list.bring_to_front()
        page_list.click("#addWireListItemBtnDirect")
        page_list.wait_for_timeout(300)

        page_list.fill("#wireListOrder", "CONTRAST101")
        page_list.fill("#wireListCustomer", "ACME CORP")
        page_list.fill("#wireListWireType", "1/0 CU")
        page_list.fill("#wireListLength", "250")
        page_list.click("#saveWireListItemBtn")
        page_list.wait_for_timeout(1000)

        # Find card
        card_selector = ".wire-list-card"
        page_list.wait_for_selector(card_selector)

        # Test Light Background Contrast
        page_list.evaluate("async () => await updateWireListItemColor(wireCutList[0].id, '#fef08a')")
        page_list.wait_for_timeout(500)

        light_color = page_list.evaluate("() => getComputedStyle(document.querySelector('.wire-list-card')).color")
        print(f"Computed text color for light bg (#fef08a): {light_color}")

        page_list.screenshot(path="verification/screenshots/contrast_light_bg.png")

        # Test Dark Background Contrast
        page_list.evaluate("async () => await updateWireListItemColor(wireCutList[0].id, '#1e293b')")
        page_list.wait_for_timeout(500)

        dark_color = page_list.evaluate("() => getComputedStyle(document.querySelector('.wire-list-card')).color")
        print(f"Computed text color for dark bg (#1e293b): {dark_color}")

        page_list.screenshot(path="verification/screenshots/contrast_dark_bg.png")

        assert "255, 255, 255" in dark_color or "#ffffff" in dark_color, f"Expected white text on dark bg, got {dark_color}"
        assert "31, 41, 55" in light_color or "0, 0, 0" in light_color or "#1f2937" in light_color, f"Expected dark text on light bg, got {light_color}"
        print("✅ Contrast colors verified successfully!")

        # Step 2: Set item active and check Active Order Banner on Cutting Records
        print("Testing Active Order Banner clearing...")
        page_list.evaluate("async () => await setActiveWireListItem(wireCutList[0].id)")
        page_list.wait_for_timeout(1000)

        page_records.bring_to_front()
        page_records.wait_for_timeout(1000)

        banner = page_records.locator("#activeOrderBanner")
        is_banner_visible = banner.is_visible()
        print(f"Banner visible after setting active: {is_banner_visible}")
        assert is_banner_visible, "Expected active order banner to be visible"

        page_records.screenshot(path="verification/screenshots/banner_active.png")

        # Step 3: Complete the active item and verify banner disappears
        page_list.bring_to_front()
        page_list.evaluate("async () => await completeWireListItem(wireCutList[0].id, true)")
        page_list.wait_for_timeout(1000)

        page_records.bring_to_front()
        page_records.reload()
        page_records.wait_for_timeout(1000)

        is_banner_visible_after = banner.is_visible()
        print(f"Banner visible after completing active item: {is_banner_visible_after}")
        assert not is_banner_visible_after, "Expected active order banner to be hidden after order completion"

        page_records.screenshot(path="verification/screenshots/banner_cleared.png")
        print("✅ Active Order Banner clearing verified successfully!")

        context.close()
        browser.close()

if __name__ == "__main__":
    verify()
