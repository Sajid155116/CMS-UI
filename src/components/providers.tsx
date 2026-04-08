'use client';

import { ReactNode, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
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
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          className: 'rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:text-white',
          success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
        }}
      />
    </UserProvider>
  );
}
