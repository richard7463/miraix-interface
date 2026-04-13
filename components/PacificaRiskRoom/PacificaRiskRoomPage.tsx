"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
    badge: string;
    panel: string;
    icon: typeof ShieldCheck;
  }
> = {
  stable: {
    badge: "border-emerald-300/25 bg-emerald-400/12 text-emerald-100",
    panel: "from-emerald-400/18 via-emerald-300/10 to-transparent",
    icon: ShieldCheck,
  },
  watch: {
    badge: "border-amber-300/25 bg-amber-400/12 text-amber-100",
    panel: "from-amber-300/18 via-orange-200/10 to-transparent",
    icon: AlertTriangle,
  },
  critical: {
    badge: "border-rose-300/25 bg-rose-400/12 text-rose-100",
    panel: "from-rose-400/18 via-rose-300/10 to-transparent",
    icon: ShieldX,
  },
};

const ACTION_LABELS = {
  wait: "Wait",
  probe: "Probe",
  reduce: "Reduce",
  hedge: "Hedge",
} as const;

const DEFAULT_SYMBOLS = "BTC, ETH, SOL, XRP, HYPE, PUMP";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

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

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="text-xs uppercase tracking-[0.24em] text-[#96a6b5]">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-[#b3c0cc]">{detail}</div>
    </div>
  );
}

function SectionShell({
  eyebrow,
  title,
  body,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: typeof Activity;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
      <div className="flex items-center gap-3 text-[#a9d8f9]">
        <Icon className="h-5 w-5" />
        <p className="text-xs font-semibold uppercase tracking-[0.28em]">
          {eyebrow}
        </p>
      </div>
      <h2 className="mt-4 text-3xl font-semibold text-white">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#bac6d2]">{body}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Sparkline({
  values,
  stroke,
}: {
  values: number[];
  stroke: string;
}) {
  if (values.length < 2) {
    return (
      <div className="flex h-20 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-xs text-[#8ba0b2]">
        No history
      </div>
    );
  }

  const width = 280;
  const height = 88;
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
      className="h-20 w-full overflow-visible"
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

function FundingCurveCard({ curve }: { curve: PacificaFundingCurve }) {
  const points = [...curve.points].reverse();
  const values = points.map((item) => item.nextFundingRate * 10000);
  const tone =
    curve.regime === "longs-pay"
      ? "#fbbf24"
      : curve.regime === "shorts-pay"
        ? "#34d399"
        : "#7dd3fc";

  return (
    <article className="rounded-[28px] border border-white/10 bg-black/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-[#92b7d4]">
            {curve.symbol}
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {formatFundingRate(curve.nextFundingRate)}
          </div>
          <div className="mt-2 text-sm text-[#afc0ce]">
            Carry on $1k notional: {formatUsd(curve.hourlyCarryFor1kUsd, 2)}
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#dce6f0]">
          {curve.regime}
        </div>
      </div>
      <div className="mt-4 rounded-[24px] border border-white/10 bg-[#071018] px-3 py-4">
        <Sparkline values={values} stroke={tone} />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-[#8fa5b8]">
        <span>Impact spread {curve.impactSpreadPct.toFixed(3)}%</span>
        <span>{points.length} funding prints</span>
      </div>
    </article>
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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        if (
          !focusSymbol ||
          !nextPayload.marketSnapshot.some((item) => item.symbol === focusSymbol)
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
  const RiskIcon = riskTone.icon;
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

  return (
    <main className="min-h-screen overflow-y-auto bg-[#071017] text-[#f5f8fb]">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.11),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.12),_transparent_22%),linear-gradient(180deg,_#08111a_0%,_#071017_44%,_#05090f_100%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-24 pt-24 md:px-8">
          <section
            className={cn(
              "overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.05] backdrop-blur-xl",
              compactMode ? "p-6 md:p-7" : "p-8 md:p-10",
            )}
          >
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 font-semibold uppercase tracking-[0.24em] text-cyan-100">
                Pacifica Analytics & Data
              </span>
              {payload && (
                <>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[#cfdae4]">
                    Market: {SOURCE_LABELS[payload.sourceStatus.market]}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[#cfdae4]">
                    Account: {SOURCE_LABELS[payload.sourceStatus.account]}
                  </span>
                </>
              )}
            </div>

            <div
              className={cn(
                "mt-6 grid gap-8 xl:grid-cols-[1.15fr,0.85fr]",
                compactMode && "xl:grid-cols-[1fr,0.9fr]",
              )}
            >
              <div>
                <div className="text-xs uppercase tracking-[0.32em] text-[#9fcbe7]">
                  Pacifica Risk Room
                </div>
                <h1
                  className={cn(
                    "mt-4 max-w-4xl font-semibold tracking-tight text-white",
                    compactMode ? "text-3xl md:text-5xl" : "text-4xl md:text-6xl",
                  )}
                >
                  Risk, funding, and liquidation intelligence for Pacifica perpetuals.
                </h1>
                <p
                  className={cn(
                    "mt-5 max-w-3xl text-base text-[#c1cfdb] md:text-lg",
                    compactMode ? "leading-7" : "leading-8",
                  )}
                >
                  One operator surface for market pulse, crowded funding, liquidation stress,
                  account replay, and safe order planning. Built to give Pacifica traders a
                  cleaner read than raw order history or exchange tabs alone.
                </p>

                <div className={cn("flex flex-wrap gap-3", compactMode ? "mt-6" : "mt-8")}>
                  <button
                    type="button"
                    onClick={() => setSubmittedAccount("")}
                    className="inline-flex items-center gap-2 rounded-full bg-[#7dd3fc] px-5 py-3 text-sm font-semibold text-[#071017] transition hover:bg-[#a5e4ff]"
                  >
                    Sample Risk Desk
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <Link
                    href="https://docs.pacifica.fi/api-documentation/api"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-[#dae6f0] transition hover:border-cyan-300/25 hover:bg-cyan-400/10"
                  >
                    Pacifica API Docs
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-black/20 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-[#9ab0c2]">
                      Current risk verdict
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      {payload && (
                        <div className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]", riskTone.badge)}>
                          {payload.riskSummary.status}
                        </div>
                      )}
                      {payload && <RiskIcon className="h-5 w-5 text-white" />}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRefreshNonce((value) => value + 1)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-[#d7e1e9] transition hover:border-cyan-300/20 hover:bg-cyan-400/10"
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}
                    Refresh
                  </button>
                </div>

                <div className={cn("mt-5 rounded-[28px] bg-gradient-to-br p-5", riskTone.panel)}>
                  <div className="text-5xl font-semibold text-white">
                    {payload ? `${payload.riskSummary.score}/100` : "--"}
                  </div>
                  <div className="mt-3 text-sm leading-7 text-[#dce7ee]">
                    {payload?.riskSummary.verdict ||
                      "Loading Pacifica market and account risk posture..."}
                  </div>
                </div>

                <form
                  className="mt-5 space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setSubmittedAccount(accountInput.trim());
                  }}
                >
                  <label className="block text-xs uppercase tracking-[0.22em] text-[#8fa3b5]">
                    Optional Pacifica account id
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={accountInput}
                      onChange={(event) => setAccountInput(event.target.value)}
                      placeholder="Enter Pacifica account id for live review"
                      className="min-w-0 flex-1 rounded-[18px] border border-white/10 bg-[#09131b] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6f8498] focus:border-cyan-300/35"
                    />
                    <button
                      type="submit"
                      className="rounded-[18px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white transition hover:border-cyan-300/25 hover:bg-cyan-400/10"
                    >
                      Review account
                    </button>
                  </div>
                  <div className="text-xs leading-6 text-[#8fa3b5]">
                    Leave blank to keep demo mode. The app still uses live Pacifica market data.
                  </div>
                </form>
              </div>
            </div>

            {payload && !compactMode ? (
              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <MetricCard
                  label="Markets tracked"
                  value={String(payload.marketSnapshot.length)}
                  detail={`Watchlist: ${payload.watchlistSymbols.join(", ")}`}
                />
                <MetricCard
                  label="Gross exposure"
                  value={formatCompactUsd(grossExposure)}
                  detail={`Account mode: ${SOURCE_LABELS[payload.sourceStatus.account]}`}
                />
                <MetricCard
                  label="Funding pressure"
                  value={formatFundingRate(totalFundingPressure)}
                  detail="Aggregate next funding sensitivity across the top carry board."
                />
                <MetricCard
                  label="Latest refresh"
                  value={new Date(payload.generatedAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  detail="The desk auto-refreshes every 20 seconds."
                />
              </div>
            ) : null}

            {payload?.notes.length && !compactMode ? (
              <div className="mt-6 grid gap-3">
                {payload.notes.map((note) => (
                  <div
                    key={note}
                    className="rounded-[20px] border border-amber-300/18 bg-amber-400/8 px-4 py-3 text-sm leading-6 text-amber-50"
                  >
                    {note}
                  </div>
                ))}
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-[24px] border border-rose-300/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
          </section>

          {isLoading && !payload ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-[32px] border border-white/10 bg-white/[0.04] text-[#d3dfeb]">
              <div className="flex items-center gap-3 text-lg">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading Pacifica Risk Room...
              </div>
            </div>
          ) : null}

          {payload ? (
            <>
              <div className="grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
                <SectionShell
                  eyebrow="Market pulse"
                  title="Perp dashboard, not a generic quote board"
                  body="The pulse board tracks mark, 24h move, open interest, volume, leverage ceiling, and crowding pressure for the selected Pacifica markets."
                  icon={CandlestickChart}
                >
                  <div className="overflow-hidden rounded-[28px] border border-white/10">
                    <div className="grid grid-cols-[1.1fr_repeat(6,minmax(0,1fr))] gap-3 bg-[#09131b] px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#8da3b6]">
                      <div>Market</div>
                      <div>Mark</div>
                      <div>24h</div>
                      <div>Funding</div>
                      <div>OI</div>
                      <div>Volume</div>
                      <div>Cap</div>
                    </div>
                    <div className="divide-y divide-white/6 bg-black/20">
                      {payload.marketSnapshot.map((market) => (
                        <button
                          key={market.symbol}
                          type="button"
                          onClick={() => setFocusSymbol(market.symbol)}
                          className={cn(
                            "grid w-full grid-cols-[1.1fr_repeat(6,minmax(0,1fr))] gap-3 px-4 py-4 text-left transition hover:bg-white/[0.03]",
                            focusSymbol === market.symbol && "bg-white/[0.04]",
                          )}
                        >
                          <div>
                            <div className="text-base font-semibold text-white">
                              {market.symbol}
                            </div>
                            <div className="text-xs text-[#8ea2b5]">
                              Crowd {market.crowdedScore.toFixed(1)}
                            </div>
                          </div>
                          <div className="text-sm text-[#dde7ef]">
                            {market.mark >= 100 ? formatUsd(market.mark) : market.mark.toFixed(4)}
                          </div>
                          <div
                            className={cn(
                              "text-sm",
                              market.change24hPct >= 0 ? "text-emerald-300" : "text-rose-300",
                            )}
                          >
                            {formatPct(market.change24hPct)}
                          </div>
                          <div className="text-sm text-[#dde7ef]">
                            {formatFundingRate(market.nextFundingRate)}
                          </div>
                          <div className="text-sm text-[#dde7ef]">
                            {compactNumberFormatter.format(market.openInterest)}
                          </div>
                          <div className="text-sm text-[#dde7ef]">
                            {formatCompactUsd(market.volume24h)}
                          </div>
                          <div className="text-sm text-[#dde7ef]">
                            {market.maxLeverage}x
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {focusMarket ? (
                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                      <MetricCard
                        label={`${focusMarket.symbol} mark`}
                        value={
                          focusMarket.mark >= 100
                            ? formatUsd(focusMarket.mark)
                            : focusMarket.mark.toFixed(4)
                        }
                        detail={`Oracle ${focusMarket.oracle.toFixed(
                          focusMarket.mark >= 100 ? 2 : 4,
                        )} · Mid ${focusMarket.mid.toFixed(
                          focusMarket.mark >= 100 ? 2 : 4,
                        )}`}
                      />
                      <MetricCard
                        label="Next funding"
                        value={formatFundingRate(focusMarket.nextFundingRate)}
                        detail={`Current ${formatFundingRate(
                          focusMarket.fundingRate,
                        )} · Impact spread ${
                          focusFunding ? `${focusFunding.impactSpreadPct.toFixed(3)}%` : "n/a"
                        }`}
                      />
                      <MetricCard
                        label="24h volume"
                        value={formatCompactUsd(focusMarket.volume24h)}
                        detail={`Open interest ${compactNumberFormatter.format(
                          focusMarket.openInterest,
                        )}`}
                      />
                      <MetricCard
                        label="Min order"
                        value={formatUsd(focusMarket.minOrderSizeUsd)}
                        detail={`Tick ${focusMarket.tickSize} · Lot ${focusMarket.lotSize}`}
                      />
                    </div>
                  ) : null}
                </SectionShell>

                <SectionShell
                  eyebrow="Risk verdict"
                  title="Why the room is green, amber, or red"
                  body="The score blends account equity, margin usage, liquidation distance, funding carry, and current market crowding into one operator-facing verdict."
                  icon={ShieldCheck}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    {payload.riskSummary.signals.map((signal) => (
                      <article
                        key={signal.title}
                        className="rounded-[28px] border border-white/10 bg-black/20 p-5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium text-white">{signal.title}</div>
                          <div
                            className={cn(
                              "rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em]",
                              RISK_TONES[signal.tone].badge,
                            )}
                          >
                            {signal.tone}
                          </div>
                        </div>
                        <div className="mt-3 text-3xl font-semibold text-white">
                          {signal.value}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-[#b1c0cc]">
                          {signal.detail}
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr,1.1fr]">
                    <div className="rounded-[28px] border border-white/10 bg-[#09131b] p-5">
                      <div className="text-xs uppercase tracking-[0.24em] text-[#96a8b9]">
                        Portfolio replay
                      </div>
                      <div className="mt-3 text-sm leading-6 text-[#b7c4cf]">
                        Equity path over the latest captured window.
                      </div>
                      <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4">
                        <Sparkline values={portfolioSeries} stroke="#7dd3fc" />
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                      <div className="text-xs uppercase tracking-[0.24em] text-[#96a8b9]">
                        Operator playbook
                      </div>
                      <div className="mt-4 grid gap-3">
                        {payload.riskSummary.operatorPlaybook.map((item) => (
                          <div
                            key={item}
                            className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-[#d7e2ea]"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionShell>
              </div>

              <div className="grid gap-8 xl:grid-cols-[0.95fr,1.05fr]">
                <SectionShell
                  eyebrow="Liquidation radar"
                  title="Stress events that deserve attention"
                  body="The radar highlights liquidation and outsized trade prints so the operator sees when Pacifica order flow is entering a stress regime."
                  icon={Radar}
                >
                  <div className="grid gap-3">
                    {payload.liquidationRadar.map((item) => (
                      <article
                        key={`${item.symbol}-${item.createdAt}-${item.side}`}
                        className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em]",
                                RISK_TONES[item.severity].badge,
                              )}
                            >
                              {item.cause.replaceAll("_", " ")}
                            </div>
                            <div className="text-lg font-semibold text-white">
                              {item.symbol}
                            </div>
                          </div>
                          <div className="text-sm text-[#d2dee7]">
                            {formatTime(item.createdAt)}
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm text-[#c1cfda] md:grid-cols-4">
                          <div>Side: {item.side}</div>
                          <div>Price: {item.price >= 100 ? formatUsd(item.price) : item.price.toFixed(4)}</div>
                          <div>Size: {compactNumberFormatter.format(item.amount)}</div>
                          <div>Notional: {formatCompactUsd(item.notionalUsd)}</div>
                        </div>
                      </article>
                    ))}
                  </div>
                </SectionShell>

                <SectionShell
                  eyebrow="Funding drag"
                  title="Carry board for the next funding window"
                  body="Instead of reading funding in isolation, the board turns Pacifica funding history into carry, impact spread, and crowding signals that matter to active perps books."
                  icon={Waves}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    {payload.fundingCurves.map((curve) => (
                      <FundingCurveCard key={curve.symbol} curve={curve} />
                    ))}
                  </div>
                </SectionShell>
              </div>

              <div className="grid gap-8 xl:grid-cols-[0.95fr,1.05fr]">
                <SectionShell
                  eyebrow="Account replay"
                  title="Positions, open orders, and recent fills"
                  body="This panel is what a trader would actually use before adding leverage: live account state when available, and a sample desk when no account id is provided."
                  icon={Activity}
                >
                  <div className="grid gap-4 md:grid-cols-4">
                    <MetricCard
                      label="Equity"
                      value={formatUsd(payload.account.equityUsd)}
                      detail={`Available ${formatUsd(payload.account.availableToSpendUsd)}`}
                    />
                    <MetricCard
                      label="Margin used"
                      value={formatUsd(payload.account.marginUsedUsd)}
                      detail={`Mode: ${SOURCE_LABELS[payload.account.mode]}`}
                    />
                    <MetricCard
                      label="30d volume"
                      value={formatCompactUsd(payload.account.volume30dUsd)}
                      detail={`${payload.account.tradeCount30d} trades in 30d`}
                    />
                    <MetricCard
                      label="PnL"
                      value={formatUsd(
                        payload.account.realizedPnlUsd + payload.account.unrealizedPnlUsd,
                      )}
                      detail={`Realized ${formatUsd(payload.account.realizedPnlUsd, 2)} · Unrealized ${formatUsd(payload.account.unrealizedPnlUsd, 2)}`}
                    />
                  </div>

                  <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10">
                    <div className="grid grid-cols-[0.9fr_repeat(6,minmax(0,1fr))] gap-3 bg-[#09131b] px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#8da3b6]">
                      <div>Position</div>
                      <div>Side</div>
                      <div>Notional</div>
                      <div>PnL</div>
                      <div>Margin</div>
                      <div>Liq buffer</div>
                      <div>Lev</div>
                    </div>
                    <div className="divide-y divide-white/6 bg-black/20">
                      {payload.account.positions.map((position) => (
                        <div
                          key={`${position.symbol}-${position.side}`}
                          className="grid grid-cols-[0.9fr_repeat(6,minmax(0,1fr))] gap-3 px-4 py-4 text-sm"
                        >
                          <div>
                            <div className="font-semibold text-white">{position.symbol}</div>
                            <div className="text-xs text-[#8ea2b5]">
                              Entry {position.entryPrice.toFixed(position.entryPrice >= 100 ? 2 : 4)}
                            </div>
                          </div>
                          <div className="text-[#dbe5ee]">{position.side}</div>
                          <div className="text-[#dbe5ee]">
                            {formatCompactUsd(position.notionalUsd)}
                          </div>
                          <div
                            className={cn(
                              position.unrealizedPnlUsd >= 0 ? "text-emerald-300" : "text-rose-300",
                            )}
                          >
                            {formatUsd(position.unrealizedPnlUsd, 2)}
                          </div>
                          <div className="text-[#dbe5ee]">
                            {formatUsd(position.marginUsedUsd, 2)}
                          </div>
                          <div
                            className={cn(
                              "text-[#dbe5ee]",
                              position.liquidationDistancePct !== null &&
                                position.liquidationDistancePct < 10 &&
                                "text-rose-300",
                            )}
                          >
                            {position.liquidationDistancePct === null
                              ? "n/a"
                              : `${position.liquidationDistancePct.toFixed(2)}%`}
                          </div>
                          <div className="text-[#dbe5ee]">
                            {position.leverage ? `${position.leverage}x` : "n/a"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                      <div className="text-xs uppercase tracking-[0.24em] text-[#97acbe]">
                        Open orders
                      </div>
                      <div className="mt-4 grid gap-3">
                        {payload.account.openOrders.map((order) => (
                          <div
                            key={`${order.symbol}-${order.createdAt}-${order.side}`}
                            className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#dbe5ee]"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium text-white">
                                {order.symbol} {order.orderType}
                              </span>
                              <span className="text-[#99afbf]">{order.side}</span>
                            </div>
                            <div className="mt-2 text-[#b6c3ce]">
                              {order.price
                                ? `Price ${order.price}`
                                : `Trigger ${order.triggerPrice || "n/a"}`}{" "}
                              · Amount {order.amount} · {order.reduceOnly ? "Reduce-only" : "Increase"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                      <div className="text-xs uppercase tracking-[0.24em] text-[#97acbe]">
                        Replay timeline
                      </div>
                      <div className="mt-4 grid gap-3">
                        {payload.account.tradeHistory.map((trade) => (
                          <div
                            key={`${trade.symbol}-${trade.createdAt}-${trade.side}`}
                            className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#dbe5ee]"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium text-white">
                                {trade.symbol} {trade.side}
                              </span>
                              <span className="text-[#99afbf]">{formatTime(trade.createdAt)}</span>
                            </div>
                            <div className="mt-2 text-[#b6c3ce]">
                              {trade.eventType} · {trade.cause} · Price {trade.price} · Notional{" "}
                              {formatUsd(trade.notionalUsd, 2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionShell>

                <SectionShell
                  eyebrow="Safe order plan"
                  title="Advisory actions instead of blind execution"
                  body="The room does not auto-trade. It produces bounded, operator-readable order suggestions that can later be piped into Pacifica builder flows."
                  icon={CircleAlert}
                >
                  <div className="grid gap-4">
                    {payload.riskSummary.safeOrderPlan.map((plan) => (
                      <article
                        key={plan.symbol}
                        className="rounded-[28px] border border-white/10 bg-black/20 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-xs uppercase tracking-[0.24em] text-[#97b8d3]">
                              {plan.symbol}
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-white">
                              {ACTION_LABELS[plan.action]}
                            </div>
                          </div>
                          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#d9e6ef]">
                            {plan.orderType}
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          <div className="rounded-[18px] border border-white/10 bg-[#09131b] px-4 py-3">
                            <div className="text-xs uppercase tracking-[0.2em] text-[#8ca3b7]">
                              Leverage cap
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-white">
                              {plan.leverageCap}x
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/10 bg-[#09131b] px-4 py-3">
                            <div className="text-xs uppercase tracking-[0.2em] text-[#8ca3b7]">
                              Size cap
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-white">
                              {formatUsd(plan.sizeCapUsd)}
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-white/10 bg-[#09131b] px-4 py-3">
                            <div className="text-xs uppercase tracking-[0.2em] text-[#8ca3b7]">
                              Invalidation
                            </div>
                            <div className="mt-2 text-sm leading-6 text-[#dbe7ef]">
                              {plan.invalidation}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 text-sm leading-7 text-[#c2cfda]">{plan.rationale}</div>
                      </article>
                    ))}
                  </div>

                  <div className="mt-6 rounded-[28px] border border-cyan-300/16 bg-cyan-400/8 px-5 py-4 text-sm leading-7 text-cyan-50">
                    Pacifica Risk Room is intentionally advisory-first. That keeps the product safer for demo day while leaving a clear upgrade path into Builder Program order flows and future copy-trading surfaces.
                  </div>
                </SectionShell>
              </div>

              <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
                <div className="flex flex-wrap items-center gap-3 text-[#a9d8f9]">
                  <Activity className="h-5 w-5" />
                  <p className="text-xs font-semibold uppercase tracking-[0.28em]">
                    Integration notes
                  </p>
                </div>
                <div className="mt-4 grid gap-3">
                  {payload.dataSources.map((source) => (
                    <div
                      key={source}
                      className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#d8e4ec]"
                    >
                      {source}
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
