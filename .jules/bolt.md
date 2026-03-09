# Bolt's Journal - Performance Optimizations

## 2025-05-15 - Single-pass Dashboard Data Processing
**Learning:** The live dashboard was performing approximately 30 full passes (filters, reduces, forEach) over the datasets (`inventoryItems` and `cutRecords`) every time it updated. As the IndexedDB grows, this O(N) multiplication leads to visible UI lag and battery drain on mobile devices.
**Action:** Consolidate all metric calculations into a single pass over each dataset. This reduces complexity from ~30 O(N) to 2 O(N), making the dashboard scale much better with data volume.

## 2025-05-16 - Single-pass Inventory Reports
**Learning:** `updateDashboard` and `updateReportsTable` in `inventory-reports.js` were performing multiple O(N) passes (7+ and 2+ respectively) over the inventory datasets. Consolidating these into single-pass loops ensures the reporting dashboard remains responsive even with thousands of records.
**Action:** Consolidate multiple filter/reduce calls into a single `for...of` loop in `updateDashboard` and `updateReportsTable`.
