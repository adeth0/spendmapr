import { AppShell } from "@/components/app-shell";
import { DebtList } from "@/components/debt-list";
import { EmptyState } from "@/components/empty-state";
import { DebtForm } from "@/components/forms/debt-form";
import { getDebtPageData } from "@/lib/data/queries";

export default async function DebtTrackerPage() {
  const data = await getDebtPageData();

  return (
    <AppShell
      title="Debt Tracker"
      description="Monitor balances, minimum payments, and payoff progress."
    >
      <section className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)] 2xl:grid-cols-[430px_minmax(0,1fr)] xl:items-start">
        <DebtForm />

        {data.debts.length > 0 ? (
          <DebtList debts={data.debts} />
        ) : (
          <EmptyState
            title="No debts added"
            copy="Track loans, credit cards, or buy-now-pay-later balances in one place."
          />
        )}
      </section>
    </AppShell>
  );
}
