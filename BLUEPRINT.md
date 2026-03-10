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
                                  | Direct Access (Local)
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
  |  Offline Caching    |                   |  Fallback/Migration |
  |  PWA Assets         |                   |  Legacy Support     |
  +---------------------+                   +---------------------+
```

## Data Flow (Happy Path)

1. **User Action**: User enters data into a tool (e.g., Cutting Records).
2. **Persistence**: Frontend calls the `EECOLIndexedDB` singleton.
3. **Local Storage**: Data is written directly to a specialized IndexedDB store.
4. **Offline Access**: Service worker serves cached HTML/JS/CSS assets even
   without connectivity.
5. **Retrieval**: Analytics tools query IndexedDB to render real-time charts via
   Chart.js.

## Repos & Conventions

* **Pages**: `/src/pages/<tool-name>/` (HTML/JS/CSS for specific tools)
* **Database**: `/src/core/database/indexeddb.js` (Singleton implementation)
* **Assets**: `/src/assets/` (Shared CSS, JS, and PWA assets)
* **Utilities**: `/src/utils/` (Sanitization, modals, and helper functions)

## Key Decisions

* **Local-First**: Zero backend dependencies to ensure 100% uptime in
  industrial environments.
* **Vanilla JS**: Chosen for longevity and to minimize framework-induced
  maintenance debt.
* **IndexedDB**: Used over LocalStorage for structured, high-capacity data
  persistence.
* **Tailwind CSS**: Utility-first styling for rapid development and consistent
  EECOL branding.

## Risks & Trade-offs

* **Device Binding**: Data is local to the device/browser. Backup/Restore is
  manual.
* **Storage Quotas**: Reliant on browser-enforced storage limits
  (~50MB-2GB).
* **Syncing**: No native multi-device sync; requires manual export/import for
  data transfer.

---

### Additional Docs

* [README.md](README.md) - General info
* [QUICKSTART.md](QUICKSTART.md) - Setup steps
* [SECURITY.md](SECURITY.md) - Security details
