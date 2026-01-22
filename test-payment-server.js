// Test payment verification with Express
const express = require('express');
const app = express();
app.use(express.json());

app.post('/test-payment', (req, res) => {
  console.log('🧪 Test payment endpoint called');
  
  // Check for payment completion headers
  const paymentTransaction = req.headers['x-payment-transaction'] || 
                            req.headers['X-PAYMENT-TRANSACTION'];
  const paymentAmount = req.headers['x-payment-amount'] || 
                        req.headers['X-PAYMENT-AMOUNT'];
  const paymentAsset = req.headers['x-payment-asset'] || 
                       req.headers['X-PAYMENT-ASSET'];
  const paymentStatus = req.headers['x-payment-status'] || 
                       req.headers['X-PAYMENT-STATUS'];

  console.log('🔍 Payment headers:', {
    paymentTransaction,
    paymentAmount,
    paymentAsset,
    paymentStatus,
    allHeaders: Object.keys(req.headers).filter(h => h.toLowerCase().includes('payment'))
  });

  if (paymentTransaction && paymentStatus === 'completed') {
    console.log('✅ Payment verified!');
    
    // Return success for paid requests
    return res.json({
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
  return res.status(402).json({
    success: false,
    error: 'Payment required',
    requiresPayment: true,
    paymentDetails: {
      amount: '0.1 USDC',
      network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      payTo: '2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4'
    }
  });
});

app.listen(3011, () => {
  console.log('Test payment server running on port 3011');
});
