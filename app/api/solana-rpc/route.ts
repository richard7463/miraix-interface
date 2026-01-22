import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

export async function POST(req: NextRequest) {
  try {
    const { method, params } = await req.json();
    
    // Use proxy for external requests
    const response = await fetch('https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add proxy configuration
      agent: new HttpsProxyAgent('http://localhost:7890'),
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params
      }),
    }) as any;

    const data = await response.json() as any;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
