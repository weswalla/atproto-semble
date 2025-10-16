export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export class ClientCookieAuthService {
  // Note: With HttpOnly cookies, we cannot read tokens from document.cookie
  // The browser will automatically send cookies with requests using credentials: 'include'
  // To check auth status, make an API call instead of reading cookies directly

  static async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Set cookies via API
  static async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, refreshToken }),
      credentials: 'include',
    });
  }

  // Clear cookies via API
  static async clearTokens(): Promise<void> {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  }

  // Refresh tokens (HttpOnly refreshToken cookie sent automatically)
  static async refreshTokens(): Promise<boolean> {
    try {
      const response = await fetch('/api/users/oauth/refresh', {
        method: 'POST',
        credentials: 'include', // Sends HttpOnly cookies automatically
      });

      if (!response.ok) {
        await this.clearTokens();
        return false;
      }

      // New tokens are set as HttpOnly cookies by the backend
      return true;
    } catch {
      await this.clearTokens();
      return false;
    }
  }
}
