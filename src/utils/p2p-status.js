/**
 * P2P Status Indicator Utility
 * Lightweight utility for displaying P2P sync status across pages
 * EECOL Wire Tools Suite v0.8.0.0
 */

class P2PStatusIndicator {
  constructor(options = {}) {
    this.options = {
      position: 'top-right', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
      size: 'small', // 'small', 'medium', 'large'
      showPeerCount: true,
      showPulse: true,
      id: 'p2p-status-indicator',
      zIndex: 1000,
      ...options
    };

    this.initialized = false;
    this.statusMessages = {
      offline: 'Offline',
      disconnected: 'Disconnected',
      connected: 'Connected',
      'full': 'Full Sync'
    };

    this.emojis = {
      offline: '🔌',
      disconnected: '🔌',
      connected: '🌐',
      'full': '🔄'
    };
  }

  /**
   * Inject the P2P status indicator into the page
   */
  inject() {
    if (this.initialized) {
      console.warn('P2P Status Indicator already injected');
      return this;
    }

    this.injectCSS();
    this.createIndicator();
    this.setupEventListeners();
    this.initialized = true;

    // Initial status update
    this.updateStatus();

    console.log('✅ P2P Status Indicator injected');
    return this;
  }

  /**
   * Remove the indicator from the page
   */
  remove() {
    const indicator = document.getElementById(this.options.id);
    if (indicator) {
      indicator.remove();
    }

    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }

    this.initialized = false;
    console.log('🗑️ P2P Status Indicator removed');
  }

  /**
   * Update the indicator status
   */
  updateStatus() {
    if (!this.initialized) return;

    let status = 'offline';
    let peerCount = 0;
    let syncMode = 'offline';

    // Check if P2PSync/P2PSyncStatus is available and get status
    if (window.P2PSync && typeof window.P2PSync.getSyncStatus === 'function') {
      const syncStatus = window.P2PSync.getSyncStatus();
      status = syncStatus.isConnected ? (syncStatus.syncMode === 'full' ? 'full' : 'connected') : 'disconnected';
      peerCount = syncStatus.peerCount || 0;
      syncMode = syncStatus.syncMode;
    }

    this.renderStatus(status, peerCount, syncMode);
  }

  /**
   * Render the status to the DOM
   */
  renderStatus(status, peerCount, syncMode) {
    const container = document.getElementById(this.options.id);
    if (!container) return;

    const iconEl = container.querySelector('.status-icon');
    const textEl = container.querySelector('.status-text');
    const countEl = container.querySelector('.peer-count');

    if (iconEl) iconEl.textContent = this.emojis[status] || '🔌';
    if (textEl) textEl.textContent = this.statusMessages[status] || 'Unknown';
    if (countEl) {
      countEl.textContent = peerCount > 0 ? ` (${peerCount})` : '';
    }

    // Update CSS classes
    container.className = this.getContainerClasses(status);

    // Show/hide based on syncMode for online modes
    if (syncMode === 'offline') {
      container.style.display = 'none';
    } else if (this.options.showOnOffline !== true && status === 'offline') {
      container.style.display = 'none';
    } else {
      container.style.display = 'flex';
    }
  }

  /**
   * Get CSS classes for the container
   */
  getContainerClasses(status) {
    const baseClasses = ['p2p-status-indicator'];
    const positionClass = `position-${this.options.position}`;
    const sizeClass = `size-${this.options.size}`;

    baseClasses.push(positionClass, sizeClass);

    switch (status) {
      case 'offline':
        baseClasses.push('status-offline');
        break;
      case 'disconnected':
        baseClasses.push('status-disconnected');
        break;
      case 'connected':
        baseClasses.push('status-connected');
        break;
      case 'full':
        baseClasses.push('status-full-sync');
        break;
    }

    return baseClasses.join(' ');
  }

  /**
   * Inject the required CSS
   */
  injectCSS() {
    if (document.getElementById('p2p-status-indicator-styles')) return;

    const css = `
/* P2P Status Indicator */
.p2p-status-indicator {
  position: fixed;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 2px solid #0058B3;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: ${this.options.zIndex};
  transition: all 0.3s ease;
}

/* Positioning */
.p2p-status-indicator.position-top-left {
  top: 1rem;
  left: 1rem;
}
.p2p-status-indicator.position-top-right {
  top: 1rem;
  right: 1rem;
}
.p2p-status-indicator.position-bottom-left {
  bottom: 1rem;
  left: 1rem;
}
.p2p-status-indicator.position-bottom-right {
  bottom: 1rem;
  right: 1rem;
}

/* Size variants */
.p2p-status-indicator.size-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
.p2p-status-indicator.size-medium {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}
.p2p-status-indicator.size-large {
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

/* Status Styles */
.p2p-status-indicator.status-offline,
.p2p-status-indicator.status-disconnected {
  background: #f9f9f9;
  border-color: #666;
  color: #666;
}
.p2p-status-indicator.status-connected {
  background: #e8f5e8;
  border-color: #22c55e;
  color: #16a34a;
}
.p2p-status-indicator.status-full-sync {
  background: #fff0e8;
  border-color: #f97316;
  color: #ea580c;
  animation: pulse 2s infinite;
}

.p2p-status-indicator .status-icon {
  display: inline-block;
}

.p2p-status-indicator .status-text {
  font-size: inherit;
}

.p2p-status-indicator .peer-count {
  opacity: 0.8;
}

/* Pulse animation for full sync */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Responsive */
@media (max-width: 640px) {
  .p2p-status-indicator {
    font-size: 0.6875rem;
    padding: 0.25rem 0.375rem;
  }
}
`;

    const style = document.createElement('style');
    style.id = 'p2p-status-indicator-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Create the indicator HTML
   */
  createIndicator() {
    const container = document.createElement('div');
    container.id = this.options.id;
    container.className = this.getContainerClasses('offline');

    container.innerHTML = `
      <span class="status-icon">🔌</span>
      <span class="status-text">Loading...</span>
      <span class="peer-count"></span>
    `;

    document.body.appendChild(container);
  }

  /**
   * Set up event listeners for status updates
   */
  setupEventListeners() {
    // Check for P2P status changes every few seconds if no event system
    this.statusCheckInterval = setInterval(() => {
      this.updateStatus();
    }, 3000);

    // Listen for P2PSync status change events if available
    if (window.P2PSync && typeof window.P2PSync.onStatusChange === 'function') {
      window.P2PSync.onStatusChange((status) => {
        this.updateStatus();
      });
    }

    // Listen for P2PSyncStatus changes if available
    if (window.P2PSyncStatus && window.P2PSyncStatus.onStatusChange) {
      window.P2PSyncStatus.onStatusChange((status) => {
        this.updateStatus();
      });
    }
  }
}

// Export as global utility
window.P2PStatusIndicator = P2PStatusIndicator;

/**
 * Convenience function to create and inject a status indicator
 */
window.createP2PStatusIndicator = function(options) {
  const indicator = new P2PStatusIndicator(options);
  return indicator.inject();
};

console.log('🔄 P2P Status Indicator utility loaded');
