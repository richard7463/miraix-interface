import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get all headers from the incoming request
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Get the request body
    const body = await req.text();
    
    console.log('🔄 Proxying payment verification request');
    console.log('📤 Headers:', headers);
    console.log('📤 Body:', body);

    // Forward the request to the test payment server
    const response = await fetch('http://localhost:3011/test-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body,
    });

    const data = await response.json();
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
