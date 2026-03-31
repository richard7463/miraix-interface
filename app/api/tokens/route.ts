import { NextRequest, NextResponse } from 'next/server';

const TOKEN_API_URL = 'https://sol-wallet-theta.vercel.app/api/tokens';

export async function GET(req: NextRequest) {
  try {
    const walletAddress = req.nextUrl.searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
    }

    const response = await fetch(`${TOKEN_API_URL}?walletAddress=${walletAddress}`);

    if (!response.ok) {
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
