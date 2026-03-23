import { NextResponse } from "next/server";
import { runStoredArenaReview } from "@/lib/agentArenaStore";

export async function POST(
  _request: Request,
  context: { params: Promise<{ agentId: string }> },
) {
  try {
    const { agentId } = await context.params;
    const stored = await runStoredArenaReview(agentId);
    return NextResponse.json({
      ok: true,
      agent: stored.agent,
      runtime: stored.runtime,
      submission: stored.submission,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to run backtest review.",
      },
      { status: 400 },
    );
  }
}
