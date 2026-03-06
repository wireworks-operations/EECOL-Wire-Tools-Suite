## 2026-01-26 - [XSS via Template Literals and innerHTML]
**Vulnerability:** Widespread Cross-Site Scripting (XSS) vulnerabilities due to direct injection of user-controllable data into HTML template literals, which were then inserted into the DOM using `innerHTML`.
**Learning:** In a vanilla JavaScript application without a rendering framework that provides automatic escaping, every single piece of user-provided data must be manually sanitized. Numeric fields should also be escaped defensively to ensure consistency and safety against future type changes.
**Prevention:** Use the global `window.escapeHTML` utility to wrap all dynamic variables within HTML template strings. Avoid `innerHTML` where possible, or ensure strict sanitization is applied immediately before use.
