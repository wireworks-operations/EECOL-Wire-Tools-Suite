# Scribe's Journal 📘

Critical learnings and repository architectural insights.

## 2026-04-14 - [Full Documentation Refresh v0.8.0.4]

**Observation:**
The repository references several advanced tools in `package.json` (Webpack, Jest, ESLint, Cypress) and provides Docker scripts, but the actual configuration files (`webpack.config.js`, `jest.config.js`, etc.) and the `Dockerfile` are missing from the root. This indicates the build/test system is currently in a transitional state or "In-Progress."

**Learning:**
The project relies heavily on a "Local-First" architecture using IndexedDB (v8) and a singleton pattern (`EECOLIndexedDB`). Documentation must reflect that the core functionality is 100% client-side and does not require a backend, even if the `package.json` suggests otherwise.

**Action:**
Updated all documentation (README, QUICKSTART, BLUEPRINT, SECURITY) to explicitly state the operational status of tools. Consolidated headings with emojis and ensured that `npm` (bundled with Node.js) is the documented package manager for maximum first-time success, while noting that `pnpm` is also supported. Updated IndexedDB version to 9 across all documents. Verified that `npm run dev` works with a local `http-server` installation and that `python3 verification/verify_idb.py` passes on the v9 schema.

## 2026-03-31 - [IndexedDB Schema Enumeration]

**Observation:**
The `EECOLIndexedDB` class (version 8) manages 14 distinct object stores. Some stores are for calculators (e.g., `markConverter`), while others are for operational logs (e.g., `cuttingRecords`).

**Learning:**
Maintaining documentation that matches the schema version (currently v8) is critical for newcomers debugging the Application panel in DevTools.

**Action:**
Updated `BLUEPRINT.md` to enumerate all 14 stores and their purposes, providing a clear map for future data-driven feature development. Syncing store list with `src/core/database/indexeddb.js` version 9.

## 2026-05-20 - [Scribe: Full documentation refresh]

**Observation:**
Discovered that `BLUEPRINT.md` and `README.md` were lagging behind the actual `EECOLIndexedDB` version (v9) and store configurations. The verification script `verify_idb.py` was also targeting version 9, creating a discrepancy with the docs stating version 8.

**Learning:**
Always verify documentation against the source of truth (`indexeddb.js`) and existing verification scripts (`verify_idb.py`) before finalizing. Documentation-first agents must ensure that "Get Started" commands are not just present, but functional in the current environment.

**Action:**
Synchronized all documentation to IndexedDB v9. Refactored `QUICKSTART.md` for a 90-second "Happy Path". Standardized `SECURITY.md` with a complete hardening checklist. Enumerated all 14 stores in `BLUEPRINT.md` to provide a complete map of the local data layer. Verified everything via `markdownlint` and `verify_idb.py`.
