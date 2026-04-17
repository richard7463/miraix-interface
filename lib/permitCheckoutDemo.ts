export type JourneyStage = "market" | "checkout" | "permit" | "receipt";
export type GuardVerdict = "execute" | "resize" | "block";
export type ReceiptMode = "executed" | "resized" | "blocked";
export type TimelineStatus = "pending" | "active" | "complete" | "blocked";
export type PermitCheckoutPaymentAsset = "USDT" | "USDC";

export type PermitCheckoutStrategy = {
  id: string;
  name: string;
  creator: string;
  creatorLogo: string;
  description: string;
  priceLabel: string;
  maxAmountLabel: string;
  usageLabel: string;
  expiryLabel: string;
  networkLabel: string;
  permitScope: string;
  demoPathLabel: string;
  tokens: Array<{
    symbol: string;
    icon: string;
  }>;
  guard: {
    verdict: GuardVerdict;
    risk: string;
    reason: string;
    route: string;
    priceImpact: string;
    checks: string[];
    allowedAmountLabel?: string;
  };
  receipt: {
    assetFlow: string;
    settlementNote: string;
  };
};

export type PermitCheckoutWalletStatus = {
  mode: "demo" | "live";
  label: string;
  note: string;
};

export type PermitCheckoutPayment = {
  protocol: "x402";
  status: "settled";
  network: string;
  asset: string;
  amountLabel: string;
  payerAddress: string | null;
  paymentReference: string | null;
  settlementTxHash: string | null;
  facilitator: string | null;
  source: string;
  raw: Record<string, unknown> | null;
};

export type PermitCheckoutFeedEvent = {
  id: string;
  occurredAt: string;
  timeLabel: string;
  outcome: GuardVerdict;
  summary: string;
  strategyId: string;
  strategyName: string;
  permitId: string;
  proofId: string;
};

export type PermitCheckoutTimelineStep = {
  id: "payment" | "ticket" | "guard" | "receipt";
  label: string;
  status: TimelineStatus;
  at: string | null;
  note: string;
};

export type PermitCheckoutGuardRun = {
  status: "idle" | "running" | "done";
  startedAt: string | null;
  completedAt: string | null;
  verdict: GuardVerdict | null;
  risk: string | null;
  reason: string | null;
  route: string | null;
  priceImpact: string | null;
  proofId: string | null;
  checks: string[];
  allowedAmountLabel?: string | null;
};

export type PermitCheckoutReceipt = {
  mode: ReceiptMode;
  title: string;
  createdAt: string;
  proofId: string;
  permitId: string;
  ticketId: string;
  result: string;
  settlementMode: "demo" | "live";
  executionRef: string | null;
  txHash: string | null;
  explorerUrl: string | null;
  broadcastStatus: string;
  settlementNote: string;
  proofBundle: Record<string, unknown>;
};

export const permitCheckoutPaymentOptions: Array<{
  asset: PermitCheckoutPaymentAsset;
  amountLabel: string;
}> = [
  { asset: "USDT", amountLabel: "0.05 USDT" },
  { asset: "USDC", amountLabel: "0.05 USDC" },
];

export type PermitCheckoutRun = {
  runId: string;
  strategyId: string;
  stage: JourneyStage;
  createdAt: string;
  walletLabel: string;
  priceLabel: string;
  networkLabel: string;
  permitScope: string;
  maxAmountLabel: string;
  permitId: string;
  ticketId: string;
  usageLeft: number;
  payment: PermitCheckoutPayment;
  paymentConfirmedAt: string;
  ticketIssuedAt: string;
  guard: PermitCheckoutGuardRun;
  receipt: PermitCheckoutReceipt | null;
  timeline: PermitCheckoutTimelineStep[];
};

export type PermitCheckoutStatePayload = {
  strategies: PermitCheckoutStrategy[];
  recentEvents: PermitCheckoutFeedEvent[];
  walletStatus: PermitCheckoutWalletStatus;
  currentRun: PermitCheckoutRun | null;
};

export const permitCheckoutStrategies: PermitCheckoutStrategy[] = [
  {
    id: "stable-swap",
    name: "Stable Swap Permit",
    creator: "strategy-office",
    creatorLogo: "/agent-logos/todays-orders.svg",
    description:
      "One bounded stable swap for X Layer users who want execution, not full wallet delegation.",
    priceLabel: "0.05 USDT or 0.05 USDC",
    maxAmountLabel: "10 USDC",
    usageLabel: "1 run",
    expiryLabel: "24 hours",
    networkLabel: "X Layer 196",
    permitScope: "USDC -> USDT only",
    demoPathLabel: "Success path",
    tokens: [
      { symbol: "USDC", icon: "/tokens/usdc.png" },
      { symbol: "USDT", icon: "/tokens/usdt.png" },
    ],
    guard: {
      verdict: "execute",
      risk: "Low",
      reason: "Depth is healthy and the expected impact stays inside the stable-swap envelope.",
      route: "QuickSwap V3 -> CurveNG",
      priceImpact: "0.18%",
      checks: [
        "Wallet scope matches the purchased action",
        "Pair stays inside the paid execution envelope",
        "Amount remains under 10 USDC",
        "Route impact stays below the stable cap",
      ],
    },
    receipt: {
      assetFlow: "10 USDC -> 9.98 USDT",
      settlementNote:
        "Demo receipt stored. Live Agentic Wallet broadcast can replace this run later.",
    },
  },
  {
    id: "treasury-rebalance",
    name: "Treasury Rebalance Permit",
    creator: "miraix-treasury",
    creatorLogo: "/agent-logos/warden-bufett.svg",
    description:
      "A guarded treasury action that can shrink itself before execution when route quality degrades.",
    priceLabel: "0.05 USDT or 0.05 USDC",
    maxAmountLabel: "20 USDC",
    usageLabel: "1 run",
    expiryLabel: "12 hours",
    networkLabel: "X Layer 196",
    permitScope: "USDC -> OKB only",
    demoPathLabel: "Resize path",
    tokens: [
      { symbol: "USDC", icon: "/tokens/usdc.png" },
      { symbol: "OKB", icon: "/icons/okb-okb-logo.png" },
    ],
    guard: {
      verdict: "resize",
      risk: "Medium",
      reason: "The route is still acceptable, but current impact is too high for the original paid amount.",
      route: "QuickSwap V3",
      priceImpact: "1.42%",
      allowedAmountLabel: "8 USDC",
      checks: [
        "Wallet scope matches the purchased action",
        "Original amount exceeds the live impact envelope",
        "Guard resized the run to 8 USDC",
        "Execution remains allowed after the resize",
      ],
    },
    receipt: {
      assetFlow: "8 USDC -> 0.118 OKB",
      settlementNote:
        "Demo receipt stored after resized execution. Live mode would ask Agentic Wallet to sign the smaller amount.",
    },
  },
  {
    id: "momentum-entry",
    name: "Momentum Entry Permit",
    creator: "arena-scout",
    creatorLogo: "/agent-logos/kaibot.svg",
    description:
      "A one-shot entry permit that can be stopped before execution when route or policy quality falls outside the envelope.",
    priceLabel: "0.05 USDT or 0.05 USDC",
    maxAmountLabel: "15 USDC",
    usageLabel: "1 run",
    expiryLabel: "6 hours",
    networkLabel: "X Layer 196",
    permitScope: "USDC -> ETH only",
    demoPathLabel: "Block path",
    tokens: [
      { symbol: "USDC", icon: "/tokens/usdc.png" },
      { symbol: "ETH", icon: "/icons/ethereum-eth-logo.png" },
    ],
    guard: {
      verdict: "block",
      risk: "High",
      reason: "Current impact and execution quality fall outside the purchased envelope, so no broadcast is allowed.",
      route: "No safe route",
      priceImpact: ">2.8%",
      checks: [
        "Wallet scope matches the purchased action",
        "Pair matches the paid action",
        "Route quality fails the impact cap",
        "Broadcast is revoked before execution",
      ],
    },
    receipt: {
      assetFlow: "No execution",
      settlementNote:
        "Blocked receipt stored. There is no tx because the guard stopped the action before execution.",
    },
  },
];

export const initialPermitCheckoutFeed: PermitCheckoutFeedEvent[] = [
  {
    id: "feed_execute_seed",
    occurredAt: "2026-04-15T21:46:00.000Z",
    timeLabel: "21:46",
    outcome: "execute",
    summary: "Stable Swap Permit settled inside the original envelope.",
    strategyId: "stable-swap",
    strategyName: "Stable Swap Permit",
    permitId: "permit_seed_execute",
    proofId: "proof_seed_execute",
  },
  {
    id: "feed_resize_seed",
    occurredAt: "2026-04-15T21:31:00.000Z",
    timeLabel: "21:31",
    outcome: "resize",
    summary: "Treasury Rebalance reduced from 20 USDC to 8 USDC before settlement.",
    strategyId: "treasury-rebalance",
    strategyName: "Treasury Rebalance Permit",
    permitId: "permit_seed_resize",
    proofId: "proof_seed_resize",
  },
  {
    id: "feed_block_seed",
    occurredAt: "2026-04-15T21:12:00.000Z",
    timeLabel: "21:12",
    outcome: "block",
    summary: "Momentum Entry stopped before any broadcast was created.",
    strategyId: "momentum-entry",
    strategyName: "Momentum Entry Permit",
    permitId: "permit_seed_block",
    proofId: "proof_seed_block",
  },
];

export const permitCheckoutWalletStatus: PermitCheckoutWalletStatus = {
  mode: "live",
  label: "x402 + Agentic Wallet",
  note: "Checkout is payment-gated with x402. The success path broadcasts through the local Agentic Wallet.",
};

export function findPermitStrategy(strategyId: string) {
  return permitCheckoutStrategies.find((strategy) => strategy.id === strategyId) ?? null;
}

export function formatDemoTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
