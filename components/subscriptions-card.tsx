import { formatCurrency } from "@/lib/utils";
import { Card, SubCard } from "@/components/ui/card";
import type { SubscriptionSummary } from "@/lib/types";

export function SubscriptionsCard({
  subscriptions,
  totalMonthlyCost
}: {
  subscriptions: SubscriptionSummary[];
  totalMonthlyCost: number;
}) {
  return (
    <Card className="p-8 sm:p-10">
      <div className="space-y-3">
        <h2 className="section-title">Subscriptions</h2>
        <p className="section-copy">Recurring payments detected from your latest expense activity.</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-[minmax(0,1fr)_240px]">
        <SubCard className="p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Estimated monthly subscription spend</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(totalMonthlyCost)}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400">
            automatically inferred from recurring charges
          </p>
        </SubCard>

        <SubCard className="p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Subscription count</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            {subscriptions.length}
          </p>
        </SubCard>
      </div>

      {subscriptions.length ? (
        <div className="mt-7 space-y-4">
          {subscriptions.slice(0, 4).map((subscription) => (
            <SubCard key={`${subscription.name}-${subscription.amount}-${subscription.lastCharged}`} className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-950">{subscription.name}</p>
                  <p className="mt-2 text-sm text-slate-500">Last charged {subscription.lastCharged}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-slate-950">{formatCurrency(subscription.amount)}</p>
                  <p className="mt-2 text-sm uppercase tracking-[0.22em] text-slate-400">
                    {subscription.cadence}
                  </p>
                </div>
              </div>
            </SubCard>
          ))}

          {subscriptions.length > 4 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Showing the top 4 subscriptions by monthly cost.
            </div>
          ) : null}
        </div>
      ) : (
        <SubCard className="mt-6 p-6">
          <p className="text-sm leading-7 text-slate-500">We didn&apos;t detect enough repeating charges to flag a subscription yet.</p>
        </SubCard>
      )}
    </Card>
  );
}
