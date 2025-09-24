import { TokenRefresher } from './TokenManager';

export class ApiTokenRefresher implements TokenRefresher {
  constructor(private baseUrl: string) {}

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  }
}
