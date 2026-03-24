import Link from "next/link";
import {
  ArrowRight,
  Ban,
  Command,
  Compass,
  FileText,
  Radar,
  Wallet,
} from "lucide-react";
import { TodaysOrdersConsole } from "@/components/TodaysOrders/TodaysOrdersConsole";

const fixedOutputs = [
  {
    title: "今日军情",
    detail:
      "先读钱包 posture、集中度、空闲资金、市场 regime。没有军情，不下命令。",
    icon: Radar,
    accent: "from-[#f4c66a]/24 via-[#f29c5b]/10 to-transparent",
  },
  {
    title: "今日军令",
    detail:
      "每天最多只批准 1 条最值得执行的链上命令，其余建议全部压掉，不制造噪音。",
    icon: Command,
    accent: "from-[#83e1cc]/24 via-[#2d9f88]/10 to-transparent",
  },
  {
    title: "今日禁令",
    detail:
      "把今天绝对不该碰的风险写出来：过热标的、错误路径、超预算动作和不该加仓的方向。",
    icon: Ban,
    accent: "from-[#ff9ca6]/24 via-[#8f2d3b]/10 to-transparent",
  },
  {
    title: "执行推演",
    detail:
      "所有可执行动作都先经过 quote、route compare 和 simulate，再决定是否值得 commit。",
    icon: Compass,
    accent: "from-[#72d5ff]/24 via-[#1b88c8]/10 to-transparent",
  },
  {
    title: "夜间战报",
    detail:
      "收口到 receipts、仓位变化、错过的机会和明日 watchpoints，而不是让一天停在聊天窗口。",
    icon: FileText,
    accent: "from-[#c9a6ff]/24 via-[#6141b7]/10 to-transparent",
  },
] as const;

const doctrineCards = [
  {
    title: "One Wallet",
    description:
      "它盯的是一个钱包的一整天，不是任意抛一堆泛化观点给所有人。",
  },
  {
    title: "One Approved Order",
    description:
      "真正的创新点不是给更多建议，而是把 10 条噪音压缩成 1 条最值得批准的命令。",
  },
  {
    title: "One Debrief",
    description:
      "没有回执和复盘的链上 Agent 只是在表演。今日军令必须以晚间战报收尾。",
  },
] as const;

const capabilityMap = [
  {
    skill: "Wallet",
    product: "军情底板",
    description:
      "读取余额、持仓分布、集中度和 idle capital，形成今日军情的基础地形图。",
  },
  {
    skill: "Market",
    product: "战局判读",
    description:
      "把价格、波动、热度和 regime 变成今天该进攻、观察还是撤守的战局判断。",
  },
  {
    skill: "Trade",
    product: "执行推演",
    description:
      "负责 quote、route compare、swap build，把抽象建议收敛成一条可执行路径。",
  },
  {
    skill: "Broadcast",
    product: "军令回执",
    description:
      "一旦命令被批准，就进入签名、广播和 receipt 验证，确保战报不是空口结论。",
  },
] as const;

const demoPath = [
  "连接一个真实或 demo 钱包，打开今日军情，先展示集中度和 idle capital。",
  "给出 3 条候选动作，但只批准 1 条今日军令，同时明确 1 条今日禁令。",
  "展示执行推演：quote、route、预估滑点和 commit 前的模拟结果。",
  "最后停在夜间战报：回执、仓位变化、未执行原因和明日 watchpoints。",
] as const;

const reproducibilitySteps = [
  "安装对应 Claw persona，进入 Today's Orders 工作模式。",
  "连接钱包或加载 demo wallet，上来先请求“给我今天的军情和军令”。",
  "按固定输出复现：军情 -> 军令 -> 禁令 -> 推演 -> 战报。",
] as const;

export function TodaysOrdersLanding({
  standalone = false,
}: {
  standalone?: boolean;
}) {
  return (
    <main className="min-h-screen overflow-y-auto bg-[#06070a] text-[#f6edd8]">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(244,198,106,0.20),transparent_24%),radial-gradient(circle_at_85%_15%,rgba(90,206,186,0.18),transparent_24%),linear-gradient(180deg,#0f1216_0%,#07090d_38%,#06070a_100%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-20 pt-24 md:px-8">
          <section className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="rounded-[38px] border border-white/10 bg-[#11151d]/85 p-8 shadow-[0_32px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f4c66a]/18 bg-[#f4c66a]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d58b]">
                Today&apos;s Orders
                <span className="h-1 w-1 rounded-full bg-[#f7d58b]" />
                OpenClaw x OKX OnchainOS
              </div>

              <h1 className="mt-6 max-w-4xl font-serif text-4xl font-semibold tracking-tight text-[#fff8ea] md:text-6xl">
                今日军令
                <span className="block text-2xl font-medium text-[#d8c7a4] md:text-4xl">
                  Today&apos;s Orders
                </span>
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-[#d7c8ab] md:text-lg">
                它不是帮你做十条交易建议，而是每天替你收敛出一条最值得批准
                的链上命令。用户要的不是更多噪音，而是更清晰的今日军情、今
                日禁令、执行推演和夜间战报。
              </p>

              <div className="mt-8 rounded-[28px] border border-[#83e1cc]/16 bg-[#83e1cc]/8 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#8de6d3]">
                  Core law
                </p>
                <p className="mt-3 text-2xl font-semibold leading-9 text-[#f8f1df]">
                  每天最多只批准 1 条最值得执行的链上命令，
                  其余建议全部压掉。
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#orders-console"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f4c66a] px-5 py-3 text-sm font-semibold text-[#171208] transition hover:bg-[#f1d183]"
                >
                  Open live console
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#fixed-output"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-[#f4deb2] transition hover:border-[#83e1cc]/30 hover:bg-[#83e1cc]/10"
                >
                  See fixed output
                </Link>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {doctrineCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-[24px] border border-white/8 bg-white/[0.04] p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-[#8bd9c9]">
                      {card.title}
                    </p>
                    <p className="mt-3 text-base leading-7 text-[#fff4d8]">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              id="fixed-output"
              className="overflow-hidden rounded-[38px] border border-[#83e1cc]/15 bg-[#0f1419]/90 p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8bd9c9]">
                    Fixed output
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#f5f2e7]">
                    每次都按同一套军令格式输出。
                  </h2>
                </div>
                <div className="rounded-full border border-[#f4c66a]/20 bg-[#f4c66a]/10 px-3 py-1 text-xs font-medium text-[#f4c66a]">
                  Demo-first
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {fixedOutputs.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className={`rounded-[26px] border border-white/8 bg-gradient-to-br ${item.accent} p-5`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-[#e5dcc6]">
                            Step {index + 1}
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-[#fff7e3]">
                            {item.title}
                          </h3>
                        </div>
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/15 text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[#e2d6bd]">
                        {item.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <TodaysOrdersConsole />

          <section className="rounded-[36px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl md:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#f4c66a]">
                Why It Hits
              </p>
              <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#fff7e6] md:text-5xl">
                这不是 another onchain chatbot，而是一种新的日常指挥角色。
              </h2>
              <p className="mt-4 text-base leading-8 text-[#cdbb97] md:text-lg">
                评委不缺看“会分析行情的助手”。真正稀缺的是：一个人格足够清
                晰、输出足够固定、又能把 OnchainOS 能力组织成真实闭环的链
                上日常机制。今日军令的价值就在于，它把一整天的链上判断压缩
                成一条被批准的命令和一份可验证的战报。
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-4">
              {capabilityMap.map((item) => (
                <div
                  key={item.skill}
                  className="rounded-[28px] border border-white/8 bg-[#0f1218] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.22)]"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8bd9c9]">
                    {item.skill}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#fff4d8]">
                    {item.product}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[#cfbf9e]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            id="demo-path"
            className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]"
          >
            <div className="rounded-[34px] border border-[#f9969b]/14 bg-[#160d12] p-8 backdrop-blur-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ffb0b4]">
                60-second demo path
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-[#fff0f1]">
                一分钟里只演示这 4 步，不要散。
              </h2>

              <div className="mt-8 space-y-4">
                {demoPath.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-[22px] border border-white/8 bg-white/[0.03] p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-[#ffb0b4]">
                      Step {index + 1}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[#e2c5c9]">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[34px] border border-[#5bc5e9]/14 bg-[#091219] p-8 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#82dfff]">
                    Reproducibility
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold text-[#ecfbff]">
                    复现链路要像 prompt 模板一样固定。
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#82dfff]/20 bg-[#82dfff]/10 px-4 py-2 text-sm text-[#9fe7ff]">
                  <Wallet className="h-4 w-4" />
                  Wallet-first
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {reproducibilitySteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#82dfff]/20 bg-[#82dfff]/10 text-sm font-semibold text-[#9fe7ff]">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-7 text-[#c7dde5]">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#f4c66a]">
                    Persona rule
                  </p>
                  <p className="mt-3 text-lg font-semibold text-[#fff2d0]">
                    说得像军令，但判断必须证据优先，不装神弄鬼，不堆空话。
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#f4c66a]">
                    Product rule
                  </p>
                  <p className="mt-3 text-lg font-semibold text-[#fff2d0]">
                    不是提高建议数量，而是提高批准质量，并把不该做的事明确写出来。
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            id="submission-thesis"
            className="rounded-[34px] border border-white/10 bg-[#0c0f14] p-8 backdrop-blur-xl"
          >
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#8bd9c9]">
                Submission thesis
              </p>
              <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#fff7e6] md:text-4xl">
                今日军令的真正产品边界，不是“帮你做决定”，而是“帮你压掉多余决定”。
              </h2>
              <p className="mt-4 text-base leading-8 text-[#cdbb97]">
                它不是要把钱包管理做成一个更热闹的 dashboard，而是要把用户
                每天最容易失控的部分制度化：先看军情，再下军令，再写禁令，再
                经推演，最后留战报。它更像一个链上日常操作制度，而不是一个会
                聊天的按钮集合。
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={standalone ? "#fixed-output" : "/agent-hub"}
                className="inline-flex items-center gap-2 rounded-full bg-[#83e1cc] px-5 py-3 text-sm font-semibold text-[#06261f] transition hover:bg-[#9aecda]"
              >
                {standalone ? "Revisit fixed output" : "Open project page"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
