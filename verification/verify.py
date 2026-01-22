
from playwright.sync_api import sync_playwright

def verify_wire_mark_calculator():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the file
        # Since I'm in the sandbox, I can use file:// protocol if I can't run a server,
        # but the instructions say "Start the local development server".
        # However, for static files without a build step, file:// often works.
        # But this project has a 'npm run dev'. I should probably check if I can use that or file://.
        # Given the simplicity, let's try file:// first as it's faster.
        # But theme-loader.js relies on localStorage, which might behave differently on file://.
        # Let's try to start the server in a separate step or just use file:// and see.

        # Actually, let's use the relative path from the root.
        import os
        cwd = os.getcwd()
        file_url = f"file://{cwd}/src/pages/wire-mark-calculator/wire-mark-calculator.html"

        print(f"Navigating to {file_url}")
        page.goto(file_url)

        # Wait for page to load
        page.wait_for_load_state("networkidle")

        # Check for the theme toggle button (id="darkModeToggle")
        # dark-mode.js injects it.
        try:
            page.wait_for_selector("#darkModeToggle", timeout=5000)
            print("Theme toggle found!")
        except:
            print("Theme toggle NOT found!")

        # Take a screenshot in light mode
        page.screenshot(path="verification/wire_mark_light.png")

        # Click the toggle to switch to dark mode
        page.click("#darkModeToggle")

        # Wait a bit for transition
        page.wait_for_timeout(1000)

        # Take a screenshot in dark mode
        page.screenshot(path="verification/wire_mark_dark.png")

        browser.close()

if __name__ == "__main__":
    verify_wire_mark_calculator()
