'use client';

import { ReactNode, useEffect } from 'react';
import { UserProvider, useUser } from '@/contexts/UserContext';
import { apiClient } from '@/lib/api-client';

function ApiClientInitializer({ children }: { children: ReactNode }) {
  const { accessToken, refreshAccessToken } = useUser();

  useEffect(() => {
    // Initialize API client with token getter and refresh function
    apiClient.initialize(
      () => accessToken,
      () => refreshAccessToken()
    );
  }, [accessToken, refreshAccessToken]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <ApiClientInitializer>{children}</ApiClientInitializer>
    </UserProvider>
  );
}
