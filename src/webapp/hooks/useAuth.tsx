'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { GetProfileResponse } from '@/api-client/ApiClient';
import { ClientCookieAuthService } from '@/services/auth/CookieAuthService.client';

interface AuthContextType {
  user: GetProfileResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const refreshAuth = async () => {
    await query.refetch();
  };

  const logout = async () => {
    await ClientCookieAuthService.clearTokens();
    queryClient.removeQueries({ queryKey: ['authenticated user'] });
    router.push('/login');
  };

  const query = useQuery<GetProfileResponse | null>({
    queryKey: ['authenticated user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // HttpOnly cookies sent automatically
      });

      // unauthenticated
      if (!response.ok) {
        throw new Error('Not authenticated');
      }

      const data = await response.json();
      return data.user as GetProfileResponse;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (query.isError) logout();
  }, [query.isError, logout]);

  const contextValue: AuthContextType = {
    user: query.data ?? null,
    isAuthenticated: !!query.data,
    isLoading: query.isLoading,
    refreshAuth,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
