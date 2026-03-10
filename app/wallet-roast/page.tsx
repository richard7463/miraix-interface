'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSolanaWallets } from '@privy-io/react-auth/solana'
import { AlertTriangle, ArrowRight, BookOpen, Copy, Download, Flame, Loader2, Sparkles } from 'lucide-react'
import { DefaultPersonas } from '@/components/Chat/interface'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useChatStore } from '@/store/chatStore'

interface AuditRisk {
  level: 'low' | 'medium' | 'high' | 'info'
  title: string
  detail: string
}

interface AuditAction {
  title: string
  rationale: string
  command: string
  fromSymbol?: string
  toSymbol?: string
  amount?: string
  estimatedUsd?: string
}

interface AuditHolding {
  symbol: string
  valueUsd: number
  allocationPct: number
  balance: string
  tokenPrice: number
  isRiskToken: boolean
}

interface AuditResponse {
  success: boolean
  provider: string
  walletAddress: string
  score: number
  language?: 'en' | 'zh'
  verdict: string
  roast: string
  shareText: string
  summary: {
    totalValueUsd: number
    tokenCount: number
    stablecoinPct: number
    memePct: number
    topHoldingPct: number
    dustCount: number
    riskTokenCount: number
  }
  topHoldings: AuditHolding[]
  risks: AuditRisk[]
  actions: AuditAction[]
}

type Language = 'en' | 'zh'

const COPY = {
  en: {
    language: 'Language',
    badge: 'Wallet Roast',
    title: 'Roast a wallet. Turn the roast into trade ideas.',
    description:
      'Miraix pulls your Solana bag through OKX OnchainOS, scores the positioning, calls out the bad habits, and turns the fixes into commands you can run in chat.',
    walletLabel: 'Solana wallet',
    walletPlaceholder: 'Paste a wallet address or use your connected one',
    analyze: 'Roast this wallet',
    docsCta: 'OpenClaw setup docs',
    docsHint: 'Want your own OpenClaw to call this service? Start here.',
    useConnectedWallet: 'Use connected wallet',
    poweredBy: 'Powered by OKX OnchainOS balance endpoints',
    pasteWalletFirst: 'Paste a Solana wallet address first.',
    walletAuditFailed: 'Wallet audit failed',
    viralTitle: 'What makes this viral',
    viralOneTitle: '1. Instant ego check',
    viralOneBody: 'People share wallet screenshots when the analysis feels sharp, brutal, and slightly unfair.',
    viralTwoTitle: '2. It ends with action',
    viralTwoBody: 'Each roast becomes a concrete swap command, so the content is not just commentary.',
    viralThreeTitle: '3. It carries a clean tech story',
    viralThreeBody: 'Analysis comes from OKX OnchainOS portfolio data, while execution stays inside the Miraix workflow.',
    bagValue: 'Bag value',
    tokens: 'Tokens',
    stablecoins: 'Stablecoins',
    memeBeta: 'Meme beta',
    shareBait: 'Share bait',
    shareTitle: 'One-click roast caption',
    shareCardTitle: 'Share screenshot',
    shareCardSubtitle: 'Export a clean card with the OKX OnchainOS credit baked in.',
    copied: 'Copied',
    copyShareText: 'Copy share text',
    downloadImage: 'Download image',
    downloadingImage: 'Rendering...',
    cardBadge: 'Powered by OKX OnchainOS',
    cardFooter: 'Roast by Miraix',
    topHoldings: 'Top holdings',
    riskBadge: 'Risk',
    tokenUnit: 'tokens',
    mainRisks: 'Main risks',
    actionQueue: 'Action queue',
    copy: 'Copy',
    command: 'Command',
    runInChat: 'Run in Miraix chat',
    suggestedClip: 'Suggested clip',
    howToUse: 'How to use it',
    stepOneTitle: '1. Drop a wallet',
    stepOneBody: 'Use your connected address or paste any Solana wallet you want to inspect.',
    stepTwoTitle: '2. Pull the bag apart',
    stepTwoBody: 'Miraix scores stability, concentration, meme exposure, and dust using OKX portfolio data.',
    stepThreeTitle: '3. Push fixes into chat',
    stepThreeBody: 'Every recommended move becomes a concrete command that drops straight into the existing Miraix trade flow.',
    levels: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      info: 'Info'
    },
    scoreLabels: {
      high: 'Clean enough to flex',
      mid: 'Tradeable but messy',
      low: 'Needs adult supervision'
    }
  },
  zh: {
    language: '语言',
    badge: '钱包 Roast',
    title: '给钱包上强度，把吐槽变成交易建议。',
    description:
      'Miraix 通过 OKX OnchainOS 拉取你的 Solana 持仓，给出仓位评分、指出结构问题，再把修复建议变成可以直接丢进聊天执行的指令。',
    walletLabel: 'Solana 钱包',
    walletPlaceholder: '粘贴钱包地址，或直接使用你当前连接的钱包',
    analyze: '分析这个钱包',
    docsCta: 'OpenClaw 接入文档',
    docsHint: '如果你想让自己的 OpenClaw 调用这个服务，从这里开始。',
    useConnectedWallet: '使用已连接钱包',
    poweredBy: '由 OKX OnchainOS 钱包能力驱动',
    pasteWalletFirst: '先输入一个 Solana 钱包地址。',
    walletAuditFailed: '钱包分析失败',
    viralTitle: '为什么它有传播性',
    viralOneTitle: '1. 结果够狠，用户愿意晒图',
    viralOneBody: '只要分析够准、够毒、又有点不留情面，用户就会把自己的钱包截图发出去。',
    viralTwoTitle: '2. 不止点评，还能给动作',
    viralTwoBody: '每次 roast 最后都会落成一条具体换仓指令，而不是停留在评论区嘴炮。',
    viralThreeTitle: '3. 技术故事清晰',
    viralThreeBody: '分析来自 OKX OnchainOS 的钱包数据，执行仍然留在 Miraix 的交易流程里。',
    bagValue: '仓位总值',
    tokens: '代币数',
    stablecoins: '稳定币占比',
    memeBeta: 'Meme 暴露',
    shareBait: '传播文案',
    shareTitle: '一键复制晒图文案',
    shareCardTitle: '分享截图',
    shareCardSubtitle: '导出一张带有 OKX OnchainOS 标识的分享卡片。',
    copied: '已复制',
    copyShareText: '复制分享文案',
    downloadImage: '下载图片',
    downloadingImage: '生成中...',
    cardBadge: 'Powered by OKX OnchainOS',
    cardFooter: 'Miraix 钱包 Roast',
    topHoldings: '主要持仓',
    riskBadge: '风险',
    tokenUnit: '个代币',
    mainRisks: '主要风险',
    actionQueue: '建议动作',
    copy: '复制',
    command: '指令',
    runInChat: '发送到 Miraix 聊天',
    suggestedClip: '建议金额',
    howToUse: '怎么用',
    stepOneTitle: '1. 丢进一个钱包',
    stepOneBody: '可以直接用你当前连接的钱包，也可以粘贴任意一个想分析的 Solana 地址。',
    stepTwoTitle: '2. 拆开你的持仓结构',
    stepTwoBody: 'Miraix 会基于 OKX 的组合数据，评估稳定性、集中度、meme 暴露和 dust 情况。',
    stepThreeTitle: '3. 把建议推进聊天执行',
    stepThreeBody: '每条建议都会变成一条具体指令，可以直接送进现有 Miraix 交易流程。',
    levels: {
      low: '低',
      medium: '中',
      high: '高',
      info: '提示'
    },
    scoreLabels: {
      high: '这钱包能晒',
      mid: '能打，但有点乱',
      low: '需要成年人监管'
    }
  }
} as const satisfies Record<
  Language,
  {
    language: string
    badge: string
    title: string
    description: string
    walletLabel: string
    walletPlaceholder: string
    analyze: string
    docsCta: string
    docsHint: string
    useConnectedWallet: string
    poweredBy: string
    pasteWalletFirst: string
    walletAuditFailed: string
    viralTitle: string
    viralOneTitle: string
    viralOneBody: string
    viralTwoTitle: string
    viralTwoBody: string
    viralThreeTitle: string
    viralThreeBody: string
    bagValue: string
    tokens: string
    stablecoins: string
    memeBeta: string
    shareBait: string
    shareTitle: string
    shareCardTitle: string
    shareCardSubtitle: string
    copied: string
    copyShareText: string
    downloadImage: string
    downloadingImage: string
    cardBadge: string
    cardFooter: string
    topHoldings: string
    riskBadge: string
    tokenUnit: string
    mainRisks: string
    actionQueue: string
    copy: string
    command: string
    runInChat: string
    suggestedClip: string
    howToUse: string
    stepOneTitle: string
    stepOneBody: string
    stepTwoTitle: string
    stepTwoBody: string
    stepThreeTitle: string
    stepThreeBody: string
    levels: Record<AuditRisk['level'], string>
    scoreLabels: {
      high: string
      mid: string
      low: string
    }
  }
>

const scoreTone = (score: number) => {
  if (score >= 80) return 'from-emerald-400 to-lime-300'
  if (score >= 60) return 'from-amber-300 to-orange-400'
  return 'from-rose-400 to-red-500'
}

const scoreLabel = (score: number, language: Language) => {
  if (score >= 80) return COPY[language].scoreLabels.high
  if (score >= 60) return COPY[language].scoreLabels.mid
  return COPY[language].scoreLabels.low
}

const formatUsd = (value: number, language: Language) => {
  return new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100 ? 0 : 2
  }).format(value || 0)
}

const shortenWallet = (value: string) => {
  if (!value) {
    return ''
  }

  return value.length > 12 ? `${value.slice(0, 4)}...${value.slice(-4)}` : value
}

const wrapCanvasText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) => {
  const words = text.includes(' ') ? text.split(' ') : Array.from(text)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const separator = text.includes(' ') ? ' ' : ''
    const nextLine = currentLine ? `${currentLine}${separator}${word}` : word
    if (context.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
    }
    currentLine = word
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  const visibleLines = lines.slice(0, maxLines).map((line, index) => {
    if (index !== maxLines - 1 || lines.length <= maxLines) {
      return line
    }

    let truncated = line
    while (truncated.length > 0 && context.measureText(`${truncated}...`).width > maxWidth) {
      truncated = truncated.slice(0, -1)
    }
    return `${truncated}...`
  })

  visibleLines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight)
  })

  return visibleLines.length
}

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

export default function WalletRoastPage() {
  const router = useRouter()
  const copyToClipboard = useCopyToClipboard()
  const { wallets: solanaWallets } = useSolanaWallets()
  const [language, setLanguage] = useState<Language>('zh')
  const [walletAddress, setWalletAddress] = useState('')
  const [audit, setAudit] = useState<AuditResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloadingImage, setIsDownloadingImage] = useState(false)
  const [error, setError] = useState('')
  const [copiedText, setCopiedText] = useState('')

  const connectedWallet = solanaWallets?.find((wallet) => wallet.address)?.address || ''
  const pageCopy = COPY[language]

  useEffect(() => {
    if (!walletAddress && connectedWallet) {
      setWalletAddress(connectedWallet)
    }
  }, [connectedWallet, walletAddress])

  const setCopiedState = (value: string) => {
    setCopiedText(value)
    window.setTimeout(() => setCopiedText(''), 1800)
  }

  const handleAnalyze = async () => {
    if (!walletAddress.trim()) {
      setError(pageCopy.pasteWalletFirst)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/wallet-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: walletAddress.trim(),
          language
        })
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || pageCopy.walletAuditFailed)
      }

      setAudit(payload)
    } catch (auditError) {
      setAudit(null)
      setError(auditError instanceof Error ? auditError.message : pageCopy.walletAuditFailed)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLanguageChange = (nextLanguage: Language) => {
    if (nextLanguage === language) {
      return
    }

    setLanguage(nextLanguage)
    setAudit(null)
    setError('')
    setCopiedText('')
  }

  const openCommandInChat = (command: string) => {
    const store = useChatStore.getState()
    const chatId = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const chat = {
      id: chatId,
      persona: DefaultPersonas[0],
      isNew: true,
      createdAt: timestamp,
      updatedAt: timestamp
    }

    store.setChatList([...store.chatList, chat])
    store.setCurrentChat(chat)
    store.setMessages(chatId, [
      {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: command,
        timestamp
      }
    ])

    router.push(`/chat/${chatId}`)
  }

  const handleCopy = async (value: string, label: string) => {
    const success = await copyToClipboard(value)
    if (success) {
      setCopiedState(label)
    }
  }

  const handleDownloadShareCard = async () => {
    if (!audit) {
      return
    }

    setIsDownloadingImage(true)

    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 900

      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Canvas not supported')
      }

      const background = context.createLinearGradient(0, 0, 1600, 900)
      background.addColorStop(0, '#1a1209')
      background.addColorStop(0.55, '#120f0a')
      background.addColorStop(1, '#0c0a07')
      context.fillStyle = background
      context.fillRect(0, 0, 1600, 900)

      const glow = context.createRadialGradient(260, 160, 60, 260, 160, 420)
      glow.addColorStop(0, 'rgba(255,170,88,0.36)')
      glow.addColorStop(1, 'rgba(255,170,88,0)')
      context.fillStyle = glow
      context.fillRect(0, 0, 1600, 900)

      const glowTwo = context.createRadialGradient(1320, 120, 40, 1320, 120, 260)
      glowTwo.addColorStop(0, 'rgba(255,214,110,0.22)')
      glowTwo.addColorStop(1, 'rgba(255,214,110,0)')
      context.fillStyle = glowTwo
      context.fillRect(0, 0, 1600, 900)

      drawRoundedRect(context, 72, 72, 1456, 756, 40)
      context.fillStyle = 'rgba(255,255,255,0.06)'
      context.fill()
      context.strokeStyle = 'rgba(255,255,255,0.08)'
      context.lineWidth = 2
      context.stroke()

      drawRoundedRect(context, 96, 96, 270, 52, 26)
      context.fillStyle = 'rgba(255,180,106,0.12)'
      context.fill()
      context.strokeStyle = 'rgba(255,180,106,0.36)'
      context.stroke()
      context.fillStyle = '#ffd79f'
      context.font = '600 22px ui-sans-serif, system-ui, sans-serif'
      context.fillText(pageCopy.cardBadge, 122, 129)

      context.fillStyle = '#fef4df'
      context.font = '700 66px Georgia, serif'
      context.fillText(pageCopy.badge, 96, 230)

      context.fillStyle = '#d9c9ad'
      context.font = '500 28px ui-sans-serif, system-ui, sans-serif'
      context.fillText(shortenWallet(audit.walletAddress), 96, 278)

      const scoreGradient = context.createLinearGradient(0, 0, 0, 240)
      scoreGradient.addColorStop(0, '#ffd56f')
      scoreGradient.addColorStop(1, '#ff9a3c')
      drawRoundedRect(context, 1180, 102, 250, 250, 34)
      context.fillStyle = 'rgba(11,10,8,0.35)'
      context.fill()
      context.strokeStyle = 'rgba(255,255,255,0.08)'
      context.stroke()

      context.fillStyle = scoreGradient
      context.font = '700 130px ui-sans-serif, system-ui, sans-serif'
      context.textAlign = 'center'
      context.fillText(String(audit.score), 1305, 250)
      context.textAlign = 'start'

      context.fillStyle = '#ffcf88'
      context.font = '700 24px ui-sans-serif, system-ui, sans-serif'
      context.fillText(audit.verdict, 1180, 320)

      context.fillStyle = '#fff4df'
      context.font = '700 34px ui-sans-serif, system-ui, sans-serif'
      context.fillText(scoreLabel(audit.score, language), 96, 370)

      context.fillStyle = '#e3d4bb'
      context.font = '500 34px ui-sans-serif, system-ui, sans-serif'
      wrapCanvasText(context, audit.roast, 96, 424, 980, 46, 4)

      const statCards = [
        { label: pageCopy.bagValue, value: formatUsd(audit.summary.totalValueUsd, language) },
        { label: pageCopy.stablecoins, value: `${audit.summary.stablecoinPct.toFixed(1)}%` },
        { label: pageCopy.tokens, value: String(audit.summary.tokenCount) },
        { label: pageCopy.memeBeta, value: `${audit.summary.memePct.toFixed(1)}%` }
      ]

      statCards.forEach((item, index) => {
        const x = 96 + index * 258
        drawRoundedRect(context, x, 566, 228, 120, 28)
        context.fillStyle = 'rgba(0,0,0,0.22)'
        context.fill()
        context.strokeStyle = 'rgba(255,255,255,0.08)'
        context.stroke()
        context.fillStyle = '#af9b7d'
        context.font = '600 18px ui-sans-serif, system-ui, sans-serif'
        context.fillText(item.label, x + 24, 612)
        context.fillStyle = '#fff4df'
        context.font = '700 34px ui-sans-serif, system-ui, sans-serif'
        context.fillText(item.value, x + 24, 656)
      })

      drawRoundedRect(context, 1180, 392, 320, 294, 28)
      context.fillStyle = 'rgba(0,0,0,0.24)'
      context.fill()
      context.strokeStyle = 'rgba(255,255,255,0.08)'
      context.stroke()
      context.fillStyle = '#ffcf88'
      context.font = '700 20px ui-sans-serif, system-ui, sans-serif'
      context.fillText(pageCopy.actionQueue, 1206, 434)

      context.fillStyle = '#fff4df'
      context.font = '700 24px ui-sans-serif, system-ui, sans-serif'
      audit.actions.slice(0, 2).forEach((action, index) => {
        const y = 490 + index * 94
        context.fillText(action.title, 1206, y)
        context.fillStyle = '#d3c3a6'
        context.font = '500 18px ui-sans-serif, system-ui, sans-serif'
        wrapCanvasText(context, action.command, 1206, y + 36, 262, 26, 2)
        context.fillStyle = '#fff4df'
        context.font = '700 24px ui-sans-serif, system-ui, sans-serif'
      })

      context.fillStyle = '#cfbe9f'
      context.font = '600 20px ui-sans-serif, system-ui, sans-serif'
      context.fillText(pageCopy.cardFooter, 96, 766)
      context.textAlign = 'right'
      context.fillText('app.miraix.fun/wallet-roast', 1494, 766)
      context.textAlign = 'start'

      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `miraix-wallet-roast-${shortenWallet(audit.walletAddress).replace(/\./g, '')}.png`
      link.click()
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : pageCopy.walletAuditFailed)
    } finally {
      setIsDownloadingImage(false)
    }
  }

  return (
    <main className="min-h-screen overflow-y-auto bg-[#120f0a] text-[#f9f4ea]">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,145,77,0.28),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,216,122,0.18),_transparent_28%),linear-gradient(180deg,_#19130c_0%,_#120f0a_50%,_#0c0a07_100%)]" />
        <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(135deg,rgba(255,141,56,0.22),transparent_40%,rgba(255,214,102,0.12)_80%)] blur-3xl" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 pb-16 pt-24 md:px-8">
          <section className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#ffb46a]/40 bg-[#ffb46a]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#ffd79f]">
                  <Flame className="h-3.5 w-3.5" />
                  {pageCopy.badge}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 p-1 text-xs text-[#e7dac4]">
                  <span className="px-2 text-[#af9b7d]">{pageCopy.language}</span>
                  {(['zh', 'en'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleLanguageChange(option)}
                      className={`rounded-full px-3 py-1.5 font-semibold transition ${
                        language === option
                          ? 'bg-[#ff9a3c] text-[#20140a]'
                          : 'text-[#f3e6cf] hover:bg-white/10'
                      }`}
                    >
                      {option === 'zh' ? '中文' : 'EN'}
                    </button>
                  ))}
                </div>
              </div>
              <h1 className="max-w-3xl font-serif text-4xl font-semibold tracking-tight text-[#fff4df] md:text-6xl">
                {pageCopy.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#e5d8c1] md:text-lg">
                {pageCopy.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/openclaw')}
                  className="inline-flex items-center gap-2 rounded-full border border-[#ffb46a]/30 bg-[#ffb46a]/10 px-4 py-2 text-sm font-medium text-[#ffd79f] transition hover:bg-[#ffb46a]/20"
                >
                  <BookOpen className="h-4 w-4" />
                  {pageCopy.docsCta}
                </button>
                <span className="text-sm text-[#bca98a]">{pageCopy.docsHint}</span>
              </div>

              <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-5">
                <label className="mb-3 block text-sm font-medium text-[#f7d8a4]">{pageCopy.walletLabel}</label>
                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    value={walletAddress}
                    onChange={(event) => setWalletAddress(event.target.value)}
                    placeholder={pageCopy.walletPlaceholder}
                    className="h-14 flex-1 rounded-2xl border border-white/10 bg-[#120e09] px-4 text-sm text-[#fff8ed] outline-none transition placeholder:text-[#9f927d] focus:border-[#ffae57]"
                  />
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#ff9a3c] px-5 text-sm font-semibold text-[#20140a] transition hover:bg-[#ffb15d] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {pageCopy.analyze}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#bca98a]">
                  {connectedWallet ? (
                    <button
                      type="button"
                      onClick={() => setWalletAddress(connectedWallet)}
                      className="rounded-full border border-[#ffb46a]/30 bg-[#ffb46a]/10 px-3 py-1 text-[#ffd79f] transition hover:bg-[#ffb46a]/20"
                    >
                      {pageCopy.useConnectedWallet}
                    </button>
                  ) : null}
                  <span className="rounded-full border border-white/10 px-3 py-1">
                    {pageCopy.poweredBy}
                  </span>
                </div>

                {error ? (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-[#1b140d]/80 p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ffcf88]">{pageCopy.viralTitle}</p>
              <div className="mt-5 space-y-4 text-sm leading-6 text-[#e7dac4]">
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <p className="font-semibold text-[#fff3de]">{pageCopy.viralOneTitle}</p>
                  <p className="mt-1 text-[#c9b79a]">{pageCopy.viralOneBody}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <p className="font-semibold text-[#fff3de]">{pageCopy.viralTwoTitle}</p>
                  <p className="mt-1 text-[#c9b79a]">{pageCopy.viralTwoBody}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <p className="font-semibold text-[#fff3de]">{pageCopy.viralThreeTitle}</p>
                  <p className="mt-1 text-[#c9b79a]">{pageCopy.viralThreeBody}</p>
                </div>
              </div>
            </div>
          </section>

          {audit ? (
            <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-6">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className={`inline-flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br ${scoreTone(audit.score)} text-4xl font-semibold text-[#1a1109] shadow-[0_20px_80px_rgba(255,162,82,0.28)]`}>
                    {audit.score}
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#ffcf88]">{audit.verdict}</p>
                  <h2 className="mt-2 text-3xl font-semibold text-[#fff3de]">{scoreLabel(audit.score, language)}</h2>
                  <p className="mt-4 text-base leading-7 text-[#e0d1b8]">{audit.roast}</p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#af9b7d]">{pageCopy.bagValue}</p>
                      <p className="mt-2 text-2xl font-semibold text-[#fff5e4]">{formatUsd(audit.summary.totalValueUsd, language)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#af9b7d]">{pageCopy.tokens}</p>
                      <p className="mt-2 text-2xl font-semibold text-[#fff5e4]">{audit.summary.tokenCount}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#af9b7d]">{pageCopy.stablecoins}</p>
                      <p className="mt-2 text-2xl font-semibold text-[#fff5e4]">{audit.summary.stablecoinPct.toFixed(1)}%</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#af9b7d]">{pageCopy.memeBeta}</p>
                      <p className="mt-2 text-2xl font-semibold text-[#fff5e4]">{audit.summary.memePct.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ffcf88]">{pageCopy.shareBait}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-[#fff3de]">{pageCopy.shareCardTitle}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#c9b79a]">{pageCopy.shareCardSubtitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadShareCard}
                      disabled={isDownloadingImage}
                      className="inline-flex items-center gap-2 rounded-full border border-[#ffb46a]/30 bg-[#ffb46a]/10 px-4 py-2 text-sm font-medium text-[#ffd79f] transition hover:bg-[#ffb46a]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDownloadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      {isDownloadingImage ? pageCopy.downloadingImage : pageCopy.downloadImage}
                    </button>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(255,168,86,0.28),transparent_32%),linear-gradient(180deg,#17120d_0%,#0f0c09_100%)] p-6">
                    <div className="inline-flex rounded-full border border-[#ffb46a]/30 bg-[#ffb46a]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffd79f]">
                      {pageCopy.cardBadge}
                    </div>
                    <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-2xl">
                        <p className="text-sm text-[#bba98a]">{shortenWallet(audit.walletAddress)}</p>
                        <h3 className="mt-2 text-3xl font-semibold text-[#fff4df]">{audit.verdict}</h3>
                        <p className="mt-3 text-base leading-7 text-[#e2d3bb]">{audit.roast}</p>
                      </div>
                      <div className={`inline-flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br ${scoreTone(audit.score)} text-4xl font-semibold text-[#1a1109] shadow-[0_20px_80px_rgba(255,162,82,0.28)]`}>
                        {audit.score}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-4">
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#af9b7d]">{pageCopy.bagValue}</p>
                        <p className="mt-2 text-xl font-semibold text-[#fff5e4]">{formatUsd(audit.summary.totalValueUsd, language)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#af9b7d]">{pageCopy.stablecoins}</p>
                        <p className="mt-2 text-xl font-semibold text-[#fff5e4]">{audit.summary.stablecoinPct.toFixed(1)}%</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#af9b7d]">{pageCopy.tokens}</p>
                        <p className="mt-2 text-xl font-semibold text-[#fff5e4]">{audit.summary.tokenCount}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#af9b7d]">{pageCopy.memeBeta}</p>
                        <p className="mt-2 text-xl font-semibold text-[#fff5e4]">{audit.summary.memePct.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/8 pt-4 text-sm text-[#cdbd9f]">
                      <span>{pageCopy.cardFooter}</span>
                      <span>app.miraix.fun/wallet-roast</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ffcf88]">{pageCopy.shareBait}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-[#fff3de]">{pageCopy.shareTitle}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(audit.shareText, 'share')}
                      className="inline-flex items-center gap-2 rounded-full border border-[#ffb46a]/30 bg-[#ffb46a]/10 px-4 py-2 text-sm font-medium text-[#ffd79f] transition hover:bg-[#ffb46a]/20"
                    >
                      <Copy className="h-4 w-4" />
                      {copiedText === 'share' ? pageCopy.copied : pageCopy.copyShareText}
                    </button>
                  </div>
                  <p className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4 text-sm leading-7 text-[#e9dcc7]">
                    {audit.shareText}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ffcf88]">{pageCopy.topHoldings}</p>
                  <div className="mt-5 space-y-3">
                    {audit.topHoldings.map((holding) => (
                      <div key={holding.symbol} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-semibold text-[#fff3de]">{holding.symbol}</p>
                              {holding.isRiskToken ? (
                                <span className="rounded-full bg-rose-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-200">
                                  {pageCopy.riskBadge}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm text-[#baaa8d]">{holding.balance} {pageCopy.tokenUnit}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-semibold text-[#fff5e4]">{formatUsd(holding.valueUsd, language)}</p>
                            <p className="text-sm text-[#baaa8d]">{holding.allocationPct.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#ff9a3c] to-[#ffd36f]"
                            style={{ width: `${Math.min(holding.allocationPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ffcf88]">{pageCopy.mainRisks}</p>
                  <div className="mt-5 space-y-3">
                    {audit.risks.map((risk) => (
                      <div key={`${risk.title}-${risk.level}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffd79f]">
                            {pageCopy.levels[risk.level]}
                          </span>
                          <p className="text-sm font-semibold text-[#fff3de]">{risk.title}</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#cbbca1]">{risk.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ffcf88]">{pageCopy.actionQueue}</p>
                  <div className="mt-5 space-y-4">
                    {audit.actions.map((action) => (
                      <div key={action.command} className="rounded-[28px] border border-[#ffb46a]/20 bg-[linear-gradient(180deg,rgba(255,180,106,0.12),rgba(255,255,255,0.04))] p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold text-[#fff4de]">{action.title}</p>
                            <p className="mt-2 text-sm leading-6 text-[#d2c2a4]">{action.rationale}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(action.command, action.command)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#ffd79f]"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            {copiedText === action.command ? pageCopy.copied : pageCopy.copy}
                          </button>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/8 bg-black/25 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-[#ad9a7f]">{pageCopy.command}</p>
                          <p className="mt-2 font-mono text-sm text-[#fff8ed]">{action.command}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => openCommandInChat(action.command)}
                            className="inline-flex items-center gap-2 rounded-full bg-[#ff9a3c] px-4 py-2 text-sm font-semibold text-[#20140a] transition hover:bg-[#ffb15d]"
                          >
                            {pageCopy.runInChat}
                            <ArrowRight className="h-4 w-4" />
                          </button>
                          {action.estimatedUsd ? (
                            <span className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm text-[#cfbe9f]">
                              {pageCopy.suggestedClip}: {action.estimatedUsd}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-[#d7c8ad]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ffcf88]">{pageCopy.howToUse}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-black/15 p-5">
                  <p className="text-lg font-semibold text-[#fff4de]">{pageCopy.stepOneTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-[#bda98a]">{pageCopy.stepOneBody}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/15 p-5">
                  <p className="text-lg font-semibold text-[#fff4de]">{pageCopy.stepTwoTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-[#bda98a]">{pageCopy.stepTwoBody}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/15 p-5">
                  <p className="text-lg font-semibold text-[#fff4de]">{pageCopy.stepThreeTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-[#bda98a]">{pageCopy.stepThreeBody}</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
