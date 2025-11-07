<div align="center">
  <h1 align="center">EECOL Wire Tools Suite</h1>
  <p align="center"><strong>Edge Development Branch</strong></p>
</div>

> ⚠️ **You are on the `edge` branch.** This branch contains the latest features and upcoming releases. It is used for testing and may contain experimental or unstable code. For the stable, production-ready version, please use the `main` branch.

**Current Version**: `v0.8.0.2`

## 🎯 **Overview**

A comprehensive Progressive Web Application (PWA) for industrial wire processing operations. Provides tools for wire inventory management, cutting operations tracking, reporting/analytics, and various wire calculation utilities.

### **Core Features**
- **Complete Tool Suite**: Cutting records, inventory management, calculators, reports
- **Offline-First Design**: Works seamlessly without internet connectivity
- **Professional Code**: Clean, production-ready with proper error handling
- **Mobile Responsive**: Optimized for all screen sizes and devices
- **PWA Installable**: Can be installed as a native app on desktop and mobile
- **Local Data Management**: Tools to export, import, and manage your local data.

### **Architecture**
- **IndexedDB Backend**: High-performance local database for all data persistence
- **PWA Features**: Offline functionality, installable app, service workers
- **Professional UI**: EECOL-branded modal dialogs, responsive design
- **Storage Strategy**: IndexedDB for all application data.

---

## 📋 **Available Tools**

### **Core Operations**
- **Cutting Records**: Track wire cutting operations and history
- **Inventory Records**: Material inventory management and tracking
- **Maintenance Checklists**: Equipment maintenance logging and scheduling
- **Database Config**: Manage your local application data.

### **Calculators**
- **Wire Weight Estimator**: Calculate wire weight by dimensions
- **Wire Mark Calculator**: Precise cutting mark calculations
- **Stop Mark Calculator**: Stop mark positioning calculations
- **Reel Capacity Estimator**: Calculate reel capacity for different wire sizes
- **Reel Size Estimator**: Recommend optimal reel sizes

### **Reports & Analytics**
- **Cutting Reports**: Analytics and reporting for cutting operations
- **Inventory Reports**: Inventory analytics and usage tracking
- **Live Statistics Dashboard**: Real-time metrics and combined data views for inventory and cutting

### **Additional Tools**
- **Shipping Manifest**: Generate professional shipping documentation
- **Reel Labels**: Print professional wire reel labels
- **Multi-Cut Planner**: Plan complex multi-reel cutting operations *(currently non-functional)*
- **Education Center**: Learning resources and reference materials

---

## 🔧 **Technical Details**

### **Storage Layer (IndexedDB)**
```javascript
const db = new EECOLIndexedDB({
  stores: ['cuttingRecords', 'inventoryRecords', 'maintenanceLogs', 'settings', 'markConverter', 'stopmarkConverter', 'reelcapacityEstimator']
});
```

**Database Stores:**
- `cuttingRecords` - Wire cutting operations and history
- `inventoryRecords` - Material inventory tracking
- `maintenanceLogs` - Equipment maintenance records
- `settings` - App configuration and preferences
- `markConverter` - Saved calculations from the Mark Calculator
- `stopmarkConverter` - Saved calculations from the Stop Mark Calculator
- `reelcapacityEstimator` - Saved configurations from the Reel Capacity Estimator


### **PWA Features**
- **Service Workers**: Background caching and offline functionality
- **Web App Manifest**: Installable on desktop and mobile devices
- **Offline Support**: Full functionality without internet connection

---

## 🚀 **Getting Started**

### **Running the Application**
To run this application, you will need to have Node.js and npm installed.

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```
This will start a local server, and you can access the application in your web browser at the provided URL (usually `http://localhost:3000`).

---

## 📊 **Current Status & Known Issues**

### **Working Features**
- ✅ All calculator tools (weight, mark, stop mark, reel capacity/size estimators)
- ✅ Cutting and inventory record management
- ✅ Reports and analytics dashboards
- ✅ Maintenance checklists
- ✅ Shipping manifests and reel labels
- ✅ Education center and learning resources
- ✅ PWA offline functionality
- ✅ Mobile responsive design
- ✅ Local data management tools

### **Known Issues**
- ❌ **Multi-Cut Planner**: Currently non-functional - complex tool with integration issues
- ⚠️ **Live Statistics Dashboard**: Has a known issue where it can crash when falling back to `localStorage` in some scenarios.

### **Recent Updates**
- **v0.8.0.2**: Removed `gun-sync` and added local data management tools.
- **v0.8.0.1**: Code modernization, professional UI, comprehensive tool suite
- **Console Cleanup**: Removed 400+ debug `console.log` statements for production readiness
- **Modal System**: Replaced all browser alerts with EECOL-branded dialogs
- **Mobile Navigation**: Consistent menus across all pages

---

## 🛠️ **Development**

### **Project Structure**
```
src/
├── core/database/          # IndexedDB implementation
├── pages/                  # HTML pages and JavaScript
├── assets/                 # CSS, icons, shared resources
├── utils/                  # Helper utilities
└── core/modules/           # Industry standards and data
```

### **Key Technologies**
- **Frontend**: Vanilla JavaScript, HTML5, TailwindCSS
- **Storage**: IndexedDB
- **PWA**: Service Workers, Web App Manifest
- **Charts**: `Chart.js` for data visualization

### **Contributing**
- Follow the established patterns in existing tools
- Use EECOL-branded modal system for user feedback
- Maintain mobile-responsive design
- Test offline functionality
- Document changes in `ai-context/` before implementation

---

## 📄 **License**

This project is proprietary software for EECOL Wire Tools operations.
