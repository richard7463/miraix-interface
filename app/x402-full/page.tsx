'use client';

import React, { useState } from 'react';
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { base58 } from "@scure/base";

export default function X402FullFlow() {
  const [message, setMessage] = useState('swap 0.01 USDC to SOL');
  const [walletAddress, setWalletAddress] = useState('BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn');
  const [privateKey, setPrivateKey] = useState('53DptsQ5YnfHyTLkxsYpo11jsiHffMbLuzTtLMHXbW9EUQxgQcNgVs76SMEqyzM5af4MeRtFVpJVtsrs3ETdQYzA');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'detected' | 'processing' | 'success' | 'error'>('idle');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  // Initialize X402 client
  const client = new x402Client();
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Initialize X402 signer
  const initializeX402 = async () => {
    try {
      const keypairBytes = base58.decode(privateKey);
      const svmSigner = await createKeyPairSignerFromBytes(keypairBytes);
      registerExactSvmScheme(client, { signer: svmSigner });
      addLog(`X402 client initialized for wallet: ${svmSigner.address}`);
      return true;
    } catch (error: any) {
      addLog(`Failed to initialize X402: ${error.message}`);
      return false;
    }
  };

  const testWithoutX402 = async () => {
    setIsLoading(true);
    setPaymentStep('processing');
    addLog('Testing without X402 client...');
    
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
        addLog('Payment requirement detected');
        addLog(`Amount: ${data.paymentDetails.displayAmount}`);
        addLog(`Network: ${data.paymentDetails.accepts[0].network}`);
        setResult('Payment required - ready for X402 payment');
      } else if (data.success) {
        setPaymentStep('success');
        addLog('Request succeeded without payment');
        setResult(`✅ Success: ${data.data.message || 'Request completed'}`);
      } else {
        setPaymentStep('error');
        addLog(`Error: ${data.error}`);
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      setPaymentStep('error');
      addLog(`Request error: ${error.message}`);
      setResult(`❌ Request Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testWithX402 = async () => {
    setIsLoading(true);
    setPaymentStep('processing');
    addLog('Testing with X402 client...');
    
    // Initialize X402 client
    const initialized = await initializeX402();
    if (!initialized) {
      setIsLoading(false);
      return;
    }
    
    // Create fetch with payment support
    const fetchWithPayment = wrapFetchWithPayment(fetch, client);
    
    try {
      const response = await fetchWithPayment('http://localhost:3010/api/chat-new', {
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
      
      if (response.ok) {
        setPaymentStep('success');
        addLog('X402 payment successful!');
        addLog(`API Response: ${data.message || 'Success'}`);
        
        // Check for payment response header
        const paymentResponse = response.headers.get('PAYMENT-RESPONSE');
        if (paymentResponse) {
          try {
            const decoded = JSON.parse(atob(paymentResponse));
            addLog(`Payment transaction: ${decoded.transaction}`);
            addLog(`Payment network: ${decoded.network}`);
          } catch (error) {
            addLog('Failed to decode payment response');
          }
        }
        
        setResult(`✅ X402 Payment Successful! 
API Response: ${data.message || 'Success'}
Transaction: ${data.transaction || 'N/A'}`);
      } else {
        setPaymentStep('error');
        addLog(`X402 payment failed: ${data.error || 'Unknown error'}`);
        setResult(`❌ X402 Payment Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setPaymentStep('error');
      addLog(`X402 payment error: ${error.message}`);
      setResult(`❌ X402 Payment Error: ${error.message}`);
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
      <h1>🚀 Complete X402 Payment Flow</h1>
      
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
              placeholder="Solana private key (base58)"
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
            onClick={testWithoutX402}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: isLoading ? '#ccc' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Testing...' : '1️⃣ Test Without X402'}
          </button>
          
          <button
            onClick={testWithX402}
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
            {isLoading ? 'Processing...' : '2️⃣ Test With X402 Payment'}
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
          <h3>💳 Payment Required</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Amount:</strong> {paymentDetails.displayAmount}<br/>
            <strong>Network:</strong> {paymentDetails.accepts[0].network}<br/>
            <strong>Pay to:</strong> {paymentDetails.accepts[0].payTo}<br/>
            <strong>Description:</strong> {paymentDetails.resource.description}
          </div>
          <p style={{ color: '#856404', fontSize: '14px' }}>
            💡 Click "Test With X402 Payment" to automatically pay and complete the request
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
          <h3>⏳ Processing Payment...</h3>
          <p>X402 client is processing the payment. Please wait...</p>
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
          <p>X402 payment has been processed successfully.</p>
        </div>
      )}

      {paymentStep === 'error' && (
        <div style={{
          backgroundColor: '#f8d7da',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          <h3>❌ Payment Failed</h3>
          <p>Payment processing failed. Please check the logs for details.</p>
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
          <li><strong>Step 1:</strong> Click "Test Without X402" to detect payment requirement</li>
          <li><strong>Step 2:</strong> Review payment details (amount, network, pay to address)</li>
          <li><strong>Step 3:</strong> Click "Test With X402 Payment" to automatically process payment</li>
          <li><strong>Step 4:</strong> View payment success and API response</li>
        </ol>
        
        <h3>⚠️ Important Notes:</h3>
        <ul>
          <li>Ensure wallet has sufficient USDC on Solana mainnet</li>
          <li>X402 client will automatically handle the $0.01 USDC payment</li>
          <li>Payment transaction details will be logged</li>
          <li>This is a test environment - use test funds only</li>
        </ul>
      </div>
    </div>
  );
}
