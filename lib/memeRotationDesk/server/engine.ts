import "server-only";

import { KNOWN_TOKEN_MAP, USDC_MINT } from "@/lib/todaysOrders";
import {
  DeskAgentStep,
  DeskCandidate,
  DeskPreparedExecution,
  DeskResponse,
  DeskRiskMode,
  DeskStrategy,
  SAMPLE_ROTATION_WALLET,
} from "@/lib/memeRotationDesk";
import {
  bitgetWalletClient,
  isBitgetNetworkError,
} from "@/lib/memeRotationDesk/server/bitgetWallet";

type CandidateBase = {
  symbol: string;
  name: string;
  narrative: string;
  momentum: number;
  volume: number;
  liquidity: number;
  safety: number;
  dev: number;
  contract?: string;
};

type LiveTokenRow = {
  symbol: string;
  name: string;
  contract: string;
  chain: string;
  narrative: string;
  icon?: string | null;
  priceUsd?: number | null;
  marketCapUsd?: number | null;
  momentum24hPct: number;
  liquidityUsd?: number | null;
  volume24hUsd?: number | null;
  riskLevel?: string | null;
  audit?: Record<string, any> | null;
  info?: Record<string, any> | null;
  liquidity?: Record<string, any> | null;
};

const BONK_MINT =
  Object.entries(KNOWN_TOKEN_MAP).find(([, token]) => token.symbol === "BONK")?.[0] ||
  "";

const MEME_UNIVERSE: CandidateBase[] = [
  {
    symbol: "BONK",
    name: "Bonk",
    narrative: "liquidity anchor for mainstream Solana meme rotation",
    momentum: 74,
    volume: 88,
    liquidity: 92,
    safety: 82,
    dev: 80,
    contract: BONK_MINT,
  },
  {
    symbol: "WIF",
    name: "dogwifhat",
    narrative: "attention leader with strong reaction volume",
    momentum: 81,
    volume: 91,
    liquidity: 86,
    safety: 75,
    dev: 71,
  },
  {
    symbol: "POPCAT",
    name: "Popcat",
    narrative: "reaction-driven meme beta with quick bursts",
    momentum: 77,
    volume: 76,
    liquidity: 69,
    safety: 66,
    dev: 64,
  },
  {
    symbol: "MEW",
    name: "cat in a dogs world",
    narrative: "cat-cycle rotation name with retail stickiness",
    momentum: 71,
    volume: 70,
    liquidity: 67,
    safety: 72,
    dev: 73,
  },
  {
    symbol: "BOME",
    name: "BOOK OF MEME",
    narrative: "event-driven relic that can wake up on narrative spikes",
    momentum: 66,
    volume: 72,
    liquidity: 74,
    safety: 69,
    dev: 67,
  },
  {
    symbol: "PNUT",
    name: "Peanut the Squirrel",
    narrative: "headline-sensitive impulse coin with fast rotations",
    momentum: 73,
    volume: 68,
    liquidity: 58,
    safety: 57,
    dev: 55,
  },
  {
    symbol: "GOAT",
    name: "Goatseus Maximus",
    narrative: "AI-adjacent meme beta with sentiment bursts",
    momentum: 79,
    volume: 66,
    liquidity: 61,
    safety: 60,
    dev: 58,
  },
  {
    symbol: "FARTCOIN",
    name: "Fartcoin",
    narrative: "extreme attention beta with loose discipline requirements",
    momentum: 83,
    volume: 78,
    liquidity: 63,
    safety: 49,
    dev: 45,
  },
];

const RISK_THRESHOLDS: Record<
  DeskRiskMode,
  { safetyFloor: number; liquidityFloor: number; devFloor: number; maxSizePct: number }
> = {
  safe: { safetyFloor: 70, liquidityFloor: 68, devFloor: 66, maxSizePct: 24 },
  balanced: { safetyFloor: 62, liquidityFloor: 60, devFloor: 58, maxSizePct: 34 },
  degen: { safetyFloor: 52, liquidityFloor: 54, devFloor: 50, maxSizePct: 44 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashSeed(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

function vary(base: number, seed: number, salt: number, spread: number) {
  const wave = Math.sin((seed % 997 + salt * 17) / 23);
  return clamp(base + wave * spread, 0, 100);
}

function formatRiskMode(riskMode: DeskRiskMode) {
  if (riskMode === "safe") return "Safe";
  if (riskMode === "degen") return "Degen";
  return "Balanced";
}

function formatStrategy(strategy: DeskStrategy) {
  if (strategy === "reversal") return "Reversal";
  if (strategy === "shadow") return "Smart-Money Shadow";
  return "Momentum";
}

function scoreCandidate(candidate: DeskCandidate, strategy: DeskStrategy) {
  if (strategy === "reversal") {
    return (
      (100 - Math.abs(candidate.momentum24hPct - 18) * 2.2) * 0.24 +
      candidate.safetyScore * 0.26 +
      candidate.liquidityScore * 0.24 +
      candidate.devScore * 0.16 +
      candidate.volumeScore * 0.1
    );
  }

  if (strategy === "shadow") {
    return (
      candidate.devScore * 0.28 +
      candidate.safetyScore * 0.24 +
      candidate.liquidityScore * 0.22 +
      candidate.volumeScore * 0.14 +
      candidate.momentum24hPct * 0.12
    );
  }

  return (
    candidate.momentum24hPct * 0.34 +
    candidate.volumeScore * 0.22 +
    candidate.liquidityScore * 0.18 +
    candidate.safetyScore * 0.16 +
    candidate.devScore * 0.1
  );
}

function toArray<T = Record<string, any>>(value: any): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  return [];
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function normalizePercent(value: unknown) {
  const numeric = toNumber(value);

  if (numeric === null) {
    return 0;
  }

  if (Math.abs(numeric) <= 1) {
    return numeric * 100;
  }

  return numeric;
}

function normalizeChain(value: unknown) {
  const chain = String(value || "").toLowerCase();

  if (!chain) {
    return "";
  }

  if (chain === "100278" || chain.includes("sol")) {
    return "sol";
  }

  return chain;
}

function resolveContract(entry: Record<string, any>) {
  return firstString(
    entry.contract,
    entry.contractAddress,
    entry.tokenAddress,
    entry.address,
    entry.mint,
  );
}

function resolveSymbol(entry: Record<string, any>) {
  return firstString(entry.symbol, entry.tokenSymbol, entry.coinSymbol);
}

function resolveName(entry: Record<string, any>) {
  return firstString(entry.name, entry.tokenName, entry.fullName, entry.symbol);
}

function dedupeByContract<T extends { contract: string }>(rows: T[]) {
  const seen = new Set<string>();

  return rows.filter((row) => {
    if (!row.contract || seen.has(row.contract)) {
      return false;
    }

    seen.add(row.contract);
    return true;
  });
}

function scaleRelative(value: number | null, maxValue: number) {
  if (value === null || maxValue <= 0) {
    return 50;
  }

  const ratio = Math.log10(value + 10) / Math.log10(maxValue + 10);
  return clamp(ratio * 100, 10, 100);
}

function assessSafety(audit: Record<string, any> | null, info: Record<string, any> | null) {
  let score = 88;
  const warnCount = toNumber(audit?.warnCount) ?? 0;
  const riskCount = toNumber(audit?.riskCount) ?? 0;
  const riskLevel = String(
    audit?.riskLevel || audit?.level || info?.riskLevel || info?.risk_level || "",
  ).toLowerCase();
  const flags = [
    audit?.isHoneypot,
    audit?.honeypot,
    audit?.mintable,
    audit?.mintAuthorityEnabled,
    audit?.freezeAuthorityEnabled,
    audit?.blacklistEnabled,
  ];

  score -= warnCount * 7;
  score -= riskCount * 16;
  score -= flags.filter(Boolean).length * 10;

  if (riskLevel.includes("high")) {
    score -= 20;
  } else if (riskLevel.includes("medium")) {
    score -= 10;
  }

  return clamp(score, 5, 96);
}

function assessDeveloperQuality(info: Record<string, any> | null, audit: Record<string, any> | null) {
  const top10 = toNumber(
    info?.top10HolderPercent || info?.top10_holder_percent || info?.top10HoldPercent,
  );
  const insider = toNumber(
    info?.insiderHolderPercent || info?.insider_holder_percent || audit?.insiderHolderPercent,
  );
  const dev = toNumber(info?.devHolderPercent || info?.dev_holder_percent || audit?.devHolderPercent);
  let score = 78;

  if (top10 !== null) score -= clamp(top10, 0, 50) * 0.45;
  if (insider !== null) score -= clamp(insider, 0, 30) * 0.8;
  if (dev !== null) score -= clamp(dev, 0, 25) * 1.1;

  return clamp(score, 6, 95);
}

function extractNarrative(entry: Record<string, any>) {
  const note = firstString(
    entry.narrative,
    entry.desc,
    entry.description,
    entry.brief,
    entry.tag,
    entry.tags,
  );

  if (note) {
    return note.length > 120 ? `${note.slice(0, 117)}...` : note;
  }

  return "Solana meme candidate pulled from Bitget rankings and passed into Rug Court.";
}

function buildFallbackCandidate(
  base: CandidateBase,
  index: number,
  seed: number,
  riskMode: DeskRiskMode,
  strategy: DeskStrategy,
): DeskCandidate & { compositeScore: number } {
  const momentum = clamp(vary(base.momentum, seed, index + 1, 12), 8, 96);
  const volumeScore = clamp(vary(base.volume, seed, index + 3, 10), 20, 98);
  const liquidityScore = clamp(vary(base.liquidity, seed, index + 5, 9), 20, 98);
  const safetyScore = clamp(vary(base.safety, seed, index + 7, 8), 10, 96);
  const devScore = clamp(vary(base.dev, seed, index + 11, 8), 8, 96);
  const thresholds = RISK_THRESHOLDS[riskMode];
  let verdict: DeskCandidate["verdict"] = "approve";
  let courtNote = "Cleared the desk. Eligible for position sizing.";

  if (
    safetyScore < thresholds.safetyFloor ||
    liquidityScore < thresholds.liquidityFloor ||
    devScore < thresholds.devFloor
  ) {
    verdict = "ban";
    courtNote = "Rug Court veto: safety, liquidity, or developer discipline fell below the floor.";
  } else if (
    safetyScore < thresholds.safetyFloor + 6 ||
    liquidityScore < thresholds.liquidityFloor + 5
  ) {
    verdict = "watch";
    courtNote = "Borderline pass. Keep on watch unless the top candidate fails.";
  }

  if (strategy === "shadow" && devScore < thresholds.devFloor + 4) {
    verdict = "ban";
    courtNote = "Shadow mode veto: developer quality is too weak to mirror.";
  }

  if (strategy === "reversal" && momentum > 26 && verdict === "approve") {
    verdict = "watch";
    courtNote = "Reversal mode downgrade: move is already extended, wait for cleaner pullback.";
  }

  const candidate: DeskCandidate = {
    symbol: base.symbol,
    name: base.name,
    narrative: base.narrative,
    momentum24hPct: Number((momentum - 50).toFixed(1)),
    volumeScore: Math.round(volumeScore),
    liquidityScore: Math.round(liquidityScore),
    safetyScore: Math.round(safetyScore),
    devScore: Math.round(devScore),
    verdict,
    courtNote,
    chain: "sol",
    contract: base.contract,
  };

  return {
    ...candidate,
    compositeScore: Number(scoreCandidate(candidate, strategy).toFixed(2)),
  };
}

function buildLiveCandidates(
  rows: LiveTokenRow[],
  riskMode: DeskRiskMode,
  strategy: DeskStrategy,
) {
  const thresholds = RISK_THRESHOLDS[riskMode];
  const maxLiquidity = Math.max(
    ...rows.map((row) => row.liquidityUsd || row.info?.liquidity || 0),
    1,
  );
  const maxVolume = Math.max(...rows.map((row) => row.volume24hUsd || 0), 1);

  return rows.map((row) => {
    const volumeScore = Math.round(scaleRelative(row.volume24hUsd || null, maxVolume));
    const liquidityScore = Math.round(
      scaleRelative(
        row.liquidityUsd || toNumber(row.info?.liquidity) || null,
        maxLiquidity,
      ),
    );
    const safetyScore = Math.round(assessSafety(row.audit ?? null, row.info ?? null));
    const devScore = Math.round(
      assessDeveloperQuality(row.info ?? null, row.audit ?? null),
    );
    let verdict: DeskCandidate["verdict"] = "approve";
    let courtNote = "Bitget live checks cleared the token for position sizing.";

    if (
      safetyScore < thresholds.safetyFloor ||
      liquidityScore < thresholds.liquidityFloor ||
      devScore < thresholds.devFloor
    ) {
      verdict = "ban";
      courtNote = "Rug Court veto: live Bitget safety, liquidity, or holder signals missed the desk floor.";
    } else if (
      safetyScore < thresholds.safetyFloor + 6 ||
      liquidityScore < thresholds.liquidityFloor + 5
    ) {
      verdict = "watch";
      courtNote = "Borderline pass. Keep on watch unless the lead setup loses quality.";
    }

    if (strategy === "shadow" && devScore < thresholds.devFloor + 4) {
      verdict = "ban";
      courtNote = "Shadow mode veto: holder and dev profile is too concentrated.";
    }

    if (strategy === "reversal" && row.momentum24hPct > 26 && verdict === "approve") {
      verdict = "watch";
      courtNote = "Reversal mode downgrade: momentum is already too extended for a pullback entry.";
    }

    const candidate: DeskCandidate = {
      symbol: row.symbol,
      name: row.name,
      narrative: row.narrative,
      momentum24hPct: Number(row.momentum24hPct.toFixed(1)),
      volumeScore,
      liquidityScore,
      safetyScore,
      devScore,
      verdict,
      courtNote,
      chain: row.chain,
      contract: row.contract,
      icon: row.icon,
      priceUsd: row.priceUsd ?? null,
      marketCapUsd: row.marketCapUsd ?? null,
      riskLevel: row.riskLevel ?? null,
    };

    return {
      ...candidate,
      compositeScore: Number(scoreCandidate(candidate, strategy).toFixed(2)),
    };
  });
}

function buildAgents(
  approvedTrade: DeskResponse["approvedTrade"],
  candidates: Array<DeskCandidate & { compositeScore: number }>,
  riskMode: DeskRiskMode,
  strategy: DeskStrategy,
  universeSize: number,
  dataMode: DeskResponse["dataMode"],
): DeskAgentStep[] {
  const vetoCount = candidates.filter((candidate) => candidate.verdict === "ban").length;
  const watchCount = candidates.filter((candidate) => candidate.verdict === "watch").length;
  const sourceLabel = dataMode === "live" ? "Bitget live feed" : "fallback universe";

  return [
    {
      id: "scout",
      name: "Scout Agent",
      role: "Rank candidates and reduce noise to a single watchlist.",
      status: "ready",
      verdict: `${formatStrategy(strategy)} mode narrowed ${universeSize} names to ${candidates.length} reviewable candidates.`,
      detail: `Scout compressed ${sourceLabel} into a shortlist instead of dumping a bag of symbols onto the wallet.`,
      metrics: [
        { label: "Universe", value: String(universeSize) },
        { label: "Shortlist", value: String(candidates.length) },
        { label: "Style", value: formatStrategy(strategy) },
      ],
    },
    {
      id: "risk",
      name: "Risk Agent",
      role: "Run Rug Court on safety, liquidity, and developer quality.",
      status: vetoCount > 0 || watchCount > 0 ? "watch" : "ready",
      verdict:
        vetoCount > 0
          ? `Rug Court banned ${vetoCount} candidate${vetoCount > 1 ? "s" : ""} and left ${watchCount} on watch.`
          : "No bans required. All shortlisted names cleared the floor.",
      detail:
        "Risk Agent has veto power. If a token fails the selected desk floor, Trader does not get to touch it.",
      metrics: [
        { label: "Mode", value: formatRiskMode(riskMode) },
        { label: "Bans", value: String(vetoCount) },
        { label: "Watch", value: String(watchCount) },
      ],
    },
    {
      id: "trader",
      name: "Trader Agent",
      role: "Prepare exactly one trade with explicit invalidation and exits.",
      status: "ready",
      verdict: `Approved ${approvedTrade.symbol} with ${approvedTrade.allocationPct.toFixed(0)}% of desk capital.`,
      detail:
        "Trader receives only one job: package the cleanest surviving idea into a wallet-sized action with position size, invalidation, and exit ladder.",
      metrics: [
        { label: "Input", value: approvedTrade.inputAsset },
        { label: "Size", value: `$${approvedTrade.amountUsd.toFixed(0)}` },
        { label: "Bias", value: approvedTrade.symbol },
      ],
    },
  ];
}

function buildApprovedTrade(
  candidate: DeskCandidate & { compositeScore: number },
  budgetUsd: number,
  riskMode: DeskRiskMode,
  strategy: DeskStrategy,
) {
  const thresholds = RISK_THRESHOLDS[riskMode];
  const conviction = clamp(
    (candidate.compositeScore + candidate.safetyScore + candidate.liquidityScore) / 3,
    52,
    92,
  );
  const allocationPct = clamp(
    thresholds.maxSizePct - (100 - conviction) * 0.16,
    Math.max(14, thresholds.maxSizePct - 12),
    thresholds.maxSizePct,
  );
  const amountUsd = Number(((budgetUsd * allocationPct) / 100).toFixed(2));
  const invalidation =
    riskMode === "safe" ? "-6%" : riskMode === "degen" ? "-11%" : "-8%";
  const takeProfits =
    riskMode === "degen"
      ? ["Take 30% at +18%", "Take another 30% at +35%", "Trail the rest under momentum failure"]
      : ["Take 25% at +12%", "Take another 25% at +24%", "Move stop to breakeven after TP1"];

  return {
    symbol: candidate.symbol,
    name: candidate.name,
    amountUsd,
    allocationPct: Number(allocationPct.toFixed(1)),
    inputAsset: "USDC",
    inputContract: USDC_MINT,
    outputContract: candidate.contract,
    chain: candidate.chain || "sol",
    entryWindow:
      strategy === "reversal"
        ? "Wait for the next pullback into support before entry."
        : "Enter on confirmation only. No chase beyond the first breakout candle.",
    invalidation,
    takeProfits,
    rationale: `${candidate.name} survived Rug Court with ${candidate.safetyScore}/100 safety and ${candidate.liquidityScore}/100 liquidity while fitting the ${formatStrategy(strategy).toLowerCase()} mandate.`,
    command: `Rotate ${amountUsd.toFixed(0)} USDC into ${candidate.symbol} only if Rug Court stays green. Invalidation ${invalidation}. ${takeProfits[0]}.`,
    route: [
      "Check connected Solana wallet and USDC balance",
      "Re-run Bitget security audit before quoting",
      "Create unsigned swap order for the approved meme token",
      "Ask the wallet to sign only after reviewing slippage and size",
      "Track order status and exit ladder",
    ],
  };
}

function parseQuotePayload(payload: Record<string, any>) {
  const data = (payload?.data || payload) as Record<string, any>;
  const firstMarket =
    toArray<Record<string, any>>(data?.marketList)[0] ||
    toArray<Record<string, any>>(data?.dexQuotes)[0] ||
    toArray<Record<string, any>>(data?.routes)[0] ||
    toArray<Record<string, any>>(data?.pathList)[0] ||
    {};

  return {
    market: firstString(data?.market, firstMarket?.market, firstMarket?.name),
    estimatedOutput: firstString(
      data?.toAmount,
      data?.amountOut,
      firstMarket?.toAmount,
      firstMarket?.amountOut,
    ),
    priceImpactPct:
      toNumber(data?.priceImpact) ?? toNumber(data?.priceImpactPct) ?? toNumber(firstMarket?.priceImpact),
    slippage: firstString(data?.slippage, firstMarket?.slippage),
    feeUsd:
      toNumber(data?.fee?.totalAmountInUsd) ??
      toNumber(data?.totalAmountInUsd) ??
      toNumber(firstMarket?.fee?.totalAmountInUsd),
  };
}

async function enrichLiveExecutionQuote(
  approvedTrade: ReturnType<typeof buildApprovedTrade>,
  walletAddress: string,
  warnings: string[],
) {
  if (!approvedTrade.outputContract) {
    return {
      state: "preview" as const,
      mode: "demo" as const,
      source: "Fallback quote unavailable",
      canPrepare: false,
      warnings: ["Approved token has no contract metadata attached."],
    };
  }

  try {
    const executionWarnings = [...warnings];
    try {
      const orderPayload = await bitgetWalletClient.orderQuote({
        fromChain: "sol",
        fromContract: approvedTrade.inputContract,
        fromAmount: approvedTrade.amountUsd.toFixed(2),
        toChain: "sol",
        toContract: approvedTrade.outputContract,
        fromAddress: walletAddress,
        toAddress: walletAddress,
      });
      const parsedOrder = parseQuotePayload(orderPayload);

      if (parsedOrder.market) {
        return {
          state: "ready" as const,
          mode: "order" as const,
          source: "Bitget Wallet order quote",
          market: parsedOrder.market,
          estimatedOutput: parsedOrder.estimatedOutput,
          outputSymbol: approvedTrade.symbol,
          priceImpactPct: parsedOrder.priceImpactPct ?? null,
          slippage: parsedOrder.slippage || null,
          feeUsd: parsedOrder.feeUsd ?? null,
          canPrepare: true,
          warnings,
        };
      }
    } catch (error: any) {
      executionWarnings.push(
        `Bitget order quote unavailable: ${error?.message || "unknown error"}`,
      );
    }

    const swapPayload = await bitgetWalletClient.swapQuote({
      fromChain: "sol",
      fromContract: approvedTrade.inputContract,
      toChain: "sol",
      toContract: approvedTrade.outputContract,
      fromAmount: approvedTrade.amountUsd.toFixed(2),
      fromAddress: walletAddress,
      fromSymbol: approvedTrade.inputAsset,
      toSymbol: approvedTrade.symbol,
    });
    const parsedSwap = parseQuotePayload(swapPayload);
    const swapState = parsedSwap.market ? ("ready" as const) : ("preview" as const);

    return {
      state: swapState,
      mode: "swap" as const,
      source: "Bitget Wallet swap quote",
      market: parsedSwap.market,
      estimatedOutput: parsedSwap.estimatedOutput,
      outputSymbol: approvedTrade.symbol,
      priceImpactPct: parsedSwap.priceImpactPct ?? null,
      slippage: parsedSwap.slippage || null,
      feeUsd: parsedSwap.feeUsd ?? null,
      canPrepare: Boolean(parsedSwap.market),
      warnings: executionWarnings,
    };
  } catch (error: any) {
    const executionWarnings = [...warnings];
    executionWarnings.push(
      isBitgetNetworkError(error)
        ? "Bitget quote endpoints are not reachable in the local sandbox. Quote generation falls back to preview mode."
        : `Bitget quote failed: ${error?.message || "unknown error"}`,
    );

    return {
      state: "preview" as const,
      mode: "demo" as const,
      source: "Fallback preview",
      canPrepare: false,
      warnings: executionWarnings,
    };
  }
}

async function discoverLiveUniverse() {
  const rankingPayloads = await Promise.allSettled([
    bitgetWalletClient.rankings("topGainers"),
    bitgetWalletClient.rankings("hotPicks"),
  ]);

  const rankingRows = rankingPayloads.flatMap((result) => {
    if (result.status !== "fulfilled") {
      return [];
    }

    return toArray<Record<string, any>>(result.value?.data?.list || result.value?.list);
  });

  const solRows = dedupeByContract(
    rankingRows
      .map((entry) => ({
        symbol: resolveSymbol(entry),
        name: resolveName(entry),
        contract: resolveContract(entry),
        chain: normalizeChain(entry.chain || entry.chainName || entry.chainId),
        narrative: extractNarrative(entry),
        icon: firstString(entry.icon, entry.logoUrl, entry.logo) || null,
        priceUsd: toNumber(entry.price),
        marketCapUsd: toNumber(entry.marketCap || entry.market_cap || entry.fdv),
        momentum24hPct: normalizePercent(entry.priceChange24h || entry.price_change_24h || entry.change24h),
        volume24hUsd:
          toNumber(entry.volume24h || entry.volume_24h || entry.tradeVolume24h) || null,
        liquidityUsd: toNumber(entry.liquidity || entry.totalLiquidity) || null,
        riskLevel: firstString(entry.riskLevel, entry.risk_level) || null,
      }))
      .filter(
        (entry) =>
          entry.chain === "sol" &&
          entry.contract &&
          entry.symbol &&
          !["USDC", "USDT", "SOL"].includes(entry.symbol.toUpperCase()),
      ),
  ).slice(0, 6);

  if (solRows.length < 3) {
    throw new Error("Bitget rankings did not return enough Solana meme candidates");
  }

  const infoPayload = await bitgetWalletClient.batchTokenInfo(
    solRows.map((row) => ({ chain: "sol", contract: row.contract })),
  );
  const infoList = toArray<Record<string, any>>(infoPayload?.data?.list || infoPayload?.list);
  const infoMap = new Map<string, Record<string, any>>();
  infoList.forEach((entry) => {
    const contract = resolveContract(entry);
    if (contract) infoMap.set(contract, entry);
  });

  const auditPayload = await bitgetWalletClient.securityAudit(
    solRows.map((row) => ({ chain: "sol", contract: row.contract })),
  );
  const auditList = toArray<Record<string, any>>(auditPayload?.data?.list || auditPayload?.list);
  const auditMap = new Map<string, Record<string, any>>();
  auditList.forEach((entry) => {
    const contract = resolveContract(entry);
    if (contract) auditMap.set(contract, entry);
  });

  const liquidityResults = await Promise.allSettled(
    solRows.slice(0, 4).map(async (row) => {
      const payload = await bitgetWalletClient.liquidity("sol", row.contract);
      return {
        contract: row.contract,
        payload:
          toArray<Record<string, any>>(payload?.data?.list || payload?.list)[0] ||
          payload?.data ||
          payload,
      };
    }),
  );

  const liquidityMap = new Map<string, Record<string, any>>();
  liquidityResults.forEach((result) => {
    if (result.status === "fulfilled" && result.value.payload) {
      liquidityMap.set(result.value.contract, result.value.payload);
    }
  });

  return solRows.map((row) => {
    const info = infoMap.get(row.contract) || null;
    const liquidity = liquidityMap.get(row.contract) || null;

    return {
      ...row,
      narrative: extractNarrative(info || row),
      icon: row.icon || firstString(info?.icon, info?.logoUrl, info?.logo) || null,
      priceUsd: row.priceUsd ?? toNumber(info?.price),
      marketCapUsd:
        row.marketCapUsd ??
        toNumber(info?.marketCap || info?.market_cap || info?.fdv) ??
        null,
      volume24hUsd:
        row.volume24hUsd ??
        toNumber(info?.volume24h || info?.volume_24h || info?.txVolume24h) ??
        null,
      liquidityUsd:
        row.liquidityUsd ??
        toNumber(liquidity?.liquidity || liquidity?.totalLiquidity || info?.liquidity) ??
        null,
      riskLevel:
        row.riskLevel || firstString(info?.riskLevel, info?.risk_level) || null,
      audit: auditMap.get(row.contract) || null,
      info,
      liquidity,
    } satisfies LiveTokenRow;
  });
}

function buildFallbackDesk(
  walletAddress: string,
  budgetUsd: number,
  riskMode: DeskRiskMode,
  strategy: DeskStrategy,
  warning: string,
): DeskResponse {
  const seed = hashSeed(`${walletAddress}:${budgetUsd}:${riskMode}:${strategy}`);
  const candidates = MEME_UNIVERSE.map((base, index) =>
    buildFallbackCandidate(base, index, seed, riskMode, strategy),
  )
    .sort((left, right) => right.compositeScore - left.compositeScore)
    .slice(0, 4);
  const approved =
    candidates.find((candidate) => candidate.verdict === "approve") ||
    ({
      ...candidates[0],
      verdict: "approve",
      courtNote: "Forced approval in fallback preview mode to keep the demo operable.",
    } as DeskCandidate & { compositeScore: number });
  const approvedTrade = buildApprovedTrade(approved, budgetUsd, riskMode, strategy);

  return {
    ok: true,
    previewMode: true,
    dataMode: "fallback",
    provider: "Miraix Meme Rotation Desk fallback engine",
    generatedAt: new Date().toISOString(),
    walletAddress,
    budgetUsd,
    riskMode,
    strategy,
    warnings: [warning],
    marketContext: {
      title: `${formatStrategy(strategy)} desk in fallback preview mode`,
      summary: `The local sandbox could not reach Bitget, so the desk dropped back to its deterministic Solana meme universe. The product flow still runs end-to-end without touching existing project backends.`,
      confidence: Math.round(
        clamp((approved.compositeScore + approved.safetyScore) / 2, 48, 82),
      ),
      deskBias:
        strategy === "momentum"
          ? "Follow relative strength only after Rug Court clears it."
          : strategy === "reversal"
            ? "Buy pullbacks, not extensions."
            : "Shadow strength only when the dev profile is stable.",
      scoutUniverse: MEME_UNIVERSE.length,
    },
    agents: buildAgents(
      approvedTrade,
      candidates,
      riskMode,
      strategy,
      MEME_UNIVERSE.length,
      "fallback",
    ),
    candidates: candidates.map(({ compositeScore, ...candidate }) => candidate),
    vetoedSymbols: candidates
      .filter((candidate) => candidate.verdict === "ban")
      .map((candidate) => candidate.symbol),
    approvedTrade,
    execution: {
      state: "preview",
      mode: "demo",
      source: "Fallback preview",
      canPrepare: false,
      warnings: [warning],
    },
    proofBundle: {
      note: "Fallback mode keeps the sponsor-fit demo usable even when the local runtime cannot resolve Bitget endpoints.",
      checklist: [
        `${MEME_UNIVERSE.length} Solana meme names scored`,
        `${candidates.filter((candidate) => candidate.verdict === "ban").length} Rug Court vetoes`,
        `1 approved trade: ${approvedTrade.symbol}`,
        `Wallet bound to ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
      ],
      warnings: [warning],
    },
  };
}

export async function buildMemeRotationDesk(params: {
  walletAddress?: string;
  budgetUsd?: number;
  riskMode?: DeskRiskMode;
  strategy?: DeskStrategy;
}) {
  const walletAddress = params.walletAddress || SAMPLE_ROTATION_WALLET;
  const budgetUsd = clamp(params.budgetUsd ?? 50, 10, 5000);
  const riskMode = params.riskMode || "balanced";
  const strategy = params.strategy || "momentum";

  try {
    const liveRows = await discoverLiveUniverse();
    const warnings: string[] = [];
    const candidates = buildLiveCandidates(liveRows, riskMode, strategy)
      .sort((left, right) => right.compositeScore - left.compositeScore)
      .slice(0, 4);
    const approved =
      candidates.find((candidate) => candidate.verdict === "approve") ||
      candidates.find((candidate) => candidate.verdict === "watch") ||
      candidates[0];
    const approvedTrade = buildApprovedTrade(approved, budgetUsd, riskMode, strategy);
    const execution = await enrichLiveExecutionQuote(approvedTrade, walletAddress, warnings);

    return {
      ok: true,
      previewMode: false,
      dataMode: "live",
      provider: "Bitget Wallet API",
      generatedAt: new Date().toISOString(),
      walletAddress,
      budgetUsd,
      riskMode,
      strategy,
      warnings,
      marketContext: {
        title: `${formatStrategy(strategy)} desk with Bitget live market discovery`,
        summary: `Scout pulled live Solana meme candidates from Bitget rankings, Rug Court audited them, and Trader packaged the cleanest surviving setup into one disciplined order candidate.`,
        confidence: Math.round(
          clamp((approved.compositeScore + approved.safetyScore + approved.liquidityScore) / 3, 54, 94),
        ),
        deskBias:
          strategy === "momentum"
            ? "Follow relative strength only after Rug Court clears it."
            : strategy === "reversal"
              ? "Buy pullbacks, not extensions."
              : "Shadow strength only when the dev profile is stable.",
        scoutUniverse: liveRows.length,
      },
      agents: buildAgents(
        approvedTrade,
        candidates,
        riskMode,
        strategy,
        liveRows.length,
        "live",
      ),
      candidates: candidates.map(({ compositeScore, ...candidate }) => candidate),
      vetoedSymbols: candidates
        .filter((candidate) => candidate.verdict === "ban")
        .map((candidate) => candidate.symbol),
      approvedTrade,
      execution,
      proofBundle: {
        note: "Discovery, metadata, security screening, and quote prep are isolated inside the new Bitget-backed desk module. Existing Miraix APIs remain untouched.",
        checklist: [
          `${liveRows.length} live Solana tokens screened`,
          `${candidates.filter((candidate) => candidate.verdict === "ban").length} live Rug Court vetoes`,
          execution.canPrepare
            ? `Unsigned ${execution.mode} can be prepared for ${approvedTrade.symbol}`
            : `Quote available in ${execution.state} state`,
          `Wallet bound to ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
        ],
        warnings,
      },
    } satisfies DeskResponse;
  } catch (error: any) {
    return buildFallbackDesk(
      walletAddress,
      budgetUsd,
      riskMode,
      strategy,
      isBitgetNetworkError(error)
        ? "Bitget endpoints are unreachable in the local sandbox, so the desk is running in isolated fallback mode."
        : `Bitget live discovery failed and the desk fell back to preview mode: ${error?.message || "unknown error"}`,
    );
  }
}

export async function prepareMemeRotationDeskOrder(params: {
  walletAddress: string;
  amountUsd: number;
  outputContract: string;
  market: string;
  mode: "order" | "swap";
  outputSymbol?: string;
}) {
  try {
    if (params.mode === "order") {
      const payload = await bitgetWalletClient.orderCreate({
        fromChain: "sol",
        fromContract: USDC_MINT,
        fromAmount: params.amountUsd.toFixed(2),
        toChain: "sol",
        toContract: params.outputContract,
        fromAddress: params.walletAddress,
        toAddress: params.walletAddress,
        market: params.market,
      });
      const data = (payload?.data || payload) as Record<string, any>;
      const txs = toArray<Record<string, any>>(data?.txs);
      const signatures = toArray<Record<string, any>>(data?.signatures);

      return {
        ok: true,
        dataMode: "live",
        prepared: {
          prepared: true,
          mode: "order",
          source: "Bitget Wallet order create",
          summary: "Unsigned order payload generated.",
          nextAction: "Use the connected wallet to sign the returned payload, then submit it through the Bitget order flow.",
          orderId: firstString(data?.orderId, payload?.orderId),
          txCount: txs.length || undefined,
          signatureCount: signatures.length || undefined,
          payloadPreview: [
            txs[0] ? `First tx chain: ${firstString(txs[0].chain, txs[0].chainName) || "sol"}` : "",
            signatures[0] ? "Gasless signature payload present" : "",
          ].filter(Boolean),
        } satisfies DeskPreparedExecution,
      };
    }

    const payload = await bitgetWalletClient.swapCalldata({
      fromChain: "sol",
      fromContract: USDC_MINT,
      toChain: "sol",
      toContract: params.outputContract,
      fromAmount: params.amountUsd.toFixed(2),
      fromAddress: params.walletAddress,
      toAddress: params.walletAddress,
      market: params.market,
      fromSymbol: "USDC",
      toSymbol: params.outputSymbol,
    });
    const data = (payload?.data || payload) as Record<string, any>;
    const txs = toArray<Record<string, any>>(data?.txs);

    return {
      ok: true,
      dataMode: "live",
      prepared: {
        prepared: true,
        mode: "swap",
        source: "Bitget Wallet swap calldata",
        summary: "Unsigned swap payload generated.",
        nextAction: "Sign the returned swap payload with the connected wallet, then broadcast it through the Bitget swap flow.",
        txCount: txs.length || undefined,
        payloadPreview: [
          firstString(data?.id, data?.requestId) ? `Request id: ${firstString(data?.id, data?.requestId)}` : "",
          firstString(data?.calldata, data?.rawTx) ? "Serialized swap payload present" : "",
        ].filter(Boolean),
      } satisfies DeskPreparedExecution,
    };
  } catch (error: any) {
    return {
      ok: true,
      dataMode: "fallback",
      prepared: {
        prepared: false,
        mode: params.mode,
        source: "Fallback preview",
        summary: "Unsigned order could not be created in the local sandbox.",
        nextAction: "Run the same route in deployment or outside the restricted sandbox to hit Bitget order creation.",
        payloadPreview: [
          isBitgetNetworkError(error)
            ? "Network to Bitget is blocked in the local sandbox."
            : `Bitget order create failed: ${error?.message || "unknown error"}`,
        ],
      } satisfies DeskPreparedExecution,
    };
  }
}

export async function fetchMemeRotationDeskOrderStatus(orderId: string) {
  try {
    const payload = await bitgetWalletClient.orderStatus(orderId);
    const data = (payload?.data || payload) as Record<string, any>;
    const txs = toArray<Record<string, any>>(data?.txs || data?.transactions);

    return {
      ok: true,
      dataMode: "live",
      prepared: {
        prepared: true,
        mode: "order",
        source: "Bitget Wallet order status",
        summary: "Fetched current order lifecycle state.",
        nextAction: "If the order is still init/processing, wait and refresh again after submission.",
        orderId: firstString(data?.orderId, orderId),
        status: firstString(data?.status, data?.orderStatus),
        statusTrail: txs
          .map((tx) =>
            [firstString(tx.stage, tx.status), firstString(tx.chain, tx.chainName), firstString(tx.txId, tx.hash)]
              .filter(Boolean)
              .join(" | "),
          )
          .filter(Boolean),
      } satisfies DeskPreparedExecution,
    };
  } catch (error: any) {
    return {
      ok: true,
      dataMode: "fallback",
      prepared: {
        prepared: false,
        mode: "order",
        source: "Fallback preview",
        summary: "Order status could not be fetched in the local sandbox.",
        nextAction: "Re-run order status against a deployment that can reach Bitget, or verify that the orderId has been submitted.",
        payloadPreview: [
          isBitgetNetworkError(error)
            ? "Network to Bitget is blocked in the local sandbox."
            : `Bitget status failed: ${error?.message || "unknown error"}`,
        ],
      } satisfies DeskPreparedExecution,
    };
  }
}
