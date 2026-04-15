import { NextResponse } from "next/server";
import { createPermitCheckoutRun, consumePermitCheckoutPayment } from "@/lib/permitCheckoutDemoStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const strategyId = typeof body?.strategyId === "string" ? body.strategyId : "";
    const checkoutToken = typeof body?.paymentToken === "string" ? body.paymentToken : "";

    if (!strategyId) {
      return NextResponse.json({ error: "strategyId is required." }, { status: 400 });
    }

    if (!checkoutToken) {
      return NextResponse.json(
        { error: "paymentToken is required. Complete x402 checkout first." },
        { status: 402 },
      );
    }

    const payment = consumePermitCheckoutPayment(strategyId, checkoutToken);
    return NextResponse.json(createPermitCheckoutRun(strategyId, payment));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create permit." },
      { status: 500 },
    );
  }
}
