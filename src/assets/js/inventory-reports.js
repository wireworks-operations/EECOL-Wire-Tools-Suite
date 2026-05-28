/**
 * EECOL Inventory Reports - JavaScript Module
 * Advanced analytics and reporting for inventory management
 */

// Global variables
let inventoryItems = [];
let cachedReportMetrics = null;
let cachedTrendsData = null;
let chartType = 'line';
let reportPeriod = 'weekly';
let chartInstances = {};

/**
 * BOLT OPTIMIZATION: High-performance date formatters
 * Pre-initializing Intl.DateTimeFormat instances at module scope is significantly faster
 * than calling toLocaleDateString() inside loops, as it avoids repeated parsing of
 * locale strings and options.
 */
const shortDateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
});

const monthYearFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric'
});

const standardDateFormat = new Intl.DateTimeFormat('en-US');

// Chart.js initialization with CDN fallback
function loadChartJS() {
    return new Promise((resolve, reject) => {
        // Try local Chart.js first (offline support)
        const localScript = document.createElement('script');
        localScript.src = '../../utils/chart.js';
        localScript.onload = () => {
            console.log('Chart.js loaded from local file');
            resolve('local');
        };
        localScript.onerror = () => {
            console.warn('Local Chart.js failed, trying CDN...');
            // Fallback to CDN (Pinned to 4.4.1 for SRI)
            const cdnScript = document.createElement('script');
            cdnScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1';
            cdnScript.integrity = 'sha384-9nhczxUqK87bcKHh20fSQcTGD4qq5GhayNYSYWqwBkINBhOfQLg/P5HG5lF1urn4';
            cdnScript.crossOrigin = 'anonymous';
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
            window.eecolDB = EECOLIndexedDB.getInstance();
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
        cachedReportMetrics = null;
        cachedTrendsData = null;
        if (window.eecolDB && await window.eecolDB.isReady()) {
            console.log('🔍 Loading inventory data from IndexedDB...');
            const records = await window.eecolDB.getAll('inventoryRecords');

            if (records && records.length > 0) {
                console.log(`📊 Found ${records.length} records in IndexedDB`);

                /**
                 * BOLT OPTIMIZATION: Numeric timestamp normalization
                 * Ensures all timestamps are numbers once during loading to avoid
                 * repeated parsing overhead in processing loops.
                 */
                inventoryItems = records.map(item => {
                    if (item.timestamp && typeof item.timestamp === 'string') {
                        item.timestamp = new Date(item.timestamp).getTime() || Date.now();
                    } else if (!item.timestamp) {
                        item.timestamp = Date.now();
                    }
                    return item;
                }).sort((a, b) => b.timestamp - a.timestamp);

                // Update dashboard and charts
                updateDashboard();
                updateCharts();

                console.log('✅ Inventory data loaded successfully from IndexedDB');
            } else {
                console.log('📭 No inventory data found in IndexedDB');
                inventoryItems = [];
                updateDashboard();
                updateCharts();
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
            const records = JSON.parse(stored);

            /**
             * BOLT OPTIMIZATION: Numeric timestamp normalization
             */
            inventoryItems = records.map(item => {
                if (item.timestamp && typeof item.timestamp === 'string') {
                    item.timestamp = new Date(item.timestamp).getTime() || Date.now();
                } else if (!item.timestamp) {
                    item.timestamp = Date.now();
                }
                return item;
            }).sort((a, b) => b.timestamp - a.timestamp);

            console.log(`📊 Loaded ${inventoryItems.length} records from localStorage`);

            updateDashboard();
            updateCharts();
        } else {
            console.log('📭 No data in localStorage either');
            inventoryItems = [];
            updateDashboard();
            updateCharts();
        }
    } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
        inventoryItems = [];
        updateDashboard();
        updateCharts();
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

/**
 * BOLT OPTIMIZATION: Optimized sorting
 * Uses direct numeric comparison since periodStart is now normalized to a timestamp
 * in the optimized metrics pass.
 */
function getSortedPeriodKeys(groups) {
    return Object.keys(groups).sort((a, b) => {
        return groups[a].periodStart - groups[b].periodStart;
    });
}

// Dashboard statistics update
function updateDashboard() {
    console.log('📊 Updating inventory dashboard statistics...');

    const totalItems = inventoryItems.length;

    // BOLT OPTIMIZATION: Memoized metrics
    if (cachedReportMetrics) {
        applyMetricsToDashboard(cachedReportMetrics);
        return;
    }

    /**
     * BOLT OPTIMIZATION: Single-pass metrics calculation
     * Consolidates approximately 7 separate O(N) passes (filters and reduces) into a single loop
     * to avoid redundant passes over the large inventoryItems dataset.
     */
    let approvedItems = 0;
    let totalProcessed = 0;
    let totalValue = 0;
    let damagedItems = 0;
    let tailendItems = 0;

    /**
     * BOLT OPTIMIZATION: Numeric timestamp comparison
     * Pre-calculating boundaries as numbers avoids creating thousands of
     * temporary Date objects inside the loop.
     */
    const nowMs = Date.now();
    const oneWeekAgoMs = nowMs - (7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgoMs = nowMs - (14 * 24 * 60 * 60 * 1000);

    let currentWeekCount = 0;
    let previousWeekCount = 0;

    for (const item of inventoryItems) {
        // Approval stats
        if (item.approved === true) {
            approvedItems++;
            totalProcessed++;
        } else if (item.approved === false) {
            totalProcessed++;
        }

        // Value
        totalValue += (item.totalValue || 0);

        // Quality reasons
        const reason = (item.reason || '').toLowerCase();
        if (reason.includes('damaged')) {
            damagedItems++;
        }
        if (reason.includes('tail end') || reason.includes('tailend')) {
            tailendItems++;
        }

        // Weekly change tracking (optimized numeric comparison)
        const ts = item.timestamp;
        if (ts >= oneWeekAgoMs) {
            currentWeekCount++;
        } else if (ts >= twoWeeksAgoMs) {
            previousWeekCount++;
        }
    }

    const approvedRate = totalProcessed > 0 ? Math.round((approvedItems / totalProcessed) * 100) : 0;
    const avgValue = totalItems > 0 ? (totalValue / totalItems) : 0;
    const damagedPercent = totalItems > 0 ? ((damagedItems / totalItems) * 100).toFixed(1) : 0;
    const tailendPercent = totalItems > 0 ? ((tailendItems / totalItems) * 100).toFixed(1) : 0;
    const itemsChange = calculateChange(currentWeekCount, previousWeekCount);

    cachedReportMetrics = {
        totalItems,
        approvedItems,
        totalProcessed,
        totalValue,
        damagedItems,
        tailendItems,
        approvedRate,
        avgValue,
        damagedPercent,
        tailendPercent,
        itemsChange
    };

    applyMetricsToDashboard(cachedReportMetrics);
}

function applyMetricsToDashboard(m) {
    // Update DOM elements
    document.getElementById('totalItemsStat').textContent = m.totalItems;
    document.getElementById('approvedRateStat').textContent = m.approvedRate + '%';
    document.getElementById('damagedItemsStat').textContent = m.damagedItems;
    document.getElementById('tailendsStat').textContent = m.tailendItems;
    document.getElementById('totalValueStat').textContent = '$' + m.totalValue.toFixed(2);
    document.getElementById('avgValueStat').textContent = '$' + m.avgValue.toFixed(2) + ' avg';
    document.getElementById('damagedItemsPercent').textContent = m.damagedPercent + '% of total';
    document.getElementById('tailendsPercent').textContent = m.tailendPercent + '% of total';
    document.getElementById('totalItemsChange').textContent = m.itemsChange + ' this week';
    document.getElementById('approvedRateChange').textContent = m.totalProcessed > 0 ? '+0% vs last week' : 'No processed';

    console.log('✅ Dashboard statistics updated');
}

// Chart update functions
function updateCharts() {
    try {
        console.log('📊 Updating inventory charts...');

        const period = document.getElementById('reportPeriod').value;
        const startDateVal = document.getElementById('startDate').value;
        const endDateVal = document.getElementById('endDate').value;

        // BOLT OPTIMIZATION: Memoized trends and metrics for charts
        if (cachedTrendsData && cachedTrendsData.period === period && cachedTrendsData.startDate === startDateVal && cachedTrendsData.endDate === endDateVal) {
            destroyExistingCharts();
            createInventoryTrendsChart(cachedTrendsData.metrics.trends);
            createValueDistributionChart(cachedTrendsData.metrics.valueDistribution);
            createProductDistributionChart(cachedTrendsData.metrics.productCounts);
            createDamageAnalysisChart(cachedTrendsData.metrics.damageAnalysis);
            updateReportsTable(cachedTrendsData.metrics);
            return;
        }

        destroyExistingCharts();
        const startDate = startDateVal ? new Date(startDateVal).getTime() : null;
        const endDate = endDateVal ? new Date(endDateVal).getTime() + 86399999 : null;

        /**
         * BOLT OPTIMIZATION: Single-pass metrics calculation for charts and reports
         * Consolidates approximately 10+ separate O(N) passes (filters, reduces, and groupings)
         * into a single loop to avoid redundant passes over the inventoryItems dataset.
         */
        /**
         * BOLT OPTIMIZATION: Period key memoization
         * Using a Map to cache period keys (week/month strings) for unique days
         * avoids repeated Date allocations and complex string formatting.
         */
        const periodKeyCache = new Map();

        const metrics = {
            trends: {},
            approval: { approved: 0, rejected: 0, pending: 0 },
            productCounts: {},
            damage: { normal: 0, damaged: 0, tailends: 0 },
            // Collect period metrics for ALL available data for Detailed Reports comparison
            allPeriodMetrics: {}
        };

        for (const item of inventoryItems) {
            const ts = item.timestamp;
            if (!ts) continue;

            // Approval status
            if (item.approved === true) metrics.approval.approved++;
            else if (item.approved === false) metrics.approval.rejected++;
            else metrics.approval.pending++;

            // Product code
            const code = item.productCode || 'Unknown';
            metrics.productCounts[code] = (metrics.productCounts[code] || 0) + 1;

            // Damage status
            const reason = (item.reason || '').toLowerCase();
            if (reason.includes('damaged')) {
                metrics.damage.damaged++;
            } else if (reason.includes('tail end') || reason.includes('tailend')) {
                metrics.damage.tailends++;
            } else {
                metrics.damage.normal++;
            }

            /**
             * BOLT FIX: Correct day-level cache key for local timezone
             * Using the date string from the record's local time as a cache key
             * ensures correct grouping across timezones while still avoiding
             * redundant getPeriodKey() calculations.
             */
            const tempDate = new Date(ts);
            const dateStrKey = tempDate.toDateString();
            let periodKey = periodKeyCache.get(dateStrKey);

            if (!periodKey) {
                periodKey = getPeriodKey(tempDate, reportPeriod);
                periodKeyCache.set(dateStrKey, periodKey);
            }

            // 1. Aggregated metrics for ALL data (for Detailed Reports comparison)
            if (!metrics.allPeriodMetrics[periodKey]) {
                metrics.allPeriodMetrics[periodKey] = {
                    items: 0, approved: 0, value: 0,
                    periodStart: ts
                };
            }
            const pMetric = metrics.allPeriodMetrics[periodKey];
            pMetric.items++;
            if (item.approved === true) pMetric.approved++;
            pMetric.value += (item.totalValue || 0);
            if (ts < pMetric.periodStart) pMetric.periodStart = ts;

            // 2. Filtered metrics for charts (only within selected date range)
            if ((!startDate || ts >= startDate) && (!endDate || ts <= endDate)) {
                if (!metrics.trends[periodKey]) {
                    metrics.trends[periodKey] = { itemsCount: 0, totalValue: 0, periodStart: ts };
                }
                metrics.trends[periodKey].itemsCount++;
                metrics.trends[periodKey].totalValue += (item.totalValue || 0);

                if (ts < metrics.trends[periodKey].periodStart) {
                    metrics.trends[periodKey].periodStart = ts;
                }
            }
        }

        chartInstances.usageTrendsChart = createUsageTrendsChart(metrics.trends);
        chartInstances.approvalStatusChart = createApprovalStatusChart(metrics.approval);
        chartInstances.productCodeChart = createProductCodeChart(metrics.productCounts);
        chartInstances.damageChart = createDamageChart(metrics.damage);

        // Update detailed reports table with pre-calculated metrics
        updateReportsTable(metrics);

        // BOLT: Cache calculation results
        cachedTrendsData = {
            period: period,
            startDate: startDateVal,
            endDate: endDateVal,
            metrics: metrics
        };

        console.log('✅ Charts and Reports updated successfully');
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
function createUsageTrendsChart(trendsData) {
    const ctx = document.getElementById('usageTrendsChart').getContext('2d');

    const sortedKeys = getSortedPeriodKeys(trendsData);

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
        const periodData = trendsData[periodKey];

        const periodDate = new Date(periodData.periodStart);
        let label;
        if (reportPeriod === 'weekly') {
            label = 'Week of ' + shortDateFormat.format(periodDate);
        } else {
            label = monthYearFormat.format(periodDate);
        }

        data.labels.push(label);
        data.datasets[0].data.push(periodData.itemsCount);
        data.datasets[1].data.push(periodData.totalValue);
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

function createApprovalStatusChart(approvalData) {
    const ctx = document.getElementById('approvalStatusChart').getContext('2d');

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Approved', 'Rejected', 'Pending'],
            datasets: [{
                data: [approvalData.approved, approvalData.rejected, approvalData.pending],
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

function createProductCodeChart(productCounts) {
    const ctx = document.getElementById('productCodeChart').getContext('2d');

    const sortedProducts = Object.entries(productCounts)
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

function createDamageChart(damageData) {
    const ctx = document.getElementById('damageChart').getContext('2d');

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Normal Items', 'Damaged Items', 'Tailend Items'],
            datasets: [{
                data: [damageData.normal, damageData.damaged, damageData.tailends],
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
// Reports table update
function updateReportsTable(metrics) {
    const tableBody = document.getElementById('reportsTable');

    /**
     * BOLT OPTIMIZATION: High-performance DOM clearing
     * replaceChildren() is faster than innerHTML = '' as it avoids HTML parsing.
     */
    tableBody.replaceChildren();

    if (inventoryItems.length === 0 || !metrics) {
        const rowMetrics = [
            { name: 'Total Items', current: 0, previous: 0, change: '+0%' },
            { name: 'Approved Items', current: 0, previous: 0, change: '+0%' },
            { name: 'Total Value', current: '$0.00', previous: '$0.00', change: '+0%' },
            { name: 'Average Value', current: '$0.00', previous: '$0.00', change: '+0%' }
        ];

        rowMetrics.forEach(metric => {
            const row = document.createElement('tr');
            row.className = 'border-t';

            const nameTd = document.createElement('td');
            nameTd.className = 'p-2 font-medium text-gray-900';
            nameTd.textContent = metric.name;
            row.appendChild(nameTd);

            const currentTd = document.createElement('td');
            currentTd.className = 'p-2 text-center text-gray-700';
            currentTd.textContent = metric.current;
            row.appendChild(currentTd);

            const previousTd = document.createElement('td');
            previousTd.className = 'p-2 text-center text-gray-700';
            previousTd.textContent = metric.previous;
            row.appendChild(previousTd);

            const changeTd = document.createElement('td');
            changeTd.className = `p-2 text-center ${String(metric.change).startsWith('+') ? 'text-green-600' : 'text-red-600'} font-medium`;
            changeTd.textContent = metric.change;
            row.appendChild(changeTd);

            tableBody.appendChild(row);
        });
        return;
    }

    // BOLT FIX: Restore comparison of two most recent available periods
    const sortedKeys = getSortedPeriodKeys(metrics.allPeriodMetrics);
    const currentPeriodKey = sortedKeys[sortedKeys.length - 1];
    const previousPeriodKey = sortedKeys[sortedKeys.length - 2];

    const currentRecords = currentPeriodKey ? metrics.allPeriodMetrics[currentPeriodKey] : null;
    const previousRecords = previousPeriodKey ? metrics.allPeriodMetrics[previousPeriodKey] : null;

    const currentItems = currentRecords ? currentRecords.items : 0;
    const currentApproved = currentRecords ? currentRecords.approved : 0;
    const currentValue = currentRecords ? currentRecords.value : 0;
    const currentAvgValue = currentItems > 0 ? (currentValue / currentItems) : 0;

    const previousItems = previousRecords ? previousRecords.items : 0;
    const previousApproved = previousRecords ? previousRecords.approved : 0;
    const previousValue = previousRecords ? previousRecords.value : 0;
    const previousAvgValue = previousItems > 0 ? (previousValue / previousItems) : 0;

    const itemsChange = calculateChange(currentItems, previousItems);
    const approvedChange = calculateChange(currentApproved, previousApproved);
    const valueChange = calculateChange(currentValue, previousValue);
    const avgValueChange = calculateChange(currentAvgValue, previousAvgValue);

    const rowMetrics = [
        { name: 'Total Items', current: currentItems, previous: previousItems, change: itemsChange },
        { name: 'Approved Items', current: currentApproved, previous: previousApproved, change: approvedChange },
        { name: 'Total Value', current: '$' + currentValue.toFixed(2), previous: '$' + previousValue.toFixed(2), change: valueChange },
        { name: 'Average Value', current: '$' + currentAvgValue.toFixed(2), previous: '$' + previousAvgValue.toFixed(2), change: avgValueChange }
    ];

    rowMetrics.forEach(metric => {
        const row = document.createElement('tr');
        row.className = 'border-t';

        const nameTd = document.createElement('td');
        nameTd.className = 'p-2 font-medium text-gray-900';
        nameTd.textContent = metric.name;
        row.appendChild(nameTd);

        const currentTd = document.createElement('td');
        currentTd.className = 'p-2 text-center text-gray-700';
        currentTd.textContent = metric.current;
        row.appendChild(currentTd);

        const previousTd = document.createElement('td');
        previousTd.className = 'p-2 text-center text-gray-700';
        previousTd.textContent = metric.previous;
        row.appendChild(previousTd);

        const changeTd = document.createElement('td');
        changeTd.className = `p-2 text-center ${String(metric.change).startsWith('+') ? 'text-green-600' : 'text-red-600'} font-medium`;
        changeTd.textContent = metric.change;
        row.appendChild(changeTd);

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

/**
 * IDB SENTINEL: Secure CSV escaping utility
 * Mitigates CSV Injection (Excel Formula Injection) and ensures proper RFC 4180 escaping.
 * @param {any} value The value to escape for CSV
 * @returns {string} The escaped and sanitized string
 */
function escapeCSVValue(value) {
    if (value === null || value === undefined) return '';
    let stringValue = value.toString();

    // Mitigate CSV Injection by prefixing values starting with =, +, -, or @
    if (['=', '+', '-', '@'].some(char => stringValue.startsWith(char))) {
        stringValue = "'" + stringValue;
    }

    // Standard RFC 4180 double-quote escaping
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

// Export functions
function exportReport() {
    if (inventoryItems.length === 0) {
        window.showAlert('No data to export!', 'No Records');
        return;
    }

    const header = ['Date', 'Product Code', 'Length', 'Unit', 'Quantity', 'Source', 'Reason', 'Assigned To', 'Approved', 'Total Value', 'Comments'];
    const rows = inventoryItems.map(record => [
        standardDateFormat.format(record.timestamp),
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

    const csvContent = [header, ...rows].map(row => row.map(field => escapeCSVValue(field)).join(',')).join('\n');
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
        version: 'v0.8.0.4',
        menuItems: [
            { text: '📦 Inventory Records', href: '../inventory-records/inventory-records.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '📊 Live Statistics', href: '../live-statistics/live-statistics.html', class: 'bg-teal-600 hover:bg-teal-700' }
        ],
        version: 'v0.8.0.4',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Inventory Reports'
    });
}
