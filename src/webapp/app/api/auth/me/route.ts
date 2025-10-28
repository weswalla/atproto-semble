import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isTokenExpiringSoon } from '@/lib/auth/token';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;

    // No tokens at all - not authenticated
    if (!accessToken && !refreshToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if accessToken is expired/missing or expiring soon (< 5 min)
    if ((!accessToken || isTokenExpiringSoon(accessToken, 5)) && refreshToken) {
      try {
        // Proxy the refresh request completely to backend
        const backendUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
        const refreshResponse = await fetch(
          `${backendUrl}/api/users/oauth/refresh`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Cookie: request.headers.get('cookie') || '', // Forward all cookies
            },
            body: JSON.stringify({ refreshToken }),
          },
        );

        if (!refreshResponse.ok) {
          // Refresh failed - clear invalid tokens
          const response = new NextResponse(
            JSON.stringify({ error: 'Authentication failed' }),
            { status: 401 },
          );
          response.cookies.delete('accessToken');
          response.cookies.delete('refreshToken');
          return response;
        }

        // Get new tokens from response
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

        // Return user profile with backend's Set-Cookie headers
        return new Response(JSON.stringify({ user }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': refreshResponse.headers.get('set-cookie') || '',
          },
        });
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
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
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
