'use client';

import React, { useState } from 'react';

export default function X402RealPayment() {
  const [message, setMessage] = useState('swap 0.01 USDC to SOL');
  const [walletAddress, setWalletAddress] = useState('BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn');
  const [privateKey, setPrivateKey] = useState('53DptsQ5YnfHyTLkxsYpo11jsiHffMbLuzTtLMHXbW9EUQxgQcNgVs76SMEqyzM5af4MeRtFVpJVtsrs3ETdQYzA');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'detected' | 'paying' | 'success' | 'error'>('idle');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Detect payment requirement
  const detectPayment = async () => {
    setIsLoading(true);
    setPaymentStep('processing');
    addLog('🔍 Detecting payment requirement...');
    
    try {
      const response = await fetch('/api/chat-x402', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          walletAddress,
        }),
      });

      const data = await response.json();
      
      if (data.requiresPayment) {
        setPaymentStep('detected');
        setPaymentDetails(data.paymentDetails);
        addLog('✅ Payment requirement detected');
        addLog(`💰 Amount: ${data.paymentDetails.displayAmount}`);
        addLog(`🌐 Network: ${data.paymentDetails.accepts[0].network}`);
        addLog(`📤 Pay to: ${data.paymentDetails.accepts[0].payTo}`);
        
        setResult(`Payment Required: ${data.paymentDetails.displayAmount}
Ready for automatic payment`);
      } else if (data.success) {
        addLog('✅ No payment required');
        setResult(`Success: ${data.data.message || 'Request completed'}`);
      } else {
        addLog(`❌ Error: ${data.error}`);
        setResult(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      addLog(`❌ Detection error: ${error.message}`);
      setResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute REAL Solana payment
  const executeRealPayment = async () => {
    if (!paymentDetails) return;
    
    setIsLoading(true);
    setPaymentStep('paying');
    addLog('💳 Executing REAL Solana payment...');
    
    try {
      // Import Solana libraries
      const { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } = await import('@solana/web3.js');
      const { createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } = await import('@solana/spl-token');
      const { base58 } = await import('@scure/base');
      
      // Initialize keypair from private key
      const secretKey = base58.decode(privateKey);
      const keypair = Keypair.fromSecretKey(secretKey);
      addLog(`🔑 Signer initialized: ${keypair.publicKey.toString()}`);
      
      // Connect to Solana mainnet via QuickNode
      const connection = new Connection('https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f/', 'confirmed');
      addLog('🔗 Connected to Solana mainnet (QuickNode)');
      
      // Token details
      const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      const payToAddress = new PublicKey(paymentDetails.accepts[0].payTo);
      const amount = parseInt(paymentDetails.accepts[0].amount); // USDC uses 6 decimals
      
      addLog(`💸 Preparing to send ${amount / 1000000} USDC to ${payToAddress.toString()}`);
      
      // Get sender's token account
      const senderTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        keypair.publicKey
      );
      
      // Get recipient's token account
      const recipientTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        payToAddress
      );
      
      // Check sender's USDC balance
      const senderBalance = await connection.getTokenAccountBalance(senderTokenAccount);
      addLog(`💰 Current USDC balance: ${senderBalance.value.uiAmount} USDC`);
      
      if (parseFloat(senderBalance.value.amount) < amount) {
        addLog('❌ Insufficient USDC balance for payment');
        throw new Error(`Insufficient USDC balance. Have: ${senderBalance.value.uiAmount}, Need: ${amount / 1000000}`);
      }
      
      // Create transaction
      const transaction = new Transaction();
      
      // Create recipient token account if it doesn't exist
      const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount);
      if (!recipientAccountInfo) {
        addLog('🏗️ Creating recipient token account...');
        transaction.add(
          createAssociatedTokenAccountInstruction(
            keypair.publicKey,
            recipientTokenAccount,
            payToAddress,
            usdcMint
          )
        );
      }
      
      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          keypair.publicKey,
          amount
        )
      );
      
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = keypair.publicKey;
      
      addLog('⏳ Sending transaction to Solana network...');
      
      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(connection, transaction, [keypair], {
        commitment: 'confirmed',
        maxRetries: 3,
      });
      
      addLog(`✅ Transaction confirmed!`);
      addLog(`📋 Transaction hash: ${signature}`);
      addLog(`🔗 Explorer: https://solscan.io/tx/${signature}`);
      
      // Now make final API request with payment proof
      addLog('🔄 Making final API request with payment proof...');
      
      const finalResponse = await fetch('/api/payment-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PAYMENT-TRANSACTION': signature,
          'X-PAYMENT-AMOUNT': amount.toString(),
          'X-PAYMENT-ASSET': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          'X-PAYMENT-STATUS': 'completed',
        },
        body: JSON.stringify({
          message,
          walletAddress,
        }),
      });

      const finalData = await finalResponse.json();
      
      if (finalResponse.ok) {
        setPaymentStep('success');
        addLog('🎉 API request completed successfully!');
        addLog(`📝 Response: ${finalData.message || 'Success'}`);
        
        setResult(`✅ REAL Payment Completed Successfully!
Transaction: ${signature}
Amount: ${amount / 1000000} USDC
API Response: ${finalData.message || 'Request completed'}

Explorer: https://solscan.io/tx/${signature}`);
      } else {
        addLog(`❌ Final API request failed: ${finalData.error}`);
        setResult(`❌ Payment Failed: ${finalData.error || 'Unknown error'}`);
      }
      
    } catch (error: any) {
      addLog(`❌ Payment error: ${error.message}`);
      setPaymentStep('error');
      setResult(`❌ Payment Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setPaymentStep('idle');
    setResult('');
    setLogs([]);
    setPaymentDetails(null);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>🚀 X402 REAL Payment (Live Solana)</h1>
      
      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '15px', 
        borderRadius: '5px', 
        marginBottom: '20px' 
      }}>
        <h3>⚠️ REAL PAYMENT WARNING</h3>
        <p>This will send REAL USDC tokens on Solana mainnet. Make sure you have sufficient balance!</p>
      </div>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '5px', 
        marginBottom: '20px' 
      }}>
        <h3>🔧 Configuration</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Message:</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Wallet Address:</label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Private Key:</label>
            <input
              type={showPrivateKey ? "text" : "password"}
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
              placeholder="Solana private key (base58)"
            />
            <button
              type="button"
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              style={{ marginTop: '5px', padding: '5px 10px' }}
            >
              {showPrivateKey ? 'Hide' : 'Show'} Private Key
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={detectPayment}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: isLoading ? '#ccc' : '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Detecting...' : '1️⃣ Detect Payment'}
          </button>
          
          <button
            onClick={executeRealPayment}
            disabled={isLoading || paymentStep !== 'detected'}
            style={{
              padding: '10px 20px',
              backgroundColor: (isLoading || paymentStep !== 'detected') ? '#ccc' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: (isLoading || paymentStep !== 'detected') ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Processing...' : '2️⃣ Send REAL USDC'}
          </button>
          
          <button
            onClick={reset}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {paymentStep === 'detected' && paymentDetails && (
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #ffeaa7'
        }}>
          <h3>💳 Payment Ready</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Amount:</strong> {paymentDetails.displayAmount}<br/>
            <strong>Network:</strong> {paymentDetails.accepts[0].network}<br/>
            <strong>Pay to:</strong> {paymentDetails.accepts[0].payTo}<br/>
            <strong>Description:</strong> {paymentDetails.resource.description}
          </div>
          <p style={{ color: '#856404', fontSize: '14px' }}>
            ⚠️ Click "Send REAL USDC" to execute a REAL token transfer on Solana mainnet
          </p>
        </div>
      )}

      {paymentStep === 'paying' && (
        <div style={{
          backgroundColor: '#cce5ff',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h3>⏳ Processing REAL Payment...</h3>
          <p>Sending REAL USDC tokens on Solana mainnet...</p>
        </div>
      )}

      {paymentStep === 'success' && (
        <div style={{
          backgroundColor: '#d4edda',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          <h3>✅ REAL Payment Successful!</h3>
          <p>REAL USDC tokens sent and API request processed successfully.</p>
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e9ecef',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px',
          whiteSpace: 'pre-line'
        }}>
          <strong>📋 Result:</strong>
          <br />
          {result}
        </div>
      )}

      {logs.length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          <strong>📝 Debug Logs:</strong>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
