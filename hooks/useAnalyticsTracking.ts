import { useEffect, useRef, useCallback } from 'react';
import { InteractionType } from '@/types/analytics';
import {
  getSessionId,
  getDeviceInfo,
  TimeTracker,
  trackEvent,
  updateTimeSpent,
  closeSession,
} from '@/lib/utils/analyticsUtils';

interface UseAnalyticsTrackingOptions {
  fileId: string;
  permission: 'secure-view' | 'full-access';
  viewerUserId?: string;
  viewerEmail?: string;
  enabled?: boolean;
}

export function useAnalyticsTracking({
  fileId,
  permission,
  viewerUserId,
  viewerEmail,
  enabled = true,
}: UseAnalyticsTrackingOptions) {
  const sessionIdRef = useRef<string | null>(null);
  const timeTrackerRef = useRef<TimeTracker | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);

  // Initialize tracking
  const initializeTracking = useCallback(async () => {
    if (!enabled || hasInitializedRef.current) return;

    try {
      const sessionId = getSessionId();
      sessionIdRef.current = sessionId;
      timeTrackerRef.current = new TimeTracker();

      console.log('[Analytics] 📊 Initializing tracking for file:', fileId);

      // Send initial view event
      const deviceInfo = getDeviceInfo();
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          fileId,
          permission,
          viewerUserId,
          viewerEmail,
          deviceInfo,
          interactionType: InteractionType.VIEW,
        }),
      });

      if (response.ok) {
        console.log('[Analytics] ✅ Initial view tracked');
        hasInitializedRef.current = true;

        // Start periodic time updates (every 10 seconds)
        updateIntervalRef.current = setInterval(() => {
          if (timeTrackerRef.current) {
            const elapsed = timeTrackerRef.current.getElapsedSeconds();
            if (elapsed > 0 && sessionIdRef.current) {
              updateTimeSpent(sessionIdRef.current, 10); // Send 10 second increment
            }
          }
        }, 10000);
      }
    } catch (error) {
      console.error('[Analytics] Failed to initialize tracking:', error);
    }
  }, [fileId, permission, viewerUserId, viewerEmail, enabled]);

  // Track specific interaction
  const trackInteraction = useCallback(
    async (interactionType: InteractionType, metadata?: any) => {
      if (!enabled || !sessionIdRef.current) return;

      try {
        console.log(`[Analytics] 📝 Tracking interaction: ${interactionType}`);
        await trackEvent(fileId, sessionIdRef.current, interactionType, metadata);
      } catch (error) {
        console.error('[Analytics] Failed to track interaction:', error);
      }
    },
    [fileId, enabled]
  );

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    if (!timeTrackerRef.current) return;

    if (document.hidden) {
      timeTrackerRef.current.pause();
      console.log('[Analytics] ⏸️ Tab hidden - paused tracking');
    } else {
      timeTrackerRef.current.resume();
      console.log('[Analytics] ▶️ Tab visible - resumed tracking');
    }
  }, []);

  // Handle before unload (page close/navigate away)
  const handleBeforeUnload = useCallback(() => {
    if (sessionIdRef.current && timeTrackerRef.current) {
      const finalTime = timeTrackerRef.current.getElapsedSeconds();
      // Use sendBeacon for reliable delivery on page unload
      const data = JSON.stringify({
        sessionId: sessionIdRef.current,
        finalTimeSpent: finalTime,
      });
      
      navigator.sendBeacon('/api/analytics/track', data);
      console.log('[Analytics] 👋 Session closed on unload');
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (enabled) {
      initializeTracking();

      // Add event listeners
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        // Cleanup
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);

        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }

        if (timeTrackerRef.current) {
          timeTrackerRef.current.destroy();
        }

        // Close session on unmount
        if (sessionIdRef.current && timeTrackerRef.current) {
          const finalTime = timeTrackerRef.current.getElapsedSeconds();
          closeSession(sessionIdRef.current, finalTime);
          console.log('[Analytics] 🔒 Session closed on unmount');
        }
      };
    }
  }, [enabled, initializeTracking, handleVisibilityChange, handleBeforeUnload]);

  return {
    trackInteraction,
    sessionId: sessionIdRef.current,
  };
}
