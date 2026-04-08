'use client';

import { ReactNode } from 'react';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="h-screen overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto flex h-full max-w-[1500px] flex-col overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-5 lg:px-6 lg:py-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
