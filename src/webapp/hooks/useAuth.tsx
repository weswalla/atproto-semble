'use client';

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/api-client/ApiClient';
import { getAccessToken, getRefreshToken, clearAuth } from '@/services/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
  login: (handle: string) => Promise<{ authUrl: string }>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const router = useRouter();

  // Create API client instance
  const createApiClient = useCallback(() => {
    return new ApiClient(
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
      () => getAccessToken(),
    );
  }, []);

  // Helper function to check if a JWT token is expired
  const isTokenExpired = (token: string): boolean => {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expiry;
    } catch (e) {
      return true;
    }
  };

  const handleLogout = useCallback(async () => {
    try {
      // Note: No logout endpoint call needed since refresh tokens are handled server-side
      // and will naturally expire
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth state
      clearAuth();
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsAuthenticated(false);

      // Redirect to login
      router.push('/login');
    }
  }, [router]);

  const refreshTokens = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) return false;

    try {
      const apiClient = createApiClient();
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await apiClient.refreshAccessToken({ refreshToken });

      setTokens(newAccessToken, newRefreshToken);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      handleLogout();
      return false;
    }
  }, [refreshToken, createApiClient, handleLogout]);

  useEffect(() => {
    // Check if user is already authenticated
    const storedAccessToken = getAccessToken();
    const storedRefreshToken = getRefreshToken();

    if (storedAccessToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setIsAuthenticated(true);

      // Check if token is expired
      if (isTokenExpired(storedAccessToken) && storedRefreshToken) {
        // Try to refresh the token
        refreshTokens()
          .then((success) => {
            if (success) {
              // Token refreshed, now fetch user data with new token
              const apiClient = createApiClient();
              return apiClient.getMyProfile();
            }
            throw new Error('Token refresh failed');
          })
          .then((userData) => {
            setUser(userData);
          })
          .catch((error) => {
            console.error(
              'Error refreshing token or fetching user data:',
              error,
            );
            handleLogout();
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        // Token is still valid, fetch user data
        const apiClient = createApiClient();
        apiClient
          .getMyProfile()
          .then((userData) => {
            setUser(userData);
          })
          .catch((error) => {
            console.error('Error fetching user data:', error);
            // If token is invalid, log out
            handleLogout();
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    } else {
      setIsLoading(false);
    }
  }, [refreshTokens]);

  // Set up automatic token refresh
  useEffect(() => {
    if (!accessToken || !refreshToken) return;

    const checkTokenExpiration = async () => {
      if (isTokenExpired(accessToken)) {
        await refreshTokens();
      }
    };

    // Check token expiration every minute
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [accessToken, refreshToken, refreshTokens]);

  const login = useCallback(async (handle: string) => {
    try {
      const apiClient = createApiClient();
      return await apiClient.initiateOAuthSignIn({ handle });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [createApiClient]);

  const setTokens = useCallback((accessToken: string, refreshToken: string) => {
    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Update state
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setIsAuthenticated(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        accessToken,
        refreshToken,
        user,
        login,
        logout: handleLogout,
        refreshTokens,
        setTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
