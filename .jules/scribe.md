# Scribe's Journal 📘

Critical learnings and repository architectural insights.

## 2026-05-15 - [Full Documentation Refresh v0.8.0.4 - Syncing Schema & Tools]

**Observation:**
Discovered a version mismatch between documentation (v8) and implementation (v9) of IndexedDB in `src/core/database/indexeddb.js`. Also confirmed that despite `package.json` having scripts for Webpack, Docker, and Jest, the corresponding config files and Dockerfile are missing, confirming the "In-Progress" status.

**Learning:**
Maintaining parity between the database version in code and documentation is crucial for developers using DevTools to inspect storage. Explicitly documenting "missing" or "in-progress" tools prevents developer frustration during onboarding.

**Action:**
Synchronized all documentation to IndexedDB v9. Enhanced the Tooling Status table in `README.md` to specify exactly which configuration files are missing for non-functional tools. Refined the ASCII blueprint to better represent the ESM Vanilla JS flow and IndexedDB singleton interaction.

## 2026-03-31 - [IndexedDB Schema Enumeration]

**Observation:**
The `EECOLIndexedDB` class (version 8) manages 14 distinct object stores. Some stores are for calculators (e.g., `markConverter`), while others are for operational logs (e.g., `cuttingRecords`).

**Learning:**
Maintaining documentation that matches the schema version (currently v8) is critical for newcomers debugging the Application panel in DevTools.

**Action:**
Updated `BLUEPRINT.md` to enumerate all 14 stores and their purposes, providing a clear map for future data-driven feature development.
