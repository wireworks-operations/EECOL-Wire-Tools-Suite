/**
 * EECOL Cutting Reports - JavaScript Module
 * Modern IndexedDB implementation for reporting and analytics
 */

// Global variables
let cutRecords = [];
let currentChartType = 'line';
let currentPeriod = 'weekly';
let chartInstances = {};

// Chart.js initialization with CDN fallback (same as original)
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
    console.log('🔄 Cutting reports page initialization...');

    try {
        // Initialize IndexedDB first
        if (typeof EECOLIndexedDB !== 'undefined' && EECOLIndexedDB.isIndexedDBSupported()) {
            console.log('📦 Initializing IndexedDB for cutting reports...');
            window.eecolDB = new EECOLIndexedDB();
            await window.eecolDB.ready;
            console.log('✅ IndexedDB initialized successfully for cutting reports');

            // Run migration from localStorage if needed
            const hasExistingData = localStorage.getItem('cutRecords') ||
                                   localStorage.getItem('inventoryItems') ||
                                   localStorage.getItem('machineMaintenanceChecklist');

            if (hasExistingData) {
                console.log('🔄 Existing localStorage data detected. Starting migration...');
                const migratedItems = await window.eecolDB.migrateFromLocalStorage();
                console.log(`✅ Migration completed: ${migratedItems} items migrated for cutting reports`);
            }
        } else {
            console.warn('⚠️ IndexedDB is not supported. Falling back to localStorage for cutting reports.');
        }

        // Initialize P2P Sync
        if (typeof P2PSync !== 'undefined') {
            window.p2pSync = new P2PSync();
            console.log('🔄 P2P Sync initialized successfully for cutting reports');
        } else {
            console.warn('⚠️ P2P Sync not available. Some features may be limited for cutting reports.');
        }

        // Now initialize charts and data loading
        console.log('📊 Initializing charts and data loading...');

        // Wait for Chart.js to load
        await loadChartJS();
        console.log('✅ Chart.js loaded successfully, initializing cutting reports...');

        // Set default date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];

        // Initialize data loading
        await loadCuttingData();
        initAutoRefresh();

        // Set up chart controls
        setupChartControls();

        // Set up export functions
        setupExportFunctions();

        console.log('🎉 Cutting reports page initialization complete');

    } catch (error) {
        console.error('❌ Failed to initialize cutting reports:', error);
        // Fallback: try to load without charts or database
        console.log('🔄 Running fallback initialization...');

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];

        await loadCuttingData();
        initAutoRefresh();
        setupExportFunctions();

        console.warn('⚠️ Charts will not be available - check internet connection or database issues');
    }
});

// Set up chart controls event listeners
function setupChartControls() {
    document.getElementById('chartType').addEventListener('change', (e) => {
        currentChartType = e.target.value;
        updateCharts();
    });

    document.getElementById('reportPeriod').addEventListener('change', (e) => {
        currentPeriod = e.target.value;
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
async function loadCuttingData() {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            console.log('🔍 Loading cutting data from IndexedDB...');
            const records = await window.eecolDB.getAll('cuttingRecords');

            if (records && records.length > 0) {
                console.log(`📊 Found ${records.length} records in IndexedDB`);
                cutRecords = records.sort((a, b) => b.timestamp - a.timestamp);

                // Update dashboard and charts
                updateDashboard();
                updateCharts();
                updateReportsTable();

                console.log('✅ Cutting data loaded successfully from IndexedDB');
            } else {
                console.log('📭 No cutting data found in IndexedDB');
                cutRecords = [];
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
        console.error('❌ Error loading cutting data from IndexedDB:', error);
        // Try localStorage as fallback
        loadFromLocalStorage();
    }
}

// Fallback localStorage loading (only for compatibility if IndexedDB fails)
function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem('cutRecords');
        console.log('🔍 Loading from localStorage (fallback)...');

        if (stored) {
            cutRecords = JSON.parse(stored);
            cutRecords.sort((a, b) => b.timestamp - a.timestamp);
            console.log(`📊 Loaded ${cutRecords.length} records from localStorage`);

            updateDashboard();
            updateCharts();
            updateReportsTable();
        } else {
            console.log('📭 No data in localStorage either');
            cutRecords = [];
            updateDashboard();
            updateCharts();
            updateReportsTable();
        }
    } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
        cutRecords = [];
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
            loadCuttingData();
        }
    });

    // Also check periodically for changes (in case storage events don't fire)
    setInterval(function() {
        try {
            // Light refresh - compare record counts
            if (window.eecolDB && window.eecolDB.isReady()) {
                window.eecolDB.count('cuttingRecords').then(currentCount => {
                    if (currentCount !== cutRecords.length) {
                        console.log('🔄 Record count changed - refreshing...');
                        loadCuttingData();
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

    loadCuttingData();

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
    console.log('📊 Updating dashboard statistics...');

    const totalCuts = cutRecords.length;
    const totalLength = cutRecords.reduce((sum, record) => sum + (record.cutLength || 0), 0);
    const avgCutLength = totalCuts > 0 ? (totalLength / totalCuts).toFixed(2) : 0;

    // Calculate statistics
    const fullPicks = cutRecords.filter(record => record.isFullPick === true).length;
    const fullPicksPercent = totalCuts > 0 ? ((fullPicks / totalCuts) * 100).toFixed(1) : 0;

    // Top cutter calculation
    const cutterCounts = {};
    cutRecords.forEach(record => {
        if (record.cutterName) {
            cutterCounts[record.cutterName] = (cutterCounts[record.cutterName] || 0) + 1;
        }
    });
    let topCutter = '-';
    let topCutterCuts = 0;
    for (const [cutter, count] of Object.entries(cutterCounts)) {
        if (count > topCutterCuts) {
            topCutterCuts = count;
            topCutter = cutter;
        }
    }

    // Top customer calculation
    const customerCounts = {};
    cutRecords.forEach(record => {
        if (record.customerName) {
            customerCounts[record.customerName] = (customerCounts[record.customerName] || 0) + 1;
        }
    });
    let topCustomer = '-';
    let topCustomerCuts = 0;
    for (const [customer, count] of Object.entries(customerCounts)) {
        if (count > topCustomerCuts) {
            topCustomerCuts = count;
            topCustomer = customer;
        }
    }

    // Most cut wire type
    const wireTypeCounts = {};
    cutRecords.forEach(record => {
        const wireType = record.wireId || 'Unknown';
        wireTypeCounts[wireType] = (wireTypeCounts[wireType] || 0) + 1;
    });
    let mostCutWire = '-';
    let mostCutWireCount = 0;
    for (const [wireType, count] of Object.entries(wireTypeCounts)) {
        if (count > mostCutWireCount) {
            mostCutWireCount = count;
            mostCutWire = wireType;
        }
    }

    // Longest cut
    let longestCut = 0;
    let longestCutOrder = '-';
    cutRecords.forEach(record => {
        const cutLength = parseFloat(record.cutLength) || 0;
        if (cutLength > longestCut) {
            longestCut = cutLength;
            longestCutOrder = record.orderNumber || 'N/A';
        }
    });

    // System cuts
    const systemCuts = cutRecords.filter(record => record.isSystemCut === true).length;
    const systemCutsPercent = totalCuts > 0 ? ((systemCuts / totalCuts) * 100).toFixed(1) : 0;

    // No mark cuts
    const noMarkCuts = cutRecords.filter(record => {
        const startingMark = record.startingMark;
        const endingMark = record.endingMark;
        return startingMark === null || startingMark === undefined || startingMark === '' ||
               endingMark === null || endingMark === undefined || endingMark === '';
    }).length;
    const noMarkCutsPercent = totalCuts > 0 ? ((noMarkCuts / totalCuts) * 100).toFixed(1) : 0;

    // Weekly change calculation
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const currentWeekRecords = cutRecords.filter(record => {
        const recordDate = parseDate(record.timestamp);
        return recordDate && recordDate >= oneWeekAgo;
    });
    const previousWeekRecords = cutRecords.filter(record => {
        const recordDate = parseDate(record.timestamp);
        return recordDate && recordDate >= new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) && recordDate < oneWeekAgo;
    });
    const cutsChange = calculateChange(currentWeekRecords.length, previousWeekRecords.length);

    // Update DOM elements
    document.getElementById('totalCutsStat').textContent = totalCuts;
    document.getElementById('totalLengthStat').textContent = totalLength.toFixed(2) + 'm';
    document.getElementById('avgCutLength').textContent = avgCutLength + 'm avg';
    document.getElementById('fullPicksStat').textContent = fullPicks;
    document.getElementById('fullPicksPercent').textContent = fullPicksPercent + '% of total';
    document.getElementById('topCutterStat').textContent = topCutter;
    document.getElementById('topCutterCuts').textContent = topCutterCuts + ' cuts';
    document.getElementById('topCustomerStat').textContent = topCustomer;
    document.getElementById('topCustomerCuts').textContent = topCustomerCuts + ' cuts';
    document.getElementById('mostCutWireStat').textContent = mostCutWire;
    document.getElementById('mostCutWireCount').textContent = mostCutWireCount + ' cuts';
    document.getElementById('longestCutStat').textContent = longestCut.toFixed(2) + 'm';
    document.getElementById('longestCutOrder').textContent = 'Order ' + longestCutOrder;
    document.getElementById('systemCutsStat').textContent = systemCuts;
    document.getElementById('systemCutsPercent').textContent = systemCutsPercent + '% of total';
    document.getElementById('noMarkCutsStat').textContent = noMarkCuts;
    document.getElementById('noMarkCutsPercent').textContent = noMarkCutsPercent + '% of total';
    document.getElementById('totalCutsChange').textContent = cutsChange + ' this week';

    console.log('✅ Dashboard statistics updated');
}

// Chart update functions
function updateCharts() {
    try {
        console.log('📊 Updating charts...');
        destroyExistingCharts();

        const chartType = document.getElementById('chartType').value;
        const period = document.getElementById('reportPeriod').value;

        // Create charts
        chartInstances.cutTrendsChart = createCutTrendsChart(chartType);
        chartInstances.cutterPerformanceChart = createCutterPerformanceChart(chartType);
        chartInstances.wireTypeChart = createWireTypeChart(chartType);
        chartInstances.customerDistributionChart = createCustomerDistributionChart(chartType);

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
function createCutTrendsChart(chartType) {
    const ctx = document.getElementById('cutTrendsChart').getContext('2d');
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Filter records by date range
    const filteredRecords = cutRecords.filter(record => {
        const recordDate = new Date(record.timestamp);
        return (!startDate || recordDate >= new Date(startDate)) &&
               (!endDate || recordDate <= new Date(endDate));
    });

    const groups = groupRecordsByPeriod(filteredRecords, currentPeriod);
    const sortedKeys = getSortedPeriodKeys(groups);

    const data = {
        labels: [],
        datasets: [{
            label: 'Total Cuts',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: chartType === 'pie' ? true : false
        }, {
            label: 'Total Length Cut (m)',
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
        if (currentPeriod === 'weekly') {
            label = 'Week of ' + periodDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
            label = periodDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        data.labels.push(label);

        const cutsCount = periodRecords.length;
        const totalLength = periodRecords.reduce((sum, record) => sum + (record.cutLength || 0), 0);

        data.datasets[0].data.push(cutsCount);
        data.datasets[1].data.push(totalLength);
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

function createCutterPerformanceChart(chartType) {
    const ctx = document.getElementById('cutterPerformanceChart').getContext('2d');

    const cutterCounts = {};
    cutRecords.forEach(record => {
        if (record.cutterName) {
            cutterCounts[record.cutterName] = (cutterCounts[record.cutterName] || 0) + 1;
        }
    });

    const sortedCutters = Object.entries(cutterCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    const labels = sortedCutters.map(([cutter]) => cutter);
    const data = sortedCutters.map(([,count]) => count);

    return new Chart(ctx, {
        type: chartType === 'pie' ? 'doughnut' : (chartType === 'line' ? 'bar' : chartType),
        data: {
            labels: labels,
            datasets: [{
                label: 'Cuts',
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

function createWireTypeChart(chartType) {
    const ctx = document.getElementById('wireTypeChart').getContext('2d');

    const wireTypeCounts = {};
    cutRecords.forEach(record => {
        const wireType = record.wireId || 'Unknown';
        wireTypeCounts[wireType] = (wireTypeCounts[wireType] || 0) + 1;
    });

    const sortedWireTypes = Object.entries(wireTypeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    const labels = sortedWireTypes.map(([wireType]) => wireType);
    const data = sortedWireTypes.map(([,count]) => count);

    return new Chart(ctx, {
        type: chartType === 'pie' ? 'doughnut' : (chartType === 'line' ? 'bar' : chartType),
        data: {
            labels: labels,
            datasets: [{
                label: 'Cuts',
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

function createCustomerDistributionChart(chartType) {
    const ctx = document.getElementById('customerDistributionChart').getContext('2d');

    const customerCounts = {};
    cutRecords.forEach(record => {
        if (record.customerName) {
            customerCounts[record.customerName] = (customerCounts[record.customerName] || 0) + 1;
        }
    });

    const sortedCustomers = Object.entries(customerCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    const labels = sortedCustomers.map(([customer]) => customer);
    const data = sortedCustomers.map(([,count]) => count);

    return new Chart(ctx, {
        type: chartType === 'pie' ? 'doughnut' : (chartType === 'line' ? 'bar' : chartType),
        data: {
            labels: labels,
            datasets: [{
                label: 'Cuts',
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

// Reports table update
function updateReportsTable() {
    const tableBody = document.getElementById('reportsTable');
    tableBody.innerHTML = '';

    if (cutRecords.length === 0) {
        const metrics = [
            { name: 'Total Cuts', current: 0, previous: 0, change: '+0%' },
            { name: 'Total Length Cut', current: '0m', previous: '0m', change: '+0%' },
            { name: 'Average Cut Length', current: '0m', previous: '0m', change: '+0%' },
            { name: 'Full Picks', current: 0, previous: 0, change: '+0%' },
            { name: 'System Cuts', current: 0, previous: 0, change: '+0%' }
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

    const groups = groupRecordsByPeriod(cutRecords, currentPeriod);
    const sortedKeys = getSortedPeriodKeys(groups);
    const currentPeriodKey = sortedKeys[sortedKeys.length - 1];
    const previousPeriodKey = sortedKeys[sortedKeys.length - 2];

    const currentRecords = currentPeriodKey ? groups[currentPeriodKey].records : [];
    const previousRecords = previousPeriodKey ? groups[previousPeriodKey].records : [];

    const currentCuts = currentRecords.length;
    const currentLength = currentRecords.reduce((sum, record) => sum + (record.cutLength || 0), 0);
    const currentAvgLength = currentCuts > 0 ? (currentLength / currentCuts).toFixed(2) : '0';
    const currentFullPicks = currentRecords.filter(record => record.isFullPick === true).length;
    const currentSystemCuts = currentRecords.filter(record => record.isSystemCut === true).length;

    const previousCuts = previousRecords.length;
    const previousLength = previousRecords.reduce((sum, record) => sum + (record.cutLength || 0), 0);
    const previousAvgLength = previousCuts > 0 ? (previousLength / previousCuts).toFixed(2) : '0';
    const previousFullPicks = previousRecords.filter(record => record.isFullPick === true).length;
    const previousSystemCuts = previousRecords.filter(record => record.isSystemCut === true).length;

    const cutsChange = calculateChange(currentCuts, previousCuts);
    const lengthChange = calculateChange(currentLength, previousLength);
    const avgLengthChange = calculateChange(parseFloat(currentAvgLength), parseFloat(previousAvgLength));
    const fullPicksChange = calculateChange(currentFullPicks, previousFullPicks);
    const systemCutsChange = calculateChange(currentSystemCuts, previousSystemCuts);

    const metrics = [
        { name: 'Total Cuts', current: currentCuts, previous: previousCuts, change: cutsChange },
        { name: 'Total Length Cut', current: currentLength.toFixed(2) + 'm', previous: previousLength.toFixed(2) + 'm', change: lengthChange },
        { name: 'Average Cut Length', current: currentAvgLength + 'm', previous: previousAvgLength + 'm', change: avgLengthChange },
        { name: 'Full Picks', current: currentFullPicks, previous: previousFullPicks, change: fullPicksChange },
        { name: 'System Cuts', current: currentSystemCuts, previous: previousSystemCuts, change: systemCutsChange }
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
    if (cutRecords.length === 0) {
        window.showAlert('No data to export!', 'No Records');
        return;
    }

    const header = ['Date', 'Wire ID', 'Cut Length', 'Unit', 'Starting Mark', 'Ending Mark', 'Line Code', 'Cutter', 'Order Number', 'Customer', 'Type', 'Comments', 'Full Pick', 'System Cut'];
    const rows = cutRecords.map(record => [
        new Date(record.timestamp).toLocaleDateString(),
        record.wireId || '',
        record.cutLength || '',
        record.cutLengthUnit || '',
        record.startingMark || '',
        record.endingMark || '',
        record.lineCode || '',
        record.cutterName || '',
        record.orderNumber || '',
        record.customerName || '',
        record.coilOrReel || '',
        record.orderComments || '',
        record.isFullPick ? 'Yes' : 'No',
        record.isSystemCut ? 'Yes' : 'No'
    ]);

    const csvContent = [header, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cutting_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    window.showAlert('Report exported successfully!', 'Export Complete');
}

function generatePDF() {
    if (cutRecords.length === 0) {
        window.showAlert('No data to generate PDF!', 'No Records');
        return;
    }

    // Use the shared PDF generator utility
    if (window.generateCuttingPDF) {
        window.generateCuttingPDF(cutRecords);
    } else {
        console.error('PDF generator utility not available');
        window.showAlert('PDF generator not available. Please check that all utilities are loaded.', 'PDF Error');
    }
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.manualRefresh = manualRefresh;
}

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.1',
        menuItems: [
            { text: '✂️ Cutting Records', href: '../cutting-records/cutting-records.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '📊 Live Statistics', href: '../live-statistics/live-statistics.html', class: 'bg-teal-600 hover:bg-teal-700' }
        ],
        version: 'v0.8.0.1',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Cutting Reports'
    });
}
