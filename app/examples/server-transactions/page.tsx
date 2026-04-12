import { AppShell } from "@/components/app-shell";
import { createServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ServerTransactionsExamplePage() {
  const supabase = await createServerClient();
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("id, title, amount, type, category, transaction_date")
    .order("transaction_date", { ascending: false })
    .limit(10);

  return (
    <AppShell
      title="Server Fetch Example"
      description="A simple server-rendered example using the existing SpendMapr transactions table."
    >
      <section className="panel p-7 sm:p-8">
        <div className="space-y-2">
          <h2 className="section-title">Latest transactions</h2>
          <p className="section-copy">
            This page fetches data directly in a Server Component with
            `createServerClient()`.
          </p>
        </div>

        {error ? (
          <div className="surface-muted mt-8 p-5">
            <p className="text-sm font-medium text-slate-900">Query failed</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{error.message}</p>
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="mt-8 space-y-4">
            {transactions.map((transaction) => (
              <article
                key={transaction.id}
                className="surface-muted interactive-card flex items-center justify-between gap-4 p-5"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-base font-semibold text-slate-900">
                    {transaction.title}
                  </p>
                  <p className="text-sm text-slate-500">
                    {transaction.category} - {formatDate(transaction.transaction_date)}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-semibold tracking-tight text-slate-900">
                  {transaction.type === "expense" ? "-" : "+"}
                  {formatCurrency(transaction.amount)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-muted mt-8 p-5">
            <p className="text-sm font-medium text-slate-900">No transactions yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add a transaction first, then refresh this page to see server-fetched data.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
