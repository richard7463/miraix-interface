'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { x402Client, x402HTTPClient } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

interface EvmTypedDataSigner {
  address: `0x${string}`;
  signTypedData: (message: {
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    primaryType: string;
    message: Record<string, unknown>;
  }) => Promise<`0x${string}`>;
}

interface PremiumActionConfig {
  apiUrl?: string;
  evmSigner?: EvmTypedDataSigner;
  preferredAsset?: 'USDT' | 'USDC' | 'fxUSD';
}

interface PremiumActionResult {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  requiresPayment?: boolean;
  paymentDetails?: any;
  payment?: any;
}

const GENERIC_PAYMENT_ERRORS = new Set([
  'An error has occurred, please try again.',
  'Unknown error',
]);
const SETTLE_RETRYABLE_ERRORS = new Set(['internal_server_error']);
const MAX_SETTLE_RETRIES = 2;

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function buildUrl(apiUrl: string | undefined, path: string) {
  if (!apiUrl) {
    return path;
  }

  return `${apiUrl}${path}`;
}

function decodePaymentHeader(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    let decoded: string;
    if (typeof atob !== 'undefined') {
      const binary = atob(value);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      decoded = new TextDecoder().decode(bytes);
    } else {
      decoded = Buffer.from(value, 'base64').toString('utf8');
    }
    return JSON.parse(decoded);
  } catch (error) {
    console.error('[PremiumActionX402] Failed to decode payment header:', error);
    return null;
  }
}

function extractErrorMessage(error: unknown, fallback: string) {
  const messages: string[] = [];
  const visited = new Set<unknown>();
  const queue: unknown[] = [error];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null) {
      continue;
    }

    if (typeof current === 'string') {
      const message = current.trim();
      if (message) {
        messages.push(message);
      }
      continue;
    }

    if (typeof current !== 'object' || visited.has(current)) {
      continue;
    }

    visited.add(current);

    const record = current as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim()) {
      messages.push(record.message.trim());
    }

    for (const key of ['cause', 'error', 'details', 'data', 'response', 'body']) {
      if (record[key] !== undefined) {
        queue.push(record[key]);
      }
    }
  }

  const specificMessage = messages.find((message) => !GENERIC_PAYMENT_ERRORS.has(message));
  return specificMessage || messages[0] || fallback;
}

export function usePremiumActionX402(config: PremiumActionConfig = {}) {
  const client = useMemo(
    () =>
      new x402Client((_version, accepts) => {
        const preferredAsset = config.preferredAsset;
        if (!preferredAsset) {
          return accepts[0];
        }

        const preferredNames =
          preferredAsset === 'USDC'
            ? ['USD Coin', 'USDC']
            : preferredAsset === 'USDT'
              ? ['Tether USD', 'USDT', 'Tether', 'USD₮0']
              : ['FxUSD', 'fxUSD'];

        return (
          accepts.find((requirement: any) => {
            const assetName = requirement?.price?.extra?.name || requirement?.extra?.name;
            return preferredNames.includes(assetName);
          }) || accepts[0]
        );
      }),
    [config.preferredAsset]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPayment, setLastPayment] = useState<any>(null);

  useEffect(() => {
    if (!config.evmSigner) {
      return;
    }

    try {
      registerExactEvmScheme(client, { signer: config.evmSigner });
    } catch (registerError) {
      console.error('[PremiumActionX402] Failed to register EVM signer:', registerError);
    }
  }, [client, config.evmSigner]);

  const detectPayment = useCallback(async (path: string, body: Record<string, unknown>): Promise<PremiumActionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(buildUrl(config.apiUrl, path), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const paymentDetails = decodePaymentHeader(response.headers.get('PAYMENT-REQUIRED'));
      const data = await response.json().catch(() => null);

      return {
        success: response.ok,
        status: response.status,
        data,
        error: data?.error,
        requiresPayment: response.status === 402,
        paymentDetails,
      };
    } catch (requestError: any) {
      console.error('[PremiumActionX402] detectPayment failed:', requestError);
      const message = extractErrorMessage(requestError, 'Failed to detect payment requirements');
      setError(message);
      return {
        success: false,
        status: 500,
        error: message,
      };
    } finally {
      setIsLoading(false);
    }
  }, [config.apiUrl]);

  const unlockWithPayment = useCallback(async (path: string, body: Record<string, unknown>): Promise<PremiumActionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const url = buildUrl(config.apiUrl, path);
      const initialResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const paymentDetails = decodePaymentHeader(initialResponse.headers.get('PAYMENT-REQUIRED'));

      if (initialResponse.status !== 402 || !paymentDetails) {
        const data = await initialResponse.json().catch(() => null);
        const payment = decodePaymentHeader(initialResponse.headers.get('PAYMENT-RESPONSE'));
        if (payment) {
          setLastPayment(payment);
        }

        return {
          success: initialResponse.ok,
          status: initialResponse.status,
          data,
          error: data?.error,
          requiresPayment: initialResponse.status === 402,
          paymentDetails,
          payment,
        };
      }

      const paymentPayload = await client.createPaymentPayload(paymentDetails);
      const httpClient = new x402HTTPClient(client);
      const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

      const attemptPayment = async (
        attempt: number,
      ): Promise<{
        response: Response;
        data: any;
        payment: any;
        paymentRequired: any;
        error: string | undefined;
      }> => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...paymentHeaders,
          },
          body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => null);
        const payment = decodePaymentHeader(response.headers.get('PAYMENT-RESPONSE'));
        const nextPaymentRequired = decodePaymentHeader(response.headers.get('PAYMENT-REQUIRED'));
        const paymentError =
          response.status === 402
            ? data?.details ||
              data?.error ||
              nextPaymentRequired?.error ||
              paymentDetails?.error ||
              'Payment was not accepted by the resource server'
            : data?.error;

        if (
          response.status === 402 &&
          paymentError &&
          SETTLE_RETRYABLE_ERRORS.has(paymentError) &&
          attempt < MAX_SETTLE_RETRIES
        ) {
          console.warn('[PremiumActionX402] Retrying payment settlement:', {
            attempt: attempt + 1,
            error: paymentError,
          });
          await sleep(1200 * (attempt + 1));
          return attemptPayment(attempt + 1);
        }

        return {
          response,
          data,
          payment,
          paymentRequired: nextPaymentRequired,
          error: paymentError,
        };
      };

      const { response, data, payment, paymentRequired: retryPaymentRequired, error: paymentError } =
        await attemptPayment(0);
      if (payment) {
        setLastPayment(payment);
      }

      return {
        success: response.ok,
        status: response.status,
        data,
        error: paymentError,
        requiresPayment: response.status === 402,
        paymentDetails: retryPaymentRequired || paymentDetails,
        payment,
      };
    } catch (requestError: any) {
      console.error('[PremiumActionX402] unlockWithPayment failed:', requestError);
      const message = extractErrorMessage(requestError, 'Failed to unlock premium action');
      setError(message);
      return {
        success: false,
        status: 500,
        error: message,
      };
    } finally {
      setIsLoading(false);
    }
  }, [client, config.apiUrl]);

  return {
    detectPayment,
    unlockWithPayment,
    isLoading,
    error,
    lastPayment,
  };
}
