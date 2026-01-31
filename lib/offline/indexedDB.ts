/**
 * IndexedDB Utility Wrapper for DropDrive
 * 
 * This utility provides a clean interface to interact with IndexedDB
 * for storing offline data like file metadata, pending uploads, and queued operations.
 * 
 * Database Structure:
 * - pendingOperations: Stores CRUD operations that failed due to offline status
 * - cachedFiles: Stores file metadata for offline browsing
 * - pendingUploads: Stores file data waiting to be uploaded
 */

const DB_NAME = 'DropDriveOfflineDB';
const DB_VERSION = 1;

// Object Store Names
export const STORES = {
  PENDING_OPERATIONS: 'pendingOperations',
  CACHED_FILES: 'cachedFiles',
  PENDING_UPLOADS: 'pendingUploads',
} as const;

export interface PendingOperation {
  id: string;
  type: 'upload' | 'delete' | 'rename' | 'move' | 'create-folder' | 'star' | 'share';
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

export interface CachedFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadTime: string;
  lastModified: string;
  starred: boolean;
  isFolder: boolean;
  folderId: string | null;
  cachedAt: number;
}

export interface PendingUpload {
  id: string;
  file: File;
  folderId: string | null;
  metadata: {
    fileName: string;
    fileSize: number;
    fileType: string;
  };
  timestamp: number;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize IndexedDB connection
   * Creates object stores if they don't exist
   */
  async init(): Promise<IDBDatabase> {
    // Return existing connection if already initialized
    if (this.db) return this.db;
    
    // Return ongoing initialization if in progress
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve(request.result);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create pendingOperations store
        if (!db.objectStoreNames.contains(STORES.PENDING_OPERATIONS)) {
          const operationsStore = db.createObjectStore(STORES.PENDING_OPERATIONS, {
            keyPath: 'id',
            autoIncrement: false,
          });
          operationsStore.createIndex('timestamp', 'timestamp', { unique: false });
          operationsStore.createIndex('status', 'status', { unique: false });
          operationsStore.createIndex('type', 'type', { unique: false });
          console.log('Created pendingOperations store');
        }

        // Create cachedFiles store
        if (!db.objectStoreNames.contains(STORES.CACHED_FILES)) {
          const filesStore = db.createObjectStore(STORES.CACHED_FILES, {
            keyPath: 'id',
            autoIncrement: false,
          });
          filesStore.createIndex('cachedAt', 'cachedAt', { unique: false });
          filesStore.createIndex('folderId', 'folderId', { unique: false });
          console.log('Created cachedFiles store');
        }

        // Create pendingUploads store
        if (!db.objectStoreNames.contains(STORES.PENDING_UPLOADS)) {
          const uploadsStore = db.createObjectStore(STORES.PENDING_UPLOADS, {
            keyPath: 'id',
            autoIncrement: false,
          });
          uploadsStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Created pendingUploads store');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Add a single item to a store
   */
  async add<T>(storeName: string, item: T): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => {
        console.log(`✅ Added item to ${storeName}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`❌ Failed to add item to ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a single item by ID
   */
  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result as T);
      };

      request.onerror = () => {
        console.error(`❌ Failed to get item from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all items from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = () => {
        console.error(`❌ Failed to get all items from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update an existing item
   */
  async update<T>(storeName: string, item: T): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        console.log(`✅ Updated item in ${storeName}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`❌ Failed to update item in ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete an item by ID
   */
  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`✅ Deleted item from ${storeName}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`❌ Failed to delete item from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete all items from a store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`✅ Cleared all items from ${storeName}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`❌ Failed to clear ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Count items in a store
   */
  async count(storeName: string): Promise<number> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`❌ Failed to count items in ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Query items by index
   */
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: any
  ): Promise<T[]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = () => {
        console.error(`❌ Failed to query ${storeName} by ${indexName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log('IndexedDB connection closed');
    }
  }
}

// Export singleton instance
export const indexedDB = new IndexedDBManager();
