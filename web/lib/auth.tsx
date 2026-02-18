'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { db } from './instant';
import { logActivity } from '@/lib/activity';

// Allowlist of emails permitted to sign up and sign in.
const ALLOWED_EMAILS = new Set(
  [
    'Machel@odc.co.bw',
    'setswalo.r.kefilwe@gmail.com',
    'moses@odc.co.bw',
    'Sethunya@odc.co.bw',
    'st23019010@biust.ac.bw',
    'ounas.saubi@gmail.com',
    'Nthabiseng@odc.co.bw',
    'Pamela@odc.co.bw',
  ].map((email) => email.toLowerCase())
);

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const ensureAllowedEmail = (email: string) => {
  const normalized = normalizeEmail(email);
  // In development, allow any email so local testing is not blocked.
  if (process.env.NODE_ENV === 'development') {
    return normalized;
  }
  if (!ALLOWED_EMAILS.has(normalized)) {
    throw new Error('This email is not allowed to access the app.');
  }
  return normalized;
};

interface AuthContextType {
  user: any;
  isLoading: boolean;
  requestCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // InstantDB auth hook returns auth state only.
  const { user: authUser, isLoading: authLoading } = db.useAuth();
  const userId = authUser?.id ?? '';
  const prevUserIdRef = useRef<string>('');

  // Fetch the user's profile record (contains role) from the `users` collection.
  // Note: hooks must be called unconditionally; when not signed in we query with an empty id.
  const { data: profileData, isLoading: profileLoading } = db.useQuery({
    users: {
      $: { where: { id: userId } },
    },
  });

  const profile = profileData?.users?.[0];
  const user = authUser ? { ...authUser, role: profile?.role } : null;
  const isLoading = authLoading || (Boolean(authUser) && profileLoading);

  const requestCode = async (email: string) => {
    const normalizedEmail = ensureAllowedEmail(email);
    await db.auth.sendMagicCode({ email: normalizedEmail });
  };

  const verifyCode = async (email: string, code: string) => {
    const normalizedEmail = ensureAllowedEmail(email);
    await db.auth.signInWithMagicCode({ email: normalizedEmail, code });
  };

  const signOut = async () => {
    const actorId = authUser?.id ?? '';
    if (actorId) {
      void logActivity({
        actorId,
        action: 'auth.sign_out',
        entityType: 'auth',
        entityId: actorId,
        meta: {
          email: authUser?.email,
          host: typeof window !== 'undefined' ? window.location.host : undefined,
        },
      });
    }
    await db.auth.signOut();
    localStorage.removeItem('auth_token');
  };

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const nextId = authUser?.id ?? '';
    const prevId = prevUserIdRef.current;
    prevUserIdRef.current = nextId;
    if (!nextId || nextId === prevId) return;

    void logActivity({
      actorId: nextId,
      action: 'auth.sign_in',
      entityType: 'auth',
      entityId: nextId,
      meta: {
        email: authUser?.email,
        host: typeof window !== 'undefined' ? window.location.host : undefined,
      },
    });
  }, [authUser?.id, authUser?.email]);

  return (
    <AuthContext.Provider value={{ user, isLoading, requestCode, verifyCode, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}












