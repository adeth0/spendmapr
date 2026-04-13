import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Target, Plus, Trash2, X, Pencil, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getGoals, insertGoal, patchGoal, removeGoal, type GoalRow } from '../lib/db';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string; // '' when none
  emoji: string;
}

type FormState = {
  name: string;
  target: string;
  current: string;
  deadline: string;
  emoji: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = 'spendmapr_goals';
const EMOJIS = ['🎯', '🏠', '✈️', '🚗', '📚', '💍', '🏖️', '💰', '🛡️', '🎓'];
const BLANK_FORM: FormState = { name: '', target: '', current: '', deadline: '', emoji: '🎯' };

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

// ─── DB ↔ component mappers ───────────────────────────────────────────────────

function rowToGoal(r: GoalRow): Goal {
  return {
    id: r.id,
    name: r.name,
    target: r.target_amount,
    current: r.current_amount,
    deadline: r.deadline ?? '',
    emoji: r.emoji,
  };
}

// ─── Demo-mode localStorage helpers ──────────────────────────────────────────

function lsLoad(): Goal[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function lsSave(goals: Goal[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(goals));
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="panel p-5 space-y-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-slate-200" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-16 bg-slate-200 rounded" />
          <div className="h-4 w-16 bg-slate-100 rounded" />
        </div>
        <div className="h-2 bg-slate-100 rounded-full" />
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
  const [form,     setForm]     = useState<FormState>(BLANK_FORM);
  const [saving,   setSaving]   = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isDemoMode || !user) {
      setGoals(lsLoad());
      setLoading(false);
      return;
    }
    setLoading(true);
    getGoals(user.id)
      .then(rows => setGoals(rows.map(rowToGoal)))
      .catch(e => setDbError(e.message))
      .finally(() => setLoading(false));
  }, [user?.id, isDemoMode]);

  // ── Focus first field when modal opens ───────────────────────────────────

  useEffect(() => {
    if (showForm) setTimeout(() => nameRef.current?.focus(), 50);
  }, [showForm]);

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const openCreate = () => { setEditGoal(null); setForm(BLANK_FORM); setShowForm(true); };

  const openEdit = (g: Goal) => {
    setEditGoal(g);
    setForm({
      name:     g.name,
      target:   String(g.target),
      current:  String(g.current),
      deadline: g.deadline,
      emoji:    g.emoji,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditGoal(null);
    setForm(BLANK_FORM);
    setDbError(null);
  };

  // ── Submit (create or update) ─────────────────────────────────────────────

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const targetVal  = parseFloat(form.target);
    const currentVal = Math.max(0, parseFloat(form.current) || 0);
    if (!form.name.trim() || isNaN(targetVal) || targetVal <= 0) return;

    setSaving(true);
    setDbError(null);

    const payload: Omit<GoalRow, 'id'> = {
      name:           form.name.trim(),
      target_amount:  targetVal,
      current_amount: currentVal,
      deadline:       form.deadline || null,
      emoji:          form.emoji,
    };

    try {
      if (isDemoMode || !user) {
        /* ── demo / localStorage path ── */
        if (editGoal) {
          const next = goals.map(g =>
            g.id === editGoal.id
              ? { ...g, name: payload.name, target: payload.target_amount,
                  current: payload.current_amount, deadline: payload.deadline ?? '',
                  emoji: payload.emoji }
              : g,
          );
          setGoals(next); lsSave(next);
        } else {
          const next = [
            { id: crypto.randomUUID(), name: payload.name, target: payload.target_amount,
              current: payload.current_amount, deadline: payload.deadline ?? '',
              emoji: payload.emoji },
            ...goals,
          ];
          setGoals(next); lsSave(next);
        }
      } else {
        /* ── Supabase path ── */
        if (editGoal) {
          const row = await patchGoal(editGoal.id, payload);
          setGoals(prev => prev.map(g => g.id === editGoal.id ? rowToGoal(row) : g));
        } else {
          const row = await insertGoal(user.id, payload);
          setGoals(prev => [rowToGoal(row), ...prev]);
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
    if (!window.confirm('Delete this goal?')) return;
    setDbError(null);
    try {
      if (isDemoMode || !user) {
        const next = goals.filter(g => g.id !== id);
        setGoals(next); lsSave(next);
      } else {
        await removeGoal(id);
        setGoals(prev => prev.filter(g => g.id !== id));
      }
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Could not delete goal');
    }
  };

  // ── Derived totals ────────────────────────────────────────────────────────

  const totalTarget = goals.reduce((s, g) => s + g.target,  0);
  const totalSaved  = goals.reduce((s, g) => s + g.current, 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page-shell">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="section-title">Goals</h1>
            <p className="section-copy">Set and track your financial goals.</p>
          </div>
          <button onClick={openCreate} className="apple-button-primary flex items-center gap-2 whitespace-nowrap">
            <Plus size={16} />
            Add Goal
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

        {/* Summary bar */}
        {!loading && goals.length > 0 && (
          <div className="panel p-5 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Saved</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(totalSaved)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Target</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(totalTarget)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Goals</p>
              <p className="text-2xl font-bold text-slate-900">{goals.length}</p>
            </div>
          </div>
        )}

        {/* Cards / empty state */}
        {!loading && (
          goals.length === 0 ? (
            <Card>
              <CardContent>
                <div className="empty-state">
                  <div className="text-center space-y-4">
                    <div className="text-5xl">🎯</div>
                    <h3 className="empty-state-title">No Goals Yet</h3>
                    <p className="empty-state-copy">Create your first savings goal to start tracking your progress.</p>
                    <button onClick={openCreate} className="apple-button-primary">
                      Create Goal
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {goals.map(goal => {
                const pct       = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
                const remaining = goal.target - goal.current;
                const isComplete = pct >= 100;
                return (
                  <div key={goal.id} className="interactive-card panel p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{goal.emoji}</span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">{goal.name}</h3>
                          {goal.deadline && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              By {new Date(goal.deadline).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => openEdit(goal)}
                          className="text-slate-300 hover:text-slate-500 transition-colors p-1.5 rounded-lg hover:bg-slate-50"
                          aria-label="Edit goal"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="text-slate-300 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                          aria-label="Delete goal"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{fmt(goal.current)}</span>
                        <span className="text-slate-400">{fmt(goal.target)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-slate-900'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{pct.toFixed(0)}% complete</span>
                        {isComplete
                          ? <span className="text-emerald-500 font-medium">Goal reached! 🎉</span>
                          : <span>{fmt(remaining)} to go</span>
                        }
                      </div>
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
                {editGoal ? 'Edit Goal' : 'New Goal'}
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

            {/* Emoji picker */}
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button
                  key={e} type="button"
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={`text-2xl p-2 rounded-xl transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center ${
                    form.emoji === e ? 'bg-slate-100 ring-2 ring-slate-300' : 'hover:bg-slate-50'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Goal name *</label>
                <input
                  ref={nameRef}
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Emergency fund"
                  className="apple-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Target (£) *</label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="any"
                    value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                    placeholder="5000"
                    className="apple-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Saved so far (£)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.current}
                    onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
                    placeholder="0"
                    className="apple-input"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Target date</label>
                <input
                  type="date"
                  value={form.deadline}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="apple-input"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1 pb-1">
              <button type="button" onClick={closeForm} className="apple-button-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="apple-button-primary flex-1">
                {saving
                  ? <Loader2 size={15} className="mr-1.5 animate-spin" />
                  : <Target size={15} className="mr-1.5" />
                }
                {editGoal ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
