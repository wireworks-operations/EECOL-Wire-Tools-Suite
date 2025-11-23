/**
 * MultiCutPlanner Core Logic
 */
class MultiCutPlanner {
    constructor() {
        this.reels = [];
        this.units = 'metric'; // 'metric' or 'imperial'
        this.wireDiameter = 1.5; // Default mm
        this.startMark = 0;

        // Constants
        this.PACKING_FACTOR = 0.8; // Conservative estimate for random winding
    }

    setUnits(mode) {
        this.units = mode;
        // Adjust defaults if needed when switching
        if (mode === 'metric') {
            if (this.wireDiameter < 1) this.wireDiameter = 1.5;
        } else {
            if (this.wireDiameter > 1) this.wireDiameter = 0.06;
        }
    }

    addReel(length, dims = {}) {
        const reel = {
            id: Date.now(),
            length: parseFloat(length),
            flange: parseFloat(dims.flange) || 0,
            barrel: parseFloat(dims.barrel) || 0,
            traverse: parseFloat(dims.traverse) || 0
        };
        this.reels.push(reel);
        return reel;
    }

    removeReel(id) {
        this.reels = this.reels.filter(r => r.id !== id);
    }

    clearReels() {
        this.reels = [];
    }

    calculateCapacity(flange, barrel, traverse, wireD) {
        // Ensure inputs are numbers
        flange = parseFloat(flange);
        barrel = parseFloat(barrel);
        traverse = parseFloat(traverse);
        wireD = parseFloat(wireD);

        if (!flange || !barrel || !traverse || !wireD) return 0;

        // Apply a 5% freeboard (margin from edge of flange)
        let effectiveFlange = flange * 0.95;

        let r_out = effectiveFlange / 2;
        let r_in = barrel / 2;
        let w_radius = wireD / 2;

        // Volume of Reel Area = PI * (R_outer^2 - R_inner^2) * Width
        // All inputs are in the same unit (mm or inches)
        let reelVolume = Math.PI * (Math.pow(r_out, 2) - Math.pow(r_in, 2)) * traverse;

        // Wire Area = PI * (d/2)^2
        // Wire diameter is in mm (metric) or inches (imperial)
        let wireCrossSectionArea = Math.PI * Math.pow(w_radius, 2);

        // Total Wire Length Capacity = (Reel Volume * Packing Factor) / Wire Area
        // Result is in same unit as inputs (mm or inches)
        let capacity = (reelVolume * this.PACKING_FACTOR) / wireCrossSectionArea;

        // Convert result based on units
        if (this.units === 'metric') {
            // Capacity is in mm, convert to meters
            return capacity / 1000;
        } else {
            // Capacity is in inches, convert to feet
            return capacity / 12;
        }
    }

    getPlan() {
        let currentMark = this.startMark;
        let totalLength = 0;

        return this.reels.map((reel, index) => {
            const start = currentMark;
            const end = currentMark + reel.length;
            currentMark = end;
            totalLength += reel.length;

            let capacity = 0;
            let fillPercent = 0;
            let status = 'unknown'; // unknown, ok, warning, overfill

            if (reel.flange > 0 && this.wireDiameter > 0) {
                capacity = this.calculateCapacity(reel.flange, reel.barrel, reel.traverse, this.wireDiameter);
                fillPercent = (reel.length / capacity) * 100;

                if (fillPercent > 100) status = 'overfill';
                else if (fillPercent > 85) status = 'warning';
                else status = 'ok';
            }

            return {
                ...reel,
                index: index + 1,
                startMark: start,
                endMark: end,
                capacity,
                fillPercent,
                status
            };
        });
    }

    getTotals() {
        return {
            count: this.reels.length,
            length: this.reels.reduce((sum, r) => sum + r.length, 0)
        };
    }
}

/**
 * UI Controller
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    const planner = new MultiCutPlanner();

    // DOM Elements
    const btnMetric = document.getElementById('btnMetric');
    const btnImperial = document.getElementById('btnImperial');
    const startMarkInput = document.getElementById('startMark');
    const wireDiameterInput = document.getElementById('wireDiameter');
    const targetLengthInput = document.getElementById('targetLength');
    const reelFlangeInput = document.getElementById('reelFlange');
    const reelBarrelInput = document.getElementById('reelBarrel');
    const reelTraverseInput = document.getElementById('reelTraverse');
    const addReelBtn = document.getElementById('addReelBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const reelListEl = document.getElementById('reelList');
    const emptyState = document.getElementById('emptyState');
    const totalLengthDisp = document.getElementById('totalLengthDisp');
    const totalReelsDisp = document.getElementById('totalReelsDisp');

    // Helper to update UI based on units
    function updateUnitUI() {
        const isMetric = planner.units === 'metric';

        document.querySelectorAll('.unit-length').forEach(el => el.textContent = isMetric ? 'm' : 'ft');
        document.querySelectorAll('.unit-dim').forEach(el => el.textContent = isMetric ? 'mm' : 'in');

        if (isMetric) {
            btnMetric.classList.add('bg-[#0058B3]', 'text-white');
            btnMetric.classList.remove('text-gray-500');
            btnImperial.classList.remove('bg-[#0058B3]', 'text-white');
            btnImperial.classList.add('text-gray-500');

            // Defaults
            if (wireDiameterInput.value == 0.06) wireDiameterInput.value = 1.5;
            if (reelFlangeInput.placeholder == '12') reelFlangeInput.placeholder = '30';
            if (reelBarrelInput.placeholder == '6') reelBarrelInput.placeholder = '15';
            if (reelTraverseInput.placeholder == '10') reelTraverseInput.placeholder = '24';
        } else {
            btnImperial.classList.add('bg-[#0058B3]', 'text-white');
            btnImperial.classList.remove('text-gray-500');
            btnMetric.classList.remove('bg-[#0058B3]', 'text-white');
            btnMetric.classList.add('text-gray-500');

            // Defaults
            if (wireDiameterInput.value == 1.5) wireDiameterInput.value = 0.06;
            if (reelFlangeInput.placeholder == '30') reelFlangeInput.placeholder = '12';
            if (reelBarrelInput.placeholder == '15') reelBarrelInput.placeholder = '6';
            if (reelTraverseInput.placeholder == '24') reelTraverseInput.placeholder = '10';
        }
        render();
    }

    // Render the reel list
    function render() {
        const plan = planner.getPlan();
        const totals = planner.getTotals();

        totalLengthDisp.textContent = totals.length.toFixed(1);
        totalReelsDisp.textContent = totals.count;

        if (plan.length === 0) {
            reelListEl.innerHTML = '';
            reelListEl.appendChild(emptyState);
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        reelListEl.innerHTML = '';

        plan.forEach(reel => {
            let capText = "";
            let progressColor = "bg-[#0058B3]";
            let capClass = "text-gray-500";

            if (reel.status === 'overfill') {
                capClass = "text-red-500 font-bold";
                progressColor = "bg-red-500";
                capText = `OVERFILL (${Math.round(reel.fillPercent)}%) - Max: ${Math.round(reel.capacity)}`;
            } else if (reel.status === 'warning') {
                capClass = "text-yellow-600";
                progressColor = "bg-yellow-500";
                capText = `${Math.round(reel.fillPercent)}% Full`;
            } else if (reel.status === 'ok') {
                capClass = "text-green-600";
                progressColor = "bg-green-500";
                capText = `${Math.round(reel.fillPercent)}% Full`;
            } else {
                capText = "Dims needed for cap.";
            }

            const row = document.createElement('div');
            row.className = "bg-white border border-gray-200 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center justify-between group hover:border-[#0058B3] transition shadow-sm";
            row.innerHTML = `
                <div class="flex items-center gap-4 w-full md:w-auto">
                    <div class="bg-blue-50 w-8 h-8 rounded-full flex items-center justify-center font-bold text-[#0058B3] border border-blue-100 shrink-0">
                        ${reel.index}
                    </div>
                    <div>
                        <div class="text-lg font-bold text-gray-800">${reel.length} <span class="text-sm font-normal text-gray-400 unit-length">${planner.units === 'metric' ? 'm' : 'ft'}</span></div>
                        <div class="text-xs text-gray-400 mt-1">
                            ${reel.flange ? `${reel.flange}x${reel.barrel}x${reel.traverse}` : 'No dims'}
                        </div>
                    </div>
                </div>

                <div class="flex-1 w-full md:px-8">
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-400">Start: <span class="text-gray-800 font-mono">${reel.startMark.toFixed(1)}</span></span>
                        <span class="text-gray-400">End: <span class="text-gray-800 font-mono">${reel.endMark.toFixed(1)}</span></span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div class="${progressColor} h-2.5 rounded-full" style="width: ${Math.min(reel.fillPercent, 100)}%"></div>
                    </div>
                    <div class="text-xs mt-1 text-right ${capClass}">${capText}</div>
                </div>

                <button data-id="${reel.id}" class="delete-btn opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-2 transition">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            `;

            // Add event listener to delete button
            row.querySelector('.delete-btn').addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                planner.removeReel(id);
                render();
            });

            reelListEl.appendChild(row);
        });

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    // Event Listeners
    btnMetric.addEventListener('click', () => {
        planner.setUnits('metric');
        updateUnitUI();
    });

    btnImperial.addEventListener('click', () => {
        planner.setUnits('imperial');
        updateUnitUI();
    });

    startMarkInput.addEventListener('input', (e) => {
        planner.startMark = parseFloat(e.target.value) || 0;
        render();
    });

    wireDiameterInput.addEventListener('input', (e) => {
        planner.wireDiameter = parseFloat(e.target.value) || 0;
        render();
    });

    addReelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const length = targetLengthInput.value;
        if (!length || length <= 0) {
            alert("Please enter a valid target length.");
            return;
        }

        planner.addReel(length, {
            flange: reelFlangeInput.value,
            barrel: reelBarrelInput.value,
            traverse: reelTraverseInput.value
        });

        targetLengthInput.value = '';
        render();
    });

    clearAllBtn.addEventListener('click', () => {
        if (confirm("Clear all planned cuts?")) {
            planner.clearReels();
            render();
        }
    });

    // Initial Render
    updateUnitUI();
});
