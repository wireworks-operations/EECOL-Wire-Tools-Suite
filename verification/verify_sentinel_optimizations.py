from playwright.sync_api import sync_playwright
import time
import subprocess
import os
import json

def run_verification():
    # Start the dev server
    server_process = subprocess.Popen(["npx", "http-server", ".", "-p", "3000"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2) # Give it time to start

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Try both possible index.html locations
            try:
                page.goto("http://localhost:3000/index.html", timeout=5000)
            except:
                page.goto("http://localhost:3000/src/pages/index/index.html", timeout=5000)

            # Verification snippet
            verification_result = page.evaluate("""
                async () => {
                    const dbInstance = EECOLIndexedDB.getInstance();
                    await dbInstance.isReady();

                    const results = {
                        findTest: false,
                        bulkDeleteTest: false,
                        countTest: false,
                        bulkPutTest: false
                    };

                    const store = 'settings';
                    const testData = [
                        { name: 'sentinel-opt-1', value: 'a' },
                        { name: 'sentinel-opt-2', value: 'b' },
                        { name: 'sentinel-opt-3', value: 'a' }
                    ];

                    // Test bulkPut (and implicitly clear if true)
                    try {
                        await dbInstance.bulkPut(store, testData, true);
                        const count = await dbInstance.count(store);
                        results.bulkPutTest = (count >= 3);
                        results.countTest = (typeof count === 'number');
                    } catch (e) {
                        results.bulkPutError = e.message;
                    }

                    // Test find (optimized with cursor)
                    try {
                        const found = await dbInstance.find(store, item => item.value === 'a');
                        results.findTest = (found.length === 2);
                    } catch (e) {
                        results.findError = e.message;
                    }

                    // Test bulkDelete
                    try {
                        const keysToDelete = ['sentinel-opt-1', 'sentinel-opt-2', 'sentinel-opt-3'];
                        await dbInstance.bulkDelete(store, keysToDelete);
                        const foundAfter = await dbInstance.find(store, item => item.name.startsWith('sentinel-opt'));
                        results.bulkDeleteTest = (foundAfter.length === 0);
                    } catch (e) {
                        results.bulkDeleteError = e.message;
                    }

                    return results;
                }
            """)

            print(f"Verification Results: {json.dumps(verification_result, indent=2)}")

            if (verification_result['findTest'] and
                verification_result['bulkDeleteTest'] and
                verification_result['countTest'] and
                verification_result['bulkPutTest']):
                print("✅ ALL OPTIMIZATION TESTS PASSED")
            else:
                print("❌ OPTIMIZATION TESTS FAILED")
                exit(1)

        except Exception as e:
            print(f"❌ Error during verification: {e}")
            exit(1)
        finally:
            browser.close()
            server_process.terminate()

if __name__ == "__main__":
    run_verification()
