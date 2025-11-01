/**
 * EECOL P2P Relay Configuration - Manage relay server settings
 * EECOL Wire Tools Suite v0.8.0.0
 */

class P2PRelayConfig {
    constructor() {
        this.sync = null;
        this.startTime = Date.now();
        this.connectionLog = [];
        this.isTestingConnection = false;
        this.initialize();
    }

    async initialize() {
        console.log('🔧 P2P Relay Config initializing...');

        this.setupEventListeners();

        // Wait a moment for P2PSync to be available
        await this.waitForP2PSync();

        if (window.P2PSync) {
            this.sync = new P2PSync({
                networkDetection: true,
                enabled: false // Don't auto-enable sync in config page
            });

            // Listen for sync status updates
            this.sync.onStatusChange((status) => {
                this.updateStatus(status);
            });

            // Set initial state
            const initialStatus = this.sync.getSyncStatus();
            this.updateStatus(initialStatus);

            console.log('✅ P2P Relay Config initialized successfully');
        } else {
            console.warn('❌ P2PSync not available');
            this.showUnavailableState();
        }

        // Load current configuration
        this.loadCurrentConfig();
        this.addLogEntry('🔧 P2P Relay Configuration loaded');
    }

    async waitForP2PSync() {
        return new Promise((resolve) => {
            if (window.P2PSync) {
                resolve();
                return;
            }

            const checkInterval = setInterval(() => {
                if (window.P2PSync) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 5000);
        });
    }

    setupEventListeners() {
        // Test connection button
        const testBtn = document.getElementById('test-connection');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testConnection());
        }

        // Save configuration button
        const saveBtn = document.getElementById('save-config');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveConfiguration());
        }

        // Load current configuration button
        const loadBtn = document.getElementById('load-config');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.loadCurrentConfig());
        }

        // Clear log button
        const clearBtn = document.getElementById('clear-log');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearLog());
        }

        // Show advanced options
        const advancedBtn = document.getElementById('show-advanced');
        if (advancedBtn) {
            advancedBtn.addEventListener('change', (e) => this.toggleAdvancedOptions(e.target.checked));
        }

        // Close modal on button click
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => this.closeModal());
        }
    }

    // ===== CONNECTION TESTING METHODS =====

    async testConnection() {
        if (this.isTestingConnection) return;

        this.isTestingConnection = true;
        const testBtn = document.getElementById('test-connection');
        const originalText = testBtn.textContent;
        testBtn.textContent = '🔄 Testing...';
        testBtn.disabled = true;
        testBtn.classList.add('bg-gray-600', 'hover:bg-gray-700');
        testBtn.classList.remove('bg-green-600', 'hover:bg-green-700');

        this.addLogEntry('🔄 Starting relay connection test...');

        try {
            const relayUrl = document.getElementById('relay-url').value.trim();

            if (!relayUrl) {
                this.showError('Please enter a relay server URL');
                return;
            }

            if (!this.isValidRelayUrl(relayUrl)) {
                this.showError('Invalid relay server URL format. Must end with "/gun"');
                return;
            }

            // Create temporary P2PSync instance for testing
            const tempSync = new P2PSync({
                networkDetection: true,
                enabled: false
            });

            // Set up temporary relay config
            tempSync.saveRelayConfig([relayUrl]);

            // Test connection with timeout
            const timeout = parseInt(document.getElementById('connection-timeout').value) * 1000 || 10000;

            const connectionTest = new Promise((resolve, reject) => {
                let connected = false;
                let peersFound = 0;

                const timeoutId = setTimeout(() => {
                    if (connected) {
                        resolve({ connected: true, peers: peersFound });
                    } else {
                        reject(new Error('Connection timeout'));
                    }
                }, timeout);

                tempSync.onStatusChange((status) => {
                    connected = status.isConnected;
                    peersFound = status.peerCount;

                    if (connected) {
                        clearTimeout(timeoutId);
                        resolve({ connected: true, peers: peersFound });
                    }
                });

                // Force connection attempt
                tempSync.connect();
            });

            const result = await connectionTest;

            // Disconnect temp instance
            tempSync.disconnect();

            if (result.connected) {
                this.updateP2PStatus('🟢 Connected', result.peers);
                this.addLogEntry(`✅ Connection successful to ${relayUrl}`);

                if (result.peers > 0) {
                    this.addLogEntry(`👥 Found ${result.peers} peer${result.peers > 1 ? 's' : ''} on relay`);
                } else {
                    this.addLogEntry('👤 No active peers found (this is normal for empty relay)');
                }

                // Show success message
                setTimeout(() => {
                    this.showSuccess(`Connection test successful!${result.peers > 0 ? ` Found ${result.peers} peers.` : ''}`);
                }, 500);
            }

        } catch (error) {
            console.error('Connection test failed:', error);
            this.updateP2PStatus('🔴 Disconnected', 0);
            this.addLogEntry('❌ Connection test failed: ' + error.message);
            this.showError('Connection test failed: ' + error.message);
        } finally {
            this.isTestingConnection = false;
            testBtn.textContent = originalText;
            testBtn.disabled = false;
            testBtn.classList.remove('bg-gray-600', 'hover:bg-gray-700');
            testBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        }
    }

    // ===== CONFIGURATION METHODS =====

    saveConfiguration() {
        const relayUrl = document.getElementById('relay-url').value.trim();

        if (!relayUrl) {
            this.showError('Please enter a relay server URL');
            return;
        }

        if (!this.isValidRelayUrl(relayUrl)) {
            this.showError('Invalid relay server URL format. Must end with "/gun"');
            return;
        }

        if (!this.sync) {
            this.showError('P2P sync not available');
            return;
        }

        try {
            const success = this.sync.saveRelayConfig([relayUrl]);

            if (success) {
                this.addLogEntry(`💾 Configuration saved: ${relayUrl}`);
                this.showSuccess(`Relay server configuration saved successfully: ${relayUrl}`);

                // Reload page after short delay to update CSP
                setTimeout(() => {
                    window.location.reload();
                }, 1500);

            } else {
                this.showError('Failed to save relay server configuration');
            }
        } catch (error) {
            console.error('Save config failed:', error);
            this.showError('Failed to save configuration: ' + error.message);
        }
    }

    loadCurrentConfig() {
        try {
            const savedConfig = localStorage.getItem('eecol-relay-servers');
            if (savedConfig) {
                const savedUrls = JSON.parse(savedConfig);
                if (Array.isArray(savedUrls) && savedUrls.length > 0) {
                    document.getElementById('relay-url').value = savedUrls[0];
                    this.addLogEntry(`📂 Loaded saved configuration: ${savedUrls[0]}`);
                } else {
                    this.addLogEntry('📂 No saved configuration found');
                }
            } else {
                this.addLogEntry('📂 No saved configuration found, using default');
            }
        } catch (error) {
            console.error('Load config failed:', error);
            this.addLogEntry('❌ Failed to load saved configuration');
        }
    }

    // ===== UI UPDATE METHODS =====

    updateStatus(status) {
        // Update connection status
        const isConnected = status.isConnected || false;
        const peers = status.peerCount || 0;
        this.updateP2PStatus(isConnected ? '🟢 Connected' : '🔴 Disconnected', peers);
    }

    updateP2PStatus(statusText, peers = 0) {
        const iconEl = document.getElementById('connection-status-icon');
        const textEl = document.getElementById('connection-status-text');
        const peersEl = document.getElementById('peers-count');

        if (iconEl) iconEl.textContent = statusText.includes('Connected') ? '🟢' : '🔴';
        if (textEl) textEl.textContent = statusText.replace('🟢 ', '').replace('🔴 ', '');
        if (peersEl) peersEl.textContent = peers;
    }

    toggleAdvancedOptions(show) {
        const advancedDiv = document.getElementById('advanced-options');
        if (advancedDiv) {
            if (show) {
                advancedDiv.classList.remove('hidden');
                this.addLogEntry('⚙️ Advanced options shown');
            } else {
                advancedDiv.classList.add('hidden');
                this.addLogEntry('⚙️ Advanced options hidden');
            }
        }
    }

    // ===== LOGGING METHODS =====

    addLogEntry(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;

        this.connectionLog.push(logEntry);

        // Keep only last 50 entries
        if (this.connectionLog.length > 50) {
            this.connectionLog = this.connectionLog.slice(-50);
        }

        this.updateLogDisplay();
    }

    updateLogDisplay() {
        const logEl = document.getElementById('connection-log');

        if (this.connectionLog.length === 0) {
            logEl.innerHTML = '<div class="text-sm text-gray-600 italic">No log entries yet...</div>';
            return;
        }

        logEl.innerHTML = this.connectionLog
            .map(entry => `<div class="text-sm font-mono text-gray-700 py-1">${entry}</div>`)
            .join('');
    }

    clearLog() {
        this.connectionLog = [];
        this.updateLogDisplay();
        this.addLogEntry('🗑️ Connection log cleared');
    }

    // ===== UTILITY METHODS =====

    isValidRelayUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname.endsWith('/gun');
        } catch (error) {
            return false;
        }
    }

    showSuccess(message) {
        this.showMessage('Success', message, 'bg-green-100 border-green-400 text-green-700');
    }

    showError(message) {
        this.showMessage('Error', message, 'bg-red-100 border-red-400 text-red-700');
    }

    showMessage(title, message, classes = 'bg-blue-100 border-blue-400 text-blue-700') {
        const modal = document.getElementById('customModal');
        const modalContent = document.getElementById('modalContent');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalButtons = document.getElementById('modalButtons');

        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.textContent = message;

        // Add close button
        if (modalButtons) {
            modalButtons.innerHTML = '<button id="modalCloseBtn" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Close</button>';
        }

        // Show modal with animation
        modal.classList.remove('hidden');

        // Trigger animation by adding visible classes after a small delay
        setTimeout(() => {
            if (modalContent) {
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
            }

            // Set up close button event listener
            const closeBtn = document.getElementById('modalCloseBtn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal());
            }
        }, 10);
    }

    closeModal() {
        const modal = document.getElementById('customModal');
        const modalContent = document.getElementById('modalContent');

        // Animate out
        if (modalContent) {
            modalContent.classList.remove('scale-100', 'opacity-100');
            modalContent.classList.add('scale-95', 'opacity-0');
        }

        // Hide after animation
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 200);
    }

    showUnavailableState() {
        this.updateP2PStatus('🔴 Unavailable', 0);
        this.addLogEntry('❌ P2P sync system unavailable - some features disabled');

        // Disable test button
        const testBtn = document.getElementById('test-connection');
        if (testBtn) {
            testBtn.disabled = true;
            testBtn.textContent = 'Unavailable';
            testBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
        }

        // Disable save button
        const saveBtn = document.getElementById('save-config');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
        }
    }
}

// Initialize the P2P Relay Config when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.p2pRelayConfig = new P2PRelayConfig();
    console.log('✅ EECOL P2P Relay Configuration v0.8.0.0 initialized');
});
