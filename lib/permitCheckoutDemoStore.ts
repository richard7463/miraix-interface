import "server-only";

import {
  PermitCheckoutFeedEvent,
  PermitCheckoutGuardRun,
  PermitCheckoutPayment,
  PermitCheckoutReceipt,
  PermitCheckoutRun,
  PermitCheckoutStatePayload,
  PermitCheckoutTimelineStep,
  ReceiptMode,
  findPermitStrategy,
  formatDemoTime,
  initialPermitCheckoutFeed,
  permitCheckoutStrategies,
  permitCheckoutWalletStatus,
} from "@/lib/permitCheckoutDemo";

type StoreShape = {
  currentRun: PermitCheckoutRun | null;
  recentEvents: PermitCheckoutFeedEvent[];
  pendingPayments: Record<
    string,
    {
      strategyId: string;
      payment: PermitCheckoutPayment;
      createdAt: string;
    }
  >;
};

const globalStore = globalThis as typeof globalThis & {
  __permitCheckoutDemoStore?: StoreShape;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getStore() {
  if (!globalStore.__permitCheckoutDemoStore) {
    globalStore.__permitCheckoutDemoStore = {
      currentRun: null,
      recentEvents: clone(initialPermitCheckoutFeed),
      pendingPayments: {},
    };
  }

  return globalStore.__permitCheckoutDemoStore;
}

function createId(prefix: string) {
  const suffix = Math.random().toString(16).slice(2, 10);
  return `${prefix}_${suffix}`;
}

function truncateHash(value: string | null | undefined) {
  if (!value) return null;
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function createTimeline(nowIso: string, strategyName: string, priceLabel: string, permitId: string) {
  return [
    {
      id: "payment",
      label: "Payment confirmed",
      status: "complete",
      at: nowIso,
      note: `${priceLabel} settled through x402 before the permit was issued.`,
    },
    {
      id: "ticket",
      label: "Execution ticket issued",
      status: "complete",
      at: nowIso,
      note: `${permitId} created for ${strategyName}.`,
    },
    {
      id: "guard",
      label: "Guard review",
      status: "active",
      at: null,
      note: "Waiting for guard run.",
    },
    {
      id: "receipt",
      label: "Receipt stored",
      status: "pending",
      at: null,
      note: "No proof packet has been stored yet.",
    },
  ] as PermitCheckoutTimelineStep[];
}

function createIdleGuard(): PermitCheckoutGuardRun {
  return {
    status: "idle",
    startedAt: null,
    completedAt: null,
    verdict: null,
    risk: null,
    reason: null,
    route: null,
    priceImpact: null,
    proofId: null,
    checks: [],
    allowedAmountLabel: null,
  };
}

function buildStatePayload(): PermitCheckoutStatePayload {
  const store = getStore();

  return {
    strategies: permitCheckoutStrategies,
    recentEvents: clone(store.recentEvents),
    walletStatus: permitCheckoutWalletStatus,
    currentRun: clone(store.currentRun),
  };
}

export function getPermitCheckoutState() {
  return buildStatePayload();
}

export function resetPermitCheckoutState() {
  const store = getStore();
  store.currentRun = null;

  return buildStatePayload();
}

export function registerPermitCheckoutPayment(strategyId: string, payment: PermitCheckoutPayment) {
  const store = getStore();
  const checkoutToken = createId("pay");

  store.pendingPayments[checkoutToken] = {
    strategyId,
    payment,
    createdAt: new Date().toISOString(),
  };

  return checkoutToken;
}

export function consumePermitCheckoutPayment(strategyId: string, checkoutToken: string) {
  const store = getStore();
  const entry = store.pendingPayments[checkoutToken];

  if (!entry) {
    throw new Error("x402 checkout token was not found or has already been used.");
  }

  if (entry.strategyId !== strategyId) {
    throw new Error("x402 checkout token does not match this strategy.");
  }

  delete store.pendingPayments[checkoutToken];
  return clone(entry.payment);
}

export function getActivePermitCheckoutRun(permitId: string) {
  const store = getStore();
  const run = store.currentRun;

  if (!run || run.permitId !== permitId) {
    return null;
  }

  return clone(run);
}

export function createPermitCheckoutRun(strategyId: string, payment: PermitCheckoutPayment) {
  const strategy = findPermitStrategy(strategyId);
  if (!strategy) {
    throw new Error("Unknown strategy.");
  }

  if (!payment || payment.status !== "settled") {
    throw new Error("x402 payment must be settled before a permit can be issued.");
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const permitId = createId("permit");
  const ticketId = createId("ticket");

  const run: PermitCheckoutRun = {
    runId: createId("run"),
    strategyId: strategy.id,
    stage: "permit",
    createdAt: nowIso,
    walletLabel: permitCheckoutWalletStatus.label,
    priceLabel: strategy.priceLabel,
    networkLabel: strategy.networkLabel,
    permitScope: strategy.permitScope,
    maxAmountLabel: strategy.maxAmountLabel,
    permitId,
    ticketId,
    usageLeft: 1,
    payment,
    paymentConfirmedAt: nowIso,
    ticketIssuedAt: nowIso,
    guard: createIdleGuard(),
    receipt: null,
    timeline: createTimeline(nowIso, strategy.name, strategy.priceLabel, permitId),
  };

  const store = getStore();
  store.currentRun = run;

  return buildStatePayload();
}

export function runPermitCheckoutGuard(permitId: string) {
  const store = getStore();
  const run = store.currentRun;

  if (!run || run.permitId !== permitId) {
    throw new Error("No active permit run was found.");
  }

  const strategy = findPermitStrategy(run.strategyId);
  if (!strategy) {
    throw new Error("Unknown strategy.");
  }

  const startedAt = new Date();
  const completedAt = new Date();
  const proofId = createId(`proof_${strategy.guard.verdict}`);

  run.guard = {
    status: "done",
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    verdict: strategy.guard.verdict,
    risk: strategy.guard.risk,
    reason: strategy.guard.reason,
    route: strategy.guard.route,
    priceImpact: strategy.guard.priceImpact,
    proofId,
    checks: clone(strategy.guard.checks),
    allowedAmountLabel: strategy.guard.allowedAmountLabel ?? null,
  };

  run.timeline = run.timeline.map((step) => {
    if (step.id !== "guard") return step;

    return {
      ...step,
      status: strategy.guard.verdict === "block" ? "blocked" : "complete",
      at: completedAt.toISOString(),
      note:
        strategy.guard.verdict === "resize"
          ? `Guard resized the action to ${strategy.guard.allowedAmountLabel}.`
          : strategy.guard.verdict === "block"
            ? "Guard blocked the action before execution."
            : "Guard approved the action for execution.",
    };
  });

  run.stage = "permit";

  return buildStatePayload();
}

export function storePermitCheckoutReceipt(permitId: string, mode?: ReceiptMode) {
  const store = getStore();
  const run = store.currentRun;

  if (!run || run.permitId !== permitId) {
    throw new Error("No active permit run was found.");
  }

  const strategy = findPermitStrategy(run.strategyId);
  if (!strategy) {
    throw new Error("Unknown strategy.");
  }

  if (!run.guard.proofId || !run.guard.verdict) {
    throw new Error("Run the guard before storing a receipt.");
  }

  const receiptMode =
    mode ??
    (run.guard.verdict === "resize"
      ? "resized"
      : run.guard.verdict === "block"
        ? "blocked"
        : "executed");

  const createdAt = new Date().toISOString();
  const executionRef =
    receiptMode === "blocked" ? null : createId(receiptMode === "resized" ? "demo_resize" : "demo_exec");

  run.timeline = run.timeline.map((step) => {
    if (step.id !== "receipt") return step;

    return {
      ...step,
      status: receiptMode === "blocked" ? "blocked" : "complete",
      at: createdAt,
      note:
        receiptMode === "blocked"
          ? "Blocked proof stored without any broadcast."
          : receiptMode === "resized"
            ? "Resized receipt stored after demo settlement."
            : "Receipt stored after demo settlement.",
    };
  });

  const receipt: PermitCheckoutReceipt = {
    mode: receiptMode,
    title:
      receiptMode === "blocked"
        ? "Blocked Receipt"
        : receiptMode === "resized"
          ? "Resized Receipt"
          : "Executed Receipt",
    createdAt,
    proofId: run.guard.proofId,
    permitId: run.permitId,
    ticketId: run.ticketId,
    result: strategy.receipt.assetFlow,
    settlementMode: "demo",
    executionRef,
    txHash: null,
    explorerUrl: null,
    broadcastStatus:
      receiptMode === "blocked"
        ? "No broadcast. Guard stopped the action."
        : "Demo settlement stored. Live broadcast is not part of this receipt.",
    settlementNote: strategy.receipt.settlementNote,
    proofBundle: {
      receiptMode,
      strategy: {
        id: strategy.id,
        name: strategy.name,
        creator: strategy.creator,
      },
      permit: {
        permitId: run.permitId,
        ticketId: run.ticketId,
        scope: strategy.permitScope,
        maxAmount: strategy.maxAmountLabel,
      },
      guard: {
        verdict: run.guard.verdict,
        risk: run.guard.risk,
        reason: run.guard.reason,
        route: run.guard.route,
        priceImpact: run.guard.priceImpact,
        proofId: run.guard.proofId,
        allowedAmountLabel: run.guard.allowedAmountLabel,
        checks: run.guard.checks,
      },
      receipt: {
        createdAt,
        result: strategy.receipt.assetFlow,
        executionRef,
        settlementMode: "demo",
        txHash: null,
        explorerUrl: null,
        broadcastStatus:
          receiptMode === "blocked"
            ? "No broadcast. Guard stopped the action."
            : "Demo settlement stored. Live broadcast is not part of this receipt.",
      },
      payment: run.payment,
      timeline: clone(run.timeline),
    },
  };

  run.receipt = receipt;
  run.usageLeft = 0;
  run.stage = "receipt";

  const newEvent: PermitCheckoutFeedEvent = {
    id: createId("feed"),
    occurredAt: createdAt,
    timeLabel: formatDemoTime(createdAt),
    outcome: run.guard.verdict,
    summary:
      receiptMode === "blocked"
        ? `${strategy.name} stopped before any broadcast was created.`
        : receiptMode === "resized"
          ? `${strategy.name} settled after the guard resized the amount.`
          : `${strategy.name} settled inside the original execution envelope.`,
    strategyId: strategy.id,
    strategyName: strategy.name,
    permitId: run.permitId,
    proofId: run.guard.proofId,
  };

  store.recentEvents = [newEvent, ...store.recentEvents].slice(0, 8);

  return buildStatePayload();
}

export type PermitCheckoutLiveExecutionResult = {
  txHash: string;
  explorerUrl: string;
  executionStatus: string;
  proof: Record<string, unknown>;
  resultLabel?: string | null;
};

export function storePermitCheckoutLiveReceipt(
  permitId: string,
  execution: PermitCheckoutLiveExecutionResult,
) {
  const store = getStore();
  const run = store.currentRun;

  if (!run || run.permitId !== permitId) {
    throw new Error("No active permit run was found.");
  }

  const strategy = findPermitStrategy(run.strategyId);
  if (!strategy) {
    throw new Error("Unknown strategy.");
  }

  if (!run.guard.proofId || !run.guard.verdict) {
    throw new Error("Run the guard before live execution.");
  }

  if (run.guard.verdict !== "execute") {
    throw new Error("Only an execute verdict can broadcast with Agentic Wallet.");
  }

  if (!execution.txHash || !execution.txHash.startsWith("0x")) {
    throw new Error("Agentic Wallet did not return a transaction hash.");
  }

  const createdAt = new Date().toISOString();
  const resultLabel = execution.resultLabel || strategy.receipt.assetFlow;
  run.timeline = run.timeline.map((step) => {
    if (step.id !== "receipt") return step;

    return {
      ...step,
      status: "complete",
      at: createdAt,
      note: `Agentic Wallet broadcast confirmed: ${truncateHash(execution.txHash)}.`,
    };
  });

  const receipt: PermitCheckoutReceipt = {
    mode: "executed",
    title: "Live Executed Receipt",
    createdAt,
    proofId: run.guard.proofId,
    permitId: run.permitId,
    ticketId: run.ticketId,
    result: resultLabel,
    settlementMode: "live",
    executionRef: execution.txHash,
    txHash: execution.txHash,
    explorerUrl: execution.explorerUrl,
    broadcastStatus: `Agentic Wallet broadcast confirmed on X Layer: ${truncateHash(execution.txHash)}.`,
    settlementNote: "x402 checkout settled first. The approved permit then executed through Agentic Wallet.",
    proofBundle: {
      receiptMode: "executed",
      strategy: {
        id: strategy.id,
        name: strategy.name,
        creator: strategy.creator,
      },
      permit: {
        permitId: run.permitId,
        ticketId: run.ticketId,
        scope: strategy.permitScope,
        maxAmount: strategy.maxAmountLabel,
      },
      payment: run.payment,
      guard: {
        verdict: run.guard.verdict,
        risk: run.guard.risk,
        reason: run.guard.reason,
        route: run.guard.route,
        priceImpact: run.guard.priceImpact,
        proofId: run.guard.proofId,
        allowedAmountLabel: run.guard.allowedAmountLabel,
        checks: run.guard.checks,
      },
      receipt: {
        createdAt,
        result: resultLabel,
        executionRef: execution.txHash,
        settlementMode: "live",
        txHash: execution.txHash,
        explorerUrl: execution.explorerUrl,
        broadcastStatus: `Agentic Wallet broadcast confirmed on X Layer: ${truncateHash(execution.txHash)}.`,
      },
      agenticWalletProof: execution.proof,
      timeline: clone(run.timeline),
    },
  };

  run.receipt = receipt;
  run.usageLeft = 0;
  run.stage = "receipt";

  const newEvent: PermitCheckoutFeedEvent = {
    id: createId("feed"),
    occurredAt: createdAt,
    timeLabel: formatDemoTime(createdAt),
    outcome: "execute",
    summary: `${strategy.name} broadcast through Agentic Wallet. Tx ${truncateHash(execution.txHash)}.`,
    strategyId: strategy.id,
    strategyName: strategy.name,
    permitId: run.permitId,
    proofId: run.guard.proofId,
  };

  store.recentEvents = [newEvent, ...store.recentEvents].slice(0, 8);

  return buildStatePayload();
}
