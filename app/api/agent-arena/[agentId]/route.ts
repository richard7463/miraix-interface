import { NextResponse } from "next/server";
import { getArenaAgent, withArenaLiveState } from "@/lib/agentArena";
import { applyFollowState, listFollowedAgentIds } from "@/lib/agentArenaFollowStore";
import { getDemoCopyTradeSummary } from "@/lib/agentArenaCopyStore";
import { listOkxFollowerProfileViews } from "@/lib/okxFollowerProfiles";
import { deleteStoredArenaAgent, getStoredArenaAgent } from "@/lib/agentArenaStore";
import {
  ensureArenaDemoRunner,
  getArenaAgentWithRuntime,
  getSubmittedAgentWithRuntime,
  runArenaRunnerCycleOnce,
} from "@/lib/agentArenaRunner";
import { listPerformanceCurve } from "@/lib/agentArenaRuntimeStore";
import {
  buildArenaIntegrationState,
  fetchLiveMarketContext,
  fetchMarketHistory,
} from "@/lib/okxAgentTradeKit";

export async function GET(
  _request: Request,
  context: { params: Promise<{ agentId: string }> },
) {
  ensureArenaDemoRunner();

  const { agentId } = await context.params;
  const storedAgent = await getStoredArenaAgent(agentId);
  const seededAgent = storedAgent?.agent ?? getArenaAgent(agentId);
  const followingIds = await listFollowedAgentIds();

  if (!seededAgent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (storedAgent) {
    await runArenaRunnerCycleOnce();
    const [{ agent: runtimeAgent, runtime }, marketResult, marketHistory] =
      await Promise.all([
        getSubmittedAgentWithRuntime(storedAgent),
        fetchLiveMarketContext(storedAgent.agent.symbol),
        fetchMarketHistory(storedAgent.agent.symbol, "1D", 30),
      ]);
    const copyTrade = await getDemoCopyTradeSummary(storedAgent.agent.id);

    const agent =
      marketResult.integration.status === "live"
        ? applyFollowState(
            withArenaLiveState(runtimeAgent, {
              market: marketResult.market,
            }),
            followingIds,
          )
        : applyFollowState(runtimeAgent, followingIds);

    const runnerReady = runtime.snapshots.length > 0 || runtime.totalOrders > 0 || runtime.totalFills > 0;
    const execution = {
      source: "fallback" as const,
      demoMode: true,
      note: runnerReady
        ? "Execution evidence is being reconstructed from the shared demo runner ledger for this agent."
        : "The shared demo runner is registered for this agent, but it has not produced a persisted order trail yet.",
      activeOrders: runtime.activeOrderIds.length,
      recentOrders: [],
      recentFills: [],
    };

    return NextResponse.json({
      agent,
      history: marketHistory.points,
      performanceHistory: listPerformanceCurve(runtime),
      execution,
      runtime,
      copyTrade,
      copyProfiles: listOkxFollowerProfileViews(),
      submission: storedAgent.submission,
      integration: buildArenaIntegrationState(
        marketResult.integration.status === "live"
          ? marketResult.integration
          : {
              status: "fallback",
              note: marketResult.integration.note,
            },
        {
          status: runnerReady ? "live" : "fallback",
          note: runnerReady
            ? "Runner-backed demo account metrics are being derived from persisted OKX demo orders, fills, and equity snapshots."
            : "The demo runner is registered, but it has not produced a persisted snapshot yet.",
          updatedAt: runtime.updatedAt,
        },
      ),
    });
  }

  await runArenaRunnerCycleOnce();
  const runtimeEntry = await getArenaAgentWithRuntime(agentId);
  if (!runtimeEntry) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const { agent: runtimeAgent, runtime } = runtimeEntry;
  const marketResult = await fetchLiveMarketContext(runtimeAgent.symbol);
  const history = await fetchMarketHistory(runtimeAgent.symbol, "1D", 30);
  const agent = applyFollowState(
    marketResult.integration.status === "live"
      ? withArenaLiveState(runtimeAgent, {
          market: marketResult.market,
        })
      : runtimeAgent,
    followingIds,
  );
  const runnerReady = runtime.snapshots.length > 0 || runtime.totalOrders > 0 || runtime.totalFills > 0;
  const execution = {
    source: "fallback" as const,
    demoMode: true,
    note: runnerReady
      ? "Execution evidence is being reconstructed from the shared demo runner ledger for this agent."
      : "The shared demo runner is registered for this agent, but it has not produced a persisted order trail yet.",
    activeOrders: runtime.activeOrderIds.length,
    recentOrders: [],
    recentFills: [],
  };

  return NextResponse.json({
    agent,
    history: history.points,
    performanceHistory: listPerformanceCurve(runtime),
    execution,
    runtime,
    copyTrade: null,
    copyProfiles: listOkxFollowerProfileViews(),
    submission: null,
    integration: buildArenaIntegrationState(
      marketResult.integration.status === "live"
        ? marketResult.integration
        : {
            status: "fallback",
            note: marketResult.integration.note,
          },
      {
        status: runnerReady ? "live" : "fallback",
        note: runnerReady
          ? "Runner-backed demo account metrics are being derived from the shared Arena runtime snapshots for this official agent."
          : "This official agent is registered in the shared demo runner, but it has not produced a persisted runtime snapshot yet.",
        updatedAt: runtime.updatedAt,
      },
    ),
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await context.params;
  const deleted = await deleteStoredArenaAgent(agentId);

  return NextResponse.json({
    ok: deleted,
    deleted,
  });
}
