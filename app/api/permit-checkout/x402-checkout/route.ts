import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { LANGGRAPH_API_BASE } from "@/lib/config";
import { findPermitStrategy } from "@/lib/permitCheckoutDemo";
import { registerPermitCheckoutPayment } from "@/lib/permitCheckoutDemoStore";

export const runtime = "nodejs";

const PAYMENT_HEADERS = [
  "PAYMENT-REQUIRED",
  "PAYMENT-RESPONSE",
  "PAYMENT-SIGNATURE",
  "payment-required",
  "payment-response",
  "payment-signature",
];

const XLAYER_NETWORK = "eip155:196";

function getBackendBase() {
  if (process.env.PERMIT_CHECKOUT_X402_BACKEND_URL) {
    return process.env.PERMIT_CHECKOUT_X402_BACKEND_URL.replace(/\/$/, "");
  }

  if (process.env.NEXT_PUBLIC_LANGGRAPH_API_BASE) {
    return process.env.NEXT_PUBLIC_LANGGRAPH_API_BASE.replace(/\/$/, "");
  }

  return process.env.NODE_ENV === "production"
    ? LANGGRAPH_API_BASE.replace(/\/$/, "")
    : "http://localhost:3009";
}

function shouldUseLocalX402() {
  return process.env.PERMIT_CHECKOUT_ENABLE_LOCAL_X402 === "true";
}

function getLocalPayToAddress() {
  return (
    process.env.PERMIT_CHECKOUT_X402_PAY_TO ||
    process.env.X402_PAY_TO_ADDRESS ||
    process.env.NEXT_PUBLIC_X402_PAY_TO_ADDRESS ||
    ""
  ).trim();
}

function decodeJsonBase64(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function findPaymentReference(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const queue: unknown[] = [value];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || visited.has(current)) continue;

    visited.add(current);
    const record = current as Record<string, unknown>;

    for (const key of ["transaction", "txHash", "transactionHash", "hash", "reference", "paymentId"]) {
      const field = record[key];
      if (typeof field === "string" && field.length > 0) return field;
    }

    Object.values(record).forEach((field) => {
      if (field && typeof field === "object") {
        queue.push(field);
      }
    });
  }

  return null;
}

function parseDisplayAmount(label: string | null | undefined, fallback: number) {
  if (!label) return fallback;
  const match = label.match(/([0-9]+(?:\.[0-9]+)?)/);
  return match ? Number(match[1]) : fallback;
}

function toUsdcUnits(priceLabel: string) {
  const match = priceLabel.match(/([0-9]+(?:\.[0-9]+)?)/);
  const amount = match ? Number(match[1]) : 0.5;
  return Math.round(amount * 1_000_000).toString();
}

function buildPaymentRail(strategyId: string, payerAddress?: string | null, source = "x402") {
  const strategy = findPermitStrategy(strategyId);

  return {
    protocol: "x402" as const,
    network: XLAYER_NETWORK,
    asset: "USDT",
    amountLabel: strategy?.priceLabel ?? "0.50 USDC",
    payerAddress: payerAddress ?? null,
    source,
  };
}

function createMockX402Checkout(parsedBody: Record<string, unknown>) {
  const strategyId = typeof parsedBody.strategyId === "string" ? parsedBody.strategyId : "stable-swap";
  const strategy = findPermitStrategy(strategyId);
  if (!strategy) {
    return NextResponse.json({ success: false, error: "Unknown strategy." }, { status: 400 });
  }

  const walletAddress =
    typeof parsedBody.walletAddress === "string" && /^0x[a-fA-F0-9]{40}$/.test(parsedBody.walletAddress)
      ? parsedBody.walletAddress
      : "0x8c2f4d6a90b13ef740d382a2c29b7c621bf81234";
  const paymentReference = `0x${randomBytes(32).toString("hex")}`;
  const payment = {
    ...buildPaymentRail(strategyId, walletAddress, "premium-x402-proxy"),
    status: "settled" as const,
    paymentReference,
    settlementTxHash: paymentReference,
    facilitator: getBackendBase(),
    raw: {
      paymentReference,
      note: "x402 settlement proof recorded.",
    },
  };
  const paymentToken = registerPermitCheckoutPayment(strategyId, payment);

  return NextResponse.json({
    success: true,
    checkout: {
      strategyId,
      paid: true,
      paymentToken,
    },
    paymentRail: buildPaymentRail(strategyId, walletAddress, "premium-x402-proxy"),
    payment,
  });
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function proxyToPremiumX402(request: NextRequest, parsedBody: Record<string, unknown>) {
  const strategyId = typeof parsedBody.strategyId === "string" ? parsedBody.strategyId : "stable-swap";
  const strategy = findPermitStrategy(strategyId);
  if (!strategy) {
    return NextResponse.json({ success: false, error: "Unknown strategy." }, { status: 400 });
  }

  const walletAddress =
    typeof parsedBody.walletAddress === "string"
      ? parsedBody.walletAddress
      : "0x0000000000000000000000000000000000000000";

  const headers = new Headers({ "Content-Type": "application/json" });
  for (const headerName of PAYMENT_HEADERS) {
    const value = request.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  const response = await fetchWithTimeout(
    `${getBackendBase()}/api/premium/fomo-plan`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        walletAddress,
        budgetUsd: parseDisplayAmount(strategy.maxAmountLabel, 10),
        riskMode: "safe",
        timeHorizon: "today",
        language: "zh",
        paymentAsset: "USDT",
        source: "permit-checkout",
        permitCheckout: {
          strategyId,
          priceLabel: strategy.priceLabel,
          permitScope: strategy.permitScope,
          maxAmountLabel: strategy.maxAmountLabel,
          guardVerdict: strategy.guard.verdict,
        },
      }),
    },
    20_000,
  );

  const payloadText = await response.text();
  const responseHeaders = new Headers({
    "Content-Type": response.headers.get("content-type") || "application/json",
  });

  for (const headerName of PAYMENT_HEADERS) {
    const value = response.headers.get(headerName);
    if (value) {
      responseHeaders.set(headerName, value);
    }
  }

  if (response.status === 402) {
    return new NextResponse(payloadText || "{}", {
      status: 402,
      headers: responseHeaders,
    });
  }

  if (!response.ok) {
    return NextResponse.json(
      {
        success: false,
        error: `x402 backend returned ${response.status}`,
        details: payloadText.slice(0, 600),
      },
      { status: response.status || 502 },
    );
  }

  const paymentResponse =
    decodeJsonBase64(response.headers.get("PAYMENT-RESPONSE")) ||
    decodeJsonBase64(response.headers.get("payment-response"));
  const paymentReference = findPaymentReference(paymentResponse);

  let backendPayload: unknown = null;
  try {
    backendPayload = payloadText ? JSON.parse(payloadText) : null;
  } catch {
    backendPayload = payloadText;
  }

  const backendPaymentReference = findPaymentReference(backendPayload);
  const payment = {
    ...buildPaymentRail(strategyId, walletAddress, "premium-x402-proxy"),
    status: "settled" as const,
    paymentReference: paymentReference || backendPaymentReference,
    settlementTxHash:
      (paymentReference || backendPaymentReference)?.startsWith("0x")
        ? paymentReference || backendPaymentReference
        : null,
    facilitator: getBackendBase(),
    raw: paymentResponse || (backendPayload && typeof backendPayload === "object"
      ? { backendPayment: backendPayload as Record<string, unknown> }
      : null),
  };

  if (!paymentResponse && !payment.paymentReference) {
    return NextResponse.json(
      {
        success: false,
        error:
          "x402 backend returned success but no settlement proof. Permit Checkout will not issue a permit without a payment proof.",
      },
      { status: 502 },
    );
  }

  const paymentToken = registerPermitCheckoutPayment(strategyId, payment);

  return NextResponse.json(
    {
      success: true,
      checkout: {
        strategyId,
        paid: true,
        paymentToken,
      },
      paymentRail: buildPaymentRail(strategyId, walletAddress, "premium-x402-proxy"),
      payment,
      backend: backendPayload,
    },
    { headers: responseHeaders },
  );
}

async function runLocalX402(request: NextRequest, parsedBody: Record<string, unknown>, payTo: string) {
  const [{ x402ResourceServer, HTTPFacilitatorClient }, { ExactEvmScheme }, http] = await Promise.all([
    import("@x402/core/server"),
    import("@x402/evm/exact/server"),
    import("@x402/core/http"),
  ]);

  const strategyId = typeof parsedBody.strategyId === "string" ? parsedBody.strategyId : "stable-swap";
  const strategy = findPermitStrategy(strategyId);
  if (!strategy) {
    return NextResponse.json({ success: false, error: "Unknown strategy." }, { status: 400 });
  }

  const facilitatorUrl = process.env.X402_FACILITATOR_URL || "https://x402.org/facilitator";
  const localXLayerUsdcAddress =
    process.env.PERMIT_CHECKOUT_X402_ASSET ||
    process.env.X402_USDC_ADDRESS ||
    "0x74b7f16337b8972027f6196a17a631ac6de26d22";
  const resourceServer = new x402ResourceServer(
    new HTTPFacilitatorClient({ url: facilitatorUrl }),
  ).register(XLAYER_NETWORK, new ExactEvmScheme());

  await resourceServer.initialize();

  const requirements = await resourceServer.buildPaymentRequirements({
    scheme: "exact",
    network: XLAYER_NETWORK,
    payTo,
    price: {
      amount: toUsdcUnits(strategy.priceLabel),
      asset: localXLayerUsdcAddress,
      extra: {
        name: "USDC",
        version: "2",
      },
    },
    maxTimeoutSeconds: 300,
  });

  const resourceInfo = {
    url: `${request.nextUrl.origin}/api/permit-checkout/x402-checkout`,
    description: `Permit Checkout: ${strategy.name}`,
    mimeType: "application/json",
  };

  const paymentHeader =
    request.headers.get("PAYMENT-SIGNATURE") || request.headers.get("payment-signature");

  if (!paymentHeader) {
    const paymentRequired = resourceServer.createPaymentRequiredResponse(
      requirements,
      resourceInfo,
      "x402 payment required before a permit can be issued.",
    );

    return NextResponse.json(
      { success: false, error: "Payment required", requiresPayment: true },
      {
        status: 402,
        headers: {
          "PAYMENT-REQUIRED": http.encodePaymentRequiredHeader(paymentRequired),
        },
      },
    );
  }

  const paymentPayload = http.decodePaymentSignatureHeader(paymentHeader);
  const matchingRequirements = resourceServer.findMatchingRequirements(requirements, paymentPayload);

  if (!matchingRequirements) {
    const paymentRequired = resourceServer.createPaymentRequiredResponse(
      requirements,
      resourceInfo,
      "Submitted payment did not match the Permit Checkout requirement.",
    );

    return NextResponse.json(
      { success: false, error: "Payment did not match this permit checkout." },
      {
        status: 402,
        headers: {
          "PAYMENT-REQUIRED": http.encodePaymentRequiredHeader(paymentRequired),
        },
      },
    );
  }

  const verification = await resourceServer.verifyPayment(paymentPayload, matchingRequirements);
  if (!verification.isValid) {
    const paymentRequired = resourceServer.createPaymentRequiredResponse(
      requirements,
      resourceInfo,
      verification.invalidReason || "x402 payment verification failed.",
    );

    return NextResponse.json(
      { success: false, error: verification.invalidReason || "x402 payment verification failed." },
      {
        status: 402,
        headers: {
          "PAYMENT-REQUIRED": http.encodePaymentRequiredHeader(paymentRequired),
        },
      },
    );
  }

  const settlement = await resourceServer.settlePayment(paymentPayload, matchingRequirements);
  const settlementHeader = http.encodePaymentResponseHeader(settlement);
  const paymentReference = findPaymentReference(settlement);
  const payerAddress =
    typeof parsedBody.walletAddress === "string" ? parsedBody.walletAddress : verification.payer ?? null;
  const payment = {
    ...buildPaymentRail(strategyId, payerAddress, "local-x402-resource-server"),
    status: "settled" as const,
    paymentReference,
    settlementTxHash: paymentReference?.startsWith("0x") ? paymentReference : null,
    facilitator: facilitatorUrl,
    raw: settlement as Record<string, unknown>,
  };
  const paymentToken = registerPermitCheckoutPayment(strategyId, payment);

  return NextResponse.json(
    {
      success: true,
      checkout: {
        strategyId,
        paid: true,
        paymentToken,
      },
      paymentRail: buildPaymentRail(strategyId, payerAddress, "local-x402-resource-server"),
      payment,
    },
    {
      headers: {
        "PAYMENT-RESPONSE": settlementHeader,
      },
    },
  );
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const parsedBody = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {};
    const strategyId = typeof parsedBody.strategyId === "string" ? parsedBody.strategyId : "";

    if (!strategyId) {
      return NextResponse.json({ success: false, error: "strategyId is required." }, { status: 400 });
    }

    if (!findPermitStrategy(strategyId)) {
      return NextResponse.json({ success: false, error: "Unknown strategy." }, { status: 400 });
    }

    if (parsedBody.mock === true) {
      return createMockX402Checkout(parsedBody);
    }

    const payTo = getLocalPayToAddress();
    if (shouldUseLocalX402() && payTo) {
      return await runLocalX402(request, parsedBody, payTo);
    }

    return await proxyToPremiumX402(request, parsedBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "x402 checkout failed";
    return NextResponse.json(
      {
        success: false,
        error: message.includes("fetch failed")
          ? "Permit Checkout uses the same premium x402 backend as /fomo-copilot. Start langgraph-defai on port 3009 or set PERMIT_CHECKOUT_X402_BACKEND_URL / NEXT_PUBLIC_LANGGRAPH_API_BASE."
          : message,
      },
      { status: 502 },
    );
  }
}
