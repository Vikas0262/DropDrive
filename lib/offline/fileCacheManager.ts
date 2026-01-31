/**
 * File Cache Manager for Offline Access
 * 
 * This manager handles caching file metadata in IndexedDB
 * so users can browse their files even when offline.
 * 
 * Features:
 * - Cache file list for offline browsing
 * - Smart cache invalidation
 * - Automatic cache updates when online
 */

import { indexedDB, STORES, CachedFile } from './indexedDB';

const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

class FileCacheManager {
  /**
   * Cache files from API response
   */
  async cacheFiles(files: any[]): Promise<void> {
    try {
      const cachedFiles: CachedFile[] = files.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileType: file.fileType,
        uploadTime: file.uploadTime,
        lastModified: file.lastModified,
        starred: file.starred || false,
        isFolder: file.isFolder || false,
        folderId: file.folderId,
        cachedAt: Date.now(),
      }));

      // Clear old cache and add new files
      await indexedDB.clear(STORES.CACHED_FILES);
      
      for (const file of cachedFiles) {
        await indexedDB.add(STORES.CACHED_FILES, file);
      }

      console.log(`✅ Cached ${cachedFiles.length} files`);
    } catch (error) {
      console.error('Failed to cache files:', error);
    }
  }

  /**
   * Get cached files
   */
  async getCachedFiles(): Promise<CachedFile[]> {
    try {
      const files = await indexedDB.getAll<CachedFile>(STORES.CACHED_FILES);
      return files;
    } catch (error) {
      console.error('Failed to get cached files:', error);
      return [];
    }
  }

  /**
   * Get cached files by folder
   */
  async getCachedFilesByFolder(folderId: string | null): Promise<CachedFile[]> {
    try {
      const allFiles = await indexedDB.getAll<CachedFile>(STORES.CACHED_FILES);
      return allFiles.filter((file) => file.folderId === folderId);
    } catch (error) {
      console.error('Failed to get cached files by folder:', error);
      return [];
    }
  }

  /**
   * Update a single cached file
   */
  async updateCachedFile(file: Partial<CachedFile> & { id: string }): Promise<void> {
    try {
      const existing = await indexedDB.get<CachedFile>(STORES.CACHED_FILES, file.id);
      if (existing) {
        const updated = { ...existing, ...file, cachedAt: Date.now() };
        await indexedDB.update(STORES.CACHED_FILES, updated);
      }
    } catch (error) {
      console.error('Failed to update cached file:', error);
    }
  }

  /**
   * Remove a cached file
   */
  async removeCachedFile(fileId: string): Promise<void> {
    try {
      await indexedDB.delete(STORES.CACHED_FILES, fileId);
    } catch (error) {
      console.error('Failed to remove cached file:', error);
    }
  }

  /**
   * Check if cache is stale
   */
  async isCacheStale(): Promise<boolean> {
    try {
      const files = await indexedDB.getAll<CachedFile>(STORES.CACHED_FILES);
      if (files.length === 0) return true;

      const oldestFile = files.reduce((oldest, file) => 
        file.cachedAt < oldest.cachedAt ? file : oldest
      );

      return Date.now() - oldestFile.cachedAt > CACHE_DURATION;
    } catch (error) {
      return true;
    }
  }

  /**
   * Clear all cached files
   */
  async clearCache(): Promise<void> {
    try {
      await indexedDB.clear(STORES.CACHED_FILES);
      console.log('🗑️ Cleared file cache');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Add a file to cache (optimistic update)
   */
  async addToCache(file: CachedFile): Promise<void> {
    try {
      await indexedDB.add(STORES.CACHED_FILES, {
        ...file,
        cachedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to add file to cache:', error);
    }
  }
}

export const fileCacheManager = new FileCacheManager();
