import { formatCurrency, formatPercent } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { BudgetCategorySummary, BudgetSummary } from "@/lib/types";

function BudgetRow({ item }: { item: BudgetCategorySummary }) {
  return (
    <div className="surface-muted p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-900">{item.category}</p>
          <p className="mt-1 text-sm text-slate-500">
            Budget {formatCurrency(item.budget)} • Actual {formatCurrency(item.actual)}
          </p>
        </div>
        <div
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            item.isOverBudget
              ? "bg-rose-100 text-rose-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {item.isOverBudget ? "Overspent" : "On track"}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{formatPercent(item.percentageUsed)}</span>
          <span
            className={item.isOverBudget ? "font-medium text-rose-600" : "text-slate-500"}
          >
            {item.isOverBudget
              ? `+${formatCurrency(item.difference)}`
              : `${formatCurrency(item.budget - item.actual)} left`}
          </span>
        </div>
        <ProgressBar value={Math.min(item.percentageUsed, 100)} tone={item.isOverBudget ? "danger" : "brand"} />
      </div>
    </div>
  );
}

export function BudgetSummaryCard({ budget }: { budget: BudgetSummary }) {
  return (
    <section className="panel p-7 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="section-title">Budget vs actual</h2>
          <p className="section-copy">
            A monthly spending view across your core categories.
          </p>
        </div>
        <div className="surface-muted px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Monthly total</p>
          <p
            className={`mt-1 text-2xl font-semibold tracking-tight ${
              budget.totalActual > budget.totalBudget ? "text-rose-600" : "text-slate-950"
            }`}
          >
            {formatCurrency(budget.totalActual)} / {formatCurrency(budget.totalBudget)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        {budget.categories.slice(0, 6).map((item) => (
          <BudgetRow key={item.category} item={item} />
        ))}
      </div>
    </section>
  );
}
