import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, walletAddress } = await req.json();
    
    // Use Node.js fetch to make the request to backend
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('http://localhost:3010/api/chat-new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        walletAddress,
      }),
    });

    // Get all headers
    const headers: any = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const body = await response.text();
    
    // Check if payment is required
    const paymentRequired = headers['payment-required'] || headers['PAYMENT-REQUIRED'];
    
    if (response.status === 402 && paymentRequired) {
      // Decode payment requirements
      let decoded;
      try {
        decoded = Buffer.from(paymentRequired, 'base64').toString('utf8');
        const paymentDetails = JSON.parse(decoded);
        
        return NextResponse.json({
          success: false,
          error: 'Payment required',
          requiresPayment: true,
          paymentDetails: {
            ...paymentDetails,
            displayAmount: `${parseInt(paymentDetails.accepts[0].amount) / 100000} USDC`
          }
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Failed to parse payment requirements'
        }, { status: 500 });
      }
    }

    // If not 402 or no payment required, return the response
    return NextResponse.json({
      success: true,
      data: JSON.parse(body),
      status: response.status
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
