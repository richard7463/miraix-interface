# Miraix Meme Court

**Three agents. One wallet. One disciplined meme trade.**

Miraix Meme Court 是一个面向 Bitget Wallet 赛道的 Solana meme trading agent。

它只做一件事：
从市场里找到候选标的，把每个候选币送上 Rug Court 审判，最后只把一笔值得签名的交易交给钱包。

很多所谓的 AI 交易产品，最后停留在“分析”这一步。
它们会告诉你可以买什么，也可能会给你一些图表和理由，但真正的执行链路还是要用户自己去完成。

Miraix Meme Court 不想做一个只会说结论的助手。
我们想做的是一个真正有约束的交易代理：

1. **Scout Agent**
   负责从 Solana meme 市场里筛出值得看的候选币，把噪音压缩成 shortlist。

2. **Risk Agent / Rug Court**
   负责审查安全性、流动性、持仓结构和开发者质量。只要证据不够，这笔交易就在这里被否掉。

3. **Trader Agent**
   只负责一件事：把唯一通过审判的标的，包装成一笔有仓位、有失效条件、有止盈路径的交易，并把 unsigned payload 交给钱包审核。

这套结构的核心，不是“找到更多币”，而是“在用户签名前先否掉差的币”。

## 为什么这个产品成立

Meme 交易里最稀缺的，从来不是信息，而是纪律。

大家都能看到排行榜、热度和涨幅。
真正困难的是：

- 哪些币该直接排除
- 哪些币虽然热，但你不该碰
- 在允许进场时，应该给多大仓位
- 用户在签名前，是否能看到足够清晰的执行依据

Miraix Meme Court 把这个流程收成了一条非常明确的链路：

- shortlist market
- run Rug Court
- approve one trade
- prepare unsigned payload
- let the wallet review and sign

所以它不是一个泛化聊天机器人，而是一个范围刻意收窄的交易 agent：

- 只做 Solana
- 只做 meme
- 一次只批准一笔交易
- 强制 human-in-the-loop

## 为什么适合 Bitget Wallet Track

Bitget 在这里不是“挂名集成”，而是在关键路径上：

- 市场发现
- 安全审查
- quote readiness
- payload preparation
- order lifecycle visibility

如果拿掉这些能力，这个产品就会从一个真实交易代理退化成一张静态页面。

这也是我们想表达的重点：
不是把 sponsor 的 API 贴在页面上，而是让 sponsor 的能力真正决定产品是否成立。

## Demo 该怎么看

Judge 只需要看四步：

1. 设置 wallet、budget、risk mode、desk style
2. 运行 Scout 和 Rug Court
3. 查看唯一被批准的 Solana meme trade
4. 生成 unsigned payload，展示钱包审核与签名这一步

## Submission Links

- GitHub: [REPO_URL]
- Demo: [DEPLOYED_URL]/meme-court
- Video: [VIDEO_URL]

Miraix Meme Court 的目标不是替用户喊单。
它的目标是把一笔 meme trade 收成一句产品逻辑：

**discover, veto, then execute.**
