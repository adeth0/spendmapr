import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, Tooltip, ResponsiveContainer, YAxis,
} from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { fetchMarketData, clearMarketCache, type IndexQuote, type MarketResult } from '../lib/marketData';

// ─── Number formatters ────────────────────────────────────────────────────────

function fmtIndex(n: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtChange(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}`;
}

function fmtPct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="panel p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-4 w-24 bg-slate-100 rounded" />
        </div>
        <div className="h-6 w-14 bg-slate-100 rounded-full" />
      </div>
      <div className="h-7 w-32 bg-slate-200 rounded" />
      <div className="h-[60px] bg-slate-100 rounded-xl" />
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function SparkTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none">
      <p className="text-slate-400 mb-0.5">{label}</p>
      <p className="font-semibold">{fmtIndex(payload[0].value)}</p>
    </div>
  );
}

// ─── Single index card ────────────────────────────────────────────────────────

function IndexCard({ quote }: { quote: IndexQuote }) {
  const color   = quote.isUp ? '#10b981' : '#ef4444'; // emerald-500 / red-500
  const bgClass = quote.isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600';
  const gradId  = `grad-${quote.symbol.replace(/[\^]/g, '')}`;

  // Y-axis domain — tight to the data range so the chart fills nicely
  const prices = quote.chartData.map(d => d.price).filter(Boolean);
  const minP   = Math.min(...prices) * 0.9995;
  const maxP   = Math.max(...prices) * 1.0005;

  return (
    <div className="interactive-card panel p-5 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{quote.ticker}</p>
          <h3 className="font-semibold text-slate-900 mt-0.5 leading-tight">{quote.name}</h3>
        </div>
        <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${bgClass} whitespace-nowrap`}>
          {quote.isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {fmtPct(quote.changePercent)}
        </span>
      </div>

      {/* Price row */}
      <div>
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{fmtIndex(quote.price)}</p>
        <p className={`text-xs font-medium mt-0.5 ${quote.isUp ? 'text-emerald-600' : 'text-red-500'}`}>
          {fmtChange(quote.change)} today
        </p>
      </div>

      {/* Sparkline */}
      {quote.chartData.length > 1 && (
        <div className="rounded-xl overflow-hidden -mx-1">
          <ResponsiveContainer width="100%" height={64}>
            <AreaChart data={quote.chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[minP, maxP]} hide />
              <Tooltip content={<SparkTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={color}
                strokeWidth={1.75}
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

// ─── Main component ───────────────────────────────────────────────────────────

type Status = 'idle' | 'loading' | 'done' | 'error';

export function MarketIndices() {
  const [result,    setResult]    = useState<MarketResult | null>(null);
  const [status,    setStatus]    = useState<Status>('idle');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      clearMarketCache();
      setRefreshing(true);
    } else {
      setStatus('loading');
    }

    try {
      const r = await fetchMarketData();
      setResult(r);
      setStatus('done');
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
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Market Indices</h2>
          {lastUpdated && (
            <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <Clock size={11} />
              Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              {result?.isMock && ' · estimated data'}
            </p>
          )}
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing || status === 'loading'}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-40 px-3 py-1.5 rounded-lg hover:bg-slate-100"
          aria-label="Refresh market data"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Mock/error banner */}
      {result?.isMock && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>Live data unavailable — showing estimates. Market data may be delayed.</span>
        </div>
      )}
      {status === 'error' && !result && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <span className="flex items-center gap-2">
            <AlertCircle size={14} />
            Could not load market data.
          </span>
          <button onClick={() => load(true)} className="font-medium underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {status === 'loading' && !result
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : result?.data.map(quote => <IndexCard key={quote.symbol} quote={quote} />)
        }
      </div>
    </section>
  );
}
