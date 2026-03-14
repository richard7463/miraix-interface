import { NextRequest, NextResponse } from 'next/server'
import { LANGGRAPH_API_BASE } from '@/lib/config'

const PAYMENT_HEADERS = [
  'PAYMENT-REQUIRED',
  'PAYMENT-RESPONSE',
  'PAYMENT-SIGNATURE',
  'payment-required',
  'payment-response',
  'payment-signature'
]

const getBackendBase = () => {
  if (process.env.NEXT_PUBLIC_LANGGRAPH_API_BASE) {
    return process.env.NEXT_PUBLIC_LANGGRAPH_API_BASE
  }

  return process.env.NODE_ENV === 'production' ? LANGGRAPH_API_BASE : 'http://localhost:3009'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers = new Headers({
      'Content-Type': 'application/json'
    })

    const incomingPaymentSignature =
      request.headers.get('payment-signature') || request.headers.get('PAYMENT-SIGNATURE')

    console.log('[FOMO Premium Proxy] Incoming request:', {
      hasPaymentSignature: Boolean(incomingPaymentSignature),
      paymentSignatureLength: incomingPaymentSignature?.length || 0,
      hasPaymentResponse: Boolean(
        request.headers.get('payment-response') || request.headers.get('PAYMENT-RESPONSE')
      )
    })

    for (const headerName of PAYMENT_HEADERS) {
      const value = request.headers.get(headerName)
      if (value) {
        headers.set(headerName, value)
      }
    }

    const response = await fetch(`${getBackendBase()}/api/premium/fomo-plan`, {
      method: 'POST',
      headers,
      body
    })

    const payload = await response.text()
    const responseHeaders = new Headers({
      'Content-Type': response.headers.get('content-type') || 'application/json'
    })

    const outgoingPaymentRequired =
      response.headers.get('payment-required') || response.headers.get('PAYMENT-REQUIRED')
    const outgoingPaymentResponse =
      response.headers.get('payment-response') || response.headers.get('PAYMENT-RESPONSE')

    console.log('[FOMO Premium Proxy] Backend response:', {
      status: response.status,
      hasPaymentRequired: Boolean(outgoingPaymentRequired),
      hasPaymentResponse: Boolean(outgoingPaymentResponse)
    })

    for (const headerName of PAYMENT_HEADERS) {
      const value = response.headers.get(headerName)
      if (value) {
        responseHeaders.set(headerName, value)
      }
    }

    return new NextResponse(payload, {
      status: response.status,
      headers: responseHeaders
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Premium FOMO proxy failed'
      },
      { status: 500 }
    )
  }
}
