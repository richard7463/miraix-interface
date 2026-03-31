import { NextRequest, NextResponse } from 'next/server';

const SOL_PRICE_API_URL = 'https://sol-wallet-theta.vercel.app/api/sol-price';

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(SOL_PRICE_API_URL);

    if (!response.ok) {
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
