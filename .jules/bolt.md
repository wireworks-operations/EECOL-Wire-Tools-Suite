# Bolt's Journal - Performance Optimizations

## 2026-03-07 - Single-pass Dashboard Data Processing
**Learning:** The live dashboard was performing approximately 30 full passes (filters, reduces, forEach) over the datasets (`inventoryItems` and `cutRecords`) every time it updated. As the IndexedDB grows, this O(N) multiplication leads to visible UI lag and battery drain on mobile devices.
**Action:** Consolidate all metric calculations into a single pass over each dataset. This reduces complexity from ~30 O(N) to 2 O(N), making the dashboard scale much better with data volume.

## 2026-03-08 - Single-pass Inventory Reports
**Learning:** `updateDashboard` and `updateReportsTable` in `inventory-reports.js` were performing multiple O(N) passes (7+ and 2+ respectively) over the inventory datasets. Consolidating these into single-pass loops ensures the reporting dashboard remains responsive even with thousands of records.
**Action:** Consolidate multiple filter/reduce calls into a single `for...of` loop in `updateDashboard` and `updateReportsTable`.

## 2026-03-09 - Single-pass Inventory Records Statistics
**Learning:** The `updateStats` function in `inventory-records.js` was performing 3 separate O(N) passes (one `reduce` and two `filter` calls) to update the Quick Statistics panel. This triggered on every record addition, edit, or search, causing cumulative UI overhead.
**Action:** Consolidated the calculation of total items, total length, damaged pieces, and tail-ends into a single `for...of` loop, reducing the processing time by ~66% per statistics update.
