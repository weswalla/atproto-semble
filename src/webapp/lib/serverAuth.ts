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
      const reason = !accessToken ? 'No access token' : 'Access token expired';
      console.log(`[serverAuth] Authentication failed: ${reason}`);
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
      console.log(`[serverAuth] Profile API request failed with status: ${response.status}`);
      return {
        isAuthenticated: false,
        user: null,
        error: `API request failed: ${response.status}`,
      };
    }

    const user: UserProfile = await response.json();
    console.log(`[serverAuth] Server-side authentication successful for user: ${user.handle} (${user.id})`);

    return {
      isAuthenticated: true,
      user,
      error: null,
    };
  } catch (error: any) {
    console.log(`[serverAuth] Authentication error: ${error.message || 'Unknown error'}`);
    return {
      isAuthenticated: false,
      user: null,
      error: error.message || 'Authentication failed',
    };
  }
}
