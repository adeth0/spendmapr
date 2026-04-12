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

type RangeKey = "1d" | "1m" | "1y";

type AssetOption = {
  symbol: string;
  label: string;
  currency: string;
};

type HistoryPoint = {
  timestamp: number;
  price: number;
  label: string;
};

const RANGES_FULL: Array<{ key: RangeKey; label: string }> = [
  { key: "1d", label: "1D" },
  { key: "1m", label: "1M" },
  { key: "1y", label: "1Y" }
];

const RANGES_BEGINNER: Array<{ key: RangeKey; label: string }> = [
  { key: "1m", label: "1M" },
  { key: "1y", label: "1Y" }
];

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value || 0);
}

function formatSignedPercent(value: number) {
  const rounded = Math.abs(value).toFixed(2);
  return `${value >= 0 ? "+" : "-"}${rounded}%`;
}

export function InvestmentPerformanceCard({ assets }: { assets: AssetOption[] }) {
  const { beginnerMode } = useInvestmentsBeginnerMode();
  const [symbol, setSymbol] = useState<string>(assets[0]?.symbol ?? "");
  const [range, setRange] = useState<RangeKey>("1m");
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rangeOptions = beginnerMode ? RANGES_BEGINNER : RANGES_FULL;

  const chartAssets = useMemo(() => {
    if (beginnerMode) {
      return assets.filter((asset) => asset.symbol === "SPY" || asset.symbol === "VWRL.L");
    }
    return assets;
  }, [assets, beginnerMode]);

  const activeAsset = useMemo(
    () => assets.find((asset) => asset.symbol === symbol) ?? assets[0],
    [assets, symbol]
  );

  useEffect(() => {
    if (!chartAssets.some((asset) => asset.symbol === symbol)) {
      setSymbol(chartAssets[0]?.symbol ?? "");
    }
  }, [chartAssets, symbol]);

  const wasBeginnerRef = useRef(false);
  useEffect(() => {
    if (beginnerMode && !wasBeginnerRef.current) {
      setRange("1y");
    }
    wasBeginnerRef.current = beginnerMode;
  }, [beginnerMode]);

  useEffect(() => {
    if (!rangeOptions.some((option) => option.key === range)) {
      setRange(rangeOptions[rangeOptions.length - 1]?.key ?? "1y");
    }
  }, [range, rangeOptions]);

  useEffect(() => {
    if (beginnerMode && range === "1d") {
      setRange("1y");
    }
  }, [beginnerMode, range]);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      if (!symbol) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/investments/history?symbol=${encodeURIComponent(symbol)}&range=${range}`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as {
          points?: HistoryPoint[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load investment history.");
        }

        if (!cancelled) {
          setPoints(Array.isArray(payload.points) ? payload.points : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load history.");
          setPoints([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  const performance = useMemo(() => {
    if (points.length < 2) {
      return 0;
    }
    const first = points[0].price;
    const last = points[points.length - 1].price;
    if (!first) {
      return 0;
    }
    return ((last - first) / first) * 100;
  }, [points]);

  const trendUp = performance >= 0;

  return (
    <section className="panel p-7 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h2 className="section-title">Performance</h2>
          <p className="section-copy">
            {beginnerMode
              ? "A gentle look at how broad index funds have moved over recent months and a year."
              : "Track daily, monthly, and yearly trend in real time."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="investment-symbol">
            Investment symbol
          </label>
          <select
            id="investment-symbol"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            className="surface-muted rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          >
            {chartAssets.map((asset) => (
              <option key={asset.symbol} value={asset.symbol}>
                {asset.symbol} - {asset.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        {rangeOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setRange(option.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition ${
              range === option.key
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{activeAsset?.symbol ?? "Asset"}</p>
          <p
            className={`mt-1 text-2xl font-semibold tracking-tight ${
              trendUp ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {formatSignedPercent(performance)}
          </p>
        </div>
        {!beginnerMode ? (
          <p className="text-sm text-slate-500">
            {formatMoney(points[points.length - 1]?.price ?? 0, activeAsset?.currency ?? "USD")}
          </p>
        ) : null}
      </div>

      <div className="mt-6 h-72">
        {error ? (
          <div className="surface-muted flex h-full items-center justify-center rounded-2xl px-5 text-center text-sm text-slate-600">
            {error}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="investmentArea" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={trendUp ? "rgb(16, 185, 129)" : "rgb(244, 63, 94)"}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="100%"
                    stopColor={trendUp ? "rgb(16, 185, 129)" : "rgb(244, 63, 94)"}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eef2f7" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={20}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Tooltip
                cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }}
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 24px 40px -28px rgba(15, 23, 42, 0.28)",
                  backgroundColor: "rgba(255,255,255,0.96)"
                }}
                formatter={(value: number) => [
                  formatMoney(value, activeAsset?.currency ?? "USD"),
                  "Price"
                ]}
                labelFormatter={(label: string) => label}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={trendUp ? "#059669" : "#e11d48"}
                strokeWidth={2.25}
                fill="url(#investmentArea)"
                isAnimationActive
                animationDuration={650}
                animationEasing="ease-out"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {loading ? <p className="mt-4 text-xs text-slate-400">Refreshing chart...</p> : null}
    </section>
  );
}
