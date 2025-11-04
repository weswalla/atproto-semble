import { NextRequest, NextResponse } from 'next/server';
import type { GetProfileResponse } from '@/api-client/ApiClient';
import { cookies } from 'next/headers';
import { isTokenExpiringSoon } from '@/lib/auth/token';

const ENABLE_REFRESH_LOGGING = true;

const backendUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';

type AuthResult = {
  isAuth: boolean;
  user?: GetProfileResponse;
};

// Prevent concurrent refresh attempts
let refreshPromise: Promise<Response> | null = null;

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;

    // No tokens at all - not authenticated
    if (!accessToken && !refreshToken) {
      return NextResponse.json<AuthResult>({ isAuth: false }, { status: 401 });
    }

    // Check if accessToken is expired/missing or expiring soon
    if ((!accessToken || isTokenExpiringSoon(accessToken)) && refreshToken) {
      if (ENABLE_REFRESH_LOGGING) {
        const tokenPreview = '...' + refreshToken.slice(-8);
        console.log(
          `[auth/me] Access token missing/expiring, attempting refresh with token: ${tokenPreview}`,
        );
      }

      // Use mutex to prevent concurrent refresh attempts
      if (!refreshPromise) {
        refreshPromise = performTokenRefresh(refreshToken, request);
      }

      try {
        const result = await refreshPromise;
        if (ENABLE_REFRESH_LOGGING) {
          console.log(`[auth/me] Token refresh completed successfully`);
        }
        return result;
      } catch (error) {
        if (ENABLE_REFRESH_LOGGING) {
          console.log(`[auth/me] Token refresh error: ${error}`);
        }
        console.error('Token refresh error:', error);
        return NextResponse.json<AuthResult>(
          { isAuth: false },
          { status: 500 },
        );
      } finally {
        refreshPromise = null;
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
        return NextResponse.json<AuthResult>(
          { isAuth: false },
          { status: profileResponse.status },
        );
      }

      const user = await profileResponse.json();
      return NextResponse.json<AuthResult>({ isAuth: true, user });
    } catch (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json<AuthResult>({ isAuth: false }, { status: 500 });
    }
  } catch (error) {
    console.error('Auth me error:', error);
    refreshPromise = null; // Reset on error
    return NextResponse.json<AuthResult>({ isAuth: false }, { status: 500 });
  }
}

async function performTokenRefresh(
  refreshToken: string,
  request: NextRequest,
): Promise<Response> {
  if (ENABLE_REFRESH_LOGGING) {
    console.log(`[auth/me] Sending refresh request to backend`);
  }

  // Proxy the refresh request completely to backend
  const refreshResponse = await fetch(`${backendUrl}/api/users/oauth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: request.headers.get('cookie') || '',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!refreshResponse.ok) {
    if (ENABLE_REFRESH_LOGGING) {
      console.log(
        `[auth/me] Backend refresh failed with status: ${refreshResponse.status}. Message: ${await refreshResponse.text()}`,
      );
    }
    // Refresh failed — clear tokens and mark as unauthenticated
    const response = NextResponse.json<AuthResult>(
      { isAuth: false },
      { status: 401 },
    );
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    return response;
  }

  // Get new tokens from response
  const newTokens = await refreshResponse.json();
  const accessToken = newTokens.accessToken;

  // Fetch profile with new token
  const profileResponse = await fetch(`${backendUrl}/api/users/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `accessToken=${accessToken}`,
    },
  });

  if (!profileResponse.ok) {
    return NextResponse.json<AuthResult>({ isAuth: false }, { status: 401 });
  }

  const user = await profileResponse.json();
  // Return user profile with backend's Set-Cookie headers
  return new Response(JSON.stringify({ isAuth: true, user }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': refreshResponse.headers.get('set-cookie') || '',
    },
  });
}
