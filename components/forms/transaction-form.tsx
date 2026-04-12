"use client";

import { useActionState } from "react";
import { useMemo, useState } from "react";
import { createTransaction } from "@/lib/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvestmentAsset, Transaction } from "@/lib/types";

const initialState = {
  message: ""
};

type TransactionFormProps = {
  currentBalance: number;
  useTestBalance?: boolean;
  transactions: Transaction[];
  investmentSnapshot: {
    isConfigured: boolean;
    assets: InvestmentAsset[];
    error: string | null;
  };
};

const essentialCategories = ["groceries", "food", "rent", "bills", "utilities", "mortgage", "insurance", "transport"];

function normalizeCategory(value: string) {
  return value.trim().toLowerCase();
}

function buildInvestmentSuggestion(
  type: "income" | "expense",
  category: string,
  amount: number,
  assets: InvestmentAsset[]
) {
  const categoryKey = normalizeCategory(category);
  const bestAsset = assets.find((asset) => asset.symbol === "VWRL.L") ?? assets[0];
  const isEssential = essentialCategories.some((keyword) => categoryKey.includes(keyword));
  const incomeAdvice = bestAsset
    ? `Keep enough cash in your current account for bills and regular spending, then consider moving extra income into ${bestAsset.label} (${bestAsset.name}) for broad market exposure. It helps balance short-term liquidity with long-term growth.`
    : "Keep enough cash for bills in your current account, then move extra money into a diversified investment or an ISA for longer-term growth.";

  const expenseAdvice = bestAsset
    ? isEssential
      ? `This looks like essential spending, so keep it in your current account and avoid moving it into investments. For longer-term savings, build a buffer first and consider ${bestAsset.label} later when you have surplus cash.`
      : `This appears discretionary, so keep day-to-day spending in your current account. If you have extra savings after this cost, a low-cost fund like ${bestAsset.label} is a sensible place to invest because it offers broad, diversified exposure.`
    : `Keep essential spending in your current account and only invest leftover money after you have a comfortable cash buffer.`;

  return type === "income" ? incomeAdvice : expenseAdvice;
}

function calculateCategoryMonthlyAverage(transactions: Transaction[], category: string) {
  const keyword = normalizeCategory(category);
  const matches = transactions.filter((transaction) => {
    if (transaction.type !== "expense") {
      return false;
    }
    if (!keyword) {
      return true;
    }
    return (
      transaction.category.toLowerCase().includes(keyword) ||
      transaction.title.toLowerCase().includes(keyword)
    );
  });

  if (matches.length === 0) {
    return null;
  }

  const sortedDates = matches
    .map((transaction) => new Date(transaction.transaction_date).getTime())
    .sort((a, b) => a - b);

  const durationDays = Math.max((sortedDates[sortedDates.length - 1] - sortedDates[0]) / (1000 * 60 * 60 * 24), 1);
  const totalAmount = matches.reduce((sum, transaction) => sum + transaction.amount, 0);
  const months = Math.max(1, durationDays / 30);

  return totalAmount / months;
}

export function TransactionForm({
  currentBalance,
  useTestBalance,
  transactions,
  investmentSnapshot
}: TransactionFormProps) {
  const [state, action, pending] = useActionState(createTransaction, initialState);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");

  const monthlyMultiplier = 4.33;
  const transactionDelta = type === "income" ? amount : -amount;
  const projectedBalance = currentBalance + transactionDelta;
  const monthlyImpact = Math.round(transactionDelta * monthlyMultiplier * 100) / 100;
  const monthEndBalance = currentBalance + monthlyImpact;

  const categoryMonthlyAverage = useMemo(
    () => calculateCategoryMonthlyAverage(transactions, category),
    [transactions, category]
  );

  const topInvestment = investmentSnapshot.assets[0];
  const investmentSuggestion = buildInvestmentSuggestion(type, category, amount, investmentSnapshot.assets);

  return (
    <section className="panel p-7 sm:p-8">
      <div className="space-y-2">
        <h2 className="section-title">Add transaction</h2>
        <p className="section-copy">Log income and expenses in a few taps.</p>
      </div>

      <form action={action} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            className="apple-input"
            placeholder="Weekly groceries"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium text-slate-700">
              Type
            </label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value as "income" | "expense")}
              className="apple-input"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium text-slate-700">
              Amount
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              required
              className="apple-input"
              placeholder="0.00"
              value={amount > 0 ? amount : ""}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium text-slate-700">
              Category
            </label>
            <input
              id="category"
              name="category"
              className="apple-input"
              placeholder="Leave blank to auto-categorise"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
            <p className="text-xs leading-5 text-slate-400">
              SpendMapr can infer a category from the title and notes.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="transactionDate" className="text-sm font-medium text-slate-700">
              Date
            </label>
            <input
              id="transactionDate"
              name="transactionDate"
              type="date"
              required
              className="apple-input"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className="apple-textarea"
            placeholder="Optional note"
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">Impact preview</p>
              <p className="text-xs text-slate-500">
                See how this entry changes your current balance and how your cash position looks if it repeats weekly.
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {type === "income" ? "+" : "-"}
              {amount ? formatCurrency(amount) : "0"}
            </p>
          </div>

          {useTestBalance ? (
            <div className="mt-5 rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold text-amber-900">Using a test bank balance</p>
              <p className="mt-2">
                No connected bank account was found, so this preview uses a temporary £3,000 balance to help you see how transactions affect your cash position.
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-4 shadow-sm">
              <p className="font-medium text-slate-900">Current balance estimate</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">{formatCurrency(currentBalance)}</p>
              <p className="mt-1 text-slate-500">After this entry: {formatCurrency(projectedBalance)}</p>
            </div>
            <div className="rounded-3xl bg-white p-4 shadow-sm">
              <p className="font-medium text-slate-900">Weekly repeat</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">{formatCurrency(monthlyImpact)}</p>
              <p className="mt-1 text-slate-500">Month-end balance: {formatCurrency(monthEndBalance)}</p>
            </div>
          </div>

          {categoryMonthlyAverage ? (
            <div className="mt-5 rounded-3xl bg-slate-100 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Category average</p>
              <p className="mt-2">
                Your {category || "overall"} spend is averaging {formatCurrency(categoryMonthlyAverage)} per month.
              </p>
            </div>
          ) : null}

          <div className="mt-5 rounded-3xl bg-slate-100 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Suggestion</p>
            <p className="mt-2">{investmentSuggestion}</p>
            {topInvestment ? (
              <p className="mt-3 text-xs text-slate-500">
                Live investment note: consider {topInvestment.label} because it is broadly diversified and currently at {formatCurrency(topInvestment.currentPrice)} {topInvestment.currency} with a {topInvestment.oneYearPerformancePercent.toFixed(1)}% 1-year move.
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="submit"
          className="apple-button"
          disabled={pending}
        >
          {pending ? "Saving..." : "Save transaction"}
        </button>
        {state.message ? <p className="text-sm text-slate-500">{state.message}</p> : null}
      </form>
    </section>
  );
}
