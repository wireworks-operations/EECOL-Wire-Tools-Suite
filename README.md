# EECOL Wire Tools Suite <small>— Industrial-grade PWA for wire processing</small> 📘

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D%2016.0.0-green.svg)](https://nodejs.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

An enterprise-grade, "Local-First" Progressive Web Application (PWA) designed
for industrial wire processing. This suite provides specialized calculators,
inventory management, and operational tracking tools that persist data directly
in the browser's IndexedDB, ensuring 100% uptime without backend dependencies.

---

## 🚀 Getting Started

> The commands below are verified for this repository. If your platform
> differs, see **Troubleshooting**.

### Prerequisites

- **Node.js**: >= 16.0.0
- **pnpm**: `npm install -g pnpm` (recommended)

### 1) Clone & Install

```bash
git clone https://github.com/eecol/eecol-wire-tools-suite-v2.git
cd eecol-wire-tools-suite-v2
pnpm install
```

### 2) Run (Local Development)

```bash
# Start the development server (serves the PWA at http://localhost:3000)
pnpm dev
```

### 3) Tooling Status

| Command | Status | Description |
| :--- | :--- | :--- |
| `pnpm dev` | ✅ **Operational** | Starts local dev server using `http-server`. |
| `pnpm build` | 🚧 **In-Progress** | Production build (Needs `webpack.config.js`). |
| `pnpm test` | 🚧 **In-Progress** | Unit testing via Jest (Needs `jest.config.js`). |
| `pnpm lint` | 🚧 **In-Progress** | ESLint validation (Needs `eslint.config.js`). |
| `pnpm docker:*` | 🚧 **Planned** | Containerized deployment (Needs `Dockerfile`). |

---

## 🧭 Quickstart (90-second path)

```bash
# Clone the repository
git clone https://github.com/eecol/eecol-wire-tools-suite-v2.git
cd eecol-wire-tools-suite-v2

# Install dependencies and start the app
pnpm install && pnpm dev
```

The app will be available at **[http://localhost:3000](http://localhost:3000)**.

---

## 🏗️ Architecture

The EECOL Wire Tools Suite is built on a **Local-First** architecture, meaning
it operates entirely on the client-side with zero external API or database
dependencies.

See **[BLUEPRINT.md](BLUEPRINT.md)** for the ASCII architecture and component
interactions.

<details>
<summary>⚙️ Core Technology Stack</summary>

- **Frontend**: Vanilla JavaScript (ESM Hybrid), HTML5, Tailwind CSS.
- **Persistence**: IndexedDB (Primary) via `EECOLIndexedDB` singleton.
- **PWA**: Service Worker (`sw.js`) and Web App Manifest for offline
  capability.
- **Visualization**: Chart.js for operational reporting and analytics.
- **Utility**: Custom modular print system and sanitization layer.

</details>

---

## 📋 Available Tools

<details>
<summary>📦 Operations & Records</summary>

- **Wire Cut Records**: Log and analyze wire cuts with single-pass metric
  optimization.
- **Inventory Records**: Manage materials with automatic timestamping and
  length fallbacks.
- **Machine Maintenance**: Daily equipment inspection checklists with
  multi-page support.
- **Shipping Manifest**: Generate reel labels and shipping documentation.

</details>

<details>
<summary>🧮 Calculators & Estimators</summary>

- **Mark Calculator**: Precise length calculation between wire marks.
- **Stop Mark Calculator**: Determine exact machine stop points for targeted
  cuts.
- **Reel Capacity Estimator**: Calculate maximum wire capacity for various reel
  sizes.
- **Weight Calculator**: Estimate wire weight based on dimensions and length.

</details>

---

## 🔧 Technical Details

<details>
<summary>🗄️ Storage Layer (IndexedDB)</summary>

The application uses a singleton `EECOLIndexedDB` class (version 5) to manage
15 specialized stores. It features:

- **Atomic Bulk Updates**: `bulkPut` for reliable data import/undo.
- **Idempotent Schema Upgrades**: Handles index lifecycle automatically.
- **Data Normalization**: Strict uppercase enforcement for Wire IDs and Order
  Numbers.

</details>

<details>
<summary>🔒 Security & Privacy</summary>

- **Zero Data Transmission**: All data remains in the browser's IndexedDB. No
  cloud sync.
- **XSS Mitigation**: Strict use of `.textContent` and a robust Content
  Security Policy (CSP).
- **Offline Reliability**: Service workers ensure the app loads even without an
  internet connection.

See **[SECURITY.md](SECURITY.md)** for our full security policy.

</details>

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
