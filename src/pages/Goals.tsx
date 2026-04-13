import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Target, Plus, Trash2, X } from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  emoji: string;
}

const STORAGE_KEY = 'spendmapr_goals';
const EMOJIS = ['🎯', '🏠', '✈️', '🚗', '📚', '💍', '🏖️', '💰', '🛡️', '🎓'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', target: '', current: '', deadline: '', emoji: '🎯' });
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (showForm) setTimeout(() => nameRef.current?.focus(), 50);
  }, [showForm]);

  const resetForm = () => setForm({ name: '', target: '', current: '', deadline: '', emoji: '🎯' });

  const handleAdd = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const goal: Goal = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      target: parseFloat(form.target) || 0,
      current: parseFloat(form.current) || 0,
      deadline: form.deadline,
      emoji: form.emoji,
    };
    setGoals(prev => [goal, ...prev]);
    resetForm();
    setShowForm(false);
  };

  const handleDelete = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));

  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalSaved = goals.reduce((s, g) => s + g.current, 0);

  return (
    <div className="page-shell">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="section-title">Goals</h1>
            <p className="section-copy">Set and track your financial goals.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="apple-button-primary flex items-center gap-2 whitespace-nowrap">
            <Plus size={16} />
            Add Goal
          </button>
        </div>

        {/* Summary bar */}
        {goals.length > 0 && (
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

        {/* Goal cards */}
        {goals.length === 0 ? (
          <Card>
            <CardContent>
              <div className="empty-state">
                <div className="text-center space-y-4">
                  <div className="text-5xl">🎯</div>
                  <h3 className="empty-state-title">No Goals Yet</h3>
                  <p className="empty-state-copy">Create your first savings goal to start tracking your progress.</p>
                  <button onClick={() => setShowForm(true)} className="apple-button-primary">
                    Create Goal
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {goals.map(goal => {
              const pct = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
              const remaining = goal.target - goal.current;
              const isComplete = pct >= 100;
              return (
                <div key={goal.id} className="interactive-card panel p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{goal.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-slate-900">{goal.name}</h3>
                        {goal.deadline && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            By {new Date(goal.deadline).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors p-1 -mr-1 flex-shrink-0"
                      aria-label="Delete goal"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="space-y-2">
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
                      {!isComplete && <span>{fmt(remaining)} to go</span>}
                      {isComplete && <span className="text-emerald-500 font-medium">Goal reached! 🎉</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => { setShowForm(false); resetForm(); }}
        >
          <form
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
            onClick={e => e.stopPropagation()}
            onSubmit={handleAdd}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">New Goal</h2>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Emoji picker */}
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} type="button"
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={`text-xl p-1.5 rounded-lg transition-colors ${form.emoji === e ? 'bg-slate-100 ring-2 ring-slate-300' : 'hover:bg-slate-50'}`}>
                  {e}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Goal name *</label>
                <input ref={nameRef} required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Emergency fund"
                  className="apple-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Target (£) *</label>
                  <input required type="number" min="1" step="any" value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                    placeholder="5000"
                    className="apple-input" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Saved so far (£)</label>
                  <input type="number" min="0" step="any" value={form.current}
                    onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
                    placeholder="0"
                    className="apple-input" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Target date</label>
                <input type="date" value={form.deadline}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="apple-input" />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="apple-button-secondary flex-1">Cancel</button>
              <button type="submit" className="apple-button-primary flex-1">
                <Target size={15} className="mr-1.5" />
                Create Goal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
