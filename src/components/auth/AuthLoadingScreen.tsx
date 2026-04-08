'use client';

export function AuthLoadingScreen({ message = 'Checking your session...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      <div className="rounded-3xl border border-white/60 bg-white/85 px-8 py-10 text-center shadow-2xl shadow-blue-950/10 backdrop-blur dark:border-white/10 dark:bg-gray-900/80">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
          <svg className="h-7 w-7 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{message}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Preparing your workspace</p>
      </div>
    </div>
  );
}
