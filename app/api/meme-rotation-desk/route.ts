import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { buildMemeRotationDesk } from "@/lib/memeRotationDesk/server/engine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const walletAddress = String(body?.walletAddress || "").trim();

    if (walletAddress) {
      try {
        new PublicKey(walletAddress);
      } catch {
        return NextResponse.json({ error: "Invalid Solana wallet address" }, { status: 400 });
      }
    }

    const result = await buildMemeRotationDesk({
      walletAddress,
      budgetUsd: Number(body?.budgetUsd),
      riskMode: body?.riskMode,
      strategy: body?.strategy,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate meme rotation desk" },
      { status: 500 },
    );
  }
}
