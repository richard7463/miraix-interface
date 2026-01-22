'use client';

import React, { useState } from 'react';

export default function X402WorkingTest() {
  const [message, setMessage] = useState('swap 0.01 USDC to SOL');
  const [walletAddress, setWalletAddress] = useState('BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testX402 = async () => {
    setIsLoading(true);
    setResult('');
    
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
        setResult(`✅ Payment Required! 
Amount: ${data.paymentDetails.displayAmount || data.paymentDetails.accepts[0].amount / 100000} USDC
Network: ${data.paymentDetails.accepts[0].network}
Pay to: ${data.paymentDetails.accepts[0].payTo}`);
      } else if (data.success) {
        setResult(`✅ Success! ${data.data.message || 'Request completed'}`);
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      setResult(`❌ Request Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>X402 Working Test</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        This test uses a server-side proxy to access X402 payment headers that are filtered by browser fetch.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
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
        
        <button
          onClick={testX402}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Testing...' : 'Test X402 Payment'}
        </button>
      </div>

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#d4edda',
          borderRadius: '5px',
          whiteSpace: 'pre-line'
        }}>
          <strong>Result:</strong>
          <br />
          {result}
        </div>
      )}
      
      <div style={{ 
        marginTop: '30px', 
        fontSize: '14px', 
        color: '#666',
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '5px'
      }}>
        <h3>How it works:</h3>
        <ol>
          <li>Frontend calls <code>/api/chat-x402</code></li>
          <li>Server-side makes request to backend with full headers</li>
          <li>Extracts <code>PAYMENT-REQUIRED</code> header</li>
          <li>Decodes and returns payment details</li>
          <li>Frontend receives structured payment data</li>
        </ol>
        
        <h3>Expected Result:</h3>
        <p>Should show payment requirements with amount ($0.01 USDC) and network (Solana mainnet)</p>
      </div>
    </div>
  );
}
