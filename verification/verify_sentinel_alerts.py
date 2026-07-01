from playwright.sync_api import sync_playwright
import time
import subprocess
import os

def run_verification():
    # Start the dev server
    server_process = subprocess.Popen(["npx", "http-server", ".", "-p", "3000"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2) # Give it time to start

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto("http://localhost:3000/index.html")

            # Setup alert listener
            alert_message = []
            page.on("dialog", lambda dialog: (alert_message.append(dialog.message), dialog.accept()))

            print("Simulating onversionchange...")
            # Trigger onversionchange by opening the DB with a higher version in the same context
            page.evaluate("""
                async () => {
                    const dbInstance = EECOLIndexedDB.getInstance();
                    await dbInstance.isReady();
                    const currentVersion = dbInstance.db.version;

                    // Open another connection with a higher version to trigger versionchange on the first one
                    const req = indexedDB.open('EECOLTools_v2', currentVersion + 1);
                    return new Promise((resolve) => {
                        req.onblocked = () => resolve('blocked');
                        req.onsuccess = () => {
                            req.result.close();
                            resolve('success');
                        };
                        req.onerror = () => resolve('error');
                    });
                }
            """)

            # Give it a moment to trigger and for the alert to show
            time.sleep(1)

            expected_msg = "A new version of the database is available. This tab has been disconnected to allow the upgrade. Please refresh the page to continue."

            if expected_msg in alert_message:
                print("✅ Alert verification successful: Caught expected message.")
            else:
                print(f"❌ Alert verification failed: Expected message not found. Caught: {alert_message}")
                exit(1)

        except Exception as e:
            print(f"❌ Error during alert verification: {e}")
            exit(1)
        finally:
            browser.close()
            server_process.terminate()

if __name__ == "__main__":
    run_verification()
