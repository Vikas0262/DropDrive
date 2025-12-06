"use client"

import React, { ReactNode, useEffect } from 'react'
import { useSyncUserSession } from '@/hooks/useSyncUserSession'
import { getSessionUser } from '@/lib/auth/session'
import { syncUserFromCookie } from '@/lib/utils/cookieUtils'

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  // Sync user session on mount and when OAuth redirects happen
  useSyncUserSession()

  // Additional effect to ensure user data is available immediately after OAuth
  useEffect(() => {
    const checkUserData = async () => {
      // Try to sync from cookies first
      const synced = syncUserFromCookie()
      
      if (synced) {
        console.log('✅ Session Provider: User synced from cookies')
        window.dispatchEvent(new CustomEvent('userUpdated'))
        return
      }

      // Try to get from API as fallback
      try {
        const response = await fetch('/api/auth/sync')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user))
            console.log('✅ Session Provider: User synced from API')
            window.dispatchEvent(new CustomEvent('userUpdated'))
          }
        }
      } catch (error) {
        console.error('Session Provider: Error syncing user:', error)
      }
    }

    // Check immediately
    checkUserData()

    // Also check after a short delay to catch async updates from hooks
    const timer = setTimeout(() => {
      const user = getSessionUser()
      if (user) {
        console.log('✅ Session Provider: User found in localStorage after delay')
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: user }))
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  return <>{children}</>
}

