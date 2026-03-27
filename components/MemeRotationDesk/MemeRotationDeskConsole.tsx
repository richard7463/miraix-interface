"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Gavel,
  Loader2,
  Radar,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import {
  DeskAgentStatus,
  DeskCandidateVerdict,
  DeskPreparedExecution,
  DeskResponse,
  DeskRiskMode,
  DeskStrategy,
  SAMPLE_ROTATION_WALLET,
} from "@/lib/memeRotationDesk";
import { cn } from "@/lib/utils";

const budgetPresets = [10, 25, 50, 100, 250];

const riskOptions: Array<{
  value: DeskRiskMode;
  title: string;
  detail: string;
}> = [
  {
    value: "safe",
    title: "Safe",
    detail: "Higher safety floor, smaller size, tighter invalidation.",
  },
  {
    value: "balanced",
    title: "Balanced",
    detail: "Allow one strong trade if liquidity and safety still hold.",
  },
  {
    value: "degen",
    title: "Degen",
    detail: "Looser floor, larger size, only for faster meme rotation.",
  },
];

const strategyOptions: Array<{
  value: DeskStrategy;
  title: string;
  detail: string;
}> = [
  {
    value: "momentum",
    title: "Momentum",
    detail: "Follow relative strength after the court clears the setup.",
  },
  {
    value: "reversal",
    title: "Reversal",
    detail: "Wait for pullbacks and refuse already extended candles.",
  },
  {
    value: "shadow",
    title: "Shadow",
    detail: "Bias toward stronger developer quality and cleaner profiles.",
  },
];

const recommendedDemoPath = [
  "Use the sample wallet or a connected Solana wallet.",
  "Set the desk to 100 USDC, Balanced, Momentum.",
  "Run the desk and inspect the Rug Court shortlist.",
  "Open the approved trade and review quote state plus invalidation.",
  "Prepare the unsigned payload to show the wallet review step.",
] as const;

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatPct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function shortenWallet(address: string) {
  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function agentTone(status: DeskAgentStatus) {
  if (status === "ready") {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }

  if (status === "watch") {
    return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  }

  return "border-rose-300/20 bg-rose-400/10 text-rose-100";
}

function verdictTone(verdict: DeskCandidateVerdict) {
  if (verdict === "approve") {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }

  if (verdict === "watch") {
    return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  }

  return "border-rose-300/20 bg-rose-400/10 text-rose-100";
}

export function MemeRotationDeskConsole() {
  const { login, authenticated } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  const copyToClipboard = useCopyToClipboard();

  const [walletAddress, setWalletAddress] = useState("");
  const [budgetUsd, setBudgetUsd] = useState(100);
  const [riskMode, setRiskMode] = useState<DeskRiskMode>("balanced");
  const [strategy, setStrategy] = useState<DeskStrategy>("momentum");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeskResponse | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [preparing, setPreparing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [prepared, setPrepared] = useState<DeskPreparedExecution | null>(null);

  const connectedWallet =
    solanaWallets.find((wallet) => wallet.walletClientType === "privy") || solanaWallets[0];

  useEffect(() => {
    if (!walletAddress && connectedWallet?.address) {
      setWalletAddress(connectedWallet.address);
    }
  }, [connectedWallet, walletAddress]);

  async function runDesk(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);
    setCopyState("idle");
    setPrepared(null);

    try {
      const response = await fetch("/api/meme-rotation-desk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: walletAddress.trim() || connectedWallet?.address || SAMPLE_ROTATION_WALLET,
          budgetUsd,
          riskMode,
          strategy,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to run Meme Court");
      }

      setResult(payload as DeskResponse);
    } catch (requestError: any) {
      setError(requestError?.message || "Failed to run Meme Court");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function copyCommand(command: string) {
    const success = await copyToClipboard(command);

    if (!success) {
      return;
    }

    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  async function prepareOrder() {
    if (!result?.execution.canPrepare || !result.execution.market || !result.approvedTrade.outputContract) {
      return;
    }

    setPreparing(true);
    setError(null);

    try {
      const response = await fetch("/api/meme-rotation-desk/prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: result.walletAddress,
          outputContract: result.approvedTrade.outputContract,
          market: result.execution.market,
          amountUsd: result.approvedTrade.amountUsd,
          mode: result.execution.mode,
          outputSymbol: result.approvedTrade.symbol,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to prepare order");
      }

      setPrepared(payload.prepared as DeskPreparedExecution);
    } catch (requestError: any) {
      setError(requestError?.message || "Failed to prepare order");
    } finally {
      setPreparing(false);
    }
  }

  async function refreshOrderStatus() {
    if (!prepared?.orderId) {
      return;
    }

    setStatusLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/meme-rotation-desk/order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: prepared.orderId,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to refresh order status");
      }

      setPrepared(payload.prepared as DeskPreparedExecution);
    } catch (requestError: any) {
      setError(requestError?.message || "Failed to refresh order status");
    } finally {
      setStatusLoading(false);
    }
  }

  const chatHref = result
    ? `/chat?input=${encodeURIComponent(result.approvedTrade.command)}`
    : `/chat?input=${encodeURIComponent(
        "Run Miraix Meme Court and give me one approved Solana meme trade after Rug Court.",
      )}`;

  return (
    <section
      id="desk-console"
      className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#c5fce3]">
            <Sparkles className="h-3.5 w-3.5" />
            Submission Demo
          </div>
          <h2 className="mt-4 text-3xl font-semibold text-[#f8fbf8]">
            Run the full product flow.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#c1cbbf] md:text-base">
            Set the desk, run discovery, inspect Rug Court, and end with one
            approved trade plus one unsigned payload for wallet review.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#d9e2d8]">
          Shortlist, veto, one trade, unsigned payload.
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <form
          onSubmit={runDesk}
          className="rounded-[28px] border border-white/10 bg-black/20 p-5"
        >
          <div className="flex items-center gap-3 text-[#e8f2e7]">
            <Wallet className="h-5 w-5 text-emerald-200" />
            <h3 className="text-lg font-semibold">Desk Inputs</h3>
          </div>

          <div className="mt-5">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c1cbbf]">
              Solana wallet
            </label>
            <input
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
              placeholder={SAMPLE_ROTATION_WALLET}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#7f887f] focus:border-emerald-300/25 focus:bg-white/[0.06]"
            />

            <div className="mt-3 flex flex-wrap gap-3">
              {connectedWallet ? (
                <button
                  type="button"
                  onClick={() => setWalletAddress(connectedWallet.address)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#f2f4f1] transition hover:border-emerald-300/20 hover:bg-emerald-400/10"
                >
                  Use connected wallet {shortenWallet(connectedWallet.address)}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => login()}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#f2f4f1] transition hover:border-emerald-300/20 hover:bg-emerald-400/10"
                >
                  {authenticated ? "Wallet loading..." : "Connect wallet"}
                </button>
              )}

              <button
                type="button"
                onClick={() => setWalletAddress(SAMPLE_ROTATION_WALLET)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#d4ddd3] transition hover:bg-white/[0.08]"
              >
                Use sample wallet
              </button>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c1cbbf]">
              Budget
            </label>
            <div className="mt-3 flex flex-wrap gap-3">
              {budgetPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBudgetUsd(preset)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition",
                    budgetUsd === preset
                      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                      : "border-white/10 bg-white/[0.04] text-[#dde4dc] hover:bg-white/[0.08]",
                  )}
                >
                  {formatUsd(preset)}
                </button>
              ))}
            </div>

            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={budgetUsd}
              onChange={(event) => setBudgetUsd(Number(event.target.value))}
              className="mt-4 w-full accent-emerald-400"
            />
            <div className="mt-2 text-sm text-[#c1cbbf]">
              Selected: {formatUsd(budgetUsd)}. Recommended demo setup starts at 100 USDC.
            </div>
          </div>

          <div className="mt-6">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c1cbbf]">
              Risk mode
            </label>
            <div className="mt-3 grid gap-3">
              {riskOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRiskMode(option.value)}
                  className={cn(
                    "rounded-[22px] border p-4 text-left transition",
                    riskMode === option.value
                      ? "border-emerald-300/20 bg-emerald-400/10"
                      : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">{option.title}</span>
                    {riskMode === option.value ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#c1cbbf]">{option.detail}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c1cbbf]">
              Desk style
            </label>
            <div className="mt-3 grid gap-3">
              {strategyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStrategy(option.value)}
                  className={cn(
                    "rounded-[22px] border p-4 text-left transition",
                    strategy === option.value
                      ? "border-sky-300/20 bg-sky-400/10"
                      : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">{option.title}</span>
                    {strategy === option.value ? (
                      <CheckCircle2 className="h-4 w-4 text-sky-200" />
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#c1cbbf]">{option.detail}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#10b981] px-5 py-3 text-sm font-semibold text-[#04110c] transition hover:bg-[#34d399] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
            {loading ? "Running..." : "Run Meme Court"}
          </button>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </form>

        <div className="grid gap-6">
          <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
            <div className="flex items-center gap-3 text-[#e8f2e7]">
              <ShieldCheck className="h-5 w-5 text-emerald-200" />
              <h3 className="text-lg font-semibold">Recommended demo path</h3>
            </div>

            <div className="mt-5 grid gap-3">
              {recommendedDemoPath.map((item, index) => (
                <div
                  key={item}
                  className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-[#dce3dc]"
                >
                  <span className="mr-2 font-semibold text-[#b8f0d4]">
                    {index + 1}.
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {!result ? (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-7 text-[#b7c0b6]">
              Run the desk to generate the full submission flow: live shortlist,
              Rug Court verdicts, one approved trade, and one unsigned payload
              for wallet review.
            </div>
          ) : (
            <>
              <div className="rounded-[28px] border border-emerald-300/15 bg-black/20 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#c5fce3]">
                    {result.dataMode === "live" ? "Live Bitget" : "Preview mode"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-[#dde4dc]">
                    Wallet {shortenWallet(result.walletAddress)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-[#dde4dc]">
                    {result.provider}
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-[#f8fbf8]">
                  {result.marketContext.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#dce3dc]">
                  {result.marketContext.summary}
                </p>
                {result.warnings.length ? (
                  <div className="mt-4 grid gap-3">
                    {result.warnings.map((warning) => (
                      <div
                        key={warning}
                        className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
                      >
                        {warning}
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#aeb7ad]">Confidence</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {result.marketContext.confidence}%
                    </p>
                  </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#aeb7ad]">Desk bias</p>
                      <p className="mt-2 text-sm leading-6 text-[#dde4dc]">
                        {result.marketContext.deskBias}
                      </p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#aeb7ad]">Universe scanned</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {result.marketContext.scoutUniverse}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {result.agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="rounded-[26px] border border-white/10 bg-black/20 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b8c1b8]">
                          {agent.role}
                        </p>
                        <h3 className="mt-3 text-xl font-semibold text-white">{agent.name}</h3>
                      </div>
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]",
                          agentTone(agent.status),
                        )}
                      >
                        {agent.status}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-medium text-[#f4f7f4]">{agent.verdict}</p>
                    <p className="mt-3 text-sm leading-7 text-[#c1cbbf]">{agent.detail}</p>

                    <div className="mt-4 grid gap-3">
                      {agent.metrics.map((metric) => (
                        <div
                          key={`${agent.id}-${metric.label}`}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
                        >
                          <span className="text-[#b5bfb4]">{metric.label}</span>
                          <span className="font-medium text-white">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.08fr,0.92fr]">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center gap-3 text-[#f7edd4]">
                    <Gavel className="h-5 w-5 text-amber-200" />
                    <h3 className="text-xl font-semibold">Rug Court decisions</h3>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {result.candidates.map((candidate) => (
                      <div
                        key={candidate.symbol}
                        className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="text-lg font-semibold text-white">
                                {candidate.symbol}
                              </h4>
                              <span className="text-sm text-[#aeb7ad]">{candidate.name}</span>
                            </div>
                            <p className="mt-2 text-sm leading-7 text-[#c1cbbf]">
                              {candidate.narrative}
                            </p>
                          </div>

                          <span
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]",
                              verdictTone(candidate.verdict),
                            )}
                          >
                            {candidate.verdict}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm">
                            <p className="text-[#aeb7ad]">24h momentum</p>
                            <p className="mt-1 font-semibold text-white">
                              {formatPct(candidate.momentum24hPct)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm">
                            <p className="text-[#aeb7ad]">Volume</p>
                            <p className="mt-1 font-semibold text-white">{candidate.volumeScore}/100</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm">
                            <p className="text-[#aeb7ad]">Liquidity</p>
                            <p className="mt-1 font-semibold text-white">
                              {candidate.liquidityScore}/100
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm">
                            <p className="text-[#aeb7ad]">Safety</p>
                            <p className="mt-1 font-semibold text-white">{candidate.safetyScore}/100</p>
                          </div>
                        </div>

                        <p className="mt-4 text-sm leading-7 text-[#dde4dc]">
                          {candidate.courtNote}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[28px] border border-emerald-300/15 bg-black/20 p-5">
                    <div className="flex items-center gap-3 text-[#dff7ea]">
                      <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                      <h3 className="text-xl font-semibold">Approved trade</h3>
                    </div>

                    <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b8c1b8]">
                            {result.approvedTrade.inputAsset} to {result.approvedTrade.symbol}
                          </p>
                          <h4 className="mt-3 text-2xl font-semibold text-white">
                            {formatUsd(result.approvedTrade.amountUsd)} into {result.approvedTrade.symbol}
                          </h4>
                        </div>
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">
                          {result.approvedTrade.allocationPct.toFixed(1)}% size
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-[#dce3dc]">
                        {result.approvedTrade.rationale}
                      </p>

                      <div className="mt-4 grid gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                          <p className="text-[#aeb7ad]">Entry window</p>
                          <p className="mt-1 text-white">{result.approvedTrade.entryWindow}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                          <p className="text-[#aeb7ad]">Invalidation</p>
                          <p className="mt-1 text-white">{result.approvedTrade.invalidation}</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-[22px] border border-sky-300/15 bg-sky-400/10 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
                              Execution readiness
                            </p>
                            <p className="mt-2 text-sm text-[#eaf4ff]">
                              {result.execution.source}
                            </p>
                          </div>
                          <span className="rounded-full border border-sky-300/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
                            {result.execution.state}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                            <p className="text-[#b6c8d8]">Mode</p>
                            <p className="mt-1 text-white">{result.execution.mode}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                            <p className="text-[#b6c8d8]">Market</p>
                            <p className="mt-1 text-white">{result.execution.market || "Not available"}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                            <p className="text-[#b6c8d8]">Estimated output</p>
                            <p className="mt-1 text-white">
                              {result.execution.estimatedOutput
                                ? `${result.execution.estimatedOutput} ${result.execution.outputSymbol || ""}`.trim()
                                : "Not available"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                            <p className="text-[#b6c8d8]">Price impact</p>
                            <p className="mt-1 text-white">
                              {typeof result.execution.priceImpactPct === "number"
                                ? `${result.execution.priceImpactPct}%`
                                : "Not available"}
                            </p>
                          </div>
                        </div>

                        {result.execution.warnings.length ? (
                          <div className="mt-4 grid gap-3">
                            {result.execution.warnings.map((warning) => (
                              <div
                                key={warning}
                                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#dbe9f8]"
                              >
                                {warning}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b8c1b8]">
                          Exit ladder
                        </p>
                        <div className="mt-3 grid gap-3">
                          {result.approvedTrade.takeProfits.map((step) => (
                            <div
                              key={step}
                              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#dce3dc]"
                            >
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => copyCommand(result.approvedTrade.command)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-[#eef2ed] transition hover:bg-white/[0.08]"
                        >
                          <Copy className="h-4 w-4" />
                          {copyState === "copied" ? "Copied" : "Copy command"}
                        </button>
                        <Link
                          href={chatHref}
                          className="inline-flex items-center gap-2 rounded-full bg-[#10b981] px-4 py-2.5 text-sm font-semibold text-[#04110c] transition hover:bg-[#34d399]"
                        >
                          Send to chat
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={prepareOrder}
                          disabled={!result.execution.canPrepare || preparing}
                          className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {preparing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                              {preparing ? "Preparing..." : "Prepare unsigned payload"}
                        </button>
                      </div>

                        {prepared ? (
                        <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b8c1b8]">
                                Execution proof
                              </p>
                              <p className="mt-2 text-sm text-white">{prepared.summary}</p>
                            </div>
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#e4ece3]">
                              {prepared.source}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                              <p className="text-[#aeb7ad]">Order ID</p>
                              <p className="mt-1 break-all text-white">{prepared.orderId || "Not returned"}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                              <p className="text-[#aeb7ad]">Status</p>
                              <p className="mt-1 text-white">{prepared.status || "Unsigned"}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                              <p className="text-[#aeb7ad]">Tx count</p>
                              <p className="mt-1 text-white">{prepared.txCount ?? 0}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                              <p className="text-[#aeb7ad]">Signature payloads</p>
                              <p className="mt-1 text-white">{prepared.signatureCount ?? 0}</p>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#dce3dc]">
                            {prepared.nextAction}
                          </div>

                          {prepared.payloadPreview?.length ? (
                            <div className="mt-4 grid gap-3">
                              {prepared.payloadPreview.map((item) => (
                                <div
                                  key={item}
                                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#e4ece3]"
                                >
                                  {item}
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {prepared.statusTrail?.length ? (
                            <div className="mt-4 grid gap-3">
                              {prepared.statusTrail.map((item) => (
                                <div
                                  key={item}
                                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#e4ece3]"
                                >
                                  {item}
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {prepared.orderId ? (
                            <button
                              type="button"
                              onClick={refreshOrderStatus}
                              disabled={statusLoading}
                              className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-[#eef2ed] transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {statusLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCcw className="h-4 w-4" />
                              )}
                              {statusLoading ? "Refreshing..." : "Refresh order status"}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-sky-300/15 bg-black/20 p-5">
                    <div className="flex items-center gap-3 text-sky-100">
                      <AlertTriangle className="h-5 w-5" />
                      <h3 className="text-xl font-semibold">Demo checklist</h3>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[#dce3dc]">
                      {result.proofBundle.note}
                    </p>

                    <div className="mt-5 grid gap-3">
                      {result.proofBundle.checklist.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#e3e9e2]"
                        >
                          {item}
                        </div>
                      ))}
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b8c1b8]">
                        Planned route
                      </p>
                      <div className="mt-3 grid gap-3">
                        {result.approvedTrade.route.map((step) => (
                          <div
                            key={step}
                            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#dce3dc]"
                          >
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
