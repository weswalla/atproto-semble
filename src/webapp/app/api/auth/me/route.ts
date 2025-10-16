import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Helper to check if token is expired or will expire soon
function isTokenExpiringSoon(
  token: string | null | undefined,
  bufferMinutes: number = 5,
): boolean {
  if (!token) return true;

  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString(),
    );
    const expiry = payload.exp * 1000;
    const bufferTime = bufferMinutes * 60 * 1000;
    return Date.now() >= expiry - bufferTime;
  } catch {
    return true;
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;

    // No tokens at all - not authenticated
    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    // Check if accessToken is expired or expiring soon (< 5 min)
    if (isTokenExpiringSoon(accessToken, 5) && refreshToken) {
      try {
        // Call backend to refresh tokens
        const backendUrl =
          process.env.API_BASE_URL || 'http://127.0.0.1:3000';
        const refreshResponse = await fetch(
          `${backendUrl}/api/users/oauth/refresh`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Cookie: `refreshToken=${refreshToken}`,
            },
            body: JSON.stringify({ refreshToken }),
          },
        );

        if (!refreshResponse.ok) {
          // Refresh failed - clear cookies and return 401
          const response = NextResponse.json(
            { error: 'Token refresh failed' },
            { status: 401 },
          );
          response.cookies.delete('accessToken');
          response.cookies.delete('refreshToken');
          return response;
        }

        const newTokens = await refreshResponse.json();
        accessToken = newTokens.accessToken;

        // Fetch profile with new token
        const profileResponse = await fetch(`${backendUrl}/api/users/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `accessToken=${accessToken}`,
          },
        });

        if (!profileResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: profileResponse.status },
          );
        }

        const user = await profileResponse.json();

        // Create response with user profile and set new cookies
        const response = NextResponse.json({ user });

        response.cookies.set('accessToken', newTokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 900, // 15 minutes
          path: '/',
        });

        response.cookies.set('refreshToken', newTokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 604800, // 7 days
          path: '/',
        });

        return response;
      } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 500 },
        );
      }
    }

    // AccessToken is valid - fetch profile
    try {
      const backendUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3000';
      const profileResponse = await fetch(`${backendUrl}/api/users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `accessToken=${accessToken}`,
        },
      });

      if (!profileResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch profile' },
          { status: profileResponse.status },
        );
      }

      const user = await profileResponse.json();
      return NextResponse.json({ user });
    } catch (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
