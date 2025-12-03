/**
 * Session management utilities
 * Handles user session storage and retrieval
 */

export interface SessionUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the current user from session storage
 */
export const getSessionUser = (): SessionUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      return null;
    }
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Failed to parse session user:', error);
    return null;
  }
};

/**
 * Set the current user in session storage
 */
export const setSessionUser = (user: SessionUser) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('user', JSON.stringify(user));
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('userUpdated', { detail: user }));
  } catch (error) {
    console.error('Failed to store session user:', error);
  }
};

/**
 * Clear the session
 */
export const clearSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('userUpdated'));
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getSessionUser() !== null;
};

/**
 * Get user ID from session for API calls
 */
export const getUserIdForAPI = (): string | null => {
  const user = getSessionUser();
  return user?._id || null;
};

