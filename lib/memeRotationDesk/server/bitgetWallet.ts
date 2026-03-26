import "server-only";

import { createHmac } from "crypto";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface BitgetCredentialSet {
  apiKey: string;
  apiSecret: string;
  partnerCode: string;
  label: string;
}

interface RequestOptions {
  timeoutMs?: number;
  swapRoute?: boolean;
}

export class BitgetTransportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BitgetTransportError";
  }
}

export class BitgetApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "BitgetApiError";
    this.statusCode = statusCode;
  }
}

const DEFAULT_BASE_URL = "https://bopenapi.bgwapi.io";
const DEFAULT_PARTNER_CODE = "bgw_swap_public";

const DEMO_CREDENTIALS: BitgetCredentialSet = {
  apiKey: "4843D8C3F1E20772C0E634EDACC5C5F9A0E2DC92",
  apiSecret: "F2ABFDC684BDC6775FD6286B8D06A3AAD30FD587",
  partnerCode: DEFAULT_PARTNER_CODE,
  label: "public-demo",
};

function stableSort(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => stableSort(item));
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = stableSort((value as Record<string, JsonValue>)[key]);
          return acc;
        },
        {} as Record<string, JsonValue>,
      );
  }

  return value;
}

function stableStringify(value: JsonValue) {
  return JSON.stringify(stableSort(value));
}

function resolveCredentialSets(): BitgetCredentialSet[] {
  const envKey = process.env.BGW_API_KEY;
  const envSecret = process.env.BGW_API_SECRET;
  const envPartnerCode = process.env.BGW_PARTNER_CODE || DEFAULT_PARTNER_CODE;
  const envSet =
    envKey && envSecret
      ? [
          {
            apiKey: envKey,
            apiSecret: envSecret,
            partnerCode: envPartnerCode,
            label: "env",
          },
        ]
      : [];

  return [...envSet, DEMO_CREDENTIALS];
}

function signRequest(
  apiKey: string,
  apiSecret: string,
  path: string,
  bodyString: string,
  timestamp: string,
) {
  const payload = stableStringify({
    apiPath: path,
    body: bodyString,
    "x-api-key": apiKey,
    "x-api-timestamp": timestamp,
  });

  return createHmac("sha256", apiSecret).update(payload).digest("base64");
}

async function performRequest<T>(
  credentials: BitgetCredentialSet,
  path: string,
  body?: Record<string, unknown>,
  options?: RequestOptions,
) {
  const timeoutMs = options?.timeoutMs ?? 8000;
  const bodyString = body ? stableStringify(body as JsonValue) : "";
  const timestamp = String(Date.now());
  const signature = signRequest(
    credentials.apiKey,
    credentials.apiSecret,
    path,
    bodyString,
    timestamp,
  );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${process.env.BGW_API_BASE || DEFAULT_BASE_URL}${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": credentials.apiKey,
          "x-api-timestamp": timestamp,
          "x-api-signature": signature,
          ...(options?.swapRoute ? { "Partner-Code": credentials.partnerCode } : {}),
        },
        body: bodyString || undefined,
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new BitgetApiError(
        payload?.msg || payload?.message || `Bitget HTTP ${response.status}`,
        response.status,
      );
    }

    const status = payload?.status ?? payload?.code ?? payload?.errCode;
    const normalizedStatus =
      typeof status === "string" ? status.toLowerCase() : status;
    const success =
      typeof normalizedStatus === "undefined" ||
      normalizedStatus === 0 ||
      normalizedStatus === "0" ||
      normalizedStatus === 200 ||
      normalizedStatus === "200" ||
      normalizedStatus === "success" ||
      normalizedStatus === "ok";

    if (!success) {
      throw new BitgetApiError(
        payload?.msg ||
          payload?.message ||
          payload?.error ||
          `Bitget business error: ${String(status)}`,
      );
    }

    return payload as T;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new BitgetTransportError("Bitget request timed out");
    }

    if (error instanceof BitgetApiError) {
      throw error;
    }

    throw new BitgetTransportError(error?.message || "Bitget request failed");
  } finally {
    clearTimeout(timer);
  }
}

async function requestWithFallback<T>(
  path: string,
  body?: Record<string, unknown>,
  options?: RequestOptions,
) {
  const credentials = resolveCredentialSets();
  let lastError: Error | null = null;

  for (const set of credentials) {
    try {
      return await performRequest<T>(set, path, body, options);
    } catch (error: any) {
      lastError = error;

      if (
        error instanceof BitgetTransportError ||
        (error instanceof BitgetApiError &&
          error.statusCode !== 401 &&
          error.statusCode !== 403)
      ) {
        break;
      }
    }
  }

  throw lastError || new BitgetTransportError("Bitget request failed");
}

export function isBitgetNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error instanceof BitgetTransportError ||
    /ENOTFOUND|network|timed out|fetch failed/i.test(error.message)
  );
}

export const bitgetWalletClient = {
  rankings(name: string) {
    return requestWithFallback<Record<string, any>>(
      "/bgw-pro/market/v3/topRank/detail",
      { name },
    );
  },

  batchTokenInfo(list: Array<{ chain: string; contract: string }>) {
    return requestWithFallback<Record<string, any>>(
      "/bgw-pro/market/v3/coin/batchGetBaseInfo",
      { list },
    );
  },

  securityAudit(list: Array<{ chain: string; contract: string }>) {
    return requestWithFallback<Record<string, any>>(
      "/bgw-pro/market/v3/coin/security/audits",
      { list, source: "bg" },
    );
  },

  liquidity(chain: string, contract: string) {
    return requestWithFallback<Record<string, any>>(
      "/bgw-pro/market/v3/poolList",
      { chain, contract },
    );
  },

  swapQuote(body: {
    fromChain: string;
    fromContract: string;
    toChain: string;
    toContract: string;
    fromAmount: string;
    fromAddress?: string;
    fromSymbol?: string;
    toSymbol?: string;
  }) {
    return requestWithFallback<Record<string, any>>(
      "/bgw-pro/swapx/pro/quote",
      body,
      { swapRoute: true },
    );
  },

  swapCalldata(body: {
    fromChain: string;
    fromContract: string;
    toChain: string;
    toContract: string;
    fromAmount: string;
    fromAddress: string;
    toAddress: string;
    market: string;
    fromSymbol?: string;
    toSymbol?: string;
  }) {
    return requestWithFallback<Record<string, any>>(
      "/bgw-pro/swapx/pro/swap",
      body,
      { swapRoute: true, timeoutMs: 12000 },
    );
  },

  orderQuote(body: {
    fromChain: string;
    fromContract: string;
    fromAmount: string;
    toChain: string;
    toContract: string;
    fromAddress: string;
    toAddress?: string;
  }) {
    return requestWithFallback<Record<string, any>>(
      "/bgw-pro/swapx/order/getSwapPrice",
      body,
      { swapRoute: true },
    );
  },

  orderCreate(body: {
    fromChain: string;
    fromContract: string;
    fromAmount: string;
    toChain: string;
    toContract: string;
    fromAddress: string;
    toAddress: string;
    market: string;
    slippage?: string;
    feature?: string;
  }) {
    return requestWithFallback<Record<string, any>>(
      "/bgw-pro/swapx/order/makeSwapOrder",
      body,
      { swapRoute: true, timeoutMs: 12000 },
    );
  },

  orderStatus(orderId: string) {
    return requestWithFallback<Record<string, any>>(
      "/bgw-pro/swapx/order/getSwapOrder",
      { orderId },
      { swapRoute: true },
    );
  },
};
