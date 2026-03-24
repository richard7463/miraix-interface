import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

export const runtime = "nodejs";

const JUP_SWAP_ENDPOINT = "https://api.jup.ag/swap/v1/swap";
const JUP_API_KEY = process.env.JUP_API_KEY || process.env.JUP_LITE_API_KEY || "";

function resolveAgent() {
  const proxyUrl =
    process.env.HTTPS_PROXY ||
    process.env.ALL_PROXY ||
    (process.env.NODE_ENV === "development" ? "http://127.0.0.1:7890" : undefined);

  return proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userPublicKey = String(body?.userPublicKey || "").trim();
    const quoteResponse = body?.quoteResponse;

    if (!userPublicKey || !quoteResponse) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing userPublicKey or quoteResponse",
        },
        { status: 400 },
      );
    }

    const response = (await fetch(JUP_SWAP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(JUP_API_KEY ? { "x-api-key": JUP_API_KEY } : {}),
      },
      agent: resolveAgent(),
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
      }),
    } as any)) as any;

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: text || `Jupiter swap request failed: ${response.status}`,
        },
        { status: 400 },
      );
    }

    const payload = JSON.parse(text) as { swapTransaction?: string };

    return NextResponse.json({
      ok: true,
      swapTransaction: payload.swapTransaction,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to prepare swap transaction",
      },
      { status: 500 },
    );
  }
}
