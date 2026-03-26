import { NextRequest, NextResponse } from 'next/server'
import { LANGGRAPH_API_BASE } from '@/lib/config'

const getBackendBase = () => {
  if (process.env.NEXT_PUBLIC_LANGGRAPH_API_BASE) {
    return process.env.NEXT_PUBLIC_LANGGRAPH_API_BASE
  }

  return process.env.NODE_ENV === 'production' ? LANGGRAPH_API_BASE : 'http://localhost:3009'
}

const OKX_BASE_URL = process.env.OKX_AGENT_TRADE_BASE || 'https://www.okx.com'
const OKX_MARKET_TIMEOUT_MS = 3000
const XLAYER_PAYMENT_OPTIONS = [
  { assetSymbol: 'USDT', displayPrice: '0.05 USDT', network: 'X Layer' },
  { assetSymbol: 'USDC', displayPrice: '0.05 USDC', network: 'X Layer' },
] as const

type OkxTickerRow = {
  instId: string
  last: string
  high24h: string
  low24h: string
  volCcy24h: string
  open24h?: string
  sodUtc0?: string
  ts: string
}

type PreviewPayload = {
  success?: boolean
  paymentRail?: {
    enabled?: boolean
    assetSymbol?: string
    network?: string
    displayPrice?: string
    options?: Array<{
      assetSymbol?: string
      displayPrice?: string
      network?: string
    }>
  }
  [key: string]: unknown
}

function buildDefaultPaymentRail(preferredAsset?: string) {
  const fallbackAsset = preferredAsset === 'USDC' ? 'USDC' : 'USDT'
  const preferredOption =
    XLAYER_PAYMENT_OPTIONS.find((option) => option.assetSymbol === fallbackAsset) ||
    XLAYER_PAYMENT_OPTIONS[0]

  return {
    enabled: true,
    assetSymbol: preferredOption.assetSymbol,
    network: 'X Layer',
    displayPrice: preferredOption.displayPrice,
    options: [...XLAYER_PAYMENT_OPTIONS],
  }
}

function normalizePreviewPayload(
  payload: PreviewPayload,
  preferredAsset?: string,
): PreviewPayload {
  const normalizedRail = buildDefaultPaymentRail(preferredAsset)
  const currentRail = payload.paymentRail
  const hasLegacySignals =
    typeof currentRail?.network === 'string' &&
      currentRail.network.toLowerCase() === 'base' ||
    typeof currentRail?.displayPrice === 'string' &&
      currentRail.displayPrice.toLowerCase().includes('fxusd') ||
    currentRail?.assetSymbol === 'fxUSD' ||
    Boolean(
      currentRail?.options?.some(
        (option) =>
          option.assetSymbol === 'fxUSD' ||
          option.network?.toLowerCase() === 'base',
      ),
    )

  if (!currentRail || currentRail.enabled !== true || hasLegacySignals) {
    return {
      ...payload,
      paymentRail: normalizedRail,
    }
  }

  const normalizedOptions = currentRail.options?.filter(
    (option): option is (typeof XLAYER_PAYMENT_OPTIONS)[number] =>
      option.assetSymbol === 'USDT' || option.assetSymbol === 'USDC',
  )

  if (!normalizedOptions?.length) {
    return {
      ...payload,
      paymentRail: normalizedRail,
    }
  }

  const selectedAsset =
    currentRail.assetSymbol === 'USDC' || currentRail.assetSymbol === 'USDT'
      ? currentRail.assetSymbol
      : normalizedRail.assetSymbol
  const selectedOption =
    normalizedOptions.find((option) => option.assetSymbol === selectedAsset) ||
    normalizedOptions[0]

  return {
    ...payload,
    paymentRail: {
      enabled: true,
      assetSymbol: selectedOption.assetSymbol,
      network: 'X Layer',
      displayPrice: selectedOption.displayPrice,
      options: normalizedOptions.map((option) => ({
        ...option,
        network: 'X Layer',
      })),
    },
  }
}

async function fetchOkxMarketPulse(symbols: string[]): Promise<
  Array<{
    symbol: string
    tag: string
    weight: number
    priceLabel: string
    change24hLabel: string
  }>
> {
  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const instId = `${symbol}-USDT`
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), OKX_MARKET_TIMEOUT_MS)
      try {
        const res = await fetch(
          `${OKX_BASE_URL}/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`,
          {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'MiraixRotationDesk/1.0',
            },
            cache: 'no-store',
            signal: controller.signal,
          }
        )
        clearTimeout(timer)
        if (!res.ok) throw new Error(`OKX ${res.status}`)
        const envelope = await res.json()
        const ticker: OkxTickerRow | undefined = envelope?.data?.[0]
        if (!ticker) throw new Error('No ticker')

        const last = Number(ticker.last)
        const open = Number(ticker.sodUtc0 || ticker.open24h || ticker.last)
        const changePct = open > 0 ? ((last - open) / open) * 100 : 0

        return {
          symbol,
          last,
          changePct,
          volume24hUsd: Number(ticker.volCcy24h),
        }
      } catch {
        clearTimeout(timer)
        return null
      }
    })
  )

  const live = results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter((v): v is NonNullable<typeof v> => v !== null)

  if (live.length === 0) return []

  const totalVolume = live.reduce((s, t) => s + t.volume24hUsd, 0)

  return live.map((t) => ({
    symbol: t.symbol,
    tag:
      t.changePct > 3
        ? 'momentum'
        : t.changePct < -3
          ? 'dip-buy'
          : t.volume24hUsd > totalVolume * 0.4
            ? 'volume-leader'
            : 'steady',
    weight: totalVolume > 0 ? t.volume24hUsd / totalVolume : 1 / live.length,
    priceLabel: `$${t.last.toLocaleString()}`,
    change24hLabel: `${t.changePct >= 0 ? '+' : ''}${t.changePct.toFixed(2)}%`,
  }))
}

function buildFallbackPreview(body: Record<string, unknown>) {
  const budgetUsd = Number(body.budgetUsd) || 100
  const riskMode = (body.riskMode as string) || 'balanced'

  return {
    success: true,
    provider: 'OKX OnchainOS (demo fallback)',
    preview: {
      theme:
        riskMode === 'degen'
          ? 'X Layer Momentum Play'
          : riskMode === 'safe'
            ? 'X Layer Defensive Basket'
            : 'X Layer Balanced Rotation',
      summary: `${budgetUsd}U budget split across X Layer ecosystem tokens. Strategist Agent proposes the basket, Risk Agent constrains concentration and slippage, Execution Agent validates route readiness.`,
      teaser: `Three agents, one ${budgetUsd}U rotation on X Layer.`,
      topSymbols: ['OKB', 'ETH', 'WBTC'],
      marketPulse: [] as Array<{
        symbol: string
        tag: string
        weight: number
        priceLabel: string
        change24hLabel: string
      }>,
      metrics: {
        confidence: riskMode === 'safe' ? 82 : riskMode === 'degen' ? 65 : 74,
        fomoScore: riskMode === 'degen' ? 78 : riskMode === 'safe' ? 35 : 56,
        estimatedSlippagePct: riskMode === 'degen' ? 1.2 : 0.5,
        estimatedFeesUsd: Math.max(0.5, budgetUsd * 0.003),
        agentLoop: [
          {
            id: 'strategist' as const,
            name: 'Strategist Agent',
            role: 'Token discovery + basket construction via OKX OnchainOS Market API',
            status: 'ready' as const,
            verdict: `Propose ${riskMode === 'safe' ? '2' : '3'}-leg basket on X Layer`,
            detail: `OKX Market API returns live pricing for X Layer ecosystem tokens. Strategist builds a ${riskMode}-mode basket weighted by 24h volume and momentum.`,
            metrics: [
              { label: 'Tokens scanned', value: '12' },
              { label: 'Legs proposed', value: riskMode === 'safe' ? '2' : '3' },
              { label: 'Data source', value: 'OKX Market API' },
            ],
          },
          {
            id: 'risk' as const,
            name: 'Risk Agent',
            role: 'Concentration cap + slippage guard + reserve enforcement',
            status: 'watch' as const,
            verdict:
              riskMode === 'degen'
                ? 'REDUCED: cut max single-leg from 50% to 35%'
                : 'Cleared with reserve buffer',
            detail:
              riskMode === 'degen'
                ? 'Risk Agent overrode Strategist allocation: single-leg concentration exceeded 40% threshold. Reduced top leg and redistributed to maintain risk budget.'
                : `Reserve ratio at ${riskMode === 'safe' ? '30' : '15'}%. All legs pass concentration and slippage checks.`,
            metrics: [
              { label: 'Max concentration', value: riskMode === 'degen' ? '35%' : '40%' },
              { label: 'Reserve', value: riskMode === 'safe' ? '30%' : riskMode === 'degen' ? '0%' : '15%' },
              { label: 'Override', value: riskMode === 'degen' ? 'Yes' : 'No' },
            ],
          },
          {
            id: 'execution' as const,
            name: 'Execution Agent',
            role: 'Route validation + payload readiness via OKX DEX Aggregator',
            status: 'ready' as const,
            verdict: 'Routes validated, payloads pending x402 unlock',
            detail:
              'OKX DEX Aggregator returns executable swap payloads for each leg. Execution Agent confirms route availability and gas estimation on X Layer before unlocking.',
            metrics: [
              { label: 'Routes found', value: riskMode === 'safe' ? '2' : '3' },
              { label: 'Gas asset', value: 'OKB' },
              { label: 'Chain', value: 'X Layer' },
            ],
          },
        ],
      },
    },
    paymentRail: {
      enabled: true,
      assetSymbol: 'USDT',
      network: 'X Layer',
      displayPrice: '0.05 USDT',
      options: [
        { assetSymbol: 'USDT', displayPrice: '0.05 USDT', network: 'X Layer' },
        { assetSymbol: 'USDC', displayPrice: '0.05 USDC', network: 'X Layer' },
      ],
    },
  }
}

export async function POST(request: NextRequest) {
  const bodyText = await request.text()
  let parsedBody: Record<string, unknown> = {}
  try {
    parsedBody = JSON.parse(bodyText)
  } catch {}

  const previewBody = { ...parsedBody }
  delete previewBody.walletAddress
  const previewBodyText = JSON.stringify(previewBody)

  // Step 1: Try to enrich with live OKX market data (visible OnchainOS integration)
  const marketPulsePromise = fetchOkxMarketPulse(['OKB', 'ETH', 'WBTC']).catch(() => [])

  // Step 2: Try the LangGraph backend
  try {
    const response = await fetch(`${getBackendBase()}/api/fomo/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: previewBodyText,
    })

    if (response.ok) {
      const payloadText = await response.text()

      try {
        const payload = JSON.parse(payloadText) as PreviewPayload
        const normalizedPayload = normalizePreviewPayload(
          payload,
          typeof previewBody.paymentAsset === 'string' ? previewBody.paymentAsset : undefined,
        )

        return NextResponse.json(normalizedPayload, {
          status: response.status,
          headers: {
            'Content-Type': response.headers.get('content-type') || 'application/json',
          },
        })
      } catch {
        return new NextResponse(payloadText, {
          status: response.status,
          headers: {
            'Content-Type': response.headers.get('content-type') || 'application/json',
          },
        })
      }
    }

    // LangGraph returned an error — fall through to fallback
  } catch {
    // LangGraph unreachable — fall through to fallback
  }

  // Step 3: Return fallback with live OKX market data when available
  const fallback = buildFallbackPreview(previewBody)
  const liveMarketPulse = await marketPulsePromise
  if (liveMarketPulse.length > 0) {
    fallback.preview.marketPulse = liveMarketPulse
    fallback.preview.topSymbols = liveMarketPulse.map((t) => t.symbol)
    fallback.provider = 'OKX OnchainOS (live market + demo agents)'
  } else {
    // Static fallback market pulse
    fallback.preview.marketPulse = [
      { symbol: 'OKB', tag: 'ecosystem-core', weight: 0.45, priceLabel: '$52.80', change24hLabel: '+1.34%' },
      { symbol: 'ETH', tag: 'blue-chip', weight: 0.35, priceLabel: '$2,045', change24hLabel: '-0.62%' },
      { symbol: 'WBTC', tag: 'store-of-value', weight: 0.20, priceLabel: '$87,200', change24hLabel: '+0.88%' },
    ]
  }

  return NextResponse.json(fallback)
}
