/**
 * Authentication utilities for the client-side application
 */

// Check if the user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') {
    return false; // Not authenticated in server-side context
  }

  const accessToken = localStorage.getItem('accessToken');
  return !!accessToken;
};

// Get the access token
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('accessToken');
};

// Get the refresh token
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('refreshToken');
};

// Clear authentication tokens (logout)
export const clearAuth = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};
