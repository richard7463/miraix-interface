export type FomoRiskMode = 'safe' | 'balanced' | 'degen'
export type FomoTimeHorizon = 'today' | '3d' | '7d'

export interface FomoShareLeg {
  symbol: string
  tag: string
  amountUsd: number
  weight: number
  route: string
  txReady: boolean
}

export interface FomoShareAgent {
  name: string
  status: 'ready' | 'watch' | 'pending'
  verdict: string
}

export interface FomoSharePayload {
  budgetUsd: number
  riskMode: FomoRiskMode
  timeHorizon: FomoTimeHorizon
  provider: string
  paymentLabel: string
  theme: string
  title: string
  caption: string
  confidence: number
  fomoScore: number
  estimatedSlippagePct: number
  estimatedFeesUsd: number
  preparedSwapCount: number
  executedSwapCount: number
  totalSwapCount: number
  paymentReference?: string | null
  paymentExplorerUrl?: string | null
  tradeHashes?: string[]
  approvalHashes?: string[]
  agentLoop: FomoShareAgent[]
  legs: FomoShareLeg[]
}

export function serializeFomoSharePayload(payload: FomoSharePayload) {
  return JSON.stringify(payload)
}

export function buildFomoSharePayload(payload: FomoSharePayload) {
  return payload
}

export function parseFomoSharePayload(value: string | null) {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as FomoSharePayload
  } catch {
    return null
  }
}

export function getFomoShareScene(score: number, riskMode: FomoRiskMode) {
  if (score >= 84) {
    return {
      label: 'Full Send Window',
      title: riskMode === 'degen' ? 'Degens Are Feasting' : 'Heat Is Still Bid',
      caption: 'Good enough to flex. Dangerous enough to travel.',
      accent: '#facc15',
      accentSoft: 'rgba(250, 204, 21, 0.14)',
      accentText: '#fde68a',
      gradient: 'linear-gradient(180deg, #2b1900 0%, #150f06 46%, #0b0a08 100%)'
    }
  }

  if (score >= 68) {
    return {
      label: 'Hot Setup',
      title: 'Momentum With A Seatbelt',
      caption: 'Not clean enough to retire. Strong enough to post.',
      accent: '#22c55e',
      accentSoft: 'rgba(34, 197, 94, 0.14)',
      accentText: '#bbf7d0',
      gradient: 'linear-gradient(180deg, #081c1a 0%, #0a1016 52%, #09080e 100%)'
    }
  }

  return {
    label: 'Measured Heat',
    title: 'Small Bag, Tight Plan',
    caption: 'Still tradable. Still needs discipline.',
    accent: '#38bdf8',
    accentSoft: 'rgba(56, 189, 248, 0.14)',
    accentText: '#bae6fd',
    gradient: 'linear-gradient(180deg, #091225 0%, #0a1016 48%, #09080e 100%)'
  }
}
