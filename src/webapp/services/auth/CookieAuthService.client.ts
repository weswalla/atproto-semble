export class ClientCookieAuthService {
  // Note: With HttpOnly cookies, we cannot read tokens from document.cookie
  // The browser automatically sends cookies with requests using credentials: 'include'
  // All auth logic (checking status, refreshing tokens) is handled by /api/auth/me endpoint

  // Set cookies via API (used after OAuth login)
  static async setTokens(
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, refreshToken }),
      credentials: 'include',
    });
  }

  // Clear cookies via API (logout)
  static async clearTokens(): Promise<void> {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  }
}
