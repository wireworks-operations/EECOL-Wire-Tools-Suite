# Sentinel Security Journal 🛡️

## 2026-03-09 - Project-wide XSS Mitigation
**Vulnerability:** Widespread use of `innerHTML` for rendering dynamic data from IndexedDB and user inputs across almost all application modules (Inventory, Cutting, Shipping, Estimators).
**Learning:** Manual escaping with `window.escapeHTML()` was inconsistently applied and cumbersome for complex data types. Using `document.createElement()` and `.textContent` provides a more robust, native defense that is easier to verify and harder to accidentally bypass.
**Prevention:** Establish a "Secure by Default" pattern where `innerHTML` is strictly forbidden for dynamic content. Prefer `textContent` for data and `createElement` for structure. Use `innerHTML` only for static, predefined templates where dynamic parts are everything.
