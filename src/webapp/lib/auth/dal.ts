import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isTokenExpiringSoon } from './token';

export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  // no session tokens — redirect to login
  if (!accessToken && !refreshToken) {
    redirect('/login');
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';

  // token expired or about to expire
  if ((!accessToken || isTokenExpiringSoon(accessToken)) && refreshToken) {
    const refreshResponse = await fetch(
      `${backendUrl}/api/users/oauth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      },
    );

    if (!refreshResponse.ok) {
      // clear invalid tokens and redirect to login
      cookieStore.delete('accessToken');
      cookieStore.delete('refreshToken');
      redirect('/login');
    }

    const newTokens = await refreshResponse.json();
    const newAccessToken = newTokens.accessToken;

    // update cookie
    cookieStore.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });

    return { isAuthenticated: true };
  }

  // if access token is valid
  return { isAuthenticated: true };
});

export const getUser = cache(async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!accessToken && !refreshToken) redirect('/login');

  const backendUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';

  // Forward cookies manually
  const cookieHeader = [
    accessToken ? `accessToken=${accessToken}` : null,
    refreshToken ? `refreshToken=${refreshToken}` : null,
  ]
    .filter(Boolean)
    .join('; ');

  const res = await fetch(`${backendUrl}/api/users/me`, {
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader, // forward the cookies
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    redirect('/login');
  }

  const user = await res.json();
  return user;
});
