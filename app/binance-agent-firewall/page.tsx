"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Shield,
  Sparkles,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { BinanceFirewallResponse, FirewallStatus } from "@/lib/binanceFirewall";
import {
  BinanceFirewallSharePayload,
  serializeBinanceFirewallSharePayload,
} from "@/lib/binanceFirewallShare";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

const EXAMPLES = [
  {
    id: "danger",
    label: "危险合约型",
    symbols: "BNB, SOL, PEPE",
    prompt:
      "每15分钟扫描 BNB、SOL、PEPE。只要 1h 涨幅超过 3%，就在 Binance 合约用 20x 开多，单笔使用 35% 余额，无需人工确认；若回撤则继续加仓摊平。",
  },
  {
    id: "balanced",
    label: "受限现货型",
    symbols: "BNB, BTC, ETH",
    prompt:
      "只交易 BNB、BTC、ETH 现货。单笔不超过账户 8%，仅使用限价单，必须人工确认；若 1h 波动超过 3% 则暂停。每次建议必须附 entry、stop loss、take profit。",
  },
  {
    id: "observe",
    label: "只读观察型",
    symbols: "BNB, BTC, ETH, SOL",
    prompt:
      "只监控 BNB、BTC、ETH、SOL 的 24h 涨幅、盘口点差和 1h 波动，不直接下单。若出现异常波动，只输出观察结论和限价单草案，最终执行必须由人工确认。",
  },
] as const;

const statusStyles: Record<
  FirewallStatus,
  {
    badge: string;
    panel: string;
    icon: typeof Shield;
    title: string;
  }
> = {
  PASS: {
    badge: "bg-emerald-400/14 text-emerald-200 border-emerald-300/20",
    panel: "from-emerald-400/18 via-emerald-300/8 to-transparent",
    icon: CheckCircle2,
    title: "Pass",
  },
  WARN: {
    badge: "bg-amber-400/14 text-amber-100 border-amber-300/20",
    panel: "from-amber-300/18 via-amber-200/8 to-transparent",
    icon: TriangleAlert,
    title: "Warn",
  },
  BLOCK: {
    badge: "bg-rose-400/14 text-rose-100 border-rose-300/20",
    panel: "from-rose-400/18 via-rose-200/8 to-transparent",
    icon: ShieldAlert,
    title: "Block",
  },
};

const severityStyles = {
  critical: "border-rose-300/18 bg-rose-400/10 text-rose-100",
  high: "border-orange-300/18 bg-orange-400/10 text-orange-50",
  medium: "border-amber-300/18 bg-amber-400/10 text-amber-50",
  info: "border-emerald-300/18 bg-emerald-400/10 text-emerald-50",
} as const;

const dimensionTone = (score: number) => {
  if (score >= 80) return "from-emerald-300 to-lime-200 text-[#0d110f]";
  if (score >= 60) return "from-amber-300 to-yellow-200 text-[#1b1407]";
  return "from-rose-300 to-orange-200 text-[#1b0d0f]";
};

const permissionLabels = {
  READ: "只读",
  SPOT_TRADE: "现货下单",
  MARGIN: "保证金",
  FUTURES: "合约下单",
  TRANSFER: "账户划转",
  WITHDRAW: "提币",
} as const;

const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);

const formatPct = (value: number, digits = 2) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;

const buildSharePayload = (
  analysis: BinanceFirewallResponse,
): BinanceFirewallSharePayload => ({
  status: analysis.status,
  safetyScore: analysis.safetyScore,
  verdict: analysis.verdict,
  summary: analysis.summary,
  primaryFinding:
    analysis.findings.find((item) => item.severity !== "info")?.title ||
    "No major issue found",
  primaryGuardrail: `${analysis.probationProfile.title} · ${analysis.guardrails[0]?.title}: ${analysis.guardrails[0]?.value || "READ only"}`,
  symbols: analysis.marketSignals.slice(0, 3).map((signal) => ({
    symbol: signal.symbol,
    change24hPct: signal.change24hPct,
    spreadBps: signal.spreadBps,
    intradayRangePct: signal.intradayRangePct,
  })),
  dimensions: analysis.dimensions.map((dimension) => ({
    label: dimension.label,
    score: dimension.score,
  })),
  generatedAt: analysis.generatedAt,
});

export default function BinanceAgentFirewallPage() {
  const copyToClipboard = useCopyToClipboard();
  const [prompt, setPrompt] = useState<string>(EXAMPLES[0].prompt);
  const [symbols, setSymbols] = useState<string>(EXAMPLES[0].symbols);
  const [analysis, setAnalysis] = useState<BinanceFirewallResponse | null>(
    null,
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleLoadExample = (exampleId: string) => {
    const next = EXAMPLES.find((item) => item.id === exampleId);
    if (!next) {
      return;
    }

    setPrompt(next.prompt);
    setSymbols(next.symbols);
    setAnalysis(null);
    setError("");
    setCopied("");
  };

  const handleCopy = async (value: string, label: string) => {
    const ok = await copyToClipboard(value);
    if (!ok) {
      return;
    }

    setCopied(label);
    window.setTimeout(() => setCopied(""), 1800);
  };

  const handleRun = async () => {
    if (!prompt.trim()) {
      setError("先贴一段 AI 交易 prompt。");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/binance-agent-firewall", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          symbols,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Binance firewall analysis failed");
      }

      setAnalysis(payload);
    } catch (runError) {
      setAnalysis(null);
      setError(
        runError instanceof Error
          ? runError.message
          : "Binance firewall analysis failed",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const shareUrl = analysis
    ? `/api/binance-agent-firewall/share-image?payload=${encodeURIComponent(
        serializeBinanceFirewallSharePayload(buildSharePayload(analysis)),
      )}`
    : "";

  const handleDownloadShareCard = async () => {
    if (!shareUrl) {
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(shareUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "miraix-binance-agent-firewall.png";
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Share card download failed",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const currentStatus = analysis
    ? statusStyles[analysis.status]
    : statusStyles.BLOCK;
  const StatusIcon = currentStatus.icon;
  const probationCounts = analysis
    ? {
        allow: analysis.binanceNativeSignals.filter(
          (signal) => signal.probation === "ALLOW",
        ).length,
        watch: analysis.binanceNativeSignals.filter(
          (signal) => signal.probation === "WATCH",
        ).length,
        block: analysis.binanceNativeSignals.filter(
          (signal) => signal.probation === "BLOCK",
        ).length,
      }
    : null;

  return (
    <main className="min-h-screen overflow-y-auto bg-[#07070a] text-[#fff7e6]">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.20),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.16),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(163,230,53,0.10),_transparent_18%),linear-gradient(180deg,_#111114_0%,_#09090b_38%,_#050507_100%)]" />
        <div className="absolute inset-x-0 top-0 h-80 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),transparent_44%,rgba(251,191,36,0.10)_80%)] blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-20 pt-24 md:px-8">
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#facc15]/30 bg-[#facc15]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#fde68a]">
                <Shield className="h-3.5 w-3.5" />
                Binance Agent Firewall
              </div>
              <h1 className="mt-5 max-w-4xl font-serif text-4xl font-semibold tracking-tight text-[#fff7e6] md:text-6xl">
                先审 AI 交易员，再让它碰 Binance。
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#dbcba8] md:text-lg">
                这不是另一个看盘页，而是一个执行前审判台。你把 OpenClaw prompt
                或 AI 策略丢进来，Miraix
                会把它拆成权限、执行、市场和复现四个维度，再结合 Binance
                全市场宇宙里的流动性、拥挤度和过热层级，给出{" "}
                <span className="text-[#fff4c2]">Pass / Warn / Block</span>{" "}
                裁决。
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {EXAMPLES.map((example) => (
                  <button
                    key={example.id}
                    type="button"
                    onClick={() => handleLoadExample(example.id)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-[#f5deb3] transition hover:border-[#facc15]/24 hover:bg-[#facc15]/10 hover:text-[#fff8dd]"
                  >
                    {example.label}
                  </button>
                ))}
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-[26px] border border-white/8 bg-black/20 p-5">
                  <label className="text-sm font-semibold uppercase tracking-[0.18em] text-[#fde68a]">
                    Watchlist
                  </label>
                  <input
                    value={symbols}
                    onChange={(event) => setSymbols(event.target.value)}
                    placeholder="BNB, BTC, ETH"
                    className="mt-3 h-14 w-full rounded-2xl border border-white/10 bg-[#0e0e11] px-4 text-sm text-[#fff7ea] outline-none transition placeholder:text-[#857a64] focus:border-[#facc15]/40"
                  />
                  <p className="mt-3 text-sm leading-6 text-[#aa9a76]">
                    可以直接写 `BNB, SOL, PEPE`，也可以把 symbol 放进 prompt
                    里。
                  </p>
                </div>

                <div className="rounded-[26px] border border-white/8 bg-black/20 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#fde68a]">
                    活动偏好
                  </p>
                  <div className="mt-4 grid gap-3">
                    {[
                      "不是聊天顾问，而是执行前的安全编译器",
                      "真实 Binance 数据接入，而不是 mock",
                      "会对照整个 Binance 市场宇宙做相对评级",
                      "有围栏策略、有裁决结果、可截图分享",
                      "任何人都能复现：prompt in, verdict out",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-[#f4deb2]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[28px] border border-white/10 bg-[#0d0d10] p-5">
                <label className="text-sm font-semibold uppercase tracking-[0.18em] text-[#fde68a]">
                  AI Strategy Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={9}
                  className="mt-3 w-full rounded-[24px] border border-white/10 bg-[#09090b] px-4 py-4 text-sm leading-7 text-[#fff7ea] outline-none transition placeholder:text-[#857a64] focus:border-[#facc15]/40"
                  placeholder="贴一段 AI 交易策略..."
                />

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-full bg-[#facc15] px-5 py-3 text-sm font-semibold text-[#171208] transition hover:bg-[#f6d655] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Run Firewall
                  </button>
                  <Link
                    href="/agent-hub"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-[#f4deb2] transition hover:border-[#facc15]/20 hover:bg-[#facc15]/10"
                  >
                    Agent Hub
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {error ? (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-300/18 bg-rose-400/10 px-4 py-3 text-sm text-rose-50">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#fde68a]">
                Judging Fit
              </p>
              <div className="mt-5 grid gap-4">
                {[
                  {
                    title: "结合度",
                    body: "Binance 的公开市场接口不是装饰，而是直接进入风控裁决和 guardrail 生成。",
                  },
                  {
                    title: "实用性",
                    body: "真实用户担心的不是“看不看得懂图”，而是“AI 会不会乱动我的账户”。",
                  },
                  {
                    title: "创新性",
                    body: "从交易助手换成交易前的 probation officer，这个角色切法更新鲜。",
                  },
                  {
                    title: "可复现性",
                    body: "不给 API Key 也能完整演示：贴 prompt、拉 Binance 数据、出裁决、导出卡片。",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[24px] border border-white/8 bg-black/20 p-5"
                  >
                    <p className="text-lg font-semibold text-[#fff6de]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[#ccb993]">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[28px] border border-white/8 bg-[#0d0d10] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#fde68a]">
                  Live Inputs Used
                </p>
                <div className="mt-4 grid gap-3">
                  {[
                    "Binance market universe scan",
                    "24hr ticker",
                    "depth order book",
                    "1h uiKlines",
                    "futures funding (best effort)",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-[#f4deb2]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {analysis ? (
            <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="space-y-6">
                <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
                  <div
                    className={`rounded-[30px] border border-white/8 bg-gradient-to-br ${currentStatus.panel} p-6`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-2xl">
                        <div
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${currentStatus.badge}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {currentStatus.title}
                        </div>
                        <h2 className="mt-4 text-3xl font-semibold text-[#fff7e6] md:text-4xl">
                          {analysis.verdict}
                        </h2>
                        <p className="mt-4 max-w-3xl text-base leading-8 text-[#d9c79f]">
                          {analysis.summary}
                        </p>
                      </div>

                      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#facc15] via-[#f59e0b] to-[#fff3c4] text-4xl font-semibold text-[#1a1206] shadow-[0_20px_80px_rgba(250,204,21,0.20)]">
                        {Math.round(analysis.safetyScore)}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {analysis.watchlist.map((symbol) => (
                        <div
                          key={symbol}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-[#fff0c8]"
                        >
                          {symbol}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#fde68a]">
                          Probation Profile
                        </p>
                        <h3 className="mt-3 text-2xl font-semibold text-[#fff6de]">
                          {analysis.probationProfile.title}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-[#d9c79f]">
                          {analysis.probationProfile.summary}
                        </p>
                        <div className="mt-4 space-y-3 text-sm text-[#d9c79f]">
                          {[
                            {
                              label: "Allowed",
                              values: analysis.probationProfile.allowedSymbols,
                            },
                            {
                              label: "Watch-only",
                              values:
                                analysis.probationProfile.watchOnlySymbols,
                            },
                            {
                              label: "Blocked",
                              values: analysis.probationProfile.blockedSymbols,
                            },
                          ].map((group) => (
                            <div key={group.label}>
                              <p className="text-[11px] uppercase tracking-[0.18em] text-[#9f916f]">
                                {group.label}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {(group.values.length
                                  ? group.values
                                  : ["none"]
                                ).map((value) => (
                                  <span
                                    key={`${group.label}-${value}`}
                                    className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-xs text-[#f5deb3]"
                                  >
                                    {value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#fde68a]">
                          Universe Decision
                        </p>
                        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                          {[
                            {
                              label: "ALLOW",
                              value: probationCounts?.allow || 0,
                              tone: "text-emerald-200",
                            },
                            {
                              label: "WATCH",
                              value: probationCounts?.watch || 0,
                              tone: "text-amber-100",
                            },
                            {
                              label: "BLOCK",
                              value: probationCounts?.block || 0,
                              tone: "text-rose-100",
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-4"
                            >
                              <div
                                className={`text-2xl font-semibold ${item.tone}`}
                              >
                                {item.value}
                              </div>
                              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#9f916f]">
                                {item.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {analysis.dimensions.map((dimension) => (
                      <div
                        key={dimension.key}
                        className="rounded-[26px] border border-white/8 bg-black/20 p-5"
                      >
                        <div
                          className={`inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${dimensionTone(
                            dimension.score,
                          )} text-xl font-semibold shadow-[0_14px_40px_rgba(0,0,0,0.22)]`}
                        >
                          {Math.round(dimension.score)}
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-[#fff5dd]">
                          {dimension.label}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-[#ccb993]">
                          {dimension.insight}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#fde68a]">
                        Findings
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-[#fff5de]">
                        为什么会被拦下，或者被放行
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {analysis.findings.map((finding) => (
                      <div
                        key={`${finding.severity}-${finding.title}`}
                        className={`rounded-[24px] border px-5 py-4 ${severityStyles[finding.severity]}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                            {finding.severity}
                          </span>
                          <h4 className="text-lg font-semibold">
                            {finding.title}
                          </h4>
                        </div>
                        <p className="mt-3 text-sm leading-7 opacity-90">
                          {finding.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#fde68a]">
                        Safe Prompt
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-[#fff5de]">
                        给 OpenClaw 的安全改写版
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(analysis.safePrompt, "safe-prompt")
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-[#f4deb2] transition hover:border-[#facc15]/20 hover:bg-[#facc15]/10"
                    >
                      <Copy className="h-4 w-4" />
                      {copied === "safe-prompt" ? "已复制" : "复制安全 Prompt"}
                    </button>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[28px] border border-white/8 bg-[#09090b]">
                    <pre className="overflow-x-auto whitespace-pre-wrap px-5 py-5 text-sm leading-7 text-[#fff1ca]">
                      <code>{analysis.safePrompt}</code>
                    </pre>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#fde68a]">
                        Market Proof
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-[#fff5de]">
                        Binance 实时证据
                      </h3>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#cdbb97]">
                      {analysis.futuresDataAvailable
                        ? "Funding online"
                        : "Funding unavailable"}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {analysis.marketSignals.map((signal) => (
                      <div
                        key={signal.symbol}
                        className="rounded-[26px] border border-white/8 bg-black/20 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="text-2xl font-semibold text-[#fff5de]">
                              {signal.symbol}
                            </div>
                            <div className="mt-2 text-sm text-[#cdbb97]">
                              {signal.trend} · liquidity {signal.liquidityTier}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-semibold text-[#fff8ed]">
                              {formatUsd(signal.lastPrice)}
                            </div>
                            <div
                              className={`mt-2 text-sm font-medium ${
                                signal.change24hPct >= 0
                                  ? "text-emerald-200"
                                  : "text-rose-200"
                              }`}
                            >
                              {formatPct(signal.change24hPct)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                          {[
                            {
                              label: "Spread",
                              value: `${signal.spreadBps.toFixed(2)} bps`,
                            },
                            {
                              label: "Book depth",
                              value: formatUsd(signal.bookLiquidityUsd),
                            },
                            {
                              label: "1d range",
                              value: `${signal.intradayRangePct.toFixed(2)}%`,
                            },
                            {
                              label: "Funding",
                              value:
                                signal.fundingRatePct === null
                                  ? "unavailable"
                                  : `${signal.fundingRatePct.toFixed(4)}%`,
                            },
                          ].map((item) => (
                            <div
                              key={`${signal.symbol}-${item.label}`}
                              className="rounded-2xl border border-white/8 bg-white/[0.04] p-4"
                            >
                              <p className="text-[11px] uppercase tracking-[0.18em] text-[#9f916f]">
                                {item.label}
                              </p>
                              <p className="mt-2 text-sm font-semibold text-[#fff5dd]">
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-[26px] border border-white/8 bg-[#09090b] p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#fde68a]">
                      Data Sources
                    </p>
                    <div className="mt-3 space-y-2 text-sm leading-7 text-[#ccb993]">
                      {analysis.dataSources.map((item) => (
                        <div key={item}>{item}</div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#fde68a]">
                    Binance Native Layer
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#fff5de]">
                    对照 Binance 市场宇宙之后，这些标的分别属于哪一档
                  </h3>

                  <div className="mt-5 space-y-3">
                    {analysis.binanceNativeSignals.map((signal) => (
                      <div
                        key={signal.symbol}
                        className="rounded-[24px] border border-white/8 bg-black/20 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="text-xl font-semibold text-[#fff5de]">
                              {signal.symbol}
                            </h4>
                            <p className="mt-2 text-sm text-[#cdbb97]">
                              {signal.universeTier} · Binance universe size{" "}
                              {analysis.universeContext.universeSize}
                            </p>
                          </div>
                          <div
                            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                              signal.probation === "ALLOW"
                                ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                                : signal.probation === "WATCH"
                                  ? "border-amber-300/20 bg-amber-400/10 text-amber-100"
                                  : "border-rose-300/20 bg-rose-400/10 text-rose-100"
                            }`}
                          >
                            {signal.probation}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                          {[
                            {
                              label: "Volume rank",
                              value: `${signal.volumeRankPct.toFixed(1)}%`,
                            },
                            {
                              label: "Momentum rank",
                              value: `${signal.momentumRankPct.toFixed(1)}%`,
                            },
                            {
                              label: "Hype rank",
                              value: `${signal.hypeRankPct.toFixed(1)}%`,
                            },
                          ].map((item) => (
                            <div
                              key={`${signal.symbol}-${item.label}`}
                              className="rounded-2xl border border-white/8 bg-white/[0.04] p-4"
                            >
                              <p className="text-[11px] uppercase tracking-[0.18em] text-[#9f916f]">
                                {item.label}
                              </p>
                              <p className="mt-2 text-sm font-semibold text-[#fff5de]">
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        <p className="mt-4 text-sm leading-7 text-[#ccb993]">
                          {signal.note}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {[
                      {
                        label: "Top liquidity",
                        value:
                          analysis.universeContext.topLiquiditySymbols.join(
                            ", ",
                          ),
                      },
                      {
                        label: "Top momentum",
                        value:
                          analysis.universeContext.topMomentumSymbols.join(
                            ", ",
                          ),
                      },
                      {
                        label: "Top hype",
                        value:
                          analysis.universeContext.topHypeSymbols.join(", "),
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[24px] border border-white/8 bg-[#09090b] p-4"
                      >
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#fde68a]">
                          {item.label}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[#ccb993]">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#fde68a]">
                    Permission Matrix
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#fff5de]">
                    哪些 Binance 权限能给，哪些绝对别给
                  </h3>

                  <div className="mt-5 space-y-3">
                    {analysis.permissionPlan.map((item) => (
                      <div
                        key={item.scope}
                        className="rounded-[24px] border border-white/8 bg-black/20 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h4 className="text-lg font-semibold text-[#fff5dd]">
                            {permissionLabels[item.scope]}
                          </h4>
                          <div
                            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                              item.status === "required"
                                ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                                : item.status === "optional"
                                  ? "border-amber-300/20 bg-amber-400/10 text-amber-100"
                                  : "border-rose-300/20 bg-rose-400/10 text-rose-100"
                            }`}
                          >
                            {item.status}
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[#ccb993]">
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#fde68a]">
                    Guardrails
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#fff5de]">
                    真正应该交给 Binance 的，是这些约束
                  </h3>

                  <div className="mt-5 space-y-3">
                    {analysis.guardrails.map((guardrail) => (
                      <div
                        key={`${guardrail.title}-${guardrail.value}`}
                        className="rounded-[24px] border border-white/8 bg-black/20 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h4 className="text-lg font-semibold text-[#fff5dd]">
                            {guardrail.title}
                          </h4>
                          <div className="rounded-full border border-[#facc15]/20 bg-[#facc15]/10 px-3 py-1 text-sm text-[#fce8a5]">
                            {guardrail.value}
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[#ccb993]">
                          {guardrail.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#fde68a]">
                    Probation Runbook
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#fff5de]">
                    如果今天真要在 Binance 上岗，就按这套流程走
                  </h3>

                  <div className="mt-5 space-y-3">
                    {analysis.probationProfile.operatorRunbook.map(
                      (item, index) => (
                        <div
                          key={item}
                          className="rounded-[24px] border border-white/8 bg-black/20 p-5"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#facc15]/24 bg-[#facc15]/10 text-sm font-semibold text-[#fde68a]">
                              {index + 1}
                            </div>
                            <p className="text-sm leading-7 text-[#ccb993]">
                              {item}
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#fde68a]">
                        Share Surface
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-[#fff5de]">
                        传播层也准备好了
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(analysis.shareText, "share-text")
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-[#f4deb2] transition hover:border-[#facc15]/20 hover:bg-[#facc15]/10"
                      >
                        <Copy className="h-4 w-4" />
                        {copied === "share-text" ? "已复制" : "复制文案"}
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadShareCard}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-2 rounded-full bg-[#facc15] px-4 py-2 text-sm font-semibold text-[#171208] transition hover:bg-[#f4d760] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {isDownloading ? "生成中..." : "下载卡片"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[28px] border border-white/8 bg-[#09090b] p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#fde68a]">
                        X Copy
                      </p>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#fff0c8]">
                        {analysis.shareText}
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-[28px] border border-white/8 bg-[#09090b]">
                      {shareUrl ? (
                        <img
                          src={shareUrl}
                          alt="Binance Agent Firewall share card"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-[34px] border border-dashed border-white/12 bg-white/[0.03] p-8 text-center backdrop-blur-xl">
              <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#facc15]/24 bg-[#facc15]/10 text-[#fce7a1]">
                <Shield className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-3xl font-semibold text-[#fff6de]">
                现在缺的不是创意，是裁决结果。
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-[#ccb993]">
                贴入一段 AI 交易 prompt，我们就能立刻判断它对 Binance
                来说是可控的助手，还是会把账户变成事故现场的失控 operator。
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
