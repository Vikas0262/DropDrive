/**
 * Offline System Initialization
 * 
 * This file initializes the offline system when imported.
 * Import this in your root layout or _app.tsx to enable offline functionality.
 */

'use client';

import { useEffect } from 'react';
import { syncManager } from '@/lib/offline/syncManager';
import { indexedDB as db } from '@/lib/offline/indexedDB';

/**
 * Initialize offline system
 */
export function OfflineInit() {
  useEffect(() => {
    // Initialize IndexedDB
    if (typeof window !== 'undefined') {
      db.init()
        .then(() => {
          console.log('✅ Offline system initialized');
        })
        .catch((error) => {
          console.error('❌ Failed to initialize offline system:', error);
        });
    }

    // Cleanup on unmount
    return () => {
      // syncManager cleanup happens in its own destroy method if needed
    };
  }, []);

  return null; // This component doesn't render anything
}
