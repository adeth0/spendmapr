"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/section-header";
import type { BankAccountRow, BankConnectionRow, BankTransactionRow } from "@/lib/data/banking-queries";

function formatAmount(amount: number, currency: string | null) {
  const code = currency && currency.length === 3 ? currency : "GBP";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}

type BankingDashboardProps = {
  connections: BankConnectionRow[];
  accounts: BankAccountRow[];
  transactions: BankTransactionRow[];
  canConnect: boolean;
  configMessage: string | null;
  banner: { type: "success" | "error"; text: string } | null;
};

export function BankingDashboard({
  connections,
  accounts,
  transactions,
  canConnect,
  configMessage,
  banner
}: BankingDashboardProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  async function runSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const response = await fetch("/api/truelayer/sync", { method: "POST" });
      const payload = (await response.json()) as { ok?: boolean; error?: string; errors?: string[] };
      if (!response.ok) {
        setSyncMessage(payload.error ?? "Sync failed.");
      } else if (payload.errors?.length) {
        setSyncMessage(payload.errors[0] ?? "Some connections failed to sync.");
      } else {
        setSyncMessage("Sync complete.");
      }
      router.refresh();
    } catch {
      setSyncMessage("Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      {banner ? (
        <div
          className={`rounded-2xl px-5 py-4 text-sm ${
            banner.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {banner.text}
        </div>
      ) : null}

      {configMessage ? (
        <section className="panel p-6 text-sm leading-6 text-slate-600">
          <p className="font-semibold text-slate-900">Setup required</p>
          <p className="mt-2">{configMessage}</p>
        </section>
      ) : null}

      <section className="panel flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <SectionHeader
            title="Connect your bank"
            description="Secure UK Open Banking via TrueLayer. You approve access at your bank; we store read-only data you sync."
          />
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:max-w-md">
            <p className="font-semibold text-slate-900">Security notes</p>
            <ul className="mt-2 space-y-2 list-disc pl-5 text-slate-600">
              <li>Your data is encrypted.</li>
              <li>We never store your banking credentials.</li>
              <li>Powered by Open Banking.</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {canConnect ? (
            <a href="/api/truelayer/link" className="apple-button-primary inline-flex justify-center px-6 py-3 text-sm font-semibold">
              Connect bank
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-xl bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-500"
            >
              Connect bank
            </button>
          )}
          {connections.length > 0 && canConnect ? (
            <button
              type="button"
              onClick={() => void runSync()}
              disabled={syncing}
              className="apple-button-secondary px-6 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {syncing ? "Syncing…" : "Sync now"}
            </button>
          ) : null}
        </div>
      </section>

      {syncMessage ? (
        <p className="text-center text-sm text-slate-600" role="status">
          {syncMessage}
        </p>
      ) : null}

      <section className="panel p-6 sm:p-8">
        <h2 className="section-title">Connected accounts</h2>
        <p className="section-copy">Balances update when you sync (and on the daily server job if configured).</p>
        {accounts.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No accounts yet. Connect a bank to see balances here.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {accounts.map((account) => (
              <li key={account.id} className="surface-muted flex flex-col gap-1 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{account.display_name ?? "Account"}</p>
                  <p className="text-xs text-slate-500">
                    {account.account_type ?? "Account"} · {account.currency ?? "GBP"}
                  </p>
                </div>
                <p className="text-lg font-semibold tabular-nums text-slate-950">
                  {account.current_balance != null
                    ? formatAmount(Number(account.current_balance), account.currency)
                    : "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel p-6 sm:p-8">
        <h2 className="section-title">Latest transactions</h2>
        <p className="section-copy">Most recent synced movements across connected accounts.</p>
        {transactions.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No transactions synced yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-slate-100">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{tx.description ?? "Transaction"}</p>
                  <p className="text-xs text-slate-500">{formatDate(tx.booking_date)}</p>
                </div>
                <p
                  className={`text-sm font-semibold tabular-nums ${
                    Number(tx.amount) >= 0 ? "text-emerald-600" : "text-slate-900"
                  }`}
                >
                  {Number(tx.amount) >= 0 ? "+" : "−"}
                  {formatAmount(Math.abs(Number(tx.amount)), tx.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {connections.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">Connections</p>
          <ul className="mt-2 space-y-1">
            {connections.map((c) => (
              <li key={c.id}>
                Status: {c.status}
                {c.last_sync_at ? ` · Last sync ${formatDate(c.last_sync_at)}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
