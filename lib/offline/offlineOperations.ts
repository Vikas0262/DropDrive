/**
 * Offline-Enabled File Operations Wrapper
 * 
 * This module wraps file operations to handle offline scenarios:
 * - Queues operations when offline
 * - Performs operations immediately when online
 * - Provides optimistic UI updates
 */

import { syncManager } from '@/lib/offline/syncManager';
import { fileCacheManager } from '@/lib/offline/fileCacheManager';
import { showToast } from '@/lib/toast/toastHelper';

/**
 * Upload file with offline support
 */
export async function uploadFileOffline(
  file: File,
  folderId: string | null,
  isOnline: boolean
): Promise<{ success: boolean; fileId?: string }> {
  if (!isOnline) {
    // Queue for later upload
    await syncManager.queueUpload(file, folderId);
    showToast.info(`"${file.name}" will be uploaded when you're back online`);
    return { success: true };
  }

  // Upload immediately if online
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) {
    formData.append('folderId', folderId);
  }

  try {
    const response = await fetch('/api/upload/file', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return { success: true, fileId: data.fileId };
  } catch (error) {
    // If failed due to network, queue it
    if (!navigator.onLine) {
      await syncManager.queueUpload(file, folderId);
      showToast.info(`"${file.name}" will be uploaded when you're back online`);
      return { success: true };
    }
    throw error;
  }
}

/**
 * Delete file with offline support
 */
export async function deleteFileOffline(
  fileId: string,
  fileName: string,
  isOnline: boolean
): Promise<boolean> {
  if (!isOnline) {
    // Queue for later deletion
    await syncManager.queueOperation('delete', { fileId });
    
    // Optimistically remove from cache
    await fileCacheManager.removeCachedFile(fileId);
    
    showToast.info(`"${fileName}" will be deleted when you're back online`);
    return true;
  }

  try {
    const response = await fetch('/api/files', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        fileId,
      }),
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }

    // Remove from cache
    await fileCacheManager.removeCachedFile(fileId);
    
    return true;
  } catch (error) {
    // If failed due to network, queue it
    if (!navigator.onLine) {
      await syncManager.queueOperation('delete', { fileId });
      await fileCacheManager.removeCachedFile(fileId);
      showToast.info(`"${fileName}" will be deleted when you're back online`);
      return true;
    }
    throw error;
  }
}

/**
 * Rename file with offline support
 */
export async function renameFileOffline(
  fileId: string,
  newName: string,
  isOnline: boolean
): Promise<boolean> {
  if (!isOnline) {
    // Queue for later rename
    await syncManager.queueOperation('rename', { fileId, newName });
    
    // Optimistically update cache
    await fileCacheManager.updateCachedFile({ id: fileId, fileName: newName });
    
    showToast.info('File will be renamed when you\'re back online');
    return true;
  }

  try {
    const response = await fetch('/api/files', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'rename',
        fileId,
        data: { newName },
      }),
    });

    if (!response.ok) {
      throw new Error('Rename failed');
    }

    // Update cache
    await fileCacheManager.updateCachedFile({ id: fileId, fileName: newName });
    
    return true;
  } catch (error) {
    // If failed due to network, queue it
    if (!navigator.onLine) {
      await syncManager.queueOperation('rename', { fileId, newName });
      await fileCacheManager.updateCachedFile({ id: fileId, fileName: newName });
      showToast.info('File will be renamed when you\'re back online');
      return true;
    }
    throw error;
  }
}

/**
 * Create folder with offline support
 */
export async function createFolderOffline(
  folderName: string,
  parentFolderId: string | null,
  isOnline: boolean
): Promise<{ success: boolean; folderId?: string }> {
  if (!isOnline) {
    // Queue for later creation
    await syncManager.queueOperation('create-folder', {
      folderName,
      parentFolderId,
    });
    
    showToast.info(`Folder "${folderName}" will be created when you're back online`);
    return { success: true };
  }

  try {
    const response = await fetch('/api/files', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-folder',
        data: { folderName, parentFolderId },
      }),
    });

    if (!response.ok) {
      throw new Error('Create folder failed');
    }

    const data = await response.json();
    return { success: true, folderId: data.folderId };
  } catch (error) {
    // If failed due to network, queue it
    if (!navigator.onLine) {
      await syncManager.queueOperation('create-folder', {
        folderName,
        parentFolderId,
      });
      showToast.info(`Folder "${folderName}" will be created when you're back online`);
      return { success: true };
    }
    throw error;
  }
}

/**
 * Toggle star with offline support
 */
export async function toggleStarOffline(
  fileId: string,
  fileName: string,
  currentStarred: boolean,
  isOnline: boolean
): Promise<boolean> {
  if (!isOnline) {
    // Queue for later
    await syncManager.queueOperation('star', { fileId });
    
    // Optimistically update cache
    await fileCacheManager.updateCachedFile({ id: fileId, starred: !currentStarred });
    
    showToast.info('Change will be synced when you\'re back online');
    return true;
  }

  try {
    const response = await fetch('/api/files', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggle-star',
        fileId,
      }),
    });

    if (!response.ok) {
      throw new Error('Toggle star failed');
    }

    // Update cache
    await fileCacheManager.updateCachedFile({ id: fileId, starred: !currentStarred });
    
    return true;
  } catch (error) {
    // If failed due to network, queue it
    if (!navigator.onLine) {
      await syncManager.queueOperation('star', { fileId });
      await fileCacheManager.updateCachedFile({ id: fileId, starred: !currentStarred });
      showToast.info('Change will be synced when you\'re back online');
      return true;
    }
    throw error;
  }
}

/**
 * Move file with offline support
 */
export async function moveFileOffline(
  fileId: string,
  fileName: string,
  folderId: string | null,
  isOnline: boolean
): Promise<boolean> {
  if (!isOnline) {
    // Queue for later
    await syncManager.queueOperation('move', { fileId, folderId });
    
    // Optimistically update cache
    await fileCacheManager.updateCachedFile({ id: fileId, folderId });
    
    showToast.info(`"${fileName}" will be moved when you're back online`);
    return true;
  }

  try {
    const response = await fetch('/api/files', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'move',
        fileId,
        data: { folderId },
      }),
    });

    if (!response.ok) {
      throw new Error('Move failed');
    }

    // Update cache
    await fileCacheManager.updateCachedFile({ id: fileId, folderId });
    
    return true;
  } catch (error) {
    // If failed due to network, queue it
    if (!navigator.onLine) {
      await syncManager.queueOperation('move', { fileId, folderId });
      await fileCacheManager.updateCachedFile({ id: fileId, folderId });
      showToast.info(`"${fileName}" will be moved when you're back online`);
      return true;
    }
    throw error;
  }
}

/**
 * Fetch files with offline cache fallback
 */
export async function fetchFilesOffline(
  filter: string,
  folderId: string | null,
  isOnline: boolean
): Promise<any[]> {
  if (!isOnline) {
    // Return cached files
    const cachedFiles = await fileCacheManager.getCachedFiles();
    console.log(`📂 Loaded ${cachedFiles.length} files from cache`);
    return cachedFiles;
  }

  try {
    const params = new URLSearchParams();
    params.append('filter', filter);
    if (folderId) {
      params.append('folderId', folderId);
    }

    const response = await fetch(`/api/files?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }

    const data = await response.json();
    
    // Cache the files
    await fileCacheManager.cacheFiles(data.files);
    
    return data.files;
  } catch (error) {
    // If failed due to network, return cached files
    if (!navigator.onLine) {
      const cachedFiles = await fileCacheManager.getCachedFiles();
      console.log(`📂 Network error - Loaded ${cachedFiles.length} files from cache`);
      return cachedFiles;
    }
    throw error;
  }
}
