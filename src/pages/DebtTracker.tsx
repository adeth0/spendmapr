import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { CreditCard, Plus, Trash2, X } from 'lucide-react';

interface Debt {
  id: string;
  name: string;
  type: string;
  totalAmount: number;
  remaining: number;
  interestRate: number;
  monthlyPayment: number;
}

const STORAGE_KEY = 'spendmapr_debts';
const TYPES = ['Credit Card', 'Personal Loan', 'Student Loan', 'Mortgage', 'Car Loan', 'Overdraft', 'Buy Now Pay Later', 'Other'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

export function DebtTracker() {
  const [debts, setDebts] = useState<Debt[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'Credit Card', totalAmount: '', remaining: '', interestRate: '', monthlyPayment: '',
  });
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    if (showForm) setTimeout(() => nameRef.current?.focus(), 50);
  }, [showForm]);

  const resetForm = () => setForm({
    name: '', type: 'Credit Card', totalAmount: '', remaining: '', interestRate: '', monthlyPayment: '',
  });

  const handleAdd = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const total = parseFloat(form.totalAmount) || 0;
    const debt: Debt = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      type: form.type,
      totalAmount: total,
      remaining: parseFloat(form.remaining) || total,
      interestRate: parseFloat(form.interestRate) || 0,
      monthlyPayment: parseFloat(form.monthlyPayment) || 0,
    };
    setDebts(prev => [debt, ...prev]);
    resetForm();
    setShowForm(false);
  };

  const handleDelete = (id: string) => setDebts(prev => prev.filter(d => d.id !== id));

  const totalRemaining = debts.reduce((s, d) => s + d.remaining, 0);
  const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0);

  return (
    <div className="page-shell">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="section-title">Debt Tracker</h1>
            <p className="section-copy">Track your debts and visualise your path to being debt-free.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="apple-button-primary flex items-center gap-2 whitespace-nowrap">
            <Plus size={16} />
            Add Debt
          </button>
        </div>

        {/* Summary */}
        {debts.length > 0 && (
          <div className="panel p-5 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Remaining</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(totalRemaining)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Monthly Payments</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(totalMonthly)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Debts Tracked</p>
              <p className="text-2xl font-bold text-slate-900">{debts.length}</p>
            </div>
          </div>
        )}

        {/* Debt cards */}
        {debts.length === 0 ? (
          <Card>
            <CardContent>
              <div className="empty-state">
                <div className="text-center space-y-4">
                  <div className="text-5xl">💳</div>
                  <h3 className="empty-state-title">No Debts Added</h3>
                  <p className="empty-state-copy">Add your debts to start tracking and planning your payoff.</p>
                  <button onClick={() => setShowForm(true)} className="apple-button-primary">
                    Add Debt
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {debts.map(debt => {
              const paid = debt.totalAmount - debt.remaining;
              const pct = debt.totalAmount > 0 ? Math.min((paid / debt.totalAmount) * 100, 100) : 0;
              const monthsLeft = debt.monthlyPayment > 0
                ? Math.ceil(debt.remaining / debt.monthlyPayment)
                : null;
              return (
                <div key={debt.id} className="interactive-card panel p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{debt.name}</h3>
                      <span className="text-xs bg-red-50 text-red-500 rounded-md px-2 py-0.5 font-medium">
                        {debt.type}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(debt.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors p-1 -mr-1 flex-shrink-0"
                      aria-label="Delete debt"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Remaining</span>
                      <span className="font-semibold text-slate-900">{fmt(debt.remaining)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full transition-all duration-500"
                        style={{ width: `${100 - pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{fmt(paid)} paid off</span>
                      <span>{pct.toFixed(0)}% complete</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    {debt.interestRate > 0 && (
                      <div>
                        <p className="text-xs text-slate-400">Interest rate</p>
                        <p className="text-sm font-medium text-slate-700">{debt.interestRate}% APR</p>
                      </div>
                    )}
                    {debt.monthlyPayment > 0 && (
                      <div>
                        <p className="text-xs text-slate-400">Monthly payment</p>
                        <p className="text-sm font-medium text-slate-700">{fmt(debt.monthlyPayment)}</p>
                      </div>
                    )}
                    {monthsLeft !== null && (
                      <div>
                        <p className="text-xs text-slate-400">Est. payoff</p>
                        <p className="text-sm font-medium text-slate-700">
                          {monthsLeft < 12
                            ? `${monthsLeft} month${monthsLeft !== 1 ? 's' : ''}`
                            : `${Math.ceil(monthsLeft / 12)} yr${Math.ceil(monthsLeft / 12) !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Debt Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => { setShowForm(false); resetForm(); }}
        >
          <form
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            onSubmit={handleAdd}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Add Debt</h2>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Name *</label>
                <input ref={nameRef} required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Barclaycard"
                  className="apple-input" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Type *</label>
                <select required value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="apple-input">
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Original amount (£) *</label>
                  <input required type="number" min="0.01" step="any" value={form.totalAmount}
                    onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
                    placeholder="5000"
                    className="apple-input" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Remaining (£)</label>
                  <input type="number" min="0" step="any" value={form.remaining}
                    onChange={e => setForm(f => ({ ...f, remaining: e.target.value }))}
                    placeholder="Same as above"
                    className="apple-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Interest rate (%)</label>
                  <input type="number" min="0" step="0.01" value={form.interestRate}
                    onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))}
                    placeholder="19.9"
                    className="apple-input" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Monthly payment (£)</label>
                  <input type="number" min="0" step="any" value={form.monthlyPayment}
                    onChange={e => setForm(f => ({ ...f, monthlyPayment: e.target.value }))}
                    placeholder="150"
                    className="apple-input" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="apple-button-secondary flex-1">Cancel</button>
              <button type="submit" className="apple-button-primary flex-1">
                <CreditCard size={15} className="mr-1.5" />
                Add Debt
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
