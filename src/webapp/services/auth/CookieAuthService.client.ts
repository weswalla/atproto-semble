const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:4000';

export class ClientCookieAuthService {
  // Note: With HttpOnly cookies, we cannot read tokens from document.cookie
  // The browser automatically sends cookies with requests using credentials: 'include'
  // All auth logic (checking status, refreshing tokens) is handled by /api/auth/me endpoint

  // Clear cookies via API (logout)
  static async clearTokens(): Promise<void> {
    try {
      const response = await fetch(`${appUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn(
          'Logout API call failed, but continuing with client-side logout',
        );
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Don't throw - we still want to clear the UI state
    }
  }
}
