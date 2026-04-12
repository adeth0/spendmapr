import { NextResponse } from "next/server";
import {
  getInvestmentHistory,
  isSupportedInvestmentSymbol,
  type InvestmentRange
} from "@/lib/investments";

function isRange(value: string): value is InvestmentRange {
  return value === "1d" || value === "1m" || value === "1y";
}

function formatLabel(timestamp: number, range: InvestmentRange) {
  if (range === "1d") {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(timestamp));
  }

  if (range === "1m") {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short"
    }).format(new Date(timestamp));
  }

  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "2-digit"
  }).format(new Date(timestamp));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  const rangeParam = searchParams.get("range") ?? "1m";

  if (!isSupportedInvestmentSymbol(symbol)) {
    return NextResponse.json({ error: "Invalid investment symbol." }, { status: 400 });
  }

  if (!isRange(rangeParam)) {
    return NextResponse.json({ error: "Invalid range. Use 1d, 1m, or 1y." }, { status: 400 });
  }

  try {
    const points = await getInvestmentHistory(symbol, rangeParam).then((rows) =>
      rows.map((row) => ({
        timestamp: row.timestamp,
        price: row.price,
        label: formatLabel(row.timestamp, rangeParam)
      }))
    );

    return NextResponse.json({ symbol, range: rangeParam, points });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load investment history right now."
      },
      { status: 500 }
    );
  }
}
