import { NextRequest, NextResponse } from "next/server";
import { fetchMemeRotationDeskOrderStatus } from "@/lib/memeRotationDesk/server/engine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId || "").trim();

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const result = await fetchMemeRotationDeskOrderStatus(orderId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch meme rotation desk order status" },
      { status: 500 },
    );
  }
}
