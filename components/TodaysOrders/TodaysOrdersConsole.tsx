"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Buffer } from "buffer";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Loader2,
  Radar,
  ScrollText,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { SOLANA_RPC_URL } from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  SAMPLE_WALLET_ADDRESS,
  TodaysOrdersHolding,
  TodaysOrdersResponse,
} from "@/lib/todaysOrders";

function compactUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function signedPct(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function compactAmount(value: number) {
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

function SourceBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-[#d9d1bf]">
      {label}
    </span>
  );
}

function HoldingRow({ holding }: { holding: TodaysOrdersHolding }) {
  return (
    <div className="grid grid-cols-[1.3fr_0.9fr_0.7fr_0.8fr] items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {holding.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={holding.icon}
              alt={holding.symbol}
              className="h-8 w-8 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-semibold text-[#f4c66a]">
              {holding.symbol.slice(0, 2)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#fff6de]">{holding.symbol}</p>
            <p className="truncate text-xs text-[#bcae8a]">{holding.name}</p>
          </div>
        </div>
      </div>
      <div className="text-right text-[#f3ead4]">
        <p>{compactUsd(holding.valueUsd)}</p>
        <p className="text-xs text-[#aebccc]">{compactAmount(holding.balance)} units</p>
      </div>
      <div className="text-right text-[#d5cab1]">{holding.allocationPct.toFixed(1)}%</div>
      <div
        className={cn(
          "text-right font-medium",
          (holding.priceChange24hPct ?? 0) >= 0 ? "text-[#84dfbd]" : "text-[#ff9ca6]",
        )}
      >
        {signedPct(holding.priceChange24hPct)}
      </div>
    </div>
  );
}

export function TodaysOrdersConsole() {
  const { login, authenticated } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TodaysOrdersResponse | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [executing, setExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    signature: string;
    explorerUrl: string;
  } | null>(null);

  const connectedWallet =
    solanaWallets.find((wallet) => wallet.walletClientType === "privy") || solanaWallets[0];

  async function runOrders(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);
    setCopyState("idle");

    try {
      setExecutionError(null);
      setReceipt(null);
      const response = await fetch("/api/todays-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: walletAddress.trim() || SAMPLE_WALLET_ADDRESS,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to generate today's orders");
      }

      setResult(payload as TodaysOrdersResponse);
    } catch (requestError: any) {
      setError(requestError?.message || "Failed to generate today's orders");
    } finally {
      setLoading(false);
    }
  }

  async function executeApprovedOrder() {
    if (!result?.executionPlan) {
      return;
    }

    if (!connectedWallet) {
      login();
      return;
    }

    setExecuting(true);
    setExecutionError(null);

    try {
      const swapResponse = await fetch("/api/todays-orders/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userPublicKey: connectedWallet.address,
          quoteResponse: result.executionPlan.quoteResponse,
        }),
      });

      const swapPayload = await swapResponse.json();

      if (!swapResponse.ok || !swapPayload?.ok || !swapPayload?.swapTransaction) {
        throw new Error(swapPayload?.error || "Failed to prepare swap transaction");
      }

      let transaction: Transaction | VersionedTransaction;

      try {
        transaction = VersionedTransaction.deserialize(
          Buffer.from(swapPayload.swapTransaction, "base64"),
        );
      } catch {
        transaction = Transaction.from(Buffer.from(swapPayload.swapTransaction, "base64"));
      }

      const signedTransaction = await connectedWallet.signTransaction(transaction as any);
      const connection = new Connection(SOLANA_RPC_URL, "confirmed");
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });
      const confirmation = await connection.confirmTransaction(signature, "confirmed");

      if (confirmation.value.err) {
        throw new Error(JSON.stringify(confirmation.value.err));
      }

      const explorerUrl = `https://solscan.io/tx/${signature}`;
      setReceipt({ signature, explorerUrl });
      setResult((current) =>
        current
          ? {
              ...current,
              executionPreview: {
                ...current.executionPreview,
                title: "执行推演已转为真实成交",
                summary: `军令已经广播并确认。签名 ${signature.slice(0, 8)}...${signature.slice(-8)} 已写入战报。`,
              },
              nightDebrief: {
                mode: "executed",
                title: "夜间战报：军令已执行",
                summary: `已完成 ${current.approvedOrder.title}。链上回执已经确认，可以进入结果复盘。`,
                bullets: [
                  `Tx signature: ${signature}`,
                  "下一步不是立刻再下第二条命令，而是等新的钱包姿态变化重新生成今日军令。",
                ],
              },
            }
          : current,
      );
    } catch (requestError: any) {
      setExecutionError(requestError?.message || "Execution failed");
    } finally {
      setExecuting(false);
    }
  }

  async function copyCommand(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("idle");
    }
  }

  const chatHref = result
    ? `/chat?input=${encodeURIComponent(result.approvedOrder.command)}`
    : `/chat?input=${encodeURIComponent(
        "Review my wallet posture and give me today's single approved order plus one forbidden order.",
      )}`;

  return (
    <section
      id="orders-console"
      className="rounded-[36px] border border-[#f4c66a]/12 bg-[#0b0f14]/94 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl md:p-10"
    >
      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#f4c66a]">
            Live console
          </p>
          <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#fff7e6] md:text-5xl">
            先给一个钱包，再给一条军令。
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[#cdbb97] md:text-lg">
            这里不是看概念图。输入任意 Solana 钱包，系统会读取真实持仓、
            市场上下文和交易 quote，把输出压成固定 5 段。
          </p>

          <div className="mt-8 space-y-4 rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3 text-[#fff4dc]">
              <Radar className="h-5 w-5 text-[#82dfff]" />
              <p className="font-semibold">How to use</p>
            </div>

            <ol className="space-y-3 text-sm leading-7 text-[#d8ccb4]">
              <li>1. 输入一个 Solana 钱包地址，或直接使用当前连接的钱包。</li>
              <li>2. 点击“生成今日军令”，系统会返回军情、军令、禁令、推演和战报预览。</li>
              <li>3. 如果军令成立，再把它送去 `/chat` 做执行确认和后续广播。</li>
            </ol>

            <div className="flex flex-wrap gap-2 pt-2">
              <SourceBadge label="Wallet / Portfolio" />
              <SourceBadge label="Market" />
              <SourceBadge label="Trade Quote" />
              <SourceBadge label="Receipt Handoff" />
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/8 bg-[#10151c] p-6">
          <form onSubmit={runOrders} className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8bd9c9]">
                Wallet input
              </label>
              <input
                value={walletAddress}
                onChange={(event) => setWalletAddress(event.target.value)}
                placeholder="Paste a Solana wallet, or load the demo wallet"
                className="mt-3 w-full rounded-[18px] border border-white/10 bg-[#0b0f14] px-4 py-4 text-sm text-[#fff4dc] outline-none transition focus:border-[#83e1cc]/40"
              />
              <p className="mt-3 text-xs leading-6 text-[#b7a98a]">
                不想手动找地址也可以直接载入示例钱包。结果会展示真实 wallet posture 和实时 quote。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {!authenticated ? (
                <button
                  type="button"
                  onClick={() => login()}
                  className="rounded-full border border-[#83e1cc]/22 bg-[#83e1cc]/10 px-4 py-2 text-sm font-medium text-[#8de6d3] transition hover:bg-[#83e1cc]/16"
                >
                  连接钱包
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => connectedWallet && setWalletAddress(connectedWallet.address)}
                disabled={!connectedWallet}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-[#f0e4c7] transition hover:border-[#f4c66a]/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45"
              >
                使用已连接钱包
              </button>

              <button
                type="button"
                onClick={() => setWalletAddress(SAMPLE_WALLET_ADDRESS)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-[#f0e4c7] transition hover:border-[#f4c66a]/20 hover:bg-white/[0.06]"
              >
                载入示例钱包
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-[#f4c66a] px-5 py-3 text-sm font-semibold text-[#171208] transition hover:bg-[#f1d183] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />}
                生成今日军令
              </button>

              <Link
                href={chatHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-[#f4deb2] transition hover:border-[#83e1cc]/30 hover:bg-[#83e1cc]/10"
              >
                打开 Chat 执行
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {connectedWallet ? (
              <div className="rounded-[18px] border border-[#83e1cc]/14 bg-[#83e1cc]/8 px-4 py-3 text-xs leading-6 text-[#cdebe4]">
                已检测到连接钱包：{connectedWallet.address}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[18px] border border-[#ff9ca6]/18 bg-[#ff9ca6]/10 px-4 py-3 text-sm text-[#ffd5d9]">
                {error}
              </div>
            ) : null}
          </form>
        </div>
      </div>

      {result ? (
        <div className="mt-10 space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <SourceBadge label={`Wallet: ${result.sources.wallet}`} />
            <SourceBadge label={`Market: ${result.sources.market}`} />
            <SourceBadge label={`Trade: ${result.sources.trade}`} />
            <SourceBadge label={`Receipt: ${result.sources.receipt}`} />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#8bd9c9]">Wallet value</p>
              <p className="mt-3 text-3xl font-semibold text-[#fff6de]">
                {compactUsd(result.summary.totalValueUsd)}
              </p>
              <p className="mt-2 text-xs text-[#b8c7d5]">
                {result.summary.tokenCount} holdings, {result.summary.pricedHoldingCount} priced
              </p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#8bd9c9]">Stable reserve</p>
              <p className="mt-3 text-3xl font-semibold text-[#fff6de]">
                {result.summary.stablecoinPct.toFixed(1)}%
              </p>
              <p className="mt-2 text-xs text-[#b8c7d5]">
                {compactUsd(result.summary.idleCapitalUsd)} idle capital
              </p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#8bd9c9]">Top concentration</p>
              <p className="mt-3 text-3xl font-semibold text-[#fff6de]">
                {result.summary.concentrationPct.toFixed(1)}%
              </p>
              <p className="mt-2 text-xs text-[#b8c7d5]">First bag pressure gauge</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#8bd9c9]">Native SOL</p>
              <p className="mt-3 text-3xl font-semibold text-[#fff6de]">
                {compactAmount(result.summary.nativeSol)}
              </p>
              <p className="mt-2 text-xs text-[#b8c7d5]">Current chain-native dry run asset</p>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-[28px] border border-[#72d5ff]/16 bg-[#091219] p-6">
              <div className="flex items-center gap-3 text-[#ecfbff]">
                <Radar className="h-5 w-5 text-[#82dfff]" />
                <h3 className="text-2xl font-semibold">今日军情</h3>
              </div>
              <p className="mt-4 text-lg leading-8 text-[#f4fbff]">{result.todayIntel.headline}</p>
              <p className="mt-3 text-sm leading-7 text-[#bfdce7]">{result.todayIntel.summary}</p>
              <div className="mt-5 space-y-3">
                {result.todayIntel.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d7ebf2]"
                  >
                    {bullet}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#83e1cc]/16 bg-[#0d1715] p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-[#effdf8]">
                  <ScrollText className="h-5 w-5 text-[#8de6d3]" />
                  <h3 className="text-2xl font-semibold">今日军令</h3>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                    result.approvedOrder.status === "approved"
                      ? "border border-[#83e1cc]/20 bg-[#83e1cc]/12 text-[#8de6d3]"
                      : "border border-[#f4c66a]/18 bg-[#f4c66a]/10 text-[#f4c66a]",
                  )}
                >
                  {result.approvedOrder.status === "approved" ? "Approved" : "Watch only"}
                </span>
              </div>
              <p className="mt-4 text-lg leading-8 text-[#f8fff9]">{result.approvedOrder.title}</p>
              <p className="mt-3 text-sm leading-7 text-[#cce8de]">{result.approvedOrder.thesis}</p>
              <div className="mt-5 rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8de6d3]">Execution command</p>
                <p className="mt-3 text-sm leading-7 text-[#f1f8f4]">{result.approvedOrder.command}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => copyCommand(result.approvedOrder.command)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#f4deb2] transition hover:bg-white/[0.08]"
                  >
                    <Copy className="h-4 w-4" />
                    {copyState === "copied" ? "已复制" : "复制命令"}
                  </button>
                  <Link
                    href={chatHref}
                    className="inline-flex items-center gap-2 rounded-full bg-[#83e1cc] px-4 py-2 text-sm font-semibold text-[#06261f] transition hover:bg-[#9aecda]"
                  >
                    送去 Chat 执行
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={executeApprovedOrder}
                    disabled={
                      result.approvedOrder.status !== "approved" ||
                      !result.executionPlan ||
                      executing
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-[#f4c66a]/20 bg-[#f4c66a]/10 px-4 py-2 text-sm font-semibold text-[#f4c66a] transition hover:bg-[#f4c66a]/16 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {executing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {connectedWallet ? "直接执行军令" : "连接钱包后执行"}
                  </button>
                </div>
              </div>
              {executionError ? (
                <div className="mt-4 rounded-[18px] border border-[#ff9ca6]/18 bg-[#ff9ca6]/10 px-4 py-3 text-sm text-[#ffd5d9]">
                  {executionError}
                </div>
              ) : null}
            </div>

            <div className="rounded-[28px] border border-[#ff9ca6]/16 bg-[#160d12] p-6">
              <div className="flex items-center gap-3 text-[#fff0f1]">
                <ShieldAlert className="h-5 w-5 text-[#ffb0b4]" />
                <h3 className="text-2xl font-semibold">今日禁令</h3>
              </div>
              <p className="mt-4 text-lg leading-8 text-[#fff5f5]">{result.forbiddenOrder.title}</p>
              <p className="mt-3 text-sm leading-7 text-[#f0ced2]">{result.forbiddenOrder.thesis}</p>
              <div className="mt-5 rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#ffb0b4]">{result.forbiddenOrder.riskTag}</p>
                <p className="mt-3 text-sm leading-7 text-[#f7dde0]">{result.forbiddenOrder.command}</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#5bc5e9]/16 bg-[#091219] p-6">
              <div className="flex items-center gap-3 text-[#ecfbff]">
                <Wallet className="h-5 w-5 text-[#82dfff]" />
                <h3 className="text-2xl font-semibold">执行推演</h3>
              </div>
              <p className="mt-4 text-lg leading-8 text-[#f4fbff]">{result.executionPreview.title}</p>
              <p className="mt-3 text-sm leading-7 text-[#bfdce7]">{result.executionPreview.summary}</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#82dfff]">Estimated output</p>
                  <p className="mt-3 text-xl font-semibold text-[#f3fbff]">
                    {result.executionPreview.estimatedOutput || "n/a"}
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#82dfff]">Price impact</p>
                  <p className="mt-3 text-xl font-semibold text-[#f3fbff]">
                    {result.executionPreview.priceImpactPct === null ||
                    typeof result.executionPreview.priceImpactPct === "undefined"
                      ? "n/a"
                      : `${result.executionPreview.priceImpactPct.toFixed(3)}%`}
                  </p>
                </div>
              </div>
              {result.executionPreview.route.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.executionPreview.route.map((route) => (
                    <SourceBadge key={route} label={route} />
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#c9a6ff]/16 bg-[#120d1d] p-6">
            <div className="flex items-center gap-3 text-[#fff4ff]">
              <ScrollText className="h-5 w-5 text-[#d4b7ff]" />
              <h3 className="text-2xl font-semibold">夜间战报</h3>
            </div>
            <p className="mt-4 text-lg leading-8 text-[#f8f0ff]">{result.nightDebrief.title}</p>
            <p className="mt-3 text-sm leading-7 text-[#dfcfef]">{result.nightDebrief.summary}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {result.nightDebrief.bullets.map((bullet) => (
                <div
                  key={bullet}
                  className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#f3e7ff]"
                >
                  {bullet}
                </div>
              ))}
            </div>
            {receipt ? (
              <div className="mt-5 rounded-[18px] border border-[#d4b7ff]/18 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#d4b7ff]">Receipt</p>
                <p className="mt-3 break-all text-sm leading-7 text-[#f8edff]">
                  {receipt.signature}
                </p>
                <Link
                  href={receipt.explorerUrl}
                  target="_blank"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#f4deb2] transition hover:bg-white/[0.08]"
                >
                  在 Solscan 查看回执
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#0f1218] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#8bd9c9]">Wallet posture</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#fff4d8]">Top holdings</h3>
              </div>
              <p className="text-sm text-[#bcae8a]">Wallet: {result.walletAddress}</p>
            </div>

            <div className="mt-5 grid grid-cols-[1.3fr_0.9fr_0.7fr_0.8fr] gap-3 px-4 text-xs uppercase tracking-[0.18em] text-[#8bd9c9]">
              <p>Asset</p>
              <p className="text-right">Value</p>
              <p className="text-right">Alloc</p>
              <p className="text-right">24h</p>
            </div>
            <div className="mt-3 space-y-3">
              {result.holdings.map((holding) => (
                <HoldingRow key={holding.mint} holding={holding} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
