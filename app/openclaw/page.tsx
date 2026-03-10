'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

const PUBLIC_APP_ORIGIN = 'https://app.miraix.fun'
const SKILL_SLUG = 'miraix-wallet-roast'
const CLAWHUB_INSTALL_COMMAND = `clawhub install ${SKILL_SLUG}`
const CLAWHUB_SEARCH_COMMAND = 'clawhub search miraix wallet roast'
const CLAWHUB_INSPECT_COMMAND = `clawhub inspect ${SKILL_SLUG}`
const EXAMPLE_WALLET = 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'

const installPrompt = `运行 ${CLAWHUB_INSTALL_COMMAND} 安装 Miraix Wallet Roast。安装完成后，重新打开一个 OpenClaw 会话，并告诉我这个 skill 支持什么能力。`

const agentInstallPrompt = `请帮我安装 ClawHub 上的 Miraix Wallet Roast skill。

请运行：
${CLAWHUB_INSTALL_COMMAND}

安装完成后，重新开始一个会话，然后告诉我怎么使用 $miraix-wallet-roast。`

const testPrompt = `请使用 $miraix-wallet-roast 分析这个 Solana 钱包，并给我中文结果、三条调仓建议，以及一张分享截图链接：
${EXAMPLE_WALLET}`

const sharePrompt = `请使用 $miraix-wallet-roast 分析这个 Solana 钱包，然后在结果后直接附上分享截图链接：
${EXAMPLE_WALLET}`

const discoverPrompt = `如果你想先确认它已经上架，可以运行：
${CLAWHUB_SEARCH_COMMAND}

如果你想直接查看这个 skill 的详情，可以运行：
${CLAWHUB_INSPECT_COMMAND}`

const sections = [
  { id: 'prepare', label: '准备工作' },
  { id: 'install', label: '添加到 Agent' },
  { id: 'try', label: '试一试' },
  { id: 'discover', label: '在 ClawHub 找到它' },
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
            安装 Miraix Wallet Roast Skill
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#574a3a] md:text-lg">
            Miraix Wallet Roast 已经上架 ClawHub。你的 OpenClaw 现在可以直接安装这个 skill，
            通过 Miraix 公共服务调用 OKX OnchainOS，输出钱包评分、吐槽、风险、调仓建议，并在需要时返回分享截图。
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
              本指南以 OpenClaw 为例。你不需要手写 helper，也不需要克隆仓库。
              现在直接从 ClawHub 安装已经发布好的 `miraix-wallet-roast` 即可。
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#e8dfd2] bg-[#faf7f1] p-4">
                <p className="font-semibold text-[#1e1812]">安装命令</p>
                <p className="mt-2 break-all text-sm leading-6 text-[#665847]">{CLAWHUB_INSTALL_COMMAND}</p>
              </div>
              <div className="rounded-2xl border border-[#e8dfd2] bg-[#faf7f1] p-4">
                <p className="font-semibold text-[#1e1812]">ClawHub 名称</p>
                <p className="mt-2 text-sm leading-6 text-[#665847]">{SKILL_SLUG}</p>
              </div>
              <div className="rounded-2xl border border-[#e8dfd2] bg-[#faf7f1] p-4">
                <p className="font-semibold text-[#1e1812]">能力范围</p>
                <p className="mt-2 text-sm leading-6 text-[#665847]">
                  钱包评分、持仓吐槽、风险解释、调仓建议，且默认附带分享截图
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
                <h2 className="mt-3 text-3xl font-semibold text-[#1a1611]">将 Skill 添加到你的 Agent</h2>
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
              最直接的方式是在终端运行安装命令。安装完成后，重新打开一个 OpenClaw 会话，
              它就能以 `miraix-wallet-roast` 这个 skill 名称来调用 Miraix 的钱包 roast 能力。
            </p>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-[#eadfce] bg-[#13100c] p-5 text-sm leading-7 text-[#f7f0e5]">
                <pre className="overflow-x-auto whitespace-pre-wrap">
                  <code>{CLAWHUB_INSTALL_COMMAND}</code>
                </pre>
              </div>
              <div className="rounded-3xl border border-[#eadfce] bg-[#faf7f1] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#1e1812]">如果你想让 Agent 帮你装</p>
                  <button
                    type="button"
                    onClick={() => handleCopy('agent-install', agentInstallPrompt)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d8c6a9] bg-[#f6ecdc] px-4 py-2 text-sm font-medium text-[#5e4829] transition hover:bg-[#f1e3cf]"
                  >
                    <Copy className="h-4 w-4" />
                    {copyLabel('agent-install')}
                  </button>
                </div>
                <div className="mt-3 rounded-3xl border border-[#eadfce] bg-[#13100c] p-5 text-sm leading-7 text-[#f7f0e5]">
                  <pre className="overflow-x-auto whitespace-pre-wrap">
                    <code>{agentInstallPrompt}</code>
                  </pre>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#e8dfd2] bg-[#faf7f1] p-5">
              <p className="text-sm font-semibold text-[#1e1812]">安装后你会得到什么</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#e8dfd2] bg-white p-4">
                  <p className="font-mono text-sm text-[#8a6a3f]">Wallet Roast</p>
                  <p className="mt-2 text-sm leading-6 text-[#665847]">
                    输出 score、verdict、roast、main risks 和调仓建议。
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e8dfd2] bg-white p-4">
                  <p className="font-mono text-sm text-[#8a6a3f]">Share Card</p>
                  <p className="mt-2 text-sm leading-6 text-[#665847]">
                    每次钱包分析默认都会附一个可直接分享的图片链接；如果客户端支持，也可以直接预览。
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            id="try"
            className="rounded-[32px] border border-[#ddd1c0] bg-white/90 p-6 shadow-[0_20px_60px_rgba(36,24,10,0.06)] md:p-8"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8a6a3f]">
              第二步
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[#1a1611]">试一试</h2>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-[#eadfce] bg-[#faf7f1] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#1e1812]">钱包分析</p>
                  <button
                    type="button"
                    onClick={() => handleCopy('try', testPrompt)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d8c6a9] bg-[#f6ecdc] px-4 py-2 text-sm font-medium text-[#5e4829] transition hover:bg-[#f1e3cf]"
                  >
                    <Copy className="h-4 w-4" />
                    {copyLabel('try')}
                  </button>
                </div>
                <div className="mt-3 rounded-3xl border border-[#eadfce] bg-[#13100c] p-5 text-sm leading-7 text-[#f7f0e5]">
                  <pre className="overflow-x-auto whitespace-pre-wrap">
                    <code>{testPrompt}</code>
                  </pre>
                </div>
              </div>

              <div className="rounded-3xl border border-[#eadfce] bg-[#faf7f1] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#1e1812]">分享截图</p>
                  <button
                    type="button"
                    onClick={() => handleCopy('share', sharePrompt)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d8c6a9] bg-[#f6ecdc] px-4 py-2 text-sm font-medium text-[#5e4829] transition hover:bg-[#f1e3cf]"
                  >
                    <Copy className="h-4 w-4" />
                    {copyLabel('share')}
                  </button>
                </div>
                <div className="mt-3 rounded-3xl border border-[#eadfce] bg-[#13100c] p-5 text-sm leading-7 text-[#f7f0e5]">
                  <pre className="overflow-x-auto whitespace-pre-wrap">
                    <code>{sharePrompt}</code>
                  </pre>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#e8dfd2] bg-[#faf7f1] p-4">
                <p className="font-semibold text-[#1e1812]">钱包分析输出</p>
                <p className="mt-2 text-sm leading-6 text-[#665847]">
                  score、verdict、roast、risks、actions
                </p>
              </div>
              <div className="rounded-2xl border border-[#e8dfd2] bg-[#faf7f1] p-4">
                <p className="font-semibold text-[#1e1812]">分享内容</p>
                <p className="mt-2 text-sm leading-6 text-[#665847]">
                  shareText，以及默认附上的 OKX OnchainOS 分享卡片。
                </p>
              </div>
              <div className="rounded-2xl border border-[#e8dfd2] bg-[#faf7f1] p-4">
                <p className="font-semibold text-[#1e1812]">安装后记得新开会话</p>
                <p className="mt-2 text-sm leading-6 text-[#665847]">
                  让 OpenClaw 重新加载 skill 后，再调用 `$miraix-wallet-roast`。
                </p>
              </div>
            </div>
          </section>

          <section
            id="discover"
            className="rounded-[32px] border border-[#ddd1c0] bg-white/90 p-6 shadow-[0_20px_60px_rgba(36,24,10,0.06)] md:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8a6a3f]">
                  第三步
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-[#1a1611]">在 ClawHub 找到它</h2>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('discover', discoverPrompt)}
                className="inline-flex items-center gap-2 rounded-full border border-[#d8c6a9] bg-[#f6ecdc] px-4 py-2 text-sm font-medium text-[#5e4829] transition hover:bg-[#f1e3cf]"
              >
                <Copy className="h-4 w-4" />
                {copyLabel('discover')}
              </button>
            </div>

            <p className="mt-4 max-w-3xl text-base leading-8 text-[#5d5041]">
              如果你想先确认它已经上架，可以直接在 ClawHub 搜索，或者按 slug 查看详情。
              当前公开安装名就是 `miraix-wallet-roast`。
            </p>

            <div className="mt-6 rounded-3xl border border-[#eadfce] bg-[#13100c] p-5 text-sm leading-7 text-[#f7f0e5]">
              <pre className="overflow-x-auto whitespace-pre-wrap">
                <code>{discoverPrompt}</code>
              </pre>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#e8dfd2] bg-[#faf7f1] p-4">
                <p className="font-semibold text-[#1e1812]">搜索命令</p>
                <p className="mt-2 text-sm leading-6 text-[#665847]">{CLAWHUB_SEARCH_COMMAND}</p>
              </div>
              <div className="rounded-2xl border border-[#e8dfd2] bg-[#faf7f1] p-4">
                <p className="font-semibold text-[#1e1812]">查看详情</p>
                <p className="mt-2 text-sm leading-6 text-[#665847]">{CLAWHUB_INSPECT_COMMAND}</p>
              </div>
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
                如果安装后没有触发 skill，先新开一个 OpenClaw 会话，再确认它已经加载了
                {' '}
                <code className="rounded bg-[#f6efe3] px-1.5 py-0.5">{SKILL_SLUG}</code>
                {' '}
                这个名字。
              </p>
              <p>
                如果你在 ClawHub 网页里没立刻搜到，可以先直接运行
                {' '}
                <code className="rounded bg-[#f6efe3] px-1.5 py-0.5">{CLAWHUB_INSTALL_COMMAND}</code>
                {' '}
                或
                {' '}
                <code className="rounded bg-[#f6efe3] px-1.5 py-0.5">{CLAWHUB_INSPECT_COMMAND}</code>
                。
              </p>
              <p>
                如果返回钱包地址错误，确认输入的是
                {' '}
                <code className="rounded bg-[#f6efe3] px-1.5 py-0.5">Solana</code>
                {' '}
                地址，而不是 EVM 地址。
              </p>
              <p>
                如果你想先在网页里体验完整流程，可以直接打开
                {' '}
                <Link href="/wallet-roast" className="font-medium text-[#7b5b30] underline underline-offset-4">
                  Wallet Roast 页面
                </Link>
                。
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="https://clawhub.ai"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#d8c6a9] bg-[#f6ecdc] px-4 py-2 text-sm font-medium text-[#5e4829] transition hover:bg-[#f1e3cf]"
              >
                打开 ClawHub
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
