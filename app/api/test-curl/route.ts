import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url, data } = await req.json();
    
    // Use Node.js fetch to make the request
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Get all headers
    const headers: any = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const body = await response.text();
    
    return NextResponse.json({
      success: true,
      status: response.status,
      headers,
      'payment-required': headers['payment-required'] || headers['PAYMENT-REQUIRED'],
      body: body.substring(0, 500)
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
