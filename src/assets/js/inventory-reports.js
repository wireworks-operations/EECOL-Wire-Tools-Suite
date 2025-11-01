/**
 * EECOL Inventory Reports - JavaScript Module
 * Advanced analytics and reporting for inventory management
 */

// Global variables
let inventoryItems = [];
let chartType = 'line';
let reportPeriod = 'weekly';
let chartInstances = {};

// Chart.js initialization with CDN fallback
function loadChartJS() {
    return new Promise((resolve, reject) => {
        // Try local Chart.js first (offline support)
        const localScript = document.createElement('script');
        localScript.src = '../assets/charts/chart.js';
        localScript.onload = () => {
            console.log('Chart.js loaded from local file');
            resolve('local');
        };
        localScript.onerror = () => {
            console.warn('Local Chart.js failed, trying CDN...');
            // Fallback to CDN
            const cdnScript = document.createElement('script');
            cdnScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            cdnScript.onload = () => {
                console.log('Chart.js loaded from CDN');
                resolve('cdn');
            };
            cdnScript.onerror = () => {
                console.error('Failed to load Chart.js from both local and CDN');
                const errorDiv = document.getElementById('chartError');
                if (errorDiv) {
                    errorDiv.classList.remove('hidden');
                }
                reject('No chart library available');
            };
            document.head.appendChild(cdnScript);
        };
        document.head.appendChild(localScript);
    });
}

// Initialize all components
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Inventory reports page initialization...');

    try {
        // Initialize IndexedDB first
        if (typeof EECOLIndexedDB !== 'undefined' && EECOLIndexedDB.isIndexedDBSupported()) {
            console.log('📦 Initializing IndexedDB for inventory reports...');
            window.eecolDB = new EECOLIndexedDB();
            await window.eecolDB.ready;
            console.log('✅ IndexedDB initialized successfully for inventory reports');

            // Run migration from localStorage if needed
            const hasExistingData = localStorage.getItem('cutRecords') ||
                                   localStorage.getItem('inventoryItems') ||
                                   localStorage.getItem('machineMaintenanceChecklist');

            if (hasExistingData) {
                console.log('🔄 Existing localStorage data detected. Starting migration...');
                const migratedItems = await window.eecolDB.migrateFromLocalStorage();
                console.log(`✅ Migration completed: ${migratedItems} items migrated for inventory reports`);
            }
        } else {
            console.warn('⚠️ IndexedDB is not supported. Falling back to localStorage for inventory reports.');
        }

        // Initialize P2P Sync
        if (typeof P2PSync !== 'undefined') {
            window.p2pSync = new P2PSync();
            console.log('🔄 P2P Sync initialized successfully for inventory reports');
        } else {
            console.warn('⚠️ P2P Sync not available. Some features may be limited for inventory reports.');
        }

        // Wait for Chart.js to load
        await loadChartJS();
        console.log('✅ Chart.js loaded successfully, initializing inventory reports...');

        // Set default date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];

        // Initialize data loading
        await loadInventoryData();
        initAutoRefresh();

        // Set up chart controls
        setupChartControls();

        // Set up export functions
        setupExportFunctions();

        console.log('🎉 Inventory reports page initialization complete');

    } catch (error) {
        console.error('❌ Failed to initialize inventory reports:', error);
        // Fallback: try to load without charts or database
        console.log('🔄 Running fallback initialization...');

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];

        await loadInventoryData();
        initAutoRefresh();
        setupExportFunctions();

        console.warn('⚠️ Charts will not be available - check internet connection or database issues');
    }
});

// Set up chart controls event listeners
function setupChartControls() {
    document.getElementById('chartType').addEventListener('change', (e) => {
        chartType = e.target.value;
        updateCharts();
    });

    document.getElementById('reportPeriod').addEventListener('change', (e) => {
        reportPeriod = e.target.value;
        updateCharts();
    });

    document.getElementById('startDate').addEventListener('change', updateCharts);
    document.getElementById('endDate').addEventListener('change', updateCharts);
}

// Set up export functions
function setupExportFunctions() {
    document.getElementById('exportReportBtn').addEventListener('click', exportReport);
    document.getElementById('exportChartsBtn').addEventListener('click', () => {
        window.showAlert('Chart export would be implemented with Chart.js export plugin.\n\nFor now, screenshots can be taken manually.', 'Feature Coming Soon');
    });
    document.getElementById('generatePDFBtn').addEventListener('click', generatePDF);
}

// IndexedDB-based data loading functions
async function loadInventoryData() {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            console.log('🔍 Loading inventory data from IndexedDB...');
            const records = await window.eecolDB.getAll('inventoryRecords');

            if (records && records.length > 0) {
                console.log(`📊 Found ${records.length} records in IndexedDB`);
                inventoryItems = records.sort((a, b) => b.timestamp - a.timestamp);

                // Update dashboard and charts
                updateDashboard();
                updateCharts();
                updateReportsTable();

                console.log('✅ Inventory data loaded successfully from IndexedDB');
            } else {
                console.log('📭 No inventory data found in IndexedDB');
                inventoryItems = [];
                updateDashboard();
                updateCharts();
                updateReportsTable();
            }
        } else {
            console.warn('⚠️ IndexedDB not available, falling back to localStorage for compatibility');
            // Fallback to localStorage if IndexedDB unavailable (shouldn't happen in modern setup)
            loadFromLocalStorage();
        }
    } catch (error) {
        console.error('❌ Error loading inventory data from IndexedDB:', error);
        // Try localStorage as fallback
        loadFromLocalStorage();
    }
}

// Fallback localStorage loading (only for compatibility if IndexedDB fails)
function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem('inventoryItems');
        console.log('🔍 Loading from localStorage (fallback)...');

        if (stored) {
            inventoryItems = JSON.parse(stored);
            inventoryItems.sort((a, b) => b.timestamp - a.timestamp);
            console.log(`📊 Loaded ${inventoryItems.length} records from localStorage`);

            updateDashboard();
            updateCharts();
            updateReportsTable();
        } else {
            console.log('📭 No data in localStorage either');
            inventoryItems = [];
            updateDashboard();
            updateCharts();
            updateReportsTable();
        }
    } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
        inventoryItems = [];
        updateDashboard();
        updateCharts();
        updateReportsTable();
    }
}

// Auto-refresh mechanism using IndexedDB storage events
function initAutoRefresh() {
    console.log('🔄 Initializing auto-refresh system with IndexedDB...');

    // Listen for storage changes (including from other tabs/windows)
    window.addEventListener('storage', function(e) {
        if (e.key === 'eecolDBChange' || e.key === null) { // null key means any storage change
            console.log('📡 Storage event detected - refreshing reports...');
            loadInventoryData();
        }
    });

    // Also check periodically for changes (in case storage events don't fire)
    setInterval(function() {
        try {
            // Light refresh - compare record counts
            if (window.eecolDB && window.eecolDB.isReady()) {
                window.eecolDB.count('inventoryRecords').then(currentCount => {
                    if (currentCount !== inventoryItems.length) {
                        console.log('🔄 Record count changed - refreshing...');
                        loadInventoryData();
                    }
                }).catch(() => {
                    // Ignore errors in periodic check
                });
            }
        } catch (e) {
            // Ignore errors in periodic check
        }
    }, 5000); // Check every 5 seconds
}

// Manual refresh function
function manualRefresh() {
    console.log('🔃 Manual refresh triggered...');
    const refreshBtn = document.getElementById('manualRefreshBtn');
    const originalText = refreshBtn.textContent;

    refreshBtn.textContent = '⟳';
    refreshBtn.disabled = true;

    // Add loading animation
    refreshBtn.style.animation = 'spin 1s linear';

    loadInventoryData();

    // Reset button after delay
    setTimeout(() => {
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
        refreshBtn.style.animation = '';
    }, 500);
}

// Utility functions for date handling
function parseDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

function getWeekNumber(date) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7) + '-' + d.getUTCFullYear();
}

function getMonthKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getPeriodKey(date, period) {
    if (period === 'weekly') {
        return getWeekNumber(date);
    } else {
        return getMonthKey(date);
    }
}

function groupRecordsByPeriod(records, period) {
    const groups = {};
    records.forEach(record => {
        const date = parseDate(record.timestamp);
        if (date) {
            const key = getPeriodKey(date, period);
            if (!groups[key]) {
                groups[key] = { records: [], periodStart: new Date(date) };
            }
            groups[key].records.push(record);
            // Update period start to earliest date
            if (date < groups[key].periodStart) {
                groups[key].periodStart = new Date(date);
            }
        }
    });
    return groups;
}

function getSortedPeriodKeys(groups) {
    return Object.keys(groups).sort((a, b) => {
        const dateA = new Date(groups[a].periodStart);
        const dateB = new Date(groups[b].periodStart);
        return dateA - dateB;
    });
}

// Dashboard statistics update
function updateDashboard() {
    console.log('📊 Updating inventory dashboard statistics...');

    const totalItems = inventoryItems.length;
    const approvedItems = inventoryItems.filter(item => item.approved === true).length;
    const totalProcessed = inventoryItems.filter(item => item.approved !== null && item.approved !== undefined).length;
    const approvedRate = totalProcessed > 0 ? Math.round((approvedItems / totalProcessed) * 100) : 0;

    const totalValue = inventoryItems.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const avgValue = totalItems > 0 ? (totalValue / totalItems) : 0;

    const damagedItems = inventoryItems.filter(item =>
        item.reason && item.reason.toLowerCase().includes('damaged')).length;
    const damagedPercent = totalItems > 0 ? ((damagedItems / totalItems) * 100).toFixed(1) : 0;

    const tailendItems = inventoryItems.filter(item =>
        item.reason && (item.reason.toLowerCase().includes('tail end') || item.reason.toLowerCase().includes('tailend'))).length;
    const tailendPercent = totalItems > 0 ? ((tailendItems / totalItems) * 100).toFixed(1) : 0;

    // Weekly change calculation
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const currentWeekRecords = inventoryItems.filter(record => {
        const recordDate = parseDate(record.timestamp);
        return recordDate && recordDate >= oneWeekAgo;
    });
    const previousWeekRecords = inventoryItems.filter(record => {
        const recordDate = parseDate(record.timestamp);
        return recordDate && recordDate >= new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) && recordDate < oneWeekAgo;
    });
    const itemsChange = calculateChange(currentWeekRecords.length, previousWeekRecords.length);

    // Update DOM elements
    document.getElementById('totalItemsStat').textContent = totalItems;
    document.getElementById('approvedRateStat').textContent = approvedRate + '%';
    document.getElementById('damagedItemsStat').textContent = damagedItems;
    document.getElementById('tailendsStat').textContent = tailendItems;
    document.getElementById('totalValueStat').textContent = '$' + totalValue.toFixed(2);
    document.getElementById('avgValueStat').textContent = '$' + avgValue.toFixed(2) + ' avg';
    document.getElementById('damagedItemsPercent').textContent = damagedPercent + '% of total';
    document.getElementById('tailendsPercent').textContent = tailendPercent + '% of total';
    document.getElementById('totalItemsChange').textContent = itemsChange + ' this week';
    document.getElementById('approvedRateChange').textContent = totalProcessed > 0 ? '+0% vs last week' : 'No processed';

    console.log('✅ Dashboard statistics updated');
}

// Chart update functions
function updateCharts() {
    try {
        console.log('📊 Updating inventory charts...');
        destroyExistingCharts();

        chartInstances.usageTrendsChart = createUsageTrendsChart();
        chartInstances.approvalStatusChart = createApprovalStatusChart();
        chartInstances.productCodeChart = createProductCodeChart();
        chartInstances.damageChart = createDamageChart();

        console.log('✅ Charts updated successfully');
    } catch (error) {
        console.error('❌ Error updating charts:', error);
        const errorDiv = document.getElementById('chartError');
        if (errorDiv) errorDiv.classList.remove('hidden');
    }
}

function destroyExistingCharts() {
    Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    chartInstances = {};
}

// Chart creation functions
function createUsageTrendsChart() {
    const ctx = document.getElementById('usageTrendsChart').getContext('2d');
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Filter records by date range
    const filteredRecords = inventoryItems.filter(record => {
        const recordDate = new Date(record.timestamp);
        return (!startDate || recordDate >= new Date(startDate)) &&
               (!endDate || recordDate <= new Date(endDate));
    });

    const groups = groupRecordsByPeriod(filteredRecords, reportPeriod);
    const sortedKeys = getSortedPeriodKeys(groups);

    const data = {
        labels: [],
        datasets: [{
            label: 'Inventory Items Added',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: chartType === 'pie' ? true : false
        }, {
            label: 'Total Value ($)',
            data: [],
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: chartType === 'pie' ? true : false
        }]
    };

    const periodsToShow = Math.min(8, sortedKeys.length);
    for (let i = periodsToShow - 1; i >= 0; i--) {
        const periodKey = sortedKeys[i];
        const periodRecords = groups[periodKey].records;

        const periodDate = new Date(groups[periodKey].periodStart);
        let label;
        if (reportPeriod === 'weekly') {
            label = 'Week of ' + periodDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
            label = periodDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        data.labels.push(label);

        const itemsCount = periodRecords.length;
        const totalValue = periodRecords.reduce((sum, record) => sum + (record.totalValue || 0), 0);

        data.datasets[0].data.push(itemsCount);
        data.datasets[1].data.push(totalValue);
    }

    if (data.labels.length === 0) {
        data.labels = ['No Data'];
        data.datasets[0].data = [0];
        data.datasets[1].data = [0];
    }

    return new Chart(ctx, {
        type: chartType === 'pie' ? 'doughnut' : chartType,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: false }
            },
            scales: chartType === 'line' || chartType === 'bar' ? {
                y: { beginAtZero: true }
            } : {}
        }
    });
}

function createApprovalStatusChart() {
    const ctx = document.getElementById('approvalStatusChart').getContext('2d');

    const approved = inventoryItems.filter(item => item.approved === true).length;
    const rejected = inventoryItems.filter(item => item.approved === false).length;
    const pending = inventoryItems.filter(item => item.approved === null || item.approved === undefined).length;

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Approved', 'Rejected', 'Pending'],
            datasets: [{
                data: [approved, rejected, pending],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.85)',
                    'rgba(239, 68, 68, 0.85)',
                    'rgba(156, 163, 175, 0.85)'
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(239, 68, 68)',
                    'rgb(156, 163, 175)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function createProductCodeChart() {
    const ctx = document.getElementById('productCodeChart').getContext('2d');

    const productCount = {};
    inventoryItems.forEach(item => {
        const code = item.productCode || 'Unknown';
        productCount[code] = (productCount[code] || 0) + 1;
    });

    const sortedProducts = Object.entries(productCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    const labels = sortedProducts.map(([code]) => code);
    const data = sortedProducts.map(([,count]) => count);

    return new Chart(ctx, {
        type: chartType === 'pie' ? 'doughnut' : (chartType === 'line' ? 'bar' : chartType),
        data: {
            labels: labels,
            datasets: [{
                label: 'Items',
                data: data,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 101, 101, 0.8)',
                    'rgba(251, 191, 36, 0.8)', 'rgba(139, 69, 19, 0.8)', 'rgba(236, 72, 153, 0.8)',
                    'rgba(6, 182, 212, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(249, 115, 22, 0.8)',
                    'rgba(34, 197, 94, 0.8)'
                ],
                borderColor: [
                    'rgb(59, 130, 246)', 'rgb(16, 185, 129)', 'rgb(245, 101, 101)',
                    'rgb(251, 191, 36)', 'rgb(139, 69, 19)', 'rgb(236, 72, 153)',
                    'rgb(6, 182, 212)', 'rgb(168, 85, 247)', 'rgb(249, 115, 22)',
                    'rgb(34, 197, 94)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: chartType === 'line' || chartType === 'bar' ? { y: { beginAtZero: true } } : {}
        }
    });
}

function createDamageChart() {
    const ctx = document.getElementById('damageChart').getContext('2d');

    const normal = inventoryItems.filter(item =>
        !item.reason || (!item.reason.toLowerCase().includes('damaged') &&
        !item.reason.toLowerCase().includes('tail end') &&
        !item.reason.toLowerCase().includes('tailend'))).length;
    const damaged = inventoryItems.filter(item =>
        item.reason && item.reason.toLowerCase().includes('damaged')).length;
    const tailends = inventoryItems.filter(item =>
        item.reason && (item.reason.toLowerCase().includes('tail end') || item.reason.toLowerCase().includes('tailend'))).length;

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Normal Items', 'Damaged Items', 'Tailend Items'],
            datasets: [{
                data: [normal, damaged, tailends],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.85)',
                    'rgba(239, 68, 68, 0.85)',
                    'rgba(251, 191, 36, 0.85)'
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(239, 68, 68)',
                    'rgb(251, 191, 36)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// Reports table update
function updateReportsTable() {
    const tableBody = document.getElementById('reportsTable');
    tableBody.innerHTML = '';

    if (inventoryItems.length === 0) {
        const metrics = [
            { name: 'Total Items', current: 0, previous: 0, change: '+0%' },
            { name: 'Approved Items', current: 0, previous: 0, change: '+0%' },
            { name: 'Total Value', current: '$0.00', previous: '$0.00', change: '+0%' },
            { name: 'Average Value', current: '$0.00', previous: '$0.00', change: '+0%' }
        ];

        metrics.forEach(metric => {
            const row = document.createElement('tr');
            row.className = 'border-t';
            row.innerHTML = `
                <td class="p-2 font-medium text-gray-900">${metric.name}</td>
                <td class="p-2 text-center text-gray-700">${metric.current}</td>
                <td class="p-2 text-center text-gray-700">${metric.previous}</td>
                <td class="p-2 text-center ${metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'} font-medium">${metric.change}</td>
            `;
            tableBody.appendChild(row);
        });
        return;
    }

    const groups = groupRecordsByPeriod(inventoryItems, reportPeriod);
    const sortedKeys = getSortedPeriodKeys(groups);
    const currentPeriodKey = sortedKeys[sortedKeys.length - 1];
    const previousPeriodKey = sortedKeys[sortedKeys.length - 2];

    const currentRecords = currentPeriodKey ? groups[currentPeriodKey].records : [];
    const previousRecords = previousPeriodKey ? groups[previousPeriodKey].records : [];

    const currentItems = currentRecords.length;
    const currentApproved = currentRecords.filter(item => item.approved === true).length;
    const currentValue = currentRecords.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const currentAvgValue = currentItems > 0 ? (currentValue / currentItems) : 0;

    const previousItems = previousRecords.length;
    const previousApproved = previousRecords.filter(item => item.approved === true).length;
    const previousValue = previousRecords.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const previousAvgValue = previousItems > 0 ? (previousValue / previousItems) : 0;

    const itemsChange = calculateChange(currentItems, previousItems);
    const approvedChange = calculateChange(currentApproved, previousApproved);
    const valueChange = calculateChange(currentValue, previousValue);
    const avgValueChange = calculateChange(currentAvgValue, previousAvgValue);

    const metrics = [
        { name: 'Total Items', current: currentItems, previous: previousItems, change: itemsChange },
        { name: 'Approved Items', current: currentApproved, previous: previousApproved, change: approvedChange },
        { name: 'Total Value', current: '$' + currentValue.toFixed(2), previous: '$' + previousValue.toFixed(2), change: valueChange },
        { name: 'Average Value', current: '$' + currentAvgValue.toFixed(2), previous: '$' + previousAvgValue.toFixed(2), change: avgValueChange }
    ];

    metrics.forEach(metric => {
        const row = document.createElement('tr');
        row.className = 'border-t';
        row.innerHTML = `
            <td class="p-2 font-medium text-gray-900">${metric.name}</td>
            <td class="p-2 text-center text-gray-700">${metric.current}</td>
            <td class="p-2 text-center text-gray-700">${metric.previous}</td>
            <td class="p-2 text-center ${metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'} font-medium">${metric.change}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Utility function for percentage changes
function calculateChange(current, previous) {
    if (previous === 0) {
        return current > 0 ? '+∞%' : '+0%';
    }
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return sign + change.toFixed(1) + '%';
}

// Export functions
function exportReport() {
    if (inventoryItems.length === 0) {
        window.showAlert('No data to export!', 'No Records');
        return;
    }

    const header = ['Date', 'Product Code', 'Length', 'Unit', 'Quantity', 'Source', 'Reason', 'Assigned To', 'Approved', 'Total Value', 'Comments'];
    const rows = inventoryItems.map(record => [
        new Date(record.timestamp).toLocaleDateString(),
        record.productCode || '',
        record.length || '',
        record.lengthUnit || '',
        record.quantity || '',
        record.source || '',
        record.reason || '',
        record.assignedTo || '',
        record.approved ? 'Yes' : 'No',
        record.totalValue ? '$' + record.totalValue.toFixed(2) : '',
        record.comments || ''
    ]);

    const csvContent = [header, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    window.showAlert('Report exported successfully!', 'Export Complete');
}

function generatePDF() {
    if (inventoryItems.length === 0) {
        window.showAlert('No data to generate PDF!', 'No Records');
        return;
    }

    // Use the shared PDF generator utility
    if (window.generateInventoryPDF) {
        window.generateInventoryPDF(inventoryItems);
    } else {
        console.error('PDF generator utility not available');
        window.showAlert('PDF generator not available. Please check that all utilities are loaded.', 'PDF Error');
    }
}

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.1',
        menuItems: [
            { text: '📦 Inventory Records', href: '../inventory-records/inventory-records.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '📊 Live Statistics', href: '../live-statistics/live-statistics.html', class: 'bg-teal-600 hover:bg-teal-700' }
        ],
        version: 'v0.8.0.1',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Inventory Reports'
    });
}
