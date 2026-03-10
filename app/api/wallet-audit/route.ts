import { NextRequest, NextResponse } from 'next/server'
import { LANGGRAPH_API_BASE } from '@/lib/config'

const getBackendBase = () => {
  if (process.env.NEXT_PUBLIC_LANGGRAPH_API_BASE) {
    return process.env.NEXT_PUBLIC_LANGGRAPH_API_BASE
  }

  return process.env.NODE_ENV === 'production' ? LANGGRAPH_API_BASE : 'http://localhost:3009'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const response = await fetch(`${getBackendBase()}/api/wallet-audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body
    })

    const payload = await response.text()
    return new NextResponse(payload, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json'
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Wallet audit proxy failed'
      },
      { status: 500 }
    )
  }
}
