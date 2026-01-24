import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('[NextAuth] Missing credentials');
          return null;
        }

        try {
          console.log('[NextAuth] Authorizing user:', credentials.email);
          const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
          console.log('[NextAuth] API URL:', apiUrl);
          
          // Call our API to verify credentials
          const response = await fetch(`${apiUrl}/api/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          console.log('[NextAuth] Verify response status:', response.status);

          if (!response.ok) {
            const errorData = await response.text();
            console.error('[NextAuth] Verify failed:', errorData);
            return null;
          }

          const user = await response.json();
          console.log('[NextAuth] Authorization successful:', user);
          
          // Ensure the user object has the required fields
          if (!user.id || !user.email) {
            console.error('[NextAuth] Invalid user object:', user);
            return null;
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
          };
        } catch (error) {
          console.error('[NextAuth] Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log('[NextAuth JWT] Adding user to token:', user);
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        console.log('[NextAuth Session] Creating session from token:', token);
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
