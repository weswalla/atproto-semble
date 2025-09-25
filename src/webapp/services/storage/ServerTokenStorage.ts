import { AuthTokens, TokenStorage } from '../TokenManager';

export class ServerTokenStorage implements TokenStorage {
  constructor(private cookiesStore: any) {}

  getTokens(): AuthTokens {
    return {
      accessToken: this.cookiesStore.get('accessToken')?.value || null,
      refreshToken: this.cookiesStore.get('refreshToken')?.value || null,
    };
  }

  async setTokens(): Promise<void> {
    // Server-side can't set tokens - handled by client-side sync
    throw new Error('Server-side token refresh not supported');
  }

  clearTokens(): void {
    // Server-side can't clear tokens directly
    throw new Error('Server-side token clearing not supported');
  }
}
