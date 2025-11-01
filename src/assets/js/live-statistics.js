/**
 * EECOL Live Statistics Dashboard - JavaScript Module
 * Real-time analytics combining inventory and cutting data
 */

// Global variables
let inventoryItems = [];
let cutRecords = [];
let approvalChart = null;
let productChart = null;
let activityChart = null;
let qualityChart = null;
let valueChart = null;
let topCustomersChart = null;
let wireTypeChart = null;
let cuttingPerformanceChart = null;

// Chart.js initialization with CDN fallback
function loadChartJS() {
    return new Promise((resolve, reject) => {
        // Try local Chart.js first (offline support)
        const localScript = document.createElement('script');
        localScript.src = '../../utils/chart.js';
        localScript.onload = () => {
            resolve('local');
        };
        localScript.onerror = () => {
            console.warn('Local Chart.js failed, trying CDN...');
            // Fallback to CDN
            const cdnScript = document.createElement('script');
            cdnScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            cdnScript.onload = () => {
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

    // Initialize IndexedDB first
    if (typeof EECOLIndexedDB !== 'undefined' && EECOLIndexedDB.isIndexedDBSupported()) {
        window.eecolDB = new EECOLIndexedDB();
        await window.eecolDB.ready;

        // Run migration from localStorage if needed
        const hasExistingData = localStorage.getItem('cutRecords') ||
                               localStorage.getItem('inventoryItems') ||
                               localStorage.getItem('machineMaintenanceChecklist');

        if (hasExistingData) {
            const migratedItems = await window.eecolDB.migrateFromLocalStorage();
        }
    } else {
        console.warn('⚠️ IndexedDB is not supported. Falling back to localStorage for live statistics.');
    }

    // Initialize P2P Sync
    if (typeof P2PSync !== 'undefined') {
        window.p2pSync = new P2PSync();
    } else {
        console.warn('⚠️ P2P Sync not available. Some features may be limited for live statistics.');
    }

    try {
        // Wait for Chart.js to load
        await loadChartJS();

        // Initialize data loading
        await loadLiveData();
        initAutoRefresh();

        // Initialize all charts
        await initializeAllCharts();


    } catch (error) {
        console.error('❌ Failed to initialize live dashboard:', error);
        // Fallback mode with no charts
        await loadLiveData();
        initAutoRefresh();
        console.warn('Running in fallback mode without charts');
    }
});

// IndexedDB-based data loading for both inventory and cutting records
async function loadLiveData() {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {

            const [inventoryData, cuttingData] = await Promise.all([
                window.eecolDB.getAll('inventoryRecords'),
                window.eecolDB.getAll('cuttingRecords')
            ]);

            inventoryItems = inventoryData && inventoryData.length > 0 ?
                inventoryData.sort((a, b) => b.timestamp - a.timestamp) : [];

            cutRecords = cuttingData && cuttingData.length > 0 ?
                cuttingData.sort((a, b) => b.timestamp - a.timestamp) : [];

            updateDashboard();

        } else {
            console.warn('⚠️ IndexedDB not available, falling back to localStorage');
            loadFromLocalStorage();
        }

    } catch (error) {
        console.error('❌ Error loading live statistics data from IndexedDB:', error);
        loadFromLocalStorage();
    }
}

// Fallback localStorage loading
function loadFromLocalStorage() {
    try {
        // Load inventory items
        const inventoryStored = localStorage.getItem('inventoryItems');
        if (inventoryStored) {
            const items = JSON.parse(inventoryStored);
            items.forEach(item => {
                if (!item.timestamp) {
                    item.timestamp = item.createdAt || Date.now();
                }
            });
            inventoryItems = items.sort((a, b) => b.timestamp - a.timestamp);
        } else {
            inventoryItems = [];
        }

        // Load cutting records
        const cuttingStored = localStorage.getItem('cutRecords');
        if (cuttingStored) {
            const cuts = JSON.parse(cuttingStored);
            cuts.forEach(cut => {
                if (!cut.timestamp) {
                    cut.timestamp = cut.createdAt || Date.now();
                }
            });
            cutRecords = cuts.sort((a, b) => b.timestamp - a.timestamp);
        } else {
            cutRecords = [];
        }

        updateDashboard();

    } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
        inventoryItems = [];
        cutRecords = [];
        updateDashboard();
    }
}

// Auto-refresh mechanism
function initAutoRefresh() {

    // Listen for storage changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'eecolDBChange' || e.key === null) {
            loadLiveData();
        }
    });

    // Periodic refresh check
    setInterval(function() {
        try {
            if (window.eecolDB && window.eecolDB.isReady()) {
                // Check if data has changed
                Promise.all([
                    window.eecolDB.count('inventoryRecords'),
                    window.eecolDB.count('cuttingRecords')
                ]).then(([inventoryCount, cuttingCount]) => {
                    const hasChanged = inventoryCount !== inventoryItems.length ||
                                     cuttingCount !== cutRecords.length;
                    if (hasChanged) {
                        loadLiveData();
                    }
                }).catch(() => {
                    // Silently handle errors in periodic checks
                });
            }
        } catch (e) {
            // Silently handle errors in periodic checks
        }
    }, 30000); // Check every 30 seconds
}

// Initialize all charts
async function initializeAllCharts() {
    createApprovalChart();
    createProductChart();
    createActivityChart();
    createQualityChart();
    createValueChart();

    // New cutting charts
    createTopCustomersChart();
    createWireTypeChart();
    createCuttingPerformanceChart();

    updateAllCharts();
}

// Update key metrics dashboard
function updateDashboard() {

    // Inventory metrics
    const totalInventoryItems = inventoryItems.length;
    const approvedCount = inventoryItems.filter(item => item.approved === true).length;
    const totalProcessed = inventoryItems.filter(item => item.approved !== null && item.approved !== undefined).length;
    const approvedRate = totalProcessed > 0 ? Math.round((approvedCount / totalProcessed) * 100) : 0;

    const inventoryValue = inventoryItems.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const avgInventoryValue = totalInventoryItems > 0 ? inventoryValue / totalInventoryItems : 0;

    // Cutting metrics
    const totalCuts = cutRecords.length;
    const totalLengthCut = cutRecords.reduce((sum, record) => sum + (record.cutLength || 0), 0);
    const cutsToday = cutRecords.filter(record => {
        const today = new Date().toDateString();
        return new Date(record.timestamp).toDateString() === today;
    }).length;

    // Combined metrics
    const totalActivity = totalInventoryItems + totalCuts;
    const todayActivityCount = cutsToday + inventoryItems.filter(item => {
        const today = new Date().toDateString();
        return new Date(item.timestamp).toDateString() === today;
    }).length;

    const recentActivityCount = inventoryItems.filter(item => {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return item.timestamp > weekAgo;
    }).length + cutRecords.filter(record => {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return record.timestamp > weekAgo;
    }).length;

    // Get most common product/wire type across both datasets
    const productCount = {};
    inventoryItems.forEach(item => {
        const code = item.productCode || 'Unknown';
        productCount[code] = (productCount[code] || 0) + 1;
    });
    cutRecords.forEach(record => {
        const wireType = record.wireId || 'Unknown';
        productCount[wireType] = (productCount[wireType] || 0) + 1;
    });
    const topProduct = Object.keys(productCount).reduce((a, b) =>
        productCount[a] > productCount[b] ? a : b, 'None');

    // Top Customer calculation from cutting records
    const customerCount = {};
    cutRecords.forEach(record => {
        const customer = record.customerName || 'Unknown';
        customerCount[customer] = (customerCount[customer] || 0) + 1;
    });
    let topCustomer = '-';
    let topCustomerOrders = '-';
    if (Object.keys(customerCount).length > 0) {
        const [customerName, orderCount] = Object.entries(customerCount)
            .sort(([,a], [,b]) => b - a)[0];
        topCustomer = customerName;
        topCustomerOrders = orderCount > 1 ? `${orderCount} cuts` : `${orderCount} cut`;
    }

    // Activity change (cuts this week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const currentWeekCuts = cutRecords.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= oneWeekAgo;
    });
    const previousWeekCuts = cutRecords.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) && recordDate < oneWeekAgo;
    });
    const cutsChange = calculateChange(currentWeekCuts.length, previousWeekCuts.length);

    // Update DOM with combined data (kept for compatibility) - safe null checks
    const totalItemsEl = document.getElementById('dashboardTotalItems');
    if (totalItemsEl) totalItemsEl.textContent = totalActivity;

    const approvalRateEl = document.getElementById('dashboardApprovalRate');
    if (approvalRateEl) approvalRateEl.textContent = approvedRate + '%';

    const topProductEl = document.getElementById('dashboardTopProduct');
    if (topProductEl) topProductEl.textContent = totalActivity > 0 ? topProduct : '-';

    const totalValueEl = document.getElementById('dashboardTotalValue');
    if (totalValueEl) totalValueEl.textContent = '$' + inventoryValue.toFixed(2);

    const avgValueEl = document.getElementById('dashboardAvgValue');
    if (avgValueEl) avgValueEl.textContent = '$' + avgInventoryValue.toFixed(2) + ' avg';

    const activityTodayEl = document.getElementById('dashboardActivityToday');
    if (activityTodayEl) activityTodayEl.textContent = todayActivityCount + ' activities today';

    const totalItemsChangeEl = document.getElementById('dashboardTotalItemsChange');
    if (totalItemsChangeEl) totalItemsChangeEl.textContent = cutsChange + ' vs last week';

    const approvalRateChangeEl = document.getElementById('dashboardApprovalRateChange');
    if (approvalRateChangeEl) approvalRateChangeEl.textContent = totalProcessed > 0 ? '+0% vs last week' : 'No processed';

    // Update new metrics - safe null checks
    const topCustomerEl = document.getElementById('dashboardTopCustomer');
    if (topCustomerEl) topCustomerEl.textContent = topCustomer;

    const topCustomerOrdersEl = document.getElementById('dashboardTopCustomerOrders');
    if (topCustomerOrdersEl) topCustomerOrdersEl.textContent = topCustomerOrders;

    const totalCutsEl = document.getElementById('dashboardTotalCuts');
    if (totalCutsEl) totalCutsEl.textContent = totalCuts;

    const cutsTodayEl = document.getElementById('dashboardCutsToday');
    if (cutsTodayEl) cutsTodayEl.textContent = cutsChange + ' this week';

    // Update inventory section metrics (only if elements exist - live-stats page doesn't have these)

    // Calculate weekly approval rate change - safe updates only if element exists
    const approvalWeekAgo = new Date();
    approvalWeekAgo.setDate(approvalWeekAgo.getDate() - 7);
    const currentWeekProcessed = inventoryItems.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= approvalWeekAgo && item.approved !== null && item.approved !== undefined;
    });
    const previousWeekProcessed = inventoryItems.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= new Date(approvalWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) &&
               itemDate < approvalWeekAgo &&
               item.approved !== null && item.approved !== undefined;
    });
    const currentWeekApprovedRate = currentWeekProcessed.length > 0 ?
        currentWeekProcessed.filter(item => item.approved === true).length / currentWeekProcessed.length : 0;
    const previousWeekApprovedRate = previousWeekProcessed.length > 0 ?
        previousWeekProcessed.filter(item => item.approved === true).length / previousWeekProcessed.length : 0;
    const approvalRateChange = calculateChange(currentWeekApprovedRate * 100, previousWeekApprovedRate * 100);
    const inventoryApprovalRateChangeEl = document.getElementById('inventoryApprovalRateChange');
    if (inventoryApprovalRateChangeEl) inventoryApprovalRateChangeEl.textContent = approvalRateChange + ' vs last week';

    // Inventory quality count and percent - safe updates only if elements exist
    const normalCount = inventoryItems.filter(item =>
        !item.reason || (!item.reason.toLowerCase().includes('damaged') &&
        !item.reason.toLowerCase().includes('tail end') &&
        !item.reason.toLowerCase().includes('tailend'))).length;
    const totalProcessedForQuality = inventoryItems.filter(item => item.approved !== null).length; // or all items?
    const qualityPercent = totalProcessedForQuality > 0 ? Math.round((normalCount / totalProcessedForQuality) * 100) : 0;
    const inventoryQualityCountEl = document.getElementById('inventoryQualityCount');
    if (inventoryQualityCountEl) inventoryQualityCountEl.textContent = normalCount;
    const inventoryQualityPercentEl = document.getElementById('inventoryQualityPercent');
    if (inventoryQualityPercentEl) inventoryQualityPercentEl.textContent = qualityPercent + '% Normal';

    // Update cutting section metrics - safe updates only if elements exist
    const cuttingTotalCutsEl = document.getElementById('cuttingTotalCuts');
    if (cuttingTotalCutsEl) cuttingTotalCutsEl.textContent = totalCuts;

    const cuttingCutsTodayEl = document.getElementById('cuttingCutsToday');
    if (cuttingCutsTodayEl) cuttingCutsTodayEl.textContent = cutsToday;

    const cuttingTopCustomerEl = document.getElementById('cuttingTopCustomer');
    if (cuttingTopCustomerEl) cuttingTopCustomerEl.textContent = topCustomer;

    const cuttingTopCustomerOrdersEl = document.getElementById('cuttingTopCustomerOrders');
    if (cuttingTopCustomerOrdersEl) cuttingTopCustomerOrdersEl.textContent = topCustomerOrders;

    const cuttingWeeklyChangeEl = document.getElementById('cuttingWeeklyChange');
    if (cuttingWeeklyChangeEl) cuttingWeeklyChangeEl.textContent = cutsChange;
}

// Update all charts with current data
function updateAllCharts() {
    const now = new Date().toLocaleTimeString();
    const timestamp = 'Updated: ' + now;

    // Update timestamps - safe null checks for elements that exist on this page
    const approvalTimestampEl = document.getElementById('approvalChartTimestamp');
    if (approvalTimestampEl) approvalTimestampEl.textContent = timestamp;

    const productTimestampEl = document.getElementById('productChartTimestamp');
    if (productTimestampEl) productTimestampEl.textContent = timestamp;

    const activityTimestampEl = document.getElementById('activityChartTimestamp');
    if (activityTimestampEl) activityTimestampEl.textContent = timestamp;

    const qualityTimestampEl = document.getElementById('qualityChartTimestamp');
    if (qualityTimestampEl) qualityTimestampEl.textContent = timestamp;

    const valueTimestampEl = document.getElementById('valueChartTimestamp');
    if (valueTimestampEl) valueTimestampEl.textContent = timestamp;

    // These elements don't exist on live-statistics page - skip safely
    // const topCustomersTimestampEl = document.getElementById('topCustomersChartTimestamp');
    // if (topCustomersTimestampEl) topCustomersTimestampEl.textContent = timestamp;

    // const wireTypeTimestampEl = document.getElementById('wireTypeChartTimestamp');
    // if (wireTypeTimestampEl) wireTypeTimestampEl.textContent = timestamp;

    // const cuttingPerformanceTimestampEl = document.getElementById('cuttingPerformanceTimestamp');
    // if (cuttingPerformanceTimestampEl) cuttingPerformanceTimestampEl.textContent = timestamp;

    // const inaTimestampEl = document.getElementById('inaChartTimestamp');
    // if (inaTimestampEl) inaTimestampEl.textContent = timestamp;

    updateApprovalChart();
    updateProductChart();
    updateActivityChart();
    updateQualityChart();
    updateValueChart();

    // Update new charts
    updateTopCustomersChart();
    updateWireTypeChart();
    updateCuttingPerformanceChart();
    updateINAItems();
}

// New chart creation functions
function createTopCustomersChart() {
    if (!topCustomersChart) {
        const ctx = document.getElementById('topCustomersChart').getContext('2d');
        topCustomersChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Cut Count',
                    data: [],
                    backgroundColor: [
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 101, 101, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(139, 69, 19, 0.8)'
                    ],
                    borderColor: [
                        'rgb(245, 158, 11)',
                        'rgb(16, 185, 129)',
                        'rgb(245, 101, 101)',
                        'rgb(59, 130, 246)',
                        'rgb(139, 69, 19)'
                    ],
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: true, grid: { display: false } },
                    y: { beginAtZero: true, grid: { display: false } }
                }
            }
        });
    }
}

function createWireTypeChart() {
    if (!wireTypeChart) {
        const ctx = document.getElementById('wireTypeChart').getContext('2d');
        wireTypeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Usage Count',
                    data: [],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 101, 101, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(139, 69, 19, 0.8)'
                    ],
                    borderColor: [
                        'rgb(59, 130, 246)',
                        'rgb(16, 185, 129)',
                        'rgb(245, 101, 101)',
                        'rgb(251, 191, 36)',
                        'rgb(139, 69, 19)'
                    ],
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: true, grid: { display: false } },
                    y: { beginAtZero: true, grid: { display: false } }
                }
            }
        });
    }
}

function createCuttingPerformanceChart() {
    if (!cuttingPerformanceChart) {
        const ctx = document.getElementById('cuttingPerformanceChart').getContext('2d');
        cuttingPerformanceChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Full Picks', 'System Cuts'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.85)',
                        'rgba(59, 130, 246, 0.85)'
                    ],
                    borderColor: [
                        'rgb(16, 185, 129)',
                        'rgb(59, 130, 246)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// Chart creation functions
function createApprovalChart() {
    if (!approvalChart) {
        const ctx = document.getElementById('approvalChart').getContext('2d');
        approvalChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Approved', 'Denied', 'Pending'],
                datasets: [{
                    data: [0, 0, 0],
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
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

function createProductChart() {
    if (!productChart) {
        const ctx = document.getElementById('productChart').getContext('2d');
        productChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Usage Count (Combined)',
                    data: [],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 101, 101, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(139, 69, 19, 0.8)'
                    ],
                    borderColor: [
                        'rgb(59, 130, 246)',
                        'rgb(16, 185, 129)',
                        'rgb(245, 101, 101)',
                        'rgb(251, 191, 36)',
                        'rgb(139, 69, 19)'
                    ],
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: true, grid: { display: false } },
                    y: { beginAtZero: true, grid: { display: false } }
                }
            }
        });
    }
}

function createActivityChart() {
    if (!activityChart) {
        const ctx = document.getElementById('activityChart').getContext('2d');

        // Generate last 7 days labels
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Cutting Activity',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, grid: { display: false } }
                },
                elements: {
                    point: { radius: 2 }
                }
            }
        });
    }
}

function createQualityChart() {
    if (!qualityChart) {
        const ctx = document.getElementById('qualityChart').getContext('2d');
        qualityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Normal Items', 'Damaged Items', 'Tailend Items'],
                datasets: [{
                    data: [0, 0, 0],
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
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

function createValueChart() {
    if (!valueChart) {
        const ctx = document.getElementById('valueChart').getContext('2d');
        valueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['High Value ($50+)', 'Standard (< $50)'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        'rgba(147, 51, 234, 0.8)',
                        'rgba(59, 130, 246, 0.8)'
                    ],
                    borderColor: [
                        'rgb(147, 51, 234)',
                        'rgb(59, 130, 246)'
                    ],
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: true, grid: { display: false } },
                    y: { beginAtZero: true, grid: { display: false } }
                }
            }
        });
    }
}

// Chart update functions
function updateApprovalChart() {
    if (!approvalChart) return;

    const approved = inventoryItems.filter(item => item.approved === true).length;
    const denied = inventoryItems.filter(item => item.approved === false).length;
    const pending = inventoryItems.filter(item => item.approved === null || item.approved === undefined).length;

    approvalChart.data.datasets[0].data = [approved, denied, pending];
    approvalChart.update();

    // Update count displays
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('deniedCount').textContent = denied;
    document.getElementById('pendingCount').textContent = pending;
}

function updateProductChart() {
    if (!productChart) return;

    // Combined product/wire type counts
    const productCount = {};
    inventoryItems.forEach(item => {
        const code = item.productCode || 'Unknown';
        productCount[code] = (productCount[code] || 0) + 1;
    });
    cutRecords.forEach(record => {
        const wireType = record.wireId || 'Unknown';
        productCount[wireType] = (productCount[wireType] || 0) + 1;
    });

    const sortedProducts = Object.entries(productCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    productChart.data.labels = sortedProducts.map(([code]) => code);
    productChart.data.datasets[0].data = sortedProducts.map(([,count]) => count);
    productChart.update();
}

function updateActivityChart() {
    if (!activityChart) return;

    // Cutting activity for last 7 days
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date).setHours(0, 0, 0, 0);
        const dayEnd = new Date(date).setHours(23, 59, 59, 999);

        const cuttingCount = cutRecords.filter(record =>
            record.timestamp >= dayStart && record.timestamp <= dayEnd
        ).length;

        data.push(cuttingCount);
    }

    activityChart.data.datasets[0].data = data;
    activityChart.update();
}

function updateQualityChart() {
    if (!qualityChart) return;

    const normal = inventoryItems.filter(item =>
        !item.reason || (!item.reason.toLowerCase().includes('damaged') &&
        !item.reason.toLowerCase().includes('tail end') &&
        !item.reason.toLowerCase().includes('tailend'))).length;
    const damaged = inventoryItems.filter(item =>
        item.reason && item.reason.toLowerCase().includes('damaged')).length;
    const tailends = inventoryItems.filter(item =>
        item.reason && (item.reason.toLowerCase().includes('tail end') || item.reason.toLowerCase().includes('tailend'))).length;

    qualityChart.data.datasets[0].data = [normal, damaged, tailends];
    qualityChart.update();

    // Update count displays
    document.getElementById('normalCount').textContent = normal;
    document.getElementById('damagedCount').textContent = damaged;
    document.getElementById('tailendCount').textContent = tailends;
}

function updateValueChart() {
    if (!valueChart) return;

    const highValue = inventoryItems.filter(item => (item.totalValue || 0) >= 50).length;
    const standardValue = inventoryItems.filter(item => (item.totalValue || 0) < 50).length;

    valueChart.data.datasets[0].data = [highValue, standardValue];
    valueChart.update();

    // Update count displays
    document.getElementById('highValueCount').textContent = highValue;
    document.getElementById('lowValueCount').textContent = standardValue;
}

// New chart update functions
function updateTopCustomersChart() {
    if (!topCustomersChart) return;

    // Top counting customers from cutting records
    const customerCount = {};
    cutRecords.forEach(record => {
        const customer = record.customerName || 'Unknown';
        customerCount[customer] = (customerCount[customer] || 0) + 1;
    });

    const sortedCustomers = Object.entries(customerCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    topCustomersChart.data.labels = sortedCustomers.map(([customer]) => customer);
    topCustomersChart.data.datasets[0].data = sortedCustomers.map(([,count]) => count);
    topCustomersChart.update();
}

function updateWireTypeChart() {
    if (!wireTypeChart) return;

    // Wire type counts from cutting records only
    const wireTypeCount = {};
    cutRecords.forEach(record => {
        const wireType = record.wireId || 'Unknown';
        wireTypeCount[wireType] = (wireTypeCount[wireType] || 0) + 1;
    });

    const sortedWireTypes = Object.entries(wireTypeCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    wireTypeChart.data.labels = sortedWireTypes.map(([wireType]) => wireType);
    wireTypeChart.data.datasets[0].data = sortedWireTypes.map(([,count]) => count);
    wireTypeChart.update();
}

function updateCuttingPerformanceChart() {
    if (!cuttingPerformanceChart) return;

    const fullPicks = cutRecords.filter(record => record.isFullPick === true).length;
    const systemCuts = cutRecords.filter(record => record.isSystemCut === true).length;

    cuttingPerformanceChart.data.datasets[0].data = [fullPicks, systemCuts];
    cuttingPerformanceChart.update();

    // Update count displays
    document.getElementById('fullPickCount').textContent = fullPicks;
    document.getElementById('systemCutCount').textContent = systemCuts;
}

function updateINAItems() {
    const inaList = document.getElementById('topINAItems');
    if (!inaList) return;

    // Get recent items with INA numbers
    const inaItems = inventoryItems.filter(item => item.inaNumber && item.inaNumber.trim() !== '')
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);

    if (inaItems.length === 0) {
        inaList.innerHTML = '<li class="text-gray-500">No INA items found</li>';
        return;
    }

    const listItems = inaItems.map(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        const inaNum = item.inaNumber;
        const value = item.totalValue ? '$' + item.totalValue.toFixed(2) : 'N/A';
        const product = item.productCode || 'Unknown';
        return `<li class="text-xs">${date}: INA ${inaNum} - ${product} (${value})</li>`;
    }).join('');

    inaList.innerHTML = listItems;
}

// Utility function
function calculateChange(current, previous) {
    if (previous === 0) {
        return current > 0 ? '+∞%' : '+0%';
    }
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return sign + change.toFixed(1) + '%';
}

// Keyboard shortcuts and global functions
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        loadLiveData();
    }
});

// Expose refresh function globally
if (typeof window !== 'undefined') {
    window.refreshLiveDashboard = loadLiveData;
}

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.1',
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '✂️ Cutting Records', href: '../cutting-records/cutting-records.html', class: 'bg-orange-600 hover:bg-orange-700' },
            { text: '📦 Inventory Records', href: '../inventory-records/inventory-records.html', class: 'bg-purple-600 hover:bg-purple-700' }

        ],
        version: 'v0.8.0.1',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Live Statistics'
    });
}
