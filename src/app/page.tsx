"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { AUTHENTICATED_HOME_ROUTE, UNAUTHENTICATED_HOME_ROUTE } from '@/lib/routes';

export default function HomePage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useUser();

  useEffect(() => {
    if (loading) return;

    router.replace(isAuthenticated ? AUTHENTICATED_HOME_ROUTE : UNAUTHENTICATED_HOME_ROUTE);
  }, [loading, isAuthenticated, router]);

  return <AuthLoadingScreen message="Preparing your workspace..." />;
}
