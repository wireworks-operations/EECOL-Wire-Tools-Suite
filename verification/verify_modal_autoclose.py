import asyncio
import os
import http.server
import socketserver
import threading
from playwright.async_api import async_playwright

PORT = 3000

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def start_server():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    httpd = socketserver.TCPServer(("", PORT), QuietHandler)
    httpd.serve_forever()

async def run_tests():
    # Kill any process on 3000
    os.system(f"kill $(lsof -t -i :{PORT}) 2>/dev/null || true")

    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    await asyncio.sleep(1)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("Testing showAlert auto-close timer...")
        await page.goto(f"http://localhost:{PORT}/src/pages/wire-cut-list/wire-cut-list.html")
        await page.wait_for_selector("body")

        # Call showAlert with 3000ms autoCloseMs
        await page.evaluate("""() => {
            window.showAlert("Test auto-close modal message", "Auto Close Test", 3000);
        }""")

        # Verify modal is visible
        modal = page.locator("#customModal")
        await modal.wait_for(state="visible", timeout=2000)

        ok_btn = page.locator("#modalOKBtn")
        btn_text = await ok_btn.text_content()
        print(f"Initial button text: '{btn_text}'")
        assert "OK (3s)" in btn_text, f"Expected 'OK (3s)' in button text, got '{btn_text}'"

        # Wait 1.5s and check countdown
        await asyncio.sleep(1.2)
        btn_text_2 = await ok_btn.text_content()
        print(f"Countdown button text after ~1s: '{btn_text_2}'")
        assert "OK (2s)" in btn_text_2 or "OK (1s)" in btn_text_2, f"Expected countdown text, got '{btn_text_2}'"

        # Wait remaining time until modal auto-closes
        await modal.wait_for(state="hidden", timeout=4000)
        print("Modal successfully auto-closed after 3 seconds!")

        # Test Database Config Modal Settings UI
        print("\nTesting Database Config Modal Settings UI...")
        await page.goto(f"http://localhost:{PORT}/src/pages/database-config/database-config.html")
        await page.wait_for_selector("#autoCloseDurationSelect")

        select = page.locator("#autoCloseDurationSelect")
        save_btn = page.locator("#saveModalSettingsBtn")

        await select.select_option("2000")
        await save_btn.click()

        # Check saved setting in localStorage
        saved_val = await page.evaluate("() => localStorage.getItem('eecol-modal-autoclose-ms')")
        print(f"Saved setting in localStorage: {saved_val}")
        assert saved_val == "2000", f"Expected '2000' in localStorage, got '{saved_val}'"

        await browser.close()
        print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉")

if __name__ == "__main__":
    asyncio.run(run_tests())
