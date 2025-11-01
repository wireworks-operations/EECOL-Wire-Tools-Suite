/**
 * EECOL Wire Cut Records Tool - JavaScript Module
 * Modern IndexedDB implementation with P2P sync capability
 */

// Global variables
let cutRecords = [];
let editingId = null;
let displayedRecordsCount = 0;
let recordsPerPage = 25;
let isLoading = false;
let currentSortField = 'timestamp'; // Default sort by timestamp
let lastDeltaExport = null;
let undoStack = [];
let redoStack = [];
let maxHistorySize = 20; // Keep last 20 states
let batchUndoStack = [];
let batchRedoStack = [];

// Diagnostic function to test database connectivity
async function testDatabaseConnection() {

    try {
        // Check if EECOLIndexedDB is available
        if (typeof EECOLIndexedDB === 'undefined') {
            console.error('❌ EECOLIndexedDB class not found');
            return { success: false, error: 'EECOLIndexedDB class not available' };
        }

        // Check if database instance exists
        if (!window.eecolDB) {
            console.error('❌ Database instance not found');
            return { success: false, error: 'Database instance not initialized' };
        }

        // Check if database is ready
        const isReady = await window.eecolDB.isReady();
        if (!isReady) {
            console.error('❌ Database not ready');
            return { success: false, error: 'Database not ready' };
        }

        // Test basic operations

        // Test getting all records
        const records = await window.eecolDB.getAll('cuttingRecords');

        // Test adding a temporary record
        const testRecord = {
            id: 'test-' + Date.now(),
            wireId: 'TEST',
            cutLength: 1.0,
            cutLengthUnit: 'm',
            cutterName: 'TEST',
            lineCode: 'L:001',
            timestamp: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const addResult = await window.eecolDB.add('cuttingRecords', testRecord);

        // Verify the record was added
        const verifyRecord = await window.eecolDB.get('cuttingRecords', testRecord.id);
        if (verifyRecord) {

            // Clean up test record
            await window.eecolDB.delete('cuttingRecords', testRecord.id);
        } else {
            console.error('❌ Test record verification failed');
        }

        // Test settings store
        const testSetting = { name: 'testSetting', value: 'testValue' };
        await window.eecolDB.update('settings', testSetting);
        const retrievedSetting = await window.eecolDB.get('settings', 'testSetting');
        if (retrievedSetting && retrievedSetting.value === 'testValue') {
            await window.eecolDB.delete('settings', 'testSetting');
        } else {
            console.error('❌ Settings store test failed');
        }

        return {
            success: true,
            recordCount: records.length,
            message: `Database is working correctly. Found ${records.length} existing records.`
        };

    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        return {
            success: false,
            error: error.message,
            details: error
        };
    }
}

// Make diagnostic function available globally for debugging
if (typeof window !== 'undefined') {
    window.testDatabaseConnection = testDatabaseConnection;
}

// P2P Network Sync Function
async function syncToP2PNetwork() {
    try {
        // Check if P2P sync is available and enabled
        if (window.p2pSync && window.p2pSync.isSyncEnabled && window.p2pSync.isSyncEnabled()) {

            // Get all cutting records from database
            if (window.eecolDB && await window.eecolDB.isReady()) {
                const allRecords = await window.eecolDB.getAll('cuttingRecords');

                if (allRecords && allRecords.length > 0) {
                    // Sync to P2P network
                    const syncResult = window.p2pSync.sync('cuttingRecords', allRecords);
                    if (syncResult) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (error) {
        console.error('❌ Error syncing to P2P network:', error);
        return false;
    }
}

// Manual P2P sync functions for user-controlled data sharing

// Manual P2P sync functions for user-controlled data sharing

// Sync all records to P2P network (full sync)
async function syncAllRecordsP2P() {
    try {

        // Check pre-conditions
        if (!window.p2pSync || !window.p2pSync.isSyncEnabled || !window.p2pSync.isSyncEnabled()) {
            await showAlert('P2P sync is not enabled. Please enable P2P sync first.', 'P2P Sync Disabled');
            return;
        }

        const status = window.p2pSync.getSyncStatus();
        if (!status.isConnected) {
            await showAlert('Not connected to P2P network. Please wait for connection.', 'Not Connected');
            return;
        }

        // Get all records from database
        if (!window.eecolDB || !(await window.eecolDB.isReady())) {
            await showAlert('Database not available.', 'Database Error');
            return;
        }

        const allRecords = await window.eecolDB.getAll('cuttingRecords');

        // Sync to P2P network
        const syncResult = await window.p2pSync.sync('cuttingRecords', allRecords);
        if (syncResult) {
            await showAlert(`Successfully synced ${allRecords.length} records to P2P network!`, 'Full Sync Complete');
        } else {
            await showAlert('Sync failed. Please check your P2P connection.', 'Sync Failed');
        }

    } catch (error) {
        console.error('❌ Error during full sync:', error);
        await showAlert(`Sync error: ${error.message}`, 'Sync Error');
    }
}

// Sync new records to P2P network (incremental sync)
async function syncNewRecordsP2P() {
    try {

        // Check pre-conditions
        if (!window.p2pSync || !window.p2pSync.isSyncEnabled || !window.p2pSync.isSyncEnabled()) {
            await showAlert('P2P sync is not enabled. Please enable P2P sync first.', 'P2P Sync Disabled');
            return;
        }

        const status = window.p2pSync.getSyncStatus();
        if (!status.isConnected) {
            await showAlert('Not connected to P2P network. Please wait for connection.', 'Not Connected');
            return;
        }

        // Get last sync timestamp from database
        if (!window.eecolDB || !(await window.eecolDB.isReady())) {
            await showAlert('Database not available.', 'Database Error');
            return;
        }

        let lastSyncTimestamp = 0;
        try {
            const lastSyncSetting = await window.eecolDB.get('settings', 'lastP2PSync');
            if (lastSyncSetting && lastSyncSetting.value) {
                lastSyncTimestamp = parseInt(lastSyncSetting.value);
            }
        } catch (error) {
        }

        // Get records newer than last sync
        const allRecords = await window.eecolDB.getAll('cuttingRecords');
        const newRecords = allRecords.filter(record => record.timestamp > lastSyncTimestamp);


        if (newRecords.length === 0) {
            await showAlert(`No new records to sync. All records are already synchronized.`, 'No New Records');
            return;
        }

        // Sync new records to P2P network
        const syncResult = await window.p2pSync.sync('cuttingRecords', newRecords);
        if (syncResult) {
            // Update last sync timestamp
            const now = Date.now();
            await window.eecolDB.update('settings', { name: 'lastP2PSync', value: now.toString() });
            await showAlert(`Successfully synced ${newRecords.length} new records to P2P network!`, 'Incremental Sync Complete');
        } else {
            await showAlert('Sync failed. Please check your P2P connection.', 'Sync Failed');
        }

    } catch (error) {
        console.error('❌ Error during incremental sync:', error);
        await showAlert(`Sync error: ${error.message}`, 'Sync Error');
    }
}

// Manual P2P pull functions for actively requesting existing data from peers

// Check P2P sync health and status (improved auto-sync feedback)
async function pullRecordsFromP2P() {
    try {

        // Get current sync status
        if (!window.p2pSync) {
            await showAlert('P2P sync system is not available.', 'Sync Health Check');
            return;
        }

        const status = window.p2pSync.getSyncStatus();
        const now = Date.now();

        // Get database info
        const dbReady = window.eecolDB && await window.eecolDB.isReady();
        const totalRecords = dbReady ? (await window.eecolDB.getAll('cuttingRecords')).length : 0;

        // Build health report
        let healthReport = `🔄 P2P Sync Health Check\n\n`;
        healthReport += `📊 Status: ${status.isEnabled ? 'Enabled' : 'Disabled'}\n`;
        healthReport += `📶 Connection: ${status.isConnected ? 'Connected' : 'Disconnected'}\n`;
        healthReport += `👥 Peers: ${status.peerCount}\n`;
        healthReport += `🔧 Mode: ${status.syncMode}\n`;
        healthReport += `💾 Local Records: ${totalRecords}\n\n`;

        // Connection quality assessment
        if (!status.isEnabled) {
            healthReport += `⚠️ P2P sync is disabled. Enable it to share data with other EECOL peers.\n\n`;
        } else if (!status.isConnected) {
            healthReport += `🔌 Not connected to P2P network. Check your network connection.\n\n`;
        } else if (status.peerCount === 0) {
            healthReport += `🔍 Connected to network but no other EECOL peers found. Sync will activate when peers are discovered.\n\n`;
        } else {
            healthReport += `✅ Connected to ${status.peerCount} peer(s). Automatic syncing is active.\n\n`;
            healthReport += `💡 Data syncs automatically when you add, edit, or receive records!\n\n`;
        }

        // Recent activity info (if available)
        healthReport += `🔄 **Automatic Sync Status:**\n`;
        if (status.isConnected && status.peerCount > 0) {
            healthReport += `• Real-time sync is ENABLED\n`;
            healthReport += `• Changes are shared instantly between peers\n`;
            healthReport += `• Conflicts are resolved automatically\n`;
        } else {
            healthReport += `• Waiting for peer connections...\n`;
        }

        await showAlert(healthReport, 'P2P Sync Health Check');

        // Update sync status indicator with fresh data
        updateSyncStatusIndicator(status);

    } catch (error) {
        console.error('❌ Error checking P2P sync health:', error);
        await showAlert(`Could not check sync health: ${error.message}`, 'Health Check Error');
    }
}

// Make sync function available globally for debugging
if (typeof window !== 'undefined') {
    window.syncToP2PNetwork = syncToP2PNetwork;
    window.syncAllRecordsP2P = syncAllRecordsP2P;
    window.syncNewRecordsP2P = syncNewRecordsP2P;
    window.pullRecordsFromP2P = pullRecordsFromP2P;
}

// Setup sync listeners to receive incoming data from peers
function setupP2PSyncListeners() {
    if (window.p2pSync && typeof window.p2pSync.onStatusChange !== 'undefined') {
        // Listen for status changes to set up listeners when connected
        window.p2pSync.onStatusChange((status) => {
            updateSyncStatusIndicator(status);

            // Set up incoming data listener when connected in full sync mode
            if (status.isConnected && status.isSyncing && status.syncMode === 'full') {
                setupIncomingSyncListener();
            }
        });

        // Initial setup if already connected
        const currentStatus = window.p2pSync.getSyncStatus();
        if (currentStatus.isConnected && currentStatus.isSyncing && currentStatus.syncMode === 'full') {
            setupIncomingSyncListener();
        }
    }
}

// Set up listener for incoming synced data from peers
let syncListenerActive = false;
function setupIncomingSyncListener() {
    if (syncListenerActive || !window.p2pSync) {
        return; // Already active
    }

    try {
        window.p2pSync.onSync('cuttingRecords', (incomingData) => {
            handleIncomingSyncData(incomingData);
        });

        syncListenerActive = true;
    } catch (error) {
        console.error('❌ Failed to set up sync listener:', error);
    }
}

// Handle incoming synced data from peers - merge with local data
async function handleIncomingSyncData(incomingData) {
    try {

        if (!window.eecolDB || !(await window.eecolDB.isReady())) {
            console.warn('Database not ready for sync processing');
            return;
        }

        if (!incomingData || typeof incomingData !== 'object') {
            console.warn('Invalid incoming sync data:', incomingData);
            return;
        }

        // Check if this is an individual record (with id field) or collection
        let recordsToMerge = [];
        let pendingResolutions = [];

        if (incomingData.id && incomingData.timestamp) {
            // Single record
            recordsToMerge = [incomingData];
        } else if (Array.isArray(incomingData)) {
            // Array of records
            recordsToMerge = incomingData;
        } else if (typeof incomingData === 'object') {
            // Collection object - iterate through keys, skip Gun metadata

            for (const [key, value] of Object.entries(incomingData)) {
                // Skip Gun's internal metadata key (_)
                if (key === '_') {
                    continue;
                }

                // Skip null/undefined values
                if (!value || typeof value !== 'object') {
                    continue;
                }

                // Debug the actual data structure from Gun

                // Check if this is a Gun reference object (contains only '#' property)
                if (value && typeof value === 'object' && value['#'] && Object.keys(value).length === 1) {
                    // This is a Gun reference! We need to resolve it to get the actual data

                    if (window.p2pSync && window.p2pSync.gun) {
                        // Create promise to resolve this reference
                        const referencePromise = new Promise((resolve) => {
                            window.p2pSync.gun.get('eecol-cuttingRecords').get(key).once((resolvedData) => {
                                if (resolvedData && typeof resolvedData === 'object' && resolvedData.wireId) {
                                    resolve({
                                        ...resolvedData,
                                        id: key // Use the original key as ID
                                    });
                                } else {
                                    console.error(`❌ Invalid resolved data for ${key}:`, resolvedData);
                                    resolve(null);
                                }
                            });
                        });

                        pendingResolutions.push(referencePromise);
                    } else {
                        console.error('❌ Gun instance not available for reference resolution');
                    }
                } else if (value && typeof value === 'object' && (value.wireId || value.cutterName || value.timestamp)) {
                    // This is already a complete record object
                    const record = { ...value };
                    if (!record.id) {
                        record.id = key;
                    }

                    // Validate it's actually a cutting record
                    if (record.wireId && record.cutterName && record.timestamp) {
                        recordsToMerge.push(record);
                        console.log('✅ Added valid cutting record from key:', key, {
                            wireId: record.wireId,
                            cutterName: record.cutterName,
                            timestamp: record.timestamp,
                            cutLength: record.cutLength
                        });
                    } else {
                    }
                } else {
                }
            }
        }

        // Resolve all pending Gun references
        if (pendingResolutions.length > 0) {

            Promise.all(pendingResolutions).then(resolvedRecords => {

                // Filter out null results
                resolvedRecords = resolvedRecords.filter(record => record !== null);

                // Add resolved records to merge list
                recordsToMerge = recordsToMerge.concat(resolvedRecords);

                // Now continue with processing
                processResolvedRecords(recordsToMerge);
            }).catch(error => {
                console.error('❌ Failed to resolve Gun references:', error);
            });
        } else if (recordsToMerge.length > 0) {
            // No references to resolve, process immediately
            await processResolvedRecords(recordsToMerge);
        }
    } catch (error) {
        console.error('❌ Error handling incoming sync data:', error);
    }
}

// Separate function to process resolved records
async function processResolvedRecords(recordsToMerge) {
    try {
        if (recordsToMerge.length === 0) {
            return;
        }


        let mergedCount = 0;
        let skippedCount = 0;

        for (const remoteRecord of recordsToMerge) {
            try {
                const localRecord = await window.eecolDB.get('cuttingRecords', remoteRecord.id);
                console.log('🔍 Local record check result:', remoteRecord.id, {
                    existsLocally: !!localRecord,
                    localRecordData: localRecord ? { wireId: localRecord.wireId, timestamp: localRecord.timestamp } : null
                });

                if (!localRecord) {
                    // New record from peer - add it

                    // Ensure record has required fields and proper structure for sync
                    const processedRecord = {
                        ...remoteRecord,
                        id: remoteRecord.id || crypto.randomUUID(),
                        createdAt: remoteRecord.createdAt || remoteRecord.timestamp || Date.now(),
                        updatedAt: remoteRecord.updatedAt || remoteRecord.timestamp || Date.now(),
                        // Ensure all required fields are present
                        wireId: remoteRecord.wireId || 'UNKNOWN',
                        cutLength: parseFloat(remoteRecord.cutLength) || 0,
                        cutLengthUnit: remoteRecord.cutLengthUnit || 'm',
                        cutterName: remoteRecord.cutterName || 'UNKNOWN',
                        timestamp: remoteRecord.timestamp || Date.now()
                    };


                    // Use the dedicated sync database function
                    const saveSuccess = await saveSyncRecordToDB(processedRecord);
                    if (saveSuccess) {
                        mergedCount++;
                    } else {
                        console.error('❌ Failed to save record from peer:', processedRecord.id);
                    }
                } else {
                    // Record exists - check timestamps to resolve conflicts
                    const localUpdate = new Date(localRecord.updatedAt || localRecord.timestamp || 0);
                    const remoteUpdate = new Date(remoteRecord.updatedAt || remoteRecord.timestamp || 0);

                    if (remoteUpdate > localUpdate) {
                        // Remote is newer - update local record
                        remoteRecord.createdAt = localRecord.createdAt || remoteRecord.createdAt || remoteRecord.timestamp;
                        remoteRecord.updatedAt = remoteRecord.updatedAt || Date.now();

                        // Use the regular update function (updates don't trigger outbound sync)
                        const updateResult = await window.eecolDB.update('cuttingRecords', remoteRecord);

                        mergedCount++;
                    } else {
                        // Local is newer or same - skip
                        skippedCount++;
                    }
                }
            } catch (error) {
                console.error('❌ Error processing individual record:', remoteRecord.id, error, remoteRecord);
            }
        }

        // Reload records and update UI if we merged anything
        if (mergedCount > 0) {

            try {
                await loadCutRecords(); // This will trigger UI update

                // Show enhanced notification with more details
                const currentStatus = window.p2pSync ? window.p2pSync.getSyncStatus() : { peerCount: 1 };
                const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                await showAlert(`✅ Auto-synced ${mergedCount} record(s) from ${currentStatus.peerCount || 1} peer(s) at ${now}.\n\nData sharing is active and happens automatically when you add or receive records!`, 'Auto-Sync Complete');

                // Update sync status indicator with fresh data
                updateSyncStatusIndicator(currentStatus);
            } catch (uiError) {
                console.error('❌ Error updating UI after sync:', uiError);
                // Still show notification even if UI update fails
                const currentStatus = window.p2pSync ? window.p2pSync.getSyncStatus() : { peerCount: 1 };
                const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                await showAlert(`✅ Auto-synced ${mergedCount} record(s) from ${currentStatus.peerCount || 1} peer(s) at ${now}.\n\n⚠️ UI may not have updated - please refresh the page.`, 'Auto-Sync Complete');
            }
        } else if (skippedCount > 0) {
        }
    } catch (error) {
        console.error('❌ Error processing resolved records:', error);
    }
}

// P2P Sync Status Indicator Function (for cutting records page)
function updateSyncStatusIndicator(status) {
    const indicator = document.getElementById('p2p-sync-status');
    if (!indicator) return;

    const iconSpan = indicator.querySelector('.sync-icon');
    const textSpan = indicator.querySelector('.sync-text');

    if (!iconSpan || !textSpan) return;

    let statusText = '';
    let statusClass = '';
    let icon = '';

    // Check if sync is enabled
    if (!status.isEnabled) {
        // Sync disabled - show gray disabled state
        statusClass = 'disabled';
        icon = '🚫';
        statusText = 'Disabled';
    } else if (status.isConnected && status.peerCount > 0) {
        // Connected with peers - show green syncing
        statusClass = 'syncing';
        icon = '🔄';
        statusText = `${status.peerCount} peers`;
    } else if (status.isConnected && status.peerCount === 0) {
        // Connected but no peers yet - show orange connecting
        statusClass = 'connecting';
        icon = '⏳';
        statusText = 'Connecting';
    } else {
        // Disconnected/offline - show red disconnected
        statusClass = 'disconnected';
        icon = '🔌';
        statusText = 'Offline';
    }

    // Remove existing status classes
    indicator.classList.remove('syncing', 'connecting', 'disconnected', 'disabled');

    // Add new status class
    indicator.classList.add(statusClass);

    // Update icon and text
    iconSpan.textContent = icon;
    textSpan.textContent = statusText;

}



// IndexedDB-based data loading and saving functions (Fresh Database)
async function loadCutRecords() {
    try {
        // Load from IndexedDB (fresh database)
        if (window.eecolDB && await window.eecolDB.isReady()) {
            const records = await window.eecolDB.getAll('cuttingRecords');
            if (records && records.length > 0) {
                cutRecords = records.sort((a, b) => b.timestamp - a.timestamp);
                displayedRecordsCount = 0;
                renderCutRecords();
                updateExportStatus();
                return;
            }
        }

        // Fresh database starts empty - no fallback needed
        cutRecords = [];
        displayedRecordsCount = 0;
        renderCutRecords();
        updateExportStatus();

    } catch (error) {
        console.error("Error loading cut records:", error);
        await showAlert("Error loading cut records. Please refresh the page.", "Loading Error");
    }
}

async function saveCutRecordToDB(record) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            const result = await window.eecolDB.add('cuttingRecords', record);

            // Verify the save worked
            const verification = await window.eecolDB.get('cuttingRecords', record.id);
            if (verification) {
            } else {
                console.error("❌ Save verification failed for record:", record.id);
            }

            return result;
        } else {
            console.error("❌ Database not available or not ready");
            console.log("Database status:", {
                eecolDBExists: !!window.eecolDB,
                isReady: window.eecolDB ? await window.eecolDB.isReady() : false
            });
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("❌ Error saving cut record:", error);
        console.error("Record that failed to save:", record);
        throw error;
    }
}

// Special database function for P2P sync operations - doesn't trigger recursive syncing
async function saveSyncRecordToDB(record) {
    try {

        if (!window.eecolDB || !(await window.eecolDB.isReady())) {
            console.error("❌ Database not ready for sync save");
            return false;
        }

        // Direct database operation without triggering sync
        const result = await window.eecolDB.add('cuttingRecords', record);

        // Verify the save worked
        const verification = await window.eecolDB.get('cuttingRecords', record.id);
        if (verification) {
            return true;
        } else {
            console.error("❌ Sync save verification failed for record:", record.id);
            // Try cleanup - if we think it saved but can't verify, it might be corrupted
            try {
                await window.eecolDB.delete('cuttingRecords', record.id);
            } catch (cleanupError) {
                console.error("❌ Failed to clean up:", cleanupError);
            }
            return false;
        }
    } catch (error) {
        console.error("❌ Error in sync save operation:", error);
        console.error("Failed record:", record);

        // Check if it's a constraint violation or data formatting issue
        if (error.message && error.message.includes('constraint')) {
            console.error("💥 IndexedDB constraint violation detected");
        }

        return false;
    }
}

async function updateCutRecordInDB(record) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.update('cuttingRecords', record);
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("Error updating cut record:", error);
        throw error;
    }
}

async function deleteCutRecordFromDB(id) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.delete('cuttingRecords', id);
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("Error deleting cut record:", error);
        throw error;
    }
}

async function clearAllCutRecordsFromDB() {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.clear('cuttingRecords');
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("Error clearing cut records:", error);
        throw error;
    }
}

function updateExportStatus() {
    function formatExportTime(timestamp) {
        if (!timestamp) return `<a href="#" onclick="exportJSONBackup()" style="color: #f59e0b; font-weight: 600; text-decoration: underline;">Never exported</a>`;

        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        const isStale = diffDays > 3;

        if (isStale) return `<a href="#" onclick="exportJSONBackup()">${diffDays > 7 ? date.toLocaleDateString() : `${diffDays} days ago`}</a>`;

        if (diffDays === 0) {
            return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Try to get from IndexedDB first
    if (window.eecolDB && window.eecolDB.isReady()) {
        window.eecolDB.get('settings', 'lastJsonExport').then((jsonExport) => {
            const jsonEl = document.getElementById('lastJsonExport');
            if (jsonEl) jsonEl.innerHTML = formatExportTime(jsonExport?.value);
        }).catch(() => {
            // Fresh database - show never exported
            const jsonEl = document.getElementById('lastJsonExport');
            if (jsonEl) jsonEl.innerHTML = formatExportTime(null);
        });
    } else {
        // Fresh database - show never exported
        const jsonEl = document.getElementById('lastJsonExport');
        if (jsonEl) jsonEl.innerHTML = formatExportTime(null);
    }
}

// Quick Stats bar update logic
async function updateStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const cutsToday = cutRecords.filter(r => r.timestamp >= todayStart);
    const totalCutsToday = cutsToday.length;

    const totalLength = cutRecords.reduce((sum, r) => sum + (r.cutLength || 0), 0);

    const fullPicksCount = cutRecords.filter(r => r.isFullPick === true).length;

    // Calculate most active cutter
    const cutterCounts = {};
    cutRecords.forEach(r => {
        if (r.cutterName) {
            cutterCounts[r.cutterName] = (cutterCounts[r.cutterName] || 0) + 1;
        }
    });
    let topCutter = '-';
    let maxCuts = 0;
    for (const [cutter, count] of Object.entries(cutterCounts)) {
        if (count > maxCuts) {
            maxCuts = count;
            topCutter = cutter;
        }
    }

    // Calculate most active customer
    const customerCounts = {};
    cutRecords.forEach(r => {
        if (r.customerName) {
            customerCounts[r.customerName] = (customerCounts[r.customerName] || 0) + 1;
        }
    });
    let topCustomer = '-';
    let maxCutsCustomer = 0;
    for (const [customer, count] of Object.entries(customerCounts)) {
        if (count > maxCutsCustomer) {
            maxCutsCustomer = count;
            topCustomer = customer;
        }
    }

    // System cuts count
    const systemCutsCount = cutRecords.filter(r => r.isSystemCut === true).length;

    // Update DOM
    document.getElementById('cutsToday').textContent = totalCutsToday;
    document.getElementById('totalLength').textContent = totalLength.toFixed(2) + 'm';
    document.getElementById('fullPicksCount').textContent = fullPicksCount;
    document.getElementById('topCutter').textContent = topCutter;
    document.getElementById('topCustomer').textContent = topCustomer;
    document.getElementById('systemCutsCount').textContent = systemCutsCount;
}

function validateInputs() {
    const batchEntryMode = document.getElementById('batchEntryMode').checked;

    if (batchEntryMode) {
        return validateBatchInputs();
    } else {
        return validateSingleInputs();
    }
}

function validateSingleInputs() {
    const lineCode = document.getElementById('lineCode').value.trim();
    const turnedToLineCode = document.getElementById('turnedToLineCode').value.trim();
    const wireId = document.getElementById('wireId').value.trim();
    const cutLength = document.getElementById('cutLength').value;
    const cutterName = document.getElementById('cutterName').value.trim();
    const orderNumber = document.getElementById('orderNumber').value.trim();
    const customerName = document.getElementById('customerName').value.trim();
    const isSystemCut = document.getElementById('systemCut').checked;

    if (!lineCode || !(/^[A-Za-z]$/.test(lineCode) || /^\d{1,3}$/.test(lineCode))) {
        showError("Line Code must be a single letter or 1 to 3 digits.");
        return false;
    }

    if (!turnedToLineCode || !(/^[A-Za-z]$/.test(turnedToLineCode) || /^\d{1,3}$/.test(turnedToLineCode))) {
        showError("Turned To Line Code must be a single letter or 1 to 3 digits.");
        return false;
    }

    if (!wireId) {
        showError("Please enter a Wire Type/ID.");
        return false;
    }

    if (isNaN(parseFloat(cutLength)) || parseFloat(cutLength) <= 0) {
        showError("Please enter a valid Cut Length (> 0).");
        return false;
    }

    if (!cutterName) {
        showError("Please enter a Cutter Name.");
        return false;
    }

    // Check required fields when System Cut is NOT checked
    if (!isSystemCut) {
        if (!orderNumber) {
            showError("Please enter an Order Number / IBT Number (required unless System Cut is selected).");
            return false;
        }

        if (!customerName) {
            showError("Please enter a Customer Name / Branch (required unless System Cut is selected).");
            return false;
        }
    }

    return true;
}

function validateBatchInputs() {
    const batchCutList = document.getElementById('batchCutList');
    const entries = batchCutList.querySelectorAll('div.p-2');
    const orderNumber = document.getElementById('orderNumber').value.trim();
    const customerName = document.getElementById('customerName').value.trim();
    const isSystemCut = document.getElementById('systemCut').checked;

    if (entries.length === 0) {
        showError("Please add at least one cut entry in batch mode.");
        return false;
    }

    // Check required fields when System Cut is NOT checked
    if (!isSystemCut) {
        if (!orderNumber) {
            showError("Please enter an Order Number / IBT Number (required unless System Cut is selected).");
            return false;
        }

        if (!customerName) {
            showError("Please enter a Customer Name / Branch (required unless System Cut is selected).");
            return false;
        }
    }

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const wireId = entry.querySelector('input[placeholder="Wire Type/ID"]').value.trim();
        const cutLength = entry.querySelector('input[placeholder="Cut Length"]').value;
        const lineCodeRaw = entry.querySelector('input[placeholder="Line Code"]').value.trim();
        const turnedToLineCodeRaw = entry.querySelector('input[placeholder="Turned To Line Code"]').value.trim();
        const cutterName = entry.querySelector('input[placeholder="Cutter Name"]').value.trim();

        if (!wireId) {
            showError(`Batch entry ${i + 1}: Please enter a Wire Type/ID.`);
            return false;
        }

        if (!cutLength || isNaN(parseFloat(cutLength)) || parseFloat(cutLength) <= 0) {
            showError(`Batch entry ${i + 1}: Please enter a valid Cut Length (> 0).`);
            return false;
        }

        if (!lineCodeRaw || !(/^[A-Za-z]$/.test(lineCodeRaw) || /^\d{1,3}$/.test(lineCodeRaw))) {
            showError(`Batch entry ${i + 1}: Line Code must be a single letter or 1 to 3 digits.`);
            return false;
        }

        if (!turnedToLineCodeRaw || !(/^[A-Za-z]$/.test(turnedToLineCodeRaw) || /^\d{1,3}$/.test(turnedToLineCodeRaw))) {
            showError(`Batch entry ${i + 1}: Turned To Line Code must be a single letter or 1 to 3 digits.`);
            return false;
        }

        if (!cutterName) {
            showError(`Batch entry ${i + 1}: Please enter a Cutter Name.`);
            return false;
        }
    }

    return true;
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorBox').classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorBox').classList.add('hidden');
}

function clearForm() {
    document.getElementById('wireId').value = '';
    document.getElementById('cutLength').value = '';
    document.getElementById('startingMark').value = '';
    document.getElementById('endingMark').value = '';
    document.getElementById('singleUnitCut').checked = false;
    document.getElementById('fullPick').checked = false;
    document.getElementById('noMarks').checked = false;
    document.getElementById('systemCut').checked = false;
    document.getElementById('lineCode').value = '';
    document.getElementById('turnedToLineCode').value = '';
    document.getElementById('cutterName').value = '';
    document.getElementById('reelSize').value = '';
    document.getElementById('chargeable').value = '';
    document.getElementById('orderComments').value = '';
    document.getElementById('orderNumber').value = '';
    document.getElementById('customerName').value = '';
    editingId = null;
    document.getElementById('recordBtn').textContent = 'RECORD CUT';
    hideError();
    // Trigger the checkbox change to re-enable fields
    document.getElementById('singleUnitCut').dispatchEvent(new Event('change'));
    document.getElementById('fullPick').dispatchEvent(new Event('change'));
    document.getElementById('noMarks').dispatchEvent(new Event('change'));
    document.getElementById('systemCut').dispatchEvent(new Event('change'));
}

async function saveCutRecord() {
    if (!validateInputs()) return;

    hideError();

    const batchEntryMode = document.getElementById('batchEntryMode').checked;

    if (batchEntryMode) {
        await saveBatchRecords();
    } else {
        await saveSingleRecord();
    }
}

async function saveSingleRecord() {
    try {
        const wireId = document.getElementById('wireId').value.trim().toUpperCase();
        let cutLength = parseFloat(document.getElementById('cutLength').value);
        const cutLengthUnit = document.getElementById('cutLengthUnit').value;
        const isFullPick = document.getElementById('fullPick').checked;
        const startingMarkInput = document.getElementById('startingMark').value.trim();
        const startingMark = startingMarkInput ? parseFloat(startingMarkInput) : null;
        const startingMarkUnit = document.getElementById('startingMarkUnit').value;
        const endingMarkValue = document.getElementById('endingMark').value.trim();
        const isSingleUnitCut = document.getElementById('singleUnitCut').checked;
        const endingMark = endingMarkValue ? parseFloat(endingMarkValue) : null;

        const lineCode = 'L:' + document.getElementById('lineCode').value.trim().toUpperCase();
        const turnedToLineCodeValue = document.getElementById('turnedToLineCode').value.trim().toUpperCase();
        const cutterName = document.getElementById('cutterName').value.trim();
        const orderNumber = document.getElementById('orderNumber').value.trim();
        const customerName = document.getElementById('customerName').value.trim().toUpperCase();
        const coilOrReel = document.getElementById('coilOrReel').value;
        const reelSizeInput = document.getElementById('reelSize').value.trim();
        const quantity = 1;
        const chargeable = document.getElementById('chargeable').value;
        const orderComments = document.getElementById('orderComments').value.trim();

        const reelSize = coilOrReel === 'reel' && reelSizeInput ? parseInt(reelSizeInput) : null;

        const isNoMarks = document.getElementById('noMarks').checked;
        const isSystemCut = document.getElementById('systemCut').checked;
        const isCutInSystem = document.getElementById('cutInSystem').checked;
        const now = Date.now();
        const existingRecord = editingId ? cutRecords.find(r => r.id === editingId) : null;

        // Set cutInSystemTimestamp when checkbox is checked
        let cutInSystemTimestamp = existingRecord?.cutInSystemTimestamp;
        if (isCutInSystem) {
            // If checkbox is checked, set/update timestamp to now
            // For new records or when checkbox was previously unchecked
            if (!existingRecord || existingRecord.isCutInSystem !== true) {
                cutInSystemTimestamp = now;
            }
        } else {
            // If checkbox is unchecked, keep existing timestamp or null
            cutInSystemTimestamp = existingRecord?.cutInSystemTimestamp || null;
        }

        const record = {
            wireId,
            cutLength,
            cutLengthUnit,
            startingMark: isNoMarks ? null : startingMark,
            startingMarkUnit: isNoMarks ? null : startingMarkUnit,
            endingMark: isNoMarks ? null : endingMark,
            endingMarkUnit: isNoMarks ? null : (isFullPick ? null : startingMarkUnit),
            lineCode,
            turnedToLineCode: turnedToLineCodeValue,
            cutterName,
            orderNumber,
            customerName,
            coilOrReel,
            reelSize,
            chargeable,
            orderComments,
            isSingleUnitCut: isNoMarks ? false : isSingleUnitCut,
            isFullPick,
            isNoMarks,
            isSystemCut,
            isCutInSystem,
            cutInSystemTimestamp,
            createdAt: existingRecord ? existingRecord.createdAt : now,
            updatedAt: now,
            timestamp: existingRecord ? existingRecord.timestamp : now,
            id: editingId || crypto.randomUUID(),
        };

        saveToHistory();

        // Store editing ID before clearing for scrolling
        const wasEditingId = editingId;

        if (editingId) {
            cutRecords = cutRecords.map(r => r.id === editingId ? record : r);
            await updateCutRecordInDB(record);
            editingId = null;
        } else {
            cutRecords.push(record);
            await saveCutRecordToDB(record);
        }

        cutRecords.sort((a, b) => {
            const timeDiff = b.timestamp - a.timestamp;
            if (timeDiff !== 0) return timeDiff;
            // Stable sort for equal timestamps
            return b.id.localeCompare(a.id);
        });

        // Reset display counter and re-render
        displayedRecordsCount = 0;
        if (wasEditingId) {
            const filteredRecords = getFilteredRecords();
            const editedIndex = filteredRecords.findIndex(record => record.id === wasEditingId);
            if (editedIndex !== -1) {
                displayedRecordsCount = editedIndex + 1;
            }
        }
        renderCutRecords();

        // Scroll to edited record if we were editing
        if (wasEditingId) {
            setTimeout(() => {
                const editedRecordElement = document.querySelector(`button[onclick*="editRecord('${wasEditingId}')"]`);
                if (editedRecordElement) {
                    editedRecordElement.closest('.cut-record-item').scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }

        clearForm();
        updateButtonStates();

        await showAlert('Cut record saved successfully!', 'Success');

    } catch (error) {
        console.error('❌ Failed to save single record:', error);
        await showAlert(`Failed to save cut record: ${error.message}\n\nPlease check the browser console for more details.`, 'Save Error');
    }
}

async function saveBatchRecords() {
    try {
        const batchCutList = document.getElementById('batchCutList');
        const entries = batchCutList.querySelectorAll('div.p-2');
        const orderNumber = document.getElementById('orderNumber').value.trim();
        const customerName = document.getElementById('customerName').value.trim().toUpperCase();
        const orderComments = document.getElementById('orderComments').value.trim();
        const now = Date.now();

        const newRecords = [];

        entries.forEach(entry => {
            const wireId = entry.querySelector('input[placeholder="Wire Type/ID"]').value.trim().toUpperCase();
            const cutLength = parseFloat(entry.querySelector('input[placeholder="Cut Length"]').value);
            const cutLengthUnit = entry.querySelector('select').value; // First select is unit
            const lineCode = 'L:' + entry.querySelector('input[placeholder="Line Code"]').value.trim().toUpperCase();
            const cutterName = entry.querySelector('input[placeholder="Cutter Name"]').value.trim();
            const coilOrReel = entry.querySelector('.coilOrReelSelect').value;
            const reelSizeInput = entry.querySelector('input[placeholder="Reel Size"]').value.trim();
            const quantity = 1;
            const chargeable = entry.querySelector('select:has(option[value="yes"])').value;

            // Read individual checkboxes for this entry
            const isSingleUnitCut = entry.querySelector('.batchEntrySingleUnitCut').checked;
            const isFullPick = entry.querySelector('.batchEntryFullPick').checked;
            const isNoMarks = entry.querySelector('.batchEntryNoMarks').checked;
            const isSystemCut = entry.querySelector('.batchEntrySystemCut').checked;
            const isCutInSystem = entry.querySelector('.batchEntryCutInSystem').checked;

            // Read starting and ending mark values for this entry
            const startingMarkValue = entry.querySelector('.batchEntryStartingMark').value.trim();
            const startingMark = startingMarkValue !== '' ? parseFloat(startingMarkValue) : null;
            const startingMarkUnit = entry.querySelector('.batchEntryStartingMarkUnit').value;
            const endingMarkValue = entry.querySelector('.batchEntryEndingMark').value.trim();
            const endingMark = endingMarkValue !== '' ? parseFloat(endingMarkValue) : null;
            const endingMarkUnit = entry.querySelector('.batchEntryEndingMarkUnit').value;

            const reelSize = coilOrReel === 'reel' && reelSizeInput ? parseInt(reelSizeInput) : null;

            const turnedToLineCodeRaw = entry.querySelector('input[placeholder="Turned To Line Code"]').value.trim().toUpperCase();
            const record = {
                wireId,
                cutLength,
                cutLengthUnit,
                startingMark: isFullPick || isNoMarks ? null : startingMark,
                startingMarkUnit: isFullPick || isNoMarks ? null : startingMarkUnit,
                endingMark: isFullPick || isNoMarks ? null : (isSingleUnitCut ? startingMark + cutLength : endingMark),
                endingMarkUnit: isFullPick || isNoMarks ? null : (isSingleUnitCut ? startingMarkUnit : endingMarkUnit),
                lineCode,
                turnedToLineCode: turnedToLineCodeRaw,
                cutterName,
                orderNumber,
                customerName,
                coilOrReel,
                reelSize,
                quantity,
                chargeable,
                orderComments,
                isSingleUnitCut,
                isFullPick,
                isNoMarks,
                isSystemCut,
                createdAt: now,
                updatedAt: now,
                timestamp: now,
                id: crypto.randomUUID(),
            };

            newRecords.push(record);
        });

        saveToHistory();
        cutRecords.push(...newRecords);
        cutRecords.sort((a, b) => b.timestamp - a.timestamp);

        // Save all new records to database
        for (let i = 0; i < newRecords.length; i++) {
            const record = newRecords[i];
            await saveCutRecordToDB(record);
        }

        // Reset display counter and re-render
        displayedRecordsCount = 0;
        renderCutRecords();
        clearForm();
        updateButtonStates();

        await showAlert(`Successfully saved ${newRecords.length} batch cut records!`);

    } catch (error) {
        console.error('❌ Failed to save batch records:', error);
        await showAlert(`Failed to save batch cut records: ${error.message}\n\nPlease check the browser console for more details.`, 'Batch Save Error');
    }
}

// Undo/Redo functionality
function saveToHistory() {
    const currentState = JSON.parse(JSON.stringify(cutRecords)); // Deep copy
    undoStack.push(currentState);

    // Keep only the last maxHistorySize states
    if (undoStack.length > maxHistorySize) {
        undoStack.shift();
    }

    // Clear redo stack when new action is performed
    redoStack.length = 0;
}

async function undo() {
    if (undoStack.length === 0) return;

    const currentState = JSON.parse(JSON.stringify(cutRecords)); // Save current for redo
    redoStack.push(currentState);

    cutRecords = undoStack.pop();

    // Update database with new state
    await clearAllCutRecordsFromDB();
    for (const record of cutRecords) {
        await saveCutRecordToDB(record);
    }

    displayedRecordsCount = 0;
    renderCutRecords();
    updateButtonStates();

    showAlert('Last action undone.', 'Undo');
}

async function redo() {
    if (redoStack.length === 0) return;

    const currentState = JSON.parse(JSON.stringify(cutRecords)); // Save current for undo
    undoStack.push(currentState);

    cutRecords = redoStack.pop();

    // Update database with new state
    await clearAllCutRecordsFromDB();
    for (const record of cutRecords) {
        await saveCutRecordToDB(record);
    }

    displayedRecordsCount = 0;
    renderCutRecords();
    updateButtonStates();

    showAlert('Last undone action restored.', 'Redo');
}

function updateButtonStates() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (undoBtn) {
        undoBtn.disabled = undoStack.length === 0;
    }

    if (redoBtn) {
        redoBtn.disabled = redoStack.length === 0;
    }

    // Update batch undo/redo states
    const batchUndoBtn = document.getElementById('batchUndoBtn');
    const batchRedoBtn = document.getElementById('batchRedoBtn');

    if (batchUndoBtn) {
        batchUndoBtn.disabled = batchUndoStack.length === 0;
    }

    if (batchRedoBtn) {
        batchRedoBtn.disabled = batchRedoStack.length === 0;
    }

    // Update global undo/redo states and badges
    const globalUndoBtn = document.getElementById('globalUndoBtn');
    const globalRedoBtn = document.getElementById('globalRedoBtn');
    const globalUndoBadge = document.getElementById('globalUndoBadge');

    if (globalUndoBtn) {
        globalUndoBtn.disabled = undoStack.length === 0;
    }

    if (globalRedoBtn) {
        globalRedoBtn.disabled = redoStack.length === 0;
    }

    if (globalUndoBadge) {
        globalUndoBadge.textContent = undoStack.length > 0 ? undoStack.length : '0';
        if (undoStack.length === 0) {
            globalUndoBadge.classList.add('disabled:hidden');
        } else {
            globalUndoBadge.classList.remove('disabled:hidden');
        }
    }
}

// Batch undo/redo functions
function saveBatchState() {
    const batchCutList = document.getElementById('batchCutList');
    const entries = batchCutList.querySelectorAll('div.p-2');
    const state = Array.from(entries).map(entry => {
        return {
            wireId: entry.querySelector('input[placeholder="Wire Type/ID"]').value,
            cutLength: entry.querySelector('input[placeholder="Cut Length"]').value,
            cutLengthUnit: entry.querySelector('select').value,
            lineCode: entry.querySelector('input[placeholder="Line Code"]').value,
            cutterName: entry.querySelector('input[placeholder="Cutter Name"]').value,
            startingMark: entry.querySelector('.batchEntryStartingMark').value,
            startingMarkUnit: entry.querySelector('.batchEntryStartingMarkUnit').value,
            endingMark: entry.querySelector('.batchEntryEndingMark').value,
            endingMarkUnit: entry.querySelector('.batchEntryEndingMarkUnit').value,
            coilOrReel: entry.querySelector('.coilOrReelSelect').value,
            reelSize: entry.querySelector('input[placeholder="Reel Size"]').value,
            chargeable: entry.querySelector('select:has(option[value="yes"])').value,
            isSingleUnitCut: entry.querySelector('.batchEntrySingleUnitCut').checked,
            isFullPick: entry.querySelector('.batchEntryFullPick').checked,
            isNoMarks: entry.querySelector('.batchEntryNoMarks').checked,
            isSystemCut: entry.querySelector('.batchEntrySystemCut').checked,
            isCutInSystem: entry.querySelector('.batchEntryCutInSystem').checked
        };
    });
    batchUndoStack.push(JSON.parse(JSON.stringify(state)));
    if (batchUndoStack.length > maxHistorySize) {
        batchUndoStack.shift();
    }
    batchRedoStack.length = 0; // Clear redo on new action
    updateButtonStates();
}

function batchUndo() {
    if (batchUndoStack.length === 0) return;

    const currentState = JSON.parse(JSON.stringify(Array.from(document.getElementById('batchCutList').querySelectorAll('div.p-2')).map(entry => ({
        wireId: entry.querySelector('input[placeholder="Wire Type/ID"]').value,
        cutLength: entry.querySelector('input[placeholder="Cut Length"]').value,
        cutLengthUnit: entry.querySelector('select').value,
        lineCode: entry.querySelector('input[placeholder="Line Code"]').value,
        cutterName: entry.querySelector('input[placeholder="Cutter Name"]').value,
        startingMark: entry.querySelector('.batchEntryStartingMark').value,
        startingMarkUnit: entry.querySelector('.batchEntryStartingMarkUnit').value,
        endingMark: entry.querySelector('.batchEntryEndingMark').value,
        endingMarkUnit: entry.querySelector('.batchEntryEndingMarkUnit').value,
        coilOrReel: entry.querySelector('.coilOrReelSelect').value,
        reelSize: entry.querySelector('input[placeholder="Reel Size"]').value,
        chargeable: entry.querySelector('select:has(option[value="yes"])').value,
        isSingleUnitCut: entry.querySelector('.batchEntrySingleUnitCut').checked,
        isFullPick: entry.querySelector('.batchEntryFullPick').checked,
        isNoMarks: entry.querySelector('.batchEntryNoMarks').checked,
        isSystemCut: entry.querySelector('.batchEntrySystemCut').checked,
        isCutInSystem: entry.querySelector('.batchEntryCutInSystem').checked
    }))));

    batchRedoStack.push(JSON.parse(JSON.stringify(currentState)));

    const previousState = batchUndoStack.pop();
    restoreBatchState(previousState);

    showAlert('Last batch action undone.', 'Batch Undo');
}

function batchRedo() {
    if (batchRedoStack.length === 0) return;

    const currentState = JSON.parse(JSON.stringify(Array.from(document.getElementById('batchCutList').querySelectorAll('div.p-2')).map(entry => ({
        wireId: entry.querySelector('input[placeholder="Wire Type/ID"]').value,
        cutLength: entry.querySelector('input[placeholder="Cut Length"]').value,
        cutLengthUnit: entry.querySelector('select').value,
        lineCode: entry.querySelector('input[placeholder="Line Code"]').value,
        cutterName: entry.querySelector('input[placeholder="Cutter Name"]').value,
        startingMark: entry.querySelector('.batchEntryStartingMark').value,
        startingMarkUnit: entry.querySelector('.batchEntryStartingMarkUnit').value,
        endingMark: entry.querySelector('.batchEntryEndingMark').value,
        endingMarkUnit: entry.querySelector('.batchEntryEndingMarkUnit').value,
        coilOrReel: entry.querySelector('.coilOrReelSelect').value,
        reelSize: entry.querySelector('input[placeholder="Reel Size"]').value,
        chargeable: entry.querySelector('select:has(option[value="yes"])').value,
        isFullPick: entry.querySelector('.batchEntryFullPick').checked,
        isNoMarks: entry.querySelector('.batchEntryNoMarks').checked,
        isSystemCut: entry.querySelector('.batchEntrySystemCut').checked
    }))));

    batchUndoStack.push(JSON.parse(JSON.stringify(currentState)));

    const nextState = batchRedoStack.pop();
    restoreBatchState(nextState);

    showAlert('Last undone batch action restored.', 'Batch Redo');
}

function restoreBatchState(state) {
    const batchCutList = document.getElementById('batchCutList');
    batchCutList.innerHTML = '';

    state.forEach(entryData => {
        const newEntry = createBatchCutEntry(entryData);
        batchCutList.appendChild(newEntry);
    });

    updateButtonStates();
}

async function deleteRecord(id) {
    const confirmResult = await showConfirm('Are you sure you want to delete this cut record?', 'Delete Record');
    if (!confirmResult) return;

    cutRecords = cutRecords.filter(record => record.id !== id);
    await deleteCutRecordFromDB(id);

    // Reset display counter and re-render
    displayedRecordsCount = 0;
    renderCutRecords();
}

function editRecord(id) {
    const record = cutRecords.find(r => r.id === id);
    if (!record) {
        showAlert('Record not found.', 'Error').then(() => {});
        return;
    }

    document.getElementById('wireId').value = record.wireId;
    document.getElementById('cutLength').value = record.cutLength.toString();
    document.getElementById('cutLengthUnit').value = record.cutLengthUnit;
    document.getElementById('singleUnitCut').checked = record.isSingleUnitCut || false;
    document.getElementById('fullPick').checked = record.isFullPick || false;
    document.getElementById('noMarks').checked = record.isNoMarks || false;
    document.getElementById('systemCut').checked = !!record.isSystemCut;
    document.getElementById('cutInSystem').checked = !!record.isCutInSystem;
    if (record.isFullPick || record.isNoMarks) {
        document.getElementById('startingMark').value = '';
        document.getElementById('startingMarkUnit').value = 'm';
        document.getElementById('endingMark').value = '';
    } else {
        document.getElementById('startingMark').value = record.startingMark ? record.startingMark.toString() : '';
        document.getElementById('startingMarkUnit').value = record.startingMarkUnit || 'm';
        document.getElementById('endingMarkUnit').value = record.startingMarkUnit || 'm';
        document.getElementById('endingMark').value = record.isSingleUnitCut ? '' : (record.endingMark ? record.endingMark.toString() : '');
    }
    document.getElementById('lineCode').value = record.lineCode.replace('L:', '');
    document.getElementById('turnedToLineCode').value = record.turnedToLineCode || '';
    document.getElementById('cutterName').value = record.cutterName;
    document.getElementById('orderNumber').value = record.orderNumber;
    document.getElementById('customerName').value = record.customerName;
    document.getElementById('coilOrReel').value = record.coilOrReel || 'reel';
    document.getElementById('reelSize').value = record.reelSize ? record.reelSize.toString() : '';
    document.getElementById('chargeable').value = record.chargeable;
    document.getElementById('orderComments').value = record.orderComments || '';
    editingId = id;
    document.getElementById('recordBtn').textContent = 'UPDATE CUT RECORD';

    // Trigger the checkbox change to update field states
    document.getElementById('singleUnitCut').dispatchEvent(new Event('change'));
    document.getElementById('fullPick').dispatchEvent(new Event('change'));
    document.getElementById('noMarks').dispatchEvent(new Event('change'));
    document.getElementById('systemCut').dispatchEvent(new Event('change'));
}

function getFilteredRecords() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const filterField = document.getElementById('filterByField').value;
    const dateFromValue = document.getElementById('dateFrom').value;
    const dateToValue = document.getElementById('dateTo').value;
    const dateFrom = dateFromValue ? new Date(dateFromValue).getTime() : null;
    const dateTo = dateToValue ? new Date(dateToValue).getTime() + 86399999 : null; // Include entire day

    return cutRecords.filter(record => {
        // Date filtering
        if (dateFrom && record.timestamp < dateFrom) return false;
        if (dateTo && record.timestamp > dateTo) return false;

        if (!searchTerm) return true;

        // Search filtering by field
        const fieldsToSearch = {
            wireId: record.wireId.toLowerCase(),
            orderNumber: record.orderNumber.toLowerCase(),
            cutterName: record.cutterName.toLowerCase(),
            customerName: record.customerName.toLowerCase(),
        };

        if (filterField === 'all') {
            return Object.values(fieldsToSearch).some(value => value.includes(searchTerm));
        } else {
            return fieldsToSearch[filterField]?.includes(searchTerm);
        }
    });
}

// Toggle Cut In System function - one-way toggle (false to true, then disabled)
async function toggleCutInSystem(id) {
    const itemIndex = cutRecords.findIndex(r => r.id === id);
    if (itemIndex === -1) return;

    const record = cutRecords[itemIndex];

    // Only allow toggling from false to true (one-way)
    if (record.isCutInSystem === true) {
        return; // Already set, do nothing
    }

    // Set to true and record timestamp
    const now = Date.now();
    record.isCutInSystem = true;
    record.cutInSystemTimestamp = now;
    record.updatedAt = now;

    try {
        // Update in database
        await updateCutRecordInDB(record);

        // Re-render the UI immediately to show changes
        renderCutRecords();

        // Optional: visual feedback
        await showAlert(`Cut record marked as "Cut In System" at ${new Date(now).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })}`, 'System Status Updated');

    } catch (error) {
        console.error('Error toggling Cut In System status:', error);
        await showAlert('Failed to update system status. Please try again.', 'Update Error');

        // Revert local change on error
        record.isCutInSystem = false;
        record.cutInSystemTimestamp = null;
        renderCutRecords();
    }
}

function renderCutRecords() {
    const cutHistoryList = document.getElementById('cutHistoryList');
    const totalRecordsElement = document.getElementById('totalRecordsCount');
    const displayedRecordsElement = document.getElementById('displayedRecordsCount');

    const filteredRecords = getFilteredRecords();

    // Update counters
    totalRecordsElement.textContent = filteredRecords.length;

    if (filteredRecords.length === 0) {
        cutHistoryList.innerHTML = '<p class="text-sm text-gray-500">No cut records found yet.</p>';
        displayedRecordsElement.textContent = '0';
        updateStats();
        return;
    }

    // Load more records if needed
    const recordsToShow = Math.min(displayedRecordsCount + recordsPerPage, filteredRecords.length);
    displayedRecordsCount = recordsToShow;
    displayedRecordsElement.textContent = displayedRecordsCount;

    let html = '';
    filteredRecords.slice(0, displayedRecordsCount).forEach(record => {
        const date = new Date(record.timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let isFullPick = record.isFullPick;
        let isNoMarks = record.isNoMarks;
        let pickFlags = [];
        if (isFullPick) pickFlags.push('Full Pick');
        if (isNoMarks) pickFlags.push('No Marks');

        let pickDisplay = '';
        if (pickFlags.length > 0) {
            if (record.startingMark && !isNoMarks) {
                // Show both Full Pick and marks
                pickDisplay = `<span class="font-bold">${pickFlags.join(', ')}</span> | Start Mark: <span class="font-bold">${record.startingMark} ${record.startingMarkUnit}</span> | End Mark: <span class="font-bold">${record.isSingleUnitCut ? '1 unit cut' : record.endingMark + ' ' + record.endingMarkUnit}</span>`;
            } else {
                // Just show the flags
                pickDisplay = `<span class="font-bold">${pickFlags.join(', ')}</span>`;
            }
        } else if (record.startingMark && !isNoMarks) {
            // Normal case with marks (when No Marks is not checked)
            pickDisplay = `Start Mark: <span class="font-bold">${record.startingMark} ${record.startingMarkUnit}</span> | End Mark: <span class="font-bold">${record.isSingleUnitCut ? '1 unit cut' : record.endingMark + ' ' + record.endingMarkUnit}</span>`;
        } else {
            // No marks or full pick without marks
            pickDisplay = 'No Marks';
        }

        // Determine Cut In System button state and text
        let cutInSystemButton = '';
        if (record.isCutInSystem) {
            // Already set to true - show purple button with date, disabled
            const setDate = record.cutInSystemTimestamp ? (() => {
                const date = new Date(record.cutInSystemTimestamp);
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const year = date.getFullYear();
                return `${month}/${day}/${year}`;
            })() : 'Unknown';
            cutInSystemButton = `<button disabled class="text-xs bg-purple-600 text-white px-2 py-1 rounded cursor-not-allowed opacity-75" title="Marked as Cut In System on ${setDate}">✓ Cut In System (${setDate})</button>`;
        } else {
            // Not set - show gray button, clickable
            cutInSystemButton = `<button onclick="toggleCutInSystem('${record.id}')" class="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded">Cut In System</button>`;
        }

        html += `
            <div class="cut-record-item">
                <p class="text-xs font-semibold header-gradient truncate">
                    Wire: ${record.wireId} | Cut From ${record.lineCode || 'N/A'} | Turned To L:${record.turnedToLineCode || 'N/A'} | Order: ${record.orderNumber} | Customer: ${record.customerName}
                </p>
                <p class="text-xs text-gray-700">
                    Cut Length: <span class="font-bold">${record.cutLength.toFixed(2)} ${record.cutLengthUnit}</span> | ${pickDisplay}
                </p>
                <p class="text-xs text-gray-700">
                    Cutter: ${record.cutterName} |
                    ${record.coilOrReel === 'coil' ? `Coil: Yes` : ''}
                    ${record.coilOrReel === 'reel' && record.chargeable === 'no' ? `Non-Chargeable Reel` : ''}
                    ${record.coilOrReel === 'reel' && record.chargeable === 'yes' ? ` RLS EE-${record.reelSize ? record.reelSize : 'N/A'}W | Chargeable: ${record.chargeable}` : ''}
                    ${record.isSystemCut ? ' | <span class="font-bold">System Cut</span>' : ''}
                    ${record.isCutInSystem ? ` | <span class="font-bold">Cut In System: Yes</span>` : ` | Cut In System: No`}
                </p>
                <p class="text-xs text-gray-700">Comments: ${record.orderComments || 'N/A'}</p>
                <p class="text-xs text-gray-500">@ ${date} by Local</p>
                <p class="text-xs text-gray-400">Created: ${new Date(record.createdAt || record.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}${record.updatedAt && record.updatedAt !== record.createdAt ? ` | Updated: ${new Date(record.updatedAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}</p>
                <div class="flex justify-between items-center mt-1">
                    <div class="flex space-x-1">
                        <button onclick="editRecord('${record.id}')" class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded">Edit</button>
                        <button onclick="deleteRecord('${record.id}')" class="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Delete</button>
                    </div>
                    ${cutInSystemButton}
                </div>
            </div>
        `;
    });

    // Add "Load More" button if there are more records
    if (displayedRecordsCount < filteredRecords.length) {
        html += `
            <div class="text-center mt-4">
                <button
                    onclick="loadMoreRecords()"
                    class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition duration-200"
                >
                    Load More Records (${filteredRecords.length - displayedRecordsCount} remaining)
                </button>
            </div>
        `;
    }

    cutHistoryList.innerHTML = html;
    updateStats();
}

function loadMoreRecords() {
    if (isLoading) return;

    isLoading = true;
    document.getElementById('loadingIndicator').classList.remove('hidden');

    // Simulate loading delay for better UX
    setTimeout(() => {
        renderCutRecords();
        document.getElementById('loadingIndicator').classList.add('hidden');
        isLoading = false;
    }, 300);
}

function setupInfiniteScroll() {
    const cutHistoryList = document.getElementById('cutHistoryList');

    cutHistoryList.addEventListener('scroll', function() {
        if (isLoading || displayedRecordsCount >= cutRecords.length) return;

        // Check if user has scrolled to bottom
        if (this.scrollTop + this.clientHeight >= this.scrollHeight - 100) {
            loadMoreRecords();
        }
    });
}

function escapeCSVValue(value) {
    if (value == null) return '';
    const stringValue = value.toString();
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

async function exportToCSV() {
    if (cutRecords.length === 0) {
        await showAlert('No cut records to export.', 'No Records');
        return;
    }

    const header = [
        'id', 'wireid', 'cutlength', 'cutlengthunit', 'startingmark', 'startingmarkunit', 'endingmark', 'endingmarkunit',
        'cut from line code', 'cuttername', 'ordernumber', 'customername', 'coilorreel', 'reelsize', 'quantity', 'chargeable', 'ordercomments', 'issingleunitcut', 'isfullpick', 'turnedtolinecode'
    ];

    const rows = cutRecords.map(record => [
        escapeCSVValue(record.id),
        escapeCSVValue(record.wireId),
        escapeCSVValue(record.cutLength),
        escapeCSVValue(record.cutLengthUnit),
        escapeCSVValue(record.startingMark),
        escapeCSVValue(record.startingMarkUnit),
        escapeCSVValue(record.endingMark),
        escapeCSVValue(record.endingMarkUnit),
        escapeCSVValue(record.lineCode),
        escapeCSVValue(record.cutterName),
        escapeCSVValue(record.orderNumber),
        escapeCSVValue(record.customerName),
        escapeCSVValue(record.coilOrReel),
        escapeCSVValue(record.reelSize ? `RLS EE-${record.reelSize}W` : ''),
        escapeCSVValue(record.quantity),
        escapeCSVValue(record.chargeable),
        escapeCSVValue(record.orderComments),
        escapeCSVValue(record.isSingleUnitCut ? 'true' : 'false'),
        escapeCSVValue(record.isFullPick ? 'true' : 'false'),
        escapeCSVValue(record.turnedToLineCode ? 'L:' + record.turnedToLineCode : '')
    ]);

    // Add BOM for Excel compatibility
    const bom = '\uFEFF';
    const csvContent = bom + [header, ...rows].map(row => row.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Include record count and date in filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    a.download = `cut_records_${cutRecords.length}_${dateStr}.csv`;

    a.click();
    URL.revokeObjectURL(url);

    // Save export timestamp to IndexedDB
    if (window.eecolDB && await window.eecolDB.isReady()) {
        await window.eecolDB.update('settings', { name: 'lastCsvExport', value: new Date().toISOString() });
    }
    updateExportStatus();
    await showAlert(`Successfully exported ${cutRecords.length} cut records to CSV.`);
}

async function exportDeltaToCSV() {
    if (cutRecords.length === 0) {
        await showAlert('No cut records to export.', 'No Records');
        return;
    }

    const now = Date.now();
    let lastExportTime = lastDeltaExport;

    if (window.eecolDB && await window.eecolDB.isReady()) {
        try {
            const lastExport = await window.eecolDB.get('settings', 'lastDeltaExport');
            lastExportTime = lastExport?.value ? parseInt(lastExport.value) : null;
        } catch (error) {
            console.error("Error getting delta export time from IndexedDB:", error);
            lastExportTime = null;
        }
    }

    const newRecords = lastExportTime ? cutRecords.filter(record => record.timestamp > lastExportTime) : cutRecords;

    if (newRecords.length === 0) {
        await showAlert('No new records since the last export.', 'No New Records');
        return;
    }

    const header = [
        'id', 'wireid', 'cutlength', 'cutlengthunit', 'startingmark', 'startingmarkunit', 'endingmark', 'endingmarkunit',
        'cut from line code', 'cuttername', 'ordernumber', 'customername', 'coilorreel', 'reelsize', 'quantity', 'chargeable', 'ordercomments', 'issingleunitcut', 'isfullpick', 'turnedtolinecode'
    ];

    const rows = newRecords.map(record => [
        escapeCSVValue(record.id),
        escapeCSVValue(record.wireId),
        escapeCSVValue(record.cutLength),
        escapeCSVValue(record.cutLengthUnit),
        escapeCSVValue(record.startingMark),
        escapeCSVValue(record.startingMarkUnit),
        escapeCSVValue(record.endingMark),
        escapeCSVValue(record.endingMarkUnit),
        escapeCSVValue(record.lineCode),
        escapeCSVValue(record.cutterName),
        escapeCSVValue(record.orderNumber),
        escapeCSVValue(record.customerName),
        escapeCSVValue(record.coilOrReel),
        escapeCSVValue(record.reelSize ? `RLS EE-${record.reelSize}W` : ''),
        escapeCSVValue(record.quantity),
        escapeCSVValue(record.chargeable),
        escapeCSVValue(record.orderComments),
        escapeCSVValue(record.isSingleUnitCut ? 'true' : 'false'),
        escapeCSVValue(record.isFullPick ? 'true' : 'false'),
        escapeCSVValue(record.turnedToLineCode ? 'L:' + record.turnedToLineCode : '')
    ]);

    // Add BOM for Excel compatibility
    const bom = '\uFEFF';
    const csvContent = bom + [header, ...rows].map(row => row.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Include record count and date in filename
    const dateStr = new Date(now).toISOString().split('T')[0];
    a.download = `cut_records_new_${newRecords.length}_${dateStr}.csv`;

    a.click();
    URL.revokeObjectURL(url);

    // Update lastDeltaExport
    lastDeltaExport = now;

    // Save to IndexedDB
    if (window.eecolDB && await window.eecolDB.isReady()) {
        await window.eecolDB.update('settings', { name: 'lastDeltaExport', value: now.toString() });
        await window.eecolDB.update('settings', { name: 'lastCsvExport', value: new Date().toISOString() });
    }

    updateExportStatus();
    await showAlert(`Successfully exported ${newRecords.length} new cut records to CSV.\n\nFile: cut_records_new_${newRecords.length}_${dateStr}.csv\n\n${lastExportTime ? 'This export contains records added since the last export.' : 'This was the first export - future exports will only include newer records.'}`);
}





async function clearAllRecords() {
    const confirmResult = await showConfirm(`Are you sure you want to clear all ${cutRecords.length} cut records? This action cannot be undone.`, 'Clear All Records');
    if (confirmResult) {
        cutRecords = [];
        displayedRecordsCount = 0;
        await clearAllCutRecordsFromDB();
        renderCutRecords();
        await showAlert('All cut records have been cleared.', 'Records Cleared');
    }
}

// Cloud sync functions for OneDrive Excel CSV
async function syncToCloudCSV() {
    if (cutRecords.length === 0) {
        await showAlert('No records to sync. Please add some cut records first.', 'No Records');
        return;
    }

    // Generate CSV content
    const header = [
        'WireId', 'CutLength', 'CutLengthUnit', 'StartingMark', 'StartingMarkUnit', 'EndingMark', 'EndingMarkUnit',
        'Cut From Line Code', 'CutterName', 'OrderNumber', 'CustomerName', 'CoilOrReel', 'ReelSize', 'Chargeable', 'OrderComments', 'IsSingleUnitCut', 'IsFullPick', 'TurnedToLineCode', 'Quantity'
    ];

    const rows = cutRecords.map(record => [
        escapeCSVValue(record.wireId),
        escapeCSVValue(record.cutLength),
        escapeCSVValue(record.cutLengthUnit),
        escapeCSVValue(record.startingMark),
        escapeCSVValue(record.startingMarkUnit),
        escapeCSVValue(record.endingMark),
        escapeCSVValue(record.endingMarkUnit),
        escapeCSVValue(record.lineCode),
        escapeCSVValue(record.cutterName),
        escapeCSVValue(record.orderNumber),
        escapeCSVValue(record.customerName),
        escapeCSVValue(record.coilOrReel),
        escapeCSVValue(record.reelSize ? `RLS EE-${record.reelSize}W` : ''),
        escapeCSVValue(record.chargeable),
        escapeCSVValue(record.orderComments),
        escapeCSVValue(record.isSingleUnitCut ? 'true' : 'false'),
        escapeCSVValue(record.isFullPick ? 'true' : 'false'),
        escapeCSVValue(record.turnedToLineCode ? 'L:' + record.turnedToLineCode : ''),
        escapeCSVValue(record.quantity)
    ]);

    const csvContent = [header, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Include record count and date in filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    a.download = `eecol_cut_records_${cutRecords.length}_${dateStr}.csv`;

    a.click();
    URL.revokeObjectURL(url);
}



// JSON Backup Export Function
async function exportJSONBackup() {
    const backup = {
        records: cutRecords,
        timestamp: Date.now(),
        version: '0.7.9.7',
        exportDate: new Date().toISOString(),
        totalRecords: cutRecords.length
    };

    // Save export timestamp to IndexedDB
    if (window.eecolDB && await window.eecolDB.isReady()) {
        await window.eecolDB.update('settings', { name: 'lastJsonExport', value: new Date().toISOString() });
    }
    updateExportStatus();

    const jsonContent = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    a.download = `eecol_json_backup_${cutRecords.length}_${dateStr}.json`;

    a.click();
    URL.revokeObjectURL(url);

    await showAlert(`JSON backup exported successfully!\nContains ${backup.totalRecords} records.\nFile: eecol_json_backup_${cutRecords.length}_${dateStr}.json`, 'JSON Backup Exporter');
}

// JSON Backup Import Function
async function importJSONBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const backupData = JSON.parse(e.target?.result);

            // Validate backup structure
            if (!backupData.records || !Array.isArray(backupData.records)) {
                await showAlert('Invalid backup file format. Missing records array.', 'Invalid Backup');
                return;
            }

            const importRecords = backupData.records;
            const backupVersion = backupData.version || 'unknown';
            const exportDate = backupData.exportDate ? new Date(backupData.exportDate).toLocaleDateString() : 'unknown';

            // Show import options
            const merge = await showConfirm(`JSON Backup Import:\n\nBackup Details:\n- Version: ${backupVersion}\n- Export Date: ${exportDate}\n- Records: ${importRecords.length}\n- Current Records: ${cutRecords.length}\n\nChoose:\nOK = Merge with existing data\nCancel = Replace all existing data`, 'Import Options');

            cutRecords = merge ? [...cutRecords, ...importRecords] : importRecords;

            // Clean up records (ensure IDs, etc.)
            cutRecords.forEach(record => {
                if (!record.id) {
                    record.id = crypto.randomUUID();
                }
            });

            cutRecords.sort((a, b) => b.timestamp - a.timestamp);

            // Save to database
            await clearAllCutRecordsFromDB();
            for (const record of cutRecords) {
                await saveCutRecordToDB(record);
            }

            displayedRecordsCount = 0;
            renderCutRecords();

            await showAlert(`JSON import successful!\n${merge ? 'Merged' : 'Replaced'} with ${importRecords.length} records.\nTotal records: ${cutRecords.length}`, 'Import Successful');

            // Reset file input to allow re-selection of same file
            event.target.value = '';

        } catch (error) {
            await showAlert(`Error importing JSON backup: ${error.message}\n\nPlease ensure this is a valid EECOL JSON backup file.`, 'Import Error');

            // Reset file input even on error to allow retry
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}



//Print Records Capabilities using shared print utility
function printRecords(filtered = false) {
    const records = filtered ? getFilteredRecords() : cutRecords;

    const printContent = `
        <html>
        <head>
            <title>EECOL Cut Records</title>
            <style>
                body {
                    font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
                    padding: 20px;
                    color: #0058B3;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #0058B3;
                    padding-bottom: 15px;
                }
                .title {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 0 0 10px 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    background: white;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                    color: #0058B3;
                }
                .branding {
                    text-align: center;
                    margin-top: 40px;
                    font-size: 10px;
                    color: #999;
                    font-style: italic;
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                    button { display: none !important; }
                    .branding { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">EECOL Wire Cut Records Report</div>
                <div>Total Records: ${records.length} | Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Wire ID</th>
                        <th>Cut Length</th>
                        <th>Start Mark</th>
                        <th>End Mark</th>
                        <th>Line Code</th>
                        <th>Cutter</th>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Type</th>
                        <th>Comments</th>
                        <th>Date/Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(record => `
                        <tr>
                            <td>${record.wireId}</td>
                            <td>${record.cutLength} ${record.cutLengthUnit}</td>
                            <td>${record.isFullPick ? 'Full Pick' : record.startingMark + ' ' + record.startingMarkUnit}</td>
                            <td>${record.isFullPick ? 'Full Pick' : (record.isSingleUnitCut ? '1 unit cut' : record.endingMark + ' ' + record.endingMarkUnit)}</td>
                            <td>${record.lineCode || 'N/A'}</td>
                            <td>${record.cutterName}</td>
                            <td>${record.orderNumber}</td>
                            <td>${record.customerName}</td>
                            <td>${record.coilOrReel === 'coil' ? 'Coil' : (record.reelSize ? `RLS EE-${record.reelSize}W` : 'Reel')}</td>
                            <td>${record.orderComments || 'N/A'}</td>
                            <td>${new Date(record.timestamp).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="branding">
                EECOL Wire Tools Suite 2025 - Enterprise Edition<br>
                Printed: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
            </div>
            <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 8px 16px; background: #0058B3; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.print();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize database if not already done (important for pages that don't load index.js)
    if (typeof EECOLIndexedDB !== 'undefined' && !window.eecolDB) {
        try {
            window.eecolDB = new EECOLIndexedDB();
            await window.eecolDB.ready;
        } catch (error) {
            console.error('Failed to initialize database:', error);
            await showAlert("Failed to initialize database. Please refresh the page.", "Database Error");
            return;
        }
    }

    // Initialize modal system
    if (typeof initModalSystem === 'function') {
        initModalSystem();
    }

    // Initialize P2P sync status indicator for cutting records page
    if (typeof P2PSync !== 'undefined') {
        // Create P2P sync instance if it doesn't exist (like index.js does)
        if (!window.p2pSync) {
            window.p2pSync = new P2PSync();
        }

        // Initialize sync status indicator and listeners
        if (window.p2pSync) {
            setupP2PSyncListeners();

            // Initial status update
            setTimeout(() => {
                if (window.p2pSync.getSyncStatus) {
                    updateSyncStatusIndicator(window.p2pSync.getSyncStatus());
                }
            }, 1000);
        }
    }

    // Batch Entry Mode toggle
    const batchEntryModeCheckbox = document.getElementById('batchEntryMode');
    const singleCutForm = document.getElementById('singleCutForm');
    const batchCutForm = document.getElementById('batchCutForm');
    const wireIdContainer = document.getElementById('wireIdContainer');
    batchEntryModeCheckbox.addEventListener('change', function(e) {
        if (e.target.checked) {
            singleCutForm.classList.add('hidden');
            batchCutForm.classList.remove('hidden');
            wireIdContainer.classList.add('hidden');
        } else {
            singleCutForm.classList.remove('hidden');
            batchCutForm.classList.add('hidden');
            wireIdContainer.classList.remove('hidden');
        }
    });

    // Input validation for order number (digits only, max 7)
    const orderNumberInput = document.getElementById('orderNumber');
    if (orderNumberInput) {
        orderNumberInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 7);
        });
    }

    // Input validation for line code (single letter or digits, max 3) and auto uppercase
    const lineCodeInput = document.getElementById('lineCode');
    if (lineCodeInput) {
        lineCodeInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
        });
    }

    const turnedToLineCodeInput = document.getElementById('turnedToLineCode');
    if (turnedToLineCodeInput) {
        turnedToLineCodeInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
        });
    }

    // Auto uppercase for wire ID, customer name, and cutter name
    const wireIdInput = document.getElementById('wireId');
    if (wireIdInput) {
        wireIdInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    const customerNameInput = document.getElementById('customerName');
    if (customerNameInput) {
        customerNameInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    const cutterNameInput = document.getElementById('cutterName');
    if (cutterNameInput) {
        cutterNameInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // Handle coil/reel field enable/disable for single cut form
    const coilOrReelSelect = document.getElementById('coilOrReel');
    if (coilOrReelSelect) {
        coilOrReelSelect.addEventListener('change', function(e) {
            const isReel = e.target.value === 'reel';
            const reelFields = ['reelSize', 'quantity', 'chargeable'];

            reelFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.disabled = !isReel;
                    if (!isReel) {
                        field.classList.add('bg-gray-100', 'cursor-not-allowed');
                    } else {
                        field.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
            });

            // Enable/disable import button
            const importBtn = document.getElementById('importFromEstimatorBtn');
            if (importBtn) {
                importBtn.disabled = !isReel;
            }
        });
    }

    // Handle coil/reel field enable/disable for batch cut entries
    (function() {
        const batchCutList = document.getElementById('batchCutList');
        if (!batchCutList) return;
        batchCutList.addEventListener('change', function(e) {
            if (e.target.tagName.toLowerCase() === 'select' && (e.target.classList.contains('coilOrReelSelect') || e.target.previousElementSibling?.classList.contains('coilOrReelSelect'))) {
                const select = e.target;
                const entryDiv = select.closest('div.p-2');
                if (!entryDiv) return;
                const isReel = select.value === 'reel';
                const reelSizeInput = entryDiv.querySelector('input[placeholder="Reel Size"]');
                const quantityInput = entryDiv.querySelector('input[placeholder="Quantity"]');
                const chargeableSelect = entryDiv.querySelector('select:has(option[value="yes"])');
                if (reelSizeInput) {
                    reelSizeInput.disabled = !isReel;
                    if (!isReel) {
                        reelSizeInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                    } else {
                        reelSizeInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
                if (quantityInput) {
                    quantityInput.disabled = !isReel;
                    if (!isReel) {
                        quantityInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                    } else {
                        quantityInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
                if (chargeableSelect) {
                    chargeableSelect.disabled = !isReel;
                    if (!isReel) {
                        chargeableSelect.classList.add('bg-gray-100', 'cursor-not-allowed');
                    } else {
                        chargeableSelect.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
            }
        });
    })();

    // Search and filter event listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            displayedRecordsCount = 0;
            renderCutRecords();
        });
    }
    const filterByField = document.getElementById('filterByField');
    if (filterByField) {
        filterByField.addEventListener('change', () => {
            displayedRecordsCount = 0;
            renderCutRecords();
        });
    }
    const dateFrom = document.getElementById('dateFrom');
    if (dateFrom) {
        dateFrom.addEventListener('change', () => {
            displayedRecordsCount = 0;
            renderCutRecords();
        });
    }
    const dateTo = document.getElementById('dateTo');
    if (dateTo) {
        dateTo.addEventListener('change', () => {
            displayedRecordsCount = 0;
            renderCutRecords();
        });
    }
    const clearFilters = document.getElementById('clearFilters');
    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            const filterByField = document.getElementById('filterByField');
            if (filterByField) filterByField.value = 'all';
            const dateFrom = document.getElementById('dateFrom');
            if (dateFrom) dateFrom.value = '';
            const dateTo = document.getElementById('dateTo');
            if (dateTo) dateTo.value = '';
            displayedRecordsCount = 0;
            renderCutRecords();
        });
    }

    // Sync endingMarkUnit with startingMarkUnit
    const startingMarkUnit = document.getElementById('startingMarkUnit');
    if (startingMarkUnit) {
        startingMarkUnit.addEventListener('change', function(e) {
            document.getElementById('endingMarkUnit').value = e.target.value;
        });
    }

    // Handle full pick checkbox - now allows mark entry even when full pick is checked
    const fullPickCheckbox = document.getElementById('fullPick');
    if (fullPickCheckbox) {
        fullPickCheckbox.addEventListener('change', function(e) {
            // Full pick checkbox now allows marks to remain enabled - no changes needed
            // User can enter marks for reference even on full pick records
        });
    }

    // Handle no marks checkbox
    const noMarksCheckbox = document.getElementById('noMarks');
    if (noMarksCheckbox) {
        noMarksCheckbox.addEventListener('change', function(e) {
            const isChecked = e.target.checked;
            const startingMarkInput = document.getElementById('startingMark');
            const endingMarkInput = document.getElementById('endingMark');
            const startingMarkUnit = document.getElementById('startingMarkUnit');
            if (startingMarkInput) {
                startingMarkInput.disabled = isChecked;
                if (isChecked) {
                    startingMarkInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                    startingMarkInput.value = '';
                } else {
                    startingMarkInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                }
            }
            if (endingMarkInput) {
                endingMarkInput.disabled = isChecked;
                if (isChecked) {
                    endingMarkInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                    endingMarkInput.value = '';
                } else {
                    endingMarkInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                }
            }
            if (startingMarkUnit) {
                startingMarkUnit.disabled = isChecked;
                if (isChecked) {
                    startingMarkUnit.classList.add('bg-gray-100', 'cursor-not-allowed');
                } else {
                    startingMarkUnit.classList.remove('bg-gray-100', 'cursor-not-allowed');
                }
            }
        });
    }

    // Handle system cut checkbox
    const systemCutCheckbox = document.getElementById('systemCut');
    if (systemCutCheckbox) {
        systemCutCheckbox.addEventListener('change', function(e) {
            const isChecked = e.target.checked;
            const orderNumberInput = document.getElementById('orderNumber');
            const customerNameInput = document.getElementById('customerName');
            if (orderNumberInput) {
                orderNumberInput.disabled = isChecked;
                if (isChecked) {
                    orderNumberInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                    orderNumberInput.value = '';
                } else {
                    orderNumberInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    orderNumberInput.removeAttribute('disabled');
                }
            }
            if (customerNameInput) {
                customerNameInput.disabled = isChecked;
                if (isChecked) {
                    customerNameInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                    customerNameInput.value = '';
                } else {
                    customerNameInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    customerNameInput.removeAttribute('disabled');
                }
            }
        });
    }

    // Handle single unit cut checkbox
    const singleUnitCutCheckbox = document.getElementById('singleUnitCut');
    if (singleUnitCutCheckbox) {
        singleUnitCutCheckbox.addEventListener('change', function(e) {
            const isChecked = e.target.checked;
            const cutLengthInput = document.getElementById('cutLength');
            const endingMarkInput = document.getElementById('endingMark');
            if (isChecked) {
                // Auto-fill cut length to 1
                cutLengthInput.value = '1';
                // Disable ending mark input
                endingMarkInput.disabled = true;
                endingMarkInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                endingMarkInput.value = '';
            } else {
                // Re-enable ending mark input
                endingMarkInput.disabled = false;
                endingMarkInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
            }
        });
    }

    // Button event listeners
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) recordBtn.addEventListener('click', saveCutRecord);

    // Undo/Redo button event listeners
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.addEventListener('click', undo);

    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) redoBtn.addEventListener('click', redo);

    // Batch undo/redo button event listeners
    const batchUndoBtn = document.getElementById('batchUndoBtn');
    if (batchUndoBtn) batchUndoBtn.addEventListener('click', batchUndo);

    const batchRedoBtn = document.getElementById('batchRedoBtn');
    if (batchRedoBtn) batchRedoBtn.addEventListener('click', batchRedo);

    // Keyboard shortcuts for undo/redo
    document.addEventListener('keydown', function(event) {
        // Ctrl+Z for undo (Cmd+Z on Mac, but we use Ctrl for simplicity)
        if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
            event.preventDefault();
            undo();
        }
        // Ctrl+Y or Ctrl+Shift+Z for redo
        if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'Z' && event.shiftKey))) {
            event.preventDefault();
            redo();
        }
    });

    // Import from Estimator Button - Now opens modal
    const importFromEstimatorBtn = document.getElementById('importFromEstimatorBtn');
    if (importFromEstimatorBtn) {
        importFromEstimatorBtn.addEventListener('click', () => {
            showImportReelModal();
        });
    }

    // Import from Calculator Button (enhanced with history dropdowns)
    const importFromCalculatorBtn = document.getElementById('importFromCalculatorBtn');
    if (importFromCalculatorBtn) {
        importFromCalculatorBtn.addEventListener('click', () => {
            showImportCalculatorModal();
        });
    }

    // Export/Import button event listeners
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportToCSV);
    const exportDeltaBtn = document.getElementById('exportDeltaBtn');
    if (exportDeltaBtn) exportDeltaBtn.addEventListener('click', exportDeltaToCSV);
    const importBtn = document.getElementById('importBtn');
    if (importBtn) importBtn.addEventListener('click', () => {
        const csvFileInput = document.getElementById('csvFileInput');
        if (csvFileInput) csvFileInput.click();
    });
    const exportJSONBtn = document.getElementById('exportJSONBtn');
    if (exportJSONBtn) exportJSONBtn.addEventListener('click', exportJSONBackup);
    const importJSONBtn = document.getElementById('importJSONBtn');
    if (importJSONBtn) {
        importJSONBtn.addEventListener('click', () => {
            jsonFileInput = document.getElementById('jsonFileInput');
            if (jsonFileInput) jsonFileInput.click();
        });

        // Add the missing change event listener
        jsonFileInput = document.getElementById('jsonFileInput');
        if (jsonFileInput) jsonFileInput.addEventListener('change', importJSONBackup);
    }

    // P2P Sync button event listeners
    const syncAllRecordsP2PBtn = document.getElementById('syncAllRecordsP2PBtn');
    if (syncAllRecordsP2PBtn) syncAllRecordsP2PBtn.addEventListener('click', syncAllRecordsP2P);
    const syncNewRecordsP2PBtn = document.getElementById('syncNewRecordsP2PBtn');
    if (syncNewRecordsP2PBtn) syncNewRecordsP2PBtn.addEventListener('click', syncNewRecordsP2P);
    const pullRecordsFromP2PBtn = document.getElementById('pullRecordsFromP2PBtn');
    if (pullRecordsFromP2PBtn) pullRecordsFromP2PBtn.addEventListener('click', pullRecordsFromP2P);

    const printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.addEventListener('click', () => printRecords());
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllRecords);

    // Setup infinite scroll
    setupInfiniteScroll();

    // Load records on page load
    loadCutRecords();

    updateExportStatus();

    // Load saved cutter name
    const savedCutterName = localStorage.getItem('cutterName');
    if (savedCutterName) {
        document.getElementById('cutterName').value = savedCutterName;
    }

    // Initialize button states
    updateButtonStates();

    // Batch Cut List management
    const batchCutList = document.getElementById('batchCutList');
    const addBatchCutBtn = document.getElementById('addBatchCutBtn');

    function createBatchCutEntry(data = {}) {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'p-2 border border-gray-300 rounded space-y-2';

        entryDiv.innerHTML = `
            <div class="flex flex-wrap gap-4 justify-center">
                <label class="flex items-center space-x-2">
                    <input type="checkbox" class="batchEntrySingleUnitCut w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" ${data.isSingleUnitCut ? 'checked' : ''}>
                    <span class="text-sm font-semibold header-gradient">Single Unit Cut</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" class="batchEntryFullPick w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" ${data.isFullPick ? 'checked' : ''}>
                    <span class="text-sm font-semibold header-gradient">Full Pick</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" class="batchEntryNoMarks w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" ${data.isNoMarks ? 'checked' : ''}>
                    <span class="text-sm font-semibold header-gradient">No Marks</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" class="batchEntrySystemCut w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" ${data.isSystemCut ? 'checked' : ''}>
                    <span class="text-sm font-semibold header-gradient">System Cut</span>
                </label>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" class="batchEntryCutInSystem w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500" ${data.isCutInSystem ? 'checked' : ''}>
                    <span class="text-sm font-semibold header-gradient">Cut In System</span>
                </label>
            </div>
            <div class="flex flex-wrap gap-2 items-center">
                <input type="text" placeholder="Wire Type/ID" class="p-1 border border-gray-300 rounded text-sm flex-grow" value="${data.wireId || ''}" />
                <input type="number" placeholder="Cut Length" class="p-1 border border-gray-300 rounded text-sm w-20" value="${data.cutLength || ''}" />
                <select class="p-1 border border-gray-300 rounded text-sm w-24">
                    <option value="m" ${data.cutLengthUnit === 'm' ? 'selected' : ''}>Meters (m)</option>
                    <option value="ft" ${data.cutLengthUnit === 'ft' ? 'selected' : ''}>Feet (ft)</option>
                </select>
                <input type="text" placeholder="Line Code" maxlength="3" class="p-1 border border-gray-300 rounded text-sm w-20" value="${data.lineCode || ''}" />
                <input type="text" placeholder="Turned To Line Code" maxlength="3" class="p-1 border border-gray-300 rounded text-sm w-24" value="${data.turnedToLineCode || ''}" />
                <input type="text" placeholder="Cutter Name" class="p-1 border border-gray-300 rounded text-sm w-32" value="${data.cutterName || ''}" />
            </div>
            <div class="flex flex-wrap gap-2 items-center">
                <div class="flex items-center gap-1">
                    <input type="number" placeholder="Start Mark" class="batchEntryStartingMark p-1 border border-gray-300 rounded text-sm w-20" value="${data.startingMark || ''}" />
                    <select class="batchEntryStartingMarkUnit p-1 border border-gray-300 rounded text-sm w-16">
                        <option value="m" ${data.startingMarkUnit === 'm' ? 'selected' : ''}>m</option>
                        <option value="ft" ${data.startingMarkUnit === 'ft' ? 'selected' : ''}>ft</option>
                    </select>
                </div>
                <div class="flex items-center gap-1">
                    <input type="number" placeholder="End Mark" class="batchEntryEndingMark p-1 border border-gray-300 rounded text-sm w-20" value="${data.endingMark || ''}" />
                    <select class="batchEntryEndingMarkUnit p-1 border border-gray-300 rounded text-sm w-16">
                        <option value="m" ${data.endingMarkUnit === 'm' ? 'selected' : ''}>m</option>
                        <option value="ft" ${data.endingMarkUnit === 'ft' ? 'selected' : ''}>ft</option>
                    </select>
                </div>
                <select class="coilOrReelSelect p-1 border border-gray-300 rounded text-sm w-24">
                    <option value="coil" ${data.coilOrReel === 'coil' ? 'selected' : ''}>Coil</option>
                    <option value="reel" ${data.coilOrReel === 'reel' ? 'selected' : ''}>Reel</option>
                </select>
                <input type="number" placeholder="Reel Size" class="p-1 border border-gray-300 rounded text-sm w-20" value="${data.reelSize || ''}" disabled />
                <select class="p-1 border border-gray-300 rounded text-sm w-24" disabled>
                    <option value="">Chargeable?</option>
                    <option value="yes" ${data.chargeable === 'yes' ? 'selected' : ''}>Yes</option>
                    <option value="no" ${data.chargeable === 'no' ? 'selected' : ''}>No</option>
                </select>
                <button type="button" class="removeBatchCutBtn px-2 py-1 bg-red-500 text-white rounded text-xs">Remove</button>
            </div>
        `;

        // Add event listeners for auto-uppercase and validation
        const wireIdInput = entryDiv.querySelector('input[placeholder="Wire Type/ID"]');
        if (wireIdInput) {
            wireIdInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.toUpperCase();
            });
        }

        const lineCodeInput = entryDiv.querySelector('input[placeholder="Line Code"]');
        if (lineCodeInput) {
            lineCodeInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
            });
        }

        const cutterNameInput = entryDiv.querySelector('input[placeholder="Cutter Name"]');
        if (cutterNameInput) {
            cutterNameInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.toUpperCase();
            });
        }

        // Handle coil/reel field enable/disable for this entry
        const coilOrReelSelect = entryDiv.querySelector('.coilOrReelSelect');
        if (coilOrReelSelect) {
            coilOrReelSelect.addEventListener('change', function(e) {
                const isReel = e.target.value === 'reel';
                const reelSizeInput = entryDiv.querySelector('input[placeholder="Reel Size"]');
                const quantityInput = entryDiv.querySelector('input[placeholder="Quantity"]');
                const chargeableSelect = entryDiv.querySelector('select:has(option[value="yes"])');
                if (reelSizeInput) {
                    reelSizeInput.disabled = !isReel;
                    if (!isReel) {
                        reelSizeInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                        reelSizeInput.value = '';
                    } else {
                        reelSizeInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
                if (quantityInput) {
                    quantityInput.disabled = !isReel;
                    if (!isReel) {
                        quantityInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                        quantityInput.value = '1';
                    } else {
                        quantityInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
                if (chargeableSelect) {
                    chargeableSelect.disabled = !isReel;
                    if (!isReel) {
                        chargeableSelect.classList.add('bg-gray-100', 'cursor-not-allowed');
                        chargeableSelect.value = '';
                    } else {
                        chargeableSelect.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    }
                }
            });
        }

        // Handle single unit cut checkbox for this entry
        const singleUnitCutCheckbox = entryDiv.querySelector('.batchEntrySingleUnitCut');
        if (singleUnitCutCheckbox) {
            singleUnitCutCheckbox.addEventListener('change', function(e) {
                const isChecked = e.target.checked;
                const cutLengthInput = entryDiv.querySelector('input[placeholder="Cut Length"]');
                const endingMarkInput = entryDiv.querySelector('.batchEntryEndingMark');
                if (isChecked) {
                    // Auto-fill cut length to 1
                    cutLengthInput.value = '1';
                    // Disable ending mark input
                    endingMarkInput.disabled = true;
                    endingMarkInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                    endingMarkInput.value = '';
                } else {
                    // Re-enable ending mark input
                    endingMarkInput.disabled = false;
                    endingMarkInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                }
            });
        }

        // Remove button event
        entryDiv.querySelector('.removeBatchCutBtn').addEventListener('click', () => {
            saveBatchState();
            batchCutList.removeChild(entryDiv);
        });

        return entryDiv;
    }

    addBatchCutBtn.addEventListener('click', () => {
        saveBatchState();
        const newEntry = createBatchCutEntry();
        batchCutList.appendChild(newEntry);
    });

    // Initialize with one empty entry
    batchCutList.appendChild(createBatchCutEntry());

    // Quick Stats toggle functionality - starts collapsed
    const statsContent = document.getElementById('statsContent');
    const statsToggle = document.getElementById('statsToggle');
    if (statsContent && statsToggle) {
        // Start with stats hidden on page load
        statsContent.classList.add('hidden');
        statsToggle.textContent = '►'; // Right arrow indicating expandable
    }

    const toggleStatsBtn = document.getElementById('toggleStats');
    if (toggleStatsBtn) {
        toggleStatsBtn.addEventListener('click', function() {
            const statsContent = document.getElementById('statsContent');
            const statsToggle = document.getElementById('statsToggle');

            if (statsContent.classList.contains('hidden')) {
                // Show stats
                statsContent.classList.remove('hidden');
                statsToggle.textContent = '▼';
            } else {
                // Hide stats
                statsContent.classList.add('hidden');
                statsToggle.textContent = '►';
            }
        });
    }

    // Quick calculators functionality
    const toggleQuickCalc = document.getElementById('toggleQuickCalc');
    const quickCalcSection = document.getElementById('quickCalcSection');
    if (toggleQuickCalc && quickCalcSection) {
        toggleQuickCalc.addEventListener('change', function() {
            if (this.checked) {
                quickCalcSection.classList.remove('hidden');
            } else {
                quickCalcSection.classList.add('hidden');
            }
        });
    }

    // Data Management Controls toggle functionality
    const toggleDataControls = document.getElementById('toggleDataControls');
    const dataControlsSection = document.getElementById('dataControlsSection');
    if (toggleDataControls && dataControlsSection) {
        toggleDataControls.addEventListener('change', function() {
            if (this.checked) {
                dataControlsSection.classList.remove('hidden');
            } else {
                dataControlsSection.classList.add('hidden');
            }
        });
    }

    // Sync Controls toggle functionality
    const toggleSyncControls = document.getElementById('toggleSyncControls');
    const syncControlsSection = document.getElementById('syncControlsSection');
    if (toggleSyncControls && syncControlsSection) {
        toggleSyncControls.addEventListener('change', function() {
            if (this.checked) {
                syncControlsSection.classList.remove('hidden');
            } else {
                syncControlsSection.classList.add('hidden');
            }
        });
    }

    // Mark difference calculator
    const calcMarkDiffBtn = document.getElementById('calcMarkDiff');
    if (calcMarkDiffBtn) {
        calcMarkDiffBtn.addEventListener('click', function() {
            const startMark = parseFloat(document.getElementById('quickStartMark').value);
            const endMark = parseFloat(document.getElementById('quickEndMark').value);
            const unit = document.getElementById('quickMarkUnit').value;
            const resultEl = document.getElementById('markDiffResult');

            if (isNaN(startMark) || isNaN(endMark)) {
                resultEl.textContent = 'Please enter valid marks';
                resultEl.classList.add('hidden');
                return;
            }

            let difference = Math.abs(endMark - startMark);

            if (unit === 'm') {
                resultEl.textContent = `\uD83D\uCCCF Length: ${difference.toFixed(2)} meters`;
                const feetConversion = (difference * 3.28084).toFixed(2);
                if (feetConversion !== difference.toFixed(2)) {
                    resultEl.textContent += ` (${feetConversion} ft)`;
                }
            } else {
                resultEl.textContent = `\uD83D\uCCCF Length: ${difference.toFixed(2)} feet`;
                const metersConversion = (difference * 0.3048).toFixed(2);
                if (metersConversion !== difference.toFixed(2)) {
                    resultEl.textContent += ` (${metersConversion} m)`;
                }
            }

            resultEl.classList.remove('hidden');
        });
    }

    // Stop mark calculator
    const calcStopMarkBtn = document.getElementById('calcStopMark');
    if (calcStopMarkBtn) {
        calcStopMarkBtn.addEventListener('click', function() {
            const startMark = parseFloat(document.getElementById('quickStopStart').value);
            const cutLength = parseFloat(document.getElementById('quickStopLength').value);
            const unit = document.getElementById('quickStopUnit').value;
            const countDown = document.getElementById('quickCountDown').checked;
            const resultEl = document.getElementById('stopMarkResult');

            if (isNaN(startMark) || isNaN(cutLength)) {
                resultEl.textContent = 'Please enter valid values';
                resultEl.classList.add('hidden');
                return;
            }

            if (cutLength <= 0) {
                resultEl.textContent = 'Cut length must be positive';
                resultEl.classList.add('hidden');
                return;
            }

            let stopMark = countDown ? startMark - cutLength : startMark + cutLength;

            if (countDown && stopMark < 0) {
                resultEl.textContent = 'Negative stop mark - check direction';
                resultEl.classList.add('hidden');
                return;
            }

            if (unit === 'm') {
                resultEl.textContent = `\uD83D\uDED1 Stop mark: ${stopMark.toFixed(2)} meters`;
                const feetConversion = (stopMark * 3.28084).toFixed(2);
                if (feetConversion !== stopMark.toFixed(2)) {
                    resultEl.textContent += ` (${feetConversion} ft)`;
                }
            } else {
                resultEl.textContent = `\uD83D\uDED1 Stop mark: ${stopMark.toFixed(2)} feet`;
                const metersConversion = (stopMark * 0.3048).toFixed(2);
                if (metersConversion !== stopMark.toFixed(2)) {
                    resultEl.textContent += ` (${metersConversion} m)`;
                }
            }

            resultEl.classList.remove('hidden');
        });
    }
});

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.1',
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: '💡 Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '💾 Backup Guide', href: '../backup/backup.html', class: 'bg-green-500 hover:bg-green-600' },
            { text: '📈 Reports', href: '../cutting-reports/cutting-reports.html', class: 'bg-purple-600 hover:bg-purple-700' }
        ],
        version: 'v0.8.0.1',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Wire Cut Records'
    });
}

// Enhanced Calculator Import Functions
async function showImportCalculatorModal() {
    const modal = document.getElementById('importCalculatorModal');
    const modalContent = document.getElementById('importModalContent');

    if (!modal || !modalContent) {
        console.error('Import calculator modal not found');
        return;
    }

    // Show modal with animation
    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);

    // Populate dropdowns with history
    await populateCalculatorDropdowns();

    // Setup modal event listeners
    setupImportModalEventListeners();
}

async function populateCalculatorDropdowns() {
    const markDropdown = document.getElementById('markCalculatorDropdown');
    const stopDropdown = document.getElementById('stopCalculatorDropdown');

    if (!markDropdown || !stopDropdown) {
        console.error('Calculator dropdowns not found');
        return;
    }

    try {
        // Clear existing options
        markDropdown.innerHTML = '<option value="">Loading...</option>';
        stopDropdown.innerHTML = '<option value="">Loading...</option>';

        // Check if database is available
        if (!window.eecolDB || !(await window.eecolDB.isReady())) {
            markDropdown.innerHTML = '<option value="">Database not available</option>';
            stopDropdown.innerHTML = '<option value="">Database not available</option>';
            return;
        }

        // Fetch last 5 records from markConverter store
        const markRecords = await window.eecolDB.getAll('markConverter');
        const sortedMarkRecords = markRecords
            .filter(record => record.startMark && record.endMark && record.unit)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

        // Fetch last 5 records from stopmarkConverter store
        const stopRecords = await window.eecolDB.getAll('stopmarkConverter');
        const sortedStopRecords = stopRecords
            .filter(record => record.startMark && record.endMark && record.unit)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

        // Populate Mark Calculator dropdown
        markDropdown.innerHTML = '<option value="">Select a saved calculation...</option>';
        if (sortedMarkRecords.length === 0) {
            markDropdown.innerHTML += '<option value="" disabled>No saved calculations found</option>';
        } else {
            sortedMarkRecords.forEach(record => {
                const date = new Date(record.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const unitLabel = record.unit === 'ft' ? 'ft' : 'm';
                const displayText = `Start: ${record.startMark}${unitLabel}, End: ${record.endMark}${unitLabel}, Saved: ${date}`;
                markDropdown.innerHTML += `<option value="${record.id}" data-unit="${record.unit}" data-start="${record.startMark}" data-end="${record.endMark}">${displayText}</option>`;
            });
        }

        // Populate Stop Calculator dropdown
        stopDropdown.innerHTML = '<option value="">Select a saved calculation...</option>';
        if (sortedStopRecords.length === 0) {
            stopDropdown.innerHTML += '<option value="" disabled>No saved calculations found</option>';
        } else {
            sortedStopRecords.forEach(record => {
                const date = new Date(record.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const unitLabel = record.unit === 'ft' ? 'ft' : 'm';
                const displayText = `Start: ${record.startMark}${unitLabel}, End: ${record.endMark}${unitLabel}, Saved: ${date}`;
                stopDropdown.innerHTML += `<option value="${record.id}" data-unit="${record.unit}" data-start="${record.startMark}" data-end="${record.endMark}">${displayText}</option>`;
            });
        }

    } catch (error) {
        console.error('Error populating calculator dropdowns:', error);
        markDropdown.innerHTML = '<option value="">Error loading history</option>';
        stopDropdown.innerHTML = '<option value="">Error loading history</option>';
    }
}

function setupImportModalEventListeners() {
    // Close modal button
    const closeBtn = document.getElementById('closeImportModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideImportModal);
    }

    // Modal backdrop click to close
    const backdrop = document.getElementById('importModalBackdrop');
    if (backdrop) {
        backdrop.addEventListener('click', hideImportModal);
    }

    // Import from Mark Calculator button
    const importMarkBtn = document.getElementById('importFromMarkCalculatorBtn');
    if (importMarkBtn) {
        importMarkBtn.addEventListener('click', () => {
            const dropdown = document.getElementById('markCalculatorDropdown');
            const selectedOption = dropdown.selectedOptions[0];
            if (selectedOption && selectedOption.value) {
                importFromCalculator('markCalculator', selectedOption);
            } else {
                showAlert('Please select a calculation from the Mark Calculator dropdown.', 'No Selection');
            }
        });
    }

    // Import from Stop Calculator button
    const importStopBtn = document.getElementById('importFromStopCalculatorBtn');
    if (importStopBtn) {
        importStopBtn.addEventListener('click', () => {
            const dropdown = document.getElementById('stopCalculatorDropdown');
            const selectedOption = dropdown.selectedOptions[0];
            if (selectedOption && selectedOption.value) {
                importFromCalculator('stopCalculator', selectedOption);
            } else {
                showAlert('Please select a calculation from the Stop Calculator dropdown.', 'No Selection');
            }
        });
    }

    // Enable/disable import buttons based on selection
    const markDropdown = document.getElementById('markCalculatorDropdown');
    const stopDropdown = document.getElementById('stopCalculatorDropdown');

    if (markDropdown) {
        markDropdown.addEventListener('change', () => {
            const hasSelection = markDropdown.selectedOptions[0] && markDropdown.selectedOptions[0].value;
            if (importMarkBtn) importMarkBtn.disabled = !hasSelection;
        });
    }

    if (stopDropdown) {
        stopDropdown.addEventListener('change', () => {
            const hasSelection = stopDropdown.selectedOptions[0] && stopDropdown.selectedOptions[0].value;
            if (importStopBtn) importStopBtn.disabled = !hasSelection;
        });
    }

    // Initially disable import buttons
    if (importMarkBtn) importMarkBtn.disabled = true;
    if (importStopBtn) importStopBtn.disabled = true;
}

async function importFromCalculator(calculatorType, selectedOption) {
    try {
        const recordId = selectedOption.value;
        const unit = selectedOption.getAttribute('data-unit');
        const startMark = parseFloat(selectedOption.getAttribute('data-start'));
        const endMark = parseFloat(selectedOption.getAttribute('data-end'));

        // Update form fields
        document.getElementById('startingMark').value = startMark.toString();
        document.getElementById('endingMark').value = endMark.toString();

        // Update unit dropdowns based on the imported record's unit
        const unitDisplay = unit === 'ft' ? 'ft' : 'm';
        document.getElementById('startingMarkUnit').value = unitDisplay;
        document.getElementById('endingMarkUnit').value = unitDisplay;

        // Close modal
        hideImportModal();

        // Show success message
        const calculatorName = calculatorType === 'markCalculator' ? 'Mark Calculator' : 'Stop Calculator';
        await showAlert(`Marks imported from ${calculatorName}. Units set to ${unit === 'ft' ? 'Feet (ft)' : 'Meters (m)'}.`, 'Import Successful');

    } catch (error) {
        console.error('Error importing from calculator:', error);
        await showAlert('Error importing marks. Please try again.', 'Import Error');
    }
}

function hideImportModal() {
    const modal = document.getElementById('importCalculatorModal');
    const modalContent = document.getElementById('importModalContent');

    if (!modal || !modalContent) return;

    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// ====================================================================
// REEL ESTIMATOR IMPORT MODAL FUNCTIONS
// ====================================================================

async function showImportReelModal() {
    const modal = document.getElementById('importReelModal');
    const modalContent = document.getElementById('reelModalContent');

    if (!modal || !modalContent) {
        console.error('Import reel modal not found');
        return;
    }

    // Show modal with animation
    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);

    // Populate dropdown with saved reel configurations
    await populateFlangeDropdown();

    // Setup modal event listeners
    setupReelModalEventListeners();
}

async function populateFlangeDropdown() {
    const dropdown = document.getElementById('flangeSizeDropdown');

    if (!dropdown) {
        console.error('Flange size dropdown not found');
        return;
    }

    try {
        // Clear existing options
        dropdown.innerHTML = '<option value="">Loading...</option>';

        // Check if database is available
        if (!window.eecolDB || !(await window.eecolDB.isReady())) {
            dropdown.innerHTML = '<option value="">Database not available</option>';
            return;
        }

        // Fetch all reel capacity estimator configurations
        const reelConfigurations = await window.eecolDB.getAll('reelcapacityEstimator');

        // Sort by timestamp (newest first) and take last 5
        const sortedConfigurations = reelConfigurations
            .filter(config => config.flangeDiameter && config.flangeDiameter.value && config.flangeDiameter.unit)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

        // Populate dropdown
        dropdown.innerHTML = '<option value="">Select a saved flange size...</option>';
        if (sortedConfigurations.length === 0) {
            dropdown.innerHTML += '<option value="" disabled>No saved configurations found</option>';
        } else {
            sortedConfigurations.forEach(config => {
                const date = new Date(config.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const flangeSize = config.flangeDiameter.value;
                const flangeUnit = config.flangeDiameter.unit;
                const displayText = `Flange: ${flangeSize} ${flangeUnit} - Saved: ${date}`;
                dropdown.innerHTML += `<option value="${config.id}" data-value="${flangeSize}" data-unit="${flangeUnit}">${displayText}</option>`;
            });
        }

    } catch (error) {
        console.error('Error populating flange dropdown:', error);
        dropdown.innerHTML = '<option value="">Error loading configurations</option>';
    }
}

function setupReelModalEventListeners() {
    // Close modal button
    const closeBtn = document.getElementById('closeReelModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideReelModal);
    }

    // Modal backdrop click to close
    const backdrop = document.getElementById('reelModalBackdrop');
    if (backdrop) {
        backdrop.addEventListener('click', hideReelModal);
    }

    // Import flange button
    const importBtn = document.getElementById('importFlangeBtn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            const dropdown = document.getElementById('flangeSizeDropdown');
            const selectedOption = dropdown.selectedOptions[0];
            if (selectedOption && selectedOption.value) {
                importFlangeSize(selectedOption);
            } else {
                showAlert('Please select a flange size from the dropdown.', 'No Selection');
            }
        });
    }

    // Enable/disable import button based on selection
    const dropdown = document.getElementById('flangeSizeDropdown');
    if (dropdown) {
        dropdown.addEventListener('change', () => {
            const hasSelection = dropdown.selectedOptions[0] && dropdown.selectedOptions[0].value;
            if (importBtn) importBtn.disabled = !hasSelection;
        });
    }

    // Initially disable import button
    if (importBtn) importBtn.disabled = true;
}

async function importFlangeSize(selectedOption) {
    try {
        const flangeValue = parseFloat(selectedOption.getAttribute('data-value'));
        const flangeUnit = selectedOption.getAttribute('data-unit');

        // Convert to inches for the reel size field
        let convertedValue = flangeValue;
        if (flangeUnit !== 'in') {
            if (flangeUnit === 'cm') convertedValue = flangeValue / 2.54;
            else if (flangeUnit === 'm') convertedValue = flangeValue / 0.0254;
            else if (flangeUnit === 'ft') convertedValue = flangeValue * 12;
        }

        // Set coil/reel to 'reel' and populate the reel size
        document.getElementById('coilOrReel').value = 'reel';
        document.getElementById('coilOrReel').dispatchEvent(new Event('change'));
        document.getElementById('reelSize').value = Math.round(convertedValue);

        // Close modal
        hideReelModal();

        // Show success message
        await showAlert(`Flange diameter imported: ${Math.round(convertedValue)} inches`, 'Import Successful');

    } catch (error) {
        console.error('Error importing flange size:', error);
        await showAlert('Error importing flange size. Please try again.', 'Import Error');
    }
}

function hideReelModal() {
    const modal = document.getElementById('importReelModal');
    const modalContent = document.getElementById('reelModalContent');

    if (!modal || !modalContent) return;

    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}
