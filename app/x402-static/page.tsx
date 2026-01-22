'use client';

import React, { useState } from 'react';

export default function X402StaticTest() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testWithStaticX402 = async () => {
    addLog('Testing with static X402 client...');
    
    try {
      // Static test - create a simple payment request manually
      const testPaymentRequest = {
        x402Version: 2,
        accepts: [{
          scheme: "exact",
          network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
          amount: "10000",
          asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          payTo: "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4",
          maxTimeoutSeconds: 300,
          extra: {
            feePayer: "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4"
          }
        }]
      };

      // Simulate what X402 client would send
      const response = await fetch('http://localhost:3010/api/chat-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment-Request': btoa(JSON.stringify(testPaymentRequest))
        },
        body: JSON.stringify({
          message: 'swap 0.01 USDC to SOL',
          walletAddress: 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'
        }),
      });

      const data = await response.json();
      
      addLog(`Status: ${response.status}`);
      addLog(`Response: ${JSON.stringify(data)}`);
      
      if (response.status === 402) {
        addLog('✅ Successfully simulated X402 payment request');
        addLog('Backend returned 402 as expected');
      } else if (response.ok) {
        addLog('✅ Request succeeded');
      } else {
        addLog(`❌ Request failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔧 Static X402 Test</h1>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '5px', 
        marginBottom: '20px' 
      }}>
        <p style={{ marginBottom: '15px' }}>
          This test simulates what the X402 client would send by manually creating the payment request.
          It bypasses the dynamic import issues we encountered with the X402 client library.
        </p>
        
        <button
          onClick={testWithStaticX402}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Static X402 Payment
        </button>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e9ecef',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        <strong>📝 Debug Logs:</strong>
        {logs.map((log, index) => (
          <div key={index} style={{ marginBottom: '5px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
            {log}
          </div>
        ))}
      </div>
      
      <div style={{ 
        marginTop: '20px', 
        fontSize: '14px', 
        color: '#666',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '5px'
      }}>
        <h3>🎯 What this tests:</h3>
        <ul>
          <li>Creates a manual X402 payment request</li>
          <li>Sends it with <code>X-Payment-Request</code> header</li>
          <li>Tests if backend accepts the payment</li>
          <li>Bypasses dynamic import issues</li>
        </ul>
      </div>
    </div>
  );
}
