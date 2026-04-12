"use client";

import { useActionState } from "react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createGoal } from "@/lib/actions";

const initialState = {
  message: ""
};

export function GoalForm() {
  const [state, action, pending] = useActionState(createGoal, initialState);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message === "Goal created.") {
      router.refresh();
      formRef.current?.reset();
    }
  }, [state.message, router]);

  return (
    <section className="panel p-7 sm:p-8">
      <div className="space-y-2">
        <h2 className="section-title">Create a goal</h2>
        <p className="section-copy">Build savings targets for an ISA, holiday, or rainy day.</p>
      </div>

      <form ref={formRef} action={action} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Goal name
          </label>
          <input
            id="name"
            name="name"
            required
            className="apple-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="goalType" className="text-sm font-medium text-slate-700">
            Goal type
          </label>
          <select
            id="goalType"
            name="goalType"
            className="apple-input"
            defaultValue="ISA"
          >
            <option>ISA</option>
            <option>Emergency Fund</option>
            <option>Holiday</option>
            <option>Home</option>
            <option>Custom</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="targetAmount" className="text-sm font-medium text-slate-700">
              Target amount
            </label>
            <input
              id="targetAmount"
              name="targetAmount"
              type="number"
              min="0"
              step="0.01"
              required
              className="apple-input"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="currentAmount" className="text-sm font-medium text-slate-700">
              Current amount
            </label>
            <input
              id="currentAmount"
              name="currentAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              required
              className="apple-input"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="monthlyContribution" className="text-sm font-medium text-slate-700">
            Monthly contribution
          </label>
          <input
            id="monthlyContribution"
            name="monthlyContribution"
            type="number"
            min="0"
            step="0.01"
            required
            className="apple-input"
          />
        </div>

        <button
          type="submit"
          className="apple-button w-full sm:w-auto"
          disabled={pending}
        >
          {pending ? "Saving..." : "Add goal"}
        </button>
        {state.message ? <p className="text-sm text-slate-500">{state.message}</p> : null}
      </form>
    </section>
  );
}
