export type RiskLevel = "low" | "medium" | "high";

export function getInvestmentRisk(symbol: string): { level: RiskLevel; reason: string } {
  if (symbol === "SPY" || symbol === "VWRL.L") {
    return {
      level: "low",
      reason: "Broad index exposure across many companies helps reduce single-stock risk."
    };
  }

  if (symbol === "QQQ") {
    return {
      level: "medium",
      reason: "This ETF is concentrated in a smaller set of sectors, so price swings can be larger."
    };
  }

  // Default rule for symbols outside the known ETF list.
  return {
    level: "high",
    reason: "Single-asset holdings (like one stock or crypto) can be more volatile and less diversified."
  };
}
