
from playwright.sync_api import sync_playwright

def verify_wire_mark_calculator():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to localhost
        url = "http://localhost:3000/src/pages/wire-mark-calculator/wire-mark-calculator.html"

        print(f"Navigating to {url}")
        page.goto(url)

        # Wait for page to load
        page.wait_for_load_state("networkidle")

        # Check for the theme toggle button (id="darkModeToggle")
        try:
            page.wait_for_selector("#darkModeToggle", timeout=5000)
            print("Theme toggle found!")
        except:
            print("Theme toggle NOT found!")

        # Take a screenshot in light mode
        page.screenshot(path="verification/wire_mark_light.png")

        # Click the toggle to switch to dark mode
        # If not found, this will fail
        if page.query_selector("#darkModeToggle"):
            page.click("#darkModeToggle")

            # Wait a bit for transition
            page.wait_for_timeout(1000)

            # Take a screenshot in dark mode
            page.screenshot(path="verification/wire_mark_dark.png")
        else:
            print("Skipping dark mode toggle as button was not found.")

        browser.close()

if __name__ == "__main__":
    verify_wire_mark_calculator()
