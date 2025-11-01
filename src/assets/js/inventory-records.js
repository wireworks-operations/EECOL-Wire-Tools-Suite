/**
 * EECOL Wire Inventory Records Tool - JavaScript Module
 * IndexedDB implementation for inventory data persistence
 */

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
        const records = await window.eecolDB.getAll('inventoryRecords');

        // Test adding a temporary record
        const testRecord = {
            id: 'test-' + Date.now(),
            wireType: 'TEST',
            inventoryDate: new Date().toISOString().split('T')[0],
            personName: 'TEST',
            productCode: 'TEST',
            lineCode: 'L:001',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            timestamp: Date.now()
        };

        const addResult = await window.eecolDB.add('inventoryRecords', testRecord);

        // Verify the record was added
        const verifyRecord = await window.eecolDB.get('inventoryRecords', testRecord.id);
        if (verifyRecord) {
            // Clean up test record
            await window.eecolDB.delete('inventoryRecords', testRecord.id);
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

// Global variables
let inventoryItems = [];
let editingId = null;
let currentView = 'inventory';
let displayedItemsCount = 0;
let itemsPerPage = 25;
let isLoading = false;
let currentSortField = 'timestamp';
let lastDeltaExport = null;
// Undo/Redo system
let operationHistory = [];
let undoStack = [];
let isUndoRedoOperation = false; // Flag to prevent history recording during undo/redo

// IndexedDB-based data loading and saving functions
async function loadInventoryItems() {
    try {
        // Load from IndexedDB
        if (window.eecolDB && await window.eecolDB.isReady()) {
            const records = await window.eecolDB.getAll('inventoryRecords');

            if (records && records.length > 0) {
                // Sanitize and validate loaded data
                inventoryItems = records.map((item, index) => {
                    // Ensure timestamps are numbers, not strings
                    if (item.timestamp && typeof item.timestamp === 'string') {
                        item.timestamp = parseInt(item.timestamp) || Date.now();
                    }
                    if (item.reviewedTimestamp && typeof item.reviewedTimestamp === 'string') {
                        item.reviewedTimestamp = parseInt(item.reviewedTimestamp) || null;
                    }
                    if (item.createdAt && typeof item.createdAt === 'string') {
                        item.createdAt = parseInt(item.createdAt) || Date.now();
                    }
                    if (item.updatedAt && typeof item.updatedAt === 'string') {
                        item.updatedAt = parseInt(item.updatedAt) || Date.now();
                    }

                    // Ensure reviewed field exists
                    if (item.reviewed === undefined) {
                        item.reviewed = false;
                    }

                    // Ensure reviewedTimestamp exists for reviewed items
                    if (item.reviewed && !item.reviewedTimestamp) {
                        item.reviewedTimestamp = item.timestamp || Date.now();
                    }

                    return item;
                }).sort((a, b) => b.timestamp - a.timestamp);

                displayedItemsCount = 0;
                try {
                    renderInventoryItems();
                } catch (renderError) {
                    console.error('❌ Error in renderInventoryItems:', renderError);
                }
                try {
                    updateExportStatus();
                } catch (exportError) {
                    console.error('❌ Error in updateExportStatus:', exportError);
                }
                return;
            }
        }

        // Fresh database starts empty
        inventoryItems = [];
        displayedItemsCount = 0;
        renderInventoryItems();
        updateExportStatus();

    } catch (error) {
        console.error("❌ Error loading inventory items:", error);
        await showAlert("Error loading inventory items. Please refresh the page.", "Loading Error");
    }
}

async function saveInventoryStateToDB() {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            // Clear existing records
            await window.eecolDB.clear('inventoryRecords');
            // Add all current records
            for (const item of inventoryItems) {
                await window.eecolDB.add('inventoryRecords', item);
            }
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("Error saving inventory state:", error);
        throw error;
    }
}

async function saveInventoryItemToDB(item) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            const result = await window.eecolDB.add('inventoryRecords', item);

            // Verify the save worked
            const verification = await window.eecolDB.get('inventoryRecords', item.id);
            if (!verification) {
                console.error("❌ Save verification failed for record:", item.id);
            }

            return result;
        } else {
            console.error("❌ Database not available or not ready");
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("❌ Error saving inventory item:", error);
        throw error;
    }
}

async function updateInventoryItemInDB(item) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.update('inventoryRecords', item);
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("Error updating inventory item:", error);
        throw error;
    }
}

function validateInputs() {
    // Check required fields
    const personName = document.getElementById('personName').value.trim();
    if (!personName) {
        showError("Name is required.");
        return false;
    }

    const productCode = document.getElementById('productCode').value.trim();
    if (!productCode) {
        showError("Product code is required.");
        return false;
    }

    const reason = document.getElementById('reason').value;
    if (!reason) {
        showError("Reason is required.");
        return false;
    }

    const lineCode = document.getElementById('lineCode').value.trim();
    if (!lineCode) {
        showError("Line code is required.");
        return false;
    }

    // Check that both current and actual length are provided and valid
    const currentLength = document.getElementById('currentLength').value.trim();
    const actualLength = document.getElementById('actualLength').value.trim();

    if (!currentLength || isNaN(parseFloat(currentLength)) || parseFloat(currentLength) <= 0) {
        showError("Current Length is required and must be a valid positive number.");
        return false;
    }

    if (!actualLength || isNaN(parseFloat(actualLength)) || parseFloat(actualLength) < 0) {
        showError("Actual Length is required and must be a valid number (0 or greater allowed for no remaining wire).");
        return false;
    }

    // Check that note field is provided
    const note = document.getElementById('note').value;
    if (!note) {
        showError("Note is required.");
        return false;
    }

    // If custom note is selected, ensure custom text is provided
    if (note === 'custom') {
        const customNoteText = document.getElementById('noteCustom').value.trim();
        if (!customNoteText) {
            showError("Custom note text is required when 'Custom' is selected.");
            return false;
        }
    }

    return true;
}

function handleReasonChange() {
    const reasonSelect = document.getElementById('reason');
    const customReasonInput = document.getElementById('reasonCustom');

    if (reasonSelect.value === 'custom') {
        customReasonInput.style.display = 'block';
    } else {
        customReasonInput.style.display = 'none';
        customReasonInput.value = '';
    }
}

function handleNoteChange() {
    const noteSelect = document.getElementById('note');
    const customNoteInput = document.getElementById('noteCustom');

    if (noteSelect.value === 'custom') {
        customNoteInput.style.display = 'block';
    } else {
        customNoteInput.style.display = 'none';
        customNoteInput.value = '';
    }
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorBox').classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorBox').classList.add('hidden');
}

function clearForm() {
    // Clear all form fields
    document.getElementById('inventoryDate').value = '';
    document.getElementById('personName').value = '';
    document.getElementById('reason').value = '';
    handleReasonChange(); // Reset the reason dropdown UI
    document.getElementById('reasonCustom').value = '';
    document.getElementById('note').value = '';
    handleNoteChange(); // Reset the note dropdown UI
    document.getElementById('noteCustom').value = '';
    document.getElementById('productCode').value = '';
    document.getElementById('coilCode').value = '';
    document.getElementById('currentLength').value = '';
    document.getElementById('actualLength').value = '';
    document.getElementById('averageCost').value = '';
    document.getElementById('costUnit').value = '$';
    document.getElementById('totalValue').value = '';
    document.getElementById('lineCode').value = '';
    document.getElementById('adjustCB').checked = false;
    document.getElementById('approvedCB').checked = false;
    document.getElementById('notApprovedCB').checked = false;
    document.getElementById('inventoryComments').value = '';
    document.getElementById('inaNumber').value = '';
    document.getElementById('inaDate').value = '';

    editingId = null;
    document.getElementById('recordBtn').textContent = 'ADD TO INVENTORY';
    hideError();
}

// Helper function to record an operation for undo
function recordOperation(operation) {
    // Only record if not currently in undo/redo operation
    if (!isUndoRedoOperation) {
        operationHistory.push(operation);
        updateUndoRedoButtons();
    }
}

// Function to update undo/redo button states
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (operationHistory.length > 0) {
        undoBtn.disabled = false;
    } else {
        undoBtn.disabled = true;
    }

    if (undoStack.length > 0) {
        redoBtn.disabled = false;
    } else {
        redoBtn.disabled = true;
    }
}

// Undo the last operation
async function undoLastOperation() {
    if (operationHistory.length === 0) return;

    isUndoRedoOperation = true;

    const lastOperation = operationHistory.pop();
    undoStack.push(lastOperation);

    // Reverse the operation
    if (lastOperation.type === 'add') {
        // Undo add: remove the added item
        inventoryItems = inventoryItems.filter(item => item.id !== lastOperation.id);
    } else if (lastOperation.type === 'delete') {
        // Undo delete: restore the deleted item
        inventoryItems.push(lastOperation.deletedItem);
    } else if (lastOperation.type === 'edit') {
        // Undo edit: restore the original item
        const index = inventoryItems.findIndex(item => item.id === lastOperation.id);
        if (index !== -1) {
            inventoryItems[index] = { ...lastOperation.originalItem };
        }
    }

    // Update database
    await saveInventoryStateToDB();

    displayedItemsCount = 0;
    renderInventoryItems();
    updateUndoRedoButtons();

    isUndoRedoOperation = false;
}

// Redo the last undone operation
async function redoLastOperation() {
    if (undoStack.length === 0) return;

    isUndoRedoOperation = true;

    const lastUndoneOperation = undoStack.pop();
    operationHistory.push(lastUndoneOperation);

    // Reapply the operation
    if (lastUndoneOperation.type === 'add') {
        // Redo add: add back the full item data stored in the operation
        if (lastUndoneOperation.fullItem) {
            inventoryItems.push(lastUndoneOperation.fullItem);
        } else {
            await showAlert('Full item data not available for redo operation. Please add the item again.', 'Redo Error');
        }
    } else if (lastUndoneOperation.type === 'delete') {
        // Redo delete: delete the item again
        inventoryItems = inventoryItems.filter(item => item.id !== lastUndoneOperation.id);
    } else if (lastUndoneOperation.type === 'edit') {
        // Redo edit: restore the edited item
        if (lastUndoneOperation.newItem) {
            const index = inventoryItems.findIndex(item => item.id === lastUndoneOperation.id);
            if (index !== -1) {
                inventoryItems[index] = lastUndoneOperation.newItem;
            } else {
                await showAlert('Item not found for redo edit operation.', 'Redo Error');
            }
        } else {
            await showAlert('Edit item data not available for redo operation.', 'Redo Error');
        }
    }

    inventoryItems.sort((a, b) => b.timestamp - a.timestamp);

    // Update database
    await saveInventoryStateToDB();

    displayedItemsCount = 0;
    renderInventoryItems();
    updateUndoRedoButtons();

    isUndoRedoOperation = false;
}

async function saveInventoryItem() {
    if (!validateInputs()) {
        return;
    }

    hideError();

    const inventoryDate = document.getElementById('inventoryDate').value || new Date().toISOString().split('T')[0];
    const personName = document.getElementById('personName').value.trim().toUpperCase();

    // Handle the reason field logic
    let reason = '';
    const reasonSelect = document.getElementById('reason');
    const customReasonInput = document.getElementById('reasonCustom');
    if (reasonSelect.value === 'custom') {
        reason = customReasonInput.value.trim();
    } else {
        reason = reasonSelect.value;
    }

    // Handle the note field logic
    let note = '';
    const noteSelect = document.getElementById('note');
    const customNoteInput = document.getElementById('noteCustom');
    if (noteSelect.value === 'custom') {
        note = customNoteInput.value.trim();
    } else {
        note = noteSelect.value;
    }

    const productCode = document.getElementById('productCode').value.trim().toUpperCase();
    const coilCode = document.getElementById('coilCode').value.trim().toUpperCase();
    const currentLength = parseFloat(document.getElementById('currentLength').value) || 0;
    const currentLengthUnit = document.getElementById('currentLengthUnit').value;
    const actualLength = parseFloat(document.getElementById('actualLength').value) || 0;
    const actualLengthUnit = document.getElementById('actualLengthUnit').value;
    const averageCost = parseFloat(document.getElementById('averageCost').value) || 0;
    const costUnit = document.getElementById('costUnit').value;
    const totalValue = parseFloat(document.getElementById('totalValue').value) || 0;
    const lineCode = document.getElementById('lineCode').value.trim().toUpperCase();
    const adjust = document.getElementById('adjustCB').checked;
    let approved = null;
    if (document.getElementById('approvedCB').checked) {
        approved = true;
    } else if (document.getElementById('notApprovedCB').checked) {
        approved = false;
    } else {
        approved = null;
    }
    const inventoryComments = document.getElementById('inventoryComments').value.trim();
    const inaNumber = document.getElementById('inaNumber').value;
    const inaDate = document.getElementById('inaDate').value;

    const now = Date.now();
    const existingItem = editingId ? inventoryItems.find(i => i.id === editingId) : null;

    const item = {
        wireType: 'INVENTORY',
        inventoryDate,
        personName,
        reason,
        productCode,
        coilCode,
        currentLength,
        currentLengthUnit,
        actualLength,
        actualLengthUnit,
        averageCost,
        costUnit,
        totalValue,
        lineCode,
        adjust,
        approved,
        inventoryComments,
        inaNumber,
        inaDate,
        note,
        reviewed: existingItem ? existingItem.reviewed : false,
        reviewedTimestamp: existingItem ? existingItem.reviewedTimestamp : null,
        createdAt: existingItem ? existingItem.createdAt : now,
        updatedAt: now,
        timestamp: existingItem ? existingItem.timestamp : now,
        id: editingId || crypto.randomUUID(),
    };

    // Store editing ID before clearing for scrolling
    const wasEditingId = editingId;
    let operation = null;

    try {
        if (editingId) {
            // Store the original item before editing for undo
            const originalItem = inventoryItems.find(i => i.id === editingId);
            inventoryItems = inventoryItems.map(i => i.id === editingId ? item : i);
            await updateInventoryItemInDB(item);
            editingId = null;
            operation = { type: 'edit', id: item.id, originalItem: { ...originalItem }, newItem: { ...item } };
        } else {
            inventoryItems.push(item);
            await saveInventoryItemToDB(item);
            operation = { type: 'add', id: item.id, fullItem: { ...item } };
        }

        inventoryItems.sort((a, b) => b.timestamp - a.timestamp);

        // Record operation for undo
        if (operation) {
            recordOperation(operation);
        }

        displayedItemsCount = 0;
        renderInventoryItems();

        // Scroll to edited item if we were editing
        if (wasEditingId) {
            setTimeout(() => {
                const editedItemElement = document.querySelector(`button[onclick*="editItem('${wasEditingId}')"]`);
                if (editedItemElement) {
                    editedItemElement.closest('.inventory-item').scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }

        clearForm();
        await showAlert('Inventory item saved successfully!', 'Success');
    } catch (error) {
        console.error('Error saving inventory item:', error);
        await showAlert(`Failed to save inventory item: ${error.message}\n\nPlease check the browser console for more details.`, 'Save Error');
    }
}

async function deleteInventoryItem(id) {
    const confirmResult = await showConfirm('Are you sure you want to delete this inventory item? This action cannot be undone.', 'Delete Item');
    if (!confirmResult) return;

    const deletedItem = inventoryItems.find(item => item.id === id);
    inventoryItems = inventoryItems.filter(item => item.id !== id);

    try {
        await deleteInventoryItemFromDB(id);

        // Record operation for undo
        recordOperation({ type: 'delete', id, deletedItem: { ...deletedItem } });

        displayedItemsCount = 0;
        renderInventoryItems();
    } catch (error) {
        // Restore item on error
        if (deletedItem) inventoryItems.push(deletedItem);
        console.error('Error deleting inventory item:', error);
        await showAlert(`Failed to delete inventory item: ${error.message}`, 'Delete Error');
    }
}

async function editInventoryItem(id) {
    const item = inventoryItems.find(i => i.id === id);
    if (!item) {
        await showAlert('Item not found.', 'Edit Error');
        return;
    }

    // Populate all the new fields when editing
    document.getElementById('inventoryDate').value = item.inventoryDate || '';
    document.getElementById('personName').value = item.personName || '';

    // Handle reason field for editing - check if it's a predefined option or custom
    const reasonSelect = document.getElementById('reason');
    const customReasonInput = document.getElementById('reasonCustom');
    if (item.reason === 'discrepancy') {
        reasonSelect.value = 'discrepancy';
        customReasonInput.style.display = 'none';
        customReasonInput.value = '';
    } else if (item.reason) {
        // Any other reason goes to custom
        reasonSelect.value = 'custom';
        customReasonInput.style.display = 'block';
        customReasonInput.value = item.reason;
    } else {
        reasonSelect.value = '';
        customReasonInput.style.display = 'none';
        customReasonInput.value = '';
    }

    // Handle note field for editing
    const noteSelect = document.getElementById('note');
    const customNoteInput = document.getElementById('noteCustom');
    if (item.note === 'tail end' || item.note === 'damaged') {
        noteSelect.value = item.note;
        customNoteInput.style.display = 'none';
        customNoteInput.value = '';
    } else if (item.note) {
        // Any other note goes to custom
        noteSelect.value = 'custom';
        customNoteInput.style.display = 'block';
        customNoteInput.value = item.note;
    } else {
        noteSelect.value = '';
        customNoteInput.style.display = 'none';
        customNoteInput.value = '';
    }

    document.getElementById('productCode').value = item.productCode || '';
    document.getElementById('coilCode').value = item.coilCode || '';
    document.getElementById('currentLength').value = item.currentLength ? item.currentLength.toString() : '';
    document.getElementById('currentLengthUnit').value = item.currentLengthUnit || 'm';
    document.getElementById('actualLength').value = item.actualLength ? item.actualLength.toString() : '';
    document.getElementById('actualLengthUnit').value = item.actualLengthUnit || 'm';
    document.getElementById('averageCost').value = item.averageCost ? item.averageCost.toString() : '';
    document.getElementById('costUnit').value = item.costUnit || '$';
    document.getElementById('totalValue').value = item.totalValue ? item.totalValue.toString() : '';
    document.getElementById('lineCode').value = item.lineCode || '';
    document.getElementById('adjustCB').checked = item.adjust || false;
    if (item.approved === true) {
        document.getElementById('approvedCB').checked = true;
        document.getElementById('notApprovedCB').checked = false;
    } else if (item.approved === false) {
        document.getElementById('approvedCB').checked = false;
        document.getElementById('notApprovedCB').checked = true;
    } else {
        document.getElementById('approvedCB').checked = false;
        document.getElementById('notApprovedCB').checked = false;
    }
    document.getElementById('inventoryComments').value = item.inventoryComments || '';
    document.getElementById('inaNumber').value = item.inaNumber || '';
    document.getElementById('inaDate').value = item.inaDate || '';
    editingId = id;
    document.getElementById('recordBtn').textContent = 'UPDATE ITEM';

    item.scrollIntoView();
}

function getFilteredInventoryItems() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const filterField = document.getElementById('filterByField').value;
    const filterValue = document.querySelector('input[name="filterDamaged"]:checked').value;
    const dateFromValue = document.getElementById('dateFrom').value;
    const dateToValue = document.getElementById('dateTo').value;
    const dateFrom = dateFromValue ? new Date(dateFromValue).getTime() : null;
    const dateTo = dateToValue ? new Date(dateToValue).getTime() + 86399999 : null; // Include entire day

    let filtered = inventoryItems.filter(item => {
        // Date filtering
        if (dateFrom && new Date(item.inventoryDate).getTime() < dateFrom) return false;
        if (dateTo && new Date(item.inventoryDate).getTime() > dateTo) return false;

        // Text search filtering by field
        if (searchTerm) {
            let searchValue = '';
            if (filterField === 'all') {
                searchValue = `${item.productCode || ''} ${item.personName || ''} ${item.inventoryComments || ''} ${item.lineCode || ''}`.toLowerCase();
            } else {
                searchValue = item[filterField] ? item[filterField].toLowerCase() : '';
            }
            if (!searchValue.includes(searchTerm)) return false;
        }

        // Damaged/Tailends filtering
        if (filterValue === 'damaged') {
            if (!item.reason.trim().toLowerCase().includes('damaged')) return false;
        } else if (filterValue === 'tailends') {
            if (!item.reason.trim().toLowerCase().includes('tail end') && !item.reason.trim().toLowerCase().includes('tailend')) return false;
        }

        return true;
    });

    // Sorting
    const sortField = document.getElementById('sortByField').value;
    if (sortField === 'personName') {
        filtered.sort((a, b) => (a.personName || '').localeCompare(b.personName || ''));
    } else if (sortField === 'productCode') {
        filtered.sort((a, b) => (a.productCode || '').localeCompare(b.productCode || ''));
    } else if (sortField === 'currentLength') {
        filtered.sort((a, b) => (a.currentLength || 0) - (b.currentLength || 0));
    } else if (sortField === 'actualLength') {
        filtered.sort((a, b) => (a.actualLength || 0) - (b.actualLength || 0));
    } else if (sortField === 'inventoryDate') {
        filtered.sort((a, b) => new Date(b.inventoryDate || '1970-01-01') - new Date(a.inventoryDate || '1970-01-01'));
    } else {
        // Default: timestamp sort
        filtered.sort((a, b) => b.timestamp - a.timestamp);
    }

    return filtered;
}

function formatDateMMDDYYYY(dateString) {
    // Convert YYYY-MM-DD to MM/DD/YYYY
    if (!dateString || dateString === 'N/A') return 'N/A';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return dateString;
}

function formatTimestampToMMDDYYYY(timestamp) {
    // Safely convert a timestamp (number) to MM/DD/YYYY format
    if (!timestamp || isNaN(timestamp)) return 'N/A';

    try {
        // Ensure timestamp is a valid number
        const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
        if (isNaN(timestampNum) || timestampNum <= 0) return 'N/A';

        // Create date and format to YYYY-MM-DD string
        const date = new Date(timestampNum);
        if (isNaN(date.getTime())) return 'N/A'; // Invalid date

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return formatDateMMDDYYYY(`${year}-${month}-${day}`);
    } catch (error) {
        console.warn('Error formatting timestamp:', timestamp, error);
        return 'N/A';
    }
}

function renderInventoryItems() {
    const inventoryList = document.getElementById('inventoryList');
    const totalItemsElement = document.getElementById('totalItemsCount');
    const displayedItemsElement = document.getElementById('displayedItemsCount');

    const filteredItems = getFilteredInventoryItems();

    totalItemsElement.textContent = filteredItems.length;

    if (filteredItems.length === 0) {
        inventoryList.innerHTML = '<p class="text-sm text-gray-500">No inventory items found yet.</p>';
        displayedItemsElement.textContent = '0';
        updateStats();
        return;
    }

    const itemsToShow = Math.min(displayedItemsCount + itemsPerPage, filteredItems.length);
    displayedItemsCount = itemsToShow;
    displayedItemsElement.textContent = displayedItemsCount;

    let html = '';
    filteredItems.slice(0, displayedItemsCount).forEach((item) => {
        const date = new Date(item.timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Format reason for display
        let displayReason = item.reason || '';
        if (displayReason.toLowerCase() === 'tail end') {
            displayReason = 'TAIL END';
        } else if (displayReason.toLowerCase() === 'damaged') {
            displayReason = 'DAMAGED';
        } else {
            displayReason = displayReason.toUpperCase();
        }

        // Format note for display
        let displayNote = item.note || '';
        if (displayNote.toLowerCase() === 'tail end') {
            displayNote = 'TAIL END';
        } else if (displayNote.toLowerCase() === 'damaged') {
            displayNote = 'DAMAGED';
        } else {
            displayNote = displayNote.toUpperCase();
        }

        // Calculate review button title and text
        let reviewButtonTitle = 'Mark as reviewed';
        let reviewButtonText = 'Review';
        if (item.reviewed) {
            const formattedDate = formatTimestampToMMDDYYYY(item.reviewedTimestamp || item.timestamp);
            reviewButtonTitle = 'Reviewed on ' + formattedDate;
            reviewButtonText = '✓ Reviewed';
        }

        html += `
            <div class="inventory-item bg-white p-3 rounded-lg shadow-sm border">
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                    <div><span class="font-semibold text-gray-900">Date:</span> <span class="text-gray-700">${formatDateMMDDYYYY(item.inventoryDate || 'N/A')}</span></div>
                    <div><span class="font-semibold text-gray-900">Name:</span> <span class="text-gray-700">${item.personName || 'N/A'}</span></div>
                    <div><span class="font-semibold text-gray-900">Reason:</span> <span class="text-gray-700">${displayReason || 'N/A'}</span></div>
                    <div><span class="font-semibold text-gray-900">Notes:</span> <span class="text-gray-700">${displayNote || 'N/A'}</span></div>
                    <div><span class="font-semibold text-gray-900">Comments:</span> <span class="text-gray-700">${item.inventoryComments || 'N/A'}</span></div>
                    <div><span class="font-semibold text-gray-900">Line #:</span> <span class="text-gray-700">${item.lineCode || 'N/A'}</span></div>
                    <div><span class="font-semibold text-gray-900">Product:</span> <span class="text-gray-700">${item.productCode || 'N/A'}</span></div>
                    <div><span class="font-semibold text-gray-900">Current Length:</span> <span class="text-gray-700">${item.currentLength ? `${item.currentLength} ${item.currentLengthUnit}` : 'N/A'}</span></div>
                    <div><span class="font-semibold text-gray-900">Actual Length:</span> <span class="text-gray-700">${item.actualLength ? `${item.actualLength} ${item.actualLengthUnit}` : 'N/A'}</span></div>
                    <div><span class="font-semibold text-gray-900">Wire Coil Code:</span> <span class="text-gray-700">${item.coilCode || 'N/A'}</span></div>
                    <div><span class="font-semibold text-gray-900">Adjust:</span> <span class="${item.adjust ? 'text-orange-600 font-bold' : 'text-green-600'}">${item.adjust ? 'Yes' : 'No'}</span></div>
                    <div><span class="font-semibold text-gray-900">Approved:</span> <span class="${getApprovalClass(item.approved)}">${getApprovalText(item.approved)}</span></div>
                    <div><span class="font-semibold text-gray-900">INA #:</span> <span class="text-gray-700">${item.inaNumber || 'N/A'}</span></div>
                    <div><span class="font-semibold text-gray-900">INA Date:</span> <span class="text-gray-700">${formatDateMMDDYYYY(item.inaDate || 'N/A')}</span></div>
                    <div><span class="font-semibold text-gray-900">Avg Cost:</span> <span class="text-gray-700">${item.averageCost && item.costUnit ? `${item.costUnit}${item.averageCost}` : 'N/A'}</span></div>
                    <div><span class="font-semibold text-gray-900">Value:</span> <span class="text-gray-700">${item.totalValue ? `$${item.totalValue}` : 'N/A'}</span></div>
                </div>
                <p class="text-xs text-gray-500 mt-2">@ ${date} by Local</p>
                <p class="text-xs text-gray-400">Created: ${new Date(item.createdAt || item.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}${item.updatedAt && item.updatedAt !== item.createdAt ? ` | Updated: ${new Date(item.updatedAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}</p>
                <div class="flex justify-between flex-wrap mobile-stack items-center mt-2">
                    <!-- Left corner buttons -->
                    <div class="flex items-center gap-1">
                        <button onclick="toggleAdjust('${item.id}')" class="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded" title="Toggle adjust status">Adjust</button>
                        <button onclick="toggleApproval('${item.id}')" class="text-xs ${item.approved === true ? 'bg-green-500 hover:bg-green-600' : item.approved === false ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'} text-white px-2 py-1 rounded" title="Toggle approval">${item.approved === true ? '✓ Approved' : item.approved === false ? '✗ Not Approved' : 'Not Set'}</button>
                        <button onclick="clearInventoryApproval('${item.id}')" class="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded" title="Clear approval status">Clear</button>
                        <span class="text-xs font-semibold ml-2 ${getApprovalClass(item.approved)}">${getApprovalText(item.approved)}</span>
                        <span class="text-xs font-semibold ml-2 ${item.adjust ? 'text-orange-600 font-bold' : 'text-green-600'}">Adjust: ${item.adjust ? 'Yes' : 'No'}</span>
                    </div>
                    <!-- Right corner buttons -->
                    <div class="flex items-center gap-1">
                        <button onclick="markAsReviewed('${item.id}')" class="text-xs ${item.reviewed ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'} text-white px-2 py-1 rounded" title="${reviewButtonTitle}">
                            ${reviewButtonText}
                        </button>
                        <button onclick="updateINAdate('${item.id}')" class="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded" title="Update INA Date">INA Date</button>
                        <button onclick="editInventoryItem('${item.id}')" class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded">Edit</button>
                        <button onclick="deleteInventoryItem('${item.id}')" class="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Delete</button>
                    </div>
                </div>
            </div>
        `;
    });

    if (displayedItemsCount < filteredItems.length) {
        html += `
            <div class="text-center mt-4">
                <button
                    onclick="loadMoreInventoryItems()"
                    class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition duration-200"
                >
                    Load More Items (${filteredItems.length - displayedItemsCount} remaining)
                </button>
            </div>
        `;
    }

    inventoryList.innerHTML = html;
    updateStats();
}

function loadMoreInventoryItems() {
    if (isLoading) return;

    isLoading = true;
    document.getElementById('loadingIndicator').classList.remove('hidden');

    setTimeout(() => {
        renderInventoryItems();
        document.getElementById('loadingIndicator').classList.add('hidden');
        isLoading = false;
    }, 300);
}

function getApprovalText(approved) {
    if (approved === true) return 'Approved';
    if (approved === false) return 'Not Approved';
    return 'Not Set';
}

function getApprovalClass(approved) {
    if (approved === true) return 'text-green-600 font-bold';
    if (approved === false) return 'text-red-600 font-bold';
    return 'text-yellow-600';
}

function approveInventoryItem(id) {
    updateInventoryApprovalStatus(id, true);
}

function denyInventoryItem(id) {
    updateInventoryApprovalStatus(id, false);
}

function clearInventoryApproval(id) {
    updateInventoryApprovalStatus(id, null);
}

async function updateInventoryApprovalStatus(id, status) {
    const itemIndex = inventoryItems.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    inventoryItems[itemIndex].approved = status;
    inventoryItems[itemIndex].updatedAt = Date.now();

    try {
        await updateInventoryItemInDB(inventoryItems[itemIndex]);

        // Re-render the grid to update approval text colors as well
        displayedItemsCount = 0;
        renderInventoryItems();

        updateStats();
    } catch (error) {
        console.error('Error updating approval status:', error);
        await showAlert('Failed to update approval status. Please try again.', 'Update Error');
    }
}

async function updateINAdate(id) {
    const itemIndex = inventoryItems.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    const currentINAdate = inventoryItems[itemIndex].inaDate || '';
    const newINAdate = await showDatePrompt('Select new INA Date:', currentINAdate, 'Update INA Date');

    if (newINAdate === null) return; // User cancelled

    // Store original item for undo
    const originalItem = { ...inventoryItems[itemIndex] };

    inventoryItems[itemIndex].inaDate = newINAdate;
    inventoryItems[itemIndex].updatedAt = Date.now();

    try {
        await updateInventoryItemInDB(inventoryItems[itemIndex]);

        // Record operation for undo
        recordOperation({
            type: 'edit',
            id: id,
            originalItem: originalItem,
            newItem: { ...inventoryItems[itemIndex] }
        });

        displayedItemsCount = 0;
        renderInventoryItems();
    } catch (error) {
        console.error('Error updating INA date:', error);
        await showAlert('Failed to update INA date. Please try again.', 'Update Error');
        // Revert local change on error
        inventoryItems[itemIndex] = originalItem;
    }
}

// Export functions
function escapeCSVValue(value) {
    if (value == null) return '';
    const stringValue = value.toString();
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

async function exportToCSV() {
    if (inventoryItems.length === 0) {
        await showAlert('No inventory items to export.', 'Export Failed');
        return;
    }

    const header = [
        'Date', 'Name', 'Reason', 'Notes', 'Line #', 'Product', 'Current Length', 'Actual Length', 'Wire Coil Code', 'Adjust', 'Approval Status', 'INA #', 'INA Date', 'AVG Cost', 'Value'
    ];

    const rows = inventoryItems.map(item => [
        escapeCSVValue(item.inventoryDate || ''),
        escapeCSVValue(item.personName || ''),
        escapeCSVValue(item.reason || ''),
        escapeCSVValue(item.inventoryComments || ''),
        escapeCSVValue(item.lineCode || ''),
        escapeCSVValue(item.productCode || ''),
        escapeCSVValue(item.currentLength ? `${item.currentLength} ${item.currentLengthUnit}` : ''),
        escapeCSVValue(item.actualLength ? `${item.actualLength} ${item.actualLengthUnit}` : ''),
        escapeCSVValue(item.coilCode || ''),
        escapeCSVValue(item.adjust ? 'Yes' : 'No'),
        escapeCSVValue(item.approved === true ? 'Approved' : (item.approved === false ? 'Not Approved' : 'Not Set')),
        escapeCSVValue(item.inaNumber || ''),
        escapeCSVValue(item.inaDate || ''),
        escapeCSVValue(item.averageCost && item.costUnit ? `${item.costUnit}${item.averageCost}` : ''),
        escapeCSVValue(item.totalValue ? item.totalValue.toString() : '')
    ]);

    const csvContent = [header, ...rows].map(row => row.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    a.download = `inventory_${inventoryItems.length}_${dateStr}.csv`;

    a.click();
    URL.revokeObjectURL(url);

    // Update export status
    if (window.eecolDB && window.eecolDB.isReady()) {
        await window.eecolDB.update('settings', { name: 'lastCsvExport', value: now.toISOString() });
    }
    updateExportStatus();

    await showAlert(`Successfully exported ${inventoryItems.length} inventory items to CSV.`, 'Export Complete');
}

async function exportDeltaToCSV() {
    if (inventoryItems.length === 0) {
        await showAlert('No inventory items to export.', 'No Items');
        return;
    }

    const now = Date.now();
    const newItems = lastDeltaExport ? inventoryItems.filter(item => item.timestamp > lastDeltaExport) : inventoryItems;

    if (newItems.length === 0) {
        await showAlert('No new items since the last export.', 'No New Items');
        return;
    }

    const header = [
        'Date', 'Name', 'Reason', 'Notes', 'Line #', 'Product', 'Current Length', 'Actual Length', 'Wire Coil Code', 'Adjust', 'Approval Status', 'INA #', 'INA Date', 'AVG Cost', 'Value'
    ];

    const rows = newItems.map(item => [
        escapeCSVValue(item.inventoryDate || ''),
        escapeCSVValue(item.personName || ''),
        escapeCSVValue(item.reason || ''),
        escapeCSVValue(item.inventoryComments || ''),
        escapeCSVValue(item.lineCode || ''),
        escapeCSVValue(item.productCode || ''),
        escapeCSVValue(item.currentLength ? `${item.currentLength} ${item.currentLengthUnit}` : ''),
        escapeCSVValue(item.actualLength ? `${item.actualLength} ${item.actualLengthUnit}` : ''),
        escapeCSVValue(item.coilCode || ''),
        escapeCSVValue(item.adjust ? 'Yes' : 'No'),
        escapeCSVValue(item.approved === true ? 'Approved' : (item.approved === false ? 'Not Approved' : 'Not Set')),
        escapeCSVValue(item.inaNumber || ''),
        escapeCSVValue(item.inaDate || ''),
        escapeCSVValue(item.averageCost && item.costUnit ? `${item.costUnit}${item.averageCost}` : ''),
        escapeCSVValue(item.totalValue ? item.totalValue.toString() : '')
    ]);

    const csvContent = [header, ...rows].map(row => row.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const dateStr = new Date(now).toISOString().split('T')[0];
    a.download = `inventory_new_${newItems.length}_${dateStr}.csv`;

    a.click();
    URL.revokeObjectURL(url);

    // Update lastDeltaExport
    lastDeltaExport = now;
    updateExportStatus();

    await showAlert(`Successfully exported ${newItems.length} new inventory items to CSV.\n\nFile: inventory_new_${newItems.length}_${dateStr}.csv\n\n${lastDeltaExport ? 'This export contains items added since the last export.' : 'This was the first export - future exports will only include newer items.'}`);
}

async function clearAllItems() {
    const confirmResult = await showConfirm(`Are you sure you want to clear all ${inventoryItems.length} inventory items? This action cannot be undone.`);
    if (confirmResult) {
        inventoryItems = [];
        displayedItemsCount = 0;
        await clearAllInventoryItemsFromDB();
        renderInventoryItems();
        await showAlert('All inventory items have been cleared.', 'Items Cleared');
    }
}

async function exportJSONBackup() {
    const backup = {
        records: inventoryItems,
        timestamp: Date.now(),
        version: '0.7.9.8',
        exportDate: new Date().toISOString(),
        totalRecords: inventoryItems.length
    };

    const jsonContent = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    a.download = `eecol_inventory_json_backup_${inventoryItems.length}_${dateStr}.json`;

    a.click();
    URL.revokeObjectURL(url);

    // Update export status
    if (window.eecolDB && window.eecolDB.isReady()) {
        await window.eecolDB.update('settings', { name: 'lastJsonExport', value: new Date().toISOString() });
    }
    updateExportStatus();

    await showAlert(`JSON backup exported successfully!\nContains ${backup.totalRecords} inventory records.\nFile: eecol_inventory_json_backup_${inventoryItems.length}_${dateStr}.json`, 'JSON Backup Exported');
}

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
            const merge = await showConfirm(`JSON Backup Import:\n\nBackup Details:\n- Version: ${backupVersion}\n- Export Date: ${exportDate}\n- Records: ${importRecords.length}\n- Current Records: ${inventoryItems.length}\n\nChoose:\nOK = Merge with existing data\nCancel = Replace all existing data`, 'Import Options');

            inventoryItems = merge ? [...inventoryItems, ...importRecords] : importRecords;

            // Clean up records (ensure IDs, etc.)
            inventoryItems.forEach(record => {
                if (!record.id) {
                    record.id = crypto.randomUUID();
                }
            });

            inventoryItems.sort((a, b) => b.timestamp - a.timestamp);

            // Save to database
            await clearAllInventoryItemsFromDB();
            for (const record of inventoryItems) {
                await saveInventoryItemToDB(record);
            }

            displayedItemsCount = 0;
            renderInventoryItems();

            await showAlert(`JSON import successful!\n${merge ? 'Merged' : 'Replaced'} with ${importRecords.length} inventory records.\nTotal records: ${inventoryItems.length}`, 'Import Successful');

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



// Event listeners and initialization
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

    // Toggle stats visibility
    document.getElementById('toggleStats').addEventListener('click', function() {
        const content = document.getElementById('statsContent');
        const toggle = document.getElementById('statsToggle');

        if (!content || !toggle) {
            console.error('Stats toggle elements not found:', { content, toggle });
            return;
        }

        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            toggle.textContent = '▼';
            this.classList.add('text-blue-900', 'bg-blue-50');
        } else {
            content.classList.add('hidden');
            toggle.textContent = '►';
            this.classList.remove('text-blue-900', 'bg-blue-50');
        }
    });

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

    // Input validation for line code and person name - auto uppercase
    const lineCodeInput = document.getElementById('lineCode');
    if (lineCodeInput) {
        lineCodeInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
        });
    }

        const personNameInput = document.getElementById('personName');
    if (personNameInput) {
        personNameInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // Auto uppercase for custom reason and note inputs
    const reasonCustomInput = document.getElementById('reasonCustom');
    if (reasonCustomInput) {
        reasonCustomInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    const noteCustomInput = document.getElementById('noteCustom');
    if (noteCustomInput) {
        noteCustomInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // Search and filter event listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            displayedItemsCount = 0;
            renderInventoryItems();
        });
    }

    const filterByField = document.getElementById('filterByField');
    if (filterByField) {
        filterByField.addEventListener('change', () => {
            displayedItemsCount = 0;
            renderInventoryItems();
        });
    }

    const sortByField = document.getElementById('sortByField');
    if (sortByField) {
        sortByField.addEventListener('change', () => {
            displayedItemsCount = 0;
            renderInventoryItems();
        });
    }

    const dateFrom = document.getElementById('dateFrom');
    if (dateFrom) {
        dateFrom.addEventListener('change', () => {
            displayedItemsCount = 0;
            renderInventoryItems();
        });
    }

    const dateTo = document.getElementById('dateTo');
    if (dateTo) {
        dateTo.addEventListener('change', () => {
            displayedItemsCount = 0;
            renderInventoryItems();
        });
    }

    const clearFilters = document.getElementById('clearFilters');
    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            // Clear filters
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            const filterByField = document.getElementById('filterByField');
            if (filterByField) filterByField.value = 'all';
            const sortByField = document.getElementById('sortByField');
            if (sortByField) sortByField.value = 'timestamp';
            const dateFrom = document.getElementById('dateFrom');
            if (dateFrom) dateFrom.value = '';
            const dateTo = document.getElementById('dateTo');
            if (dateTo) dateTo.value = '';
            // Clear damaged/tailends filter by not selecting any radio button
            const filterRadios = document.querySelectorAll('input[name="filterDamaged"]');
            filterRadios.forEach(radio => radio.checked = false);

            displayedItemsCount = 0;
            renderInventoryItems();
        });
    }

    const filterRadios = document.querySelectorAll('input[name="filterDamaged"]');
    filterRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            displayedItemsCount = 0;
            renderInventoryItems();
        });
    });

    // Button event listeners
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) recordBtn.addEventListener('click', saveInventoryItem);
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.addEventListener('click', undoLastOperation);
    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) redoBtn.addEventListener('click', redoLastOperation);
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportToCSV);
    const exportDeltaBtn = document.getElementById('exportDeltaBtn');
    if (exportDeltaBtn) exportDeltaBtn.addEventListener('click', exportDeltaToCSV);
    const exportJSONBtn = document.getElementById('exportJSONBtn');
    if (exportJSONBtn) exportJSONBtn.addEventListener('click', exportJSONBackup);
    const importJSONBtn = document.getElementById('importJSONBtn');
    if (importJSONBtn) importJSONBtn.addEventListener('click', () => {
        const jsonFileInput = document.getElementById('jsonFileInput');
        if (jsonFileInput) jsonFileInput.click();
    });
    const jsonFileInput = document.getElementById('jsonFileInput');
    if (jsonFileInput) jsonFileInput.addEventListener('change', importJSONBackup);
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllItems);

    // Make approval checkboxes mutually exclusive
    document.getElementById('approvedCB').addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('notApprovedCB').checked = false;
        }
    });

    document.getElementById('notApprovedCB').addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('approvedCB').checked = false;
        }
    });

    // Load records on page load
    loadInventoryItems().catch((error) => {
        console.error('❌ loadInventoryItems() failed on page load:', error);
    });

    // Initially hide stats
    const statsContent = document.getElementById('statsContent');
    const statsToggle = document.getElementById('statsToggle');

    if (statsContent && statsToggle) {
        statsContent.classList.add('hidden');
        statsToggle.textContent = '►';
    } else {
        console.error('❌ Failed to find stats elements:', { statsContent: !!statsContent, statsToggle: !!statsToggle });
    }

    // Initialize modal system if needed
    if (typeof initModalSystem === 'function') {
        initModalSystem();
    }
});

// Missing functions referenced in HTML
function printRecords() {
    // Basic print functionality for inventory records
    window.print();
}

// Additional modal functions not provided by utils/modals.js
function showPrompt(message, defaultValue = '', title = "Input") {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalInput = document.getElementById('modalInput');
        const modalInputValue = document.getElementById('modalInputValue');
        const modalButtons = document.getElementById('modalButtons');

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalInput.style.display = 'block';
        modalInputValue.type = 'text';
        modalInputValue.value = defaultValue;
        modalInputValue.placeholder = 'Enter value...';
        modalButtons.innerHTML = `
            <button id="modalCancelBtn" class="px-4 py-2 bg-gray-500 text-white rounded-xl shadow-lg hover:bg-gray-600 transform hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease-in-out text-sm font-semibold mr-2">Cancel</button>
            <button id="modalOKBtn" class="px-4 py-2 bg-blue-700 text-white rounded-xl shadow-lg hover:bg-blue-800 transform hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease-in-out text-sm font-semibold">OK</button>
        `;

        const okBtn = modalButtons.querySelector('#modalOKBtn');
        const cancelBtn = modalButtons.querySelector('#modalCancelBtn');

        const handleOK = () => {
            hideModal();
            resolve(modalInputValue.value);
        };

        const handleCancel = () => {
            hideModal();
            resolve(null);
        };

        okBtn.addEventListener('click', handleOK);
        cancelBtn.addEventListener('click', handleCancel);

        // Handle Enter key in input
        modalInputValue.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleOK();
            }
        });

        // Focus the input field
        setTimeout(() => {
            modalInputValue.focus();
        }, 100);

        // Show modal with animation
        modal.classList.remove('hidden');
        setTimeout(() => {
            const modalContent = document.getElementById('modalContent');
            if (modalContent) {
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
            }
        }, 10);
    });
}

function showDatePrompt(message, defaultValue = '', title = "Date Input") {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalInput = document.getElementById('modalInput');
        const modalInputValue = document.getElementById('modalInputValue');
        const modalButtons = document.getElementById('modalButtons');

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalInput.style.display = 'block';
        modalInputValue.type = 'date';
        modalInputValue.value = defaultValue;
        modalInputValue.placeholder = '';
        modalButtons.innerHTML = `
            <button id="modalCancelBtn" class="px-4 py-2 bg-gray-500 text-white rounded-xl shadow-lg hover:bg-gray-600 transform hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease-in-out text-sm font-semibold mr-2">Cancel</button>
            <button id="modalOKBtn" class="px-4 py-2 bg-blue-700 text-white rounded-xl shadow-lg hover:bg-blue-800 transform hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease-in-out text-sm font-semibold">OK</button>
        `;

        const okBtn = modalButtons.querySelector('#modalOKBtn');
        const cancelBtn = modalButtons.querySelector('#modalCancelBtn');

        const handleOK = () => {
            hideModal();
            resolve(modalInputValue.value);
        };

        const handleCancel = () => {
            hideModal();
            resolve(null);
        };

        okBtn.addEventListener('click', handleOK);
        cancelBtn.addEventListener('click', handleCancel);

        // Focus the input field
        setTimeout(() => {
            modalInputValue.focus();
        }, 100);

        // Show modal with animation
        modal.classList.remove('hidden');
        setTimeout(() => {
            const modalContent = document.getElementById('modalContent');
            if (modalContent) {
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
            }
        }, 10);
    });
}

// Additional missing database functions
async function deleteInventoryItemFromDB(id) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.delete('inventoryRecords', id);
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("Error deleting inventory item:", error);
        throw error;
    }
}

async function clearAllInventoryItemsFromDB() {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.clear('inventoryRecords');
        } else {
            throw new Error("Database not available");
        }
    } catch (error) {
        console.error("Error clearing inventory items:", error);
        throw error;
    }
}

async function updateExportStatus() {
    try {
        const jsonSpan = document.getElementById('lastJsonExport');

        // Get current time
        const now = Date.now();

        // Get export timestamps from IndexedDB settings
        let lastJsonExport = null;

        if (window.eecolDB && await window.eecolDB.isReady()) {
            const jsonSetting = await window.eecolDB.get('settings', 'lastJsonExport');
            if (jsonSetting && jsonSetting.value) {
                lastJsonExport = new Date(jsonSetting.value).getTime();
            }
        }



        // Update JSON export status
        if (lastJsonExport) {
            const daysSinceJsonExport = Math.floor((now - lastJsonExport) / (1000 * 60 * 60 * 24));
            if (daysSinceJsonExport < 3) {
                // Recent export - show plain text with green styling
                jsonSpan.innerHTML = `<span style="color: #10b981; font-weight: 600;">Last exported ${daysSinceJsonExport === 0 ? 'today' : daysSinceJsonExport + ' days ago'}</span>`;
            } else {
                // Stale export - show clickable link
                const exportDate = new Date(lastJsonExport).toLocaleDateString();
                jsonSpan.innerHTML = `<a href="#" onclick="exportJSONBackup(); return false;" style="color: #f59e0b; font-weight: 600; text-decoration: underline;">${exportDate} (${daysSinceJsonExport} days ago)</a>`;
            }
        } else {
            // Never exported - show clickable link
            jsonSpan.innerHTML = '<a href="#" onclick="exportJSONBackup(); return false;" style="color: #f59e0b; font-weight: 600; text-decoration: underline;">Never exported</a>';
        }
    } catch (error) {
        console.error('Error updating export status:', error);
    }
}

function updateStats() {
    const totalItems = inventoryItems.length;
    const totalLength = inventoryItems.reduce((sum, item) => sum + (item.length || item.actualLength || item.currentLength || 0), 0);
    const damagedItems = inventoryItems.filter(item => item.reason && item.reason.trim().toLowerCase() === 'damaged').length;
    const tailendReasons = inventoryItems.filter(item => item.reason && (item.reason.trim().toLowerCase() === 'tail end' || item.reason.trim().toLowerCase() === 'tailend')).length;
    const avgLength = totalItems > 0 ? totalLength / totalItems : 0;

    // Update DOM elements
    const totalItemsEl = document.getElementById('totalItems');
    const totalLengthEl = document.getElementById('totalLength');
    const damagedItemsEl = document.getElementById('damagedItems');
    const tailendReasonsEl = document.getElementById('tailendReasons');
    const avgLengthEl = document.getElementById('avgLength');
    const totalItemsCountEl = document.getElementById('totalItemsCount');

    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    if (totalLengthEl) totalLengthEl.textContent = totalLength.toFixed(2) + 'm';
    if (damagedItemsEl) damagedItemsEl.textContent = damagedItems;
    if (tailendReasonsEl) tailendReasonsEl.textContent = tailendReasons;
    if (avgLengthEl) avgLengthEl.textContent = avgLength.toFixed(2) + 'm';
    if (totalItemsCountEl) totalItemsCountEl.textContent = totalItems;
}



// Adjust management functions
async function toggleApproval(id) {
    const itemIndex = inventoryItems.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    const currentApproved = inventoryItems[itemIndex].approved;

    // Toggle between true and false only (no null for toggle)
    const newApproved = currentApproved === true ? false : true;

    await updateInventoryApprovalStatus(id, newApproved);
}

async function toggleAdjust(id) {
    const itemIndex = inventoryItems.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    const newAdjust = !inventoryItems[itemIndex].adjust;
    inventoryItems[itemIndex].adjust = newAdjust;
    inventoryItems[itemIndex].updatedAt = Date.now();

    try {
        // Save to IndexedDB
        await updateInventoryItemInDB(inventoryItems[itemIndex]);

        // Re-render the grid to update adjust displays
        displayedItemsCount = 0;
        renderInventoryItems();

        updateStats();
    } catch (error) {
        console.error('Error updating adjust status:', error);
        await showAlert('Failed to update adjust status. Please try again.', 'Update Error');
    }
}

// Review management functions - one-way toggle like Cut In System button
async function markAsReviewed(id) {
    const itemIndex = inventoryItems.findIndex(i => i.id === id);
    if (itemIndex === -1) {
        console.error('❌ Item not found for review:', id);
        return;
    }

    const item = inventoryItems[itemIndex];

    // Only allow toggling from false to true (one-way)
    if (item.reviewed === true) {
        return; // Already set, do nothing
    }

    const now = Date.now();

    // Store original state for error recovery
    const originalReviewed = item.reviewed;
    const originalTimestamp = item.reviewedTimestamp;

    inventoryItems[itemIndex].reviewed = true;
    inventoryItems[itemIndex].reviewedTimestamp = now;
    inventoryItems[itemIndex].updatedAt = now;

    try {
        // Update in database
        await updateInventoryItemInDB(inventoryItems[itemIndex]);

        // Update the review status display
        const reviewStatusDiv = document.getElementById(`review-status-${id}`);
        if (reviewStatusDiv) {
            reviewStatusDiv.textContent = 'Reviewed';
            reviewStatusDiv.className = reviewStatusDiv.className.replace('text-gray-500', 'text-green-600');
        }

        // Update the button - make it permanent/unclickable like Cut In System
        const button = document.querySelector(`button[onclick="markAsReviewed('${id}')"]`);
        if (button) {
            button.className = button.className.replace('bg-gray-500 hover:bg-gray-600', 'bg-green-600 hover:bg-green-700');
            const reviewDate = formatTimestampToMMDDYYYY(now);
            button.innerHTML = `✓ Reviewed (${reviewDate})`;
            button.setAttribute('title', `Marked as reviewed on ${reviewDate}`);
            button.disabled = true; // Disable button permanently
            button.onclick = null; // Remove onclick handler
        }

        updateStats();

        // Show success alert like Cut In System button
        await showAlert(`Inventory item marked as "Reviewed" at ${new Date(now).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })}`, 'Review Status Updated');

    } catch (error) {
        console.error('❌ Error updating review status:', error);

        // Revert local changes on error
        inventoryItems[itemIndex].reviewed = originalReviewed;
        inventoryItems[itemIndex].reviewedTimestamp = originalTimestamp;

        await showAlert('Failed to update review status. Please try again.', 'Update Error');
    }
}



// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.1',
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: '💡 Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '💾 Backup Guide', href: '../backup/backup.html', class: 'bg-green-500 hover:bg-green-600' },
            { text: '📈 Reports', href: '../inventory-reports/inventory-reports.html', class: 'bg-purple-600 hover:bg-purple-700' }
        ],
        version: 'v0.8.0.1',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Wire Inventory Records'
    });
}

// Global function exports for HTML onclick handlers
if (typeof window !== 'undefined') {
    // Core functions - Main operations
    window.saveInventoryItem = saveInventoryItem;
    window.handleReasonChange = handleReasonChange;
    window.editItem = editInventoryItem;
    window.deleteItem = deleteInventoryItem;
    window.approveItem = approveInventoryItem;
    window.denyItem = denyInventoryItem;
    window.clearApproval = clearInventoryApproval;
    window.toggleApproval = toggleApproval;
    window.updateINAdate = updateINAdate;
    window.loadMoreInventoryItems = loadMoreInventoryItems;
    window.printRecords = printRecords;
    window.toggleAdjust = toggleAdjust;
    window.markAsReviewed = markAsReviewed;

    // Additional modal functions
    window.showPrompt = showPrompt;
    window.showDatePrompt = showDatePrompt;
}
