/**
 * React Hook for Offline/Online State Management
 * 
 * This hook provides:
 * - Current online/offline status
 * - Sync status and progress
 * - Function to manually trigger sync
 * - Pending operations count
 * 
 * Usage:
 * ```tsx
 * const { isOnline, syncStatus, pendingCount, triggerSync } = useOfflineSync();
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncManager, SyncStatus, SyncProgress } from '@/lib/offline/syncManager';

export interface UseOfflineSyncReturn {
  isOnline: boolean;
  syncStatus: SyncStatus;
  syncProgress: SyncProgress | null;
  pendingCount: number;
  triggerSync: () => Promise<void>;
  queueOperation: (type: any, data: any) => Promise<void>;
  queueUpload: (file: File, folderId: string | null) => Promise<void>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await syncManager.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  // Subscribe to online/offline status
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((status) => {
      setIsOnline(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Subscribe to sync status
  useEffect(() => {
    const unsubscribe = syncManager.subscribeSyncStatus((status, progress) => {
      setSyncStatus(status);
      if (progress) {
        setSyncProgress(progress);
      }
      
      // Update pending count after sync completes
      if (status === 'success' || status === 'error') {
        updatePendingCount();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [updatePendingCount]);

  // Initial pending count load
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Manually trigger sync
  const triggerSync = useCallback(async () => {
    await syncManager.syncPendingOperations();
  }, []);

  // Queue an operation
  const queueOperation = useCallback(async (type: any, data: any) => {
    await syncManager.queueOperation(type, data);
    await updatePendingCount();
  }, [updatePendingCount]);

  // Queue an upload
  const queueUpload = useCallback(async (file: File, folderId: string | null) => {
    await syncManager.queueUpload(file, folderId);
    await updatePendingCount();
  }, [updatePendingCount]);

  return {
    isOnline,
    syncStatus,
    syncProgress,
    pendingCount,
    triggerSync,
    queueOperation,
    queueUpload,
  };
}
