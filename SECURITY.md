# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.8.x   | :white_check_mark: |

## Reporting a Vulnerability

We take all security bugs in this project seriously. Thank you for improving the security of our project. We appreciate your efforts and responsible disclosure and will make every effort to acknowledge your contributions.

To report a security vulnerability, please email [security@example.com](mailto:security@example.com) with a detailed description of the vulnerability and steps to reproduce it.

## Security State

This application is designed as a local-first Progressive Web App (PWA). All data is stored exclusively on the client-side using IndexedDB.

### Data Storage

-   **All data is stored locally:** There is no server-side component, and no data is transmitted over the network to any cloud services.
-   **Data is not encrypted at rest:** The data stored in IndexedDB is not encrypted by the application. It relies on the security of the underlying operating system and browser.

### Data Transport

-   **No data transport:** The application does not transport data over the network. All operations are performed locally.

### Dependencies

-   **Tailwind CSS:** Used for styling. Fetched from a CDN.
-   **No other runtime dependencies.**

### Known Security Risks

-   **Physical access:** Since data is not encrypted at rest, anyone with physical access to the device and the ability to inspect the browser's data stores could potentially access the application's data.
-   **Cross-Site Scripting (XSS):** As with any web application, there is a potential risk of XSS if user-supplied data is not properly sanitized before being rendered. The application takes basic measures to prevent this, but it remains a theoretical attack vector.
