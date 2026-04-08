'use client';

interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-lg dark:border-slate-800 dark:bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-r-slate-950 dark:border-slate-800 dark:border-r-white" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
      </div>
    </div>
  );
}
