'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AUTHENTICATED_HOME_ROUTE, UNAUTHENTICATED_HOME_ROUTE } from '@/lib/routes';
import { getJwtExpiryMs } from '@/lib/jwt';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface UserContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  setTokens: (accessToken: string, refreshToken: string, user: User) => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const TOKEN_KEY = 'cms_access_token';
const REFRESH_TOKEN_KEY = 'cms_refresh_token';
const USER_KEY = 'cms_user';
const REFRESH_SKEW_MS = 60_000;

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const refreshTimerRef = useRef<number | null>(null);

  const clearRefreshTimer = () => {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const clearStoredSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const hardLogout = async (redirectToLogin: boolean) => {
    clearRefreshTimer();
    clearStoredSession();

    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);

    if (redirectToLogin) {
      router.replace(UNAUTHENTICATED_HOME_ROUTE);
    }
  };

  const performRefreshAccessToken = async (overrideRefreshToken?: string): Promise<string | null> => {
    const tokenToRefresh = overrideRefreshToken ?? refreshToken;

    if (!tokenToRefresh) {
      return null;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiUrl}/users/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokenToRefresh }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      updateSession(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      await hardLogout(true);
      return null;
    }
  };

  const scheduleRefresh = (nextAccessToken: string, nextRefreshToken: string) => {
    clearRefreshTimer();

    const expiryMs = getJwtExpiryMs(nextAccessToken);
    if (!expiryMs) {
      return;
    }

    const delayMs = Math.max(expiryMs - Date.now() - REFRESH_SKEW_MS, 0);
    refreshTimerRef.current = window.setTimeout(() => {
      void performRefreshAccessToken(nextRefreshToken);
    }, delayMs);
  };

  const updateSession = (nextAccessToken: string, nextRefreshToken: string, nextUser?: User) => {
    localStorage.setItem(TOKEN_KEY, nextAccessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);

    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    }

    setAccessToken(nextAccessToken);
    setRefreshToken(nextRefreshToken);
    scheduleRefresh(nextAccessToken, nextRefreshToken);
  };

  useEffect(() => {
    const initializeSession = async () => {
      const storedAccessToken = localStorage.getItem(TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (!storedAccessToken || !storedRefreshToken || !storedUser) {
        setLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser) as User;
        const accessExpiryMs = getJwtExpiryMs(storedAccessToken);
        const refreshExpiryMs = getJwtExpiryMs(storedRefreshToken);

        if (refreshExpiryMs !== null && refreshExpiryMs <= Date.now()) {
          await hardLogout(false);
          return;
        }

        updateSession(storedAccessToken, storedRefreshToken, parsedUser);

        if (accessExpiryMs !== null && accessExpiryMs <= Date.now()) {
          await performRefreshAccessToken(storedRefreshToken);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        await hardLogout(false);
      } finally {
        setLoading(false);
      }
    };

    void initializeSession();

    return () => {
      clearRefreshTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiUrl}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      updateSession(data.accessToken, data.refreshToken, data.user);
      router.replace(AUTHENTICATED_HOME_ROUTE);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiUrl}/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      const data = await response.json();
      updateSession(data.accessToken, data.refreshToken, data.user);
      router.replace(AUTHENTICATED_HOME_ROUTE);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const setTokens = (newAccessToken: string, newRefreshToken: string, newUser: User) => {
    updateSession(newAccessToken, newRefreshToken, newUser);
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        await fetch(`${apiUrl}/users/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await hardLogout(true);
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    return performRefreshAccessToken();
  };

  const value: UserContextType = {
    user,
    accessToken,
    refreshToken,
    loading,
    login,
    signup,
    logout,
    refreshAccessToken,
    setTokens,
    isAuthenticated: !!user && !!accessToken,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
