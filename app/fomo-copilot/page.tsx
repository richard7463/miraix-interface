"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy, useSignTypedData, useWallets } from "@privy-io/react-auth";
import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Download,
  Globe,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { xLayer } from "viem/chains";
import {
  buildFomoSharePayload,
  serializeFomoSharePayload,
} from "@/lib/fomoCopilotShare";
import { usePremiumActionX402 } from "@/src/usePremiumActionX402";

type RiskMode = "safe" | "balanced" | "degen";
type TimeHorizon = "today" | "3d" | "7d";
type PaymentAsset = "fxUSD" | "USDT" | "USDC";

type ExecutionTransaction = {
  to: string;
  data?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
};

type QuoteExecution = {
  network: string;
  chainId: number;
  approvalTransactions: ExecutionTransaction[];
  transaction: ExecutionTransaction | null;
};

type AgentStatus = "ready" | "watch" | "pending";

type AgentLoopStep = {
  id: "strategist" | "risk" | "execution";
  name: string;
  role: string;
  status: AgentStatus;
  verdict: string;
  detail: string;
  metrics: Array<{
    label: string;
    value: string;
  }>;
};

interface PreviewResponse {
  success: boolean;
  provider?: string;
  preview: {
    theme: string;
    summary: string;
    teaser: string;
    topSymbols: string[];
    marketPulse: Array<{
      symbol: string;
      tag: string;
      weight: number;
      priceLabel: string;
      change24hLabel: string;
    }>;
    metrics: {
      confidence: number;
      fomoScore: number;
      estimatedSlippagePct: number;
      estimatedFeesUsd: number;
      agentLoop: AgentLoopStep[];
    };
  };
  paymentRail: {
    enabled: boolean;
    assetSymbol: string;
    network: string;
    displayPrice: string;
    options?: Array<{
      assetSymbol: PaymentAsset;
      displayPrice: string;
      network: string;
    }>;
  };
}

interface PremiumPlanResponse {
  success: boolean;
  provider?: string;
  plan: {
    theme: string;
    summary: string;
    confidence: number;
    fomoScore: number;
    estimatedSlippagePct: number;
    estimatedFeesUsd: number;
    allocation: Array<{
      symbol: string;
      name: string;
      tag: string;
      weight: number;
      amountUsd: number;
      market?: {
        tokenAddress?: string;
      };
      quote: {
        outputAmountFormatted: string;
        routeNames: string[];
        estimatedFeeUsd: number;
        priceImpactPct: number;
        txReady: boolean;
        txReason: string;
        txData: string;
        execution?: QuoteExecution;
      };
    }>;
    executionSteps: string[];
    executionReadiness: {
      provider: string;
      tradeWalletAddress: string | null;
      preparedSwapCount: number;
      totalSwapCount: number;
    };
    agentLoop: AgentLoopStep[];
    proofBundle: {
      quoteProvider: string;
      paymentRailLabel: string;
      paymentRailNetwork: string;
      tradeChainName: string;
      tradeChainId: number;
      tradeInputAsset: string;
      gasAssetSymbol: string;
      walletAddress: string | null;
      txReadyCount: number;
      totalTradableLegs: number;
      routeCount: number;
      reserveWeightPct: number;
      summary: string;
      actions: Array<{
        symbol: string;
        amountUsd: number;
        txReady: boolean;
        route: string;
        txReason: string;
      }>;
    };
    shareCard: {
      title: string;
      caption: string;
    };
    paymentRail: {
      assetSymbol: string;
      displayPrice: string;
      enabled: boolean;
      network: string;
    };
    tradeRail?: {
      network: string;
      inputAssetSymbol: string;
      gasAssetSymbol: string;
    };
  };
  payment?: unknown;
}

interface ExecutionResult {
  symbol: string;
  status: "success" | "error";
  hash?: string;
  error?: string;
  approvalHashes?: string[];
}

interface FundingStatus {
  okbBalance: number;
  stableBalance: number;
  stableSymbol: string;
  hasEnoughOkb: boolean;
  hasEnoughStable: boolean;
}

interface EvmTypedDataSigner {
  address: `0x${string}`;
  signTypedData: (message: {
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    primaryType: string;
    message: Record<string, unknown>;
  }) => Promise<`0x${string}`>;
}

const XLAYER_CHAIN_ID = xLayer.id;
const XLAYER_NAME = xLayer.name;
const XLAYER_GAS_SYMBOL = xLayer.nativeCurrency.symbol;
const XLAYER_USDT_ADDRESS =
  "0x779ded0c9e1022225f8e0630b35a9b54be713736" as const;
const XLAYER_USDC_ADDRESS =
  "0x74b7f16337b8972027f6196a17a631ac6de26d22" as const;
const MIN_OKB_GAS_BUFFER = 0.001;
const MIN_EXECUTABLE_LEG_USD = 1;

const budgetPresets = [50, 100, 300];
const MIN_BUDGET_USD = 1;
const MAX_BUDGET_USD = 10000;

const riskOptions: Array<{
  value: RiskMode;
  labelKey: string;
  detailKey: string;
}> = [
  { value: "safe", labelKey: "riskSafe", detailKey: "riskSafeDetail" },
  {
    value: "balanced",
    labelKey: "riskBalanced",
    detailKey: "riskBalancedDetail",
  },
  { value: "degen", labelKey: "riskDegen", detailKey: "riskDegenDetail" },
];

const horizonOptions: Array<{ value: TimeHorizon; labelKey: string }> = [
  { value: "today", labelKey: "horizonToday" },
  { value: "3d", labelKey: "horizon3d" },
  { value: "7d", labelKey: "horizon7d" },
];

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

type Lang = "en" | "zh";

const i18n: Record<Lang, Record<string, string>> = {
  en: {
    // Hero
    heroSubtitle: "Miraix Rotation Desk",
    heroHeadline: "Three Agents. One Rotation.\nFully On-Chain.",
    heroDesc:
      "Strategist proposes a basket. Risk Agent can OVERRIDE. Execution Agent broadcasts on X Layer. Every step is powered by OKX OnchainOS and gated by x402 micropayment.",
    hackathonBadge: "X Layer Onchain OS AI Hackathon",
    archFlowTitle: "Agent Collaboration Architecture",
    archStep1: "OKX Market API",
    archStep2: "Strategist Agent",
    archStep3: "Risk Agent",
    archStep4: "Execution Agent",
    archStep5: "X Layer Broadcast",
    archOverride: "can OVERRIDE",
    archDexRoute: "OKX DEX Aggregator",
    archPayment: "x402 Payment Gate",
    scoreIntegration: "Integration",
    scoreUtility: "Utility",
    scoreInnovation: "Innovation",
    scoreReproducibility: "Reproducibility",
    techXLayer: "X Layer (Chain 196)",
    techOnchainOS: "OKX OnchainOS",
    techX402: "x402 Protocol",
    techLangGraph: "LangGraph Multi-Agent",
    // Config section
    budget: "Budget",
    budgetMin: "Minimum 1 USDT.",
    budgetMinApplied: "Auto-adjusted to minimum 1 USDT.",
    riskMode: "Risk Mode",
    riskSafe: "Conservative",
    riskSafeDetail: "Prioritize reserve buffer",
    riskBalanced: "Balanced",
    riskBalancedDetail: "Two attack legs + one hedge leg",
    riskDegen: "Aggressive",
    riskDegenDetail: "Higher deploy rate, no stablecoin reserve",
    horizon: "Horizon",
    horizonToday: "Today",
    horizon3d: "3 Days",
    horizon7d: "7 Days",
    generatePreview: "Generate Free Preview",
    // Wallet panel
    walletAndRail: "Wallet & Rails",
    notConnected: "Not connected",
    waitingPreview: "Waiting for preview",
    loginPrivy: "Login & Connect Privy Wallet",
    openWalletExplorer: "Open X Layer Wallet",
    // Preview empty state
    previewEmptyTitle: "Generate a Free Preview First",
    previewEmptyDesc:
      "This area will show strategy direction, agent assignments, and rail structure before you unlock and execute.",
    // Preview section
    freePreview: "Free Preview",
    // Payment section
    payNowTitle: "Pay & Execute Now",
    payNowDesc:
      "x402 payment unlocks premium action, then the same EVM wallet broadcasts on X Layer.",
    preExecCheck: "Pre-execution Check",
    walletBalanceLabel: "X Layer wallet has",
    insufficientBalance: "Insufficient balance — fund wallet before paying.",
    loginAndPay: "Login & Pay",
    executingLabel: "Executing...",
    fundFirst: "Fund wallet first",
    payAndExecute: "Pay {price} & Execute",
    railWaiting: "Waiting for rail selection",
    railPayExec: "{network} payment → X Layer execution",
    // Premium plan section
    txCompleted: "Transactions Completed",
    partialBroadcast: "Partial Broadcast",
    executionUnlocked: "Execution Unlocked",
    premiumLoopComplete: "Premium loop completed end to end",
    partialSuccess: "{success} succeeded, {failed} failed",
    broadcastingTx:
      "Premium action unlocked, broadcasting X Layer transactions",
    confidence: "Confidence",
    confidenceDetail: "Strategist Agent confidence",
    maxSlippage: "Max Slippage",
    slippageDetail: "Risk Agent estimated ceiling",
    txReady: "Tx Ready",
    txReadyDetail: "Execution Agent readiness",
    routes: "Routes",
    routesDetail: "OKX visible route count",
    agentDecisionLog: "Agent Decision Log",
    executionProofBoard: "Execution Proof Board",
    x402Settled: "x402 settled",
    mainTx: "Main Tx",
    reserveHold: "Reserve hold",
    broadcasted: "Broadcasted",
    execFailed: "Execution failed",
    // Share section
    shareTitle: "Share This Result",
    shareDesc:
      "One image captures the three-agent verdict, OKX routing execution, and x402 unlock proof.",
    retryFailed: "Retry Failed Transactions",
    downloadImage: "Download Result Image",
    copied: "Copied",
    copyImageLink: "Copy Image Link",
    openImage: "Open Image",
    viewWallet: "View Wallet",
  },
  zh: {
    heroSubtitle: "Miraix Rotation Desk",
    heroHeadline: "三个 Agent，一次 Rotation\n全链上执行",
    heroDesc:
      "Strategist 提出篮子方案。Risk Agent 可以 OVERRIDE。Execution Agent 在 X Layer 广播。每一步由 OKX OnchainOS 驱动，x402 微支付门控。",
    hackathonBadge: "X Layer Onchain OS AI Hackathon",
    archFlowTitle: "Agent 协作架构",
    archStep1: "OKX Market API",
    archStep2: "Strategist Agent",
    archStep3: "Risk Agent",
    archStep4: "Execution Agent",
    archStep5: "X Layer 广播",
    archOverride: "可 OVERRIDE",
    archDexRoute: "OKX DEX Aggregator",
    archPayment: "x402 支付门控",
    scoreIntegration: "集成度",
    scoreUtility: "实用性",
    scoreInnovation: "创新性",
    scoreReproducibility: "可复现性",
    techXLayer: "X Layer (Chain 196)",
    techOnchainOS: "OKX OnchainOS",
    techX402: "x402 Protocol",
    techLangGraph: "LangGraph Multi-Agent",
    budget: "预算",
    budgetMin: "最低 1 USDT。",
    budgetMinApplied: "已自动按 1 USDT 起算。",
    riskMode: "风险模式",
    riskSafe: "保守",
    riskSafeDetail: "优先留缓冲仓",
    riskBalanced: "平衡",
    riskBalancedDetail: "两条进攻腿 + 一条对冲腿",
    riskDegen: "激进",
    riskDegenDetail: "更高部署率，不留稳定币仓",
    horizon: "周期",
    horizonToday: "今天",
    horizon3d: "3 天",
    horizon7d: "7 天",
    generatePreview: "生成免费预览",
    walletAndRail: "钱包与链路",
    notConnected: "未连接",
    waitingPreview: "等待预览生成",
    loginPrivy: "登录并连接 Privy 钱包",
    openWalletExplorer: "打开 X Layer 钱包地址",
    previewEmptyTitle: "先生成免费预览",
    previewEmptyDesc:
      "这里会先显示策略方向、agent 分工和链路结构，再进入付费解锁与执行。",
    freePreview: "Free Preview",
    payNowTitle: "立即支付并执行",
    payNowDesc: "先走 x402 支付解锁，再用同一个 EVM 钱包在 X Layer 上广播。",
    preExecCheck: "执行前检查",
    walletBalanceLabel: "X Layer 钱包当前有",
    insufficientBalance: "执行钱包余额不足，先补足后再支付。",
    loginAndPay: "登录并支付",
    executingLabel: "执行中...",
    fundFirst: "先补足",
    payAndExecute: "支付 {price} 并执行",
    railWaiting: "等待 rail 选择",
    railPayExec: "{network} 付款 → X Layer 执行",
    txCompleted: "交易已完成",
    partialBroadcast: "部分广播",
    executionUnlocked: "已解锁执行",
    premiumLoopComplete: "premium loop 已经完整跑通",
    partialSuccess: "{success} 笔成功，{failed} 笔失败",
    broadcastingTx: "premium action 已解锁，正在广播 X Layer 交易",
    confidence: "Confidence",
    confidenceDetail: "策略 Agent 置信度",
    maxSlippage: "Max Slippage",
    slippageDetail: "Risk Agent 预估上限",
    txReady: "Tx Ready",
    txReadyDetail: "Execution Agent 就绪度",
    routes: "Routes",
    routesDetail: "OKX 可见路由数",
    agentDecisionLog: "Agent 决策日志",
    executionProofBoard: "执行证据板",
    x402Settled: "x402 已结算",
    mainTx: "主交易",
    reserveHold: "保留稳定仓",
    broadcasted: "已广播",
    execFailed: "执行失败",
    shareTitle: "分享这次结果",
    shareDesc: "一张图直接带出三层 agent 判断、OKX 路由执行和 x402 解锁证明。",
    retryFailed: "重试未完成交易",
    downloadImage: "下载结果图",
    copied: "已复制",
    copyImageLink: "复制图片链接",
    openImage: "打开图片",
    viewWallet: "查看钱包",
  },
};

function tt(
  dict: Record<string, string>,
  key: string,
  vars?: Record<string, string | number>,
) {
  let str = dict[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}

const xLayerClient = createPublicClient({
  chain: xLayer,
  transport: http(),
});

function truncateMiddle(value: string | null | undefined, start = 6, end = 4) {
  if (!value) return "—";
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function inferEip712DomainTypes(domain: Record<string, unknown>) {
  return Object.entries(domain).map(([name, value]) => {
    if (typeof value === "string") {
      if (value.startsWith("0x") && value.length === 42) {
        return { name, type: "address" };
      }
      if (value.startsWith("0x") && value.length === 66) {
        return { name, type: "bytes32" };
      }
      return { name, type: "string" };
    }

    if (typeof value === "number" || typeof value === "bigint") {
      return { name, type: "uint256" };
    }

    return { name, type: "string" };
  });
}

function normalizeTypedDataValue(value: unknown, path: string[] = []): unknown {
  const fieldName = path[path.length - 1];

  if (typeof value === "bigint") {
    if (fieldName === "chainId") {
      return Number(value);
    }
    return value.toString();
  }

  if (
    fieldName === "chainId" &&
    typeof value === "string" &&
    /^\d+$/.test(value)
  ) {
    const numericValue = Number(value);
    return Number.isSafeInteger(numericValue) ? numericValue : value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      normalizeTypedDataValue(item, [...path, String(index)]),
    );
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(record).map(([key, entryValue]) => [
        key,
        normalizeTypedDataValue(entryValue, [...path, key]),
      ]),
    );
  }

  return value;
}

function createPrivyEvmSigner(
  address: string,
  signTypedDataWithPrivy: (
    input: unknown,
    options?: { address?: string; uiOptions?: unknown },
  ) => Promise<{ signature: string }>,
) {
  return {
    address: address as `0x${string}`,
    async signTypedData(payload: {
      domain: Record<string, unknown>;
      types: Record<string, unknown>;
      primaryType: string;
      message: Record<string, unknown>;
    }) {
      const typedData = {
        domain: normalizeTypedDataValue(payload.domain, ["domain"]) as Record<
          string,
          unknown
        >,
        primaryType: payload.primaryType,
        message: normalizeTypedDataValue(payload.message, [
          "message",
        ]) as Record<string, unknown>,
        types: {
          EIP712Domain: inferEip712DomainTypes(payload.domain),
          ...payload.types,
        },
      };

      const result = await signTypedDataWithPrivy(typedData, { address });
      return result.signature as `0x${string}`;
    },
  };
}

function findPaymentReference(payment: unknown): string | null {
  if (!payment || typeof payment !== "object") return null;

  const queue: unknown[] = [payment];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || visited.has(current))
      continue;

    visited.add(current);
    const record = current as Record<string, unknown>;

    for (const key of [
      "transaction",
      "txHash",
      "transactionHash",
      "hash",
      "reference",
      "paymentId",
    ]) {
      const value = record[key];
      if (typeof value === "string" && value.length > 0) return value;
    }

    Object.values(record).forEach((value) => {
      if (value && typeof value === "object") {
        queue.push(value);
      }
    });
  }

  return null;
}

function isLikelyHash(value: string | null | undefined) {
  return Boolean(value && /^0x[a-fA-F0-9]{64}$/.test(value));
}

function toExplorerUrl(hash: string) {
  return `${xLayer.blockExplorers.default.url}/tx/${hash}`;
}

function toAddressUrl(address: string) {
  return `${xLayer.blockExplorers.default.url}/address/${address}`;
}

function clampBudgetUsd(value: number) {
  if (!Number.isFinite(value)) return 100;
  return Math.min(Math.max(value, MIN_BUDGET_USD), MAX_BUDGET_USD);
}

function paymentLabelFor(
  asset: PaymentAsset,
  options: Array<{
    assetSymbol: PaymentAsset;
    displayPrice: string;
    network: string;
  }>,
) {
  return (
    options.find((option) => option.assetSymbol === asset)?.displayPrice ||
    `0.05 ${asset}`
  );
}

function parseDisplayPriceAmount(displayPrice: string | undefined) {
  if (!displayPrice) return 0;
  const match = displayPrice.match(/([0-9]+(?:\.[0-9]+)?)/);
  return match ? Number(match[1]) : 0;
}

function chainIdForPaymentNetwork(network?: string) {
  if (network === "Base") {
    return 8453;
  }

  if (network === XLAYER_NAME || network === "X Layer") {
    return XLAYER_CHAIN_ID;
  }

  return null;
}

function assetAddressForSymbol(symbol: string) {
  if (symbol === "USDT") {
    return XLAYER_USDT_ADDRESS;
  }

  return XLAYER_USDC_ADDRESS;
}

function stableSymbolForPaymentAsset(asset: PaymentAsset) {
  return asset === "USDT" ? "USDT" : "USDC";
}

function agentStatusLabel(status: AgentStatus) {
  if (status === "ready") return "Ready";
  if (status === "watch") return "Watch";
  return "Pending";
}

function agentVerdictTone(verdict: string) {
  const v = verdict.toLowerCase();
  if (v.startsWith("reduced") || v.startsWith("overr")) {
    return {
      badge: "border-orange-200 bg-orange-50 text-orange-700",
      label: "OVERRIDE",
    };
  }
  if (
    v.startsWith("vetoed") ||
    v.startsWith("veto") ||
    v.startsWith("blocked")
  ) {
    return {
      badge: "border-rose-200 bg-rose-50 text-rose-700",
      label: "VETOED",
    };
  }
  if (v.startsWith("cleared") || v.startsWith("basket")) {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      label: "CLEARED",
    };
  }
  return null;
}

function agentStatusTone(status: AgentStatus) {
  if (status === "ready") {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      card: "border-emerald-100 bg-emerald-50/60",
    };
  }

  if (status === "watch") {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      card: "border-amber-100 bg-amber-50/60",
    };
  }

  return {
    badge: "border-slate-200 bg-slate-100 text-slate-600",
    card: "border-slate-200 bg-slate-50",
  };
}

function toRpcQuantity(value?: string | number | bigint | null) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith("0x")) {
      return trimmed as `0x${string}`;
    }
    return `0x${BigInt(trimmed).toString(16)}` as `0x${string}`;
  }

  return `0x${BigInt(value).toString(16)}` as `0x${string}`;
}

function ensureHexData(value?: string) {
  if (!value) return "0x";
  return value.startsWith("0x") ? value : `0x${value}`;
}

async function getFundingStatus(
  walletAddress: string,
  requiredStable: number,
  stableSymbol = "USDT",
): Promise<FundingStatus> {
  const address = walletAddress as `0x${string}`;
  const stableAddress = assetAddressForSymbol(stableSymbol);

  const [okbBalanceWei, stableBalanceRaw] = await Promise.all([
    xLayerClient.getBalance({ address }),
    xLayerClient.readContract({
      address: stableAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    }),
  ]);

  const okbBalance = Number(
    formatUnits(okbBalanceWei, xLayer.nativeCurrency.decimals),
  );
  const stableBalance = Number(formatUnits(stableBalanceRaw, 6));

  return {
    okbBalance,
    stableBalance,
    stableSymbol,
    hasEnoughOkb: okbBalance >= MIN_OKB_GAS_BUFFER,
    hasEnoughStable: stableBalance >= requiredStable,
  };
}

async function switchWalletChain(wallet: any, chainId: number) {
  if (!wallet) return;

  if (typeof wallet.switchChain === "function") {
    await wallet.switchChain(chainId);
    return;
  }

  const provider = await wallet.getEthereumProvider?.();
  if (!provider?.request) return;

  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: `0x${chainId.toString(16)}` }],
  });
}

async function sendEvmTransaction(
  wallet: any,
  transaction: ExecutionTransaction,
) {
  const provider = await wallet.getEthereumProvider();
  const hash = (await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: wallet.address,
        to: transaction.to,
        data: ensureHexData(transaction.data),
        value: toRpcQuantity(transaction.value) || "0x0",
        ...(toRpcQuantity(transaction.gas)
          ? { gas: toRpcQuantity(transaction.gas) }
          : {}),
        ...(toRpcQuantity(transaction.gasPrice)
          ? { gasPrice: toRpcQuantity(transaction.gasPrice) }
          : {}),
        ...(toRpcQuantity(transaction.maxFeePerGas)
          ? { maxFeePerGas: toRpcQuantity(transaction.maxFeePerGas) }
          : {}),
        ...(toRpcQuantity(transaction.maxPriorityFeePerGas)
          ? {
              maxPriorityFeePerGas: toRpcQuantity(
                transaction.maxPriorityFeePerGas,
              ),
            }
          : {}),
      },
    ],
  })) as string;

  await xLayerClient.waitForTransactionReceipt({
    hash: hash as `0x${string}`,
  });

  return hash;
}

export default function FomoCopilotPage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = (key: string, vars?: Record<string, string | number>) =>
    tt(i18n[lang], key, vars);

  const [budgetUsd, setBudgetUsd] = useState(100);
  const [riskMode, setRiskMode] = useState<RiskMode>("balanced");
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>("3d");
  const [selectedPaymentAsset, setSelectedPaymentAsset] =
    useState<PaymentAsset>("USDT");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [premiumPlan, setPremiumPlan] = useState<PremiumPlanResponse | null>(
    null,
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [shareImageLoading, setShareImageLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>(
    [],
  );
  const [fundingStatus, setFundingStatus] = useState<FundingStatus | null>(
    null,
  );
  const [evmSigner, setEvmSigner] = useState<EvmTypedDataSigner | null>(null);

  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { signTypedData } = useSignTypedData();

  const embeddedEvmWallet = wallets?.find(
    (wallet: any) =>
      wallet.walletClientType === "privy" &&
      (!wallet.type || wallet.type === "ethereum"),
  ) as any;

  useEffect(() => {
    if (embeddedEvmWallet?.address) {
      setEvmSigner(
        createPrivyEvmSigner(embeddedEvmWallet.address, signTypedData),
      );
      return;
    }

    setEvmSigner(null);
  }, [embeddedEvmWallet?.address, signTypedData]);

  const {
    unlockWithPayment,
    isLoading: paymentLoading,
    error: paymentError,
    lastPayment,
  } = usePremiumActionX402({
    evmSigner: evmSigner || undefined,
    preferredAsset: selectedPaymentAsset,
  });

  const paymentOptions = useMemo(() => {
    if (preview?.paymentRail.options?.length) {
      return preview.paymentRail.options;
    }

    if (preview?.paymentRail.assetSymbol) {
      return [
        {
          assetSymbol: preview.paymentRail.assetSymbol as PaymentAsset,
          displayPrice: preview.paymentRail.displayPrice,
          network: preview.paymentRail.network,
        },
      ];
    }

    return [] as Array<{
      assetSymbol: PaymentAsset;
      displayPrice: string;
      network: string;
    }>;
  }, [preview]);

  useEffect(() => {
    if (!paymentOptions.length) return;
    if (
      !paymentOptions.some(
        (option) => option.assetSymbol === selectedPaymentAsset,
      )
    ) {
      setSelectedPaymentAsset(paymentOptions[0].assetSymbol);
    }
  }, [paymentOptions, selectedPaymentAsset]);

  const normalizedBudgetUsd = useMemo(
    () => clampBudgetUsd(budgetUsd),
    [budgetUsd],
  );

  const requestPayload = useMemo(
    () => ({
      budgetUsd: normalizedBudgetUsd,
      riskMode,
      timeHorizon,
      language: "zh" as const,
      walletAddress: embeddedEvmWallet?.address || undefined,
      paymentAsset: selectedPaymentAsset,
    }),
    [
      embeddedEvmWallet?.address,
      normalizedBudgetUsd,
      riskMode,
      selectedPaymentAsset,
      timeHorizon,
    ],
  );

  const previewRequestPayload = useMemo(
    () => ({
      budgetUsd: normalizedBudgetUsd,
      riskMode,
      timeHorizon,
      language: "zh" as const,
      paymentAsset: selectedPaymentAsset,
    }),
    [normalizedBudgetUsd, riskMode, selectedPaymentAsset, timeHorizon],
  );

  const paymentReference = useMemo(
    () => findPaymentReference(lastPayment || premiumPlan?.payment || null),
    [lastPayment, premiumPlan?.payment],
  );
  const paymentExplorerUrl = useMemo(
    () =>
      paymentReference && isLikelyHash(paymentReference)
        ? toExplorerUrl(paymentReference)
        : null,
    [paymentReference],
  );

  const paymentLabel = useMemo(
    () => paymentLabelFor(selectedPaymentAsset, paymentOptions),
    [paymentOptions, selectedPaymentAsset],
  );

  const selectedPaymentOption = useMemo(
    () =>
      paymentOptions.find(
        (option) => option.assetSymbol === selectedPaymentAsset,
      ) || null,
    [paymentOptions, selectedPaymentAsset],
  );

  const tradeInputAsset =
    premiumPlan?.plan.tradeRail?.inputAssetSymbol || "USDT";
  const tradeGasAsset =
    premiumPlan?.plan.tradeRail?.gasAssetSymbol || XLAYER_GAS_SYMBOL;

  const sharePayload = useMemo(() => {
    if (!premiumPlan) return null;

    const tradeHashes = executionResults
      .map((item) => item.hash)
      .filter((value): value is string => Boolean(value));
    const approvalHashes = executionResults.flatMap(
      (item) => item.approvalHashes || [],
    );

    return buildFomoSharePayload({
      budgetUsd,
      riskMode,
      timeHorizon,
      provider: premiumPlan.provider || "OKX OnchainOS",
      paymentLabel: premiumPlan.plan.paymentRail.displayPrice || paymentLabel,
      theme: premiumPlan.plan.theme,
      title: premiumPlan.plan.shareCard.title,
      caption: premiumPlan.plan.shareCard.caption,
      confidence: premiumPlan.plan.confidence,
      fomoScore: premiumPlan.plan.fomoScore,
      estimatedSlippagePct: premiumPlan.plan.estimatedSlippagePct,
      estimatedFeesUsd: premiumPlan.plan.estimatedFeesUsd,
      preparedSwapCount: premiumPlan.plan.executionReadiness.preparedSwapCount,
      executedSwapCount: executionResults.filter(
        (item) => item.status === "success",
      ).length,
      totalSwapCount: premiumPlan.plan.executionReadiness.totalSwapCount,
      paymentReference,
      paymentExplorerUrl,
      tradeHashes,
      approvalHashes,
      agentLoop: (premiumPlan.plan.agentLoop || []).map((agent) => ({
        name: agent.name,
        status: agent.status,
        verdict: agent.verdict,
      })),
      legs: premiumPlan.plan.allocation.map((item) => ({
        symbol: item.symbol,
        tag: item.tag,
        amountUsd: item.amountUsd,
        weight: item.weight,
        route: item.quote.routeNames.slice(0, 2).join(" / ") || "OKX route",
        txReady: item.quote.txReady,
      })),
    });
  }, [
    budgetUsd,
    executionResults,
    paymentLabel,
    paymentExplorerUrl,
    paymentReference,
    premiumPlan,
    riskMode,
    timeHorizon,
  ]);

  const shareImagePath = useMemo(() => {
    if (!sharePayload) return null;
    const params = new URLSearchParams();
    params.set("payload", serializeFomoSharePayload(sharePayload));
    return `/api/fomo-copilot/share-image?${params.toString()}`;
  }, [sharePayload]);

  const shareImageUrl = useMemo(() => {
    if (!shareImagePath || typeof window === "undefined") return shareImagePath;
    return new URL(shareImagePath, window.location.origin).toString();
  }, [shareImagePath]);

  const walletExplorerUrl = useMemo(() => {
    if (!embeddedEvmWallet?.address) return null;
    return toAddressUrl(embeddedEvmWallet.address);
  }, [embeddedEvmWallet?.address]);

  const minimumBudgetApplied = budgetUsd !== normalizedBudgetUsd;

  const fundingShortfallMessage = useMemo(() => {
    if (!fundingStatus) return null;

    const missingParts: string[] = [];
    if (!fundingStatus.hasEnoughStable) {
      const stableGap = Math.max(
        0,
        normalizedBudgetUsd - fundingStatus.stableBalance,
      );
      missingParts.push(
        `+${stableGap.toFixed(2)} ${fundingStatus.stableSymbol}`,
      );
    }
    if (!fundingStatus.hasEnoughOkb) {
      const okbGap = Math.max(0, MIN_OKB_GAS_BUFFER - fundingStatus.okbBalance);
      missingParts.push(`+${okbGap.toFixed(4)} ${XLAYER_GAS_SYMBOL}`);
    }

    if (!missingParts.length) return null;
    return missingParts.join(" + ");
  }, [fundingStatus, normalizedBudgetUsd]);

  const primaryLoading = previewLoading || paymentLoading || executing;
  const payDisabled =
    primaryLoading ||
    (authenticated && !embeddedEvmWallet?.address) ||
    Boolean(fundingShortfallMessage);
  const successfulExecutions = executionResults.filter(
    (item) => item.status === "success",
  ).length;
  const failedExecutions = executionResults.filter(
    (item) => item.status === "error",
  ).length;
  const approvalExecutionCount = executionResults.reduce(
    (count, item) => count + (item.approvalHashes?.length || 0),
    0,
  );
  const totalTradableLegs =
    premiumPlan?.plan.executionReadiness.totalSwapCount || 0;
  const allExecutionsCompleted =
    totalTradableLegs > 0 &&
    successfulExecutions >= totalTradableLegs &&
    failedExecutions === 0;
  const hasExecutionErrors = failedExecutions > 0;

  const refreshFundingStatus = async (
    stableSymbol = "USDT",
    requiredAmount = normalizedBudgetUsd,
  ) => {
    if (!embeddedEvmWallet?.address) return;

    const status = await getFundingStatus(
      embeddedEvmWallet.address,
      requiredAmount,
      stableSymbol,
    );
    setFundingStatus(status);
    return status;
  };

  const handleGeneratePreview = async () => {
    setPreviewLoading(true);
    setError(null);
    setPremiumPlan(null);
    setExecutionResults([]);
    setFundingStatus(null);
    setShareCopied(false);

    try {
      const response = await fetch("/api/fomo/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(previewRequestPayload),
      });

      const data = (await response.json()) as PreviewResponse & {
        error?: string;
      };
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate preview");
      }

      setPreview(data);
      if (normalizedBudgetUsd !== budgetUsd) {
        setBudgetUsd(normalizedBudgetUsd);
      }

      if (embeddedEvmWallet?.address) {
        try {
          await refreshFundingStatus(
            stableSymbolForPaymentAsset(selectedPaymentAsset),
          );
        } catch (fundingError) {
          console.error(
            "[FomoCopilot] Funding refresh failed after preview:",
            fundingError,
          );
        }
      }
    } catch (requestError: any) {
      setError(requestError?.message || "Failed to generate preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const executePreparedSwaps = async (
    plan: PremiumPlanResponse,
    options?: { retryOnly?: boolean },
  ) => {
    if (!embeddedEvmWallet) {
      throw new Error("EVM wallet required for X Layer trade execution");
    }

    const retryOnly = options?.retryOnly ?? false;
    const currentResults = retryOnly ? [...executionResults] : [];
    const resultMap = new Map(
      currentResults.map((item) => [item.symbol, item]),
    );
    const tradableLegs = plan.plan.allocation.filter(
      (leg) => leg.symbol !== tradeInputAsset,
    );

    setExecuting(true);
    if (!retryOnly) {
      setExecutionResults([]);
    }

    await switchWalletChain(embeddedEvmWallet, XLAYER_CHAIN_ID);

    for (const leg of tradableLegs) {
      const previous = resultMap.get(leg.symbol);
      if (retryOnly && previous?.status === "success") {
        continue;
      }

      const execution = leg.quote.execution;
      const approvalTransactions = execution?.approvalTransactions || [];
      const mainTransaction = execution?.transaction || null;

      if (!mainTransaction) {
        resultMap.set(leg.symbol, {
          symbol: leg.symbol,
          status: "error",
          error: leg.quote.txReason || "No executable transaction",
        });
        setExecutionResults(Array.from(resultMap.values()));
        continue;
      }

      try {
        const approvalHashes: string[] = [];
        for (const approvalTransaction of approvalTransactions) {
          const approvalHash = await sendEvmTransaction(
            embeddedEvmWallet,
            approvalTransaction,
          );
          approvalHashes.push(approvalHash);
        }

        const hash = await sendEvmTransaction(
          embeddedEvmWallet,
          mainTransaction,
        );
        resultMap.set(leg.symbol, {
          symbol: leg.symbol,
          status: "success",
          hash,
          approvalHashes,
        });
        setExecutionResults(Array.from(resultMap.values()));
      } catch (executionError: any) {
        resultMap.set(leg.symbol, {
          symbol: leg.symbol,
          status: "error",
          error: executionError?.message || "Execution failed",
        });
        setExecutionResults(Array.from(resultMap.values()));
      }
    }

    setExecuting(false);

    const failedCount = tradableLegs.filter(
      (leg) => resultMap.get(leg.symbol)?.status === "error",
    ).length;
    if (failedCount > 0) {
      throw new Error(
        failedCount === tradableLegs.length
          ? "Payment completed but X Layer trade execution failed"
          : "Payment completed but some X Layer trades failed",
      );
    }
  };

  const handlePayAndExecute = async () => {
    setError(null);

    if (!authenticated) {
      login();
      return;
    }

    if (!ready) {
      setError("Wallet not ready, please try again");
      return;
    }

    if (!embeddedEvmWallet?.address) {
      setError("EVM wallet required for payment and execution");
      return;
    }

    try {
      const tradeStableSymbol =
        stableSymbolForPaymentAsset(selectedPaymentAsset);
      const paymentAmount = parseDisplayPriceAmount(paymentLabel);
      const requiredStableBeforePayment =
        selectedPaymentOption?.network === XLAYER_NAME &&
        selectedPaymentAsset === tradeStableSymbol
          ? normalizedBudgetUsd + paymentAmount
          : normalizedBudgetUsd;

      const status = await refreshFundingStatus(
        tradeStableSymbol,
        requiredStableBeforePayment,
      );
      const missingParts: string[] = [];
      if (status && !status.hasEnoughStable) {
        const stableGap = Math.max(
          0,
          requiredStableBeforePayment - status.stableBalance,
        );
        missingParts.push(`+${stableGap.toFixed(2)} ${status.stableSymbol}`);
      }
      if (status && !status.hasEnoughOkb) {
        const okbGap = Math.max(0, MIN_OKB_GAS_BUFFER - status.okbBalance);
        missingParts.push(`+${okbGap.toFixed(4)} ${XLAYER_GAS_SYMBOL}`);
      }

      if (missingParts.length > 0) {
        throw new Error(`Fund X Layer wallet: ${missingParts.join(" + ")}`);
      }

      const paymentChainId = chainIdForPaymentNetwork(
        selectedPaymentOption?.network,
      );
      if (paymentChainId) {
        await switchWalletChain(embeddedEvmWallet, paymentChainId);
      }

      const result = await unlockWithPayment(
        "/api/premium/fomo-plan",
        requestPayload,
      );

      if (!result.success || !result.data?.success) {
        throw new Error(result.error || result.data?.error || "Payment failed");
      }

      const plan = result.data as PremiumPlanResponse;
      setPremiumPlan(plan);
      await refreshFundingStatus(
        plan.plan.tradeRail?.inputAssetSymbol || "USDT",
      );
      await executePreparedSwaps(plan);
    } catch (requestError: any) {
      setExecuting(false);
      setError(
        requestError?.message ||
          paymentError ||
          "Payment or execution error, please retry",
      );
    }
  };

  const handleRetryPendingTransactions = async () => {
    if (!premiumPlan) return;

    try {
      setError(null);
      await executePreparedSwaps(premiumPlan, { retryOnly: true });
    } catch (requestError: any) {
      setError(requestError?.message || "Retry failed");
    }
  };

  const handleDownloadShareImage = async () => {
    if (!shareImagePath) return;

    setShareImageLoading(true);
    setError(null);

    try {
      const response = await fetch(shareImagePath);
      if (!response.ok) throw new Error("Failed to generate share image");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "miraix-rotation-desk.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (requestError: any) {
      setError(requestError?.message || "Failed to generate share image");
    } finally {
      setShareImageLoading(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareImageUrl) return;

    try {
      await navigator.clipboard.writeText(shareImageUrl);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch (requestError: any) {
      setError(requestError?.message || "Failed to copy share link");
    }
  };

  const previewAgentLoop = preview?.preview.metrics.agentLoop || [];

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        <section className="relative overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.3),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(45,212,191,0.22),_transparent_24%),radial-gradient(circle_at_50%_80%,_rgba(139,92,246,0.15),_transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_65%,#111827_100%)] px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:px-8 sm:py-10">
          {/* Top bar: hackathon badge + language toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
              <Zap className="h-3.5 w-3.5 text-amber-300" />
              {t("hackathonBadge")}
            </div>
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "zh" : "en")}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/20"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === "en" ? "中文" : "EN"}
            </button>
          </div>

          {/* Headline + architecture grid */}
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-100">
                <Sparkles className="h-3.5 w-3.5" />
                {t("heroSubtitle")}
              </div>
              <h1 className="mt-4 whitespace-pre-line text-3xl font-bold tracking-tight sm:text-[2.8rem] sm:leading-[1.15]">
                {t("heroHeadline")}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-[15px]">
                {t("heroDesc")}
              </p>

              {/* Scoring criteria pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {(
                  [
                    ["scoreIntegration", "×0.25"],
                    ["scoreUtility", "×0.25"],
                    ["scoreInnovation", "×0.30"],
                    ["scoreReproducibility", "×0.20"],
                  ] as const
                ).map(([key, weight]) => (
                  <div
                    key={key}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      key === "scoreInnovation"
                        ? "border-amber-400/40 bg-amber-400/15 text-amber-200"
                        : "border-white/10 bg-white/8 text-slate-200"
                    }`}
                  >
                    {t(key)}{" "}
                    <span className="ml-1 text-[10px] text-slate-400">
                      {weight}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tech stack badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    "techXLayer",
                    "techOnchainOS",
                    "techX402",
                    "techLangGraph",
                  ] as const
                ).map((key) => (
                  <div
                    key={key}
                    className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-medium text-sky-200"
                  >
                    {t(key)}
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture flow card */}
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-200">
                {t("archFlowTitle")}
              </div>
              <div className="mt-4 grid gap-2">
                {/* Step 1: Market API */}
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  <span className="mr-2 text-sky-400">1.</span>
                  {t("archStep1")}
                  <span className="ml-2 text-[10px] text-slate-500">
                    → live prices
                  </span>
                </div>
                {/* Step 2: Strategist */}
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  <span className="mr-2 text-emerald-400">2.</span>
                  {t("archStep2")}
                  <span className="ml-2 text-[10px] text-slate-500">
                    → basket proposal
                  </span>
                </div>
                {/* Step 3: Risk Agent with OVERRIDE highlight */}
                <div className="rounded-2xl border border-orange-400/30 bg-orange-400/8 px-4 py-3 text-sm text-slate-200">
                  <span className="mr-2 text-orange-400">3.</span>
                  {t("archStep3")}
                  <span className="ml-2 inline-flex items-center rounded border border-orange-400/40 bg-orange-400/15 px-1.5 py-0.5 text-[10px] font-bold text-orange-300">
                    {t("archOverride")}
                  </span>
                </div>
                {/* Step 4: Execution Agent */}
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  <span className="mr-2 text-violet-400">4.</span>
                  {t("archStep4")}
                  <span className="ml-2 text-[10px] text-slate-500">
                    → {t("archDexRoute")}
                  </span>
                </div>
                {/* Step 5: x402 + Broadcast */}
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  <span className="mr-2 text-teal-400">5.</span>
                  {t("archPayment")} → {t("archStep5")}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <div>
                <div className="text-sm font-medium text-slate-700">
                  {t("budget")}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {budgetPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBudgetUsd(preset)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        budgetUsd === preset
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {preset} USDT
                    </button>
                  ))}
                  <div className="flex min-w-[130px] items-center rounded-full border border-slate-200 px-4 py-2">
                    <span className="mr-2 text-sm text-slate-500">$</span>
                    <input
                      type="number"
                      min={MIN_BUDGET_USD}
                      max={MAX_BUDGET_USD}
                      value={budgetUsd}
                      onChange={(event) =>
                        setBudgetUsd(
                          clampBudgetUsd(Number(event.target.value) || 0),
                        )
                      }
                      className="w-full bg-transparent text-sm font-medium outline-none"
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {t("budgetMin")}
                  {minimumBudgetApplied ? ` ${t("budgetMinApplied")}` : ""}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700">
                  {t("riskMode")}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {riskOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRiskMode(option.value)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        riskMode === option.value
                          ? "border-sky-500 bg-sky-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-950">
                        {t(option.labelKey)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {t(option.detailKey)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700">
                  {t("horizon")}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {horizonOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTimeHorizon(option.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        timeHorizon === option.value
                          ? "border-sky-500 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {t(option.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={previewLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {previewLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {t("generatePreview")}
              </button>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <Wallet className="h-4 w-4" />
                {t("walletAndRail")}
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Embedded EVM Wallet
                  </div>
                  <div className="mt-2 font-medium text-slate-950">
                    {truncateMiddle(embeddedEvmWallet?.address, 8, 6)}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Payment Rail
                  </div>
                  <div className="mt-2 font-medium text-slate-950">
                    {selectedPaymentOption
                      ? `${selectedPaymentOption.assetSymbol} · ${selectedPaymentOption.network}`
                      : t("waitingPreview")}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Trade Rail
                  </div>
                  <div className="mt-2 font-medium text-slate-950">
                    X Layer · {tradeInputAsset} + {tradeGasAsset}
                  </div>
                </div>
              </div>
              {!authenticated && (
                <button
                  type="button"
                  onClick={login}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  {t("loginPrivy")}
                </button>
              )}
              {walletExplorerUrl && (
                <a
                  href={walletExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  {t("openWalletExplorer")}
                </a>
              )}
            </div>
          </div>
        </section>

        {(error || paymentError) && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error || paymentError}
          </div>
        )}

        <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-6">
          {!preview ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <div className="text-lg font-semibold text-slate-950">
                {t("previewEmptyTitle")}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {t("previewEmptyDesc")}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[24px] bg-slate-950 p-6 text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                      Free Preview
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                      {preview.preview.theme}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                      {preview.preview.summary}
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold">
                    {normalizedBudgetUsd}U on X Layer
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      FOMO
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                      {preview.preview.metrics.fomoScore}/100
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Confidence
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                      {preview.preview.metrics.confidence}%
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Slippage
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                      {preview.preview.metrics.estimatedSlippagePct}%
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Estimated fee
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                      {usdFormatter.format(
                        preview.preview.metrics.estimatedFeesUsd,
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {previewAgentLoop.length > 0 && (
                <div className="grid gap-3 lg:grid-cols-3">
                  {previewAgentLoop.map((agent) => {
                    const tone = agentStatusTone(agent.status);
                    const verdictTone = agentVerdictTone(agent.verdict);
                    return (
                      <div
                        key={agent.id}
                        className={`rounded-[24px] border p-5 ${tone.card}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-950">
                              {agent.name}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {agent.role}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {verdictTone && (
                              <div
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${verdictTone.badge}`}
                              >
                                {verdictTone.label}
                              </div>
                            )}
                            <div
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.badge}`}
                            >
                              {agentStatusLabel(agent.status)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 text-base font-semibold text-slate-950">
                          {agent.verdict}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-600">
                          {agent.detail}
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          {agent.metrics.map((metric) => (
                            <div
                              key={`${agent.id}-${metric.label}`}
                              className="rounded-2xl border border-white/60 bg-white/70 px-3 py-3"
                            >
                              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                {metric.label}
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-950">
                                {metric.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                {preview.preview.marketPulse.slice(0, 3).map((token) => (
                  <div
                    key={`${token.symbol}-${token.tag}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-lg font-semibold text-slate-950">
                        {token.symbol}
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {Math.round(token.weight * 100)}%
                      </div>
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-700">
                      {token.tag}
                    </div>
                    <div className="mt-3 text-sm text-slate-700">
                      {token.priceLabel}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {token.change24hLabel} / 24h
                    </div>
                  </div>
                ))}
              </div>

              {preview.paymentRail.enabled && (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-slate-950">
                        {t("payNowTitle")}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {t("payNowDesc")}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {paymentOptions.map((option) => (
                        <button
                          key={`${option.assetSymbol}-${option.network}`}
                          type="button"
                          onClick={() =>
                            setSelectedPaymentAsset(option.assetSymbol)
                          }
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            selectedPaymentAsset === option.assetSymbol
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          {option.assetSymbol} · {option.network}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-950">
                        {t("preExecCheck")}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                          Payment: {paymentLabel}
                        </div>
                        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                          Trade: X Layer
                        </div>
                        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                          Wallet:{" "}
                          {embeddedEvmWallet?.address ? "Connected" : "Missing"}
                        </div>
                      </div>

                      {fundingStatus && (
                        <div className="mt-4 text-sm text-slate-600">
                          {t("walletBalanceLabel")}{" "}
                          {fundingStatus.stableBalance.toFixed(2)}{" "}
                          {fundingStatus.stableSymbol} /{" "}
                          {fundingStatus.okbBalance.toFixed(4)}{" "}
                          {XLAYER_GAS_SYMBOL}
                        </div>
                      )}
                      {fundingShortfallMessage && (
                        <div className="mt-2 text-sm font-medium text-amber-700">
                          {t("insufficientBalance")}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handlePayAndExecute}
                      disabled={payDisabled}
                      className="inline-flex min-h-[152px] flex-col items-center justify-center gap-3 rounded-[24px] bg-slate-950 px-5 py-5 text-center text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {primaryLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Zap className="h-6 w-6" />
                      )}
                      <div className="text-lg font-semibold">
                        {!authenticated
                          ? t("loginAndPay")
                          : executing
                            ? t("executingLabel")
                            : fundingShortfallMessage
                              ? `${t("fundFirst")} ${fundingShortfallMessage}`
                              : t("payAndExecute", { price: paymentLabel })}
                      </div>
                      <div className="text-sm text-slate-300">
                        {selectedPaymentOption
                          ? t("railPayExec", {
                              network: selectedPaymentOption.network,
                            })
                          : t("railWaiting")}
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {premiumPlan && (
          <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                    allExecutionsCompleted
                      ? "bg-emerald-50 text-emerald-700"
                      : hasExecutionErrors
                        ? "bg-amber-50 text-amber-700"
                        : "bg-sky-50 text-sky-700"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {allExecutionsCompleted
                    ? t("txCompleted")
                    : hasExecutionErrors
                      ? t("partialBroadcast")
                      : t("executionUnlocked")}
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                  {premiumPlan.plan.theme}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {premiumPlan.plan.summary}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {t("broadcasted")}
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-950">
                  {successfulExecutions}/{totalTradableLegs}
                </div>
              </div>
            </div>

            <div
              className={`mt-5 rounded-[24px] border px-5 py-4 ${
                allExecutionsCompleted
                  ? "border-emerald-200 bg-emerald-50"
                  : hasExecutionErrors
                    ? "border-amber-200 bg-amber-50"
                    : "border-sky-200 bg-sky-50"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    {allExecutionsCompleted
                      ? t("premiumLoopComplete")
                      : hasExecutionErrors
                        ? t("partialSuccess", {
                            success: successfulExecutions,
                            failed: failedExecutions,
                          })
                        : t("broadcastingTx")}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {premiumPlan.plan.proofBundle.summary}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                  <div className="rounded-full border border-white/70 bg-white/80 px-3 py-2">
                    Paid via {premiumPlan.plan.paymentRail.displayPrice}
                  </div>
                  {paymentReference &&
                    (paymentExplorerUrl ? (
                      <a
                        href={paymentExplorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/80 px-3 py-2"
                      >
                        Payment {truncateMiddle(paymentReference, 10, 8)}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <div className="rounded-full border border-white/70 bg-white/80 px-3 py-2">
                        Ref {truncateMiddle(paymentReference, 10, 8)}
                      </div>
                    ))}
                  <div className="rounded-full border border-white/70 bg-white/80 px-3 py-2">
                    {premiumPlan.plan.tradeRail?.network || XLAYER_NAME}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-4">
              {[
                {
                  label: "Confidence",
                  value: `${premiumPlan.plan.confidence}%`,
                  detail: t("confidenceDetail"),
                },
                {
                  label: "Max Slippage",
                  value: `${premiumPlan.plan.estimatedSlippagePct}%`,
                  detail: t("slippageDetail"),
                },
                {
                  label: "Tx Ready",
                  value: `${premiumPlan.plan.proofBundle.txReadyCount}/${premiumPlan.plan.proofBundle.totalTradableLegs}`,
                  detail: t("txReadyDetail"),
                },
                {
                  label: "Routes",
                  value: `${premiumPlan.plan.proofBundle.routeCount}`,
                  detail: t("routesDetail"),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-slate-950">
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <ShieldCheck className="h-4 w-4" />
                  {t("agentDecisionLog")}
                </div>
                <div className="mt-4 space-y-3">
                  {(premiumPlan.plan.agentLoop || []).map((agent) => {
                    const tone = agentStatusTone(agent.status);
                    const verdictTone = agentVerdictTone(agent.verdict);
                    return (
                      <div
                        key={agent.id}
                        className={`rounded-2xl border p-4 ${tone.card}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-950">
                              {agent.name}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {agent.role}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {verdictTone && (
                              <div
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${verdictTone.badge}`}
                              >
                                {verdictTone.label}
                              </div>
                            )}
                            <div
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.badge}`}
                            >
                              {agentStatusLabel(agent.status)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 text-base font-semibold text-slate-950">
                          {agent.verdict}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-600">
                          {agent.detail}
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          {agent.metrics.map((metric) => (
                            <div
                              key={`${agent.id}-${metric.label}`}
                              className="rounded-2xl border border-white/70 bg-white p-3"
                            >
                              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                {metric.label}
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-950">
                                {metric.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-semibold text-slate-950">
                  {t("executionProofBoard")}
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Wallet
                    </div>
                    <div className="mt-2 font-medium text-slate-950">
                      {truncateMiddle(
                        premiumPlan.plan.proofBundle.walletAddress,
                        8,
                        6,
                      )}
                    </div>
                    <div className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                      Payment Proof
                    </div>
                    {paymentReference ? (
                      paymentExplorerUrl ? (
                        <a
                          href={paymentExplorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-2 font-medium text-slate-950"
                        >
                          {truncateMiddle(paymentReference, 12, 10)}
                          <ArrowUpRight className="h-4 w-4 text-slate-500" />
                        </a>
                      ) : (
                        <div className="mt-2 font-medium text-slate-950">
                          {truncateMiddle(paymentReference, 12, 10)}
                        </div>
                      )
                    ) : (
                      <div className="mt-2 font-medium text-emerald-700">
                        {t("x402Settled")}
                      </div>
                    )}
                    <div className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                      Trade Inputs
                    </div>
                    <div className="mt-2 font-medium text-slate-950">
                      {premiumPlan.plan.proofBundle.tradeInputAsset} +{" "}
                      {premiumPlan.plan.proofBundle.gasAssetSymbol}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Summary
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">
                      {premiumPlan.plan.proofBundle.summary}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                        Quote provider:{" "}
                        {premiumPlan.plan.proofBundle.quoteProvider}
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                        Payment network:{" "}
                        {premiumPlan.plan.proofBundle.paymentRailNetwork}
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                        Reserve: {premiumPlan.plan.proofBundle.reserveWeightPct}
                        %
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                        Swaps: {successfulExecutions}/{totalTradableLegs}
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                        Approvals: {approvalExecutionCount}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {(premiumPlan.plan.proofBundle.actions || []).map(
                    (action) => {
                      const result = executionResults.find(
                        (entry) => entry.symbol === action.symbol,
                      );

                      return (
                        <div
                          key={`proof-${action.symbol}`}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-950">
                                {action.symbol} ·{" "}
                                {usdFormatter.format(action.amountUsd)}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {action.route}
                              </div>
                            </div>
                            <div
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                result?.status === "success"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : result?.status === "error"
                                    ? "bg-rose-50 text-rose-700"
                                    : action.txReady
                                      ? "bg-sky-50 text-sky-700"
                                      : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {result?.status === "success"
                                ? "Broadcasted"
                                : result?.status === "error"
                                  ? "Failed"
                                  : action.txReady
                                    ? "Payload ready"
                                    : "Quote only"}
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                            {result?.hash ? (
                              <a
                                href={toExplorerUrl(result.hash)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-700"
                              >
                                {t("mainTx")}
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                                {result?.error || action.txReason}
                              </div>
                            )}
                            {(result?.approvalHashes || []).map((hash) => (
                              <a
                                key={`${action.symbol}-${hash}`}
                                href={toExplorerUrl(hash)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-700"
                              >
                                Approval
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {premiumPlan.plan.allocation.map((item) => {
                const legResult = executionResults.find(
                  (result) => result.symbol === item.symbol,
                );
                const isBufferLeg = item.symbol === tradeInputAsset;

                return (
                  <div
                    key={`${item.symbol}-${item.tag}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-slate-950">
                          {item.symbol}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.tag}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-950">
                          {usdFormatter.format(item.amountUsd)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {Math.round(item.weight * 100)}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-slate-700">
                      {item.quote.outputAmountFormatted} {item.symbol}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.quote.routeNames.slice(0, 2).join(" / ") ||
                        "OKX route"}
                    </div>
                    <div className="mt-3 text-xs">
                      {isBufferLeg ? (
                        <span className="text-slate-500">
                          {t("reserveHold")}
                        </span>
                      ) : legResult?.status === "success" ? (
                        <a
                          href={toExplorerUrl(legResult.hash!)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-emerald-700"
                        >
                          {t("broadcasted")}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      ) : legResult?.status === "error" ? (
                        <span className="text-rose-600">
                          {legResult.error || t("execFailed")}
                        </span>
                      ) : item.quote.txReady ? (
                        <span className="text-sky-700">Payload ready</span>
                      ) : (
                        <span className="text-slate-500">
                          {item.quote.txReason}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-950">
                    {t("shareTitle")}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {t("shareDesc")}
                  </div>
                </div>
                {hasExecutionErrors && (
                  <button
                    type="button"
                    onClick={handleRetryPendingTransactions}
                    disabled={executing}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                  >
                    {executing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}
                    {t("retryFailed")}
                  </button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDownloadShareImage}
                  disabled={shareImageLoading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  {shareImageLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {t("downloadImage")}
                </button>
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  <Copy className="h-4 w-4" />
                  {shareCopied ? t("copied") : t("copyImageLink")}
                </button>
                {shareImageUrl && (
                  <a
                    href={shareImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    {t("openImage")}
                  </a>
                )}
                {walletExplorerUrl && (
                  <a
                    href={walletExplorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    {t("viewWallet")}
                  </a>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
