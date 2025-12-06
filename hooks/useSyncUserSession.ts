/**
 * Hook to sync user data from cookies to localStorage
 * Runs immediately on mount to ensure user data is available
 */

import { useEffect } from 'react';
import { syncUserFromCookie, clearLocalStorage } from '@/lib/utils/cookieUtils';

export function useSyncUserSession() {
  useEffect(() => {
    // Try to sync user data from cookies immediately
    // This handles both OAuth redirects and regular page loads
    const hasUserData = syncUserFromCookie();

    if (hasUserData) {
      console.log('✅ User session synced from cookies on mount');
      // Dispatch event to notify other components that user data is now available
      window.dispatchEvent(new CustomEvent('userUpdated'));
    } else {
      console.log('ℹ️  No user data in cookies (user likely not logged in)');
    }
  }, []);
}
