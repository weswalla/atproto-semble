import { ServerCookieAuthService } from '@/services/auth/CookieAuthService.server';
import type { GetProfileResponse } from '@/api-client/ApiClient';

type UserProfile = GetProfileResponse;

export async function getServerAuthStatus(): Promise<{
  isAuthenticated: boolean;
  user: UserProfile | null;
  error: string | null;
}> {
  try {
    const { accessToken } = await ServerCookieAuthService.getTokens();

    if (!accessToken || ServerCookieAuthService.isTokenExpired(accessToken)) {
      return {
        isAuthenticated: false,
        user: null,
        error: 'No valid access token',
      };
    }

    // Make direct API call with cookie header for server-side
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
    const response = await fetch(`${baseUrl}/api/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `accessToken=${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        isAuthenticated: false,
        user: null,
        error: `API request failed: ${response.status}`,
      };
    }

    const user: UserProfile = await response.json();

    return {
      isAuthenticated: true,
      user,
      error: null,
    };
  } catch (error: any) {
    return {
      isAuthenticated: false,
      user: null,
      error: error.message || 'Authentication failed',
    };
  }
}
