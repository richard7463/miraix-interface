import { ImageResponse } from 'next/og'
import { getFomoShareScene, parseFomoSharePayload } from '@/lib/fomoCopilotShare'

export const runtime = 'nodejs'

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2
})

function truncateHash(value: string | null | undefined, start = 8, end = 6) {
  if (!value) return 'Pending'
  if (value.length <= start + end + 3) return value
  return `${value.slice(0, start)}...${value.slice(-end)}`
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const payload = parseFomoSharePayload(url.searchParams.get('payload'))

  if (!payload) {
    return new Response('payload is required', { status: 400 })
  }

  const scene = getFomoShareScene(payload.fomoScore, payload.riskMode)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: scene.gradient,
          color: '#fff7ed',
          padding: '52px',
          fontFamily: 'sans-serif',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 72,
            right: 68,
            width: 240,
            height: 240,
            borderRadius: 999,
            background: `${scene.accent}20`,
            border: `1px solid ${scene.accent}4d`
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 180,
            left: 46,
            width: 340,
            height: 340,
            borderRadius: 999,
            background: `${scene.accent}12`
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            borderRadius: 52,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            padding: 34
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  borderRadius: 18,
                  background: '#ffffff',
                  color: '#111111',
                  padding: '8px 14px',
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  fontSize: 18
                }}
              >
                OKX
              </div>
              <div
                style={{
                  display: 'flex',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.08)',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#e2e8f0'
                }}
              >
                Powered by {payload.provider || 'OKX OnchainOS'}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                borderRadius: 999,
                border: '1px solid rgba(139,92,246,0.4)',
                background: 'rgba(139,92,246,0.16)',
                color: '#ddd6fe',
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: 16
              }}
            >
              Paid via {payload.paymentLabel}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 650 }}>
              <div style={{ display: 'flex', fontSize: 18, color: '#cbd5e1' }}>
                Miraix X Layer Rotation Desk
              </div>
              <div style={{ display: 'flex', marginTop: 10, fontSize: 56, fontWeight: 800 }}>
                {payload.title || 'X Layer Rotation Desk'}
              </div>
              <div style={{ display: 'flex', marginTop: 12, fontSize: 30, color: '#f8fafc', fontWeight: 700 }}>
                {payload.theme}
              </div>
              <div style={{ display: 'flex', marginTop: 14, fontSize: 22, color: '#cbd5e1', lineHeight: 1.4 }}>
                {payload.caption}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                width: 180,
                height: 180,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(180deg, ${scene.accent} 0%, #fff 180%)`,
                color: '#0f172a',
                fontWeight: 900,
                fontSize: 88
              }}
            >
              {payload.fomoScore}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              marginTop: 24,
              borderRadius: 999,
              border: `1px solid ${scene.accent}66`,
              background: scene.accentSoft,
              color: scene.accentText,
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: 18
            }}
          >
            {scene.label}
          </div>

          <div style={{ display: 'flex', marginTop: 12, fontSize: 22, color: '#dbeafe' }}>
            {scene.title} · {scene.caption}
          </div>

          <div style={{ display: 'flex', gap: 18, marginTop: 26 }}>
            {[
              { label: 'Budget', value: usdFormatter.format(payload.budgetUsd) },
              { label: 'Confidence', value: `${payload.confidence}%` },
              { label: 'Slippage', value: `${percentFormatter.format(payload.estimatedSlippagePct)}%` },
              { label: 'Fees', value: usdFormatter.format(payload.estimatedFeesUsd) }
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 216,
                  borderRadius: 24,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.06)',
                  padding: 18
                }}
              >
                <div style={{ display: 'flex', fontSize: 15, color: '#cbd5e1', fontWeight: 700 }}>
                  {item.label}
                </div>
                <div style={{ display: 'flex', marginTop: 10, fontSize: 30, fontWeight: 800 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 24,
              borderRadius: 28,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(15,23,42,0.44)',
              padding: 24
            }}
          >
            <div style={{ display: 'flex', fontSize: 18, color: '#f8fafc', fontWeight: 700 }}>
              Execution basket
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
              {payload.legs.map((leg) => (
                <div
                  key={`${leg.symbol}-${leg.tag}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    borderRadius: 22,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '16px 18px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 360 }}>
                    <div style={{ display: 'flex', fontSize: 26, fontWeight: 800 }}>{leg.symbol}</div>
                    <div style={{ display: 'flex', marginTop: 6, fontSize: 18, color: '#cbd5e1' }}>
                      {leg.tag}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '8px 14px',
                      fontSize: 16,
                      color: '#e2e8f0'
                    }}
                  >
                    {leg.route}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', fontSize: 24, fontWeight: 800 }}>
                      {usdFormatter.format(leg.amountUsd)}
                    </div>
                    <div style={{ display: 'flex', marginTop: 6, fontSize: 18, color: '#cbd5e1' }}>
                      {Math.round(leg.weight * 100)}% · {leg.txReady ? 'Payload ready' : 'Quote only'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 18, marginTop: 24 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                borderRadius: 28,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)',
                padding: 22
              }}
            >
              <div style={{ display: 'flex', fontSize: 18, color: '#f8fafc', fontWeight: 700 }}>
                Execution state
              </div>
              <div style={{ display: 'flex', marginTop: 10, fontSize: 34, fontWeight: 800 }}>
                {payload.executedSwapCount} / {payload.totalSwapCount}
              </div>
              <div style={{ display: 'flex', marginTop: 10, fontSize: 18, color: '#cbd5e1', lineHeight: 1.4 }}>
                {payload.paymentReference
                  ? `Payment ${payload.paymentReference.slice(0, 8)}... confirmed.`
                  : 'Share this after payment to prove the premium loop was settled.'}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginTop: 14
                }}
              >
                <div style={{ display: 'flex', fontSize: 15, color: '#cbd5e1' }}>
                  Payment tx: {truncateHash(payload.paymentReference)}
                </div>
                <div style={{ display: 'flex', fontSize: 15, color: '#cbd5e1' }}>
                  Approval txs: {payload.approvalHashes?.length || 0}
                </div>
                <div style={{ display: 'flex', fontSize: 15, color: '#cbd5e1' }}>
                  Swap tx: {truncateHash(payload.tradeHashes?.[0] || null)}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: 332,
                borderRadius: 28,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)',
                padding: 22
              }}
            >
              <div style={{ display: 'flex', fontSize: 18, color: '#f8fafc', fontWeight: 700 }}>
                Agent loop
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginTop: 12,
                }}
              >
                {(payload.agentLoop || []).slice(0, 3).map((agent) => (
                  <div
                    key={agent.name}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 18,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '12px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', fontSize: 16, fontWeight: 800 }}>
                      {agent.name}
                    </div>
                    <div style={{ display: 'flex', marginTop: 6, fontSize: 14, color: '#cbd5e1', lineHeight: 1.4 }}>
                      {agent.verdict}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 'auto',
              paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              fontSize: 18,
              color: '#cbd5e1'
            }}
          >
            <div style={{ display: 'flex' }}>app.miraix.fun/fomo-copilot</div>
            <div style={{ display: 'flex' }}>Strategist + Risk + Execution agents on X Layer</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920
    }
  )
}
