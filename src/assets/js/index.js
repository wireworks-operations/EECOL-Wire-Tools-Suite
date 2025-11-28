// Maintenance notification logic
document.addEventListener('DOMContentLoaded', function () {
    const notification = document.getElementById('maintenance-notification');
    const statusIcon = document.getElementById('status-icon');
    const notificationText = document.getElementById('notification-text');

    // Function to update maintenance notification
    async function updateMaintenanceNotification() {
        // Wait for database to be ready
        if (window.eecolDB) {
            try {
                await window.eecolDB.ready;
                const data = await window.eecolDB.get('maintenanceLogs', 'daily_check');

                if (!data || !data.completedAt) {
                    // No data or not completed - Action Required (Red)
                    showNotification('❌', 'bg-red-100 border-red-500', 'Action Required: Complete daily maintenance checklist');
                    return;
                }

                // Get completion date
                const completedAt = new Date(data.completedAt);
                const completionDate = completedAt.toISOString().split('T')[0];
                const now = new Date();
                const currentDate = now.toISOString().split('T')[0];

                if (completionDate === currentDate) {
                    // Completed today - Good (Green)
                    showNotification('✅', 'bg-green-100 border-green-500', `Daily Maintenance Completed: ${formatDate(completedAt)}`);
                } else {
                    // Not completed today - Action Required (Red)
                    showNotification('❌', 'bg-red-100 border-red-500', `Action Required: Complete daily maintenance checklist (Last: ${formatDate(completedAt)})`);
                }
            } catch (error) {
                console.error('Error reading from IndexedDB:', error);
                // Fallback to old localStorage if new DB fails
                checkLocalStorageFallback();
            }
        } else {
            // Fallback to localStorage if database not available
            checkLocalStorageFallback();
        }
    }

    function checkLocalStorageFallback() {
        const maintenanceData = localStorage.getItem('machineMaintenanceChecklist');
        if (!maintenanceData) {
            // No data - Action Required (Red)
            showNotification('❌', 'bg-red-100 border-red-500', 'Action Required: Complete daily maintenance checklist');
            return;
        }

        try {
            const data = JSON.parse(maintenanceData);
            if (!data.completedAt) {
                // Data but not completed - Action Required (Red)
                showNotification('❌', 'bg-red-100 border-red-500', 'Action Required: Complete daily maintenance checklist');
                return;
            }

            // Get completion date
            const completedAt = new Date(data.completedAt);
            const completionDate = completedAt.toISOString().split('T')[0];
            const now = new Date();
            const currentDate = now.toISOString().split('T')[0];

            if (completionDate === currentDate) {
                // Completed today - Good (Green)
                showNotification('✅', 'bg-green-100 border-green-500', `Daily Maintenance Completed: ${formatDate(completedAt)}`);
            } else {
                // Not completed today - Action Required (Red)
                showNotification('❌', 'bg-red-100 border-red-500', `Action Required: Complete daily maintenance checklist (Last: ${formatDate(completedAt)})`);
            }
        } catch (e) {
            console.error('Error parsing maintenance data:', e);
            showNotification('❌', 'bg-red-100 border-red-500', 'Action Required: Complete daily maintenance checklist');
        }
    }

    function showNotification(icon, bgClass, text) {
        statusIcon.textContent = icon;
        notification.className = notification.className.replace('hidden', '').replace(/bg-[^ ]*|border-[^ ]*/g, '').trim() + ' ' + bgClass + ' border-l-4';
        notificationText.textContent = text;
    }

    function formatDate(date) {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    // Initial load
    updateMaintenanceNotification();

    // Refresh when page becomes visible (user navigates back)
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            updateMaintenanceNotification();
        }
    });
});

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.3',
        menuItems: [
            { text: '💡 Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '🔒 Privacy Policy', href: '../privacy/privacy.html', class: 'bg-purple-500 hover:bg-purple-600' },
            { text: '💾 Backup Guide', href: '../backup/backup.html', class: 'bg-green-500 hover:bg-green-600' },
            { text: '🛠️ Maintenance', href: '../maintenance/maintenance.html', class: 'bg-purple-600 hover:bg-purple-700' },
            { text: '🗃️ Database Config', href: '../database-config/database-config.html', class: 'bg-cyan-600 hover:bg-cyan-700' },
            { text: '📋 Changelog', href: '../changelog/changelog.html', class: 'bg-amber-500 hover:bg-amber-600' }
        ],
        version: 'v0.8.0.3',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'EECOL Wire Tools'
    });
}

// IndexedDB initialization
document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Initialize IndexedDB (new system) - using singleton pattern
        if (typeof EECOLIndexedDB !== 'undefined' && EECOLIndexedDB.isIndexedDBSupported()) {
            // Make DB available globally for other scripts using singleton
            window.eecolDB = EECOLIndexedDB.getInstance();
            await window.eecolDB.ready;

            console.log('IndexedDB initialized successfully for EECOL Tools Suite');

            // Run migration from localStorage if needed
            const hasExistingData = localStorage.getItem('cutRecords') ||
                localStorage.getItem('inventoryItems') ||
                localStorage.getItem('machineMaintenanceChecklist');

            if (hasExistingData) {
                console.log('Existing localStorage data detected. Starting migration...');
                const migratedItems = await window.eecolDB.migrateFromLocalStorage();
                console.log(`Migration completed: ${migratedItems} items migrated`);
            }
        } else {
            console.warn('IndexedDB is not supported. Falling back to localStorage.');
        }

    } catch (error) {
        console.error('Failed to initialize databases:', error);
        // Fall back to localStorage only mode
        console.log('Running in localStorage-only mode');
    }
});
