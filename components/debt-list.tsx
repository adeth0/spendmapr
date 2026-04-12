"use client";

import { useActionState } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDebt, updateDebt } from "@/lib/actions";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { DeleteButton } from "@/components/ui/delete-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import type { Debt } from "@/lib/types";

const initialState = {
  message: ""
};

function estimatePayoff(balance: number, apr: number, monthlyPayment: number) {
  const monthlyRate = apr / 100 / 12;
  if (monthlyPayment <= 0) {
    return { months: null, totalInterest: 0, insufficientPayment: true };
  }

  let remaining = balance;
  let totalInterest = 0;
  let months = 0;

  while (remaining > 0.01 && months < 600) {
    const interest = Math.round(remaining * monthlyRate * 100) / 100;
    const principal = Math.round((monthlyPayment - interest) * 100) / 100;
    if (principal <= 0) {
      return { months: null, totalInterest, insufficientPayment: true };
    }
    remaining = Math.round(Math.max(remaining - principal, 0) * 100) / 100;
    totalInterest = Math.round((totalInterest + interest) * 100) / 100;
    months += 1;
  }

  return { months: months || 0, totalInterest, insufficientPayment: false };
}

function formatDuration(months: number | null) {
  if (months == null) {
    return "Not payable with current payment";
  }
  const weeks = Math.round(months * 4.345);
  return `${months} month${months === 1 ? "" : "s"} (${weeks} weeks)`;
}

function DebtCard({ debt }: { debt: Debt }) {
  const router = useRouter();
  const [extraPct, setExtraPct] = useState(20);
  const [updateState, updateAction, updatePending] = useActionState(updateDebt, initialState);

  useEffect(() => {
    if (updateState.message && !updatePending) {
      router.refresh();
    }
  }, [updateState.message, updatePending, router]);

  const apr = debt.apr ?? 0;
  const acquiredAt = debt.acquired_at ?? debt.created_at;
  const balance = debt.current_balance;
  const monthlyPayment = debt.minimum_payment;

  const heldMonths = useMemo(() => {
    const acquiredDate = new Date(acquiredAt);
    const now = new Date();
    const years = now.getFullYear() - acquiredDate.getFullYear();
    const months = now.getMonth() - acquiredDate.getMonth();
    return years * 12 + months;
  }, [acquiredAt]);

  const baseline = useMemo(
    () => estimatePayoff(balance, apr, monthlyPayment),
    [balance, apr, monthlyPayment]
  );

  const extraPayment = Math.max(monthlyPayment * (1 + extraPct / 100), monthlyPayment + 0.01);
  const extraEstimate = useMemo(
    () => estimatePayoff(balance, apr, extraPayment),
    [balance, apr, extraPayment]
  );

  const savings =
    baseline.months != null && extraEstimate.months != null
      ? baseline.totalInterest - extraEstimate.totalInterest
      : 0;

  const timeSaved =
    baseline.months != null && extraEstimate.months != null
      ? baseline.months - extraEstimate.months
      : null;

  return (
    <article className="surface-muted interactive-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{debt.name}</h3>
            <p className="text-sm text-slate-500">{debt.provider ?? "No provider set"}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-500">
            <span>Original: {formatCurrency(debt.original_amount)}</span>
            <span>Current: {formatCurrency(balance)}</span>
            <span>Min payment: {formatCurrency(monthlyPayment)}</span>
            <span>APR: {formatPercent(apr)}</span>
            <span>Acquired: {formatDate(acquiredAt)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={updateAction} className="inline-flex">
            <input type="hidden" name="id" value={debt.id} />
            <button
              type="submit"
              disabled={updatePending}
              className="apple-button-secondary px-4 py-2 text-xs"
            >
              {updatePending ? "Updating…" : "Update"}
            </button>
          </form>
          <form action={deleteDebt} className="inline-flex">
            <input type="hidden" name="id" value={debt.id} />
            <DeleteButton label="Delete debt" />
          </form>
        </div>
      </div>

      {updateState.message ? (
        <p className="mt-3 text-sm text-slate-600">{updateState.message}</p>
      ) : null}

      <div className="mt-6 space-y-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Payoff progress</p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{formatPercent(debt.progress ?? 0)}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Held</p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{heldMonths} months</p>
          </div>
        </div>

        <ProgressBar value={debt.progress ?? 0} tone="warning" />

        <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-900">Overpayment estimate</p>
              <p className="text-xs text-slate-500">Pay more than minimum to save interest and time.</p>
            </div>
            <div className="w-24">
              <label htmlFor={`overpayment-${debt.id}`} className="sr-only">
                Extra payment %
              </label>
              <input
                id={`overpayment-${debt.id}`}
                type="number"
                min="0"
                step="5"
                value={extraPct}
                onChange={(event) => setExtraPct(Number(event.target.value))}
                className="apple-input"
              />
            </div>
          </div>

          {extraEstimate.insufficientPayment ? (
            <p className="mt-3 text-sm text-rose-600">
              Even with {extraPct}% extra, payment is too low to reduce the balance.
            </p>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>
                New payment: {formatCurrency(Math.round(extraPayment))} → pay off in {formatDuration(extraEstimate.months)}.
              </p>
              <p>Interest saved: {formatCurrency(Math.max(0, Math.round(savings)))}.</p>
              <p>
                Time saved: {timeSaved != null && timeSaved > 0 ? `${timeSaved} month${timeSaved === 1 ? "" : "s"}` : "No time saved"}.
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function DebtList({ debts }: { debts: Debt[] }) {
  const router = useRouter();

  useEffect(() => {
    const refreshOnFocus = () => {
      router.refresh();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshOnFocus();
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router]);

  return (
    <Card className="p-7 sm:p-8">
      <SectionHeader
        title="Your debts"
        description="Track balances and celebrate the payoff milestones."
      />

      <div className="mt-8 space-y-4">
        {debts.map((debt) => (
          <DebtCard key={debt.id} debt={debt} />
        ))}
      </div>
    </Card>
  );
}
