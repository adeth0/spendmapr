import type { Debt, Goal, Transaction } from "@/lib/types";

export const demoTransactions: Transaction[] = [
  {
    id: "txn-1",
    user_id: "demo-user",
    title: "Salary",
    type: "income",
    amount: 3200,
    category: "Income",
    notes: "Monthly salary payment",
    transaction_date: "2026-04-01",
    created_at: "2026-04-01T09:00:00.000Z"
  },
  {
    id: "txn-2",
    user_id: "demo-user",
    title: "Rent",
    type: "expense",
    amount: 1150,
    category: "Housing",
    notes: "April rent",
    transaction_date: "2026-04-02",
    created_at: "2026-04-02T09:00:00.000Z"
  },
  {
    id: "txn-3",
    user_id: "demo-user",
    title: "Groceries",
    type: "expense",
    amount: 148,
    category: "Food",
    notes: "Weekly shop",
    transaction_date: "2026-04-06",
    created_at: "2026-04-06T18:00:00.000Z"
  },
  {
    id: "txn-4",
    user_id: "demo-user",
    title: "Freelance project",
    type: "income",
    amount: 640,
    category: "Side income",
    notes: "Invoice paid",
    transaction_date: "2026-03-20",
    created_at: "2026-03-20T18:00:00.000Z"
  },
  {
    id: "txn-5",
    user_id: "demo-user",
    title: "Train pass",
    type: "expense",
    amount: 92,
    category: "Transport",
    notes: "Monthly commute",
    transaction_date: "2026-03-05",
    created_at: "2026-03-05T08:00:00.000Z"
  }
];

export const demoDebts: Debt[] = [
  {
    id: "debt-1",
    user_id: "demo-user",
    name: "Credit card",
    provider: "Amex",
    original_amount: 2400,
    current_balance: 860,
    minimum_payment: 90,
    apr: 19.9,
    acquired_at: "2025-10-01",
    created_at: "2026-02-15T09:00:00.000Z"
  },
  {
    id: "debt-2",
    user_id: "demo-user",
    name: "Student loan",
    provider: "SLC",
    original_amount: 12000,
    current_balance: 7400,
    minimum_payment: 120,
    apr: 5.5,
    acquired_at: "2023-09-01",
    created_at: "2026-01-10T09:00:00.000Z"
  }
];

export const demoGoals: Goal[] = [
  {
    id: "goal-1",
    user_id: "demo-user",
    name: "Stocks and Shares ISA",
    goal_type: "ISA",
    target_amount: 10000,
    current_amount: 4200,
    monthly_contribution: 350,
    created_at: "2026-01-01T09:00:00.000Z"
  },
  {
    id: "goal-2",
    user_id: "demo-user",
    name: "Emergency fund",
    goal_type: "Emergency Fund",
    target_amount: 6000,
    current_amount: 3200,
    monthly_contribution: 250,
    created_at: "2026-01-08T09:00:00.000Z"
  }
];
