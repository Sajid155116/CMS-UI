import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/test-auth.html'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Allow all API routes and NextAuth routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for any NextAuth session token
  const cookies = request.cookies.getAll();
  const hasSessionToken = cookies.some(cookie => 
    cookie.name.includes('session-token') || 
    cookie.name.includes('authjs')
  );

  console.log('[Middleware] Path:', pathname);
  console.log('[Middleware] Cookies:', cookies.map(c => c.name).join(', '));
  console.log('[Middleware] Has session:', hasSessionToken);

  if (!hasSessionToken) {
    console.log('[Middleware] No session, redirecting to login');
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  console.log('[Middleware] Session found, allowing access');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
