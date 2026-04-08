'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { UNAUTHENTICATED_HOME_ROUTE } from '@/lib/routes';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = UNAUTHENTICATED_HOME_ROUTE }: ProtectedRouteProps) {
  const router = useRouter();
  const { loading, isAuthenticated } = useUser();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [loading, isAuthenticated, redirectTo, router]);

  if (loading) {
    return <AuthLoadingScreen message="Loading your account..." />;
  }

  if (!isAuthenticated) {
    return <AuthLoadingScreen message="Redirecting to sign in..." />;
  }

  return <>{children}</>;
}
