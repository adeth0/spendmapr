"use client";

import { useMemo } from "react";
import { BeginnerModeToggle, InvestmentsBeginnerProvider } from "@/components/investments-beginner-context";
import { InvestmentCard } from "@/components/investment-card";
import { InvestmentPerformanceCard } from "@/components/investment-performance-card";
import { InvestmentsInsights } from "@/components/investments-insights";
import { PortfolioTracker } from "@/components/portfolio-tracker";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import type { InvestmentAsset } from "@/lib/types";

const INDEX_FIRST = new Map<string, number>([
  ["SPY", 0],
  ["VWRL.L", 1],
  ["QQQ", 2]
]);

export type InvestmentSnapshot = {
  error: string | null;
  assets: InvestmentAsset[];
};

function sortForBeginnerMode(assets: InvestmentAsset[]) {
  return [...assets].sort((a, b) => {
    const orderA = INDEX_FIRST.get(a.symbol) ?? 99;
    const orderB = INDEX_FIRST.get(b.symbol) ?? 99;
    return orderA - orderB;
  });
}

function InvestmentsMain({ snapshot }: { snapshot: InvestmentSnapshot }) {
  const sortedAssets = useMemo(
    () => sortForBeginnerMode(snapshot.assets),
    [snapshot.assets]
  );

  return (
    <div className="space-y-4">
      <PortfolioTracker assets={sortedAssets} />
      <InvestmentPerformanceCard
        assets={sortedAssets.map((asset) => ({
          symbol: asset.symbol,
          label: asset.label,
          currency: asset.currency
        }))}
      />
      <InvestmentsInsights assets={sortedAssets} />
      <section className="grid gap-4 2xl:grid-cols-3 xl:grid-cols-2">
        {sortedAssets.map((asset) => (
          <InvestmentCard key={asset.symbol} asset={asset} />
        ))}
      </section>
    </div>
  );
}

export function InvestmentsPageBody({ snapshot }: { snapshot: InvestmentSnapshot }) {
  return (
    <InvestmentsBeginnerProvider>
      <div className="space-y-6">
        <BeginnerModeToggle />
        {snapshot.error ? (
          <Card className="p-7 sm:p-8">
            <SectionHeader
              title="Market data is temporarily unavailable"
              description="Yahoo Finance may be temporarily unavailable or rate limiting requests."
            />
            <div className="surface-muted mt-8 p-5">
              <p className="text-sm leading-6 text-slate-600">{snapshot.error}</p>
            </div>
          </Card>
        ) : (
          <InvestmentsMain snapshot={snapshot} />
        )}
        <p className="text-center text-sm leading-6 text-slate-500">
          This information is for educational purposes only and not financial advice.
        </p>
      </div>
    </InvestmentsBeginnerProvider>
  );
}
