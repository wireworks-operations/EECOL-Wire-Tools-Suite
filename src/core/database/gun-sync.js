/**
 * NEW EECOL Wire Tools Suite - P2P Sync Layer
 * Real-time peer-to-peer synchronization for shop networks
 */

class P2PSync {
  constructor(config = {}) {
    this.config = {
      networkDetection: true,
      vpnOnly: true,
      iceServers: config.iceServers || [],
      enabled: true, // New: sync enabled by default
      ...config
    };
    this.gun = null;
    this.peers = [];
    this.isConnected = false;
    this.peerCount = 0;
    this.connectedPeers = new Set();
    this.syncEnabled = this.config.enabled;
    this.syncMode = config.initialMode || 'offline'; // 'offline', 'connected', 'full'
    this.relayServers = this.loadRelayConfig(); // Load configurable relay servers

    this.initialize();
  }

  async initialize() {
    try {
      // Load Gun.js dynamically (since no npm)
      await this.loadGunJS();

      if (this.syncMode !== 'offline' && this.isNetworkSuitable()) {
        this.connect();
      }


    } catch (error) {
      console.error('❌ P2P Sync initialization failed:', error);
      // Fall back gracefully - app still works offline
    }
  }

  async loadGunJS() {
    return new Promise((resolve, reject) => {
      // Check if Gun.js is already loaded
      if (typeof Gun !== 'undefined') {
        resolve();
        return;
      }

      // Load Gun.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/gun@0.2020.1240/gun.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  isNetworkSuitable() {
    // For PWA simplicity, we'll allow P2P on all networks
    // In production, you'd detect VPN/shop networks here
    return this.config.networkDetection ? true : false;
  }

  loadRelayConfig() {
    try {
      const savedConfig = localStorage.getItem('eecol-relay-servers');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    } catch (error) {
      console.warn('Failed to load relay config:', error);
    }
    // Default fallback
    return [];
  }

  saveRelayConfig(servers) {
    try {
      this.relayServers = servers;
      localStorage.setItem('eecol-relay-servers', JSON.stringify(servers));
      // Reconnect with new configuration
      this.reconnect();
      return true;
    } catch (error) {
      console.error('❌ Failed to save relay config:', error);
      return false;
    }
  }

  reconnect() {
    this.disconnect();
    if (this.isNetworkSuitable()) {
      this.connect();
    }
  }

  connect() {
    if (typeof Gun === 'undefined') {
      console.warn('Gun.js not available');
      return;
    }

    // Use configurable relay servers for P2P signaling
    const relayPeers = this.relayServers;

    // Initialize Gun with relay peers for P2P discovery
    this.gun = Gun({
      peers: relayPeers.concat(this.peers), // Combine relay with any existing peers
      localStorage: false, // Use IndexedDB only
      radisk: true,       // Indexable storage
      axe: true          // Peer cleanup
    });

    // Listen for peer discovery (enhanced tracking)
    this.gun.on('hi', (peer) => {
      const peerId = peer.id || peer.wsp || peer.wire || JSON.stringify(peer);
      if (!this.connectedPeers.has(peerId)) {
        this.connectedPeers.add(peerId);
        this.peerCount = this.connectedPeers.size;
        this.isConnected = this.peerCount > 0;
        this.triggerStatusUpdate();
      }
    });

    this.gun.on('bye', (peer) => {
      const peerId = peer.id || peer.wsp || peer.wire || JSON.stringify(peer);
      if (this.connectedPeers.has(peerId)) {
        this.connectedPeers.delete(peerId);
        this.peerCount = this.connectedPeers.size;
        this.isConnected = this.peerCount > 0;
        this.triggerStatusUpdate();
      }
    });
  }

  sync(storeName, data) {
    // Only sync cutting records as requested
    if (storeName !== 'cuttingRecords') {
      return false;
    }

    if (this.syncMode === 'offline') {
      return false;
    }

    if (this.syncMode === 'connected') {
      return false;
    }

    if (!this.syncEnabled || this.syncMode !== 'full') {
      return false;
    }

    if (!this.gun || !this.isConnected) {
      return false;
    }

    try {
      // Sync data across peers - Gun.js requires individual objects, not arrays
      if (Array.isArray(data)) {
        // For arrays of records, store each record as an individual node
        const nodeKey = 'eecol-' + storeName;
        data.forEach(record => {
          if (record && record.id) {
            this.gun.get(nodeKey).get(record.id).put(record);
          }
        });
      } else {
        // For single objects, store directly
        this.gun.get('eecol-' + storeName).put(data);
      }
      return true;
    } catch (error) {
      console.error('❌ P2P sync failed:', error);
      return false;
    }
  }

  // Enable/disable sync functionality
  enableSync() {
    this.syncEnabled = true;
    this.triggerStatusUpdate();
  }

  // Pull data from peers - actively request existing data
  pullDataFromPeers(storeName, callback, timeout = 5000) {
    if (storeName !== 'cuttingRecords') {
      return false;
    }

    if (!this.syncEnabled || this.syncMode !== 'full') {
      return false;
    }

    if (!this.gun || !this.isConnected) {
      return false;
    }

    return new Promise((resolve) => {
      let dataCollected = [];
      let hasCallback = false;
      const pullTimeout = setTimeout(() => {
        if (!hasCallback) {
          hasCallback = true;
          resolve(dataCollected);
        }
      }, timeout);

      try {
        // Get all peers' data using once() to retrieve existing data
        const storeRef = this.gun.get('eecol-' + storeName);

        // Listen for any incoming data
        storeRef.on((nodeData) => {
          if (nodeData && typeof nodeData === 'object') {
            // Collect any data that comes in
            if (Array.isArray(nodeData)) {
              dataCollected = dataCollected.concat(nodeData);
            } else {
              // Handle object structure (Gun internal keys have '_')
              for (const [key, value] of Object.entries(nodeData)) {
                if (key === '_') continue; // Skip Gun metadata
                if (value && typeof value === 'object') {
                  const record = value;
                  // Ensure record has an ID (key might be the ID)
                  if (record.timestamp && key && !record.id) {
                    record.id = key;
                  }
                  // Only add valid records
                  if (record.timestamp) {
                    dataCollected.push(record);
                  }
                }
              }
            }

            // Remove duplicates based on ID
            dataCollected = dataCollected.filter((record, index, self) =>
              self.findIndex(r => r.id === record.id) === index
            );
          }
        });

        // Also try to get current state
        storeRef.once((currentData) => {
          if (currentData && typeof currentData === 'object') {
            // Process the current data
            let additionalRecords = [];
            if (Array.isArray(currentData)) {
              additionalRecords = currentData;
            } else {
              // Process object structure
              for (const [key, value] of Object.entries(currentData)) {
                if (key === '_') continue; // Skip Gun metadata
                if (value && typeof value === 'object') {
                  const record = { ...value };
                  // Ensure record has an ID
                  if (record.timestamp && key && !record.id) {
                    record.id = key;
                  }
                  // Only add valid records
                  if (record.timestamp) {
                    additionalRecords.push(record);
                  }
                }
              }
            }

            // Merge with any previously collected data
            dataCollected = additionalRecords.concat(dataCollected);

            // Remove duplicates
            dataCollected = dataCollected.filter((record, index, self) =>
              self.findIndex(r => r.id === record.id) === index
            );

            // Call callback if provided with what we have so far
            if (callback) {
              callback(dataCollected);
              hasCallback = true;
              clearTimeout(pullTimeout);
            }
          }
        });

        // After timeout, resolve with whatever data was collected
        setTimeout(() => {
          if (!hasCallback) {
            hasCallback = true;
            clearTimeout(pullTimeout);
            resolve(dataCollected);
          }
        }, 2000); // Shorter collection period

      } catch (error) {
        console.error('❌ Error during P2P pull:', error);
        clearTimeout(pullTimeout);
        if (!hasCallback) {
          hasCallback = true;
          resolve(dataCollected);
        }
      }
    });
  }

  disableSync() {
    this.syncEnabled = false;
    this.triggerStatusUpdate();
  }

  isSyncEnabled() {
    return this.syncEnabled;
  }

  // Sync mode methods
  setOfflineMode() {
    this.syncMode = 'offline';
    this.disconnect();
    this.triggerStatusUpdate();
  }

  setConnectedNoSyncMode() {
    this.syncMode = 'connected';
    if (!this.isConnected) {
      this.connect();
    }
    this.triggerStatusUpdate();
  }

  setFullSyncMode() {
    this.syncMode = 'full';
    if (!this.isConnected) {
      this.connect();
    }
    this.triggerStatusUpdate();
  }

  getSyncMode() {
    return this.syncMode;
  }

  onSync(storeName, callback) {
    if (!this.gun) return;

    this.gun.get('eecol-' + storeName).on(callback);
  }

  disconnect() {
    if (this.gun) {
      this.gun.off();
      this.gun = null; // Clear the instance to prevent reconnection
    }
    this.isConnected = false;
    this.peerCount = 0;
    this.connectedPeers.clear();
    this.triggerStatusUpdate();
  }

  // Status methods for UI
  getSyncStatus() {
    return {
      isConnected: this.isConnected,
      peerCount: this.peerCount,
      isSyncing: this.peerCount > 0 && this.syncMode === 'full',
      isEnabled: this.syncEnabled,
      syncMode: this.syncMode
    };
  }

  // Callback system for status updates
  onStatusChange(callback) {
    this.statusCallbacks = this.statusCallbacks || [];
    this.statusCallbacks.push(callback);
  }

  triggerStatusUpdate() {
    if (this.statusCallbacks) {
      const status = this.getSyncStatus();
      this.statusCallbacks.forEach(callback => callback(status));
    }
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.P2PSync = P2PSync;
}
