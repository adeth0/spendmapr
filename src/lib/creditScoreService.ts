/**
 * Simulated UK-style credit score calculation.
 * Score range 300–850, modelled after Experian / TransUnion bands.
 *
 * Inputs are derived from the user_profile + live debt data so the score
 * automatically updates as the user edits their debts or profile.
 */

export interface CreditInput {
  /** Monthly take-home income (£). 0 when unknown. */
  monthlyIncome: number;
  /** Sum of current_balance across all debts. */
  totalDebt: number;
  /** Sum of original_amount across all debts (revolving credit limit proxy). */
  totalCreditLimit: number;
  /** Number of tracked debts. */
  debtCount: number;
  /** True if the user has self-reported missed payments. */
  hasMissedPayments?: boolean;
}

export type CreditBand = 'Poor' | 'Fair' | 'Good' | 'Excellent';

export interface CreditScore {
  score: number;
  band: CreditBand;
  /** Hex colour matching the band. */
  bandColor: string;
  /** 0–100, used to fill the gauge arc. */
  percentile: number;
}

// ─── Band helpers ─────────────────────────────────────────────────────────────

export function bandForScore(score: number): CreditBand {
  if (score >= 740) return 'Excellent';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Poor';
}

export function colorForBand(band: CreditBand): string {
  switch (band) {
    case 'Excellent': return '#22c55e';
    case 'Good':      return '#3b82f6';
    case 'Fair':      return '#f59e0b';
    case 'Poor':      return '#ef4444';
  }
}

// ─── Main calculator ──────────────────────────────────────────────────────────

export function calculateCreditScore(input: CreditInput): CreditScore {
  const { monthlyIncome, totalDebt, totalCreditLimit, debtCount, hasMissedPayments } = input;

  let score = 700; // baseline for someone with moderate debt and regular income

  // 1. Debt-to-income ratio  (total debt ÷ annual income)
  const annualIncome = monthlyIncome * 12;
  const dti = annualIncome > 0
    ? totalDebt / annualIncome
    : totalDebt > 0 ? 1 : 0;

  if      (dti > 1.0)               score -= 180;
  else if (dti > 0.8)               score -= 130;
  else if (dti > 0.5)               score -= 70;
  else if (dti > 0.3)               score -= 30;
  else if (dti < 0.1 && totalDebt > 0) score += 20;
  else if (totalDebt === 0)         score += 50;

  // 2. Credit utilisation  (balance ÷ original limit)
  const utilisation = totalCreditLimit > 0 ? totalDebt / totalCreditLimit : 0;
  if      (utilisation > 0.9)                     score -= 100;
  else if (utilisation > 0.7)                     score -= 60;
  else if (utilisation > 0.5)                     score -= 35;
  else if (utilisation > 0.3)                     score -= 10;
  else if (utilisation > 0 && utilisation < 0.1)  score += 25;

  // 3. Number of open debts
  if      (debtCount > 6) score -= 50;
  else if (debtCount > 4) score -= 30;
  else if (debtCount > 2) score -= 10;

  // 4. Payment history
  if (hasMissedPayments) score -= 120;

  // Clamp to valid range
  score = Math.max(300, Math.min(850, Math.round(score)));

  const band     = bandForScore(score);
  const bandColor = colorForBand(band);
  const percentile = ((score - 300) / 550) * 100;

  return { score, band, bandColor, percentile };
}

// ─── Per-debt score impact ────────────────────────────────────────────────────

/**
 * Returns how many credit score points would improve if `debt` were fully paid off.
 * A positive number means paying it off helps.
 */
export function debtScoreImpact(
  debt: { remaining: number; totalAmount: number },
  base: CreditInput,
): number {
  const withoutDebt = calculateCreditScore({
    ...base,
    totalDebt:        Math.max(0, base.totalDebt        - debt.remaining),
    totalCreditLimit: Math.max(0, base.totalCreditLimit - debt.totalAmount),
    debtCount:        Math.max(0, base.debtCount        - 1),
  });
  const withDebt = calculateCreditScore(base);
  return withoutDebt.score - withDebt.score;
}
