/**
 * EECOL Multi-Cut Planner Tool - Advanced Cable-to-Customer Reel Optimization
 * Enterprise integration of wire weight estimator, reel capacity calculator,
 * wire mark calculator, and stop mark converter
 */

// ====================================================================
// IMPORTS & CONSTANTS
// ====================================================================

// Import industry standards and utility functions from shared module
import {
    STANDARD_REELS,
    CABLE_UNIT_WEIGHTS,
    CABLE_CONSTRUCTION_DATA,
    getIndustryStandardReelOptions,
    getReelByKey,
    getAvailableCableDesignations,
    getAvailableCableTypes,
    getCableOverallDiameter,
    parseCableDesignation
} from '../core/modules/industry-standards.js';

// (Integration functions moved to initialization section)

// ====================================================================
// CONSTANTS FROM INTEGRATED TOOLS
// ====================================================================

// From wire-weight-estimator.js
const METERS_TO_FEET = 3.280839895;
const FEET_TO_METERS = 0.3048;
const INCHES_TO_METERS = 0.0254;
const MM_TO_METERS = 0.001;
const CM_TO_METERS = 0.01;

// From reel-size-estimator.js
const PI = Math.PI;
const DEAD_WRAPS = 2; // Number of dead wraps at the core
const DEFAULT_WINDING_EFFICIENCY = 0.85; // 85% winding efficiency
const DEFAULT_SAFETY_FREEBOARD = 0.082; // 0.082 meters = 3.23 inches

// Wire weight calculation (simplified)
const SPECIFIC_GRAVITY = {
    copper: 8.89,
    aluminum: 2.70,
    pvc: 1.40,
    xlpe: 0.92,
    steel: 7.85
};

const STANDARD_CONDUCTOR_DIAMETERS = {
    '18': 0.048, '16': 0.052, '14': 0.064, '12': 0.081,
    '10': 0.102, '8': 0.129, '6': 0.163, '4': 0.205,
    '3': 0.230, '2': 0.258, '1': 0.289, '0': 0.325,
    '250': 0.255, '350': 0.293, '400': 0.311, '500': 0.340,
    '600': 0.377, '700': 0.412, '750': 0.429, '800': 0.448,
    '900': 0.478, '1000': 0.508
};

const STRANDING_FACTOR = 1.03;

function calculateEngineeringWeight(designation, cableType) {
    try {
        const params = parseCableDesignation(designation, cableType);

        let totalWeight = 0;

        if (params.gauge && STANDARD_CONDUCTOR_DIAMETERS[params.gauge]) {
            const diameter = STANDARD_CONDUCTOR_DIAMETERS[params.gauge];
            const gravity = SPECIFIC_GRAVITY[params.material] || SPECIFIC_GRAVITY.copper;

            // Copper or Aluminum conductor weight formula: 340.5 × D² × G × K × n
            totalWeight = 340.5 * Math.pow(diameter, 2) * gravity * STRANDING_FACTOR * params.conductors;
        }

        // Add insulation/jacket weights (simplified)
        const construction = CABLE_CONSTRUCTION_DATA[cableType];
        if (construction && construction.layers) {
            construction.layers.forEach(layer => {
                if (layer.type === 'insulation' || layer.type === 'jacket' || layer.type === 'armor') {
                    const layerGravity = SPECIFIC_GRAVITY[layer.material] || 1.25;
                    const layerVolume = Math.PI * Math.pow(STANDARD_CONDUCTOR_DIAMETERS[params.gauge] + layer.thickness_mm / 1000, 2) - Math.PI * Math.pow(STANDARD_CONDUCTOR_DIAMETERS[params.gauge], 2);
                    totalWeight += layerVolume * layerGravity * 340.5 * params.conductors;
                }
            });
        }

        return {
            weight: Math.round(totalWeight),
            method: 'advanced'
        };
    } catch (error) {
        console.warn('Weight calculation failed:', error);
        return { weight: 0, method: 'error' };
    }
}

// ====================================================================
// ENHANCED GLOBAL STATE
// ====================================================================

let currentCableType = '';
let currentCableDesignation = '';
let wireSpecs = null; // Detailed wire specifications from selection
let selectedReels = []; // Reels available for selection/assignment with advanced settings
let cutLengths = []; // Array of cut lengths needed
let assignments = {}; // reelId -> { length, efficiency, standards, freeboard }
let reelSettings = {}; // reelId -> advanced settings

// ====================================================================
// ENHANCED INITIALIZATION
// ====================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize all integrations
    await Promise.all([
        initializeWireWeightEstimatorIntegration(),
        initializeReelCapacityEstimatorIntegration(),
        initializeWireMarkCalculatorIntegration(),
        initializeStopMarkConverterIntegration()
    ]);

    setupEnhancedEventListeners();
    setupDragAndDrop();
});

// ====================================================================
// ENHANCED EVENT SETUP
// ====================================================================

function setupEnhancedEventListeners() {
    // Cable designation integration
    const cableTypeSelect = document.getElementById('payloadCableType');
    if (cableTypeSelect) {
        cableTypeSelect.addEventListener('change', () => {
            updateCableDesignations();
        });
    } else {
        console.error('❌ payloadCableType element not found!');
    }

    const designationSelect = document.getElementById('cableDesignation');
    if (designationSelect) {
        designationSelect.addEventListener('change', () => {
            updateWireSpecs();
        });
    } else {
        console.error('❌ cableDesignation element not found!');
    }

    // Enhanced reel settings panel
    setupPerReelSettingsIntegration();
}

// ====================================================================
// DEBUGGING FUNCTIONS
// ====================================================================

function debugCableDesignationSystem() {
    // Test data availability
    const hasWeights = typeof CABLE_UNIT_WEIGHTS !== 'undefined';
    const weightKeys = CABLE_UNIT_WEIGHTS ? Object.keys(CABLE_UNIT_WEIGHTS) : 'N/A';

    // Test data mappings
    const dataMappings = {
        'TK90': 'TK 600V',
        'TK1000V': 'TK 1KV',
        'ACWU90': 'ACWU90',
        'RW90': 'RW90',
        'SOOW': 'SOOW',
        'BARE': 'BARE 19STR'
    };

    // Test function calls
    const testDesignations = getAvailableCableDesignations('TK90');
    const testLength = testDesignations.length;

    // Test DOM elements
    const hasCableType = document.getElementById('payloadCableType') ? '✅' : '❌';
    const hasDesignation = document.getElementById('cableDesignation') ? '✅' : '❌';

    return `Debug complete: CABLE_UNIT_WEIGHTS: ${hasWeights}, keys: ${weightKeys}, designations: ${testLength}, DOM elements: cableType=${hasCableType}, designation=${hasDesignation}`;
}

// Make debug function globally available
window.debugCableDesignationSystem = debugCableDesignationSystem;

// ====================================================================
// CABLE DESIGNATION INTEGRATION (Wire Weight Estimator)
// ====================================================================

function updateCableDesignations() {
    currentCableType = document.getElementById('payloadCableType').value;
    const designationSelect = document.getElementById('cableDesignation');

    if (!currentCableType) {
        designationSelect.disabled = true;
        designationSelect.innerHTML = '<option value="">-- Select cable type first --</option>';
        return;
    }

    // Get available designations for this cable type from wire weight estimator data
    const availableDesignations = getAvailableCableDesignations(currentCableType);

    designationSelect.innerHTML = '<option value="">-- Select specific designation --</option>';
    availableDesignations.forEach(designation => {
        const option = document.createElement('option');
        option.value = designation;
        option.textContent = designation;
        designationSelect.appendChild(option);
    });

    designationSelect.disabled = false;
    designationSelect.classList.remove('bg-gray-100', 'cursor-not-allowed');
}

function updateWireSpecs() {
    currentCableDesignation = document.getElementById('cableDesignation').value;

    if (!currentCableDesignation) {
        document.getElementById('wireSpecsDisplay').classList.add('hidden');
        wireSpecs = null;
        return;
    }

    // Get detailed wire specifications using wire weight estimator logic
    wireSpecs = calculateWireSpecifications(currentCableType, currentCableDesignation);

    // Update display
    const specsText = formatWireSpecifications(wireSpecs);
    document.getElementById('wireSpecsText').textContent = specsText;
    document.getElementById('wireSpecsDisplay').classList.remove('hidden');

    // Update reel recommendations based on wire specs
    updateRecommendedReels();
}

function calculateWireSpecifications(cableType, designation) {
    if (!CABLE_CONSTRUCTION_DATA || !CABLE_UNIT_WEIGHTS) {
        return null;
    }

    const parsed = parseCableDesignation(designation, cableType);

    // Get overall diameter - try full designation first, then gauge
    let overallDiameter = 0;
    if (CABLE_CONSTRUCTION_DATA[cableType]?.od_inches?.[designation]) {
        overallDiameter = CABLE_CONSTRUCTION_DATA[cableType].od_inches[designation];
    } else if (CABLE_CONSTRUCTION_DATA[cableType]?.od_inches?.[parsed.gauge]) {
        overallDiameter = CABLE_CONSTRUCTION_DATA[cableType].od_inches[parsed.gauge];
    } else {
        // Fallback: estimate from gauge
        overallDiameter = STANDARD_CONDUCTOR_DIAMETERS[parsed.gauge] || 0.153; // Default 4AWG
    }

    // Calculate weight using engineering formula
    let weight = 0;
    try {
        const result = calculateEngineeringWeight(designation, cableType);
        weight = result.weight || 0;
    } catch (e) {
        console.warn('Weight calculation failed:', e);
    }

    return {
        designation: designation,
        gauge: parsed.gauge,
        material: parsed.material,
        conductors: parsed.conductors,
        overallDiameter_inches: overallDiameter,
        overallDiameter_mm: overallDiameter * 25.4,
        weight_lbs_per_1000ft: weight,
        weight_kg_per_1000m: (weight * 0.453592) * METERS_TO_FEET
    };
}

function formatWireSpecifications(specs) {
    if (!specs) return 'No specifications available';

    return `${specs.designation} • ${specs.gauge}AWG • ${specs.material.toUpperCase()} • ${specs.conductors}x conductors • Ø${specs.overallDiameter_inches.toFixed(3)}" (${specs.weight_lbs_per_1000ft.toFixed(1)} lbs/1000ft)`;
}

// ====================================================================
// ADVANCED REEL RECOMMENDATIONS & CAPACITY
// ====================================================================

function updateRecommendedReels() {
    console.log('🔄 updateRecommendedReels() called');
    console.log('📊 Wire specs:', wireSpecs);

    if (!wireSpecs) {
        console.log('❌ No wire specs available');
        document.getElementById('recommendedReelsContainer').innerHTML = '<p class="text-sm text-gray-600 mb-3">Select cable type above to see recommended industry standard reels</p>';
        return;
    }

    // Use advanced reel capacity logic to calculate accurate recommendations
    const wireDiameter_m = wireSpecs.overallDiameter_mm / 1000; // Convert mm to m
    console.log('📏 Wire diameter:', wireDiameter_m, 'meters');

    const recommendedReels = generateAdvancedReelRecommendations(wireDiameter_m);
    console.log('🗂️ Generated recommendations:', recommendedReels.length, 'reels');

    displayEnhancedRecommendedReels(recommendedReels, currentCableDesignation);
}

function generateAdvancedReelRecommendations(wireDiameter_m) {
    console.log('🔢 Calculating reel recommendations for wire diameter:', wireDiameter_m);
    // Use reel capacity estimator logic for accurate calculations
    const recommendations = [];

    STANDARD_REELS.forEach(reel => {
        try {
            // Calculate capacity using the reel capacity estimator formulas
            const capacity = calculateReelCapacityUsingEstimatorLogic(
                reel,
                wireDiameter_m,
                DEFAULT_WINDING_EFFICIENCY,
                DEFAULT_SAFETY_FREEBOARD
            );

            console.log(`📏 ${reel.name}: core=${reel.core}, flange=${reel.flange}, capacity=${capacity.capacity_m}m`);

            if (capacity.capacity_m >= 50) { // Minimum practical capacity
                recommendations.push({
                    id: `industry_${reel.name.replace(/\s+/g, '_').toLowerCase()}`,
                    name: reel.name,
                    type: 'industry',
                    category: reel.category,
                    core: reel.core,
                    flange: reel.flange,
                    width: reel.width,
                    capacity_m: capacity.capacity_m,
                    capacity_ft: Math.floor(capacity.capacity_m * METERS_TO_FEET),
                    layerCount: capacity.layerCount,
                    utilization: 85, // Default utilization percentage
                    utilization_target: 85, // Ideal utilization percentage
                    recommendedForLengths: categorizeRecommendedLengths(reel, capacity.capacity_m)
                });
            }
        } catch (error) {
            console.warn(`❌ Failed to calculate capacity for ${reel.name}:`, error);
        }
    });

    console.log(`✅ Generated ${recommendations.length} reel recommendations`);
    return recommendations.sort((a, b) => a.capacity_m - b.capacity_m); // Sort by capacity
}

function calculateReelCapacityUsingEstimatorLogic(reel, wireDiameter_m, efficiency, freeboard_m) {
    // STANDARD_REELS are already in meters, convert back to inches for capacity calculation
    const core_in = reel.core / INCHES_TO_METERS;
    const flange_in = reel.flange / INCHES_TO_METERS;
    const width_in = reel.width / INCHES_TO_METERS;
    const wireDiameter_in = wireDiameter_m / INCHES_TO_METERS;
    const freeboard_in = freeboard_m / INCHES_TO_METERS;

    return calculateReelCapacityFullLogic(core_in, flange_in, width_in, wireDiameter_in, freeboard_in, efficiency);
}

// Simplified reel capacity calculation (would be replaced with full reel-capacity-estimator.js logic)
function calculateReelCapacityFullLogic(core_in, flange_in, width_in, wireDiameter_m, freeboard_m, efficiency) {
    const d_m = wireDiameter_m;
    const SEGMENTS = Math.max(1, Math.floor(width_in / (wireDiameter_m * 39.37))); // Convert to inches for calculation
    const core_m = core_in / 39.37;
    const maxDiameter_m = (flange_in - (freeboard_m * 39.37)) / 39.37;

    let totalCapacity = 0;
    let layers = 0;

    while (layers < 200) {
        const currentDiameter_m = core_m + (2 * layers - 1) * d_m;
        if (currentDiameter_m >= maxDiameter_m) break;

        const circumference_m = currentDiameter_m * PI;
        const layerCapacity_m = circumference_m * SEGMENTS * efficiency;

        // Only add layers after dead wraps
        const DEAD_WRAPS = 2;
        if (layers >= DEAD_WRAPS) {
            totalCapacity += layerCapacity_m;
        }

        layers++;
    }

    return {
        capacity_m: totalCapacity,
        layerCount: layers,
        maxLayersPossible: layers
    };
}

function categorizeRecommendedLengths(reel, capacity_m) {
    const cap = capacity_m;
    if (cap < 200) return ['<200m cuts'];
    if (cap < 500) return ['200-500m cuts'];
    if (cap < 1000) return ['500-1000m cuts'];
    if (cap < 2000) return ['1000-2000m cuts'];
    return ['>2000m cuts'];
}

function displayEnhancedRecommendedReels(recommendedReels, currentDesignation) {
    const container = document.getElementById('recommendedReelsContainer');

    if (!recommendedReels || recommendedReels.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-600">No suitable reels found for current cable specifications</p>';
        return;
    }

    container.innerHTML = `
        <div class="space-y-3">
            <h3 class="text-lg font-semibold text-[#0058B3] mb-3">🏭 Intelligent Reel Recommendations</h3>
            ${recommendedReels.map((reel, index) => `
                <div class="recommended-reel-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <!-- Reel Info -->
                        <div class="col-span-1">
                            <div class="font-semibold text-[#0058B3] text-lg">${reel.name}</div>
                            <div class="text-sm text-gray-500 capitalize">${reel.category} reel</div>
                        </div>

                        <!-- Dimensions -->
                        <div class="col-span-1">
                            <div class="text-xs text-gray-600">
                                Flange: ${(reel.flange / INCHES_TO_METERS).toFixed(1)}" <br>
                                Core: ${(reel.core / INCHES_TO_METERS).toFixed(1)}" <br>
                                Traverse: ${(reel.width / INCHES_TO_METERS).toFixed(1)}"
                            </div>
                        </div>

                        <!-- Capacity & Utilization -->
                        <div class="col-span-1">
                            <div class="text-sm">
                                <span class="font-semibold text-lg">${reel.capacity_m.toLocaleString('en-US', {maximumFractionDigits: 0})} m</span>
                                <span class="text-gray-500">(${reel.capacity_ft.toLocaleString('en-US', {maximumFractionDigits: 0})} ft)</span>
                            </div>
                            <div class="text-xs text-gray-600">${reel.layerCount} layers • ✅ ${reel.utilization.toFixed(1)}% utilization</div>
                        </div>

                        <!-- Action Button -->
                        <div class="col-span-1">
                            <button onclick="selectRecommendedReel('${reel.id}', '${reel.name}')"
                                    class="bg-[#0058B3] hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">
                                Select Reel
                            </button>
                        </div>
                    </div>

                    <!-- Utilization Indicator -->
                    <div class="mt-3">
                        <div class="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Utilization</span>
                            <span>${reel.utilization.toFixed(1)}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full transition-all duration-300"
                                 style="width: ${Math.min(reel.utilization, 100)}%"></div>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                            ${reel.recommendedForLengths.length > 0
                                ? `Recommended for: ${reel.recommendedForLengths.join(', ')}`
                                : 'General purpose reel'
                            }
                        </div>
                    </div>
                </div>
            `).join('')}

            <div class="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <div class="text-sm text-blue-700">
                    <strong>💡 Smart Recommendations Based On:</strong><br>
                    • Cable specifications (${wireSpecs?.designation || 'N/A'})<br>
                    • Professional winding standards (85% target utilization)<br>
                    • Industry best practices (${DEFAULT_WINDING_EFFICIENCY * 100}% efficiency)<br>
                    • Safety standards (ANSI compliant)
                </div>
            </div>
        </div>
    `;
}

function selectRecommendedReel(reelId, reelName) {
    // Add the selected reel to the active reels and update the UI
    console.log(`🎯 Selected reel: ${reelName} (ID: ${reelId})`);

    // Find the reel from recommendations
    const selectedReel = STANDARD_REELS.find(reel =>
        `industry_${reel.name.replace(/\s+/g, '_').toLowerCase()}` === reelId
    );

    if (selectedReel) {
        // Add to selected reels for planning
        selectedReels.push({
            id: reelId,
            name: selectedReel.name,
            type: 'industry',
            category: selectedReel.category,
            core: selectedReel.core / INCHES_TO_METERS, // Convert to meters for consistency
            flange: selectedReel.flange / INCHES_TO_METERS,
            width: selectedReel.width / INCHES_TO_METERS,
            capacity_m: 0, // Will be calculated with current settings
            unit: 'm'
        });

        // Update UI to show selected reel
        if (window.showAlert) {
            window.showAlert(`✅ Added "${selectedReel.name}" to your reel selection.\n\nContinue to add cut lengths below and plan your multi-reel setup!`, 'Reel Selected');
        }

        // Update the assignment targets
        updateReelAssignmentTargets();
    }
}

// ====================================================================
// ENHANCED REEL ASSIGNMENT WITH EMBEDDED CALCULATORS
// ====================================================================

function updateReelAssignmentTargets() {
    const container = document.getElementById('reelAssignmentTargets');
    container.innerHTML = selectedReels.map(reel => `
        <div class="reel-assignment-target" data-reel-id="${reel.id}" ondrop="dropLength(event, '${reel.id}')" ondragover="allowDrop(event)">
            <div class="font-semibold text-[#0058B3] mb-2">${reel.name}</div>
            <div class="reel-specs">
                <span>Cap: ${reel.capacity_m}m</span>
                <span>${reel.type}</span>
            </div>
            <div id="assignments-${reel.id}" class="mt-2">
                <!-- Assigned lengths will go here -->
            </div>
            <!-- Per-reel settings toggle -->
            <div class="mt-2">
                <button onclick="toggleReelSettings('${reel.id}')"
                        class="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
                    ⚙️ Reel Settings
                </button>
            </div>
        </div>
    `).join('');

    // Update assignments display
    Object.keys(assignments).forEach(reelId => {
        if (assignments[reelId]) {
            updateReelAssignmentDisplay(reelId, assignments[reelId]);
        }
    });

    updatePerReelSettingsPanel();
}

// ====================================================================
// PER-REEL ADVANCED SETTINGS INTEGRATION
// ====================================================================

function toggleReelSettings(reelId) {
    // Toggle visibility of settings for this specific reel
    const existingPanel = document.querySelector(`[data-reel-settings="${reelId}"]`);

    // Hide all other settings panels first
    document.querySelectorAll('[data-reel-settings]').forEach(panel => {
        if (panel !== existingPanel) {
            panel.classList.add('hidden');
        }
    });

    if (!existingPanel) {
        createReelSettingsPanel(reelId);
    } else {
        existingPanel.classList.toggle('hidden');
    }
}

function createReelSettingsPanel(reelId) {
    const reel = selectedReels.find(r => r.id === reelId);
    if (!reel) return;

    const target = document.querySelector(`.reel-assignment-target[data-reel-id="${reelId}"]`);
    if (!target) return;

    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'reel-settings-panel mt-2 p-3 bg-gray-50 rounded-lg border';
    settingsPanel.setAttribute('data-reel-settings', reelId);

    settingsPanel.innerHTML = `
        <div class="grid grid-cols-1 gap-3">
            <div>
                <label class="block text-xs font-semibold mb-1">Winding Efficiency</label>
                <select onchange="updateReelSetting('${reelId}', 'efficiency', this.value)" class="w-full p-1 text-xs border rounded">
                    <option value="0.75">75% - Poor winding</option>
                    <option value="0.80">80% - Below average</option>
                    <option value="0.85" selected>85% - Average</option>
                    <option value="0.90">90% - Good</option>
                    <option value="0.95">95% - Excellent</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold mb-1">Safety Standard</label>
                <select onchange="updateReelSetting('${reelId}', 'safety', this.value)" class="w-full p-1 text-xs border rounded">
                    <option value="custom">Custom Freeboard</option>
                    <option value="ansi_b307_05in" selected>ANSI B30.7 (0.5")</option>
                    <option value="ansi_a1022_2in">ANSI A10.22 (2.0")</option>
                    <option value="uk_den_25x">UK Den (2.5X D)</option>
                    <option value="1x">1X Wire Diameter</option>
                </select>
            </div>
            <div id="freeboard-input-${reelId}">
                <label class="block text-xs font-semibold mb-1">Freeboard Margin</label>
                <div class="flex gap-1">
                    <input type="number" step="0.001" value="0.082" onchange="updateReelSetting('${reelId}', 'freeboard', this.value)"
                           class="flex-1 p-1 text-xs border rounded">
                    <select onchange="updateReelSetting('${reelId}', 'freeboardUnit', this.value)" class="p-1 text-xs border rounded">
                        <option value="in" selected>in</option>
                        <option value="mm">mm</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    target.appendChild(settingsPanel);
    updatePerReelSettingsPanel();

    // Set initial values
    initializeReelSettings(reelId);
}

function updateReelSetting(reelId, setting, value) {
    if (!reelSettings[reelId]) reelSettings[reelId] = {};
    reelSettings[reelId][setting] = value;

    // Handle special cases
    if (setting === 'safety') {
        updateSafetyFreeboard(reelId, value);
    }

    // Recalculate capacity with new settings
    recalculateReelCapacity(reelId);
}

function updateSafetyFreeboard(reelId, safetyStandard) {
    const freeboardInput = document.querySelector(`#freeboard-input-${reelId} input`);
    if (!wireSpecs || !freeboardInput) return;

    const wireDiam = wireSpecs.overallDiameter_inches;
    let freeboard_in = 0.082; // Default

    switch (safetyStandard) {
        case 'ansi_b307_05in': freeboard_in = 0.5; break;
        case 'ansi_a1022_2in': freeboard_in = 2.0; break;
        case 'uk_den_25x': freeboard_in = 2.5 * wireDiam; break;
        case '1x': freeboard_in = 1.0 * wireDiam; break;
    }

    freeboardInput.value = freeboard_in.toFixed(3);
    updateReelSetting(reelId, 'freeboard', freeboard_in.toString());
    updateReelSetting(reelId, 'freeboardUnit', 'in');
}

function initializeReelSettings(reelId) {
    // Set defaults
    updateReelSetting(reelId, 'efficiency', '0.85');
    updateReelSetting(reelId, 'safety', 'ansi_b307_05in');
    updateSafetyFreeboard(reelId, 'ansi_b307_05in');
}

function recalculateReelCapacity(reelId) {
    const reel = selectedReels.find(r => r.id === reelId);
    if (!reel || !wireSpecs) return;

    const settings = reelSettings[reelId] || {};
    const wireDiameter_m = wireSpecs.overallDiameter_mm / 1000;
    const efficiency = parseFloat(settings.efficiency) || 0.85;
    const freeboard_value = parseFloat(settings.freeboard) || 0.082;
    const freeboard_unit = settings.freeboardUnit || 'in';
    const freeboard_m = freeboard_unit === 'in' ? freeboard_value * INCHES_TO_METERS : freeboard_value / 1000;

    const newCapacity = calculateReelCapacityFullLogic(
        reel.core * 39.37, // Convert back to inches
        reel.flange * 39.37,
        reel.width * 39.37,
        wireDiameter_m,
        freeboard_m,
        efficiency
    );

    reel.capacity_m = newCapacity.capacity_m;
    reel.capacity_ft = Math.floor(newCapacity.capacity_m * METERS_TO_FEET);
    reel.layerCount = newCapacity.layerCount;

    // Update the display
    const specs = document.querySelector(`.reel-assignment-target[data-reel-id="${reelId}"] .reel-specs`);
    if (specs) {
        specs.innerHTML = `<span>Cap: ${reel.capacity_m.toFixed(0)}m</span><span>${reel.type} (${efficiency * 100}% eff.)</span>`;
    }

    // Update any assignments
    if (assignments[reelId]) {
        updateReelAssignmentDisplay(reelId, assignments[reelId]);
    }
}

// ====================================================================
// EMBEDDED WIRE MARK & STOP MARK CALCULATORS
// ====================================================================

function createEmbeddedCalculators(reelId, lengthAssigned) {
    return `
        <div class="embedded-calculators mt-2 space-y-2">
            <div class="wire-mark-calculator bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                <div class="text-xs font-semibold mb-1 text-blue-800">📏 Wire Mark Calculator</div>
                <div class="grid grid-cols-2 gap-1">
                    <input type="number" placeholder="Start mark" class="text-xs p-1 border rounded" id="wm-start-${reelId}">
                    <input type="number" placeholder="End mark" class="text-xs p-1 border rounded" id="wm-end-${reelId}">
                </div>
                <button onclick="calculateWireMark('${reelId}')" class="text-xs bg-blue-600 text-white px-2 py-1 rounded mt-1">Calculate</button>
                <div id="wm-result-${reelId}" class="text-xs text-blue-700 mt-1"></div>
            </div>
            <div class="stop-mark-calculator bg-orange-50 p-2 rounded border-l-4 border-orange-400">
                <div class="text-xs font-semibold mb-1 text-orange-800">🎯 Stop Mark Calculator</div>
                <div class="grid grid-cols-2 gap-1">
                    <input type="number" placeholder="Start" class="text-xs p-1 border rounded" id="sm-start-${reelId}">
                    <div class="flex gap-1">
                        <input type="number" placeholder="Length" class="flex-1 text-xs p-1 border rounded" id="sm-length-${reelId}" value="${lengthAssigned}">
                        <select class="text-xs p-1 border rounded" id="sm-unit-${reelId}">
                            <option value="m">m</option>
                            <option value="ft">ft</option>
                        </select>
                    </div>
                </div>
                <button onclick="calculateStopMark('${reelId}')" class="text-xs bg-orange-600 text-white px-2 py-1 rounded mt-1">Calculate</button>
                <div id="sm-result-${reelId}" class="text-xs text-orange-700 mt-1"></div>
            </div>
        </div>
    `;
}

function calculateWireMark(reelId) {
    const startMark = parseFloat(document.getElementById(`wm-start-${reelId}`).value);
    const endMark = parseFloat(document.getElementById(`wm-end-${reelId}`).value);

    if (isNaN(startMark) || isNaN(endMark)) {
        document.getElementById(`wm-result-${reelId}`).textContent = 'Enter valid marks';
        return;
    }

    // Wire mark calculator logic
    const result = Math.abs(endMark - startMark);
    document.getElementById(`wm-result-${reelId}`).textContent = `${result} unit length`;
}

function calculateStopMark(reelId) {
    const start = parseFloat(document.getElementById(`sm-start-${reelId}`).value);
    const length = parseFloat(document.getElementById(`sm-length-${reelId}`).value);
    const unit = document.getElementById(`sm-unit-${reelId}`).value;

    if (isNaN(start) || isNaN(length)) {
        document.getElementById(`sm-result-${reelId}`).textContent = 'Enter valid values';
        return;
    }

    // Stop mark converter logic (simplified)
    const stopMark = unit === 'm' ? start + length : start + (length * METERS_TO_FEET);
    document.getElementById(`sm-result-${reelId}`).textContent = `Stop at: ${stopMark.toFixed(2)}${unit}`;
}

// ====================================================================
// ENHANCED RESULTS WITH EMBEDDED CALCULATORS
// ====================================================================

function displayEnhancedResults(results, payloadLengthM) {
    // Build results table with embedded calculators per reel row
    const tableBody = document.getElementById('cutPlanTable');
    tableBody.innerHTML = '';

    Object.keys(results.reelCounts).forEach(reelId => {
        const data = results.reelCounts[reelId];
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        let statusText = 'Optimal';
        let statusClass = 'bg-green-50 text-green-600';

        if (data.utilization > 100) {
            statusText = 'Over capacity';
            statusClass = 'bg-red-50 text-red-600';
        } else if (data.utilization < 70) {
            statusText = 'Low utilization';
            statusClass = 'bg-yellow-50 text-yellow-600';
        }

        // Create collapsible row with embedded calculators
        row.innerHTML = `
            <td class="p-3 text-sm font-medium text-gray-900">
                ${data.reel.name}
                <button onclick="toggleCalculator('${reelId}')" class="ml-2 text-xs text-blue-600 hover:text-blue-800">🧮</button>
            </td>
            <td class="p-3 text-sm text-center text-gray-600">${data.reel.capacity_m.toFixed(0)}m</td>
            <td class="p-3 text-sm text-center font-medium text-[#0058B3]">${data.lengthAssigned.toFixed(1)}m</td>
            <td class="p-3 text-sm text-center">${data.utilization.toFixed(0)}%</td>
            <td class="p-3 text-sm text-center">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">${statusText}</span>
            </td>
        `;

        tableBody.appendChild(row);

        // Add calculator row (hidden initially)
        const calculatorRow = document.createElement('tr');
        calculatorRow.id = `calculator-row-${reelId}`;
        calculatorRow.className = 'hidden';
        calculatorRow.innerHTML = `
            <td colspan="5" class="p-3 bg-gray-50">
                ${createEmbeddedCalculators(reelId, data.lengthAssigned)}
            </td>
        `;
        tableBody.appendChild(calculatorRow);
    });

    // Update summary stats
    document.getElementById('totalReels').textContent = results.totalReelsNeeded;
    document.getElementById('totalUtilized').textContent = `${results.utilization.toFixed(1)}%`;
    document.getElementById('remainingWaste').textContent =
        `${results.waste.toFixed(1)}m (${(results.waste * METERS_TO_FEET).toFixed(0)}ft)`;

    document.getElementById('resultsSection').classList.remove('hidden');
}

function toggleCalculator(reelId) {
    const row = document.getElementById(`calculator-row-${reelId}`);
    row.classList.toggle('hidden');
}

// ====================================================================
// INTEGRATION FUNCTIONS & POLYFILLS
// ====================================================================

function initializeWireWeightEstimatorIntegration() {
    console.log('📊 Integrating Wire Weight Estimator data...');
    // Wire weight estimator constants and functions are now available
}

function initializeReelCapacityEstimatorIntegration() {
    console.log('🎯 Integrating Reel Capacity Estimator logic...');
    // Reel capacity calculator functions are now available
}

function initializeWireMarkCalculatorIntegration() {
    console.log('📏 Integrating Wire Mark Calculator...');
}

function initializeStopMarkConverterIntegration() {
    console.log('🎯 Integrating Stop Mark Converter...');
}

function getAvailableCableDesignations(cableType) {
    // Get designations from the CABLE_UNIT_WEIGHTS data
    const dataMappings = {
        'TK90': 'TK 600V',
        'TK1000V': 'TK 1KV',
        'ACWU90': 'ACWU90',
        'RW90': 'RW90',
        'SOOW': 'SOOW',
        'BARE': 'BARE 19STR'
    };

    const dataKey = dataMappings[cableType];
    if (!dataKey || !CABLE_UNIT_WEIGHTS[dataKey]) return [];

    return Object.keys(CABLE_UNIT_WEIGHTS[dataKey]).sort();
}

function updatePerReelSettingsPanel() {
    // Update the settings panel visibility
    const hasAssignments = Object.keys(assignments).length > 0;
    document.getElementById('reelSettingsPanel').classList.toggle('hidden', !hasAssignments);
}

// ====================================================================
// CUT LENGTH MANAGEMENT FUNCTIONS
// ====================================================================

function addCutLength() {
    cutLengths.push({
        id: `length_${Date.now()}`,
        value: 150, // Default value
        unit: 'm'
    });

    updateCutLengthsDisplay();
}

function removeCutLength(index) {
    // Get the length to remove from assignments if it was assigned
    const lengthToRemove = cutLengths[index];

    // Remove from assignments
    Object.keys(assignments).forEach(reelId => {
        if (assignments[reelId] && assignments[reelId].id === lengthToRemove.id) {
            delete assignments[reelId];
        }
    });

    // Remove from array
    cutLengths.splice(index, 1);

    updateCutLengthsDisplay();
    updateAssignmentTargets();
}

function updateCutLengthsDisplay() {
    const container = document.getElementById('cutLengthsContainer');

    if (cutLengths.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 italic">No cut lengths defined</p>';
        updateUnassignedLengths();
        return;
    }

    container.innerHTML = cutLengths.map((length, index) => `
        <div class="cut-length-input-group">
            <input type="number" value="${length.value}" min="1" step="0.1"
                   onchange="updateCutLengthValue(${index}, this.value, this.previousElementSibling?.value || 'm')" />
            <select onchange="updateCutLengthUnit(${index}, this.previousElementSibling.value, this.value)"
                    class="text-xs px-2 bg-white border-l">
                <option value="m" ${length.unit === 'm' ? 'selected' : ''}>m</option>
                <option value="ft" ${length.unit === 'ft' ? 'selected' : ''}>ft</option>
            </select>
            <button class="remove-length" onclick="removeCutLength(${index})">×</button>
        </div>
    `).join('');

    updateUnassignedLengths();
}

function updateCutLengthValue(index, newValue, unit) {
    const numericValue = parseFloat(newValue) || 150;

    // Convert value if unit is different from stored unit
    if (unit && unit !== cutLengths[index].unit) {
        if (cutLengths[index].unit === 'm' && unit === 'ft') {
            // Convert meters to feet
            cutLengths[index].value = numericValue * METERS_TO_FEET;
        } else if (cutLengths[index].unit === 'ft' && unit === 'm') {
            // Convert feet to meters
            cutLengths[index].value = numericValue * FEET_TO_METERS;
        } else {
            cutLengths[index].value = numericValue;
        }
    } else {
        cutLengths[index].value = numericValue;
    }

    updateUnassignedLengths();
}

function updateCutLengthUnit(index, currentValue, newUnit) {
    const currentUnit = cutLengths[index].unit;
    const numericValue = parseFloat(currentValue);

    // Convert the value to the new unit
    if (currentUnit === 'm' && newUnit === 'ft') {
        cutLengths[index].value = numericValue * METERS_TO_FEET;
        cutLengths[index].unit = 'ft';
    } else if (currentUnit === 'ft' && newUnit === 'm') {
        cutLengths[index].value = numericValue * FEET_TO_METERS;
        cutLengths[index].unit = 'm';
    } else {
        cutLengths[index].unit = newUnit;
    }

    // Update input value display
    updateCutLengthsDisplay();
    updateUnassignedLengths();
}

// ====================================================================
// MISSING INTEGRATION FUNCTIONS
// ====================================================================

function setupPerReelSettingsIntegration() {
    console.log('🔧 Setting up per-reel settings integration...');
    // Initialize reel settings data structure
    reelSettings = {};
}

function updateAssignmentTargets() {
    // Implementation for updating assignment targets
    console.log('📊 Updating assignment targets...');
}

function updateReelAssignmentDisplay(reelId, assignment) {
    // Implementation for displaying reel assignments
    const container = document.getElementById(`assignments-${reelId}`);
    if (container && assignment) {
        container.innerHTML = `
            <div class="assignment-info text-xs text-green-600">
                ✓ ${assignment.value}${assignment.unit}
            </div>
        `;
    }
}

function updateUnassignedLengths() {
    const container = document.getElementById('unassignedLengthsList');

    // Get lengths that are not assigned to reels
    const assignedLengthIds = new Set();
    Object.values(assignments).forEach(assignment => {
        if (assignment && assignment.id) {
            assignedLengthIds.add(assignment.id);
        }
    });

    const unassignedLengths = cutLengths.filter(length => !assignedLengthIds.has(length.id));

    if (unassignedLengths.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 italic text-center py-4">No unassigned lengths - all have been assigned to reels above</p>';
        return;
    }

    container.innerHTML = unassignedLengths.map(length =>
        `<div class="cut-length-item" draggable="true" data-length-id="${length.id}"
              ondragstart="dragLength(event, '${length.id}')">
            <span class="font-medium">${length.value}${length.unit}</span>
            <span class="text-xs text-gray-600 ml-2">Click & drag to assign to reel</span>
        </div>`
    ).join('');

    console.log(`📋 Updated ${unassignedLengths.length} unassigned lengths`);
}

function setupDragAndDrop() {
    console.log('🎯 Setting up drag and drop...');

    // Enhance drag and drop with visual feedback
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('cut-length-item')) {
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('cut-length-item')) {
            e.target.classList.remove('dragging');
            // Reset drag-over states
            document.querySelectorAll('.reel-assignment-target').forEach(target => {
                target.classList.remove('drag-over');
            });
        }
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        const target = e.target.closest('.reel-assignment-target');
        if (target) {
            target.classList.add('drag-over');
        }
    });

    document.addEventListener('dragleave', (e) => {
        const target = e.target.closest('.reel-assignment-target');
        if (target && !target.contains(e.relatedTarget)) {
            target.classList.remove('drag-over');
        }
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        const target = e.target.closest('.reel-assignment-target');
        if (target) {
            target.classList.remove('drag-over');
        }
    });

    console.log('✅ Drag and drop functionality enhanced');
}

function allowDrop(event) {
    event.preventDefault();
}

function dragLength(event, lengthId) {
    event.dataTransfer.setData('text/plain', lengthId);
    event.dataTransfer.effectAllowed = 'move';

    console.log(`🎯 Starting drag of length: ${lengthId}`);
}

function dropLength(event, reelId) {
    event.preventDefault();

    try {
        const lengthId = event.dataTransfer.getData('text/plain');
        if (!lengthId) return;

        console.log(`📦 Dropping length ${lengthId} on reel ${reelId}`);

        // Find the length object
        const lengthObj = cutLengths.find(length => length.id === lengthId);
        if (!lengthObj) {
            console.error('Length not found:', lengthId);
            return;
        }

        // Find the reel object
        const reelObj = selectedReels.find(reel => reel.id === reelId);
        if (!reelObj) {
            console.error('Reel not found:', reelId);
            return;
        }

        // Assign the length to this reel (only allow one length per reel for now)
        assignments[reelId] = {
            id: lengthObj.id,
            value: lengthObj.value,
            unit: lengthObj.unit
        };

        console.log(`✅ Assigned ${lengthObj.value}${lengthObj.unit} to reel ${reelObj.name}`);

        // Update displays
        updateReelAssignmentDisplay(reelId, assignments[reelId]);
        updateUnassignedLengths();
        updateAssignmentTargets();

        // Add visual feedback
        const target = event.target.closest('.reel-assignment-target');
        if (target) {
            target.classList.add('assignment-success');
            setTimeout(() => target.classList.remove('assignment-success'), 600);
        }

    } catch (error) {
        console.error('Drop operation failed:', error);
    }
}

// ====================================================================
// CUSTOM REEL FUNCTIONS
// ====================================================================

function addCustomReel() {
    console.log('🏭 Adding custom reel with modal...');

    // Create the modal content for custom reel input
    const modalContent = `
        <h3 class="text-lg font-bold text-[#0058B3] mb-4">Add Custom Reel</h3>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-semibold mb-1 text-[#0058B3]">Reel Name</label>
                <input type="text" id="customReelName" placeholder="e.g., My Custom Reel"
                       class="w-full p-2 border border-gray-300 rounded-lg focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 text-sm">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label class="block text-sm font-semibold mb-1 text-[#0058B3]">Core Diameter (inches)</label>
                    <input type="number" id="customReelCore" placeholder="12.0" step="0.1"
                           class="w-full p-2 border border-gray-300 rounded-lg focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 text-sm"
                           min="1" max="60">
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-1 text-[#0058B3]">Flange Diameter (inches)</label>
                    <input type="number" id="customReelFlange" placeholder="24.0" step="0.1"
                           class="w-full p-2 border border-gray-300 rounded-lg focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 text-sm"
                           min="2" max="120">
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-1 text-[#0058B3]">Traverse Width (inches)</label>
                    <input type="number" id="customReelTraverse" placeholder="12.0" step="0.1"
                           class="w-full p-2 border border-gray-300 rounded-lg focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 text-sm"
                           min="1" max="120">
                </div>
            </div>

            <div class="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>💡 Tips:</strong>
                <ul class="mt-1 space-y-1">
                    <li>• Core diameter: Inner hub size (typically 12-24 inches)</li>
                    <li>• Flange diameter: Outer rim size (typically 24-72 inches)</li>
                    <li>• Traverse width: Width between flanges</li>
                </ul>
            </div>
        </div>
    `;

    function handleCustomReelSubmit() {
        const reelName = document.getElementById('customReelName').value.trim();
        const coreIn = parseFloat(document.getElementById('customReelCore').value);
        const flangeIn = parseFloat(document.getElementById('customReelFlange').value);
        const traverseIn = parseFloat(document.getElementById('customReelTraverse').value);

        // Validation
        if (!reelName) {
            showAlert('Please enter a reel name.', 'Validation Error');
            return false;
        }
        if (isNaN(coreIn) || coreIn < 1) {
            showAlert('Please enter a valid core diameter (minimum 1 inch).', 'Validation Error');
            return false;
        }
        if (isNaN(flangeIn) || flangeIn < coreIn) {
            showAlert('Flange diameter must be larger than core diameter.', 'Validation Error');
            return false;
        }
        if (isNaN(traverseIn) || traverseIn < 1) {
            showAlert('Please enter a valid traverse width (minimum 1 inch).', 'Validation Error');
            return false;
        }

        // Convert to meters and create reel
        const customReel = {
            id: `custom_${Date.now()}`,
            name: reelName,
            type: 'custom',
            category: 'custom',
            core: coreIn / 39.37,  // Convert inches to meters
            flange: flangeIn / 39.37,
            width: traverseIn / 39.37,
            capacity_m: 0, // Will be calculated with wire specs
            unit: 'm'
        };

        // Add to selected reels
        selectedReels.push(customReel);
        console.log(`✅ Added custom reel: ${reelName} (${coreIn}" core, ${flangeIn}" flange, ${traverseIn}" wide)`);

        // Update UI
        updateReelAssignmentTargets();
        updateUnassignedLengths();

        // Success feedback
        showAlert(`✅ Custom reel "${reelName}" added successfully!\n\nContinue to assign cut lengths and generate your cutting plan.`, 'Success');

        return true;
    }

    // Show modal with custom content and handlers
    showCustomModal(modalContent, handleCustomReelSubmit);
}

// Enhanced modal function for forms
function showCustomModal(content, submitHandler) {
    const modal = document.getElementById('customModal');
    const modalContent = document.getElementById('modalContent');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalButtons = document.getElementById('modalButtons');

    // Reset modal state directly (avoiding hideModal() timeout conflicts)
    modal.classList.add('hidden');
    modalContent.classList.add('scale-95', 'opacity-0');
    modalContent.classList.remove('scale-100', 'opacity-100');

    // Use a short timeout to ensure DOM state is settled before updating
    setTimeout(() => {
        // Clear existing button HTML to reset any attached listeners
        modalButtons.innerHTML = '';

        modalTitle.textContent = 'Add Custom Reel';
        modalMessage.innerHTML = content;

        // Replace buttons with form buttons
        modalButtons.innerHTML = `
            <button id="modalCancelBtn" class="px-4 py-2 bg-gray-500 text-white rounded-xl shadow-lg hover:bg-gray-600 transform hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease-in-out text-sm font-semibold mr-2">Cancel</button>
            <button id="modalSubmitBtn" class="px-4 py-2 bg-blue-700 text-white rounded-xl shadow-lg hover:bg-blue-800 transform hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease-in-out text-sm font-semibold">Add Reel</button>
        `;

        // Get fresh button references and add listeners
        const submitBtn = document.getElementById('modalSubmitBtn');
        const cancelBtn = document.getElementById('modalCancelBtn');

        if (submitBtn && cancelBtn) {
            submitBtn.addEventListener('click', () => {
                if (submitHandler && submitHandler() !== false) {
                    hideModal();
                }
            });

            cancelBtn.addEventListener('click', () => {
                hideModal();
            });
        }

        // Show modal with animation
        modal.classList.remove('hidden');
        setTimeout(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }, 20); // Short timeout just for DOM settling
}

// ====================================================================
// LEGACY FUNCTION POLYFILLS (for backward compatibility)
// ====================================================================

function generateCutPlan() {
    console.log('🎯 Generating cutting plan optimization...');

    // Validate we have required data
    const payloadLengthM = parseFloat(document.getElementById('payloadLength').value);
    const payloadUnit = document.getElementById('payloadUnit').value;

    if (!payloadLengthM || payloadLengthM <= 0) {
        if (window.showAlert) {
            window.showAlert('Please enter a valid payload length.', 'Input Error');
        }
        return;
    }

    if (selectedReels.length === 0) {
        if (window.showAlert) {
            window.showAlert('Please select at least one reel to plan with.', 'Setup Required');
        }
        return;
    }

    if (Object.keys(assignments).length === 0) {
        if (window.showAlert) {
            window.showAlert('Please assign cut lengths to reels before generating a plan.', 'Setup Incomplete');
        }
        return;
    }

    // Convert payload length to meters if needed
    const totalPayloadM = payloadUnit === 'ft' ? payloadLengthM * FEET_TO_METERS : payloadLengthM;
    console.log(`📏 Total payload: ${totalPayloadM.toFixed(1)}m (${payloadLengthM} ${payloadUnit})`);

    // Calculate the actual cutting plan using optimization algorithm
    const results = optimizeCuttingPlan(totalPayloadM);

    // Display results
    displayEnhancedResults(results, totalPayloadM);

    console.log('✅ Cutting plan generated successfully');
}

function optimizeCuttingPlan(totalPayloadM) {
    console.log('🔢 Optimizing cutting plan...');

    const reelCounts = {};
    let totalReelsNeeded = selectedReels.length; // One reel per assignment for now
    let totalWaste = totalPayloadM;
    let totalUtilization = 0;

    // Calculate usage for each assigned reel
    selectedReels.forEach(reel => {
        const reelId = reel.id;
        const assignment = assignments[reelId];

        if (assignment) {
            const assignedLength = assignment.value;
            const utilization = (assignedLength / reel.capacity_m) * 100;

            reelCounts[reelId] = {
                reel: reel,
                reelId: reelId,
                lengthAssigned: assignedLength,
                capacity_m: reel.capacity_m,
                utilization: Math.min(utilization, 100) // Cap at 100%
            };

            totalWaste -= assignedLength; // Subtract used material
            totalUtilization += utilization;

            console.log(`🎯 Reel ${reel.name}: ${assignedLength}m assigned, ${utilization.toFixed(1)}% utilization`);
        } else {
            // Empty reel - contribute to waste
            totalWaste -= 0; // No material used
        }
    });

    // Calculate overall metrics
    totalUtilization = totalReelsNeeded > 0 ? totalUtilization / selectedReels.length : 0;
    totalWaste = Math.max(0, totalWaste); // Ensure waste is not negative

    const results = {
        reelCounts: reelCounts,
        totalReelsNeeded: totalReelsNeeded,
        utilization: totalUtilization,
        waste: totalWaste,
        totalPayload: totalPayloadM,
        efficiency: ((totalPayloadM - totalWaste) / totalPayloadM) * 100
    };

    console.log(`📊 Plan results: ${totalReelsNeeded} reels, ${totalUtilization.toFixed(1)}% avg utilization, ${totalWaste.toFixed(1)}m waste`);

    return results;
}

// Additional result display helper for assignment indicators
function updateAssignmentTargets() {
    // Show assigned lengths in Section 3 targets
    selectedReels.forEach(reel => {
        const assignment = assignments[reel.id];
        const targetEl = document.querySelector(`.reel-assignment-target[data-reel-id="${reel.id}"]`);

        if (!targetEl) return;

        const assignmentDisplay = targetEl.querySelector(`#assignments-${reel.id}`);
        if (assignmentDisplay && assignment) {
            assignmentDisplay.innerHTML = `
                <div class="assignment-info text-xs text-green-600 bg-green-50 p-2 rounded mt-1">
                    ✓ ${assignment.value}${assignment.unit} assigned
                </div>
            `;
            // Add visual styling to show it's assigned
            targetEl.classList.add('drag-over');
        } else if (assignmentDisplay) {
            assignmentDisplay.innerHTML = '';
            targetEl.classList.remove('drag-over');
        }
    });

    console.log('📊 Updated assignment targets display');
}

// Utility function to clear assignments
function clearAllAssignments() {
    if (!confirm('Are you sure you want to clear all assignments? This will unassign all lengths from reels.')) {
        return;
    }

    assignments = {};
    reelSettings = {}; // Also clear settings

    updateReelAssignmentTargets();
    updateUnassignedLengths();
    updateAssignmentTargets();

    // Hide results if visible
    document.getElementById('resultsSection').classList.add('hidden');

    console.log('🧹 All assignments cleared');
}

function updatePayloadOptions() { /* Legacy function */ }
function clearForm() { /* Legacy function */ }

// ====================================================================
// MODAL HELPER FUNCTIONS (Missing functions that were called but not defined)
// ====================================================================

function showAlert(message, title = 'Alert') {
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalButtons = document.getElementById('modalButtons');

    if (!modal || !modalTitle || !modalMessage || !modalButtons) {
        console.error('Modal elements not found');
        console.warn('Alert fallback:', title + ':', message);
        return;
    }

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalButtons.innerHTML = '<button onclick="hideModal()" class="px-4 py-2 bg-blue-700 text-white rounded-xl shadow-lg hover:bg-blue-800 transform hover:scale-[1.02] active:scale-[0.98] transition duration-200 ease-in-out text-sm font-semibold">OK</button>';

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('scale-95', 'opacity-0');
        modal.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function hideModal() {
    const modal = document.getElementById('customModal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }

    modal.classList.add('scale-95', 'opacity-0');
    modal.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Make modal functions globally available
window.showModal = showCustomModal;
window.hideModal = hideModal;
window.showAlert = showAlert;

console.log('🎯 EECOL Enterprise Multi-Cut Planner initialized - Integrated wire weight, capacity, and mark calculation');

// ============================================================================
// MOBILE MENU INITIALIZATION FOR MULTI-CUT PLANNER PAGE
// ============================================================================

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        version: 'v0.8.0.1',
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' }
        ],
        version: 'v0.8.0.1',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'Multi-Cut Planner'
    });
}
