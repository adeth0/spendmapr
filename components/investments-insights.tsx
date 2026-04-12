"use client";

import { useInvestmentsBeginnerMode } from "@/components/investments-beginner-context";
import { generateInvestmentInsights } from "@/lib/investment-insights";
import type { InvestmentAsset } from "@/lib/types";

const BROAD_INDEX_SYMBOLS = new Set(["SPY", "VWRL.L"]);

export function InvestmentsInsights({ assets }: { assets: InvestmentAsset[] }) {
  const { beginnerMode } = useInvestmentsBeginnerMode();

  const insightAssets = beginnerMode
    ? assets.filter((asset) => BROAD_INDEX_SYMBOLS.has(asset.symbol))
    : assets;

  const insightGroups = generateInvestmentInsights(insightAssets, beginnerMode);

  return (
    <section className="panel p-7 sm:p-8">
      <div className="space-y-2">
        <h2 className="section-title">Insights</h2>
        <p className="section-copy">
          {beginnerMode
            ? "Simple ideas people often hear about long-term, diversified investing."
            : "Quick educational notes based on long-term market behavior and current ETF profile."}
        </p>
      </div>

      {beginnerMode ? (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
          <p className="text-sm font-semibold text-emerald-900">Long-term strategies beginners often study</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-emerald-900/90">
            <li>Keep costs low and stay broadly diversified (for example via index funds).</li>
            <li>Think in years, not hours — short-term swings are normal for stocks.</li>
            <li>Match any investment to your own goals, timeline, and comfort with ups and downs.</li>
          </ul>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {insightGroups.map((group) => (
          <article key={group.symbol} className="surface-muted p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              {group.label}
            </h3>
            <ul className="mt-3 space-y-2">
              {group.insights.map((insight) => (
                <li key={insight} className="text-sm leading-6 text-slate-600">
                  {insight}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
