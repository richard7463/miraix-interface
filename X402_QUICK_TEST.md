# X402 Merchant Payment - Quick Test Guide

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd /Users/yanqing/Documents/GitHub/langgraph-defai
   npm start
   ```

2. **Frontend Server Running**
   ```bash
   cd /Users/yanqing/Documents/GitHub/miraix-interface
   npm run dev
   ```

3. **Wallet Connected**
   - Connect your wallet in the frontend
   - Ensure you have USDC tokens to pay

## Test Steps

### 1. Enable X402 Payment

In the frontend settings or via code, ensure X402 payment is enabled:

```typescript
// In your code or settings
setEnableX402Payment(true)
```

### 2. Request a Swap

Type in the chat:
```
swap 0.1 usdc to sol
```

### 3. Expected Flow

#### Phase 1: Backend Response
```
AI: Please pay 100000 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
     to merchant wallet FVgksecmg4ydgpGZ6X8GRLSWMtc7FrAV8AVrCiwJ9QaZ
     via PayAI Facilitator...
```

#### Phase 2: Frontend Auto-Process

Console logs should show:
```
[X402 Merchant] Detected merchant payment request: msg_id_123
[X402 Merchant] Payment request: {
  merchantAddress: "FVgksecmg4ydgpGZ6X8GRLSWMtc7FrAV8AVrCiwJ9QaZ",
  tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  amount: "100000",
  ...
}
[X402 Merchant] Step 1/3: Paying via PayAI Facilitator...
```

Toast messages should show:
```
⏳ Processing payment via PayAI Facilitator...
```

#### Phase 3: Payment Success

Console logs:
```
[X402 Merchant] Payment successful: { ... }
[X402 Merchant] Step 2/3: Verifying payment...
```

Toast messages:
```
✅ Payment completed! Verifying...
```

#### Phase 4: Payment Verification

Console logs (polling):
```
[X402 Merchant] Payment verified!
```

Toast messages:
```
✅ Payment verified! Executing swap...
```

#### Phase 5: Swap Execution

Console logs:
```
[X402 Merchant] Step 3/3: Executing swap...
[X402 Merchant] Swap completed: { ... }
```

Toast messages:
```
✅ Swap completed successfully!
```

Final AI message:
```
AI: Great! Your swap has been completed successfully via X402
     merchant payment. Transaction signature: 5xK...
```

## Verification

### Check Transaction on Solana Explorer

1. Copy the transaction signature from the AI message
2. Go to https://explorer.solana.com/
3. Paste the signature and search
4. Verify:
   - Transaction is confirmed
   - Your wallet received the swapped tokens
   - Transaction has 2 signers (you + merchant)

### Check Wallet Balance

1. Open your wallet extension
2. Verify USDC was deducted from your wallet
3. Verify SOL was added to your wallet

## Troubleshooting

### Issue: No frontend auto-processing

**Check:**
- Browser console for errors
- Network tab for failed requests
- Ensure X402 payment is enabled

**Solution:**
- Reload the page
- Check if wallet is connected
- Verify backend server is running

### Issue: Payment failed

**Check:**
- PayAI Facilitator status
- Your USDC balance
- Network connection

**Solution:**
- Ensure you have enough USDC
- Check PayAI Facilitator is accessible
- Try with a smaller amount

### Issue: Verification timeout

**Check:**
- Backend server logs
- Merchant wallet balance on Solana Explorer
- Network delays

**Solution:**
- Increase maxAttempts in code
- Check backend API is responding
- Verify payment actually went through

### Issue: Swap execution failed

**Check:**
- Backend server logs
- Jupiter API status
- Slippage settings

**Solution:**
- Try again with fresh quote
- Check if merchant has enough liquidity
- Adjust slippage tolerance

## Expected Console Output

### Backend Console
```
[X402 Merchant] 📋 Creating payment request:
  🏦 Merchant address: FVgksecmg4ydgpGZ6X8GRLSWMtc7FrAV8AVrCiwJ9QaZ
  💰 Token in: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
  💵 Amount: 100000
  👤 User wallet: your_wallet_address
  🔧 Operation: swap

[X402 Merchant] ✅ Payment info created: { paymentId, ... }
```

### Frontend Console
```
[X402 Merchant] Detected merchant payment request: msg_id
[X402 Merchant] Payment request: { ... }
[X402 Merchant] Step 1/3: Paying via PayAI Facilitator...
[X402 Merchant] Payment successful: { ... }
[X402 Merchant] Step 2/3: Verifying payment...
[X402 Merchant] Payment verified!
[X402 Merchant] Step 3/3: Executing swap...
[X402 Merchant] Swap completed: { ... }
```

## Success Criteria

✅ Payment request created successfully
✅ Payment processed via PayAI Facilitator
✅ Payment verified by backend
✅ Swap executed successfully
✅ Transaction signature returned
✅ Tokens received in wallet
✅ No gas fees paid by user

## Next Steps After Testing

1. ✅ Test on devnet with small amounts
2. ✅ Monitor payment verification times
3. ✅ Test error scenarios (insufficient balance, etc.)
4. ✅ Optimize polling intervals if needed
5. ✅ Deploy to mainnet after thorough testing

## Support

- Backend documentation: `/Users/yanqing/Documents/GitHub/langgraph-defai/X402_MERCHANT.md`
- Frontend integration: `/Users/yanqing/Documents/GitHub/miraix-interface/X402_FRONTEND_UPDATE.md`
- Backend changes: `/Users/yanqing/Documents/GitHub/langgraph-defai/X402_CHANGES.md`
