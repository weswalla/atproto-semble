import { cookies } from 'next/headers';

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export class ServerCookieAuthService {
  // Server-side: read from Next.js cookies
  static async getTokens(): Promise<AuthTokens> {
    const cookieStore = await cookies();
    return {
      accessToken: cookieStore.get('accessToken')?.value || null,
      refreshToken: cookieStore.get('refreshToken')?.value || null,
    };
  }

  // Check if token is expired (same logic as client)
  static isTokenExpired(
    token: string | null,
    bufferMinutes: number = 5,
  ): boolean {
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
}
