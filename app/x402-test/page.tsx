'use client';

// Simple test page for Solana X402 integration
// This can be used in a Next.js page or React component

import React, { useState } from 'react';
import { useSolanaX402 } from '../../src/useSolanaX402';

export default function X402TestPage() {
  const [message, setMessage] = useState('swap 0.01 USDC to SOL');
  const [walletAddress, setWalletAddress] = useState('BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn');
  const [privateKey, setPrivateKey] = useState('53DptsQ5YnfHyTLkxsYpo11jsiHffMbLuzTtLMHXbW9EUQxgQcNgVs76SMEqyzM5af4MeRtFVpJVtsrs3ETdQYzA');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  
  const { chatNew, isLoading, error, lastPayment } = useSolanaX402({
    privateKey,
    apiUrl: process.env.NODE_ENV === 'production' 
      ? 'https://langgraph-defai.vercel.app' 
      : 'http://localhost:3009'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting request...');
    const result = await chatNew(message, walletAddress);
    
    if ('success' in result && result.success) {
      console.log('✅ Success:', result);
      alert(`Success! ${result.message}`);
    } else if ('requiresPayment' in result && result.requiresPayment) {
      console.log('💳 Payment required:', result.paymentDetails);
      const details = result.paymentDetails.accepts[0];
      alert(`Payment required: ${details.amount / 10000} USDC on Solana mainnet\nPay to: ${details.payTo}`);
    } else {
      console.error('❌ Error:', (result as any).error);
      alert(`Error: ${(result as any).error}`);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h1>Solana X402 Test</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Wallet Address:</label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            placeholder="Solana wallet address"
          />
        </div>

        <div>
          <label>Private Key:</label>
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
            style={{ marginTop: '5px' }}
          >
            {showPrivateKey ? 'Hide' : 'Show'} Private Key
          </button>
        </div>

        <div>
          <label>Message:</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            placeholder="e.g., swap 0.01 USDC to SOL"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Processing...' : 'Send Request'}
        </button>
      </form>

      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          borderRadius: '5px' 
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {lastPayment && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#d4edda', 
          color: '#155724',
          borderRadius: '5px' 
        }}>
          <strong>Payment Successful!</strong><br/>
          Transaction: {lastPayment.transaction}<br/>
          Network: {lastPayment.network}
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Ensure your wallet has USDC on Solana mainnet</li>
          <li>Enter your wallet address and private key</li>
          <li>Click "Send Request" to test X402 payment</li>
          <li>The system will automatically handle $0.01 USDC payment</li>
        </ol>
        
        <h3>What happens:</h3>
        <ul>
          <li>First request returns 402 (payment required)</li>
          <li>X402 client automatically pays $0.01 USDC</li>
          <li>Second request returns the API response</li>
        </ul>
      </div>
    </div>
  );
}
