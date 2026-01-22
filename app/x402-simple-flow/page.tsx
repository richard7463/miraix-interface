'use client';

import React, { useState } from 'react';

export default function X402SimpleFlow() {
  const [message, setMessage] = useState('swap 0.01 USDC to SOL');
  const [walletAddress, setWalletAddress] = useState('BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn');
  const [privateKey, setPrivateKey] = useState('53DptsQ5YnfHyTLkxsYpo11jsiHffMbLuzTtLMHXbW9EUQxgQcNgVs76SMEqyzM5af4MeRtFVpJVtsrs3ETdQYzA');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'detected' | 'manual'>('idle');

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const detectPayment = async () => {
    setIsLoading(true);
    setPaymentStep('processing');
    addLog('Detecting payment requirement...');
    
    try {
      const response = await fetch('http://localhost:3010/api/chat-new', {
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
      
      if (response.status === 402) {
        setPaymentStep('detected');
        addLog('✅ Payment requirement detected');
        
        // Get payment requirement from our proxy
        const proxyResponse = await fetch('/api/chat-x402', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            walletAddress,
          }),
        });

        const proxyData = await proxyResponse.json();
        
        if (proxyData.requiresPayment) {
          addLog(`✅ Payment details received:`);
          addLog(`  Amount: ${proxyData.paymentDetails.displayAmount}`);
          addLog(`  Network: ${proxyData.paymentDetails.accepts[0].network}`);
          addLog(`  Pay to: ${proxyData.paymentDetails.accepts[0].payTo}`);
          
          setResult(`✅ Payment Required - Ready for X402 Payment
Amount: ${proxyData.paymentDetails.displayAmount}
Network: ${proxyData.paymentDetails.accepts[0].network}
Pay to: ${proxyData.paymentDetails.accepts[0].payTo}

Instructions:
1. Use your wallet to send ${proxyData.paymentDetails.displayAmount} USDC
2. Send to: ${proxyData.paymentDetails.accepts[0].payTo}
3. Network: Solana Mainnet
4. After payment, the API request will be processed`);
        } else {
          addLog('❌ Payment detection failed');
          setResult('❌ Failed to detect payment requirements');
        }
      } else if (response.ok) {
        addLog('✅ No payment required - request succeeded');
        setResult(`✅ Success: ${data.message || 'Request completed'}`);
      } else {
        addLog(`❌ Request failed: ${data.error || 'Unknown error'}`);
        setResult(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const simulatePayment = async () => {
    setIsLoading(true);
    addLog('Simulating payment completion...');
    
    // Simulate payment completion
    setTimeout(() => {
      addLog('✅ Payment simulated as completed');
      addLog('Making final API request...');
      
      // Make the actual request after payment
      fetch('http://localhost:3010/api/chat-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment-Completed': 'true' // Custom header to indicate payment completed
        },
        body: JSON.stringify({
          message,
          walletAddress,
        }),
      }).then(response => response.json())
      .then(data => {
        addLog(`✅ Final request completed: ${data.message || 'Success'}`);
        setResult(`✅ Payment Completed - ${data.message || 'Request completed'}`);
      })
      .catch(error => {
        addLog(`❌ Final request failed: ${error.message}`);
        setResult(`❌ Payment Failed: ${error.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
    }, 2000);
  };

  const reset = () => {
    setPaymentStep('idle');
    setResult('');
    setLogs([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>🚀 X402 Simple Flow (No Library Dependencies)</h1>
      
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
              placeholder="For future X402 client implementation"
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
            onClick={simulatePayment}
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
            {isLoading ? 'Processing...' : '2️⃣ Simulate Payment'}
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

      {paymentStep === 'detected' && (
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #ffeaa7'
        }}>
          <h3>💳 Payment Detected</h3>
          <p style={{ color: '#856404', marginBottom: '10px' }}>
            Payment requirement detected! Click "Simulate Payment" to complete the flow.
          </p>
        </div>
      )}

      {paymentStep === 'processing' && (
        <div style={{
          backgroundColor: '#cce5ff',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h3>⏳ Processing...</h3>
          <p>Processing payment simulation...</p>
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

      <div style={{ 
        marginTop: '30px', 
        fontSize: '14px', 
        color: '#666',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '5px'
      }}>
        <h3>🔄 Complete Flow:</h3>
        <ol>
          <li><strong>Step 1:</strong> Click "Detect Payment" to check if payment is required</li>
          <li><strong>Step 2:</strong> If payment required, click "Simulate Payment"</li>
          <li><strong>Step 3:</strong> View the final API response</li>
        </ol>
        
        <h3>⚠️ Current Status:</h3>
        <ul>
          <li>✅ Backend X402 middleware working correctly</li>
          <li>✅ Payment detection working</li>
          <li>⚠️ X402 client library has import issues</li>
          <li>✅ This flow bypasses the library issues</li>
        </ul>
      </div>

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
