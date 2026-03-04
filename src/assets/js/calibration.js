/**
 * Calibration Measurements Logic
 * EECOL Wire Tools Suite
 */

const machines = [
    "Manual Hand Coiler",
    "Green Electric Hand Coiler",
    "Blue Electric Hand Coiler",
    "Telus Machine",
    "Big Blue Machine # 1",
    "Big Blue Machine # 2"
];

let dbReady = false;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeDB();
        renderMachines();
    } catch (error) {
        console.error("Failed to initialize database:", error);
        showModal('Error', 'Failed to connect to the database. Please try refreshing the page.');
    }
});

async function initializeDB() {
    try {
        if (window.eecolDBPromise) {
            await window.eecolDBPromise;
        }

        if (!window.EECOLIndexedDB) {
            throw new Error('EECOLIndexedDB is not available globally');
        }

        window.eecolDB = EECOLIndexedDB.getInstance();
        await window.eecolDB.isReady();
        dbReady = true;
    } catch (error) {
        console.error('Failed to initialize db instance:', error);
        throw error;
    }
}

async function renderMachines() {
    const container = document.getElementById('calibrationContainer');
    if (!container) return;

    container.innerHTML = ''; // Clear existing

    let htmlContent = '';

    for (let i = 0; i < machines.length; i++) {
        const machineName = machines[i];
        const machineId = `machine-${i}`;

        // Fetch recent measurements
        let recentMeasurements = [];
        if (dbReady) {
            try {
                recentMeasurements = await window.eecolDB.getRecentCalibrationMeasurements(machineName, 3);
                // Sort ascending for display: older -> newer
                recentMeasurements = recentMeasurements.sort((a, b) => a.timestamp - b.timestamp);
            } catch (error) {
                console.error(`Error fetching measurements for ${machineName}:`, error);
            }
        }

        htmlContent += `
            <div class="bg-white p-6 rounded-xl shadow-lg border-l-4 card-border-blue mb-6 machine-section dark:bg-slate-800 dark:border-slate-600" id="${machineId}">
                <h2 class="text-xl font-bold text-[#0058B3] mb-4 text-center dark:text-blue-400">${machineName}</h2>

                <div class="mb-6">
                    <h3 class="text-sm font-semibold mb-3 header-gradient dark:text-gray-300">Previous Measurements:</h3>
                    ${renderPreviousMeasurements(recentMeasurements)}
                </div>

                <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <h3 class="text-sm font-semibold mb-3 header-gradient dark:text-gray-300">New Calibration Entry:</h3>
                    <div class="flex flex-col sm:flex-row gap-4 items-end">
                        <div class="flex-1 w-full">
                            <label class="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Measured Length</label>
                            <input type="number" id="input-${machineId}" step="0.01" min="0" placeholder="e.g. 10.5"
                                class="w-full p-3 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-400">
                        </div>
                        <div class="w-full sm:w-auto">
                            <label class="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Unit</label>
                            <select id="unit-${machineId}" class="w-full sm:w-32 p-3 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                <option value="ft">Feet (ft)</option>
                                <option value="m">Meters (m)</option>
                            </select>
                        </div>
                        <div class="w-full sm:w-auto flex gap-2">
                            <button onclick="saveMeasurement('${machineName}', '${machineId}')"
                                class="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 border-2 border-indigo-600 text-white font-bold rounded-xl shadow-lg transition duration-200 ease-in-out transform hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-indigo-600 focus:ring-opacity-50 flex items-center justify-center">
                                💾 Save
                            </button>
                            <button onclick="printMeasurement('${machineName}')"
                                class="flex-1 sm:flex-none px-6 py-3 bg-gray-600 border-2 border-gray-600 text-white font-bold rounded-xl shadow-lg transition duration-200 ease-in-out transform hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-gray-600 focus:ring-opacity-50 flex items-center justify-center">
                                🖨️ Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = htmlContent;
}

function renderPreviousMeasurements(measurements) {
    if (!measurements || measurements.length === 0) {
        return `<div class="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-lg border border-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-400 text-center">No previous measurements found.</div>`;
    }

    let html = `<div class="flex flex-col gap-2">`;

    measurements.forEach((m, index) => {
        const date = new Date(m.timestamp).toLocaleString();
        html += `
            <div class="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-100 dark:bg-slate-700/50 dark:border-slate-600 transition-all hover:shadow-md">
                <div class="flex items-center gap-3">
                    <span class="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-200 text-indigo-800 text-xs font-bold dark:bg-indigo-900 dark:text-indigo-200">${index + 1}</span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">${date}</span>
                </div>
                <div class="font-bold text-indigo-700 dark:text-indigo-400 text-lg">
                    ${m.measurement}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    return html;
}

async function saveMeasurement(machineName, machineId) {
    const inputEl = document.getElementById(`input-${machineId}`);
    const unitEl = document.getElementById(`unit-${machineId}`);

    if (!inputEl || !unitEl) return;

    const value = parseFloat(inputEl.value);

    if (isNaN(value) || value <= 0) {
        showModal('Invalid Input', 'Please enter a valid positive number for the measurement.');
        return;
    }

    const measurementStr = `${value} ${unitEl.value}`;

    try {
        if (!dbReady) {
            throw new Error("Database not ready");
        }

        await window.eecolDB.saveCalibrationMeasurement(machineName, measurementStr);

        // Clear input
        inputEl.value = '';

        // Show success and re-render to show updated list
        showModal('Success', `Measurement saved successfully for ${machineName}.`);
        await renderMachines();

    } catch (error) {
        console.error("Failed to save measurement:", error);
        showModal('Error', 'Failed to save measurement to the database.');
    }
}

async function printMeasurement(machineName) {
    if (!dbReady) {
        showModal('Error', 'Database not ready. Please try again.');
        return;
    }

    try {
        let recentMeasurements = await window.eecolDB.getRecentCalibrationMeasurements(machineName, 3);
        // Sort descending to show newest first on print
        recentMeasurements = recentMeasurements.sort((a, b) => b.timestamp - a.timestamp);

        if (typeof window.printMachineCalibrationMeasurement === 'function') {
            window.printMachineCalibrationMeasurement(machineName, recentMeasurements);
        } else {
            console.error("Print function printMachineCalibrationMeasurement not found in global scope.");
            showModal('Error', 'Print module is not loaded correctly.');
        }
    } catch (error) {
        console.error("Failed to print measurements:", error);
        showModal('Error', 'Failed to gather measurements for printing.');
    }
}

// Global modal helpers if not present
function showModal(title, message) {
    if (typeof window.showModal === 'function' && window.showModal !== showModal) {
        window.showModal(title, message);
        return;
    }

    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalButtons = document.getElementById('modalButtons');

    if (modal && modalTitle && modalMessage && modalButtons) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;

        modalButtons.innerHTML = '';
        const okBtn = document.createElement('button');
        okBtn.className = 'px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500';
        okBtn.textContent = 'OK';
        okBtn.onclick = () => {
            modal.classList.add('hidden');
            modal.querySelector('#modalContent').classList.remove('scale-100', 'opacity-100');
            modal.querySelector('#modalContent').classList.add('scale-95', 'opacity-0');
        };
        modalButtons.appendChild(okBtn);

        modal.classList.remove('hidden');
        // Small delay for transition
        setTimeout(() => {
            modal.querySelector('#modalContent').classList.remove('scale-95', 'opacity-0');
            modal.querySelector('#modalContent').classList.add('scale-100', 'opacity-100');
        }, 10);
    } else {
        alert(`${title}\n\n${message}`);
    }
}
