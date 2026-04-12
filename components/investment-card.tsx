"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { useInvestmentsBeginnerMode } from "@/components/investments-beginner-context";
import { getInvestmentRisk } from "@/lib/investment-risk";
import type { InvestmentAsset } from "@/lib/types";

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value || 0);
}

function formatSignedPercent(value: number) {
  const rounded = Math.abs(value).toFixed(1);
  return `${value >= 0 ? "+" : "-"}${rounded}%`;
}

const INVESTMENT_EXPLANATIONS: Record<
  string,
  { what: string; why: string; risk: "low" | "medium" | "high"; longTerm: string }
> = {
  SPY: {
    what: "SPY tracks the S&P 500, which is a basket of 500 large US companies.",
    why: "People invest in it for broad exposure to the US stock market in one fund.",
    risk: "medium",
    longTerm:
      "Over long periods, the S&P 500 has generally trended upward, but it can still drop sharply in market downturns."
  },
  QQQ: {
    what: "QQQ tracks the Nasdaq-100, which is focused on large non-financial companies, especially tech.",
    why: "People invest in it for growth potential and strong exposure to innovation-led companies.",
    risk: "high",
    longTerm:
      "It has delivered strong long-term growth historically, but tends to be more volatile than broader market ETFs."
  },
  "VWRL.L": {
    what: "VWRL is a global equity ETF that holds companies across developed and emerging markets.",
    why: "People invest in it for global diversification rather than relying on a single country.",
    risk: "medium",
    longTerm:
      "Long-term returns are tied to global stock market growth, with periods of both gains and declines along the way."
  }
};

const SIMPLE_EXPLANATIONS: Record<string, string> = {
  SPY: "This fund tracks the S&P 500 — a wide basket of large US companies. Many beginners use broad index funds as a simple way to spread risk.",
  QQQ: "This fund is heavy in technology stocks, so it can go up and down more sharply than a very broad index.",
  "VWRL.L": "This global fund holds companies in many countries, so you are less tied to one market."
};

export function InvestmentCard({ asset }: { asset: InvestmentAsset }) {
  const { beginnerMode } = useInvestmentsBeginnerMode();
  const dailyUp = asset.dailyChangePercent >= 0;
  const yearlyUp = asset.oneYearPerformancePercent >= 0;
  const explanation = INVESTMENT_EXPLANATIONS[asset.symbol];
  const risk = getInvestmentRisk(asset.symbol);
  const riskStyle =
    risk.level === "low"
      ? "bg-emerald-50 text-emerald-700"
      : risk.level === "medium"
        ? "bg-amber-50 text-amber-700"
        : "bg-rose-50 text-rose-700";

  const indexHighlight =
    beginnerMode && (asset.symbol === "SPY" || asset.symbol === "VWRL.L");

  return (
    <article
      className={`panel interactive-card p-7 sm:p-8 ${
        indexHighlight ? "ring-2 ring-emerald-100 ring-offset-2 ring-offset-white" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
            {asset.label}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{asset.name}</h2>
          <p className="text-sm text-slate-500">{asset.symbol}</p>
        </div>
        <div
          className={`rounded-2xl p-3 ${
            dailyUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {dailyUp ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
        </div>
      </div>

      <div className="mt-8 space-y-5">
        <div className="surface-muted p-5">
          <p className="text-sm text-slate-500">Current price</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {formatMoney(asset.currentPrice, asset.currency)}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${riskStyle}`}
            >
              {risk.level} risk
            </span>
            <p className="text-sm text-slate-600">{risk.reason}</p>
          </div>
        </div>

        {!beginnerMode ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-muted p-5">
              <p className="text-sm text-slate-500">Daily change</p>
              <p
                className={`mt-2 text-2xl font-semibold tracking-tight ${
                  dailyUp ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatSignedPercent(asset.dailyChangePercent)}
              </p>
            </div>
            <div className="surface-muted p-5">
              <p className="text-sm text-slate-500">1 year performance</p>
              <p
                className={`mt-2 text-2xl font-semibold tracking-tight ${
                  yearlyUp ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatSignedPercent(asset.oneYearPerformancePercent)}
              </p>
            </div>
          </div>
        ) : null}

        {beginnerMode && SIMPLE_EXPLANATIONS[asset.symbol] ? (
          <div className="surface-muted p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              In plain language
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {SIMPLE_EXPLANATIONS[asset.symbol]} Not financial advice.
            </p>
          </div>
        ) : null}

        {!beginnerMode && explanation ? (
          <div className="surface-muted p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Quick explanation
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {`What it is: ${explanation.what} Why people invest: ${explanation.why} Typical risk level: ${explanation.risk}. Long-term performance: ${explanation.longTerm} This is educational information, not financial advice.`}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
