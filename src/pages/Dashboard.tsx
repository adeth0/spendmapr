import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Target, CreditCard, Building2,
  ArrowUpRight, ArrowRight, ChevronRight,
} from 'lucide-react';
import { getGoals, getDebts, type GoalRow, type DebtRow } from '../lib/db';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Investment { id: string; value: number }
interface Account    { id: string; balance: number }

function readLS<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);

const fmtFull = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(n);

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { user, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [goals,       setGoals]       = useState<GoalRow[]>([]);
  const [debts,       setDebts]       = useState<DebtRow[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [accounts,    setAccounts]    = useState<Account[]>([]);
  const [loading,     setLoading]     = useState(true);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'there';

  useEffect(() => {
    // Investments + accounts always from localStorage
    setInvestments(readLS<Investment[]>('spendmapr_investments', []));
    setAccounts(readLS<Account[]>('spendmapr_accounts', []));

    if (isDemoMode || !user) {
      // Demo: read goals/debts from localStorage format
      const lsGoals = readLS<{ id: string; name: string; target: number; current: number; deadline: string; emoji: string }[]>('spendmapr_goals', []);
      const lsDebts = readLS<{ id: string; name: string; type: string; totalAmount: number; remaining: number; interestRate: number; monthlyPayment: number }[]>('spendmapr_debts', []);
      setGoals(lsGoals.map(g => ({
        id: g.id, name: g.name,
        target_amount: g.target, current_amount: g.current,
        deadline: g.deadline || null, emoji: g.emoji || '🎯',
      })));
      setDebts(lsDebts.map(d => ({
        id: d.id, name: d.name, type: d.type,
        original_amount: d.totalAmount, current_balance: d.remaining,
        apr: d.interestRate, minimum_payment: d.monthlyPayment,
      })));
      setLoading(false);
      return;
    }

    // Authenticated: fetch from Supabase
    Promise.all([getGoals(user.id), getDebts(user.id)])
      .then(([g, d]) => { setGoals(g); setDebts(d); })
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [user?.id, isDemoMode]);

  // ── Derived metrics ─────────────────────────────────────────────────────────
  const totalBalance     = accounts.reduce((s, a) => s + a.balance, 0);
  const totalInvestments = investments.reduce((s, i) => s + i.value, 0);
  const totalDebt        = debts.reduce((s, d) => s + d.current_balance, 0);
  const totalSaved       = goals.reduce((s, g) => s + g.current_amount, 0);
  const netWorth         = totalBalance + totalInvestments - totalDebt;
  const goalsOnTrack     = goals.filter(g => g.current_amount >= g.target_amount * 0.5).length;

  // ── Summary cards ───────────────────────────────────────────────────────────
  const cards = [
    {
      label: 'Banking',
      value: fmt(totalBalance),
      sub: `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`,
      icon: Building2,
      accent: '#3b82f6',
      route: '/banking',
    },
    {
      label: 'Investments',
      value: fmt(totalInvestments),
      sub: `${investments.length} holding${investments.length !== 1 ? 's' : ''}`,
      icon: TrendingUp,
      accent: '#22c55e',
      route: '/investments',
    },
    {
      label: 'Debt',
      value: fmt(totalDebt),
      sub: `${debts.length} debt${debts.length !== 1 ? 's' : ''} tracked`,
      icon: CreditCard,
      accent: '#ef4444',
      route: '/debt-tracker',
    },
    {
      label: 'Goals',
      value: String(goals.length),
      sub: goals.length === 0 ? 'No goals yet' : `${goalsOnTrack} of ${goals.length} on track`,
      icon: Target,
      accent: '#a855f7',
      route: '/goals',
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-shell">
      <div className="space-y-5">

        {/* Greeting */}
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-2)' }}>
            {greeting()}, <span className="text-white font-bold">{displayName}</span>
          </h1>
        </div>

        {/* ── Hero card ──────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #1a2942 50%, #111827 100%)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          {/* decorative blur */}
          <div
            className="absolute -top-16 -right-16 h-48 w-48 rounded-full pointer-events-none"
            style={{ background: 'rgba(59,130,246,0.08)', filter: 'blur(40px)' }}
          />

          <div className="relative">
            <p className="text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Net Worth
            </p>
            <p className="text-4xl font-bold text-white tracking-tight">
              {loading ? '—' : fmtFull(netWorth)}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="badge-green text-xs">
                <ArrowUpRight size={11} />
                {fmt(totalSaved)} saved
              </div>
              <div className="badge-muted text-xs">
                {fmt(totalDebt)} owed
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats grid ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={() => navigate(card.route)}
                className="text-left panel interactive-card p-4 space-y-3 w-full"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="h-8 w-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${card.accent}18` }}
                  >
                    <Icon size={15} style={{ color: card.accent }} />
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-3)' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white tracking-tight leading-none">
                    {loading ? '—' : card.value}
                  </p>
                  <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--text-3)' }}>
                    {card.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{card.sub}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Goals preview ──────────────────────────────────────────────────── */}
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Goals</h2>
            <button
              onClick={() => navigate('/goals')}
              className="flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          {!loading && goals.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>No goals yet</p>
              <button
                onClick={() => navigate('/goals')}
                className="apple-button-tertiary mt-3 !py-2 !px-4 text-xs"
              >
                Create a goal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.slice(0, 3).map(g => {
                const pct = g.target_amount > 0
                  ? Math.min((g.current_amount / g.target_amount) * 100, 100)
                  : 0;
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{g.emoji}</span>
                        <span className="text-sm font-medium text-white truncate max-w-[160px]">{g.name}</span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 100 ? 'var(--green)' : 'var(--accent)',
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>{fmt(g.current_amount)}</span>
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>{fmt(g.target_amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Quick actions ───────────────────────────────────────────────────── */}
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Quick actions</h2>
          <div className="space-y-1">
            {[
              { label: 'Add a bank account',   route: '/banking',      icon: Building2  },
              { label: 'Track an investment',  route: '/investments',  icon: TrendingUp },
              { label: 'Create a savings goal',route: '/goals',        icon: Target     },
              { label: 'Log a debt',           route: '/debt-tracker', icon: CreditCard },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.route}
                  onClick={() => navigate(item.route)}
                  className="flex items-center justify-between w-full px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 group"
                  style={{ color: 'var(--text-1)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={15} style={{ color: 'var(--text-3)' }} />
                    {item.label}
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-3)' }} />
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
