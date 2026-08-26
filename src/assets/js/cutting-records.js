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

    document.getElementById('coilOrReel').value = 'coil';
    syncSegmentedGroup('segGroupCoilOrReel', 'coilOrReel');

    document.getElementById('cutLengthUnit').value = 'm';
    syncSegmentedGroup('segGroupLengthUnit', 'cutLengthUnit');

    editingId = null;
    pendingAutoFillId = null;
    document.getElementById('recordBtn').textContent = '✨ RECORD CUT';
    hideError();

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

    const batchUndoBtn = document.getElementById('batchUndoBtn');
    const batchRedoBtn = document.getElementById('batchRedoBtn');
    if (batchUndoBtn) batchUndoBtn.disabled = batchUndoStack.length === 0;
    if (batchRedoBtn) batchRedoBtn.disabled = batchRedoStack.length === 0;
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
    if (!cutHistoryList) return;
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

// Binds Progressive Disclosure Panels & Accordions
function setupProgressiveDisclosure() {
    // Coil vs Reel details panel toggle
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

    // Optional Details Accordion
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

    // Quick Statistics Accordion Toggle
    const toggleStatsBtn = document.getElementById('toggleStats');
    const statsContent = document.getElementById('statsContent');
    const statsToggle = document.getElementById('statsToggle');
    if (toggleStatsBtn && statsContent && statsToggle) {
        toggleStatsBtn.addEventListener('click', () => {
            const isHidden = statsContent.classList.contains('hidden');
            if (isHidden) {
                statsContent.classList.remove('hidden');
                statsToggle.textContent = '▼';
            } else {
                statsContent.classList.add('hidden');
                statsToggle.textContent = '►';
            }
        });
    }

    // Quick Calculators Accordion Toggle
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

    // Data Management Controls Accordion Toggle
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
}

// Binds Quick Calculator functionality
function setupQuickCalculators() {
    const calcMarkDiffBtn = document.getElementById('calcMarkDiff');
    if (calcMarkDiffBtn) {
        calcMarkDiffBtn.addEventListener('click', function() {
            const startMark = parseFloat(document.getElementById('quickStartMark').value);
            const endMark = parseFloat(document.getElementById('quickEndMark').value);
            const unit = document.getElementById('quickMarkUnit').value;
            const resultEl = document.getElementById('markDiffResult');

            if (isNaN(startMark) || isNaN(endMark)) {
                resultEl.textContent = 'Please enter valid marks';
                resultEl.classList.remove('hidden');
                return;
            }

            let difference = Math.abs(endMark - startMark);
            if (unit === 'm') {
                resultEl.textContent = `📏 Length: ${difference.toFixed(2)} meters (${(difference * 3.28084).toFixed(2)} ft)`;
            } else {
                resultEl.textContent = `📏 Length: ${difference.toFixed(2)} feet (${(difference * 0.3048).toFixed(2)} m)`;
            }
            resultEl.classList.remove('hidden');
        });
    }

    const calcStopMarkBtn = document.getElementById('calcStopMark');
    if (calcStopMarkBtn) {
        calcStopMarkBtn.addEventListener('click', function() {
            const startMark = parseFloat(document.getElementById('quickStopStart').value);
            const cutLength = parseFloat(document.getElementById('quickStopLength').value);
            const unit = document.getElementById('quickStopUnit').value;
            const countDown = document.getElementById('quickCountDown').checked;
            const resultEl = document.getElementById('stopMarkResult');

            if (isNaN(startMark) || isNaN(cutLength) || cutLength <= 0) {
                resultEl.textContent = 'Please enter valid positive values';
                resultEl.classList.remove('hidden');
                return;
            }

            let stopMark = countDown ? startMark - cutLength : startMark + cutLength;
            if (unit === 'm') {
                resultEl.textContent = `🛑 Stop mark: ${stopMark.toFixed(2)} meters (${(stopMark * 3.28084).toFixed(2)} ft)`;
            } else {
                resultEl.textContent = `🛑 Stop mark: ${stopMark.toFixed(2)} feet (${(stopMark * 0.3048).toFixed(2)} m)`;
            }
            resultEl.classList.remove('hidden');
        });
    }
}

// Binds Batch Mode logic & dynamic entry generation
function setupBatchMode() {
    const batchEntryModeCheckbox = document.getElementById('batchEntryMode');
    const singleCutForm = document.getElementById('singleCutForm');
    const batchCutForm = document.getElementById('batchCutForm');
    const wireIdContainer = document.getElementById('wireIdContainer');

    if (batchEntryModeCheckbox && singleCutForm && batchCutForm && wireIdContainer) {
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
    }

    const batchCutList = document.getElementById('batchCutList');
    const addBatchCutBtn = document.getElementById('addBatchCutBtn');

    function createBatchCutEntry(data = {}) {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'p-3 border border-gray-200 rounded-xl space-y-2 bg-gray-50/50';

        entryDiv.innerHTML = `
            <div class="flex flex-wrap gap-2 items-center">
                <input type="text" placeholder="Wire Type/ID" class="p-1.5 border border-gray-300 rounded-lg text-xs flex-grow font-semibold uppercase" />
                <input type="number" placeholder="Cut Length" class="p-1.5 border border-gray-300 rounded-lg text-xs w-20 font-semibold" />
                <select class="p-1.5 border border-gray-300 rounded-lg text-xs w-24 bg-white">
                    <option value="m">Meters (m)</option>
                    <option value="ft">Feet (ft)</option>
                </select>
                <input type="text" placeholder="Line Code" maxlength="3" class="p-1.5 border border-gray-300 rounded-lg text-xs w-20 font-mono uppercase" />
                <input type="text" placeholder="Cutter Name" class="p-1.5 border border-gray-300 rounded-lg text-xs w-28 uppercase" />
                <button type="button" class="removeBatchCutBtn px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold">Remove</button>
            </div>
            <div class="flex flex-wrap gap-2 items-center text-xs">
                <input type="number" placeholder="Start Mark" class="batchEntryStartingMark p-1.5 border border-gray-300 rounded-lg text-xs w-24" />
                <select class="batchEntryStartingMarkUnit p-1.5 border border-gray-300 rounded-lg text-xs w-16 bg-white">
                    <option value="m">m</option>
                    <option value="ft">ft</option>
                </select>
                <input type="number" placeholder="End Mark" class="batchEntryEndingMark p-1.5 border border-gray-300 rounded-lg text-xs w-24" />
                <select class="batchEntryEndingMarkUnit p-1.5 border border-gray-300 rounded-lg text-xs w-16 bg-white">
                    <option value="m">m</option>
                    <option value="ft">ft</option>
                </select>
                <select class="coilOrReelSelect p-1.5 border border-gray-300 rounded-lg text-xs w-24 bg-white">
                    <option value="coil">Coil</option>
                    <option value="reel">Reel</option>
                </select>
                <input type="number" placeholder="Reel Size" class="p-1.5 border border-gray-300 rounded-lg text-xs w-20 bg-gray-100" disabled />
                <select class="p-1.5 border border-gray-300 rounded-lg text-xs w-24 bg-gray-100" disabled>
                    <option value="">Chargeable?</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </select>
            </div>
            <div class="flex flex-wrap gap-3 items-center text-xs pt-1 border-t border-gray-200/60">
                <label class="flex items-center gap-1"><input type="checkbox" class="batchEntrySingleUnitCut text-blue-600 rounded"> Single Unit</label>
                <label class="flex items-center gap-1"><input type="checkbox" class="batchEntryFullPick text-blue-600 rounded"> Full Pick</label>
                <label class="flex items-center gap-1"><input type="checkbox" class="batchEntryNoMarks text-blue-600 rounded"> No Marks</label>
                <label class="flex items-center gap-1"><input type="checkbox" class="batchEntrySystemCut text-blue-600 rounded"> System Cut</label>
            </div>
        `;

        if (data.wireId) entryDiv.querySelector('input[placeholder="Wire Type/ID"]').value = data.wireId;
        if (data.cutLength) entryDiv.querySelector('input[placeholder="Cut Length"]').value = data.cutLength;

        entryDiv.querySelector('.removeBatchCutBtn').addEventListener('click', () => {
            if (batchCutList) batchCutList.removeChild(entryDiv);
        });

        return entryDiv;
    }

    if (addBatchCutBtn && batchCutList) {
        addBatchCutBtn.addEventListener('click', () => {
            batchCutList.appendChild(createBatchCutEntry());
        });
        if (batchCutList.children.length === 0) {
            batchCutList.appendChild(createBatchCutEntry());
        }
    }
}

// Binds Data Management Controls (Exports, Imports, Print)
function setupDataManagementControls() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportToCSV);

    const exportDeltaBtn = document.getElementById('exportDeltaBtn');
    if (exportDeltaBtn) exportDeltaBtn.addEventListener('click', exportDeltaToCSV);

    const exportJSONBtn = document.getElementById('exportJSONBtn');
    if (exportJSONBtn) exportJSONBtn.addEventListener('click', exportJSONBackup);

    const importJSONBtn = document.getElementById('importJSONBtn');
    const jsonFileInput = document.getElementById('jsonFileInput');
    if (importJSONBtn && jsonFileInput) {
        importJSONBtn.addEventListener('click', () => jsonFileInput.click());
        jsonFileInput.addEventListener('change', importJSONBackup);
    }

    const printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.addEventListener('click', () => printRecords());

    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllRecords);
}

// CSV / JSON Exports
function escapeCSVValue(value) {
    if (value === null || value === undefined) return '';
    let stringValue = value.toString();
    if (['=', '+', '-', '@'].some(char => stringValue.startsWith(char))) {
        stringValue = "'" + stringValue;
    }
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
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
        'cut from line code', 'cuttername', 'ordernumber', 'customername', 'coilorreel', 'reelsize', 'quantity', 'chargeable', 'ordercomments'
    ];

    const rows = cutRecords.map(r => [
        escapeCSVValue(r.id), escapeCSVValue(r.wireId), escapeCSVValue(r.cutLength), escapeCSVValue(r.cutLengthUnit),
        escapeCSVValue(r.startingMark), escapeCSVValue(r.startingMarkUnit), escapeCSVValue(r.endingMark), escapeCSVValue(r.endingMarkUnit),
        escapeCSVValue(r.lineCode), escapeCSVValue(r.cutterName), escapeCSVValue(r.orderNumber), escapeCSVValue(r.customerName),
        escapeCSVValue(r.coilOrReel), escapeCSVValue(r.reelSize), escapeCSVValue(1), escapeCSVValue(r.chargeable), escapeCSVValue(r.orderComments)
    ]);

    const csvContent = '\uFEFF' + [header, ...rows].map(e => e.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cut_records_${cutRecords.length}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

async function exportDeltaToCSV() {
    if (cutRecords.length === 0) {
        await showAlert('No cut records to export.', 'No Records');
        return;
    }
    await exportToCSV();
}

async function exportJSONBackup() {
    const backup = {
        records: cutRecords,
        wireCutList: wireCutList,
        timestamp: Date.now(),
        version: '0.8.0.5',
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eecol_json_backup_${cutRecords.length}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    await showAlert('JSON backup exported successfully!', 'Backup Success');
}

async function importJSONBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const backupData = JSON.parse(e.target?.result);
            if (!backupData.records || !Array.isArray(backupData.records)) {
                await showAlert('Invalid backup file format.', 'Import Error');
                return;
            }

            cutRecords = backupData.records;
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.bulkPut('cuttingRecords', cutRecords, true);
            }
            displayedRecordsCount = 0;
            renderCutRecords();
            updateStats();
            await showAlert(`Successfully imported ${cutRecords.length} records!`, 'Import Success');
        } catch (err) {
            await showAlert('Failed to import JSON file.', 'Import Error');
        }
    };
    reader.readAsText(file);
}

function printRecords() {
    window.print();
}

async function clearAllRecords() {
    const confirmResult = await showConfirm('Are you sure you want to clear ALL cut records? This cannot be undone.', 'Clear All Records');
    if (!confirmResult) return;
    saveToHistory();
    cutRecords = [];
    await clearAllCutRecordsFromDB();
    renderCutRecords();
    updateStats();
    showToast('All records cleared successfully.', 'info');
}

// Global Event Listeners Initialization
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

    setupMD3Chips();
    setupMD3SegmentedGroups();
    setupProgressiveDisclosure();
    setupQuickCalculators();
    setupBatchMode();
    setupDataManagementControls();

    // Field Disabled State Handlers
    const coilOrReelSelect = document.getElementById('coilOrReel');
    if (coilOrReelSelect) {
        coilOrReelSelect.addEventListener('change', (e) => {
            const isReel = e.target.value === 'reel';
            const reelSizeInput = document.getElementById('reelSize');
            const chargeableSelect = document.getElementById('chargeable');
            const importBtn = document.getElementById('importFromEstimatorBtn');

            if (reelSizeInput) reelSizeInput.disabled = !isReel;
            if (chargeableSelect) chargeableSelect.disabled = !isReel;
            if (importBtn) importBtn.disabled = !isReel;
        });
    }

    const noMarksCheckbox = document.getElementById('noMarks');
    if (noMarksCheckbox) {
        noMarksCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const startMark = document.getElementById('startingMark');
            const endMark = document.getElementById('endingMark');
            const startUnit = document.getElementById('startingMarkUnit');
            if (startMark) startMark.disabled = isChecked;
            if (endMark) endMark.disabled = isChecked;
            if (startUnit) startUnit.disabled = isChecked;
        });
    }

    const systemCutCheckbox = document.getElementById('systemCut');
    if (systemCutCheckbox) {
        systemCutCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const orderNum = document.getElementById('orderNumber');
            const custName = document.getElementById('customerName');
            if (orderNum) orderNum.disabled = isChecked;
            if (custName) custName.disabled = isChecked;
        });
    }

    const singleUnitCutCheckbox = document.getElementById('singleUnitCut');
    if (singleUnitCutCheckbox) {
        singleUnitCutCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const cutLengthInput = document.getElementById('cutLength');
            const endMarkInput = document.getElementById('endingMark');
            if (isChecked) {
                if (cutLengthInput) cutLengthInput.value = '1';
                if (endMarkInput) endMarkInput.disabled = true;
            } else {
                if (endMarkInput) endMarkInput.disabled = false;
            }
        });
    }

    // Single Cut Record action buttons
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) recordBtn.addEventListener('click', saveCutRecord);

    const clearFormBtn = document.getElementById('clearFormBtn');
    if (clearFormBtn) clearFormBtn.addEventListener('click', clearForm);

    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.addEventListener('click', undo);

    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) redoBtn.addEventListener('click', redo);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault(); undo();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'Z' && e.shiftKey))) {
            e.preventDefault(); redo();
        }
    });

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
