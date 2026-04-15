import { NextResponse } from "next/server";
import { storePermitCheckoutReceipt } from "@/lib/permitCheckoutDemoStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const permitId = typeof body?.permitId === "string" ? body.permitId : "";
    const mode =
      body?.mode === "executed" || body?.mode === "resized" || body?.mode === "blocked"
        ? body.mode
        : undefined;

    if (!permitId) {
      return NextResponse.json({ error: "permitId is required." }, { status: 400 });
    }

    return NextResponse.json(storePermitCheckoutReceipt(permitId, mode));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to store receipt." },
      { status: 500 },
    );
  }
}
