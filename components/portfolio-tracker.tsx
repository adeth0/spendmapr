"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInvestmentsBeginnerMode } from "@/components/investments-beginner-context";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { InvestmentAsset } from "@/lib/types";

type PortfolioEntry = {
  id: string;
  symbol: string;
  amountInvested: number;
  units: number;
  purchasePrice: number;
  createdAt: string;
};

type RangeKey = "1m" | "1y";

type HistoryResponse = {
  symbol: string;
  range: string;
  points: Array<{ timestamp: number; price: number; label: string }>;
};

const STORAGE_KEY = "spendmapr-portfolio-v1";

function formatMoney(value: number, currency: string = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value || 0);
}

function formatSignedMoney(value: number, currency: string = "GBP") {
  return `${value >= 0 ? "+" : "-"}${formatMoney(Math.abs(value), currency)}`;
}

export function PortfolioTracker({ assets }: { assets: InvestmentAsset[] }) {
  const { beginnerMode } = useInvestmentsBeginnerMode();
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [symbol, setSymbol] = useState(assets[0]?.symbol ?? "");
  const [amount, setAmount] = useState<string>("500");
  const [range, setRange] = useState<RangeKey>("1m");
  const [historyData, setHistoryData] = useState<Array<{ label: string; value: number }>>([]);

  const selectableAssets = useMemo(() => {
    if (beginnerMode) {
      return assets.filter((asset) => asset.symbol === "SPY" || asset.symbol === "VWRL.L");
    }
    return assets;
  }, [assets, beginnerMode]);

  const priceBySymbol = useMemo(
    () => new Map(assets.map((asset) => [asset.symbol, asset.currentPrice])),
    [assets]
  );

  useEffect(() => {
    if (!selectableAssets.some((asset) => asset.symbol === symbol)) {
      setSymbol(selectableAssets[0]?.symbol ?? "");
    }
  }, [selectableAssets, symbol]);

  const wasBeginnerPortfolioRef = useRef(false);
  useEffect(() => {
    if (beginnerMode && !wasBeginnerPortfolioRef.current) {
      setRange("1y");
    }
    wasBeginnerPortfolioRef.current = beginnerMode;
  }, [beginnerMode]);

  useEffect(() => {
    if (beginnerMode && range === "1m") {
      setRange("1y");
    }
  }, [beginnerMode, range]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as PortfolioEntry[];
      if (Array.isArray(parsed)) {
        setEntries(parsed);
      }
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    async function loadPortfolioHistory() {
      if (entries.length === 0) {
        setHistoryData([]);
        return;
      }

      const symbols = Array.from(new Set(entries.map((entry) => entry.symbol)));
      const responses = await Promise.all(
        symbols.map(async (heldSymbol) => {
          const response = await fetch(
            `/api/investments/history?symbol=${encodeURIComponent(heldSymbol)}&range=${range}`,
            { cache: "no-store" }
          );
          if (!response.ok) {
            return null;
          }
          return (await response.json()) as HistoryResponse;
        })
      );

      const validResponses = responses.filter((response): response is HistoryResponse => !!response);
      if (validResponses.length === 0) {
        setHistoryData([]);
        return;
      }

      const timestamps = Array.from(
        new Set(validResponses.flatMap((response) => response.points.map((point) => point.timestamp)))
      ).sort((a, b) => a - b);

      const bySymbol = new Map(validResponses.map((response) => [response.symbol, response.points]));

      const merged = timestamps.map((timestamp) => {
        let total = 0;

        for (const entry of entries) {
          const points = bySymbol.get(entry.symbol) ?? [];
          const latestPoint = [...points].reverse().find((point) => point.timestamp <= timestamp);
          if (latestPoint) {
            total += entry.units * latestPoint.price;
          }
        }

        const label = new Intl.DateTimeFormat("en-GB", {
          day: range === "1m" ? "2-digit" : undefined,
          month: "short",
          year: range === "1y" ? "2-digit" : undefined
        }).format(new Date(timestamp));

        return { label, value: total };
      });

      setHistoryData(merged);
    }

    void loadPortfolioHistory();
  }, [entries, range]);

  const totalInvested = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.amountInvested, 0),
    [entries]
  );

  const currentValue = useMemo(
    () =>
      entries.reduce(
        (sum, entry) => sum + entry.units * (priceBySymbol.get(entry.symbol) ?? entry.purchasePrice),
        0
      ),
    [entries, priceBySymbol]
  );

  const profitLoss = currentValue - totalInvested;
  const isPositive = profitLoss >= 0;

  function addEntry() {
    const amountValue = Number(amount);
    const livePrice = priceBySymbol.get(symbol);
    if (!symbol || !Number.isFinite(amountValue) || amountValue <= 0 || !livePrice || livePrice <= 0) {
      return;
    }

    const next: PortfolioEntry = {
      id: crypto.randomUUID(),
      symbol,
      amountInvested: amountValue,
      units: amountValue / livePrice,
      purchasePrice: livePrice,
      createdAt: new Date().toISOString()
    };
    setEntries((previous) => [...previous, next]);
    setAmount("500");
  }

  function removeEntry(id: string) {
    setEntries((previous) => previous.filter((entry) => entry.id !== id));
  }

  return (
    <section className="panel p-7 sm:p-8">
      <div className="space-y-2">
        <h2 className="section-title">Portfolio tracker</h2>
        <p className="section-copy">
          {beginnerMode
            ? "Try amounts in broad index funds and see how value moves over a year — educational only."
            : "Add holdings and track live value and unrealized gain/loss."}
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total invested</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {formatMoney(totalInvested)}
          </p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Current value</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {formatMoney(currentValue)}
          </p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Profit / loss</p>
          <p
            className={`mt-2 text-2xl font-semibold tracking-tight ${
              isPositive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {formatSignedMoney(profitLoss)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
        <select
          value={symbol}
          onChange={(event) => setSymbol(event.target.value)}
          className="surface-muted rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400"
        >
          {selectableAssets.map((asset) => (
            <option key={asset.symbol} value={asset.symbol}>
              {asset.symbol} - {asset.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="surface-muted rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          placeholder="Amount (£)"
        />
        <button
          type="button"
          onClick={addEntry}
          className="apple-button bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Add investment
        </button>
      </div>

      {entries.length > 0 ? (
        <div className="mt-6 space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="surface-muted flex items-center justify-between p-4">
              <p className="text-sm text-slate-700">
                {beginnerMode
                  ? `${entry.symbol}: you added ${formatMoney(entry.amountInvested)}`
                  : `${entry.symbol}: invested ${formatMoney(entry.amountInvested)} at ${formatMoney(
                      entry.purchasePrice,
                      assets.find((asset) => asset.symbol === entry.symbol)?.currency
                    )}`}
              </p>
              <button
                type="button"
                onClick={() => removeEntry(entry.id)}
                className="apple-button-secondary rounded-full px-3 py-1 text-xs font-semibold"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {!beginnerMode ? (
            <button
              type="button"
              onClick={() => setRange("1m")}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                range === "1m" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              1M
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setRange("1y")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              range === "1y" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            1Y
          </button>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData}>
              <CartesianGrid stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Tooltip formatter={(value: number) => formatMoney(value)} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? "#059669" : "#e11d48"}
                fill={isPositive ? "rgba(16,185,129,0.15)" : "rgba(225,29,72,0.15)"}
                strokeWidth={2}
                dot={false}
                isAnimationActive
                animationDuration={650}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
