// DOM elements
const printLabelBtn = document.getElementById('printLabelBtn');

// Form elements
const wireIdInput = document.getElementById('wireId');
const lengthInput = document.getElementById('length');
const lengthUnit = document.getElementById('lengthUnit');
const lineCodeInput = document.getElementById('lineCode');

// Reel dimension elements
const coreDiameterInput = document.getElementById('coreDiameter');
const flangeDiameterInput = document.getElementById('flangeDiameter');
const flangeDiameterUnit = document.getElementById('flangeDiameterUnit');
const coreDiameterUnit = document.getElementById('coreDiameterUnit');
const traverseWidthUnit = document.getElementById('traverseWidthUnit');
const traverseWidthInput = document.getElementById('traverseWidth');

// Print reel label
printLabelBtn.addEventListener('click', function() {
    printReelLabel();
});

function printReelLabel() {
    // Validate required fields
    if (!wireIdInput.value.trim() || !lengthInput.value.trim() || !lineCodeInput.value.trim()) {
        showAlert('Please enter Wire ID, Length, and Line Code to print a label.', 'Missing Information');
        return;
    }

    // Generate label content dynamically
    const labelDiv = document.querySelector('#labelContent div');

    // Build label content conditionally
    let labelHTML = `
        <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.3; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 15px;">`;

    // Add reel dimensions only if any dimension has a meaningful value (> 0)
    const hasFlange = flangeDiameterInput.value && parseFloat(flangeDiameterInput.value) > 0;
    const hasCore = coreDiameterInput.value && parseFloat(coreDiameterInput.value) > 0;
    const hasWidth = traverseWidthInput.value && parseFloat(traverseWidthInput.value) > 0;
    const hasAnyDimension = hasFlange || hasCore || hasWidth;

    if (hasAnyDimension) {
        labelHTML += `
            <div style="margin: 10px 0; text-align: left; font-size: 10px; color: #666;">
                ${hasFlange ? `Flange: ${flangeDiameterInput.value} ${flangeDiameterUnit.value}` : ''}
                ${hasCore || hasWidth ? `Core: ${hasCore ? coreDiameterInput.value : '0'} ${coreDiameterUnit.value} | Width: ${hasWidth ? traverseWidthInput.value : '0'} ${traverseWidthUnit.value}` : ''}
            </div>`;
    }

    labelHTML += `
            <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="text-align: center; font-size: 32px; font-weight: bold; color: #0058B3;">
                    Wire ID: ${wireIdInput.value.toUpperCase()}
                </div>

                <div style="text-align: center; font-size: 24px; font-weight: bold; color: #333;">
                    Length: ${lengthInput.value} ${lengthUnit.value}
                </div>

                <div style="text-align: center; font-size: 24px; font-weight: bold; color: #0058B3;">
                    L:${lineCodeInput.value.toUpperCase()}
                </div>
            </div>
        </div>
    `;

    labelDiv.innerHTML = labelHTML;

    // Print the label
    window.print();
}

// Modal functions for alerts
function showAlert(message, title = "Notification") {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
            <div class="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border-2 border-[#0058B3]">
                <div class="flex items-center justify-center mb-4">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="eecol-logo-tilt">
                        <circle cx="12" cy="12" r="11.35" fill="white" stroke="#0058B3" stroke-width="2"/>
                        <rect x="4" y="4" width="4" height="16" rx="1" fill="#0058B3"/>
                        <path d="M 8,6.5 C 12,5.5 16,7.5 20,6.5" stroke="#0058B3" stroke-width="3.5" stroke-linecap="round"/>
                        <path d="M 8,12 C 12,11 16,13 20,12" stroke="#0058B3" stroke-width="3.5" stroke-linecap="round"/>
                        <path d="M 8,17.5 C 12,16.5 16,18.5 20,17.5" stroke="#0058B3" stroke-width="3.5" stroke-linecap="round"/>
                    </svg>
                </div>
                <h3 class="text-lg font-bold text-center mb-3" style="background-image: linear-gradient(90deg, #0058B3, #004a99); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent;">${title}</h3>
                <div class="text-sm text-gray-700 mb-6 text-center">${message}</div>
                <div class="flex justify-center">
                    <button class="px-4 py-2 bg-blue-700 text-white rounded-xl shadow-lg hover:bg-blue-800 text-sm font-semibold">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const okBtn = modal.querySelector('button');
        okBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                resolve();
            }
        });
    });
}

// Auto-uppercase inputs
wireIdInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.toUpperCase();
});

// Length input - allow numbers and decimals (like weight in shipping manifest)
lengthInput.addEventListener('input', function(e) {
    // Allow numbers and one decimal point
    let value = e.target.value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    e.target.value = value;
});

lineCodeInput.addEventListener('input', function(e) {
    let value = e.target.value.toUpperCase();
    // Restrict to single capital letter or 1-3 digits
    value = value.replace(/[^A-Z0-9]/g, '');

    // Limit to single letter or up to 3 digits
    if (value.length === 1 && /^[A-Z]$/.test(value)) {
        // Single letter is fine
    } else if (/^\d{1,3}$/.test(value)) {
        // 1-3 digits is fine
    } else {
        // Invalid input, trim appropriately
        if (value.length > 0 && /^[A-Z]/.test(value)) {
            value = value[0]; // Keep only first character if it's a letter
        } else if (value.length > 0) {
            value = value.replace(/[^\d]/g, '').slice(0, 3); // Keep only up to 3 digits
        } else {
            value = '';
        }
    }

    e.target.value = value;
});

// Initialize mobile menu for this page
if (typeof initMobileMenu === 'function') {
    initMobileMenu({
        menuItems: [
            { text: '🏠 Home', href: '../index/index.html', class: 'bg-blue-600 hover:bg-blue-700' },
            { text: 'Is This Tool Useful?', href: '../useful-tool/useful-tool.html', class: 'bg-sky-500 hover:bg-sky-600' },
            { text: '📱 Shipping Manifest', href: '../shipping-manifest/shipping-manifest.html', class: 'bg-green-600 hover:bg-green-700' }
        ],
        version: 'v0.8.0.1',
        credits: 'Made With ❤️ By: Lucas and Cline 🤖',
        title: 'EECOL Reel Labels'
    });
}
