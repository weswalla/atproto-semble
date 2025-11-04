import {
  isPWA,
  getCookieForPWA,
  setCookieForPWA,
} from '@/lib/auth/pwa-cookie-handler';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:4000';

export class ClientCookieAuthService {
  // Note: With HttpOnly cookies, we cannot read tokens from document.cookie in regular browser
  // But in PWA context, we may need to handle cookies differently
  // All auth logic (checking status, refreshing tokens) is handled by /api/auth/me endpoint

  // Check if we have any auth indicators (for PWA context)
  static hasAuthIndicators(): boolean {
    if (isPWA()) {
      return !!(
        getCookieForPWA('accessToken') || getCookieForPWA('refreshToken')
      );
    }
    // In regular browser, we can't check HttpOnly cookies
    return true; // Let the server-side check handle it
  }

  // Clear cookies via API (logout)
  static async clearTokens(): Promise<void> {
    try {
      const response = await fetch(`${appUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-PWA-Context': isPWA() ? 'true' : 'false',
        },
      });

      if (!response.ok) {
        console.warn(
          'Logout API call failed, but continuing with client-side logout',
        );
      }

      // In PWA context, also clear any client-side cookies
      if (isPWA()) {
        document.cookie =
          'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax';
        document.cookie =
          'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax';
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Don't throw - we still want to clear the UI state

      // Still try to clear PWA cookies on error
      if (isPWA()) {
        document.cookie =
          'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax';
        document.cookie =
          'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax';
      }
    }
  }
}
