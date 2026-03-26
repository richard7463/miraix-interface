import { SAMPLE_WALLET_ADDRESS } from "@/lib/todaysOrders";

export const SAMPLE_ROTATION_WALLET = SAMPLE_WALLET_ADDRESS;

export type DeskRiskMode = "safe" | "balanced" | "degen";
export type DeskStrategy = "momentum" | "reversal" | "shadow";
export type DeskAgentStatus = "ready" | "watch" | "blocked";
export type DeskCandidateVerdict = "approve" | "watch" | "ban";
export type DeskDataMode = "live" | "fallback";
export type DeskExecutionMode = "order" | "swap" | "demo";
export type DeskExecutionState = "ready" | "preview" | "unavailable";

export interface DeskMetric {
  label: string;
  value: string;
}

export interface DeskAgentStep {
  id: "scout" | "risk" | "trader";
  name: string;
  role: string;
  status: DeskAgentStatus;
  verdict: string;
  detail: string;
  metrics: DeskMetric[];
}

export interface DeskCandidate {
  symbol: string;
  name: string;
  narrative: string;
  momentum24hPct: number;
  volumeScore: number;
  liquidityScore: number;
  safetyScore: number;
  devScore: number;
  verdict: DeskCandidateVerdict;
  courtNote: string;
  chain?: string;
  contract?: string;
  icon?: string | null;
  priceUsd?: number | null;
  marketCapUsd?: number | null;
  riskLevel?: string | null;
}

export interface DeskExecutionQuote {
  state: DeskExecutionState;
  mode: DeskExecutionMode;
  source: string;
  market?: string;
  estimatedOutput?: string;
  outputSymbol?: string;
  priceImpactPct?: number | null;
  slippage?: string | null;
  feeUsd?: number | null;
  canPrepare: boolean;
  warnings: string[];
}

export interface DeskApprovedTrade {
  symbol: string;
  name: string;
  amountUsd: number;
  allocationPct: number;
  inputAsset: string;
  entryWindow: string;
  invalidation: string;
  takeProfits: string[];
  rationale: string;
  command: string;
  route: string[];
  chain: string;
  inputContract: string;
  outputContract?: string;
}

export interface DeskMarketContext {
  title: string;
  summary: string;
  confidence: number;
  deskBias: string;
  scoutUniverse: number;
}

export interface DeskProofBundle {
  note: string;
  checklist: string[];
  warnings?: string[];
}

export interface DeskPreparedExecution {
  prepared: boolean;
  mode: DeskExecutionMode;
  source: string;
  summary: string;
  nextAction: string;
  status?: string;
  orderId?: string;
  txCount?: number;
  signatureCount?: number;
  payloadPreview?: string[];
  statusTrail?: string[];
}

export interface DeskResponse {
  ok: true;
  previewMode: boolean;
  dataMode: DeskDataMode;
  provider: string;
  generatedAt: string;
  walletAddress: string;
  budgetUsd: number;
  riskMode: DeskRiskMode;
  strategy: DeskStrategy;
  warnings: string[];
  marketContext: DeskMarketContext;
  agents: DeskAgentStep[];
  candidates: DeskCandidate[];
  vetoedSymbols: string[];
  approvedTrade: DeskApprovedTrade;
  execution: DeskExecutionQuote;
  proofBundle: DeskProofBundle;
}
