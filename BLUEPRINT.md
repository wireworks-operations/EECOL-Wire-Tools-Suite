# Blueprint 🧱

> **Goal:** Provide a fast mental model—components, boundaries, and critical
> flows.

## System Overview

```text
                    +-------------------------+
   Browser/Client   |         Frontend        |
  +--------------+  |  Vanilla JS + HTML5     |
  |  User Agent  |--|  Tailwind CSS           |
  +--------------+  +------------+------------+
                                  |
                                  | Direct Access
                                  v
                    +-------------+-------------+
                    |          IndexedDB        |
                    |  14 Specialized Stores    |
                    |  EECOLIndexedDB Singleton |
                    +-------------+-------------+
                                  |
             +--------------------+--------------------+
             |                                         |
             v                                         v
  +---------------------+                   +---------------------+
  |   Service Worker    |                   |    Local Storage    |
  |  Background Sync    |                   |  Fallback Storage   |
  |  Offline Caching    |                   |  Legacy Support     |
  +---------------------+                   +---------------------+
```

## Data Flow (Happy Path)

1. User enters tool (e.g., Mark Calculator) → Frontend renders tool.
2. User inputs data → Frontend calculates results.
3. Frontend calls `EECOLIndexedDB` singleton → Data saved directly in browser.
4. User accesses reports/analytics → `EECOLIndexedDB` queries local stores →
   Frontend renders charts/tables.

## Repos & Conventions

* **Domains:** `/src/pages/<name>` (HTML/JS for specific tools)
* **Database:** `/src/core/database/indexeddb.js` (Singleton implementation)
* **Styles:** `/src/assets/css/` (EECOL themes and layouts)
* **Utilities:** `/src/utils/` (Modals, sanitizers, and helper functions)

## Key Decisions

* **PWA First:** High availability in industrial settings with inconsistent
  connectivity.
* **No Backend:** Zero infrastructure cost and zero data transmission for
  enhanced privacy.
* **Tailwind CSS:** Rapid UI development with standard industrial branding.
* **Vanilla JS:** Minimizes framework overhead and ensures longevity.

## Risks & Trade-offs

* **Storage Limits:** Subject to browser-specific IndexedDB quotas (~50MB).
* **Device Dependency:** Data is per-device. Backup/Restore must be handled via
  manual export/import.
* **Security:** Reliance on browser-level protection for sensitive industrial
  data.

---

### Additional Docs

* See **[README.md](README.md)** for general information.
* See **[QUICKSTART.md](QUICKSTART.md)** for setup steps.
* See **[SECURITY.md](SECURITY.md)** for security details.
