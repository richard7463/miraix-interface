import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const RPC_ENDPOINTS = [
  process.env.SOLANA_RPC_URL,
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
].filter(Boolean) as string[];

export async function POST(req: NextRequest) {
  try {
    const { method, params } = await req.json();

    let lastError: string | null = null;

    for (const endpoint of RPC_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          agent: new HttpsProxyAgent(process.env.HTTPS_PROXY || 'http://127.0.0.1:7890'),
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method,
            params,
          }),
        }) as any;

        const text = await response.text();

        if (!response.ok) {
          lastError = `${response.status}: ${text}`;
          continue;
        }

        const data = JSON.parse(text) as any;
        return NextResponse.json(data);
      } catch (error: any) {
        lastError = error?.message || 'Unknown Solana RPC error';
      }
    }

    return NextResponse.json({
      error: lastError || 'All Solana RPC endpoints failed',
    }, { status: 502 });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
