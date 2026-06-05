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
            # Load the application - try root and pages/index
            try:
                page.goto("http://localhost:3000/index.html", timeout=5000)
            except:
                page.goto("http://localhost:3000/src/pages/index/index.html", timeout=5000)

            # Verification snippet
            verification_result = page.evaluate("""
                async () => {
                    if (typeof EECOLIndexedDB === 'undefined') {
                        return { success: false, error: 'EECOLIndexedDB not found' };
                    }

                    const dbInstance = EECOLIndexedDB.getInstance();
                    await dbInstance.isReady();

                    const results = {
                        normalizationTest: false,
                        casingTest: false,
                        timestampTest: false,
                        bulkNormalizationTest: false,
                        details: {}
                    };

                    // 1. Single Record Normalization Test
                    try {
                        const testId = 'norm-test-' + Date.now();
                        const rawData = {
                            id: testId,
                            wireId: 'lowercasewire',
                            cutterName: 'john doe',
                            timestamp: new Date().toISOString(), // String timestamp
                            orderNumber: 'abc1234'
                        };

                        await dbInstance.update('cuttingRecords', rawData);
                        const retrieved = await dbInstance.get('cuttingRecords', testId);

                        if (retrieved) {
                            const isWireUpper = retrieved.wireId === 'LOWERCASEWIRE';
                            const isCutterUpper = retrieved.cutterName === 'JOHN DOE';
                            const isOrderUpper = retrieved.orderNumber === 'ABC1234';
                            const isTimeNumber = typeof retrieved.timestamp === 'number';

                            results.casingTest = isWireUpper && isCutterUpper && isOrderUpper;
                            results.timestampTest = isTimeNumber;
                            results.normalizationTest = results.casingTest && results.timestampTest;

                            results.details.single = {
                                wireId: retrieved.wireId,
                                cutterName: retrieved.cutterName,
                                timestampType: typeof retrieved.timestamp,
                                timestamp: retrieved.timestamp
                            };

                            await dbInstance.delete('cuttingRecords', testId);
                        }
                    } catch (e) {
                        results.error = e.message;
                    }

                    // 2. Bulk Normalization Test
                    try {
                        const bulkItems = [
                            { id: 'bulk-1', personName: 'jane doe', timestamp: '2026-01-01T12:00:00Z' },
                            { id: 'bulk-2', productCode: 'pcode-99', createdAt: '2026-02-01T12:00:00Z' }
                        ];

                        await dbInstance.bulkPut('inventoryRecords', bulkItems);
                        const items = await dbInstance.getAll('inventoryRecords');
                        const b1 = items.find(i => i.id === 'bulk-1');
                        const b2 = items.find(i => i.id === 'bulk-2');

                        if (b1 && b2) {
                            const b1Ok = b1.personName === 'JANE DOE' && typeof b1.timestamp === 'number';
                            const b2Ok = b2.productCode === 'PCODE-99' && typeof b2.createdAt === 'number';
                            results.bulkNormalizationTest = b1Ok && b2Ok;

                            results.details.bulk = { b1, b2 };
                        }

                        await dbInstance.delete('inventoryRecords', 'bulk-1');
                        await dbInstance.delete('inventoryRecords', 'bulk-2');
                    } catch (e) {
                        results.bulkError = e.message;
                    }

                    return results;
                }
            """)

            print(f"Normalization Verification Results: {json.dumps(verification_result, indent=2)}")

            if (verification_result['normalizationTest'] and
                verification_result['bulkNormalizationTest']):
                print("✅ NORMALIZATION TESTS PASSED")
            else:
                print("❌ NORMALIZATION TESTS FAILED")
                exit(1)

        except Exception as e:
            print(f"❌ Error during verification: {e}")
            exit(1)
        finally:
            browser.close()
            server_process.terminate()

if __name__ == "__main__":
    run_verification()
