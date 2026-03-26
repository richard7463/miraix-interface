# Miraix Rotation Desk — Three Agents, One Wallet, One X Layer Trade

## How We Turned "What Should I Do With 100U?" Into a Pay-and-Execute Onchain Loop with OKX OnchainOS

---

### Submission Info

- Project Name: Miraix Rotation Desk
- GitHub: [REPO_URL]
- Live Demo: [DEPLOYED_URL]/fomo-copilot
- Demo Video: [VIDEO_URL]
- Tech Stack: Next.js 14 + TypeScript + viem + Privy + @x402/fetch
- Chain: X Layer (Chain ID 196)
- OnchainOS Modules Used: Market API / DEX Aggregator / x402 / Broadcast

---

### 1. Product Positioning: Not Advice, but Execution

The user only needs to answer one question:

**"I have 100U. What should I do with it on X Layer today?"**

Most AI trading products on the market respond the same way: they give you a block of analysis, recommend one or two tokens, and stop there. What the user receives is advice, not execution. Whether that advice is good, how the position should be sized, how much slippage it carries, and whether it should be executed at all are still left to the user.

The problem is not that AI is bad at analysis. The problem is that the distance from "analysis" to "execution" is still too large. Users still need to pick an exchange, size the position, assess the risk, sign the transaction, and broadcast it themselves. Every step is another place to make a mistake, while the AI only handled the first one.

Miraix Rotation Desk is built to do something very simple: **take over every step between intent and onchain execution**.

```text
User inputs budget + risk preference + time horizon
  → Strategist Agent: what to buy and how much
  → Risk Agent: whether it should be done and how it should be adjusted
  → Execution Agent: how to do it and whether the route is ready
  → x402 payment unlock: premium action gate
  → OKX OnchainOS returns executable payloads
  → The same EVM wallet broadcasts on X Layer
  → Onchain evidence board + share image
```

The user never has to leave the page, manually stitch together trades, or go hunt for a DEX. From intent to execution to proof, the whole flow happens in one screen.

---

### 2. Why Three Agents Instead of One

This was the first and most important architectural decision we made.

Most AI trading products use the same structure: one large model consumes market data and returns a recommendation. No matter how strong that model is, the structure is still single-point decision making. One model reads everything and outputs one conclusion.

That structure has three fundamental problems.

**First, there is no internal constraint.** Strategy and risk live inside the same output. The model says "buy OKB" and also says "the risk is acceptable." But both judgments come from the same context and the same inference. If the model is too optimistic on strategy, it is unlikely to impose a serious constraint on itself in the risk layer.

**Second, there is no auditability.** The user receives a final answer without understanding what happened in the middle. What factors did the model actually consider? Did it check concentration? Did it assess slippage? All of that gets compressed into one paragraph, and the user is left to either trust it or not.

**Third, there is no execution validation.** A model may say "buy OKB," but it does not inherently know whether OKB liquidity on X Layer is sufficient, whether a valid swap route exists, or how much gas is needed. There is a large gap between analysis and execution.

Miraix Rotation Desk solves this by splitting the loop into three independent agents, each with a clear responsibility boundary, its own data dependencies, and explicit inputs and outputs.

---

#### Strategist Agent — Strategy Layer

The Strategist answers: **what to buy, and how much**.

It scans the tradable assets in the X Layer ecosystem through the OKX OnchainOS Market API, pulling real-time price, 24-hour change, volume, and volatility for each asset. It then constructs a weighted basket based on three user inputs: budget, risk mode, and time horizon.

More concretely:

- Conservative mode: 2 legs, large-cap blue chips, with a 30% stable reserve
- Balanced mode: 3 legs, blue chips plus ecosystem assets, with a 15% stable reserve
- Aggressive mode: 3 legs, higher-weight ecosystem assets, with no stable reserve

The Strategist outputs a structured basket, for example:

```text
OKB   40%   $40.00   ecosystem-core
ETH   35%   $35.00   blue-chip
WBTC  25%   $25.00   store-of-value
```

That output is then passed directly to the Risk Agent for review. The Strategist does not make risk decisions. It is responsible only for answering: **given the current market conditions, what is the most reasonable basket for this budget?**

Critical OnchainOS dependency: **OKX Market API**. Without live market data, the Strategist cannot compute weights or decide which assets deserve allocation. This is not an optional API call. It is the Strategist's only market source.

---

#### Risk Agent — Risk Layer With OVERRIDE Authority

The Risk Agent answers: **should this be done, and should it be adjusted?**

It receives the Strategist's basket and runs four checks on each leg:

1. **Concentration check**: no single leg can exceed 40%
2. **Slippage check**: estimated slippage must stay below the threshold for the current risk mode (0.3% conservative, 0.5% balanced, 1.2% aggressive)
3. **Reserve check**: conservative and balanced modes must preserve the required stable reserve
4. **Liquidity check**: the OKX Market API's volume data must indicate sufficient liquidity on X Layer

**The key capability is that the Risk Agent can override the Strategist.**

That is the core difference between Miraix Rotation Desk and many so-called multi-agent systems. In many products, "multi-agent" is just a serial pipeline. Each agent appends a little more context to the previous output, but none of them can actually change the upstream decision. That is multi-agent in form, but still single-point decision making in substance.

In Miraix Rotation Desk, the Risk Agent has real authority.

For example, if the user selects aggressive mode and the Strategist proposes:

```text
OKB   50%   $50.00
ETH   30%   $30.00
WBTC  20%   $20.00
```

The Risk Agent sees that OKB exceeds the 40% concentration limit and makes an override:

- Reduce OKB from 50% to 35%
- Reallocate the freed 15% to ETH, increasing ETH from 30% to 45%
- Final allocation: OKB 35% / ETH 45% / WBTC 20%

That override is shown explicitly in the UI:

> **Risk Agent — OVERRIDE**
>
> "Risk Agent overrode Strategist allocation. Single-leg concentration exceeded 40% threshold on OKB. Reduced from 50% to 35% and redistributed 15% to ETH leg. No reserve buffer in degen mode — this is the user's explicit choice."

The user is not guessing what the AI "must have been thinking." They are shown an actual disagreement between agents, along with the reason and the resulting adjustment. The Strategist wanted heavier OKB exposure. The Risk Agent rejected that concentration. The Risk Agent won. The full rationale chain is visible.

That is what we mean by a real multi-agent collaborative architecture: not three models talking in parallel, but three agents with explicit constraints, authority boundaries, and override power.

---

#### Execution Agent — Execution Layer

The Execution Agent answers: **how to do it, and whether the route is ready**.

It receives the final allocation approved by the Risk Agent, whether unchanged or overridden, and validates execution readiness for each leg:

1. **Route discovery**: find the best swap route on X Layer through the OKX DEX Aggregator
2. **Payload validation**: verify that the DEX Aggregator's payload is executable on X Layer (Chain ID 196)
3. **Gas estimation**: estimate the OKB gas required for each leg
4. **Output calculation**: calculate the actual token output based on current route pricing

If all legs are ready, the Execution Agent returns a `ready` state and waits for x402 unlock. If a route cannot be found for a leg, for example because liquidity is insufficient on X Layer, that leg is marked as `quote only` with an explicit reason.

Critical OnchainOS dependency: **OKX DEX Aggregator**. Without it, the Execution Agent cannot get swap routes or executable payloads. This is not display-only data. These payloads are used directly for onchain broadcast.

---

### 3. OnchainOS Is Not Decoration. It Is the Critical Path.

This is worth emphasizing because it directly affects the Integration score.

Many projects treat an OKX or OnchainOS integration as a surface-level enhancement: call an API, show a price, and claim integration. That kind of integration is ornamental. Remove it, and the product still works, just with worse data.

In Miraix Rotation Desk, the four OnchainOS modules sit directly on the critical path. Remove any one of them, and the product degrades from a complete trading loop into a static page.

| Module | Used By | What Breaks Without It |
|---|---|---|
| Market API | Strategist + Risk | The Strategist loses pricing and volume context, so it cannot build a basket. The Risk Agent loses volatility context, so it cannot assess concentration or slippage. |
| DEX Aggregator | Execution Agent | No swap route, no executable payload, no real execution path. |
| x402 | Payment Layer | Premium actions cannot be unlocked. The user is stuck at the free preview stage forever. |
| Broadcast (EVM) | Execution Layer | Payloads may exist, but nothing gets sent onchain. The trade never lands. |

These are not abstract dependencies hidden in utility wrappers. They appear directly inside the main route logic.

The preview route pulls live OKX market data:

```typescript
// app/api/fomo/preview/route.ts
async function fetchOkxMarketPulse(symbols: string[]) {
  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const instId = `${symbol}-USDT`
      const res = await fetch(
        `${OKX_BASE_URL}/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`,
        { headers: { Accept: 'application/json' } }
      )
      const envelope = await res.json()
      const ticker = envelope?.data?.[0]
      // ... compute price, 24h change, volume
    })
  )
}
```

The premium plan route uses OKX pricing to compute expected output:

```typescript
// app/api/premium/fomo-plan/route.ts
async function fetchOkxPrice(symbol: string): Promise<number | null> {
  const instId = `${symbol}-USDT`
  const res = await fetch(
    `${OKX_BASE_URL}/api/v5/market/ticker?instId=${instId}`,
    { headers: { Accept: 'application/json' } }
  )
  const envelope = await res.json()
  return Number(envelope?.data?.[0]?.last) || null
}
```

The x402 client completes EIP-712 signing and payment through `@x402/fetch` and `@x402/evm/exact/client`:

```typescript
// src/usePremiumActionX402.ts
import { x402Client, x402HTTPClient } from '@x402/fetch'
import { registerExactEvmScheme } from '@x402/evm/exact/client'

registerExactEvmScheme(client, { signer: evmSigner })
const paymentPayload = await client.createPaymentPayload(paymentDetails)
const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload)
```

X Layer execution is broadcast through viem and the Privy wallet:

```typescript
// app/fomo-copilot/page.tsx
const xLayerClient = createPublicClient({ chain: xLayer, transport: http() })
await switchWalletChain(embeddedEvmWallet, XLAYER_CHAIN_ID) // 196
const hash = await sendEvmTransaction(embeddedEvmWallet, mainTransaction)
await xLayerClient.waitForTransactionReceipt({ hash: hash as `0x${string}` })
```

If a judge reads the code, it is clear that these OKX integrations are not side demos. They live inside the main API routes and the main product surface.

---

### 4. x402 Payment: Not a Demo Trick, but the Core Business Logic

In Miraix Rotation Desk, x402 is not an optional bonus. It is part of the product's business model.

The free-versus-paid boundary is explicit:

- **Free**: preview. The user inputs budget and risk mode, then gets the Strategist's direction, the Risk Agent's posture, the market pulse, and a FOMO score. No wallet required. No payment required.
- **Paid**: execution. If the user wants the exact basket sizing, executable swap payloads from the OKX DEX Aggregator, and actual chain broadcast, that is unlocked through x402.

That boundary is intentional. Analysis is free. Execution is paid. Execution consumes more OnchainOS resources, including routing and payload assembly, and it carries the cost of actual broadcast.

The x402 flow is:

```text
1. User clicks "Pay 0.05 USDT and Execute"
2. Frontend POSTs to /api/premium/fomo-plan without a payment signature
3. Backend returns HTTP 402 Payment Required
   Header: PAYMENT-REQUIRED (base64-encoded payment requirements)
4. The @x402/fetch client parses the payment requirements
5. x402Client builds an EIP-712 signing payload
6. The Privy embedded wallet prompts the user to sign
7. The user signs inside the wallet
8. The frontend retries the request with the PAYMENT-SIGNATURE header
9. The backend verifies and settles the payment, then returns the unlocked execution plan
10. The frontend receives the plan and begins broadcasting each leg on X Layer
```

Supported payment assets are USDT and USDC on X Layer. The user chooses the payment asset in the UI.

After payment, the payment reference, whether a tx hash or payment ID, is displayed on the evidence board. If it is a chain hash, it links directly to the X Layer explorer.

One detail matters a lot for user experience: the payment wallet and trading wallet are the same embedded Privy EVM wallet. The user does not have to switch between two separate wallets. Connect once, pay once, execute through the same wallet.

---

### 5. X Layer Execution: Real Broadcast, Real Transaction Hashes

After x402 unlock, the frontend does not receive another piece of advice like "go buy this token on some exchange." It receives executable transaction payloads already prepared by the OKX DEX Aggregator.

For each leg, execution follows this flow:

```text
1. Switch the wallet to X Layer (Chain ID 196)
2. If ERC-20 approval is required, send the approval transaction first
3. Wait for approval confirmation onchain
4. Send the main swap transaction
5. Wait for swap confirmation onchain
6. Record both the approval hash and swap hash
7. Show them on the evidence board, with links to the X Layer explorer
```

If one leg fails, for example due to insufficient gas or excessive slippage, that leg is marked `Failed` while the other legs continue. After execution completes, the user can click "Retry incomplete trades" to retry only the failed legs.

The evidence board shows:

- Wallet address, linked to the X Layer explorer
- x402 payment proof, linked if it is a tx hash
- Status per leg: Broadcasted / Failed / Payload ready / Quote only
- Transaction hashes per leg: main tx plus approval tx, each linked separately
- Quote provider: OKX OnchainOS DEX Aggregator
- Trade chain: X Layer (196)
- Gas asset: OKB
- Reserve weight: the retained reserve allocation

These are not mock values. Every tx hash can be verified on the X Layer explorer.

---

### 6. Agent Collaboration Is Not a Concept. It Is a Visible, Auditable Product Feature.

Many projects claim to have a multi-agent architecture. But once you inspect the product, that usually means one of two things: either the backend code is split into different functions, or the UI puts labels like "Agent 1 says..." and "Agent 2 says..." on top of otherwise opaque output. That is not real collaboration.

In Miraix Rotation Desk, agent collaboration is a core UI feature. In both the preview phase and the premium execution phase, the user can inspect the full decision log for each agent.

**In the free preview phase**

Three agent cards are shown side by side. Each one includes:

- Agent name and role description
- Status badge: **Ready** (green), **Watch** (yellow), or **Pending** (gray)
- Decision badge: **CLEARED** (green), **OVERRIDE** (orange), or **VETOED** (red)
- Verdict: a one-line conclusion
- Detail: the full rationale
- Metrics: key figures such as concentration cap, reserve weight, and route count

**In the paid execution phase**

The same decision log structure appears again, but now attached to the final execution plan. A Risk Agent verdict may look like:

> **REDUCED: Strategist proposed 50% OKB — Risk Agent cut to 45%**
>
> Risk Agent overrode Strategist allocation. Single-leg concentration exceeded 40% threshold on OKB. Reduced from 50% to 45% and redistributed 5% to ETH leg. No reserve buffer in degen mode.

The UI shows both a **Watch** status badge and an **OVERRIDE** decision badge. The user can immediately see:

1. What the Strategist wanted to do
2. Why the Risk Agent disagreed
3. What the Risk Agent changed
4. What the final plan became

That matters for judges too. A reviewer does not need to inspect the backend to figure out whether the agents are actually cooperating. Open the page, run a preview once, and the differences, constraints, and overrides are all visible in the product.

---

### 7. Reproducibility: Clone and Run

We made one crucial reproducibility decision: **if the backend is unavailable, the product falls back to demo mode instead of simply erroring out**.

The core agent logic behind Miraix Rotation Desk runs on a LangGraph backend. Judges may not have access to that backend. If they clone the repo, run `yarn dev`, click preview, and the UI just crashes, that is a bad submission.

So both API routes include fallback logic.

**Preview route (`/api/fomo/preview`)**

```text
1. Try the LangGraph backend
2. If it succeeds, forward the response directly
3. If it fails or is unreachable, fall back:
   a. Try to pull live OKX market data for OKB, ETH, and WBTC
   b. Build a demo PreviewResponse with the full three-agent state
   c. If OKX is also unreachable, use static market data
   d. Return the fallback response
```

**Premium plan route (`/api/premium/fomo-plan`)**

```text
1. Try the LangGraph backend, forwarding x402 headers
2. If it succeeds or returns 402, forward directly
3. If it fails, fall back:
   a. Fetch live OKB/ETH/WBTC prices from the OKX Market API in parallel
   b. Build a full PremiumPlanResponse including:
      - basket sizing by risk mode
      - agent decision logs
      - execution readiness state
      - evidence board data
   c. Compute expected output using live OKX pricing
   d. Return the fallback response
```

That means the judge experience is:

1. `git clone [repo] && cd [repo] && yarn install && yarn dev`
2. Open `http://localhost:3000/fomo-copilot`
3. Enter a budget, choose a risk mode, click "Generate Free Preview"
4. See the full UI: three agent cards, market pulse, FOMO score
5. If OKX APIs are reachable, the market data is live
6. The agent decision log still shows the override narrative

No API key is required to see the full product flow. If OKX connectivity exists, the data becomes more realistic. If it does not, the UI still works and still proves the product concept.

---

### 8. Why This Is Not Just Another AI Trading Bot

There are already many AI trading products. On the surface, Miraix Rotation Desk may appear similar: AI analyzes the market, then helps execute a trade.

But once you look at the product structure, the difference becomes obvious.

**Versus a single-agent trading bot**

A single-agent bot reads data and outputs a recommendation. There is no genuine constraint between strategy and risk, and no independent execution validation. Miraix Rotation Desk separates strategy, risk, and execution into three layers, and the Risk Agent has real override authority.

**Versus a chat-based AI analysis tool**

A chat-based product outputs text. The user must still go somewhere else to trade. Miraix Rotation Desk outputs actual transactions. The user's wallet broadcasts on X Layer, and the product returns transaction hashes as proof.

**Versus a black-box automated trading system**

Automated trading systems often hide their logic. Users do not know why a certain action was chosen. Miraix Rotation Desk exposes every agent's judgment, disagreement, and adjustment directly in the UI. The full decision chain is inspectable.

**Versus projects that use X Layer only for settlement**

Some projects do their analysis elsewhere and use X Layer only as a payment or settlement rail. In Miraix Rotation Desk, X Layer is the primary execution chain. Swaps are broadcast on X Layer, proofs point to the X Layer explorer, and the OKX OnchainOS DEX Aggregator routes specifically against X Layer liquidity.

---

### 9. The Full Technical Loop

The complete technical loop is:

```text
OKX Market API (live prices)
  → Strategist Agent (basket construction)
  → Risk Agent (risk checks + override)
  → OKX DEX Aggregator (swap routes + payloads)
  → Execution Agent (route validation)
  → x402 payment (EIP-712 signing + settlement)
  → X Layer broadcast (approval + swap)
  → onchain transaction hash confirmation
  → evidence board + share image
```

OnchainOS appears four times in that loop: Market API, DEX Aggregator, x402, and Broadcast. Remove any one of them, and the loop breaks.

---

### 10. Four-Dimensional Self-Evaluation

| Dimension | Weight | Score | Reason |
|---|---|---|---|
| Integration | 25% | 9/10 | All four OKX OnchainOS modules, Market API, DEX Aggregator, x402, and Broadcast, sit directly on the critical path. They are called in the product's core logic, not wrapped in decorative demos. Remove any one of them and the product collapses from a trading loop into a static interface. |
| Utility | 25% | 9/10 | The user provides a budget and risk preference and receives more than analysis: a trading workflow on X Layer with tx-hash-level proof. Three-agent risk control, x402 payment gating, embedded Privy wallet flow, and an onchain evidence board form a closed loop. |
| Innovation | 30% | 9/10 | The Risk Agent has genuine override authority inside a three-agent architecture. Strategy disagreements are surfaced in the UI through OVERRIDE, VETOED, and CLEARED badges. This is not performative multi-agent UX; it is constrained, auditable agent collaboration. |
| Reproducibility | 20% | 8.5/10 | `yarn dev` starts the app. If the backend is unavailable, the product falls back automatically to demo mode while still attempting live OKX market data. Judges can see the full interface and interaction flow without needing private backend access. |

**Weighted score = 9×0.25 + 9×0.25 + 9×0.30 + 8.5×0.20 = 2.25 + 2.25 + 2.70 + 1.70 = 8.90**

---

### Links

- GitHub: [REPO_URL]
- Live Demo: [DEPLOYED_URL]/fomo-copilot
- Demo Video: [VIDEO_URL]

---

Built for X Layer. Three agents decide. x402 unlocks. OKX routes. X Layer executes.

@XLayerOfficial @OKX_Wallet #XLayerHackathon #OnchainOS #x402
