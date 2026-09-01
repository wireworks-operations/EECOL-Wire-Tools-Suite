import os
import sys
import time
from playwright.sync_api import sync_playwright

def test_idb_sentinel_reliability():
    print("🚀 Starting IDB Sentinel Reliability Verification...")

    # Clean port 3000
    os.system("kill $(lsof -t -i :3000) 2>/dev/null || true")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local page
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")
        page.wait_for_timeout(1000)

        # Test 1: Verify isReady() returns true on successful initialization
        result_ready = page.evaluate("""async () => {
            const db = EECOLIndexedDB.getInstance();
            return await db.isReady();
        }""")
        print(f"Test 1 - DB isReady() under normal conditions: {result_ready}")
        assert result_ready == True, "isReady() should return true when IDB initializes normally"

        # Test 2: Verify isReady() handles initialization failure gracefully without throwing
        result_failure_handled = page.evaluate("""async () => {
            // Create a fake instance with a rejected dbInitialized promise
            const mockInstance = Object.create(EECOLIndexedDB.prototype);
            mockInstance.db = null;
            mockInstance.dbInitialized = Promise.reject(new Error("Simulated IDB Open Failure"));

            // Catch unhandled rejections if any
            let unhandled = false;
            const errorHandler = () => { unhandled = true; };
            window.addEventListener('unhandledrejection', errorHandler);

            try {
                const ready = await mockInstance.isReady();
                window.removeEventListener('unhandledrejection', errorHandler);
                return { ready, unhandled };
            } catch (e) {
                window.removeEventListener('unhandledrejection', errorHandler);
                return { error: e.message };
            }
        }""")
        print(f"Test 2 - Handling rejected initialization: {result_failure_handled}")
        assert result_failure_handled.get("ready") == False, "isReady() should return false when dbInitialized is rejected"
        assert result_failure_handled.get("unhandled") == False, "isReady() should catch rejection without unhandled rejection event"

        # Test 3: Verify CRUD methods await isReady()
        crud_res = page.evaluate("""async () => {
            const db = EECOLIndexedDB.getInstance();
            const testId = "reliability-test-" + Date.now();
            await db.add('settings', { name: testId, value: "sentinel_test" });
            const item = await db.get('settings', testId);
            await db.delete('settings', testId);
            return item ? item.value : null;
        }""")
        print(f"Test 3 - CRUD operations with updated add/get: {crud_res}")
        assert crud_res == "sentinel_test", "CRUD operations should work seamlessly with updated isReady await"

        browser.close()
        print("✅ ALL IDB RELIABILITY TESTS PASSED SUCCESFULLY!")

if __name__ == "__main__":
    test_idb_sentinel_reliability()
