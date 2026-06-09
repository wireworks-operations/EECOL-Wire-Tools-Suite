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
            # Try root index.html
            page.goto("http://localhost:3000/index.html", timeout=5000)

            # Verification snippet
            verification_result = page.evaluate("""
                async () => {
                    const dbInstance = EECOLIndexedDB.getInstance();
                    await dbInstance.isReady();
                    const db = dbInstance.db;

                    const results = {
                        normalizationTest: false,
                        globalErrorHandlerTest: false,
                        bulkPutFunctionalTest: false,
                        details: {}
                    };

                    // 1. Extended Casing Normalization Test
                    try {
                        const testId = 'sentinel-batch3-norm-' + Date.now();
                        const rawData = {
                            id: testId,
                            lineCode: 'l:a1',
                            turnedToLineCode: 'l:b2',
                            coilCode: 'c-123'
                        };

                        await dbInstance.update('inventoryRecords', rawData);
                        const retrieved = await dbInstance.get('inventoryRecords', testId);

                        if (retrieved) {
                            results.normalizationTest =
                                retrieved.lineCode === 'L:A1' &&
                                retrieved.turnedToLineCode === 'L:B2' &&
                                retrieved.coilCode === 'C-123';

                            results.details.norm = retrieved;
                            await dbInstance.delete('inventoryRecords', testId);
                        }
                    } catch (e) {
                        results.normError = e.message;
                    }

                    // 2. Global Error Handler Test
                    results.globalErrorHandlerTest = typeof db.onerror === 'function';

                    // 3. bulkPut Functional Test (The core optimization)
                    try {
                        const store = 'wireCutList';
                        const testItems = [
                            { id: 'bp-1', orderNumber: 'ord1', position: 0 },
                            { id: 'bp-2', orderNumber: 'ord2', position: 1 }
                        ];

                        // This will throw if bulkPut is missing
                        await dbInstance.bulkPut(store, testItems, false);

                        const r1 = await dbInstance.get(store, 'bp-1');
                        const r2 = await dbInstance.get(store, 'bp-2');

                        results.bulkPutFunctionalTest = (r1 && r2 && r1.orderNumber === 'ORD1');

                        await dbInstance.delete(store, 'bp-1');
                        await dbInstance.delete(store, 'bp-2');
                    } catch (e) {
                        results.bulkPutError = e.message;
                    }

                    return results;
                }
            """)

            print(f"Batch 3 Verification Results: {json.dumps(verification_result, indent=2)}")

            if (verification_result['normalizationTest'] and
                verification_result['globalErrorHandlerTest'] and
                verification_result['bulkPutFunctionalTest']):
                print("✅ SENTINEL BATCH 3 TESTS PASSED")
            else:
                print("❌ SENTINEL BATCH 3 TESTS FAILED")
                exit(1)

        except Exception as e:
            print(f"❌ Error during verification: {e}")
            exit(1)
        finally:
            browser.close()
            server_process.terminate()

if __name__ == "__main__":
    run_verification()
