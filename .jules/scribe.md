# Scribe's Journal – Critical Learnings 📘

## 2025-03-09 - Project Architecture & Constraints
**Observation:** The repository is a pure client-side Progressive Web Application (PWA). It uses IndexedDB for data persistence and has no backend server or API dependencies. Build and dev workflows are managed via `pnpm` and `webpack`.
**Learning:** Documentation must emphasize that no backend setup is required and that data remains local to the browser. Standard server-side instructions (like database connections or API keys) should be omitted to avoid confusion.
**Action:** Tailored `README.md` and `BLUEPRINT.md` to highlight the "Local-First" architecture.

## 2025-03-09 - Environment Nuances
**Observation:** The project uses `http-server` for development and `webpack` for production builds. There is no `.github/workflows` or other CI infrastructure present in the current state of the repo.
**Learning:** "Getting Started" should focus on local development commands and Docker as an alternative, while omitting CI/CD status badges to maintain accuracy.
**Action:** Updated `README.md` with verified `pnpm` scripts and excluded CI badges.

## 2025-03-09 - Command Verification Findings
**Observation:** Several `pnpm` scripts (`lint`, `test`, `build`) fail due to missing configuration files (`.eslintrc`, `jest.config.js`, `webpack.config.js`) or missing source files. `pnpm dev` works correctly for serving the static PWA. `npm start` mentioned in README is missing from `package.json`. `Dockerfile` is also missing despite docker scripts being present.
**Learning:** Current documentation refers to non-existent scripts and missing infrastructure. The primary working path is serving static files via `http-server`.
**Action:** Documentation will prioritize `pnpm dev` and clearly state the current status of other tooling. Will fix the `npm start` vs `pnpm dev` discrepancy.
