'use client';

import React, { useState } from 'react';

export default function X402SimpleTest() {
  const [message, setMessage] = useState('Test X402 Integration');
  const [result, setResult] = useState('');

  const testX402 = async () => {
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

      const data = await response.text();
      setResult(`Status: ${response.status}, Response: ${data.substring(0, 200)}...`);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>X402 Simple Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testX402}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test X402 Backend
        </button>
      </div>

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px'
        }}>
          <strong>Result:</strong>
          <pre style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>
            {result}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h3>What this tests:</h3>
        <ul>
          <li>Connects to backend at http://localhost:3009</li>
          <li>Sends a swap request</li>
          <li>Should receive HTTP 402 (Payment Required)</li>
          <li>Shows payment requirements in response</li>
        </ul>
        
        <h3>Expected Result:</h3>
        <p>Status: 402, Response: {"error":"Payment required"...}</p>
      </div>
    </div>
  );
}
