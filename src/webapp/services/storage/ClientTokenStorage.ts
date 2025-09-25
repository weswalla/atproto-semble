import { AuthTokens, TokenStorage } from '../TokenManager';

export class ClientTokenStorage implements TokenStorage {
  getTokens(): AuthTokens {
    if (typeof window === 'undefined') {
      return { accessToken: null, refreshToken: null };
    }

    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
    };
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    if (typeof window === 'undefined') return;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Sync with server cookies
    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, refreshToken }),
        credentials: 'include',
      });
    } catch (error) {
      console.warn('Failed to sync tokens with server:', error);
    }
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}
