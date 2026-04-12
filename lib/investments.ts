import yahooFinance from "yahoo-finance2";
import type { InvestmentAsset } from "@/lib/types";

type YahooQuote = {
  longName?: string;
  shortName?: string;
  currency?: string;
  regularMarketPrice?: number | string;
  regularMarketChangePercent?: number | string;
};

type HistoricalRow = {
  date?: Date | string | null;
  close?: number | string | null;
};

export const ASSETS = [
  {
    symbol: "SPY",
    label: "S&P 500",
    fallbackName: "SPDR S&P 500 ETF Trust",
    currency: "USD"
  },
  {
    symbol: "QQQ",
    label: "Nasdaq",
    fallbackName: "Invesco QQQ Trust",
    currency: "USD"
  },
  {
    symbol: "VWRL.L",
    label: "Global ETF",
    fallbackName: "Vanguard FTSE All-World",
    currency: "GBP"
  }
] as const;

export type InvestmentRange = "1d" | "1m" | "1y";

type YahooClient = {
  quote: (symbol: string) => Promise<YahooQuote>;
  historical: (
    symbol: string,
    options: {
      period1: Date;
      period2: Date;
      interval: "1d" | "1wk";
    }
  ) => Promise<HistoricalRow[]>;
};

export function resolveYahooClient(): YahooClient {
  const candidate = yahooFinance as unknown as Partial<YahooClient>;

  if (typeof candidate.quote !== "function" || typeof candidate.historical !== "function") {
    throw new Error("Yahoo Finance client is not available.");
  }

  return candidate as YahooClient;
}

function getCloseValue(row: HistoricalRow): number | null {
  const close = typeof row.close === "number" ? row.close : null;
  if (close === null || !Number.isFinite(close) || close <= 0) {
    return null;
  }
  return close;
}

function calculateOneYearPerformance(history: HistoricalRow[]): number {
  const validRows = history
    .map((row) => getCloseValue(row))
    .filter((value): value is number => value !== null);

  if (validRows.length < 2) {
    return 0;
  }

  const first = validRows[0];
  const last = validRows[validRows.length - 1];
  return ((last - first) / first) * 100;
}

function getHistoryWindow(range: InvestmentRange) {
  if (range === "1d") {
    return {
      period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      period2: new Date(),
      interval: "1d" as const
    };
  }

  if (range === "1m") {
    return {
      period1: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
      period2: new Date(),
      interval: "1d" as const
    };
  }

  return {
    period1: new Date(Date.now() - 370 * 24 * 60 * 60 * 1000),
    period2: new Date(),
    interval: "1wk" as const
  };
}

export function isSupportedInvestmentSymbol(symbol: string) {
  return ASSETS.some((asset) => asset.symbol === symbol);
}

export async function getInvestmentHistory(symbol: string, range: InvestmentRange) {
  const yahoo = resolveYahooClient();
  const options = getHistoryWindow(range);
  const rows = await yahoo.historical(symbol, options);

  return rows
    .map((row) => ({
      timestamp: row.date instanceof Date ? row.date.getTime() : null,
      price: getCloseValue(row)
    }))
    .filter(
      (point): point is { timestamp: number; price: number } =>
        point.timestamp !== null && point.price !== null
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}

async function fetchAsset(asset: (typeof ASSETS)[number]): Promise<InvestmentAsset> {
  const yahoo = resolveYahooClient();
  const [quote, history] = await Promise.all([
    yahoo.quote(asset.symbol),
    yahoo.historical(asset.symbol, {
      period1: new Date(Date.now() - 370 * 24 * 60 * 60 * 1000),
      period2: new Date(),
      interval: "1wk"
    })
  ]);

  const typedQuote = quote as YahooQuote;

  return {
    symbol: asset.symbol,
    label: asset.label,
    name: typedQuote.longName ?? typedQuote.shortName ?? asset.fallbackName,
    currency: typedQuote.currency ?? asset.currency,
    currentPrice: Number(typedQuote.regularMarketPrice ?? 0),
    dailyChangePercent: Number(typedQuote.regularMarketChangePercent ?? 0),
    oneYearPerformancePercent: calculateOneYearPerformance(history)
  };
}

export async function getInvestmentSnapshot() {
  try {
    const assets = await Promise.all(ASSETS.map((asset) => fetchAsset(asset)));

    return {
      isConfigured: true,
      assets,
      error: null as string | null
    };
  } catch (error) {
    return {
      isConfigured: true,
      assets: [] as InvestmentAsset[],
      error:
        error instanceof Error
          ? error.message
          : "Unable to load market data right now."
    };
  }
}