import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Gavel,
  Radar,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { MemeRotationDeskConsole } from "@/components/MemeRotationDesk/MemeRotationDeskConsole";

const agents = [
  {
    title: "Scout Agent",
    label: "Discovery",
    description:
      "Pull ranked Solana meme candidates, inspect momentum, and reduce the list to a small watchset worth reviewing.",
    accent: "from-emerald-400/20 via-emerald-300/10 to-transparent",
    border: "border-emerald-300/15",
  },
  {
    title: "Risk Agent",
    label: "Rug Court",
    description:
      "Run security audit, dev risk, liquidity, and concentration checks. If the evidence is weak, the trade dies here.",
    accent: "from-amber-400/20 via-orange-300/10 to-transparent",
    border: "border-amber-300/15",
  },
  {
    title: "Trader Agent",
    label: "Execution",
    description:
      "Prepare one disciplined Solana meme trade, cap the position size, and hand the wallet a single clear action to sign.",
    accent: "from-sky-400/20 via-cyan-300/10 to-transparent",
    border: "border-sky-300/15",
  },
] as const;

const flow = [
  {
    title: "Find one candidate",
    body: "The desk screens ranked pairs and recent on-chain activity. It does not spam ten ideas. It narrows to one tradeable setup.",
    icon: Radar,
  },
  {
    title: "Put it on trial",
    body: "Rug Court forces the asset through security, developer, liquidity, and concentration checks before any order is allowed.",
    icon: Gavel,
  },
  {
    title: "Ship one disciplined order",
    body: "The wallet sees one approved route, one position size, one invalidation, and one execution trail to verify afterward.",
    icon: Wallet,
  },
] as const;

const rails = [
  "Live Bitget-powered discovery, safety screening, and quote preparation for Solana meme trading.",
  "Three agents. One wallet. One disciplined meme trade.",
  "A submission-ready demo flow lives below: shortlist, Rug Court, one trade, unsigned payload.",
] as const;

const proofPoints = [
  {
    title: "Why it stands out",
    body: "Most meme bots chase speed. This desk optimizes for a defendable trade: discover, veto, then execute.",
  },
  {
    title: "What the demo proves",
    body: "One wallet, one shortlist, one approved Solana meme trade, one unsigned payload path for the wallet to review.",
  },
  {
    title: "Why the scope is disciplined",
    body: "The product stays narrow on purpose: single-chain Solana flow, human-in-the-loop execution, and no generic chat wrapper.",
  },
] as const;

const demoFlow = [
  {
    step: "01",
    title: "Set the desk",
    body: "Use the connected wallet or the sample wallet, choose budget, risk mode, and desk style.",
  },
  {
    step: "02",
    title: "Run Rug Court",
    body: "Scout narrows the market, Risk Agent vetoes weak setups, and the desk leaves exactly one approved trade.",
  },
  {
    step: "03",
    title: "Review execution",
    body: "Inspect the live quote state, route source, expected output, and the invalidation and take-profit ladder.",
  },
  {
    step: "04",
    title: "Prepare the payload",
    body: "Generate the unsigned order or swap payload, then hand execution to the wallet for explicit signing.",
  },
] as const;

export default function MemeRotationDeskPage() {
  return (
    <main className="min-h-screen overflow-y-auto bg-[#07090b] text-[#f5f7f5]">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.12),_transparent_28%),linear-gradient(180deg,_#0a0d10_0%,_#07090b_44%,_#040506_100%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-20 pt-24 md:px-8">
          <section className="rounded-[36px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl md:p-10">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#b9f5d5]">
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 font-semibold uppercase tracking-[0.24em]">
                Bitget Wallet Track
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[#d8dfd8]">
                Miraix Meme Rotation Desk
              </span>
            </div>

            <h1 className="mt-5 max-w-5xl font-serif text-4xl font-semibold tracking-tight text-[#f8fbf8] md:text-6xl">
              Three agents. One wallet. One disciplined meme trade.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#c1cbbf] md:text-lg">
              A Bitget-powered Solana meme trading agent that scouts ranked
              opportunities, puts every candidate through Rug Court, and only
              ships one defendable trade for the wallet to sign.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/meme-rotation-desk#desk-console"
                className="inline-flex items-center gap-2 rounded-full bg-[#10b981] px-5 py-3 text-sm font-semibold text-[#04110c] transition hover:bg-[#34d399]"
              >
                Run Submission Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/fomo-copilot"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-[#d7e0d6] transition hover:border-emerald-300/20 hover:bg-emerald-400/10"
              >
                Open Current Trade Flow
              </Link>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {rails.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-[#d8dfd8]"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
            <div className="flex items-center gap-3 text-[#dff7ea]">
              <Radar className="h-5 w-5 text-emerald-200" />
              <p className="text-sm font-semibold uppercase tracking-[0.28em]">
                Judge Demo Flow
              </p>
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-[#f8fbf8]">
              What to do in the first 60 seconds
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {demoFlow.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[24px] border border-white/10 bg-black/20 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9fdabc]">
                    Step {item.step}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#d3dbd3]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <MemeRotationDeskConsole />

          <section className="grid gap-6 lg:grid-cols-3">
            {agents.map((agent) => (
              <article
                key={agent.title}
                className={`rounded-[30px] border bg-white/[0.04] p-6 backdrop-blur-xl ${agent.border}`}
              >
                <div
                  className={`rounded-[24px] bg-gradient-to-br ${agent.accent} p-5`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#dafce9]">
                    {agent.label}
                  </p>
                  <h2 className="mt-4 text-2xl font-semibold text-white">
                    {agent.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#d3dbd3]">
                    {agent.description}
                  </p>
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
              <div className="flex items-center gap-3 text-[#f5d98b]">
                <Gavel className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.28em]">
                  Rug Court Inside The Desk
                </p>
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-[#f8fbf8]">
                Discovery alone is not a product.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#c1cbbf] md:text-base">
                The differentiator is not that Miraix can find a meme coin. The
                differentiator is that the system can reject a bad one before
                it touches the wallet. This page is the clean product shell for
                that Bitget-track story.
              </p>

              <div className="mt-8 grid gap-4">
                {flow.map((step) => {
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.title}
                      className="rounded-[24px] border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-emerald-200">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                          {step.title}
                        </h3>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[#d3dbd3]">
                        {step.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6">
              <section className="rounded-[32px] border border-emerald-300/15 bg-white/[0.04] p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3 text-[#b9f5d5]">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="text-sm font-semibold uppercase tracking-[0.28em]">
                    Sponsor Fit
                  </p>
                </div>
                <p className="mt-4 text-sm leading-7 text-[#d3dbd3]">
                  This submission is intentionally narrow: Bitget live market
                  discovery, Rug Court safety screening, and one human-approved
                  Solana meme trade path. It is a focused trading agent, not a
                  general chatbot.
                </p>
              </section>

              <section className="rounded-[32px] border border-sky-300/15 bg-white/[0.04] p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3 text-sky-100">
                  <BarChart3 className="h-5 w-5" />
                  <p className="text-sm font-semibold uppercase tracking-[0.28em]">
                    Submission Notes
                  </p>
                </div>

                <div className="mt-5 grid gap-4">
                  {proofPoints.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[22px] border border-white/10 bg-black/20 p-4"
                    >
                      <h3 className="text-base font-semibold text-white">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[#d3dbd3]">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
