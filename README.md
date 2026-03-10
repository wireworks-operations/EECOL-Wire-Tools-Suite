# EECOL Wire Tools Suite <small>— Industrial-grade PWA for wire processing</small> 📘

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D%2016.0.0-green.svg)](https://nodejs.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

A comprehensive Progressive Web Application (PWA) for industrial wire processing
operations. This "Local-First" suite provides tools for wire inventory
management, cutting operations tracking, reporting/analytics, and various
specialized wire calculation utilities, all persisting data directly in the
browser's IndexedDB.

---

## 🚀 Getting Started

> The commands below are verified for this repo. If your platform differs, see
> **Troubleshooting**.

### Prerequisites

- **Node.js**: >= 16.0.0
- **Package Manager**: [pnpm](https://pnpm.io/) (preferred)

### 1) Clone & Install

```bash
git clone https://github.com/eecol/eecol-wire-tools-suite-v2.git
cd eecol-wire-tools-suite-v2
pnpm install
```

### 2) Run (Local)

```bash
# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3) Build, Test & Lint (🚧 In-Progress)

> **Warning:** Build and test infrastructure is currently under active
> development. Some scripts may require additional configuration files (e.g.,
> `webpack.config.js`, `jest.config.js`) to function correctly.

```bash
pnpm build     # Build for production (Experimental)
pnpm test      # Run unit tests (Experimental)
pnpm lint      # Run ESLint (Experimental)
```

---

## 🧭 Quickstart (90-second path)

```bash
# 1. Clone & enter
git clone https://github.com/eecol/eecol-wire-tools-suite-v2.git
cd eecol-wire-tools-suite-v2

# 2. Start server
pnpm dev

# 3. Open app
http://localhost:3000
```

---

## 🏗️ Architecture

See **[BLUEPRINT.md](BLUEPRINT.md)** for the ASCII blueprint and component
interactions.

<details>
<summary>Click to expand: Key Technologies</summary>

- **Frontend**: Vanilla JavaScript, HTML5, CSS3, [Tailwind CSS](https://tailwindcss.com/)
- **Storage**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (primary),
  localStorage (fallback)
- **PWA**: Service Workers, Web App Manifest
- **Charts**: [Chart.js](https://www.chartjs.org/) for data visualization
- **Offline-First**: Zero backend dependencies; works entirely offline.

</details>

---

## 📋 Available Tools

<details>
<summary>Core Operations & Records</summary>

- **Cutting Records**: Log, track, and analyze wire cuts efficiently.
- **Inventory Records**: Material inventory management and tracking.
- **Machine Maintenance**: Daily equipment inspection checklists.
- **Shipping Manifest**: Generate shipping documentation and labels.

</details>

<details>
<summary>Calculators & Estimators</summary>

- **Mark Calculator**: Calculate length between wire marks.
- **Stop Mark Calculator**: Determine exact stopping points for machine cuts.
- **Reel Capacity Estimator**: Calculate maximum wire capacity for specific
  reels.
- **Reel Size Estimator**: Recommend optimal reel sizes based on length.
- **Weight Calculator**: Estimate wire weight by dimensions and length.

</details>

---

## 🔧 Technical Details

<details>
<summary>Storage Layer (IndexedDB)</summary>

The application uses a singleton `EECOLIndexedDB` class to manage 14 specialized
stores, ensuring reliable client-side persistence for industrial data.

</details>

<details>
<summary>Security & Privacy</summary>

- **Local-First**: All data is stored exclusively on the client-side. No server
  or cloud transmission.
- **CSP**: Strict Content Security Policy enforced in `index.html`.

See **[SECURITY.md](SECURITY.md)** for more details.

</details>

---

## 📊 Status & Roadmap

- ✅ **Working**: Core calculators, records, reports, and PWA functionality.
- ❌ **Known Issues**: Multi-Cut Planner is currently a placeholder.
- 🚧 **Upcoming**: Finalizing build/test configuration, multi-cut planner
  rebuild, and Docker integration.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
