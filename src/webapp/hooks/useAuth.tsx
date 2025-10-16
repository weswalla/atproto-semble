'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ClientCookieAuthService } from '@/services/auth';
import { ApiClient } from '@/api-client/ApiClient';

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextType extends AuthState {
  login: (handle: string) => Promise<{ authUrl: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  checkAuthStatus: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    accessToken: null,
    refreshToken: null,
  });
  
  const router = useRouter();

  // Check auth status from cookies (lightweight)
  const checkAuthStatus = useCallback((): boolean => {
    const { accessToken } = ClientCookieAuthService.getTokens();
    return !!accessToken && !ClientCookieAuthService.isTokenExpired(accessToken);
  }, []);

  // Refresh authentication (handles token refresh + user fetch)
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const { accessToken, refreshToken } = ClientCookieAuthService.getTokens();

      // No tokens at all
      if (!accessToken && !refreshToken) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
        }));
        return false;
      }

      // Token expired, try refresh
      if (ClientCookieAuthService.isTokenExpired(accessToken)) {
        const newTokens = await ClientCookieAuthService.refreshTokens();
        if (!newTokens) {
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
          }));
          return false;
        }
      }

      // Fetch user profile
      const apiClient = new ApiClient(
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000'
      );
      
      const user = await apiClient.getMyProfile();
      const currentTokens = ClientCookieAuthService.getTokens();

      setAuthState({
        isAuthenticated: true,
        user,
        accessToken: currentTokens.accessToken,
        refreshToken: currentTokens.refreshToken,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error('Auth refresh failed:', error);
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
      }));
      return false;
    }
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // Periodic token refresh
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const interval = setInterval(async () => {
      const { accessToken } = ClientCookieAuthService.getTokens();
      if (ClientCookieAuthService.isTokenExpired(accessToken, 10)) {
        await refreshAuth();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, refreshAuth]);

  const login = useCallback(async (handle: string) => {
    const apiClient = new ApiClient(
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000'
    );
    return await apiClient.initiateOAuthSignIn({ handle });
  }, []);

  const logout = useCallback(async () => {
    try {
      await ClientCookieAuthService.clearTokens();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        accessToken: null,
        refreshToken: null,
      });
      router.push('/login');
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        refreshAuth,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
