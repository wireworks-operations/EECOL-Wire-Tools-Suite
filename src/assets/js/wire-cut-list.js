/**
 * Dedicated Wire Cut List Workspace - JavaScript Module
 * Enterprise PWA
 */

// Global variables
let wireCutList = [];
let wireListEditingId = null;
let currentContextMenuId = null;
let currentContextMenuType = 'item'; // 'item' or 'group'
let draggedElementId = null;

// Group styling palettes (Distinct Thin Borders & High Contrast Colors)
const GROUP_PALETTES = [
    { border: 'border-2 border-purple-500', headerBg: 'bg-purple-100', headerText: 'text-purple-900', badgeBorder: 'border-purple-400' },
    { border: 'border-2 border-indigo-500', headerBg: 'bg-indigo-100', headerText: 'text-indigo-900', badgeBorder: 'border-indigo-400' },
    { border: 'border-2 border-emerald-500', headerBg: 'bg-emerald-100', headerText: 'text-emerald-900', badgeBorder: 'border-emerald-400' },
    { border: 'border-2 border-sky-500', headerBg: 'bg-sky-100', headerText: 'text-sky-900', badgeBorder: 'border-sky-400' },
    { border: 'border-2 border-rose-500', headerBg: 'bg-rose-100', headerText: 'text-rose-900', badgeBorder: 'border-rose-400' },
    { border: 'border-2 border-teal-500', headerBg: 'bg-teal-100', headerText: 'text-teal-900', badgeBorder: 'border-teal-400' },
    { border: 'border-2 border-amber-500', headerBg: 'bg-amber-100', headerText: 'text-amber-900', badgeBorder: 'border-amber-400' }
];

function getGroupStyle(groupName) {
    if (!groupName) return GROUP_PALETTES[0];
    let hash = 0;
    for (let i = 0; i < groupName.length; i++) {
        hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % GROUP_PALETTES.length;
    return GROUP_PALETTES[index];
}

/**
 * Calculates contrast color (dark gray '#1f2937' or white '#ffffff') based on WCAG relative luminance.
 */
function getContrastColor(color) {
    if (!color) return '#1f2937';
    let r = 0, g = 0, b = 0;
    if (color.startsWith('#')) {
        let hex = color.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16) / 255;
            g = parseInt(hex.substring(2, 4), 16) / 255;
            b = parseInt(hex.substring(4, 6), 16) / 255;
        } else {
            return '#1f2937';
        }
    } else if (color.startsWith('rgb')) {
        const parts = color.match(/\d+/g);
        if (parts && parts.length >= 3) {
            r = parseInt(parts[0], 10) / 255;
            g = parseInt(parts[1], 10) / 255;
            b = parseInt(parts[2], 10) / 255;
        } else {
            return '#1f2937';
        }
    } else {
        return '#1f2937';
    }

    const aR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const aG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const aB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    const luminance = 0.2126 * aR + 0.7152 * aG + 0.0722 * aB;

    return luminance > 0.179 ? '#1f2937' : '#ffffff';
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
    if (typeof EECOLIndexedDB !== 'undefined') {
        try {
            window.eecolDB = EECOLIndexedDB.getInstance();
            await window.eecolDB.isReady();
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

// Render Single Card Helper
function renderSingleItemCard(item) {
    const card = document.createElement('div');
    card.className = 'wire-list-card cursor-pointer transition hover:brightness-95 p-3 rounded-lg border shadow-sm relative';
    card.onclick = () => showWireListItemModal(item.id);

    if (item.isActive) {
        card.classList.add('animate-pulse', 'ring-2', 'ring-amber-400', 'shadow-[0_0_15px_rgba(251,191,36,0.5)]');
    }

    const bgColor = item.color || '#ffffff';
    const textColor = getContrastColor(bgColor);
    const isDarkBg = textColor === '#ffffff';

    card.style.backgroundColor = bgColor;
    card.style.color = textColor;
    card.style.borderColor = isDarkBg ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

    // Header Labels
    const headerRow = document.createElement('div');
    headerRow.className = `flex justify-between items-start border-b ${isDarkBg ? 'border-white/20' : 'border-black/10'} pb-1 mb-1 font-bold text-[10px] uppercase`;

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
    orderLine.className = 'font-bold text-sm flex items-center gap-2 flex-wrap';
    orderLine.textContent = `${item.orderNumber || 'N/A'} / ${item.lineNumber || '1'}`;

    if (item.isActive) {
        const activeBadge = document.createElement('span');
        activeBadge.className = 'px-1 bg-amber-100 text-amber-800 rounded text-[8px] uppercase border border-amber-300 font-black';
        activeBadge.textContent = '🌟 Active';
        orderLine.appendChild(activeBadge);
    }

    if (item.isFullPick) {
        const fpBadge = document.createElement('span');
        fpBadge.className = 'px-1 bg-blue-100 text-blue-800 rounded text-[8px] uppercase border border-blue-300 font-black';
        fpBadge.textContent = '📦 Full Pick';
        orderLine.appendChild(fpBadge);
    }

    if (item.isReReel) {
        const rrBadge = document.createElement('span');
        rrBadge.className = 'px-1 bg-purple-100 text-purple-800 rounded text-[8px] uppercase border border-purple-300 font-black';
        rrBadge.textContent = '🔄 Re-Reel';
        orderLine.appendChild(rrBadge);
    }

    if (item.urgency && item.urgency !== 'normal') {
        const urgencyBadge = document.createElement('span');
        urgencyBadge.className = `px-1 rounded text-[8px] uppercase ${item.urgency === 'critical' ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-500 text-white'}`;
        urgencyBadge.textContent = item.urgency;
        orderLine.appendChild(urgencyBadge);
    }

    const meta = document.createElement('div');
    meta.className = `text-[9px] font-bold ${isDarkBg ? 'text-white/80' : 'text-gray-700'}`;
    const dateStr = new Date(item.timestamp).toLocaleString('en-US', {
        month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    }).toUpperCase();
    meta.textContent = `${dateStr} @ ${item.customerName || 'N/A'}`;

    const highlightBox = document.createElement('div');
    highlightBox.className = `mt-2 ${isDarkBg ? 'bg-white/10 border-white/20' : 'bg-black/5 border-black/10'} p-1 rounded italic font-black text-xs`;

    const typeLength = document.createElement('div');
    let typeLengthText = `${item.lengthZ || '0'} Z \u00A0\u00A0 ${item.wireType || 'N/A'}`;
    if (item.reelSize) {
        typeLengthText += ` \u00A0\u00A0 [RLS: ${item.reelSize}\"]`;
    }
    typeLength.textContent = typeLengthText;

    const desc = document.createElement('span');
    desc.className = `text-[9px] font-normal ${isDarkBg ? 'text-white/90' : 'text-gray-800'}`;
    desc.textContent = item.description || '';

    highlightBox.appendChild(typeLength);
    highlightBox.appendChild(desc);

    detailsCol.appendChild(orderLine);
    detailsCol.appendChild(meta);
    detailsCol.appendChild(highlightBox);

    // Middle Column (Order Comments)
    const orderCommentsCol = document.createElement('div');
    orderCommentsCol.className = `w-1/3 border-l ${isDarkBg ? 'border-white/20' : 'border-black/10'} pl-2 text-[10px] whitespace-pre-wrap`;
    orderCommentsCol.textContent = item.orderComments || '';

    // Right Column (Shipper Comments)
    const shipperCommentsCol = document.createElement('div');
    shipperCommentsCol.className = `w-1/3 border-l ${isDarkBg ? 'border-white/20' : 'border-black/10'} pl-2 text-[10px] whitespace-pre-wrap`;
    shipperCommentsCol.textContent = item.shipperComments || '';

    bodyRow.appendChild(detailsCol);
    bodyRow.appendChild(orderCommentsCol);
    bodyRow.appendChild(shipperCommentsCol);

    card.appendChild(headerRow);
    card.appendChild(bodyRow);

    // Removal Reason
    if (item.status === 'removed' && item.removalReason) {
        const reasonDiv = document.createElement('div');
        reasonDiv.className = `mt-1 p-1 ${isDarkBg ? 'bg-red-900/40 border-red-400 text-red-100' : 'bg-red-100/50 border-red-200 text-red-900'} border rounded text-[9px] italic`;
        reasonDiv.textContent = `Removal Reason: ${item.removalReason}`;
        card.appendChild(reasonDiv);
    }

    // Action Buttons (only for active items)
    if (item.status === 'active') {
        const actionsRow = document.createElement('div');
        actionsRow.className = `flex justify-end gap-2 mt-2 pt-1 border-t ${isDarkBg ? 'border-white/20' : 'border-black/10'}`;

        const autoFillBtn = document.createElement('button');
        autoFillBtn.className = 'px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-md active:scale-95';
        autoFillBtn.textContent = '📥 AutoFill Cut';
        autoFillBtn.onclick = (e) => {
            e.stopPropagation();
            triggerAutoFill(item.id);
        };

        const completeBtn = document.createElement('button');
        completeBtn.className = 'px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition shadow-md active:scale-95';
        completeBtn.textContent = '✅ Complete';
        completeBtn.onclick = (e) => {
            e.stopPropagation();
            completeWireListItem(item.id);
        };

        const removeBtn = document.createElement('button');
        removeBtn.className = 'px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition shadow-md active:scale-95';
        removeBtn.textContent = '❌ Remove';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            showRemovalReasonModal(item.id);
        };

        actionsRow.appendChild(autoFillBtn);
        actionsRow.appendChild(completeBtn);
        actionsRow.appendChild(removeBtn);
        card.appendChild(actionsRow);
    } else if (item.status === 'completed' || item.status === 'removed') {
        const actionsRow = document.createElement('div');
        actionsRow.className = `flex justify-end gap-2 mt-2 pt-1 border-t ${isDarkBg ? 'border-white/20' : 'border-black/10'}`;

        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-xs font-bold hover:bg-yellow-700 transition shadow-md active:scale-95';
        restoreBtn.textContent = '🔄 Restore';
        restoreBtn.onclick = (e) => {
            e.stopPropagation();
            restoreWireListItem(item.id);
        };

        actionsRow.appendChild(restoreBtn);
        card.appendChild(actionsRow);
    }

    card.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation();
        showWireListContextMenu(e, item.id, 'item');
    });

    return card;
}

// Render Wire Cut List (With Merged Groups)
function renderWireCutList() {
    const container = document.getElementById('wireCutListItems');
    if (!container) return;

    const filter = document.getElementById('wireListStatusFilter')?.value || 'active';
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
                item.shipperComments,
                item.groupName
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

    // Grouping entries for merged display while respecting global order
    const renderBlocks = [];
    const processedGroupNames = new Set();

    filtered.forEach(item => {
        if (item.groupName) {
            if (!processedGroupNames.has(item.groupName)) {
                processedGroupNames.add(item.groupName);
                const groupItems = filtered.filter(i => i.groupName === item.groupName);
                renderBlocks.push({ type: 'group', name: item.groupName, items: groupItems, position: item.position || 0 });
            }
        } else {
            renderBlocks.push({ type: 'single', item: item, position: item.position || 0 });
        }
    });

    renderBlocks.forEach(block => {
        if (block.type === 'single') {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'wire-list-item';
            itemDiv.draggable = true;
            itemDiv.dataset.id = block.item.id;
            itemDiv.dataset.type = 'single';

            const card = renderSingleItemCard(block.item);
            itemDiv.appendChild(card);

            itemDiv.addEventListener('dragstart', () => {
                itemDiv.classList.add('dragging');
                draggedElementId = block.item.id;
            });

            itemDiv.addEventListener('dragend', () => {
                itemDiv.classList.remove('dragging');
            });

            container.appendChild(itemDiv);
        } else if (block.type === 'group') {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'wire-list-item wire-group-container my-3 rounded-xl overflow-hidden shadow-md transition-all duration-200';
            groupDiv.draggable = true;
            groupDiv.dataset.groupName = block.name;
            groupDiv.dataset.type = 'group';

            const groupStyle = getGroupStyle(block.name);

            // Check if group is active (if all items or any item marked isGroupActive)
            const isGroupActive = block.items.some(i => i.isGroupActive);
            if (isGroupActive) {
                groupDiv.className += ' animate-pulse ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]';
            }

            // Group Outer Border (Thin colored line)
            groupDiv.classList.add(...groupStyle.border.split(' '));

            // Group Header Bar
            const headerBar = document.createElement('div');
            headerBar.className = `p-2.5 ${groupStyle.headerBg} ${groupStyle.headerText} flex justify-between items-center cursor-pointer font-bold border-b ${groupStyle.badgeBorder}`;

            const headerTitle = document.createElement('div');
            headerTitle.className = 'flex items-center gap-2 text-xs uppercase tracking-wide';
            headerTitle.innerHTML = `<span>📁 Group: <strong>${block.name}</strong></span> <span class="px-2 py-0.5 rounded-full bg-white/70 text-[10px] font-black shadow-xs">${block.items.length} Items</span>`;

            if (isGroupActive) {
                const groupActiveBadge = document.createElement('span');
                groupActiveBadge.className = 'px-2 py-0.5 bg-amber-500 text-white rounded text-[9px] font-black uppercase shadow animate-bounce';
                groupActiveBadge.textContent = '🌟 Active Group';
                headerTitle.appendChild(groupActiveBadge);
            }

            headerBar.appendChild(headerTitle);

            headerBar.addEventListener('contextmenu', e => {
                e.preventDefault();
                e.stopPropagation();
                showWireListContextMenu(e, block.name, 'group');
            });

            // Group Items Body Container
            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'p-2 space-y-2 bg-gray-50/50';

            block.items.forEach(gItem => {
                const subCard = renderSingleItemCard(gItem);
                itemsContainer.appendChild(subCard);
            });

            groupDiv.appendChild(headerBar);
            groupDiv.appendChild(itemsContainer);

            groupDiv.addEventListener('dragstart', () => {
                groupDiv.classList.add('dragging');
                draggedElementId = block.name;
            });

            groupDiv.addEventListener('dragend', () => {
                groupDiv.classList.remove('dragging');
            });

            container.appendChild(groupDiv);
        }
    });
}

// Trigger AutoFill via localStorage communication & WireCutLinker
async function triggerAutoFill(id) {
    const item = wireCutList.find(i => i.id === id);
    if (!item) return;

    // Trigger storage event fallback
    localStorage.setItem('eecolWireListAutofillId', id);

    // Send via WireCutLinker
    if (window.wireCutLinker) {
        window.wireCutLinker.send({
            type: 'trigger_autofill',
            itemId: id,
            orderNumber: item.orderNumber || 'Item'
        });
    }

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

// Restore Wire List Item
async function restoreWireListItem(id) {
    const item = wireCutList.find(i => i.id === id);
    if (item) {
        item.status = 'active';
        item.updatedAt = Date.now();
        delete item.removalReason;

        try {
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.update('wireCutList', item);

                const statusFilter = document.getElementById('wireListStatusFilter');
                if (statusFilter && statusFilter.value !== 'all' && statusFilter.value !== 'active') {
                    statusFilter.value = 'active';
                }

                await loadWireCutList();
                showToast(`Order #${item.orderNumber || 'Item'} restored to active list`, 'success');
            }
        } catch (error) {
            console.error("Error restoring wire list item:", error);
            showToast("Failed to restore item", "error");
        }
    }
}

// Complete Wire List Item
async function completeWireListItem(id, silent = false) {
    const item = wireCutList.find(i => i.id === id);
    if (item) {
        item.status = 'completed';
        item.isActive = false;
        item.isGroupActive = false;
        item.updatedAt = Date.now();
        try {
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.update('wireCutList', item);
                await loadWireCutList();

                if (window.wireCutLinker) {
                    const activeItem = wireCutList.find(i => (i.status === 'active' || !i.status) && (i.isActive || i.isGroupActive));
                    window.wireCutLinker.send({ type: 'active_order_update', activeItem: activeItem || null });
                }

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
            document.getElementById('wireListFullPick').value = item.isFullPick ? 'yes' : 'no';
            document.getElementById('wireListReReel').value = item.isReReel ? 'yes' : 'no';
        }
    } else {
        title.textContent = 'Add Wire Cut List Item';
        document.getElementById('wireListOrder').value = '';
        document.getElementById('wireListLine').value = '001';
        document.getElementById('wireListCustomer').value = '';
        document.getElementById('wireListWireType').value = '';
        document.getElementById('wireListLength').value = '';
        document.getElementById('wireListReelSize').value = '';
        document.getElementById('wireListUrgency').value = 'normal';
        document.getElementById('wireListStatus').value = 'active';
        document.getElementById('wireListDescription').value = '';
        document.getElementById('wireListOrderComments').value = '';
        document.getElementById('wireListShipperComments').value = '';
        document.getElementById('wireListFullPick').value = 'no';
        document.getElementById('wireListReReel').value = 'no';
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
    const existing = wireListEditingId ? wireCutList.find(i => i.id === wireListEditingId) : null;
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
        isFullPick: document.getElementById('wireListFullPick').value === 'yes',
        isReReel: document.getElementById('wireListReReel').value === 'yes',
        timestamp: existing ? existing.timestamp : Date.now(),
        position: existing ? existing.position : wireCutList.length,
        color: existing ? existing.color : null,
        isActive: existing ? existing.isActive : false,
        isGroupActive: existing ? existing.isGroupActive : false,
        groupId: existing ? existing.groupId : null,
        groupName: existing ? existing.groupName : null
    };

    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.update('wireCutList', item);

            // Ensure status filter shows the saved item
            const statusFilter = document.getElementById('wireListStatusFilter');
            if (statusFilter && statusFilter.value !== 'all' && statusFilter.value !== item.status) {
                statusFilter.value = item.status;
            }

            // Clear search filter if active to avoid accidentally filtering out newly added item
            const searchInput = document.getElementById('wireListSearch');
            if (searchInput && searchInput.value.trim()) {
                searchInput.value = '';
            }

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

            if (window.wireCutLinker) {
                const activeItem = wireCutList.find(i => (i.status === 'active' || !i.status) && (i.isActive || i.isGroupActive));
                window.wireCutLinker.send({ type: 'active_order_update', activeItem: activeItem || null });
            }

            showToast("Item deleted", "success");
        }
    } catch (error) {
        console.error("Error deleting wire list item:", error);
    }
}

async function setActiveWireListItem(id) {
    wireCutList.forEach(item => {
        item.isActive = false;
        item.isGroupActive = false;
    });

    const item = wireCutList.find(i => i.id === id);
    if (item) {
        item.isActive = true;
    }

    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.bulkPut('wireCutList', wireCutList, false);
            renderWireCutList();
            if (window.wireCutLinker) {
                window.wireCutLinker.send({ type: 'active_order_update', activeItem: item || null });
            }
            showToast(`Order #${item?.orderNumber || 'Unknown'} set as Active`, 'info');
        }
    } catch (error) {
        console.error("Error setting active item:", error);
    }
}

async function setActiveGroup(groupName) {
    wireCutList.forEach(item => {
        item.isActive = false;
        item.isGroupActive = (item.groupName === groupName);
    });

    const activeItem = wireCutList.find(i => i.isGroupActive);

    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.bulkPut('wireCutList', wireCutList, false);
            renderWireCutList();
            if (window.wireCutLinker) {
                window.wireCutLinker.send({ type: 'active_order_update', activeItem: activeItem || null });
            }
            showToast(`Group "${groupName}" set as Active Group`, 'info');
        }
    } catch (error) {
        console.error("Error setting active group:", error);
    }
}

async function clearActiveWireListItem() {
    wireCutList.forEach(item => {
        item.isActive = false;
        item.isGroupActive = false;
    });

    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.bulkPut('wireCutList', wireCutList, false);
            renderWireCutList();
            if (window.wireCutLinker) {
                window.wireCutLinker.send({ type: 'active_order_update', activeItem: null });
            }
            showToast('Active status cleared for all items & groups', 'warning');
        }
    } catch (error) {
        console.error("Error clearing active status:", error);
    }
}

async function disbandGroup(groupName) {
    const itemsToUpdate = wireCutList.filter(item => item.groupName === groupName);
    itemsToUpdate.forEach(item => {
        item.groupName = null;
        item.groupId = null;
        item.isGroupActive = false;
        item.updatedAt = Date.now();
    });

    try {
        if (window.eecolDB && await window.eecolDB.isReady()) {
            await window.eecolDB.bulkPut('wireCutList', itemsToUpdate, false);
            await loadWireCutList();
            showToast(`Disbanded group "${groupName}"`, 'warning');
        }
    } catch (error) {
        console.error("Error disbanding group:", error);
        showAlert("Failed to disband group.", "Error");
    }
}

// Group Modal Management Logic
function showGroupModal(id) {
    currentContextMenuId = id;
    const modal = document.getElementById('groupModal');
    const modalContent = document.getElementById('groupModalContent');
    const groupSelect = document.getElementById('groupSelect');
    const existingContainer = document.getElementById('existingGroupContainer');
    const groupNameInput = document.getElementById('groupNameInput');
    const removeBtn = document.getElementById('removeFromGroupBtn');

    groupSelect.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '-- Choose Existing Group --';
    groupSelect.appendChild(defaultOpt);

    // Find unique existing groups
    const uniqueGroups = [...new Set(wireCutList.map(item => item.groupName).filter(Boolean))];
    if (uniqueGroups.length > 0) {
        existingContainer.classList.remove('hidden');
        uniqueGroups.forEach(gName => {
            const opt = document.createElement('option');
            opt.value = gName;
            opt.textContent = `📁 ${gName}`;
            groupSelect.appendChild(opt);
        });
    } else {
        existingContainer.classList.add('hidden');
    }

    const item = wireCutList.find(i => i.id === id);
    if (item && item.groupName) {
        groupNameInput.value = item.groupName;
        removeBtn.classList.remove('hidden');
    } else {
        groupNameInput.value = '';
        removeBtn.classList.add('hidden');
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
        groupNameInput.focus();
    }, 10);
}

function hideGroupModal() {
    const modal = document.getElementById('groupModal');
    const modalContent = document.getElementById('groupModalContent');

    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

async function saveGroupAssignment() {
    const inputVal = document.getElementById('groupNameInput').value.trim();
    const selectVal = document.getElementById('groupSelect').value.trim();
    const targetGroupName = inputVal || selectVal;

    if (!targetGroupName) {
        showAlert('Please select an existing group or type a new group name.', 'Group Name Required');
        return;
    }

    const item = wireCutList.find(i => i.id === currentContextMenuId);
    if (item) {
        item.groupName = targetGroupName;
        item.groupId = targetGroupName.toLowerCase().replace(/\s+/g, '_');
        item.updatedAt = Date.now();

        try {
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.update('wireCutList', item);
                await loadWireCutList();
                hideGroupModal();
                showToast(`Order #${item.orderNumber || 'Item'} added to group "${targetGroupName}"`, 'success');
            }
        } catch (error) {
            console.error("Error saving group assignment:", error);
            showAlert("Failed to assign group.", "Error");
        }
    }
}

async function removeGroupAssignment() {
    const item = wireCutList.find(i => i.id === currentContextMenuId);
    if (item) {
        const prevGroup = item.groupName;
        item.groupName = null;
        item.groupId = null;
        item.isGroupActive = false;
        item.updatedAt = Date.now();

        try {
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.update('wireCutList', item);
                await loadWireCutList();
                hideGroupModal();
                showToast(`Removed Order #${item.orderNumber || 'Item'} from group "${prevGroup}"`, 'warning');
            }
        } catch (error) {
            console.error("Error removing group assignment:", error);
            showAlert("Failed to remove from group.", "Error");
        }
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
        item.isActive = false;
        item.isGroupActive = false;
        item.removalReason = reason;
        item.updatedAt = Date.now();
        try {
            if (window.eecolDB && await window.eecolDB.isReady()) {
                await window.eecolDB.update('wireCutList', item);
                await loadWireCutList();

                if (window.wireCutLinker) {
                    const activeItem = wireCutList.find(i => (i.status === 'active' || !i.status) && (i.isActive || i.isGroupActive));
                    window.wireCutLinker.send({ type: 'active_order_update', activeItem: activeItem || null });
                }

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
function showWireListContextMenu(e, idOrGroupName, type = 'item') {
    const menu = document.getElementById('wireListContextMenu');
    currentContextMenuId = idOrGroupName;
    currentContextMenuType = type;

    menu.style.top = `${e.pageY}px`;
    menu.style.left = `${e.pageX}px`;
    menu.classList.remove('hidden');

    const groupActiveBtn = document.getElementById('ctxGroupActive');
    const disbandGroupBtn = document.getElementById('ctxDisbandGroup');
    const itemActiveBtn = document.getElementById('ctxActive');
    const addGroupBtn = document.getElementById('ctxGroup');
    const removeBtn = document.getElementById('ctxRemove');
    const pastelSection = document.getElementById('pastelSection');

    if (type === 'group') {
        if (groupActiveBtn) groupActiveBtn.classList.remove('hidden');
        if (disbandGroupBtn) disbandGroupBtn.classList.remove('hidden');

        if (itemActiveBtn) itemActiveBtn.classList.add('hidden');
        if (addGroupBtn) addGroupBtn.classList.add('hidden');
        if (removeBtn) removeBtn.classList.add('hidden');
        if (pastelSection) pastelSection.classList.add('hidden');
    } else {
        if (groupActiveBtn) groupActiveBtn.classList.add('hidden');
        if (disbandGroupBtn) disbandGroupBtn.classList.add('hidden');

        if (itemActiveBtn) itemActiveBtn.classList.remove('hidden');
        if (addGroupBtn) addGroupBtn.classList.remove('hidden');
        if (removeBtn) removeBtn.classList.remove('hidden');
        if (pastelSection) pastelSection.classList.remove('hidden');

        const item = wireCutList.find(i => i.id === idOrGroupName);
        if (item && item.color) {
            document.getElementById('ctxColorPicker').value = item.color;
        } else {
            document.getElementById('ctxColorPicker').value = '#fef08a';
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
    const elements = [...container.querySelectorAll('.wire-list-item')];
    const itemsToUpdate = [];
    let currentPos = 0;

    elements.forEach(el => {
        const type = el.dataset.type;
        if (type === 'single') {
            const id = el.dataset.id;
            const item = wireCutList.find(i => i.id === id);
            if (item) {
                item.position = currentPos++;
                itemsToUpdate.push(item);
            }
        } else if (type === 'group') {
            const groupName = el.dataset.groupName;
            const groupItems = wireCutList.filter(i => i.groupName === groupName);
            groupItems.forEach(item => {
                item.position = currentPos++;
                itemsToUpdate.push(item);
            });
        }
    });

    if (itemsToUpdate.length > 0 && window.eecolDB && await window.eecolDB.isReady()) {
        await window.eecolDB.bulkPut('wireCutList', itemsToUpdate, false);
    }

    const records = await window.eecolDB.getAll('wireCutList');
    wireCutList = records.sort((a, b) => (a.position || 0) - (b.position || 0));
}

// Initialize Linker and Connection Badge
function initLinkerConnection() {
    if (typeof WireCutLinker === 'undefined') return;

    window.wireCutLinker = new WireCutLinker();

    const badge = document.getElementById('connectionBadge');

    function updateBadge(connected) {
        if (!badge) return;
        if (connected) {
            badge.className = 'px-3 py-1 text-xs font-bold rounded-full shadow-md border flex items-center gap-1.5 transition-all duration-300 bg-green-100 text-green-800 border-green-300';
            badge.textContent = '🟢 Connected to Cutting Records';
        } else {
            badge.className = 'px-3 py-1 text-xs font-bold rounded-full shadow-md border flex items-center gap-1.5 transition-all duration-300 bg-red-100 text-red-800 border-red-300';
            badge.textContent = '🔴 Cutting Records Not Detected';
        }
    }

    window.wireCutLinker.onMessage((data) => {
        if (data.type === 'heartbeat') {
            updateBadge(true);
        } else if (data.type === 'autofill_ack') {
            showToast(`✅ Cutting Records received AutoFill for Order #${data.orderNumber}`, 'success');
        }
    });

    // Heartbeat check loop
    setInterval(() => {
        updateBadge(window.wireCutLinker.isConnected());
    }, 2000);
}

// Event Listeners Initialization
document.addEventListener('DOMContentLoaded', async function() {
    await initDatabase();
    initLinkerConnection();

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

    // Initialize Pastel Presets
    const pastelPresets = document.getElementById('pastelPresets');
    if (pastelPresets) {
        const softColors = [
            '#eff6ff', // Soft Blue
            '#ecfdf5', // Soft Green
            '#fffbeb', // Soft Yellow
            '#fef2f2', // Soft Red
            '#f5f3ff', // Soft Purple
            '#faf5ff', // Soft Pink
            '#f0fdf4', // Soft Emerald
            '#fff7ed'  // Soft Orange
        ];

        softColors.forEach(color => {
            const btn = document.createElement('button');
            btn.className = 'w-full aspect-square rounded-md border border-black/5 hover:scale-110 transition-transform';
            btn.style.backgroundColor = color;
            btn.onclick = (e) => {
                e.stopPropagation();
                if (currentContextMenuId && currentContextMenuType === 'item') {
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
            if (currentContextMenuId && currentContextMenuType === 'item') {
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

    // Group Modal events
    const cancelGroupBtn = document.getElementById('cancelGroupBtn');
    const saveGroupBtn = document.getElementById('saveGroupBtn');
    const removeGroupBtn = document.getElementById('removeFromGroupBtn');
    const groupModalBackdrop = document.getElementById('groupModalBackdrop');
    const groupSelect = document.getElementById('groupSelect');

    if (cancelGroupBtn) cancelGroupBtn.addEventListener('click', hideGroupModal);
    if (saveGroupBtn) saveGroupBtn.addEventListener('click', saveGroupAssignment);
    if (removeGroupBtn) removeGroupBtn.addEventListener('click', removeGroupAssignment);
    if (groupModalBackdrop) groupModalBackdrop.addEventListener('click', hideGroupModal);

    const groupNameInput = document.getElementById('groupNameInput');
    if (groupNameInput) {
        groupNameInput.addEventListener('input', (e) => {
            if (groupSelect && groupSelect.value !== e.target.value) {
                groupSelect.value = '';
            }
        });
    }

    if (groupSelect) {
        groupSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                document.getElementById('groupNameInput').value = e.target.value;
            }
        });
    }

    // Context menu events
    document.addEventListener('click', hideWireListContextMenu);

    const ctxGroupActive = document.getElementById('ctxGroupActive');
    if (ctxGroupActive) {
        ctxGroupActive.addEventListener('click', async () => {
            if (currentContextMenuId && currentContextMenuType === 'group') {
                await setActiveGroup(currentContextMenuId);
            }
        });
    }

    const ctxDisbandGroup = document.getElementById('ctxDisbandGroup');
    if (ctxDisbandGroup) {
        ctxDisbandGroup.addEventListener('click', async () => {
            if (currentContextMenuId && currentContextMenuType === 'group') {
                const confirm = await showConfirm(`Disband group "${currentContextMenuId}"?`, 'Disband Group');
                if (confirm) {
                    await disbandGroup(currentContextMenuId);
                }
            }
        });
    }

    document.getElementById('ctxActive').addEventListener('click', async () => {
        if (currentContextMenuId && currentContextMenuType === 'item') {
            await setActiveWireListItem(currentContextMenuId);
        }
    });

    const ctxClearActive = document.getElementById('ctxClearActive');
    if (ctxClearActive) {
        ctxClearActive.addEventListener('click', async () => {
            await clearActiveWireListItem();
        });
    }

    document.getElementById('ctxGroup').addEventListener('click', () => {
        if (currentContextMenuId && currentContextMenuType === 'item') showGroupModal(currentContextMenuId);
    });

    document.getElementById('ctxRemove').addEventListener('click', async () => {
        if (currentContextMenuId && currentContextMenuType === 'item') {
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
            if (dragging) {
                if (afterElement == null) {
                    container.appendChild(dragging);
                } else {
                    container.insertBefore(dragging, afterElement);
                }
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
