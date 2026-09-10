import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def verify_sorting_functionality():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        # Kill any process on port 3000 if needed, or serve files directly
        # Navigate to standalone wire cut list page relative to current file or via http
        file_path = os.path.abspath('src/pages/wire-cut-list/wire-cut-list.html')
        await page.goto(f'file://{file_path}')

        print("Page loaded successfully.")
        await page.wait_for_timeout(1000)

        # Clear existing IDB data and add mock test items
        await page.evaluate("""async () => {
            if (window.eecolDB) {
                await window.eecolDB.isReady();
                const tx = window.eecolDB.db.transaction('wireCutList', 'readwrite');
                await tx.objectStore('wireCutList').clear();

                const now = Date.now();
                const items = [
                    {
                        id: 'item-1',
                        orderNumber: '2001',
                        lineNumber: '001',
                        customerName: 'ALPHA CORP',
                        wireType: 'TK6/3CU',
                        status: 'active',
                        groupName: 'Group A',
                        groupId: 'group_a',
                        timestamp: now - 300000, // 5 mins ago
                        position: 0
                    },
                    {
                        id: 'item-2',
                        orderNumber: '1002',
                        lineNumber: '001',
                        customerName: 'BETA LTD',
                        wireType: 'RW90',
                        status: 'completed',
                        groupName: null,
                        groupId: null,
                        timestamp: now - 600000, // 10 mins ago
                        position: 1
                    },
                    {
                        id: 'item-3',
                        orderNumber: '3005',
                        lineNumber: '001',
                        customerName: 'GAMMA INC',
                        wireType: 'TECK90',
                        status: 'completed',
                        groupName: null,
                        groupId: null,
                        timestamp: now - 100000, // ~1.6 mins ago (Newest completed)
                        position: 2
                    },
                    {
                        id: 'item-4',
                        orderNumber: '1500',
                        lineNumber: '001',
                        customerName: 'DELTA CO',
                        wireType: 'ACWU90',
                        status: 'removed',
                        removalReason: 'Cancelled by customer',
                        groupName: null,
                        groupId: null,
                        timestamp: now - 200000, // ~3.3 mins ago
                        position: 3
                    }
                ];

                for (const item of items) {
                    await window.eecolDB.add('wireCutList', item);
                }
            }
        }""")

        # Reload list from IDB
        await page.click('#refreshWireListBtn')
        await page.wait_for_timeout(500)

        # 1. Test Status Filter: Active
        await page.select_option('#wireListStatusFilter', 'active')
        await page.wait_for_timeout(500)
        is_sort_hidden = await page.eval_on_selector('#wireListSortContainer', 'el => el.classList.contains("hidden")')
        print(f"Sort bar hidden on Active status: {is_sort_hidden}")
        assert is_sort_hidden, "Sort bar should be hidden when status is Active"

        # 2. Test Status Filter: Completed
        await page.select_option('#wireListStatusFilter', 'completed')
        await page.wait_for_timeout(500)
        is_sort_visible = await page.eval_on_selector('#wireListSortContainer', 'el => !el.classList.contains("hidden")')
        print(f"Sort bar visible on Completed status: {is_sort_visible}")
        assert is_sort_visible, "Sort bar should be visible when status is Completed"

        # Verify default sorting by Time (Descending - newest first)
        completed_orders = await page.eval_on_selector_all('.wire-list-card', 'cards => cards.map(c => c.querySelector(".font-bold.text-sm").textContent)')
        print(f"Completed orders sorted by Time (Desc): {completed_orders}")
        assert '3005' in completed_orders[0], "Newest completed item (3005) should be first"
        assert '1002' in completed_orders[1], "Older completed item (1002) should be second"

        # Take screenshot of Completed View
        os.makedirs('verification/screenshots', exist_ok=True)
        await page.screenshot(path='verification/screenshots/wire_cut_list_completed_sort.png')
        print("Captured verification/screenshots/wire_cut_list_completed_sort.png")

        # 3. Test Sorting by Order #
        await page.click('#sortByOrderBtn')
        await page.wait_for_timeout(500)
        completed_orders_by_num = await page.eval_on_selector_all('.wire-list-card', 'cards => cards.map(c => c.querySelector(".font-bold.text-sm").textContent)')
        print(f"Completed orders sorted by Order # (Desc by default): {completed_orders_by_num}")
        assert '3005' in completed_orders_by_num[0] and '1002' in completed_orders_by_num[1], "Order # desc sort verified"

        # Toggle direction to Ascending
        await page.click('#sortDirectionBtn')
        await page.wait_for_timeout(500)
        completed_orders_asc = await page.eval_on_selector_all('.wire-list-card', 'cards => cards.map(c => c.querySelector(".font-bold.text-sm").textContent)')
        print(f"Completed orders sorted by Order # (Asc): {completed_orders_asc}")
        assert '1002' in completed_orders_asc[0] and '3005' in completed_orders_asc[1], "Order # asc sort verified"

        # 4. Test Group Stripping on Completion
        await page.select_option('#wireListStatusFilter', 'active')
        await page.wait_for_timeout(500)

        # Complete active item (item-1 which was in 'Group A')
        complete_btn = await page.query_selector('.wire-list-card button:has-text("Complete")')
        if complete_btn:
            # Dismiss alert automatically if shown
            page.on("dialog", lambda dialog: asyncio.create_task(dialog.accept()))
            await complete_btn.click()
            await page.wait_for_timeout(1000)

        # Verify item-1 in IndexedDB has groupName null
        item_1_group = await page.evaluate("""async () => {
            if (window.eecolDB) {
                const item = await window.eecolDB.get('wireCutList', 'item-1');
                return item ? item.groupName : 'NOT_FOUND';
            }
            return null;
        }""")
        print(f"Item 1 groupName after completion: {item_1_group}")
        assert item_1_group is None, "groupName should be null after completion"

        # 5. Test All Filter View (Active pinned at top)
        await page.select_option('#wireListStatusFilter', 'all')
        await page.wait_for_timeout(500)
        await page.screenshot(path='verification/screenshots/wire_cut_list_all_sort.png')
        print("Captured verification/screenshots/wire_cut_list_all_sort.png")

        await browser.close()
        print("All verification checks passed successfully!")

if __name__ == '__main__':
    asyncio.run(verify_sorting_functionality())
