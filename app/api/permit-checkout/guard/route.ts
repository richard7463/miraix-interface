import { NextResponse } from "next/server";
import { runPermitCheckoutGuard } from "@/lib/permitCheckoutDemoStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const permitId = typeof body?.permitId === "string" ? body.permitId : "";

    if (!permitId) {
      return NextResponse.json({ error: "permitId is required." }, { status: 400 });
    }

    return NextResponse.json(runPermitCheckoutGuard(permitId));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to run guard." },
      { status: 500 },
    );
  }
}
