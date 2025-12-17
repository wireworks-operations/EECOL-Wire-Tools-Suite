# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.8.x   | :white_check_mark: |

## Reporting a Vulnerability

We take all security bugs in this project seriously. Thank you for improving the security of our project. We appreciate your efforts and responsible disclosure and will make every effort to acknowledge your contributions.

To report a security vulnerability, please email [Lucas Kara](lucas.kara@eecol.com) with a detailed description of the vulnerability and steps to reproduce it.

## Security State

This application is designed as a local-first Progressive Web App (PWA). All data is stored exclusively on the client-side using IndexedDB, with no server-side components or cloud services involved.

### Architecture Overview

- **Client-Side Only**: No backend server, API calls, or external data transmission
- **Offline-First Design**: All functionality works without internet connectivity
- **PWA Features**: Service workers for caching, but no server communication
- **Storage**: IndexedDB as primary storage (14 specialized stores), localStorage as fallback

### Data Storage Security

- **Local Storage Only**: All data remains on the user's device; no cloud storage or synchronization
- **No Encryption at Rest**: Data stored in IndexedDB is not encrypted by the application
- **Browser Security Reliance**: Security depends on the user's operating system and browser protections
- **IndexedDB Constraints**: Database operations are subject to browser storage limits (~50MB typical)

### Data Transport Security

- **No Network Transport**: The application does not send data over the network
- **CDN Dependencies**: Only TailwindCSS and Google Fonts loaded from CDNs (HTTPS only)
- **No User Data Transmission**: No analytics, tracking, or data collection occurs

### Input Validation & Sanitization

- **Client-Side Validation**: Primary input validation implemented in JavaScript
- **Database-Level Constraints**: Additional validation enforced at IndexedDB storage level
- **XSS Prevention**: Content Security Policy (CSP) implemented to mitigate cross-site scripting risks

### Content Security Policy (CSP)

```html
content="default-src 'self';
         script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;
         style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com;
         font-src https://fonts.googleapis.com;
         img-src 'self' data:"
```

- **Self-Referential**: Only allows resources from the same origin
- **CDN Allowances**: Explicitly permits TailwindCSS and Google Fonts from their CDNs
- **Data URLs**: Allows inline images (for icons, etc.)
- **Unsafe Inline**: Required for TailwindCSS dynamic styling (acceptable risk in client-side app)

### Dependencies Security

- **TailwindCSS**: Loaded from official CDN (https://cdn.tailwindcss.com)
- **Chart.js**: Local copy included for data visualization
- **No Third-Party Scripts**: All JavaScript is self-hosted except TailwindCSS
- **HTTPS Enforcement**: All external resources loaded over HTTPS

### Attack Vector Analysis

#### Mitigated Threats
- **Server-Side Attacks**: Not applicable (no server)
- **SQL Injection**: Not applicable (IndexedDB, not SQL)
- **Authentication Bypass**: Not applicable (no authentication system)
- **Session Hijacking**: Not applicable (no sessions)
- **CSRF**: Not applicable (no server-side state changes)

#### Potential Attack Vectors

**Cross-Site Scripting (XSS)**:
- **Risk Level**: Low (mitigated by CSP)
- **Description**: Malicious scripts could potentially be injected if input sanitization fails
- **Mitigations**:
  - Strict CSP prevents external script execution
  - Client-side input validation and sanitization
  - No dynamic script loading from user inputs
- **Remaining Risk**: Theoretical if CSP is bypassed or user inputs contain malicious HTML

**Data Exfiltration via Physical Access**:
- **Risk Level**: High (unavoidable in client-side architecture)
- **Description**: Anyone with physical access to the device can inspect IndexedDB contents
- **Mitigations**: None (by design - data stays local)
- **Note**: This is inherent to client-side applications; users should secure their devices

**CDN Supply Chain Attacks**:
- **Risk Level**: Low
- **Description**: Compromised CDN could serve malicious TailwindCSS
- **Mitigations**:
  - Only official TailwindCSS CDN used
  - HTTPS ensures encrypted transport
  - Subresource Integrity (SRI) could be added for additional protection

**Browser Vulnerabilities**:
- **Risk Level**: Medium
- **Description**: Exploits in the browser or IndexedDB implementation
- **Mitigations**:
  - Supports only modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
  - No legacy browser support reduces attack surface
  - Regular browser updates recommended
