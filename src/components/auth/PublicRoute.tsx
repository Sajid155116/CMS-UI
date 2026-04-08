'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { AUTHENTICATED_HOME_ROUTE } from '@/lib/routes';

interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function PublicRoute({ children, redirectTo = AUTHENTICATED_HOME_ROUTE }: PublicRouteProps) {
  const router = useRouter();
  const { loading, isAuthenticated } = useUser();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [loading, isAuthenticated, redirectTo, router]);

  if (loading) {
    return <AuthLoadingScreen message="Checking your session..." />;
  }

  if (isAuthenticated) {
    return <AuthLoadingScreen message="Opening your dashboard..." />;
  }

  return <>{children}</>;
}
