import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { TrendingUp, TrendingDown, Plus, Trash2, X } from 'lucide-react';

interface Investment {
  id: string;
  name: string;
  type: string;
  value: number;
  costBasis: number;
}

const STORAGE_KEY = 'spendmapr_investments';

const TYPES = ['Stocks', 'ETF', 'Index Fund', 'Crypto', 'Bonds', 'Property', 'Pension', 'ISA', 'Other'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

const fmtPct = (n: number) =>
  `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

export function Investments() {
  const [investments, setInvestments] = useState<Investment[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Stocks', value: '', costBasis: '' });
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    if (showForm) setTimeout(() => nameRef.current?.focus(), 50);
  }, [showForm]);

  const resetForm = () => setForm({ name: '', type: 'Stocks', value: '', costBasis: '' });

  const handleAdd = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inv: Investment = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      type: form.type,
      value: parseFloat(form.value) || 0,
      costBasis: parseFloat(form.costBasis) || parseFloat(form.value) || 0,
    };
    setInvestments(prev => [inv, ...prev]);
    resetForm();
    setShowForm(false);
  };

  const handleDelete = (id: string) => setInvestments(prev => prev.filter(i => i.id !== id));

  const totalValue = investments.reduce((s, i) => s + i.value, 0);
  const totalCost = investments.reduce((s, i) => s + i.costBasis, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  // Group by type for breakdown
  const byType = investments.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.type] = (acc[inv.type] || 0) + inv.value;
    return acc;
  }, {});

  return (
    <div className="page-shell">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="section-title">Investments</h1>
            <p className="section-copy">Track your portfolio performance and holdings.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="apple-button-primary flex items-center gap-2 whitespace-nowrap">
            <Plus size={16} />
            Add Holding
          </button>
        </div>

        {/* Portfolio summary */}
        {investments.length > 0 && (
          <div className="panel p-5 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Portfolio Value</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(totalValue)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Return</p>
              <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {fmt(totalGain)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Return %</p>
              <p className={`text-2xl font-bold ${totalGainPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {fmtPct(totalGainPct)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Holdings</p>
              <p className="text-2xl font-bold text-slate-900">{investments.length}</p>
            </div>
          </div>
        )}

        {/* Allocation breakdown */}
        {investments.length > 1 && (
          <div className="panel p-5 space-y-3">
            <p className="text-sm font-semibold text-slate-700">Allocation</p>
            {Object.entries(byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, value]) => {
                const pct = totalValue > 0 ? (value / totalValue) * 100 : 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>{type}</span>
                      <span>{fmt(value)} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-800 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Holdings */}
        {investments.length === 0 ? (
          <Card>
            <CardContent>
              <div className="empty-state">
                <div className="text-center space-y-4">
                  <div className="text-5xl">📈</div>
                  <h3 className="empty-state-title">No Holdings Added</h3>
                  <p className="empty-state-copy">Add your investments to track performance and total portfolio value.</p>
                  <button onClick={() => setShowForm(true)} className="apple-button-primary">
                    Add Investment
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {investments.map(inv => {
              const gain = inv.value - inv.costBasis;
              const gainPct = inv.costBasis > 0 ? (gain / inv.costBasis) * 100 : 0;
              const isUp = gain >= 0;
              return (
                <div key={inv.id} className="interactive-card panel p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{inv.name}</h3>
                      <span className="text-xs bg-slate-100 text-slate-500 rounded-md px-2 py-0.5 font-medium">
                        {inv.type}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors p-1 -mr-1 flex-shrink-0"
                      aria-label="Delete holding"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Current value</p>
                      <p className="text-xl font-bold text-slate-900">{fmt(inv.value)}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-semibold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isUp ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                      {fmtPct(gainPct)}
                    </div>
                  </div>
                  {inv.costBasis !== inv.value && (
                    <p className="text-xs text-slate-400">
                      Cost basis: {fmt(inv.costBasis)} · {isUp ? '+' : ''}{fmt(gain)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Investment Modal */}
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
              <h2 className="text-lg font-semibold text-slate-900">Add Holding</h2>
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
                  placeholder="e.g. Vanguard S&P 500 ETF"
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
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Current value (£) *</label>
                  <input required type="number" min="0" step="any" value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    placeholder="1000"
                    className="apple-input" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Cost basis (£)</label>
                  <input type="number" min="0" step="any" value={form.costBasis}
                    onChange={e => setForm(f => ({ ...f, costBasis: e.target.value }))}
                    placeholder="Same as value"
                    className="apple-input" />
                </div>
              </div>
              <p className="text-xs text-slate-400">Cost basis is what you paid. Leave blank if the same as current value.</p>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="apple-button-secondary flex-1">Cancel</button>
              <button type="submit" className="apple-button-primary flex-1">
                <TrendingUp size={15} className="mr-1.5" />
                Add Holding
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
