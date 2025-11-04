import type { GetProfileResponse } from '@/api-client/ApiClient';
import { cache } from 'react';
import { isPWA } from './pwa-cookie-handler';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:4000';

// Flag-based approach to prevent concurrent auth requests
let isRefreshing = false;
let refreshPromise: Promise<GetProfileResponse | null> | null = null;

export const verifySessionOnClient = cache(
  async (): Promise<GetProfileResponse | null> => {
    if (isRefreshing && refreshPromise) {
      console.log('Auth refresh already in progress, waiting...');
      return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${appUrl}/api/auth/me`, {
          method: 'GET',
          credentials: 'include', // HttpOnly cookies sent automatically
          headers: {
            'X-PWA-Context': isPWA() ? 'true' : 'false',
          },
        });

        if (!response.ok) {
          return null;
        }

        const { user }: { user: GetProfileResponse } = await response.json();

        return user;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },
);
