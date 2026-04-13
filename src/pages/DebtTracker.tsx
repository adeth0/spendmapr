import { useState, useEffect, useRef } from 'react';
import { CreditCard, Plus, Trash2, X, Pencil, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDebts, insertDebt, patchDebt, removeDebt, type DebtRow } from '../lib/db';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Debt {
  id: string; name: string; type: string;
  totalAmount: number; remaining: number;
  interestRate: number; monthlyPayment: number;
}
type FormState = {
  name: string; type: string; totalAmount: string;
  remaining: string; interestRate: string; monthlyPayment: string;
};

const LS_KEY   = 'spendmapr_debts';
const TYPES    = ['Credit Card','Personal Loan','Student Loan','Mortgage','Car Loan','Overdraft','Buy Now Pay Later','Other'];
const BLANK    = (): FormState => ({ name: '', type: 'Credit Card', totalAmount: '', remaining: '', interestRate: '', monthlyPayment: '' });

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

// ─── Mappers ──────────────────────────────────────────────────────────────────
function rowToDebt(r: DebtRow): Debt {
  return { id: r.id, name: r.name, type: r.type, totalAmount: r.original_amount,
    remaining: r.current_balance, interestRate: r.apr, monthlyPayment: r.minimum_payment };
}
function lsLoad(): Debt[] { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } }
function lsSave(d: Debt[]) { localStorage.setItem(LS_KEY, JSON.stringify(d)); }

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="panel p-5 space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded" style={{ background: 'var(--bg-raised)' }} />
          <div className="h-5 w-20 rounded" style={{ background: 'var(--border)' }} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-20 rounded" style={{ background: 'var(--border)' }} />
          <div className="h-4 w-24 rounded" style={{ background: 'var(--bg-raised)' }} />
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }} />
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
  const [form,     setForm]     = useState<FormState>(BLANK());
  const [saving,   setSaving]   = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDemoMode || !user) { setDebts(lsLoad()); setLoading(false); return; }
    setLoading(true);
    getDebts(user.id).then(r => setDebts(r.map(rowToDebt)))
      .catch(e => setDbError(e.message)).finally(() => setLoading(false));
  }, [user?.id, isDemoMode]);

  useEffect(() => { if (showForm) setTimeout(() => nameRef.current?.focus(), 50); }, [showForm]);

  const openCreate = () => { setEditDebt(null); setForm(BLANK()); setShowForm(true); };
  const openEdit   = (d: Debt) => {
    setEditDebt(d);
    setForm({ name: d.name, type: d.type, totalAmount: String(d.totalAmount),
      remaining: String(d.remaining),
      interestRate: d.interestRate > 0 ? String(d.interestRate) : '',
      monthlyPayment: d.monthlyPayment > 0 ? String(d.monthlyPayment) : '' });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditDebt(null); setForm(BLANK()); setDbError(null); };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const total     = parseFloat(form.totalAmount);
    const remaining = parseFloat(form.remaining) || total;
    if (!form.name.trim() || isNaN(total) || total <= 0) return;
    if (remaining < 0 || remaining > total) { setDbError('Remaining cannot exceed original amount.'); return; }
    setSaving(true); setDbError(null);
    const payload: Omit<DebtRow, 'id'> = {
      name: form.name.trim(), type: form.type, original_amount: total,
      current_balance: remaining, apr: parseFloat(form.interestRate) || 0,
      minimum_payment: parseFloat(form.monthlyPayment) || 0,
    };
    try {
      if (isDemoMode || !user) {
        if (editDebt) {
          const next = debts.map(d => d.id === editDebt.id
            ? { ...d, name: payload.name, type: payload.type, totalAmount: payload.original_amount,
                remaining: payload.current_balance, interestRate: payload.apr, monthlyPayment: payload.minimum_payment }
            : d);
          setDebts(next); lsSave(next);
        } else {
          const next = [{ id: crypto.randomUUID(), name: payload.name, type: payload.type,
            totalAmount: payload.original_amount, remaining: payload.current_balance,
            interestRate: payload.apr, monthlyPayment: payload.minimum_payment }, ...debts];
          setDebts(next); lsSave(next);
        }
      } else {
        if (editDebt) {
          const r = await patchDebt(editDebt.id, payload);
          setDebts(p => p.map(d => d.id === editDebt.id ? rowToDebt(r) : d));
        } else {
          const r = await insertDebt(user.id, payload);
          setDebts(p => [rowToDebt(r), ...p]);
        }
      }
      closeForm();
    } catch (err) { setDbError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this debt?')) return;
    try {
      if (isDemoMode || !user) { const n = debts.filter(d => d.id !== id); setDebts(n); lsSave(n); }
      else { await removeDebt(id); setDebts(p => p.filter(d => d.id !== id)); }
    } catch (err) { setDbError(err instanceof Error ? err.message : 'Could not delete'); }
  };

  const totalRemaining = debts.reduce((s, d) => s + d.remaining,      0);
  const totalMonthly   = debts.reduce((s, d) => s + d.monthlyPayment, 0);

  return (
    <div className="page-shell">
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="section-title">Debt Tracker</h1>
            <p className="section-copy">Track your debts and plan your payoff.</p>
          </div>
          <button onClick={openCreate} className="apple-button-primary whitespace-nowrap">
            <Plus size={16} /> Add Debt
          </button>
        </div>

        {/* Error */}
        {dbError && !showForm && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)' }}>
            <AlertCircle size={15} className="flex-shrink-0" /> {dbError}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[0,1,2].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Summary */}
        {!loading && debts.length > 0 && (
          <div className="panel p-5 flex flex-wrap gap-6">
            {[
              { label: 'Total Remaining', value: fmt(totalRemaining) },
              ...(totalMonthly > 0 ? [{ label: 'Monthly Payments', value: fmt(totalMonthly) }] : []),
              { label: 'Debts Tracked',  value: String(debts.length) },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                <p className="text-2xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Cards / empty */}
        {!loading && (debts.length === 0 ? (
          <div className="panel">
            <div className="empty-state flex-col space-y-4">
              <div className="text-5xl">💳</div>
              <h3 className="empty-state-title">No debts added</h3>
              <p className="empty-state-copy">Add your debts to start planning your payoff.</p>
              <button onClick={openCreate} className="apple-button-primary">Add debt</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {debts.map(debt => {
              const paid  = debt.totalAmount - debt.remaining;
              const pct   = debt.totalAmount > 0 ? Math.min((paid / debt.totalAmount) * 100, 100) : 0;
              const months = debt.monthlyPayment > 0 ? Math.ceil(debt.remaining / debt.monthlyPayment) : null;
              return (
                <div key={debt.id} className="panel interactive-card p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">{debt.name}</h3>
                      <span className="badge-red mt-1">{debt.type}</span>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => openEdit(debt)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-3)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                        aria-label="Edit"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(debt.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-3)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                        aria-label="Delete"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-3)' }}>Remaining</span>
                      <span className="font-semibold text-white">{fmt(debt.remaining)}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${100 - pct}%`, background: 'var(--red)' }} />
                    </div>
                    <div className="flex justify-between text-xs" style={{ color: 'var(--text-3)' }}>
                      <span>{fmt(paid)} paid off</span>
                      <span>{pct.toFixed(0)}% complete</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    {debt.interestRate > 0 && (
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>Interest</p>
                        <p className="text-sm font-semibold text-white">{debt.interestRate}% APR</p>
                      </div>
                    )}
                    {debt.monthlyPayment > 0 && (
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>Monthly</p>
                        <p className="text-sm font-semibold text-white">{fmt(debt.monthlyPayment)}</p>
                      </div>
                    )}
                    {months !== null && (
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>Est. payoff</p>
                        <p className="text-sm font-semibold text-white">
                          {months <= 0 ? 'Paid off 🎉' : months < 12 ? `${months} mo` : `${(months/12).toFixed(1)} yrs`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={closeForm}>
          <form
            className="w-full sm:max-w-md p-6 space-y-4 rounded-t-3xl sm:rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '92dvh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="sm:hidden flex justify-center -mt-2 mb-1">
              <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">{editDebt ? 'Edit Debt' : 'Add Debt'}</h2>
              <button type="button" onClick={closeForm} className="p-1.5 rounded-lg"
                style={{ color: 'var(--text-3)' }}><X size={18} /></button>
            </div>
            {dbError && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--red)' }}>
                <AlertCircle size={14} className="flex-shrink-0" /> {dbError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Name *</label>
                <input ref={nameRef} required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Barclaycard" className="apple-input" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Type *</label>
                <select required value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="apple-input">
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Original (£) *</label>
                  <input required type="number" min="0.01" step="any" value={form.totalAmount}
                    onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
                    placeholder="5000" className="apple-input" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Remaining (£)</label>
                  <input type="number" min="0" step="any" value={form.remaining}
                    onChange={e => setForm(f => ({ ...f, remaining: e.target.value }))}
                    placeholder="Same" className="apple-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Interest (%)</label>
                  <input type="number" min="0" step="0.01" value={form.interestRate}
                    onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))}
                    placeholder="19.9" className="apple-input" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Monthly (£)</label>
                  <input type="number" min="0" step="any" value={form.monthlyPayment}
                    onChange={e => setForm(f => ({ ...f, monthlyPayment: e.target.value }))}
                    placeholder="150" className="apple-input" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={closeForm} className="apple-button-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="apple-button-primary flex-1">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                {editDebt ? 'Save changes' : 'Add debt'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
