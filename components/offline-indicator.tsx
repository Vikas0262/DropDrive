/**
 * Offline Status Indicator Component
 * 
 * Shows a banner when offline and displays sync progress
 * when syncing pending operations.
 */

'use client';

import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export function OfflineIndicator() {
  const { isOnline, syncStatus, syncProgress, pendingCount, triggerSync } = useOfflineSync();
  const [showDetails, setShowDetails] = useState(false);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (syncStatus === 'success') {
      const timer = setTimeout(() => {
        setShowDetails(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  // Don't show anything if online and no pending operations
  if (isOnline && pendingCount === 0 && syncStatus === 'idle') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-orange-500 dark:bg-orange-600 text-white rounded-lg shadow-lg p-4 mb-2 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <WifiOff className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">You're offline</div>
              <div className="text-sm opacity-90">
                Changes will be saved and synced when you're back online
              </div>
            </div>
          </div>
          
          {pendingCount > 0 && (
            <div className="mt-2 pt-2 border-t border-white/20">
              <div className="text-sm">
                {pendingCount} operation{pendingCount !== 1 ? 's' : ''} pending
              </div>
            </div>
          )}
        </div>
      )}

      {/* Syncing Progress */}
      {isOnline && syncStatus === 'syncing' && syncProgress && (
        <div className="bg-info text-white rounded-lg shadow-lg p-4 mb-2 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="h-5 w-5 flex-shrink-0 animate-spin" />
            <div className="flex-1">
              <div className="font-semibold">Syncing...</div>
              <div className="text-sm opacity-90">{syncProgress.current}</div>
            </div>
          </div>
          
          <Progress 
            value={(syncProgress.completed / syncProgress.total) * 100} 
            className="h-2 bg-primary-foreground/20"
          />
          
          <div className="text-xs mt-2 opacity-90">
            {syncProgress.completed} / {syncProgress.total} completed
            {syncProgress.failed > 0 && ` • ${syncProgress.failed} failed`}
          </div>
        </div>
      )}

      {/* Sync Success */}
      {isOnline && syncStatus === 'success' && showDetails && (
        <div className="bg-success text-white rounded-lg shadow-lg p-4 mb-2 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">All synced!</div>
              <div className="text-sm opacity-90">Your changes are up to date</div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Error */}
      {isOnline && syncStatus === 'error' && (
        <div className="bg-destructive text-white rounded-lg shadow-lg p-4 mb-2 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">Sync failed</div>
              <div className="text-sm opacity-90">We'll retry automatically</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={triggerSync}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Pending Operations Badge (when online but has pending) */}
      {isOnline && pendingCount > 0 && syncStatus === 'idle' && (
        <div className="bg-background border rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <Cloud className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-sm">
                {pendingCount} operation{pendingCount !== 1 ? 's' : ''} pending
              </div>
              <div className="text-xs text-muted-foreground">
                Click to sync now
              </div>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={triggerSync}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Sync
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact status badge for navbar
 */
export function OfflineStatusBadge() {
  const { isOnline, pendingCount } = useOfflineSync();

  if (isOnline && pendingCount === 0) {
    return (
      <Badge variant="outline" className="gap-1">
        <Wifi className="h-3 w-3 text-success" />
        <span className="text-xs">Online</span>
      </Badge>
    );
  }

  if (!isOnline) {
    return (
      <Badge variant="outline" className="gap-1 border-orange-500">
        <WifiOff className="h-3 w-3 text-orange-500" />
        <span className="text-xs">Offline</span>
        {pendingCount > 0 && (
          <span className="ml-1 bg-orange-500 text-white rounded-full px-1.5 text-xs">
            {pendingCount}
          </span>
        )}
      </Badge>
    );
  }

  if (pendingCount > 0) {
    return (
      <Badge variant="outline" className="gap-1 border-info">
        <Cloud className="h-3 w-3 text-info" />
        <span className="text-xs">Pending</span>
        <span className="ml-1 bg-info text-primary-foreground rounded-full px-1.5 text-xs">
          {pendingCount}
        </span>
      </Badge>
    );
  }

  return null;
}
