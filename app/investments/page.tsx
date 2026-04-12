import { AppShell } from "@/components/app-shell";
import { InvestmentsPageBody } from "@/components/investments-page-body";
import { getInvestmentSnapshot } from "@/lib/investments";

export default async function InvestmentsPage() {
  const snapshot = await getInvestmentSnapshot();

  return (
    <AppShell
      title="Investments"
      description="A minimal market snapshot for the major index ETFs and your global benchmark."
    >
      <InvestmentsPageBody snapshot={snapshot} />
    </AppShell>
  );
}
