# Blueprint 🧱

> **Goal:** Provide a fast mental model—components, boundaries, and critical flows.

## 🏛️ System Overview

```text
                    +-------------------------+
   Browser/Client   |         Frontend        |
  +--------------+  |  Vanilla JS (ESM)       |
  |  User Agent  |--|  Tailwind CSS + HTML5   |
  +--------------+  +------------+------------+
                                  |
                                  | window.eecolDB
                                  v
                    +-------------+-------------+
                    |      EECOLIndexedDB       |
                    |   (Singleton Pattern)     |
                    |   Database Version: 10    |
                    +-------------+-------------+
                                  |
             +--------------------+--------------------+
             |                                         |
             v                                         v
  +---------------------+                   +---------------------+
  |   Service Worker    |                   |    IndexedDB        |
  | (sw.js) Caching     |                   |  14 Object Stores   |
  | Offline Capability  |                   |  Local-First Data   |
  +---------------------+                   +---------------------+
```

## 🔄 Data Flow (Happy Path)

1. **User Action**: User enters data into a tool (e.g., Cutting Records).
2. **Persistence**: Frontend calls the `EECOLIndexedDB` singleton via `window.EECOLIndexedDB.getInstance()`.
3. **Local Storage**: Data is written directly to a specialized IndexedDB store (e.g., `cuttingRecords`) using `relaxed` durability.
4. **Offline Access**: Service worker (`sw.js`) serves cached HTML/JS/CSS assets even without connectivity.
5. **Retrieval**: Analytics tools query IndexedDB to render real-time charts via Chart.js.

## 🗄️ Database Architecture (v10)

The application uses **14 specialized stores** within the `EECOLTools_v2` database:

- **Record-Keeping**: `cuttingRecords`, `inventoryRecords`, `maintenanceLogs`.
- **Calculators**: `markConverter`, `stopmarkConverter`, `reelcapacityEstimator`, `reelsizeEstimator`, `wireCutList`.
- **Engineering**: `calibrationMeasurements`, `multicutPlanner`.
- **Core**: `settings`, `users`, `notifications`, `sessions`.

### Store Enumerable

| Store Name | Key Path | Primary Purpose |
| :--- | :--- | :--- |
| `cuttingRecords` | `id` | Logs and analysis of wire cuts. |
| `inventoryRecords` | `id` | Material management and tracking. |
| `users` | `id` | Local user profiles and roles. |
| `notifications` | `id` | Local system alerts and reminders. |
| `maintenanceLogs` | `id` | Equipment inspection checklists. |
| `markConverter` | `id` | Wire mark calculation history. |
| `stopmarkConverter` | `id` | Stop mark calculation history. |
| `reelcapacityEstimator` | `id` | Reel capacity calculation history. |
| `reelsizeEstimator` | `id` | Reel size calculation history. |
| `multicutPlanner` | `id` | Planning for multiple reel cuts. |
| `settings` | `name` | Application-wide local configurations. |
| `sessions` | `sessionId` | Local session management. |
| `calibrationMeasurements` | `id` | Machine calibration tracking. |
| `wireCutList` | `id` | Queue of pending wire cuts. |

## 🔄 Real-Time Workspace & Tab Synchronization

To deliver a seamless desktop experience across multiple browser tabs or detached windows, the suite utilizes an event-driven synchronization layer that coordinates the primary workspace (Cutting Records) and the standalone dedicated views (e.g., Wire Cut List, Live Statistics, Reports).

### 1) Cross-Tab Autofill Coordination

When an operator clicks the **"AutoFill Cut"** action on an item in the standalone Wire Cut List tab:

1. The standalone tab writes the item's unique identifier to the dedicated `localStorage` synchronization key:

   ```javascript
   localStorage.setItem('eecolWireListAutofillId', targetId);
   ```

2. The main Cutting Records tab, which runs a global window listener for `storage` events, instantly captures this key write:

   ```javascript
   window.addEventListener('storage', (event) => {
     if (event.key === 'eecolWireListAutofillId' && event.newValue) {
       // Automatically loads, switches forms, and regains operating focus
       autoFillFormFromList(event.newValue);
     }
   });
   ```

3. This eliminates double-entry and enables physical separation of queue-management and cutting-execution screens.

### 2) Database Change Propagation

Because IndexedDB does not natively support multi-tab push notifications, the `EECOLIndexedDB` singleton implements a lightweight broadcast pattern:

- Every successful write/delete operation triggers `_notifyChange()`.
- `_notifyChange()` updates a volatile `localStorage` key containing a high-resolution timestamp and random salt:

  ```javascript
  localStorage.setItem('eecolDBChange', `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  ```

- Subscribing pages (such as Live Statistics, Dashboard, and Reports) listen for this specific key change and trigger an incremental, zero-refresh redraw of their visual elements.

## ⚡ Performance & Atomicity Patterns

Given the high throughput requirements of industrial workshops, database operations are strictly optimized to prevent UI locking and layout thrashing:

- **Relaxed Durability**: All database transactions are initiated with `{ durability: 'relaxed' }`. This instructs the browser's storage engine to acknowledge commits in memory first and flush to disk asynchronously, resulting in up to a **10x write throughput increase** during rapid operator entries.
- **Atomic Batching**: Multi-item operations (such as list reorderings, data backups, and CSV imports) are wrapped in specialized single-transaction blocks (`bulkPut` and `bulkDelete`). This ensures all operations succeed or fail together, maintaining perfect referential integrity and avoiding repeated transaction overhead.
- **Map-Driven Reordering**: Reordering complex sequences (like the Wire Cut List) leverages `Map`-based O(1) lookups to determine new positions before issuing an atomic `bulkPut` operation, converting O(N²) quadratic nested searches into highly performant O(N) linear runs.

## 📁 Repos & Conventions

- **Pages**: `/src/pages/<tool-name>/` (HTML/JS/CSS for specific tools).
- **Database**: `/src/core/database/indexeddb.js` (Singleton implementation).
- **Assets**: `/src/assets/` (Shared CSS, JS, and PWA assets).
- **Utilities**: `/src/utils/` (Sanitization, modals, and helper functions).
- **Print Utility**: `/src/utils/print/` (Modular print logic organized by domain).

## 💡 Key Decisions

- **Local-First**: Zero backend dependencies to ensure 100% uptime in industrial environments.
- **Vanilla JS**: Chosen for longevity and to minimize framework-induced maintenance debt.
- **IndexedDB**: Used over LocalStorage for structured, high-capacity data persistence. Target version is **10**.
- **ESM Hybrid**: Transitioning towards ES Modules (`type="module"`) while maintaining global shims for backward compatibility.
- **Relaxed Durability**: Uses `durability: 'relaxed'` in IDB transactions for optimal UI responsiveness and performance in local-only scenarios.

## ⚠️ Risks & Trade-offs

- **Device Binding**: Data is local to the device/browser. Backup/Restore is a manual JSON-based process.
- **Storage Quotas**: Reliant on browser-enforced storage limits.
- **Syncing**: No multi-device sync; requires manual export/import for data transfer.

---

### Additional Docs

- [README.md](README.md) - General info
- [QUICKSTART.md](QUICKSTART.md) - Setup steps
- [SECURITY.md](SECURITY.md) - Security details
