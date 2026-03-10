import { ImageResponse } from 'next/og'
import { LANGGRAPH_API_BASE } from '@/lib/config'
import { getWalletRoastShareScene } from '@/lib/walletRoastShare'

export const runtime = 'nodejs'

type Language = 'en' | 'zh'

const getBackendBase = () => {
  if (process.env.NEXT_PUBLIC_LANGGRAPH_API_BASE) {
    return process.env.NEXT_PUBLIC_LANGGRAPH_API_BASE
  }

  return process.env.NODE_ENV === 'production' ? LANGGRAPH_API_BASE : 'http://localhost:3009'
}

const parseLanguage = (value: string | null): Language => (value === 'en' ? 'en' : 'zh')

const formatUsd = (value: number, language: Language) =>
  new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100 ? 0 : 2
  }).format(value || 0)

const scoreLabel = (score: number, language: Language) => {
  if (score >= 80) return language === 'zh' ? '这钱包能晒' : 'Clean enough to flex'
  if (score >= 60) return language === 'zh' ? '能打，但有点乱' : 'Tradeable but messy'
  return language === 'zh' ? '需要成年人监管' : 'Needs adult supervision'
}

const getMemeTier = (score: number, memePct: number, language: Language) => {
  if (score >= 80) {
    return {
      label: language === 'zh' ? '香槟蛙' : 'Champagne Frog',
      signal: language === 'zh' ? '这张图可以直接发，甚至有点凡尔赛。' : 'Post it. This one flexes cleanly.'
    }
  }

  if (score >= 60) {
    return {
      label: language === 'zh' ? 'BONK 幸存者' : 'BONK Survivor',
      signal:
        language === 'zh'
          ? '仓位还算能打，但还是有一点 memecoin 余味。'
          : 'Still tradeable, but the memecoin fumes are noticeable.'
    }
  }

  if (score >= 40) {
    return {
      label: language === 'zh' ? 'Pepe 打工蛙' : 'Pepe Fry Cook',
      signal:
        language === 'zh'
          ? `meme 暴露 ${memePct.toFixed(1)}%，截图够戏剧化，适合传播。`
          : `${memePct.toFixed(1)}% meme exposure. Messy enough to travel on the timeline.`
    }
  }

  return {
    label: language === 'zh' ? '接盘吉祥物' : 'Exit Liquidity Mascot',
    signal:
      language === 'zh'
        ? '这已经不是仓位，是 memecoin 情绪现场。'
        : 'This is no longer allocation. It is memecoin theater.'
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const walletAddress = url.searchParams.get('walletAddress')?.trim()
  const language = parseLanguage(url.searchParams.get('language'))

  if (!walletAddress) {
    return new Response('walletAddress is required', { status: 400 })
  }

  const response = await fetch(`${getBackendBase()}/api/wallet-audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      walletAddress,
      language
    })
  })

  const audit = await response.json()
  if (!response.ok || !audit?.success) {
    return new Response(audit?.error || 'Wallet audit failed', { status: 500 })
  }

  const memeTier = getMemeTier(audit.score, audit.summary.memePct, language)
  const shareScene = getWalletRoastShareScene(audit.score, language)
  const primaryRisk = audit.risks?.[0]
  const actions = audit.actions?.slice(0, 2) || []

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background:
            'linear-gradient(180deg, #1a1209 0%, #120f0a 48%, #0c0a07 100%)',
          color: '#fff4df',
          padding: '52px',
          fontFamily: 'sans-serif'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            borderRadius: 52,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.05)',
            padding: 32
          }}
        >
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
                border: '1px solid rgba(255,180,106,0.32)',
                background: 'rgba(255,180,106,0.12)',
                color: '#ffd79f',
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: 16
              }}
            >
              Powered by OKX OnchainOS
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26 }}>
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 690 }}>
              <div style={{ display: 'flex', fontSize: 18, color: '#cdbd9f' }}>
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </div>
              <div style={{ display: 'flex', marginTop: 10, fontSize: 52, fontWeight: 800 }}>
                {audit.verdict}
              </div>
              <div style={{ display: 'flex', marginTop: 8, fontSize: 28, color: '#ffcf88', fontWeight: 700 }}>
                {scoreLabel(audit.score, language)}
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
                background: 'linear-gradient(180deg, #ffd56f 0%, #ff9a3c 100%)',
                color: '#1a1109',
                fontWeight: 900,
                fontSize: 92
              }}
            >
              {audit.score}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              marginTop: 22,
              borderRadius: 999,
              border: `1px solid ${shareScene.accent}66`,
              background: shareScene.accentSoft,
              color: shareScene.accentText,
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: 18
            }}
          >
            {shareScene.title}
          </div>

          <div style={{ display: 'flex', marginTop: 12, fontSize: 20, color: '#d7c8ad' }}>
            {shareScene.caption}
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 24,
              borderRadius: 34,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(0,0,0,0.2)'
            }}
          >
            <img
              alt={shareScene.title}
              src={shareScene.artDataUrl}
              width="912"
              height="460"
              style={{
                width: '100%',
                height: 460,
                objectFit: 'cover'
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 18
            }}
          >
            <div
              style={{
                display: 'flex',
                borderRadius: 999,
                border: '1px solid rgba(255,180,106,0.32)',
                background: 'rgba(255,180,106,0.12)',
                color: '#ffd79f',
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: 16
              }}
            >
              {(language === 'zh' ? 'Meme 等级' : 'Meme tier')}: {memeTier.label}
            </div>
            <div style={{ display: 'flex', fontSize: 16, color: '#d7c8ad' }}>
              {memeTier.signal}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 24,
              fontSize: 28,
              color: '#e3d4bb',
              lineHeight: 1.4
            }}
          >
            {audit.roast}
          </div>

          {primaryRisk ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: 24,
                borderRadius: 28,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.22)',
                padding: 22
              }}
            >
              <div style={{ display: 'flex', fontSize: 18, color: '#ffcf88', fontWeight: 700 }}>
                {language === 'zh' ? '主要风险' : 'Main risk'}
              </div>
              <div style={{ display: 'flex', marginTop: 10, fontSize: 26, fontWeight: 700 }}>
                {primaryRisk.title}
              </div>
              <div style={{ display: 'flex', marginTop: 10, fontSize: 20, color: '#d3c3a6', lineHeight: 1.4 }}>
                {primaryRisk.detail}
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 24 }}>
            {[
              {
                label: language === 'zh' ? '仓位总值' : 'Bag value',
                value: formatUsd(audit.summary.totalValueUsd, language)
              },
              {
                label: language === 'zh' ? '稳定币占比' : 'Stablecoins',
                value: `${audit.summary.stablecoinPct.toFixed(1)}%`
              },
              {
                label: language === 'zh' ? '代币数' : 'Tokens',
                value: String(audit.summary.tokenCount)
              },
              {
                label: language === 'zh' ? 'Meme 暴露' : 'Meme beta',
                value: `${audit.summary.memePct.toFixed(1)}%`
              }
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 430,
                  borderRadius: 24,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(0,0,0,0.22)',
                  padding: 20
                }}
              >
                <div style={{ display: 'flex', fontSize: 16, color: '#af9b7d', fontWeight: 700 }}>
                  {item.label}
                </div>
                <div style={{ display: 'flex', marginTop: 12, fontSize: 32, fontWeight: 800 }}>
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
              background: 'rgba(0,0,0,0.24)',
              padding: 22
            }}
          >
            <div style={{ display: 'flex', fontSize: 18, color: '#ffcf88', fontWeight: 700 }}>
              {language === 'zh' ? '建议动作' : 'Action queue'}
            </div>
            {actions.map((action: any) => (
              <div key={action.command} style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
                <div style={{ display: 'flex', fontSize: 24, fontWeight: 700 }}>
                  {action.title}
                </div>
                <div style={{ display: 'flex', marginTop: 8, fontSize: 18, color: '#d2c2a4' }}>
                  {action.command}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 'auto',
              paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              fontSize: 18,
              color: '#cfbe9f'
            }}
          >
            <div style={{ display: 'flex' }}>{language === 'zh' ? 'Miraix 钱包 Roast' : 'Roast by Miraix'}</div>
            <div style={{ display: 'flex' }}>app.miraix.fun/wallet-roast</div>
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
