"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy, useSignTypedData, useWallets } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { base58 } from "@scure/base";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import {
  buildFomoSharePayload,
  serializeFomoSharePayload,
} from "@/lib/fomoCopilotShare";
import { usePremiumActionX402 } from "@/src/usePremiumActionX402";

type RiskMode = "safe" | "balanced" | "degen";
type TimeHorizon = "today" | "3d" | "7d";
type PaymentAsset = "fxUSD" | "USDC";
const SOLANA_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const MIN_SOL_GAS_BUFFER = 0.003;

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
      priceLabel: string;
      change24hLabel: string;
    }>;
    metrics: {
      confidence: number;
      fomoScore: number;
      estimatedSlippagePct: number;
      estimatedFeesUsd: number;
    };
  };
  paymentRail: {
    enabled: boolean;
    assetSymbol: string;
    displayPrice: string;
    options?: Array<{
      assetSymbol: PaymentAsset;
      displayPrice: string;
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
      quote: {
        outputAmountFormatted: string;
        routeNames: string[];
        estimatedFeeUsd: number;
        priceImpactPct: number;
        txReady: boolean;
        txReason: string;
        txData: string;
      };
    }>;
    executionSteps: string[];
    executionReadiness: {
      provider: string;
      tradeWalletAddress: string | null;
      preparedSwapCount: number;
      totalSwapCount: number;
    };
    shareCard: {
      title: string;
      caption: string;
    };
    paymentRail: {
      assetSymbol: string;
      displayPrice: string;
      enabled: boolean;
    };
  };
  payment?: unknown;
}

interface ExecutionResult {
  symbol: string;
  status: "success" | "error";
  signature?: string;
  error?: string;
}

interface FundingStatus {
  solBalance: number;
  usdcBalance: number;
  hasEnoughSol: boolean;
  hasEnoughUsdc: boolean;
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

const budgetPresets = [50, 100, 300];
const MIN_BUDGET_USD = 1;
const MAX_BUDGET_USD = 10000;

const riskOptions: Array<{ value: RiskMode; label: string }> = [
  { value: "safe", label: "稳一点" },
  { value: "balanced", label: "平衡" },
  { value: "degen", label: "冲一点" },
];

const horizonOptions: Array<{ value: TimeHorizon; label: string }> = [
  { value: "today", label: "今天" },
  { value: "3d", label: "3天" },
  { value: "7d", label: "7天" },
];

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function truncateMiddle(value: string | null | undefined, start = 6, end = 4) {
  if (!value) return "未连接";
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
    if (!current || typeof current !== "object" || visited.has(current)) continue;

    visited.add(current);
    const record = current as Record<string, unknown>;

    for (const key of [
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

function toExplorerUrl(signature: string) {
  return `https://solscan.io/tx/${signature}`;
}

function decodeTransactionBytes(value: string) {
  const trimmed = value.trim();

  try {
    return Uint8Array.from(base58.decode(trimmed));
  } catch {
    const binary = window.atob(trimmed);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return window.btoa(binary);
}

async function solanaRpc(method: string, params: unknown[]) {
  const response = await fetch("/api/solana-rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || `Solana RPC ${method} failed`);
  }

  if (payload?.error) {
    throw new Error(
      payload.error?.message || payload.error?.data || `Solana RPC ${method} failed`,
    );
  }

  return payload.result;
}

async function getFundingStatus(
  walletAddress: string,
  requiredUsdc: number,
): Promise<FundingStatus> {
  const owner = new PublicKey(walletAddress);
  const usdcMint = new PublicKey(SOLANA_USDC_MINT);
  const usdcAta = getAssociatedTokenAddressSync(usdcMint, owner);

  const [solResult, usdcResult] = await Promise.all([
    solanaRpc("getBalance", [walletAddress]),
    solanaRpc("getTokenAccountBalance", [usdcAta.toBase58()]).catch(() => null),
  ]);

  const solBalance = Number(solResult?.value || 0) / 1_000_000_000;
  const usdcBalance = Number(usdcResult?.value?.uiAmount || 0);

  return {
    solBalance,
    usdcBalance,
    hasEnoughSol: solBalance >= MIN_SOL_GAS_BUFFER,
    hasEnoughUsdc: usdcBalance >= requiredUsdc,
  };
}

function paymentLabelFor(
  asset: PaymentAsset,
  options: Array<{ assetSymbol: PaymentAsset; displayPrice: string }>,
) {
  return options.find((option) => option.assetSymbol === asset)?.displayPrice || `0.05 ${asset}`;
}

function clampBudgetUsd(value: number) {
  if (!Number.isFinite(value)) return 100;
  return Math.min(Math.max(value, MIN_BUDGET_USD), MAX_BUDGET_USD);
}

export default function FomoCopilotPage() {
  const [budgetUsd, setBudgetUsd] = useState(100);
  const [riskMode, setRiskMode] = useState<RiskMode>("balanced");
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>("3d");
  const [selectedPaymentAsset, setSelectedPaymentAsset] =
    useState<PaymentAsset>("fxUSD");
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
  const [fundingStatus, setFundingStatus] = useState<FundingStatus | null>(null);
  const [evmSigner, setEvmSigner] = useState<EvmTypedDataSigner | null>(null);

  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { wallets: solanaWallets } = useSolanaWallets();
  const { signTypedData } = useSignTypedData();

  const embeddedEvmWallet = wallets?.find(
    (wallet: any) => wallet.walletClientType === "privy",
  ) as any;
  const embeddedSolanaWallet = solanaWallets?.find(
    (wallet: any) => wallet.walletClientType === "privy",
  ) as any;

  useEffect(() => {
    if (embeddedEvmWallet?.address) {
      setEvmSigner(createPrivyEvmSigner(embeddedEvmWallet.address, signTypedData));
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
        },
      ];
    }

    return [] as Array<{ assetSymbol: PaymentAsset; displayPrice: string }>;
  }, [preview]);

  useEffect(() => {
    if (!paymentOptions.length) return;
    if (!paymentOptions.some((option) => option.assetSymbol === selectedPaymentAsset)) {
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
      walletAddress: embeddedSolanaWallet?.address || undefined,
      paymentAsset: selectedPaymentAsset,
    }),
    [
      normalizedBudgetUsd,
      riskMode,
      timeHorizon,
      embeddedSolanaWallet?.address,
      selectedPaymentAsset,
    ],
  );

  const paymentReference = useMemo(
    () => findPaymentReference(lastPayment || premiumPlan?.payment || null),
    [lastPayment, premiumPlan?.payment],
  );

  const sharePayload = useMemo(() => {
    if (!premiumPlan) return null;

    return buildFomoSharePayload({
      budgetUsd,
      riskMode,
      timeHorizon,
      provider: premiumPlan.provider || "OKX OnchainOS",
      paymentLabel:
        premiumPlan.plan.paymentRail.displayPrice ||
        paymentLabelFor(selectedPaymentAsset, paymentOptions),
      theme: premiumPlan.plan.theme,
      title: premiumPlan.plan.shareCard.title,
      caption: premiumPlan.plan.shareCard.caption,
      confidence: premiumPlan.plan.confidence,
      fomoScore: premiumPlan.plan.fomoScore,
      estimatedSlippagePct: premiumPlan.plan.estimatedSlippagePct,
      estimatedFeesUsd: premiumPlan.plan.estimatedFeesUsd,
      preparedSwapCount: premiumPlan.plan.executionReadiness.preparedSwapCount,
      totalSwapCount: premiumPlan.plan.executionReadiness.totalSwapCount,
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
    paymentOptions,
    premiumPlan,
    riskMode,
    selectedPaymentAsset,
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

  const selectedPaymentLabel = paymentLabelFor(
    selectedPaymentAsset,
    paymentOptions,
  );

  const hasWallets = Boolean(embeddedEvmWallet?.address && embeddedSolanaWallet?.address);
  const minimumBudgetApplied = budgetUsd !== normalizedBudgetUsd;
  const fundingShortfallMessage = useMemo(() => {
    if (!fundingStatus) return null;

    const missingParts: string[] = [];
    if (!fundingStatus.hasEnoughUsdc) {
      const usdcGap = Math.max(0, normalizedBudgetUsd - fundingStatus.usdcBalance);
      missingParts.push(`补 ${usdcGap.toFixed(2)} USDC`);
    }
    if (!fundingStatus.hasEnoughSol) {
      const solGap = Math.max(0, MIN_SOL_GAS_BUFFER - fundingStatus.solBalance);
      missingParts.push(`补 ${solGap.toFixed(4)} SOL`);
    }

    if (!missingParts.length) return null;
    return missingParts.join(" + ");
  }, [fundingStatus, normalizedBudgetUsd]);
  const primaryLoading = previewLoading || paymentLoading || executing;
  const payDisabled =
    primaryLoading ||
    (authenticated && !hasWallets) ||
    Boolean(fundingShortfallMessage);
  const successfulExecutions = executionResults.filter(
    (item) => item.status === "success",
  ).length;
  const failedExecutions = executionResults.filter(
    (item) => item.status === "error",
  ).length;
  const allExecutionsCompleted =
    premiumPlan != null &&
    successfulExecutions === premiumPlan.plan.allocation.length &&
    failedExecutions === 0;
  const hasExecutionErrors = failedExecutions > 0;

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
        body: JSON.stringify(requestPayload),
      });

      const data = (await response.json()) as PreviewResponse & { error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error || "生成免费预览失败");
      }

      setPreview(data);
      if (normalizedBudgetUsd !== budgetUsd) {
        setBudgetUsd(normalizedBudgetUsd);
      }

      if (embeddedSolanaWallet?.address) {
        const status = await getFundingStatus(
          embeddedSolanaWallet.address,
          normalizedBudgetUsd,
        );
        setFundingStatus(status);
      }
    } catch (requestError: any) {
      setError(requestError?.message || "生成免费预览失败");
    } finally {
      setPreviewLoading(false);
    }
  };

  const executePreparedSwaps = async (plan: PremiumPlanResponse) => {
    if (!embeddedSolanaWallet) {
      throw new Error("需要 Solana 钱包才能完成交易执行");
    }

    setExecuting(true);
    setExecutionResults([]);
    const nextResults: ExecutionResult[] = [];

    for (const leg of plan.plan.allocation) {
      if (!leg.quote.txReady || !leg.quote.txData) {
        nextResults.push({
          symbol: leg.symbol,
          status: "error",
          error: leg.quote.txReason || "未拿到可执行交易",
        });
        setExecutionResults([...nextResults]);
        continue;
      }

      try {
        const rawBytes = decodeTransactionBytes(leg.quote.txData);
        let transaction: Transaction | VersionedTransaction;

        try {
          transaction = VersionedTransaction.deserialize(rawBytes);
        } catch {
          transaction = Transaction.from(rawBytes);
        }

        const signedTransaction =
          await embeddedSolanaWallet.signTransaction(transaction);
        const rawTransaction = signedTransaction.serialize();
        const signature = await solanaRpc("sendTransaction", [
          bytesToBase64(rawTransaction),
          {
            encoding: "base64",
            skipPreflight: false,
            preflightCommitment: "confirmed",
            maxRetries: 3,
          },
        ]);

        let confirmed = false;
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const statuses = await solanaRpc("getSignatureStatuses", [
            [signature],
            { searchTransactionHistory: true },
          ]);
          const status = statuses?.value?.[0];

          if (status?.err) {
            throw new Error(JSON.stringify(status.err));
          }

          if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
            confirmed = true;
            break;
          }

          await new Promise((resolve) => window.setTimeout(resolve, 1500));
        }

        if (!confirmed) {
          throw new Error("交易已提交，但确认超时");
        }

        nextResults.push({
          symbol: leg.symbol,
          status: "success",
          signature,
        });
        setExecutionResults([...nextResults]);
      } catch (executionError: any) {
        nextResults.push({
          symbol: leg.symbol,
          status: "error",
          error: executionError?.message || "执行失败",
        });
        setExecutionResults([...nextResults]);
      }
    }

    setExecuting(false);

    const failedCount = nextResults.filter((item) => item.status === "error").length;
    if (failedCount > 0) {
      throw new Error(
        failedCount === nextResults.length
          ? "支付已完成，但交易执行失败"
          : "支付已完成，但部分交易执行失败",
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
      setError("钱包系统还没准备好，请稍后再试");
      return;
    }

    if (!embeddedEvmWallet?.address) {
      setError("需要 Base / EVM 钱包来完成支付");
      return;
    }

    if (!embeddedSolanaWallet?.address) {
      setError("需要 Solana 钱包来完成交易执行");
      return;
    }

    try {
      const status = await getFundingStatus(
        embeddedSolanaWallet.address,
        normalizedBudgetUsd,
      );
      setFundingStatus(status);

      if (!status.hasEnoughUsdc || !status.hasEnoughSol) {
        const reasons: string[] = [];
        if (!status.hasEnoughUsdc) {
          reasons.push(`至少 ${normalizedBudgetUsd} USDC`);
        }
        if (!status.hasEnoughSol) {
          reasons.push(`至少 ${MIN_SOL_GAS_BUFFER} SOL 手续费`);
        }
        throw new Error(
          `先给 Solana 交易钱包补足 ${reasons.join(" 和 ")}。当前余额：${status.usdcBalance.toFixed(2)} USDC / ${status.solBalance.toFixed(4)} SOL`,
        );
      }

      await embeddedEvmWallet.switchChain?.(8453);
      const result = await unlockWithPayment(
        "/api/premium/fomo-plan",
        requestPayload,
      );

      if (!result.success || !result.data?.success) {
        throw new Error(result.error || result.data?.error || "支付失败");
      }

      const plan = result.data as PremiumPlanResponse;
      setPremiumPlan(plan);
      await executePreparedSwaps(plan);
    } catch (requestError: any) {
      setExecuting(false);
      setError(
        requestError?.message ||
          paymentError ||
          "支付或执行过程中发生错误，请重试",
      );
    }
  };

  const handleDownloadShareImage = async () => {
    if (!shareImagePath) return;

    setShareImageLoading(true);
    setError(null);

    try {
      const response = await fetch(shareImagePath);
      if (!response.ok) throw new Error("生成分享图失败");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "miraix-fomo-copilot.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (requestError: any) {
      setError(requestError?.message || "生成分享图失败");
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
      setError(requestError?.message || "复制分享图链接失败");
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        <section className="rounded-[28px] bg-slate-950 px-6 py-7 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-100">
            <Zap className="h-3.5 w-3.5" />
            FOMO Copilot
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            我有 100U，今天怎么交易
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            先看免费预览。确认方向后，直接用 fxUSD 或 USDC 支付，然后自动完成整套交易。
          </p>
        </section>

        <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div>
                <div className="text-sm font-medium text-slate-700">预算</div>
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
                      {preset} USDC
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
                  最低 1 USDC。{minimumBudgetApplied ? "已自动按 1 USDC 起算。" : ""}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700">风险</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {riskOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRiskMode(option.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        riskMode === option.value
                          ? "border-sky-500 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700">周期</div>
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
                      {option.label}
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
                生成免费预览
              </button>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <Wallet className="h-4 w-4" />
                钱包状态
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Base 支付钱包
                  </div>
                  <div className="mt-2 font-medium text-slate-950">
                    {truncateMiddle(embeddedEvmWallet?.address, 8, 6)}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Solana 交易钱包
                  </div>
                  <div className="mt-2 font-medium text-slate-950">
                    {truncateMiddle(embeddedSolanaWallet?.address, 8, 6)}
                  </div>
                </div>
              </div>
              {!authenticated && (
                <button
                  type="button"
                  onClick={login}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  登录并连接 Privy 钱包
                </button>
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
                先生成免费预览
              </div>
              <div className="mt-2 text-sm text-slate-600">
                这里会给你今天的方向、三只标的，以及一键支付执行入口。
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
                    {budgetUsd}U
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
                      <div className="text-xs text-slate-500">{token.tag}</div>
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
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-slate-950">
                        立即支付并执行
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        支付后会自动完成 OKX 报价、路由和交易广播。
                      </div>
                    </div>
                    <div className="flex gap-2">
              {paymentOptions.map((option) => (
                        <button
                          key={option.assetSymbol}
                          type="button"
                          onClick={() => setSelectedPaymentAsset(option.assetSymbol)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            selectedPaymentAsset === option.assetSymbol
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          {option.assetSymbol}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePayAndExecute}
                    disabled={payDisabled}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {primaryLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    {!authenticated
                      ? "登录并支付"
                      : executing
                      ? "执行中..."
                      : fundingShortfallMessage
                      ? `先补足 ${fundingShortfallMessage}`
                      : `支付 ${selectedPaymentLabel} 并执行`}
                  </button>

                  {!hasWallets && (
                    <div className="mt-3 text-sm text-slate-600">
                      需要同时检测到 Base 钱包和 Solana 钱包，才能完成整套动作。
                    </div>
                  )}
                  {fundingStatus && (
                    <div className="mt-3 text-sm text-slate-600">
                      Solana 钱包当前有 {fundingStatus.usdcBalance.toFixed(2)} USDC /{" "}
                      {fundingStatus.solBalance.toFixed(4)} SOL。
                    </div>
                  )}
                  {fundingShortfallMessage && (
                    <div className="mt-2 text-sm font-medium text-amber-700">
                      交易钱包余额不足，先补足后再支付。
                    </div>
                  )}
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
                    ? "交易已完成"
                    : hasExecutionErrors
                    ? "部分成交"
                    : "已解锁执行"}
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
                  已执行
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-950">
                  {successfulExecutions}/{premiumPlan.plan.allocation.length}
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
                      ? "三笔交易都已经广播完成"
                      : hasExecutionErrors
                      ? `${successfulExecutions} 笔成功，${failedExecutions} 笔失败`
                      : "计划已解锁，正在执行交易"}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {allExecutionsCompleted
                      ? "现在最适合直接分享结果图，或者去链上查看成交明细。"
                      : hasExecutionErrors
                      ? "页面保留了每一腿的链上结果，方便你快速判断哪一笔需要重试。"
                      : "支付已经完成，Miraix 正在按照 OKX 的执行路径广播交易。"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                  <div className="rounded-full border border-white/70 bg-white/80 px-3 py-2">
                    Paid via {selectedPaymentLabel}
                  </div>
                  {paymentReference && (
                    <div className="rounded-full border border-white/70 bg-white/80 px-3 py-2">
                      回执 {truncateMiddle(paymentReference, 10, 8)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {premiumPlan.plan.allocation.map((item) => {
                const legResult = executionResults.find(
                  (result) => result.symbol === item.symbol,
                );

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
                      {item.quote.routeNames.slice(0, 2).join(" / ") || "OKX route"}
                    </div>
                    <div className="mt-3 text-xs">
                      {legResult?.status === "success" ? (
                        <a
                          href={toExplorerUrl(legResult.signature!)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-emerald-700"
                        >
                          已广播
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      ) : legResult?.status === "error" ? (
                        <span className="text-rose-600">
                          {legResult.error || "执行失败"}
                        </span>
                      ) : (
                        <span className="text-slate-500">等待执行</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {shareImagePath && (
              <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-slate-950">
                      分享这次结果
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      一张图直接带出 Miraix 判断、OKX 执行和 fxUSD 结算。
                    </div>
                  </div>
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
                  下载结果图
                </button>
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  <Copy className="h-4 w-4" />
                  {shareCopied ? "已复制" : "复制图片链接"}
                </button>
                {shareImageUrl && (
                  <a
                    href={shareImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    打开图片
                  </a>
                )}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
