export const PACIFICA_API_BASE = "https://api.pacifica.fi/api/v1";

export const DEFAULT_PACIFICA_SYMBOLS = [
  "BTC",
  "ETH",
  "SOL",
  "XRP",
  "HYPE",
  "PUMP",
] as const;

export type PacificaDataMode = "live" | "sample" | "none";
export type PacificaRiskStatus = "stable" | "watch" | "critical";
export type PacificaPlanAction = "wait" | "probe" | "reduce" | "hedge";

export interface PacificaMarketSnapshot {
  symbol: string;
  mark: number;
  oracle: number;
  mid: number;
  yesterdayPrice: number | null;
  change24hPct: number;
  fundingRate: number;
  nextFundingRate: number;
  openInterest: number;
  volume24h: number;
  maxLeverage: number;
  isolatedOnly: boolean;
  minOrderSizeUsd: number;
  lotSize: number;
  tickSize: number;
  crowdedScore: number;
  timestamp: number;
}

export interface PacificaLiquidationEvent {
  symbol: string;
  eventType: string;
  cause: string;
  side: string;
  price: number;
  amount: number;
  notionalUsd: number;
  createdAt: number;
  severity: PacificaRiskStatus;
}

export interface PacificaFundingPoint {
  createdAt: number;
  oraclePrice: number;
  bidImpactPrice: number;
  askImpactPrice: number;
  fundingRate: number;
  nextFundingRate: number;
}

export interface PacificaFundingCurve {
  symbol: string;
  latestFundingRate: number;
  nextFundingRate: number;
  hourlyCarryFor1kUsd: number;
  impactSpreadPct: number;
  regime: "longs-pay" | "shorts-pay" | "neutral";
  points: PacificaFundingPoint[];
}

export interface PacificaPosition {
  symbol: string;
  side: string;
  amount: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number | null;
  leverage: number | null;
  marginUsedUsd: number;
  unrealizedPnlUsd: number;
  realizedPnlUsd: number;
  fundingPaidUsd: number;
  createdAt: number | null;
  updatedAt: number | null;
  notionalUsd: number;
  liquidationDistancePct: number | null;
}

export interface PacificaOrder {
  symbol: string;
  side: string;
  orderType: string;
  price: number | null;
  triggerPrice: number | null;
  amount: number;
  reduceOnly: boolean;
  status: string;
  createdAt: number | null;
}

export interface PacificaTradeHistoryItem {
  symbol: string;
  side: string;
  eventType: string;
  cause: string;
  price: number;
  amount: number;
  notionalUsd: number;
  realizedPnlUsd: number;
  feeUsd: number;
  createdAt: number;
}

export interface PacificaPositionHistoryItem {
  symbol: string;
  side: string;
  entryPrice: number;
  exitPrice: number;
  amount: number;
  realizedPnlUsd: number;
  openedAt: number | null;
  closedAt: number | null;
}

export interface PacificaPortfolioPoint {
  createdAt: number;
  equityUsd: number;
}

export interface PacificaAccountSummary {
  accountId: string;
  mode: PacificaDataMode;
  equityUsd: number;
  availableToSpendUsd: number;
  marginUsedUsd: number;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  volume30dUsd: number;
  tradeCount30d: number;
  positions: PacificaPosition[];
  openOrders: PacificaOrder[];
  tradeHistory: PacificaTradeHistoryItem[];
  positionHistory: PacificaPositionHistoryItem[];
  portfolioHistory: PacificaPortfolioPoint[];
}

export interface PacificaRiskSignal {
  title: string;
  value: string;
  tone: PacificaRiskStatus;
  detail: string;
}

export interface PacificaSafeOrderPlan {
  symbol: string;
  action: PacificaPlanAction;
  leverageCap: number;
  sizeCapUsd: number;
  orderType: string;
  invalidation: string;
  rationale: string;
}

export interface PacificaRiskSummary {
  score: number;
  status: PacificaRiskStatus;
  verdict: string;
  summary: string;
  signals: PacificaRiskSignal[];
  operatorPlaybook: string[];
  safeOrderPlan: PacificaSafeOrderPlan[];
}

export interface PacificaRiskRoomResponse {
  success: true;
  generatedAt: string;
  sourceStatus: {
    market: PacificaDataMode;
    account: PacificaDataMode;
  };
  watchlistSymbols: string[];
  marketSnapshot: PacificaMarketSnapshot[];
  liquidationRadar: PacificaLiquidationEvent[];
  fundingCurves: PacificaFundingCurve[];
  account: PacificaAccountSummary;
  riskSummary: PacificaRiskSummary;
  dataSources: string[];
  notes: string[];
}

export function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function parseNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function parseTimestamp(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function pickString(
  record: Record<string, unknown>,
  candidates: string[],
  fallback = "",
) {
  for (const key of candidates) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
}

export function pickNumber(
  record: Record<string, unknown>,
  candidates: string[],
  fallback = 0,
) {
  for (const key of candidates) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      const parsed = parseNumber(value, Number.NaN);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

export function pickTimestamp(
  record: Record<string, unknown>,
  candidates: string[],
) {
  for (const key of candidates) {
    const value = record[key];
    const parsed = parseTimestamp(value);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

export function parseSymbolList(input: string | null) {
  const parsed = (input || "")
    .split(/[,\s/]+/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  const unique = [...new Set(parsed)];
  return unique.length ? unique.slice(0, 8) : [...DEFAULT_PACIFICA_SYMBOLS];
}

export function computeChangePct(mark: number, yesterdayPrice: number | null) {
  if (!yesterdayPrice || !Number.isFinite(yesterdayPrice) || yesterdayPrice === 0) {
    return 0;
  }

  return ((mark - yesterdayPrice) / yesterdayPrice) * 100;
}

export function computeCrowdedScore(
  openInterest: number,
  volume24h: number,
  nextFundingRate: number,
) {
  const liquidityComponent = clamp(Math.log10(Math.max(volume24h, 1)) * 10, 0, 45);
  const oiComponent = clamp(Math.log10(Math.max(openInterest, 1)) * 8, 0, 35);
  const fundingComponent = clamp(Math.abs(nextFundingRate) * 300000, 0, 20);
  return round(liquidityComponent + oiComponent + fundingComponent, 1);
}

function guessRegime(nextFundingRate: number): PacificaFundingCurve["regime"] {
  if (nextFundingRate > 0.000002) {
    return "longs-pay";
  }

  if (nextFundingRate < -0.000002) {
    return "shorts-pay";
  }

  return "neutral";
}

export function buildMarketSnapshot(
  infoRecords: Array<Record<string, unknown>>,
  priceRecords: Array<Record<string, unknown>>,
  watchlistSymbols: string[],
) {
  const infoMap = new Map(
    infoRecords.map((item) => [pickString(item, ["symbol"]).toUpperCase(), item]),
  );
  const priceMap = new Map(
    priceRecords.map((item) => [pickString(item, ["symbol"]).toUpperCase(), item]),
  );

  return watchlistSymbols
    .map((symbol) => {
      const info = infoMap.get(symbol);
      const price = priceMap.get(symbol);
      if (!info || !price) {
        return null;
      }

      const mark = pickNumber(price, ["mark"]);
      const oracle = pickNumber(price, ["oracle"], mark);
      const mid = pickNumber(price, ["mid"], mark);
      const yesterdayPrice = pickNumber(price, ["yesterday_price"], 0) || null;
      const nextFundingRate = pickNumber(price, ["next_funding"], pickNumber(info, ["next_funding_rate"]));
      const fundingRate = pickNumber(price, ["funding"], pickNumber(info, ["funding_rate"]));
      const openInterest = pickNumber(price, ["open_interest"]);
      const volume24h = pickNumber(price, ["volume_24h"]);
      const tickSize = pickNumber(info, ["tick_size"]);
      const lotSize = pickNumber(info, ["lot_size"]);
      const minOrderSizeUsd = pickNumber(info, ["min_order_size", "min_order_size_usd"]);

      return {
        symbol,
        mark,
        oracle,
        mid,
        yesterdayPrice,
        change24hPct: round(computeChangePct(mark, yesterdayPrice)),
        fundingRate,
        nextFundingRate,
        openInterest,
        volume24h,
        maxLeverage: pickNumber(info, ["max_leverage"]),
        isolatedOnly: Boolean(info.isolated_only),
        minOrderSizeUsd,
        lotSize,
        tickSize,
        crowdedScore: computeCrowdedScore(openInterest, volume24h, nextFundingRate),
        timestamp: pickNumber(price, ["timestamp", "created_at"], Date.now()),
      } satisfies PacificaMarketSnapshot;
    })
    .filter((item): item is PacificaMarketSnapshot => Boolean(item))
    .sort((left, right) => right.volume24h - left.volume24h);
}

export function buildFundingCurve(
  symbol: string,
  records: Array<Record<string, unknown>>,
): PacificaFundingCurve {
  const points = records
    .map((item) => ({
      createdAt: pickNumber(item, ["created_at", "timestamp"]),
      oraclePrice: pickNumber(item, ["oracle_price", "oracle"]),
      bidImpactPrice: pickNumber(item, ["bid_impact_price"]),
      askImpactPrice: pickNumber(item, ["ask_impact_price"]),
      fundingRate: pickNumber(item, ["funding_rate", "funding"]),
      nextFundingRate: pickNumber(item, ["next_funding_rate", "next_funding"]),
    }))
    .filter((item) => item.createdAt > 0)
    .slice(0, 24);

  const latest = points[0] || {
    createdAt: Date.now(),
    oraclePrice: 0,
    bidImpactPrice: 0,
    askImpactPrice: 0,
    fundingRate: 0,
    nextFundingRate: 0,
  };
  const impactSpreadBase = latest.oraclePrice || latest.askImpactPrice || latest.bidImpactPrice || 1;
  const impactSpreadPct =
    impactSpreadBase > 0
      ? ((latest.askImpactPrice - latest.bidImpactPrice) / impactSpreadBase) * 100
      : 0;

  return {
    symbol,
    latestFundingRate: latest.fundingRate,
    nextFundingRate: latest.nextFundingRate,
    hourlyCarryFor1kUsd: round(Math.abs(latest.nextFundingRate) * 1000, 4),
    impactSpreadPct: round(Math.abs(impactSpreadPct), 3),
    regime: guessRegime(latest.nextFundingRate),
    points,
  };
}

export function buildLiquidationRadar(
  tradeMap: Record<string, Array<Record<string, unknown>>>,
) {
  const events = Object.entries(tradeMap).flatMap(([symbol, records]) =>
    records
      .map((item) => {
        const price = pickNumber(item, ["price"]);
        const amount = pickNumber(item, ["amount"]);
        const cause = pickString(item, ["cause"], "normal");
        const eventType = pickString(item, ["event_type"], "fill");
        const notionalUsd = price * amount;
        const severity: PacificaRiskStatus =
          cause === "backstop_liquidation" || notionalUsd > 500000
            ? "critical"
            : cause === "market_liquidation" || cause === "settlement" || notionalUsd > 100000
              ? "watch"
              : "stable";

        return {
          symbol,
          eventType,
          cause,
          side: pickString(item, ["side"]),
          price,
          amount,
          notionalUsd,
          createdAt: pickNumber(item, ["created_at"]),
          severity,
        } satisfies PacificaLiquidationEvent;
      })
      .filter((item) => item.cause !== "normal" || item.notionalUsd > 75000),
  );

  if (events.length) {
    return events.sort((left, right) => right.createdAt - left.createdAt).slice(0, 12);
  }

  return [];
}

function parseAccountSummaryRecord(
  record: Record<string, unknown>,
  accountId: string,
  mode: PacificaDataMode,
) {
  return {
    accountId,
    mode,
    equityUsd: pickNumber(record, ["account_equity", "equity", "portfolio_value"]),
    availableToSpendUsd: pickNumber(record, ["available_to_spend", "available_balance"]),
    marginUsedUsd: pickNumber(record, [
      "total_margin_used",
      "margin_used",
      "margin_used_usd",
    ]),
    realizedPnlUsd: pickNumber(record, ["realized_pnl", "realized_pnl_usd"]),
    unrealizedPnlUsd: pickNumber(record, ["unrealized_pnl", "unrealized_pnl_usd"]),
    volume30dUsd: pickNumber(record, ["volume_30d", "volume_30d_usd"]),
    tradeCount30d: pickNumber(record, ["trade_count_30d", "trades_30d"]),
  };
}

export function buildAccountSummary(
  accountId: string,
  marketSnapshot: PacificaMarketSnapshot[],
  accountRecord: Record<string, unknown> | null,
  positionsRecords: Array<Record<string, unknown>>,
  ordersRecords: Array<Record<string, unknown>>,
  tradeHistoryRecords: Array<Record<string, unknown>>,
  positionHistoryRecords: Array<Record<string, unknown>>,
  portfolioHistoryRecords: Array<Record<string, unknown>>,
): PacificaAccountSummary {
  const marketMap = new Map(marketSnapshot.map((item) => [item.symbol, item]));
  const header = parseAccountSummaryRecord(accountRecord || {}, accountId, "live");

  const positions = positionsRecords
    .map((item) => {
      const symbol = pickString(item, ["symbol"]).toUpperCase();
      const market = marketMap.get(symbol);
      const amount = Math.abs(pickNumber(item, ["amount", "size", "quantity"]));
      const entryPrice = pickNumber(item, ["entry_price", "avg_entry_price"]);
      const markPrice = market?.mark || pickNumber(item, ["mark_price", "mark"], entryPrice);
      const notionalUsd =
        pickNumber(item, ["notional_usd", "position_value"]) ||
        markPrice * amount;
      const liquidationPriceRaw = pickNumber(item, ["liquidation_price", "liq_price"]);
      const liquidationPrice =
        liquidationPriceRaw > 0 ? liquidationPriceRaw : null;

      return {
        symbol,
        side: pickString(item, ["side", "position_side"], "flat"),
        amount,
        entryPrice,
        markPrice,
        liquidationPrice,
        leverage: pickNumber(item, ["leverage"], 0) || null,
        marginUsedUsd: pickNumber(item, [
          "margin",
          "margin_used",
          "margin_used_usd",
        ]),
        unrealizedPnlUsd: pickNumber(item, ["unrealized_pnl", "unrealized_pnl_usd"]),
        realizedPnlUsd: pickNumber(item, ["realized_pnl", "realized_pnl_usd"]),
        fundingPaidUsd: pickNumber(item, [
          "funding",
          "funding_paid",
          "funding_paid_usd",
        ]),
        createdAt: pickTimestamp(item, ["created_at", "opened_at"]),
        updatedAt: pickTimestamp(item, ["updated_at"]),
        notionalUsd,
        liquidationDistancePct:
          liquidationPrice && markPrice > 0
            ? round((Math.abs(markPrice - liquidationPrice) / markPrice) * 100, 2)
            : null,
      } satisfies PacificaPosition;
    })
    .sort((left, right) => right.notionalUsd - left.notionalUsd);

  const openOrders = ordersRecords
    .map((item) => ({
      symbol: pickString(item, ["symbol"]).toUpperCase(),
      side: pickString(item, ["side"], "unknown"),
      orderType: pickString(item, ["order_type", "type"], "limit"),
      price: (() => {
        const value = pickNumber(item, ["price"], Number.NaN);
        return Number.isFinite(value) && value > 0 ? value : null;
      })(),
      triggerPrice: (() => {
        const value = pickNumber(item, ["trigger_price"], Number.NaN);
        return Number.isFinite(value) && value > 0 ? value : null;
      })(),
      amount: pickNumber(item, ["amount", "size", "quantity"]),
      reduceOnly: Boolean(item.reduce_only),
      status: pickString(item, ["status"], "open"),
      createdAt: pickTimestamp(item, ["created_at"]),
    }))
    .slice(0, 12);

  const tradeHistory = tradeHistoryRecords
    .map((item) => {
      const price = pickNumber(item, ["price"]);
      const amount = Math.abs(pickNumber(item, ["amount", "size", "quantity"]));

      return {
        symbol: pickString(item, ["symbol"]).toUpperCase(),
        side: pickString(item, ["side"], "unknown"),
        eventType: pickString(item, ["event_type"], "fill"),
        cause: pickString(item, ["cause"], "normal"),
        price,
        amount,
        notionalUsd:
          pickNumber(item, ["notional_usd"]) || round(price * amount, 2),
        realizedPnlUsd: pickNumber(item, ["realized_pnl", "realized_pnl_usd"]),
        feeUsd: pickNumber(item, ["fee_paid", "fee_usd"]),
        createdAt: pickNumber(item, ["created_at"]),
      } satisfies PacificaTradeHistoryItem;
    })
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, 16);

  const positionHistory = positionHistoryRecords
    .map((item) => ({
      symbol: pickString(item, ["symbol"]).toUpperCase(),
      side: pickString(item, ["side"], "unknown"),
      entryPrice: pickNumber(item, ["entry_price"]),
      exitPrice: pickNumber(item, ["exit_price"]),
      amount: Math.abs(pickNumber(item, ["amount", "size", "quantity"])),
      realizedPnlUsd: pickNumber(item, ["realized_pnl", "realized_pnl_usd"]),
      openedAt: pickTimestamp(item, ["opened_at", "created_at"]),
      closedAt: pickTimestamp(item, ["closed_at", "updated_at"]),
    }))
    .sort(
      (left, right) => (right.closedAt || 0) - (left.closedAt || 0),
    )
    .slice(0, 10);

  const portfolioHistory = portfolioHistoryRecords
    .map((item) => ({
      createdAt: pickNumber(item, ["created_at", "timestamp"]),
      equityUsd: pickNumber(item, ["account_equity", "equity", "portfolio_value"]),
    }))
    .filter((item) => item.createdAt > 0)
    .sort((left, right) => left.createdAt - right.createdAt)
    .slice(-18);

  return {
    ...header,
    positions,
    openOrders,
    tradeHistory,
    positionHistory,
    portfolioHistory,
  };
}

function buildSamplePortfolioHistory(baseEquity: number) {
  return Array.from({ length: 12 }, (_, index) => {
    const createdAt = Date.now() - (11 - index) * 60 * 60 * 1000;
    const drift = Math.sin(index / 2.2) * 220 + index * 18;

    return {
      createdAt,
      equityUsd: round(baseEquity + drift, 2),
    } satisfies PacificaPortfolioPoint;
  });
}

export function buildSampleAccountSummary(
  marketSnapshot: PacificaMarketSnapshot[],
): PacificaAccountSummary {
  const marketMap = new Map(marketSnapshot.map((item) => [item.symbol, item]));
  const btc = marketMap.get("BTC");
  const eth = marketMap.get("ETH");
  const hype = marketMap.get("HYPE") || marketMap.get("SOL");
  const createdAt = Date.now();

  const positions: PacificaPosition[] = [
    {
      symbol: btc?.symbol || "BTC",
      side: "long",
      amount: 0.18,
      entryPrice: round((btc?.mark || 70000) * 0.987, 2),
      markPrice: btc?.mark || 70000,
      liquidationPrice: round((btc?.mark || 70000) * 0.872, 2),
      leverage: 5,
      marginUsedUsd: 2550,
      unrealizedPnlUsd: 164.4,
      realizedPnlUsd: 92.1,
      fundingPaidUsd: -12.6,
      createdAt: createdAt - 7 * 60 * 60 * 1000,
      updatedAt: createdAt - 2 * 60 * 1000,
      notionalUsd: round((btc?.mark || 70000) * 0.18, 2),
      liquidationDistancePct: 12.8,
    },
    {
      symbol: eth?.symbol || "ETH",
      side: "short",
      amount: 1.7,
      entryPrice: round((eth?.mark || 3600) * 1.011, 2),
      markPrice: eth?.mark || 3600,
      liquidationPrice: round((eth?.mark || 3600) * 1.139, 2),
      leverage: 4,
      marginUsedUsd: 1450,
      unrealizedPnlUsd: 76.9,
      realizedPnlUsd: -38.2,
      fundingPaidUsd: -8.1,
      createdAt: createdAt - 5 * 60 * 60 * 1000,
      updatedAt: createdAt - 2 * 60 * 1000,
      notionalUsd: round((eth?.mark || 3600) * 1.7, 2),
      liquidationDistancePct: 13.9,
    },
    {
      symbol: hype?.symbol || "HYPE",
      side: "long",
      amount: 46,
      entryPrice: round((hype?.mark || 19.6) * 0.956, 4),
      markPrice: hype?.mark || 19.6,
      liquidationPrice: round((hype?.mark || 19.6) * 0.812, 4),
      leverage: 3,
      marginUsedUsd: 520,
      unrealizedPnlUsd: 89.5,
      realizedPnlUsd: 41.7,
      fundingPaidUsd: -3.5,
      createdAt: createdAt - 3 * 60 * 60 * 1000,
      updatedAt: createdAt - 2 * 60 * 1000,
      notionalUsd: round((hype?.mark || 19.6) * 46, 2),
      liquidationDistancePct: 18.8,
    },
  ];

  const openOrders: PacificaOrder[] = [
    {
      symbol: "BTC",
      side: "buy",
      orderType: "limit",
      price: round((btc?.mark || 70000) * 0.994, 2),
      triggerPrice: null,
      amount: 0.04,
      reduceOnly: false,
      status: "open",
      createdAt: createdAt - 16 * 60 * 1000,
    },
    {
      symbol: "ETH",
      side: "buy",
      orderType: "stop",
      price: null,
      triggerPrice: round((eth?.mark || 3600) * 1.025, 2),
      amount: 0.9,
      reduceOnly: true,
      status: "open",
      createdAt: createdAt - 9 * 60 * 1000,
    },
  ];

  const tradeHistory: PacificaTradeHistoryItem[] = [
    {
      symbol: "HYPE",
      side: "open_long",
      eventType: "fulfill_taker",
      cause: "normal",
      price: round((hype?.mark || 19.6) * 0.956, 4),
      amount: 46,
      notionalUsd: round((hype?.mark || 19.6) * 46, 2),
      realizedPnlUsd: 0,
      feeUsd: 1.72,
      createdAt: createdAt - 3 * 60 * 60 * 1000,
    },
    {
      symbol: "ETH",
      side: "close_short",
      eventType: "fulfill_taker",
      cause: "normal",
      price: round((eth?.mark || 3600) * 0.991, 2),
      amount: 0.4,
      notionalUsd: round((eth?.mark || 3600) * 0.4, 2),
      realizedPnlUsd: 26.8,
      feeUsd: 0.94,
      createdAt: createdAt - 2 * 60 * 60 * 1000,
    },
    {
      symbol: "BTC",
      side: "open_long",
      eventType: "fulfill_maker",
      cause: "normal",
      price: round((btc?.mark || 70000) * 0.987, 2),
      amount: 0.18,
      notionalUsd: round((btc?.mark || 70000) * 0.18, 2),
      realizedPnlUsd: 0,
      feeUsd: 1.06,
      createdAt: createdAt - 7 * 60 * 60 * 1000,
    },
  ];

  const positionHistory: PacificaPositionHistoryItem[] = [
    {
      symbol: "SOL",
      side: "long",
      entryPrice: 166.1,
      exitPrice: 171.8,
      amount: 8,
      realizedPnlUsd: 45.6,
      openedAt: createdAt - 28 * 60 * 60 * 1000,
      closedAt: createdAt - 19 * 60 * 60 * 1000,
    },
    {
      symbol: "XRP",
      side: "short",
      entryPrice: 2.09,
      exitPrice: 2.03,
      amount: 850,
      realizedPnlUsd: 32.5,
      openedAt: createdAt - 18 * 60 * 60 * 1000,
      closedAt: createdAt - 14 * 60 * 60 * 1000,
    },
  ];

  return {
    accountId: "sample-risk-room",
    mode: "sample",
    equityUsd: 14320.5,
    availableToSpendUsd: 9800.3,
    marginUsedUsd: 4520.2,
    realizedPnlUsd: 188.1,
    unrealizedPnlUsd: 330.8,
    volume30dUsd: 281240,
    tradeCount30d: 148,
    positions,
    openOrders,
    tradeHistory,
    positionHistory,
    portfolioHistory: buildSamplePortfolioHistory(13980),
  };
}

function toneFromThreshold(value: number, warn: number, critical: number): PacificaRiskStatus {
  if (value >= critical) {
    return "critical";
  }

  if (value >= warn) {
    return "watch";
  }

  return "stable";
}

function buildOperatorPlaybook(
  status: PacificaRiskStatus,
  marginUsagePct: number,
  totalFundingDragUsd: number,
) {
  const steps = [
    "Keep every new entry inside a staggered limit ladder instead of crossing the spread at full size.",
    "Attach a reduce-only exit before adding new gross exposure so the dashboard remains replayable on demo day.",
  ];

  if (marginUsagePct >= 45) {
    steps.unshift(
      "Trim gross exposure or add collateral before increasing leverage. Margin usage is already inside the caution band.",
    );
  } else {
    steps.unshift(
      "Margin headroom is still healthy enough for probe-size entries, but keep leverage below the suggested caps.",
    );
  }

  if (totalFundingDragUsd > 8) {
    steps.push(
      "Rotate out of the most crowded funding regimes first. Carry drag is now material at the current notional mix.",
    );
  } else {
    steps.push(
      "Funding drag is manageable. Optimize entries around funding windows instead of forcing immediate rotation.",
    );
  }

  if (status === "critical") {
    steps.push(
      "Pause new directional adds until liquidation distance and margin usage both move back into the watch band.",
    );
  }

  return steps;
}

export function buildRiskSummary(
  marketSnapshot: PacificaMarketSnapshot[],
  fundingCurves: PacificaFundingCurve[],
  account: PacificaAccountSummary,
  liquidationRadar: PacificaLiquidationEvent[],
): PacificaRiskSummary {
  const equityUsd = Math.max(account.equityUsd, 1);
  const totalNotionalUsd = account.positions.reduce(
    (sum, item) => sum + item.notionalUsd,
    0,
  );
  const marginUsagePct = (account.marginUsedUsd / equityUsd) * 100;
  const largestPositionSharePct =
    account.positions.length > 0
      ? Math.max(...account.positions.map((item) => (item.notionalUsd / equityUsd) * 100))
      : 0;
  const tightestLiqDistancePct =
    account.positions
      .map((item) => item.liquidationDistancePct)
      .filter((item): item is number => item !== null)
      .sort((left, right) => left - right)[0] ?? null;
  const totalFundingDragUsd = account.positions.reduce((sum, position) => {
    const curve = fundingCurves.find((item) => item.symbol === position.symbol);
    return sum + Math.abs(position.notionalUsd * (curve?.nextFundingRate || 0));
  }, 0);
  const liquidationEventsLastHour = liquidationRadar.filter(
    (item) => Date.now() - item.createdAt <= 60 * 60 * 1000,
  ).length;
  const crowdingAverage =
    marketSnapshot.length > 0
      ? marketSnapshot.reduce((sum, item) => sum + item.crowdedScore, 0) /
        marketSnapshot.length
      : 0;

  let score = 92;
  score -= clamp((marginUsagePct - 25) * 0.9, 0, 26);
  score -= clamp((largestPositionSharePct - 18) * 0.65, 0, 20);
  score -= clamp((12 - (tightestLiqDistancePct ?? 12)) * 2.4, 0, 18);
  score -= clamp(totalFundingDragUsd * 0.8, 0, 12);
  score -= clamp(liquidationEventsLastHour * 2.5, 0, 10);
  score -= clamp((crowdingAverage - 55) * 0.15, 0, 6);
  score = round(clamp(score, 18, 96), 0);

  const status: PacificaRiskStatus =
    score >= 75 ? "stable" : score >= 55 ? "watch" : "critical";

  const signals: PacificaRiskSignal[] = [
    {
      title: "Margin usage",
      value: `${round(marginUsagePct, 1)}%`,
      tone: toneFromThreshold(marginUsagePct, 40, 58),
      detail: `${round(account.marginUsedUsd)} used against ${round(account.equityUsd)} equity.`,
    },
    {
      title: "Largest position share",
      value: `${round(largestPositionSharePct, 1)}%`,
      tone: toneFromThreshold(largestPositionSharePct, 28, 42),
      detail: `Largest line consumes ${round(
        account.positions[0]?.notionalUsd || 0,
      )} USD of gross exposure.`,
    },
    {
      title: "Funding drag next hour",
      value: `$${round(totalFundingDragUsd, 2)}`,
      tone: toneFromThreshold(totalFundingDragUsd, 5, 12),
      detail: "Computed from current notionals multiplied by the latest next funding rates.",
    },
    {
      title: "Tightest liquidation buffer",
      value:
        tightestLiqDistancePct === null
          ? "n/a"
          : `${round(tightestLiqDistancePct, 2)}%`,
      tone:
        tightestLiqDistancePct === null
          ? "stable"
          : tightestLiqDistancePct < 8
            ? "critical"
            : tightestLiqDistancePct < 14
              ? "watch"
              : "stable",
      detail:
        tightestLiqDistancePct === null
          ? "No open positions."
          : "Distance between current mark and the nearest liquidation price.",
    },
  ];

  const marketsForPlan = [...marketSnapshot]
    .sort((left, right) => right.crowdedScore - left.crowdedScore)
    .slice(0, 3);

  const safeOrderPlan = marketsForPlan.map((market, index) => {
    const fundingBias = market.nextFundingRate;
    const action: PacificaPlanAction =
      fundingBias > 0.00001
        ? "reduce"
        : fundingBias < -0.00001
          ? "probe"
          : index === 0
            ? "wait"
            : "hedge";
    const leverageCap = Math.max(
      2,
      Math.min(market.maxLeverage, Math.round(market.maxLeverage * 0.35)),
    );
    const sizeCapUsd = round(
      Math.max(250, Math.min(account.availableToSpendUsd * 0.16, equityUsd * 0.12)),
      0,
    );

    return {
      symbol: market.symbol,
      action,
      leverageCap,
      sizeCapUsd,
      orderType:
        action === "wait"
          ? "resting limit ladder"
          : action === "reduce"
            ? "reduce-only take-profit + maker re-entry"
            : action === "hedge"
              ? "paired limit hedge"
              : "probe-size passive limit",
      invalidation:
        action === "wait"
          ? `Skip if funding stays above ${(market.nextFundingRate * 100).toFixed(4)}%.`
          : action === "reduce"
            ? `Stop adding if crowded score remains above ${market.crowdedScore}.`
            : `Cut the probe if mark moves 1.2% against entry.`,
      rationale:
        action === "reduce"
          ? "Positive next funding and heavy crowding argue for less aggressive gross exposure."
          : action === "probe"
            ? "Negative carry now rewards patient probe entries over full-size commitment."
            : action === "hedge"
              ? "This market is liquid enough for a hedge leg without consuming the whole margin budget."
              : "Market is crowded enough that patience matters more than immediacy.",
    } satisfies PacificaSafeOrderPlan;
  });

  const verdict =
    status === "stable"
      ? "Room is tradeable, but only with capped leverage and visible exits."
      : status === "watch"
        ? "Risk is acceptable for probe-size entries, not for aggressive leverage expansion."
        : "Current posture is too stressed for fresh directional adds without de-risking first.";

  const summary =
    account.mode === "sample"
      ? `Sample account mode shows how Pacifica Risk Room scores a trader before they add leverage. Current score: ${score}/100.`
      : `Live account review scored ${score}/100 using Pacifica equity, positions, open orders, carry drag, and current market stress.`;

  return {
    score,
    status,
    verdict,
    summary,
    signals,
    operatorPlaybook: buildOperatorPlaybook(status, marginUsagePct, totalFundingDragUsd),
    safeOrderPlan,
  };
}

export function buildSampleMarketSnapshot() {
  const timestamp = Date.now();
  const seeded = [
    {
      symbol: "BTC",
      mark: 70918,
      oracle: 70932,
      mid: 70910,
      yesterdayPrice: 70294,
      fundingRate: 0.0000034,
      nextFundingRate: 0.0000061,
      openInterest: 81245,
      volume24h: 114562381,
      maxLeverage: 50,
      isolatedOnly: false,
      minOrderSizeUsd: 10,
      lotSize: 0.00001,
      tickSize: 1,
    },
    {
      symbol: "ETH",
      mark: 3562.8,
      oracle: 3560.4,
      mid: 3561.6,
      yesterdayPrice: 3506.5,
      fundingRate: 0.0000115,
      nextFundingRate: 0.0000093,
      openInterest: 149322,
      volume24h: 69182314,
      maxLeverage: 50,
      isolatedOnly: false,
      minOrderSizeUsd: 10,
      lotSize: 0.0001,
      tickSize: 0.1,
    },
    {
      symbol: "SOL",
      mark: 172.44,
      oracle: 172.38,
      mid: 172.41,
      yesterdayPrice: 168.6,
      fundingRate: -0.0000106,
      nextFundingRate: -0.0000105,
      openInterest: 227883,
      volume24h: 44210319,
      maxLeverage: 20,
      isolatedOnly: false,
      minOrderSizeUsd: 10,
      lotSize: 0.01,
      tickSize: 0.01,
    },
    {
      symbol: "HYPE",
      mark: 19.84,
      oracle: 19.88,
      mid: 19.83,
      yesterdayPrice: 18.91,
      fundingRate: 0.000015,
      nextFundingRate: 0.000015,
      openInterest: 394811,
      volume24h: 12038297,
      maxLeverage: 20,
      isolatedOnly: false,
      minOrderSizeUsd: 10,
      lotSize: 0.01,
      tickSize: 0.001,
    },
    {
      symbol: "XRP",
      mark: 2.08,
      oracle: 2.081,
      mid: 2.079,
      yesterdayPrice: 2.03,
      fundingRate: 0.0000044,
      nextFundingRate: 0.000002,
      openInterest: 672044,
      volume24h: 18522701,
      maxLeverage: 20,
      isolatedOnly: false,
      minOrderSizeUsd: 10,
      lotSize: 0.01,
      tickSize: 0.0001,
    },
    {
      symbol: "PUMP",
      mark: 0.008412,
      oracle: 0.008418,
      mid: 0.008409,
      yesterdayPrice: 0.00898,
      fundingRate: -0.0000019,
      nextFundingRate: -0.0000383,
      openInterest: 13403825,
      volume24h: 22812298,
      maxLeverage: 5,
      isolatedOnly: false,
      minOrderSizeUsd: 10,
      lotSize: 1,
      tickSize: 0.000001,
    },
  ];

  return seeded.map((item) => ({
    ...item,
    change24hPct: round(computeChangePct(item.mark, item.yesterdayPrice)),
    crowdedScore: computeCrowdedScore(
      item.openInterest,
      item.volume24h,
      item.nextFundingRate,
    ),
    timestamp,
  }));
}

export function buildSampleFundingCurves(
  marketSnapshot: PacificaMarketSnapshot[],
) {
  return marketSnapshot.slice(0, 4).map((market, index) => {
    const points = Array.from({ length: 12 }, (_, pointIndex) => {
      const createdAt = Date.now() - pointIndex * 60 * 60 * 1000;
      const fundingRate = market.fundingRate + (index - pointIndex % 3) * 0.0000008;
      const nextFundingRate =
        market.nextFundingRate + Math.sin(pointIndex / 2) * 0.0000007;
      const oraclePrice = market.oracle * (1 + Math.sin(pointIndex / 4) * 0.0025);

      return {
        createdAt,
        oraclePrice: round(oraclePrice, market.tickSize >= 1 ? 2 : 5),
        bidImpactPrice: round(oraclePrice * 0.9987, market.tickSize >= 1 ? 2 : 5),
        askImpactPrice: round(oraclePrice * 1.0012, market.tickSize >= 1 ? 2 : 5),
        fundingRate,
        nextFundingRate,
      } satisfies PacificaFundingPoint;
    });

    return buildFundingCurve(market.symbol, points as unknown as Array<Record<string, unknown>>);
  });
}

export function buildSampleLiquidationRadar(
  marketSnapshot: PacificaMarketSnapshot[],
): PacificaLiquidationEvent[] {
  const marketMap = new Map(marketSnapshot.map((item) => [item.symbol, item]));
  const now = Date.now();

  return [
    {
      symbol: "PUMP",
      eventType: "liquidation",
      cause: "market_liquidation",
      side: "close_long",
      price: marketMap.get("PUMP")?.mark || 0.0084,
      amount: 820000,
      notionalUsd: 6896,
      createdAt: now - 3 * 60 * 1000,
      severity: "watch",
    },
    {
      symbol: "BTC",
      eventType: "settlement",
      cause: "settlement",
      side: "close_short",
      price: marketMap.get("BTC")?.mark || 70900,
      amount: 1.9,
      notionalUsd: 134710,
      createdAt: now - 9 * 60 * 1000,
      severity: "critical",
    },
    {
      symbol: "ETH",
      eventType: "liquidation",
      cause: "backstop_liquidation",
      side: "close_long",
      price: marketMap.get("ETH")?.mark || 3560,
      amount: 28,
      notionalUsd: 99680,
      createdAt: now - 18 * 60 * 1000,
      severity: "critical",
    },
    {
      symbol: "SOL",
      eventType: "fill",
      cause: "normal",
      side: "close_short",
      price: marketMap.get("SOL")?.mark || 172.4,
      amount: 620,
      notionalUsd: 106888,
      createdAt: now - 29 * 60 * 1000,
      severity: "watch",
    },
  ];
}
