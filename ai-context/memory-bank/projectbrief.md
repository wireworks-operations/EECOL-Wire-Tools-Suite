# Project Brief

## Project Identity
- **Name**: EECOL Wire Tools Suite - Edge
- **Version**: 0.8.0.1 (transitioning to v2.0.0 architecture)
- **Repository**: EECOL-Wire-Tools-Suite-Edge
- **Location**: /home/gamer/Documents/GitTea/EECOL-Wire-Tools-Suite-Edge
- **Branch**: edge (main branch for PRs: main)
- **Developers**: Lucas (PM/Business) & Claude AI (Engineering)

## Core Purpose
Enterprise-grade wire processing and inventory management suite designed for EECOL manufacturing operations. The system provides real-time collaboration, offline-first functionality, and role-based access control for shop floor teams.

## Primary Goals
1. **Reliability**: Eliminate async race conditions and data corruption issues
2. **Collaboration**: Enable real-time P2P synchronization for team coordination
3. **Security**: Implement enterprise-grade authentication and authorization
4. **Accessibility**: Work seamlessly offline with automatic sync when connected
5. **Professionalism**: Maintain clean, production-ready codebase

## Key Requirements

### Functional Requirements
- **Wire Cutting Operations**: Track cutting records, manage operations, coordinate team activities
- **Inventory Management**: Real-time material tracking, automated low-stock alerts, multi-location support
- **Reporting & Analytics**: Production metrics, historical analysis, performance tracking
- **Calculator Tools**: Wire weight, wire mark, stop mark, reel capacity estimators
- **Maintenance Tracking**: Equipment scheduling, work orders, automated reminders
- **Education Hub**: Training materials, knowledge base, feedback system

### Technical Requirements
- **Storage**: IndexedDB-first with Gun.js P2P synchronization layer
- **Authentication**: Role-based access control (Admin, Management, Auditor, Inventory Ops, Wire Ops)
- **Notifications**: Multi-channel system (SMTP email, Gotify webhooks)
- **PWA Support**: Installable, offline-first, service worker background sync
- **Security**: Shop-network containment, VPN support, encrypted P2P connections
- **Performance**: Sub-second P2P sync, zero console pollution, professional UX

### Non-Functional Requirements
- **Browser Support**: Modern browsers (>1%, not IE11)
- **Node Version**: >= 16.0.0
- **Network**: Local network/VPN only (no public internet P2P)
- **Data Integrity**: Conflict-free replicated data types (CRDTs)
- **Audit Trail**: Comprehensive logging for compliance

## Success Criteria
- Zero async race conditions in database operations
- 100% uptime for data persistence
- Sub-second P2P sync on local networks
- Enterprise-grade security audit compliance
- Professional production environment (no debug pollution)

## Project Constraints
- **No Cloud Dependencies**: Must operate 100% on-premises
- **Network Security**: P2P sync only on shop network/VPN
- **Legacy Compatibility**: Must migrate existing localStorage data
- **User Experience**: Consistent EECOL-branded modal system (no browser alerts)

## Current Phase
**Phase**: Active development on Edge branch
**Status**: v0.8.0.1 production-ready, transitioning to v2.0.0 architecture
**Recent Achievement**: Multi-Cut Planner Phase 1 complete (October 31, 2025)
**Focus**: Maintaining stability while implementing enterprise features

## Key Stakeholders
- **Primary Users**: Shop floor wire cutting operators
- **Secondary Users**: Inventory managers, maintenance technicians
- **Administrative Users**: Management, auditors, system administrators
- **Development Team**: Lucas (PM), Claude AI (Engineering)
