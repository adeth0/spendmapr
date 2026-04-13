import { useState, useEffect, useRef } from 'react';
import { Target, Plus, Trash2, X, Pencil, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getGoals, insertGoal, patchGoal, removeGoal, type GoalRow } from '../lib/db';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Goal {
  id: string; name: string; target: number;
  current: number; deadline: string; emoji: string;
}
type FormState = { name: string; target: string; current: string; deadline: string; emoji: string };

const LS_KEY    = 'spendmapr_goals';
const EMOJIS    = ['🎯', '🏠', '✈️', '🚗', '📚', '💍', '🏖️', '💰', '🛡️', '🎓'];
const BLANK     = (): FormState => ({ name: '', target: '', current: '', deadline: '', emoji: '🎯' });

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

// ─── Mappers ──────────────────────────────────────────────────────────────────
function rowToGoal(r: GoalRow): Goal {
  return { id: r.id, name: r.name, target: r.target_amount,
    current: r.current_amount, deadline: r.deadline ?? '', emoji: r.emoji };
}
function lsLoad(): Goal[] { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } }
function lsSave(g: Goal[]) { localStorage.setItem(LS_KEY, JSON.stringify(g)); }

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="panel p-5 space-y-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-xl" style={{ background: 'var(--bg-raised)' }} />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 rounded" style={{ background: 'var(--bg-raised)' }} />
          <div className="h-3 w-20 rounded" style={{ background: 'var(--border)' }} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-16 rounded" style={{ background: 'var(--bg-raised)' }} />
          <div className="h-4 w-16 rounded" style={{ background: 'var(--border)' }} />
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }} />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Goals() {
  const { user, isDemoMode } = useAuth();
  const [goals,    setGoals]    = useState<Goal[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [dbError,  setDbError]  = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [form,     setForm]     = useState<FormState>(BLANK());
  const [saving,   setSaving]   = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDemoMode || !user) { setGoals(lsLoad()); setLoading(false); return; }
    setLoading(true);
    getGoals(user.id).then(r => setGoals(r.map(rowToGoal)))
      .catch(e => setDbError(e.message)).finally(() => setLoading(false));
  }, [user?.id, isDemoMode]);

  useEffect(() => { if (showForm) setTimeout(() => nameRef.current?.focus(), 50); }, [showForm]);

  const openCreate = () => { setEditGoal(null); setForm(BLANK()); setShowForm(true); };
  const openEdit   = (g: Goal) => {
    setEditGoal(g);
    setForm({ name: g.name, target: String(g.target), current: String(g.current), deadline: g.deadline, emoji: g.emoji });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditGoal(null); setForm(BLANK()); setDbError(null); };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const tv = parseFloat(form.target);
    const cv = Math.max(0, parseFloat(form.current) || 0);
    if (!form.name.trim() || isNaN(tv) || tv <= 0) return;
    setSaving(true); setDbError(null);
    const payload: Omit<GoalRow, 'id'> = {
      name: form.name.trim(), target_amount: tv,
      current_amount: cv, deadline: form.deadline || null, emoji: form.emoji,
    };
    try {
      if (isDemoMode || !user) {
        if (editGoal) {
          const next = goals.map(g => g.id === editGoal.id
            ? { ...g, name: payload.name, target: payload.target_amount,
                current: payload.current_amount, deadline: payload.deadline ?? '', emoji: payload.emoji }
            : g);
          setGoals(next); lsSave(next);
        } else {
          const next = [{ id: crypto.randomUUID(), name: payload.name, target: payload.target_amount,
            current: payload.current_amount, deadline: payload.deadline ?? '', emoji: payload.emoji }, ...goals];
          setGoals(next); lsSave(next);
        }
      } else {
        if (editGoal) {
          const r = await patchGoal(editGoal.id, payload);
          setGoals(p => p.map(g => g.id === editGoal.id ? rowToGoal(r) : g));
        } else {
          const r = await insertGoal(user.id, payload);
          setGoals(p => [rowToGoal(r), ...p]);
        }
      }
      closeForm();
    } catch (err) { setDbError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      if (isDemoMode || !user) { const n = goals.filter(g => g.id !== id); setGoals(n); lsSave(n); }
      else { await removeGoal(id); setGoals(p => p.filter(g => g.id !== id)); }
    } catch (err) { setDbError(err instanceof Error ? err.message : 'Could not delete'); }
  };

  const totalTarget = goals.reduce((s, g) => s + g.target,  0);
  const totalSaved  = goals.reduce((s, g) => s + g.current, 0);

  return (
    <div className="page-shell">
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="section-title">Goals</h1>
            <p className="section-copy">Track your savings targets.</p>
          </div>
          <button onClick={openCreate} className="apple-button-primary whitespace-nowrap">
            <Plus size={16} /> Add Goal
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
        {!loading && goals.length > 0 && (
          <div className="panel p-5 flex flex-wrap gap-6">
            {[
              { label: 'Total Saved',  value: fmt(totalSaved) },
              { label: 'Total Target', value: fmt(totalTarget) },
              { label: 'Goals',        value: String(goals.length) },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                <p className="text-2xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Cards / empty state */}
        {!loading && (goals.length === 0 ? (
          <div className="panel">
            <div className="empty-state flex-col space-y-4">
              <div className="text-5xl">🎯</div>
              <h3 className="empty-state-title">No goals yet</h3>
              <p className="empty-state-copy">Create your first savings goal to start tracking progress.</p>
              <button onClick={openCreate} className="apple-button-primary">Create goal</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {goals.map(goal => {
              const pct       = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
              const remaining = goal.target - goal.current;
              const done      = pct >= 100;
              return (
                <div key={goal.id} className="panel interactive-card p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0">{goal.emoji}</span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white truncate">{goal.name}</h3>
                        {goal.deadline && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                            By {new Date(goal.deadline).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => openEdit(goal)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-3)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                        aria-label="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(goal.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-3)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                        aria-label="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-white">{fmt(goal.current)}</span>
                      <span style={{ color: 'var(--text-3)' }}>{fmt(goal.target)}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: done ? 'var(--green)' : 'var(--accent)' }} />
                    </div>
                    <div className="flex justify-between text-xs" style={{ color: 'var(--text-3)' }}>
                      <span>{pct.toFixed(0)}% complete</span>
                      {done
                        ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>Goal reached 🎉</span>
                        : <span>{fmt(remaining)} to go</span>}
                    </div>
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
            className="w-full sm:max-w-md p-6 space-y-5 rounded-t-3xl sm:rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '92dvh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="sm:hidden flex justify-center -mt-2 mb-1">
              <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">{editGoal ? 'Edit Goal' : 'New Goal'}</h2>
              <button type="button" onClick={closeForm} className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-3)' }}><X size={18} /></button>
            </div>
            {dbError && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--red)' }}>
                <AlertCircle size={14} className="flex-shrink-0" /> {dbError}
              </div>
            )}
            {/* Emoji picker */}
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} type="button"
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className="text-xl h-11 w-11 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: form.emoji === e ? 'rgba(59,130,246,0.15)' : 'var(--bg-raised)',
                    border: form.emoji === e ? '1px solid rgba(59,130,246,0.4)' : '1px solid var(--border)',
                  }}>{e}</button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Goal name *</label>
                <input ref={nameRef} required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Emergency fund" className="apple-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Target (£) *</label>
                  <input required type="number" min="0.01" step="any" value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                    placeholder="5000" className="apple-input" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Saved so far (£)</label>
                  <input type="number" min="0" step="any" value={form.current}
                    onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
                    placeholder="0" className="apple-input" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Target date</label>
                <input type="date" value={form.deadline}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="apple-input" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={closeForm} className="apple-button-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="apple-button-primary flex-1">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Target size={15} />}
                {editGoal ? 'Save changes' : 'Create goal'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
