/**
 * CreditScoreCard — SVG half-gauge + band label + expandable insights.
 *
 * Usage (compact mode for Dashboard):
 *   <CreditScoreCard compact />
 *
 * Usage (full mode for a dedicated section):
 *   <CreditScoreCard />
 *
 * The card derives everything from ProfileContext + live debt data passed
 * in via props, so it stays in sync without additional fetches.
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import {
  calculateCreditScore,
  bandForScore,
  colorForBand,
  type CreditInput,
} from '../lib/creditScoreService';
import {
  generateInsights,
  insightColor,
  insightBg,
  insightBorder,
} from '../lib/insightsService';
import type { UserProfile } from '../lib/profileDb';

// ─── SVG gauge ────────────────────────────────────────────────────────────────

/**
 * Half-circle gauge.
 * ViewBox 200 × 120, arc from left (15,100) to right (185,100), r=85.
 * strokeDasharray fills the arc proportionally to pct (0-1).
 */
function ScoreGauge({ score, color }: { score: number; color: string }) {
  const r   = 85;
  const cx  = 100;
  const cy  = 100;
  const pct = (score - 300) / 550;

  // Full half-circle arc length
  const totalLen = Math.PI * r; // ≈ 267

  const filledLen = pct * totalLen;

  return (
    <svg viewBox="0 0 200 120" className="w-full" aria-hidden="true">
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="var(--border)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${filledLen} ${totalLen}`}
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)' }}
      />
      {/* Score label */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill="white"
        fontSize={36}
        fontWeight={700}
        fontFamily="inherit"
        letterSpacing="-1"
      >
        {score}
      </text>
      {/* Range labels */}
      <text x={cx - r + 4} y={cy + 16} fill="var(--text-3)" fontSize={10} fontFamily="inherit">300</text>
      <text x={cx + r - 4} y={cy + 16} fill="var(--text-3)" fontSize={10} fontFamily="inherit" textAnchor="end">850</text>
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreditScoreCardProps {
  profile:      UserProfile | null;
  totalDebt:    number;
  /** Sum of original_amounts — used as total credit limit proxy. */
  totalLimit:   number;
  debtCount:    number;
  totalBalance:     number;
  totalInvestments: number;
  /** Render a more compact layout for the dashboard summary. */
  compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreditScoreCard({
  profile, totalDebt, totalLimit, debtCount,
  totalBalance, totalInvestments, compact = false,
}: CreditScoreCardProps) {
  const [expanded, setExpanded] = useState(false);

  const input: CreditInput = {
    monthlyIncome:    profile?.monthly_income ?? 0,
    totalDebt,
    totalCreditLimit: totalLimit,
    debtCount,
  };

  const cs       = calculateCreditScore(input);
  const band     = bandForScore(cs.score);
  const color    = colorForBand(band);
  const insights = generateInsights({ profile, creditScore: cs, totalDebt, totalBalance, totalInvestments });

  // ── Band badge ─────────────────────────────────────────────────────────────
  const bandBadge = (
    <span
      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
      style={{
        background: `${color}18`,
        color,
      }}
    >
      {band}
    </span>
  );

  // ── Compact mode — fits inside dashboard alongside other cards ─────────────
  if (compact) {
    return (
      <div className="panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Credit Score</h2>
          {bandBadge}
        </div>

        <ScoreGauge score={cs.score} color={color} />

        {/* Top insight */}
        {insights[0] && (
          <div
            className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-xs"
            style={{
              background: insightBg(insights[0].type),
              border:     `1px solid ${insightBorder(insights[0].type)}`,
              color:      insightColor(insights[0].type),
            }}
          >
            <Info size={13} className="flex-shrink-0 mt-0.5" />
            <span>{insights[0].title}</span>
          </div>
        )}

        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70 w-full justify-center pt-1"
          style={{ color: 'var(--text-3)' }}
        >
          {expanded ? 'Hide insights' : `View all insights (${insights.length})`}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {expanded && (
          <InsightsList insights={insights} />
        )}
      </div>
    );
  }

  // ── Full mode ──────────────────────────────────────────────────────────────
  return (
    <div className="panel p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Credit Score</h2>
        {bandBadge}
      </div>

      <ScoreGauge score={cs.score} color={color} />

      {/* Band description */}
      <div className="text-center -mt-2">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          {band === 'Excellent' && 'Top-tier score — you\'ll qualify for the best rates.'}
          {band === 'Good'      && 'Above average — most lenders will offer competitive rates.'}
          {band === 'Fair'      && 'Below average — some lenders may decline or charge higher rates.'}
          {band === 'Poor'      && 'Needs improvement — focus on reducing debt and paying on time.'}
        </p>
      </div>

      {/* Score factors */}
      <ScoreFactors input={input} score={cs.score} color={color} />

      {/* All insights */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-white">Insights</p>
        <InsightsList insights={insights} />
      </div>
    </div>
  );
}

// ─── Score factors breakdown ──────────────────────────────────────────────────

function ScoreFactors({ input, score, color }: { input: CreditInput; score: number; color: string }) {
  const dti  = input.monthlyIncome > 0
    ? input.totalDebt / (input.monthlyIncome * 12)
    : 0;
  const util = input.totalCreditLimit > 0
    ? input.totalDebt / input.totalCreditLimit
    : 0;

  const factors: { label: string; value: string; good: boolean }[] = [
    {
      label: 'Debt-to-income',
      value: input.monthlyIncome > 0 ? `${(dti * 100).toFixed(0)}%` : 'Unknown',
      good:  dti < 0.3,
    },
    {
      label: 'Credit utilisation',
      value: input.totalCreditLimit > 0 ? `${(util * 100).toFixed(0)}%` : '—',
      good:  util < 0.3,
    },
    {
      label: 'Open debts',
      value: String(input.debtCount),
      good:  input.debtCount <= 2,
    },
    {
      label: 'Score',
      value: String(score),
      good:  score >= 670,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {factors.map(f => (
        <div
          key={f.label}
          className="rounded-xl px-3 py-2.5 space-y-0.5"
          style={{ background: 'var(--bg-raised)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{f.label}</p>
          <p
            className="text-sm font-semibold"
            style={{ color: f.good ? color : 'var(--text-1)' }}
          >
            {f.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Insights list ────────────────────────────────────────────────────────────

function InsightsList({ insights }: { insights: ReturnType<typeof generateInsights> }) {
  return (
    <div className="space-y-2">
      {insights.map(ins => (
        <div
          key={ins.id}
          className="rounded-xl px-3.5 py-3 text-xs space-y-1"
          style={{
            background: insightBg(ins.type),
            border:     `1px solid ${insightBorder(ins.type)}`,
          }}
        >
          <p className="font-semibold" style={{ color: insightColor(ins.type) }}>
            {ins.title}
          </p>
          <p style={{ color: 'var(--text-2)' }}>{ins.detail}</p>
        </div>
      ))}
    </div>
  );
}
