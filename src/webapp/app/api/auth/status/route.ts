import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
      const expiry = payload.exp * 1000;
      const isExpired = Date.now() >= expiry;

      if (isExpired) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }

      return NextResponse.json({ authenticated: true }, { status: 200 });
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
