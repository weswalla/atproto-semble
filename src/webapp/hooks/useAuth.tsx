'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { GetProfileResponse } from '@/api-client/ApiClient';
import { ClientCookieAuthService } from '@/services/auth/CookieAuthService.client';
import { verifySessionOnClient } from '@/lib/auth/dal';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname(); // to prevent redirecting to login on landing page

  const refreshAuth = async () => {
    await query.refetch();
  };

  const logout = async () => {
    await ClientCookieAuthService.clearTokens();
    queryClient.clear();
    router.push('/login');
  };

  const query = useQuery<GetProfileResponse | null>({
    queryKey: ['authenticated user'],
    queryFn: async () => {
      const session = await verifySessionOnClient();
      return session;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    // Don't auto-logout on Safari iOS immediately after auth success
    // Give it time for cookies to be properly set
    if (query.isError && !query.isLoading && pathname !== '/') {
      // Add a small delay for Safari iOS cookie handling
      const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                          /Safari/.test(navigator.userAgent) && 
                          !/Chrome/.test(navigator.userAgent);
      
      if (isSafariIOS) {
        setTimeout(() => {
          // Re-check auth status before logging out
          query.refetch().then((result) => {
            if (!result.data) {
              logout();
            }
          });
        }, 1000);
      } else {
        logout();
      }
    }
  }, [query.isError, logout, query]);

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
