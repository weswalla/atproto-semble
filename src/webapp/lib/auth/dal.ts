import type { GetProfileResponse } from '@/api-client/ApiClient';
import { ClientCookieAuthService } from '@/services/auth';
import { redirect } from 'next/navigation';
import { cache } from 'react';

const appUrl = process.env.APP_URL || 'http://127.0.0.1:4000';

export const verifySession = cache(
  async (): Promise<GetProfileResponse | null> => {
    const response = await fetch(`${appUrl}/api/auth/me`, {
      method: 'GET',
      credentials: 'include', // HttpOnly cookies sent automatically
    });

    if (!response.ok) {
      await ClientCookieAuthService.clearTokens();
      redirect('/login');
    }

    const data = await response.json();

    return data.user as GetProfileResponse;
  },
);
