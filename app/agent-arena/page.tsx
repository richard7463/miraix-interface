"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bot, Check, Copy, Globe, Plus, Trash2 } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import type { ArenaAgent, ArenaBoardMode, ArenaIntegrationState, WatchItem, ArenaLocale } from "@/lib/agentArena";
import { AGENT_ARENA_STORAGE_KEY, hydrateArenaAgent, ArenaLocale } from "@/lib/agentArena";
import { StatusBadge } from "@/components/AgentArena/StatusBadge";
import { AgentCard } from "@/components/AgentArena/AgentCard";
import { WatchItemCard } from "@/components/AgentArena/WatchItemCard";
import { CircleAvatar } from "@/components/AgentArena/CircleAvatar";
import { cn } from "@/lib/utils";

type ArenaSummary = {
  mode: ArenaBoardMode;
  count: number;
  averageRoi: number;
  averageDrawdown: number;
  averageStability: number;
  averageRiskAdjusted: number;
  source: "simulation" | "demo-run";
  label: string;
};

type ArenaPayload = {
  mode: ArenaBoardMode;
  leaderboard: ArenaAgent[];
  watchlist: WatchItem[];
  summary: ArenaSummary;
  integration: ArenaIntegrationState;
};

type ArenaView = "agents" | "watchlist";
type ArenaLocale = "en" | "zh";
type ArenaRankView = "pnl" | "stability" | "riskAdjusted" | "promotion";

const AGENT_ARENA_SKILL_SLUG = "miraix-agent-arena";
const AGENT_ARENA_INSTALL_COMMAND = `clawhub install ${AGENT_ARENA_SKILL_SLUG}`;
const AGENT_ARENA_LOCALE_KEY = "miraix-agent-arena-locale";

const copy = {
  en: {
    nav: ["Home", "Arena", "Signals", "Trader", "Docs"],
    eyebrow: "Miraix x OKX Agent Arena",
    heroTitle: "Launch your trading operator into a public arena.",
    heroBody:
      "Creation stays in OpenClaw. Ranking, promotion review, and operator comparison happen here.",
    create: "Create Agents",
    manage: "Manage Agents",
    topBoard: "Top board",
    boardBody: "Contestants ranked by profit, stability, and promotion readiness.",
    operators: "operators",
    avgRoi: "avg. ROI",
    avgDrawdown: "avg. drawdown",
    avgStability: "avg. stability",
    avgRiskAdjusted: "avg. risk-adjusted",
    rankViews: {
      pnl: "Profit",
      stability: "Stability",
      riskAdjusted: "Risk-adjusted",
      promotion: "Promotion",
    },
    agentsTab: "Agents",
    watchlistTab: "Watchlist",
    table: {
      agent: "Agent",
      pnl: "PnL",
      roi: "ROI",
      riskAdjusted: "Risk Adj.",
      stability: "Stability",
      thesis: "Profile",
      guards: "Guards",
      creator: "Creator",
      status: "Promotion",
    },
    results: "Results",
    loading: "Loading arena...",
    watchLabel: "Arena note",
    note: "Backtesting and demo review happen inside the arena before any promotion decision.",
    step1: "Install the arena skill in OpenClaw.",
    step2: "Bind your pair code and continue the setup in chat.",
    previewTitle: "What Arena generates next",
    previewItems: [
      "A normalized operator profile from your natural-language strategy.",
      "A demo-first promotion path with sandbox and review stages.",
      "A public results page with market context, scorecard, and ranking.",
    ],
    modal: {
      skill: "Copy Skill",
      code: "Copy Code",
      step1Title: "Step 1: send the skill to your OpenClaw agent",
      step1Body: "Install the arena skill first. Then continue to the pair-code step.",
      step2Title: "Step 2: send the bind code to your OpenClaw agent",
      step2Body: "The code is short-lived. Send it immediately, then finish the agent setup in chat.",
      copy: "Copy",
      copied: "Copied",
      cancel: "Cancel",
      continue: "Continue",
      back: "Back",
      confirm: "Open Chat",
    },
    manageTitle: "Private agents in this browser",
    manageBody: "These agents were created locally and can still be inspected or removed.",
    noAgents: "No private agents stored in this browser yet.",
    close: "Close",
    delete: "Delete",
    login: "Workspace",
  },
  zh: {
    nav: ["首页", "竞技场", "信号", "交易", "文档"],
    eyebrow: "Miraix x OKX Agent Arena",
    heroTitle: "把你的交易代理送进公开竞技场。",
    heroBody:
      "创建动作留在 OpenClaw 里完成，排行榜、晋级审核和公开比较在这里发生。",
    create: "创建 Agent",
    manage: "管理 Agent",
    topBoard: "头部榜单",
    boardBody: "按收益、稳定性和晋级准备度排序的公开参赛代理。",
    operators: "参赛代理",
    avgRoi: "平均 ROI",
    avgDrawdown: "平均回撤",
    avgStability: "平均稳定度",
    avgRiskAdjusted: "平均风险调整收益",
    rankViews: {
      pnl: "收益",
      stability: "稳定性",
      riskAdjusted: "风险调整",
      promotion: "晋级准备度",
    },
    agentsTab: "代理榜",
    watchlistTab: "观察池",
    table: {
      agent: "Agent",
      pnl: "盈亏",
      roi: "收益率",
      riskAdjusted: "风险调整",
      stability: "稳定度",
      thesis: "策略简介",
      guards: "风控触发",
      creator: "创建者",
      status: "晋级状态",
    },
    results: "详情",
    loading: "正在加载竞技场...",
    watchLabel: "观察说明",
    note: "所有代理都会先经过回测和 Demo 审核，再决定是否晋级。",
    step1: "先在 OpenClaw 里安装竞技场 skill。",
    step2: "再绑定 pair code，并在聊天里完成策略配置。",
    previewTitle: "创建后会生成什么",
    previewItems: [
      "根据自然语言策略生成标准化 Agent 档案和操盘手 persona。",
      "默认走 demo-first 晋级路径，先沙盒、再 Demo、再审核。",
      "生成公开结果页，展示市场上下文、评分卡和排行榜位置。",
    ],
    modal: {
      skill: "复制 Skill",
      code: "复制绑定码",
      step1Title: "第一步：把 Skill 发给你的 OpenClaw Agent",
      step1Body: "先安装竞技场 skill，再进入绑定 pair code 的步骤。",
      step2Title: "第二步：把绑定码发给你的 OpenClaw Agent",
      step2Body: "绑定码有有效期。复制后尽快发到聊天里，继续完成 Agent 创建。",
      copy: "复制",
      copied: "已复制",
      cancel: "取消",
      continue: "继续",
      back: "返回",
      confirm: "打开聊天",
    },
    manageTitle: "当前浏览器里的私有 Agent",
    manageBody: "这些 Agent 只保存在本地，可以继续查看或删除。",
    noAgents: "当前浏览器里还没有私有 Agent。",
    close: "关闭",
    delete: "删除",
    login: "工作区",
  },
} as const;


function signedUsd(value: number) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function pct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}


function generatePairCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const makeChunk = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `${makeChunk()}-${makeChunk()}`;
}


function LocaleSwitch({
  locale,
  onChange,
}: {
  locale: ArenaLocale;
  onChange: (value: ArenaLocale) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-arena-locale-switch-border bg-arena-locale-switch-bg p-1 shadow-[0_10px_30px_rgba(20,27,45,0.04)]">
      {(["en", "zh"] as ArenaLocale[]).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200",
            locale === item ? "bg-arena-dark text-white" : "text-arena-locale-switch-text hover:text-arena-dark",
          )}
        >
          {item === "en" ? "EN" : "中"}
        </button>
      ))}
    </div>
  );
}


function computedSourceLabel(source: ArenaSummary["source"], locale: ArenaLocale) {
  const translations = {
    en: {
      simulation: "Simulated Data",
      "demo-run": "Demo Run Data",
    },
    zh: {
      simulation: "模拟数据",
      "demo-run": "演示运行数据",
    },
  };
  return translations[locale][source];
}


const avatarColors = [
  { bg: "bg-arena-avatar-bg-1", text: "text-arena-avatar-text-1" },
  { bg: "bg-arena-avatar-bg-2", text: "text-arena-avatar-text-2" },
  { bg: "bg-arena-avatar-bg-3", text: "text-arena-avatar-text-3" },
  { bg: "bg-arena-avatar-bg-4", text: "text-arena-avatar-text-4" },
  { bg: "bg-arena-avatar-bg-5", text: "text-arena-avatar-text-5" },
];

const getHexColor = (tailwindClass: string) => {
  switch (tailwindClass) {
    case "bg-arena-avatar-bg-1": return "#DBEAFE";
    case "bg-arena-avatar-bg-2": return "#FEE2E2";
    case "bg-arena-avatar-bg-3": return "#D1FAE5";
    case "bg-arena-avatar-bg-4": return "#EDE9FE";
    case "bg-arena-avatar-bg-5": return "#FFEDD5";
    default: return "#CCCCCC"; // Default color
  }
};

export default function AgentArenaPage() {
  const router = useRouter();
  const copyToClipboard = useCopyToClipboard();

  const [view, setView] = useState<ArenaView>("agents");
  const [rankView, setRankView] = useState<ArenaRankView>("promotion");
  const [locale, setLocale] = useState<ArenaLocale>("en");
  const [payload, setPayload] = useState<ArenaPayload | null>(null);
  const [localAgents, setLocalAgents] = useState<ArenaAgent[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [pairCode, setPairCode] = useState(() => generatePairCode());
  const [copiedSkill, setCopiedSkill] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(AGENT_ARENA_LOCALE_KEY);
    if (stored === "en" || stored === "zh") {
      setLocale(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AGENT_ARENA_LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(AGENT_ARENA_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const hydrated = Array.isArray(parsed)
        ? (parsed.map(hydrateArenaAgent).filter(Boolean) as ArenaAgent[])
        : [];
      setLocalAgents(hydrated);
    } catch (error) {
      console.error("Failed to load local arena agents", error);
      setLocalAgents([]);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    fetch("/api/agent-arena", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load agent arena");
        }
        const data = (await response.json()) as ArenaPayload;
        setPayload(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error(error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const leaderboard = useMemo(() => {
    const remote = payload?.leaderboard ?? [];
    const all = [...localAgents, ...remote];

    const sorters: Record<ArenaRankView, (left: ArenaAgent, right: ArenaAgent) => number> = {
      pnl: (left, right) => right.pnl - left.pnl,
      stability: (left, right) => right.scorecard.stabilityScore - left.scorecard.stabilityScore,
      riskAdjusted: (left, right) => right.scorecard.riskAdjustedReturn - left.scorecard.riskAdjustedReturn,
      promotion: (left, right) => right.scorecard.promotionReadiness - left.scorecard.promotionReadiness,
    };

    return all.sort(sorters[rankView]);
  }, [payload, localAgents, rankView]);

  const topBoard = leaderboard.slice(0, 5);
  const watchlist = payload?.watchlist ?? [];
  const bindCommand = useMemo(
    () => `create your agent with pair code bind: ${pairCode}`,
    [pairCode],
  );
  const t = copy[locale];
  const summary = useMemo(() => {
    const count = leaderboard.length;
    const averageRoi =
      leaderboard.reduce((sum, agent) => sum + agent.roi, 0) / Math.max(count, 1);
    const averageDrawdown =
      leaderboard.reduce((sum, agent) => sum + agent.portfolio.maxDrawdownPct, 0) /
      Math.max(count, 1);
    const averageStability =
      leaderboard.reduce((sum, agent) => sum + agent.scorecard.stabilityScore, 0) /
      Math.max(count, 1);
    const averageRiskAdjusted =
      leaderboard.reduce((sum, agent) => sum + agent.scorecard.riskAdjustedReturn, 0) /
      Math.max(count, 1);

    return {
      mode: payload?.summary.mode ?? "all",
      count,
      averageRoi: Number(averageRoi.toFixed(2)),
      averageDrawdown: Number(averageDrawdown.toFixed(2)),
      averageStability: Number(averageStability.toFixed(2)),
      averageRiskAdjusted: Number(averageRiskAdjusted.toFixed(2)),
      source: payload?.summary.source ?? "simulation",
      label: payload?.summary.label ?? "",
    } satisfies ArenaSummary;
  }, [leaderboard, payload?.summary]);

  const summaryCards = useMemo(
    () => [
      {
        label: t.operators,
        value: `${summary.count}`,
        tone: "text-arena-dark",
      },
      {
        label: t.avgRoi,
        value: pct(summary.averageRoi),
        tone: "text-arena-pnl-positive",
      },
      {
        label: t.avgStability,
        value: `${Math.round(summary.averageStability)}`,
        tone: "text-arena-pill-blue-text",
      },
      {
        label: t.avgRiskAdjusted,
        value: `${summary.averageRiskAdjusted.toFixed(1)}`,
        tone: "text-arena-pill-orange-text",
      },
    ],
    [summary, t.avgRiskAdjusted, t.avgRoi, t.avgStability, t.operators],
  );

  function persistLocalAgents(nextAgents: ArenaAgent[]) {
    setLocalAgents(nextAgents);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AGENT_ARENA_STORAGE_KEY, JSON.stringify(nextAgents));
    }
  }

  function handleDeleteAgent(agentId: string) {
    const nextAgents = localAgents.filter((agent) => agent.id !== agentId);
    persistLocalAgents(nextAgents);
  }

  async function handleCopySkill() {
    const ok = await copyToClipboard(AGENT_ARENA_INSTALL_COMMAND);
    if (!ok) return;
    setCopiedSkill(true);
    window.setTimeout(() => setCopiedSkill(false), 1800);
  }

  async function handleCopyCode() {
    const ok = await copyToClipboard(bindCommand);
    if (!ok) return;
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1800);
  }

  function openCreateFlow() {
    setCreateStep(1);
    setPairCode(generatePairCode());
    setCopiedSkill(false);
    setCopiedCode(false);
    setCreateOpen(true);
  }

  function closeCreateFlow() {
    setCreateOpen(false);
    setCreateStep(1);
    setCopiedSkill(false);
    setCopiedCode(false);
  }

  function confirmCreateFlow() {
    closeCreateFlow();
    router.push(`/chat?input=${encodeURIComponent(bindCommand)}`);
  }

  return (
    <main className="min-h-screen bg-background text-card-foreground">
      <div className="mx-auto max-w-[1520px] px-8 pb-16 pt-6">
        <header className="mb-8 flex items-center justify-between rounded-[28px] border border-border bg-arena-header-bg px-7 py-5 shadow-[0_18px_40px_rgba(23,29,45,0.04)] backdrop-blur">
          <div className="flex items-center gap-8">
            <Link href="/agent-arena" className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-arena-dark text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-arena-text-secondary">miraix</div>
                <div className="text-xl font-bold tracking-tight text-arena-dark">Agent Arena</div>
              </div>
            </Link>
            <nav className="hidden items-center gap-8 text-base text-arena-text-secondary md:flex">
              {t.nav.map((item, index) => (
                <span key={item} className={cn("transition-colors duration-200", index === 1 ? "font-semibold text-arena-dark" : "font-normal hover:text-arena-dark")}>
                  {item}
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitch locale={locale} onChange={setLocale} />
            <div className="rounded-full border border-arena-locale-switch-border bg-arena-locale-switch-bg px-5 py-2.5 text-sm font-medium text-arena-workspace-text transition-colors duration-200 hover:bg-gray-100">
              {t.login}
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="overflow-hidden rounded-[34px] bg-arena-dark text-white shadow-[0_30px_80px_rgba(23,29,45,0.18)]">
            <div className="border-b border-white/10 px-8 py-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-arena-eyebrow-border bg-arena-eyebrow-bg px-3 py-1 text-xs uppercase tracking-wider text-arena-dark-text">
                <Globe className="h-3.5 w-3.5" />
                {t.eyebrow}
              </div>
            </div>

            <div className="px-8 py-8">
              <h1 className="max-w-[760px] text-6xl font-bold leading-tight tracking-tighter text-white md:text-7xl">
                {t.heroTitle}
              </h1>
              <p className="mt-6 max-w-[680px] text-lg leading-relaxed text-arena-hero-body">
                {t.heroBody}
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={openCreateFlow}
                  className="btn-arena-primary"
                >
                  <Plus className="h-5 w-5" />
                  {t.create}
                </button>
                <button
                  type="button"
                  onClick={() => setManageOpen(true)}
                  className="btn-arena-secondary"
                >
                  <Bot className="h-5 w-5" />
                  {t.manage}
                </button>
              </div>

              <div className="mt-12 grid gap-4 md:grid-cols-3">
                {[
                  ["01", t.step1],
                  ["02", t.step2],
                  ["03", t.note],
                ].map(([index, text]) => (
                  <div key={index} className="rounded-[24px] border border-arena-info-pill-border bg-arena-info-pill-bg px-5 py-5">
                    <div className="text-xs uppercase tracking-widest text-arena-info-pill-text">{index}</div>
                    <div className="mt-4 text-base leading-relaxed text-arena-info-pill-body">{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card-arena-base px-7 py-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm uppercase tracking-widest text-arena-text-secondary">{t.topBoard}</div>
                <p className="mt-3 max-w-[460px] text-base leading-relaxed text-arena-text-secondary">{t.boardBody}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-arena-simulation-border bg-arena-simulation-bg px-3 py-1 text-xs font-medium text-arena-simulation-text">
                  {computedSourceLabel(summary.source, locale)}
                </div>
              </div>
            </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-4">
                {summaryCards.map((card) => (
                  <div key={card.label} className="rounded-[22px] border border-arena-summary-card-border bg-arena-summary-card-bg px-5 py-5">
                    <div className="text-sm text-arena-text-secondary">{card.label}</div>
                    <div className={cn("mt-3 text-4xl font-bold tracking-tight", card.tone)}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 inline-flex rounded-full border border-arena-rank-switcher-border bg-arena-rank-switcher-bg p-1">
                {(["promotion", "pnl", "stability", "riskAdjusted"] as ArenaRankView[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRankView(item)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                      rankView === item ? "bg-arena-dark text-white" : "text-arena-text-secondary hover:text-arena-dark",
                    )}
                  >
                    {t.rankViews[item]}
                  </button>
                ))}
              </div>

              <div className="mt-7 space-y-3">
                {topBoard.map((agent, index) => (
                <Link
                  key={agent.id}
                  href={`/agent-arena/${agent.id}`}
                  className="grid grid-cols-[50px_minmax(0,1fr)_180px] items-center gap-4 rounded-[22px] border border-arena-rank-card-border bg-arena-rank-card-bg px-5 py-4 transition-all duration-200 hover:border-arena-link-hover-border hover:bg-white"
                >
                  <CircleAvatar value={`${index + 1}`} color="#edf1ff" textColor="text-arena-pill-blue-text" size="h-12 w-12 text-[18px] font-semibold" />
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold tracking-tight text-arena-dark">{agent.name}</div>
                    <div className="mt-1 truncate text-sm text-arena-text-secondary">{agent.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold tracking-tight text-arena-pill-green-text">
                      {rankView === "pnl"
                        ? signedUsd(agent.pnl)
                        : rankView === "stability"
                          ? `${agent.scorecard.stabilityScore}`
                          : rankView === "riskAdjusted"
                            ? `${agent.scorecard.riskAdjustedReturn.toFixed(1)}`
                            : `${agent.scorecard.promotionReadiness}`}
                    </div>
                    <div className="mt-1 text-sm text-arena-text-secondary">
                      {rankView === "pnl"
                        ? pct(agent.roi)
                        : rankView === "stability"
                          ? `${agent.scorecard.runtimeGuardTrips} guard trips`
                          : rankView === "riskAdjusted"
                            ? `PF ${agent.scorecard.profitFactor.toFixed(2)}`
                            : "Promotion"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-5 rounded-[20px] border border-arena-rank-card-border bg-arena-no-agents-bg px-5 py-4 text-sm leading-relaxed text-arena-simulation-text">
              {locale === "zh"
                ? "当前 leaderboard、ROI、risk-adjusted、stability、promotion readiness 仍为 simulation 数据。真实 OKX demo 账户、订单和成交证据请进入详情页查看。"
                : "The current leaderboard, ROI, risk-adjusted, stability, and promotion readiness are still simulation data. Open a detail page to inspect real OKX demo account, order, and fill evidence."}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-5 border-b border-arena-divider pb-4">
            <div className="inline-flex items-center gap-8 text-xl tracking-tight">
              <button
                type="button"
                onClick={() => setView("agents")}
                className={cn(
                  "relative pb-3 font-semibold",
                  view === "agents" ? "text-arena-dark" : "text-arena-text-secondary",
                )}
              >
                {t.agentsTab}
                {view === "agents" ? (
                  <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-arena-active-tab" />
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setView("watchlist")}
                className={cn(
                  "relative pb-3 font-medium",
                  view === "watchlist" ? "text-arena-dark" : "text-arena-text-secondary",
                )}
              >
                {t.watchlistTab}
                {view === "watchlist" ? (
                  <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-arena-active-tab" />
                ) : null}
              </button>
            </div>

            <div className="text-sm text-arena-text-secondary">
              {summary.count} {t.operators}
            </div>
          </div>

          {view === "agents" ? (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <div className="col-span-full px-8 py-16 text-center text-arena-text-secondary">{t.loading}</div>
              ) : (
                leaderboard.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} locale={locale} />
                ))
              )}
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {watchlist.map((item, index) => (
                <WatchItemCard key={item.id} item={item} index={index} />
              ))}
            </div>
          )}

          <div className="mt-6 text-right text-base text-arena-text-secondary opacity-75">{t.note}</div>
        </section>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(23,29,45,0.42)] p-6">
          <div className="modal-arena-base">
            <div className="flex items-center gap-3">
              {[
                { step: 1 as const, label: t.modal.skill },
                { step: 2 as const, label: t.modal.code },
              ].map((item) => (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setCreateStep(item.step)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    createStep === item.step ? "bg-arena-dark text-white" : "bg-arena-modal-button-bg text-arena-text-secondary",
                  )}
                >
                  {item.step}. {item.label}
                </button>
              ))}
            </div>

            {createStep === 1 ? (
              <div className="mt-6">
                <div className="text-2xl font-semibold tracking-tight text-arena-dark">{t.modal.step1Title}</div>
                <p className="mt-2 text-base leading-relaxed text-arena-text-secondary">{t.modal.step1Body}</p>
                <div className="mt-5 rounded-[24px] border border-arena-rank-switcher-border bg-arena-rank-switcher-bg px-5 py-5 text-lg font-medium text-card-foreground">
                  {AGENT_ARENA_INSTALL_COMMAND}
                </div>
                <button
                  type="button"
                  onClick={handleCopySkill}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-arena-no-agents-border bg-arena-locale-switch-bg px-4 py-2.5 text-sm font-medium text-arena-dark transition-colors duration-200 hover:bg-gray-100"
                >
                  {copiedSkill ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedSkill ? t.modal.copied : t.modal.copy}
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <div className="text-2xl font-semibold tracking-tight text-arena-dark">{t.modal.step2Title}</div>
                <p className="mt-2 text-base leading-relaxed text-arena-text-secondary">{t.modal.step2Body}</p>
                <div className="mt-5 rounded-[24px] bg-arena-dark px-5 py-5 text-lg font-medium text-white">
                  {bindCommand}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-arena-no-agents-border bg-arena-locale-switch-bg px-4 py-2.5 text-sm font-medium text-arena-dark transition-colors duration-200 hover:bg-gray-100"
                >
                  {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedCode ? t.modal.copied : t.modal.copy}
                </button>

                <div className="mt-6 rounded-[24px] border border-arena-rank-switcher-border bg-arena-modal-preview-bg p-5">
                  <div className="text-sm font-medium uppercase tracking-wider text-arena-text-secondary">
                    {t.previewTitle}
                  </div>
                  <div className="mt-4 space-y-3 text-base leading-relaxed text-arena-modal-preview-text">
                    {t.previewItems.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-arena-pill-blue-text" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3">
              {createStep === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={closeCreateFlow}
                    className="rounded-full border border-arena-no-agents-border bg-arena-locale-switch-bg px-5 py-3 text-sm font-medium text-arena-text-secondary transition-colors duration-200 hover:bg-gray-100"
                  >
                    {t.modal.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateStep(2)}
                    className="rounded-full bg-arena-dark px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-700"
                  >
                    {t.modal.continue}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCreateStep(1)}
                    className="rounded-full border border-arena-no-agents-border bg-arena-locale-switch-bg px-5 py-3 text-sm font-medium text-arena-text-secondary transition-colors duration-200 hover:bg-gray-100"
                  >
                    {t.modal.back}
                  </button>
                  <button
                    type="button"
                    onClick={confirmCreateFlow}
                    className="rounded-full bg-destructive px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600"
                  >
                    {t.modal.confirm}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {manageOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(23,29,45,0.42)] p-6">
          <div className="modal-arena-base">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold tracking-tight text-arena-dark">{t.manageTitle}</div>
                <div className="mt-2 text-base leading-relaxed text-arena-text-secondary">{t.manageBody}</div>
              </div>
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="rounded-full border border-arena-no-agents-border bg-arena-locale-switch-bg px-4 py-2 text-sm text-arena-text-secondary"
              >
                {t.close}
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {localAgents.length ? (
                localAgents.map((agent, index) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between gap-4 rounded-[24px] border border-arena-rank-card-border bg-arena-no-agents-bg px-5 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <CircleAvatar
                        value={agent.shortName}
                        color={getHexColor(avatarColors[index % avatarColors.length].bg)}
                        textColor={avatarColors[index % avatarColors.length].text}
                      />
                      <div>
                        <div className="text-lg font-semibold tracking-tight text-arena-dark">{agent.name}</div>
                        <div className="text-sm text-arena-text-secondary">{agent.style}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/agent-arena/${agent.id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-arena-pill-blue-bg px-4 py-2 text-sm font-medium text-arena-pill-blue-text transition-colors duration-200 hover:bg-blue-600 hover:text-white"
                      >
                        {t.results}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-arena-delete-button-border bg-arena-delete-button-bg px-4 py-2 text-sm font-medium text-arena-delete-button-text transition-colors duration-200 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t.delete}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-arena-no-agents-border bg-arena-no-agents-bg px-6 py-12 text-center text-arena-text-secondary">
                  {t.noAgents}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
