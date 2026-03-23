# Agent Arena x OKX 比赛简报

更新时间：2026-03-22  
适用对象：当前 `Miraix Agent Arena` 参赛准备

## 1. 这份文档解决什么问题

这份文档把三类信息放到一起：

- 比赛细节：当前公开能确认的赛制、赛道、提交方式、截止时间、奖励
- 评分标准：官方已公开的部分，以及可用于内部对齐的非官方推断
- 参考项目：官方技术参考、产品参考、公开项目参考

结论先写在前面：

- 这次更适合走 `龙虾赛道`
- 当前公开材料里，`Phase 2 / Agent Trade Kit` 没看到完整的官方加权评分表
- 但公开信息已经足够推导出一个稳定的提交策略：
  - 用 `OKX Agent Trade Kit + 任意 Claw`
  - 给出清晰的交易 Agent 场景
  - 证明它能跑
  - 证明它不是 PPT，而是能复现的东西

---

## 2. 官方已确认的比赛细节

### 2.1 主题

公开信息显示，本次是 OKX 第二期 `Agent Trade Kit` 主题活动，参赛者需要基于 `Agent Trade Kit`，结合任意 `Claw` 模型设计智能体。

来源：

- [OKX 「AI 松」大赛第二期开启，用「Agent Trade Kit」部署 Agent 赢大奖](https://www.aicoin.com/zh-Hant/news-flash/2788776)

### 2.2 两个赛道

公开信息显示，本期活动有两个赛道：

- `龙虾赛道`
  - 直接做交易 AI Agent
  - 核心问题是：`搭载 Agent Trade Kit 后，你设计的交易 AI 助手能做什么`
  - 表达形式不限：图文、短视频、演示链接都可以
- `创意赛道`
  - 不需要实际部署
  - 只需要三句话描述你最想要的交易 AI Agent
  - 如果附草图 / 流程图，有加分空间

来源：

- [OKX AI松 第二期：奖励不变，新增创意奖，不会部署也能参与~](https://www.aicoin.com/zh-Hant/news-flash/2789852)

### 2.3 提交方式

公开信息显示，提交动作包括：

- 使用 `Agent Trade Kit + 任意 Claw` 设计智能体
- 在 `X` 或 `OKX 星球` 发布内容
- 再填写官方表单提交

龙虾赛道建议展示内容：

- Agent 用了什么能力
- 解决什么交易问题
- 实际演示或交互视频

创意赛道建议展示内容：

- 三句话模板
  - 我最想要的 AI Agent 是____
  - 我想让它帮我解决____
  - 如果真做出来，我会拿它去____

来源：

- [OKX 「AI 松」大赛第二期开启，用「Agent Trade Kit」部署 Agent 赢大奖](https://www.aicoin.com/zh-Hant/news-flash/2788776)
- [OKX AI松 第二期：奖励不变，新增创意奖，不会部署也能参与~](https://www.aicoin.com/zh-Hant/news-flash/2789852)

### 2.4 截止时间

当前公开可见的明确时间是：

- `2026-03-25 23:59 (UTC+8)`

来源：

- [OKX AI松 第二期：奖励不变，新增创意奖，不会部署也能参与~](https://www.aicoin.com/zh-Hant/news-flash/2789852)

### 2.5 奖励

#### 龙虾赛道

- 一等奖：`1 名`，`3000 USDT + Mac Mini + 神秘「建设之星」奖励`
- 二等奖：`3 名`，`1000 USDT + Mac Mini + 加入 OKX Web3 Builder`
- 三等奖：`20 名`，`800 USDT + 加入 OKX Web3 Builder`

#### 创意赛道

- 创新奖：`5 名`，`200 USDT`
- 创意奖：`20 名`，`100 USDT`

来源：

- [OKX AI松 第二期：奖励不变，新增创意奖，不会部署也能参与~](https://www.aicoin.com/zh-Hant/news-flash/2789852)

---

## 3. 官方已公开的评分信息

### 3.1 当前公开能确认的部分

目前公开材料里，关于第二期 `Agent Trade Kit` 活动，能明确确认的是：

- `评选将由 Gemini 进行评分排名`

但我没有找到：

- 官方公开的权重表
- 官方公开的逐项打分表
- 官方公开的详细 rubric

这意味着：

- `Gemini 评分` 是官方已公开信息
- `具体怎么打分`，目前公开材料不足，不能写成“官方标准”

来源：

- [OKX 「AI 松」大赛第二期开启，用「Agent Trade Kit」部署 Agent 赢大奖](https://www.aicoin.com/zh-Hant/news-flash/2788776)

### 3.2 可用的一期规则作为代理参考

OKX 第一期 `OnchainOS AI 松` 的公开材料里，写过更具体的评估维度：

- `integration`
- `practicality`
- `innovation`
- `replicability`

这不是第二期官方明文 rubric，但很可能反映了 OKX 这一类 AI Agent 比赛的稳定评审方向。

来源：

- [Heavy rewards for finding people! OKX's first "AI Pine" competition](https://www.aicoin.com/article/520377.html)

### 3.3 我们内部应采用的“非官方评分框架”

下面这个框架不是官方标准，是为了让提交材料更稳：

#### A. Integration

评委会看：

- 你有没有真的把 `Agent Trade Kit` 用起来
- 用的是不是 OKX 原生能力，而不是只做了一个通用交易 UI
- 是不是真的接进了 `market / portfolio / trade / bot` 中至少一部分

对我们当前项目的要求：

- 详情页明确展示真实 `OKX demo order / fill / ordId`
- 不是只说“支持 OKX”，而是给出真实证据链

#### B. Practicality

评委会看：

- 这个 Agent 到底解决什么交易问题
- 不是“能做很多”，而是“用户为什么要用”
- 是否有明确使用场景和结果路径

对我们当前项目的要求：

- 用一句话讲清：
  - `Create in agent chat -> validate in arena -> review for promotion`
- 首页、详情页、视频脚本都围绕这个闭环，不分散

#### C. Innovation

评委会看：

- 你是不是只做了一个“会下单的机器人”
- 有没有新的产品结构、交互形式、风控框架、评估机制

对我们当前项目的要求：

- 重点讲 `Agent Arena` 不是单体 Bot，而是：
  - 创建
  - 排名
  - 证据
  - 晋级审核
  - demo-first execution gating

#### D. Replicability

评委会看：

- 别人能不能照着你的说明复现
- 不是只会看视频，是真的能跑通

对我们当前项目的要求：

- 有清晰入口：`/agent-arena`
- 有清晰创建路径：安装 skill -> 绑定 pair code -> OpenClaw 创建
- 有清晰验证路径：榜单 -> 详情 -> execution evidence

### 3.4 对 `Miraix Agent Arena` 的建议权重

这也是内部建议，不是官方：

- `35%` Integration evidence
- `25%` Practicality / product loop clarity
- `25%` Innovation / system design
- `15%` Replicability / demo clarity

原因：

- 对交易 Agent 项目，最伤分的是“没证据”
- 第二伤分的是“功能很多，但用户价值不清楚”
- 第三伤分的是“看起来像 dashboard，不像产品”

---

## 4. 这次比赛最值得强调的官方技术背景

### 4.1 Agent Trade Kit 是什么

OKX 官方 Learn 页面给出的定位是：

- 一个 `open-source MCP toolkit`
- 给 AI agents 和开发者完整环境，用来 `build, test, deploy` OKX 交易策略
- 提供 `MCP server` 和 `CLI`
- 支持 `Claude / OpenClaw / Cursor / VS Code` 等 MCP 客户端

来源：

- [Connecting Agentic Trading to OKX Exchange with Agent Trade Kit](https://www.okx.com/en-us/learn/agent-trade-kit)

### 4.2 官方强调的差异点

OKX 官方公开强调的点包括：

- 本地优先安全
- API key 不暴露给模型
- 按权限注册工具
- 开源
- 支持 demo mode

对参赛项目的启发：

- `demo-first` 是加分项，不是减分项
- 最佳提交不是“我敢实盘”，而是“我把执行闭环和风险边界都做清楚了”

来源：

- [Connecting Agentic Trading to OKX Exchange with Agent Trade Kit](https://www.okx.com/en-us/learn/agent-trade-kit)

### 4.3 官方技能结构

公开文档里，OKX 明确提到四个 plug-and-play Skills：

- `okx-cex-market`
- `okx-cex-trade`
- `okx-cex-portfolio`
- `okx-cex-bot`

这和我们当前 `Agent Arena` 的产品结构是对齐的。

来源：

- [Connecting Agentic Trading to OKX Exchange with Agent Trade Kit](https://www.okx.com/en-us/learn/agent-trade-kit)
- [OKX Agent API 接入指南](https://www.okx.com/docs-v5/agent_zh/)

### 4.4 工具数量存在版本漂移

不同公开页面对工具数量的表述并不一致：

- 2026-03-10 的媒体转述提到 `83 个工具 + 4 个 Skills`
- 2026-03-10 的 OKX Learn 文提到 `82 tools across 7 modules`
- 当前 GitHub 仓库首页展示 `106 tools across 8 modules`

这说明官方项目仍在快速演进。比赛提交材料里，不建议把“精确工具数量”当卖点，而应强调：

- `exchange-native MCP toolkit`
- `market + trade + portfolio + bot`
- `demo mode`
- `OpenClaw 支持`

来源：

- [OKX 「AI 松」大赛第二期开启，用「Agent Trade Kit」部署 Agent 赢大奖](https://www.aicoin.com/zh-Hant/news-flash/2788776)
- [Connecting Agentic Trading to OKX Exchange with Agent Trade Kit](https://www.okx.com/en-us/learn/agent-trade-kit)
- [okx/agent-trade-kit](https://github.com/okx/agent-trade-kit)

---

## 5. 参考项目

下面分三类：官方技术参考、产品参考、公开项目参考。

### 5.1 官方技术参考

#### A. OKX Agent Trade Kit Learn 页

用途：

- 用来理解官方怎么描述这套工具
- 适合抽取对外叙事

看点：

- 官方定位
- demo mode
- 四个 Skills
- MCP / CLI 双形态

链接：

- [OKX Learn: Agent Trade Kit](https://www.okx.com/en-us/learn/agent-trade-kit)

#### B. OKX Agent 文档

用途：

- 用来做接入说明和能力边界确认

看点：

- OpenClaw quickstart
- MCP 客户端接入
- 模块与工具列表

链接：

- [OKX Agent API 接入指南](https://www.okx.com/docs-v5/agent_zh/)

#### C. 官方 GitHub 仓库

用途：

- 用来确认真实工程结构和当前能力范围

看点：

- README
- modules
- quick start
- 配置方式

链接：

- [okx/agent-trade-kit](https://github.com/okx/agent-trade-kit)

### 5.2 产品参考

#### A. CoinOS

这不是 OKX 官方比赛样例，但它是一个很强的产品参考，因为它把以下几件事串起来了：

- 实时行情
- 实盘执行
- 回测
- OpenClaw 技能安装

适合参考的部分：

- 一句话用例展示
- 功能分类
- 用户价值表达

不建议照抄的部分：

- 它更像全能型交易外骨骼，不是比赛化展示页
- 它的叙事更偏工具平台，不偏“提交作品证据链”

链接：

- [CoinOS](https://www.aicoin.com/zh-Hant/coinos)

#### B. Miraix Agent Arena

对我们自己来说，当前更好的参考不是“继续加功能”，而是把现有结构压缩成更适合比赛的表达：

- 首页：讲清楚是什么
- 详情页：证明能跑
- execution evidence：证明是 OKX demo 真单

建议保留的核心结构：

- `Create in agent chat`
- `Validate in arena`
- `Promotion review`

### 5.3 公开项目参考

#### A. alpha-arena-okx

公开描述显示，这是一个：

- 基于 AI 模型的自动交易机器人
- 支持 OKX
- 带 Web 界面

适合参考的点：

- 公开展示执行系统和运行界面
- 强调“不是概念，而是可运行程序”

不足：

- 更像单体自动交易程序
- 不像比赛提交页，也没有明确的 demo-first 审核叙事

链接：

- [oficcejo/alpha-arena-okx](https://github.com/oficcejo/alpha-arena-okx)

#### B. okx-algotrade-agent-x

公开描述显示，这是一个：

- 自主交易 bot
- 结合 LSTM、指标、EvoSearch、Kelly risk sizing

适合参考的点：

- 清楚地写出策略方法和风险框架
- 能给“技术含量”背书

不足：

- 更偏策略 bot 本体
- 对比赛展示、复现入口、产品闭环帮助有限

链接：

- [kb-90/okx-algotrade-agent-x](https://github.com/kb-90/okx-algotrade-agent-x)

---

## 6. 对 `Miraix Agent Arena` 的直接建议

### 6.1 该报哪个赛道

建议：`龙虾赛道`

原因：

- 你已经有真实 OKX demo account 数据
- 已经有真实 demo order / fill / ordId 证据
- 这已经超出了纯创意阶段

### 6.2 当前最该强调的点

- 不是“我们能交易”
- 而是“我们把 AI 交易代理做成了一个 demo-first promotion system”

一句话版本：

`Miraix Agent Arena lets users create an OKX trading agent in OpenClaw, validate it in a public demo-first arena, and decide whether it deserves promotion.`

### 6.3 当前最该避免的点

- 不要把 simulation 数据伪装成真实收益
- 不要把大而全的 dashboard 当成提交核心
- 不要让评委猜“这东西到底能不能跑”

### 6.4 提交页最重要的三个证据

1. 真实 OKX 市场数据
2. 真实 OKX demo 账户快照
3. 真实 demo 订单执行证据

### 6.5 当前版本的正确姿势

当前版本最稳的说法应该是：

- leaderboard 和 scorecard 仍有 simulation 成分
- 但 market / portfolio / execution evidence 已经接上真实 OKX demo 数据

这是可信的，而且比“全都说成真的”更强。

---

## 7. 建议的提交材料结构

### 7.1 一句话

`Create in agent chat -> validate in arena -> review for promotion`

### 7.2 一张图

流程图只画四步：

- OpenClaw 创建 Agent
- Agent Arena 展示
- OKX Demo 执行
- Promotion review

### 7.3 一个视频

控制在 `30-60 秒`：

1. 打开首页
2. 展示创建路径
3. 打开某个 Agent 详情
4. 停在 execution evidence
5. 结束时强调 demo-first

---

## 8. 来源清单

### 官方

- [OKX Learn: Connecting Agentic Trading to OKX Exchange with Agent Trade Kit](https://www.okx.com/en-us/learn/agent-trade-kit)
- [OKX Agent API 接入指南](https://www.okx.com/docs-v5/agent_zh/)
- [okx/agent-trade-kit](https://github.com/okx/agent-trade-kit)

### 公开赛事信息 / 媒体转述

- [OKX 「AI 松」大赛第二期开启，用「Agent Trade Kit」部署 Agent 赢大奖](https://www.aicoin.com/zh-Hant/news-flash/2788776)
- [OKX AI松 第二期：奖励不变，新增创意奖，不会部署也能参与~](https://www.aicoin.com/zh-Hant/news-flash/2789852)
- [Heavy rewards for finding people! OKX's first "AI Pine" competition](https://www.aicoin.com/article/520377.html)

### 产品 / 项目参考

- [CoinOS](https://www.aicoin.com/zh-Hant/coinos)
- [oficcejo/alpha-arena-okx](https://github.com/oficcejo/alpha-arena-okx)
- [kb-90/okx-algotrade-agent-x](https://github.com/kb-90/okx-algotrade-agent-x)

