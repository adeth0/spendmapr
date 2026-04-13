import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDemoMode = !isSupabaseConfigured;

  useEffect(() => {
    if (isDemoMode) {
      setIsLoading(false);
      return;
    }

    // Get initial session (also exchanges PKCE code if ?code= is in URL)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error.message);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setIsLoading(false);
    });

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setError(null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  const getRedirectURL = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://spend.kavauralabs.com';
    return `${origin}/auth/callback`;
  };

  const signInWithGoogle = async () => {
    if (isDemoMode) {
      setUser({
        id: 'demo-user',
        email: 'demo@spendmapr.com',
        user_metadata: { full_name: 'Demo User', avatar_url: '' },
        app_metadata: { provider: 'google' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User);
      return;
    }

    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectURL(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) setError(error.message);
  };

  const signInWithMagicLink = async (email: string) => {
    if (isDemoMode) {
      setUser({
        id: 'demo-user',
        email,
        user_metadata: { full_name: email.split('@')[0] },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User);
      return { error: null };
    }

    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getRedirectURL(),
      },
    });

    if (error) {
      setError(error.message);
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    if (isDemoMode) {
      setUser(null);
      setSession(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        error,
        signInWithGoogle,
        signInWithMagicLink,
        signOut,
        isConfigured: isSupabaseConfigured,
        isDemoMode,
      }}
    >
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
