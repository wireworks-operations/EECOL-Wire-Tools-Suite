/**
 * Dedicated Wire Cut List Workspace - JavaScript Module
 * Enterprise PWA
 */

// Global variables
let wireCutList = [];
let wireListEditingId = null;
let currentContextMenuId = null;
let draggedItemId = null;

/**
 * Calculates whether black or white text has better contrast on a given background hex color.
 * Uses the standard WCAG relative luminance formula.
 * @param {string} hexColor - The background color in hexadecimal (e.g. "#ffffff" or "ffffff")
 * @returns {string} - "#ffffff" (white) for dark backgrounds, or "#1f2937" (dark gray) for light backgrounds
 */
function getContrastColor(hexColor) {
    if (!hexColor) return '#1f2937'; // Default text color is dark gray

    // Clean hex color string
    let color = hexColor.replace('#', '');
    if (color.length === 3) {
        color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }

    if (color.length !== 6) return '#1f2937';

    // Parse to RGB
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    // Calculate relative luminance
    // Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
    // Where R, G, B are normalized sRGB values
    const normalize = (val) => {
        const s = val / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };

    const L = 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);

    // If background is bright (L > 0.179), use dark text; otherwise use light text
    return L > 0.179 ? '#1f2937' : '#ffffff';
}

// Debounce utility for search input
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

// Toast notification helper
function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[60] flex flex-col items-center pointer-events-none gap-2 w-full max-w-xs px-4';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `p-3 rounded-lg shadow-2xl text-white text-xs font-bold transition-all duration-300 transform translate-y-10 opacity-0 flex items-center gap-2 pointer-events-auto w-full`;

    switch (type) {
        case 'success': toast.classList.add('bg-green-600'); break;
        case 'error': toast.classList.add('bg-red-600'); break;
        case 'warning': toast.classList.add('bg-yellow-600'); break;
        default: toast.classList.add('bg-blue-600'); break;
    }

    toast.textContent = message;
    toastContainer.appendChild(toast);

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

// Initialize database
async function initDatabase() {
    if (typeof EECOLIndexedDB !== 'undefined' && !window.eecolDB) {
        try {
            window.eecolDB = EECOLIndexedDB.getInstance();
            await window.eecolDB.ready;
        } catch (error) {
            console.error('Failed to initialize database:', error);
            await showAlert("Failed to initialize database. Please refresh the page.", "Database Error");
        }
    }
}

// Load Wire Cut List from IndexedDB
async function loadWireCutList() {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            const records = await window.eecolDB.getAll('wireCutList');
            wireCutList = records.sort((a, b) => (a.position || 0) - (b.position || 0));
            renderWireCutList();
        }
    } catch (error) {
        console.error("Error loading wire cut list:", error);
    }
}

// Render Wire Cut List
function renderWireCutList() {
    const container = document.getElementById('wireCutListItems');
    if (!container) return;

    const filter = document.getElementById('wireListStatusFilter').value;
    const searchTerm = document.getElementById('wireListSearch')?.value.trim().toLowerCase() || '';

    container.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing

    const filtered = wireCutList.filter(item => {
        // Status filter
        if (filter !== 'all' && item.status !== filter) return false;

        // Search filter
        if (searchTerm) {
            const searchFields = [
                item.orderNumber,
                item.customerName,
                item.wireType,
                item.description,
                item.orderComments,
                item.shipperComments
            ].map(f => (f || '').toLowerCase());

            if (!searchFields.some(f => f.includes(searchTerm))) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'text-center text-gray-500 italic mt-8';
        emptyMsg.textContent = searchTerm ? 'No items match your search.' : (filter === 'all' ? 'No items in the list.' : `No ${filter} items found.`);
        container.appendChild(emptyMsg);
        return;
    }

    filtered.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'wire-list-item';
        itemDiv.draggable = true;
        itemDiv.dataset.id = item.id;

        const card = document.createElement('div');
        card.className = 'wire-list-card';
        if (item.isActive) {
            card.classList.add('animate-pulse', 'ring-2', 'ring-amber-400', 'shadow-[0_0_15px_rgba(251,191,36,0.5)]');
        }

        const textColor = getContrastColor(item.color);
        const isDarkBackground = (textColor === '#ffffff');
        const borderColorClass = isDarkBackground ? 'border-white/20' : 'border-black/10';
        const highlightBoxBgClass = isDarkBackground ? 'bg-white/10' : 'bg-black/5';
        const highlightBoxBorderClass = isDarkBackground ? 'border-white/20' : 'border-black/10';

        card.style.color = textColor;
        if (item.color) {
            card.style.backgroundColor = item.color;
            card.style.borderColor = isDarkBackground ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
        }

        // Header Labels
        const headerRow = document.createElement('div');
        headerRow.className = `flex justify-between items-start border-b pb-1 mb-1 font-bold text-[10px] uppercase ${borderColorClass}`;

        ['ORDER / LINE CUSTOMER', 'ORDER COMMENTS', 'SHIPPER COMMENTS'].forEach(text => {
            const div = document.createElement('div');
            div.textContent = text;
            headerRow.appendChild(div);
        });

        // Content Row
        const bodyRow = document.createElement('div');
        bodyRow.className = 'flex gap-2';

        // Left Column (Details)
        const detailsCol = document.createElement('div');
        detailsCol.className = 'w-1/3';

        const orderLine = document.createElement('div');
        orderLine.className = 'font-bold text-sm flex items-center gap-2';
        orderLine.textContent = `${item.orderNumber || 'N/A'} / ${item.lineNumber || '1'}`;

        if (item.isActive) {
            const activeBadge = document.createElement('span');
            activeBadge.className = 'px-1 bg-amber-100 text-amber-800 rounded text-[8px] uppercase border border-amber-300 font-black';
            activeBadge.textContent = '🌟 Active';
            orderLine.appendChild(activeBadge);
        }

        if (item.urgency && item.urgency !== 'normal') {
            const urgencyBadge = document.createElement('span');
            urgencyBadge.className = `px-1 rounded text-[8px] uppercase ${item.urgency === 'critical' ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-500 text-white'}`;
            urgencyBadge.textContent = item.urgency;
            orderLine.appendChild(urgencyBadge);
        }

        const meta = document.createElement('div');
        meta.className = 'text-[9px] font-bold';
        meta.style.color = isDarkBackground ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)';
        const dateStr = new Date(item.timestamp).toLocaleString('en-US', {
            month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
        }).toUpperCase();
        meta.textContent = `${dateStr} @ ${item.customerName || 'N/A'}`;

        const highlightBox = document.createElement('div');
        highlightBox.className = `mt-2 border p-1 rounded italic font-black text-xs ${highlightBoxBgClass} ${highlightBoxBorderClass}`;

        const typeLength = document.createElement('div');
        let typeLengthText = `${item.lengthZ || '0'} Z \u00A0\u00A0 ${item.wireType || 'N/A'}`;
        if (item.reelSize) {
            typeLengthText += ` \u00A0\u00A0 [RLS: ${item.reelSize}\"]`;
        }
        typeLength.textContent = typeLengthText;

        const desc = document.createElement('span');
        desc.className = 'text-[9px] font-normal';
        desc.style.color = isDarkBackground ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)';
        desc.textContent = item.description || '';

        highlightBox.appendChild(typeLength);
        highlightBox.appendChild(desc);

        detailsCol.appendChild(orderLine);
        detailsCol.appendChild(meta);
        detailsCol.appendChild(highlightBox);

        // Middle Column (Order Comments)
        const orderCommentsCol = document.createElement('div');
        orderCommentsCol.className = `w-1/3 border-l pl-2 text-xs whitespace-pre-wrap ${borderColorClass}`;
        orderCommentsCol.textContent = item.orderComments || '';

        // Right Column (Shipper Comments)
        const shipperCommentsCol = document.createElement('div');
        shipperCommentsCol.className = `w-1/3 border-l pl-2 text-xs whitespace-pre-wrap ${borderColorClass}`;
        shipperCommentsCol.textContent = item.shipperComments || '';

        bodyRow.appendChild(detailsCol);
        bodyRow.appendChild(orderCommentsCol);
        bodyRow.appendChild(shipperCommentsCol);

        card.appendChild(headerRow);
        card.appendChild(bodyRow);

        // Removal Reason
        if (item.status === 'removed' && item.removalReason) {
            const reasonDiv = document.createElement('div');
            reasonDiv.className = `mt-1 p-1 border rounded text-[9px] italic ${isDarkBackground ? 'bg-red-900/40 border-red-500/30' : 'bg-red-100/50 border-red-200'}`;
            reasonDiv.textContent = `Removal Reason: ${item.removalReason}`;
            card.appendChild(reasonDiv);
        }

        // Action Buttons (only for active items)
        if (item.status === 'active') {
            const actionsRow = document.createElement('div');
            actionsRow.className = `flex justify-end gap-2 mt-2 pt-1 border-t ${isDarkBackground ? 'border-white/10' : 'border-black/5'}`;

            const autoFillBtn = document.createElement('button');
            autoFillBtn.className = 'px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] font-bold hover:bg-blue-700 transition shadow';
            autoFillBtn.textContent = '📥 AutoFill Cut';
            autoFillBtn.onclick = (e) => {
                e.stopPropagation();
                triggerAutoFill(item.id);
            };

            const completeBtn = document.createElement('button');
            completeBtn.className = 'px-2 py-0.5 bg-green-600 text-white rounded text-[9px] font-bold hover:bg-green-700 transition shadow';
            completeBtn.textContent = '✅ Complete';
            completeBtn.onclick = (e) => {
                e.stopPropagation();
                completeWireListItem(item.id);
            };

            const removeBtn = document.createElement('button');
            removeBtn.className = 'px-2 py-0.5 bg-red-600 text-white rounded text-[9px] font-bold hover:bg-red-700 transition shadow';
            removeBtn.textContent = '❌ Remove';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                showRemovalReasonModal(item.id);
            };

            actionsRow.appendChild(autoFillBtn);
            actionsRow.appendChild(completeBtn);
            actionsRow.appendChild(removeBtn);
            card.appendChild(actionsRow);
        }

        itemDiv.appendChild(card);

        // Events
        itemDiv.addEventListener('contextmenu', e => {
            e.preventDefault();
            showWireListContextMenu(e, item.id);
        });

        itemDiv.addEventListener('dragstart', () => {
            itemDiv.classList.add('dragging');
            draggedItemId = item.id;
        });

        itemDiv.addEventListener('dragend', () => {
            itemDiv.classList.remove('dragging');
        });

        container.appendChild(itemDiv);
    });
}

// Trigger AutoFill via localStorage communication
async function triggerAutoFill(id) {
    const item = wireCutList.find(i => i.id === id);
    if (!item) return;

    // Set localStorage key to trigger the storage listener in the Cutting Records tab
    localStorage.setItem('eecolWireListAutofillId', id);

    // Attempt to focus parent/opener window
    if (window.opener) {
        try {
            window.opener.focus();
        } catch (e) {
            console.warn("Unable to programmatically focus parent window:", e);
        }
    }

    showToast(`Autofilled details for Order #${item.orderNumber}! Please focus Cutting Records.`, 'success');
}

// Complete Wire List Item
async function completeWireListItem(id, silent = false) {
    const item = wireCutList.find(i => i.id === id);
    if (item) {
        item.status = 'completed';
        item.updatedAt = Date.now();
        try {
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.update('wireCutList', item);
                await loadWireCutList();

                if (silent) {
                    showToast(`Order #${item.orderNumber} completed`, 'success');
                } else {
                    await showAlert('Item marked as completed!', 'Success');
                }
            }
        } catch (error) {
            console.error("Error completing item:", error);
            if (silent) showToast("Failed to complete item", "error");
        }
    }
}

// Wire List Item Modal Logic
function showWireListItemModal(id = null) {
    const modal = document.getElementById('wireListItemModal');
    const modalContent = document.getElementById('wireModalContent');
    const title = document.getElementById('wireModalTitle');

    wireListEditingId = id;

    if (id) {
        title.textContent = 'Edit Wire Cut List Item';
        const item = wireCutList.find(i => i.id === id);
        if (item) {
            document.getElementById('wireListOrder').value = item.orderNumber || '';
            document.getElementById('wireListLine').value = item.lineNumber || '';
            document.getElementById('wireListCustomer').value = item.customerName || '';
            document.getElementById('wireListWireType').value = item.wireType || '';
            document.getElementById('wireListLength').value = item.lengthZ || '';
            document.getElementById('wireListReelSize').value = item.reelSize || '';
            document.getElementById('wireListUrgency').value = item.urgency || 'normal';
            document.getElementById('wireListStatus').value = item.status || 'active';
            document.getElementById('wireListDescription').value = item.description || '';
            document.getElementById('wireListOrderComments').value = item.orderComments || '';
            document.getElementById('wireListShipperComments').value = item.shipperComments || '';
        }
    } else {
        title.textContent = 'Add Wire Cut List Item';
        document.getElementById('wireListOrder').value = '';
        document.getElementById('wireListLine').value = '1';
        document.getElementById('wireListCustomer').value = '';
        document.getElementById('wireListWireType').value = '';
        document.getElementById('wireListLength').value = '';
        document.getElementById('wireListReelSize').value = '';
        document.getElementById('wireListUrgency').value = 'normal';
        document.getElementById('wireListStatus').value = 'active';
        document.getElementById('wireListDescription').value = '';
        document.getElementById('wireListOrderComments').value = '';
        document.getElementById('wireListShipperComments').value = '';
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function hideWireListItemModal() {
    const modal = document.getElementById('wireListItemModal');
    const modalContent = document.getElementById('wireModalContent');

    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

async function saveWireListItem() {
    const item = {
        id: wireListEditingId || crypto.randomUUID(),
        orderNumber: document.getElementById('wireListOrder').value.trim().toUpperCase(),
        lineNumber: document.getElementById('wireListLine').value.trim(),
        customerName: document.getElementById('wireListCustomer').value.trim().toUpperCase(),
        wireType: document.getElementById('wireListWireType').value.trim().toUpperCase(),
        lengthZ: document.getElementById('wireListLength').value.trim(),
        reelSize: document.getElementById('wireListReelSize').value.trim(),
        urgency: document.getElementById('wireListUrgency').value,
        status: document.getElementById('wireListStatus').value,
        description: document.getElementById('wireListDescription').value.trim(),
        orderComments: document.getElementById('wireListOrderComments').value.trim(),
        shipperComments: document.getElementById('wireListShipperComments').value.trim(),
        timestamp: wireListEditingId ? wireCutList.find(i => i.id === wireListEditingId).timestamp : Date.now(),
        position: wireListEditingId ? wireCutList.find(i => i.id === wireListEditingId).position : wireCutList.length,
        color: wireListEditingId ? wireCutList.find(i => i.id === wireListEditingId).color : null,
        isActive: wireListEditingId ? wireCutList.find(i => i.id === wireListEditingId).isActive : false
    };

    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.update('wireCutList', item);
            await loadWireCutList();
            hideWireListItemModal();
            showToast("Item saved successfully", "success");
        }
    } catch (error) {
        console.error("Error saving wire list item:", error);
        showAlert("Failed to save item.", "Error");
    }
}

async function deleteWireListItem(id) {
    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.delete('wireCutList', id);
            await loadWireCutList();
            showToast("Item deleted", "success");
        }
    } catch (error) {
        console.error("Error deleting wire list item:", error);
    }
}

async function setActiveWireListItem(id) {
    wireCutList.forEach(item => {
        item.isActive = false;
    });

    const item = wireCutList.find(i => i.id === id);
    if (item) {
        item.isActive = true;
    }

    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.bulkPut('wireCutList', wireCutList, false);
            renderWireCutList();
            showToast(`Order #${item?.orderNumber || 'Unknown'} set as Active`, 'success');
        }
    } catch (error) {
        console.error("Error setting active item:", error);
    }
}

async function clearActiveWireListItem(id) {
    const item = wireCutList.find(i => i.id === id);
    if (item) {
        item.isActive = false;
    }

    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.bulkPut('wireCutList', wireCutList, false);
            renderWireCutList();
            showToast(`Order #${item?.orderNumber || 'Unknown'} active status removed`, 'warning');
        }
    } catch (error) {
        console.error("Error clearing active item:", error);
    }
}

// Removal Reason Modal
function showRemovalReasonModal(id) {
    currentContextMenuId = id;
    const modal = document.getElementById('removalReasonModal');
    const modalContent = document.getElementById('removalModalContent');
    const textarea = document.getElementById('removalReasonText');

    textarea.value = '';
    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
        textarea.focus();
    }, 10);
}

function hideRemovalReasonModal() {
    const modal = document.getElementById('removalReasonModal');
    const modalContent = document.getElementById('removalModalContent');

    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

async function saveRemovalWithReason() {
    const reason = document.getElementById('removalReasonText').value.trim();
    if (!reason) {
        showAlert('Please provide a reason for removal.', 'Reason Required');
        return;
    }

    const item = wireCutList.find(i => i.id === currentContextMenuId);
    if (item) {
        item.status = 'removed';
        item.removalReason = reason;
        item.updatedAt = Date.now();
        try {
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.update('wireCutList', item);
                await loadWireCutList();
                hideRemovalReasonModal();
                await showAlert('Item archived with reason.', 'Removed');
            }
        } catch (error) {
            console.error("Error removing item:", error);
        }
    }
}

// Update Wire List Item Color
async function updateWireListItemColor(id, color) {
    const item = wireCutList.find(i => i.id === id);
    if (item) {
        item.color = color;
        try {
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.update('wireCutList', item);
                renderWireCutList();
            }
        } catch (error) {
            console.error("Error updating color:", error);
        }
    }
}

// Context Menu Logic
function showWireListContextMenu(e, id) {
    const menu = document.getElementById('wireListContextMenu');
    currentContextMenuId = id;

    menu.style.top = `${e.pageY}px`;
    menu.style.left = `${e.pageX}px`;
    menu.classList.remove('hidden');

    const item = wireCutList.find(i => i.id === id);
    const ctxActive = document.getElementById('ctxActive');
    const ctxDeactivate = document.getElementById('ctxDeactivate');

    if (item) {
        if (item.color) {
            document.getElementById('ctxColorPicker').value = item.color;
        } else {
            document.getElementById('ctxColorPicker').value = '#fef08a';
        }

        // Conditionally show/hide Active/Deactivate options
        if (ctxActive && ctxDeactivate) {
            if (item.status === 'active') {
                if (item.isActive) {
                    ctxActive.classList.add('hidden');
                    ctxDeactivate.classList.remove('hidden');
                } else {
                    ctxActive.classList.remove('hidden');
                    ctxDeactivate.classList.add('hidden');
                }
            } else {
                ctxActive.classList.add('hidden');
                ctxDeactivate.classList.add('hidden');
            }
        }
    }
}

function hideWireListContextMenu() {
    const menu = document.getElementById('wireListContextMenu');
    if (menu) menu.classList.add('hidden');
}

// Drag and Drop
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.wire-list-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function saveWireListOrder() {
    const container = document.getElementById('wireCutListItems');
    const items = [...container.querySelectorAll('.wire-list-item')];
    const itemsToUpdate = [];

    for (let i = 0; i < items.length; i++) {
        const id = items[i].dataset.id;
        const item = wireCutList.find(item => item.id === id);
        if (item) {
            item.position = i;
            itemsToUpdate.push(item);
        }
    }

    if (itemsToUpdate.length > 0 && window.eecolDB && await window.eecolDB.isReady()) {
        await window.eecolDB.bulkPut('wireCutList', itemsToUpdate, false);
    }

    const records = await window.eecolDB.getAll('wireCutList');
    wireCutList = records.sort((a, b) => (a.position || 0) - (b.position || 0));
}

// Event Listeners Initialization
document.addEventListener('DOMContentLoaded', async function() {
    await initDatabase();

    if (typeof initModalSystem === 'function') {
        initModalSystem();
    }

    // Direct Add Button event
    const addBtnDirect = document.getElementById('addWireListItemBtnDirect');
    if (addBtnDirect) addBtnDirect.addEventListener('click', () => showWireListItemModal());

    // Refresh Button event
    const refreshBtn = document.getElementById('refreshWireListBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadWireCutList);

    // Search and filter events
    const statusFilter = document.getElementById('wireListStatusFilter');
    if (statusFilter) statusFilter.addEventListener('change', renderWireCutList);

    const searchInput = document.getElementById('wireListSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(renderWireCutList, 250));
    }

    // Initialize Pastel Presets (exactly the 6 soft colors: Yellow, Red, Green, Blue, Purple, Orange)
    const pastelPresets = document.getElementById('pastelPresets');
    if (pastelPresets) {
        const softColors = [
            '#fef08a', // Soft Yellow
            '#fee2e2', // Soft Red
            '#d1fae5', // Soft Green
            '#dbeafe', // Soft Blue
            '#f3e8ff', // Soft Purple
            '#ffedd5'  // Soft Orange
        ];

        softColors.forEach(color => {
            const btn = document.createElement('button');
            btn.className = 'w-full aspect-square rounded-md border border-black/5 hover:scale-110 transition-transform';
            btn.style.backgroundColor = color;
            btn.onclick = (e) => {
                e.stopPropagation();
                if (currentContextMenuId) {
                    updateWireListItemColor(currentContextMenuId, color);
                }
            };
            pastelPresets.appendChild(btn);
        });
    }

    // Custom color picker fallback
    const ctxColorPicker = document.getElementById('ctxColorPicker');
    if (ctxColorPicker) {
        ctxColorPicker.addEventListener('input', (e) => {
            if (currentContextMenuId) {
                updateWireListItemColor(currentContextMenuId, e.target.value);
            }
        });
    }

    // Modal input listeners for auto-capitalization
    ['wireListOrder', 'wireListCustomer', 'wireListWireType'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
    });

    // Modal events
    const cancelBtn = document.getElementById('cancelWireListItemBtn');
    const saveBtn = document.getElementById('saveWireListItemBtn');
    const backdrop = document.getElementById('wireModalBackdrop');

    if (cancelBtn) cancelBtn.addEventListener('click', hideWireListItemModal);
    if (saveBtn) saveBtn.addEventListener('click', saveWireListItem);
    if (backdrop) backdrop.addEventListener('click', hideWireListItemModal);

    // Removal reason modal events
    const cancelRemBtn = document.getElementById('cancelRemovalBtn');
    const confirmRemBtn = document.getElementById('confirmRemovalBtn');
    const remBackdrop = document.getElementById('removalModalBackdrop');

    if (cancelRemBtn) cancelRemBtn.addEventListener('click', hideRemovalReasonModal);
    if (confirmRemBtn) confirmRemBtn.addEventListener('click', saveRemovalWithReason);
    if (remBackdrop) remBackdrop.addEventListener('click', hideRemovalReasonModal);

    // Context menu events
    document.addEventListener('click', hideWireListContextMenu);
    document.getElementById('ctxEdit').addEventListener('click', () => {
        if (currentContextMenuId) showWireListItemModal(currentContextMenuId);
    });
    document.getElementById('ctxActive').addEventListener('click', async () => {
        if (currentContextMenuId) {
            await setActiveWireListItem(currentContextMenuId);
        }
    });
    document.getElementById('ctxDeactivate').addEventListener('click', async () => {
        if (currentContextMenuId) {
            await clearActiveWireListItem(currentContextMenuId);
        }
    });
    document.getElementById('ctxRemove').addEventListener('click', async () => {
        if (currentContextMenuId) {
            const confirm = await showConfirm('Remove this item from the list?', 'Remove Item');
            if (confirm) {
                await deleteWireListItem(currentContextMenuId);
            }
        }
    });

    // Drag and drop events for the container
    const container = document.getElementById('wireCutListItems');
    if (container) {
        container.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(container, e.clientY);
            const dragging = document.querySelector('.dragging');
            if (afterElement == null) {
                container.appendChild(dragging);
            } else {
                container.insertBefore(dragging, afterElement);
            }
        });

        container.addEventListener('drop', async e => {
            e.preventDefault();
            await saveWireListOrder();
        });
    }

    // Real-time tab sync listener: automatically reload on any DB changes from other tabs
    window.addEventListener('storage', async function(e) {
        if (e.key === 'eecolDBChange' || e.key === null) {
            console.log('📡 DB change detected in another tab. Reloading standalone list...');
            await loadWireCutList();
        }
    });

    // Load initial list data
    await loadWireCutList();
});
