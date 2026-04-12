import type { InvestmentAsset } from "@/lib/types";

type InsightContext = {
  isTechHeavy: boolean;
  isBroadMarket: boolean;
  isGlobalDiversified: boolean;
};

function getContext(symbol: string): InsightContext {
  if (symbol === "QQQ") {
    return { isTechHeavy: true, isBroadMarket: false, isGlobalDiversified: false };
  }

  if (symbol === "SPY") {
    return { isTechHeavy: false, isBroadMarket: true, isGlobalDiversified: false };
  }

  if (symbol === "VWRL.L") {
    return { isTechHeavy: false, isBroadMarket: false, isGlobalDiversified: true };
  }

  return { isTechHeavy: false, isBroadMarket: false, isGlobalDiversified: false };
}

function buildBeginnerInsights(asset: InvestmentAsset) {
  const context = getContext(asset.symbol);
  const insights: string[] = [];

  if (context.isBroadMarket) {
    insights.push(
      "Broad US index funds often come up in beginner guides because they spread money across many large companies."
    );
    insights.push(
      "A common long-term idea is to keep fees low, stay diversified, and avoid panic-selling on bad days."
    );
  }

  if (context.isGlobalDiversified) {
    insights.push("Global index funds add country diversification beyond a single market.");
  }

  if (context.isTechHeavy) {
    insights.push(
      "This fund leans toward tech; prices can move more sharply than a very broad index like the S&P 500."
    );
  }

  insights.push("Educational only — not a prediction or personal financial advice.");

  return insights.slice(0, 3);
}

function buildEducationalInsights(asset: InvestmentAsset) {
  const context = getContext(asset.symbol);
  const insights: string[] = [];

  if (context.isBroadMarket) {
    insights.push(
      "The S&P 500 has historically returned around 7-10% annually over long periods, although year-to-year results can vary."
    );
    insights.push(
      "This ETF spreads exposure across many large US sectors, which helps reduce single-company risk."
    );
  }

  if (context.isTechHeavy) {
    insights.push(
      "Tech-heavy ETFs can deliver strong growth in expansion periods, but they are often more volatile in market pullbacks."
    );
    insights.push(
      "Because holdings are concentrated in fewer sectors, short-term price swings may be larger than broad-market funds."
    );
  }

  if (context.isGlobalDiversified) {
    insights.push(
      "This ETF holds companies across multiple regions and sectors, offering broad global diversification."
    );
    insights.push(
      "Global funds can reduce single-country concentration risk, but currency and regional cycles can still affect returns."
    );
  }

  const oneYear = asset.oneYearPerformancePercent;
  if (Math.abs(oneYear) >= 15) {
    insights.push(
      `${asset.label} moved ${oneYear >= 0 ? "up" : "down"} sharply over the last year, a reminder that even diversified ETFs can have large swings.`
    );
  } else {
    insights.push(
      `${asset.label} showed moderate 1-year movement, which is common for broad ETFs during mixed market periods.`
    );
  }

  insights.push("These notes are educational and describe historical behavior, not a prediction or financial advice.");

  return insights.slice(0, 4);
}

export function generateInvestmentInsights(assets: InvestmentAsset[], beginnerMode = false) {
  return assets.map((asset) => ({
    symbol: asset.symbol,
    label: asset.label,
    insights: beginnerMode ? buildBeginnerInsights(asset) : buildEducationalInsights(asset)
  }));
}
