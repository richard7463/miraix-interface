'use client';

import React, { useState } from 'react';

export default function X402DebugFlow() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testX402Direct = async () => {
    addLog('Testing X402 client directly...');
    
    try {
      // Import X402 client dynamically
      const { x402Client, wrapFetchWithPayment } = await import('@x402/fetch');
      const { registerExactSvmScheme } = await import('@x402/svm/exact/client');
      const { createKeyPairSignerFromBytes } = await import('@solana/kit');
      const { base58 } = await import('@scure/base');
      
      // Initialize client
      const client = new x402Client();
      
      // Register signer
      const privateKey = '53DptsQ5YnfHyTLkxsYpo11jsiHffMbLuzTtLMHXbW9EUQxgQcNgVs76SMEqyzM5af4MeRtFVpJVtsrs3ETdQYzA';
      const keypairBytes = base58.decode(privateKey);
      const svmSigner = await createKeyPairSignerFromBytes(keypairBytes);
      registerExactSvmScheme(client, { signer: svmSigner });
      
      addLog(`X402 client initialized for: ${svmSigner.address}`);
      
      // Create fetch with payment support
      const fetchWithPayment = wrapFetchWithPayment(fetch, client);
      
      addLog('Making request with X402 client...');
      const response = await fetchWithPayment('http://localhost:3010/api/chat-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'swap 0.01 USDC to SOL',
          walletAddress: 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'
        }),
      });

      addLog(`Response status: ${response.status}`);
      addLog(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
      
      const data = await response.json();
      addLog(`Response body: ${JSON.stringify(data)}`);
      
      if (response.ok) {
        addLog('✅ Request successful with X402');
      } else {
        addLog(`❌ Request failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      addLog(`❌ X402 error: ${error.message}`);
      addLog(`Stack: ${error.stack}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔍 X402 Debug Flow</h1>
      
      <button 
        onClick={testX402Direct}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Debug X402 Client
      </button>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
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
    </div>
  );
}
