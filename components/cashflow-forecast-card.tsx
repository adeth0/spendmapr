import { formatCurrency } from "@/lib/utils";
import type { CashflowForecast } from "@/lib/types";
import { Card, SubCard } from "@/components/ui/card";

export function CashflowForecastCard({ forecast }: { forecast: CashflowForecast }) {
  return (
    <Card className="p-8 sm:p-10">
      <div className="space-y-3">
        <h2 className="section-title">Cashflow forecast</h2>
        <p className="section-copy">A quick read on how the rest of the month looks for your balance.</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SubCard className="p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Projected month-end balance</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(forecast.estimatedEndOfMonth)}
          </p>
        </SubCard>

        <SubCard className="p-5">
          <p className="text-sm text-slate-500">Safe to spend</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-700">
            {formatCurrency(forecast.safeToSpend)}
          </p>
        </SubCard>

        <SubCard className="p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Remaining forecast</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(forecast.projectedRemainingExpenses)}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">
            projected spend
          </p>
        </SubCard>
      </div>

      <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-500">{forecast.note}</p>
    </Card>
  );
}
