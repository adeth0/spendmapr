export interface ChartPoint {
  day: string;
  price: number;
}

export interface IndexQuote {
  symbol: string;
  name: string;
  ticker: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  isUp: boolean;
  chartData: ChartPoint[];
  lastUpdated: Date;
}

export interface MarketResult {
  data: IndexQuote[];
  /** True when live fetch failed and we are showing cached/mock values */
  isMock: boolean;
  error?: string;
}

// ─── Index definitions ────────────────────────────────────────────────────────

const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500',   ticker: 'SPX'  },
  { symbol: '^IXIC', name: 'NASDAQ',    ticker: 'COMP' },
  { symbol: '^DJI',  name: 'Dow Jones', ticker: 'DJIA' },
] as const;

// ─── In-memory cache (5 min TTL) ─────────────────────────────────────────────

interface CacheEntry { data: IndexQuote[]; ts: number }
let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

// ─── CORS proxies (tried in order) ───────────────────────────────────────────

const PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

async function fetchWithProxy(yahooUrl: string): Promise<unknown> {
  let lastErr: unknown;
  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(yahooUrl), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

// ─── Parse a single Yahoo v8 chart response ──────────────────────────────────

function parseYahooChart(
  raw: unknown,
  meta: typeof INDICES[number],
): IndexQuote {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (raw as any)?.chart?.result?.[0];
  if (!result) throw new Error('Unexpected shape');

  const m           = result.meta;
  const price       = m.regularMarketPrice as number;
  const prevClose   = (m.previousClose ?? m.chartPreviousClose) as number;
  const change      = price - prevClose;
  const changePct   = (change / prevClose) * 100;

  const timestamps: number[]   = result.timestamp ?? [];
  const closes: (number|null)[] = result.indicators?.quote?.[0]?.close ?? [];

  const chartData: ChartPoint[] = timestamps
    .map((ts, i) => ({
      day: new Date(ts * 1000).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }),
      price: closes[i] ?? 0,
    }))
    .filter(d => d.price > 0)
    .slice(-7);

  return {
    symbol:        meta.symbol,
    name:          meta.name,
    ticker:        meta.ticker,
    price,
    previousClose: prevClose,
    change,
    changePercent: changePct,
    isUp:          change >= 0,
    chartData,
    lastUpdated:   new Date(),
  };
}

// ─── Fetch one index ──────────────────────────────────────────────────────────

async function fetchOne(meta: typeof INDICES[number]): Promise<IndexQuote> {
  const url = `${YAHOO_BASE}/${encodeURIComponent(meta.symbol)}?interval=1d&range=8d`;
  const raw = await fetchWithProxy(url);
  return parseYahooChart(raw, meta);
}

// ─── Mock data (fallback) ─────────────────────────────────────────────────────

function makeMockChart(base: number, isUp: boolean): ChartPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Mon', 'Tue'];
  return days.map((day, i) => ({
    day,
    price: base + (isUp ? 1 : -1) * i * base * 0.003 + (Math.sin(i) * base * 0.002),
  }));
}

const MOCK: IndexQuote[] = [
  {
    symbol: '^GSPC', name: 'S&P 500', ticker: 'SPX',
    price: 5308.13, previousClose: 5278.41,
    change: 29.72, changePercent: 0.56, isUp: true,
    chartData: makeMockChart(5278, true),
    lastUpdated: new Date(),
  },
  {
    symbol: '^IXIC', name: 'NASDAQ', ticker: 'COMP',
    price: 16742.39, previousClose: 16542.21,
    change: 200.18, changePercent: 1.21, isUp: true,
    chartData: makeMockChart(16542, true),
    lastUpdated: new Date(),
  },
  {
    symbol: '^DJI', name: 'Dow Jones', ticker: 'DJIA',
    price: 39069.11, previousClose: 39127.80,
    change: -58.69, changePercent: -0.15, isUp: false,
    chartData: makeMockChart(39127, false),
    lastUpdated: new Date(),
  },
];

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchMarketData(): Promise<MarketResult> {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return { data: cache.data, isMock: false };
  }

  // Fetch each index independently so one failure doesn't kill the rest
  const settled = await Promise.allSettled(INDICES.map(fetchOne));

  const data: IndexQuote[] = settled.map((result, i) => {
    if (result.status === 'fulfilled') return result.value;
    console.warn(`[marketData] Failed to fetch ${INDICES[i].symbol}:`, result.reason);
    return MOCK[i]; // per-symbol fallback
  });

  const allFailed = settled.every(r => r.status === 'rejected');

  if (!allFailed) {
    cache = { data, ts: Date.now() };
  }

  return {
    data,
    isMock: allFailed,
    error: allFailed ? 'Could not reach market data — showing estimates.' : undefined,
  };
}

export function clearMarketCache() {
  cache = null;
}
