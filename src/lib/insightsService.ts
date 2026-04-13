/**
 * Generates contextual financial insights from live app data.
 * Pure functions — no side effects, no imports from React.
 */
import type { UserProfile } from './profileDb';
import type { CreditScore } from './creditScoreService';

export type InsightType = 'warning' | 'info' | 'success' | 'tip';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  detail: string;
  /** Higher = shown first. */
  priority: number;
}

// ─── Colour helpers used by UI ────────────────────────────────────────────────

export function insightColor(type: InsightType): string {
  switch (type) {
    case 'warning': return '#ef4444';
    case 'info':    return '#3b82f6';
    case 'success': return '#22c55e';
    case 'tip':     return '#f59e0b';
  }
}

export function insightBg(type: InsightType): string {
  switch (type) {
    case 'warning': return 'rgba(239,68,68,0.08)';
    case 'info':    return 'rgba(59,130,246,0.08)';
    case 'success': return 'rgba(34,197,94,0.08)';
    case 'tip':     return 'rgba(245,158,11,0.08)';
  }
}

export function insightBorder(type: InsightType): string {
  switch (type) {
    case 'warning': return 'rgba(239,68,68,0.2)';
    case 'info':    return 'rgba(59,130,246,0.2)';
    case 'success': return 'rgba(34,197,94,0.2)';
    case 'tip':     return 'rgba(245,158,11,0.2)';
  }
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateInsights(params: {
  profile:          UserProfile | null;
  creditScore:      CreditScore | null;
  totalDebt:        number;
  totalBalance:     number;
  totalInvestments: number;
}): Insight[] {
  const { profile, creditScore, totalDebt, totalBalance, totalInvestments } = params;
  const insights: Insight[] = [];
  const income = profile?.monthly_income ?? 0;

  // ── Credit score ──────────────────────────────────────────────────────────
  if (creditScore) {
    if (creditScore.score < 580) {
      insights.push({
        id: 'cs-poor',
        type: 'warning',
        title: 'Credit score needs attention',
        detail:
          'Your score is in the Poor band. Reducing balances and making minimum payments on time are the fastest ways to improve it.',
        priority: 90,
      });
    } else if (creditScore.score < 670) {
      insights.push({
        id: 'cs-fair',
        type: 'info',
        title: 'Room to improve your score',
        detail:
          'You\'re in the Fair band. Bringing credit utilisation below 30% could push you into Good territory.',
        priority: 70,
      });
    } else if (creditScore.score < 740) {
      insights.push({
        id: 'cs-good',
        type: 'info',
        title: 'Good credit score',
        detail:
          'Keep it up. Continue paying on time and avoid opening new credit accounts unnecessarily.',
        priority: 25,
      });
    } else {
      insights.push({
        id: 'cs-excellent',
        type: 'success',
        title: 'Excellent credit score',
        detail:
          'You\'re in the top band. Maintain low utilisation and a clean payment history to stay here.',
        priority: 20,
      });
    }
  }

  // ── Debt-to-income ────────────────────────────────────────────────────────
  if (income > 0 && totalDebt > 0) {
    const dti = totalDebt / (income * 12);
    if (dti > 0.5) {
      insights.push({
        id: 'dti-high',
        type: 'warning',
        title: 'High debt-to-income ratio',
        detail: `Your total debt is ${(dti * 100).toFixed(0)}% of your annual income. Lenders prefer under 36%. Prioritise paying down high-APR debts first.`,
        priority: 85,
      });
    } else if (dti > 0.3) {
      insights.push({
        id: 'dti-moderate',
        type: 'info',
        title: 'Moderate debt level',
        detail: `Debt is ${(dti * 100).toFixed(0)}% of annual income. Reducing it below 30% will improve both your score and borrowing options.`,
        priority: 50,
      });
    } else {
      insights.push({
        id: 'dti-low',
        type: 'success',
        title: 'Healthy debt-to-income ratio',
        detail: `At ${(dti * 100).toFixed(0)}% of annual income your debt level is well-managed.`,
        priority: 10,
      });
    }
  }

  // ── Emergency fund ────────────────────────────────────────────────────────
  if (income > 0) {
    const months = totalBalance / income;
    if (months < 1) {
      insights.push({
        id: 'emergency-low',
        type: 'warning',
        title: 'Build your emergency fund',
        detail:
          'You have less than 1 month of income in cash. Aim for 3–6 months as a financial safety net before investing further.',
        priority: 80,
      });
    } else if (months < 3) {
      insights.push({
        id: 'emergency-building',
        type: 'info',
        title: 'Growing your emergency fund',
        detail: `${months.toFixed(1)} months covered. Keep contributing until you reach the 3–6 month target.`,
        priority: 45,
      });
    } else {
      insights.push({
        id: 'emergency-ok',
        type: 'success',
        title: 'Emergency fund on track',
        detail: `${months.toFixed(1)} months of income covered in cash — great position to be in.`,
        priority: 15,
      });
    }
  }

  // ── UK electoral roll tip (always relevant) ───────────────────────────────
  insights.push({
    id: 'electoral-roll',
    type: 'tip',
    title: 'Register on the electoral roll',
    detail:
      'Being registered to vote at your current address is one of the simplest ways to improve your credit score with UK lenders.',
    priority: 30,
  });

  // ── Investments ───────────────────────────────────────────────────────────
  if (totalInvestments === 0 && income > 0) {
    insights.push({
      id: 'no-investments',
      type: 'tip',
      title: 'Start investing — even small amounts',
      detail:
        'No investments tracked yet. Consistent contributions of even £50/month benefit enormously from compound growth over time.',
      priority: 28,
    });
  }

  // ── Reduce utilisation nudge (when no credit score context) ──────────────
  if (!creditScore && totalDebt > 0) {
    insights.push({
      id: 'utilisation-nudge',
      type: 'tip',
      title: 'Keep credit utilisation below 30%',
      detail:
        'Using more than 30% of your available credit limit signals risk to lenders. Pay down revolving balances where possible.',
      priority: 35,
    });
  }

  // Return top 5 by priority
  return insights.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
