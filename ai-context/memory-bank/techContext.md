# Technical Context

## Technology Stack

### Core Technologies

#### Frontend
- **HTML5**: Semantic markup, modern web standards
- **CSS3**: Custom styling with EECOL branding
  - Grid and Flexbox for layouts
  - CSS custom properties for theming
  - Responsive design patterns
- **JavaScript (ES6+)**: Vanilla JS, no framework dependencies
  - Module pattern for code organization
  - Async/await for asynchronous operations
  - Modern DOM APIs

#### Data Storage
- **IndexedDB**: Primary persistent storage
  - Transaction-safe operations
  - Indexed queries for performance
  - Large storage capacity (unlimited quota)
  - Browser-native, no external dependencies

#### Synchronization
- **Gun.js v0.2020.1240**: Peer-to-peer real-time sync
  - Conflict-free replicated data types (CRDTs)
  - Automatic peer discovery
  - WebRTC for direct connections
  - Gun SEA for encryption and authentication

#### Security
- **Gun SEA**: Security, Encryption, Authorization
  - End-to-end encryption
  - Password hashing (PBKDF2)
  - Digital signatures
- **crypto-js v4.1.1**: Additional cryptographic utilities
- **uuid v9.0.0**: Unique identifier generation

### Development Tools

#### Build Tools
- **Webpack v5.75.0**: Module bundler
  - Code splitting
  - Asset optimization
  - Development server
  - Production builds
- **Babel v7.20.0**: JavaScript transpiler
  - ES6+ to ES5 conversion
  - TypeScript support
  - Browser compatibility

#### Type Checking
- **TypeScript v4.9.0**: Optional static typing
  - Type definitions for external libraries
  - Better IDE support
  - Compile-time error detection
  - Note: Currently used for type definitions, not full TypeScript migration

#### Testing
- **Jest v29.3.0**: Unit testing framework
  - JSDOM environment for DOM testing
  - Code coverage reports
  - Snapshot testing
- **Cypress v12.0.0**: End-to-end testing
  - Real browser testing
  - Visual regression testing
  - Network stubbing

#### Code Quality
- **ESLint v8.28.0**: JavaScript linter
  - Code style enforcement
  - Error detection
  - TypeScript ESLint plugin
- **TailwindCSS v3.2.0**: Utility-first CSS framework (planned integration)

#### Development Server
- **http-server v14.1.1**: Simple HTTP server
  - Development mode serving
  - No caching for rapid iteration
  - Cross-origin resource sharing (CORS) support
- **webpack-dev-server v4.11.0**: Hot module replacement

#### Containerization
- **Docker**: Deployment containerization
  - Nginx-based production serving
  - Multi-stage builds for optimization
  - docker-compose for orchestration

## Development Setup

### Prerequisites
```bash
Node.js >= 16.0.0
npm >= 7.0.0
Git for version control
```

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd EECOL-Wire-Tools-Suite-Edge

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

#### Development
```bash
# Start development server on http://localhost:3000
npm run dev

# Build for development with watch mode
npm run build:dev
```

#### Production
```bash
# Create optimized production build
npm run build

# Run tests before deployment
npm run test

# Deploy (implementation specific)
npm run deploy
```

#### Testing
```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Open Cypress test runner
npm run cypress
```

#### Code Quality
```bash
# Lint JavaScript/TypeScript
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Type check without emitting files
npm run type-check
```

#### Docker
```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run
```

## Project Structure

```
EECOL-Wire-Tools-Suite-Edge/
├── src/                          # Source code
│   ├── core/                     # Core services and modules
│   │   ├── database/
│   │   │   ├── indexeddb.js      # IndexedDB wrapper
│   │   │   └── gun-sync.js       # Gun.js P2P sync
│   │   └── modules/
│   │       ├── industry-standards.js
│   │       └── wesco-eecol-products.js
│   ├── pages/                    # Feature pages
│   │   ├── index/
│   │   │   └── index.html
│   │   ├── cutting-records/
│   │   │   └── cutting-records.html
│   │   ├── inventory-records/
│   │   │   └── inventory-records.html
│   │   ├── cutting-reports/
│   │   ├── inventory-reports/
│   │   ├── live-statistics/
│   │   ├── maintenance/
│   │   ├── calculator tools/
│   │   └── education/
│   ├── assets/
│   │   ├── css/                  # Stylesheets
│   │   │   ├── eecol-theme.css   # Global theme
│   │   │   └── [feature].css     # Feature-specific
│   │   ├── js/                   # JavaScript modules
│   │   │   ├── pwa-core.js
│   │   │   ├── [feature].js      # Feature-specific
│   │   │   └── ...
│   │   └── img/                  # Images and icons
├── config/                       # Build configuration
│   ├── build.js
│   ├── test.js
│   └── deploy.js
├── tests/                        # Test suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                         # Documentation
├── docker/                       # Docker configuration
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── Dockerfile
├── memory-bank/                  # AI assistant memory
├── CONTEXT.md                    # Development context
├── README.md                     # Project overview
├── package.json                  # Dependencies
└── webpack.config.js             # Webpack configuration
```

## Technical Constraints

### Browser Compatibility
**Target**: Modern browsers only
- Chrome/Edge >= 90
- Firefox >= 88
- Safari >= 14
- No Internet Explorer support

**Rationale**:
- IndexedDB v2 features
- ES6+ JavaScript
- Modern CSS Grid/Flexbox
- Service Worker APIs

### Storage Limits
- **IndexedDB**: Unlimited quota (user-granted)
- **localStorage**: 5-10MB (UI state only)
- **Service Worker Cache**: 50MB recommended limit

### Network Requirements
- **P2P Sync**: Local network or VPN required
- **Public Network**: P2P disabled for security
- **Offline**: Full functionality without network

### Performance Targets
- **Page Load**: < 2 seconds on 3G
- **Time to Interactive**: < 3 seconds
- **First Contentful Paint**: < 1 second
- **P2P Sync Latency**: < 1 second on LAN

## Dependencies

### Production Dependencies
```json
{
  "gun": "^0.2020.1240",           // P2P sync
  "gun/sea": "^0.2020.1240",       // Security layer
  "@types/gun": "^0.9.3",          // TypeScript definitions
  "crypto-js": "^4.1.1",           // Cryptography
  "uuid": "^9.0.0"                 // Unique IDs
}
```

### Development Dependencies
See package.json for complete list. Key tools:
- Webpack ecosystem (bundling, optimization)
- Babel (transpilation)
- TypeScript (type checking)
- Jest (unit testing)
- Cypress (E2E testing)
- ESLint (code quality)

## Tool Usage Patterns

### Git Workflow
- **Main Branch**: `main` - Production-ready code
- **Development Branch**: `edge` - Active development
- **Feature Branches**: `feature/[name]` - New features
- **Bugfix Branches**: `bugfix/[name]` - Bug fixes

**Commit Convention**:
```
type(scope): description

feat(multi-cut): add phase 1 planner functionality
fix(inventory): resolve race condition in stock updates
docs(changelog): document completed features
refactor(cutting): modernize alert system to modals
```

### Code Style Guidelines

#### JavaScript
- Use `const` by default, `let` when mutation needed
- Avoid `var` entirely
- Use arrow functions for callbacks
- Async/await over Promise chains
- Descriptive variable names (no single letters except loop counters)

#### CSS
- BEM methodology for class names (Block__Element--Modifier)
- EECOL color scheme: `#0058B3` (primary blue)
- Mobile-first responsive design
- Avoid `!important` unless absolutely necessary

#### HTML
- Semantic HTML5 elements
- Accessible markup (ARIA labels, roles)
- Proper heading hierarchy
- Form validation attributes

### Debugging Patterns

#### Production Environment
- **console.error**: Error logging ONLY (preserved)
- **console.warn**: Critical warnings ONLY
- **console.log**: REMOVED from production
- **Modal Dialogs**: User-facing error messages

#### Development Environment
- Browser DevTools for debugging
- Network tab for P2P sync inspection
- IndexedDB inspector for data verification
- Service Worker inspector for PWA debugging

### Testing Strategy

#### Unit Tests
- Test individual functions in isolation
- Mock external dependencies (Gun.js, IndexedDB)
- Test edge cases and error conditions
- Maintain >80% code coverage

#### Integration Tests
- Test module interactions
- Database operations end-to-end
- P2P synchronization scenarios
- Authentication flows

#### E2E Tests
- Critical user workflows
- Cross-browser compatibility
- Mobile responsive behavior
- Offline functionality

## Security Practices

### Code Security
- No hardcoded credentials
- Environment variables for sensitive config
- Input validation on all user data
- Output escaping to prevent XSS
- Parameterized queries (IndexedDB)

### Data Security
- Encrypted storage for sensitive data
- Secure session management
- Automatic logout after inactivity
- Audit trails for administrative actions

### Network Security
- HTTPS required in production
- WebRTC encrypted connections
- Shop network containment
- VPN detection for P2P enablement

## Deployment

### Build Process
```bash
# 1. Clean previous builds
rm -rf dist/

# 2. Run tests
npm test

# 3. Type check
npm run type-check

# 4. Lint code
npm run lint

# 5. Production build
npm run build

# 6. Build Docker image
npm run docker:build
```

### Production Environment
- **Server**: Nginx or similar static file server
- **HTTPS**: Required for Service Worker and WebRTC
- **Headers**: Proper CORS, CSP, security headers
- **Caching**: Aggressive caching for static assets
- **Compression**: Gzip/Brotli for text resources

### Environment Configuration
- **Development**: `.env.development`
- **Production**: `.env.production`
- **Variables**:
  - `API_URL`: Backend API endpoint (future)
  - `TURN_SERVER`: TURN server for P2P (optional)
  - `SMTP_CONFIG`: Email notification settings
  - `GOTIFY_URL`: Webhook notification URL

## Migration Notes

### From v0.8.0.1 to v2.0.0
- **Storage**: localStorage → IndexedDB migration
- **Architecture**: Single-user → Multi-user with auth
- **Sync**: Manual → Automatic P2P
- **Security**: Basic → Enterprise RBAC

### Data Migration Scripts
Located in `src/core/database/migrations.js`:
- Version detection
- Automated data transfer
- Integrity verification
- Rollback capability

## Performance Optimization

### Bundle Size
- Code splitting by route
- Lazy loading for heavy features
- Tree shaking for unused code
- Minification and compression

### Runtime Performance
- Debounced input handlers
- Throttled sync operations
- Virtual scrolling for large lists
- IndexedDB index optimization

### Network Optimization
- Service Worker caching
- Network-first strategy for dynamic data
- Cache-first for static assets
- Background sync for offline operations

## Troubleshooting

### Common Issues

#### IndexedDB Errors
- Check browser quota limits
- Verify database schema version
- Inspect transactions for deadlocks
- Clear database and re-initialize if corrupted

#### P2P Sync Failures
- Verify network connectivity
- Check VPN/shop network status
- Inspect WebRTC peer connections
- Review Gun.js relay configuration

#### Service Worker Issues
- Unregister and re-register worker
- Clear cache storage
- Check for update loops
- Verify manifest configuration

### Debug Tools
- Chrome DevTools Application tab
- Firefox Storage Inspector
- Gun.js debug mode: `localStorage.setItem('debug', 'gun:*')`
- Network tab for WebRTC connections
