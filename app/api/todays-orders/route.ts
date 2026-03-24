import { NextRequest, NextResponse } from "next/server";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import {
  KNOWN_TOKEN_MAP,
  SAMPLE_WALLET_ADDRESS,
  SOL_MINT,
  STABLE_MINTS,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TodaysOrdersDebrief,
  TodaysOrdersExecutionPreview,
  TodaysOrdersHolding,
  TodaysOrdersIntel,
  TodaysOrdersOrder,
  TodaysOrdersResponse,
  TodaysOrdersSources,
  TodaysOrdersSummary,
  USDC_MINT,
  USDT_MINT,
  shortMint,
} from "@/lib/todaysOrders";

export const runtime = "nodejs";

const RPC_ENDPOINTS = [
  process.env.SOLANA_RPC_URL,
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  "https://api.mainnet-beta.solana.com",
  "https://solana-api.projectserum.com",
].filter(Boolean) as string[];

const JUP_PRICE_ENDPOINT = "https://lite-api.jup.ag/price/v3";
const JUP_QUOTE_ENDPOINT = "https://lite-api.jup.ag/swap/v1/quote";
const JUP_TOKEN_SEARCH_ENDPOINT = "https://api.jup.ag/tokens/v2/search";
const JUP_API_KEY = process.env.JUP_API_KEY || process.env.JUP_LITE_API_KEY || "";

type RawWalletPosition = {
  mint: string;
  balance: number;
  decimals: number;
};

type TokenMetadata = {
  name: string;
  symbol: string;
  icon: string | null;
};

type PricePoint = {
  usdPrice?: number;
  liquidity?: number;
  decimals?: number;
  priceChange24h?: number;
};

type QuotePreview = {
  outAmount: string;
  swapUsdValue?: string;
  slippageBps: number;
  priceImpactPct?: string;
  routePlan?: Array<{
    swapInfo?: {
      label?: string;
      outputMint?: string;
    };
  }>;
};

type TradeCandidate = {
  mode: "deploy" | "defend";
  fromMint: string;
  fromSymbol: string;
  fromDecimals: number;
  fromAmount: number;
  fromValueUsd: number;
  toMint: string;
  toSymbol: string;
  toDecimals: number;
  title: string;
  thesis: string;
  command: string;
};

function resolveAgent() {
  const proxyUrl =
    process.env.HTTPS_PROXY ||
    process.env.ALL_PROXY ||
    (process.env.NODE_ENV === "development" ? "http://127.0.0.1:7890" : undefined);

  return proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
}

async function fetchJson<T>(url: string, init?: Record<string, unknown>): Promise<T> {
  const headers = {
    ...(init?.headers as Record<string, string> | undefined),
    ...(JUP_API_KEY ? { "x-api-key": JUP_API_KEY } : {}),
  };

  const response = (await fetch(url, {
    ...(init ?? {}),
    headers,
    agent: resolveAgent(),
  } as any)) as any;

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return JSON.parse(text) as T;
}

async function callSolanaRpc<T>(method: string, params: unknown[]) {
  let lastError = "Unknown Solana RPC error";

  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const response = (await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        agent: resolveAgent(),
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method,
          params,
        }),
      } as any)) as any;

      const text = await response.text();

      if (!response.ok) {
        lastError = `${response.status}: ${text}`;
        continue;
      }

      const payload = JSON.parse(text) as {
        result?: T;
        error?: { message?: string };
      };

      if (payload.error?.message) {
        lastError = payload.error.message;
        continue;
      }

      if (typeof payload.result !== "undefined") {
        return payload.result;
      }
    } catch (error: any) {
      lastError = error?.message || lastError;
    }
  }

  throw new Error(lastError);
}

async function getWalletPositions(walletAddress: string): Promise<RawWalletPosition[]> {
  const merged = new Map<string, RawWalletPosition>();
  const balanceResult = await callSolanaRpc<{ value?: number }>("getBalance", [walletAddress]);
  const lamports = Number(balanceResult?.value ?? 0);

  merged.set(SOL_MINT, {
    mint: SOL_MINT,
    balance: lamports / LAMPORTS_PER_SOL,
    decimals: 9,
  });

  const accountResponses = await Promise.allSettled(
    [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].map((programId) =>
      callSolanaRpc<{ value?: Array<any> }>("getTokenAccountsByOwner", [
        walletAddress,
        { programId },
        { encoding: "jsonParsed" },
      ]),
    ),
  );

  for (const result of accountResponses) {
    if (result.status !== "fulfilled") {
      continue;
    }

    for (const account of result.value?.value ?? []) {
      const parsed = account?.account?.data?.parsed?.info;
      const tokenAmount = parsed?.tokenAmount;
      const mint = parsed?.mint;

      if (!mint || !tokenAmount) {
        continue;
      }

      const balance = Number(tokenAmount.uiAmount ?? tokenAmount.uiAmountString ?? 0);

      if (!Number.isFinite(balance) || balance <= 0) {
        continue;
      }

      const decimals = Number(tokenAmount.decimals ?? 0);
      const previous = merged.get(mint);

      merged.set(mint, {
        mint,
        balance: (previous?.balance ?? 0) + balance,
        decimals: previous?.decimals ?? decimals,
      });
    }
  }

  return Array.from(merged.values());
}

async function getPriceMap(mints: string[]) {
  const priceMap: Record<string, PricePoint> = {};
  const uniqueMints = Array.from(new Set(mints));

  for (let index = 0; index < uniqueMints.length; index += 40) {
    const batch = uniqueMints.slice(index, index + 40);
    const url = new URL(JUP_PRICE_ENDPOINT);
    url.searchParams.set("ids", batch.join(","));

    try {
      const payload = await fetchJson<Record<string, PricePoint>>(url.toString());
      Object.assign(priceMap, payload);
    } catch {
      continue;
    }
  }

  return priceMap;
}

async function getMetadataMap(mints: string[]) {
  const metadataMap: Record<string, TokenMetadata> = {};

  await Promise.allSettled(
    Array.from(new Set(mints))
      .filter((mint) => !KNOWN_TOKEN_MAP[mint])
      .slice(0, 12)
      .map(async (mint) => {
        const url = new URL(JUP_TOKEN_SEARCH_ENDPOINT);
        url.searchParams.set("query", mint);

        const result = await fetchJson<any[]>(url.toString());

        const token = Array.isArray(result) ? result[0] : null;

        if (!token) {
          return;
        }

        metadataMap[mint] = {
          name: token.name || shortMint(mint),
          symbol: token.symbol || shortMint(mint),
          icon: token.icon || null,
        };
      }),
  );

  return metadataMap;
}

function round(value: number, decimals = 2) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function compactUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function signedPct(value: number | null | undefined) {
  if (value === null || typeof value === "undefined" || Number.isNaN(value)) {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatTokenAmount(value: number) {
  if (value >= 1000) {
    return value.toFixed(0);
  }

  if (value >= 100) {
    return value.toFixed(2);
  }

  if (value >= 10) {
    return value.toFixed(3);
  }

  return value.toFixed(4);
}

function toAtomicAmount(amount: number, decimals: number) {
  return String(Math.max(1, Math.floor(amount * 10 ** decimals)));
}

function buildHoldings(
  rawPositions: RawWalletPosition[],
  priceMap: Record<string, PricePoint>,
  metadataMap: Record<string, TokenMetadata>,
) {
  const preliminary = rawPositions.map((position) => {
    const known = KNOWN_TOKEN_MAP[position.mint];
    const metadata = metadataMap[position.mint];
    const price = priceMap[position.mint];
    const usdPrice = Number(price?.usdPrice ?? 0) || null;
    const valueUsd = usdPrice ? position.balance * usdPrice : 0;

    return {
      mint: position.mint,
      symbol: known?.symbol || metadata?.symbol || shortMint(position.mint),
      name: known?.name || metadata?.name || shortMint(position.mint),
      icon: known?.icon || metadata?.icon || null,
      balance: position.balance,
      decimals: position.decimals,
      usdPrice,
      valueUsd,
      allocationPct: 0,
      priceChange24hPct: price?.priceChange24h ?? null,
      liquidityUsd: price?.liquidity ?? null,
      isStable:
        Boolean(known?.isStable) ||
        STABLE_MINTS.has(position.mint) ||
        ["USDC", "USDT", "USDS", "USDY"].includes(
          (known?.symbol || metadata?.symbol || "").toUpperCase(),
        ),
    } satisfies TodaysOrdersHolding;
  });

  const totalValueUsd = preliminary.reduce((sum, holding) => sum + holding.valueUsd, 0);

  return preliminary
    .map((holding) => ({
      ...holding,
      allocationPct: totalValueUsd > 0 ? (holding.valueUsd / totalValueUsd) * 100 : 0,
    }))
    .sort((left, right) => right.valueUsd - left.valueUsd);
}

function buildSummary(holdings: TodaysOrdersHolding[]): TodaysOrdersSummary {
  const totalValueUsd = holdings.reduce((sum, holding) => sum + holding.valueUsd, 0);
  const stableValueUsd = holdings
    .filter((holding) => holding.isStable)
    .reduce((sum, holding) => sum + holding.valueUsd, 0);
  const pricedHoldingCount = holdings.filter((holding) => holding.valueUsd > 0).length;

  return {
    totalValueUsd: round(totalValueUsd, 2),
    nativeSol: round(holdings.find((holding) => holding.mint === SOL_MINT)?.balance ?? 0, 4),
    tokenCount: holdings.length,
    stablecoinPct: totalValueUsd > 0 ? round((stableValueUsd / totalValueUsd) * 100, 1) : 0,
    concentrationPct: round(holdings[0]?.allocationPct ?? 0, 1),
    idleCapitalUsd: round(stableValueUsd, 2),
    pricedHoldingCount,
  };
}

function buildCandidates(
  holdings: TodaysOrdersHolding[],
  summary: TodaysOrdersSummary,
): TradeCandidate[] {
  const candidates: TradeCandidate[] = [];
  const primaryStable =
    holdings.find((holding) => holding.mint === USDC_MINT) ||
    holdings.find((holding) => holding.mint === USDT_MINT) ||
    holdings.find((holding) => holding.isStable);
  const topHolding = holdings.find((holding) => holding.valueUsd > 0 && !holding.isStable);
  const nativeSol = holdings.find((holding) => holding.mint === SOL_MINT);

  if (
    topHolding &&
    topHolding.valueUsd >= 60 &&
    (topHolding.allocationPct >= 58 || (topHolding.priceChange24hPct ?? 0) >= 10)
  ) {
    const usdClip = clamp(topHolding.valueUsd * 0.15, 25, Math.min(300, topHolding.valueUsd * 0.35));
    const fromAmount = usdClip / Math.max(topHolding.usdPrice ?? 0, 0.000001);
    const target = primaryStable || {
      mint: USDC_MINT,
      symbol: "USDC",
      decimals: 6,
    };

    candidates.push({
      mode: "defend",
      fromMint: topHolding.mint,
      fromSymbol: topHolding.symbol,
      fromDecimals: topHolding.decimals,
      fromAmount: round(fromAmount, 6),
      fromValueUsd: round(usdClip, 2),
      toMint: target.mint,
      toSymbol: target.symbol,
      toDecimals: target.decimals,
      title: `批准减压：把 ${compactUsd(usdClip)} 的 ${topHolding.symbol} 转成 ${target.symbol}`,
      thesis: `${topHolding.symbol} 已经占到钱包 ${round(topHolding.allocationPct, 1)}%，今天先降集中度，不做新的追价动作。`,
      command: `On Solana, quote and prepare a swap of ${formatTokenAmount(fromAmount)} ${topHolding.symbol} into ${target.symbol}. Show the route first, then ask for final approval before broadcast.`,
    });
  }

  if (
    nativeSol &&
    nativeSol.valueUsd >= 80 &&
    summary.stablecoinPct < 12 &&
    !candidates.find((candidate) => candidate.fromMint === SOL_MINT)
  ) {
    const usdClip = clamp(summary.totalValueUsd * 0.08, 20, 120);
    const fromAmount = usdClip / Math.max(nativeSol.usdPrice ?? 0, 0.000001);

    candidates.push({
      mode: "defend",
      fromMint: SOL_MINT,
      fromSymbol: "SOL",
      fromDecimals: nativeSol.decimals,
      fromAmount: round(fromAmount, 6),
      fromValueUsd: round(usdClip, 2),
      toMint: USDC_MINT,
      toSymbol: "USDC",
      toDecimals: 6,
      title: `批准回补弹药：卖出 ${compactUsd(usdClip)} 的 SOL 建立 USDC 预备金`,
      thesis: "当前稳定币缓冲太薄，今天优先补回一层可用弹药，而不是继续把钱包压满风险资产。",
      command: `On Solana, quote and prepare a swap of ${formatTokenAmount(fromAmount)} SOL into USDC. Show the route first, then ask for final approval before broadcast.`,
    });
  }

  if (primaryStable && summary.idleCapitalUsd >= Math.max(45, summary.totalValueUsd * 0.28)) {
    const usdClip = clamp(summary.idleCapitalUsd * 0.2, 25, 250);
    const fromAmount = usdClip / Math.max(primaryStable.usdPrice ?? 1, 0.000001);

    candidates.push({
      mode: "deploy",
      fromMint: primaryStable.mint,
      fromSymbol: primaryStable.symbol,
      fromDecimals: primaryStable.decimals,
      fromAmount: round(fromAmount, 4),
      fromValueUsd: round(usdClip, 2),
      toMint: SOL_MINT,
      toSymbol: "SOL",
      toDecimals: 9,
      title: `批准部署：用 ${compactUsd(usdClip)} 的 ${primaryStable.symbol} 试探性加到 SOL`,
      thesis: `钱包当前空闲稳定币约 ${compactUsd(summary.idleCapitalUsd)}。今天只部署其中一小段，把观察转成小仓位试探。`,
      command: `On Solana, quote and prepare a swap of ${formatTokenAmount(fromAmount)} ${primaryStable.symbol} into SOL. Show the route first, then ask for final approval before broadcast.`,
    });
  }

  return candidates;
}

async function quoteCandidate(candidate: TradeCandidate) {
  const url = new URL(JUP_QUOTE_ENDPOINT);
  url.searchParams.set("inputMint", candidate.fromMint);
  url.searchParams.set("outputMint", candidate.toMint);
  url.searchParams.set("amount", toAtomicAmount(candidate.fromAmount, candidate.fromDecimals));
  url.searchParams.set("slippageBps", "50");

  try {
    const quote = await fetchJson<QuotePreview>(url.toString());
    return quote;
  } catch {
    return null;
  }
}

function pickForbiddenOrder(
  holdings: TodaysOrdersHolding[],
  summary: TodaysOrdersSummary,
): TodaysOrdersResponse["forbiddenOrder"] {
  const topHolding = holdings[0];

  if (topHolding && !topHolding.isStable && topHolding.allocationPct >= 58) {
    return {
      title: `今日禁令：不要继续给 ${topHolding.symbol} 加仓`,
      thesis: `${topHolding.symbol} 已经是第一大仓位，占比 ${round(topHolding.allocationPct, 1)}%。今天再往同一方向堆仓，只会放大单点失误。`,
      command: `Do not add to ${topHolding.symbol} again until its wallet allocation falls below 45%.`,
      riskTag: "Concentration",
    };
  }

  if (summary.stablecoinPct < 10) {
    return {
      title: "今日禁令：不要打光最后的稳定币",
      thesis: "预备金太薄时，任何新动作都会把钱包推进只能硬扛波动的状态。",
      command: "Do not deploy the final stablecoin reserve before rebuilding dry powder.",
      riskTag: "Dry powder",
    };
  }

  return {
    title: "今日禁令：不要一次性旋转整包资产",
    thesis: "今天只允许一个小而清晰的动作，不做情绪化全仓切换。",
    command: "Do not rotate more than 20% of the wallet in a single action today.",
    riskTag: "Over-trading",
  };
}

function buildIntel(
  holdings: TodaysOrdersHolding[],
  summary: TodaysOrdersSummary,
  approvedOrder: TodaysOrdersOrder,
): TodaysOrdersIntel {
  const topHolding = holdings[0];
  const solHolding = holdings.find((holding) => holding.mint === SOL_MINT);
  const stance: TodaysOrdersIntel["stance"] =
    approvedOrder.status === "watch-only"
      ? "watch-only"
      : approvedOrder.title.includes("减压") || approvedOrder.title.includes("回补")
        ? "defend"
        : approvedOrder.title.includes("部署")
          ? "deploy"
          : "observe";

  const headline =
    stance === "deploy"
      ? "今天不是找十个机会，而是把一小段空闲弹药部署到最值得试探的方向。"
      : stance === "defend"
        ? "今天优先降集中度和补弹药，先把钱包站稳。"
        : stance === "watch-only"
          ? "今天先看军情，不强行动。"
          : "今天维持观察，只准备低冲击动作。";

  return {
    stance,
    headline,
    summary:
      approvedOrder.status === "watch-only"
        ? `已定价仓位约 ${compactUsd(summary.totalValueUsd)}，但没有找到足够干净的一条可执行命令。`
        : `已定价仓位约 ${compactUsd(summary.totalValueUsd)}，当前稳定币占比 ${summary.stablecoinPct.toFixed(1)}%，第一大仓位是 ${topHolding?.symbol || "n/a"}。`,
    bullets: [
      `钱包总值 ${compactUsd(summary.totalValueUsd)}，空闲稳定币约 ${compactUsd(summary.idleCapitalUsd)}。`,
      `第一大仓 ${topHolding?.symbol || "n/a"} 占比 ${summary.concentrationPct.toFixed(1)}%，说明今天的首要任务是 ${summary.concentrationPct >= 58 ? "控集中度" : "控节奏"}。`,
      `SOL 24h ${signedPct(solHolding?.priceChange24hPct ?? null)}，当前更像 ${summary.stablecoinPct >= 35 ? "可部署但要小仓位试探" : "应先看纪律再看机会"}。`,
    ],
  };
}

function buildPreview(
  approvedOrder: TodaysOrdersOrder,
  candidate: TradeCandidate | null,
  quote: QuotePreview | null,
): TodaysOrdersExecutionPreview {
  if (!candidate || !quote) {
    return {
      status: "unavailable",
      title: "执行推演未建立",
      summary: "当前钱包没有形成一条足够干净、且能拿到实时 quote 的命令，所以今天保持观察模式。",
      route: [],
    };
  }

  const route = Array.from(
    new Set(
      (quote.routePlan ?? [])
        .map((item) => item.swapInfo?.label)
        .filter((label): label is string => Boolean(label)),
    ),
  );
  const estimatedOutput =
    Number(quote.outAmount) / 10 ** candidate.toDecimals;

  return {
    status: "ready",
    title: "执行推演已就绪",
    summary: `${approvedOrder.title}。当前已拿到实时 quote，可以继续进入签名确认。`,
    route,
    estimatedOutput: `${formatTokenAmount(estimatedOutput)} ${candidate.toSymbol}`,
    expectedValueUsd: Number(quote.swapUsdValue ?? candidate.fromValueUsd),
    slippageBps: quote.slippageBps,
    priceImpactPct: quote.priceImpactPct ? Number(quote.priceImpactPct) * 100 : null,
  };
}

function buildDebrief(
  holdings: TodaysOrdersHolding[],
  summary: TodaysOrdersSummary,
  candidate: TradeCandidate | null,
  quote: QuotePreview | null,
): TodaysOrdersDebrief {
  if (!candidate || !quote) {
    return {
      mode: "watch-only",
      title: "夜间战报：今天以观察收尾",
      summary: "今天没有批准新动作，战报记录的是钱包姿态和明天的 watchpoints，而不是勉强成交。",
      bullets: [
        "记录今天的集中度和稳定币缓冲，明天先看它们有没有改善。",
        "如果市场继续扩散，优先寻找更干净的单一命令，而不是堆更多建议。",
      ],
    };
  }

  const topHolding = holdings[0];
  const outputValueUsd = Number(quote.swapUsdValue ?? candidate.fromValueUsd);

  if (candidate.toMint === SOL_MINT) {
    const nextStableUsd = Math.max(0, summary.idleCapitalUsd - candidate.fromValueUsd);
    const nextSolValue = (holdings.find((holding) => holding.mint === SOL_MINT)?.valueUsd ?? 0) + outputValueUsd;
    const nextSolPct =
      summary.totalValueUsd > 0 ? round((nextSolValue / summary.totalValueUsd) * 100, 1) : 0;

    return {
      mode: "preview",
      title: "夜间战报：若批准，今天会以试探性部署收尾",
      summary: `执行后空闲稳定币会从 ${compactUsd(summary.idleCapitalUsd)} 降到约 ${compactUsd(nextStableUsd)}，SOL 权重抬升到约 ${nextSolPct}%。`,
      bullets: [
        "这不是全仓切换，只是把观察转成一段可控的真实仓位。",
        "如果执行后市场不给确认，明天优先评估是否需要把新仓位重新压回稳定币。",
      ],
    };
  }

  const nextStableUsd = summary.idleCapitalUsd + outputValueUsd;
  const nextTopValue = Math.max(0, (topHolding?.valueUsd ?? 0) - candidate.fromValueUsd);
  const nextTopPct =
    summary.totalValueUsd > 0 ? round((nextTopValue / summary.totalValueUsd) * 100, 1) : 0;

  return {
    mode: "preview",
    title: "夜间战报：若批准，今天会以减压收尾",
    summary: `执行后稳定币缓冲会升到约 ${compactUsd(nextStableUsd)}，第一大仓位预计回落到约 ${nextTopPct}%。`,
    bullets: [
      `今天的目标不是赚更多，而是把 ${topHolding?.symbol || candidate.fromSymbol} 的单点风险往下压一层。`,
      "如果执行后市场继续单边上冲，明天再评估是否需要二次减压，而不是今天一次性砍太多。",
    ],
  };
}

function buildWatchOnlyOrder(summary: TodaysOrdersSummary): TodaysOrdersOrder {
  return {
    status: "watch-only",
    title: "今日军令：不批准新动作",
    thesis: `当前已定价仓位约 ${compactUsd(summary.totalValueUsd)}，但没有形成一条足够干净、且能拿到实时推演的命令。今天先压噪音，不强行出手。`,
    command:
      "Review the wallet posture again, list the top concentration and stablecoin risks, and wait for a cleaner setup before preparing a swap.",
  };
}

function getTopValueMints(positions: RawWalletPosition[], priceMap: Record<string, PricePoint>) {
  return positions
    .map((position) => ({
      mint: position.mint,
      score: position.balance * Number(priceMap[position.mint]?.usdPrice ?? 0),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 8)
    .map((item) => item.mint);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const walletAddress = String(body?.walletAddress || "").trim() || SAMPLE_WALLET_ADDRESS;

    new PublicKey(walletAddress);

    const rawPositions = await getWalletPositions(walletAddress);
    const priceMap = await getPriceMap(rawPositions.map((position) => position.mint));
    const metadataMap = await getMetadataMap(getTopValueMints(rawPositions, priceMap));
    const allHoldings = buildHoldings(rawPositions, priceMap, metadataMap);
    const holdings = allHoldings.slice(0, 10);
    const summary = buildSummary(allHoldings);
    const candidates = buildCandidates(allHoldings, summary);

    let approvedCandidate: TradeCandidate | null = null;
    let approvedQuote: QuotePreview | null = null;

    for (const candidate of candidates) {
      const quote = await quoteCandidate(candidate);
      if (quote) {
        approvedCandidate = candidate;
        approvedQuote = quote;
        break;
      }
    }

    const approvedOrder: TodaysOrdersOrder =
      approvedCandidate && approvedQuote
        ? {
            status: "approved",
            title: approvedCandidate.title,
            thesis: approvedCandidate.thesis,
            command: approvedCandidate.command,
            fromSymbol: approvedCandidate.fromSymbol,
            toSymbol: approvedCandidate.toSymbol,
            fromAmount: approvedCandidate.fromAmount,
            inputValueUsd: approvedCandidate.fromValueUsd,
          }
        : buildWatchOnlyOrder(summary);

    const sources: TodaysOrdersSources = {
      wallet: "OKX OnchainOS Wallet / Portfolio posture",
      market: "OKX OnchainOS Market context",
      trade: "OKX OnchainOS Trade quote and route preview",
      receipt: "OKX OnchainOS Broadcast / Status handoff",
    };

    return NextResponse.json({
      ok: true,
      walletAddress,
      generatedAt: new Date().toISOString(),
      sources,
      summary,
      holdings,
      todayIntel: buildIntel(allHoldings, summary, approvedOrder),
      approvedOrder,
      forbiddenOrder: pickForbiddenOrder(allHoldings, summary),
      executionPreview: buildPreview(approvedOrder, approvedCandidate, approvedQuote),
      executionPlan:
        approvedCandidate && approvedQuote
          ? {
              inputMint: approvedCandidate.fromMint,
              outputMint: approvedCandidate.toMint,
              inputSymbol: approvedCandidate.fromSymbol,
              outputSymbol: approvedCandidate.toSymbol,
              inputAmount: approvedCandidate.fromAmount,
              inputAmountAtomic: toAtomicAmount(
                approvedCandidate.fromAmount,
                approvedCandidate.fromDecimals,
              ),
              quoteResponse: approvedQuote,
            }
          : null,
      nightDebrief: buildDebrief(allHoldings, summary, approvedCandidate, approvedQuote),
    } satisfies TodaysOrdersResponse);
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to generate today's orders",
      },
      { status: 400 },
    );
  }
}
