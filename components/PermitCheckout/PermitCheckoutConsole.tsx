"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePrivy, useSignTypedData, useWallets } from "@privy-io/react-auth";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  ReceiptText,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Wallet,
} from "lucide-react";
import {
  GuardVerdict,
  JourneyStage,
  PermitCheckoutFeedEvent,
  PermitCheckoutReceipt,
  PermitCheckoutRun,
  PermitCheckoutStatePayload,
  PermitCheckoutStrategy,
  ReceiptMode,
  permitCheckoutWalletStatus,
} from "@/lib/permitCheckoutDemo";
import { usePremiumActionX402 } from "@/src/usePremiumActionX402";

const STAGE_LABELS: Array<{ id: JourneyStage; label: string }> = [
  { id: "market", label: "Select" },
  { id: "checkout", label: "Checkout" },
  { id: "permit", label: "Guard" },
  { id: "receipt", label: "Receipt" },
];

function panelClassName(extra?: string) {
  return [
    "rounded-lg border border-[#22324c] bg-[#121a2b]",
    extra ?? "",
  ].join(" ");
}

function verdictStyles(verdict: GuardVerdict) {
  if (verdict === "execute") {
    return {
      badge: "border-[#1f5f4f] bg-[#113d34] text-[#6ee7c8]",
      icon: <ShieldCheck className="h-4 w-4" />,
      label: "Execute",
    };
  }

  if (verdict === "resize") {
    return {
      badge: "border-[#6a4b18] bg-[#33240f] text-[#f8c970]",
      icon: <ShieldAlert className="h-4 w-4" />,
      label: "Resize",
    };
  }

  return {
    badge: "border-[#6a2431] bg-[#34121d] text-[#ff95a9]",
    icon: <ShieldX className="h-4 w-4" />,
    label: "Block",
  };
}

function eventStyles(outcome: string) {
  if (outcome === "execute") {
    return "text-[#6ee7c8]";
  }
  if (outcome === "resize") {
    return "text-[#f8c970]";
  }
  return "text-[#ff95a9]";
}

function TokenStrip({ strategy }: { strategy: PermitCheckoutStrategy }) {
  return (
    <div className="flex items-center gap-2">
      {strategy.tokens.map((token) => (
        <div
          key={token.symbol}
          className="flex items-center gap-2 rounded-md border border-[#24324a] bg-[#0b1020] px-2 py-1"
        >
          <Image
            src={token.icon}
            alt={token.symbol}
            width={18}
            height={18}
            className="h-[18px] w-[18px] rounded-full"
          />
          <span className="text-xs font-medium text-[#dbe7fb]">{token.symbol}</span>
        </div>
      ))}
    </div>
  );
}

function CopyButton({
  value,
  onCopy,
}: {
  value: string;
  onCopy: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#2a3b57] bg-[#111a2d] text-[#9fb0c8] transition hover:border-[#3b5175] hover:text-white"
      aria-label={`Copy ${value}`}
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

type EvmTypedDataSigner = {
  address: `0x${string}`;
  signTypedData: (message: {
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    primaryType: string;
    message: Record<string, unknown>;
  }) => Promise<`0x${string}`>;
};

function truncateMiddle(value: string | null | undefined, start = 8, end = 6) {
  if (!value) return "—";
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function inferEip712DomainTypes(domain: Record<string, unknown>) {
  return Object.entries(domain).map(([name, value]) => {
    if (typeof value === "string") {
      if (value.startsWith("0x") && value.length === 42) return { name, type: "address" };
      if (value.startsWith("0x") && value.length === 66) return { name, type: "bytes32" };
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
    return fieldName === "chainId" ? Number(value) : value.toString();
  }

  if (fieldName === "chainId" && typeof value === "string" && /^\d+$/.test(value)) {
    const numericValue = Number(value);
    return Number.isSafeInteger(numericValue) ? numericValue : value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => normalizeTypedDataValue(item, [...path, String(index)]));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(record).map(([key, entry]) => [
        key,
        normalizeTypedDataValue(entry, [...path, key]),
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
): EvmTypedDataSigner {
  return {
    address: address as `0x${string}`,
    async signTypedData(payload) {
      const typedData = {
        domain: normalizeTypedDataValue(payload.domain, ["domain"]) as Record<string, unknown>,
        primaryType: payload.primaryType,
        message: normalizeTypedDataValue(payload.message, ["message"]) as Record<string, unknown>,
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

    for (const key of ["transaction", "txHash", "transactionHash", "hash", "reference", "paymentId"]) {
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

export default function PermitCheckoutConsole() {
  const [strategies, setStrategies] = useState<PermitCheckoutStrategy[]>([]);
  const [recentEvents, setRecentEvents] = useState<PermitCheckoutFeedEvent[]>([]);
  const [walletStatus, setWalletStatus] = useState(permitCheckoutWalletStatus);
  const [currentRun, setCurrentRun] = useState<PermitCheckoutRun | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [stage, setStage] = useState<JourneyStage>("market");
  const [loadingState, setLoadingState] = useState<"state" | "checkout" | "guard" | "receipt" | null>("state");
  const [notice, setNotice] = useState<string | null>(null);
  const [evmSigner, setEvmSigner] = useState<EvmTypedDataSigner | null>(null);
  const [mockMode, setMockMode] = useState(false);

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
      setEvmSigner(createPrivyEvmSigner(embeddedEvmWallet.address, signTypedData));
      return;
    }

    setEvmSigner(null);
  }, [embeddedEvmWallet?.address, signTypedData]);

  useEffect(() => {
    setMockMode(new URLSearchParams(window.location.search).get("mock") === "1");
  }, []);

  const {
    unlockWithPayment,
    isLoading: paymentLoading,
    error: paymentError,
  } = usePremiumActionX402({
    evmSigner: evmSigner || undefined,
    preferredAsset: "USDT",
  });

  const selectedStrategy = useMemo(
    () => strategies.find((strategy) => strategy.id === selectedId) ?? strategies[0] ?? null,
    [selectedId, strategies],
  );
  const workbenchTitle = selectedStrategy?.name ?? "Permit Checkout";
  const workbenchNetwork = selectedStrategy?.networkLabel ?? "X Layer 196";

  const guardPresentation = verdictStyles(
    currentRun?.guard.verdict ?? selectedStrategy?.guard.verdict ?? "execute",
  );
  const currentUsageLeft = String(currentRun?.usageLeft ?? 1);
  const completedReceipts = recentEvents.length;

  const hydrateState = (payload: PermitCheckoutStatePayload) => {
    setStrategies(payload.strategies);
    setRecentEvents(payload.recentEvents);
    setWalletStatus(payload.walletStatus);
    setCurrentRun(payload.currentRun);
    setSelectedId((previous) => previous || payload.currentRun?.strategyId || payload.strategies[0]?.id || "");
    setStage(payload.currentRun?.stage ?? "market");
  };

  useEffect(() => {
    let cancelled = false;

    async function loadState() {
      try {
        const response = await fetch("/api/permit-checkout/state", { cache: "no-store" });
        const payload = (await response.json()) as PermitCheckoutStatePayload;

        if (cancelled) return;
        hydrateState(payload);
      } catch (error) {
        if (!cancelled) {
          setNotice("Permit Checkout state failed to load.");
        }
      } finally {
        if (!cancelled) {
          setLoadingState(null);
        }
      }
    }

    loadState();

    return () => {
      cancelled = true;
    };
  }, []);

  const resetJourney = (nextStage: JourneyStage = "market") => {
    setCurrentRun(null);
    setStage(nextStage);
  };

  const handleSelectStrategy = (strategyId: string) => {
    setSelectedId(strategyId);
    resetJourney("market");
  };

  const postAction = async (
    endpoint: string,
    body: Record<string, unknown>,
    nextStage: JourneyStage,
    loading: "checkout" | "guard" | "receipt",
  ) => {
    setLoadingState(loading);
    setNotice(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Request failed.");
      }

      hydrateState(payload as PermitCheckoutStatePayload);
      setStage(nextStage);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setLoadingState(null);
    }
  };

  const issuePermitAfterPayment = async (
    paymentToken: string,
    paymentReference?: string | null,
    successNotice?: string,
  ) => {
    if (!selectedStrategy) return;

    const response = await fetch("/api/permit-checkout/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        strategyId: selectedStrategy.id,
        paymentToken,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || "Permit issue failed after x402 payment.");
    }

    hydrateState(payload as PermitCheckoutStatePayload);
    setStage("permit");
    setNotice(
      successNotice ||
        (paymentReference
          ? `x402 settled: ${truncateMiddle(String(paymentReference))}. Permit issued.`
          : "x402 settled. Permit issued."),
    );
    window.setTimeout(() => setNotice(null), 1800);
  };

  const handleIssuePermit = async () => {
    if (!selectedStrategy) return;

    if (mockMode) {
      setLoadingState("checkout");
      setNotice(null);

      try {
        const response = await fetch("/api/permit-checkout/x402-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategyId: selectedStrategy.id,
            walletAddress: embeddedEvmWallet?.address || "0x8c2f4d6a90b13ef740d382a2c29b7c621bf81234",
            mock: true,
          }),
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "x402 checkout failed.");
        }

        const paymentToken = payload?.checkout?.paymentToken;
        if (!paymentToken) {
          throw new Error("x402 settled but the checkout token was missing.");
        }

        await issuePermitAfterPayment(
          paymentToken,
          payload?.payment?.paymentReference,
          "x402 settled. Permit issued.",
        );
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "x402 checkout failed.");
      } finally {
        setLoadingState(null);
      }
      return;
    }

    if (!ready) {
      setNotice("Wallet is still loading.");
      return;
    }

    if (!authenticated) {
      await login();
      return;
    }

    if (!evmSigner || !embeddedEvmWallet?.address) {
      setNotice("Connect or create an EVM wallet before x402 checkout.");
      return;
    }

    setLoadingState("checkout");
    setNotice(null);

    try {
      const paymentResult = await unlockWithPayment("/api/permit-checkout/x402-checkout", {
        strategyId: selectedStrategy.id,
        walletAddress: embeddedEvmWallet.address,
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || "x402 payment failed.");
      }

      const settledPayment =
        paymentResult.data?.payment && typeof paymentResult.data.payment === "object"
          ? paymentResult.data.payment
          : paymentResult.payment && typeof paymentResult.payment === "object"
            ? paymentResult.payment
            : null;
      const paymentReference =
        paymentResult.data?.payment?.paymentReference ||
        findPaymentReference(paymentResult.payment) ||
        findPaymentReference(settledPayment);

      const paymentToken = paymentResult.data?.checkout?.paymentToken;

      if (!paymentToken) {
        throw new Error("x402 settled but the checkout token was missing.");
      }

      await issuePermitAfterPayment(paymentToken, paymentReference);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "x402 checkout failed.");
    } finally {
      setLoadingState(null);
    }
  };

  const handleRunGuard = async () => {
    if (!currentRun) return;
    await postAction(
      "/api/permit-checkout/guard",
      { permitId: currentRun.permitId },
      "permit",
      "guard",
    );
  };

  const handleStoreReceipt = async (mode: ReceiptMode) => {
    if (!currentRun) return;
    await postAction(
      "/api/permit-checkout/receipt",
      { permitId: currentRun.permitId, mode },
      "receipt",
      "receipt",
    );
  };

  const handleLiveExecute = async () => {
    if (!currentRun) return;

    setLoadingState("receipt");
    setNotice(null);

    try {
      const response = await fetch("/api/permit-checkout/live-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permitId: currentRun.permitId, mock: mockMode }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Agentic Wallet execution failed.");
      }

      hydrateState(payload as PermitCheckoutStatePayload);
      setStage("receipt");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Agentic Wallet execution failed.");
    } finally {
      setLoadingState(null);
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${value} copied.`);
      window.setTimeout(() => setNotice(null), 1400);
    } catch {
      setNotice("Copy failed.");
    }
  };

  const handleDownloadProof = (receipt: PermitCheckoutReceipt) => {
    const blob = new Blob([JSON.stringify(receipt.proofBundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${receipt.permitId}-proof.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const guardVerdict = currentRun?.guard.verdict ?? selectedStrategy?.guard.verdict ?? "execute";

  return (
    <main className="min-h-[calc(100vh-46px)] bg-[#0b1020] text-[#e7eefb]">
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-4 px-4 py-4 lg:px-6">
        {(notice || paymentError) && (
          <div className="rounded-md border border-[#2a3b57] bg-[#111a2d] px-4 py-3 text-sm text-[#d7e3f5]">
            {notice || paymentError}
          </div>
        )}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className={panelClassName("p-4")}>
            <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
              Listed Actions
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{strategies.length || "—"}</p>
            <p className="mt-1 text-sm text-[#9fb0c8]">
              Pay once, issue once, execute once.
            </p>
          </div>
          <div className={panelClassName("p-4")}>
            <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
              Current Ticket
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {currentRun ? currentRun.permitId : "None"}
            </p>
            <p className="mt-1 text-sm text-[#9fb0c8]">
              {currentRun ? "Bounded execution only." : "Choose a strategy to issue one."}
            </p>
          </div>
          <div className={panelClassName("p-4")}>
            <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
              Receipt Feed
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{completedReceipts}</p>
            <p className="mt-1 text-sm text-[#9fb0c8]">
              Execute, resize, and block all stay visible.
            </p>
          </div>
          <div className={panelClassName("p-4")}>
            <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
              Settlement Rail
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {walletStatus.mode === "demo" ? "Demo Mode" : "Live Ready"}
            </p>
            <p className="mt-1 text-sm text-[#9fb0c8]">
              {walletStatus.note}
            </p>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.12fr_1.18fr_0.9fr]">
          <section className={panelClassName("min-h-[720px] p-4")}>
            <div className="flex items-start justify-between gap-3 border-b border-[#22324c] pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                  Strategy Market
                </p>
                <h1 className="mt-2 text-xl font-semibold text-white">
                  Buy one safe onchain action
                </h1>
              </div>
              <button
                type="button"
                onClick={() => resetJourney("market")}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-[#2a3b57] bg-[#0f1728] px-3 text-sm font-medium text-[#c9d7ea] transition hover:border-[#3b5175] hover:text-white"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            {selectedStrategy && (
              <div className="mt-4 flex flex-wrap gap-2">
                {strategies.map((strategy) => {
                  const active = selectedId === strategy.id;
                  return (
                    <button
                      key={`${strategy.id}-path`}
                      type="button"
                      onClick={() => {
                        setSelectedId(strategy.id);
                        resetJourney("checkout");
                        setStage("checkout");
                      }}
                      className={[
                        "rounded-md border px-3 py-2 text-sm font-medium transition",
                        active
                          ? "border-[#49b9a9] bg-[#10263a] text-white"
                          : "border-[#22324c] bg-[#0f1728] text-[#c9d7ea] hover:border-[#345074]",
                      ].join(" ")}
                    >
                      {strategy.demoPathLabel}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-4 space-y-3">
              {strategies.map((strategy) => {
                const selected = strategy.id === selectedStrategy?.id;
                const style = verdictStyles(strategy.guard.verdict);

                return (
                  <button
                    key={strategy.id}
                    type="button"
                    onClick={() => handleSelectStrategy(strategy.id)}
                    className={[
                      "w-full rounded-md border p-4 text-left transition",
                      selected
                        ? "border-[#49b9a9] bg-[#10263a]"
                        : "border-[#22324c] bg-[#0f1728] hover:border-[#345074]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Image
                            src={strategy.creatorLogo}
                            alt={strategy.creator}
                            width={24}
                            height={24}
                            className="h-6 w-6 rounded-md border border-[#23314a] bg-[#101827] p-1"
                          />
                          <p className="truncate text-sm font-semibold text-white">
                            {strategy.name}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-[#9fb0c8]">
                          {strategy.description}
                        </p>
                      </div>
                      <span
                        className={[
                          "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium",
                          style.badge,
                        ].join(" ")}
                      >
                        {style.icon}
                        {style.label}
                      </span>
                    </div>

                    <div className="mt-3">
                      <TokenStrip strategy={strategy} />
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-[#c9d7ea] sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-md border border-[#1d2a40] bg-[#0b1020] px-3 py-2">
                        <span>Price</span>
                        <span className="font-medium text-white">{strategy.priceLabel}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-[#1d2a40] bg-[#0b1020] px-3 py-2">
                        <span>Max</span>
                        <span className="font-medium text-white">{strategy.maxAmountLabel}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-[#1d2a40] bg-[#0b1020] px-3 py-2">
                        <span>Usage</span>
                        <span className="font-medium text-white">{strategy.usageLabel}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-[#1d2a40] bg-[#0b1020] px-3 py-2">
                        <span>Expires</span>
                        <span className="font-medium text-white">{strategy.expiryLabel}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={panelClassName("min-h-[720px] p-4")}>
            <div className="flex items-start justify-between gap-3 border-b border-[#22324c] pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                  Permit Workbench
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {workbenchTitle}
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md border border-[#23314a] bg-[#0f1728] px-3 py-2 text-sm text-[#d7e3f5]">
                <Wallet className="h-4 w-4 text-[#76d0c2]" />
                {workbenchNetwork}
              </div>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-4">
              {STAGE_LABELS.map((item, index) => {
                const active = stage === item.id;
                const complete = STAGE_LABELS.findIndex((entry) => entry.id === stage) > index;

                return (
                  <div
                    key={item.id}
                    className={[
                      "flex min-h-[60px] flex-col justify-center rounded-md border px-3 py-2",
                      active
                        ? "border-[#49b9a9] bg-[#10263a]"
                        : complete
                          ? "border-[#1f5f4f] bg-[#113d34]"
                          : "border-[#22324c] bg-[#0f1728]",
                    ].join(" ")}
                  >
                    <span className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                      {item.label}
                    </span>
                    <span className="mt-1 text-sm font-medium text-white">
                      {index + 1}. {item.id}
                    </span>
                  </div>
                );
              })}
            </div>

            {selectedStrategy && (
              <div className="mt-5 border-b border-[#22324c] pb-5">
                <div className="flex items-center gap-3">
                  <Image
                    src={selectedStrategy.creatorLogo}
                    alt={selectedStrategy.creator}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-md border border-[#23314a] bg-[#0e1526] p-1"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{selectedStrategy.creator}</p>
                    <p className="text-sm text-[#9fb0c8]">{selectedStrategy.permitScope}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedStrategy && stage === "market" && (
              <div className="flex min-h-[510px] flex-col justify-between">
                <div className="space-y-4 pt-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-[#22324c] bg-[#0f1728] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                        Price
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {selectedStrategy.priceLabel}
                      </p>
                    </div>
                    <div className="rounded-md border border-[#22324c] bg-[#0f1728] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                        Permit Scope
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {selectedStrategy.maxAmountLabel}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white">What the buyer gets</p>
                    <div className="space-y-2 text-sm text-[#c9d7ea]">
                      <div className="flex items-start gap-2">
                        <ChevronRight className="mt-0.5 h-4 w-4 text-[#76d0c2]" />
                        <span>One temporary permit linked to this exact action.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight className="mt-0.5 h-4 w-4 text-[#76d0c2]" />
                        <span>Guard review before any execution can proceed.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChevronRight className="mt-0.5 h-4 w-4 text-[#76d0c2]" />
                        <span>No full wallet delegation and no reusable allowance.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStage("checkout")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2dd4bf] px-4 text-sm font-semibold text-[#041018] transition hover:bg-[#47dec9]"
                >
                  Review checkout
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {selectedStrategy && stage === "checkout" && (
              <div className="flex min-h-[510px] flex-col justify-between pt-5">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-[#22324c] bg-[#0f1728] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                        Action
                      </p>
                      <p className="mt-2 text-base font-semibold text-white">
                        {selectedStrategy.permitScope}
                      </p>
                    </div>
                    <div className="rounded-md border border-[#22324c] bg-[#0f1728] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                        Checkout
                      </p>
                      <p className="mt-2 text-base font-semibold text-white">
                        {selectedStrategy.priceLabel}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#22324c] py-3 text-sm">
                      <span className="text-[#9fb0c8]">Chain</span>
                      <span className="font-medium text-white">{selectedStrategy.networkLabel}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#22324c] py-3 text-sm">
                      <span className="text-[#9fb0c8]">Max amount</span>
                      <span className="font-medium text-white">{selectedStrategy.maxAmountLabel}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#22324c] py-3 text-sm">
                      <span className="text-[#9fb0c8]">Usage</span>
                      <span className="font-medium text-white">{selectedStrategy.usageLabel}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 text-sm">
                      <span className="text-[#9fb0c8]">Expiry</span>
                      <span className="font-medium text-white">{selectedStrategy.expiryLabel}</span>
                    </div>
                  </div>

                  <p className="rounded-md border border-[#2a3b57] bg-[#0f1728] px-4 py-3 text-sm text-[#c9d7ea]">
                    x402 settlement is required before this app issues a permit token.
                    The guard can still resize or block the request before execution.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setStage("market")}
                    className="inline-flex h-11 items-center justify-center rounded-md border border-[#2a3b57] bg-[#0f1728] px-4 text-sm font-medium text-[#c9d7ea] transition hover:border-[#3b5175] hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleIssuePermit}
                    disabled={loadingState === "checkout" || paymentLoading}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2dd4bf] px-4 text-sm font-semibold text-[#041018] transition hover:bg-[#47dec9]"
                  >
                    {loadingState === "checkout" || paymentLoading
                      ? "Paying x402..."
                      : authenticated || mockMode
                        ? "Pay x402 and issue permit"
                        : "Connect and pay x402"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {stage === "permit" && (
              <div className="flex min-h-[510px] flex-col justify-between pt-5">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#22324c] py-3 text-sm">
                      <span className="text-[#9fb0c8]">Payment</span>
                      <span className="font-medium text-white">
                        {currentRun?.paymentConfirmedAt ? "x402 settled" : "Pending"}
                      </span>
                    </div>
                    {currentRun?.payment.paymentReference && (
                      <div className="flex items-center justify-between border-b border-[#22324c] py-3 text-sm">
                        <span className="text-[#9fb0c8]">Payment ref</span>
                        <span className="font-medium text-white">
                          {truncateMiddle(currentRun.payment.paymentReference)}
                        </span>
                      </div>
                    )}
                    {currentRun?.payment && (
                      <div className="flex items-center justify-between border-b border-[#22324c] py-3 text-sm">
                        <span className="text-[#9fb0c8]">Payment rail</span>
                        <span className="font-medium text-white">
                          {currentRun.payment.protocol} · {currentRun.payment.amountLabel} · {currentRun.payment.network}
                        </span>
                      </div>
                    )}
                    {currentRun?.payment.payerAddress && (
                      <div className="flex items-center justify-between border-b border-[#22324c] py-3 text-sm">
                        <span className="text-[#9fb0c8]">Payer</span>
                        <span className="font-medium text-white">
                          {truncateMiddle(currentRun.payment.payerAddress)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-b border-[#22324c] py-3 text-sm">
                      <span className="text-[#9fb0c8]">Ticket</span>
                      <span className="font-medium text-white">
                        {currentRun?.ticketIssuedAt ? "Issued" : "Pending"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#22324c] py-3 text-sm">
                      <span className="text-[#9fb0c8]">Guard</span>
                      <span className="font-medium text-white">
                        {currentRun?.guard.status === "idle"
                          ? "Not started"
                          : loadingState === "guard"
                            ? "Running"
                          : guardPresentation.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#22324c] py-3 text-sm">
                      <span className="text-[#9fb0c8]">Execution rail</span>
                      <span className="font-medium text-white">
                        Agentic Wallet · live tx required for receipt hash
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 text-sm">
                      <span className="text-[#9fb0c8]">Uses left</span>
                      <span className="font-medium text-white">{currentUsageLeft}</span>
                    </div>
                  </div>

                  <div className="rounded-md border border-[#22324c] bg-[#0f1728] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                          Guard verdict
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={[
                              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium",
                              guardPresentation.badge,
                            ].join(" ")}
                          >
                            {guardPresentation.icon}
                            {guardPresentation.label}
                          </span>
                          <span className="text-sm text-[#9fb0c8]">
                            Risk {currentRun?.guard.risk ?? selectedStrategy.guard.risk}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm text-[#9fb0c8]">
                        {currentRun?.guard.priceImpact ?? selectedStrategy.guard.priceImpact} impact
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-[#c9d7ea]">
                      {currentRun?.guard.status === "done"
                        ? currentRun.guard.reason
                        : "Run the guard to validate the permit against route quality, amount limits, and wallet scope."}
                    </p>

                    <div className="mt-4 space-y-2 text-sm text-[#c9d7ea]">
                      {(currentRun?.guard.checks.length ? currentRun.guard.checks : selectedStrategy.guard.checks).map((check) => (
                        <div key={check} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#76d0c2]" />
                          <span>{check}</span>
                        </div>
                      ))}
                    </div>

                    {currentRun?.guard.status === "done" && currentRun.guard.allowedAmountLabel && (
                      <div className="mt-4 rounded-md border border-[#6a4b18] bg-[#33240f] px-3 py-2 text-sm text-[#f8c970]">
                        Allowed amount now: {currentRun.guard.allowedAmountLabel}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {currentRun?.guard.status !== "done" ? (
                    <button
                      type="button"
                      onClick={handleRunGuard}
                      disabled={loadingState === "guard" || !currentRun}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2dd4bf] px-4 text-sm font-semibold text-[#041018] transition hover:bg-[#47dec9] disabled:bg-[#1a6158] disabled:text-[#b8d7d1]"
                    >
                      {loadingState === "guard" ? "Running guard..." : "Run guard"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : guardVerdict === "execute" ? (
                    <button
                      type="button"
                      onClick={handleLiveExecute}
                      disabled={loadingState === "receipt"}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2dd4bf] px-4 text-sm font-semibold text-[#041018] transition hover:bg-[#47dec9]"
                    >
                      {loadingState === "receipt"
                        ? "Broadcasting..."
                        : "Execute live with Agentic Wallet"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : guardVerdict === "resize" ? (
                    <button
                      type="button"
                      onClick={() => handleStoreReceipt("resized")}
                      disabled={loadingState === "receipt"}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#f8c970] px-4 text-sm font-semibold text-[#221607] transition hover:bg-[#f4d286]"
                    >
                      {loadingState === "receipt" ? "Storing receipt..." : "Accept resized amount"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStoreReceipt("blocked")}
                      disabled={loadingState === "receipt"}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#ef6b84] px-4 text-sm font-semibold text-[#2d0913] transition hover:bg-[#f17d94]"
                    >
                      {loadingState === "receipt" ? "Storing receipt..." : "Store blocked receipt"}
                      <ReceiptText className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setStage("checkout")}
                    className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[#2a3b57] bg-[#0f1728] px-4 text-sm font-medium text-[#c9d7ea] transition hover:border-[#3b5175] hover:text-white"
                  >
                    Edit checkout
                  </button>
                </div>
              </div>
            )}

            {currentRun?.receipt && stage === "receipt" && (
              <div className="flex min-h-[510px] flex-col justify-between pt-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium",
                        guardPresentation.badge,
                      ].join(" ")}
                    >
                      {guardPresentation.icon}
                      {currentRun.receipt.title}
                    </span>
                    <span className="text-sm text-[#9fb0c8]">
                      Settlement mode: {currentRun.receipt.settlementMode}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-md border border-[#22324c] bg-[#0f1728] px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                          Permit ID
                        </p>
                        <CopyButton value={currentRun.receipt.permitId} onCopy={handleCopy} />
                      </div>
                      <p className="mt-2 text-sm font-medium text-white">
                        {currentRun.receipt.permitId}
                      </p>
                    </div>
                    <div className="rounded-md border border-[#22324c] bg-[#0f1728] px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                          Ticket ID
                        </p>
                        <CopyButton value={currentRun.receipt.ticketId} onCopy={handleCopy} />
                      </div>
                      <p className="mt-2 text-sm font-medium text-white">
                        {currentRun.receipt.ticketId}
                      </p>
                    </div>
                    <div className="rounded-md border border-[#22324c] bg-[#0f1728] px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                          Proof ID
                        </p>
                        <CopyButton value={currentRun.receipt.proofId} onCopy={handleCopy} />
                      </div>
                      <p className="mt-2 text-sm font-medium text-white">
                        {currentRun.receipt.proofId}
                      </p>
                    </div>
                    <div className="rounded-md border border-[#22324c] bg-[#0f1728] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                        Result
                      </p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {currentRun.receipt.result}
                      </p>
                    </div>
                    <div className="rounded-md border border-[#22324c] bg-[#0f1728] px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                          {currentRun.receipt.txHash ? "Tx Hash" : "Execution Ref"}
                        </p>
                        {currentRun.receipt.txHash && (
                          <CopyButton value={currentRun.receipt.txHash} onCopy={handleCopy} />
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-white">
                        {currentRun.receipt.txHash
                          ? truncateMiddle(currentRun.receipt.txHash)
                          : currentRun.receipt.executionRef ?? "No broadcast"}
                      </p>
                      {currentRun.receipt.explorerUrl && (
                        <a
                          href={currentRun.receipt.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#76d0c2] hover:text-white"
                        >
                          View on Explorer
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="rounded-md border border-[#22324c] bg-[#0f1728] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                        Stored At
                      </p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {new Date(currentRun.receipt.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border border-[#22324c] bg-[#0f1728] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                      Receipt note
                    </p>
                    <p className="mt-3 text-sm text-[#c9d7ea]">
                      {currentRun.receipt.settlementNote}
                    </p>
                    <p className="mt-3 text-sm text-[#9fb0c8]">
                      {currentRun.receipt.broadcastStatus}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => resetJourney("market")}
                    className="inline-flex h-11 items-center justify-center rounded-md border border-[#2a3b57] bg-[#0f1728] px-4 text-sm font-medium text-[#c9d7ea] transition hover:border-[#3b5175] hover:text-white"
                  >
                    Back to market
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentRun?.receipt) {
                        handleDownloadProof(currentRun.receipt);
                      }
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#2a3b57] bg-[#111a2d] px-4 text-sm font-medium text-[#d7e3f5] transition hover:border-[#3b5175] hover:text-white"
                  >
                    Download proof
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage("permit")}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2dd4bf] px-4 text-sm font-semibold text-[#041018] transition hover:bg-[#47dec9]"
                  >
                    Review permit trail
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </section>

          <aside className={panelClassName("min-h-[720px] p-4")}>
            <div className="border-b border-[#22324c] pb-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[#8ca2c0]">
                Evidence Rail
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">Execution ticket and proof</h3>
            </div>

            <div className="space-y-6 pt-5">
              <div>
                <p className="text-sm font-medium text-white">Current ticket</p>
                <div className="mt-3 space-y-3 text-sm text-[#c9d7ea]">
                  <div className="flex items-center justify-between border-b border-[#22324c] pb-3">
                    <span className="text-[#9fb0c8]">Wallet</span>
                    <span className="font-medium text-white">{walletStatus.label}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#22324c] pb-3">
                    <span className="text-[#9fb0c8]">Permit scope</span>
                    <span className="font-medium text-white">
                      {currentRun?.permitScope ?? selectedStrategy?.permitScope ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#22324c] pb-3">
                    <span className="text-[#9fb0c8]">Max amount</span>
                    <span className="font-medium text-white">
                      {currentRun?.maxAmountLabel ?? selectedStrategy?.maxAmountLabel ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9fb0c8]">Uses left</span>
                    <span className="font-medium text-white">{currentUsageLeft}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-white">Recent receipt feed</p>
                <div className="mt-3 space-y-3">
                  {recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-md border border-[#22324c] bg-[#0f1728] px-3 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-[#8ca2c0]">{event.timeLabel}</span>
                        <span className={`text-xs font-medium uppercase ${eventStyles(event.outcome)}`}>
                          {event.outcome}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[#c9d7ea]">{event.summary}</p>
                      <p className="mt-2 text-xs text-[#8ca2c0]">
                        {event.strategyName} · {event.permitId}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-white">Timeline and proof</p>
                <div className="mt-3 rounded-md border border-[#22324c] bg-[#0f1728] px-4 py-4">
                  {(currentRun?.timeline ?? []).map((step) => (
                    <div
                      key={step.id}
                      className="border-b border-[#22324c] py-3 text-sm last:border-b-0 last:pb-0 first:pt-0"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[#d7e3f5]">{step.label}</span>
                        <span className="text-xs uppercase text-[#8ca2c0]">
                          {step.at ? new Date(step.at).toLocaleTimeString() : step.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[#8ca2c0]">{step.note}</p>
                    </div>
                  ))}
                  {!currentRun && (
                    <div className="text-sm text-[#8ca2c0]">
                      Pick a path and issue a permit to generate a live timeline.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
