import { formatCurrency, formatPercent } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Card, SubCard } from "@/components/ui/card";
import type { BudgetCategorySummary, BudgetSummary } from "@/lib/types";

function BudgetRow({ item }: { item: BudgetCategorySummary }) {
  return (
    <SubCard className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-slate-950">{item.category}</p>
          <p className="mt-2 text-sm text-slate-500">
            Budget {formatCurrency(item.budget)} · Actual {formatCurrency(item.actual)}
          </p>
        </div>
        <div
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            item.isOverBudget
              ? "bg-rose-100 text-rose-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {item.isOverBudget ? "Overspent" : "On track"}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{formatPercent(item.percentageUsed)}</span>
          <span className={item.isOverBudget ? "font-semibold text-rose-600" : "text-slate-500"}>
            {item.isOverBudget
              ? `+${formatCurrency(item.difference)}`
              : `${formatCurrency(item.budget - item.actual)} left`}
          </span>
        </div>
        <ProgressBar
          value={Math.min(item.percentageUsed, 100)}
          tone={item.isOverBudget ? "danger" : "brand"}
        />
      </div>
    </SubCard>
  );
}

export function BudgetOverviewCard({ budget }: { budget: BudgetSummary }) {
  return (
    <Card className="p-8 sm:p-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <h2 className="section-title">Budget vs actual</h2>
          <p className="section-copy">A monthly spending view across your core categories.</p>
        </div>
        <div className="surface-muted px-5 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Monthly total</p>
          <p
            className={`mt-2 text-3xl font-semibold tracking-tight ${
              budget.totalActual > budget.totalBudget ? "text-rose-600" : "text-slate-950"
            }`}
          >
            {formatCurrency(budget.totalActual)} / {formatCurrency(budget.totalBudget)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        {budget.categories.slice(0, 6).map((item) => (
          <BudgetRow key={item.category} item={item} />
        ))}
      </div>
    </Card>
  );
}
