import { NextResponse } from "next/server";
import { getArenaAgent } from "@/lib/agentArena";
import {
  followAgent,
  isFollowingAgent,
  unfollowAgent,
} from "@/lib/agentArenaFollowStore";
import { getStoredArenaAgent } from "@/lib/agentArenaStore";

async function assertAgentExists(agentId: string) {
  const stored = await getStoredArenaAgent(agentId);
  if (stored) return true;
  return Boolean(getArenaAgent(agentId));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await context.params;
  const exists = await assertAgentExists(agentId);
  if (!exists) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    following: await isFollowingAgent(agentId),
  });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await context.params;
  const exists = await assertAgentExists(agentId);
  if (!exists) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await followAgent(agentId);
  return NextResponse.json({
    ok: true,
    following: true,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await context.params;
  const exists = await assertAgentExists(agentId);
  if (!exists) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await unfollowAgent(agentId);
  return NextResponse.json({
    ok: true,
    following: false,
  });
}
