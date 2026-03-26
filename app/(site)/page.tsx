import Link from "next/link";
import { ArrowRight, Shield, Flame, Wallet, TrendingUp } from "lucide-react";
import { TodaysOrdersLanding } from "@/components/TodaysOrders/TodaysOrdersLanding";
import { isTodaysOrdersVariant } from "@/lib/siteVariant";

const featuredPages = [
  {
    title: "Binance Agent Firewall",
    description:
      "先审 AI 交易员，再让它碰 Binance。真实市场数据、权限矩阵、Pass/Warn/Block 裁决与分享卡一次给齐。",
    href: "/binance-agent-firewall",
    icon: Shield,
    accent: "from-[#facc15]/20 via-[#f59e0b]/10 to-transparent",
    border: "border-[#facc15]/20",
    text: "text-[#fff0b8]",
  },
  {
    title: "Meme Rotation Desk",
    description:
      "Bitget Wallet 赛道版本：让 Scout、Risk、Trader 三个 agent 只批准一笔有纪律的 Solana meme trade。",
    href: "/meme-rotation-desk",
    icon: TrendingUp,
    accent: "from-[#34d399]/16 via-[#10b981]/10 to-transparent",
    border: "border-emerald-300/18",
    text: "text-emerald-100",
  },
  {
    title: "Miraix Rotation Desk",
    description: "把“我有 100U 今天该怎么做”拆成策略、风控、执行三层 agent，并在 X Layer 上完成付款与广播。",
    href: "/fomo-copilot",
    icon: Flame,
    accent: "from-[#38bdf8]/16 via-[#0ea5e9]/10 to-transparent",
    border: "border-sky-300/18",
    text: "text-sky-100",
  },
  {
    title: "Wallet Roast",
    description:
      "把持仓分析做成能传播的结果卡：评分、吐槽、风险和调仓建议都在一屏内。",
    href: "/wallet-roast",
    icon: Wallet,
    accent: "from-[#fb923c]/18 via-[#f97316]/10 to-transparent",
    border: "border-orange-300/18",
    text: "text-orange-100",
  },
] as const;

export default function Home() {
  if (isTodaysOrdersVariant) {
    return <TodaysOrdersLanding standalone />;
  }

  return (
    <main className="min-h-screen overflow-y-auto bg-[#07070a] text-[#fff7e6]">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.12),_transparent_24%),linear-gradient(180deg,_#111114_0%,_#09090b_46%,_#060607_100%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-20 pt-24 md:px-8">
          <section className="rounded-[36px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#fde68a]">
              Miraix
            </p>
            <h1 className="mt-4 max-w-5xl font-serif text-4xl font-semibold tracking-tight text-[#fff7e6] md:text-6xl">
              AI 不该只会聊天，也该会被约束、被验证、被审判。
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#d3c09b] md:text-lg">
              这里放的是 Miraix
              当前最能打的几条产品线：Bitget 赛道的 Meme Rotation Desk、
              传播型钱包分析、可执行交易 copilots，以及专门为 Binance
              场景准备的 Agent Firewall。
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/binance-agent-firewall"
                className="inline-flex items-center gap-2 rounded-full bg-[#facc15] px-5 py-3 text-sm font-semibold text-[#171208] transition hover:bg-[#f5d75f]"
              >
                Open Binance Agent Firewall
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/agent-hub"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-[#f4deb2] transition hover:border-[#facc15]/20 hover:bg-[#facc15]/10"
              >
                Browse Agent Hub
              </Link>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featuredPages.map((page) => {
              const Icon = page.icon;

              return (
                <Link
                  key={page.title}
                  href={page.href}
                  className={`group rounded-[32px] border bg-white/[0.04] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.06] ${page.border}`}
                >
                  <div
                    className={`rounded-[24px] bg-gradient-to-br ${page.accent} p-5`}
                  >
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className={`mt-5 text-2xl font-semibold ${page.text}`}>
                      {page.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[#d3c09b]">
                      {page.description}
                    </p>
                  </div>

                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#fff3cb]">
                    Open page
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </section>
        </div>
      </div>
    </main>
  );
}
