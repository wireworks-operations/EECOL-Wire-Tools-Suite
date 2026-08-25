# Blueprint 🧱

> **Goal:** Provide a fast mental model—components, boundaries, and critical flows.

## 🏗 Architecture Overview

```text
                    +-------------------------+
   Browser/Client   |         Frontend        |
  +--------------+  |  Vanilla JS (ESM)       |
  |  User Agent  |--|  Tailwind CSS + HTML5   |
  +--------------+  +------------+------------+
                                  |
               +------------------+------------------+
               |                                     |
               v                                     v
  +-------------------------+            +-------------------------+
  |     EECOLIndexedDB      |            |      WireCutLinker      |
  |   (Singleton Pattern)   |            |  Cross-Tab Real-time    |
  |   Database Version: 10  |            |   Communication Bridge  |
  +------------+------------+            +------------+------------+
               |                                     |
    +----------+----------+               +----------+----------+
    |                     |               |                     |
    v                     v               v                     v
+-------+             +-------+     +------------+        +------------+
|  Sw   |             |  IDB  |     |  Cutting   |        |  Wire Cut  |
| Caching |           |Stores |     |  Records   |<======>|    List    |
+-------+             +-------+     | Workspace  |        | Workspace  |
                                    +------------+        +------------+
```

## 🔄 Data Flow & System Interactions

1. **Persistence**: Operations call the `EECOLIndexedDB` singleton (`window.EECOLIndexedDB.getInstance()`). Data writes directly to specialized stores (e.g. `cuttingRecords`, `wireCutList`) using `relaxed` transaction durability for maximum local performance.
2. **Offline First**: The service worker (`sw.js`) serves cached HTML/JS/CSS assets even without network connectivity.
3. **Cross-Tab Synchronization (`WireCutLinker`)**:
   - **Heartbeat Loop**: The Cutting Records tab broadcasts a heartbeat every 3 seconds via `BroadcastChannel` (with `localStorage` fallback). The Standalone Wire Cut List listens to update its live `#connectionBadge` (`🟢 Connected to Cutting Records` / `🔴 Cutting Records Not Detected`).
   - **Active Order Detection**: Setting an item or merged group to **Active** in the Standalone Cut List broadcasts an `active_order_update` event. Cutting Records renders an amber `🌟 Active Order` banner at the top of the entry form for immediate glanceability.
   - **AutoFill Payload & Receipt Acknowledgment**: Clicking **"📥 AutoFill Cut"** sends the order details over the linker. Cutting Records populates form fields, sets Reel/Coil modes, triggers a success toast, and returns an `autofill_ack` message, triggering a green confirmation toast on the Standalone Cut List.

## 🗂 Standalone Wire Cut List & Merged Order Grouping

The **Standalone Wire Cut List** (`src/pages/wire-cut-list/wire-cut-list.html` & `src/assets/js/wire-cut-list.js`) provides a full-screen, dedicated workspace for order queue management.

### Key Capabilities & Visual Clustering Architecture

- **Merged Order Grouping (`.wire-group-container`)**:
  - Entries assigned to the same group via right-click (`📁 Add to Group...`) or `#groupModal` are merged into a single consolidated card container with an integrated header bar (`📁 Group: [GroupName] • N Items`).
  - Each unique group receives a distinct, hash-generated thin border color (purple, indigo, emerald, sky, rose, teal, amber) for instant glanceability.
  - Items within a group retain individual pastel background colors, comments, and item-level action buttons (AutoFill, Complete, Remove, Restore).
- **Group-Level & Item-Level Active Status**:
  - Singleton active model: Only one item or one group can be active across the entire system at any given time.
  - Activating a group highlights the group container card with an amber pulsing ring, header badge, and broadcasts to Cutting Records without forcing individual item active states.
  - Context menus dynamically toggle between group actions (`Make Group Active`, `Disband Group`) when right-clicking group headers and item actions (`Make Item Active`, `Clear Active Status`, `Add to Group...`, `Remove`, `Softer Colors`) when right-clicking sub-cards.
- **Drag-and-Drop Reordering**:
  - Both standalone item cards and entire merged group containers are draggable, persisting sequential position ordering to IndexedDB (`wireCutList`).
- **Item Restoration**:
  - Completed or removed entries in the status filter view display a `🔄 Restore` action button to revert status back to active.

## 🗄 Database Architecture (v10)

The application uses **14 specialized stores** within the `EECOLTools_v2` database:

- **Record-Keeping**: `cuttingRecords`, `inventoryRecords`, `maintenanceLogs`.
- **Calculators & Queues**: `markConverter`, `stopmarkConverter`, `reelcapacityEstimator`, `reelsizeEstimator`, `wireCutList`.
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
| `wireCutList` | `id` | Queue of pending wire cuts (with order grouping & active status). |

## 📁 Repos & Conventions

- **Pages**: `/src/pages/<tool-name>/` (HTML/JS/CSS for specific tools).
- **Database**: `/src/core/database/indexeddb.js` (Singleton implementation).
- **Cross-Tab Linker**: `/src/assets/js/wire-cut-linker.js` (Real-time communication bridge).
- **Assets**: `/src/assets/` (Shared CSS, JS, and PWA assets).
- **Utilities**: `/src/utils/` (Sanitization, modals, theme loader, and mobile menu).
- **Print Utility**: `/src/utils/print/` (Modular print logic organized by domain).

## 💡 Key Decisions

- **Local-First Architecture**: Zero external backend dependencies to ensure 100% uptime in industrial warehouse environments.
- **Cross-Tab Communication**: `BroadcastChannel` with fallback to `localStorage` storage events guarantees reliable real-time linking across browser tabs.
- **Vanilla JS Longevity**: Direct DOM manipulation and standard web APIs preserve codebase maintainability and avoid framework obsolescence.
- **IndexedDB Schema Versioning**: Target schema version is **10** across 14 Stores.
- **Relaxed Durability**: Uses `durability: 'relaxed'` in IDB transactions for instant UI responsiveness.

## ⚠️ Risks & Trade-offs

- **Device Binding**: Data is local to the device/browser. Backup/Restore is a manual JSON-based process (`JSON Backup Export/Import`).
- **Storage Quotas**: Reliant on browser-enforced storage limits.
- **Syncing Scope**: Cross-tab communication operates locally within the same browser origin. Multi-device sync requires JSON file transfer.

---

### Additional Docs

- [README.md](README.md) - General info & getting started
- [QUICKSTART.md](QUICKSTART.md) - Setup steps
- [SECURITY.md](SECURITY.md) - Security details
