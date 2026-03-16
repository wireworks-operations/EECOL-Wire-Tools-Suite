/**
 * EECOL Wire Tools Suite - Shared Modal System
 * Enterprise PWA v0.8.0.0
 */

// Custom Modal Functions for EECOL Themed Alerts/Confirmations
function showAlert(message, title = "Notification") {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        if (!modal) {
            console.warn('Custom modal element not found in DOM');
            resolve(); // Fallback resolution
            return;
        }

        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalInput = document.getElementById('modalInput');
        const modalButtons = document.getElementById('modalButtons');

        if (!modalTitle || !modalMessage || !modalButtons) {
            console.warn('Modal elements not found');
            resolve();
            return;
        }

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalMessage.classList.add('whitespace-pre-line');
        if (modalInput) modalInput.style.display = 'none';
        modalButtons.innerHTML = '<button id="modalOKBtn" class="px-4 py-2 bg-blue-700 text-white rounded-xl shadow-lg hover:bg-blue-800 transform hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease-in-out text-sm font-semibold">OK</button>';

        const okBtn = modalButtons.querySelector('#modalOKBtn');
        okBtn.addEventListener('click', () => {
            hideModal();
            resolve();
        });

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

function showConfirm(message, title = "Confirmation") {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalInput = document.getElementById('modalInput');
        const modalButtons = document.getElementById('modalButtons');

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalMessage.classList.add('whitespace-pre-line');
        if (modalInput) modalInput.style.display = 'none';
        modalButtons.innerHTML = `
            <button id="modalCancelBtn" class="px-4 py-2 bg-gray-500 text-white rounded-xl shadow-lg hover:bg-gray-600 transform hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease-in-out text-sm font-semibold mr-2">Cancel</button>
            <button id="modalOKBtn" class="px-4 py-2 bg-blue-700 text-white rounded-xl shadow-lg hover:bg-blue-800 transform hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease-in-out text-sm font-semibold">OK</button>
        `;

        const okBtn = modalButtons.querySelector('#modalOKBtn');
        const cancelBtn = modalButtons.querySelector('#modalCancelBtn');

        okBtn.addEventListener('click', () => {
            hideModal();
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            hideModal();
            resolve(false);
        });

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

function showDateInputModal(title = "Select Date") {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalInput = document.getElementById('modalInput');
        const modalButtons = document.getElementById('modalButtons');
        const dateInput = document.getElementById('modalDateInput');

        if (!modal || !modalTitle || !modalMessage || !modalInput || !modalButtons || !dateInput) {
            console.warn('Modal elements not found for showDateInputModal');
            resolve(null);
            return;
        }

        modalTitle.textContent = title;
        modalMessage.textContent = 'Select the date of the maintenance record you want to view:';
        modalInput.style.display = 'block';
        dateInput.value = new Date().toISOString().split('T')[0];
        modalButtons.innerHTML = `
            <button id="modalLoadBtn" class="px-4 py-2 bg-blue-700 text-white rounded-xl shadow-lg hover:bg-blue-800 transform hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease-in-out text-sm font-semibold">Load Record</button>
            <button id="modalCancelBtn" class="px-4 py-2 bg-gray-500 text-white rounded-xl shadow-lg hover:bg-gray-600 transform hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease-in-out text-sm font-semibold ml-3">Cancel</button>
        `;

        const loadBtn = modalButtons.querySelector('#modalLoadBtn');
        const cancelBtn = modalButtons.querySelector('#modalCancelBtn');

        loadBtn.addEventListener('click', () => {
            const selectedDate = dateInput.value;
            hideModal();
            resolve(selectedDate);
        });

        cancelBtn.addEventListener('click', () => {
            hideModal();
            resolve(null);
        });

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

function hideModal() {
    const modal = document.getElementById('customModal');
    const modalContent = document.getElementById('modalContent');

    if (!modal || !modalContent) return;

    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// Initialize modal close on backdrop click
function initModalSystem() {
    // Initialize modal close on backdrop click
    document.addEventListener('DOMContentLoaded', function() {
        const modalBackdrop = document.getElementById('modalBackdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', hideModal);
        }
    });
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.showAlert = showAlert;
    window.showConfirm = showConfirm;
    window.showDateInputModal = showDateInputModal;
    window.hideModal = hideModal;
    window.initModalSystem = initModalSystem;
}
