/**
 * EECOL Wire Cut Records Tool - JavaScript Module
 * Modern IndexedDB implementation with Material Design 3 (MD3) interactions
 */

// Global variables
let cutRecords = [];

/**
 * BOLT OPTIMIZATION: High-performance date formatters
 */
const shortDateTimeFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
});

const fullDateTimeFormat = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});

/**
 * BOLT OPTIMIZATION: Debounce utility
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

let editingId = null;
let displayedRecordsCount = 0;
let recordsPerPage = 25;
let isLoading = false;
let currentSortField = 'timestamp';
let lastDeltaExport = null;
let undoStack = [];
let redoStack = [];
let maxHistorySize = 20;
let batchUndoStack = [];
let batchRedoStack = [];

// Wire Cut List variables
let wireCutList = [];
let wireListEditingId = null;
let pendingAutoFillId = null;
let currentContextMenuId = null;
let draggedItemId = null;

// Diagnostic function to test database connectivity
async function testDatabaseConnection() {
    try {
        if (typeof EECOLIndexedDB === 'undefined') {
            console.error('❌ EECOLIndexedDB class not found');
            return { success: false, error: 'EECOLIndexedDB class not available' };
        }

        if (!window.eecolDB) {
            console.error('❌ Database instance not found');
            return { success: false, error: 'Database instance not initialized' };
        }

        const isReady = await window.eecolDB.isReady();
        if (!isReady) {
            console.error('❌ Database not ready');
            return { success: false, error: 'Database not ready' };
        }

        const records = await window.eecolDB.getAll('cuttingRecords');
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

        await window.eecolDB.add('cuttingRecords', testRecord);
        const verifyRecord = await window.eecolDB.get('cuttingRecords', testRecord.id);
        if (verifyRecord) {
            await window.eecolDB.delete('cuttingRecords', testRecord.id);
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

if (typeof window !== 'undefined') {
    window.testDatabaseConnection = testDatabaseConnection;
}

// IndexedDB Data Operations
async function loadCutRecords() {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            const records = await window.eecolDB.getAll('cuttingRecords');
            if (records && records.length > 0) {
                cutRecords = records.sort((a, b) => b.timestamp - a.timestamp);
                displayedRecordsCount = 0;
                renderCutRecords();
                updateStats();
                updateExportStatus();
                return;
            }
        }

        cutRecords = [];
        displayedRecordsCount = 0;
        renderCutRecords();
        updateStats();
        updateExportStatus();

    } catch (error) {
        console.error("Error loading cut records:", error);
        await showAlert("Error loading cut records. Please refresh the page.", "Loading Error");
    }
}

async function saveCutRecordToDB(record) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            return await window.eecolDB.add('cuttingRecords', record);
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("❌ Error saving cut record:", error);
        throw error;
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
    function setExportDisplay(element, timestamp) {
        if (!element) return;
        element.replaceChildren();

        if (!timestamp) {
            const a = document.createElement('a');
            a.href = '#';
            a.onclick = (e) => { e.preventDefault(); exportJSONBackup(); };
            a.style.color = '#f59e0b';
            a.style.fontWeight = '600';
            a.style.textDecoration = 'underline';
            a.textContent = 'Never exported';
            element.appendChild(a);
            return;
        }

        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        let text = '';
        if (diffDays === 0) {
            text = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } else if (diffDays === 1) {
            text = 'Yesterday';
        } else if (diffDays < 7) {
            text = `${diffDays} days ago`;
        } else {
            text = date.toLocaleDateString();
        }
        element.textContent = text;
    }

    const jsonEl = document.getElementById('lastJsonExport');
    if (window.eecolDB && window.eecolDB.isReady()) {
        window.eecolDB.get('settings', 'lastJsonExport').then((jsonExport) => {
            setExportDisplay(jsonEl, jsonExport?.value);
        }).catch(() => {
            setExportDisplay(jsonEl, null);
        });
    } else {
        setExportDisplay(jsonEl, null);
    }
}

async function updateStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let totalCutsToday = 0;
    let totalLength = 0;
    let fullPicksCount = 0;
    let systemCutsCount = 0;
    const cutterCounts = {};
    const customerCounts = {};

    for (const r of cutRecords) {
        if (r.timestamp >= todayStart) totalCutsToday++;
        totalLength += (r.cutLength || 0);
        if (r.isFullPick === true) fullPicksCount++;
        if (r.isSystemCut === true) systemCutsCount++;
        if (r.cutterName) cutterCounts[r.cutterName] = (cutterCounts[r.cutterName] || 0) + 1;
        if (r.customerName) customerCounts[r.customerName] = (customerCounts[r.customerName] || 0) + 1;
    }

    let topCutter = '-';
    let maxCuts = 0;
    for (const [cutter, count] of Object.entries(cutterCounts)) {
        if (count > maxCuts) { maxCuts = count; topCutter = cutter; }
    }

    let topCustomer = '-';
    let maxCutsCustomer = 0;
    for (const [customer, count] of Object.entries(customerCounts)) {
        if (count > maxCutsCustomer) { maxCutsCustomer = count; topCustomer = customer; }
    }

    const cutsTodayEl = document.getElementById('cutsToday');
    if (cutsTodayEl) cutsTodayEl.textContent = totalCutsToday;
    document.getElementById('totalLength').textContent = totalLength.toFixed(2) + 'm';
    document.getElementById('fullPicksCount').textContent = fullPicksCount;
    document.getElementById('topCutter').textContent = topCutter;
    document.getElementById('topCustomer').textContent = topCustomer;
    document.getElementById('systemCutsCount').textContent = systemCutsCount;
}

function validateInputs() {
    const batchEntryMode = document.getElementById('batchEntryMode').checked;
    if (batchEntryMode) return validateBatchInputs();
    return validateSingleInputs();
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

    if (turnedToLineCode && !(/^[A-Za-z]$/.test(turnedToLineCode) || /^\d{1,3}$/.test(turnedToLineCode))) {
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

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[60] flex flex-col items-center pointer-events-none gap-2 w-full max-w-xs px-4';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `p-3 rounded-xl shadow-2xl text-white text-xs font-bold transition-all duration-300 transform translate-y-10 opacity-0 flex items-center gap-2 pointer-events-auto w-full`;

    switch (type) {
        case 'success': toast.classList.add('bg-green-600'); break;
        case 'error': toast.classList.add('bg-red-600'); break;
        case 'warning': toast.classList.add('bg-amber-600'); break;
        default: toast.classList.add('bg-blue-600'); break;
    }

    toast.textContent = message;
    document.getElementById('toastContainer').appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-[-10px]', 'opacity-0');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3000);
}

// Sync MD3 Chip Button states with underlying hidden checkboxes
function syncMD3ChipState(checkboxId, btnId) {
    const cb = document.getElementById(checkboxId);
    const btn = document.getElementById(btnId);
    if (cb && btn) {
        if (cb.checked) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
}

// Sync Segmented Button Group active state with hidden select
function syncSegmentedGroup(groupId, selectId) {
    const select = document.getElementById(selectId);
    const group = document.getElementById(groupId);
    if (!select || !group) return;

    const val = select.value;
    const btns = group.querySelectorAll('.md3-segmented-btn');
    btns.forEach(btn => {
        if (btn.getAttribute('data-value') === val) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function clearForm() {
    document.getElementById('wireId').value = '';
    document.getElementById('cutLength').value = '';
    document.getElementById('startingMark').value = '';
    document.getElementById('endingMark').value = '';

    const checkboxes = ['singleUnitCut', 'fullPick', 'noMarks', 'systemCut', 'cutInSystem', 'reReel', 'batchEntryMode'];
    checkboxes.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    });

    // Update Chip Button visual states
    syncMD3ChipState('singleUnitCut', 'btnSingleUnitCut');
    syncMD3ChipState('fullPick', 'btnFullPick');
    syncMD3ChipState('noMarks', 'btnNoMarks');
    syncMD3ChipState('systemCut', 'btnSystemCut');
    syncMD3ChipState('cutInSystem', 'btnCutInSystem');
    syncMD3ChipState('reReel', 'btnReReel');
    syncMD3ChipState('batchEntryMode', 'btnBatchEntryMode');

    document.getElementById('lineCode').value = '';
    document.getElementById('turnedToLineCode').value = '';
    document.getElementById('cutterName').value = '';
    document.getElementById('reelSize').value = '';
    document.getElementById('chargeable').value = '';
    document.getElementById('orderComments').value = '';
    document.getElementById('orderNumber').value = '';
    document.getElementById('customerName').value = '';

    // Default Segmented options
    document.getElementById('coilOrReel').value = 'coil';
    syncSegmentedGroup('segGroupCoilOrReel', 'coilOrReel');

    document.getElementById('cutLengthUnit').value = 'm';
    syncSegmentedGroup('segGroupLengthUnit', 'cutLengthUnit');

    editingId = null;
    pendingAutoFillId = null;
    document.getElementById('recordBtn').textContent = '✨ RECORD CUT';
    hideError();

    // Trigger events
    document.getElementById('coilOrReel').dispatchEvent(new Event('change'));
    document.getElementById('singleUnitCut').dispatchEvent(new Event('change'));
    document.getElementById('fullPick').dispatchEvent(new Event('change'));
    document.getElementById('noMarks').dispatchEvent(new Event('change'));
    document.getElementById('systemCut').dispatchEvent(new Event('change'));
    document.getElementById('batchEntryMode').dispatchEvent(new Event('change'));
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
        const chargeable = document.getElementById('chargeable').value;
        const orderComments = document.getElementById('orderComments').value.trim();

        const reelSize = coilOrReel === 'reel' && reelSizeInput ? parseInt(reelSizeInput) : null;

        const isNoMarks = document.getElementById('noMarks').checked;
        const isSystemCut = document.getElementById('systemCut').checked;
        const isCutInSystem = document.getElementById('cutInSystem').checked;
        const isReReel = document.getElementById('reReel')?.checked || false;
        const now = Date.now();
        const existingRecord = editingId ? cutRecords.find(r => r.id === editingId) : null;

        let cutInSystemTimestamp = existingRecord?.cutInSystemTimestamp;
        if (isCutInSystem) {
            if (!existingRecord || existingRecord.isCutInSystem !== true) {
                cutInSystemTimestamp = now;
            }
        } else {
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
            isReReel,
            cutInSystemTimestamp,
            createdAt: existingRecord ? existingRecord.createdAt : now,
            updatedAt: now,
            timestamp: existingRecord ? existingRecord.timestamp : now,
            id: editingId || crypto.randomUUID(),
        };

        saveToHistory();

        if (editingId) {
            cutRecords = cutRecords.map(r => r.id === editingId ? record : r);
            await updateCutRecordInDB(record);
            editingId = null;
        } else {
            cutRecords.push(record);
            await saveCutRecordToDB(record);
        }

        updateStats();

        cutRecords.sort((a, b) => b.timestamp - a.timestamp);

        displayedRecordsCount = 0;
        renderCutRecords();

        const autoCompletedId = pendingAutoFillId;
        clearForm();
        updateButtonStates();

        if (autoCompletedId) {
            await completeWireListItem(autoCompletedId, true);
        }

        await showAlert('Cut record saved successfully!', 'Success');

    } catch (error) {
        console.error('❌ Failed to save single record:', error);
        await showAlert(`Failed to save cut record: ${error.message}`, 'Save Error');
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
            const cutLengthUnit = entry.querySelector('select').value;
            const lineCode = 'L:' + entry.querySelector('input[placeholder="Line Code"]').value.trim().toUpperCase();
            const cutterName = entry.querySelector('input[placeholder="Cutter Name"]').value.trim();
            const coilOrReel = entry.querySelector('.coilOrReelSelect').value;
            const reelSizeInput = entry.querySelector('input[placeholder="Reel Size"]').value.trim();
            const chargeable = entry.querySelector('select:has(option[value="yes"])').value;

            const isSingleUnitCut = entry.querySelector('.batchEntrySingleUnitCut').checked;
            const isFullPick = entry.querySelector('.batchEntryFullPick').checked;
            const isNoMarks = entry.querySelector('.batchEntryNoMarks').checked;
            const isSystemCut = entry.querySelector('.batchEntrySystemCut').checked;

            const startingMarkValue = entry.querySelector('.batchEntryStartingMark').value.trim();
            const startingMark = startingMarkValue !== '' ? parseFloat(startingMarkValue) : null;
            const startingMarkUnit = entry.querySelector('.batchEntryStartingMarkUnit').value;
            const endingMarkValue = entry.querySelector('.batchEntryEndingMark').value.trim();
            const endingMark = endingMarkValue !== '' ? parseFloat(endingMarkValue) : null;

            const reelSize = coilOrReel === 'reel' && reelSizeInput ? parseInt(reelSizeInput) : null;

            const record = {
                wireId,
                cutLength,
                cutLengthUnit,
                startingMark: isFullPick || isNoMarks ? null : startingMark,
                startingMarkUnit: isFullPick || isNoMarks ? null : startingMarkUnit,
                endingMark: isFullPick || isNoMarks ? null : (isSingleUnitCut ? startingMark + cutLength : endingMark),
                lineCode,
                cutterName,
                orderNumber,
                customerName,
                coilOrReel,
                reelSize,
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

        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.bulkPut('cuttingRecords', newRecords, false);
        }

        const autoCompletedId = pendingAutoFillId;
        displayedRecordsCount = 0;
        renderCutRecords();
        updateStats();
        clearForm();
        updateButtonStates();

        if (autoCompletedId) {
            await completeWireListItem(autoCompletedId, true);
        }

        await showAlert(`Successfully saved ${newRecords.length} batch cut records!`);

    } catch (error) {
        console.error('❌ Failed to save batch records:', error);
        await showAlert(`Failed to save batch cut records: ${error.message}`, 'Batch Save Error');
    }
}

function saveToHistory() {
    const currentState = JSON.parse(JSON.stringify(cutRecords));
    undoStack.push(currentState);
    if (undoStack.length > maxHistorySize) undoStack.shift();
    redoStack.length = 0;
}

async function undo() {
    if (undoStack.length === 0) return;
    const currentState = JSON.parse(JSON.stringify(cutRecords));
    redoStack.push(currentState);
    cutRecords = undoStack.pop();

    if (window.eecolDB && await window.eecolDB.isReady()) {
        await window.eecolDB.bulkPut('cuttingRecords', cutRecords, true);
    }

    displayedRecordsCount = 0;
    renderCutRecords();
    updateStats();
    updateButtonStates();
    showAlert('Last action undone.', 'Undo');
}

async function redo() {
    if (redoStack.length === 0) return;
    const currentState = JSON.parse(JSON.stringify(cutRecords));
    undoStack.push(currentState);
    cutRecords = redoStack.pop();

    if (window.eecolDB && await window.eecolDB.isReady()) {
        await window.eecolDB.bulkPut('cuttingRecords', cutRecords, true);
    }

    displayedRecordsCount = 0;
    renderCutRecords();
    updateStats();
    updateButtonStates();
    showAlert('Last undone action restored.', 'Redo');
}

function updateButtonStates() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (undoBtn) undoBtn.disabled = undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;

    const undoBadge = document.getElementById('undoAvailableBadge');
    if (undoBadge) {
        undoBadge.textContent = undoStack.length;
    }
}

async function deleteRecord(id) {
    const confirmResult = await showConfirm('Are you sure you want to delete this cut record?', 'Delete Record');
    if (!confirmResult) return;

    cutRecords = cutRecords.filter(record => record.id !== id);
    await deleteCutRecordFromDB(id);

    displayedRecordsCount = 0;
    renderCutRecords();
    updateStats();
}

function editRecord(id) {
    const record = cutRecords.find(r => r.id === id);
    if (!record) return;

    document.getElementById('wireId').value = record.wireId;
    document.getElementById('cutLength').value = record.cutLength.toString();
    document.getElementById('cutLengthUnit').value = record.cutLengthUnit;
    syncSegmentedGroup('segGroupLengthUnit', 'cutLengthUnit');

    document.getElementById('singleUnitCut').checked = record.isSingleUnitCut || false;
    document.getElementById('fullPick').checked = record.isFullPick || false;
    document.getElementById('noMarks').checked = record.isNoMarks || false;
    document.getElementById('systemCut').checked = !!record.isSystemCut;
    document.getElementById('cutInSystem').checked = !!record.isCutInSystem;

    const reReelEl = document.getElementById('reReel');
    if (reReelEl) reReelEl.checked = !!record.isReReel;

    syncMD3ChipState('singleUnitCut', 'btnSingleUnitCut');
    syncMD3ChipState('fullPick', 'btnFullPick');
    syncMD3ChipState('noMarks', 'btnNoMarks');
    syncMD3ChipState('systemCut', 'btnSystemCut');
    syncMD3ChipState('cutInSystem', 'btnCutInSystem');
    syncMD3ChipState('reReel', 'btnReReel');

    if (record.isFullPick || record.isNoMarks) {
        document.getElementById('startingMark').value = '';
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
    syncSegmentedGroup('segGroupCoilOrReel', 'coilOrReel');

    document.getElementById('reelSize').value = record.reelSize ? record.reelSize.toString() : '';
    document.getElementById('chargeable').value = record.chargeable;
    document.getElementById('orderComments').value = record.orderComments || '';
    editingId = id;
    document.getElementById('recordBtn').textContent = '✨ UPDATE CUT RECORD';

    document.getElementById('singleUnitCut').dispatchEvent(new Event('change'));
    document.getElementById('fullPick').dispatchEvent(new Event('change'));
    document.getElementById('noMarks').dispatchEvent(new Event('change'));
    document.getElementById('systemCut').dispatchEvent(new Event('change'));
    document.getElementById('coilOrReel').dispatchEvent(new Event('change'));
}

function getFilteredRecords() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const filterField = document.getElementById('filterByField').value;
    const dateFromValue = document.getElementById('dateFrom').value;
    const dateToValue = document.getElementById('dateTo').value;
    const dateFrom = dateFromValue ? new Date(dateFromValue).getTime() : null;
    const dateTo = dateToValue ? new Date(dateToValue).getTime() + 86399999 : null;

    return cutRecords.filter(record => {
        if (dateFrom && record.timestamp < dateFrom) return false;
        if (dateTo && record.timestamp > dateTo) return false;

        if (!searchTerm) return true;

        if (filterField !== 'all') {
            const val = record[filterField];
            return val && val.toLowerCase().includes(searchTerm);
        }

        return (record.wireId && record.wireId.toLowerCase().includes(searchTerm)) ||
               (record.orderNumber && record.orderNumber.toLowerCase().includes(searchTerm)) ||
               (record.cutterName && record.cutterName.toLowerCase().includes(searchTerm)) ||
               (record.customerName && record.customerName.toLowerCase().includes(searchTerm));
    });
}

function renderCutRecords() {
    const cutHistoryList = document.getElementById('cutHistoryList');
    const totalRecordsElement = document.getElementById('totalRecordsCount');
    const displayedRecordsElement = document.getElementById('displayedRecordsCount');

    const filteredRecords = getFilteredRecords();
    totalRecordsElement.textContent = filteredRecords.length;

    cutHistoryList.replaceChildren();

    if (filteredRecords.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'text-xs text-gray-500 text-center py-6 italic';
        emptyMsg.textContent = 'No cut records found yet.';
        cutHistoryList.appendChild(emptyMsg);
        displayedRecordsElement.textContent = '0';
        return;
    }

    const recordsToShow = Math.min(displayedRecordsCount + recordsPerPage, filteredRecords.length);
    displayedRecordsCount = recordsToShow;
    displayedRecordsElement.textContent = displayedRecordsCount;

    filteredRecords.slice(0, displayedRecordsCount).forEach(record => {
        const recordDiv = document.createElement('div');
        recordDiv.className = 'cut-record-item';

        const headerP = document.createElement('p');
        headerP.className = 'text-xs font-semibold header-gradient truncate';
        headerP.textContent = `Wire: ${record.wireId} | Cut From ${record.lineCode || 'N/A'} | Order: ${record.orderNumber} | Customer: ${record.customerName}`;
        recordDiv.appendChild(headerP);

        const detailsP = document.createElement('p');
        detailsP.className = 'text-xs text-gray-700 mt-1';
        detailsP.textContent = `Cut Length: ${record.cutLength.toFixed(2)} ${record.cutLengthUnit}`;
        recordDiv.appendChild(detailsP);

        const cutterP = document.createElement('p');
        cutterP.className = 'text-xs text-gray-600 mt-0.5';
        cutterP.textContent = `Cutter: ${record.cutterName} | Package: ${record.coilOrReel || 'Coil'}`;
        recordDiv.appendChild(cutterP);

        const date = fullDateTimeFormat.format(record.timestamp);
        const metaP = document.createElement('p');
        metaP.className = 'text-[10px] text-gray-400 mt-1';
        metaP.textContent = `@ ${date}`;
        recordDiv.appendChild(metaP);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex gap-2 mt-2 pt-1 border-t border-gray-100';

        const editBtn = document.createElement('button');
        editBtn.onclick = () => editRecord(record.id);
        editBtn.className = 'text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold px-2.5 py-1 rounded-lg transition';
        editBtn.textContent = 'Edit';

        const deleteBtn = document.createElement('button');
        deleteBtn.onclick = () => deleteRecord(record.id);
        deleteBtn.className = 'text-xs bg-red-50 text-red-700 hover:bg-red-100 font-semibold px-2.5 py-1 rounded-lg transition';
        deleteBtn.textContent = 'Delete';

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        recordDiv.appendChild(actionsDiv);

        cutHistoryList.appendChild(recordDiv);
    });
}

function setupInfiniteScroll() {
    const cutHistoryList = document.getElementById('cutHistoryList');
    cutHistoryList.addEventListener('scroll', function() {
        if (isLoading || displayedRecordsCount >= cutRecords.length) return;
        if (this.scrollTop + this.clientHeight >= this.scrollHeight - 50) {
            renderCutRecords();
        }
    });
}

// Binds MD3 Chip Button clicks to hidden native checkboxes
function setupMD3Chips() {
    const chipMap = [
        { btn: 'btnSingleUnitCut', cb: 'singleUnitCut' },
        { btn: 'btnFullPick', cb: 'fullPick' },
        { btn: 'btnNoMarks', cb: 'noMarks' },
        { btn: 'btnSystemCut', cb: 'systemCut' },
        { btn: 'btnCutInSystem', cb: 'cutInSystem' },
        { btn: 'btnReReel', cb: 'reReel' },
        { btn: 'btnBatchEntryMode', cb: 'batchEntryMode' }
    ];

    chipMap.forEach(({ btn, cb }) => {
        const btnEl = document.getElementById(btn);
        const cbEl = document.getElementById(cb);
        if (btnEl && cbEl) {
            btnEl.addEventListener('click', () => {
                cbEl.checked = !cbEl.checked;
                syncMD3ChipState(cb, btn);
                cbEl.dispatchEvent(new Event('change', { bubbles: true }));
            });
        }
    });
}

// Binds MD3 Segmented Group buttons to hidden native select elements
function setupMD3SegmentedGroups() {
    const groups = [
        { group: 'segGroupLengthUnit', select: 'cutLengthUnit' },
        { group: 'segGroupCoilOrReel', select: 'coilOrReel' }
    ];

    groups.forEach(({ group, select }) => {
        const groupEl = document.getElementById(group);
        const selectEl = document.getElementById(select);

        if (groupEl && selectEl) {
            const btns = groupEl.querySelectorAll('.md3-segmented-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const val = btn.getAttribute('data-value');
                    selectEl.value = val;
                    syncSegmentedGroup(group, select);
                    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                });
            });
        }
    });
}

// Binds Progressive Disclosure Panels
function setupProgressiveDisclosure() {
    // 1. Package Type (Coil vs Reel) progressive disclosure panel
    const coilOrReelSelect = document.getElementById('coilOrReel');
    const reelPanel = document.getElementById('reelDetailsPanel');

    if (coilOrReelSelect && reelPanel) {
        coilOrReelSelect.addEventListener('change', (e) => {
            if (e.target.value === 'reel') {
                reelPanel.classList.remove('hidden');
            } else {
                reelPanel.classList.add('hidden');
            }
        });
    }

    // 2. Optional Details Progressive Accordion
    const toggleBtn = document.getElementById('toggleOptionalDetails');
    const contentPanel = document.getElementById('optionalDetailsContent');
    const chevron = document.getElementById('optionalDetailsChevron');

    if (toggleBtn && contentPanel) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = contentPanel.classList.contains('hidden');
            if (isHidden) {
                contentPanel.classList.remove('hidden');
                if (chevron) chevron.textContent = '▼';
            } else {
                contentPanel.classList.add('hidden');
                if (chevron) chevron.textContent = '►';
            }
        });
    }
}

// Event Listeners Initialization
document.addEventListener('DOMContentLoaded', async function() {
    if (typeof EECOLIndexedDB !== 'undefined' && !window.eecolDB) {
        try {
            window.eecolDB = EECOLIndexedDB.getInstance();
            await window.eecolDB.ready;
        } catch (error) {
            console.error('Failed to initialize database:', error);
        }
    }

    if (typeof initModalSystem === 'function') {
        initModalSystem();
    }

    // Setup MD3 UI glue
    setupMD3Chips();
    setupMD3SegmentedGroups();
    setupProgressiveDisclosure();

    // Event handlers for core inputs & buttons
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) recordBtn.addEventListener('click', saveCutRecord);

    const clearFormBtn = document.getElementById('clearFormBtn');
    if (clearFormBtn) clearFormBtn.addEventListener('click', clearForm);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            displayedRecordsCount = 0;
            renderCutRecords();
        }, 250));
    }

    const filterByField = document.getElementById('filterByField');
    if (filterByField) filterByField.addEventListener('change', () => renderCutRecords());

    setupInfiniteScroll();
    loadCutRecords();
    updateButtonStates();
});
