"use client";

import { useActionState } from "react";
import { createDebt } from "@/lib/actions";

const initialState = {
  message: ""
};

export function DebtForm() {
  const [state, action, pending] = useActionState(createDebt, initialState);

  return (
    <section className="panel p-7 sm:p-8">
      <div className="space-y-2">
        <h2 className="section-title">Add debt</h2>
        <p className="section-copy">Track credit cards, loans, and other balances.</p>
      </div>

      <form action={action} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Debt name
          </label>
          <input
            id="name"
            name="name"
            required
            className="apple-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="provider" className="text-sm font-medium text-slate-700">
            Provider
          </label>
          <input
            id="provider"
            name="provider"
            className="apple-input"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="originalAmount" className="text-sm font-medium text-slate-700">
              Original amount
            </label>
            <input
              id="originalAmount"
              name="originalAmount"
              type="number"
              min="0"
              step="0.01"
              required
              className="apple-input"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="currentBalance" className="text-sm font-medium text-slate-700">
              Current balance
            </label>
            <input
              id="currentBalance"
              name="currentBalance"
              type="number"
              min="0"
              step="0.01"
              required
              className="apple-input"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="minimumPayment" className="text-sm font-medium text-slate-700">
              Minimum monthly payment
            </label>
            <input
              id="minimumPayment"
              name="minimumPayment"
              type="number"
              min="0"
              step="0.01"
              required
              className="apple-input"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="apr" className="text-sm font-medium text-slate-700">
              APR (%)
            </label>
            <input
              id="apr"
              name="apr"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              className="apple-input"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="acquiredAt" className="text-sm font-medium text-slate-700">
            Date acquired
          </label>
          <input
            id="acquiredAt"
            name="acquiredAt"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="apple-input"
          />
        </div>

        <button
          type="submit"
          className="apple-button w-full sm:w-auto"
          disabled={pending}
        >
          {pending ? "Saving..." : "Add debt"}
        </button>
        {state.message ? <p className="text-sm text-slate-500">{state.message}</p> : null}
      </form>
    </section>
  );
}
