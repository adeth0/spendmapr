import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { GoalForm } from "@/components/forms/goal-form";
import { GoalList } from "@/components/goal-list";
import { getGoalsPageData } from "@/lib/data/queries";

export default async function GoalsPage() {
  const data = await getGoalsPageData();

  return (
    <AppShell
      title="Goals"
      description="Create ISA-style savings goals and track progress with each contribution."
    >
      <section className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)] 2xl:grid-cols-[430px_minmax(0,1fr)] xl:items-start">
        <GoalForm />

        {data.errorMessage ? (
          <section className="panel rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-900">
            <p className="font-semibold">Goals setup issue</p>
            <p className="mt-2">{data.errorMessage}</p>
          </section>
        ) : data.goals.length > 0 ? (
          <GoalList goals={data.goals} />
        ) : (
          <EmptyState
            title="No goals yet"
            copy="Add a savings target for your emergency fund, holiday, ISA, or next milestone."
          />
        )}
      </section>
    </AppShell>
  );
}
