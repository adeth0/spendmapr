/**
 * Mock Open Banking / TrueLayer service.
 *
 * Structure mirrors what a real TrueLayer integration would return:
 * - ConnectedAccount  → /data/v1/accounts
 * - BankTransaction   → /data/v1/accounts/{id}/transactions
 *
 * The "connect" flow simulates the TrueLayer OAuth redirect:
 *   1. simulateConnect()   — waits 1.5 s (network sim), persists to localStorage
 *   2. getMockAccounts()   — returns mock data when connected
 *   3. getMockTransactions() — returns recent mock transactions
 *   4. disconnect()        — clears localStorage flag
 *
 * When a real TrueLayer client_id is available, swap simulateConnect() for
 * a real window.location redirect to TrueLayer's auth endpoint.
 */

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
