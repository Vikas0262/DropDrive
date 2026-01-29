'use client';

import { useState } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { uploadFileOffline, deleteFileOffline } from '@/lib/offline/offlineOperations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, Upload, Trash2, RefreshCw } from 'lucide-react';

export default function OfflineTestPage() {
  const { isOnline, pendingCount, syncStatus, syncProgress, triggerSync } = useOfflineSync();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testResult, setTestResult] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTestResult('');
    }
  };

  const testUpload = async () => {
    if (!selectedFile) {
      setTestResult('❌ Please select a file first');
      return;
    }

    try {
      setTestResult('⏳ Testing upload...');
      await uploadFileOffline(selectedFile, null, isOnline);
      setTestResult(`✅ Upload ${isOnline ? 'successful' : 'queued for sync'}!`);
      setSelectedFile(null);
    } catch (error: any) {
      setTestResult(`❌ Upload failed: ${error.message}`);
    }
  };

  const testDelete = async () => {
    try {
      setTestResult('⏳ Testing delete...');
      await deleteFileOffline('test-file-id', 'test-file.txt', isOnline);
      setTestResult(`✅ Delete ${isOnline ? 'successful' : 'queued for sync'}!`);
    } catch (error: any) {
      setTestResult(`❌ Delete failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Offline Mode Test</h1>
          <p className="text-muted-foreground">Test offline functionality of DropDrive</p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="h-5 w-5 text-success" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-orange-500" />
                  Offline
                </>
              )}
            </CardTitle>
            <CardDescription>
              Connection status: {isOnline ? 'Connected' : 'Disconnected'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingCount > 0 && (
              <Alert>
                <AlertDescription className="flex items-center justify-between">
                  <span>{pendingCount} operation(s) pending sync</span>
                  <Button size="sm" onClick={triggerSync} disabled={syncStatus === 'syncing'}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    Sync Now
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {syncStatus === 'syncing' && syncProgress && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Syncing: {syncProgress.current}
                </p>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${(syncProgress.completed / syncProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {syncProgress.completed} / {syncProgress.total} completed
                  {syncProgress.failed > 0 && ` • ${syncProgress.failed} failed`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Test File Upload</CardTitle>
            <CardDescription>Upload a file to test offline queueing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="file"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
            <Button onClick={testUpload} disabled={!selectedFile} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Test Upload
            </Button>
          </CardContent>
        </Card>

        {/* Test Delete */}
        <Card>
          <CardHeader>
            <CardTitle>Test File Delete</CardTitle>
            <CardDescription>Simulate deleting a file</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testDelete} variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Test Delete
            </Button>
          </CardContent>
        </Card>

        {/* Test Result */}
        {testResult && (
          <Alert>
            <AlertDescription>{testResult}</AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>Test Online Mode:</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>Ensure you're online (green indicator above)</li>
                  <li>Select a file and click "Test Upload"</li>
                  <li>Should upload immediately</li>
                </ul>
              </li>
              <li className="mt-3">
                <strong>Test Offline Mode:</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>Open DevTools (F12) → Network tab</li>
                  <li>Change dropdown from "No throttling" to "Offline"</li>
                  <li>Status should change to orange "Offline"</li>
                  <li>Select a file and click "Test Upload"</li>
                  <li>Should queue the upload (pending count increases)</li>
                  <li>Click "Test Delete" to queue a delete operation</li>
                </ul>
              </li>
              <li className="mt-3">
                <strong>Test Auto-Sync:</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>With pending operations queued</li>
                  <li>Go back online (change from "Offline" to "No throttling")</li>
                  <li>Watch the automatic sync process</li>
                  <li>Pending count should decrease to 0</li>
                </ul>
              </li>
              <li className="mt-3">
                <strong>Check IndexedDB:</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>DevTools → Application tab</li>
                  <li>Expand "IndexedDB" → "DropDriveOfflineDB"</li>
                  <li>Check "pendingOperations" and "pendingUploads"</li>
                </ul>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
