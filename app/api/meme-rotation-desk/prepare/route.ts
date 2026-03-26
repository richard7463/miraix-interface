import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { prepareMemeRotationDeskOrder } from "@/lib/memeRotationDesk/server/engine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const walletAddress = String(body?.walletAddress || "").trim();
    const outputContract = String(body?.outputContract || "").trim();
    const market = String(body?.market || "").trim();
    const amountUsd = Number(body?.amountUsd);
    const mode = body?.mode === "swap" ? "swap" : "order";
    const outputSymbol = String(body?.outputSymbol || "").trim();

    if (!walletAddress || !outputContract || !market || !Number.isFinite(amountUsd)) {
      return NextResponse.json(
        { error: "walletAddress, outputContract, market, and amountUsd are required" },
        { status: 400 },
      );
    }

    try {
      new PublicKey(walletAddress);
      new PublicKey(outputContract);
    } catch {
      return NextResponse.json({ error: "Invalid Solana public key" }, { status: 400 });
    }

    const result = await prepareMemeRotationDeskOrder({
      walletAddress,
      outputContract,
      market,
      amountUsd,
      mode,
      outputSymbol,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to prepare meme rotation desk order" },
      { status: 500 },
    );
  }
}
