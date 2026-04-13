import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { CreditCard, Plus, Trash2, X, Pencil, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDebts, insertDebt, patchDebt, removeDebt, type DebtRow } from '../lib/db';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Debt {
  id: string;
  name: string;
  type: string;
  totalAmount: number;
  remaining: number;
  interestRate: number;
  monthlyPayment: number;
}

type FormState = {
  name: string;
  type: string;
  totalAmount: string;
  remaining: string;
  interestRate: string;
  monthlyPayment: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY  = 'spendmapr_debts';
const TYPES   = ['Credit Card', 'Personal Loan', 'Student Loan', 'Mortgage', 'Car Loan', 'Overdraft', 'Buy Now Pay Later', 'Other'];
const BLANK_FORM: FormState = {
  name: '', type: 'Credit Card', totalAmount: '', remaining: '', interestRate: '', monthlyPayment: '',
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

// ─── DB ↔ component mappers ───────────────────────────────────────────────────

function rowToDebt(r: DebtRow): Debt {
  return {
    id:             r.id,
    name:           r.name,
    type:           r.type,
    totalAmount:    r.original_amount,
    remaining:      r.current_balance,
    interestRate:   r.apr,
    monthlyPayment: r.minimum_payment,
  };
}

// ─── Demo-mode localStorage helpers ──────────────────────────────────────────

function lsLoad(): Debt[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function lsSave(debts: Debt[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(debts));
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="panel p-5 space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-slate-200 rounded" />
          <div className="h-5 w-16 bg-slate-100 rounded-md" />
        </div>
        <div className="h-6 w-6 bg-slate-100 rounded" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-20 bg-slate-100 rounded" />
          <div className="h-4 w-20 bg-slate-200 rounded" />
        </div>
        <div className="h-2 bg-slate-100 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
        <div className="space-y-1">
          <div className="h-3 w-16 bg-slate-100 rounded" />
          <div className="h-4 w-20 bg-slate-200 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-16 bg-slate-100 rounded" />
          <div className="h-4 w-20 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DebtTracker() {
  const { user, isDemoMode } = useAuth();

  const [debts,    setDebts]    = useState<Debt[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [dbError,  setDbError]  = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [form,     setForm]     = useState<FormState>(BLANK_FORM);
  const [saving,   setSaving]   = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isDemoMode || !user) {
      setDebts(lsLoad());
      setLoading(false);
      return;
    }
    setLoading(true);
    getDebts(user.id)
      .then(rows => setDebts(rows.map(rowToDebt)))
      .catch(e => setDbError(e.message))
      .finally(() => setLoading(false));
  }, [user?.id, isDemoMode]);

  // ── Focus when modal opens ────────────────────────────────────────────────

  useEffect(() => {
    if (showForm) setTimeout(() => nameRef.current?.focus(), 50);
  }, [showForm]);

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const openCreate = () => { setEditDebt(null); setForm(BLANK_FORM); setShowForm(true); };

  const openEdit = (d: Debt) => {
    setEditDebt(d);
    setForm({
      name:           d.name,
      type:           d.type,
      totalAmount:    String(d.totalAmount),
      remaining:      String(d.remaining),
      interestRate:   d.interestRate > 0 ? String(d.interestRate) : '',
      monthlyPayment: d.monthlyPayment > 0 ? String(d.monthlyPayment) : '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditDebt(null);
    setForm(BLANK_FORM);
    setDbError(null);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const total     = parseFloat(form.totalAmount);
    const remaining = parseFloat(form.remaining) || total;
    if (!form.name.trim() || isNaN(total) || total <= 0) return;
    if (remaining < 0 || remaining > total) {
      setDbError('Remaining cannot exceed original amount or be negative.');
      return;
    }

    setSaving(true);
    setDbError(null);

    const payload: Omit<DebtRow, 'id'> = {
      name:            form.name.trim(),
      type:            form.type,
      original_amount: total,
      current_balance: remaining,
      apr:             parseFloat(form.interestRate) || 0,
      minimum_payment: parseFloat(form.monthlyPayment) || 0,
    };

    try {
      if (isDemoMode || !user) {
        /* ── demo / localStorage path ── */
        if (editDebt) {
          const next = debts.map(d =>
            d.id === editDebt.id
              ? { ...d, name: payload.name, type: payload.type,
                  totalAmount: payload.original_amount, remaining: payload.current_balance,
                  interestRate: payload.apr, monthlyPayment: payload.minimum_payment }
              : d,
          );
          setDebts(next); lsSave(next);
        } else {
          const next = [
            { id: crypto.randomUUID(), name: payload.name, type: payload.type,
              totalAmount: payload.original_amount, remaining: payload.current_balance,
              interestRate: payload.apr, monthlyPayment: payload.minimum_payment },
            ...debts,
          ];
          setDebts(next); lsSave(next);
        }
      } else {
        /* ── Supabase path ── */
        if (editDebt) {
          const row = await patchDebt(editDebt.id, payload);
          setDebts(prev => prev.map(d => d.id === editDebt.id ? rowToDebt(row) : d));
        } else {
          const row = await insertDebt(user.id, payload);
          setDebts(prev => [rowToDebt(row), ...prev]);
        }
      }
      closeForm();
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this debt?')) return;
    setDbError(null);
    try {
      if (isDemoMode || !user) {
        const next = debts.filter(d => d.id !== id);
        setDebts(next); lsSave(next);
      } else {
        await removeDebt(id);
        setDebts(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Could not delete debt');
    }
  };

  // ── Derived totals ────────────────────────────────────────────────────────

  const totalRemaining = debts.reduce((s, d) => s + d.remaining,      0);
  const totalMonthly   = debts.reduce((s, d) => s + d.monthlyPayment,  0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page-shell">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="section-title">Debt Tracker</h1>
            <p className="section-copy">Track your debts and visualise your path to being debt-free.</p>
          </div>
          <button onClick={openCreate} className="apple-button-primary flex items-center gap-2 whitespace-nowrap">
            <Plus size={16} />
            Add Debt
          </button>
        </div>

        {/* Error banner */}
        {dbError && !showForm && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={15} className="flex-shrink-0" />
            {dbError}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Summary */}
        {!loading && debts.length > 0 && (
          <div className="panel p-5 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Remaining</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(totalRemaining)}</p>
            </div>
            {totalMonthly > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Monthly Payments</p>
                <p className="text-2xl font-bold text-slate-900">{fmt(totalMonthly)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Debts Tracked</p>
              <p className="text-2xl font-bold text-slate-900">{debts.length}</p>
            </div>
          </div>
        )}

        {/* Cards / empty state */}
        {!loading && (
          debts.length === 0 ? (
            <Card>
              <CardContent>
                <div className="empty-state">
                  <div className="text-center space-y-4">
                    <div className="text-5xl">💳</div>
                    <h3 className="empty-state-title">No Debts Added</h3>
                    <p className="empty-state-copy">Add your debts to start tracking and planning your payoff.</p>
                    <button onClick={openCreate} className="apple-button-primary">
                      Add Debt
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {debts.map(debt => {
                const paid       = debt.totalAmount - debt.remaining;
                const pct        = debt.totalAmount > 0 ? Math.min((paid / debt.totalAmount) * 100, 100) : 0;
                const monthsLeft = debt.monthlyPayment > 0 ? Math.ceil(debt.remaining / debt.monthlyPayment) : null;
                return (
                  <div key={debt.id} className="interactive-card panel p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{debt.name}</h3>
                        <span className="text-xs bg-red-50 text-red-500 rounded-md px-2 py-0.5 font-medium">
                          {debt.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => openEdit(debt)}
                          className="text-slate-300 hover:text-slate-500 transition-colors p-1.5 rounded-lg hover:bg-slate-50"
                          aria-label="Edit debt"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(debt.id)}
                          className="text-slate-300 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                          aria-label="Delete debt"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Remaining</span>
                        <span className="font-semibold text-slate-900">{fmt(debt.remaining)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full transition-all duration-500"
                          style={{ width: `${100 - pct}%` }}
                        />
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
                            {monthsLeft <= 0
                              ? 'Paid off! 🎉'
                              : monthsLeft < 12
                                ? `${monthsLeft} mo`
                                : `${(monthsLeft / 12).toFixed(1)} yrs`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────────── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm"
          onClick={closeForm}
        >
          <form
            className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-6 space-y-5 max-h-[92dvh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center -mt-2 mb-1">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editDebt ? 'Edit Debt' : 'Add Debt'}
              </h2>
              <button type="button" onClick={closeForm} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            {/* Inline form error */}
            {dbError && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle size={14} className="flex-shrink-0" />
                {dbError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Name *</label>
                <input
                  ref={nameRef}
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Barclaycard"
                  className="apple-input"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Type *</label>
                <select
                  required
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="apple-input"
                >
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Original amount (£) *</label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="any"
                    value={form.totalAmount}
                    onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
                    placeholder="5000"
                    className="apple-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Remaining (£)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.remaining}
                    onChange={e => setForm(f => ({ ...f, remaining: e.target.value }))}
                    placeholder="Same as above"
                    className="apple-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Interest rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.interestRate}
                    onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))}
                    placeholder="19.9"
                    className="apple-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Monthly payment (£)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.monthlyPayment}
                    onChange={e => setForm(f => ({ ...f, monthlyPayment: e.target.value }))}
                    placeholder="150"
                    className="apple-input"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Leave "Remaining" blank if you haven't started paying it down yet.
              </p>
            </div>

            <div className="flex gap-3 pt-1 pb-1">
              <button type="button" onClick={closeForm} className="apple-button-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="apple-button-primary flex-1">
                {saving
                  ? <Loader2 size={15} className="mr-1.5 animate-spin" />
                  : <CreditCard size={15} className="mr-1.5" />
                }
                {editDebt ? 'Save Changes' : 'Add Debt'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
