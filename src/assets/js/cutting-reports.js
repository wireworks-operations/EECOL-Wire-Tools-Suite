/**
 * EECOL Cutting Reports - JavaScript Module
 * Modern IndexedDB implementation for reporting and analytics
 */

/ Global variables
let cutRecords = [];
let currentChartType = 'line';
let currentPeriod = 'weekly';
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

/ Chart.js initialization with CDN fallback (same as original)
function loadChartJS() {
    return new Promise((resolve, reject) => {
        / Try local Chart.js first (offline support)
        const localScript = document.createElement('script');
        localScript.src = '/src/pages/utils/chart.js';
        localScript.onload = () => {
            console.log('Chart.js loaded from local file');
            resolve('local');
        };
        localScript.onerror = () => {
            console.warn('Local Chart.js failed, trying CDN...');
            / Fallback to CDN (Pinned to 4.4.1 for SRI)
            const cdnScript = document.createElement('script');
            cdnScript.src = 'https:/cdn.jsdelivr.net/npm/chart.js@4.4.1';
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

/ Initialize all components
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Cutting reports page initialization...');

    try {
        / Initialize IndexedDB first
        if (typeof EECOLIndexedDB !== 'undefined' && EECOLIndexedDB.isIndexedDBSupported()) {
            console.log('📦 Initializing IndexedDB for cutting reports...');
            window.eecolDB = EECOLIndexedDB.getInstance();
            await window.eecolDB.ready;
            console.log('✅ IndexedDB initialized successfully for cutting reports');

            / Run migration from localStorage if needed
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


        / Now initialize charts and data loading
        console.log('📊 Initializing charts and data loading...');

        / Wait for Chart.js to load
        await loadChartJS();
        console.log('✅ Chart.js loaded successfully, initializing cutting reports...');

        / Set default date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];

        / Initialize data loading
        await loadCuttingData();
        initAutoRefresh();

        / Set up chart controls
        setupChartControls();

        / Set up export functions
        setupExportFunctions();

        console.log('🎉 Cutting reports page initialization complete');

    } catch (error) {
        console.error('❌ Failed to initialize cutting reports:', error);
        / Fallback: try to load without charts or database
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

/ Set up chart controls event listeners
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

/ Set up export functions
function setupExportFunctions() {
    document.getElementById('exportReportBtn').addEventListener('click', exportReport);
    document.getElementById('exportChartsBtn').addEventListener('click', () => {
        window.showAlert('Chart export would be implemented with Chart.js export plugin.\n\nFor now, screenshots can be taken manually.', 'Feature Coming Soon');
    });
    document.getElementById('generatePDFBtn').addEventListener('click', generatePDF);
}

/ IndexedDB-based data loading functions
async function loadCuttingData() {
    try {
        cachedReportMetrics = null;
        cachedTrendsData = null;
        if (window.eecolDB && await window.eecolDB.isReady()) {
            console.log('🔍 Loading cutting data from IndexedDB...');
            const records = await window.eecolDB.getAll('cuttingRecords');

            if (records && records.length > 0) {
                console.log(`📊 Found ${records.length} records in IndexedDB`);

                /**
                 * BOLT OPTIMIZATION: Numeric timestamp normalization
                 * Ensures all timestamps are numbers once during loading to avoid
                 * repeated parsing overhead in processing loops.
                 */
                cutRecords = records.map(r => {
                    if (r.timestamp && typeof r.timestamp === 'string') {
                        r.timestamp = new Date(r.timestamp).getTime() || Date.now();
                    }
                    return r;
                }).sort((a, b) => b.timestamp - a.timestamp);

                / Update dashboard and charts
                updateDashboard();
                updateCharts();

                console.log('✅ Cutting data loaded successfully from IndexedDB');
            } else {
                console.log('📭 No cutting data found in IndexedDB');
                cutRecords = [];
                updateDashboard();
                updateCharts();
            }
        } else {
            console.warn('⚠️ IndexedDB not available, falling back to localStorage for compatibility');
            / Fallback to localStorage if IndexedDB unavailable (shouldn't happen in modern setup)
            loadFromLocalStorage();
        }
    } catch (error) {
        console.error('❌ Error loading cutting data from IndexedDB:', error);
        / Try localStorage as fallback
        loadFromLocalStorage();
    }
}

/ Fallback localStorage loading (only for compatibility if IndexedDB fails)
function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem('cutRecords');
        console.log('🔍 Loading from localStorage (fallback)...');

        if (stored) {
            const records = JSON.parse(stored);

            /**
             * BOLT OPTIMIZATION: Numeric timestamp normalization
             */
            cutRecords = records.map(r => {
                if (r.timestamp && typeof r.timestamp === 'string') {
                    r.timestamp = new Date(r.timestamp).getTime() || Date.now();
                }
                return r;
            }).sort((a, b) => b.timestamp - a.timestamp);

            console.log(`📊 Loaded ${cutRecords.length} records from localStorage`);

            updateDashboard();
            updateCharts();
        } else {
            console.log('📭 No data in localStorage either');
            cutRecords = [];
            updateDashboard();
            updateCharts();
        }
    } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
        cutRecords = [];
        updateDashboard();
        updateCharts();
    }
}

/ Auto-refresh mechanism using IndexedDB storage events
function initAutoRefresh() {
    console.log('🔄 Initializing auto-refresh system with IndexedDB...');

    / Listen for storage changes (including from other tabs/windows)
    window.addEventListener('storage', function(e) {
        if (e.key === 'eecolDBChange' || e.key === null) { / null key means any storage change
            console.log('📡 Storage event detected - refreshing reports...');
            loadCuttingData();
        }
    });

    / Also check periodically for changes (in case storage events don't fire)
    setInterval(function() {
        try {
            / Light refresh - compare record counts
            if (window.eecolDB && window.eecolDB.isReady()) {
                window.eecolDB.count('cuttingRecords').then(currentCount => {
                    if (currentCount !== cutRecords.length) {
                        console.log('🔄 Record count changed - refreshing...');
                        loadCuttingData();
                    }
                }).catch(() => {
                    / Ignore errors in periodic check
                });
            }
        } catch (e) {
            / Ignore errors in periodic check
        }
    }, 5000); / Check every 5 seconds
}

/ Manual refresh function
function manualRefresh() {
    console.log('🔃 Manual refresh triggered...');
    cachedReportMetrics = null;
    cachedTrendsData = null;
    const refreshBtn = document.getElementById('manualRefreshBtn');
    const originalText = refreshBtn.textContent;

    refreshBtn.textContent = '⟳';
    refreshBtn.disabled = true;

    / Add loading animation
    refreshBtn.style.animation = 'spin 1s linear';

    loadCuttingData();

    / Reset button after delay
    setTimeout(() => {
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
        refreshBtn.style.animation = '';
    }, 500);
}

/ Utility functions for date handling
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

/ Dashboard statistics update
function updateDashboard() {
    console.log('📊 Updating dashboard statistics...');

    const totalCuts = cutRecords.length;

    / BOLT OPTIMIZATION: Memoized metrics
    if (cachedReportMetrics) {
        applyMetricsToDashboard(cachedReportMetrics);
        return;
    }

    /**
     * BOLT OPTIMIZATION: Single-pass metrics calculation
     * Consolidates multiple O(N) passes (filter, reduce, forEach) into a single iteration
     * to avoid redundant passes over the large cutRecords dataset.
     */
    let totalLength = 0;
    let fullPicks = 0;
    let systemCuts = 0;
    let noMarkCuts = 0;
    let longestCut = 0;
    let longestCutOrder = '-';

    const cutterCounts = {};
    const customerCounts = {};
    const wireTypeCounts = {};

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

    for (const record of cutRecords) {
        / Total Length
        const cutLength = parseFloat(record.cutLength) || 0;
        totalLength += cutLength;

        / Full Picks
        if (record.isFullPick === true) fullPicks++;

        / System Cuts
        if (record.isSystemCut === true) systemCuts++;

        / No Mark Cuts
        const startingMark = record.startingMark;
        const endingMark = record.endingMark;
        if (startingMark === null || startingMark === undefined || startingMark === '' ||
            endingMark === null || endingMark === undefined || endingMark === '') {
            noMarkCuts++;
        }

        / Longest Cut
        if (cutLength > longestCut) {
            longestCut = cutLength;
            longestCutOrder = record.orderNumber || 'N/A';
        }

        / Cutter counts
        if (record.cutterName) {
            cutterCounts[record.cutterName] = (cutterCounts[record.cutterName] || 0) + 1;
        }

        / Customer counts
        if (record.customerName) {
            customerCounts[record.customerName] = (customerCounts[record.customerName] || 0) + 1;
        }

        / Wire type counts
        const wireType = record.wireId || 'Unknown';
        wireTypeCounts[wireType] = (wireTypeCounts[wireType] || 0) + 1;

        / Weekly change tracking (optimized numeric comparison)
        const ts = record.timestamp;
        if (ts >= oneWeekAgoMs) {
            currentWeekCount++;
        } else if (ts >= twoWeeksAgoMs) {
            previousWeekCount++;
        }
    }

    const avgCutLength = totalCuts > 0 ? (totalLength / totalCuts).toFixed(2) : 0;
    const fullPicksPercent = totalCuts > 0 ? ((fullPicks / totalCuts) * 100).toFixed(1) : 0;
    const systemCutsPercent = totalCuts > 0 ? ((systemCuts / totalCuts) * 100).toFixed(1) : 0;
    const noMarkCutsPercent = totalCuts > 0 ? ((noMarkCuts / totalCuts) * 100).toFixed(1) : 0;
    const cutsChange = calculateChange(currentWeekCount, previousWeekCount);

    cachedReportMetrics = {
        totalCuts,
        totalLength,
        fullPicks,
        systemCuts,
        noMarkCuts,
        longestCut,
        longestCutOrder,
        cutterCounts,
        customerCounts,
        wireTypeCounts,
        currentWeekCount,
        previousWeekCount,
        cutsChange
    };

    applyMetricsToDashboard(cachedReportMetrics);
}

function applyMetricsToDashboard(m) {
    const totalCuts = m.totalCuts;
    const avgCutLength = totalCuts > 0 ? (m.totalLength / totalCuts).toFixed(2) : 0;
    const fullPicksPercent = totalCuts > 0 ? ((m.fullPicks / totalCuts) * 100).toFixed(1) : 0;
    const systemCutsPercent = totalCuts > 0 ? ((m.systemCuts / totalCuts) * 100).toFixed(1) : 0;
    const noMarkCutsPercent = totalCuts > 0 ? ((m.noMarkCuts / totalCuts) * 100).toFixed(1) : 0;

    / Top cutter calculation
    let topCutter = '-';
    let topCutterCuts = 0;
    for (const [cutter, count] of Object.entries(m.cutterCounts)) {
        if (count > topCutterCuts) {
            topCutterCuts = count;
            topCutter = cutter;
        }
    }

    / Top customer calculation
    let topCustomer = '-';
    let topCustomerCuts = 0;
    for (const [customer, count] of Object.entries(m.customerCounts)) {
        if (count > topCustomerCuts) {
            topCustomerCuts = count;
            topCustomer = customer;
        }
    }

    / Most cut wire type
    let mostCutWire = '-';
    let mostCutWireCount = 0;
    for (const [wireType, count] of Object.entries(m.wireTypeCounts)) {
        if (count > mostCutWireCount) {
            mostCutWireCount = count;
            mostCutWire = wireType;
        }
    }

    / Update DOM elements
    document.getElementById('totalCutsStat').textContent = totalCuts;
    document.getElementById('totalLengthStat').textContent = m.totalLength.toFixed(2) + 'm';
    document.getElementById('avgCutLength').textContent = avgCutLength + 'm avg';
    document.getElementById('fullPicksStat').textContent = m.fullPicks;
    document.getElementById('fullPicksPercent').textContent = fullPicksPercent + '% of total';
    document.getElementById('topCutterStat').textContent = topCutter;
    document.getElementById('topCutterCuts').textContent = topCutterCuts + ' cuts';
    document.getElementById('topCustomerStat').textContent = topCustomer;
    document.getElementById('topCustomerCuts').textContent = topCustomerCuts + ' cuts';
    document.getElementById('mostCutWireStat').textContent = mostCutWire;
    document.getElementById('mostCutWireCount').textContent = mostCutWireCount + ' cuts';
    document.getElementById('longestCutStat').textContent = m.longestCut.toFixed(2) + 'm';
    document.getElementById('longestCutOrder').textContent = 'Order ' + m.longestCutOrder;
    document.getElementById('systemCutsStat').textContent = m.systemCuts;
    document.getElementById('systemCutsPercent').textContent = systemCutsPercent + '% of total';
    document.getElementById('noMarkCutsStat').textContent = m.noMarkCuts;
    document.getElementById('noMarkCutsPercent').textContent = noMarkCutsPercent + '% of total';
    document.getElementById('totalCutsChange').textContent = m.cutsChange + ' this week';

    console.log('✅ Dashboard statistics updated');
}

/ Chart update functions
function updateCharts() {
    try {
        console.log('📊 Updating charts...');

        const chartType = document.getElementById('chartType').value;
        const period = document.getElementById('reportPeriod').value;

        / BOLT OPTIMIZATION: Memoized trends and metrics for charts
        if (cachedTrendsData && cachedTrendsData.period === period && cachedTrendsData.startDate === document.getElementById('startDate').value && cachedTrendsData.endDate === document.getElementById('endDate').value) {
            destroyExistingCharts();
            chartInstances.cutTrendsChart = createCutTrendsChart(chartType, cachedTrendsData.metrics.trends);
            chartInstances.cutterPerformanceChart = createCutterPerformanceChart(chartType, cachedTrendsData.metrics.cutterCounts);
            chartInstances.wireTypeChart = createWireTypeChart(chartType, cachedTrendsData.metrics.wireTypeCounts);
            chartInstances.customerDistributionChart = createCustomerDistributionChart(chartType, cachedTrendsData.metrics.customerCounts);
            updateReportsTable(cachedTrendsData.metrics);
            return;
        }

        destroyExistingCharts();
        / BOLT FIX: Synchronize global currentPeriod with selected period
        currentPeriod = period;

        const startDateVal = document.getElementById('startDate').value;
        const endDateVal = document.getElementById('endDate').value;
        const startDate = startDateVal ? new Date(startDateVal).getTime() : null;
        const endDate = endDateVal ? new Date(endDateVal).getTime() + 86399999 : null;

        /**
         * BOLT OPTIMIZATION: Single-pass metrics calculation for charts and reports
         * Consolidates approximately 10+ separate O(N) passes (filters, reduces, and groupings)
         * into a single loop to avoid redundant passes over the cutRecords dataset.
         */
        /**
         * BOLT OPTIMIZATION: Period key memoization
         * Using a Map to cache period keys (week/month strings) for unique days
         * avoids repeated Date allocations and complex string formatting.
         */
        const periodKeyCache = new Map();

        const metrics = {
            trends: {},
            cutterCounts: {},
            wireTypeCounts: {},
            customerCounts: {},
            / We'll also collect period metrics for ALL available data to restore the "two most recent" logic
            allPeriodMetrics: {}
        };

        for (const record of cutRecords) {
            const ts = record.timestamp;
            if (!ts) continue;

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
                periodKey = getPeriodKey(tempDate, period);
                periodKeyCache.set(dateStrKey, periodKey);
            }

            / 1. Aggregated metrics for ALL data (for Detailed Reports comparison)
            if (!metrics.allPeriodMetrics[periodKey]) {
                metrics.allPeriodMetrics[periodKey] = {
                    cuts: 0, length: 0, fullPicks: 0, systemCuts: 0,
                    periodStart: ts
                };
            }
            const pMetric = metrics.allPeriodMetrics[periodKey];
            pMetric.cuts++;
            pMetric.length += (record.cutLength || 0);
            if (record.isFullPick) pMetric.fullPicks++;
            if (record.isSystemCut) pMetric.systemCuts++;
            if (ts < pMetric.periodStart) pMetric.periodStart = ts;

            / 2. Filtered metrics for charts (only within selected date range)
            if ((!startDate || ts >= startDate) && (!endDate || ts <= endDate)) {
                / Trends data (same as filtered metrics)
                if (!metrics.trends[periodKey]) {
                    metrics.trends[periodKey] = { cutsCount: 0, totalLength: 0, periodStart: ts };
                }
                metrics.trends[periodKey].cutsCount++;
                metrics.trends[periodKey].totalLength += (record.cutLength || 0);

                if (ts < metrics.trends[periodKey].periodStart) {
                    metrics.trends[periodKey].periodStart = ts;
                }

                / Cutter counts
                if (record.cutterName) {
                    metrics.cutterCounts[record.cutterName] = (metrics.cutterCounts[record.cutterName] || 0) + 1;
                }

                / Wire type counts
                const wireType = record.wireId || 'Unknown';
                metrics.wireTypeCounts[wireType] = (metrics.wireTypeCounts[wireType] || 0) + 1;

                / Customer counts
                if (record.customerName) {
                    metrics.customerCounts[record.customerName] = (metrics.customerCounts[record.customerName] || 0) + 1;
                }
            }
        }

        / Create charts with pre-aggregated data
        chartInstances.cutTrendsChart = createCutTrendsChart(chartType, metrics.trends);
        chartInstances.cutterPerformanceChart = createCutterPerformanceChart(chartType, metrics.cutterCounts);
        chartInstances.wireTypeChart = createWireTypeChart(chartType, metrics.wireTypeCounts);
        chartInstances.customerDistributionChart = createCustomerDistributionChart(chartType, metrics.customerCounts);

        / Update detailed reports table with pre-calculated metrics
        updateReportsTable(metrics);

        / BOLT: Cache calculation results
        cachedTrendsData = {
            period: period,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
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

/ Chart creation functions
function createCutTrendsChart(chartType, trendsData) {
    const ctx = document.getElementById('cutTrendsChart').getContext('2d');
    const sortedKeys = getSortedPeriodKeys(trendsData);

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
        const periodData = trendsData[periodKey];

        const periodDate = new Date(periodData.periodStart);
        let label;
        if (currentPeriod === 'weekly') {
            label = 'Week of ' + shortDateFormat.format(periodDate);
        } else {
            label = monthYearFormat.format(periodDate);
        }

        data.labels.push(label);

        data.datasets[0].data.push(periodData.cutsCount);
        data.datasets[1].data.push(periodData.totalLength);
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

function createCutterPerformanceChart(chartType, cutterCounts) {
    const ctx = document.getElementById('cutterPerformanceChart').getContext('2d');

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

function createWireTypeChart(chartType, wireTypeCounts) {
    const ctx = document.getElementById('wireTypeChart').getContext('2d');

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

function createCustomerDistributionChart(chartType, customerCounts) {
    const ctx = document.getElementById('customerDistributionChart').getContext('2d');

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

/ Reports table update
function updateReportsTable(metrics) {
    const tableBody = document.getElementById('reportsTable');

    /**
     * BOLT OPTIMIZATION: High-performance DOM clearing
     * replaceChildren() is faster than innerHTML = '' as it avoids HTML parsing.
     */
    tableBody.replaceChildren();

    if (cutRecords.length === 0) {
        const rowMetrics = [
            { name: 'Total Cuts', current: 0, previous: 0, change: '+0%' },
            { name: 'Total Length Cut', current: '0m', previous: '0m', change: '+0%' },
            { name: 'Average Cut Length', current: '0m', previous: '0m', change: '+0%' },
            { name: 'Full Picks', current: 0, previous: 0, change: '+0%' },
            { name: 'System Cuts', current: 0, previous: 0, change: '+0%' }
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

    / BOLT FIX: Restore comparison of two most recent available periods
    const sortedKeys = getSortedPeriodKeys(metrics.allPeriodMetrics);
    const currentPeriodKey = sortedKeys[sortedKeys.length - 1];
    const previousPeriodKey = sortedKeys[sortedKeys.length - 2];

    const currentRecords = currentPeriodKey ? metrics.allPeriodMetrics[currentPeriodKey] : null;
    const previousRecords = previousPeriodKey ? metrics.allPeriodMetrics[previousPeriodKey] : null;

    const currentCuts = currentRecords ? currentRecords.cuts : 0;
    const currentLength = currentRecords ? currentRecords.length : 0;
    const currentAvgLength = currentCuts > 0 ? (currentLength / currentCuts).toFixed(2) : '0';
    const currentFullPicks = currentRecords ? currentRecords.fullPicks : 0;
    const currentSystemCuts = currentRecords ? currentRecords.systemCuts : 0;

    const previousCuts = previousRecords ? previousRecords.cuts : 0;
    const previousLength = previousRecords ? previousRecords.length : 0;
    const previousAvgLength = previousCuts > 0 ? (previousLength / previousCuts).toFixed(2) : '0';
    const previousFullPicks = previousRecords ? previousRecords.fullPicks : 0;
    const previousSystemCuts = previousRecords ? previousRecords.systemCuts : 0;

    const cutsChange = calculateChange(currentCuts, previousCuts);
    const lengthChange = calculateChange(currentLength, previousLength);
    const avgLengthChange = calculateChange(parseFloat(currentAvgLength), parseFloat(previousAvgLength));
    const fullPicksChange = calculateChange(currentFullPicks, previousFullPicks);
    const systemCutsChange = calculateChange(currentSystemCuts, previousSystemCuts);

    const rowMetrics = [
        { name: 'Total Cuts', current: currentCuts, previous: previousCuts, change: cutsChange },
        { name: 'Total Length Cut', current: currentLength.toFixed(2) + 'm', previous: previousLength.toFixed(2) + 'm', change: lengthChange },
        { name: 'Average Cut Length', current: currentAvgLength + 'm', previous: previousAvgLength + 'm', change: avgLengthChange },
        { name: 'Full Picks', current: currentFullPicks, previous: previousFullPicks, change: fullPicksChange },
        { name: 'System Cuts', current: currentSystemCuts, previous: previousSystemCuts, change: systemCutsChange }
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

/ Utility function for percentage changes
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

    / Mitigate CSV Injection by prefixing values starting with =, +, -, or @
    if (['=', '+', '-', '@'].some(char => stringValue.startsWith(char))) {
        stringValue = "'" + stringValue;
    }

    / Standard RFC 4180 double-quote escaping
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

/ Export functions
function exportReport() {
    if (cutRecords.length === 0) {
        window.showAlert('No data to export!', 'No Records');
        return;
    }

    const header = ['Date', 'Wire ID', 'Cut Length', 'Unit', 'Starting Mark', 'Ending Mark', 'Line Code', 'Cutter', 'Order Number', 'Customer', 'Type', 'Comments', 'Full Pick', 'System Cut'];
    const rows = cutRecords.map(record => [
        standardDateFormat.format(record.timestamp),
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

    const csvContent = [header, ...rows].map(row => row.map(field => escapeCSVValue(field)).join(',')).join('\n');
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

    / Use the shared PDF generator utility
    if (window.generateCuttingPDF) {
        window.generateCuttingPDF(cutRecords);
    } else {
        console.error('PDF generator utility not available');
        window.showAlert('PDF generator not available. Please check that all utilities are loaded.', 'PDF Error');
    }
}

/ Make functions globally available
if (typeof window !== 'undefined') {
    window.manualRefresh = manualRefresh;
}

/ Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.5',
        menuItems: [
            { text: '✂️ Cutting Records', href: '/src/pages/cutting-records/cutting-records.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '/src/pages/useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '📊 Live Statistics', href: '/src/pages/live-statistics/live-statistics.html', class: 'bg-teal-600 hover:bg-teal-700' }
        ],
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Cutting Reports'
    });
}
