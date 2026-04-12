import { NextRequest, NextResponse } from 'next/server'
import {
  classifyEarnRisk,
  EARN_CHAIN_LABELS,
  EARN_USDC_BY_CHAIN,
  filterVaultsByRisk,
  isEarnDepositPrompt,
  parseEarnAmountFromPrompt,
  parseEarnRiskMode,
  resolveEarnChainsFromPrompt,
  resolveEarnRiskFromPrompt,
  SEEDED_EARN_VAULTS,
  type EarnDiscoveryResponse,
  type EarnRiskMode,
  type EarnVaultCard,
} from '@/lib/earn'

const EARN_API_BASE = 'https://earn.li.fi/v1/earn'
const DEFAULT_LIMIT = 4
const FETCH_TIMEOUT_MS = 8000

type LifiVault = {
  address: string
  chainId: number
  name?: string
  symbol?: string
  network?: string
  isTransactional?: boolean
  protocol?: {
    name?: string
    logoURI?: string
  }
  underlyingTokens?: Array<{
    symbol?: string
    address?: string
    decimals?: number
  }>
  analytics?: {
    apy?: {
      total?: number
    }
    apy30d?: number
    tvl?: {
      usd?: string | number
    }
  }
}

function buildFallbackVaults(chainIds: number[], riskMode: EarnRiskMode) {
  const seeded = SEEDED_EARN_VAULTS.filter((vault) => chainIds.includes(vault.chainId))
  return filterVaultsByRisk(seeded, riskMode)
}

async function fetchVaultsForChain(chainId: number, apiKey: string, limit: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const params = new URLSearchParams({
      chainId: String(chainId),
      asset: 'USDC',
      sortBy: 'apy',
      minTvlUsd: '100000',
      limit: String(limit),
    })

    const response = await fetch(`${EARN_API_BASE}/vaults?${params}`, {
      headers: {
        'x-lifi-api-key': apiKey,
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Earn API ${response.status}`)
    }

    const payload = await response.json()
    return (payload?.data || []) as LifiVault[]
  } finally {
    clearTimeout(timer)
  }
}

function normalizeVault(vault: LifiVault): EarnVaultCard | null {
  if (!vault.address || !vault.chainId) {
    return null
  }

  const asset = vault.underlyingTokens?.find((token) => token.symbol?.toUpperCase() === 'USDC')
  const defaultAsset = EARN_USDC_BY_CHAIN[vault.chainId]
  const apy = Number(vault.analytics?.apy?.total ?? 0)
  const tvlUsd = Number(vault.analytics?.tvl?.usd ?? 0)

  return {
    id: `${vault.chainId}:${vault.address}`.toLowerCase(),
    address: vault.address,
    chainId: vault.chainId,
    chainName: vault.network || EARN_CHAIN_LABELS[vault.chainId] || `Chain ${vault.chainId}`,
    protocolName: vault.protocol?.name || 'LI.FI Earn',
    name: vault.name || vault.symbol || 'USDC Vault',
    symbol: vault.symbol || vault.name || 'Vault',
    assetSymbol: 'USDC',
    assetAddress: asset?.address || defaultAsset?.address || '',
    assetDecimals: asset?.decimals || defaultAsset?.decimals || 6,
    apy,
    apy30d: typeof vault.analytics?.apy30d === 'number' ? vault.analytics.apy30d : null,
    tvlUsd,
    isTransactional: Boolean(vault.isTransactional),
    risk: classifyEarnRisk(apy, tvlUsd),
    reasons: [
      apy > 0 ? `Current APY ${(apy * 100).toFixed(2)}%` : 'Yield available',
      tvlUsd > 0 ? `TVL $${Math.round(tvlUsd).toLocaleString()}` : 'TVL unknown',
      vault.isTransactional ? 'Composer deposit supported' : 'Discovery only',
    ],
    logoURI: vault.protocol?.logoURI || null,
    source: 'live',
  }
}

function buildResponse(
  chainIds: number[],
  riskMode: EarnRiskMode,
  vaults: EarnVaultCard[],
  dataSource: 'live' | 'fallback',
  fallbackReason?: string,
  options?: {
    depositIntent?: boolean
    amountInput?: string | null
  },
): EarnDiscoveryResponse {
  const filtered = filterVaultsByRisk(vaults, riskMode)
    .filter((vault) => chainIds.includes(vault.chainId) && vault.assetSymbol === 'USDC')
    .sort((a, b) => b.apy - a.apy)
  const recommendedVault = filtered[0] || null

  const topNames = filtered.slice(0, 3).map((vault) => `${vault.protocolName} on ${vault.chainName}`)
  const chainLabels = chainIds.map((chainId) => EARN_CHAIN_LABELS[chainId] || `Chain ${chainId}`)
  const actionMode = options?.depositIntent ? 'deposit' : 'discover'
  const amountInput = options?.amountInput || null
  const depositSummary =
    recommendedVault && amountInput
      ? `Prepared an agent recommendation to deposit ${amountInput} USDC into ${recommendedVault.name} on ${recommendedVault.chainName}.`
      : recommendedVault
        ? `Prepared an agent recommendation for ${recommendedVault.name} on ${recommendedVault.chainName}.`
        : 'Prepared a discovery response without a recommended deposit target.'
  const rationale = recommendedVault
    ? [
        `Selected ${recommendedVault.name} on ${recommendedVault.chainName} as the best ${riskMode} USDC match.`,
        ...recommendedVault.reasons.slice(0, 2),
      ]
    : ['No transactional vault matched the current filters.']

  return {
    success: true,
    message:
      filtered.length > 0
        ? actionMode === 'deposit' && recommendedVault
          ? `I picked ${recommendedVault.name} on ${recommendedVault.chainName} for this ${riskMode} USDC deposit. Review the Composer flow below to execute it.`
          : `I found ${filtered.length} USDC vaults across ${chainLabels.join(', ')}. Pick one to open the Composer deposit flow.`
        : `I couldn't find a depositable USDC vault for the selected risk mode, so I kept the Earn flow ready for a broader filter.`,
    thoughts: [
      'Scanning LI.FI Earn vaults for USDC opportunities.',
      `Filtering by ${riskMode} risk profile across ${chainLabels.join(', ')}.`,
      actionMode === 'deposit'
        ? amountInput
          ? `Agent mode enabled: targeting a ${amountInput} USDC deposit with Composer execution.`
          : 'Agent mode enabled: preparing the best available USDC deposit route.'
        : 'Discovery mode enabled: compare vaults before executing.',
      dataSource === 'live'
        ? `Top vaults: ${topNames.join(', ')}.`
        : `Live Earn API was unavailable, so seeded Composer-compatible vaults were loaded instead.`,
    ],
    data: {
      intent: 'earnVaults',
      response:
        filtered.length > 0
          ? actionMode === 'deposit' && recommendedVault
            ? depositSummary
            : `Best match right now: ${topNames[0] || 'USDC vaults found'}.`
          : 'Try switching to balanced or degen to widen the Earn search.',
      filters: {
        assetSymbol: 'USDC',
        chainIds,
        chainLabels,
        riskMode,
      },
      action: {
        mode: actionMode,
        amountInput,
        selectedVaultId: recommendedVault?.id || null,
        selectedChainId: recommendedVault?.chainId || null,
        summary: filtered.length > 0 ? depositSummary : 'No recommended vault available.',
        rationale,
      },
    },
    quote: {
      vaults: filtered,
      dataSource,
      usedFallback: dataSource === 'fallback',
      fallbackReason,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const prompt = String(body?.message || '')
    const depositIntent = isEarnDepositPrompt(prompt)
    const amountInput = parseEarnAmountFromPrompt(prompt)
    const riskMode = body?.riskMode
      ? parseEarnRiskMode(body.riskMode)
      : resolveEarnRiskFromPrompt(prompt)
    const chainIds = Array.isArray(body?.chainIds)
      ? body.chainIds.map(Number).filter(Boolean)
      : resolveEarnChainsFromPrompt(prompt)
    const apiKey = process.env.LIFI_API_KEY || process.env.NEXT_PUBLIC_LIFI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        buildResponse(
          chainIds,
          riskMode,
          buildFallbackVaults(chainIds, riskMode),
          'fallback',
          'Missing LIFI_API_KEY, using seeded Composer-compatible vaults.',
          {
            depositIntent,
            amountInput,
          },
        ),
      )
    }

    try {
      const liveVaults = await Promise.all(
        chainIds.map((chainId) => fetchVaultsForChain(chainId, apiKey, DEFAULT_LIMIT)),
      )

      const normalized = liveVaults
        .flat()
        .map(normalizeVault)
        .filter((vault): vault is EarnVaultCard => Boolean(vault))
        .filter((vault) => vault.isTransactional)

      if (normalized.length === 0) {
        return NextResponse.json(
          buildResponse(
            chainIds,
            riskMode,
            buildFallbackVaults(chainIds, riskMode),
            'fallback',
            'Live Earn API returned no depositable USDC vaults, using seeded alternatives.',
            {
              depositIntent,
              amountInput,
            },
          ),
        )
      }

      return NextResponse.json(
        buildResponse(chainIds, riskMode, normalized, 'live', undefined, {
          depositIntent,
          amountInput,
        }),
      )
    } catch (error) {
      return NextResponse.json(
        buildResponse(
          chainIds,
          riskMode,
          buildFallbackVaults(chainIds, riskMode),
          'fallback',
          error instanceof Error ? error.message : 'Earn API unavailable',
          {
            depositIntent,
            amountInput,
          },
        ),
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to prepare Earn chat response',
      },
      { status: 500 },
    )
  }
}
