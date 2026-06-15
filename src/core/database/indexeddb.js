/**
 * NEW EECOL Wire Tools Suite - IndexedDB Storage Layer
 * Enterprise-grade IndexedDB implementation with singleton pattern for optimal resource management
 */

class EECOLIndexedDB {
  static instance = null;
  static DATABASE_VERSION = 10;

  static getInstance() {
    if (!EECOLIndexedDB.instance) {
      EECOLIndexedDB.instance = new EECOLIndexedDB();
    }
    return EECOLIndexedDB.instance;
  }

  constructor() {
    // Prevent direct instantiation - enforce singleton pattern
    if (EECOLIndexedDB.instance) {
      throw new Error("Use EECOLIndexedDB.getInstance() instead of new EECOLIndexedDB()");
    }

    this.dbVersion = EECOLIndexedDB.DATABASE_VERSION;
    this.dbName = 'EECOLTools_v2';
    this.dbInitialized = this.initialize();
    this.db = null;

    // Expose initialization promise globally
    if (typeof window !== 'undefined') {
      window.eecolDBPromise = this.dbInitialized;
    }

    this.stores = {
      cuttingRecords: {
        keyPath: 'id',
        indexes: ['timestamp', 'cutterName', 'wireId', 'orderNumber', 'customerName']
      },
      inventoryRecords: {
        keyPath: 'id',
        indexes: ['wireType', 'personName', 'productCode', 'lineCode', 'actualLength', 'updatedAt', 'timestamp']
      },
      users: {
        keyPath: 'id',
        indexes: ['role', 'active', 'lastLogin', 'createdAt']
      },
      notifications: {
        keyPath: 'id',
        indexes: ['type', 'priority', 'recipients', 'timestamp', 'read']
      },
      maintenanceLogs: {
        keyPath: 'id',
        indexes: ['equipment', 'technician', 'dueDate', 'completed', 'timestamp']
      },
      // Separate stores for each tool to maintain clean data separation
      markConverter: {
        keyPath: 'id',
        indexes: ['timestamp', 'tool']
      },
      stopmarkConverter: {
        keyPath: 'id',
        indexes: ['timestamp', 'tool']
      },
      reelcapacityEstimator: {
        keyPath: 'id',
        indexes: ['timestamp', 'tool']
      },
      reelsizeEstimator: {
        keyPath: 'id',
        indexes: ['timestamp', 'tool']
      },
      multicutPlanner: {
        keyPath: 'id',
        indexes: ['timestamp', 'payloadCableType', 'isComplete', 'totalPayloadLength']
      },
      settings: {
        keyPath: 'name',
        indexes: ['lastModified']
      },
      sessions: {
        keyPath: 'sessionId',
        indexes: ['userId', 'createdAt', 'expiresAt', 'active']
      },
      calibrationMeasurements: {
        keyPath: 'id',
        indexes: [
          { name: 'machine_timestamp', keyPath: ['machineName', 'timestamp'] }
        ]
      },
      wireCutList: {
        keyPath: 'id',
        indexes: ['timestamp', 'orderNumber', 'status', 'position']
      }
    };
  }

  // Getter for ready property used by existing tools
  get ready() {
    return this.isReady();
  }

  /**
   * IDB SENTINEL: Triggers cross-tab synchronization by updating a localStorage key.
   * Pages like Live Statistics and Reports listen for this 'storage' event to refresh their views.
   */
  _notifyChange() {
    try {
      if (typeof localStorage !== 'undefined') {
        /**
         * IDB SENTINEL: Using a combined timestamp and random value ensures the key
         * always changes, triggering the 'storage' event even for rapid writes.
         */
        localStorage.setItem('eecolDBChange', `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
      }
    } catch (e) {
      // localStorage might be unavailable in private browsing or due to quota
      console.warn('⚠️ Cross-tab synchronization signal failed:', e);
    }
  }

  /**
   * IDB SENTINEL: Returns the current storage usage and quota.
   */
  async getStorageStatus() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        return { usage: est.usage || 0, quota: est.quota || 0 };
      } catch (e) { console.warn('Storage estimate failed', e); }
    }
    return null;
  }

  async initialize() {
    // IDB SENTINEL: Request persistence to prevent browser eviction
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        const error = request.error;
        console.error('❌ IndexedDB initialization failed:', error);

        // Handle VersionError - specifically when requested version is less than existing
        if (error && error.name === 'VersionError') {
          console.warn('🔄 Database version mismatch detected. This usually happens if a stale service worker requests an old version.');
        }

        reject(error);
      };

      request.onblocked = () => {
        console.warn('⚠️ IndexedDB upgrade blocked by another connection');
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;

        // Close connection if another tab requests an upgrade
        this.db.onversionchange = () => {
          this.db.close();
          this.db = null; // Ensure instance state reflects closed connection
          console.log('🔄 Database closed due to version change request from another tab');
          // Optionally notify user or reload
        };

        /**
         * IDB SENTINEL: Global database error handler.
         * Catches and logs unhandled transaction errors that bubble up to the database object,
         * improving observability for debugging complex race conditions or storage issues.
         */
        this.db.onerror = (event) => {
          console.error('❌ IndexedDB Global Error:', event.target.error);
        };

        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const transaction = event.target.transaction;
        this.createObjectStores(db, transaction);
      };
    });
  }

  /**
   * Performs an atomic bulk put operation.
   * Efficiently handles multiple records in a single transaction.
   * @param {string} storeName - Target object store
   * @param {Array} items - Array of items to put
   * @param {boolean} clearFirst - Whether to clear the store before adding items
   */
  async bulkPut(storeName, items, clearFirst = false) {
    await this.isReady();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      // Use relaxed durability for better performance in local-only scenarios
      const transaction = this.db.transaction([storeName], 'readwrite', { durability: 'relaxed' });
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => {
        this._notifyChange();
        resolve();
      };
      transaction.onerror = () => {
        console.error(`❌ Bulk operation failed on ${storeName}:`, transaction.error);
        reject(transaction.error);
      };
      transaction.onabort = () => {
        console.warn(`⚠️ Bulk operation aborted on ${storeName}:`, transaction.error);
        reject(transaction.error);
      };

      if (clearFirst) {
        store.clear();
      }

      for (const item of items) {
        store.put(this._normalizeRecord(storeName, item));
      }
    });
  }

  /**
   * Performs an atomic bulk delete operation.
   * @param {string} storeName - Target object store
   * @param {Array} keys - Array of keys to delete
   */
  async bulkDelete(storeName, keys) {
    await this.isReady();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite', { durability: 'relaxed' });
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => {
        this._notifyChange();
        resolve();
      };
      transaction.onerror = () => {
        console.error(`❌ Bulk delete failed on ${storeName}:`, transaction.error);
        reject(transaction.error);
      };
      transaction.onabort = () => {
        console.warn(`⚠️ Bulk delete aborted on ${storeName}:`, transaction.error);
        reject(transaction.error);
      };

      for (const key of keys) {
        store.delete(key);
      }
    });
  }

  createObjectStores(db, transaction) {
    // Create or update all object stores
    for (const [storeName, config] of Object.entries(this.stores)) {
      let store;
      if (!db.objectStoreNames.contains(storeName)) {
        store = db.createObjectStore(storeName, {
          keyPath: config.keyPath,
          autoIncrement: config.keyPath === 'id' && storeName !== 'settings'
        });
      } else {
        store = transaction.objectStore(storeName);
      }

      // Idempotent index management
      if (config.indexes) {
        const indexConfigs = config.indexes.map(idx =>
          typeof idx === 'string' ? { name: idx, keyPath: idx, options: { unique: false } } : idx
        );
        const indexNames = indexConfigs.map(c => c.name);

        // Remove obsolete indexes
        const currentIndices = Array.from(store.indexNames);
        for (const indexName of currentIndices) {
          if (!indexNames.includes(indexName)) {
            console.log(`🗑️ Removing obsolete index ${indexName} from ${storeName}`);
            store.deleteIndex(indexName);
          }
        }

        // Add missing indexes
        for (const idx of indexConfigs) {
          if (!store.indexNames.contains(idx.name)) {
            console.log(`✨ Creating index ${idx.name} for ${storeName}`);
            store.createIndex(idx.name, idx.keyPath, idx.options || { unique: false });
          }
        }
      }
    }

    // IDB SENTINEL: Safe migration for muticutPlanner typo
    if (db.objectStoreNames.contains('muticutPlanner')) {
      const oldStore = transaction.objectStore('muticutPlanner');
      const newStore = transaction.objectStore('multicutPlanner');
      oldStore.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          newStore.put(cursor.value);
          cursor.continue();
        }
      };
    }
  }

  /**
   * Generic CRUD Operations
   */

  async add(storeName, data) {
    await this.dbInitialized;
    if (!this.db) throw new Error('Database not initialized');

    /**
     * IDB SENTINEL FIX: Avoid using add() for records that might already exist
     * if the intention is to update them. Attempting add() and then update() on error
     * is an anti-pattern because the first failed add() aborts the transaction.
     * We use a single put() operation (via update) to ensure atomicity and reliability.
     */
    try {
      return await this.update(storeName, data);
    } catch (error) {
      console.error(`❌ Failed to add/update in ${storeName}:`, error);
      throw error;
    }
  }

  async get(storeName, key) {
    await this.dbInitialized;
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);

      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error(`❌ Failed to get from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  async getAll(storeName, indexName, query) {
    await this.isReady();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = indexName ? transaction.objectStore(storeName).index(indexName) : transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);

      const request = store.getAll(query);

      request.onsuccess = () => {
        const results = request.result || [];
        resolve(results);
      };

      request.onerror = () => {
        console.error(`❌ Failed to getAll from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  async update(storeName, data) {
    await this.isReady();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readwrite', { durability: 'relaxed' });
    const store = transaction.objectStore(storeName);
    let result = null;

    return new Promise((resolve, reject) => {
      /**
       * IDB SENTINEL: Resolving on transaction completion ensures data is committed.
       * request.onsuccess only means the request is valid, not that it's durable.
       */
      transaction.oncomplete = () => {
        this._notifyChange();
        resolve(result);
      };
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);

      const request = store.put(this._normalizeRecord(storeName, data));

      request.onsuccess = () => {
        result = request.result;
      };

      request.onerror = () => {
        console.error(`❌ Failed to update ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  async delete(storeName, key) {
    await this.isReady();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readwrite', { durability: 'relaxed' });
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        this._notifyChange();
        resolve(true);
      };
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);

      const request = store.delete(key);

      request.onerror = () => {
        console.error(`❌ Failed to delete from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  async clear(storeName) {
    await this.isReady();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readwrite', { durability: 'relaxed' });
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        this._notifyChange();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);

      const request = store.clear();

      request.onerror = () => {
        console.error(`❌ Failed to clear ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Advanced Query Methods
   */

  async find(storeName, predicate) {
    await this.isReady();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const results = [];

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);

      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (predicate(cursor.value)) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async count(storeName) {
    await this.isReady();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);

      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`❌ Failed to count ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Tool-Specific Methods
   */

  // Save mark converter data (wire mark calculator)
  async saveMarkConverter(data) {
    try {
      return await this.add('markConverter', {
        id: crypto.randomUUID(),
        tool: 'markConverter',
        timestamp: Date.now(),
        ...data
      });
    } catch (error) {
      console.error('❌ Failed to save mark converter data:', error);
      throw error;
    }
  }

  // Save stopmark converter data (stop mark calculator)
  async saveStopMarkConverter(data) {
    try {
      return await this.add('stopmarkConverter', {
        id: crypto.randomUUID(),
        tool: 'stopmarkConverter',
        timestamp: Date.now(),
        ...data
      });
    } catch (error) {
      console.error('❌ Failed to save stopmark converter data:', error);
      throw error;
    }
  }

  // Save reel capacity estimator data (reel capacity calculator)
  async saveReelCapacityEstimator(data) {
    try {
      return await this.add('reelcapacityEstimator', {
        id: crypto.randomUUID(),
        tool: 'reelcapacityEstimator',
        timestamp: Date.now(),
        ...data
      });
    } catch (error) {
      console.error('❌ Failed to save reel capacity estimator data:', error);
      throw error;
    }
  }

  // Save reel size estimator data (future reel size calculator)
  async saveReelSizeEstimator(data) {
    return await this.add('reelsizeEstimator', {
      id: crypto.randomUUID(),
      tool: 'reelsizeEstimator',
      timestamp: Date.now(),
      ...data
    });
  }

  // Save calibration measurement
  async saveCalibrationMeasurement(machineName, measurement) {
    return await this.add('calibrationMeasurements', {
      id: crypto.randomUUID(),
      machineName,
      measurement,
      timestamp: Date.now()
    });
  }

  // Get recent calibration measurements for a specific machine
  async getRecentCalibrationMeasurements(machineName, limit = 3) {
    await this.isReady();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['calibrationMeasurements'], 'readonly');
    const store = transaction.objectStore('calibrationMeasurements');
    const index = store.index('machine_timestamp');

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);

      const results = [];
      // Use compound index machine_timestamp with range to fetch only records for machineName
      // Use 'prev' cursor to get them in descending order (newest first)
      const range = IDBKeyRange.bound([machineName, 0], [machineName, Infinity]);
      const request = index.openCursor(range, 'prev');

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => {
        console.error('❌ Failed to fetch recent calibration measurements:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Migration Methods
   */

  async migrateFromLocalStorage() {
    let totalMigrated = 0;

    try {
      console.log('🔄 Starting migration from localStorage...');

      // Migrate cutting records
      const cutRecordsData = localStorage.getItem('cutRecords');
      if (cutRecordsData) {
        try {
          const records = JSON.parse(cutRecordsData);
          if (Array.isArray(records) && records.length > 0) {
            console.log(`📦 Migrating ${records.length} cutting records...`);
            const validRecords = records.filter(r => r.wireId && r.cutLength).map(record => ({
              ...record,
              id: record.id || crypto.randomUUID(),
              timestamp: record.timestamp || Date.now(),
              createdAt: record.createdAt || record.timestamp || Date.now(),
              updatedAt: record.updatedAt || record.timestamp || Date.now()
            }));

            if (validRecords.length > 0) {
              await this.bulkPut('cuttingRecords', validRecords, false);
              totalMigrated += validRecords.length;
              localStorage.removeItem('cutRecords');
              console.log(`✅ Migrated ${validRecords.length} cutting records`);
            }
          }
        } catch (error) {
          console.error('❌ Error migrating cutting records:', error);
        }
      }

      // Migrate inventory items
      const inventoryData = localStorage.getItem('inventoryItems');
      if (inventoryData) {
        try {
          const items = JSON.parse(inventoryData);
          if (Array.isArray(items) && items.length > 0) {
            console.log(`📦 Migrating ${items.length} inventory items...`);
            const validItems = items.filter(i => i.wireType).map(item => ({
              ...item,
              id: item.id || crypto.randomUUID(),
              timestamp: item.timestamp || Date.now(),
              lastUpdated: item.lastUpdated || new Date().toISOString()
            }));

            if (validItems.length > 0) {
              await this.bulkPut('inventoryRecords', validItems, false);
              totalMigrated += validItems.length;
              localStorage.removeItem('inventoryItems');
              console.log(`✅ Migrated ${validItems.length} inventory items`);
            }
          }
        } catch (error) {
          console.error('❌ Error migrating inventory items:', error);
        }
      }

      // Migrate maintenance checklist data
      const maintenanceData = localStorage.getItem('machineMaintenanceChecklist');
      if (maintenanceData) {
        try {
          const data = JSON.parse(maintenanceData);
          if (data && data.completedAt) {
            console.log('📦 Migrating maintenance checklist data...');
            const today = new Date().toISOString().split('T')[0];
            await this.add('maintenanceLogs', {
              id: today,
              equipment: 'daily_check',
              technician: 'migrated',
              completed: true,
              completedAt: data.completedAt,
              timestamp: new Date(data.completedAt).getTime()
            });
            totalMigrated++;
            localStorage.removeItem('machineMaintenanceChecklist');
            console.log('✅ Migrated maintenance checklist data');
          }
        } catch (error) {
          console.error('❌ Error migrating maintenance data:', error);
        }
      }


      console.log(`✅ Migration completed: ${totalMigrated} items migrated`);
      return totalMigrated;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      return 0;
    }
  }

  /**
   * Utility Methods
   */

  static isIndexedDBSupported() {
    return typeof indexedDB !== 'undefined';
  }

  isUniqueConstraintViolation(error) {
    return error && error.name === 'ConstraintError';
  }

  /**
   * IDB SENTINEL: Normalizes record data types and casing for consistency.
   * Ensures timestamps are numbers and key identifiers are uppercase.
   * @param {string} storeName - Name of the object store
   * @param {Object} record - The record to normalize
   * @returns {Object} The normalized record
   */
  _normalizeRecord(storeName, record) {
    if (!record || typeof record !== 'object') return record;

    // Create a shallow copy to avoid mutating the original object
    const normalized = { ...record };

    // 1. Normalize timestamps to numbers
    const timeFields = [
      'timestamp', 'createdAt', 'updatedAt', 'cutInSystemTimestamp', 'reviewedTimestamp',
      'lastLogin', 'lastModified', 'expiresAt', 'completedAt'
    ];
    for (const field of timeFields) {
      if (normalized[field]) {
        let val = normalized[field];
        if (typeof val === 'string') {
          // If it's a numeric string, parse it as a number; otherwise use Date.parse
          val = /^\d+$/.test(val) ? parseInt(val, 10) : Date.parse(val);
        }
        if (!isNaN(val)) {
          normalized[field] = val;
        }
      }
    }

    // 2. Enforce uppercase for identification fields to improve search/filter reliability
    const upperFields = [
      'wireId', 'orderNumber', 'cutterName', 'customerName', 'personName',
      'productCode', 'lineCode', 'turnedToLineCode', 'coilCode',
      'machineName', 'payloadCableType', 'wireType', 'equipment', 'technician'
    ];
    for (const field of upperFields) {
      if (typeof normalized[field] === 'string') {
        normalized[field] = normalized[field].toUpperCase().trim();
      }
    }

    return normalized;
  }

  async isReady() {
    await this.dbInitialized;
    return !!this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.EECOLIndexedDB = EECOLIndexedDB;
}
