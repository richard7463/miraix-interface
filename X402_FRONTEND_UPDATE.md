# X402 Merchant Payment - Frontend Integration

## Changes Made

Updated `/components/Chat/ChatIdConversation.tsx` to support the new X402 merchant payment flow.

## What Changed

### 1. Added New useEffect for Merchant Payment Flow

Added a new `useEffect` hook (after line 291) that handles the `waitingForMerchantPayment` phase:

```typescript
useEffect(() => {
  const handleMerchantPayment = async () => {
    // Find messages with waitingForMerchantPayment phase
    const merchantPaymentMessage = messages.find(msg =>
      msg.responseData?.enableX402Payment === true &&
      msg.responseData?.phase === 'waitingForMerchantPayment' &&
      msg.responseData?.paymentRequest &&
      msg.id &&
      !processedX402TransactionsRef.current.has(msg.id)
    );

    // Step 1: Pay via PayAI Facilitator
    const facilitatorResponse = await fetch('https://facilitator.payai.network/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        network: 'solana',
        to: paymentRequest.merchantAddress,
        amount: paymentRequest.amount,
        tokenMint: paymentRequest.tokenMint,
        from: embeddedWallet.address
      })
    });

    // Step 2: Verify payment (poll backend)
    const verifyResponse = await fetch('http://localhost:3000/api/x402/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId })
    });

    // Step 3: Execute swap after payment
    const executeResponse = await fetch('http://localhost:3000/api/x402/execute-after-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId,
        threadId: chatId,
        message,
        walletAddress,
        mintPubkey
      })
    });
  };

  handleMerchantPayment();
}, [messages, solanaWallets, chatId]);
```

## Flow

1. **Backend returns `waitingForMerchantPayment` phase**
   - Backend generates payment request info
   - Returns to frontend with `phase: "waitingForMerchantPayment"`

2. **Frontend detects the phase**
   - New useEffect finds messages with `waitingForMerchantPayment` phase
   - Prevents duplicate processing using `processedX402TransactionsRef`

3. **Step 1: Pay via PayAI Facilitator**
   - Frontend calls `https://facilitator.payai.network/settle`
   - User pays tokens to merchant wallet
   - Facilitator covers gas fees

4. **Step 2: Verify payment**
   - Frontend polls backend `/api/x402/verify-payment`
   - Backend checks merchant wallet balance
   - Waits up to 2 minutes (60 attempts × 2 seconds)

5. **Step 3: Execute swap**
   - Frontend calls `/api/x402/execute-after-payment`
   - Backend executes swap with merchant funds
   - Returns transaction signature

6. **Success**
   - Display success message in chat
   - Show transaction signature to user

## User Experience

When a user requests a swap with X402 enabled:

```
User: "swap 0.1 usdc to sol"

AI: "Please pay 100000 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
     to merchant wallet FVgksecmg4ydgpGZ6X8GRLSWMtc7FrAV8AVrCiwJ9QaZ
     via PayAI Facilitator..."

[Frontend automatically handles payment]

Toast: "Processing payment via PayAI Facilitator..."
Toast: "Payment completed! Verifying..."
Toast: "Payment verified! Executing swap..."
Toast: "Swap completed successfully!"

AI: "Great! Your swap has been completed successfully via X402 merchant payment.
     Transaction signature: 5xK..."
```

## Error Handling

If any step fails:

1. **Payment failed** - Shows error toast, allows retry
2. **Verification timeout** - Shows error toast after 2 minutes
3. **Execute failed** - Shows error toast with details
4. **Retry mechanism** - Removes message from processed set, allows manual retry

## Comparison: Old vs New

### Old Flow (waitingForX402Signature)
```
User signs swap transaction → Send to X402 → X402 broadcasts
User pays gas fees directly
```

### New Flow (waitingForMerchantPayment) ✅
```
User pays merchant → Facilitator covers gas → Merchant executes swap
User pays NO gas fees (covered by facilitator)
```

## Testing

1. Enable X402 payment in settings
2. Request a swap: "swap 0.1 usdc to sol"
3. Watch console logs:
   - `[X402 Merchant] Detected merchant payment request`
   - `[X402 Merchant] Step 1/3: Paying via PayAI Facilitator...`
   - `[X402 Merchant] Payment successful`
   - `[X402 Merchant] Step 2/3: Verifying payment...`
   - `[X402 Merchant] Payment verified!`
   - `[X402 Merchant] Step 3/3: Executing swap...`
   - `[X402 Merchant] Swap completed`

4. Verify toast messages appear in correct sequence

## Configuration

Ensure backend server is running on `http://localhost:3000`:
```bash
cd /Users/yanqing/Documents/GitHub/langgraph-defai
npm start
```

## Benefits

✅ **Gasless for users** - Facilitator covers all gas fees
✅ **True X402 protocol** - Follows merchant payment model
✅ **Automatic flow** - No manual steps required by users
✅ **Error handling** - Graceful error handling with retries
✅ **User feedback** - Real-time toast notifications

## Next Steps

1. Test with real transactions on devnet first
2. Monitor payment verification logs
3. Optimize polling interval (currently 2 seconds)
4. Add payment progress indicator UI
5. Support multiple payment methods in future
