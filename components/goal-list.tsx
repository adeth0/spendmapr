"use client";

import { useActionState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteGoal } from "@/lib/actions";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { DeleteButton } from "@/components/ui/delete-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import type { Goal } from "@/lib/types";

const initialState = {
  message: ""
};

function GoalCard({ goal }: { goal: Goal }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(deleteGoal, initialState);

  useEffect(() => {
    if (state.message === "Goal deleted.") {
      router.refresh();
    }
  }, [state.message, router]);

  const remainingAmount = Math.max(goal.target_amount - goal.current_amount, 0);
  const monthsRemaining =
    goal.monthly_contribution > 0 ? Math.ceil(remainingAmount / goal.monthly_contribution) : null;
  const estimateText =
    goal.current_amount >= goal.target_amount
      ? "Completed"
      : monthsRemaining != null
      ? `Est. ${monthsRemaining} month${monthsRemaining === 1 ? "" : "s"}`
      : "Add a monthly contribution";

  return (
    <article className="surface-muted interactive-card rounded-3xl shadow-sm p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{goal.name}</h3>
            <p className="text-sm text-slate-500">{goal.goal_type}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-500">
            <span>Saved: {formatCurrency(goal.current_amount)}</span>
            <span>Target: {formatCurrency(goal.target_amount)}</span>
            <span>Monthly plan: {formatCurrency(goal.monthly_contribution)}</span>
          </div>
        </div>

        <form action={action} className="flex items-start">
          <input type="hidden" name="id" value={goal.id} />
          <DeleteButton label="Delete goal" />
        </form>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Progress</span>
          <span>{formatPercent(goal.progress ?? 0)}</span>
        </div>
        <ProgressBar value={goal.progress ?? 0} tone="success" />
        <p className="text-sm text-slate-500">{estimateText}</p>
      </div>
    </article>
  );
}

export function GoalList({ goals }: { goals: Goal[] }) {
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const averageProgress = goals.length
    ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100)
    : 0;

  return (
    <Card className="p-7 sm:p-8">
      <div className="space-y-4">
        <SectionHeader
          title="Savings goals"
          description="Track each goal with clean progress indicators."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Goals</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{goals.length}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total saved</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{formatCurrency(totalSaved)}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Average progress</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{formatPercent(averageProgress)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </Card>
  );
}
