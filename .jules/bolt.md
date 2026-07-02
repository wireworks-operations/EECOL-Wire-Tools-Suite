# Bolt's Journal - Performance Optimizations

## 2026-03-07 - Single-pass Dashboard Data Processing
**Learning:** The live dashboard was performing approximately 30 full passes (filters, reduces, forEach) over the datasets (`inventoryItems` and `cutRecords`) every time it updated. As the IndexedDB grows, this O(N) multiplication leads to visible UI lag and battery drain on mobile devices.
**Action:** Consolidate all metric calculations into a single pass over each dataset. This reduces complexity from ~30 O(N) to 2 O(N), making the dashboard scale much better with data volume.

## 2025-05-16 - Single-pass Inventory Reports
**Learning:** `updateDashboard` and `updateReportsTable` in `inventory-reports.js` were performing multiple O(N) passes (7+ and 2+ respectively) over the inventory datasets. Consolidating these into single-pass loops ensures the reporting dashboard remains responsive even with thousands of records.
**Action:** Consolidate multiple filter/reduce calls into a single `for...of` loop in `updateDashboard` and `updateReportsTable`.

## 2025-06-12 - Single-pass Cutting Records Statistics
**Learning:** `updateStats` in `cutting-records.js` was performing six separate O(N) passes (filter, reduce, forEach) to update basic dashboard metrics. Consolidating these into a single iteration ensures the record-keeping interface remains responsive as the user's local history grows.
**Action:** Consolidate 6 O(N) passes into a single `for...of` loop in `updateStats`.

## 2025-05-14 - Single-pass Inventory Reports Charts
**Learning:** The `updateCharts` function in `inventory-reports.js` was triggering four separate chart creation functions, performing approximately 9 redundant O(N) passes (multiple `filter()`, `forEach()`, and `groupRecordsByPeriod()` calls) over the inventory dataset.
**Action:** Consolidated all chart data collection into a single `for...of` loop in `updateCharts`, reducing complexity from ~9 O(N) to 1 O(N) and minimizing temporary memory allocations.

## 2025-07-22 - Single-pass Cutting Reports Data Aggregation
**Learning:** `updateCharts` and `updateReportsTable` in `cutting-reports.js` were performing approximately 10+ redundant O(N) passes over the `cutRecords` dataset, including expensive `groupRecordsByPeriod` calls that created nested array structures. This caused measurable UI lag when switching chart types or date ranges with large datasets.
**Action:** Consolidated all chart data aggregation and period comparison metrics into a single `for...of` loop in `updateCharts`, reducing complexity from ~10 O(N) to 1 O(N).

## 2025-08-04 - Search Debouncing and Formatter Optimization
**Learning:** The cutting records search was triggering full O(N) re-renders on every keystroke, and the filtering logic was creating temporary objects for each record. Additionally, repeated calls to `toLocaleString()` in render loops are significantly slower than using a pre-initialized `Intl.DateTimeFormat`.
**Action:** Implemented a 250ms debounce on the search input, optimized `getFilteredRecords` to avoid object allocation, and pre-initialized `Intl.DateTimeFormat` for consistent, high-performance date string generation. Decoupled `updateStats()` from the render loop to ensure it only runs on data mutation.

## 2026-03-15 - Sorting Invariants for O(N) Rendering
**Learning:** Removing an O(N log N) sort from a high-frequency render path (like filtering) requires strict enforcement of sorting invariants in all mutation paths (add, edit, delete, import, undo/redo). If even one mutation path forgets to maintain the order, the UI state becomes inconsistent.
**Action:** Always verify all functions that modify the base collection (Array.push, Array.map, etc.) to ensure they either insert in order or re-sort the base array once before the next filter/render cycle.

## 2026-03-22 - Numeric Timestamp Comparisons for Dashboard Scaling
**Learning:** Using `new Date().toDateString()` inside high-frequency processing loops (like dashboard metrics calculation) creates significant GC pressure due to thousands of temporary `Date` objects and string allocations. This becomes a bottleneck as the local IndexedDB grows.
**Action:** Pre-calculate boundary timestamps (e.g., `todayStart`) and use numeric comparisons within loops. Consolidate data collection for auxiliary UI elements (like INA lists) into the same primary pass to reduce the total number of iterations over the dataset.

## 2026-04-10 - Period Key Memoization and Load-time Normalization
**Learning:** Repeated Date allocations and complex string-based key generation (e.g., week/month strings) inside reporting loops create significant CPU overhead and GC pressure. Even if the primary loop is O(N), the constant factor for Date parsing and string formatting is high. However, cache keys for memoization must be local-timezone aware (e.g., `date.toDateString()`) rather than UTC-based math to ensure correct data grouping.
**Action:** Normalize timestamps to numbers immediately upon loading data from IndexedDB. Use a Map to cache period keys for unique local days during chart aggregation to eliminate redundant calculations while maintaining accuracy.

## 2026-04-21 - O(1) Geometric Series for Spool Capacity
**Learning:** The reel estimators were using iterative while-loops (O(N) where N is the number of layers) to calculate spool capacity. For high-density spooling or theoretical searches (like finding a required flange), this creates unnecessary CPU cycles. Since spool layers follow an arithmetic progression, the total length can be calculated in O(1) using the sum of the sequence.
**Action:** Replace iterative loops in capacity and size estimators with the closed-form quadratic and arithmetic progression sum formulas ({total} = N \cdot S \cdot \pi \cdot \eta \cdot (D_{core} + Nd)$). This ensures instantaneous results even for extremely long cable runs or large industrial reels.

## 2026-05-18 - Safe UI Search Robustness and Batched Rendering
**Learning:** Even with an IndexedDB normalization layer, UI search filters should maintain explicit `.toString().toUpperCase()` on record fields within search loops to ensure robustness against legacy data or manual entries. Additionally, replacing iterative `appendChild` with `DocumentFragment` reduces layout thrashing from O(N) to O(1) during large list renders.
**Action:** Use `DocumentFragment` for list rendering and cache the search term's uppercase version once while maintaining type-safe checks in filter loops.

## 2026-05-22 - O(N) Reordering via Map-based Lookups
**Learning:** Replacing an O(N) search (`Array.find`) inside an O(N) loop with a `Map` for O(1) lookups during list reordering significantly improves scalability. In a test with 2000 items, this reduced reorder duration by ~60% (from 43ms to 17ms), ensuring that drag-and-drop operations remain smooth even as the local IndexedDB dataset grows.
**Action:** Always use a Map-based lookup when updating multiple records in a collection based on their IDs within a loop.
