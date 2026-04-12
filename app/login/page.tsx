import { redirect } from "next/navigation";
import { WalletCards } from "lucide-react";
import { AuthCard } from "@/components/auth-card";
import { createServerClient, isDemoMode } from "@/lib/supabase/server";

export default async function LoginPage() {
  if (isDemoMode()) {
    redirect("/dashboard");
  }

  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell justify-center">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel flex min-h-[520px] flex-col justify-between overflow-hidden p-10 sm:p-12">
          <div className="space-y-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-soft">
              <WalletCards className="h-7 w-7" />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-brand-600">
                SpendMapr
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                See every pound with calm, clear control.
              </h1>
              <p className="max-w-lg text-base leading-8 text-slate-600">
                A clean personal finance workspace for tracking spending, debt payoff, and
                savings goals in one place.
              </p>
            </div>
          </div>

          <div className="grid gap-4 pt-10 sm:grid-cols-3">
            <div className="surface-muted interactive-card p-5">
              <p className="text-sm text-slate-500">Monthly spending</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">-GBP 1,245</p>
            </div>
            <div className="surface-muted interactive-card p-5">
              <p className="text-sm text-slate-500">Debt payoff</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">62%</p>
            </div>
            <div className="surface-muted interactive-card p-5">
              <p className="text-sm text-slate-500">Savings goals</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">4 active</p>
            </div>
          </div>
        </section>

        <AuthCard />
      </div>
    </main>
  );
}
