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

            # Verification snippet for transaction completion and sync key uniqueness
            verification_result = page.evaluate("""
                async () => {
                    const dbInstance = EECOLIndexedDB.getInstance();
                    await dbInstance.isReady();

                    const results = {
                        transactionCommitSync: false,
                        syncKeyUniqueness: false,
                        error: null
                    };

                    try {
                        // Test 1: Verify sync key changes on update
                        const initialSync = localStorage.getItem('eecolDBChange');
                        const testId = 'sentinel-sync-test-' + Date.now();

                        await dbInstance.update('settings', { name: testId, value: 'test1' });
                        const sync1 = localStorage.getItem('eecolDBChange');

                        await dbInstance.update('settings', { name: testId, value: 'test2' });
                        const sync2 = localStorage.getItem('eecolDBChange');

                        if (sync1 !== initialSync && sync2 !== sync1 && sync2.includes('_')) {
                            results.syncKeyUniqueness = true;
                        }

                        // Test 2: Verify promise resolves correctly (implicit in Test 1, but we can be explicit)
                        // In IDB, if we can read the value back immediately after await, it's usually good,
                        // but our fix ensures it's actually committed.
                        const val = await dbInstance.get('settings', testId);
                        if (val && val.value === 'test2') {
                            results.transactionCommitSync = true;
                        }

                        // Cleanup
                        await dbInstance.delete('settings', testId);

                    } catch (e) {
                        results.error = e.message;
                    }

                    return results;
                }
            """)

            print(f"Reliability Verification Results: {json.dumps(verification_result, indent=2)}")

            if (verification_result['transactionCommitSync'] and
                verification_result['syncKeyUniqueness']):
                print("✅ RELIABILITY TESTS PASSED")
            else:
                print("❌ RELIABILITY TESTS FAILED")
                exit(1)

        except Exception as e:
            print(f"❌ Error during verification: {e}")
            exit(1)
        finally:
            browser.close()
            server_process.terminate()

if __name__ == "__main__":
    run_verification()
