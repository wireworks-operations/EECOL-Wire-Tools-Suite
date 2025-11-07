// Maintenance notification logic
document.addEventListener('DOMContentLoaded', function() {
    const notification = document.getElementById('maintenance-notification');
    const statusIcon = document.getElementById('status-icon');
    const notificationText = document.getElementById('notification-text');

    // Get maintenance data from new IndexedDB system
    if (window.eecolDB) {
        window.eecolDB.get('maintenanceLogs', 'daily_check').then(data => {
            if (!data || !data.completedAt) {
                // No data or not completed, show based on time
                const now = new Date();
                const currentHour = now.getHours();
                if (currentHour < 13) {
                    // Yellow: before 1 PM
                    showNotification('⚠️', 'bg-yellow-100 border-yellow-500', 'Complete daily maintenance checklist by 1 PM PST');
                } else {
                    // Red: after 1 PM
                    showNotification('❌', 'bg-red-100 border-red-500', 'Overdue: Complete daily maintenance checklist');
                }
                return;
            }

            try {
                // Get completion date and time
                const completedAt = new Date(data.completedAt);
                const completionDate = completedAt.toISOString().split('T')[0];
                const completionHour = completedAt.getHours();
                const now = new Date();
                const currentDate = now.toISOString().split('T')[0];
                const currentHour = now.getHours();

                if (completionDate === currentDate) {
                    // Completed today
                    if (completionHour < 13) {
                        // Green: completed before 1 PM
                        showNotification('✅', 'bg-green-100 border-green-500', `Last completed: ${formatDate(completedAt)} (completed before 1 PM)`);
                    } else {
                        // Yellow: completed after 1 PM
                        showNotification('⚠️', 'bg-yellow-100 border-yellow-500', `Last completed: ${formatDate(completedAt)} (completed after 1 PM deadline)`);
                    }
                } else {
                    // Not completed today
                    if (currentHour < 13) {
                        // Yellow: still time today
                        showNotification('⚠️', 'bg-yellow-100 border-yellow-500', `Last completed: ${formatDate(completedAt)} - Complete today by 1 PM PST`);
                    } else {
                        // Red: overdue
                        showNotification('❌', 'bg-red-100 border-red-500', `Last completed: ${formatDate(completedAt)} - Overdue: Complete daily maintenance checklist`);
                    }
                }
            } catch (e) {
                console.error('Error parsing maintenance data:', e);
            }
        }).catch(() => {
            // Fallback to old localStorage if new DB fails
            const maintenanceData = localStorage.getItem('machineMaintenanceChecklist');
            if (!maintenanceData) {
                // No data, show yellow/red based on time
                const now = new Date();
                const currentHour = now.getHours();
                if (currentHour < 13) {
                    // Yellow: before 1 PM
                    showNotification('⚠️', 'bg-yellow-100 border-yellow-500', 'Complete daily maintenance checklist by 1 PM PST');
                } else {
                    // Red: after 1 PM
                    showNotification('❌', 'bg-red-100 border-red-500', 'Overdue: Complete daily maintenance checklist');
                }
                return;
            }

            try {
                const data = JSON.parse(maintenanceData);
                if (!data.completedAt) {
                    // Data but not completed, same as no data
                    const now = new Date();
                    const currentHour = now.getHours();
                    if (currentHour < 13) {
                        showNotification('⚠️', 'bg-yellow-100 border-yellow-500', 'Complete daily maintenance checklist by 1 PM PST');
                    } else {
                        showNotification('❌', 'bg-red-100 border-red-500', 'Overdue: Complete daily maintenance checklist');
                    }
                    return;
                }

                // Get completion date and time
                const completedAt = new Date(data.completedAt);
                const completionDate = completedAt.toISOString().split('T')[0];
                const completionHour = completedAt.getHours();
                const now = new Date();
                const currentDate = now.toISOString().split('T')[0];
                const currentHour = now.getHours();

                if (completionDate === currentDate) {
                    // Completed today
                    if (completionHour < 13) {
                        // Green: completed before 1 PM
                        showNotification('✅', 'bg-green-100 border-green-500', `Last completed: ${formatDate(completedAt)} (completed before 1 PM)`);
                    } else {
                        // Yellow: completed after 1 PM
                        showNotification('⚠️', 'bg-yellow-100 border-yellow-500', `Last completed: ${formatDate(completedAt)} (completed after 1 PM deadline)`);
                    }
                } else {
                    // Not completed today
                    if (currentHour < 13) {
                        // Yellow: still time today
                        showNotification('⚠️', 'bg-yellow-100 border-yellow-500', `Last completed: ${formatDate(completedAt)} - Complete today by 1 PM PST`);
                    } else {
                        // Red: overdue
                        showNotification('❌', 'bg-red-100 border-red-500', `Last completed: ${formatDate(completedAt)} - Overdue: Complete daily maintenance checklist`);
                    }
                }
            } catch (e) {
                console.error('Error parsing maintenance data:', e);
            }
        });
    } else {
        // Fallback to localStorage if database not available
        const maintenanceData = localStorage.getItem('machineMaintenanceChecklist');
        if (!maintenanceData) {
            // No data, show yellow/red based on time
            const now = new Date();
            const currentHour = now.getHours();
            if (currentHour < 13) {
                // Yellow: before 1 PM
                showNotification('⚠️', 'bg-yellow-100 border-yellow-500', 'Complete daily maintenance checklist by 1 PM PST');
            } else {
                // Red: after 1 PM
                showNotification('❌', 'bg-red-100 border-red-500', 'Overdue: Complete daily maintenance checklist');
            }
            return;
        }

        try {
            const data = JSON.parse(maintenanceData);
            if (!data.completedAt) {
                // Data but not completed, same as no data
                const now = new Date();
                const currentHour = now.getHours();
                if (currentHour < 13) {
                    showNotification('⚠️', 'bg-yellow-100 border-yellow-500', 'Complete daily maintenance checklist by 1 PM PST');
                } else {
                    showNotification('❌', 'bg-red-100 border-red-500', 'Overdue: Complete daily maintenance checklist');
                }
                return;
            }

            // Get completion date and time
            const completedAt = new Date(data.completedAt);
            const completionDate = completedAt.toISOString().split('T')[0];
            const completionHour = completedAt.getHours();
            const now = new Date();
            const currentDate = now.toISOString().split('T')[0];
            const currentHour = now.getHours();

            if (completionDate === currentDate) {
                // Completed today
                if (completionHour < 13) {
                    // Green: completed before 1 PM
                    showNotification('✅', 'bg-green-100 border-green-500', `Last completed: ${formatDate(completedAt)} (completed before 1 PM)`);
                } else {
                    // Yellow: completed after 1 PM
                    showNotification('⚠️', 'bg-yellow-100 border-yellow-500', `Last completed: ${formatDate(completedAt)} (completed after 1 PM deadline)`);
                }
            } else {
                // Not completed today
                if (currentHour < 13) {
                    // Yellow: still time today
                    showNotification('⚠️', 'bg-yellow-100 border-yellow-500', `Last completed: ${formatDate(completedAt)} - Complete today by 1 PM PST`);
                } else {
                    // Red: overdue
                    showNotification('❌', 'bg-red-100 border-red-500', `Last completed: ${formatDate(completedAt)} - Overdue: Complete daily maintenance checklist`);
                }
            }
        } catch (e) {
            console.error('Error parsing maintenance data:', e);
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
});

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.2',
        menuItems: [
            { text: '💡 Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '🔒 Privacy Policy', href: '../privacy/privacy.html', class: 'bg-purple-500 hover:bg-purple-600' },
            { text: '💾 Backup Guide', href: '../backup/backup.html', class: 'bg-green-500 hover:bg-green-600' },
            { text: '🛠️ Maintenance', href: '../maintenance/maintenance.html', class: 'bg-purple-600 hover:bg-purple-700' },
            { text: '📋 Changelog', href: '../changelog/changelog.html', class: 'bg-amber-500 hover:bg-amber-600' }
        ],
        version: 'v0.8.0.2',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'EECOL Wire Tools'
    });
}

// IndexedDB and P2P Sync initialization
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize IndexedDB (new system)
        if (typeof EECOLIndexedDB !== 'undefined' && EECOLIndexedDB.isIndexedDBSupported()) {
            // Make DB available globally for other scripts
            window.eecolDB = new EECOLIndexedDB();
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