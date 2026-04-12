"use client";

import { useActionState } from "react";
import { signInWithEmail } from "@/lib/actions";

const initialState = {
  message: ""
};

export function AuthCard() {
  const [state, action, pending] = useActionState(signInWithEmail, initialState);

  return (
    <section className="panel p-9 sm:p-11">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
          Sign in
        </p>
        <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
          Start mapping your money
        </h2>
        <p className="text-sm leading-6 text-slate-500">
          Use your email and we&apos;ll send a secure sign-in link through Supabase Auth.
        </p>
      </div>

      <form action={action} className="mt-10 space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            className="apple-input"
          />
        </div>

        <button
          type="submit"
          className="apple-button w-full sm:w-auto"
          disabled={pending}
        >
          {pending ? "Sending link..." : "Email me a sign-in link"}
        </button>

        {state.message ? <p className="text-sm text-slate-500">{state.message}</p> : null}
      </form>
    </section>
  );
}
