"use client";

import { useActionState } from "react";
import { updateTransaction } from "@/lib/actions";
import type { Transaction } from "@/lib/types";

const initialState = {
  message: ""
};

export function EditTransactionForm({ transaction }: { transaction: Transaction }) {
  const [state, action, pending] = useActionState(updateTransaction, initialState);

  return (
    <details className="surface-muted rounded-2xl transition-all duration-300">
      <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-medium text-slate-600 transition-all duration-300 group-open:border-b group-open:border-slate-200">
        Edit transaction
      </summary>

      <form action={action} className="space-y-4 p-4">
        <input type="hidden" name="id" value={transaction.id} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={`title-${transaction.id}`} className="text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id={`title-${transaction.id}`}
              name="title"
              defaultValue={transaction.title}
              required
              className="apple-input h-10"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`category-${transaction.id}`} className="text-sm font-medium text-slate-700">
              Category
            </label>
            <input
              id={`category-${transaction.id}`}
              name="category"
              defaultValue={transaction.category}
              className="apple-input h-10"
              placeholder="Leave blank to auto-categorise"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor={`type-${transaction.id}`} className="text-sm font-medium text-slate-700">
              Type
            </label>
            <select
              id={`type-${transaction.id}`}
              name="type"
              defaultValue={transaction.type}
              className="apple-input h-10"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor={`amount-${transaction.id}`} className="text-sm font-medium text-slate-700">
              Amount
            </label>
            <input
              id={`amount-${transaction.id}`}
              name="amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={transaction.amount}
              required
              className="apple-input h-10"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`transactionDate-${transaction.id}`}
              className="text-sm font-medium text-slate-700"
            >
              Date
            </label>
            <input
              id={`transactionDate-${transaction.id}`}
              name="transactionDate"
              type="date"
              defaultValue={transaction.transaction_date}
              required
              className="apple-input h-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor={`notes-${transaction.id}`} className="text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            id={`notes-${transaction.id}`}
            name="notes"
            rows={3}
            defaultValue={transaction.notes ?? ""}
            className="apple-textarea"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {state.message ? <p className="text-sm text-slate-500">{state.message}</p> : <span />}
          <button
            type="submit"
            className="apple-button py-2.5"
            disabled={pending}
          >
            {pending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </details>
  );
}
