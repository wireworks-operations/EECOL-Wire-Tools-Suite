/**
 * Wire Cut Linker - Cross-Tab Real-time Communication Utility
 * Facilitates bidirectional heartbeats, AutoFill payloads, and Active Order detection
 * between Cutting Records and Standalone Wire Cut List.
 */

export class WireCutLinker {
    constructor() {
        this.channelName = 'eecol_wire_cut_linker';
        this.listeners = [];
        this.lastHeartbeatTime = 0;
        this.heartbeatInterval = null;

        if (typeof BroadcastChannel !== 'undefined') {
            try {
                this.bc = new BroadcastChannel(this.channelName);
                this.bc.onmessage = (event) => this._handleMessage(event.data);
            } catch (e) {
                console.warn('BroadcastChannel failed, using localStorage fallback:', e);
                this.bc = null;
            }
        }

        // Fallback or supplementary storage listener
        window.addEventListener('storage', (e) => {
            if (e.key === 'eecol_linker_msg' && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    this._handleMessage(data);
                } catch (err) {
                    console.error('Error parsing fallback storage message:', err);
                }
            }
        });
    }

    _handleMessage(data) {
        if (!data || !data.type) return;

        if (data.type === 'heartbeat' && data.sender === 'cutting_records') {
            this.lastHeartbeatTime = Date.now();
        }

        this.listeners.forEach(fn => {
            try {
                fn(data);
            } catch (err) {
                console.error('Error in WireCutLinker listener:', err);
            }
        });
    }

    onMessage(callback) {
        this.listeners.push(callback);
    }

    send(data) {
        data.timestamp = Date.now();
        if (this.bc) {
            try {
                this.bc.postMessage(data);
            } catch (e) {
                console.warn('postMessage failed:', e);
            }
        }
        // Fallback to localStorage trigger
        try {
            localStorage.setItem('eecol_linker_msg', JSON.stringify(data));
            localStorage.removeItem('eecol_linker_msg');
        } catch (e) {
            // Ignore storage quota errors
        }
    }

    startHeartbeatBroadcast() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.send({ type: 'heartbeat', sender: 'cutting_records' });
        this.heartbeatInterval = setInterval(() => {
            this.send({ type: 'heartbeat', sender: 'cutting_records' });
        }, 3000);
    }

    stopHeartbeatBroadcast() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    isConnected() {
        return (Date.now() - this.lastHeartbeatTime) < 7000;
    }
}

window.WireCutLinker = WireCutLinker;

export default WireCutLinker;
