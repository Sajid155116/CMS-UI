import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/test-auth.html', '/'];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path));

  // Allow all API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For client-side auth (tokens in localStorage), we can't check here
  // Authentication will be handled by UserContext on the client
  // Just allow the request and let the page component redirect if needed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
