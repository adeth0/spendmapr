import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2, X } from 'lucide-react';
import { MarketIndices } from '../components/MarketIndices';

interface Investment {
  id: string; name: string; type: string;
  value: number; costBasis: number;
}

const LS_KEY = 'spendmapr_investments';
const TYPES  = ['Stocks','ETF','Index Fund','Crypto','Bonds','Property','Pension','ISA','Other'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

export function Investments() {
  const [investments, setInvestments] = useState<Investment[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'ETF', value: '', costBasis: '' });
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(investments)); }, [investments]);
  useEffect(() => { if (showForm) setTimeout(() => nameRef.current?.focus(), 50); }, [showForm]);

  const reset  = () => setForm({ name: '', type: 'ETF', value: '', costBasis: '' });
  const close  = () => { setShowForm(false); reset(); };

  const handleAdd = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inv: Investment = {
      id: crypto.randomUUID(), name: form.name.trim(), type: form.type,
      value: parseFloat(form.value) || 0,
      costBasis: parseFloat(form.costBasis) || parseFloat(form.value) || 0,
    };
    setInvestments(p => [inv, ...p]);
    close();
  };

  const totalValue = investments.reduce((s, i) => s + i.value,     0);
  const totalCost  = investments.reduce((s, i) => s + i.costBasis, 0);
  const totalGain  = totalValue - totalCost;
  const totalPct   = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const byType = investments.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.type] = (acc[inv.type] || 0) + inv.value; return acc;
  }, {});

  return (
    <div className="page-shell">
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="section-title">Investments</h1>
            <p className="section-copy">Track your portfolio and market performance.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="apple-button-primary whitespace-nowrap">
            <Plus size={16} /> Add Holding
          </button>
        </div>

        {/* Live indices */}
        <MarketIndices />

        {/* Portfolio summary */}
        {investments.length > 0 && (
          <div className="panel p-5 flex flex-wrap gap-6">
            {[
              { label: 'Portfolio Value', value: fmt(totalValue),       style: undefined },
              { label: 'Total Return',   value: fmt(totalGain),         style: { color: totalGain >= 0 ? 'var(--green)' : 'var(--red)' } },
              { label: 'Return %',       value: fmtPct(totalPct),       style: { color: totalPct  >= 0 ? 'var(--green)' : 'var(--red)' } },
              { label: 'Holdings',       value: String(investments.length), style: undefined },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                <p className="text-2xl font-bold text-white" style={s.style}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Allocation */}
        {investments.length > 1 && (
          <div className="panel p-5 space-y-4">
            <p className="text-sm font-semibold text-white">Allocation</p>
            {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, value]) => {
              const pct = totalValue > 0 ? (value / totalValue) * 100 : 0;
              return (
                <div key={type} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-2)' }}>{type}</span>
                    <span className="font-medium text-white">{fmt(value)} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Holdings */}
        {investments.length === 0 ? (
          <div className="panel">
            <div className="empty-state flex-col space-y-4">
              <div className="text-5xl">📈</div>
              <h3 className="empty-state-title">No holdings added</h3>
              <p className="empty-state-copy">Add your investments to track performance and portfolio value.</p>
              <button onClick={() => setShowForm(true)} className="apple-button-primary">Add holding</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {investments.map(inv => {
              const gain    = inv.value - inv.costBasis;
              const gainPct = inv.costBasis > 0 ? (gain / inv.costBasis) * 100 : 0;
              const isUp    = gain >= 0;
              return (
                <div key={inv.id} className="panel interactive-card p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">{inv.name}</h3>
                      <span className="badge-blue mt-1">{inv.type}</span>
                    </div>
                    <button
                      onClick={() => setInvestments(p => p.filter(i => i.id !== inv.id))}
                      className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                      style={{ color: 'var(--text-3)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                      aria-label="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Current value</p>
                      <p className="text-xl font-bold text-white">{fmt(inv.value)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold"
                      style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}>
                      {isUp ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                      {fmtPct(gainPct)}
                    </div>
                  </div>
                  {inv.costBasis !== inv.value && (
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      Cost basis: {fmt(inv.costBasis)} ·{' '}
                      <span style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}>
                        {isUp ? '+' : ''}{fmt(gain)}
                      </span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={close}>
          <form
            className="w-full sm:max-w-md p-6 space-y-5 rounded-t-3xl sm:rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '92dvh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
            onSubmit={handleAdd}
          >
            <div className="sm:hidden flex justify-center -mt-2 mb-1">
              <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Add Holding</h2>
              <button type="button" onClick={close} className="p-1.5 rounded-lg"
                style={{ color: 'var(--text-3)' }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Name *</label>
                <input ref={nameRef} required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Vanguard S&P 500 ETF" className="apple-input" />
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
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Current value (£) *</label>
                  <input required type="number" min="0" step="any" value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    placeholder="1000" className="apple-input" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Cost basis (£)</label>
                  <input type="number" min="0" step="any" value={form.costBasis}
                    onChange={e => setForm(f => ({ ...f, costBasis: e.target.value }))}
                    placeholder="Same" className="apple-input" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={close} className="apple-button-secondary flex-1">Cancel</button>
              <button type="submit" className="apple-button-primary flex-1">
                <TrendingUp size={15} /> Add Holding
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
