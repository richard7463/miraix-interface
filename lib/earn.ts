export type EarnRiskMode = 'safe' | 'balanced' | 'degen'

export interface EarnVaultCard {
  id: string
  address: string
  chainId: number
  chainName: string
  protocolName: string
  name: string
  symbol: string
  assetSymbol: string
  assetAddress: string
  assetDecimals: number
  apy: number
  apy30d?: number | null
  tvlUsd: number
  isTransactional: boolean
  risk: EarnRiskMode
  reasons: string[]
  logoURI?: string | null
  explorerUrl?: string | null
  source: 'live' | 'seeded'
}

export interface EarnQuotePayload {
  action: {
    fromToken: {
      address: string
      chainId: number
      symbol: string
      decimals: number
      name: string
      logoURI?: string
    }
    toToken: {
      address: string
      chainId: number
      symbol: string
      decimals: number
      name: string
      logoURI?: string
    }
    fromAmount: string
    fromChainId: number
    toChainId: number
    fromAddress: string
    toAddress: string
    slippage?: number
  }
  estimate: {
    toAmount: string
    toAmountMin?: string
    approvalAddress?: string
    executionDuration?: number
    gasCosts?: Array<{
      amount: string
      amountUSD?: string
      token: {
        symbol: string
        decimals: number
      }
    }>
  }
  transactionRequest: {
    to: string
    data: string
    value: string
    gasLimit?: string
    gasPrice?: string
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
    chainId?: number | string
  }
}

export interface EarnDiscoveryResponse {
  success: boolean
  message: string
  thoughts: string[]
  data: {
    intent: 'earnVaults'
    response: string
    filters: {
      assetSymbol: string
      chainIds: number[]
      chainLabels: string[]
      riskMode: EarnRiskMode
    }
    action?: {
      mode: 'discover' | 'deposit'
      amountInput?: string | null
      selectedVaultId?: string | null
      selectedChainId?: number | null
      summary?: string
      rationale?: string[]
    }
  }
  quote: {
    vaults: EarnVaultCard[]
    dataSource: 'live' | 'fallback'
    usedFallback: boolean
    fallbackReason?: string
  }
}

export const EARN_CHAIN_IDS = {
  ethereum: 1,
  arbitrum: 42161,
  base: 8453,
} as const

export const EARN_CHAIN_LABELS: Record<number, string> = {
  [EARN_CHAIN_IDS.ethereum]: 'Ethereum',
  [EARN_CHAIN_IDS.arbitrum]: 'Arbitrum',
  [EARN_CHAIN_IDS.base]: 'Base',
}

export const EARN_USDC_BY_CHAIN: Record<number, { address: string; decimals: number }> = {
  [EARN_CHAIN_IDS.ethereum]: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
  },
  [EARN_CHAIN_IDS.arbitrum]: {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    decimals: 6,
  },
  [EARN_CHAIN_IDS.base]: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
  },
}

export const SEEDED_EARN_VAULTS: EarnVaultCard[] = [
  {
    id: 'base-spark-usdc',
    address: '0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A',
    chainId: EARN_CHAIN_IDS.base,
    chainName: 'Base',
    protocolName: 'Spark',
    name: 'Spark USDC Vault',
    symbol: 'sparkUSDC',
    assetSymbol: 'USDC',
    assetAddress: EARN_USDC_BY_CHAIN[EARN_CHAIN_IDS.base].address,
    assetDecimals: 6,
    apy: 0.078,
    apy30d: 0.061,
    tvlUsd: 12000000,
    isTransactional: true,
    risk: 'safe',
    reasons: ['Large TVL', 'Stablecoin strategy', 'Composer deposit supported'],
    explorerUrl: 'https://basescan.org/token/0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A',
    source: 'seeded',
  },
  {
    id: 'arb-aave-ausdc',
    address: '0x724dc807b04555b71ed48a6896b6F41593b8C637',
    chainId: EARN_CHAIN_IDS.arbitrum,
    chainName: 'Arbitrum',
    protocolName: 'Aave V3',
    name: 'Aave Arbitrum USDC',
    symbol: 'aArbUSDCn',
    assetSymbol: 'USDC',
    assetAddress: EARN_USDC_BY_CHAIN[EARN_CHAIN_IDS.arbitrum].address,
    assetDecimals: 6,
    apy: 0.053,
    apy30d: 0.049,
    tvlUsd: 9500000,
    isTransactional: true,
    risk: 'safe',
    reasons: ['Blue-chip lending market', 'Stablecoin collateral', 'Composer deposit supported'],
    explorerUrl: 'https://arbiscan.io/token/0x724dc807b04555b71ed48a6896b6F41593b8C637',
    source: 'seeded',
  },
  {
    id: 'eth-aave-ausdc',
    address: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
    chainId: EARN_CHAIN_IDS.ethereum,
    chainName: 'Ethereum',
    protocolName: 'Aave V3',
    name: 'Aave Ethereum USDC',
    symbol: 'aEthUSDC',
    assetSymbol: 'USDC',
    assetAddress: EARN_USDC_BY_CHAIN[EARN_CHAIN_IDS.ethereum].address,
    assetDecimals: 6,
    apy: 0.045,
    apy30d: 0.041,
    tvlUsd: 23500000,
    isTransactional: true,
    risk: 'safe',
    reasons: ['Deep liquidity', 'Largest Aave market', 'Composer deposit supported'],
    explorerUrl: 'https://etherscan.io/token/0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
    source: 'seeded',
  },
]

export function formatEarnRate(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A'
  }

  return `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`
}

export function formatEarnUsd(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000000 ? 0 : 2,
  }).format(value)
}

export function classifyEarnRisk(apy: number, tvlUsd: number): EarnRiskMode {
  if (apy >= 0.12 || tvlUsd < 500000) {
    return 'degen'
  }

  if (apy >= 0.07 || tvlUsd < 2500000) {
    return 'balanced'
  }

  return 'safe'
}

export function parseEarnRiskMode(input?: string | null): EarnRiskMode {
  const normalized = input?.toLowerCase().trim()
  if (normalized === 'safe' || normalized === 'balanced' || normalized === 'degen') {
    return normalized
  }
  return 'balanced'
}

export function resolveEarnChainsFromPrompt(prompt: string): number[] {
  const normalized = prompt.toLowerCase()
  const chainIds = new Set<number>()

  if (normalized.includes('ethereum')) chainIds.add(EARN_CHAIN_IDS.ethereum)
  if (normalized.includes('arbitrum')) chainIds.add(EARN_CHAIN_IDS.arbitrum)
  if (normalized.includes('base')) chainIds.add(EARN_CHAIN_IDS.base)

  if (chainIds.size === 0) {
    chainIds.add(EARN_CHAIN_IDS.arbitrum)
    chainIds.add(EARN_CHAIN_IDS.base)
    chainIds.add(EARN_CHAIN_IDS.ethereum)
  }

  return Array.from(chainIds)
}

export function resolveEarnRiskFromPrompt(prompt: string): EarnRiskMode {
  const normalized = prompt.toLowerCase()
  if (normalized.includes('safe')) return 'safe'
  if (normalized.includes('degen')) return 'degen'
  return 'balanced'
}

export function parseEarnAmountFromPrompt(prompt: string) {
  const normalized = prompt.toLowerCase()
  const exactUsdcMatch = normalized.match(/(\d+(?:\.\d+)?)\s*usdc\b/)
  if (exactUsdcMatch) {
    return exactUsdcMatch[1]
  }

  const depositMatch = normalized.match(/(?:deposit|put|allocate|invest|park)\s+(\d+(?:\.\d+)?)/)
  if (depositMatch) {
    return depositMatch[1]
  }

  return null
}

export function isEarnDepositPrompt(prompt: string) {
  const normalized = prompt.toLowerCase()
  const hasDepositVerb =
    normalized.includes('deposit') ||
    normalized.includes('put ') ||
    normalized.includes('allocate') ||
    normalized.includes('invest') ||
    normalized.includes('park')
  const hasEarnContext =
    normalized.includes('vault') ||
    normalized.includes('yield') ||
    normalized.includes('earn') ||
    normalized.includes('usdc')

  return hasDepositVerb && hasEarnContext
}

export function isEarnVaultPrompt(prompt: string) {
  const normalized = prompt.toLowerCase()
  return (
    normalized.includes('best usdc vault') ||
    normalized.includes('usdc vaults on') ||
    normalized.includes('earn vaults') ||
    normalized.includes('earn with usdc') ||
    normalized.includes('safest vault') ||
    normalized.includes('best vault on') ||
    isEarnDepositPrompt(normalized)
  )
}

export function filterVaultsByRisk(vaults: EarnVaultCard[], riskMode: EarnRiskMode) {
  if (riskMode === 'degen') {
    return vaults
  }

  if (riskMode === 'balanced') {
    return vaults.filter((vault) => vault.risk !== 'degen')
  }

  return vaults.filter((vault) => vault.risk === 'safe')
}
