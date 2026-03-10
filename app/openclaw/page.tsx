'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

const PUBLIC_APP_ORIGIN = 'https://app.miraix.fun'
const PUBLIC_AUDIT_ENDPOINT = `${PUBLIC_APP_ORIGIN}/api/wallet-audit`
const PUBLIC_SHARE_IMAGE_ENDPOINT = `${PUBLIC_APP_ORIGIN}/api/wallet-roast/share-image`
const EXAMPLE_WALLET = 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'

const installPrompt = `为我创建一个本地 helper，名字叫 miraix-wallet-roast。

当我要求你分析 Solana 钱包、roast 持仓、生成调仓建议时，你应该：
1. 向 ${PUBLIC_AUDIT_ENDPOINT} 发起 POST 请求
2. Header 使用 Content-Type: application/json
3. Body 使用 {"walletAddress":"<solana钱包地址>","language":"zh"}
4. 返回后总结 score、verdict、roast、risks、actions
5. 如果我要求发帖文案，再基于返回结果生成一段适合发 X 的中文文案
6. 如果我要求分享截图、海报或图片，直接返回这个图片地址：
${PUBLIC_SHARE_IMAGE_ENDPOINT}?walletAddress=<solana钱包地址>&language=zh

先帮我完成这个 helper，然后告诉我怎么调用它。`

const testPrompt = `请使用 miraix-wallet-roast 分析这个 Solana 钱包，并给我中文结果和三条调仓建议：
${EXAMPLE_WALLET}`

const curlExample = `curl -X POST ${PUBLIC_AUDIT_ENDPOINT} \\
  -H 'Content-Type: application/json' \\
  -d '{"walletAddress":"${EXAMPLE_WALLET}","language":"zh"}'`

const responseExample = `{
  "success": true,
  "provider": "okx-onchainos",
  "language": "zh",
  "walletAddress": "${EXAMPLE_WALLET}",
  "score": 40,
  "verdict": "接盘实习生",
  "roast": "接盘实习生，评分 40/100。USDC 占了仓位的 100%，这已经不是信仰，是人质局了。",
  "risks": [
    {
      "level": "medium",
      "title": "单一持仓依赖过高",
      "detail": "USDC 控制了 100% 的组合价值，现在整个钱包几乎都押在一个叙事上。"
    }
  ],
  "actions": [
    {
      "title": "清掉一个 dust 仓位",
      "command": "swap 0.024524 USDC to SOL"
    }
  ],
  "shareText": "MiraiX 钱包 Roast：接盘实习生，评分 40/100。..."
}`

const selfHostedPrompt = `如果你不想用公共地址，可以把上面的接口地址替换成你自己的部署地址。

最小要求：
1. 暴露一个 POST /api/wallet-audit 接口
2. 请求体接收 walletAddress 和 language
3. 返回字段至少包含 score、verdict、roast、risks、actions、shareText

示例：
POST https://your-domain.com/api/wallet-audit`

const sections = [
  { id: 'prepare', label: '准备工作' },
  { id: 'install', label: '添加到 Agent' },
  { id: 'try', label: '试一试' },
  { id: 'self-host', label: '自定义部署' },
  { id: 'support', label: '遇到问题' }
] as const

export default function OpenClawDocsPage() {
  const copyToClipboard = useCopyToClipboard()
  const [copied, setCopied] = useState('')

  const handleCopy = async (id: string, value: string) => {
    const ok = await copyToClipboard(value)
    if (!ok) {
      return
    }

    setCopied(id)
    window.setTimeout(() => setCopied(''), 1800)
  }

  const copyLabel = (id: string) => (copied === id ? '已复制' : '复制')

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#1a1611]">
      <div className="border-b border-[#d7ccbc] bg-[#fbf7f1]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#8a6a3f]">
            Miraix Docs
          </p>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl font-semibold tracking-tight text-[#1b140d] md:text-6xl">
            运行你的第一个 Miraix Wallet Roast Agent
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#574a3a] md:text-lg">
            为你的 OpenClaw 或任意 AI Agent 接入 Miraix 的钱包 roast 能力。它会通过
            OKX OnchainOS 拉取钱包数据，输出评分、吐槽、风险和调仓建议，全程支持自然语言调用。
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-[220px_minmax(0,1fr)] md:px-8">
        <aside className="top-8 h-fit md:sticky">
          <div className="rounded-3xl border border-[#ddd1c0] bg-white/90 p-5 shadow-[0_20px_60px_rgba(36,24,10,0.06)]">
            <p className="text-sm font-semibold text-[#6d5738]">目录</p>
            <nav className="mt-4 space-y-2 text-sm text-[#675949]">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-xl px-3 py-2 transition hover:bg-[#f3ece1] hover:text-[#1a1611]"
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="space-y-8">
          <section
            id="prepare"
            className="rounded-[32px] border border-[#ddd1c0] bg-white/90 p-6 shadow-[0_20px_60px_rgba(36,24,10,0.06)] md:p-8"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8a6a3f]">
              准备工作
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[#1a1611]">安装一个 AI Agent</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[#5d5041]">
              本指南以 OpenClaw 为例。Miraix 的公共服务同样适用于任何能发起 HTTP 请求的
              Agent，包括 Cursor、Claude Code、OpenClaw 和其它支持本地 helper 或 skill 的客户端。
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#e8dfd2] bg-[#faf7f1] p-4">
                <p className="font-semibold text-[#1e1812]">公共服务地址</p>
                <p className="mt-2 break-all text-sm leading-6 text-[#665847]">{PUBLIC_AUDIT_ENDPOINT}</p>
              </div>
              <div className="rounded-2xl border border-[#e8dfd2] bg-[#faf7f1] p-4">
                <p className="font-semibold text-[#1e1812]">请求方法</p>
                <p className="mt-2 text-sm leading-6 text-[#665847]">
                  <code className="rounded bg-white px-1.5 py-0.5">POST</code>
                  {' '}
                  <code className="rounded bg-white px-1.5 py-0.5">application/json</code>
                </p>
              </div>
              <div className="rounded-2xl border border-[#e8dfd2] bg-[#faf7f1] p-4">
                <p className="font-semibold text-[#1e1812]">最小参数</p>
                <p className="mt-2 text-sm leading-6 text-[#665847]">
                  <code className="rounded bg-white px-1.5 py-0.5">walletAddress</code>
                  {' '}
                  和
                  {' '}
                  <code className="rounded bg-white px-1.5 py-0.5">language</code>
                </p>
              </div>
            </div>
          </section>

          <section
            id="install"
            className="rounded-[32px] border border-[#ddd1c0] bg-white/90 p-6 shadow-[0_20px_60px_rgba(36,24,10,0.06)] md:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8a6a3f]">
                  第一步
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-[#1a1611]">将 Miraix 添加到你的 Agent</h2>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('install', installPrompt)}
                className="inline-flex items-center gap-2 rounded-full border border-[#d8c6a9] bg-[#f6ecdc] px-4 py-2 text-sm font-medium text-[#5e4829] transition hover:bg-[#f1e3cf]"
              >
                <Copy className="h-4 w-4" />
                {copyLabel('install')}
              </button>
            </div>

            <p className="mt-4 max-w-3xl text-base leading-8 text-[#5d5041]">
              告诉你的 Agent：创建一个本地 helper 或 skill，内部通过 HTTP 调用 Miraix 的公共接口。
              这是最简单的接入方式，不需要用户克隆你的仓库，也不需要他们自己配置 OKX 凭证。
            </p>

            <div className="mt-6 rounded-3xl border border-[#eadfce] bg-[#13100c] p-5 text-sm leading-7 text-[#f7f0e5]">
              <pre className="overflow-x-auto whitespace-pre-wrap">
                <code>{installPrompt}</code>
              </pre>
            </div>

            <div className="mt-6 rounded-2xl border border-[#e8dfd2] bg-[#faf7f1] p-5">
              <p className="text-sm font-semibold text-[#1e1812]">接口参数</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#e8dfd2] bg-white p-4">
                  <p className="font-mono text-sm text-[#8a6a3f]">walletAddress</p>
                  <p className="mt-2 text-sm leading-6 text-[#665847]">
                    必填。要分析的 Solana 钱包地址。
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e8dfd2] bg-white p-4">
                  <p className="font-mono text-sm text-[#8a6a3f]">language</p>
                  <p className="mt-2 text-sm leading-6 text-[#665847]">
                    可选。支持 <code className="rounded bg-[#f7f1e7] px-1 py-0.5">zh</code> 和
                    {' '}
                    <code className="rounded bg-[#f7f1e7] px-1 py-0.5">en</code>，默认建议传
                    {' '}
                    <code className="rounded bg-[#f7f1e7] px-1 py-0.5">zh</code>。
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            id="try"
            className="rounded-[32px] border border-[#ddd1c0] bg-white/90 p-6 shadow-[0_20px_60px_rgba(36,24,10,0.06)] md:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8a6a3f]">
                  第二步
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-[#1a1611]">试一试</h2>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('try', testPrompt)}
                className="inline-flex items-center gap-2 rounded-full border border-[#d8c6a9] bg-[#f6ecdc] px-4 py-2 text-sm font-medium text-[#5e4829] transition hover:bg-[#f1e3cf]"
              >
                <Copy className="h-4 w-4" />
                {copyLabel('try')}
              </button>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-[#1e1812]">告诉你的 Agent</p>
                <div className="mt-3 rounded-3xl border border-[#eadfce] bg-[#13100c] p-5 text-sm leading-7 text-[#f7f0e5]">
                  <pre className="overflow-x-auto whitespace-pre-wrap">
                    <code>{testPrompt}</code>
                  </pre>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#1e1812]">直接测试 API</p>
                  <button
                    type="button"
                    onClick={() => handleCopy('curl', curlExample)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d8c6a9] bg-[#f6ecdc] px-4 py-2 text-sm font-medium text-[#5e4829] transition hover:bg-[#f1e3cf]"
                  >
                    <Copy className="h-4 w-4" />
                    {copyLabel('curl')}
                  </button>
                </div>
                <div className="mt-3 rounded-3xl border border-[#eadfce] bg-[#13100c] p-5 text-sm leading-7 text-[#f7f0e5]">
                  <pre className="overflow-x-auto whitespace-pre-wrap">
                    <code>{curlExample}</code>
                  </pre>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#1e1812]">返回结构示例</p>
                <button
                  type="button"
                  onClick={() => handleCopy('response', responseExample)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d8c6a9] bg-[#f6ecdc] px-4 py-2 text-sm font-medium text-[#5e4829] transition hover:bg-[#f1e3cf]"
                >
                  <Copy className="h-4 w-4" />
                  {copyLabel('response')}
                </button>
              </div>
              <div className="mt-3 rounded-3xl border border-[#eadfce] bg-[#13100c] p-5 text-sm leading-7 text-[#f7f0e5]">
                <pre className="overflow-x-auto whitespace-pre-wrap">
                  <code>{responseExample}</code>
                </pre>
              </div>
            </div>
          </section>

          <section
            id="self-host"
            className="rounded-[32px] border border-[#ddd1c0] bg-white/90 p-6 shadow-[0_20px_60px_rgba(36,24,10,0.06)] md:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8a6a3f]">
                  第三步
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-[#1a1611]">如果你想替换成你自己的服务</h2>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('self-host', selfHostedPrompt)}
                className="inline-flex items-center gap-2 rounded-full border border-[#d8c6a9] bg-[#f6ecdc] px-4 py-2 text-sm font-medium text-[#5e4829] transition hover:bg-[#f1e3cf]"
              >
                <Copy className="h-4 w-4" />
                {copyLabel('self-host')}
              </button>
            </div>

            <p className="mt-4 max-w-3xl text-base leading-8 text-[#5d5041]">
              公共地址适合直接体验。如果你需要私有化、控制流量或接自己的后端，只需要保持同样的
              HTTP 接口结构，然后把 Agent 的目标地址换成你的域名即可。
            </p>

            <div className="mt-6 rounded-3xl border border-[#eadfce] bg-[#13100c] p-5 text-sm leading-7 text-[#f7f0e5]">
              <pre className="overflow-x-auto whitespace-pre-wrap">
                <code>{selfHostedPrompt}</code>
              </pre>
            </div>

          </section>

          <section
            id="support"
            className="rounded-[32px] border border-[#ddd1c0] bg-white/90 p-6 shadow-[0_20px_60px_rgba(36,24,10,0.06)] md:p-8"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8a6a3f]">
              遇到问题？
            </p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[#5d5041]">
              <p>
                如果 Agent 没有按预期调用接口，先让它直接执行上面的
                {' '}
                <code className="rounded bg-[#f6efe3] px-1.5 py-0.5">{curlExample}</code>
                {' '}
                验证网络是否正常。
              </p>
              <p>
                如果返回钱包地址错误，确认输入的是
                {' '}
                <code className="rounded bg-[#f6efe3] px-1.5 py-0.5">Solana</code>
                {' '}
                地址，而不是 EVM 地址。
              </p>
              <p>
                如果你要让用户先看结果再手动执行交易，可以直接把他们引导到
                {' '}
                <Link href="/wallet-roast" className="font-medium text-[#7b5b30] underline underline-offset-4">
                  Wallet Roast 页面
                </Link>
                。
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={PUBLIC_AUDIT_ENDPOINT}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#d8c6a9] bg-[#f6ecdc] px-4 py-2 text-sm font-medium text-[#5e4829] transition hover:bg-[#f1e3cf]"
              >
                打开公共 API 地址
                <ExternalLink className="h-4 w-4" />
              </a>
              <Link
                href="/wallet-roast"
                className="inline-flex items-center gap-2 rounded-full border border-[#d8c6a9] bg-white px-4 py-2 text-sm font-medium text-[#5e4829] transition hover:bg-[#faf7f1]"
              >
                打开产品页面
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
