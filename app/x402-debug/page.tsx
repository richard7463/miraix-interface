'use client';

import React, { useState } from 'react';

export default function X402DebugTest() {
  const [result, setResult] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testX402 = async () => {
    addLog('Starting X402 test...');
    
    try {
      addLog('Sending request to http://localhost:3010/api/chat-new');
      
      const response = await fetch('http://localhost:3010/api/chat-new', {
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

      // Get payment required header
      const paymentRequired = response.headers.get('payment-required') || response.headers.get('PAYMENT-REQUIRED');
      addLog(`Payment-Required header: ${paymentRequired ? paymentRequired.substring(0, 100) + '...' : 'null'}`);

      if (paymentRequired) {
        try {
          // Try to decode
          let decoded;
          if (typeof atob !== 'undefined') {
            decoded = atob(paymentRequired);
            addLog('Decoded using browser atob');
          } else {
            decoded = Buffer.from(paymentRequired, 'base64').toString();
            addLog('Decoded using Node.js Buffer');
          }
          
          addLog(`Decoded payment: ${decoded}`);
          const parsed = JSON.parse(decoded);
          addLog(`Parsed payment: ${JSON.stringify(parsed, null, 2)}`);
        } catch (error: any) {
          addLog(`Decode error: ${error.message}`);
        }
      }

      const data = await response.text();
      addLog(`Response body: ${data.substring(0, 500)}...`);
      
      setResult(`Status: ${response.status}, Payment: ${paymentRequired ? 'Required' : 'Not Required'}`);
    } catch (error: any) {
      addLog(`Request error: ${error.message}`);
      setResult(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>X402 Debug Test</h1>
      
      <button 
        onClick={testX402}
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
        Test X402 Payment
      </button>

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#e7f3ff',
          borderRadius: '5px'
        }}>
          <strong>Result:</strong> {result}
        </div>
      )}

      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px',
        maxHeight: '300px',
        overflow: 'auto'
      }}>
        <strong>Debug Logs:</strong>
        {logs.map((log, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
