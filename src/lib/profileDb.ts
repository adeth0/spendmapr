/**
 * Supabase CRUD for the user_profile table.
 * One row per user — upserted on onboarding completion and profile updates.
 */
import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  monthly_income: number;
  current_savings: number;
  total_debts_estimate: number;
  financial_goals: string[];
  onboarding_completed: boolean;
}

const COLS =
  'id, user_id, monthly_income, current_savings, total_debts_estimate, financial_goals, onboarding_completed';

/** Returns the profile row for userId, or null if it doesn't exist yet. */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profile')
    .select(COLS)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as UserProfile | null;
}

/**
 * Insert or update the profile row for userId.
 * Uses ON CONFLICT (user_id) DO UPDATE so callers don't need to check existence.
 */
export async function upsertUserProfile(
  userId: string,
  patch: Partial<Omit<UserProfile, 'id' | 'user_id'>>,
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profile')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
    .select(COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as UserProfile;
}
