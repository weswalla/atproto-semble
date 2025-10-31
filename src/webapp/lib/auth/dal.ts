import type { GetProfileResponse } from '@/api-client/ApiClient';
import { cache } from 'react';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:4000';

export const verifySessionOnClient = cache(
  async (): Promise<GetProfileResponse | null> => {
    const response = await fetch(`${appUrl}/api/auth/me`, {
      method: 'GET',
      credentials: 'include', // HttpOnly cookies sent automatically
    });

    if (!response.ok) {
      return null;
    }

    const { user }: { user: GetProfileResponse } = await response.json();

    return user;
  },
);
