/**
 * Utility functions for working with cookies on the client side
 */

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  try {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        const value = c.substring(nameEQ.length, c.length);
        // Try to decode the value if it's encoded
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }
    }
  } catch (error) {
    console.error('Error reading cookie:', error);
  }
  return null;
}

/**
 * Extract user data from the 'userData' or 'user' cookie and sync to localStorage
 * This is useful after OAuth redirects to ensure localStorage is in sync with server cookies
 */
export function syncUserFromCookie(): boolean {
  try {
    // First try to get from the non-httpOnly userData cookie
    const userDataCookie = getCookie('userData');
    if (userDataCookie) {
      const userData = JSON.parse(userDataCookie);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('📝 Synced user from userData cookie:', userData.email);
      return true;
    }

    // Fallback to user cookie (won't work if httpOnly, but keep for compatibility)
    const userCookie = getCookie('user');
    if (userCookie) {
      const userData = JSON.parse(userCookie);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('📝 Synced user from user cookie:', userData.email);
      return true;
    }
  } catch (error) {
    console.error('Failed to sync user from cookie:', error);
  }
  return false;
}

/**
 * Clear old session data from localStorage
 * Useful when logging out or when a new login happens
 */
export function clearLocalStorage(): void {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.clear();
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}
