import { ServerCookieAuthService } from '@/services/auth/CookieAuthService.server';
import { ApiClient } from '@/api-client/ApiClient';

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
}

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

    const apiClient = new ApiClient(
      process.env.API_BASE_URL || 'http://127.0.0.1:3000'
    );
    
    const user = await apiClient.getMyProfile();
    
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
