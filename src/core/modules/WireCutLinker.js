/**
 * EECOL Wire Tools Suite - WireCutLinker Module
 * ES6 Module following clean architecture to coordinate Standalone Wire Cut List and Cutting Records
 */

export class WireCutLinker {
    static instance = null;

    static getInstance() {
        if (!WireCutLinker.instance) {
            WireCutLinker.instance = new WireCutLinker();
        }
        return WireCutLinker.instance;
    }

    constructor() {
        this.heartbeatInterval = null;
        this.heartbeatKey = 'eecol_cutting_records_heartbeat';
        this.formStateKey = 'eecol_cutting_records_form_state';
        this.autofillKey = 'eecol_wire_list_autofill_id';
    }

    /**
     * Start sending a heartbeat from the Cutting Records page to signal it is active.
     */
    startHeartbeat() {
        this.stopHeartbeat();

        // Update heartbeat immediately
        localStorage.setItem(this.heartbeatKey, Date.now().toString());

        this.heartbeatInterval = setInterval(() => {
            localStorage.setItem(this.heartbeatKey, Date.now().toString());
        }, 1000);

        // Clean up on unload
        window.addEventListener('beforeunload', () => {
            this.stopHeartbeat();
            localStorage.removeItem(this.heartbeatKey);
            localStorage.removeItem(this.formStateKey);
        });
    }

    /**
     * Stop sending the heartbeat.
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Check if the Cutting Records tool is open and active in another tab.
     * @returns {boolean}
     */
    isCuttingRecordsActive() {
        const heartbeatStr = localStorage.getItem(this.heartbeatKey);
        if (!heartbeatStr) return false;
        const heartbeat = parseInt(heartbeatStr, 10);
        return (Date.now() - heartbeat) < 4000; // 4 seconds threshold
    }

    /**
     * Update the shared state of the Cutting Records form.
     * @param {Object} state - The current values in the form fields
     */
    updateFormState(state) {
        localStorage.setItem(this.formStateKey, JSON.stringify(state));
    }

    /**
     * Retrieve the shared form state.
     * @returns {Object}
     */
    getFormState() {
        const stateStr = localStorage.getItem(this.formStateKey);
        if (!stateStr) return { isDirty: false };
        try {
            return JSON.parse(stateStr);
        } catch (e) {
            console.error('Failed to parse form state', e);
            return { isDirty: false };
        }
    }

    /**
     * Clear the shared form state (e.g. when form is cleared).
     */
    clearFormState() {
        localStorage.removeItem(this.formStateKey);
    }

    /**
     * Requests an autofill of the specified item.
     * Determines if there's an active Cutting Records tab, and if there are conflicts.
     * @param {Object} item - The wire list item to autofill
     * @returns {Promise<{status: string, formState?: Object}>}
     */
    async requestAutofill(item) {
        if (!this.isCuttingRecordsActive()) {
            return { status: 'DISCONNECTED' };
        }

        const formState = this.getFormState();

        // If the form has any data, check if it's identical or needs confirmation
        if (formState.isDirty) {
            // Check if existing form values are already exactly matching the item
            const matches = formState.orderNumber === item.orderNumber &&
                            formState.customerName === item.customerName &&
                            formState.wireId === item.wireType &&
                            formState.cutLength === item.lengthZ;

            if (!matches) {
                return { status: 'CONFIRM_OVERWRITE', formState };
            }
        }

        return { status: 'SUCCESS' };
    }

    /**
     * Write the autofill item ID to localStorage to trigger the action in the Cutting Records tab.
     * @param {string} id - Item ID
     */
    async triggerAutofill(id) {
        localStorage.setItem(this.autofillKey, id);
    }

    /**
     * Register a callback to listen for autofill trigger requests on the Cutting Records tab.
     * @param {Function} callback - Function called with autofill item ID
     */
    listenForAutofill(callback) {
        window.addEventListener('storage', (e) => {
            if (e.key === this.autofillKey && e.newValue) {
                const id = e.newValue;
                localStorage.removeItem(this.autofillKey); // Clear immediately to prevent multiple triggers
                callback(id);
            }
        });
    }
}
