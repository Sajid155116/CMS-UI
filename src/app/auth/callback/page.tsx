'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useUser();
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem('cms_access_token', accessToken);
      localStorage.setItem('cms_refresh_token', refreshToken);
      
      // Fetch user data
      fetchUserData(accessToken);
    } else {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const fetchUserData = async (token: string) => {
    try {
      // Decode token to get user info (JWT payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      };

      localStorage.setItem('cms_user', JSON.stringify(user));
      
      // Redirect to files page
      router.push('/files');
    } catch (error) {
      console.error('Error processing authentication:', error);
      setError('Failed to complete authentication');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center">
            {!error ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                  <svg className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Completing Sign In...
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we complete your authentication
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Authentication Failed
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {error}
                </p>
                <a 
                  href="/login" 
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Back to Login
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
