'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { db } from './instant';
import { useAuth as useInstantAuth } from '@instantdb/react';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // InstantDB's hook typing can differ by version; treat as any to avoid build-time TS failures.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instantAuth: any = (useInstantAuth as any)(db.auth);
  const {
    user,
    isLoading: instantLoading,
    signIn: instantSignIn,
    signUp: instantSignUp,
    signOut: instantSignOut,
  } = instantAuth;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(instantLoading);
  }, [instantLoading]);

  const signIn = async (email: string, password: string) => {
    await instantSignIn({ email, password });
  };

  const signUp = async (email: string, password: string) => {
    await instantSignUp({ email, password });
  };

  const signOut = async () => {
    await instantSignOut();
    localStorage.removeItem('auth_token');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, isAdmin }}>
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












