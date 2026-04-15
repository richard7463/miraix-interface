import { NextResponse } from "next/server";
import { getPermitCheckoutState } from "@/lib/permitCheckoutDemoStore";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getPermitCheckoutState());
}
