/**
 * NEW EECOL Wire Tools Suite - IndexedDB Storage Layer
 * Enterprise-grade IndexedDB implementation with singleton pattern for optimal resource management
 */

class EECOLIndexedDB {
  static instance = null;

  static getInstance(version = 4) {
    if (!EECOLIndexedDB.instance) {
      EECOLIndexedDB.instance = new EECOLIndexedDB(version);
    }
    return EECOLIndexedDB.instance;
  }

  constructor(version = 4) {
    // Prevent direct instantiation - enforce singleton pattern
    if (EECOLIndexedDB.instance) {
      throw new Error("Use EECOLIndexedDB.getInstance() instead of new EECOLIndexedDB()");
    }

    this.dbVersion = version;
    this.dbName = 'EECOLTools_v2';
    this.dbInitialized = this.initialize();
    this.db = null;

    this.stores = {
      cuttingRecords: {
        keyPath: 'id',
        indexes: ['timestamp', 'operator', 'wireType', 'orderNumber', 'customerName']
      },
      inventoryRecords: {
        keyPath: 'id',
        indexes: ['wireType', 'location', 'supplier', 'minStock', 'currentStock', 'lastUpdated']
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
      muticutPlanner: {
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
        indexes: ['machineName', 'timestamp']
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

  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('❌ IndexedDB initialization failed:', request.error);
        reject(request.error);
      };

      request.onblocked = () => {
        console.warn('⚠️ IndexedDB upgrade blocked by another connection');
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;

        // Close connection if another tab requests an upgrade
        this.db.onversionchange = () => {
          this.db.close();
          console.log('🔄 Database closed due to version change request from another tab');
          // Optionally notify user or reload
        };

        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this.createObjectStores(db);
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
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => resolve();
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
        store.put(item);
      }
    });
  }

  createObjectStores(db) {
    // Create all object stores
    for (const [storeName, config] of Object.entries(this.stores)) {
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, {
          keyPath: config.keyPath,
          autoIncrement: config.keyPath === 'id' && storeName !== 'settings' ? true : false
        });

        // Create indexes
        if (config.indexes) {
          for (const index of config.indexes) {
            store.createIndex(index, index, { unique: false });
          }
        }
      }
    }
  }

  /**
   * Generic CRUD Operations
   */

  async add(storeName, data) {
    await this.dbInitialized;
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.add(data);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        if (this.isUniqueConstraintViolation(request.error)) {
          console.warn(`⚠️ Duplicate key in ${storeName}, updating instead...`);
          // Try update instead of add
          this.update(storeName, data).then(resolve).catch(reject);
        } else {
          console.error(`❌ Failed to add to ${storeName}:`, request.error);
          reject(request.error);
        }
      };
    });
  }

  async get(storeName, key) {
    await this.dbInitialized;
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
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

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(data);

      request.onsuccess = () => {
        resolve(request.result);
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

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.error(`❌ Failed to delete from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  async clear(storeName) {
    await this.isReady();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

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
    const allItems = await this.getAll(storeName);
    return allItems.filter(predicate);
  }

  async count(storeName) {
    await this.isReady();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
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
      const result = await this.add('markConverter', {
        id: Date.now().toString(),
        tool: 'markConverter',
        timestamp: Date.now(),
        ...data
      });

      // Verify the save worked
      const verification = await this.get('markConverter', result);
      if (verification) {
        // Save verification successful
      } else {
        console.error('❌ Save verification failed for markConverter');
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to save mark converter data:', error);
      throw error;
    }
  }

  // Save stopmark converter data (stop mark calculator)
  async saveStopMarkConverter(data) {
    try {
      const result = await this.add('stopmarkConverter', {
        id: Date.now().toString(),
        tool: 'stopmarkConverter',
        timestamp: Date.now(),
        ...data
      });

      // Verify the save worked
      const verification = await this.get('stopmarkConverter', result);
      if (verification) {
        // Save verification successful
      } else {
        console.error('❌ Save verification failed for stopmarkConverter');
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to save stopmark converter data:', error);
      throw error;
    }
  }

  // Save reel capacity estimator data (reel capacity calculator)
  async saveReelCapacityEstimator(data) {
    try {
      const result = await this.add('reelcapacityEstimator', {
        id: Date.now().toString(),
        tool: 'reelcapacityEstimator',
        timestamp: Date.now(),
        ...data
      });

      // Verify the save worked
      const verification = await this.get('reelcapacityEstimator', result);
      if (verification) {
        // Save verification successful
      } else {
        console.error('❌ Save verification failed for reelcapacityEstimator');
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to save reel capacity estimator data:', error);
      throw error;
    }
  }

  // Save reel size estimator data (future reel size calculator)
  async saveReelSizeEstimator(data) {
    return await this.add('reelsizeEstimator', {
      id: Date.now().toString(),
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
    const allMeasurements = await this.getAll('calibrationMeasurements', 'machineName', IDBKeyRange.only(machineName));
    return allMeasurements
      .sort((a, b) => b.timestamp - a.timestamp) // Sort descending
      .slice(0, limit); // Take top N
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
            for (const record of records) {
              // Ensure record has required fields
              if (record.wireId && record.cutLength) {
                record.id = record.id || crypto.randomUUID();
                record.timestamp = record.timestamp || Date.now();
                record.createdAt = record.createdAt || record.timestamp;
                record.updatedAt = record.updatedAt || record.timestamp;

                await this.add('cuttingRecords', record);
                totalMigrated++;
              }
            }
            console.log(`✅ Migrated ${records.length} cutting records`);
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
            for (const item of items) {
              if (item.wireType) {
                item.id = item.id || crypto.randomUUID();
                item.timestamp = item.timestamp || Date.now();
                item.lastUpdated = item.lastUpdated || new Date().toISOString();

                await this.add('inventoryRecords', item);
                totalMigrated++;
              }
            }
            console.log(`✅ Migrated ${items.length} inventory items`);
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
            console.log('✅ Migrated maintenance checklist data');
          }
        } catch (error) {
          console.error('❌ Error migrating maintenance data:', error);
        }
      }

      // Clear migrated data from localStorage
      if (totalMigrated > 0) {
        localStorage.removeItem('cutRecords');
        localStorage.removeItem('inventoryItems');
        localStorage.removeItem('machineMaintenanceChecklist');
        console.log('🧹 Cleared migrated data from localStorage');
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

// Make promise available globally (needed for unit tests)
if (typeof window !== 'undefined') {
  window.eecolDBPromise = EECOLIndexedDB.prototype.dbInitialized;
}
