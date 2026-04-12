export type Transaction = {
  id: string;
  user_id: string;
  title: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  notes: string | null;
  transaction_date: string;
  created_at: string;
};

export type BudgetCategorySummary = {
  category: string;
  budget: number;
  actual: number;
  previousActual: number;
  difference: number;
  percentageUsed: number;
  isOverBudget: boolean;
};

export type BudgetSummary = {
  totalBudget: number;
  totalActual: number;
  percentageUsed: number;
  categories: BudgetCategorySummary[];
  insights: string[];
};

export type CashflowForecast = {
  estimatedEndOfMonth: number;
  safeToSpend: number;
  projectedRemainingExpenses: number;
  projectedRemainingIncome: number;
  note: string;
};

export type SubscriptionSummary = {
  name: string;
  amount: number;
  occurrences: number;
  monthlyCost: number;
  cadence: string;
  lastCharged: string;
};

export type InvestmentAsset = {
  symbol: string;
  label: string;
  name: string;
  currency: string;
  currentPrice: number;
  dailyChangePercent: number;
  oneYearPerformancePercent: number;
};

export type Debt = {
  id: string;
  user_id: string;
  name: string;
  provider: string | null;
  original_amount: number;
  current_balance: number;
  minimum_payment: number;
  apr?: number;
  acquired_at?: string;
  created_at: string;
  progress?: number;
};

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  created_at: string;
  progress?: number;
};
