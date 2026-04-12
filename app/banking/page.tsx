import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BankingDashboard } from "@/components/banking-dashboard";
import { SectionHeader } from "@/components/ui/section-header";
import { getBankingDataForUser } from "@/lib/data/banking-queries";
import { isTrueLayerConfigured } from "@/lib/truelayer/config";
import { isDemoMode } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/service-role";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function BankingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const errorParam = typeof sp.error === "string" ? sp.error : undefined;
  const connected = sp.connected === "1" || sp.connected === "true";

  if (isDemoMode()) {
    return (
      <AppShell
        title="Banking"
        description="Connect UK accounts with Open Banking and keep balances and transactions in sync."
      >
        <section className="panel p-7 sm:p-8">
          <SectionHeader
            title="Demo mode"
            description="Add Supabase environment variables to enable sign-in and secure storage. Then configure TrueLayer and the service role key for Open Banking (see .env.example)."
          />
        </section>
      </AppShell>
    );
  }

  const data = await getBankingDataForUser();

  if (!data.user) {
    redirect("/login");
  }

  const tlOk = isTrueLayerConfigured();
  const serviceOk = isServiceRoleConfigured();
  let configMessage: string | null = null;
  if (!tlOk) {
    configMessage =
      "Add TRUELAYER_CLIENT_ID, TRUELAYER_CLIENT_SECRET, and TRUELAYER_REDIRECT_URI (must match your TrueLayer Console redirect URL, e.g. https://your-domain.com/api/truelayer/callback). For sandbox, set TRUELAYER_AUTH_BASE=https://auth.truelayer-sandbox.com and TRUELAYER_API_BASE=https://api.truelayer-sandbox.com/data/v1.";
  } else if (!serviceOk) {
    configMessage =
      "Add SUPABASE_SERVICE_ROLE_KEY so the server can store OAuth tokens securely (this key must never be exposed to the browser).";
  }

  const banner =
    connected && !errorParam
      ? ({ type: "success" as const, text: "Bank connected. Data is syncing — use Sync now if balances look empty." })
      : errorParam
        ? ({ type: "error" as const, text: errorParam })
        : null;

  return (
    <AppShell
      title="Banking"
      description="UK Open Banking via TrueLayer — connect accounts, then sync balances and transactions into SpendMapr. Your data is encrypted and we never store your banking credentials."
    >
      <BankingDashboard
        connections={data.connections}
        accounts={data.accounts}
        transactions={data.transactions}
        canConnect={tlOk && serviceOk}
        configMessage={configMessage}
        banner={banner}
      />
    </AppShell>
  );
}
