'use client';

import React, { useState } from 'react';

export default function X402FinalTest() {
  const [message, setMessage] = useState('swap 0.01 USDC to SOL');
  const [walletAddress, setWalletAddress] = useState('BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [paymentDetected, setPaymentDetected] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const detectPaymentRequirement = async () => {
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
        setPaymentDetected(true);
        setPaymentDetails(data.paymentDetails);
        setResult(`Payment Required: ${data.paymentDetails.displayAmount || '0.01 USDC'}`);
      } else if (data.success) {
        setResult(`Success: ${data.data.message || 'Request completed'}`);
      } else {
        setResult(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setPaymentDetected(false);
    setPaymentDetails(null);
    setResult('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🚀 X402 Final Test</h1>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
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
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={detectPaymentRequirement}
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
            {isLoading ? 'Detecting...' : 'Detect Payment'}
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
            Reset
          </button>
        </div>
      </div>

      {paymentDetected && paymentDetails && (
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #ffeaa7'
        }}>
          <h3>💳 Payment Required</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Amount:</strong> {paymentDetails.displayAmount}<br/>
            <strong>Network:</strong> {paymentDetails.accepts[0].network}<br/>
            <strong>Pay to:</strong> {paymentDetails.accepts[0].payTo}<br/>
            <strong>Description:</strong> {paymentDetails.resource.description}
          </div>
          <p style={{ color: '#856404', fontSize: '14px' }}>
            💡 This is a working X402 implementation! The backend correctly requires payment 
            and the frontend successfully detects and displays the payment requirements.
          </p>
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
    </div>
  );
}
