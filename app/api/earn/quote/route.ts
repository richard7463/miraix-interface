import { NextRequest, NextResponse } from 'next/server'
import { EARN_USDC_BY_CHAIN } from '@/lib/earn'

const LI_QUEST_BASE = 'https://li.quest/v1'
const FETCH_TIMEOUT_MS = 12000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      chainId,
      vaultAddress,
      walletAddress,
      fromAmount,
      fromTokenAddress,
      slippage,
    } = body || {}

    if (!chainId || !vaultAddress || !walletAddress || !fromAmount) {
      return NextResponse.json(
        {
          success: false,
          error: 'chainId, vaultAddress, walletAddress, and fromAmount are required',
        },
        { status: 400 },
      )
    }

    const defaultUsdc = EARN_USDC_BY_CHAIN[Number(chainId)]
    if (!defaultUsdc && !fromTokenAddress) {
      return NextResponse.json(
        {
          success: false,
          error: `No default USDC token is configured for chain ${chainId}`,
        },
        { status: 400 },
      )
    }

    const params = new URLSearchParams({
      fromChain: String(chainId),
      toChain: String(chainId),
      fromToken: fromTokenAddress || defaultUsdc.address,
      toToken: String(vaultAddress),
      fromAddress: String(walletAddress),
      toAddress: String(walletAddress),
      fromAmount: String(fromAmount),
      ...(slippage ? { slippage: String(slippage) } : {}),
    })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(`${LI_QUEST_BASE}/quote?${params}`, {
        cache: 'no-store',
        signal: controller.signal,
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error: payload?.message || payload?.error || `Composer quote failed with ${response.status}`,
            details: payload,
          },
          { status: response.status },
        )
      }

      return NextResponse.json({
        success: true,
        quote: payload,
      })
    } finally {
      clearTimeout(timer)
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Composer quote',
      },
      { status: 500 },
    )
  }
}
