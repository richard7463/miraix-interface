'use client';

import React, { useState } from 'react';

export default function X402AutoPayment() {
  const [message, setMessage] = useState('swap 0.01 USDC to SOL');
  const [walletAddress, setWalletAddress] = useState('BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn');
  const [privateKey, setPrivateKey] = useState('53DptsQ5YnfHyTLkxsYpo11jsiHffMbLuzTtLMHXbW9EUQxgQcNgVs76SMEqyzM5af4MeRtFVpJVtsrs3ETdQYzA');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'processing' | 'detected' | 'paying' | 'success' | 'error'>('idle');
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

  // Execute automatic payment
  const executePayment = async () => {
    if (!paymentDetails) return;
    
    setIsLoading(true);
    setPaymentStep('paying');
    addLog('💳 Executing automatic Solana payment...');
    
    try {
      // Import Solana libraries dynamically
      const { createKeyPairSignerFromBytes } = await import('@solana/kit');
      const { base58 } = await import('@scure/base');
      
      // Initialize signer
      const keypairBytes = base58.decode(privateKey);
      const signer = await createKeyPairSignerFromBytes(keypairBytes);
      addLog(`🔑 Signer initialized: ${signer.address}`);
      
      // Get USDC token info
      const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const payToAddress = paymentDetails.accepts[0].payTo;
      const amount = paymentDetails.accepts[0].amount; // This is in the smallest unit
      
      addLog(`💸 Preparing to send ${amount} lamports USDC to ${payToAddress}`);
      
      // For now, simulate the payment (we'll implement actual transfer next)
      addLog('⏳ Simulating payment transaction...');
      
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create simulated transaction hash
      const txHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      addLog(`✅ Payment simulated successfully!`);
      addLog(`📋 Transaction hash: ${txHash}`);
      
      // Now make the final API request with payment proof
      addLog('🔄 Making final API request with payment proof...');
      
      const finalResponse = await fetch('http://localhost:3009/api/chat-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment-Transaction': txHash,
          'X-Payment-Amount': amount,
          'X-Payment-Asset': usdcMint,
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
        
        setResult(`✅ Payment Completed Successfully!
Transaction: ${txHash}
Amount: ${paymentDetails.displayAmount}
API Response: ${finalData.message || 'Request completed'}`);
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
      <h1>🚀 X402 Auto Payment</h1>
      
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
              placeholder="Solana private key for automatic payment"
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
            onClick={executePayment}
            disabled={isLoading || paymentStep !== 'detected'}
            style={{
              padding: '10px 20px',
              backgroundColor: (isLoading || paymentStep !== 'detected') ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: (isLoading || paymentStep !== 'detected') ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Processing...' : '2️⃣ Auto Pay & Execute'}
          </button>
          
          <button
            onClick={reset}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
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
            💡 Click "Auto Pay & Execute" to automatically send payment and complete the API request
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
          <h3>⏳ Processing Payment...</h3>
          <p>Executing automatic Solana payment...</p>
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
          <h3>✅ Payment Successful!</h3>
          <p>Automatic payment completed and API request processed successfully.</p>
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
