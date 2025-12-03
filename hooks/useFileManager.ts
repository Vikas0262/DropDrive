import { useCallback, useEffect, useState } from 'react';
import { getSessionUser } from '@/lib/auth/session';
import { toast } from 'sonner';

export interface FileItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadTime: Date;
  lastModified: Date;
  starred: boolean;
  sharedWith: number;
  fileUrl?: string;
  isFolder: boolean;
  isDeleted: boolean;
  folderId?: string;
}

export type FilterType = 'my-drive' | 'shared' | 'recent' | 'starred' | 'trash' | 'all-folders';

export interface UploadingFile {
  id: string;
  fileName: string;
  progress: number;
}

export function useFileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('my-drive');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [sharedCount, setSharedCount] = useState(0);
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const user = getSessionUser();

  const fetchFiles = useCallback(
    async (currentFilter: FilterType = filter, currentFolderId: string | null = folderId) => {
      if (!user?._id) return;

      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('filter', currentFilter);
        if (currentFolderId) {
          params.set('folderId', currentFolderId);
        }

        const response = await fetch(`/api/files?${params.toString()}`, {
          headers: {
            'x-user-id': user._id,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch files');
        }

        const data = await response.json();
        
        // Convert date strings back to Date objects and map MongoDB _id to id
        const filesWithDates: FileItem[] = data.files.map((f: any) => ({
          id: f._id || f.id,
          fileName: f.fileName,
          fileSize: f.fileSize,
          fileType: f.fileType,
          uploadTime: new Date(f.uploadTime),
          lastModified: new Date(f.lastModified),
          starred: f.starred || false,
          sharedWith: (f.sharedWith && f.sharedWith.length) || 0,
          fileUrl: f.fileUrl,
          isFolder: f.fileType === 'folder',
          isDeleted: f.isDeleted || false,
          folderId: f.folderId,
        }));

        setFiles(filesWithDates);
        setSharedCount(data.sharedCount || 0);
      } catch (error) {
        console.error('Error fetching files:', error);
        toast.error('Failed to load files');
      } finally {
        setLoading(false);
      }
    },
    [user?._id, filter, folderId]
  );

  // Fetch files when filter or folderId changes
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Fetch folder breadcrumb path when folderId changes
  useEffect(() => {
    const fetchFolderPath = async () => {
      if (!folderId || !user?._id) {
        setFolderPath([]);
        return;
      }

      try {
        const response = await fetch(`/api/files/${folderId}`, {
          headers: {
            'x-user-id': user._id,
          },
        });

        if (response.ok) {
          const folder = await response.json();
          
          // Validate folder exists and has required fields
          if (!folder || !folder._id) {
            setFolderPath([]);
            return;
          }
          
          // Build path from current folder up to root
          const path: Array<{ id: string; name: string }> = [
            { id: folder._id.toString?.() || folder._id, name: folder.fileName }
          ];
          
          let currentFolderId = folder.folderId;
          
          while (currentFolderId) {
            const parentResponse = await fetch(`/api/files/${currentFolderId}`, {
              headers: {
                'x-user-id': user._id,
              },
            });
            
            if (parentResponse.ok) {
              const parentFolder = await parentResponse.json();
              if (!parentFolder || !parentFolder._id) {
                break;
              }
              path.unshift({ 
                id: parentFolder._id.toString?.() || parentFolder._id, 
                name: parentFolder.fileName 
              });
              currentFolderId = parentFolder.folderId;
            } else {
              break;
            }
          }
          
          setFolderPath(path);
        } else {
          setFolderPath([]);
        }
      } catch (error) {
        console.error('Error fetching folder path:', error);
        setFolderPath([]);
      }
    };

    fetchFolderPath();
  }, [folderId, user?._id]);

  // Listen for file list updates (e.g., when new folder is created)
  useEffect(() => {
    const handleFileListUpdate = () => {
      fetchFiles();
    };

    window.addEventListener('fileListUpdated', handleFileListUpdate);
    return () => {
      window.removeEventListener('fileListUpdated', handleFileListUpdate);
    };
  }, [fetchFiles]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!user?._id) {
        toast.error('Not authenticated');
        return null;
      }

      // Use a simple numeric ID instead of filename + timestamp
      const fileId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add to uploading files list with actual filename
      setUploadingFiles((prev) => [...prev, { id: fileId, fileName: file.name, progress: 0 }]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (folderId) {
          formData.append('folderId', folderId);
        }

        // Use XMLHttpRequest for progress tracking
        const uploadPromise = new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          // Set timeout to 5 minutes for large files
          xhr.timeout = 5 * 60 * 1000;

          // Track progress
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              console.log(`Upload progress for ${file.name}: ${progress}%`);
              setUploadingFiles((prev) =>
                prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
              );
            }
          });

          xhr.addEventListener('load', () => {
            try {
              console.log('XHR Status:', xhr.status, 'Response:', xhr.responseText);
              if (xhr.status === 200 || xhr.status === 201) {
                const data = JSON.parse(xhr.responseText);
                resolve(data.file);
              } else {
                try {
                  const error = JSON.parse(xhr.responseText);
                  reject(new Error(error.error || `Upload failed with status ${xhr.status}`));
                } catch {
                  reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
                }
              }
            } catch (e) {
              reject(new Error('Failed to parse upload response'));
            }
          });

          xhr.addEventListener('error', () => {
            console.error('XHR Error:', xhr.status, xhr.statusText);
            reject(new Error('Upload failed - Network error'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload aborted'));
          });

          xhr.addEventListener('timeout', () => {
            reject(new Error('Upload timeout - File took too long to upload'));
          });

          xhr.open('POST', '/api/upload/file');
          xhr.setRequestHeader('x-user-id', user._id);
          xhr.send(formData);
        });

        const data = await uploadPromise;
        
        // Remove from uploading and show success
        setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast.success('File uploaded successfully');

        // Refresh files list
        await fetchFiles();

        return data;
      } catch (error) {
        console.error('Upload error:', error);
        setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast.error(error instanceof Error ? error.message : 'Upload failed');
        return null;
      }
    },
    [user?._id, folderId, fetchFiles]
  );

  const toggleStar = useCallback(
    async (fileId: string) => {
      if (!user?._id) return;

      try {
        const response = await fetch('/api/files', {
          method: 'PATCH',
          headers: {
            'x-user-id': user._id,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'star',
            fileId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to toggle star');
        }

        // Update local state
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, starred: !f.starred } : f
          )
        );

        toast.success('Star toggled');
      } catch (error) {
        console.error('Error toggling star:', error);
        toast.error('Failed to toggle star');
      }
    },
    [user?._id]
  );

  const renameFile = useCallback(
    async (fileId: string, newName: string) => {
      if (!user?._id) return;

      try {
        const response = await fetch('/api/files', {
          method: 'PATCH',
          headers: {
            'x-user-id': user._id,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'rename',
            fileId,
            data: { newName },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to rename file');
        }

        // Update local state
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, fileName: newName } : f
          )
        );

        toast.success('File renamed');
      } catch (error) {
        console.error('Error renaming file:', error);
        toast.error('Failed to rename file');
      }
    },
    [user?._id]
  );

  const shareFile = useCallback(
    async (fileId: string, userEmail: string, permission: 'view' | 'edit' | 'comment' = 'view') => {
      if (!user?._id) return;

      try {
        const response = await fetch('/api/files', {
          method: 'PATCH',
          headers: {
            'x-user-id': user._id,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'share',
            fileId,
            data: { userEmail, permission },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to share file');
        }

        toast.success('File shared');
        await fetchFiles();
      } catch (error) {
        console.error('Error sharing file:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to share file');
      }
    },
    [user?._id, fetchFiles]
  );

  const deleteFile = useCallback(
    async (fileId: string) => {
      if (!user?._id) return;

      try {
        const response = await fetch('/api/files', {
          method: 'PATCH',
          headers: {
            'x-user-id': user._id,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete',
            fileId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete file');
        }

        // Update local state
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast.success('File moved to trash');
      } catch (error) {
        console.error('Error deleting file:', error);
        toast.error('Failed to delete file');
      }
    },
    [user?._id]
  );

  const restoreFile = useCallback(
    async (fileId: string) => {
      if (!user?._id) return;

      try {
        const response = await fetch('/api/files', {
          method: 'PATCH',
          headers: {
            'x-user-id': user._id,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'restore',
            fileId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to restore file');
        }

        await fetchFiles();
        toast.success('File restored');
      } catch (error) {
        console.error('Error restoring file:', error);
        toast.error('Failed to restore file');
      }
    },
    [user?._id, fetchFiles]
  );

  const permanentlyDeleteFile = useCallback(
    async (fileId: string) => {
      if (!user?._id) return;

      try {
        const response = await fetch('/api/files', {
          method: 'PATCH',
          headers: {
            'x-user-id': user._id,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'permanent-delete',
            fileId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete file permanently');
        }

        await fetchFiles();
        toast.success('File permanently deleted');
      } catch (error) {
        console.error('Error permanently deleting file:', error);
        toast.error('Failed to permanently delete file');
      }
    },
    [user?._id, fetchFiles]
  );

  const downloadFile = useCallback(
    (file: FileItem) => {
      if (!file.fileUrl) {
        toast.error('File URL not available');
        return;
      }

      // Create a temporary link and download
      const link = document.createElement('a');
      link.href = file.fileUrl;
      link.download = file.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download started');
    },
    []
  );

  const changeFilter = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
    setFolderId(null); // Reset folder when changing filter
    setFolderPath([]); // Clear breadcrumb path
  }, []);

  const enterFolder = useCallback((folderFileId: string) => {
    setFolderId(folderFileId);
  }, []);

  const exitFolder = useCallback(() => {
    setFolderId(null);
    setFolderPath([]);
  }, []);

  const createFolder = useCallback(
    async (folderName: string) => {
      if (!user?._id) {
        toast.error('Not authenticated');
        return null;
      }

      try {
        const response = await fetch('/api/files', {
          method: 'PATCH',
          headers: {
            'x-user-id': user._id,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create-folder',
            data: { folderName, parentFolderId: folderId },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create folder');
        }

        const data = await response.json();
        
        // Add new folder to files list instantly
        const newFolder: FileItem = {
          id: data.folder._id || data.folder.id,
          fileName: data.folder.fileName,
          fileSize: data.folder.fileSize,
          fileType: data.folder.fileType,
          uploadTime: new Date(data.folder.uploadTime),
          lastModified: new Date(data.folder.lastModified),
          starred: data.folder.starred || false,
          sharedWith: 0,
          isFolder: true,
          isDeleted: false,
          folderId: data.folder.folderId || folderId,
        };

        setFiles((prev) => [newFolder, ...prev]);
        toast.success('Folder created successfully');
        return newFolder;
      } catch (error) {
        console.error('Error creating folder:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create folder');
        return null;
      }
    },
    [user?._id, folderId]
  );

  return {
    files,
    loading,
    filter,
    folderId,
    folderPath,
    sharedCount,
    uploadingFiles,
    fetchFiles,
    uploadFile,
    toggleStar,
    renameFile,
    shareFile,
    deleteFile,
    restoreFile,
    permanentlyDeleteFile,
    downloadFile,
    changeFilter,
    enterFolder,
    exitFolder,
    createFolder,
  };
}
