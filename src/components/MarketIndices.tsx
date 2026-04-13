import { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { fetchMarketData, clearMarketCache, type IndexQuote, type MarketResult } from '../lib/marketData';

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtIdx = (n: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtChg = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}`;
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="panel p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-3 w-12 rounded" style={{ background: 'var(--bg-raised)' }} />
          <div className="h-4 w-24 rounded" style={{ background: 'var(--border)' }} />
        </div>
        <div className="h-6 w-14 rounded-full" style={{ background: 'var(--bg-raised)' }} />
      </div>
      <div className="h-7 w-28 rounded" style={{ background: 'var(--bg-raised)' }} />
      <div className="h-[60px] rounded-xl" style={{ background: 'var(--border)' }} />
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
interface TooltipProps { active?: boolean; payload?: { value: number }[]; label?: string }

function SparkTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-2.5 py-1.5 text-xs shadow-lg pointer-events-none"
      style={{ background: '#0f1623', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
      <p style={{ color: 'var(--text-3)' }} className="mb-0.5">{label}</p>
      <p className="font-semibold">{fmtIdx(payload[0].value)}</p>
    </div>
  );
}

// ─── Index card ───────────────────────────────────────────────────────────────
function IndexCard({ quote }: { quote: IndexQuote }) {
  const color  = quote.isUp ? '#22c55e' : '#ef4444';
  const gradId = `grad-${quote.symbol.replace(/[\^]/g, '')}`;
  const prices = quote.chartData.map(d => d.price).filter(Boolean);
  const minP   = Math.min(...prices) * 0.9995;
  const maxP   = Math.max(...prices) * 1.0005;

  return (
    <div className="panel interactive-card p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
            {quote.ticker}
          </p>
          <h3 className="font-semibold text-white mt-0.5 leading-tight">{quote.name}</h3>
        </div>
        <span
          className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{
            background: quote.isUp ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            color,
          }}
        >
          {quote.isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {fmtPct(quote.changePercent)}
        </span>
      </div>

      {/* Price */}
      <div>
        <p className="text-2xl font-bold text-white tabular-nums">{fmtIdx(quote.price)}</p>
        <p className="text-xs font-medium mt-0.5" style={{ color }}>
          {fmtChg(quote.change)} today
        </p>
      </div>

      {/* Sparkline */}
      {quote.chartData.length > 1 && (
        <div className="rounded-xl overflow-hidden -mx-1">
          <ResponsiveContainer width="100%" height={60}>
            <AreaChart data={quote.chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <YAxis domain={[minP, maxP]} hide />
              <Tooltip content={<SparkTooltip />} />
              <Area
                type="monotone" dataKey="price"
                stroke={color} strokeWidth={1.75}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type Status = 'idle' | 'loading' | 'done' | 'error';

export function MarketIndices() {
  const [result,    setResult]    = useState<MarketResult | null>(null);
  const [status,    setStatus]    = useState<Status>('idle');
  const [refreshing,setRefreshing]= useState(false);

  const load = useCallback(async (force = false) => {
    if (force) { clearMarketCache(); setRefreshing(true); }
    else       { setStatus('loading'); }
    try {
      const r = await fetchMarketData();
      setResult(r); setStatus('done');
    } catch {
      setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const lastUpdated = result?.data?.[0]?.lastUpdated;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Market Indices</h2>
          {lastUpdated && (
            <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              <Clock size={11} />
              Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              {result?.isMock && ' · estimated data'}
            </p>
          )}
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing || status === 'loading'}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          style={{ color: 'var(--text-2)' }}
          onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = 'var(--bg-raised)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Refresh market data"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Mock/error banners */}
      {result?.isMock && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
          <AlertCircle size={14} className="flex-shrink-0" />
          Live data unavailable — showing estimates. Market data may be delayed.
        </div>
      )}
      {status === 'error' && !result && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)' }}>
          <span className="flex items-center gap-2">
            <AlertCircle size={14} /> Could not load market data.
          </span>
          <button onClick={() => load(true)} className="font-semibold underline underline-offset-2">Retry</button>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {status === 'loading' && !result
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : result?.data.map(q => <IndexCard key={q.symbol} quote={q} />)
        }
      </div>
    </section>
  );
}
