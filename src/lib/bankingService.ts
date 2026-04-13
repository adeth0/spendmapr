/**
 * Open Banking / TrueLayer service — two layers:
 *
 *  REAL (live TrueLayer via Supabase Edge Functions):
 *    initTrueLayerConnect()       calls truelayer-auth → returns redirect URL
 *    handleTrueLayerCallback()    exchanges code (truelayer-token) + syncs data (truelayer-data)
 *    syncTrueLayerData()          re-syncs accounts + transactions on demand
 *    getConnectedBankAccounts()   reads bank_accounts table from Supabase
 *    getRecentTransactions()      reads transactions table from Supabase
 *    checkTrueLayerConnection()   checks truelayer_connections table for existence
 *    disconnectTrueLayer()        deletes connection + cascades to accounts/txns
 *
 *  MOCK (preserved for demo mode / offline testing):
 *    simulateConnect(), getMockAccounts(), getMockTransactions(), disconnect(), isConnected()
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ConnectedAccount {
  id: string;
  provider: 'monzo' | 'starling' | 'barclays' | 'hsbc' | 'natwest';
  providerLabel: string;
  accountType: 'Current Account' | 'Savings Account' | 'Credit Card';
  displayName: string;
  balance: number;
  currency: string;
  last4?: string;
}

export interface BankTransaction {
  id: string;
  /** Negative = debit, positive = credit */
  amount: number;
  merchant: string;
  category: string;
  /** ISO 8601 */
  date: string;
  settled: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ACCOUNTS: ConnectedAccount[] = [
  {
    id: 'monzo-current-1',
    provider: 'monzo',
    providerLabel: 'Monzo',
    accountType: 'Current Account',
    displayName: 'Monzo Current Account',
    balance: 2_435.67,
    currency: 'GBP',
    last4: '8821',
  },
  {
    id: 'monzo-savings-1',
    provider: 'monzo',
    providerLabel: 'Monzo',
    accountType: 'Savings Account',
    displayName: 'Monzo Savings Pot',
    balance: 4_200.00,
    currency: 'GBP',
  },
];

const MOCK_TRANSACTIONS: BankTransaction[] = [
  { id: 't01', amount:  2_800.00, merchant: 'BACS Salary',      category: 'Income',        date: '2026-04-10T08:00:00Z', settled: true  },
  { id: 't02', amount:   -350.00, merchant: 'Rent Payment',      category: 'Housing',       date: '2026-04-10T09:00:00Z', settled: true  },
  { id: 't03', amount:    -65.00, merchant: 'EDF Energy',        category: 'Bills',         date: '2026-04-09T12:00:00Z', settled: true  },
  { id: 't04', amount:    -42.50, merchant: 'Sainsbury\'s',      category: 'Groceries',     date: '2026-04-08T14:22:00Z', settled: true  },
  { id: 't05', amount:    -23.40, merchant: 'TfL',               category: 'Transport',     date: '2026-04-08T07:45:00Z', settled: true  },
  { id: 't06', amount:    -88.00, merchant: 'Amazon',            category: 'Shopping',      date: '2026-04-07T16:00:00Z', settled: true  },
  { id: 't07', amount:    -15.50, merchant: 'Costa Coffee',      category: 'Eating Out',    date: '2026-04-06T08:15:00Z', settled: true  },
  { id: 't08', amount:    -38.00, merchant: 'Waitrose',          category: 'Groceries',     date: '2026-04-05T13:00:00Z', settled: true  },
  { id: 't09', amount:     -9.99, merchant: 'Spotify',           category: 'Entertainment', date: '2026-04-04T00:00:00Z', settled: true  },
  { id: 't10', amount:   -120.00, merchant: 'PureGym',           category: 'Health',        date: '2026-04-03T09:00:00Z', settled: true  },
  { id: 't11', amount:    -55.20, merchant: 'BP Fuel',           category: 'Transport',     date: '2026-04-02T18:10:00Z', settled: true  },
  { id: 't12', amount:    -12.00, merchant: 'Netflix',           category: 'Entertainment', date: '2026-04-01T00:00:00Z', settled: true  },
];

/** Category → accent hex used by the UI */
export const CATEGORY_COLORS: Record<string, string> = {
  Income:        '#22c55e',
  Housing:       '#6366f1',
  Bills:         '#f59e0b',
  Groceries:     '#10b981',
  Transport:     '#06b6d4',
  Shopping:      '#ec4899',
  'Eating Out':  '#f97316',
  Entertainment: '#a855f7',
  Health:        '#3b82f6',
};

// ─── State helpers ────────────────────────────────────────────────────────────

const LS_KEY = 'spendmapr_open_banking_connected';

export function isConnected(): boolean {
  return localStorage.getItem(LS_KEY) === 'true';
}

export function disconnect(): void {
  localStorage.removeItem(LS_KEY);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Simulates the TrueLayer OAuth redirect + token exchange.
 * In production: replace with window.location.href = truelayerAuthUrl(...)
 */
export async function simulateConnect(): Promise<ConnectedAccount[]> {
  await new Promise(r => setTimeout(r, 1_500)); // simulate network round-trip
  localStorage.setItem(LS_KEY, 'true');
  return MOCK_ACCOUNTS;
}

export function getMockAccounts(): ConnectedAccount[] {
  return isConnected() ? [...MOCK_ACCOUNTS] : [];
}

export function getMockTransactions(): BankTransaction[] {
  return isConnected() ? [...MOCK_TRANSACTIONS] : [];
}

/**
 * Returns spending grouped by category for the current mock dataset.
 * Useful for a future spending breakdown chart.
 */
export function spendingByCategory(): Record<string, number> {
  return MOCK_TRANSACTIONS
    .filter(t => t.amount < 0 && t.category !== 'Income')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + Math.abs(t.amount);
      return acc;
    }, {});
}

// ─── Real TrueLayer types (mirrors Supabase table columns) ────────────────────

export interface BankAccountRow {
  id:                    string;
  truelayer_account_id:  string;
  display_name:          string;
  account_type:          string;
  currency:              string;
  balance:               number | null;
  balance_updated_at:    string | null;
  provider_display_name: string | null;
}

export interface TransactionRow {
  id:                       string;
  truelayer_transaction_id: string;
  amount:                   number;
  currency:                 string;
  description:              string | null;
  merchant_name:            string | null;
  category:                 string | null;
  transaction_type:         string | null;
  timestamp:                string;
  running_balance:          number | null;
  bank_accounts?:           { display_name: string } | null;
}

// ─── Real TrueLayer API functions ─────────────────────────────────────────────

/**
 * Step 1 — calls the truelayer-auth Edge Function to get the TrueLayer
 * OAuth URL. Stores the CSRF state in sessionStorage, then redirects.
 * Returns the URL so the caller can decide when to redirect.
 */
export async function initTrueLayerConnect(sb: SupabaseClient): Promise<string> {
  const { data, error } = await sb.functions.invoke('truelayer-auth');
  if (error) throw new Error(error.message ?? 'Failed to get auth URL');
  sessionStorage.setItem('tl_oauth_state', (data as { state: string }).state);
  return (data as { url: string }).url;
}

/**
 * Step 2 — called after TrueLayer redirects back with ?code=&state=.
 * Verifies CSRF state, exchanges the code (truelayer-token), then triggers
 * an immediate data sync (truelayer-data).
 * Returns { accounts, transactions } count from the sync.
 */
export async function handleTrueLayerCallback(
  sb:    SupabaseClient,
  code:  string,
  state: string,
): Promise<{ accounts: number; transactions: number }> {
  // CSRF check
  const stored = sessionStorage.getItem('tl_oauth_state');
  if (stored && state !== stored) {
    sessionStorage.removeItem('tl_oauth_state');
    throw new Error('State mismatch — possible CSRF. Please try connecting again.');
  }
  sessionStorage.removeItem('tl_oauth_state');

  // Exchange code for tokens
  const { error: tokenErr } = await sb.functions.invoke('truelayer-token', {
    body: { code },
  });
  if (tokenErr) throw new Error(tokenErr.message ?? 'Token exchange failed');

  // Sync data immediately
  return syncTrueLayerData(sb);
}

/**
 * Re-sync accounts and transactions on demand (e.g. Refresh button).
 */
export async function syncTrueLayerData(
  sb: SupabaseClient,
): Promise<{ accounts: number; transactions: number }> {
  const { data, error } = await sb.functions.invoke('truelayer-data');
  if (error) throw new Error(error.message ?? 'Data sync failed');
  return data as { accounts: number; transactions: number };
}

/** Fetches connected bank accounts from the bank_accounts Supabase table. */
export async function getConnectedBankAccounts(sb: SupabaseClient): Promise<BankAccountRow[]> {
  const { data, error } = await sb
    .from('bank_accounts')
    .select('id, truelayer_account_id, display_name, account_type, currency, balance, balance_updated_at, provider_display_name')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BankAccountRow[];
}

/** Fetches recent transactions joined with their account name. */
export async function getRecentTransactions(
  sb:    SupabaseClient,
  limit = 50,
): Promise<TransactionRow[]> {
  const { data, error } = await sb
    .from('transactions')
    .select('id, truelayer_transaction_id, amount, currency, description, merchant_name, category, transaction_type, timestamp, running_balance, bank_accounts(display_name)')
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as TransactionRow[];
}

/** Returns true if the user has a stored TrueLayer connection. */
export async function checkTrueLayerConnection(sb: SupabaseClient): Promise<boolean> {
  const { count, error } = await sb
    .from('truelayer_connections')
    .select('id', { count: 'exact', head: true });
  if (error) return false;
  return (count ?? 0) > 0;
}

/**
 * Removes the TrueLayer connection and all synced bank data.
 * Transactions are cascade-deleted via the bank_accounts FK.
 */
export async function disconnectTrueLayer(
  sb:     SupabaseClient,
  userId: string,
): Promise<void> {
  // Delete connection (tokens)
  await sb.from('truelayer_connections').delete().eq('user_id', userId);
  // Delete synced accounts (transactions cascade)
  await sb.from('bank_accounts').delete().eq('user_id', userId);
}
