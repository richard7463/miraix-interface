"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CandlestickChart,
  CircleAlert,
  Loader2,
  Radar,
  RefreshCcw,
  ShieldCheck,
  ShieldX,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  PacificaFundingCurve,
  PacificaRiskRoomResponse,
  PacificaRiskStatus,
} from "@/lib/pacificaRiskRoom";

const SOURCE_LABELS = {
  live: "Live Pacifica data",
  sample: "Sample mode",
  none: "Unavailable",
} as const;

const RISK_TONES: Record<
  PacificaRiskStatus,
  {
    accent: string;
    badge: string;
    ringTrack: string;
    ringInner: string;
  }
> = {
  stable: {
    accent: "#12946f",
    badge:
      "border border-emerald-600/20 bg-emerald-500/12 text-emerald-200 dark:text-emerald-100",
    ringTrack: "rgba(18, 148, 111, 0.22)",
    ringInner: "#0e151b",
  },
  watch: {
    accent: "#d97706",
    badge:
      "border border-amber-600/20 bg-amber-500/12 text-amber-100 dark:text-amber-50",
    ringTrack: "rgba(217, 119, 6, 0.24)",
    ringInner: "#171108",
  },
  critical: {
    accent: "#d9485f",
    badge:
      "border border-rose-600/20 bg-rose-500/12 text-rose-100 dark:text-rose-50",
    ringTrack: "rgba(217, 72, 95, 0.22)",
    ringInner: "#190d12",
  },
};

const ACTION_LABELS = {
  wait: "Wait",
  probe: "Probe",
  reduce: "Reduce",
  hedge: "Hedge",
} as const;

const DEFAULT_SYMBOLS = "BTC, ETH, SOL, XRP, HYPE, PUMP";

const DISPLAY_SERIF = {
  fontFamily:
    '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
} as const;

const compactUsdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatUsd(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
  }).format(value);
}

function formatCompactUsd(value: number) {
  return compactUsdFormatter.format(value);
}

function formatPct(value: number, digits = 2) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function formatFundingRate(value: number) {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(4)}%`;
}

function formatTime(timestamp: number | null) {
  if (!timestamp) {
    return "n/a";
  }

  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function InfoPill({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
        tone === "dark"
          ? "border border-white/10 bg-white/[0.06] text-[#d4e0e9]"
          : "border border-[#d8cfbf] bg-[#f7f1e6] text-[#57687a]",
      )}
    >
      {children}
    </span>
  );
}

function BoardStat({
  label,
  value,
  detail,
  tone = "light",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "light" | "dark";
}) {
  return (
    <article
      className={cn(
        "rounded-[24px] border p-4",
        tone === "dark"
          ? "border-white/10 bg-white/[0.04] text-[#f3ede2]"
          : "border-[#ddd4c4] bg-[#f6efe4] text-[#14212f]",
      )}
    >
      <div
        className={cn(
          "font-mono text-[11px] uppercase tracking-[0.24em]",
          tone === "dark" ? "text-[#9bb0c0]" : "text-[#67788b]",
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "mt-3 text-[28px] font-semibold leading-none tracking-[-0.05em]",
          tone === "dark" ? "text-white" : "text-[#14212f]",
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "mt-2 text-sm leading-6",
          tone === "dark" ? "text-[#bfd0dc]" : "text-[#5f7184]",
        )}
      >
        {detail}
      </div>
    </article>
  );
}

function SectionFrame({
  tone,
  label,
  title,
  body,
  icon: Icon,
  aside,
  children,
}: {
  tone: "light" | "dark";
  label: string;
  title: string;
  body: string;
  icon: typeof Activity;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const isDark = tone === "dark";

  return (
    <section
      className={cn(
        "rounded-[34px] border p-6 md:p-7",
        isDark
          ? "border-[#223445] bg-[#0f1720] text-[#f5efe4] shadow-[0_30px_80px_rgba(6,13,19,0.36)]"
          : "border-[#d8cfbf] bg-[#fffaf0] text-[#14212f] shadow-[0_24px_70px_rgba(106,84,57,0.08)]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-3xl">
          <div
            className={cn(
              "inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.26em]",
              isDark ? "text-[#9dc1da]" : "text-[#698196]",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </div>
          <h2
            className={cn(
              "mt-4 text-[34px] font-semibold leading-[0.94] tracking-[-0.06em]",
              isDark ? "text-white" : "text-[#14212f]",
            )}
            style={DISPLAY_SERIF}
          >
            {title}
          </h2>
          <p
            className={cn(
              "mt-3 max-w-3xl text-sm leading-7",
              isDark ? "text-[#bfd0dc]" : "text-[#5e7185]",
            )}
          >
            {body}
          </p>
        </div>
        {aside}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Sparkline({
  values,
  stroke,
  tone = "dark",
}: {
  values: number[];
  stroke: string;
  tone?: "light" | "dark";
}) {
  if (values.length < 2) {
    return (
      <div
        className={cn(
          "flex h-24 items-center justify-center rounded-[22px] border text-xs uppercase tracking-[0.22em]",
          tone === "dark"
            ? "border-white/10 bg-white/[0.04] text-[#91a8ba]"
            : "border-[#ddd4c4] bg-[#f4ede2] text-[#6e8193]",
        )}
      >
        No history
      </div>
    );
  }

  const width = 280;
  const height = 96;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-24 w-full overflow-visible"
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function VerdictDial({
  score,
  status,
}: {
  score: number;
  status: PacificaRiskStatus;
}) {
  const tone = RISK_TONES[status];
  const sweep = Math.max(18, Math.round(score * 3.6));

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative flex h-32 w-32 items-center justify-center rounded-full p-[10px]"
        style={{
          background: `conic-gradient(${tone.accent} 0deg ${sweep}deg, ${tone.ringTrack} ${sweep}deg 360deg)`,
        }}
      >
        <div
          className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/8 text-white"
          style={{ backgroundColor: tone.ringInner }}
        >
          <div className="text-[38px] font-semibold leading-none tracking-[-0.06em]">
            {score}
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.26em] text-[#94a7b7]">
            Risk score
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <div className={cn("inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]", tone.badge)}>
          {status}
        </div>
        <div className="mt-3 max-w-[220px] text-sm leading-6 text-[#cbd8e0]">
          Score blends funding drag, margin usage, liquidation distance, and crowding.
        </div>
      </div>
    </div>
  );
}

function MarketBoardRow({
  market,
  isActive,
  onSelect,
}: {
  market: PacificaRiskRoomResponse["marketSnapshot"][number];
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-[28px] border p-5 text-left transition duration-200",
        isActive
          ? "border-[#113755] bg-[#0f1f2e] text-white shadow-[0_20px_48px_rgba(10,28,45,0.32)]"
          : "border-[#ddd4c4] bg-[#f6efe4] text-[#14212f] hover:-translate-y-0.5 hover:border-[#cbbba5]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="text-[28px] font-semibold leading-none tracking-[-0.05em]">
              {market.symbol}
            </div>
            <InfoPill tone={isActive ? "dark" : "light"}>
              Crowd {market.crowdedScore.toFixed(1)}
            </InfoPill>
          </div>
          <div
            className={cn(
              "mt-2 text-sm",
              isActive ? "text-[#abc0d1]" : "text-[#647689]",
            )}
          >
            {market.isolatedOnly ? "Isolated-only market" : `${market.maxLeverage}x leverage ceiling`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-semibold tracking-[-0.05em]">
            {market.mark >= 100 ? formatUsd(market.mark) : market.mark.toFixed(4)}
          </div>
          <div
            className={cn(
              "mt-1 text-sm font-medium",
              market.change24hPct >= 0 ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {formatPct(market.change24hPct)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[18px] border border-black/8 bg-black/[0.04] px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#7a8ea1]">
            Next funding
          </div>
          <div className="mt-2 text-sm font-semibold">{formatFundingRate(market.nextFundingRate)}</div>
        </div>
        <div className="rounded-[18px] border border-black/8 bg-black/[0.04] px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#7a8ea1]">
            OI
          </div>
          <div className="mt-2 text-sm font-semibold">{compactNumberFormatter.format(market.openInterest)}</div>
        </div>
        <div className="rounded-[18px] border border-black/8 bg-black/[0.04] px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#7a8ea1]">
            Volume
          </div>
          <div className="mt-2 text-sm font-semibold">{formatCompactUsd(market.volume24h)}</div>
        </div>
        <div className="rounded-[18px] border border-black/8 bg-black/[0.04] px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#7a8ea1]">
            Min order
          </div>
          <div className="mt-2 text-sm font-semibold">{formatUsd(market.minOrderSizeUsd)}</div>
        </div>
        <div className="rounded-[18px] border border-black/8 bg-black/[0.04] px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#7a8ea1]">
            Tick / lot
          </div>
          <div className="mt-2 text-sm font-semibold">
            {market.tickSize} / {market.lotSize}
          </div>
        </div>
      </div>
    </button>
  );
}

function SignalCard({
  signal,
}: {
  signal: PacificaRiskRoomResponse["riskSummary"]["signals"][number];
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{signal.title}</div>
        <div
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
            RISK_TONES[signal.tone].badge,
          )}
        >
          {signal.tone}
        </div>
      </div>
      <div className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.05em] text-white">
        {signal.value}
      </div>
      <div className="mt-2 text-sm leading-6 text-[#bfd0dc]">{signal.detail}</div>
    </article>
  );
}

function FundingDeckCard({ curve }: { curve: PacificaFundingCurve }) {
  const tone =
    curve.regime === "longs-pay"
      ? {
          border: "border-[#e3c89a]",
          bg: "bg-[#fff1d6]",
          ink: "text-[#4f3420]",
          line: "#d97706",
        }
      : curve.regime === "shorts-pay"
        ? {
            border: "border-[#b5d7cb]",
            bg: "bg-[#e6f5ef]",
            ink: "text-[#1f4f43]",
            line: "#12946f",
          }
        : {
            border: "border-[#c7d5e2]",
            bg: "bg-[#eef4fa]",
            ink: "text-[#22415f]",
            line: "#2f7eb7",
          };
  const points = [...curve.points].reverse();
  const values = points.map((item) => item.nextFundingRate * 10000);

  return (
    <article className={cn("rounded-[28px] border p-5", tone.border, tone.bg, tone.ink)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] opacity-70">
            {curve.symbol}
          </div>
          <div className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.05em]">
            {formatFundingRate(curve.nextFundingRate)}
          </div>
        </div>
        <InfoPill>{curve.regime}</InfoPill>
      </div>
      <div className="mt-2 text-sm leading-6 opacity-80">
        Carry on $1k notional: {formatUsd(curve.hourlyCarryFor1kUsd, 2)}
      </div>
      <div className="mt-4 rounded-[22px] border border-black/10 bg-white/55 px-3 py-4">
        <Sparkline values={values} stroke={tone.line} tone="light" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[18px] border border-black/8 bg-white/60 px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">
            Impact spread
          </div>
          <div className="mt-2 text-sm font-semibold">{curve.impactSpreadPct.toFixed(3)}%</div>
        </div>
        <div className="rounded-[18px] border border-black/8 bg-white/60 px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">
            Prints captured
          </div>
          <div className="mt-2 text-sm font-semibold">{points.length} funding points</div>
        </div>
      </div>
    </article>
  );
}

function SafeOrderTicket({
  plan,
}: {
  plan: PacificaRiskRoomResponse["riskSummary"]["safeOrderPlan"][number];
}) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#95abc0]">
            {plan.symbol}
          </div>
          <div className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.05em] text-white">
            {ACTION_LABELS[plan.action]}
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d5e0e9]">
          {plan.orderType}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[18px] border border-white/10 bg-[#09111a] px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8499ac]">
            Leverage cap
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{plan.leverageCap}x</div>
        </div>
        <div className="rounded-[18px] border border-white/10 bg-[#09111a] px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8499ac]">
            Size cap
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {formatUsd(plan.sizeCapUsd)}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-white/10 bg-[#09111a] px-4 py-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8499ac]">
          Invalidation
        </div>
        <div className="mt-2 text-sm leading-6 text-[#dbe7ef]">{plan.invalidation}</div>
      </div>

      <div className="mt-4 text-sm leading-7 text-[#bfd0dc]">{plan.rationale}</div>
    </article>
  );
}

function EmptyPanel({
  text,
  tone = "light",
}: {
  text: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cn(
        "rounded-[22px] border px-4 py-5 text-sm leading-6",
        tone === "dark"
          ? "border-white/10 bg-white/[0.04] text-[#9db1c3]"
          : "border-[#ddd4c4] bg-[#f4ede2] text-[#687c8f]",
      )}
    >
      {text}
    </div>
  );
}

export default function PacificaRiskRoomPage() {
  const searchParams = useSearchParams();
  const compactMode = searchParams.get("compact") === "1";
  const [accountInput, setAccountInput] = useState("");
  const [submittedAccount, setSubmittedAccount] = useState("");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [payload, setPayload] = useState<PacificaRiskRoomResponse | null>(null);
  const [focusSymbol, setFocusSymbol] = useState("");
  const focusSymbolRef = useRef("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    focusSymbolRef.current = focusSymbol;
  }, [focusSymbol]);

  useEffect(() => {
    let cancelled = false;

    const load = async (background = false) => {
      if (background) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError("");

      try {
        const params = new URLSearchParams({
          symbols: DEFAULT_SYMBOLS,
        });
        if (submittedAccount.trim()) {
          params.set("account", submittedAccount.trim());
        }

        const response = await fetch(`/api/pacifica-risk-room?${params.toString()}`, {
          cache: "no-store",
        });
        const nextPayload = (await response.json()) as PacificaRiskRoomResponse;

        if (!response.ok || !nextPayload.success) {
          throw new Error("Failed to load Pacifica Risk Room payload");
        }

        if (cancelled) {
          return;
        }

        setPayload(nextPayload);
        const activeFocusSymbol = focusSymbolRef.current;
        if (
          !activeFocusSymbol ||
          !nextPayload.marketSnapshot.some((item) => item.symbol === activeFocusSymbol)
        ) {
          setFocusSymbol(nextPayload.marketSnapshot[0]?.symbol || "");
        }
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load Pacifica Risk Room payload",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    load();
    const interval = window.setInterval(() => load(true), 20_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [submittedAccount, refreshNonce]);

  const focusMarket =
    payload?.marketSnapshot.find((item) => item.symbol === focusSymbol) || null;
  const focusFunding =
    payload?.fundingCurves.find((item) => item.symbol === focusSymbol) || null;
  const riskTone = payload ? RISK_TONES[payload.riskSummary.status] : RISK_TONES.watch;
  const RiskIcon =
    payload?.riskSummary.status === "stable"
      ? ShieldCheck
      : payload?.riskSummary.status === "critical"
        ? ShieldX
        : AlertTriangle;
  const portfolioSeries =
    payload?.account.portfolioHistory.map((item) => item.equityUsd) || [];
  const grossExposure = payload
    ? payload.account.positions.reduce((sum, item) => sum + item.notionalUsd, 0)
    : 0;
  const totalFundingPressure = payload
    ? payload.fundingCurves.reduce(
        (sum, item) => sum + Math.abs(item.nextFundingRate),
        0,
      )
    : 0;
  const verdictPanelBackground =
    payload?.riskSummary.status === "stable"
      ? "radial-gradient(circle at top right, rgba(18,148,111,0.2), transparent 42%), linear-gradient(135deg, rgba(10,17,24,0.96), rgba(15,23,32,0.92))"
      : payload?.riskSummary.status === "critical"
        ? "radial-gradient(circle at top right, rgba(217,72,95,0.2), transparent 42%), linear-gradient(135deg, rgba(10,17,24,0.96), rgba(15,23,32,0.92))"
        : "radial-gradient(circle at top right, rgba(217,119,6,0.22), transparent 42%), linear-gradient(135deg, rgba(10,17,24,0.96), rgba(15,23,32,0.92))";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f2ede3] text-[#14212f]">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(13,74,117,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(217,119,6,0.12),_transparent_28%),linear-gradient(180deg,_#efe8db_0%,_#f2ede3_32%,_#e8e1d5_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[linear-gradient(90deg,rgba(20,33,47,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(20,33,47,0.08)_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />

        <div className="relative mx-auto max-w-[1500px] px-4 pb-24 pt-14 md:px-8">
          <div
            className={cn(
              "grid items-start gap-6",
              compactMode
                ? "xl:grid-cols-[320px_minmax(0,1fr)]"
                : "xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[390px_minmax(0,1fr)]",
            )}
          >
            <aside className="space-y-6 xl:sticky xl:top-20">
              <section className="overflow-hidden rounded-[36px] border border-[#203243] bg-[#0f1720] p-6 text-[#f5efe4] shadow-[0_32px_90px_rgba(6,13,19,0.4)] md:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <InfoPill tone="dark">Pacifica Analytics & Data</InfoPill>
                  {payload ? (
                    <div className="flex items-center gap-2">
                      <InfoPill tone="dark">
                        Market {SOURCE_LABELS[payload.sourceStatus.market]}
                      </InfoPill>
                      <InfoPill tone="dark">
                        Account {SOURCE_LABELS[payload.sourceStatus.account]}
                      </InfoPill>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#9ab1c3]">
                      Desk status
                    </div>
                    <h2
                      className="mt-3 text-[34px] font-semibold leading-[0.94] tracking-[-0.06em] text-white"
                      style={DISPLAY_SERIF}
                    >
                      Current risk verdict
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRefreshNonce((value) => value + 1)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-[#d6e0e8] transition hover:border-white/20 hover:bg-white/[0.08]"
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}
                    Refresh
                  </button>
                </div>

                <div
                  className="mt-6 rounded-[30px] p-5"
                  style={{ backgroundImage: verdictPanelBackground }}
                >
                  <VerdictDial
                    score={payload?.riskSummary.score || 0}
                    status={payload?.riskSummary.status || "watch"}
                  />
                  <div className="mt-5 flex items-start gap-3 rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
                    <RiskIcon className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                    <div className="text-sm leading-7 text-[#d7e1e9]">
                      {payload?.riskSummary.verdict ||
                        "Loading Pacifica market and account posture..."}
                    </div>
                  </div>
                </div>

                <form
                  className="mt-6 space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setSubmittedAccount(accountInput.trim());
                  }}
                >
                  <label className="block font-mono text-[11px] uppercase tracking-[0.24em] text-[#9ab1c3]">
                    Optional Pacifica account id
                  </label>
                  <input
                    value={accountInput}
                    onChange={(event) => setAccountInput(event.target.value)}
                    placeholder="Enter account id for live review"
                    className="w-full rounded-[22px] border border-white/10 bg-[#09111a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#60778b] focus:border-[#3b6d90]"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="submit"
                      className="rounded-[20px] bg-[#f3ede2] px-4 py-3 text-sm font-semibold text-[#14212f] transition hover:bg-white"
                    >
                      Review account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountInput("");
                        setSubmittedAccount("");
                      }}
                      className="rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-[#d6e0e8] transition hover:border-white/20 hover:bg-white/[0.08]"
                    >
                      Use sample desk
                    </button>
                  </div>
                  <div className="text-xs leading-6 text-[#95a9b9]">
                    Leave blank to keep demo mode. The desk still pulls live Pacifica
                    market data.
                  </div>
                </form>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <BoardStat
                    label="Markets tracked"
                    value={payload ? String(payload.marketSnapshot.length) : "--"}
                    detail={`Watchlist: ${payload?.watchlistSymbols.join(", ") || "loading"}`}
                    tone="dark"
                  />
                  <BoardStat
                    label="Gross exposure"
                    value={payload ? formatCompactUsd(grossExposure) : "--"}
                    detail={`Account mode: ${
                      payload ? SOURCE_LABELS[payload.sourceStatus.account] : "loading"
                    }`}
                    tone="dark"
                  />
                  <BoardStat
                    label="Funding pressure"
                    value={payload ? formatFundingRate(totalFundingPressure) : "--"}
                    detail="Aggregate next funding sensitivity across the watchlist."
                    tone="dark"
                  />
                  <BoardStat
                    label="Latest refresh"
                    value={
                      payload
                        ? new Date(payload.generatedAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "--"
                    }
                    detail="Desk auto-refreshes every 20 seconds."
                    tone="dark"
                  />
                </div>

                {payload?.notes.length ? (
                  <div className="mt-6 grid gap-3">
                    {payload.notes.map((note) => (
                      <div
                        key={note}
                        className="rounded-[20px] border border-amber-500/18 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-50"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              {!compactMode && payload ? (
                <section className="rounded-[32px] border border-[#d8cfbf] bg-[#fffaf0] p-5 shadow-[0_20px_54px_rgba(106,84,57,0.08)]">
                  <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#6f8397]">
                    Pacifica wiring
                  </div>
                  <div className="mt-4 grid gap-3">
                    {payload.dataSources.map((source) => (
                      <div
                        key={source}
                        className="rounded-[18px] border border-[#ddd4c4] bg-[#f5efe4] px-4 py-3 text-sm leading-6 text-[#57697b]"
                      >
                        {source}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </aside>

            <div className="space-y-6">
              <section className="overflow-hidden rounded-[38px] border border-[#d8cfbf] bg-[#fffaf0] shadow-[0_28px_80px_rgba(106,84,57,0.1)]">
                <div
                  className={cn(
                    "grid gap-8 p-6 md:p-8 xl:grid-cols-[1.1fr,0.9fr]",
                    compactMode && "xl:grid-cols-[1fr,0.9fr]",
                  )}
                >
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#698196]">
                      Pacifica Risk Room
                    </div>
                    <h1
                      className={cn(
                        "mt-4 max-w-4xl font-semibold leading-[0.92] tracking-[-0.07em] text-[#14212f]",
                        compactMode ? "text-[44px] md:text-[66px]" : "text-[52px] md:text-[82px]",
                      )}
                      style={DISPLAY_SERIF}
                    >
                      A risk briefing wall, not another perp dashboard.
                    </h1>
                    <p className="mt-5 max-w-3xl text-base leading-8 text-[#56687b] md:text-[18px]">
                      Pacifica Risk Room compresses live market pulse, crowded funding,
                      liquidation stress, account replay, and bounded next-action planning
                      into one operator surface. The design is built to read like a desk
                      briefing, not a stack of exchange widgets.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link
                        href="https://docs.pacifica.fi/api-documentation/api"
                        className="inline-flex items-center gap-2 rounded-full bg-[#14212f] px-5 py-3 text-sm font-semibold text-[#f7f0e5] transition hover:bg-[#0e1823]"
                      >
                        Pacifica API Docs
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setAccountInput("");
                          setSubmittedAccount("");
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-[#d0c4b4] bg-[#f6efe4] px-5 py-3 text-sm font-semibold text-[#14212f] transition hover:border-[#c1b29d] hover:bg-[#efe6d8]"
                      >
                        Reset to sample desk
                      </button>
                    </div>

                    {!compactMode && payload ? (
                      <div className="mt-7 flex flex-wrap gap-2">
                        {payload.watchlistSymbols.map((symbol) => (
                          <InfoPill key={symbol}>{symbol}</InfoPill>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                      <BoardStat
                        label="Core thesis"
                        value={payload ? payload.riskSummary.status.toUpperCase() : "WAIT"}
                        detail={payload?.riskSummary.summary || "Reading market posture..."}
                      />
                      <BoardStat
                        label="Selected market"
                        value={focusMarket?.symbol || "--"}
                        detail={
                          focusMarket
                            ? `${focusMarket.maxLeverage}x cap · Crowd ${focusMarket.crowdedScore.toFixed(1)}`
                            : "Select a market from the board below."
                        }
                      />
                      <BoardStat
                        label="Live carry"
                        value={focusFunding ? formatFundingRate(focusFunding.nextFundingRate) : "--"}
                        detail={
                          focusFunding
                            ? `Impact spread ${focusFunding.impactSpreadPct.toFixed(3)}%`
                            : "Funding view follows the selected market."
                        }
                      />
                    </div>

                    <div className="rounded-[30px] border border-[#ddd4c4] bg-[#f6efe4] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#6f8397]">
                            Focus market
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="text-[34px] font-semibold leading-none tracking-[-0.05em] text-[#14212f]">
                              {focusMarket?.symbol || "Select a market"}
                            </div>
                            {focusMarket ? <InfoPill>{focusMarket.maxLeverage}x cap</InfoPill> : null}
                          </div>
                        </div>
                        {focusMarket ? (
                          <div
                            className={cn(
                              "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
                              focusMarket.change24hPct >= 0
                                ? "border border-emerald-600/15 bg-emerald-500/10 text-emerald-700"
                                : "border border-rose-600/15 bg-rose-500/10 text-rose-700",
                            )}
                          >
                            {formatPct(focusMarket.change24hPct)}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[20px] border border-[#ddd4c4] bg-[#fffaf0] px-4 py-4">
                          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#718598]">
                            Mark / oracle / mid
                          </div>
                          <div className="mt-2 text-lg font-semibold text-[#14212f]">
                            {focusMarket
                              ? `${focusMarket.mark >= 100 ? formatUsd(focusMarket.mark) : focusMarket.mark.toFixed(4)} / ${
                                  focusMarket.oracle >= 100
                                    ? focusMarket.oracle.toFixed(2)
                                    : focusMarket.oracle.toFixed(4)
                                } / ${
                                  focusMarket.mid >= 100
                                    ? focusMarket.mid.toFixed(2)
                                    : focusMarket.mid.toFixed(4)
                                }`
                              : "Waiting for market selection"}
                          </div>
                        </div>
                        <div className="rounded-[20px] border border-[#ddd4c4] bg-[#fffaf0] px-4 py-4">
                          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#718598]">
                            Funding / min order
                          </div>
                          <div className="mt-2 text-lg font-semibold text-[#14212f]">
                            {focusMarket
                              ? `${formatFundingRate(focusMarket.nextFundingRate)} / ${formatUsd(
                                  focusMarket.minOrderSizeUsd,
                                )}`
                              : "Waiting for market selection"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {!compactMode && payload ? (
                  <div className="border-t border-[#e2d8c8] bg-[#f7f1e6] px-6 py-4 md:px-8">
                    <div className="grid gap-3 md:grid-cols-4">
                      <BoardStat
                        label="Markets tracked"
                        value={String(payload.marketSnapshot.length)}
                        detail="Updated from the active Pacifica watchlist."
                      />
                      <BoardStat
                        label="Account posture"
                        value={SOURCE_LABELS[payload.sourceStatus.account]}
                        detail={`Equity ${formatUsd(payload.account.equityUsd)}`}
                      />
                      <BoardStat
                        label="Funding pressure"
                        value={formatFundingRate(totalFundingPressure)}
                        detail="Summed absolute next funding across the board."
                      />
                      <BoardStat
                        label="Current verdict"
                        value={`${payload.riskSummary.score}/100`}
                        detail={payload.riskSummary.summary}
                      />
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div className="border-t border-[#f1c7ce] bg-[#fff0f2] px-6 py-4 text-sm text-[#8c3040] md:px-8">
                    {error}
                  </div>
                ) : null}
              </section>

              {isLoading && !payload ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-[36px] border border-[#d8cfbf] bg-[#fffaf0] text-[#415567] shadow-[0_24px_70px_rgba(106,84,57,0.08)]">
                  <div className="flex items-center gap-3 text-lg">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading Pacifica Risk Room...
                  </div>
                </div>
              ) : null}

              {payload ? (
                <>
                  <div className="grid gap-6 2xl:grid-cols-[1.08fr,0.92fr]">
                    <SectionFrame
                      tone="light"
                      label="Market board"
                      title="Crowding, carry, and leverage limits in one sweep"
                      body="Each card compresses the market posture into an operator-readable ticket. Select any market to move the focus briefing."
                      icon={CandlestickChart}
                      aside={<InfoPill>Click a market to focus</InfoPill>}
                    >
                      <div className="grid gap-4">
                        {payload.marketSnapshot.map((market) => (
                          <MarketBoardRow
                            key={market.symbol}
                            market={market}
                            isActive={focusSymbol === market.symbol}
                            onSelect={() => setFocusSymbol(market.symbol)}
                          />
                        ))}
                      </div>
                    </SectionFrame>

                    <SectionFrame
                      tone="dark"
                      label="Risk ledger"
                      title="Why the desk is green, amber, or red"
                      body="The ledger turns Pacifica state into the answer a trader actually needs before adding size."
                      icon={ShieldCheck}
                      aside={
                        <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#d8e2ea]">
                          {payload.riskSummary.score}/100
                        </div>
                      }
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        {payload.riskSummary.signals.map((signal) => (
                          <SignalCard key={signal.title} signal={signal} />
                        ))}
                      </div>

                      <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
                        <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#96aec0]">
                            Portfolio replay
                          </div>
                          <div className="mt-2 text-sm leading-6 text-[#bfd0dc]">
                            Equity path over the latest captured window.
                          </div>
                          <div className="mt-4 rounded-[22px] border border-white/10 bg-[#09111a] px-3 py-4">
                            <Sparkline values={portfolioSeries} stroke="#7fd3c1" tone="dark" />
                          </div>
                        </div>

                        <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#96aec0]">
                            Operator playbook
                          </div>
                          <div className="mt-4 grid gap-3">
                            {payload.riskSummary.operatorPlaybook.map((item) => (
                              <div
                                key={item}
                                className="rounded-[18px] border border-white/10 bg-[#09111a] px-4 py-3 text-sm leading-6 text-[#dbe7ef]"
                              >
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </SectionFrame>
                  </div>

                  <div className="grid gap-6 2xl:grid-cols-[0.92fr,1.08fr]">
                    <SectionFrame
                      tone="dark"
                      label="Pressure tape"
                      title="Liquidation stress deserves its own wall"
                      body="Large or liquidation-linked prints surface here first, so stress is visible before the desk reaches for new leverage."
                      icon={Radar}
                    >
                      <div className="grid gap-3">
                        {payload.liquidationRadar.length ? (
                          payload.liquidationRadar.map((item) => (
                            <article
                              key={`${item.symbol}-${item.createdAt}-${item.side}`}
                              className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "h-11 w-1 rounded-full bg-gradient-to-b",
                                      item.severity === "critical"
                                        ? "from-rose-400 to-rose-200"
                                        : item.severity === "watch"
                                          ? "from-amber-400 to-amber-200"
                                          : "from-emerald-400 to-emerald-200",
                                    )}
                                  />
                                  <div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-lg font-semibold text-white">
                                        {item.symbol}
                                      </div>
                                      <div
                                        className={cn(
                                          "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
                                          RISK_TONES[item.severity].badge,
                                        )}
                                      >
                                        {item.cause.replaceAll("_", " ")}
                                      </div>
                                    </div>
                                    <div className="mt-2 text-sm text-[#9cb1c1]">
                                      {item.eventType} · {item.side}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-[#cdd9e1]">{formatTime(item.createdAt)}</div>
                              </div>
                              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-[18px] border border-white/10 bg-[#09111a] px-4 py-3 text-sm text-[#dbe7ef]">
                                  Price {item.price >= 100 ? formatUsd(item.price) : item.price.toFixed(4)}
                                </div>
                                <div className="rounded-[18px] border border-white/10 bg-[#09111a] px-4 py-3 text-sm text-[#dbe7ef]">
                                  Size {compactNumberFormatter.format(item.amount)}
                                </div>
                                <div className="rounded-[18px] border border-white/10 bg-[#09111a] px-4 py-3 text-sm text-[#dbe7ef]">
                                  Notional {formatCompactUsd(item.notionalUsd)}
                                </div>
                              </div>
                            </article>
                          ))
                        ) : (
                          <EmptyPanel
                            tone="dark"
                            text="No elevated liquidation or outsized trade events returned for the current watchlist."
                          />
                        )}
                      </div>
                    </SectionFrame>

                    <SectionFrame
                      tone="light"
                      label="Carry deck"
                      title="Funding becomes readable once it behaves like a book"
                      body="The carry deck translates Pacifica funding history into near-term drag, impact spread, and regime changes."
                      icon={Waves}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        {payload.fundingCurves.map((curve) => (
                          <FundingDeckCard key={curve.symbol} curve={curve} />
                        ))}
                      </div>
                    </SectionFrame>
                  </div>

                  <div className="grid gap-6 2xl:grid-cols-[1.08fr,0.92fr]">
                    <SectionFrame
                      tone="light"
                      label="Account replay"
                      title="Positions, orders, fills, and closed risk in one brief"
                      body="This is the pre-trade review zone: current posture on top, then open risk, then recent actions and closed outcomes."
                      icon={Activity}
                    >
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <BoardStat
                          label="Equity"
                          value={formatUsd(payload.account.equityUsd)}
                          detail={`Available ${formatUsd(payload.account.availableToSpendUsd)}`}
                        />
                        <BoardStat
                          label="Margin used"
                          value={formatUsd(payload.account.marginUsedUsd)}
                          detail={`Mode ${SOURCE_LABELS[payload.account.mode]}`}
                        />
                        <BoardStat
                          label="30d volume"
                          value={formatCompactUsd(payload.account.volume30dUsd)}
                          detail={`${payload.account.tradeCount30d} trades in 30d`}
                        />
                        <BoardStat
                          label="PnL"
                          value={formatUsd(
                            payload.account.realizedPnlUsd + payload.account.unrealizedPnlUsd,
                          )}
                          detail={`Realized ${formatUsd(payload.account.realizedPnlUsd, 2)} · Unrealized ${formatUsd(payload.account.unrealizedPnlUsd, 2)}`}
                        />
                      </div>

                      <div className="mt-6">
                        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#6c8194]">
                          Open positions
                        </div>
                        <div className="mt-4 grid gap-4 xl:grid-cols-2">
                          {payload.account.positions.length ? (
                            payload.account.positions.map((position) => (
                              <article
                                key={`${position.symbol}-${position.side}`}
                                className="rounded-[26px] border border-[#ddd4c4] bg-[#f6efe4] p-5"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="text-[26px] font-semibold leading-none tracking-[-0.05em] text-[#14212f]">
                                      {position.symbol}
                                    </div>
                                    <div className="mt-2 text-sm text-[#687b8e]">
                                      {position.side} · Entry{" "}
                                      {position.entryPrice.toFixed(
                                        position.entryPrice >= 100 ? 2 : 4,
                                      )}
                                    </div>
                                  </div>
                                  <InfoPill>{position.leverage ? `${position.leverage}x` : "n/a"}</InfoPill>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-[18px] border border-[#ddd4c4] bg-[#fffaf0] px-4 py-3">
                                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#718598]">
                                      Notional
                                    </div>
                                    <div className="mt-2 text-lg font-semibold text-[#14212f]">
                                      {formatCompactUsd(position.notionalUsd)}
                                    </div>
                                  </div>
                                  <div className="rounded-[18px] border border-[#ddd4c4] bg-[#fffaf0] px-4 py-3">
                                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#718598]">
                                      Unrealized PnL
                                    </div>
                                    <div
                                      className={cn(
                                        "mt-2 text-lg font-semibold",
                                        position.unrealizedPnlUsd >= 0
                                          ? "text-emerald-700"
                                          : "text-rose-700",
                                      )}
                                    >
                                      {formatUsd(position.unrealizedPnlUsd, 2)}
                                    </div>
                                  </div>
                                  <div className="rounded-[18px] border border-[#ddd4c4] bg-[#fffaf0] px-4 py-3">
                                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#718598]">
                                      Margin
                                    </div>
                                    <div className="mt-2 text-lg font-semibold text-[#14212f]">
                                      {formatUsd(position.marginUsedUsd, 2)}
                                    </div>
                                  </div>
                                  <div className="rounded-[18px] border border-[#ddd4c4] bg-[#fffaf0] px-4 py-3">
                                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#718598]">
                                      Liquidation buffer
                                    </div>
                                    <div
                                      className={cn(
                                        "mt-2 text-lg font-semibold",
                                        position.liquidationDistancePct !== null &&
                                          position.liquidationDistancePct < 10
                                          ? "text-rose-700"
                                          : "text-[#14212f]",
                                      )}
                                    >
                                      {position.liquidationDistancePct === null
                                        ? "n/a"
                                        : `${position.liquidationDistancePct.toFixed(2)}%`}
                                    </div>
                                  </div>
                                </div>
                              </article>
                            ))
                          ) : (
                            <EmptyPanel text="No open positions were returned for this account context." />
                          )}
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 xl:grid-cols-3">
                        <div className="rounded-[26px] border border-[#ddd4c4] bg-[#f6efe4] p-5">
                          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#6c8194]">
                            Open orders
                          </div>
                          <div className="mt-4 grid gap-3">
                            {payload.account.openOrders.length ? (
                              payload.account.openOrders.map((order) => (
                                <div
                                  key={`${order.symbol}-${order.createdAt}-${order.side}`}
                                  className="rounded-[18px] border border-[#ddd4c4] bg-[#fffaf0] px-4 py-3 text-sm leading-6 text-[#5a6d80]"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-[#14212f]">
                                      {order.symbol} {order.orderType}
                                    </span>
                                    <span>{order.side}</span>
                                  </div>
                                  <div className="mt-2">
                                    {order.price
                                      ? `Price ${order.price}`
                                      : `Trigger ${order.triggerPrice || "n/a"}`}{" "}
                                    · Amount {order.amount} ·{" "}
                                    {order.reduceOnly ? "Reduce-only" : "Increase"}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <EmptyPanel text="No open orders returned." />
                            )}
                          </div>
                        </div>

                        <div className="rounded-[26px] border border-[#ddd4c4] bg-[#f6efe4] p-5">
                          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#6c8194]">
                            Recent fills
                          </div>
                          <div className="mt-4 grid gap-3">
                            {payload.account.tradeHistory.length ? (
                              payload.account.tradeHistory.map((trade) => (
                                <div
                                  key={`${trade.symbol}-${trade.createdAt}-${trade.side}`}
                                  className="rounded-[18px] border border-[#ddd4c4] bg-[#fffaf0] px-4 py-3 text-sm leading-6 text-[#5a6d80]"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-[#14212f]">
                                      {trade.symbol} {trade.side}
                                    </span>
                                    <span>{formatTime(trade.createdAt)}</span>
                                  </div>
                                  <div className="mt-2">
                                    {trade.eventType} · {trade.cause} · Price {trade.price} · Notional{" "}
                                    {formatUsd(trade.notionalUsd, 2)}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <EmptyPanel text="No recent fills returned." />
                            )}
                          </div>
                        </div>

                        <div className="rounded-[26px] border border-[#ddd4c4] bg-[#f6efe4] p-5">
                          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#6c8194]">
                            Closed positions
                          </div>
                          <div className="mt-4 grid gap-3">
                            {payload.account.positionHistory.length ? (
                              payload.account.positionHistory.map((position) => (
                                <div
                                  key={`${position.symbol}-${position.closedAt}-${position.side}`}
                                  className="rounded-[18px] border border-[#ddd4c4] bg-[#fffaf0] px-4 py-3 text-sm leading-6 text-[#5a6d80]"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-[#14212f]">
                                      {position.symbol} {position.side}
                                    </span>
                                    <span>{formatTime(position.closedAt)}</span>
                                  </div>
                                  <div className="mt-2">
                                    Entry {position.entryPrice} · Exit {position.exitPrice} · Realized{" "}
                                    {formatUsd(position.realizedPnlUsd, 2)}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <EmptyPanel text="No closed positions returned." />
                            )}
                          </div>
                        </div>
                      </div>
                    </SectionFrame>

                    <SectionFrame
                      tone="dark"
                      label="Execution brief"
                      title="Bounded action plans instead of blind automation"
                      body="The room stays advisory-first. Each ticket tells the operator how much risk is acceptable before the next move."
                      icon={CircleAlert}
                    >
                      <div className="grid gap-4">
                        {payload.riskSummary.safeOrderPlan.map((plan) => (
                          <SafeOrderTicket key={plan.symbol} plan={plan} />
                        ))}
                      </div>

                      <div className="mt-6 rounded-[28px] border border-cyan-400/18 bg-cyan-400/10 px-5 py-4 text-sm leading-7 text-cyan-50">
                        Pacifica Risk Room is intentionally advisory-first. That gives the
                        project a safer demo story today and a clear upgrade path into Builder
                        Program execution flows later.
                      </div>
                    </SectionFrame>
                  </div>

                  {!compactMode ? (
                    <section className="rounded-[34px] border border-[#203243] bg-[#0f1720] p-6 text-[#f5efe4] shadow-[0_28px_80px_rgba(6,13,19,0.34)] md:p-7">
                      <div className="flex flex-wrap items-center gap-3">
                        <Activity className="h-4 w-4 text-[#9dc1da]" />
                        <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#9dc1da]">
                          Integration notes
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {payload.dataSources.map((source) => (
                          <div
                            key={source}
                            className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-[#d8e3eb]"
                          >
                            {source}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
