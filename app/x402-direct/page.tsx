'use client';

import React, { useState } from 'react';

export default function X402DirectTest() {
  const [result, setResult] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testWithCurl = async () => {
    addLog('Testing with curl command...');
    
    try {
      // Use fetch to call a backend endpoint that uses curl
      const response = await fetch('/api/test-curl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'http://localhost:3010/api/chat-new',
          data: {
            message: 'swap 0.01 USDC to SOL',
            walletAddress: 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'
          }
        }),
      });

      const data = await response.json();
      addLog(`Curl test result: ${JSON.stringify(data, null, 2)}`);
      setResult(`Success: ${data.success}`);
    } catch (error: any) {
      addLog(`Curl test error: ${error.message}`);
      setResult(`Error: ${error.message}`);
    }
  };

  const testDirectFetch = async () => {
    addLog('Testing direct fetch with all headers...');
    
    try {
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

      // Log all available headers
      const headers: any = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      addLog(`All headers: ${JSON.stringify(headers, null, 2)}`);
      addLog(`Status: ${response.status}`);
      
      const body = await response.text();
      addLog(`Body: ${body}`);
      
      setResult(`Status: ${response.status}`);
    } catch (error: any) {
      addLog(`Direct fetch error: ${error.message}`);
      setResult(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>X402 Direct Header Test</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={testWithCurl}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test via Curl API
        </button>
        
        <button 
          onClick={testDirectFetch}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Direct Fetch
        </button>
      </div>

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
        maxHeight: '400px',
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
