# IDB Sentinel Journal 🗂️

## 2026-03-10 - Wire Cut List Implementation
**Change:** Added `wireCutList` object store to IndexedDB (EECOLTools_v2, Version 4).
**Pattern:** Implemented a `position` index for manual drag-and-drop re-ordering persistence.
**Singleton:** Ensured all interactions use `EECOLIndexedDB.getInstance()` to maintain data integrity across the session.
**Validation:** Verified store creation and CRUD operations via Playwright integration testing.

## 2026-03-12 - Idempotent Schema Upgrade & Index Alignment
**Observation:** Identified "schema drift" where object store indexes in `EECOLIndexedDB` did not match actual property names used in application code (e.g., `operator` vs `cutterName`). Linear scans were occurring despite indexes being defined.
**Learning:** Initial `createObjectStores` logic was only idempotent for *stores*, not *indexes*. Upgrades would fail to add new indexes or remove obsolete ones on existing stores.
**Action:**
1. Bumped DB version to 5.
2. Updated `cuttingRecords` and `inventoryRecords` schema definitions to use correct property names (`cutterName`, `wireId`, `personName`, etc.).
3. Refactored `createObjectStores` to be fully idempotent: it now scans existing indexes, deletes ones not in the schema, and creates missing ones using the active upgrade transaction.
**Validation:** Verified version bump, index creation/deletion, and CRUD stability via Playwright automation.
