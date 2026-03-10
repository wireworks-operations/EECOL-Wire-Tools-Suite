# 🧠 Jules' Memory & Knowledge Base - EECOL Wire Tools

This file serves as a living document of my understanding, insights, and critical patterns for the EECOL Wire Tools Suite.

## 🏗️ Project Overview
- **Type:** Client-side only Progressive Web Application (PWA).
- **Domain:** Industrial wire processing and inventory management.
- **Persistence:** Local-first using **IndexedDB** (`EECOLIndexedDB`).
- **Styling:** Tailwind CSS + Custom CSS (`eecol-theme.css`).
- **Version:** v0.8.0.4 (Synchronized across `package.json`, `README.md`, and `index.html`).

## 🛠️ Architecture & Core Patterns

### 🗄️ Database (IndexedDB)
- **Singleton Pattern:** Always use `EECOLIndexedDB.getInstance()` to avoid multiple connection issues.
- **Reliability:** Implements `db.onversionchange = () => db.close()` and `request.onblocked` handlers to prevent upgrade deadlocks.
- **Stores:** `cuttingRecords`, `inventoryRecords`, `markConverter`, `stopmarkConverter`, `reelcapacityEstimator`, `settings`, etc.

### 🛡️ Security (Sentinel Protocol)
- **XSS Prevention:** Strictly avoid `innerHTML`. Use `document.createElement()` and `.textContent` (or `.value` for inputs).
- **Utility Priority:** Use `window.escapeHTML` (from `src/utils/theme-loader.js` or `src/utils/sanitize.js`) for manual escaping if necessary.
- **Alerts/Modals:** Custom `showAlert` and `showConfirm` in `src/utils/modals.js` use `.textContent`. Use `whitespace-pre-line` for formatting.

### ⚡ Performance (Bolt Optimization)
- **Iteration Consolidation:** When processing dashboard metrics or large datasets, consolidate multiple `filter()` and `reduce()` calls into a single `for...of` loop.
- **Data Integrity:** Handle `null` or `undefined` gracefully, especially in inventory/cutting records.

### 🎨 UI/UX (Palette Protocol)
- **Theme:** EECOL Blue (`#0058B3`) and Indigo accents.
- **Accessibility:** Ensure `aria-label` and `aria-expanded` are present for dynamic components (mobile menus, toggles).
- **Touch-Friendly:** Inputs and buttons should have a minimum touch target of 44px (using `mobile-touch-input` or `touch-device-friendly` classes).
- **Stop Mark Calculator:** Uses blue containers (`bg-blue-50`) for reference points and green (`text-green-600`) for results.

## 📖 Component-Specific Insights

### Cutting Records
- **`updateStats`:** Optimized to a single-pass metric calculation.
- **Persistence:** Records are sorted by `timestamp` (newest first).
- **Batch Mode:** Allows multiple cut entries for a single order/customer.
- **AutoFill Integration:** The 'Wire Cut List' supports a one-click 'AutoFill Cut' feature. This decision was made to minimize human error during data entry from the staging list. It uses native DOM events (`input`, `change`) to trigger existing validation logic and ensure UI consistency.
- **Case Sensitivity:** Key identification fields (Order Number, Customer, Wire ID) are strictly enforced as UPPERCASE via real-time input listeners. This improves search reliability and data normalization in IndexedDB.

### Inventory Records
- **Length Fallback:** Uses `item.length || item.actualLength || item.currentLength || 0`.
- **Categorization:** 'Damaged' or 'Tail End' rely on the `reason` field (case-insensitive); `note` is ignored for stats.

## ⚠️ Important Considerations
- **No Backend:** Do not expect a traditional server. All sync is P2P or export-based.
- **Environment:** If `pnpm dev` fails, use `python3 -m http.server 3000` as a fallback.
- **Verification:** UI changes must be verified with Playwright scripts and screenshots.
- **Constraints:** Keep changes focused and under 50 lines per PR where possible (Sentinel/Bolt personas).

---
*Created with ❤️ by Jules 🤖*
