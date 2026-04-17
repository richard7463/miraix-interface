import { NextResponse } from "next/server";
import { executePermitWithAgenticWallet } from "@/lib/permitCheckoutLiveExecution";
import {
  getActivePermitCheckoutRun,
  storePermitCheckoutLiveReceipt,
} from "@/lib/permitCheckoutDemoStore";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const permitId = typeof body?.permitId === "string" ? body.permitId : "";

    if (!permitId) {
      return NextResponse.json({ error: "permitId is required." }, { status: 400 });
    }

    const run = getActivePermitCheckoutRun(permitId);
    if (!run) {
      return NextResponse.json({ error: "No active permit run was found." }, { status: 404 });
    }

    const execution = await executePermitWithAgenticWallet(run);
    return NextResponse.json(storePermitCheckoutLiveReceipt(permitId, execution));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Live Agentic Wallet execution failed.",
      },
      { status: 500 },
    );
  }
}
