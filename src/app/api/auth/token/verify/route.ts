import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('[Token Verify] Request headers:', Object.fromEntries(request.headers));
    console.log('[Token Verify] Cookies:', request.cookies.getAll().map(c => c.name));
    
    const session = await auth();

    console.log('[Token Verify] Session:', session ? 'exists' : 'null');

    if (!session || !session.user) {
      console.error('[Token Verify] No session or user');
      return NextResponse.json(
        { error: 'Unauthorized', valid: false },
        { status: 401 }
      );
    }

    console.log('[Token Verify] Valid session for user:', session.user.email);

    return NextResponse.json({
      valid: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });
  } catch (error) {
    console.error('[Token Verify] Exception:', error);
    return NextResponse.json(
      { error: 'Invalid token', valid: false },
      { status: 401 }
    );
  }
}
