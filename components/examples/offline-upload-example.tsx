/**
 * Example Component: Offline File Upload
 * 
 * This example demonstrates how to use the offline functionality
 * in a simple file upload component.
 */

'use client';

import { useState } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { uploadFileOffline } from '@/lib/offline/offlineOperations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Wifi, WifiOff } from 'lucide-react';

export default function OfflineFileUploadExample() {
  const { isOnline, pendingCount } = useOfflineSync();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // This works both online and offline!
      await uploadFileOffline(selectedFile, null, isOnline);
      
      setSelectedFile(null);
      
      if (isOnline) {
        alert('File uploaded successfully!');
      } else {
        alert('File queued for upload when you\'re back online!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold">Offline File Upload Demo</h2>
      
      {/* Connection Status */}
      <Alert>
        <AlertDescription className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-success" />
              <span>You are online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-orange-500" />
              <span>You are offline - uploads will sync later</span>
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Pending Operations */}
      {pendingCount > 0 && (
        <Alert>
          <AlertDescription>
            {pendingCount} operation(s) pending sync
          </AlertDescription>
        </Alert>
      )}

      {/* File Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select File</label>
        <Input
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        {selectedFile && (
          <p className="text-sm text-muted-foreground">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full"
      >
        <Upload className="mr-2 h-4 w-4" />
        {uploading ? 'Uploading...' : 'Upload File'}
      </Button>

      {/* Instructions */}
      <div className="text-sm text-muted-foreground space-y-2 mt-6">
        <p className="font-semibold">Try this:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Open DevTools (F12) → Network tab</li>
          <li>Change to "Offline" mode</li>
          <li>Select and upload a file</li>
          <li>See it queued (IndexedDB in Application tab)</li>
          <li>Go back "Online"</li>
          <li>Watch it sync automatically!</li>
        </ol>
      </div>
    </div>
  );
}
