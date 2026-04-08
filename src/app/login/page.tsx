'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useUser } from '@/contexts/UserContext';
import { PublicRoute } from '@/components/auth/PublicRoute';
import { AuthShell } from '@/components/common/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Signed in successfully');
    } catch (submitError: any) {
      const message = submitError.message || 'Invalid email or password';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicRoute>
      <AuthShell
        title="Welcome back. Your workspace is waiting."
        subtitle="Manage files, folders, and uploads with a cleaner, faster interface designed for daily use."
      >
        <Card className="border-slate-200/80 bg-white/90 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your account email and password to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="w-full" isLoading={loading}>
                Sign in
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center"
              onClick={() => {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
                window.location.href = `${apiUrl}/users/auth/google`;
              }}
            >
              Continue with Google
            </Button>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Don’t have an account?{' '}
              <Link href="/signup" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-950 dark:text-white">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </AuthShell>
    </PublicRoute>
  );
}
