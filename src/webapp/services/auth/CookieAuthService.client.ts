export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export class ClientCookieAuthService {
  // Client-side: read from document.cookie
  static getTokens(): AuthTokens {
    if (typeof window === 'undefined') {
      return { accessToken: null, refreshToken: null };
    }

    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
      }
      return null;
    };

    return {
      accessToken: getCookie('accessToken'),
      refreshToken: getCookie('refreshToken'),
    };
  }

  // Check if token is expired
  static isTokenExpired(token: string | null, bufferMinutes: number = 5): boolean {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      const bufferTime = bufferMinutes * 60 * 1000;
      return Date.now() >= expiry - bufferTime;
    } catch {
      return true;
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

  // Refresh tokens
  static async refreshTokens(): Promise<AuthTokens | null> {
    const { refreshToken } = this.getTokens();
    if (!refreshToken) return null;

    try {
      const response = await fetch('/api/users/oauth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Refresh failed');

      const tokens = await response.json();
      await this.setTokens(tokens.accessToken, tokens.refreshToken);
      return tokens;
    } catch {
      await this.clearTokens();
      return null;
    }
  }
}
