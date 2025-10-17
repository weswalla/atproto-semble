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
import { ClientCookieAuthService } from '@/services/auth';
import { ApiClient } from '@/api-client/ApiClient';
import type { GetProfileResponse } from '@/api-client/ApiClient';

type UserProfile = GetProfileResponse;

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
}

interface AuthContextType extends AuthState {
  login: (handle: string) => Promise<{ authUrl: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  const router = useRouter();

  // Refresh authentication (fetch user profile with automatic token refresh)
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      // Call /api/auth/me which handles token refresh + profile fetch
      // HttpOnly cookies sent automatically with credentials: 'include'
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
        return false;
      }

      const { user } = await response.json();

      setAuthState({
        isAuthenticated: true,
        user,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error('Auth refresh failed:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
      return false;
    }
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // Periodic auth check (every 5 minutes)
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const interval = setInterval(
      async () => {
        await refreshAuth();
      },
      5 * 60 * 1000,
    ); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, refreshAuth]);

  const login = useCallback(async (handle: string) => {
    const apiClient = new ApiClient(
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000',
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
