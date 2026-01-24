import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET(request: NextRequest) {
  try {
    console.log('[Preferences GET] Starting...');
    
    // Get the JWT token
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    console.log('[Preferences GET] Token:', token ? 'exists' : 'null');
    
    if (!token?.id) {
      console.error('[Preferences GET] No token or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Preferences GET] User ID:', token.id);

    // Get all cookies and find session token
    const cookies = request.cookies.getAll();
    console.log('[Preferences GET] All cookies:', cookies.map(c => c.name).join(', '));
    
    const sessionCookie = cookies.find(c => 
      c.name === 'next-auth.session-token' ||
      c.name === '__Secure-next-auth.session-token' ||
      c.name.includes('authjs.session-token')
    );

    if (!sessionCookie) {
      console.error('[Preferences GET] No session cookie found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Preferences GET] Using cookie:', sessionCookie.name);

    const response = await fetch(`${API_URL}/users/preferences`, {
      headers: {
        Authorization: `Bearer ${sessionCookie.value}`,
      },
    });

    console.log('[Preferences GET] Backend response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('[Preferences GET] Backend error:', error);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log('[Preferences GET] Success:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Preferences GET] Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Preferences PATCH] Starting with body:', body);
    
    // Get the JWT token
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    console.log('[Preferences PATCH] Token:', token ? 'exists' : 'null');
    
    if (!token?.id) {
      console.error('[Preferences PATCH] No token or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Preferences PATCH] User ID:', token.id);

    // Get all cookies and find session token
    const cookies = request.cookies.getAll();
    const sessionCookie = cookies.find(c => 
      c.name === 'next-auth.session-token' ||
      c.name === '__Secure-next-auth.session-token' ||
      c.name.includes('authjs.session-token')
    );

    if (!sessionCookie) {
      console.error('[Preferences PATCH] No session cookie found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Preferences PATCH] Using cookie:', sessionCookie.name);

    const response = await fetch(`${API_URL}/users/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionCookie.value}`,
      },
      body: JSON.stringify(body),
    });

    console.log('[Preferences PATCH] Backend response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('[Preferences PATCH] Backend error:', error);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log('[Preferences PATCH] Success:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Preferences PATCH] Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
