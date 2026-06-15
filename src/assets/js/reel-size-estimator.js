// ====================================================================
// EECOL Reel Size Estimator Tool - v0.8.1
// Adapted from reel-selector.html for EECOL Wire Tools Suite
// ====================================================================

// ====================================================================
// CONSTANTS & UTILITY FUNCTIONS
// ====================================================================

const METERS_TO_FEET = 3.280839895;
const FEET_TO_METERS = 0.3048;
const INCHES_TO_METERS = 0.0254;
const MM_TO_METERS = 0.001;
const CM_TO_METERS = 0.01;
const PI = Math.PI;
const DEAD_WRAPS = 2; // Number of dead wraps at the core

/* Unit conversion functions */
function metersToFeet(m) { return m * METERS_TO_FEET; }
function feetToMeters(ft) { return ft / METERS_TO_FEET; }

/**
 * Converts a value from any supported unit to meters.
 */
function toMeters(value, unit) {
    switch (unit) {
        case 'in': return value * INCHES_TO_METERS;
        case 'cm': return value * CM_TO_METERS;
        case 'mm': return value * MM_TO_METERS;
        case 'ft': return feetToMeters(value);
        case 'm':
        default: return value;
    }
}

/**
 * Converts degrees to radians.
 */
function degreesToRadians(degrees) {
    return degrees * (PI / 180);
}

// ====================================================================
// STANDARD REEL DATABASE - Industry Standard Reel Sizes
// ====================================================================

const STANDARD_REELS = [
    {name: "Small Spool", core: 12/39.37, flange: 24/39.37, width: 24/39.37, category: "prototype"},
    {name: "Medium Spool", core: 18/39.37, flange: 30/39.37, width: 30/39.37, category: "development"},
    {name: "24/36 Reel", core: 24/39.37, flange: 36/39.37, width: 36/39.37, category: "production"},
    {name: "30/42 Reel", core: 30/39.37, flange: 42/39.37, width: 42/39.37, category: "production"},
    {name: "30/48 Reel", core: 30/39.37, flange: 48/39.37, width: 48/39.37, category: "production"},
    {name: "36/48 Reel", core: 36/39.37, flange: 48/39.37, width: 48/39.37, category: "production"},
    {name: "36/60 Reel", core: 36/39.37, flange: 60/39.37, width: 42/39.37, category: "production"},
    {name: "42/60 Reel", core: 42/39.37, flange: 60/39.37, width: 48/39.37, category: "production"},
    {name: "42/72 Reel", core: 42/39.37, flange: 72/39.37, width: 48/39.37, category: "industrial"},
    {name: "48/72 Reel", core: 48/39.37, flange: 72/39.37, width: 51/39.37, category: "industrial"},
    {name: "48/84 Reel", core: 48/39.37, flange: 84/39.37, width: 54/39.37, category: "industrial"},
    {name: "54/84 Reel", core: 54/39.37, flange: 84/39.37, width: 54/39.37, category: "industrial"},
    {name: "54/96 Reel", core: 54/39.37, flange: 96/39.37, width: 54/39.37, category: "bulk"}
];

// ====================================================================
// DOM ELEMENTS & INPUT MANAGEMENT
// ====================================================================

// Input elements
const calculateReelSizeBtn = document.getElementById('calculateReelSizeBtn');
const safetyStandardSelect = document.getElementById('safetyStandard');
const freeboardInput = document.getElementById('freeboard');
const freeboardUnitSelect = document.getElementById('freeboardUnit');
const wireDiameterInput = document.getElementById('wireDiameter');
const wireDiameterUnitSelect = document.getElementById('wireDiameterUnit');
const freeboardStatusSpan = document.getElementById('freeboardStatus');

// Output elements
const theoreticalDimensionsCard = document.getElementById('theoreticalDimensionsCard');
const recommendedReelsCard = document.getElementById('recommendedReelsCard');
const recommendedReelsList = document.getElementById('recommendedReelsList');
const reelSizeResultContainer = document.getElementById('reelSizeResultContainer');

// Error handling
const errorBox = document.getElementById('errorBox');
const errorMessageDisplay = document.getElementById('errorMessage');

// ====================================================================
// SAFETY STANDARD MANAGEMENT (Mirrored from reel-estimator)
// ====================================================================

function updateFreeboardInput(triggerCalc = true) {
    const standard = safetyStandardSelect.value;
    const d = parseFloat(wireDiameterInput.value);
    const dUnit = wireDiameterUnitSelect.value;

    let disabled = false;
    let statusText = 'Custom';
    let F_in = parseFloat(freeboardInput.value);
    let F_unit = freeboardUnitSelect.value;

    const d_safe = isNaN(d) || d <= 0 ? 0 : d;
    const d_in = toMeters(d_safe, dUnit) / INCHES_TO_METERS;

    if (standard !== 'custom') {
        disabled = true;

        switch (standard) {
            case 'full':
                F_in = 0;
                statusText = 'Full Drum (0 in)';
                break;
            case 'ansi_b307_05in':
                F_in = 0.5;
                statusText = 'ANSI B30.7 (0.5 in)';
                break;
            case 'ansi_a1022_2in':
                F_in = 2.0;
                statusText = 'ANSI A10.22 (2.0 in)';
                break;
            case 'uk_den_25x':
                F_in = 2.5 * d_in;
                statusText = `UK Den (2.5X D.) - ${F_in.toFixed(2)} in`;
                break;
            case '1x':
                F_in = 1.0 * d_in;
                statusText = `1X Wire D. - ${F_in.toFixed(2)} in`;
                break;
        }

        F_unit = 'in';
    }

    freeboardInput.disabled = disabled;
    freeboardUnitSelect.disabled = disabled;
    freeboardStatusSpan.textContent = statusText;

    if (disabled) {
        freeboardInput.value = F_in.toFixed(3);
        freeboardUnitSelect.value = F_unit;
        freeboardInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        freeboardUnitSelect.classList.add('bg-gray-100', 'cursor-not-allowed');
    } else {
        freeboardInput.value = F_in.toFixed(3);
        freeboardUnitSelect.value = F_unit;
        freeboardInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
        freeboardUnitSelect.classList.remove('bg-gray-100', 'cursor-not-allowed');
    }

    // Only trigger calculation if requested (avoids recursive calls)
    if (triggerCalc) {
        // Not used in this tool as calculation is manual
    }
}

// Initialize safety standard management
function initializeSafetyStandards() {
    safetyStandardSelect.addEventListener('change', () => updateFreeboardInput(false));
    updateFreeboardInput(false);
}

// ====================================================================
// WIRE DIAMETER PRESET MANAGEMENT (From reel-estimator)
// ====================================================================

function initializeWireDiameterPresets() {
    // Wire Diameter Preset Event Listeners
    const wireDiameterPresetInch = document.getElementById('wireDiameterPresetInch');
    if (wireDiameterPresetInch) {
        wireDiameterPresetInch.addEventListener('change', function(e) {
            const value = e.target.value;
            if (value) {
                document.getElementById('wireDiameter').value = value;
                document.getElementById('wireDiameterUnit').value = 'in';
                updateFreeboardInput(false);
            }
        });
    }

    const wireDiameterPresetMm = document.getElementById('wireDiameterPresetMm');
    if (wireDiameterPresetMm) {
        wireDiameterPresetMm.addEventListener('change', function(e) {
            const value = e.target.value;
            if (value) {
                document.getElementById('wireDiameter').value = value;
                document.getElementById('wireDiameterUnit').value = 'mm';
                updateFreeboardInput(false);
            }
        });
    }
}

// ====================================================================
// CALCULATION FUNCTIONS (Adapted from reel-selector)
// ====================================================================

/**
 * Calculate theoretical reel dimensions needed for target length
 */
/**
 * BOLT OPTIMIZATION: O(1) Capacity Calculation
 * Calculates theoretical reel dimensions using quadratic formula instead of iterative search.
 * Fixes a bug where core_m was undefined (should be coreDiameter_m).
 */
function calculateTheoreticalReel(cableDiameter_m, targetLength_m, freeboard_m, efficiency) {
    // Rough estimate of layers needed
    const baseCapacityPerLayer = Math.PI * (cableDiameter_m * 100) / 2;
    const roughLayers = Math.ceil(targetLength_m / (baseCapacityPerLayer * efficiency * 1000));

    // Estimate dimensions
    const coreDiameter_m = Math.max(cableDiameter_m * 10, 0.3); // Minimum practical core
    const avgLayerAddition = cableDiameter_m * roughLayers;
    const flangeDiameter_m = coreDiameter_m + avgLayerAddition + 2 * freeboard_m;

    // Limit traverse width to practical size
    const traverseWidth_m = Math.min(targetLength_m / (Math.PI * flangeDiameter_m * efficiency / cableDiameter_m / 1000), 2.0);

    // BOLT: Precise calculation using sum of arithmetic progression
    const segmentsPerLayer = Math.floor(traverseWidth_m / cableDiameter_m);
    const k = segmentsPerLayer * Math.PI * efficiency;

    /**
     * BOLT: Sum of AP formula for layer lengths
     * L_total(n) = k * (n * D_core + n^2 * d)
     */
    const getLen = (n, core, d) => (n <= 0) ? 0 : k * (n * core + (n * n) * d);
    const L_dead = getLen(DEAD_WRAPS, coreDiameter_m, cableDiameter_m);
    const target = (targetLength_m * 1.1) + L_dead;

    // Solve quad: d*N^2 + D_core*N - (target/k) = 0
    const a = cableDiameter_m;
    const b = coreDiameter_m;
    const c = -target / k;

    let layers = Math.ceil((-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a));
    if (layers < 0 || isNaN(layers)) layers = 0;
    if (layers > 50) layers = 50; // Safety cap

    const totalCapacity = Math.max(0, getLen(layers, coreDiameter_m, cableDiameter_m) - L_dead);

    return {
        coreDiameter_m: coreDiameter_m,
        flangeDiameter_m: flangeDiameter_m,
        traverseWidth_m: traverseWidth_m,
        capacity_m: totalCapacity,
        layerCount: layers,
        utilization: totalCapacity > 0 ? (targetLength_m / totalCapacity) * 100 : 0
    };
}

/**
 * BOLT OPTIMIZATION: O(1) Capacity Calculation
 * Replaces iterative while loop with the sum of an arithmetic progression formula.
 * Formula: L_total = S * π * η * N * (D_core + N * d)
 */
function calculateReelCapacity(reel, cableDiameter_m, freeboard_m, efficiency) {
    const core_m = reel.core;
    const width_m = reel.width;
    const segmentsPerLayer = Math.floor(width_m / cableDiameter_m);

    const maxDiameter_m = reel.flange - 2 * freeboard_m;

    // Calculate how many layers fit (N) to match original iterative logic
    let layers = Math.max(0, Math.ceil((maxDiameter_m - core_m) / (2 * cableDiameter_m)));
    if (layers > 100) layers = 100; // Safety cap

    /**
     * BOLT: Sum of arithmetic progression for layer lengths
     * Total length of N layers = segmentsPerLayer * PI * η * (N * core_m + N^2 * cableDiameter_m)
     */
    const getLen = (n) => {
        if (n <= 0) return 0;
        return segmentsPerLayer * Math.PI * efficiency * (n * core_m + (n * n) * cableDiameter_m);
    };

    const totalCapacity = Math.max(0, getLen(layers) - getLen(Math.min(layers, DEAD_WRAPS)));

    // Return reel data with calculated capacity
    const result = {};
    for (var prop in reel) {
        if (reel.hasOwnProperty(prop)) {
            result[prop] = reel[prop];
        }
    }
    result.capacity_m = totalCapacity;
    result.layerCount = layers;
    result.maxLayersPossible = layers;
    return result;
}

/**
 * Find the best matching standard reels for target length
 */
function findStandardReels(targetLength_m, cableDiameter_m, freeboard_m, efficiency) {
    const reelsWithCapacity = [];

    // Calculate capacity for each standard reel
    for (let i = 0; i < STANDARD_REELS.length; i++) {
        const reelWithCapacity = calculateReelCapacity(STANDARD_REELS[i], cableDiameter_m, freeboard_m, efficiency);
        reelsWithCapacity.push(reelWithCapacity);
    }

    // Filter to only reels that can hold the target length
    const matchingReels = [];
    for (let j = 0; j < reelsWithCapacity.length; j++) {
        if (reelsWithCapacity[j].capacity_m >= targetLength_m) {
            matchingReels.push(reelsWithCapacity[j]);
        }
    }

    // Sort by utilization closest to 85% (optimal utilization)
    for (let m = 0; m < matchingReels.length - 1; m++) {
        for (let n = 0; n < matchingReels.length - 1 - m; n++) {
            const aUtil = matchingReels[n].capacity_m > 0 ? (targetLength_m / matchingReels[n].capacity_m) : 0;
            const bUtil = matchingReels[n + 1].capacity_m > 0 ? (targetLength_m / matchingReels[n + 1].capacity_m) : 0;

            if (Math.abs(aUtil - 0.85) > Math.abs(bUtil - 0.85)) {
                const temp = matchingReels[n];
                matchingReels[n] = matchingReels[n + 1];
                matchingReels[n + 1] = temp;
            }
        }
    }

    // Return top 3 matches
    const topMatches = [];
    const maxResults = Math.min(3, matchingReels.length);
    for (let k = 0; k < maxResults; k++) {
        const result = {};
        for (var prop in matchingReels[k]) {
            if (matchingReels[k].hasOwnProperty(prop)) {
                result[prop] = matchingReels[k][prop];
            }
        }
        result.utilization = (targetLength_m / matchingReels[k].capacity_m) * 100;
        topMatches.push(result);
    }

    return topMatches;
}

// ====================================================================
// UI UPDATE FUNCTIONS
// ====================================================================

/**
 * Clear all results and reset display
 */
function clearResults() {
    theoreticalDimensionsCard.classList.add('hidden');
    recommendedReelsCard.classList.add('hidden');
    recommendedReelsList.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing
    errorBox.classList.add('hidden');
}

/**
 * Format dimension display with multiple units
 */
function formatDimension(meters, primaryUnit = 'in') {
    const inches = meters / INCHES_TO_METERS;
    const feet = metersToFeet(meters);

    if (primaryUnit === 'in') {
        return `${inches.toFixed(1)} in (${feet.toFixed(2)} ft)`;
    } else {
        return `${meters.toFixed(2)} m (${feet.toFixed(0)} ft)`;
    }
}

/**
 * Display theoretical reel dimensions in the UI
 */
function displayTheoreticalDimensions(theoreticalReel, targetLength_m) {
    const target_ft = metersToFeet(targetLength_m);
    const capacity_ft = metersToFeet(theoreticalReel.capacity_m);

    // Update display elements
    document.getElementById('theoreticalFlangeDiameter').textContent = formatDimension(theoreticalReel.flangeDiameter_m);
    document.getElementById('theoreticalCoreDiameter').textContent = formatDimension(theoreticalReel.coreDiameter_m);
    document.getElementById('theoreticalTraverseWidth').textContent = formatDimension(theoreticalReel.traverseWidth_m);
    document.getElementById('theoreticalLayers').textContent = theoreticalReel.layerCount;

    document.getElementById('theoreticalCapacity').textContent = `${theoreticalReel.capacity_m.toFixed(0)} m (${capacity_ft.toFixed(0)} ft)`;

    // Show the card
    theoreticalDimensionsCard.classList.remove('hidden');
}

/**
 * Display recommended standard reels in the UI
 */
function displayRecommendedReels(recommendedReels, targetLength_m) {
    const target_ft = metersToFeet(targetLength_m);
    recommendedReelsList.replaceChildren(); // BOLT OPTIMIZATION: O(1) DOM clearing

    recommendedReels.forEach((reel, index) => {
        const df_in = reel.flange / INCHES_TO_METERS;
        const dc_in = reel.core / INCHES_TO_METERS;
        const w_in = reel.width / INCHES_TO_METERS;
        const capacity_ft = metersToFeet(reel.capacity_m);

        const reelCard = document.createElement('div');
        reelCard.className = 'bg-green-50 border border-green-200 rounded-lg p-4';

        const header = document.createElement('h5');
        header.className = 'text-md font-bold mb-2 text-[#0058B3]';
        header.textContent = `🏭 Option ${index + 1}: ${reel.name}`;
        reelCard.appendChild(header);

        const utilP = document.createElement('p');
        utilP.className = 'text-sm text-green-800 mb-3';
        utilP.textContent = `Utilization: ${reel.utilization.toFixed(1)}%`;
        reelCard.appendChild(utilP);

        const gridDiv = document.createElement('div');
        gridDiv.className = 'grid grid-cols-3 gap-2 text-center text-sm';

        const createGridItem = (label, primary, secondary) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'bg-white p-2 rounded shadow-sm';

            const labelDiv = document.createElement('div');
            labelDiv.className = 'font-semibold text-gray-600';
            labelDiv.textContent = label;
            itemDiv.appendChild(labelDiv);

            const primaryDiv = document.createElement('div');
            primaryDiv.className = 'text-[#0058B3] font-bold';
            primaryDiv.textContent = primary;
            itemDiv.appendChild(primaryDiv);

            const secondaryDiv = document.createElement('div');
            secondaryDiv.className = 'text-gray-500';
            secondaryDiv.textContent = secondary;
            itemDiv.appendChild(secondaryDiv);

            return itemDiv;
        };

        gridDiv.appendChild(createGridItem('Flange Diameter', `${df_in.toFixed(1)} in`, `${metersToFeet(reel.flange).toFixed(1)} ft`));
        gridDiv.appendChild(createGridItem('Core Diameter', `${dc_in.toFixed(1)} in`, `${metersToFeet(reel.core).toFixed(1)} ft`));
        gridDiv.appendChild(createGridItem('Traverse Width', `${w_in.toFixed(1)} in`, `${metersToFeet(reel.width).toFixed(1)} ft`));
        reelCard.appendChild(gridDiv);

        const footerDiv = document.createElement('div');
        footerDiv.className = 'mt-3 bg-green-100 p-2 rounded text-center';

        const capDiv = document.createElement('div');
        capDiv.className = 'text-green-800 font-semibold';
        capDiv.textContent = `Capacity: ${reel.capacity_m.toLocaleString('en-US', {maximumFractionDigits: 0})} m (${capacity_ft.toLocaleString('en-US', {maximumFractionDigits: 0})} ft)`;
        footerDiv.appendChild(capDiv);

        const targetDiv = document.createElement('div');
        targetDiv.className = 'text-green-700 text-xs mt-1';
        targetDiv.textContent = `Target: ${targetLength_m.toFixed(0)} m (${target_ft.toFixed(0)} ft) - ${reel.utilization.toFixed(1)}% utilized`;
        footerDiv.appendChild(targetDiv);

        const layersDiv = document.createElement('div');
        layersDiv.className = 'text-green-700 text-xs font-bold';
        layersDiv.textContent = `✅ ${reel.category.charAt(0).toUpperCase() + reel.category.slice(1)} reel • ${reel.layerCount} layers possible`;
        footerDiv.appendChild(layersDiv);

        reelCard.appendChild(footerDiv);

        recommendedReelsList.appendChild(reelCard);
    });

    recommendedReelsCard.classList.remove('hidden');
}

// ====================================================================
// MAIN CALCULATION FUNCTION
// ====================================================================

function findReelOptions(showErrors = false) {
    if (showErrors) {
        errorBox.classList.add('hidden');
        reelSizeResultContainer.classList.add('hidden');
    }

    clearResults();

    // Get input values
    const d = parseFloat(document.getElementById('wireDiameter').value);
    const dUnit = document.getElementById('wireDiameterUnit').value;
    const targetLength = parseFloat(document.getElementById('targetLength').value);
    const targetLengthUnit = document.getElementById('targetLengthUnit').value;
    const freeboard = parseFloat(document.getElementById('freeboard').value);
    const freeboardUnit = document.getElementById('freeboardUnit').value;
    const efficiency = parseFloat(document.getElementById('windingEfficiency').value);

    // Input validation
    if (isNaN(d) || isNaN(targetLength) || isNaN(freeboard) || d <= 0 || targetLength <= 0 || freeboard < 0) {
        if (showErrors) {
            errorMessageDisplay.textContent = 'Please enter valid positive values for wire diameter, target length, and freeboard.';
            errorBox.classList.remove('hidden');
            reelSizeResultContainer.classList.remove('hidden');
        }
        return;
    }

    try {
        // Convert to metric for calculations
        const d_m = toMeters(d, dUnit);
        const target_m = toMeters(targetLength, targetLengthUnit);
        const F_m = toMeters(freeboard, freeboardUnit);

        // Calculate theoretical and standard reel options
        const theoreticalReel = calculateTheoreticalReel(d_m, target_m, F_m, efficiency);
        const standardMatches = findStandardReels(target_m, d_m, F_m, efficiency);

        // Display results
        displayTheoreticalDimensions(theoreticalReel, target_m);
        displayRecommendedReels(standardMatches, target_m);

        reelSizeResultContainer.classList.remove('hidden');

    } catch (error) {
        console.error('Reel size estimation failed:', error);
        if (showErrors) {
            errorMessageDisplay.textContent = 'Calculation error occurred. Please check your inputs and try again.';
            errorBox.classList.remove('hidden');
            reelSizeResultContainer.classList.remove('hidden');
        }
    }
}

// ====================================================================
// PRINT FUNCTIONALITY
// ====================================================================

/**
 * IDB SENTINEL: Internal helper to safely escape strings for HTML insertion.
 * Provides defense-in-depth against XSS even if global helpers are missing.
 * @param {any} v - Value to escape
 * @returns {string} Escaped string
 */
function _esc(v) {
    if (v === null || v === undefined) return '';
    if (typeof window !== 'undefined' && typeof window.escapeHTML === 'function') {
        return window.escapeHTML(v);
    }
    return String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\//g, '&#x2F;');
}

function printReelSizeResults() {
    // Collect result data for printing
    const theoreticalVisible = !theoreticalDimensionsCard.classList.contains('hidden');
    const recommendedVisible = !recommendedReelsCard.classList.contains('hidden');

    let theoreticalData = {};
    let recommendedData = [];

    if (theoreticalVisible) {
        theoreticalData = {
            flangeDiameter: document.getElementById('theoreticalFlangeDiameter').textContent,
            coreDiameter: document.getElementById('theoreticalCoreDiameter').textContent,
            traverseWidth: document.getElementById('theoreticalTraverseWidth').textContent,
            layers: document.getElementById('theoreticalLayers').textContent,
            capacity: document.getElementById('theoreticalCapacity').textContent
        };
    }

    if (recommendedVisible) {
        // Get data from the rendered cards
        const reelCards = recommendedReelsList.querySelectorAll('.bg-green-50');
        reelCards.forEach(card => {
            const title = card.querySelector('h5').textContent;
            const utilization = card.querySelector('.text-green-800').textContent;
            recommendedData.push({ title, utilization });
        });
    }

    const printContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>EECOL Reel Size Estimation Results</title>
            <style>
                body { font-family: 'Roboto', 'Segoe UI', Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; color: #333; }
                h1 { color: #0058B3; text-align: center; }
                h2 { color: #0058B3; border-bottom: 2px solid #0058B3; padding-bottom: 5px; }
                .section { margin: 20px 0; page-break-inside: avoid; }
                .result { margin: 10px 0; padding: 15px; border: 2px solid #0058B3; border-radius: 8px; background: #f8f9fa; }
                .label { font-weight: bold; color: #666; font-size: 12px; }
                .value { font-size: 16px; color: #0058B3; font-weight: bold; }
                .specs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 10px 0; }
                .spec-item { background: #f0f8ff; padding: 8px; border-radius: 4px; text-align: center; border: 1px solid #e0e0e0; }
                .branding { text-align: center; margin-top: 40px; font-size: 10px; color: #999; font-style: italic; }
                @media print {
                    body { padding: 0; max-width: none; }
                    button { display: none !important; }
                    .branding { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <h1>EECOL Reel Size Estimation Results</h1>

            ${theoreticalVisible ? `
            <div class="section">
                <h2>Theoretical Optimal Dimensions</h2>
                <div class="result">
                    <div class="specs-grid">
                        <div class="spec-item">
                            <div class="label">Flange Diameter:</div>
                            <div class="value">${_esc(theoreticalData.flangeDiameter)}</div>
                        </div>
                        <div class="spec-item">
                            <div class="label">Core Diameter:</div>
                            <div class="value">${_esc(theoreticalData.coreDiameter)}</div>
                        </div>
                        <div class="spec-item">
                            <div class="label">Traverse Width:</div>
                            <div class="value">${_esc(theoreticalData.traverseWidth)}</div>
                        </div>
                    </div>
                    <p><strong>Layers Needed:</strong> ${_esc(theoreticalData.layers)}</p>
                    <p><strong>Total Capacity:</strong> ${_esc(theoreticalData.capacity)}</p>
                    <p><em>Note: These are mathematically ideal dimensions and may not correspond to industry standard reel sizes.</em></p>
                </div>
            </div>
            ` : ''}

            ${recommendedVisible ? `
            <div class="section">
                <h2>Recommended Industry Standard Reels</h2>
                ${recommendedData.map(reel => `
                    <div class="result">
                        <h3>${_esc(reel.title)}</h3>
                        <p>${_esc(reel.utilization)}</p>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <div class="branding">
                EECOL Wire Tools Suite 2025 - Enterprise Edition<br>
                Generated: ${_esc(new Date().toLocaleDateString())} ${_esc(new Date().toLocaleTimeString())}
            </div>

            <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 8px 16px; background: #0058B3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">Print Results</button>
        </body>
        </html>
    `;

    /**
     * IDB SENTINEL: Use central hardened print utility if available.
     * Otherwise, fallback to a local hardened pattern that handles popup blockers
     * and document stream closing.
     */
    if (typeof createPrintWindow === 'function') {
        createPrintWindow('EECOL Reel Size Estimation Results', printContent);
    } else {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Unable to open print window. Please allow popups for this site.');
            return;
        }
        try {
            printWindow.document.open();
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        } catch (err) {
            console.error('Hardened print fallback failed:', err);
        }
    }
}

// ====================================================================
// INITIALIZATION
// ====================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize safety standards and wire diameter presets
    initializeSafetyStandards();
    initializeWireDiameterPresets();

    // Reset results on page load
    clearResults();

    // Set up calculate button
    if (calculateReelSizeBtn) {
        calculateReelSizeBtn.addEventListener('click', () => findReelOptions(true));
    }

    // Set up print button
    const printBtn = document.getElementById('printResultsBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printReelSizeResults);
    }
});

// ============================================================================
// MOBILE MENU INITIALIZATION FOR REEL SIZE ESTIMATOR PAGE
// ============================================================================

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.5',
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '📏 Capacity Estimator', href: '../reel-capacity-estimator/reel-capacity-estimator.html', class: 'bg-emerald-600 hover:bg-emerald-700' }
        ],
        version: 'v0.8.0.5',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Reel Size Estimator'
    });
}
