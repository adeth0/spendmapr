import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Target, CreditCard, Building2, ArrowRight } from 'lucide-react';

interface Goal { id: string; name: string; target: number; current: number }
interface Investment { id: string; value: number }
interface Debt { id: string; remaining: number }
interface Account { id: string; balance: number }

function readLS<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; }
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    setGoals(readLS<Goal[]>('spendmapr_goals', []));
    setInvestments(readLS<Investment[]>('spendmapr_investments', []));
    setDebts(readLS<Debt[]>('spendmapr_debts', []));
    setAccounts(readLS<Account[]>('spendmapr_accounts', []));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalInvestments = investments.reduce((s, i) => s + i.value, 0);
  const totalDebt = debts.reduce((s, d) => s + d.remaining, 0);
  const netWorth = totalBalance + totalInvestments - totalDebt;
  const goalsOnTrack = goals.filter(g => g.current >= g.target * 0.5).length;

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'there';

  const summaryCards = [
    {
      label: 'Net Worth',
      value: fmt(netWorth),
      sub: `${accounts.length} account${accounts.length !== 1 ? 's' : ''} connected`,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      route: '/banking',
    },
    {
      label: 'Investments',
      value: fmt(totalInvestments),
      sub: `${investments.length} holding${investments.length !== 1 ? 's' : ''}`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      route: '/investments',
    },
    {
      label: 'Total Debt',
      value: fmt(totalDebt),
      sub: `${debts.length} debt${debts.length !== 1 ? 's' : ''} tracked`,
      icon: CreditCard,
      color: 'text-red-500',
      bg: 'bg-red-50',
      route: '/debt-tracker',
    },
    {
      label: 'Goals',
      value: `${goals.length}`,
      sub: goals.length === 0 ? 'No goals set yet' : `${goalsOnTrack} of ${goals.length} on track`,
      icon: Target,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      route: '/goals',
    },
  ];

  return (
    <div className="page-shell">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="section-title">Good {greeting()}, {displayName}</h1>
          <p className="section-copy">Here's your financial overview.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={() => navigate(card.route)}
                className="text-left interactive-card panel p-5 space-y-3 hover:cursor-pointer w-full"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.label}</span>
                  <div className={`${card.bg} rounded-lg p-1.5`}>
                    <Icon size={14} className={card.color} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</p>
                <p className="text-xs text-slate-400">{card.sub}</p>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="interactive-card">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Add a bank account', route: '/banking' },
                { label: 'Track an investment', route: '/investments' },
                { label: 'Set a savings goal', route: '/goals' },
                { label: 'Log a debt', route: '/debt-tracker' },
              ].map((item) => (
                <button
                  key={item.route}
                  onClick={() => navigate(item.route)}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-700 font-medium group"
                >
                  {item.label}
                  <ArrowRight size={15} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="interactive-card">
            <CardHeader>
              <CardTitle className="text-base">Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  { done: accounts.length > 0, text: 'Add a bank account' },
                  { done: investments.length > 0, text: 'Add an investment' },
                  { done: goals.length > 0, text: 'Create a savings goal' },
                  { done: debts.length > 0, text: 'Track a debt' },
                ].map((step) => (
                  <li key={step.text} className="flex items-center gap-3 text-sm">
                    <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${step.done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200'}`}>
                      {step.done && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className={step.done ? 'text-slate-400 line-through' : 'text-slate-700'}>{step.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
