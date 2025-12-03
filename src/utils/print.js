/**
 * EECOL Wire Tools Suite - Shared Print Utilities
 * Enterprise PWA v0.8.0.0
 */

// Print standard calculation results with EECOL branding
function printCalculationResult(title, resultValue, resultDescription = '') {
    const printWindow = window.open('', '_blank');

    const formattedTitle = title || 'EECOL Calculator Results';
    const formattedValue = resultValue || 'N/A';
    const formattedDescription = resultDescription || 'Calculation completed';

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>${formattedTitle}</title>
            <style>
                body {
                    font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
                    padding: 20px;
                    color: #0058B3;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #0058B3;
                    padding-bottom: 15px;
                }
                .title {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 0 0 10px 0;
                }
                .result {
                    margin: 20px 0;
                    padding: 20px;
                    border: 2px solid #0058B3;
                    border-radius: 8px;
                    background: #f8f9fa;
                    text-align: center;
                }
                .label {
                    font-weight: bold;
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 5px;
                }
                .value {
                    font-size: 32px;
                    color: #0058B3;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .description {
                    font-size: 12px;
                    color: #777;
                    margin-top: 15px;
                }
                .branding {
                    text-align: center;
                    margin-top: 40px;
                    font-size: 10px;
                    color: #999;
                    font-style: italic;
                }
                @media print {
                    body { margin: 0; }
                    button { display: none; }
                    .branding { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">${formattedTitle}</div>
            </div>
            <div class="result">
                <div class="label">${formattedDescription}</div>
                <div class="value">${formattedValue}</div>
            </div>
            <div class="branding">
                EECOL Wire Tools Suite 2025 - Enterprise Edition<br>
                Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
            </div>
            <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 8px 16px; background: #0058B3; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
        </body>
        </html>
    `);
    printWindow.print();
}

// Print wire mark calculator results
function printWireMarkResults(resultText, primaryLabel = 'Length Between Marks') {
    printCalculationResult(
        'EECOL Wire Mark Calculator',
        resultText,
        primaryLabel
    );
}

// Print wire weight estimator results
function printWireWeightResults(totalShipmentWeight, totalWireWeight, unitWeight) {
    const printWindow = window.open('', '_blank');

    const formattedTitle = 'EECOL Wire Weight Estimator Results';

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>${formattedTitle}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h2 { color: #0058B3; }
                .result-section { margin: 20px 0; }
                .result { margin: 10px 0; padding: 15px; border: 2px solid #0058B3; border-radius: 8px; }
                .label { font-weight: bold; color: #666; }
                .value { font-size: 18px; color: #0058B3; font-weight: bold; margin-top: 5px; }
                .shipment-weight { color: #dc2626; font-size: 20px; }
                .wire-weight { color: #0058B3; font-size: 18px; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            <h2>EECOL Wire Weight Estimator Results</h2>
            <div class="result-section">
                <h3>Weight Calculations</h3>
                <div class="result">
                    <div class="result">
                        <p class="label">Total Shipment Weight (Wire + Reel + Skid):</p>
                        <p class="value shipment-weight">${totalShipmentWeight}</p>
                    </div>
                    <div class="result">
                        <p class="label">Wire Weight Only:</p>
                        <p class="value wire-weight">${totalWireWeight}</p>
                    </div>
                    <div class="result">
                        <p class="label">Unit Weight:</p>
                        <p class="value">${unitWeight}</p>
                    </div>
                </div>
            </div>
            <button onclick="window.print()">Print</button>
        </body>
        </html>
    `);
    printWindow.print();
}

// Print wire stop mark calculator results
function printWireStopMarkResults(stoppingMark, visualMark, primaryLabel = 'Stopping Mark and Visual Reference') {
    const printWindow = window.open('', '_blank');

    const formattedTitle = 'EECOL Wire Stop Mark Calculator';
    const formattedPrimary = stoppingMark || 'N/A';
    const formattedSecondary = visualMark || 'N/A';
    const formattedDescription = primaryLabel;

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>${formattedTitle}</title>
            <style>
                body {
                    font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
                    padding: 20px;
                    color: #0058B3;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #0058B3;
                    padding-bottom: 15px;
                }
                .title {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 0 0 10px 0;
                }
                .result {
                    margin: 20px 0;
                    padding: 20px;
                    border: 2px solid #0058B3;
                    border-radius: 8px;
                    background: #f8f9fa;
                    text-align: center;
                }
                .result-primary {
                    font-size: 32px;
                    color: #0058B3;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .result-secondary {
                    font-size: 24px;
                    color: #0058B3;
                    font-weight: bold;
                    margin-bottom: 15px;
                }
                .label {
                    font-weight: bold;
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 5px;
                }
                .description {
                    font-size: 12px;
                    color: #777;
                    margin-top: 15px;
                }
                .branding {
                    text-align: center;
                    margin-top: 40px;
                    font-size: 10px;
                    color: #999;
                    font-style: italic;
                }
                @media print {
                    body { margin: 0; }
                    button { display: none; }
                    .branding { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">${formattedTitle}</div>
            </div>
            <div class="result">
                <div class="label">${formattedDescription}</div>
                <div class="result-primary"><strong>Stopping Mark:</strong> ${formattedPrimary}</div>
                <div class="result-secondary"><strong>Visual Reference Mark:</strong> ${formattedSecondary}</div>
                <div class="description">Conversion Factor Used: 1 m ≈ 3.28084 ft</div>
            </div>
            <div class="branding">
                EECOL Wire Tools Suite 2025 - Enterprise Edition<br>
                Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
            </div>
            <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 8px 16px; background: #0058B3; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
        </body>
        </html>
    `);
    printWindow.print();
}

// Print any rectangular shaped result (for logo-like elements)
function printRectangularResult(title, htmlContent) {
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                body {
                    font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
                    padding: 20px;
                    color: #0058B3;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #0058B3;
                    padding-bottom: 15px;
                }
                .title {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 0;
                }
                .result {
                    margin: 20px auto;
                    max-width: 400px;
                    text-align: center;
                }
                h2 {
                    color: #0058B3;
                    margin-top: 20px;
                    font-size: 16px;
                }
                .branding {
                    text-align: center;
                    margin-top: 40px;
                    font-size: 10px;
                    color: #999;
                    font-style: italic;
                }
                @media print {
                    body { margin: 0; }
                    button { display: none; }
                    .branding { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">${title}</div>
            </div>
            <div class="result">
                ${htmlContent}
            </div>
            <div class="branding">
                EECOL Wire Tools Suite 2025 - Enterprise Edition<br>
                Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
            </div>
            <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 8px 16px; background: #0058B3; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
        </body>
        </html>
    `);
    printWindow.print();
}

// Utility to format print timestamp
function formatPrintTimestamp() {
    return `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
}

// Legacy function for backward compatibility
function createPrintWindow(title, content) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.print();
    return printWindow;
}

// Print reel label (updated version that actually prints)
function doPrintReelLabel() {
    // Get form values from the reel labels page
    const wireIdElement = document.getElementById('wireId');
    const lengthElement = document.getElementById('length');
    const lengthUnitElement = document.getElementById('lengthUnit');
    const lineCodeElement = document.getElementById('lineCode');

    if (!wireIdElement || !lengthElement || !lengthUnitElement || !lineCodeElement) {
        console.error('Reel label form elements not found. Ensure the script loads after DOM is ready.');
        return;
    }

    // Generate label content dynamically
    const labelDiv = document.querySelector('#labelContent div');
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Build label content
    const labelHTML = `
        <div style="font-family: Arial, sans-serif; font-size: 18px; line-height: 1.4; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 20px;">
            <div>
                <div style="margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #0058B3; font-size: 20px;">
                        EECOL WIRE LABEL
                    </div>
                </div>

                <div style="margin: 15px 0; font-weight: bold; color: #333; font-size: 18px;">
                    Wire ID: ${wireIdElement.value.toUpperCase()}
                </div>

                <div style="margin: 15px 0; font-weight: bold; color: #333; font-size: 18px;">
                    Length: ${lengthElement.value} ${lengthUnitElement.value}
                </div>

                <div style="margin: 15px 0; font-weight: bold; color: #333; font-size: 18px;">
                    Line Code: ${lineCodeElement.value.toUpperCase()}
                </div>

                <div style="margin: 15px 0; font-size: 14px; color: #666;">
                    Date: ${currentDate}
                </div>
            </div>
        </div>
    `;

    labelDiv.innerHTML = labelHTML;

    // Print the label
    window.print();
}

// Print shipping manifest reel label
function printShippingManifestLabel() {
    // Get form values from global variables (set by calling script)
    if (typeof customerNameInput === 'undefined' || !customerNameInput || !orderNumberInput || !weightInput) {
        console.error('Shipping manifest form elements not found. Make sure the JavaScript loads after DOM is ready.');
        return;
    }

    // Validate required fields (only customer, order number, and weight)
    if (!customerNameInput.value.trim() || !orderNumberInput.value.trim() || !weightInput.value.trim()) {
        showAlert('Please enter Customer/Branch Name, Order Number, and Weight to print a label.', 'Missing Information');
        return;
    }

    // Save to history - delegate to the calling script's function
    if (typeof saveLabelHistory === 'function') {
        saveLabelHistory();
    }

    // Generate label content dynamically
    const labelDiv = document.querySelector('#labelContent div');
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Build label content conditionally
    let labelHTML = `
        <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.3; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 15px;">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div style="text-align: left; font-weight: bold; color: #0058B3;">
                        ${customerNameInput.value.toUpperCase()}
                    </div>
                    <div style="text-align: right; font-weight: bold; color: #0058B3;">
                        ${currentDate}
                    </div>
                </div>

                <div style="margin: 10px 0; text-align: left; font-weight: bold; color: #333;">
                    Wire ID: ${wireIdInput.value.toUpperCase()}
                </div>`;

    // Add target amount only if provided
    if (targetAmountInput && targetAmountInput.value && targetAmountInput.value.trim()) {
        const unitElement = document.getElementById('targetAmountUnit');
        const unit = unitElement ? unitElement.value : 'm';
        labelHTML += `
                <div style="margin: 10px 0; text-align: left; font-weight: bold; color: #333;">
                    Target: ${targetAmountInput.value} ${unit}
                </div>`;
    }

    // Add reel dimensions only if any dimension has a meaningful value (> 0)
    const hasFlange = flangeDiameterInput && flangeDiameterInput.value && parseFloat(flangeDiameterInput.value) > 0;
    const hasCore = coreDiameterInput && coreDiameterInput.value && parseFloat(coreDiameterInput.value) > 0;
    const hasWidth = traverseWidthInput && traverseWidthInput.value && parseFloat(traverseWidthInput.value) > 0;
    const hasAnyDimension = hasFlange || hasCore || hasWidth;

    if (hasAnyDimension) {
        const coreUnitElement = document.getElementById('coreDiameterUnit');
        const flangeUnitElement = document.getElementById('flangeDiameterUnit');
        const widthUnitElement = document.getElementById('traverseWidthUnit');
        const coreUnit = coreUnitElement ? coreUnitElement.value : 'in';
        const flangeUnit = flangeUnitElement ? flangeUnitElement.value : 'in';
        const widthUnit = widthUnitElement ? widthUnitElement.value : 'in';

        labelHTML += `
                <div style="margin: 10px 0; text-align: left; font-size: 10px; color: #666;">
                    ${hasFlange ? `Reel: ${flangeDiameterInput.value} ${flangeUnit} flange<br>` : ''}
                    ${hasCore || hasWidth ? `Core: ${hasCore ? coreDiameterInput.value : '0'} ${coreUnit} | Width: ${hasWidth ? traverseWidthInput.value : '0'} ${widthUnit}` : ''}
                </div>`;
    }

    labelHTML += `
            </div>

            <div>
                <div style="display: flex; justify-content: space-between; align-items: end;">
                    <div style="text-align: left; font-weight: bold; color: #0058B3;">
                        ${orderNumberInput.value ? `Order: ${orderNumberInput.value}` : ''}
                    </div>
                    <div style="text-align: right;">
                        ${customDetailsInput && customDetailsInput.value ? `<div style="font-size: 10px; color: #666; margin-bottom: 5px;">${customDetailsInput.value}</div>` : ''}
                        ${weightInput.value ? `<div style="font-weight: bold; color: #333;">Weight: ${weightInput.value}</div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    labelDiv.innerHTML = labelHTML;

    // Print the label
    window.print();
}

// Print shipping manifest hazard sheets
function printShippingManifestHazardSheets() {
    // Generate Canadian SDS information for high voltage electrical cables
    const hazardContent = generateShippingManifestHazardDocumentation();

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>EECOL Hazardous Materials Documentation</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
                h1 { color: #0058B3; border-bottom: 2px solid #0058B3; }
                h2 { color: #0058B3; margin-top: 30px; }
                .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .safety-info { background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .section { margin: 20px 0; page-break-inside: avoid; }
                .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #666; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            ${hazardContent}
        </body>
        </html>
    `);
    printWindow.print();
}

// Generate shipping manifest hazard documentation (Canadian SDS)
function generateShippingManifestHazardDocumentation() {
    return `
        <h1>EECOL Electric - Hazardous Materials Safety Data Sheet</h1>
        <p><strong>Product:</strong> High Voltage Electrical Cables and Wire Products</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

        <div class="section">
            <h2>⚠️ IMPORTANT SAFETY WARNINGS</h2>
            <div class="warning">
                <strong>HIGH VOLTAGE HAZARD:</strong> These products may contain high voltage electrical conductors.
                Contact with energized conductors can result in severe injury or death by electrocution.
            </div>
        </div>

        <div class="section">
            <h2>🚫 HANDLING PRECAUTIONS</h2>
            <div class="safety-info">
                <ul>
                    <li><strong>De-energize before handling:</strong> Always ensure electrical systems are de-energized, locked out, and tagged out before installation or maintenance.</li>
                    <li><strong>Qualified personnel only:</strong> Installation and maintenance must be performed by qualified electricians only.</li>
                    <li><strong>Proper PPE:</strong> Use appropriate personal protective equipment including insulated gloves, safety glasses, and protective clothing.</li>
                    <li><strong>Inspect before use:</strong> Check for damage to insulation or conductors before installation.</li>
                    <li><strong>Secure storage:</strong> Store in a dry, secure location away from moisture and physical damage.</li>
                </ul>
            </div>
        </div>

        <div class="section">
            <h2>🏥 FIRST AID MEASURES</h2>
            <div class="warning">
                <p><strong>Electric Shock:</strong></p>
                <ul>
                    <li>DO NOT touch the victim if they are still in contact with the electrical source</li>
                    <li>Turn off power at the source if possible</li>
                    <li>Call emergency services immediately (911)</li>
                    <li>Begin CPR if trained and if victim is not breathing</li>
                    <li>Keep victim warm and monitor breathing until help arrives</li>
                </ul>
            </div>
        </div>

        <div class="section">
            <h2>🔥 FIRE FIGHTING MEASURES</h2>
            <div class="safety-info">
                <ul>
                    <li>Use Dry Chemical Or CO2 Fire Extinguishers</li>
                    <li>Do not use water on live electrical equipment</li>
                    <li>Evacuate area and contact emergency services</li>
                    <li>Wear self-contained breathing apparatus (SCBA)</li>
                </ul>
            </div>
        </div>

        <div class="section">
            <h2>📞 EMERGENCY CONTACTS</h2>
            <div class="safety-info">
                <p><strong>Emergency Services:</strong> 911</p>
                <p><strong>EECOL Electric:</strong> 1-800-661-1115</p>
                <p><strong>Poison Control:</strong> 1-800-268-9017</p>
            </div>
        </div>

        <div class="section">
            <h2>⚖️ COMPLIANCE INFORMATION</h2>
            <div class="safety-info">
                <p><strong>Standards Compliance:</strong> Products meet CSA C22.2 No. 131 and/or UL standards as applicable.</p>
                <p><strong>WHMIS Classification:</strong> Not controlled under WHMIS 2015.</p>
                <p><strong>Transportation:</strong> Not regulated as dangerous goods for transportation.</p>
            </div>
        </div>

        <div class="footer">
            <p>This document provides general safety information for high voltage electrical cable products.</p>
            <p>For product-specific SDS information, contact EECOL Electric at 1-800-661-1115.</p>
            <p>Document generated by EECOL Wire Tools Suite - Shipping Manifest System</p>
        </div>
    `;
}

// Print machine maintenance checklist
function printMachineMaintenanceChecklist() {
    // DEBUG: Verify function execution
    // alert("DEBUG: Loading Main Checklist Landscape Layout v1");

    // Collect data from current form (or loaded historical data)
    const inspectedBy = document.getElementById('globalInspectedBy').value || 'Not specified';
    const inspectionDate = document.getElementById('globalInspectionDate').value || new Date().toLocaleDateString();
    const comments = document.getElementById('comments').value || '';

    // Build checklist content
    let checklistHTML = '';

    const maintenanceItems = [
        'Frame Welds & Covers', 'Hoses & Cables', 'Electrical Connections', 'Oil Leaks',
        'Hydraulic Hose(s) & Pins', 'Coller & Reel Bars', 'Deadman (Foot Switch)',
        'Controls & Operation', 'Wire Machine Surroundings', 'Cutting Area Free Of Hazards',
        'Tail Ends Trimmed Or Tacked', 'Top Wire Spooled From Bottom', 'PPE Ready & Available'
    ];

    const machines = ['Manual Hand Coiler', 'Green Electric Hand Coiler', 'Blue Electric Hand Coiler', 'Telus Machine', 'Big Blue Machine #1', 'Big Blue Machine #2'];

    checklistHTML += '<table>';
    checklistHTML += '<thead><tr>';
    checklistHTML += '<th>MAINTENANCE ITEM</th>';

    machines.forEach(machine => {
        checklistHTML += `<th>${machine}</th>`;
    });

    checklistHTML += '</tr></thead><tbody>';

    maintenanceItems.forEach((item, itemIndex) => {
        checklistHTML += `<tr><td>${item}</td>`;

        for (let machineIndex = 0; machineIndex < machines.length; machineIndex++) {
            // Check if checkbox exists for this machine/item combination
            const okCheckbox = document.querySelector(`.ok-checkbox[data-machine="${machineIndex + 1}"][data-item="${itemIndex}"]`);
            const notOkCheckbox = document.querySelector(`.not-ok-checkbox[data-machine="${machineIndex + 1}"][data-item="${itemIndex}"]`);

            if (!okCheckbox || !notOkCheckbox) {
                checklistHTML += '<td style="text-align: center;">-</td>';
            } else {
                let status = '';
                let statusClass = '';
                if (okCheckbox.checked) {
                    status = '✓';
                    statusClass = 'status-ok';
                } else if (notOkCheckbox.checked) {
                    status = 'X';
                    statusClass = 'status-ng';
                }
                checklistHTML += `<td style="text-align: center;"><span class="${statusClass}">${status}</span></td>`;
            }
        }

        checklistHTML += '</tr>';
    });

    checklistHTML += '</tbody></table>';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>EECOL Machine Maintenance Checklist</title>
            <style>
                @page {
                    size: landscape;
                    margin: 10mm;
                }
                body {
                    font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
                    color: #333;
                    line-height: 1.4;
                    font-size: 11px; /* Slightly smaller for matrix */
                    margin: 0;
                    padding: 0;
                }

                /* ISO Header Style */
                .iso-header {
                    display: flex;
                    border: 2px solid #000;
                    margin-bottom: 20px;
                }
                .iso-header > div {
                    padding: 10px;
                    border-right: 1px solid #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .iso-header > div:last-child {
                    border-right: none;
                }
                .logo-box {
                    width: 20%;
                    font-weight: bold;
                    font-size: 16px;
                    color: #0058B3;
                    background: #f0f0f0;
                    text-align: center;
                }
                .title-box {
                    width: 50%;
                    font-weight: bold;
                    font-size: 18px;
                    text-transform: uppercase;
                    flex-direction: column;
                    text-align: center;
                }
                .title-box .sub {
                    font-size: 10px;
                    font-weight: normal;
                    margin-top: 5px;
                    color: #666;
                }
                .meta-box {
                    width: 30%;
                    font-size: 11px;
                    flex-direction: column;
                    align-items: flex-start !important;
                    padding-left: 15px !important;
                }

                /* Professional Table */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px;
                    margin-bottom: 20px;
                }
                th {
                    background-color: #0058B3 !important;
                    color: white !important;
                    font-weight: bold;
                    text-align: center;
                    padding: 8px 4px;
                    border: 1px solid #000;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    vertical-align: middle;
                }
                th:first-child {
                    text-align: left;
                    width: 20%;
                }
                td {
                    border: 1px solid #ccc;
                    padding: 6px 4px;
                    color: #333;
                    vertical-align: middle;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                tr:nth-child(odd) {
                    background-color: #fff !important;
                }

                /* Status Icons */
                .status-ok {
                    color: #10b981;
                    font-weight: bold;
                    font-size: 14px;
                }
                .status-ng {
                    color: #ef4444;
                    font-weight: bold;
                    font-size: 14px;
                }

                /* Comments Section */
                .comments-box {
                    border: 1px solid #ddd;
                    background: #fcfcfc;
                    padding: 10px;
                    margin-bottom: 20px;
                    font-size: 11px;
                    min-height: 40px;
                }
                .comments-label {
                    font-weight: bold;
                    font-size: 11px;
                    margin-bottom: 5px;
                    color: #555;
                    text-transform: uppercase;
                }

                /* Signature Footer */
                .signature-footer {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 30px;
                    padding-top: 10px;
                    border-top: 2px solid #000;
                    page-break-inside: avoid;
                }
                .sig-block {
                    width: 45%;
                }
                .sig-line {
                    border-bottom: 1px solid #000;
                    height: 30px;
                    margin-bottom: 5px;
                }
                .sig-label {
                    font-size: 10px;
                    font-weight: bold;
                    text-transform: uppercase;
                }

                @media print {
                    body { margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="iso-header">
                <div class="logo-box">EECOL<br>WIRE TOOLS</div>
                <div class="title-box">
                    MACHINE MAINTENANCE RECORD
                    <div class="sub">SITE-WIDE INSPECTION LOG</div>
                </div>
                <div class="meta-box">
                    <div><strong>Date:</strong> ${inspectionDate}</div>
                    <div><strong>Inspector:</strong> ${inspectedBy}</div>
                    <div><strong>Scope:</strong> All Machines</div>
                </div>
            </div>

            ${checklistHTML}

            <div class="comments-label">ADDITIONAL COMMENTS / NOTES:</div>
            <div class="comments-box">
                ${comments.replace(/\n/g, '<br>') || 'No additional comments recorded.'}
            </div>

            <div class="signature-footer">
                <div class="sig-block">
                    <div class="sig-line"></div>
                    <div class="sig-label">Inspector Signature</div>
                </div>
                <div class="sig-block">
                    <div class="sig-line"></div>
                    <div class="sig-label">Supervisor Review</div>
                </div>
            </div>

            <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #0058B3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">🖨️ PRINT RECORD</button>
        </body>
        </html>
    `);
    printWindow.print();
}

// Print machine maintenance checklist multi-page
function printMachineMaintenanceChecklistMultiPage() {
    const machines = [
        'Manual Hand Coiler',
        'Green Electric Hand Coiler',
        'Blue Electric Hand Coiler',
        'Telus Machine',
        'Big Blue Machine #1',
        'Big Blue Machine #2'
    ];

    const maintenanceItems = [
        'Frame Welds & Covers', 'Hoses & Cables', 'Electrical Connections', 'Oil Leaks',
        'Hydraulic Hose(s) & Pins', 'Coiler & Reel Bars', 'Deadman (Foot Switch)',
        'Controls & Operation', 'Wire Machine Surroundings', 'Cutting Area Free Of Hazards',
        'Tail Ends Trimmed Or Tacked', 'Top Wire Spooled From Bottom', 'PPE Ready & Available'
    ];

    // DEBUG: Verify function execution
    // alert("DEBUG: Loading New Print Layout v3");

    let printContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>EECOL Multi-Machine Maintenance Checklist</title>
            <style>
                @page {
                    size: A4;
                    margin: 10mm;
                }
                body {
                    font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
                    color: #333;
                    line-height: 1.4;
                    font-size: 12px;
                    margin: 0;
                    padding: 0;
                }
                
                /* ISO Header Style */
                .iso-header {
                    display: flex;
                    border: 2px solid #000;
                    margin-bottom: 20px;
                }
                .iso-header > div {
                    padding: 10px;
                    border-right: 1px solid #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .iso-header > div:last-child {
                    border-right: none;
                }
                .logo-box {
                    width: 20%;
                    font-weight: bold;
                    font-size: 16px;
                    color: #0058B3;
                    background: #f0f0f0;
                    text-align: center;
                }
                .title-box {
                    width: 50%;
                    font-weight: bold;
                    font-size: 18px;
                    text-transform: uppercase;
                    flex-direction: column;
                    text-align: center;
                }
                .title-box .sub {
                    font-size: 10px;
                    font-weight: normal;
                    margin-top: 5px;
                    color: #666;
                }
                .meta-box {
                    width: 30%;
                    font-size: 11px;
                    flex-direction: column;
                    align-items: flex-start !important;
                    padding-left: 15px !important;
                }

                /* Machine Section */
                .machine-section {
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                    border: 1px solid #ccc;
                    padding: 15px;
                    border-radius: 4px;
                }
                .machine-section:not(:first-child) {
                    page-break-before: always;
                    break-before: page;
                }
                .machine-title {
                    background: #0058B3;
                    color: white;
                    padding: 8px 15px;
                    font-weight: bold;
                    font-size: 16px;
                    margin: -15px -15px 15px -15px; /* Flush with container */
                    border-radius: 3px 3px 0 0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                /* Professional Table */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                    margin-bottom: 20px;
                }
                th {
                    background-color: #0058B3 !important;
                    color: white !important;
                    font-weight: bold;
                    text-align: left;
                    padding: 8px;
                    border: 1px solid #000;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                td {
                    border: 1px solid #ccc;
                    padding: 6px 8px;
                    color: #333;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                tr:nth-child(odd) {
                    background-color: #fff !important;
                }

                /* Status Icons */
                .status-ok {
                    color: #10b981;
                    font-weight: bold;
                    font-size: 14px;
                }
                .status-ng {
                    color: #ef4444;
                    font-weight: bold;
                    font-size: 14px;
                }

                /* Comments Section */
                .comments-box {
                    border: 1px solid #ddd;
                    background: #fcfcfc;
                    padding: 10px;
                    margin-bottom: 20px;
                    font-size: 11px;
                    min-height: 40px;
                }
                .comments-label {
                    font-weight: bold;
                    font-size: 11px;
                    margin-bottom: 5px;
                    color: #555;
                    text-transform: uppercase;
                }

                /* Signature Footer */
                .signature-footer {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 30px;
                    padding-top: 10px;
                    border-top: 2px solid #000;
                }
                .sig-block {
                    width: 45%;
                }
                .sig-line {
                    border-bottom: 1px solid #000;
                    height: 30px;
                    margin-bottom: 5px;
                }
                .sig-label {
                    font-size: 10px;
                    font-weight: bold;
                    text-transform: uppercase;
                }

                @media print {
                    body { margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    button { display: none; }
                    .machine-section { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
    `;

    const skipLists = {
        1: [1, 2, 3, 4, 5, 6, 7], // Manual Hand Coiler skips these item indices
        2: [3, 4, 5, 7],       // Green Electric Hand Coiler skips
        3: [3, 4, 5]          // Blue Electric Hand Coiler skips
    };

    const globalDate = document.getElementById('inspectionDate-1')?.value || new Date().toLocaleDateString();
    const globalInspector = document.getElementById('inspectedBy-1')?.value || 'Not specified';

    for (let i = 1; i <= 6; i++) {
        const inspectedBy = document.getElementById(`inspectedBy-${i}`).value || 'Not specified';
        const inspectionDate = document.getElementById(`inspectionDate-${i}`).value || new Date().toLocaleDateString();
        const comments = document.getElementById(`comments-${i}`).value || '';

        printContent += `
            <div class="machine-section">
                <!-- ISO Header repeated for each page/machine -->
                <div class="iso-header">
                    <div class="logo-box">EECOL<br>WIRE TOOLS</div>
                    <div class="title-box">
                        MACHINE MAINTENANCE RECORD
                        <div class="sub">DAILY INSPECTION LOG</div>
                    </div>
                    <div class="meta-box">
                        <div><strong>Date:</strong> ${inspectionDate}</div>
                        <div><strong>Inspector:</strong> ${inspectedBy}</div>
                        <div><strong>Machine ID:</strong> #${i}</div>
                    </div>
                </div>

                <div class="machine-title">${machines[i - 1]}</div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 60%;">MAINTENANCE ITEM</th>
                            <th style="width: 20%; text-align: center;">OK</th>
                            <th style="width: 20%; text-align: center;">NG</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        maintenanceItems.forEach((item, itemIndex) => {
            const skipIndexes = skipLists[i] || [];
            if (!skipIndexes.includes(itemIndex)) {
                const okCheckbox = document.querySelector(`.ok-checkbox[data-machine="${i}"][data-item="${itemIndex}"]`);
                const notOkCheckbox = document.querySelector(`.not-ok-checkbox[data-machine="${i}"][data-item="${itemIndex}"]`);

                let statusOK = '', statusNG = '';
                if (okCheckbox && okCheckbox.checked) statusOK = '✓';
                if (notOkCheckbox && notOkCheckbox.checked) statusNG = 'X';

                printContent += `
                    <tr>
                        <td>${item}</td>
                        <td style="text-align: center;"><span class="status-ok">${statusOK}</span></td>
                        <td style="text-align: center;"><span class="status-ng">${statusNG}</span></td>
                    </tr>
                `;
            }
        });

        printContent += `
                    </tbody>
                </table>

                <div class="comments-label">ADDITIONAL COMMENTS / NOTES:</div>
                <div class="comments-box">
                    ${comments.replace(/\n/g, '<br>') || 'No additional comments recorded.'}
                </div>

                <div class="signature-footer">
                    <div class="sig-block">
                        <div class="sig-line"></div>
                        <div class="sig-label">Inspector Signature</div>
                    </div>
                    <div class="sig-block">
                        <div class="sig-line"></div>
                        <div class="sig-label">Supervisor Review</div>
                    </div>
                </div>
            </div>
        `;
    }

    printContent += `
            <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #0058B3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">🖨️ PRINT RECORD</button>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.print();
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.printCalculationResult = printCalculationResult;
    window.printWireMarkResults = printWireMarkResults;
    window.printWireStopMarkResults = printWireStopMarkResults;
    window.printWireWeightResults = printWireWeightResults;
    window.printRectangularResult = printRectangularResult;
    window.printReelLabel = doPrintReelLabel;
    window.printShippingManifestLabel = printShippingManifestLabel;
    window.printShippingManifestHazardSheets = printShippingManifestHazardSheets;
    window.printMachineMaintenanceChecklist = printMachineMaintenanceChecklist;
    window.printMachineMaintenanceChecklistMultiPage = printMachineMaintenanceChecklistMultiPage;
    window.generateShippingManifestHazardDocumentation = generateShippingManifestHazardDocumentation;
    window.formatPrintTimestamp = formatPrintTimestamp;
    window.createPrintWindow = createPrintWindow;
}
