import { cache } from "react";
import { redirect } from "next/navigation";
import { buildBudgetSummary, buildCashflowForecast, buildSubscriptionSummary, normalizeTransactions } from "@/lib/budgeting";
import { demoDebts, demoGoals, demoTransactions } from "@/lib/demo-data";
import { createServerClient, isDemoMode } from "@/lib/supabase/server";
import type { Debt, Goal, Transaction } from "@/lib/types";

const getUserContext = cache(async () => {
  if (isDemoMode()) {
    return { supabase: null, user: { id: "demo-user" } };
  }

  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
});

function calculateAverageProgress<T>(
  items: T[],
  getCurrent: (item: T) => number,
  getTarget: (item: T) => number
) {
  if (!items.length) {
    return 0;
  }

  const total = items.reduce((sum, item) => {
    const target = getTarget(item);
    const current = getCurrent(item);
    if (target <= 0) {
      return sum;
    }
    return sum + Math.min((current / target) * 100, 100);
  }, 0);

  return total / items.length;
}

export async function getDashboardData() {
  if (isDemoMode()) {
    const STARTING_DEPOSIT = 3000;
  const typedTransactions = normalizeTransactions(demoTransactions);
    const typedDebts = demoDebts;
    const typedGoals = demoGoals;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const incomeTotal = typedTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
    const expenseTotal = typedTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    const monthlySpending = typedTransactions
      .filter(
        (item) => item.type === "expense" && new Date(item.transaction_date) >= startOfMonth
      )
      .reduce((sum, item) => sum + item.amount, 0);
    const totalDebt = typedDebts.reduce((sum, item) => sum + item.current_balance, 0);
    const totalSaved = typedGoals.reduce((sum, item) => sum + item.current_amount, 0);
    const totalBalance = STARTING_DEPOSIT + incomeTotal - expenseTotal - totalDebt - totalSaved;
    const spendingByMonth = new Map<string, number>();

    typedTransactions
      .filter((item) => item.type === "expense")
      .forEach((item) => {
        const key = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(
          new Date(item.transaction_date)
        );
        spendingByMonth.set(key, (spendingByMonth.get(key) ?? 0) + item.amount);
      });

    const budget = buildBudgetSummary(typedTransactions);
    budget.totalBudget = STARTING_DEPOSIT;
    budget.percentageUsed = budget.totalBudget > 0 ? (budget.totalActual / budget.totalBudget) * 100 : 0;
    const forecast = buildCashflowForecast(typedTransactions, totalBalance);
    const subscriptions = buildSubscriptionSummary(typedTransactions);
    const subscriptionMonthlyTotal = subscriptions.reduce((sum, subscription) => sum + subscription.monthlyCost, 0);

    return {
      totalBalance,
      monthlySpending,
      savingsProgress: calculateAverageProgress(
        typedGoals,
        (goal) => goal.current_amount,
        (goal) => goal.target_amount
      ),
      debtPayoffProgress: calculateAverageProgress(
        typedDebts,
        (debt) => debt.original_amount - debt.current_balance,
        (debt) => debt.original_amount
      ),
      chartData: Array.from(spendingByMonth.entries()).map(([month, total]) => ({ month, total })),
      transactionCount: typedTransactions.length,
      debtCount: typedDebts.length,
      goalCount: typedGoals.length,
      budget,
      forecast,
      subscriptions,
      subscriptionMonthlyTotal
    };
  }

  const { supabase, user } = await getUserContext();
  if (!supabase) {
    throw new Error("Missing Supabase client");
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ data: transactions }, { data: debts }, { data: goals }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false }),
    supabase
      .from("debts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
  ]);

  const STARTING_DEPOSIT = 3000;
  const typedTransactions = normalizeTransactions((transactions ?? []) as Transaction[]);
  const typedDebts = (debts ?? []) as Debt[];
  const typedGoals = (goals ?? []) as Goal[];
  const budget = buildBudgetSummary(typedTransactions);

  const incomeTotal = typedTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const expenseTotal = typedTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlySpending = typedTransactions
    .filter(
      (item) => item.type === "expense" && new Date(item.transaction_date) >= startOfMonth
    )
    .reduce((sum, item) => sum + item.amount, 0);
  const totalDebt = typedDebts.reduce((sum, item) => sum + item.current_balance, 0);
  const totalSaved = typedGoals.reduce((sum, item) => sum + item.current_amount, 0);

  const { data: bankAccounts } = await supabase
    .from("bank_accounts")
    .select("current_balance")
    .eq("user_id", user.id);

  const connectedBankBalance = ((bankAccounts ?? []) as { current_balance: number | null }[]).reduce(
    (sum, account) => sum + (account.current_balance ?? 0),
    0
  );
  const hasBankBalance = (bankAccounts ?? []).length > 0;
  const totalBalance = hasBankBalance
    ? connectedBankBalance - totalDebt - totalSaved
    : STARTING_DEPOSIT + incomeTotal - expenseTotal - totalDebt - totalSaved;

  if (!hasBankBalance) {
    budget.totalBudget = STARTING_DEPOSIT;
    budget.percentageUsed = budget.totalBudget > 0 ? (budget.totalActual / budget.totalBudget) * 100 : 0;
  }

  const forecast = buildCashflowForecast(typedTransactions, totalBalance);
  const subscriptions = buildSubscriptionSummary(typedTransactions);
  const subscriptionMonthlyTotal = subscriptions.reduce((sum, subscription) => sum + subscription.monthlyCost, 0);

  const spendingByMonth = new Map<string, number>();
  typedTransactions
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      const key = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(
        new Date(item.transaction_date)
      );
      spendingByMonth.set(key, (spendingByMonth.get(key) ?? 0) + item.amount);
    });

  return {
    totalBalance,
    monthlySpending,
    savingsProgress: calculateAverageProgress(
      typedGoals,
      (goal) => goal.current_amount,
      (goal) => goal.target_amount
    ),
    debtPayoffProgress: calculateAverageProgress(
      typedDebts,
      (debt) => debt.original_amount - debt.current_balance,
      (debt) => debt.original_amount
    ),
    chartData: Array.from(spendingByMonth.entries()).map(([month, total]) => ({ month, total })),
    transactionCount: typedTransactions.length,
    debtCount: typedDebts.length,
    goalCount: typedGoals.length,
    budget,
    forecast,
    subscriptions,
    subscriptionMonthlyTotal
  };
}

export async function getTransactionsPageData() {
  if (isDemoMode()) {
    return {
      transactions: normalizeTransactions(demoTransactions)
    };
  }

  const { supabase, user } = await getUserContext();
  if (!supabase) {
    throw new Error("Missing Supabase client");
  }

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false });

  return {
    transactions: normalizeTransactions((data ?? []) as Transaction[])
  };
}

export async function getDebtPageData() {
  if (isDemoMode()) {
    return {
      debts: demoDebts.map((debt) => ({
        ...debt,
        progress:
          debt.original_amount > 0
            ? Math.min(
                ((debt.original_amount - debt.current_balance) / debt.original_amount) * 100,
                100
              )
            : 0
      }))
    };
  }

  const { supabase, user } = await getUserContext();
  if (!supabase) {
    throw new Error("Missing Supabase client");
  }

  const { data } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return {
    debts: ((data ?? []) as Debt[]).map((debt) => ({
      ...debt,
      progress:
        debt.original_amount > 0
          ? Math.min(
              ((debt.original_amount - debt.current_balance) / debt.original_amount) * 100,
              100
            )
          : 0
    }))
  };
}

function isSchemaCacheMissingTableError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("Could not find the table 'public.goals' in the schema cache")
  );
}

export async function getGoalsPageData() {
  if (isDemoMode()) {
    return {
      goals: demoGoals.map((goal) => ({
        ...goal,
        progress:
          goal.target_amount > 0
            ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
            : 0
      }))
    };
  }

  const { supabase, user } = await getUserContext();
  if (!supabase) {
    throw new Error("Missing Supabase client");
  }

  try {
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return {
      goals: ((data ?? []) as Goal[]).map((goal) => ({
        ...goal,
        progress:
          goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0
      }))
    };
  } catch (error) {
    if (isSchemaCacheMissingTableError(error)) {
      return {
        goals: [],
        errorMessage:
          "Could not load goals because the goals table is missing. Run supabase/schema.sql in your Supabase SQL editor to create the table."
      };
    }

    throw error;
  }
}
