import { NextRequest, NextResponse } from "next/server";
import {
  analyzeFirewall,
  BinanceUniverseContext,
  createMarketSnapshot,
  parseStrategy,
} from "@/lib/binanceFirewall";

export const runtime = "nodejs";

interface SpotTickerResponse {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  bidPrice: string;
  askPrice: string;
}

interface DepthResponse {
  bids: [string, string][];
  asks: [string, string][];
}

type KlineResponse = Array<
  [
    number,
    string,
    string,
    string,
    string,
    string,
    number,
    string,
    number,
    string,
    string,
    string,
  ]
>;

interface FundingResponse {
  symbol: string;
  lastFundingRate: string;
}

const STABLE_BASES = new Set([
  "USDT",
  "USDC",
  "FDUSD",
  "TUSD",
  "BUSD",
  "USDP",
  "DAI",
]);

const DEFAULT_SPOT_BASES = [
  "https://data-api.binance.vision",
  "https://api.binance.com",
  "https://api-gcp.binance.com",
];

const DEFAULT_FUTURES_BASES = ["https://fapi.binance.com"];

const parseBaseList = (value: string | undefined, fallback: string[]) => {
  if (!value) {
    return fallback;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const SPOT_BASES = parseBaseList(
  process.env.BINANCE_SPOT_BASES,
  DEFAULT_SPOT_BASES,
);
const FUTURES_BASES = parseBaseList(
  process.env.BINANCE_FUTURES_BASES,
  DEFAULT_FUTURES_BASES,
);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJsonWithFallback<T>(
  bases: string[],
  path: string,
  timeoutMs: number,
): Promise<{ data: T; baseUrl: string }> {
  let lastError: Error | null = null;

  for (const baseUrl of bases) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        signal: controller.signal,
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const payload = await response.json();
      if (
        !response.ok ||
        (payload &&
          typeof payload === "object" &&
          "code" in payload &&
          payload.code < 0)
      ) {
        const message =
          payload && typeof payload === "object" && "msg" in payload
            ? String(payload.msg)
            : `${response.status} ${response.statusText}`;
        throw new Error(message);
      }

      return {
        data: payload as T,
        baseUrl,
      };
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Unknown Binance API error");
      await delay(80);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("All Binance endpoints failed");
}

const parseSymbols = (input: unknown) => {
  if (Array.isArray(input)) {
    return input.map((item) => String(item));
  }

  if (typeof input === "string") {
    return input
      .split(/[,\s/]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toNumber = (value: string) => Number.parseFloat(value || "0");

function isUniverseEligibleSymbol(symbol: string) {
  if (!symbol.endsWith("USDT")) {
    return false;
  }

  if (/(UP|DOWN|BULL|BEAR)USDT$/.test(symbol)) {
    return false;
  }

  const baseAsset = symbol.slice(0, -4);
  return !STABLE_BASES.has(baseAsset);
}

function buildRankMap(entries: Array<{ symbol: string; metric: number }>) {
  const sorted = [...entries].sort((left, right) => right.metric - left.metric);
  const lastIndex = Math.max(sorted.length - 1, 1);
  const map = new Map<string, number>();

  sorted.forEach((entry, index) => {
    map.set(entry.symbol, ((lastIndex - index) / lastIndex) * 100);
  });

  return map;
}

function buildUniverseContext(
  tickers: SpotTickerResponse[],
): BinanceUniverseContext {
  const filtered = tickers
    .filter((item) => isUniverseEligibleSymbol(item.symbol))
    .map((item) => ({
      symbol: item.symbol,
      quoteVolumeUsd: toNumber(item.quoteVolume),
      change24hPct: toNumber(item.priceChangePercent),
    }))
    .filter(
      (item) => Number.isFinite(item.quoteVolumeUsd) && item.quoteVolumeUsd > 0,
    );

  const volumeRankMap = buildRankMap(
    filtered.map((item) => ({
      symbol: item.symbol,
      metric: item.quoteVolumeUsd,
    })),
  );
  const momentumRankMap = buildRankMap(
    filtered.map((item) => ({
      symbol: item.symbol,
      metric: Math.max(item.change24hPct, 0),
    })),
  );
  const hypeRankMap = buildRankMap(
    filtered.map((item) => ({
      symbol: item.symbol,
      metric:
        Math.max(Math.abs(item.change24hPct), 0.01) *
        Math.log10(Math.max(item.quoteVolumeUsd, 10)),
    })),
  );

  const entries = filtered.map((item) => ({
    symbol: item.symbol,
    quoteVolumeUsd: item.quoteVolumeUsd,
    change24hPct: item.change24hPct,
    volumeRankPct: volumeRankMap.get(item.symbol) || 0,
    momentumRankPct: momentumRankMap.get(item.symbol) || 0,
    hypeRankPct: hypeRankMap.get(item.symbol) || 0,
  }));

  const topByMetric = (getter: (entry: (typeof entries)[number]) => number) =>
    [...entries]
      .sort((left, right) => getter(right) - getter(left))
      .slice(0, 6)
      .map((entry) => entry.symbol);

  return {
    universeSize: entries.length,
    entries,
    topLiquiditySymbols: topByMetric((entry) => entry.quoteVolumeUsd),
    topMomentumSymbols: topByMetric((entry) => entry.momentumRankPct),
    topHypeSymbols: topByMetric((entry) => entry.hypeRankPct),
  };
}

function buildFallbackUniverseContext(
  signals: Array<{
    symbol: string;
    quoteVolumeUsd: number;
    change24hPct: number;
  }>,
): BinanceUniverseContext {
  const entries = signals.map((signal, index, list) => ({
    symbol: signal.symbol,
    quoteVolumeUsd: signal.quoteVolumeUsd,
    change24hPct: signal.change24hPct,
    volumeRankPct: ((list.length - index) / Math.max(list.length, 1)) * 100,
    momentumRankPct: ((list.length - index) / Math.max(list.length, 1)) * 100,
    hypeRankPct: ((list.length - index) / Math.max(list.length, 1)) * 100,
  }));

  return {
    universeSize: entries.length,
    entries,
    topLiquiditySymbols: entries.map((entry) => entry.symbol),
    topMomentumSymbols: entries.map((entry) => entry.symbol),
    topHypeSymbols: entries.map((entry) => entry.symbol),
  };
}

function computeDepthLiquidityUsd(book: [string, string][]) {
  return book
    .slice(0, 5)
    .reduce(
      (sum, [price, quantity]) => sum + toNumber(price) * toNumber(quantity),
      0,
    );
}

function computeKlineMetrics(klines: KlineResponse) {
  if (!klines.length) {
    return {
      intradayRangePct: 0,
      avgAbsHourlyMovePct: 0,
      oneHourMovePct: 0,
    };
  }

  const highs = klines.map((item) => toNumber(item[2]));
  const lows = klines.map((item) => toNumber(item[3]));
  const closes = klines.map((item) => toNumber(item[4]));
  const baseOpen = toNumber(klines[0][1]) || 1;
  const intradayRangePct =
    ((Math.max(...highs) - Math.min(...lows)) / baseOpen) * 100;

  const hourlyMoves: number[] = [];
  for (let index = 1; index < closes.length; index += 1) {
    const previous = closes[index - 1] || 1;
    hourlyMoves.push(Math.abs(((closes[index] - previous) / previous) * 100));
  }

  const oneHourMovePct =
    closes.length >= 2
      ? ((closes[closes.length - 1] - closes[closes.length - 2]) /
          closes[closes.length - 2]) *
        100
      : 0;

  return {
    intradayRangePct,
    avgAbsHourlyMovePct:
      hourlyMoves.length > 0
        ? hourlyMoves.reduce((sum, value) => sum + value, 0) /
          hourlyMoves.length
        : 0,
    oneHourMovePct,
  };
}

async function fetchFundingRate(symbol: string) {
  try {
    const { data } = await fetchJsonWithFallback<FundingResponse>(
      FUTURES_BASES,
      `/fapi/v1/premiumIndex?symbol=${symbol}`,
      3200,
    );

    return {
      fundingRatePct: toNumber(data.lastFundingRate) * 100,
      available: true,
    };
  } catch {
    return {
      fundingRatePct: null,
      available: false,
    };
  }
}

async function buildMarketSnapshot(symbol: string) {
  const [tickerResult, depthResult, klineResult, fundingResult] =
    await Promise.all([
      fetchJsonWithFallback<SpotTickerResponse>(
        SPOT_BASES,
        `/api/v3/ticker/24hr?symbol=${symbol}`,
        5000,
      ),
      fetchJsonWithFallback<DepthResponse>(
        SPOT_BASES,
        `/api/v3/depth?symbol=${symbol}&limit=20`,
        5000,
      ),
      fetchJsonWithFallback<KlineResponse>(
        SPOT_BASES,
        `/api/v3/uiKlines?symbol=${symbol}&interval=1h&limit=24`,
        5000,
      ),
      fetchFundingRate(symbol),
    ]);

  const bestBid = toNumber(
    depthResult.data.bids[0]?.[0] || tickerResult.data.bidPrice,
  );
  const bestAsk = toNumber(
    depthResult.data.asks[0]?.[0] || tickerResult.data.askPrice,
  );
  const mid = (bestBid + bestAsk) / 2 || toNumber(tickerResult.data.lastPrice);
  const spreadBps = mid > 0 ? ((bestAsk - bestBid) / mid) * 10000 : 0;
  const klineMetrics = computeKlineMetrics(klineResult.data);

  return {
    snapshot: createMarketSnapshot({
      symbol,
      lastPrice: toNumber(tickerResult.data.lastPrice),
      change24hPct: toNumber(tickerResult.data.priceChangePercent),
      quoteVolumeUsd: toNumber(tickerResult.data.quoteVolume),
      spreadBps,
      bookLiquidityUsd:
        computeDepthLiquidityUsd(depthResult.data.bids) +
        computeDepthLiquidityUsd(depthResult.data.asks),
      intradayRangePct: klineMetrics.intradayRangePct,
      avgAbsHourlyMovePct: klineMetrics.avgAbsHourlyMovePct,
      oneHourMovePct: klineMetrics.oneHourMovePct,
      fundingRatePct: fundingResult.fundingRatePct,
    }),
    spotBaseUrl: tickerResult.baseUrl,
    futuresAvailable: fundingResult.available,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      symbols?: string[] | string;
    };

    const prompt = String(body.prompt || "").trim();
    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "prompt is required",
        },
        { status: 400 },
      );
    }

    const parsed = parseStrategy(prompt, parseSymbols(body.symbols));
    if (parsed.symbols.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "请在 prompt 里写出 Binance 标的，或单独填写 watchlist。",
        },
        { status: 400 },
      );
    }

    let universeContext: BinanceUniverseContext | null = null;
    let universeBaseUrl: string | null = null;
    try {
      const universeResult = await fetchJsonWithFallback<SpotTickerResponse[]>(
        SPOT_BASES,
        "/api/v3/ticker/24hr",
        9000,
      );
      universeContext = buildUniverseContext(universeResult.data);
      universeBaseUrl = universeResult.baseUrl;
    } catch {
      universeContext = null;
      universeBaseUrl = null;
    }

    const settled = await Promise.allSettled(
      parsed.symbols.map((symbol) => buildMarketSnapshot(symbol)),
    );

    const marketSignals = settled
      .filter(
        (
          item,
        ): item is PromiseFulfilledResult<
          Awaited<ReturnType<typeof buildMarketSnapshot>>
        > => item.status === "fulfilled",
      )
      .map((item) => item.value.snapshot);

    const usedSpotBases = settled
      .filter(
        (
          item,
        ): item is PromiseFulfilledResult<
          Awaited<ReturnType<typeof buildMarketSnapshot>>
        > => item.status === "fulfilled",
      )
      .map((item) => item.value.spotBaseUrl);

    const futuresDataAvailable = settled.some(
      (item) => item.status === "fulfilled" && item.value.futuresAvailable,
    );

    const invalidSymbols = parsed.symbols.filter(
      (symbol, index) => settled[index]?.status === "rejected",
    );

    if (marketSignals.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "未能从 Binance 公共数据接口拉取任何有效标的，请检查 symbol 是否真实可交易。",
        },
        { status: 502 },
      );
    }

    if (!universeContext) {
      universeContext = buildFallbackUniverseContext(
        marketSignals.map((signal) => ({
          symbol: signal.symbol,
          quoteVolumeUsd: signal.quoteVolumeUsd,
          change24hPct: signal.change24hPct,
        })),
      );
    }

    const analysis = analyzeFirewall(
      prompt,
      {
        ...parsed,
        symbols: marketSignals.map((signal) => signal.symbol),
      },
      marketSignals,
      universeContext,
      [
        `Binance Spot REST: ${[...new Set(usedSpotBases)].join(", ")}`,
        universeBaseUrl
          ? `Binance market universe scan: ${universeBaseUrl}`
          : "Binance market universe scan: degraded to watchlist-only context",
        futuresDataAvailable
          ? `Binance Futures funding: ${FUTURES_BASES.join(", ")}`
          : "Binance Futures funding: unavailable",
      ],
      futuresDataAvailable,
      invalidSymbols,
    );

    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Binance firewall analysis failed",
      },
      { status: 500 },
    );
  }
}
