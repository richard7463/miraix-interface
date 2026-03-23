"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Bot, Check, Copy, Globe, Plus, Star, Trash2 } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import type {
  ArenaAgent,
  ArenaBoardMode,
  ArenaIntegrationState,
  ArenaLocale,
  WatchItem,
} from "@/lib/agentArena";
import { StatusBadge } from "@/components/AgentArena/StatusBadge";
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
type ArenaRankView = "pnl" | "stability" | "riskAdjusted";
type TopBoardTab = "overview" | "top5";
type ArenaCreateStep = 1 | 2 | 3;
type ArenaSubmissionDirection = "long" | "short" | "both";
type ArenaSubmissionLeverage = "conservative" | "balanced" | "aggressive";

type ArenaCreateForm = {
  name: string;
  creator: string;
  symbol: string;
  timeframe: string;
  direction: ArenaSubmissionDirection;
  leveragePreference: ArenaSubmissionLeverage;
  weeklyEvolution: boolean;
  strategyBrief: string;
  persona: string;
};

const AGENT_ARENA_SKILL_SLUG = "miraix-agent-arena";
const AGENT_ARENA_INSTALL_COMMAND = `clawhub install ${AGENT_ARENA_SKILL_SLUG}`;
const AGENT_ARENA_LOCALE_KEY = "miraix-agent-arena-locale";

const copy = {
  en: {
    nav: ["Home", "Arena"],
    eyebrow: "Miraix x OKX Agent Arena",
    heroTitle: "Launch your trading operator into a public arena.",
    heroBody:
      "Creation stays in OpenClaw. Submission, public display, and operator comparison happen here.",
    create: "Create Agents",
    manage: "Manage Agents",
    topBoard: "Top board",
    boardBody: "Contestants ranked by profit, stability, and risk-adjusted return.",
    operators: "operators",
    avgRoi: "avg. ROI",
    avgDrawdown: "avg. drawdown",
    avgStability: "avg. stability",
    avgRiskAdjusted: "avg. risk-adjusted",
    rankViews: {
      pnl: "Profit",
      stability: "Stability",
      riskAdjusted: "Risk-adjusted",
    },
    boardTabs: {
      overview: "Overview",
      top5: "Top 5",
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
      status: "Status",
    },
    results: "Results",
    loading: "Loading arena...",
    watchLabel: "Arena note",
    note: "Submitted agents appear in the arena immediately. OKX market, account, and execution panels load when live integrations are available.",
    step1: "Install the arena skill in OpenClaw.",
    step2: "Bind your pair code and continue the setup in chat, or submit the normalized brief here.",
    previewTitle: "What Arena generates next",
    previewItems: [
      "A normalized operator profile from your natural-language strategy.",
      "A public results page with OKX market, portfolio, and execution context.",
      "A persistent submission record that appears in the arena immediately.",
    ],
    modal: {
      skill: "Copy Skill",
      code: "Copy Code",
      profile: "Register Agent",
      step1Title: "Step 1: send the skill to your OpenClaw agent",
      step1Body: "Install the arena skill first. Then continue to the pair-code step.",
      step2Title: "Step 2: send the bind code to your OpenClaw agent",
      step2Body: "The code is short-lived. Send it immediately, then finish the agent setup in chat.",
      step3Title: "Step 3: register the agent in Arena",
      step3Body: "Use the normalized strategy brief from chat and submit it here. The agent will appear in Arena immediately after submission.",
      copy: "Copy",
      copied: "Copied",
      cancel: "Cancel",
      continue: "Continue",
      back: "Back",
      openChat: "Open Chat",
      confirm: "Register Agent",
      submitting: "Submitting...",
      name: "Agent name",
      creator: "Creator",
      symbol: "Symbol",
      timeframe: "Timeframe",
      direction: "Direction",
      leverage: "Leverage",
      weeklyEvolution: "Enable weekly evolution",
      strategy: "Strategy brief",
      persona: "Operator persona",
    },
    manageTitle: "Submitted agents in Arena",
    manageBody: "Submitted agents can be opened or removed here.",
    noAgents: "No submitted agents yet.",
    close: "Close",
    delete: "Delete",
    login: "Workspace",
  },
  zh: {
    nav: ["首页", "竞技场"],
    eyebrow: "Miraix x OKX Agent Arena",
    heroTitle: "把你的交易代理送进公开竞技场。",
    heroBody:
      "创建动作留在 OpenClaw 里完成，提交展示和公开比较在这里发生。",
    create: "创建 Agent",
    manage: "管理 Agent",
    topBoard: "头部榜单",
    boardBody: "按收益、稳定性和风险调整收益排序的公开参赛代理。",
    operators: "参赛代理",
    avgRoi: "平均 ROI",
    avgDrawdown: "平均回撤",
    avgStability: "平均稳定度",
    avgRiskAdjusted: "平均风险调整收益",
    rankViews: {
      pnl: "收益",
      stability: "稳定性",
      riskAdjusted: "风险调整",
    },
    boardTabs: {
      overview: "概览",
      top5: "Top 5",
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
      status: "状态",
    },
    results: "详情",
    loading: "正在加载竞技场...",
    watchLabel: "观察说明",
    note: "提交后的 Agent 会立刻出现在 Arena。只要 OKX 实时能力可用，市场、账户和执行面板就会同步加载。",
    step1: "先在 OpenClaw 里安装竞技场 skill。",
    step2: "再绑定 pair code，并在聊天里继续配置，或直接在这里提交标准化策略。",
    previewTitle: "创建后会生成什么",
    previewItems: [
      "根据自然语言策略生成标准化 Agent 档案和操盘手 persona。",
      "生成公开结果页，优先展示 OKX 市场、账户和执行上下文。",
      "生成持久化提交记录，并立刻出现在 Arena 列表里。",
    ],
    modal: {
      skill: "复制 Skill",
      code: "复制绑定码",
      profile: "提交 Agent",
      step1Title: "第一步：把 Skill 发给你的 OpenClaw Agent",
      step1Body: "先安装竞技场 skill，再进入绑定 pair code 的步骤。",
      step2Title: "第二步：把绑定码发给你的 OpenClaw Agent",
      step2Body: "绑定码有有效期。复制后尽快发到聊天里，继续完成 Agent 创建。",
      step3Title: "第三步：把 Agent 提交到 Arena",
      step3Body: "把聊天里整理好的标准化策略填到这里，提交后会立刻出现在 Arena 中。",
      copy: "复制",
      copied: "已复制",
      cancel: "取消",
      continue: "继续",
      back: "返回",
      openChat: "打开聊天",
      confirm: "提交 Agent",
      submitting: "提交中...",
      name: "Agent 名称",
      creator: "创建者",
      symbol: "交易对",
      timeframe: "周期",
      direction: "方向",
      leverage: "杠杆偏好",
      weeklyEvolution: "开启每周进化",
      strategy: "策略简述",
      persona: "操盘手 persona",
    },
    manageTitle: "已提交到 Arena 的 Agent",
    manageBody: "这里可以查看详情或删除已提交的 Agent。",
    noAgents: "当前还没有提交到 Arena 的 Agent。",
    close: "关闭",
    delete: "删除",
    login: "工作区",
  },
} as const;

const DEFAULT_CREATE_FORM: ArenaCreateForm = {
  name: "",
  creator: "Arena Submitter",
  symbol: "BTC-USDT",
  timeframe: "15m",
  direction: "long",
  leveragePreference: "balanced",
  weeklyEvolution: true,
  strategyBrief: "",
  persona: "",
};


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

function rankPrimaryValue(agent: ArenaAgent, rankView: ArenaRankView) {
  switch (rankView) {
    case "pnl":
      return signedUsd(agent.pnl);
    case "stability":
      return `${agent.scorecard.stabilityScore}`;
    case "riskAdjusted":
      return agent.scorecard.riskAdjustedReturn.toFixed(1);
  }
}

function rankSecondaryValue(agent: ArenaAgent, rankView: ArenaRankView, locale: ArenaLocale) {
  switch (rankView) {
    case "pnl":
      return pct(agent.roi);
    case "stability":
      return locale === "zh"
        ? `${agent.scorecard.runtimeGuardTrips} 次风控触发`
        : `${agent.scorecard.runtimeGuardTrips} guard trips`;
    case "riskAdjusted":
      return `PF ${agent.scorecard.profitFactor.toFixed(2)}`;
  }
}

function rankPrimaryTone(rankView: ArenaRankView) {
  switch (rankView) {
    case "pnl":
      return "text-arena-pill-green-text";
    case "stability":
      return "text-arena-pill-blue-text";
    case "riskAdjusted":
      return "text-arena-pill-orange-text";
  }
}

function BoardSnapshotSkeleton() {
  return (
    <div className="mt-8">
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[92px] animate-pulse rounded-[20px] border border-arena-summary-card-border bg-arena-summary-card-bg"
          />
        ))}
      </div>
      <div className="mt-6 h-[72px] animate-pulse rounded-[18px] bg-arena-summary-card-bg" />
      <div className="mt-4 h-[96px] animate-pulse rounded-[20px] border border-arena-rank-card-border bg-arena-rank-card-bg" />
    </div>
  );
}

function TopBoardPreview({
  topBoard,
  rankView,
  locale,
}: {
  topBoard: ArenaAgent[];
  rankView: ArenaRankView;
  locale: ArenaLocale;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-[24px] border border-arena-rank-card-border bg-arena-rank-card-bg">
      <div className="flex items-center justify-between border-b border-[#ece4d9] px-5 py-4">
        <div className="text-xs uppercase tracking-[0.16em] text-arena-text-secondary">
          {locale === "zh" ? "榜单快照" : "Board Snapshot"}
        </div>
        <div className="text-sm text-arena-text-secondary">
          Top {Math.min(topBoard.length, 5)}
        </div>
      </div>

      <div className="divide-y divide-[#ece4d9]">
        {topBoard.map((agent, index) => (
          <Link
            key={agent.id}
            href={`/agent-arena/${agent.id}`}
            className="grid grid-cols-[44px_minmax(0,1fr)_112px] items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-white"
          >
            <CircleAvatar
              value={`${index + 1}`}
              color="#edf1ff"
              textColor="text-arena-pill-blue-text"
              size="h-11 w-11 text-sm font-semibold"
            />
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-arena-dark">{agent.name}</div>
              <div className="mt-1 truncate text-sm text-arena-text-secondary">{agent.style}</div>
            </div>
            <div className="text-right">
              <div className={cn("text-lg font-semibold tracking-tight", rankPrimaryTone(rankView))}>
                {rankPrimaryValue(agent, rankView)}
              </div>
              <div className="mt-1 text-xs text-arena-text-secondary">
                {rankSecondaryValue(agent, rankView, locale)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="rounded-[32px] border border-[#e8e0d5] bg-white shadow-[0_24px_60px_rgba(23,29,45,0.05)]">
      <div className="hidden grid-cols-[minmax(0,2.4fr)_120px_120px_120px_110px_160px] gap-4 px-6 py-4 text-xs uppercase tracking-[0.14em] text-arena-text-secondary xl:grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-4 animate-pulse rounded bg-arena-summary-card-bg" />
        ))}
      </div>
      <div className="divide-y divide-[#f0e9df]">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid gap-4 px-6 py-5 xl:grid-cols-[minmax(0,2.4fr)_120px_120px_120px_110px_160px] xl:items-center">
            <div className="h-12 animate-pulse rounded bg-arena-summary-card-bg" />
            <div className="h-8 animate-pulse rounded bg-arena-summary-card-bg" />
            <div className="h-8 animate-pulse rounded bg-arena-summary-card-bg" />
            <div className="h-8 animate-pulse rounded bg-arena-summary-card-bg" />
            <div className="h-8 animate-pulse rounded bg-arena-summary-card-bg" />
            <div className="h-10 animate-pulse rounded bg-arena-summary-card-bg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgentArenaPage() {
  const router = useRouter();
  const copyToClipboard = useCopyToClipboard();

  const [view, setView] = useState<ArenaView>("agents");
  const [rankView, setRankView] = useState<ArenaRankView>("riskAdjusted");
  const [topBoardTab, setTopBoardTab] = useState<TopBoardTab>("overview");
  const [locale, setLocale] = useState<ArenaLocale>("en");
  const [payload, setPayload] = useState<ArenaPayload | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [createStep, setCreateStep] = useState<ArenaCreateStep>(1);
  const [pairCode, setPairCode] = useState(() => generatePairCode());
  const [copiedSkill, setCopiedSkill] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [createForm, setCreateForm] = useState<ArenaCreateForm>(DEFAULT_CREATE_FORM);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [busyAgentId, setBusyAgentId] = useState<string | null>(null);
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

  const refreshArena = async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/agent-arena", { signal });
      if (!response.ok) {
        throw new Error("Failed to load agent arena");
      }
      const data = (await response.json()) as ArenaPayload;
      setPayload(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    refreshArena(controller.signal)
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
    const all = [...remote];

    const sorters: Record<ArenaRankView, (left: ArenaAgent, right: ArenaAgent) => number> = {
      pnl: (left, right) => right.pnl - left.pnl,
      stability: (left, right) => right.scorecard.stabilityScore - left.scorecard.stabilityScore,
      riskAdjusted: (left, right) => right.scorecard.riskAdjustedReturn - left.scorecard.riskAdjustedReturn,
    };

    return all.sort(sorters[rankView]);
  }, [payload, rankView]);

  const topBoard = leaderboard.slice(0, 5);
  const privateAgents = useMemo(
    () => leaderboard.filter((agent) => agent.localOnly),
    [leaderboard],
  );
  const watchlist = payload?.watchlist ?? [];
  const isInitialLoading = isLoading && !payload;
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
    setCreateError(null);
    setCreateForm(DEFAULT_CREATE_FORM);
    setCreateOpen(true);
  }

  function closeCreateFlow() {
    setCreateOpen(false);
    setCreateStep(1);
    setCopiedSkill(false);
    setCopiedCode(false);
    setCreateError(null);
    setCreateForm(DEFAULT_CREATE_FORM);
  }

  function openChatForCreateFlow() {
    router.push(`/chat?input=${encodeURIComponent(bindCommand)}`);
  }

  async function handleRegisterAgent() {
    if (!createForm.name.trim() || !createForm.strategyBrief.trim()) {
      setCreateError(
        locale === "zh"
          ? "请至少填写 Agent 名称和策略简述。"
          : "Agent name and strategy brief are required.",
      );
      return;
    }

    try {
      setIsSubmittingCreate(true);
      setCreateError(null);

      const response = await fetch("/api/agent-arena/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairCode,
          ...createForm,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to register arena agent.");
      }

      await refreshArena();
      closeCreateFlow();
      router.push(`/agent-arena/${data.agent.id}`);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : locale === "zh"
            ? "提交 Agent 失败。"
            : "Failed to submit agent.",
      );
    } finally {
      setIsSubmittingCreate(false);
    }
  }

  async function handleDeleteAgent(agentId: string) {
    try {
      setBusyAgentId(agentId);
      const response = await fetch(`/api/agent-arena/${agentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete agent.");
      }

      await refreshArena();
    } catch (error) {
      console.error(error);
    } finally {
      setBusyAgentId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#27272a] text-card-foreground">
      <div className="bg-background">
        <div className="mx-auto max-w-[1520px] px-8 pb-20 pt-6">
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_440px] xl:items-start">
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
                  className="inline-flex items-center gap-3 rounded-full bg-[#ff7a45] px-7 py-4 text-base font-semibold text-white shadow-[0_14px_34px_rgba(255,122,69,0.32)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f16831] hover:shadow-[0_18px_38px_rgba(255,122,69,0.36)] active:translate-y-0"
                >
                  <Plus className="h-5 w-5" />
                  {t.create}
                </button>
                <button
                  type="button"
                  onClick={() => setManageOpen(true)}
                  className="inline-flex items-center gap-3 rounded-full border border-white/60 bg-[#fff8ef] px-7 py-4 text-base font-semibold text-[#1f2937] shadow-[0_12px_28px_rgba(9,14,24,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
                >
                  <Bot className="h-5 w-5" />
                  {t.manage}
                </button>
                <Link
                  href="/agent-arena/submission"
                  className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-white/8 px-7 py-4 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/14"
                >
                  <ArrowUpRight className="h-5 w-5" />
                  Submission
                </Link>
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

          <div className="card-arena-base px-7 py-7 xl:self-start">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm uppercase tracking-widest text-arena-text-secondary">{t.topBoard}</div>
                <p className="mt-3 max-w-[460px] text-base leading-relaxed text-arena-text-secondary">{t.boardBody}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-arena-simulation-border bg-arena-simulation-bg px-3 py-1 text-xs font-medium text-arena-simulation-text">
                  {computedSourceLabel(summary.source, locale)}
                </div>
              </div>
            </div>

            {isInitialLoading ? (
              <BoardSnapshotSkeleton />
            ) : (
              <>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {summaryCards.map((card) => (
                    <div key={card.label} className="rounded-[20px] border border-arena-summary-card-border bg-arena-summary-card-bg px-5 py-4">
                      <div className="text-sm text-arena-text-secondary">{card.label}</div>
                      <div className={cn("mt-2 text-[32px] font-bold tracking-tight", card.tone)}>
                        {card.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 inline-flex rounded-full border border-arena-rank-switcher-border bg-arena-rank-switcher-bg p-1">
                  {(["overview", "top5"] as TopBoardTab[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTopBoardTab(item)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                        topBoardTab === item ? "bg-arena-dark text-white" : "text-arena-text-secondary hover:text-arena-dark",
                      )}
                    >
                      {t.boardTabs[item]}
                    </button>
                  ))}
                </div>

                {topBoardTab === "overview" ? (
                  <div className="mt-4 rounded-[20px] border border-arena-rank-card-border bg-arena-no-agents-bg px-5 py-4 text-sm leading-relaxed text-arena-simulation-text">
                    {locale === "zh"
                      ? "顶部只保留概览信息，避免和下方主榜单重复。完整排行榜、排序切换和更多字段都放在下面。"
                      : "The top panel stays compact by default and avoids duplicating the main leaderboard below. Use the main board for full ranking, sorting, and detailed fields."}
                  </div>
                ) : (
                  <TopBoardPreview topBoard={topBoard} rankView={rankView} locale={locale} />
                )}
              </>
            )}
          </div>
        </section>
        </div>
      </div>

      <div className="mx-auto max-w-[1520px] px-8 pb-16 pt-10">
        <section className="pb-16">
          <div className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setView("agents")}
                className={cn(
                  "rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-200",
                  view === "agents" ? "bg-white text-[#1f2937]" : "text-white/65 hover:text-white",
                )}
              >
                {t.agentsTab}
              </button>
              <button
                type="button"
                onClick={() => setView("watchlist")}
                className={cn(
                  "rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-200",
                  view === "watchlist" ? "bg-white text-[#1f2937]" : "text-white/65 hover:text-white",
                )}
              >
                {t.watchlistTab}
              </button>
            </div>

            <div>
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
                {(["riskAdjusted", "pnl", "stability"] as ArenaRankView[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRankView(item)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200",
                      rankView === item ? "bg-white text-[#1f2937]" : "text-white/65 hover:text-white",
                    )}
                  >
                    {t.rankViews[item]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {view === "agents" ? (
            <div className="mt-6">
              {isInitialLoading ? (
                <LeaderboardSkeleton />
              ) : (
                <div className="overflow-hidden rounded-[32px] border border-[#e8e0d5] bg-white shadow-[0_24px_60px_rgba(23,29,45,0.05)]">
                  <div className="hidden grid-cols-[minmax(0,2.4fr)_120px_120px_120px_110px_160px] gap-4 px-6 py-4 text-xs uppercase tracking-[0.14em] text-arena-text-secondary xl:grid">
                    <div>{t.table.agent}</div>
                    <div>{t.table.pnl}</div>
                    <div>{t.table.roi}</div>
                    <div>{t.table.riskAdjusted}</div>
                    <div>{t.table.stability}</div>
                    <div>{t.table.status}</div>
                  </div>

                  <div className="divide-y divide-[#f0e9df]">
                    {leaderboard.map((agent, index) => (
                      <Link
                        key={agent.id}
                        href={`/agent-arena/${agent.id}`}
                        className="grid gap-4 px-6 py-5 transition-colors duration-200 hover:bg-[#fcfaf7] xl:grid-cols-[minmax(0,2.4fr)_120px_120px_120px_110px_160px] xl:items-center"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <CircleAvatar
                            value={agent.shortName}
                            color={getHexColor(avatarColors[index % avatarColors.length].bg)}
                            textColor={avatarColors[index % avatarColors.length].text}
                          />
                          <div className="min-w-0">
                            <div className="truncate text-lg font-semibold text-arena-dark">{agent.name}</div>
                            <div className="mt-1 truncate text-sm text-arena-text-secondary">{agent.style}</div>
                            <div className="mt-1 truncate text-sm text-[#8e8579]">{agent.description}</div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-[#8e8579]">
                              <span className="inline-flex items-center gap-1">
                                <Star className={cn("h-3.5 w-3.5", agent.following && "fill-current text-[#c96d1f]")} />
                                {agent.followers}
                              </span>
                              {agent.following ? (
                                <span className="rounded-full bg-[#fff3df] px-2 py-0.5 font-medium text-[#c96d1f]">
                                  {locale === "zh" ? "已关注" : "Following"}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="text-lg font-semibold text-arena-pill-green-text">
                          {signedUsd(agent.pnl)}
                        </div>

                        <div className="text-base font-semibold text-arena-dark">
                          {pct(agent.roi)}
                        </div>

                        <div className="text-base font-semibold text-arena-pill-orange-text">
                          {agent.scorecard.riskAdjustedReturn.toFixed(1)}
                        </div>

                        <div className="text-base font-semibold text-arena-pill-blue-text">
                          {agent.scorecard.stabilityScore}
                        </div>

                        <div className="flex items-center justify-between gap-3 xl:justify-end">
                          <StatusBadge stage={agent.promotion.stage} locale={locale} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(13,18,29,0.56)] p-6 backdrop-blur-[6px]">
          <div className="w-full max-w-[720px] rounded-[32px] border border-[#eadfce] bg-[#fff8ef] p-7 shadow-[0_36px_100px_rgba(12,18,28,0.32)]">
            <div className="flex items-center gap-3">
              {[
                { step: 1 as const, label: t.modal.skill },
                { step: 2 as const, label: t.modal.code },
                { step: 3 as const, label: t.modal.profile },
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
            ) : createStep === 2 ? (
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
            ) : (
              <div className="mt-6">
                <div className="text-2xl font-semibold tracking-tight text-arena-dark">{t.modal.step3Title}</div>
                <p className="mt-2 text-base leading-relaxed text-arena-text-secondary">{t.modal.step3Body}</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <div className="mb-2 text-sm font-medium text-arena-dark">{t.modal.name}</div>
                    <input
                      value={createForm.name}
                      onChange={(event) =>
                        setCreateForm((state) => ({ ...state, name: event.target.value }))
                      }
                      className="w-full rounded-[18px] border border-[#e4d8c8] bg-white px-4 py-3 text-base text-[#1f2937] outline-none transition focus:border-[#ff7a45]"
                      placeholder={locale === "zh" ? "例如：Breakout Ranger" : "e.g. Breakout Ranger"}
                    />
                  </label>
                  <label className="block">
                    <div className="mb-2 text-sm font-medium text-arena-dark">{t.modal.creator}</div>
                    <input
                      value={createForm.creator}
                      onChange={(event) =>
                        setCreateForm((state) => ({ ...state, creator: event.target.value }))
                      }
                      className="w-full rounded-[18px] border border-[#e4d8c8] bg-white px-4 py-3 text-base text-[#1f2937] outline-none transition focus:border-[#ff7a45]"
                    />
                  </label>
                  <label className="block">
                    <div className="mb-2 text-sm font-medium text-arena-dark">{t.modal.symbol}</div>
                    <input
                      value={createForm.symbol}
                      onChange={(event) =>
                        setCreateForm((state) => ({ ...state, symbol: event.target.value.toUpperCase() }))
                      }
                      className="w-full rounded-[18px] border border-[#e4d8c8] bg-white px-4 py-3 text-base text-[#1f2937] outline-none transition focus:border-[#ff7a45]"
                    />
                  </label>
                  <label className="block">
                    <div className="mb-2 text-sm font-medium text-arena-dark">{t.modal.timeframe}</div>
                    <input
                      value={createForm.timeframe}
                      onChange={(event) =>
                        setCreateForm((state) => ({ ...state, timeframe: event.target.value }))
                      }
                      className="w-full rounded-[18px] border border-[#e4d8c8] bg-white px-4 py-3 text-base text-[#1f2937] outline-none transition focus:border-[#ff7a45]"
                    />
                  </label>
                  <label className="block">
                    <div className="mb-2 text-sm font-medium text-arena-dark">{t.modal.direction}</div>
                    <select
                      value={createForm.direction}
                      onChange={(event) =>
                        setCreateForm((state) => ({
                          ...state,
                          direction: event.target.value as ArenaSubmissionDirection,
                        }))
                      }
                      className="w-full rounded-[18px] border border-[#e4d8c8] bg-white px-4 py-3 text-base text-[#1f2937] outline-none transition focus:border-[#ff7a45]"
                    >
                      <option value="long">{locale === "zh" ? "做多" : "Long"}</option>
                      <option value="short">{locale === "zh" ? "做空" : "Short"}</option>
                      <option value="both">{locale === "zh" ? "双向" : "Two-way"}</option>
                    </select>
                  </label>
                  <label className="block">
                    <div className="mb-2 text-sm font-medium text-arena-dark">{t.modal.leverage}</div>
                    <select
                      value={createForm.leveragePreference}
                      onChange={(event) =>
                        setCreateForm((state) => ({
                          ...state,
                          leveragePreference: event.target.value as ArenaSubmissionLeverage,
                        }))
                      }
                      className="w-full rounded-[18px] border border-[#e4d8c8] bg-white px-4 py-3 text-base text-[#1f2937] outline-none transition focus:border-[#ff7a45]"
                    >
                      <option value="conservative">{locale === "zh" ? "保守" : "Conservative"}</option>
                      <option value="balanced">{locale === "zh" ? "平衡" : "Balanced"}</option>
                      <option value="aggressive">{locale === "zh" ? "激进" : "Aggressive"}</option>
                    </select>
                  </label>
                  <label className="block md:col-span-2">
                    <div className="mb-2 text-sm font-medium text-arena-dark">{t.modal.strategy}</div>
                    <textarea
                      value={createForm.strategyBrief}
                      onChange={(event) =>
                        setCreateForm((state) => ({ ...state, strategyBrief: event.target.value }))
                      }
                      rows={4}
                      className="w-full rounded-[18px] border border-[#e4d8c8] bg-white px-4 py-3 text-base text-[#1f2937] outline-none transition focus:border-[#ff7a45]"
                      placeholder={
                        locale === "zh"
                          ? "写清楚入场、离场、失效条件、仓位和风控。"
                          : "Describe entry, exit, invalidation, position sizing, and risk controls."
                      }
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <div className="mb-2 text-sm font-medium text-arena-dark">{t.modal.persona}</div>
                    <textarea
                      value={createForm.persona}
                      onChange={(event) =>
                        setCreateForm((state) => ({ ...state, persona: event.target.value }))
                      }
                      rows={3}
                      className="w-full rounded-[18px] border border-[#e4d8c8] bg-white px-4 py-3 text-base text-[#1f2937] outline-none transition focus:border-[#ff7a45]"
                      placeholder={
                        locale === "zh"
                          ? "可选。留空时系统会自动生成一版操盘手 persona。"
                          : "Optional. Leave empty to auto-generate an operator persona."
                      }
                    />
                  </label>
                  <label className="inline-flex items-center gap-3 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={createForm.weeklyEvolution}
                      onChange={(event) =>
                        setCreateForm((state) => ({
                          ...state,
                          weeklyEvolution: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-[#d7c7b4]"
                    />
                    <span className="text-sm text-arena-text-secondary">{t.modal.weeklyEvolution}</span>
                  </label>
                </div>
                {createError ? (
                  <div className="mt-4 rounded-[18px] border border-[#f2c8c8] bg-[#fff3f3] px-4 py-3 text-sm text-[#b94a48]">
                    {createError}
                  </div>
                ) : null}
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
              ) : createStep === 2 ? (
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
                    onClick={openChatForCreateFlow}
                    className="rounded-full bg-destructive px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600"
                  >
                    {t.modal.openChat}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateStep(3)}
                    className="rounded-full bg-arena-dark px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-700"
                  >
                    {t.modal.continue}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCreateStep(2)}
                    className="rounded-full border border-arena-no-agents-border bg-arena-locale-switch-bg px-5 py-3 text-sm font-medium text-arena-text-secondary transition-colors duration-200 hover:bg-gray-100"
                  >
                    {t.modal.back}
                  </button>
                  <button
                    type="button"
                    onClick={handleRegisterAgent}
                    disabled={isSubmittingCreate}
                    className="rounded-full bg-[#ff7a45] px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#f16831] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmittingCreate ? t.modal.submitting : t.modal.confirm}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {manageOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(13,18,29,0.56)] p-6 backdrop-blur-[6px]">
          <div className="w-full max-w-[720px] rounded-[32px] border border-[#eadfce] bg-[#fff8ef] p-7 shadow-[0_36px_100px_rgba(12,18,28,0.32)]">
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
              {privateAgents.length ? (
                privateAgents.map((agent, index) => (
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
                        disabled={busyAgentId === agent.id}
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
