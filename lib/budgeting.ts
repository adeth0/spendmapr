import type { Transaction } from "@/lib/types";

export const DEFAULT_CATEGORY_BUDGETS: Record<string, number> = {
  Housing: 1400,
  Food: 450,
  Transport: 180,
  Utilities: 220,
  Shopping: 250,
  Entertainment: 160,
  Health: 120,
  Travel: 220,
  Debt: 300,
  Other: 200
};

const CATEGORY_RULES = [
  { category: "Food", keywords: ["tesco", "aldi", "lidl", "sainsbury", "grocer", "grocery", "restaurant", "uber eats", "deliveroo", "coffee", "cafe", "meal", "food"] },
  { category: "Housing", keywords: ["rent", "mortgage", "landlord", "apartment", "flat", "housing"] },
  { category: "Transport", keywords: ["train", "tube", "bus", "uber", "taxi", "fuel", "petrol", "diesel", "transport", "parking"] },
  { category: "Utilities", keywords: ["electric", "water", "gas", "internet", "wifi", "broadband", "phone bill", "utility", "council tax"] },
  { category: "Shopping", keywords: ["amazon", "shop", "clothes", "zara", "asos", "ikea", "furniture", "order"] },
  { category: "Entertainment", keywords: ["netflix", "spotify", "cinema", "movie", "game", "concert", "entertainment", "disney"] },
  { category: "Health", keywords: ["pharmacy", "doctor", "dentist", "gym", "fitness", "health", "therapy"] },
  { category: "Travel", keywords: ["flight", "hotel", "holiday", "airbnb", "booking", "trip", "travel"] },
  { category: "Debt", keywords: ["loan", "repayment", "credit card", "debt", "finance"] },
  { category: "Income", keywords: ["salary", "payroll", "wage", "bonus", "invoice", "income", "freelance"] }
];

function sentenceCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function inferTransactionCategory({
  title,
  notes,
  type,
  category
}: Pick<Transaction, "title" | "notes" | "type" | "category">) {
  const explicitCategory = category?.trim();

  if (explicitCategory && explicitCategory.toLowerCase() !== "auto") {
    return sentenceCase(explicitCategory);
  }

  if (type === "income") {
    return "Income";
  }

  const haystack = `${title} ${notes ?? ""}`.toLowerCase();
  const match = CATEGORY_RULES.find((rule) =>
    rule.keywords.some((keyword) => haystack.includes(keyword))
  );

  return match?.category ?? "Other";
}

export function normalizeTransactions(transactions: Transaction[]) {
  return transactions.map((transaction) => ({
    ...transaction,
    category: inferTransactionCategory(transaction)
  }));
}

function getMonthWindow(date = new Date(), offset = 0) {
  const start = new Date(date.getFullYear(), date.getMonth() + offset, 1);
  const end = new Date(date.getFullYear(), date.getMonth() + offset + 1, 1);
  return { start, end };
}

function inWindow(dateValue: string, start: Date, end: Date) {
  const value = new Date(dateValue);
  return value >= start && value < end;
}

function normalizeMonthTotals(transactions: Transaction[], weeks = 4) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - (weeks * 7) + 1);
  startDate.setHours(0, 0, 0, 0);

  const weeklyTotals = Array.from({ length: weeks }, () => 0);

  transactions.forEach((transaction) => {
    if (transaction.type !== "expense") {
      return;
    }

    const transactionDate = new Date(transaction.transaction_date);
    if (transactionDate < startDate || transactionDate > now) {
      return;
    }

    const index = Math.min(
      weeks - 1,
      Math.floor((transactionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) / 7)
    );

    weeklyTotals[index] += transaction.amount;
  });

  return weeklyTotals;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function normalizeSubscriptionName(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(uk|gb|limited|ltd|co|plc|online|payment|direct debit|dd|transaction|trans|card)\b/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAverageIntervalDays(sortedDates: Date[]) {
  if (sortedDates.length < 2) {
    return 0;
  }

  const intervals = sortedDates
    .slice(0, sortedDates.length - 1)
    .map((date, index) =>
      Math.abs(
        (date.getTime() - sortedDates[index + 1].getTime()) / (1000 * 60 * 60 * 24)
      )
    );

  return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
}

function describeSubscriptionCadence(days: number) {
  if (days <= 35) {
    return "Monthly";
  }

  if (days <= 70) {
    return "Every 2 months";
  }

  return "Quarterly";
}

function estimateMonthlySubscriptionCost(amount: number, averageDays: number) {
  return Math.max(0, Math.round((amount * 30) / Math.max(averageDays, 1)));
}

export function buildSubscriptionSummary(transactions: Transaction[]) {
  const normalizedTransactions = normalizeTransactions(transactions).filter(
    (transaction) => transaction.type === "expense" && transaction.title.trim().length > 0
  );

  const groups = new Map<string, Transaction[]>();

  normalizedTransactions.forEach((transaction) => {
    const normalizedName = normalizeSubscriptionName(`${transaction.title} ${transaction.notes ?? ""}`);
    if (!normalizedName) {
      return;
    }

    const key = `${normalizedName}|${transaction.amount}`;
    const group = groups.get(key) ?? [];
    group.push(transaction);
    groups.set(key, group);
  });

  const subscriptions = Array.from(groups.values())
    .map((group) => {
      const sortedByDate = group
        .slice()
        .sort(
          (left, right) =>
            new Date(right.transaction_date).getTime() - new Date(left.transaction_date).getTime()
        );

      const averageDays = getAverageIntervalDays(
        sortedByDate.map((transaction) => new Date(transaction.transaction_date))
      );

      return {
        name: sentenceCase(normalizeSubscriptionName(sortedByDate[0].title)),
        amount: sortedByDate[0].amount,
        occurrences: sortedByDate.length,
        monthlyCost: estimateMonthlySubscriptionCost(sortedByDate[0].amount, averageDays || 30),
        cadence: describeSubscriptionCadence(averageDays || 30),
        lastCharged: new Intl.DateTimeFormat("en-GB", {
          month: "short",
          day: "numeric"
        }).format(new Date(sortedByDate[0].transaction_date)),
        averageDays
      };
    })
    .filter((subscription) => {
      if (subscription.occurrences >= 3) {
        return subscription.averageDays <= 90;
      }

      return subscription.occurrences === 2 && subscription.averageDays >= 25 && subscription.averageDays <= 40;
    })
    .sort((left, right) => right.monthlyCost - left.monthlyCost)
    .map(({ averageDays, ...subscription }) => subscription);

  return subscriptions;
}

export function buildCashflowForecast(transactions: Transaction[], currentBalance: number) {
  const normalizedTransactions = normalizeTransactions(transactions);
  const today = new Date();
  const startOfMonth = getMonthWindow(today, 0).start;
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const daysElapsed = today.getDate();
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

  const historicalMonths = [-1, -2, -3].map((offset) => {
    const window = getMonthWindow(today, offset);
    const amount = normalizedTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          inWindow(transaction.transaction_date, window.start, window.end)
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    return amount;
  });

  const currentMonthExpenses = normalizedTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        inWindow(transaction.transaction_date, startOfMonth, today)
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const currentMonthIncome = normalizedTransactions
    .filter(
      (transaction) =>
        transaction.type === "income" &&
        inWindow(transaction.transaction_date, startOfMonth, today)
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const averageMonthlyExpense =
    historicalMonths.filter((value) => value > 0).reduce((sum, value) => sum + value, 0) /
    Math.max(1, historicalMonths.filter((value) => value > 0).length);

  const averageMonthlyIncome = [-2, -1, 0]
    .map((offset) => {
      const window = getMonthWindow(today, offset);
      return normalizedTransactions
        .filter(
          (transaction) =>
            transaction.type === "income" &&
            inWindow(transaction.transaction_date, window.start, window.end)
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0);
    })
    .reduce((sum, value) => sum + value, 0) / 3;

  const projectedRemainingExpenses = Math.round(
    (averageMonthlyExpense / daysInMonth) * daysRemaining
  );
  const projectedRemainingIncome = Math.round(
    (Math.max(currentMonthIncome, averageMonthlyIncome) / daysInMonth) * daysRemaining
  );
  const estimatedEndOfMonth = Math.round(
    currentBalance - projectedRemainingExpenses + projectedRemainingIncome
  );

  const buffer = Math.min(300, Math.max(0, currentBalance * 0.14));
  const safeToSpend = Math.max(0, estimatedEndOfMonth - buffer);

  const note =
    historicalMonths.some((amount) => amount > 0) && currentMonthExpenses > 0
      ? "Forecast based on recent spending history and the current month’s pace."
      : "Add more transactions to improve cashflow accuracy.";

  return {
    estimatedEndOfMonth,
    safeToSpend,
    projectedRemainingExpenses,
    projectedRemainingIncome,
    note
  };
}

function buildSpendingInsights(
  normalizedTransactions: Transaction[],
  currentByCategory: Map<string, number>,
  previousByCategory: Map<string, number>,
  prev2ByCategory: Map<string, number>,
  categoriesWithBudget: Array<{
    category: string;
    budget: number;
    actual: number;
    previousActual: number;
    difference: number;
    percentageUsed: number;
    isOverBudget: boolean;
  }>
) {
  const insights: string[] = [];

  const overspend = categoriesWithBudget
    .filter((item) => item.isOverBudget)
    .sort((left, right) => right.difference - left.difference)
    .slice(0, 2);

  overspend.forEach((item) => {
    insights.push(`You are overspending in ${item.category.toLowerCase()} by ${formatMoney(item.difference)}`);
  });

  const currentMonthTotal = Array.from(currentByCategory.values()).reduce((sum, value) => sum + value, 0);
  const previousMonthTotal = Array.from(previousByCategory.values()).reduce((sum, value) => sum + value, 0);

  if (currentMonthTotal > 0 && previousMonthTotal > 0) {
    const change = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
    if (Math.abs(change) >= 15) {
      if (change > 0) {
        insights.push(`Spending is ${Math.round(change)}% higher than last month.`);
      } else {
        insights.push(`Spending is ${Math.round(Math.abs(change))}% lower than last month.`);
      }
    }
  }

  const weeklyTotals = normalizeMonthTotals(normalizedTransactions);
  const recentWeeks = weeklyTotals.slice(0, 3);
  const latestWeek = weeklyTotals[3] ?? 0;
  const averageRecentWeeks = recentWeeks.reduce((sum, total) => sum + total, 0) / Math.max(1, recentWeeks.length);

  if (latestWeek > averageRecentWeeks * 1.4 && latestWeek > 80) {
    const spike = Math.round(((latestWeek - averageRecentWeeks) / Math.max(1, averageRecentWeeks)) * 100);
    insights.push(`This week is ${spike}% higher than your recent weekly average.`);
  }

  const recurringCategories = Array.from(
    new Set([
      ...Array.from(currentByCategory.keys()),
      ...Array.from(previousByCategory.keys()),
      ...Array.from(prev2ByCategory.keys())
    ])
  )
    .map((category) => {
      const current = currentByCategory.get(category) ?? 0;
      const previous = previousByCategory.get(category) ?? 0;
      const prev2 = prev2ByCategory.get(category) ?? 0;
      return { category, current, previous, prev2 };
    })
    .filter(
      (item) =>
        item.prev2 > 0 &&
        item.previous > item.prev2 &&
        item.current > item.previous &&
        item.current > item.previous * 1.05
    )
    .sort((left, right) => right.current - left.current)
    .slice(0, 2);

  recurringCategories.forEach((item) => {
    insights.push(
      `Spending on ${item.category.toLowerCase()} has risen for three months in a row.`
    );
  });

  if (!insights.length) {
    insights.push("Spending looks steady, with no major surprises this month.");
  }

  return insights.slice(0, 3);
}

export function buildBudgetSummary(transactions: Transaction[]) {
  const normalizedTransactions = normalizeTransactions(transactions);
  const currentWindow = getMonthWindow(new Date(), 0);
  const previousWindow = getMonthWindow(new Date(), -1);

  const currentExpenses = normalizedTransactions.filter(
    (transaction) =>
      transaction.type === "expense" &&
      inWindow(transaction.transaction_date, currentWindow.start, currentWindow.end)
  );
  const previousExpenses = normalizedTransactions.filter(
    (transaction) =>
      transaction.type === "expense" &&
      inWindow(transaction.transaction_date, previousWindow.start, previousWindow.end)
  );

  const currentByCategory = new Map<string, number>();
  const previousByCategory = new Map<string, number>();
  const prev2ByCategory = new Map<string, number>();
  const prev2Window = getMonthWindow(new Date(), -2);
  const prev2Expenses = normalizedTransactions.filter(
    (transaction) =>
      transaction.type === "expense" &&
      inWindow(transaction.transaction_date, prev2Window.start, prev2Window.end)
  );

  currentExpenses.forEach((transaction) => {
    currentByCategory.set(
      transaction.category,
      (currentByCategory.get(transaction.category) ?? 0) + transaction.amount
    );
  });

  previousExpenses.forEach((transaction) => {
    previousByCategory.set(
      transaction.category,
      (previousByCategory.get(transaction.category) ?? 0) + transaction.amount
    );
  });

  prev2Expenses.forEach((transaction) => {
    prev2ByCategory.set(
      transaction.category,
      (prev2ByCategory.get(transaction.category) ?? 0) + transaction.amount
    );
  });

  const categories = Array.from(
    new Set([
      ...Object.keys(DEFAULT_CATEGORY_BUDGETS),
      ...Array.from(currentByCategory.keys()),
      ...Array.from(previousByCategory.keys()),
      ...Array.from(prev2ByCategory.keys())
    ])
  );

  const categoriesWithBudget = categories
    .filter((category) => category !== "Income")
    .map((category) => {
      const budget = DEFAULT_CATEGORY_BUDGETS[category] ?? DEFAULT_CATEGORY_BUDGETS.Other;
      const actual = currentByCategory.get(category) ?? 0;
      const previousActual = previousByCategory.get(category) ?? 0;
      const difference = actual - budget;
      const percentageUsed = budget > 0 ? (actual / budget) * 100 : 0;

      return {
        category,
        budget,
        actual,
        previousActual,
        difference,
        percentageUsed,
        isOverBudget: actual > budget
      };
    })
    .sort((left, right) => right.actual - left.actual);

  const totalBudget = categoriesWithBudget.reduce((sum, item) => sum + item.budget, 0);
  const totalActual = categoriesWithBudget.reduce((sum, item) => sum + item.actual, 0);

  const insights = buildSpendingInsights(
    normalizedTransactions,
    currentByCategory,
    previousByCategory,
    prev2ByCategory,
    categoriesWithBudget
  );

  return {
    totalBudget,
    totalActual,
    percentageUsed: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0,
    categories: categoriesWithBudget,
    insights
  };
}
