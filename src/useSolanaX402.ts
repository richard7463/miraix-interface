// Solana-only X402 React Hook
import { useState, useCallback } from 'react';
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { base58 } from "@scure/base";

interface SolanaX402Config {
  privateKey?: string;
  apiUrl?: string;
}

interface ChatResponse {
  success: boolean;
  message: string;
  data?: any;
  thoughts?: string[];
  quote?: any;
  transaction?: string;
  phase?: string;
  payment?: any;
}

interface PaymentError {
  error: string;
  requiresPayment: boolean;
  paymentDetails?: any;
}

export function useSolanaX402(config: SolanaX402Config = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPayment, setLastPayment] = useState<any>(null);

  // Initialize X402 client
  const client = new x402Client();
  
  // Register Solana signer
  const initializeSigner = useCallback(async () => {
    if (config.privateKey) {
      try {
        const keypairBytes = base58.decode(config.privateKey);
        const svmSigner = await createKeyPairSignerFromBytes(keypairBytes);
        registerExactSvmScheme(client, { signer: svmSigner });
        console.log('[X402] Solana signer registered:', svmSigner.address);
        return svmSigner.address;
      } catch (error) {
        console.error('[X402] Failed to register Solana signer:', error);
        throw error;
      }
    }
  }, [config.privateKey]);

  // Create fetch with payment support
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  // Chat API with X402 payment
  const chatNew = useCallback(async (
    message: string,
    walletAddress?: string
  ): Promise<ChatResponse | PaymentError> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use server-side proxy to get full headers including PAYMENT-REQUIRED
      const response = await fetch(`${config.apiUrl || 'http://localhost:3009'}/api/chat-new`, {
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
        // Check for payment response
        const paymentResponse = extractPaymentResponse(response.headers);
        if (paymentResponse) {
          setLastPayment(paymentResponse);
          console.log('[X402] Payment successful:', paymentResponse);
        }

        return {
          success: true,
          message: data.message || 'Success',
          data: data.data,
          thoughts: data.thoughts,
          quote: data.quote,
          transaction: data.transaction,
          phase: data.phase,
          payment: paymentResponse
        };
      } else {
        // Handle payment required - check if we have payment details in data
        if (data.paymentDetails) {
          return {
            error: data.error || 'Payment required',
            requiresPayment: true,
            paymentDetails: data.paymentDetails
          } as PaymentError;
        }

        // Handle other errors
        throw new Error(data.error || 'Request failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      return {
        error: errorMessage,
        requiresPayment: false
      } as PaymentError;
    } finally {
      setIsLoading(false);
    }
  }, [config.apiUrl]);

  // Initialize signer on mount
  useState(() => {
    initializeSigner();
  });

  return {
    chatNew,
    isLoading,
    error,
    lastPayment,
    initializeSigner,
    clearError: () => setError(null)
  };
}

// Helper functions
function extractPaymentResponse(headers: any): any | null {
  const paymentHeader = headers.get('PAYMENT-RESPONSE');
  if (paymentHeader) {
    try {
      // Handle both browser and Node.js environments
      const decoded = typeof atob !== 'undefined' 
        ? atob(paymentHeader) 
        : Buffer.from(paymentHeader, 'base64').toString();
      return JSON.parse(decoded);
    } catch (error) {
      console.error('[X402] Failed to decode payment response:', error);
    }
  }
  return null;
}

function extractPaymentRequired(headers: any): any | null {
  const paymentHeader = headers.get('PAYMENT-REQUIRED');
  if (paymentHeader) {
    try {
      // Handle both browser and Node.js environments
      const decoded = typeof atob !== 'undefined' 
        ? atob(paymentHeader) 
        : Buffer.from(paymentHeader, 'base64').toString();
      return JSON.parse(decoded);
    } catch (error) {
      console.error('[X402] Failed to decode payment required:', error);
      console.error('[X402] Payment header:', paymentHeader);
    }
  }
  return null;
}

// Example usage in React component:
/*
import React, { useState } from 'react';
import { useSolanaX402 } from './useSolanaX402';

export function SwapInterface() {
  const [message, setMessage] = useState('');
  const [walletAddress, setWalletAddress] = useState('BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn');
  const [privateKey, setPrivateKey] = useState('53DptsQ5YnfHyTLkxsYpo11jsiHffMbLuzTtLMHXbW9EUQxgQcNgVs76SMEqyzM5af4MeRtFVpJVtsrs3ETdQYzA');
  
  const { chatNew, isLoading, error, lastPayment } = useSolanaX402({
    privateKey,
    apiUrl: 'http://localhost:3009'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await chatNew(message, walletAddress);
    
    if ('success' in result && result.success) {
      console.log('Swap successful:', result);
      // Handle successful response
    } else if ('requiresPayment' in result && result.requiresPayment) {
      console.log('Payment required:', result.paymentDetails);
      // Show payment UI - X402 will handle automatically
      console.log('Payment details:', {
        network: result.paymentDetails.accepts[0].network,
        amount: result.paymentDetails.accepts[0].amount,
        asset: 'USDC',
        payTo: result.paymentDetails.accepts[0].payTo
      });
    } else {
      console.error('Error:', result.error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g., swap 0.1 USDC to SOL"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Execute Swap'}
        </button>
      </form>
      
      {error && <div className="error">{error}</div>}
      {lastPayment && (
        <div className="payment-success">
          Payment successful! Transaction: {lastPayment.transaction}
        </div>
      )}
    </div>
  );
}
*/
