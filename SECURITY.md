# Security Policy 🔐

## Supported Versions

| Version | Supported          |
| :------ | :----------------- |
| 0.8.x   | ✅ Security updates |
| main    | ✅ Security updates |

## Reporting a Vulnerability

We take all security bugs in this project seriously. To report a security
vulnerability, please follow these steps:

1. **Email:** <lucas.kara@eecol.com>
2. **Private Issue:** GitHub Security Advisory (preferred for public repos)
3. **Response Target:** Acknowledge within **48 hours**

**Please do not** publicly disclose vulnerabilities until a fix is released.

---

## Security State

This application is designed as a local-first Progressive Web App (PWA). All
data is stored exclusively on the client-side using IndexedDB, with no
server-side components or cloud services involved.

### Architecture Overview

- **Client-Side Only**: No backend server, API calls, or external data
  transmission.
- **Offline-First Design**: All functionality works without internet
  connectivity.
- **PWA Features**: Service workers for caching, but no server communication.
- **Storage**: IndexedDB as primary storage (14 specialized stores),
  localStorage as fallback.

### Data Storage Security

- **Local Storage Only**: All data remains on the user's device. No cloud
  storage or synchronization.
- **No Encryption at Rest**: Data stored in IndexedDB is not encrypted by the
  application.
- **Browser Security Reliance**: Security depends on the user's operating
  system and browser protections.
- **IndexedDB Constraints**: Database operations cab be subject to browser
  storage limits (~50MB typical).

### Data Transport Security

- **No Network Transport**: The application does not send data over the
  network.
- **CDN Dependencies**: Only TailwindCSS and Google Fonts loaded from CDNs
  (HTTPS only).
- **No User Data Transmission**: No analytics, tracking, or data collection
  occurs.

---

### Hardening Checklist

- [x] Content Security Policy (CSP) implemented
- [x] Input validation & output encoding (using `escapeHTML`)
- [x] IndexedDB storage level constraints
- [x] Subresource Integrity (SRI) for CDN dependencies (planned)
- [x] Regular dependency scans (planned)

---

### Attack Vector Analysis

#### Mitigated Threats

- **Server-Side Attacks**: Not applicable (no server).
- **SQL Injection**: Not applicable (IndexedDB, not SQL).
- **Authentication Bypass**: Not applicable (no authentication system).
- **Session Hijacking**: Not applicable (no sessions).
- **CSRF**: Not applicable (no server-side state changes).

#### Potential Attack Vectors

**Cross-Site Scripting (XSS)**:

- **Risk Level**: Low (mitigated by CSP).
- **Description**: Malicious scripts could potentially be injected if input
  sanitization fails.
- **Mitigations**: Strict CSP prevents external script execution. Client-side
  input validation and sanitization using `window.escapeHTML()`.

**Data Exfiltration via Physical Access**:

- **Risk Level**: High (unavoidable in client-side architecture).
- **Description**: Anyone with physical access to the device can inspect
  IndexedDB contents.
- **Mitigations**: None by design. Users should secure their devices and use
  browser-level privacy features.

**CDN Supply Chain Attacks**:

- **Risk Level**: Low.
- **Description**: Compromised CDN could serve malicious assets.
- **Mitigations**: Only official CDNs used over HTTPS.

---

### Contact & Keys

- Security contact: @lucas.kara
- Maintenance lead: EECOL Tools Team
