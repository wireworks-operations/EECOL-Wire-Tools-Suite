import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        await page.goto("http://localhost:3000/src/pages/cutting-records/cutting-records.html")
        await page.wait_for_load_state("networkidle")

        # Fill out a record and save it to test history feed rendering
        await page.fill("#wireId", "WIRE-XL-100")
        await page.fill("#cutLength", "50")
        await page.fill("#lineCode", "001")
        await page.fill("#cutterName", "LUCAS")
        await page.fill("#orderNumber", "7654321")
        await page.fill("#customerName", "EECOL SUPPLY")
        await page.click("#recordBtn")

        # Wait for record to save and modal alert to disappear
        await page.wait_for_timeout(3500)

        # Scroll history section into view
        history_el = await page.query_selector("#cutHistoryList")
        if history_el:
            await history_el.scroll_into_view_if_needed()

        os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
        screenshot_path = "/home/jules/verification/screenshots/history_feed_text_size.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
