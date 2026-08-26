from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/initial_cutting_records.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
