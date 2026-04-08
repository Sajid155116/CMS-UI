export const AUTH_PUBLIC_ROUTES = ['/login', '/signup'] as const;
export const AUTH_PROTECTED_ROUTES = ['/dashboard', '/files'] as const;

export const AUTHENTICATED_HOME_ROUTE = '/dashboard';
export const UNAUTHENTICATED_HOME_ROUTE = '/login';

export function isPublicRoute(pathname: string) {
  return AUTH_PUBLIC_ROUTES.includes(pathname as (typeof AUTH_PUBLIC_ROUTES)[number]);
}

export function isProtectedRoute(pathname: string) {
  return AUTH_PROTECTED_ROUTES.includes(pathname as (typeof AUTH_PROTECTED_ROUTES)[number]);
}
