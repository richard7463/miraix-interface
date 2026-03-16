export type FirewallStatus = "PASS" | "WARN" | "BLOCK";
export type PermissionScope =
  | "READ"
  | "SPOT_TRADE"
  | "MARGIN"
  | "FUTURES"
  | "TRANSFER"
  | "WITHDRAW";

export interface BinanceMarketSnapshot {
  symbol: string;
  lastPrice: number;
  change24hPct: number;
  quoteVolumeUsd: number;
  spreadBps: number;
  bookLiquidityUsd: number;
  intradayRangePct: number;
  avgAbsHourlyMovePct: number;
  oneHourMovePct: number;
  fundingRatePct: number | null;
  liquidityTier: "deep" | "mid" | "thin";
  trend: string;
}

export interface BinanceStrategyParse {
  symbols: string[];
  usesTradeExecution: boolean;
  usesFutures: boolean;
  usesMargin: boolean;
  usesMarketOrders: boolean;
  usesLimitOrders: boolean;
  requiresConfirmation: boolean;
  hasStopLoss: boolean;
  hasTakeProfit: boolean;
  hasDrawdownLimit: boolean;
  hasWhitelist: boolean;
  usesMartingale: boolean;
  hasExternalTransfer: boolean;
  hasWithdrawalIntent: boolean;
  leverage: number | null;
  positionSizePct: number | null;
  explicitNotionalUsd: number | null;
  frequencyMinutes: number | null;
  frequencyLabel: string;
  promptLength: number;
}

export interface BinanceFirewallDimension {
  key: "permissions" | "execution" | "market" | "reproducibility";
  label: string;
  score: number;
  insight: string;
}

export interface BinanceFirewallFinding {
  severity: "critical" | "high" | "medium" | "info";
  title: string;
  detail: string;
}

export interface BinanceFirewallGuardrail {
  title: string;
  value: string;
  rationale: string;
}

export interface BinanceFirewallPermissionPlan {
  scope: PermissionScope;
  status: "required" | "optional" | "avoid";
  note: string;
}

export interface BinanceUniverseContextEntry {
  symbol: string;
  quoteVolumeUsd: number;
  change24hPct: number;
  volumeRankPct: number;
  momentumRankPct: number;
  hypeRankPct: number;
}

export interface BinanceUniverseContext {
  universeSize: number;
  entries: BinanceUniverseContextEntry[];
  topLiquiditySymbols: string[];
  topMomentumSymbols: string[];
  topHypeSymbols: string[];
}

export interface BinanceNativeSignal {
  symbol: string;
  universeTier:
    | "binance-core"
    | "liquid-alt"
    | "active-speculative"
    | "thin-fringe";
  probation: "ALLOW" | "WATCH" | "BLOCK";
  volumeRankPct: number;
  momentumRankPct: number;
  hypeRankPct: number;
  note: string;
}

export interface BinanceProbationProfile {
  mode: "supervised_spot" | "observe_only" | "blocked";
  title: string;
  summary: string;
  allowedSymbols: string[];
  watchOnlySymbols: string[];
  blockedSymbols: string[];
  operatorRunbook: string[];
}

export interface BinanceFirewallResponse {
  success: true;
  generatedAt: string;
  prompt: string;
  status: FirewallStatus;
  safetyScore: number;
  verdict: string;
  summary: string;
  watchlist: string[];
  parsed: BinanceStrategyParse;
  dimensions: BinanceFirewallDimension[];
  findings: BinanceFirewallFinding[];
  guardrails: BinanceFirewallGuardrail[];
  permissionPlan: BinanceFirewallPermissionPlan[];
  requiredPermissions: PermissionScope[];
  recommendedPermissions: PermissionScope[];
  marketSignals: BinanceMarketSnapshot[];
  universeContext: {
    universeSize: number;
    topLiquiditySymbols: string[];
    topMomentumSymbols: string[];
    topHypeSymbols: string[];
  };
  binanceNativeSignals: BinanceNativeSignal[];
  probationProfile: BinanceProbationProfile;
  safePrompt: string;
  shareText: string;
  dataSources: string[];
  futuresDataAvailable: boolean;
}

const QUOTE_SUFFIXES = ["USDT", "FDUSD", "USDC", "BTC", "ETH", "BNB"] as const;

const TOKEN_STOPWORDS = new Set([
  "AI",
  "API",
  "AND",
  "OR",
  "THE",
  "THIS",
  "THAT",
  "WITH",
  "FROM",
  "SPOT",
  "FUTURES",
  "MARGIN",
  "LIMIT",
  "MARKET",
  "LONG",
  "SHORT",
  "STOP",
  "LOSS",
  "TAKE",
  "PROFIT",
  "ONLY",
  "READ",
  "BOT",
  "BOTS",
  "AUTO",
  "USDT",
  "FDUSD",
  "USDC",
  "USD",
]);

const TRADE_INTENT_PATTERN =
  /buy|sell|swap|rebalance|rotate|accumulate|reduce|place order|open position|close position|enter|exit|买入|卖出|换仓|调仓|下单|开仓|平仓|建仓|减仓|加仓/i;

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const average = (values: number[]) =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

const toUpperClean = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

function normalizeSymbol(rawSymbol: string) {
  const cleaned = toUpperClean(rawSymbol);
  if (!cleaned) {
    return null;
  }

  if (QUOTE_SUFFIXES.includes(cleaned as (typeof QUOTE_SUFFIXES)[number])) {
    return null;
  }

  for (const quote of QUOTE_SUFFIXES) {
    if (cleaned.endsWith(quote) && cleaned.length > quote.length) {
      return cleaned;
    }
  }

  if (cleaned.length < 2 || cleaned.length > 10) {
    return null;
  }

  return `${cleaned}USDT`;
}

export function extractSymbolsFromPrompt(
  prompt: string,
  explicitSymbols: string[] = [],
) {
  const explicit = explicitSymbols
    .flatMap((item) => item.split(/[,\s/]+/))
    .map(normalizeSymbol)
    .filter(Boolean) as string[];

  const inferred = (prompt.toUpperCase().match(/\b[A-Z]{2,12}\b/g) || [])
    .filter((token) => !TOKEN_STOPWORDS.has(token))
    .map(normalizeSymbol)
    .filter(Boolean) as string[];

  const unique = [...new Set([...explicit, ...inferred])];
  return unique.slice(0, 6);
}

function parseFrequencyMinutes(prompt: string) {
  const lower = prompt.toLowerCase();
  const patterns: Array<[RegExp, (match: RegExpExecArray) => number]> = [
    [
      /every\s*(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes)\b/i,
      (match) => Number(match[1]),
    ],
    [
      /every\s*(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)\b/i,
      (match) => Number(match[1]) * 60,
    ],
    [
      /every\s*(\d+(?:\.\d+)?)\s*d(ay|ays)?\b/i,
      (match) => Number(match[1]) * 1440,
    ],
    [/每\s*(\d+(?:\.\d+)?)\s*分钟/i, (match) => Number(match[1])],
    [/每\s*(\d+(?:\.\d+)?)\s*小时/i, (match) => Number(match[1]) * 60],
    [/每\s*(\d+(?:\.\d+)?)\s*天/i, (match) => Number(match[1]) * 1440],
  ];

  for (const [pattern, resolver] of patterns) {
    const match = pattern.exec(lower);
    if (match) {
      return resolver(match);
    }
  }

  if (/hourly|每小时/i.test(lower)) {
    return 60;
  }

  if (/daily|每天/i.test(lower)) {
    return 1440;
  }

  return null;
}

function frequencyLabel(minutes: number | null) {
  if (!minutes) {
    return "未声明";
  }

  if (minutes < 60) {
    return `${minutes} 分钟`;
  }

  if (minutes % 1440 === 0) {
    return `${round(minutes / 1440, 1)} 天`;
  }

  return `${round(minutes / 60, 1)} 小时`;
}

function parseLeverage(prompt: string) {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*x\b/i,
    /(\d+(?:\.\d+)?)\s*倍/i,
    /杠杆\s*(\d+(?:\.\d+)?)/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(prompt);
    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

function parsePositionSizePct(prompt: string) {
  if (
    /all[- ]?in|full balance|entire balance|100% of balance|满仓|梭哈|全部仓位/i.test(
      prompt,
    )
  ) {
    return 100;
  }

  if (/half of balance|50% of balance|半仓/i.test(prompt)) {
    return 50;
  }

  const percentages = [...prompt.matchAll(/(\d+(?:\.\d+)?)\s*%/g)]
    .map((match) => Number(match[1]))
    .filter((value) => value > 0 && value <= 100);

  return percentages.length ? Math.max(...percentages) : null;
}

function parseExplicitNotional(prompt: string) {
  const match = /(\d+(?:\.\d+)?)\s*(usd|usdt|u)\b/i.exec(prompt);
  return match ? Number(match[1]) : null;
}

export function parseStrategy(
  prompt: string,
  explicitSymbols: string[] = [],
): BinanceStrategyParse {
  const symbols = extractSymbolsFromPrompt(prompt, explicitSymbols);
  const usesTradeExecution = TRADE_INTENT_PATTERN.test(prompt);
  const usesFutures =
    /futures?|perp|perpetual|合约|做空|做多|开多|开空|short|long/i.test(prompt);
  const usesMargin = /margin|保证金|融资|融币/i.test(prompt);
  const usesMarketOrders =
    /market order|market buy|market sell|市价|直接下单|立刻成交/i.test(prompt);
  const usesLimitOrders = /limit order|限价|挂单/i.test(prompt);
  const requiresConfirmation =
    /confirm|approval|manual|人工确认|手动确认|二次确认|人工批准/i.test(
      prompt,
    ) &&
    !/without confirmation|no confirmation|无需确认|自动执行|自动下单|免确认/i.test(
      prompt,
    );
  const hasStopLoss = /stop[- ]?loss|\bsl\b|止损|失效点|invalidation/i.test(
    prompt,
  );
  const hasTakeProfit = /take[- ]?profit|\btp\b|止盈|止赚|获利目标/i.test(
    prompt,
  );
  const hasDrawdownLimit =
    /max drawdown|max loss|daily loss cap|日亏损上限|最大回撤|单日止损|亏损上限/i.test(
      prompt,
    );
  const hasWhitelist =
    /whitelist|only trade|只交易|仅交易|仅限这些币|symbol whitelist/i.test(
      prompt,
    );
  const usesMartingale =
    /martingale|double down|加倍补仓|无限补仓|摊平|越跌越买|补仓直到/i.test(
      prompt,
    );
  const hasExternalTransfer =
    /transfer to external|external wallet|outside wallet|划转到外部|归集到外部|transfer out|sweep to/i.test(
      prompt,
    );
  const hasWithdrawalIntent = /withdraw|提币|withdrawal/i.test(prompt);
  const frequencyMinutes = parseFrequencyMinutes(prompt);

  return {
    symbols,
    usesTradeExecution,
    usesFutures,
    usesMargin,
    usesMarketOrders,
    usesLimitOrders,
    requiresConfirmation,
    hasStopLoss,
    hasTakeProfit,
    hasDrawdownLimit,
    hasWhitelist,
    usesMartingale,
    hasExternalTransfer,
    hasWithdrawalIntent,
    leverage: parseLeverage(prompt),
    positionSizePct: parsePositionSizePct(prompt),
    explicitNotionalUsd: parseExplicitNotional(prompt),
    frequencyMinutes,
    frequencyLabel: frequencyLabel(frequencyMinutes),
    promptLength: prompt.trim().length,
  };
}

function describeTrend(signal: BinanceMarketSnapshot) {
  if (signal.intradayRangePct >= 12) {
    return "高波动挤压";
  }

  if (signal.change24hPct >= 3 && signal.oneHourMovePct >= 1) {
    return "强势追涨区";
  }

  if (signal.change24hPct <= -3 && signal.oneHourMovePct <= -1) {
    return "加速下跌区";
  }

  if (Math.abs(signal.oneHourMovePct) <= 0.8 && signal.spreadBps <= 2) {
    return "相对平稳";
  }

  return "轮动中";
}

function buildLiquidityTier(quoteVolumeUsd: number, spreadBps: number) {
  if (quoteVolumeUsd >= 300_000_000 && spreadBps <= 2) {
    return "deep" as const;
  }

  if (quoteVolumeUsd >= 40_000_000 && spreadBps <= 5) {
    return "mid" as const;
  }

  return "thin" as const;
}

export function enrichMarketSignals(signals: BinanceMarketSnapshot[]) {
  return signals.map((signal) => ({
    ...signal,
    trend: describeTrend(signal),
  }));
}

function buildUniverseTier(
  entry: BinanceUniverseContextEntry | undefined,
  signal: BinanceMarketSnapshot,
): BinanceNativeSignal["universeTier"] {
  if (!entry) {
    return signal.liquidityTier === "thin"
      ? "thin-fringe"
      : "active-speculative";
  }

  if (entry.volumeRankPct >= 92 && signal.spreadBps <= 3) {
    return "binance-core";
  }

  if (entry.volumeRankPct >= 65 && signal.spreadBps <= 6) {
    return "liquid-alt";
  }

  if (entry.volumeRankPct >= 30) {
    return "active-speculative";
  }

  return "thin-fringe";
}

function buildNativeSignals(
  marketSignals: BinanceMarketSnapshot[],
  universeContext: BinanceUniverseContext,
): BinanceNativeSignal[] {
  const universeMap = new Map(
    universeContext.entries.map((entry) => [entry.symbol, entry] as const),
  );

  return marketSignals.map((signal) => {
    const entry = universeMap.get(signal.symbol);
    const volumeRankPct = entry?.volumeRankPct ?? 0;
    const momentumRankPct = entry?.momentumRankPct ?? 0;
    const hypeRankPct = entry?.hypeRankPct ?? 0;
    const universeTier = buildUniverseTier(entry, signal);

    let probation: BinanceNativeSignal["probation"] = "ALLOW";
    let note =
      "在 Binance 市场宇宙里，这个标的足够主流，可以进入受限现货试岗。";

    if (
      universeTier === "thin-fringe" ||
      signal.spreadBps >= 10 ||
      signal.intradayRangePct >= 18 ||
      hypeRankPct >= 96
    ) {
      probation = "BLOCK";
      note =
        "它在 Binance 全市场里要么太薄、要么太热、要么波动太夸张，不适合让 Agent 自动碰。";
    } else if (
      universeTier === "active-speculative" ||
      signal.intradayRangePct >= 10 ||
      hypeRankPct >= 85 ||
      momentumRankPct >= 88
    ) {
      probation = "WATCH";
      note =
        "可以观察、可以写单据草案，但不该给自动执行权，尤其不能裸连高风险权限。";
    }

    return {
      symbol: signal.symbol,
      universeTier,
      probation,
      volumeRankPct: round(volumeRankPct, 1),
      momentumRankPct: round(momentumRankPct, 1),
      hypeRankPct: round(hypeRankPct, 1),
      note,
    };
  });
}

function buildProbationProfile(
  parsed: BinanceStrategyParse,
  nativeSignals: BinanceNativeSignal[],
  status: FirewallStatus,
): BinanceProbationProfile {
  const allowedSymbols = nativeSignals
    .filter((signal) => signal.probation === "ALLOW")
    .map((signal) => signal.symbol);
  const watchOnlySymbols = nativeSignals
    .filter((signal) => signal.probation === "WATCH")
    .map((signal) => signal.symbol);
  const blockedSymbols = nativeSignals
    .filter((signal) => signal.probation === "BLOCK")
    .map((signal) => signal.symbol);

  if (status === "BLOCK" || blockedSymbols.length === nativeSignals.length) {
    return {
      mode: "blocked",
      title: "Binance 禁赛模式",
      summary:
        "这个 Agent 今天没有上岗资格，只能回去改 prompt、减权限、加围栏。",
      allowedSymbols: [],
      watchOnlySymbols,
      blockedSymbols,
      operatorRunbook: [
        "删除提币、划转、自动确认和高杠杆语句",
        "把执行范围收缩到 Binance 主流高流动性标的",
        "补齐止损、止盈、单笔仓位和冷却时间",
      ],
    };
  }

  if (status === "WARN" || watchOnlySymbols.length > 0) {
    return {
      mode: "observe_only",
      title: "Binance 观察岗",
      summary:
        "可以继续盯盘、做单据草案、给限价建议，但真实下单必须保留人工确认。",
      allowedSymbols,
      watchOnlySymbols,
      blockedSymbols,
      operatorRunbook: [
        "只开放 READ，必要时再临时给现货下单",
        "高 hype 标的只观察，不自动追单",
        "优先用限价单和白名单，不给 Agent 临场扩表",
      ],
    };
  }

  return {
    mode: "supervised_spot",
    title: "Binance 受限试岗",
    summary:
      "可以在主流高流动性现货上小仓位试岗，但仍然需要人工确认与日亏损熔断。",
    allowedSymbols,
    watchOnlySymbols,
    blockedSymbols,
    operatorRunbook: [
      "只开放 READ + SPOT_TRADE，其他权限保持关闭",
      "单笔仓位小于 10%，保留止损和冷却时间",
      "超出白名单或遇到高波动时自动降级回观察岗",
    ],
  };
}

function buildRequiredPermissions(parsed: BinanceStrategyParse) {
  const permissions: PermissionScope[] = ["READ"];

  if (parsed.usesTradeExecution) {
    permissions.push("SPOT_TRADE");
  }

  if (parsed.usesMargin) {
    permissions.push("MARGIN");
  }

  if (parsed.usesFutures) {
    permissions.push("FUTURES");
  }

  if (parsed.hasExternalTransfer) {
    permissions.push("TRANSFER");
  }

  if (parsed.hasWithdrawalIntent) {
    permissions.push("WITHDRAW");
  }

  return [...new Set(permissions)];
}

function buildPermissionScore(
  parsed: BinanceStrategyParse,
  requiredPermissions: PermissionScope[],
) {
  let score = 100;

  if (requiredPermissions.includes("WITHDRAW")) {
    score -= 75;
  }

  if (requiredPermissions.includes("TRANSFER")) {
    score -= 48;
  }

  if (requiredPermissions.includes("FUTURES")) {
    score -= 18;
  }

  if (requiredPermissions.includes("MARGIN")) {
    score -= 10;
  }

  if (parsed.usesTradeExecution && !parsed.requiresConfirmation) {
    score -= 12;
  }

  return clamp(score, 0, 100);
}

function buildExecutionScore(
  parsed: BinanceStrategyParse,
  marketSignals: BinanceMarketSnapshot[],
) {
  let score = 92;
  const worstSpread = Math.max(
    ...marketSignals.map((signal) => signal.spreadBps),
    0,
  );

  if (parsed.leverage !== null) {
    if (parsed.leverage >= 20) {
      score -= 40;
    } else if (parsed.leverage >= 10) {
      score -= 28;
    } else if (parsed.leverage >= 5) {
      score -= 18;
    } else if (parsed.leverage >= 2) {
      score -= 8;
    }
  }

  if (parsed.positionSizePct !== null) {
    if (parsed.positionSizePct >= 80) {
      score -= 24;
    } else if (parsed.positionSizePct >= 50) {
      score -= 16;
    } else if (parsed.positionSizePct >= 25) {
      score -= 8;
    }
  } else if (parsed.usesTradeExecution) {
    score -= 10;
  }

  if (parsed.usesMarketOrders) {
    score -= 8;
    if (worstSpread > 6) {
      score -= 12;
    } else if (worstSpread > 3) {
      score -= 6;
    }
  }

  if (parsed.frequencyMinutes !== null) {
    if (parsed.frequencyMinutes <= 5) {
      score -= 18;
    } else if (parsed.frequencyMinutes <= 15) {
      score -= 12;
    } else if (parsed.frequencyMinutes <= 60) {
      score -= 5;
    }
  }

  if (
    !parsed.hasStopLoss &&
    (parsed.usesFutures || (parsed.leverage !== null && parsed.leverage >= 3))
  ) {
    score -= 22;
  } else if (!parsed.hasStopLoss && parsed.usesTradeExecution) {
    score -= 8;
  }

  if (!parsed.hasTakeProfit && parsed.usesTradeExecution) {
    score -= 4;
  }

  if (!parsed.requiresConfirmation && parsed.usesTradeExecution) {
    score -= 20;
  }

  if (parsed.usesMartingale) {
    score -= 18;
  }

  if (parsed.usesLimitOrders) {
    score += 4;
  }

  if (parsed.hasTakeProfit) {
    score += 4;
  }

  if (parsed.hasDrawdownLimit) {
    score += 6;
  }

  return clamp(score, 0, 100);
}

function buildMarketScore(
  parsed: BinanceStrategyParse,
  marketSignals: BinanceMarketSnapshot[],
) {
  let score = 92;
  const worstRange = Math.max(
    ...marketSignals.map((signal) => signal.intradayRangePct),
    0,
  );
  const worstSpread = Math.max(
    ...marketSignals.map((signal) => signal.spreadBps),
    0,
  );
  const averageVolume = average(
    marketSignals.map((signal) => signal.quoteVolumeUsd),
  );
  const thinCount = marketSignals.filter(
    (signal) => signal.liquidityTier === "thin",
  ).length;
  const worstHourlyMove = Math.max(
    ...marketSignals.map((signal) => Math.abs(signal.oneHourMovePct)),
    0,
  );
  const fundingStress = Math.max(
    ...marketSignals.map((signal) =>
      signal.fundingRatePct === null ? 0 : Math.abs(signal.fundingRatePct),
    ),
    0,
  );

  if (worstRange >= 18) {
    score -= 24;
  } else if (worstRange >= 12) {
    score -= 16;
  } else if (worstRange >= 8) {
    score -= 10;
  } else if (worstRange >= 5) {
    score -= 4;
  }

  if (worstSpread >= 12) {
    score -= 18;
  } else if (worstSpread >= 6) {
    score -= 10;
  } else if (worstSpread >= 3) {
    score -= 4;
  }

  score -= thinCount * 8;

  if (averageVolume < 25_000_000) {
    score -= 8;
  } else if (averageVolume < 80_000_000) {
    score -= 4;
  }

  if (
    parsed.frequencyMinutes !== null &&
    parsed.frequencyMinutes <= 15 &&
    worstHourlyMove >= 4
  ) {
    score -= 8;
  }

  if (parsed.usesFutures && fundingStress >= 0.05) {
    score -= 6;
  }

  return clamp(score, 0, 100);
}

function buildReproducibilityScore(parsed: BinanceStrategyParse) {
  let score = 52;

  if (parsed.symbols.length > 0) {
    score += 12;
  } else {
    score -= 18;
  }

  if (parsed.positionSizePct !== null || parsed.explicitNotionalUsd !== null) {
    score += 12;
  } else if (parsed.usesTradeExecution) {
    score -= 10;
  }

  if (parsed.frequencyMinutes !== null) {
    score += 8;
  }

  if (parsed.hasStopLoss) {
    score += 10;
  }

  if (parsed.hasTakeProfit) {
    score += 8;
  }

  if (parsed.requiresConfirmation) {
    score += 10;
  }

  if (parsed.hasDrawdownLimit) {
    score += 10;
  }

  if (parsed.hasWhitelist || parsed.symbols.length <= 4) {
    score += 6;
  }

  if (parsed.usesMartingale) {
    score -= 8;
  }

  if (parsed.promptLength < 80) {
    score -= 6;
  }

  return clamp(score, 0, 100);
}

function scoreInsight(label: string, score: number) {
  if (score >= 80) {
    return `${label}做得很克制，可以直接当作策略约束。`;
  }

  if (score >= 60) {
    return `${label}有基础，但还留着几处会把账户暴露出去的口子。`;
  }

  return `${label}还不够，继续放行只会把失误放大。`;
}

function formatPermissionLabel(scope: PermissionScope) {
  switch (scope) {
    case "READ":
      return "只读";
    case "SPOT_TRADE":
      return "现货下单";
    case "MARGIN":
      return "保证金";
    case "FUTURES":
      return "合约下单";
    case "TRANSFER":
      return "账户划转";
    case "WITHDRAW":
      return "提币";
  }
}

function buildPermissionPlan(
  parsed: BinanceStrategyParse,
  requiredPermissions: PermissionScope[],
  status: FirewallStatus,
) {
  const recommended = new Set<PermissionScope>(["READ"]);

  if (parsed.usesTradeExecution) {
    recommended.add("SPOT_TRADE");
  }

  if (
    parsed.usesFutures &&
    status !== "BLOCK" &&
    (parsed.leverage === null || parsed.leverage <= 3) &&
    parsed.requiresConfirmation &&
    parsed.hasStopLoss
  ) {
    recommended.add("FUTURES");
  }

  const plan: BinanceFirewallPermissionPlan[] = [
    {
      scope: "READ",
      status: "required",
      note: "先观察，再决定是否放开交易权限。",
    },
    {
      scope: "SPOT_TRADE",
      status: recommended.has("SPOT_TRADE") ? "required" : "optional",
      note: recommended.has("SPOT_TRADE")
        ? "仅在需要现货执行时打开。"
        : "不需要就别给。",
    },
    {
      scope: "FUTURES",
      status: recommended.has("FUTURES") ? "optional" : "avoid",
      note: recommended.has("FUTURES")
        ? "仅允许隔离仓、低杠杆，并保留人工确认。"
        : "这次策略不适合直接给合约权限。",
    },
    {
      scope: "MARGIN",
      status: requiredPermissions.includes("MARGIN") ? "avoid" : "avoid",
      note: "保证金权限在大多数 AI 场景里只会增加故障半径。",
    },
    {
      scope: "TRANSFER",
      status: "avoid",
      note: "划转权限最好放进单独的人类操作流程。",
    },
    {
      scope: "WITHDRAW",
      status: "avoid",
      note: "提币权限不应该交给自动化策略。",
    },
  ];

  return {
    permissionPlan: plan,
    recommendedPermissions: plan
      .filter((item) => item.status !== "avoid")
      .map((item) => item.scope),
  };
}

function buildFindings(
  parsed: BinanceStrategyParse,
  marketSignals: BinanceMarketSnapshot[],
  nativeSignals: BinanceNativeSignal[] = [],
) {
  const findings: BinanceFirewallFinding[] = [];
  const worstSpread = [...marketSignals].sort(
    (left, right) => right.spreadBps - left.spreadBps,
  )[0];
  const wildest = [...marketSignals].sort(
    (left, right) => right.intradayRangePct - left.intradayRangePct,
  )[0];

  if (parsed.hasWithdrawalIntent) {
    findings.push({
      severity: "critical",
      title: "Prompt 触发了提币意图",
      detail:
        "一旦策略同时拥有交易和提币能力，任何误判都会直接升级成资产外流。这个权限必须由人类单独保管。",
    });
  }

  if (parsed.hasExternalTransfer) {
    findings.push({
      severity: "critical",
      title: "存在外部划转/归集动作",
      detail:
        "把自动化交易和外部转移绑在一起，会让 Agent 越过最后一道安全围栏。",
    });
  }

  if (!parsed.requiresConfirmation && parsed.usesTradeExecution) {
    findings.push({
      severity: "high",
      title: "缺少人工确认",
      detail:
        "这个 prompt 允许 Agent 自己决定并执行，下错一次单就是真损失。高风险权限必须保留二次确认。",
    });
  }

  if (parsed.leverage !== null && parsed.leverage >= 10) {
    findings.push({
      severity: "high",
      title: `${parsed.leverage}x 杠杆过激`,
      detail: `${wildest.symbol} 当前日内振幅 ${round(
        wildest.intradayRangePct,
        2,
      )}%，高杠杆会把本来能承受的波动直接放大成强平风险。`,
    });
  }

  if (parsed.positionSizePct !== null && parsed.positionSizePct >= 50) {
    findings.push({
      severity: "high",
      title: "单次动用仓位过大",
      detail: `单笔拿出 ${round(
        parsed.positionSizePct,
        1,
      )}% 的余额，说明这个 Agent 没有把“连续失误”当作常态去防。`,
    });
  }

  if (parsed.usesMarketOrders && worstSpread.spreadBps >= 3) {
    findings.push({
      severity: worstSpread.spreadBps >= 8 ? "high" : "medium",
      title: `${worstSpread.symbol} 的盘口点差不适合裸市价`,
      detail: `当前点差约 ${round(
        worstSpread.spreadBps,
        2,
      )} bps，市价单会把 slippage 直接吃进成本。高频策略尤其不该这么下。`,
    });
  }

  if (
    !parsed.hasStopLoss &&
    (parsed.usesFutures || (parsed.leverage !== null && parsed.leverage >= 3))
  ) {
    findings.push({
      severity: "high",
      title: "没有止损边界",
      detail:
        "你给了杠杆或放大执行，却没给失效条件。没有 stop loss 的自动策略，本质上是在赌网络和运气。",
    });
  }

  if (parsed.usesMartingale) {
    findings.push({
      severity: "high",
      title: "出现摊平/马丁逻辑",
      detail:
        "自动补仓会在最差的流动性和情绪阶段越陷越深，这是最容易把小错误堆成大事故的模式。",
    });
  }

  if (parsed.frequencyMinutes !== null && parsed.frequencyMinutes <= 15) {
    findings.push({
      severity: "medium",
      title: "触发频率过高",
      detail: `以 ${parsed.frequencyLabel} 的节奏执行，会把 Binance 行情噪声、网络波动和模型抖动一起放大。`,
    });
  }

  if (
    parsed.usesTradeExecution &&
    parsed.positionSizePct === null &&
    parsed.explicitNotionalUsd === null
  ) {
    findings.push({
      severity: "medium",
      title: "资金上限没有写死",
      detail:
        "没有单笔金额或仓位百分比，意味着这个 Agent 会在账户余额变化后越下越大。",
    });
  }

  if (
    parsed.hasStopLoss &&
    parsed.hasTakeProfit &&
    parsed.requiresConfirmation
  ) {
    findings.push({
      severity: "info",
      title: "已经具备基本围栏",
      detail:
        "这个策略至少把进场、止损、止盈和确认流程都写出来了，说明它更接近可上岗的 Agent。",
    });
  }

  const blockedUniverseSignal = nativeSignals.find(
    (signal) => signal.probation === "BLOCK",
  );
  if (blockedUniverseSignal) {
    findings.push({
      severity: "high",
      title: `${blockedUniverseSignal.symbol} 在 Binance 全市场里属于禁赛标的`,
      detail: `${blockedUniverseSignal.symbol} 当前落在 ${blockedUniverseSignal.universeTier} 档，hype rank ${round(
        blockedUniverseSignal.hypeRankPct,
        1,
      )}。这类标的最适合观察，不适合交给自动化执行。`,
    });
  }

  const watchUniverseSignals = nativeSignals.filter(
    (signal) => signal.probation === "WATCH",
  );
  if (watchUniverseSignals.length > 0) {
    findings.push({
      severity: "medium",
      title: "部分 watchlist 只能留在观察岗",
      detail: `${watchUniverseSignals
        .map((signal) => signal.symbol)
        .join(
          ", ",
        )} 在 Binance 宇宙里更像拥挤交易或活跃投机标的，允许看、允许写单，但不建议让 Agent 自动下手。`,
    });
  }

  return findings;
}

function buildGuardrails(
  parsed: BinanceStrategyParse,
  marketSignals: BinanceMarketSnapshot[],
  status: FirewallStatus,
) {
  const leverageCap =
    parsed.usesFutures || parsed.leverage !== null
      ? parsed.leverage !== null && parsed.leverage <= 3
        ? `${parsed.leverage}x isolated only`
        : "3x isolated max"
      : "No leverage";
  const sizingCap =
    parsed.positionSizePct !== null
      ? `${Math.min(parsed.positionSizePct, status === "PASS" ? 12 : 8)}% per order`
      : status === "PASS"
        ? "10% per order"
        : "6% per order";
  const cooldown =
    parsed.frequencyMinutes !== null && parsed.frequencyMinutes <= 15
      ? "30m cooldown"
      : parsed.frequencyMinutes !== null && parsed.frequencyMinutes <= 60
        ? "60m cooldown"
        : "Manual review each cycle";
  const whitelist = parsed.symbols.length
    ? parsed.symbols.join(", ")
    : "BNBUSDT only";
  const hottest = [...marketSignals].sort(
    (left, right) => right.intradayRangePct - left.intradayRangePct,
  )[0];

  return [
    {
      title: "权限边界",
      value: status === "PASS" ? "READ + SPOT_TRADE" : "READ by default",
      rationale:
        status === "PASS"
          ? "让 Agent 只碰必要能力，不碰提币与划转。"
          : "先观察，确认稳定再逐步放开下单。",
    },
    {
      title: "标的白名单",
      value: whitelist,
      rationale: "别让 prompt 在没有约束时临时跑去追陌生币。",
    },
    {
      title: "单笔仓位上限",
      value: sizingCap,
      rationale: "把错误半径锁死，小错才不会长成事故。",
    },
    {
      title: "杠杆与仓位模式",
      value: leverageCap,
      rationale: parsed.usesFutures
        ? "如果一定要做合约，也只给隔离仓和低杠杆。"
        : "默认不用杠杆，先证明策略能活下来。",
    },
    {
      title: "人工确认与冷却",
      value: parsed.requiresConfirmation
        ? cooldown
        : `Human approval + ${cooldown}`,
      rationale: "AI 可以提案，真正的账户动作必须留给人做最后一道签字。",
    },
    {
      title: "波动熔断",
      value: `${hottest.symbol} > ${Math.max(4, round(hottest.intradayRangePct * 0.45, 1))}% 1h move => pause`,
      rationale: "高波动时最该暂停自动化，而不是加速追价。",
    },
    {
      title: "日亏损上限",
      value: status === "PASS" ? "2.0% equity stop" : "1.2% equity stop",
      rationale: "先给 Agent 一条能被机器执行的止血线。",
    },
  ];
}

function buildSafePrompt(
  parsed: BinanceStrategyParse,
  guardrails: BinanceFirewallGuardrail[],
  status: FirewallStatus,
) {
  const scopeLine =
    status === "PASS" && parsed.usesTradeExecution
      ? "你可以提出可执行的 Binance 现货计划，但发单前必须等待人工确认。"
      : "你是只读风控模式，只能输出观察、风险和订单草案，不能直接执行。";

  const leverageRule =
    parsed.usesFutures || parsed.leverage !== null
      ? "若必须涉及 Binance 合约，只允许 isolated 模式，杠杆上限 3x，且必须写出失效点。"
      : "禁止使用杠杆、保证金、划转和提币。";

  const symbolRule = parsed.symbols.length
    ? `只允许覆盖这些标的：${parsed.symbols.join(", ")}。`
    : "如果用户没有明确给出标的，先要求补充 watchlist。";

  const guardrailLines = guardrails
    .slice(0, 5)
    .map((guardrail) => `- ${guardrail.title}: ${guardrail.value}`);

  return [
    "你是 Binance Agent Firewall 通过后的受限执行代理。",
    scopeLine,
    symbolRule,
    leverageRule,
    "输出每次建议时必须包含：trigger、entry、size、stop loss、take profit、why now、why not。",
    "如果任一约束缺失，先拒绝执行并说明原因。",
    "强制围栏：",
    ...guardrailLines,
    "",
    "原始策略意图：",
    parsed.usesTradeExecution
      ? "在保留控制权的前提下，把 prompt 的交易意图改写成更安全的计划。"
      : "继续保持只读观察模式。",
  ].join("\n");
}

function buildVerdict(status: FirewallStatus, score: number) {
  if (status === "PASS") {
    return score >= 85
      ? "这位 Agent 可以上岗，但只能戴着围栏上岗。"
      : "基本能用，不过还需要把权限收紧。";
  }

  if (status === "WARN") {
    return "先别把 Binance 账户交给它，它还像个冲动型交易员。";
  }

  return "这不是自动化，这是事故预告。先拦下，再改 prompt。";
}

function buildSummary(
  status: FirewallStatus,
  parsed: BinanceStrategyParse,
  findings: BinanceFirewallFinding[],
  marketSignals: BinanceMarketSnapshot[],
) {
  const leadFinding = findings.find((finding) => finding.severity !== "info");
  const topSignal = [...marketSignals].sort(
    (left, right) => right.intradayRangePct - left.intradayRangePct,
  )[0];
  const lead = leadFinding ? leadFinding.title : "围栏已经基本成型";
  const style = parsed.usesFutures
    ? "合约型"
    : parsed.usesTradeExecution
      ? "现货执行型"
      : "只读观察型";

  if (status === "PASS") {
    return `${style} Agent 当前处于可放行边缘，最热标的 ${topSignal.symbol} 日内振幅 ${round(
      topSignal.intradayRangePct,
      2,
    )}% ，依然建议保留人工确认。`;
  }

  if (status === "WARN") {
    return `${style} Agent 还没有严重到立即封禁，但“${lead}”已经足够说明它不能裸连 Binance 权限。`;
  }

  return `${style} Agent 被拦下的主因是“${lead}”。在 ${topSignal.symbol} 这种 ${topSignal.trend} 行情里放任执行，只会更快出事。`;
}

function buildShareText(result: Omit<BinanceFirewallResponse, "success">) {
  const leadFinding = result.findings.find(
    (finding) => finding.severity !== "info",
  );
  const symbols = result.marketSignals
    .slice(0, 3)
    .map((signal) => signal.symbol.replace("USDT", ""))
    .join(" / ");

  return [
    `我刚用 Miraix 的 Binance Agent Firewall 审了一遍自己的 AI 交易员。`,
    `裁决：${result.status} · Safety Score ${result.safetyScore}/100`,
    `上岗状态：${result.probationProfile.title}`,
    `Watchlist: ${symbols}`,
    leadFinding ? `问题：${leadFinding.title}` : "围栏：策略已经接近可上线",
    `现在的结论不是“能不能看盘”，而是“它配不配碰 Binance 账户”。`,
  ].join("\n");
}

export function analyzeFirewall(
  prompt: string,
  parsed: BinanceStrategyParse,
  rawMarketSignals: BinanceMarketSnapshot[],
  universeContext: BinanceUniverseContext,
  dataSources: string[],
  futuresDataAvailable: boolean,
  invalidSymbols: string[] = [],
): BinanceFirewallResponse {
  const marketSignals = enrichMarketSignals(rawMarketSignals);
  const binanceNativeSignals = buildNativeSignals(
    marketSignals,
    universeContext,
  );
  const requiredPermissions = buildRequiredPermissions(parsed);
  const permissionScore = buildPermissionScore(parsed, requiredPermissions);
  const executionScore = buildExecutionScore(parsed, marketSignals);
  const marketScore = buildMarketScore(parsed, marketSignals);
  const reproducibilityScore = buildReproducibilityScore(parsed);

  const dimensions: BinanceFirewallDimension[] = [
    {
      key: "permissions",
      label: "权限边界",
      score: permissionScore,
      insight: scoreInsight("权限边界", permissionScore),
    },
    {
      key: "execution",
      label: "执行约束",
      score: executionScore,
      insight: scoreInsight("执行约束", executionScore),
    },
    {
      key: "market",
      label: "市场承压",
      score: marketScore,
      insight: scoreInsight("市场承压", marketScore),
    },
    {
      key: "reproducibility",
      label: "可复现性",
      score: reproducibilityScore,
      insight: scoreInsight("可复现性", reproducibilityScore),
    },
  ];

  let findings = buildFindings(parsed, marketSignals, binanceNativeSignals);

  if (invalidSymbols.length > 0) {
    findings = [
      ...findings,
      {
        severity: "medium",
        title: "部分标的无法从 Binance 公共数据取回",
        detail: `未能拉取：${invalidSymbols.join(
          ", ",
        )}。参赛演示时应当使用真实可交易标的，避免让评委看到失效 symbol。`,
      },
    ];
  }

  const safetyScore = round(
    permissionScore * 0.28 +
      executionScore * 0.34 +
      marketScore * 0.2 +
      reproducibilityScore * 0.18,
    1,
  );

  const hasCritical = findings.some(
    (finding) => finding.severity === "critical",
  );
  const highFindings = findings.filter(
    (finding) => finding.severity === "high",
  ).length;

  let status: FirewallStatus = "PASS";
  if (hasCritical || safetyScore < 50) {
    status = "BLOCK";
  } else if (safetyScore < 78 || highFindings >= 2) {
    status = "WARN";
  }

  const guardrails = buildGuardrails(parsed, marketSignals, status);
  const { permissionPlan, recommendedPermissions } = buildPermissionPlan(
    parsed,
    requiredPermissions,
    status,
  );
  const verdict = buildVerdict(status, safetyScore);
  const summary = buildSummary(status, parsed, findings, marketSignals);
  const safePrompt = buildSafePrompt(parsed, guardrails, status);
  const probationProfile = buildProbationProfile(
    parsed,
    binanceNativeSignals,
    status,
  );

  const result = {
    generatedAt: new Date().toISOString(),
    prompt,
    status,
    safetyScore,
    verdict,
    summary,
    watchlist: parsed.symbols,
    parsed,
    dimensions,
    findings,
    guardrails,
    permissionPlan,
    requiredPermissions,
    recommendedPermissions,
    marketSignals,
    universeContext: {
      universeSize: universeContext.universeSize,
      topLiquiditySymbols: universeContext.topLiquiditySymbols,
      topMomentumSymbols: universeContext.topMomentumSymbols,
      topHypeSymbols: universeContext.topHypeSymbols,
    },
    binanceNativeSignals,
    probationProfile,
    safePrompt,
    shareText: "",
    dataSources,
    futuresDataAvailable,
  };

  return {
    success: true,
    ...result,
    shareText: buildShareText(result),
  };
}

export function createMarketSnapshot(input: {
  symbol: string;
  lastPrice: number;
  change24hPct: number;
  quoteVolumeUsd: number;
  spreadBps: number;
  bookLiquidityUsd: number;
  intradayRangePct: number;
  avgAbsHourlyMovePct: number;
  oneHourMovePct: number;
  fundingRatePct: number | null;
}) {
  const liquidityTier = buildLiquidityTier(
    input.quoteVolumeUsd,
    input.spreadBps,
  );

  return {
    symbol: input.symbol,
    lastPrice: round(input.lastPrice, 4),
    change24hPct: round(input.change24hPct, 2),
    quoteVolumeUsd: round(input.quoteVolumeUsd, 0),
    spreadBps: round(input.spreadBps, 2),
    bookLiquidityUsd: round(input.bookLiquidityUsd, 0),
    intradayRangePct: round(input.intradayRangePct, 2),
    avgAbsHourlyMovePct: round(input.avgAbsHourlyMovePct, 2),
    oneHourMovePct: round(input.oneHourMovePct, 2),
    fundingRatePct:
      input.fundingRatePct === null ? null : round(input.fundingRatePct, 4),
    liquidityTier,
    trend: "轮动中",
  } satisfies BinanceMarketSnapshot;
}
