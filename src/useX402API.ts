// React Hook for X402 API Integration
// This hook handles X402 payments automatically

import { useState, useCallback } from 'react';
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { base58 } from "@scure/base";

interface X402Config {
  evmPrivateKey?: `0x${string}`;
  svmPrivateKey?: string;
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

export function useX402API(config: X402Config = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPayment, setLastPayment] = useState<any>(null);

  // Initialize X402 client
  const client = new x402Client();
  
  // Register signers if provided
  const initializeSigners = useCallback(() => {
    if (config.evmPrivateKey) {
      const evmSigner = privateKeyToAccount(config.evmPrivateKey);
      registerExactEvmScheme(client, { signer: evmSigner });
      console.log('[X402] EVM signer registered');
    }
    
    if (config.svmPrivateKey) {
      createKeyPairSignerFromBytes(base58.decode(config.svmPrivateKey))
        .then(svmSigner => {
          registerExactSvmScheme(client, { signer: svmSigner });
          console.log('[X402] SVM signer registered');
        })
        .catch(err => console.error('[X402] Failed to register SVM signer:', err));
    }
  }, [config.evmPrivateKey, config.svmPrivateKey]);

  // Create fetch with payment support
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  // Chat API with X402 payment
  const chatNew = useCallback(async (
    message: string,
    walletAddress?: string,
    enableX402Payment?: boolean
  ): Promise<ChatResponse | PaymentError> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithPayment(`${config.apiUrl || 'http://localhost:3009'}/api/chat-new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          walletAddress,
          enableX402Payment,
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
        // Handle payment required
        if (response.status === 402) {
          const paymentRequired = extractPaymentRequired(response.headers);
          return {
            error: data.error || 'Payment required',
            requiresPayment: true,
            paymentDetails: paymentRequired
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

  // Initialize signers on mount
  useState(() => {
    initializeSigners();
  });

  return {
    chatNew,
    isLoading,
    error,
    lastPayment,
    clearError: () => setError(null)
  };
}

// Helper functions
function extractPaymentResponse(headers: any): any | null {
  const paymentHeader = headers.get('PAYMENT-RESPONSE');
  if (paymentHeader) {
    try {
      return JSON.parse(atob(paymentHeader));
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
      return JSON.parse(atob(paymentHeader));
    } catch (error) {
      console.error('[X402] Failed to decode payment required:', error);
    }
  }
  return null;
}
