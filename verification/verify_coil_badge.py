import time
from playwright.sync_api import sync_playwright

def run_verification():
    print("🚀 Starting Wire Cut List Coil Badge verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Open standalone wire cut list page
        page.goto("http://localhost:3000/src/pages/wire-cut-list/wire-cut-list.html")
        page.wait_for_selector("#wireListPage")
        time.sleep(1)

        # Click Add Item button
        print("Opening Add Item modal...")
        page.click("#addWireListItemBtnDirect")
        page.wait_for_selector("#wireListItemModal:not(.hidden)")

        # Fill in item details including Coil
        print("Filling form with Coil Code 'Z'...")
        page.fill("#wireListOrder", "COILTEST123")
        page.fill("#wireListCustomer", "LUCAS CUSTOMER")
        page.fill("#wireListWireType", "TK6/3CU")
        page.fill("#wireListCoilCode", "Z")
        page.fill("#wireListLength", "50")

        # Save item
        page.click("#saveWireListItemBtn")
        time.sleep(1)

        # Check that item card renders COIL: Z badge
        badge = page.query_selector("text=COIL: Z")
        assert badge is not None, "❌ COIL: Z badge was not found on list item card!"
        print("✅ COIL: Z badge successfully rendered on standalone list card!")

        page.screenshot(path="verification/coil_badge_standalone.png")

        # Test another entry with Coil Code 'A'
        page.click("#addWireListItemBtnDirect")
        page.wait_for_selector("#wireListItemModal:not(.hidden)")

        print("Filling form with Coil Code 'A'...")
        page.fill("#wireListOrder", "COILTEST456")
        page.fill("#wireListCustomer", "LUCAS CUSTOMER 2")
        page.fill("#wireListWireType", "TK10/3")
        page.fill("#wireListCoilCode", "a") # lower case to test auto-uppercase
        page.fill("#wireListLength", "100")

        page.click("#saveWireListItemBtn")
        time.sleep(1)

        badge_a = page.query_selector("text=COIL: A")
        assert badge_a is not None, "❌ COIL: A badge was not found on list item card!"
        print("✅ COIL: A badge successfully rendered (with auto-uppercase) on standalone list card!")

        page.screenshot(path="verification/coil_badge_standalone_a.png")

        browser.close()
        print("🎉 Coil Badge Verification Passed Successfully!")

if __name__ == "__main__":
    run_verification()
