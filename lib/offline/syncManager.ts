/**
 * Offline Sync Manager for DropDrive
 * 
 * This manager handles:
 * - Online/offline detection
 * - Syncing pending operations when online
 * - Automatic retry logic
 * - Background sync coordination
 * 
 * Flow:
 * 1. User performs action while offline → saved to IndexedDB
 * 2. App detects online status → triggers sync
 * 3. Sync manager processes pending operations
 * 4. On success → delete from IndexedDB
 * 5. On failure → increment retry counter
 */

import { indexedDB, STORES, PendingOperation, PendingUpload } from './indexedDB';
import { showToast } from '../toast/toastHelper';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  current: string;
}

class SyncManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInProgress: boolean = false;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private syncListeners: Set<(status: SyncStatus, progress?: SyncProgress) => void> = new Set();
  private maxRetries: number = 3;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      this.startPeriodicSync();
    }
  }

  /**
   * Setup online/offline event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Check connection on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkConnection();
      }
    });
  }

  /**
   * Handle online event
   */
  private handleOnline = async (): Promise<void> => {
    console.log('🌐 Connection restored - Online');
    this.isOnline = true;
    this.notifyListeners(true);
    
    // Wait a bit to ensure connection is stable
    setTimeout(() => {
      this.syncPendingOperations();
    }, 1000);
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    console.log('📡 Connection lost - Offline');
    this.isOnline = false;
    this.notifyListeners(false);
    showToast.warning('You are offline. Changes will be synced when connection is restored.');
  };

  /**
   * Check actual connection by pinging server
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
      });
      
      const wasOffline = !this.isOnline;
      this.isOnline = response.ok;
      
      if (wasOffline && this.isOnline) {
        this.handleOnline();
      } else if (!wasOffline && !this.isOnline) {
        this.handleOffline();
      }
      
      return this.isOnline;
    } catch (error) {
      this.isOnline = false;
      return false;
    }
  }

  /**
   * Start periodic sync check
   */
  private startPeriodicSync(): void {
    // Check for pending operations every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingOperations(true);
      }
    }, 30000);
  }

  /**
   * Subscribe to online/offline status changes
   */
  subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener(this.isOnline);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to sync status changes
   */
  subscribeSyncStatus(
    listener: (status: SyncStatus, progress?: SyncProgress) => void
  ): () => void {
    this.syncListeners.add(listener);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach((listener) => listener(isOnline));
  }

  /**
   * Notify sync status listeners
   */
  private notifySyncListeners(status: SyncStatus, progress?: SyncProgress): void {
    this.syncListeners.forEach((listener) => listener(status, progress));
  }

  /**
   * Get current online status
   */
  getStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Main sync function - syncs all pending operations
   */
  async syncPendingOperations(silent: boolean = false): Promise<void> {
    // Prevent concurrent syncs
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    // Check if we're actually online
    if (!this.isOnline) {
      console.log('Cannot sync - offline');
      return;
    }

    try {
      this.syncInProgress = true;
      
      // Get all pending operations
      const operations = await indexedDB.getAll<PendingOperation>(STORES.PENDING_OPERATIONS);
      const uploads = await indexedDB.getAll<PendingUpload>(STORES.PENDING_UPLOADS);

      const totalItems = operations.length + uploads.length;

      if (totalItems === 0) {
        console.log('No pending operations to sync');
        return;
      }

      if (!silent) {
        showToast.info(`Syncing ${totalItems} pending operation(s)...`);
      }

      this.notifySyncListeners('syncing', {
        total: totalItems,
        completed: 0,
        failed: 0,
        current: 'Starting sync...',
      });

      let completed = 0;
      let failed = 0;

      // Sync pending uploads first
      for (const upload of uploads) {
        try {
          this.notifySyncListeners('syncing', {
            total: totalItems,
            completed,
            failed,
            current: `Uploading ${upload.metadata.fileName}...`,
          });

          await this.syncUpload(upload);
          await indexedDB.delete(STORES.PENDING_UPLOADS, upload.id);
          completed++;
          console.log(`✅ Synced upload: ${upload.metadata.fileName}`);
        } catch (error) {
          console.error('Failed to sync upload:', error);
          failed++;
        }
      }

      // Then sync other operations
      for (const operation of operations) {
        try {
          this.notifySyncListeners('syncing', {
            total: totalItems,
            completed,
            failed,
            current: `Processing ${operation.type}...`,
          });

          await this.syncOperation(operation);
          await indexedDB.delete(STORES.PENDING_OPERATIONS, operation.id);
          completed++;
          console.log(`✅ Synced operation: ${operation.type}`);
        } catch (error) {
          console.error('Failed to sync operation:', error);
          
          // Increment retry count
          operation.retryCount++;
          
          if (operation.retryCount >= this.maxRetries) {
            // Max retries reached, mark as failed
            operation.status = 'failed';
            await indexedDB.update(STORES.PENDING_OPERATIONS, operation);
            failed++;
            console.error(`❌ Operation failed after ${this.maxRetries} retries:`, operation);
          } else {
            // Update retry count and try again later
            operation.status = 'pending';
            await indexedDB.update(STORES.PENDING_OPERATIONS, operation);
          }
        }
      }

      // Show success message
      if (completed > 0 && !silent) {
        showToast.success(`Successfully synced ${completed} operation(s)`);
      }

      if (failed > 0 && !silent) {
        showToast.error(`Failed to sync ${failed} operation(s). Will retry later.`);
      }

      this.notifySyncListeners('success', {
        total: totalItems,
        completed,
        failed,
        current: 'Sync complete',
      });

    } catch (error) {
      console.error('Sync error:', error);
      this.notifySyncListeners('error');
      if (!silent) {
        showToast.error('Sync failed. Will retry later.');
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a single upload operation
   */
  private async syncUpload(upload: PendingUpload): Promise<void> {
    const formData = new FormData();
    formData.append('file', upload.file);
    if (upload.folderId) {
      formData.append('folderId', upload.folderId);
    }

    const response = await fetch('/api/upload/file', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }
  }

  /**
   * Sync a single operation
   */
  private async syncOperation(operation: PendingOperation): Promise<void> {
    let endpoint = '';
    let method = 'PATCH';
    let body: any = null;

    switch (operation.type) {
      case 'delete':
        endpoint = '/api/files';
        body = {
          action: 'delete',
          fileId: operation.data.fileId,
        };
        break;

      case 'rename':
        endpoint = '/api/files';
        body = {
          action: 'rename',
          fileId: operation.data.fileId,
          data: { newName: operation.data.newName },
        };
        break;

      case 'create-folder':
        endpoint = '/api/files';
        body = {
          action: 'create-folder',
          data: operation.data,
        };
        break;

      case 'star':
        endpoint = '/api/files';
        body = {
          action: 'toggle-star',
          fileId: operation.data.fileId,
        };
        break;

      case 'move':
        endpoint = '/api/files';
        body = {
          action: 'move',
          fileId: operation.data.fileId,
          data: { folderId: operation.data.folderId },
        };
        break;

      case 'share':
        endpoint = '/api/files/share-email';
        method = 'POST';
        body = operation.data;
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Operation failed');
    }
  }

  /**
   * Add a pending operation to queue
   */
  async queueOperation(
    type: PendingOperation['type'],
    data: any
  ): Promise<void> {
    const operation: PendingOperation = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    await indexedDB.add(STORES.PENDING_OPERATIONS, operation);
    console.log(`📝 Queued ${type} operation for later sync`);
  }

  /**
   * Add a pending upload to queue
   */
  async queueUpload(file: File, folderId: string | null): Promise<void> {
    const upload: PendingUpload = {
      id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      folderId,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
      timestamp: Date.now(),
    };

    await indexedDB.add(STORES.PENDING_UPLOADS, upload);
    console.log(`📝 Queued upload: ${file.name}`);
  }

  /**
   * Get count of pending operations
   */
  async getPendingCount(): Promise<number> {
    const opsCount = await indexedDB.count(STORES.PENDING_OPERATIONS);
    const uploadsCount = await indexedDB.count(STORES.PENDING_UPLOADS);
    return opsCount + uploadsCount;
  }

  /**
   * Clear all pending operations (use with caution)
   */
  async clearPendingOperations(): Promise<void> {
    await indexedDB.clear(STORES.PENDING_OPERATIONS);
    await indexedDB.clear(STORES.PENDING_UPLOADS);
    console.log('🗑️ Cleared all pending operations');
  }

  /**
   * Cleanup - call when app unmounts
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    this.listeners.clear();
    this.syncListeners.clear();
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
