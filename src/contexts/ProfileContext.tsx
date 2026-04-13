/**
 * ProfileContext — loads and caches the user_profile row for the signed-in user.
 *
 * - Authenticated + Supabase: fetches from DB, upserts on save
 * - Demo mode (no Supabase): reads/writes localStorage
 * - Exposes `profile`, `profileLoading`, `saveProfile`, `refetchProfile`
 *
 * App.tsx wraps everything in <ProfileProvider> (inside <AuthProvider>).
 * The OnboardingGate component uses this to redirect new users to /onboarding.
 */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile, upsertUserProfile, type UserProfile } from '../lib/profileDb';

const LS_KEY = 'spendmapr_profile';

function lsRead(): UserProfile | null {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') as UserProfile; }
  catch { return null; }
}

interface ProfileContextType {
  profile: UserProfile | null;
  profileLoading: boolean;
  saveProfile: (patch: Partial<Omit<UserProfile, 'id' | 'user_id'>>) => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isDemoMode } = useAuth();
  const [profile, setProfile]             = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    if (isDemoMode) {
      setProfile(lsRead());
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    try {
      const p = await getUserProfile(user.id);
      setProfile(p);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id, isDemoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const saveProfile = useCallback(async (
    patch: Partial<Omit<UserProfile, 'id' | 'user_id'>>,
  ) => {
    if (!user) return;

    if (isDemoMode) {
      const base: UserProfile = profile ?? {
        id: 'demo', user_id: user.id,
        monthly_income: 0, current_savings: 0,
        total_debts_estimate: 0, financial_goals: [],
        onboarding_completed: false,
      };
      const next = { ...base, ...patch };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      setProfile(next);
      return;
    }

    const updated = await upsertUserProfile(user.id, patch);
    setProfile(updated);
  }, [user?.id, isDemoMode, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ProfileContext.Provider value={{ profile, profileLoading, saveProfile, refetchProfile: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
