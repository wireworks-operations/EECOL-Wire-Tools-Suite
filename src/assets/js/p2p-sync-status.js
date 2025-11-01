/**
 * EECOL P2P Sync Status - Simple P2PSync Integration
 * EECOL Wire Tools Suite v0.8.0.0
 */

class P2PSyncStatus {
    constructor() {
        this.sync = null;
        this.startTime = Date.now();
        this.initialize();
    }

    async initialize() {
        console.log('🔄 P2P Sync Status initializing...');

        // Wait a moment for P2PSync to be available
        await this.waitForP2PSync();

        if (window.P2PSync) {
            // Load saved sync mode or default to 'full'
            const savedMode = this.loadSyncMode();

            this.sync = new P2PSync({
                networkDetection: true,
                enabled: false, // Default to disabled, let user enable
                initialMode: savedMode // Pass initial mode
            });

            // Set sync mode from saved value
            this.setSyncMode(savedMode);

            // Listen for sync status updates
            this.sync.onStatusChange((status) => {
                this.updateStatusDisplay(status);
                // Update global variable when status changes
                window.currentSyncMode = status.syncMode;
            });

            // Set initial state
            const initialStatus = this.sync.getSyncStatus();
            this.updateStatusDisplay(initialStatus);
            window.currentSyncMode = initialStatus.syncMode;

            this.setupEventListeners();
            this.startRealTimeUpdates();

            console.log('✅ P2P Sync Status initialized successfully');
        } else {
            console.warn('❌ P2PSync not available');
            this.showOfflineStatus();
        }
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
        // Toggle sync button
        const toggleBtn = document.getElementById('btn-toggle-sync');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleSync());
        }

        // Sync mode radio buttons
        const radioButtons = document.querySelectorAll('input[name="sync-mode"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => this.changeSyncMode(e.target.value));
        });

        // Relay server save button
        const saveRelayBtn = document.getElementById('btn-save-relay');
        if (saveRelayBtn) {
            saveRelayBtn.addEventListener('click', () => this.saveRelayConfig());
        }

        // Config manager button
        const configBtn = document.getElementById('btn-config-manager');
        if (configBtn) {
            configBtn.addEventListener('click', () => this.showSimpleMessage('Configuration Manager', 'Manage sync settings and configurations.'));
        }

        // Close modal on button click
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => this.closeModal());
        }
    }

    startRealTimeUpdates() {
        setInterval(() => this.updateUptimeDisplay(), 10000); // Update every 10 seconds
    }

    // ===== SYNC CONTROL METHODS =====

    toggleSync() {
        if (!this.sync) return;

        const isEnabled = this.sync.isSyncEnabled();
        if (isEnabled) {
            this.sync.disableSync();
            this.showSimpleMessage('P2P Sync Disabled', 'Peer-to-peer synchronization has been disabled.');
        } else {
            this.sync.enableSync();
            this.showSimpleMessage('P2P Sync Enabled', 'Peer-to-peer synchronization has been enabled.');
        }
        this.updateButtonText();
    }

    changeSyncMode(mode) {
        if (!this.sync) return;

        switch(mode) {
            case 'offline':
                this.sync.setOfflineMode();
                break;
            case 'connected':
                this.sync.setConnectedNoSyncMode();
                break;
            case 'full':
                this.sync.setFullSyncMode();
                break;
        }

        // Save the selected mode to localStorage
        this.saveSyncMode(mode);

        // Update global variable
        window.currentSyncMode = mode;
    }

    saveRelayConfig() {
        if (!this.sync) return;

        const textarea = document.getElementById('relay-servers');
        if (!textarea) return;

        const servers = textarea.value.trim().split('\n').map(url => url.trim()).filter(url => url);
        if (servers.length === 0) {
            this.showSimpleMessage('Error', 'Please enter at least one relay server URL.');
            return;
        }

        if (this.sync.saveRelayConfig(servers)) {
            this.showSimpleMessage('Success', 'Relay server configuration saved successfully.');
        } else {
            this.showSimpleMessage('Error', 'Failed to save relay server configuration.');
        }
    }

    // ===== UI UPDATE METHODS =====

    updateStatusDisplay(status) {
        // Update peer count
        const peerEl = document.getElementById('active-peers');
        if (peerEl) peerEl.textContent = status.peerCount || 0;

        // Update sync mode status
        const modeEl = document.getElementById('sync-mode-status');
        if (modeEl) {
            let modeText = 'Offline';
            if (status.isEnabled) {
                modeText = status.syncMode.charAt(0).toUpperCase() + status.syncMode.slice(1);
            }
            modeEl.textContent = modeText;
        }

        // Update P2P status indicator
        this.updateP2PStatus(status);

        // Update peers list
        this.updatePeersList();

        // Update button text
        this.updateButtonText();
    }

    updateP2PStatus(status) {
        const indicator = document.getElementById('p2p-sync-status');
        if (!indicator) return;

        let icon = '🔌', text = 'Offline', className = 'p2p-sync-status disconnected';

        // Determine status based on sync mode and connection state
        if (status.syncMode === 'offline') {
            // Offline mode - always shows offline
            icon = '🔌';
            text = 'Offline';
            className = 'p2p-sync-status disconnected';
        } else if (!status.isConnected) {
            // Not connected but in connected/full mode - shows disconnected
            icon = '🔌';
            text = 'Disconnected';
            className = 'p2p-sync-status disconnected';
        } else if (status.syncMode === 'connected') {
            // Connected mode - connected but not syncing data
            icon = '🌐';
            text = 'Connected';
            className = 'p2p-sync-status connected';
        } else if (status.syncMode === 'full') {
            // Full sync mode - actively syncing data
            icon = '🔄';
            text = 'Full Sync';
            className = 'p2p-sync-status syncing';
        }

        indicator.className = className;

        const iconEl = indicator.querySelector('.sync-icon');
        const textEl = indicator.querySelector('.sync-text');
        if (iconEl) iconEl.textContent = icon;
        if (textEl) textEl.textContent = text;
    }

    updatePeersList() {
        const peersEl = document.getElementById('peers-list');
        if (!peersEl) return;

        if (!this.sync) {
            peersEl.innerHTML = '<div class="text-center text-gray-500 text-sm">P2P not available</div>';
            return;
        }

        const peers = this.sync.connectedPeers?.size || 0;
        if (peers === 0) {
            peersEl.innerHTML = '<div class="text-center text-gray-500 text-sm">No peers connected yet</div>';
        } else {
            peersEl.innerHTML = `<div class="text-center text-sm">${peers} peer${peers > 1 ? 's' : ''} connected</div>`;
        }
    }

    updateButtonText() {
        const btn = document.getElementById('btn-toggle-sync');
        if (!btn || !this.sync) return;

        const isEnabled = this.sync.isSyncEnabled();
        btn.textContent = isEnabled ? 'Disable P2P Sync' : 'Enable Full P2P Sync';
        btn.className = `w-full px-4 py-2 rounded-xl shadow-lg hover:scale-[1.02] transition duration-200 ${
            isEnabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`;
    }

    updateUptimeDisplay() {
        const uptimeEl = document.getElementById('uptime-display');
        if (!uptimeEl) return;

        const uptimeMs = Date.now() - this.startTime;
        const minutes = Math.floor(uptimeMs / 60000);
        uptimeEl.textContent = `${minutes}m`;
    }

    // ===== SYNC MODE PERSISTENCE METHODS =====

    loadSyncMode() {
        try {
            const saved = localStorage.getItem('eecol-sync-mode');
            return saved || 'full'; // Default to 'full' if not saved
        } catch (error) {
            console.warn('Failed to load sync mode:', error);
            return 'full';
        }
    }

    saveSyncMode(mode) {
        try {
            localStorage.setItem('eecol-sync-mode', mode);
            console.log('✅ Sync mode saved:', mode);
        } catch (error) {
            console.error('❌ Failed to save sync mode:', error);
        }
    }

    setSyncMode(mode) {
        // Update radio button checked state
        const radios = document.querySelectorAll('input[name="sync-mode"]');
        radios.forEach(radio => {
            radio.checked = radio.value === mode;
        });

        // Apply the mode to sync object (setXxxMode methods will trigger status updates)
        switch(mode) {
            case 'offline':
                this.sync.setOfflineMode();
                break;
            case 'connected':
                this.sync.setConnectedNoSyncMode();
                break;
            case 'full':
                this.sync.setFullSyncMode();
                break;
        }
    }

    // ===== MODAL METHODS =====

    showSimpleMessage(title, message) {
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.textContent = message;

        modal.classList.remove('hidden');
    }

    closeModal() {
        const modal = document.getElementById('customModal');
        modal.classList.add('hidden');
    }

    // ===== UTILITY METHODS =====

    showOfflineStatus() {
        // Update status indicator directly since no sync status object available
        const indicator = document.getElementById('p2p-sync-status');
        if (indicator) {
            const iconEl = indicator.querySelector('.sync-icon');
            const textEl = indicator.querySelector('.sync-text');
            if (iconEl) iconEl.textContent = '🔌';
            if (textEl) textEl.textContent = 'Offline';
            indicator.className = 'p2p-sync-status disconnected';
        }

        const peerEl = document.getElementById('active-peers');
        const modeEl = document.getElementById('sync-mode-status');
        const peersEl = document.getElementById('peers-list');

        if (peerEl) peerEl.textContent = 'N/A';
        if (modeEl) modeEl.textContent = 'Offline';
        if (peersEl) peersEl.innerHTML = '<div class="text-center text-gray-500 text-sm">P2P sync unavailable</div>';
    }
}

// Initialize the P2P Sync Status when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.p2pSyncStatus = new P2PSyncStatus();
    console.log('✅ EECOL P2P Sync Status v0.8.0.0 initialized');
});
