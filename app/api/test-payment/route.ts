import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🧪 Test payment endpoint called');
  
  // Check for payment completion headers (handle both cases)
  const paymentTransaction = req.headers['x-payment-transaction'] || 
                            req.headers['X-PAYMENT-TRANSACTION'];
  const paymentAmount = req.headers['x-payment-amount'] || 
                        req.headers['X-PAYMENT-AMOUNT'];
  const paymentAsset = req.headers['x-payment-asset'] || 
                       req.headers['X-PAYMENT-ASSET'];
  const paymentStatus = req.headers['x-payment-status'] || 
                       req.headers['X-PAYMENT-STATUS'];

  console.log('🧪 Headers:', {
    paymentTransaction,
    paymentAmount,
    paymentAsset,
    paymentStatus,
    hasTransaction: !!paymentTransaction,
    hasCompletedStatus: paymentStatus === 'completed'
  });

  if (paymentTransaction && paymentStatus === 'completed') {
    console.log('✅ Payment verified!');
    
    // Return success for paid requests
    return NextResponse.json({
      success: true,
      message: `Payment verified! Processing test request`,
      data: {
        message: `Payment verified and processed: test request`,
        paymentVerified: true,
        transaction: paymentTransaction
      }
    });
  }

  // Return 402 for unpaid requests
  return NextResponse.json({
    success: false,
    error: 'Payment required',
    requiresPayment: true,
    paymentDetails: {
      amount: '0.1 USDC',
      network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      payTo: '2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4'
    }
  }, { status: 402 });
}
