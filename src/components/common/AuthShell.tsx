'use client';

import { ReactNode } from 'react';

interface AuthShellProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.16),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_30px_100px_-50px_rgba(15,23,42,0.65)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden flex-col justify-between bg-slate-950 px-8 py-8 text-white lg:flex">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-sky-300/80">CMS Studio</p>
              <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight">{title}</h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">{subtitle}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Designed for fast navigation, clear actions, and low-friction file operations.
            </div>
          </div>
          <div className="p-6 sm:p-8 lg:p-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
