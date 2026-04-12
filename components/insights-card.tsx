import { Card, SubCard } from "@/components/ui/card";

export function InsightsCard({ insights }: { insights: string[] }) {
  return (
    <Card className="p-8 sm:p-10">
      <div className="space-y-3">
        <h2 className="section-title">Smart insights</h2>
        <p className="section-copy">Simple signals based on your latest monthly spending.</p>
      </div>

      <div className="mt-8 space-y-4">
        {insights.map((insight) => (
          <SubCard key={insight} className="interactive-card p-6">
            <p className="text-sm leading-7 text-slate-700">{insight}</p>
          </SubCard>
        ))}
      </div>
    </Card>
  );
}
