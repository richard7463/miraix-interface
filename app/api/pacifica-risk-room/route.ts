import { NextRequest, NextResponse } from "next/server";
import {
  buildAccountSummary,
  buildFundingCurve,
  buildLiquidationRadar,
  buildMarketSnapshot,
  buildRiskSummary,
  buildSampleAccountSummary,
  buildSampleFundingCurves,
  buildSampleLiquidationRadar,
  buildSampleMarketSnapshot,
  DEFAULT_PACIFICA_SYMBOLS,
  PACIFICA_API_BASE,
  PacificaDataMode,
  PacificaRiskRoomResponse,
  parseSymbolList,
} from "@/lib/pacificaRiskRoom";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PacificaEnvelope<T> {
  success: boolean;
  data: T;
  error: string | null;
  code: number | null;
  has_more?: boolean;
  last_order_id?: number;
}

const REQUEST_TIMEOUT_MS = 10_000;

const asRecordArray = (value: unknown) =>
  Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];

const trimAccountId = (value: string | null) => (value || "").trim();

async function fetchPacificaJson<T>(path: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${PACIFICA_API_BASE}${path}`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as PacificaEnvelope<T>;
    if (!payload.success) {
      throw new Error(payload.error || "Pacifica API error");
    }

    return payload.data;
  } finally {
    clearTimeout(timeout);
  }
}

async function safeFetch<T>(path: string) {
  try {
    const data = await fetchPacificaJson<T>(path);
    return { ok: true as const, data };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unknown Pacifica API error",
    };
  }
}

export async function GET(request: NextRequest) {
  const accountId = trimAccountId(request.nextUrl.searchParams.get("account"));
  const watchlistSymbols = parseSymbolList(request.nextUrl.searchParams.get("symbols"));
  const mergedWatchlist = [...new Set([...watchlistSymbols, ...DEFAULT_PACIFICA_SYMBOLS])].slice(
    0,
    8,
  );
  const notes: string[] = [];
  const dataSources = [
    "Pacifica REST /info",
    "Pacifica REST /info/prices",
    "Pacifica REST /trades",
    "Pacifica REST /funding_rate/history",
  ];

  let marketMode: PacificaDataMode = "live";
  let accountMode: PacificaDataMode = accountId ? "live" : "sample";

  const [infoResult, pricesResult] = await Promise.all([
    safeFetch<Array<Record<string, unknown>>>("/info"),
    safeFetch<Array<Record<string, unknown>>>("/info/prices"),
  ]);

  let marketSnapshot =
    infoResult.ok && pricesResult.ok
      ? buildMarketSnapshot(infoResult.data, pricesResult.data, mergedWatchlist)
      : [];

  if (!marketSnapshot.length) {
    marketMode = "sample";
    notes.push(
      "Public Pacifica market data was unavailable during this request. Falling back to seeded market mode so the demo stays usable.",
    );
    marketSnapshot = buildSampleMarketSnapshot();
  }

  const marketSymbols = marketSnapshot.map((item) => item.symbol);

  const symbolRequests = await Promise.all(
    marketSymbols.map(async (symbol) => {
      const [tradesResult, fundingResult] = await Promise.all([
        safeFetch<Array<Record<string, unknown>>>(`/trades?symbol=${encodeURIComponent(symbol)}`),
        safeFetch<Array<Record<string, unknown>>>(
          `/funding_rate/history?symbol=${encodeURIComponent(symbol)}`,
        ),
      ]);

      return {
        symbol,
        trades: tradesResult.ok ? asRecordArray(tradesResult.data) : [],
        funding: fundingResult.ok ? asRecordArray(fundingResult.data) : [],
        tradesError: tradesResult.ok ? null : tradesResult.error,
        fundingError: fundingResult.ok ? null : fundingResult.error,
      };
    }),
  );

  const tradeMap = Object.fromEntries(
    symbolRequests.map((item) => [item.symbol, item.trades]),
  );

  let liquidationRadar = buildLiquidationRadar(tradeMap);
  if (!liquidationRadar.length) {
    liquidationRadar = buildSampleLiquidationRadar(marketSnapshot);
    notes.push(
      "No elevated liquidation or outsized trade events were returned for the selected symbols, so the radar includes seeded sample stress events.",
    );
  }

  let fundingCurves = symbolRequests
    .map((item) => buildFundingCurve(item.symbol, item.funding))
    .filter((item) => item.points.length > 0)
    .sort((left, right) => Math.abs(right.nextFundingRate) - Math.abs(left.nextFundingRate))
    .slice(0, 6);

  if (!fundingCurves.length) {
    fundingCurves = buildSampleFundingCurves(marketSnapshot);
    notes.push(
      "Funding history was unavailable, so the carry board uses seeded sample curves.",
    );
  }

  if (accountId) {
    dataSources.push(
      "Pacifica REST /account",
      "Pacifica REST /positions",
      "Pacifica REST /orders",
      "Pacifica REST /trades/history",
      "Pacifica REST /positions/history",
      "Pacifica REST /portfolio",
    );
  }

  let account =
    accountId && accountMode === "live"
      ? null
      : buildSampleAccountSummary(marketSnapshot);

  if (accountId) {
    const [accountResult, positionsResult, ordersResult, tradesHistoryResult, positionsHistoryResult, portfolioResult] =
      await Promise.all([
        safeFetch<Record<string, unknown>>(`/account?account=${encodeURIComponent(accountId)}`),
        safeFetch<Array<Record<string, unknown>>>(`/positions?account=${encodeURIComponent(accountId)}`),
        safeFetch<Array<Record<string, unknown>>>(`/orders?account=${encodeURIComponent(accountId)}`),
        safeFetch<Array<Record<string, unknown>>>(
          `/trades/history?account=${encodeURIComponent(accountId)}`,
        ),
        safeFetch<Array<Record<string, unknown>>>(
          `/positions/history?account=${encodeURIComponent(accountId)}`,
        ),
        safeFetch<Array<Record<string, unknown>>>(
          `/portfolio?account=${encodeURIComponent(accountId)}&time_range=1d`,
        ),
      ]);

    if (accountResult.ok) {
      account = buildAccountSummary(
        accountId,
        marketSnapshot,
        accountResult.data,
        positionsResult.ok ? asRecordArray(positionsResult.data) : [],
        ordersResult.ok ? asRecordArray(ordersResult.data) : [],
        tradesHistoryResult.ok ? asRecordArray(tradesHistoryResult.data) : [],
        positionsHistoryResult.ok ? asRecordArray(positionsHistoryResult.data) : [],
        portfolioResult.ok ? asRecordArray(portfolioResult.data) : [],
      );
    } else {
      accountMode = "sample";
      account = buildSampleAccountSummary(marketSnapshot);
      notes.push(
        `Account ${accountId} was not available from Pacifica. Showing sample account mode instead.`,
      );
    }
  }

  const riskSummary = buildRiskSummary(
    marketSnapshot,
    fundingCurves,
    account || buildSampleAccountSummary(marketSnapshot),
    liquidationRadar,
  );

  const payload: PacificaRiskRoomResponse = {
    success: true,
    generatedAt: new Date().toISOString(),
    sourceStatus: {
      market: marketMode,
      account: account?.mode || accountMode,
    },
    watchlistSymbols: marketSnapshot.map((item) => item.symbol),
    marketSnapshot,
    liquidationRadar,
    fundingCurves,
    account: account || buildSampleAccountSummary(marketSnapshot),
    riskSummary,
    dataSources,
    notes,
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
