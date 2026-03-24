export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
export const SAMPLE_WALLET_ADDRESS =
  "BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn";

export type TodaysOrdersStance =
  | "deploy"
  | "defend"
  | "observe"
  | "watch-only";

export interface TodaysOrdersHolding {
  mint: string;
  symbol: string;
  name: string;
  icon: string | null;
  balance: number;
  decimals: number;
  usdPrice: number | null;
  valueUsd: number;
  allocationPct: number;
  priceChange24hPct: number | null;
  liquidityUsd: number | null;
  isStable: boolean;
}

export interface TodaysOrdersSummary {
  totalValueUsd: number;
  nativeSol: number;
  tokenCount: number;
  stablecoinPct: number;
  concentrationPct: number;
  idleCapitalUsd: number;
  pricedHoldingCount: number;
}

export interface TodaysOrdersIntel {
  stance: TodaysOrdersStance;
  headline: string;
  summary: string;
  bullets: string[];
}

export interface TodaysOrdersOrder {
  status: "approved" | "watch-only";
  title: string;
  thesis: string;
  command: string;
  fromSymbol?: string;
  toSymbol?: string;
  fromAmount?: number;
  inputValueUsd?: number;
}

export interface TodaysOrdersForbiddenOrder {
  title: string;
  thesis: string;
  command: string;
  riskTag: string;
}

export interface TodaysOrdersExecutionPreview {
  status: "ready" | "preview" | "unavailable";
  title: string;
  summary: string;
  route: string[];
  estimatedOutput?: string;
  expectedValueUsd?: number;
  slippageBps?: number;
  priceImpactPct?: number | null;
}

export interface TodaysOrdersExecutionPlan {
  inputMint: string;
  outputMint: string;
  inputSymbol: string;
  outputSymbol: string;
  inputAmount: number;
  inputAmountAtomic: string;
  quoteResponse: Record<string, any>;
}

export interface TodaysOrdersDebrief {
  mode: "preview" | "watch-only" | "executed";
  title: string;
  summary: string;
  bullets: string[];
}

export interface TodaysOrdersSources {
  wallet: string;
  market: string;
  trade: string;
  receipt: string;
}

export interface TodaysOrdersResponse {
  ok: true;
  walletAddress: string;
  generatedAt: string;
  sources: TodaysOrdersSources;
  summary: TodaysOrdersSummary;
  holdings: TodaysOrdersHolding[];
  todayIntel: TodaysOrdersIntel;
  approvedOrder: TodaysOrdersOrder;
  forbiddenOrder: TodaysOrdersForbiddenOrder;
  executionPreview: TodaysOrdersExecutionPreview;
  executionPlan: TodaysOrdersExecutionPlan | null;
  nightDebrief: TodaysOrdersDebrief;
}

export const KNOWN_TOKEN_MAP: Record<
  string,
  { symbol: string; name: string; icon: string | null; isStable?: boolean }
> = {
  [SOL_MINT]: {
    symbol: "SOL",
    name: "Solana",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  [USDC_MINT]: {
    symbol: "USDC",
    name: "USD Coin",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    isStable: true,
  },
  [USDT_MINT]: {
    symbol: "USDT",
    name: "Tether USD",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
    isStable: true,
  },
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: {
    symbol: "BONK",
    name: "Bonk",
    icon: "https://assets.coingecko.com/coins/images/28600/standard/bonk.jpg",
  },
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: {
    symbol: "JUP",
    name: "Jupiter",
    icon: "https://assets.coingecko.com/coins/images/34188/standard/jup.png",
  },
  jtojtomepa8beP8AuQc6eXt5FriJwfFMwVq5DG7JmCL: {
    symbol: "JTO",
    name: "Jito",
    icon: "https://assets.coingecko.com/coins/images/33228/standard/jto.png",
  },
};

export const STABLE_MINTS = new Set(
  Object.entries(KNOWN_TOKEN_MAP)
    .filter(([, token]) => token.isStable)
    .map(([mint]) => mint),
);

export function shortMint(mint: string) {
  if (mint.length <= 10) {
    return mint;
  }

  return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
}
