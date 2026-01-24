import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log('[Auth Verify] Received request for email:', email);

    if (!email || !password) {
      console.error('[Auth Verify] Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Call NestJS backend to verify credentials
    console.log('[Auth Verify] Calling backend:', `${API_URL}/users/login`);
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    console.log('[Auth Verify] Backend response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('[Auth Verify] Backend error:', error);
      return NextResponse.json(
        { error: error.message || 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = await response.json();
    console.log('[Auth Verify] Login successful for user:', user.email);
    return NextResponse.json(user);
  } catch (error) {
    console.error('[Auth Verify] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
