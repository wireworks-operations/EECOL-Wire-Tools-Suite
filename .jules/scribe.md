# Scribe's Journal 📘

Critical learnings and repository architectural insights.

## 2026-03-31 - [Full Documentation Refresh v0.8.0.4]

**Observation:**
The repository references several advanced tools in `package.json` (Webpack, Jest, ESLint, Cypress) and provides Docker scripts, but the actual configuration files (`webpack.config.js`, `jest.config.js`, etc.) and the `Dockerfile` are missing from the root. This indicates the build/test system is currently in a transitional state or "In-Progress."

**Learning:**
The project relies heavily on a "Local-First" architecture using IndexedDB (v7) and a singleton pattern (`EECOLIndexedDB`). Documentation must reflect that the core functionality is 100% client-side and does not require a backend, even if the `package.json` suggests otherwise.

**Action:**
Updated all documentation (README, QUICKSTART, BLUEPRINT, SECURITY) to explicitly state the operational status of tools. Consolidated headings with emojis and ensured that `npm` (bundled with Node.js) is the documented package manager for maximum first-time success, while noting that `pnpm` is also supported.

## 2026-03-31 - [IndexedDB Schema Enumeration]

**Observation:**
The `EECOLIndexedDB` class (version 7) manages 14 distinct object stores. Some stores are for calculators (e.g., `markConverter`), while others are for operational logs (e.g., `cuttingRecords`).

**Learning:**
Maintaining documentation that matches the schema version (currently v7) is critical for newcomers debugging the Application panel in DevTools.

**Action:**
Updated `BLUEPRINT.md` to enumerate all 14 stores and their purposes, providing a clear map for future data-driven feature development.
