/**
 * Typed Supabase CRUD helpers for goals and debts.
 * All functions throw on error — callers should try/catch.
 */
import { supabase } from './supabase';

// ─── Goals ────────────────────────────────────────────────────────────────────

export interface GoalRow {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null; // YYYY-MM-DD date string or null
  emoji: string;
}

const GOAL_COLS = 'id, name, target_amount, current_amount, deadline, emoji';

export async function getGoals(userId: string): Promise<GoalRow[]> {
  const { data, error } = await supabase
    .from('goals')
    .select(GOAL_COLS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as GoalRow[];
}

export async function insertGoal(
  userId: string,
  row: Omit<GoalRow, 'id'>,
): Promise<GoalRow> {
  const { data, error } = await supabase
    .from('goals')
    .insert({ user_id: userId, ...row })
    .select(GOAL_COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as GoalRow;
}

export async function patchGoal(
  id: string,
  patch: Partial<Omit<GoalRow, 'id'>>,
): Promise<GoalRow> {
  const { data, error } = await supabase
    .from('goals')
    .update(patch)
    .eq('id', id)
    .select(GOAL_COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as GoalRow;
}

export async function removeGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Debts ────────────────────────────────────────────────────────────────────

export interface DebtRow {
  id: string;
  name: string;
  type: string;
  original_amount: number;
  current_balance: number;
  apr: number;
  minimum_payment: number;
}

const DEBT_COLS = 'id, name, type, original_amount, current_balance, apr, minimum_payment';

export async function getDebts(userId: string): Promise<DebtRow[]> {
  const { data, error } = await supabase
    .from('debts')
    .select(DEBT_COLS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DebtRow[];
}

export async function insertDebt(
  userId: string,
  row: Omit<DebtRow, 'id'>,
): Promise<DebtRow> {
  const { data, error } = await supabase
    .from('debts')
    .insert({ user_id: userId, ...row })
    .select(DEBT_COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as DebtRow;
}

export async function patchDebt(
  id: string,
  patch: Partial<Omit<DebtRow, 'id'>>,
): Promise<DebtRow> {
  const { data, error } = await supabase
    .from('debts')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(DEBT_COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as DebtRow;
}

export async function removeDebt(id: string): Promise<void> {
  const { error } = await supabase.from('debts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
