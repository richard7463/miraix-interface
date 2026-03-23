import { NextResponse } from "next/server";
import {
  getArenaAgents,
  seedWatchItems,
  withArenaLiveState,
} from "@/lib/agentArena";
import { applyFollowState, listFollowedAgentIds } from "@/lib/agentArenaFollowStore";
import { listStoredArenaAgents } from "@/lib/agentArenaStore";
import {
  ensureArenaDemoRunner,
  getArenaAgentWithRuntime,
  runArenaRunnerCycleOnce,
} from "@/lib/agentArenaRunner";
import { maybeProxyArenaRequest } from "@/lib/agentArenaRemote";
import {
  buildArenaIntegrationState,
  fetchLiveMarketContext,
} from "@/lib/okxAgentTradeKit";

export async function GET(request: Request) {
  const proxied = await maybeProxyArenaRequest(request);
  if (proxied) return proxied;

  ensureArenaDemoRunner();

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const normalizedMode = mode === "live" || mode === "hell" ? mode : undefined;
  const seededAgents = getArenaAgents(normalizedMode);
  const storedEntries = await listStoredArenaAgents();
  const followingIds = await listFollowedAgentIds();
  await runArenaRunnerCycleOnce();

  const runtimeAgentIds = [
    ...storedEntries.map((entry) => entry.agent.id),
    ...seededAgents
      .filter((agent) => !storedEntries.some((entry) => entry.agent.id === agent.id))
      .map((agent) => agent.id),
  ];

  const allAgents = (
    await Promise.all(runtimeAgentIds.map((agentId) => getArenaAgentWithRuntime(agentId)))
  )
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => item.agent)
    .filter((agent) => (normalizedMode ? agent.mode === normalizedMode : true));

  const marketResults = await Promise.all(
    allAgents.map(async (agent) => {
      const result = await fetchLiveMarketContext(agent.symbol);
      return {
        agentId: agent.id,
        result,
      };
    }),
  );

  const mergedAgents = allAgents.map((agent) => {
    const matched = marketResults.find((item) => item.agentId === agent.id)?.result;
    if (!matched || matched.integration.status !== "live") {
      return applyFollowState(agent, followingIds);
    }

    return applyFollowState(
      withArenaLiveState(agent, {
        market: matched.market,
      }),
      followingIds,
    );
  });

  const marketIntegration =
    marketResults.find((item) => item.result.integration.status === "live")?.result.integration ?? {
      status: "fallback" as const,
      note: "Market fallback active.",
    };

  return NextResponse.json({
    mode: normalizedMode ?? "all",
    leaderboard: mergedAgents,
    watchlist: seedWatchItems,
    summary: {
      mode: normalizedMode ?? "all",
      count: mergedAgents.length,
      averageRoi: Number(
        (
          mergedAgents.reduce((sum, agent) => sum + agent.roi, 0) /
          Math.max(mergedAgents.length, 1)
        ).toFixed(2),
      ),
      averageDrawdown: Number(
        (
          mergedAgents.reduce((sum, agent) => sum + agent.portfolio.maxDrawdownPct, 0) /
          Math.max(mergedAgents.length, 1)
        ).toFixed(2),
      ),
      averageStability: Number(
        (
          mergedAgents.reduce((sum, agent) => sum + agent.scorecard.stabilityScore, 0) /
          Math.max(mergedAgents.length, 1)
        ).toFixed(2),
      ),
      averageRiskAdjusted: Number(
        (
          mergedAgents.reduce((sum, agent) => sum + agent.scorecard.riskAdjustedReturn, 0) /
          Math.max(mergedAgents.length, 1)
        ).toFixed(2),
      ),
      source: mergedAgents.some((agent) => agent.leaderboardSource === "demo-run")
        ? "demo-run"
        : "simulation",
      label:
        "Unified arena board combining official and submitted agents through the shared demo runner.",
    },
    integration: buildArenaIntegrationState(marketIntegration, {
      status: process.env.OKX_API_KEY ? "fallback" : "credentials-required",
      note: process.env.OKX_API_KEY
        ? "Portfolio wiring is enabled but only loaded on the Results page."
        : "Add OKX private credentials to unlock portfolio snapshots on Results pages.",
    }),
  });
}
