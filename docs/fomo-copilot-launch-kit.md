# Miraix Rotation Desk Submission Kit

## Submission Name

`Miraix Rotation Desk`

Internal route and code path stay on `/fomo-copilot`, but the submission-facing name should be `Miraix Rotation Desk`.

## One-Line Positioning

`Miraix Rotation Desk` turns one user intent into a three-agent onchain workflow:

`Strategist Agent -> Risk Agent -> Execution Agent`

The user asks what to do with `100U` on `X Layer`, gets a free preview, pays through `x402`, and then executes the exact basket prepared through `OKX OnchainOS`.

## Why This Fits The Hackathon

### 1. Integration

- `X Layer` is the execution chain, not a decorative add-on
- `x402` is the paywall for premium agent actions
- `OKX OnchainOS` is used for token discovery, quotes, routes, and executable payload generation

### 2. Utility

- Real budget input
- Real wallet connection
- Real payment gate
- Real transaction broadcast
- Real tx hash proof

### 3. Innovation

- This is not a single chat bot
- The workflow is split into:
  - `Strategist Agent`: builds the first basket
  - `Risk Agent`: constrains reserve, concentration, and slippage
  - `Execution Agent`: validates x402 unlock, route readiness, and X Layer payloads

### 4. Reproducibility

- Public codebase
- Clear page entry: `/fomo-copilot`
- Visible multi-agent decision log
- Visible payment rail
- Visible trade rail
- Visible transaction proof board

## Product Story

The user should not need to manually stitch together market research, route discovery, payment, and trade execution.

`Miraix Rotation Desk` compresses that whole loop into one flow:

1. User enters a budget, risk mode, and horizon
2. `Strategist Agent` proposes a basket on `X Layer`
3. `Risk Agent` explains reserve ratio and downside tradeoffs
4. `Execution Agent` shows whether the actual payloads are ready
5. User pays with `USDT` or `USDC` via `x402`
6. The exact `OKX OnchainOS` route payloads are used to broadcast trades on `X Layer`
7. The page returns a proof board with explorer links

## Architecture

### Frontend

- `/fomo-copilot`
- Embedded `Privy` EVM wallet
- `x402` client-side unlock flow
- Proof UI for payment reference and transaction hashes

### Backend

- `generateFomoPreview`
- `generatePremiumFomoPlan`
- `OKX OnchainOS` market and DEX payload integration
- `x402` premium endpoint on `X Layer`

### Chain Setup

- Chain: `X Layer`
- Chain ID: `196`
- Gas asset: `OKB`
- Payment assets: `USDT` / `USDC`
- Trade input asset: `USDT`

## 30-Second Demo Script

1. Open `/fomo-copilot`
2. Show the hero:
   `Strategist Agent + Risk Agent + Execution Agent`
3. Pick:
   - budget
   - risk
   - horizon
4. Click `生成免费预览`
5. Pause on:
   - theme
   - FOMO score
   - the three preview agent cards
6. Click `支付 ... 并执行`
7. Show wallet confirmation
8. Pause on the unlocked state:
   - `Agent 决策日志`
   - `执行证据板`
   - explorer links for broadcast txs
9. End on the share image

## Recording Shot List

### Shot 1

Hero section:

- project name
- three-agent labels
- X Layer positioning

### Shot 2

Free preview:

- FOMO score
- confidence
- market pulse
- preview agent loop

### Shot 3

Payment and unlock:

- payment asset selector
- `x402`
- wallet confirmation

### Shot 4

Premium state:

- unlocked basket
- agent decision log
- execution proof board

### Shot 5

Explorer proof:

- payment reference
- tx links
- share image

## Judge Mapping

### Integration

- `OKX OnchainOS` is used in the core trading path
- `x402` is used in the core payment path
- `X Layer` is where the trade broadcasts happen

### Utility

- User intent is translated into an executable basket
- The page solves a real workflow instead of stopping at advice

### Innovation

- Three specialized agents participate in one trade loop
- The system exposes their reasoning as a product feature

### Reproducibility

- One page
- One wallet
- One chain
- One paywall
- One proof board

## Voiceover Draft

```text
This is Miraix Rotation Desk.

The user asks one simple question:
I have 100U. What should I do on X Layer today?

Instead of returning one black-box answer, Miraix splits the workflow into three agents.

The Strategist Agent builds the basket.
The Risk Agent checks reserve, concentration, and slippage.
The Execution Agent validates x402 unlock and route readiness.

After payment, OKX OnchainOS supplies the executable route payloads, and the user broadcasts the trades on X Layer with the same EVM wallet.

This creates a full loop:
strategy, risk control, payment, execution, and proof.
```

## X Post Draft

```text
We built Miraix Rotation Desk on X Layer.

A user asks:
"I have 100U. What should I do today on X Layer?"

Miraix breaks that into 3 agents:
- Strategist Agent
- Risk Agent
- Execution Agent

Flow:
free preview -> x402 unlock -> OKX route payloads -> X Layer broadcast

What OKX OnchainOS does:
- market discovery
- quote routing
- executable payload prep

What x402 does:
- unlock premium agent actions onchain

This is not just AI commentary.
It is a full onchain agent loop with proof.
```

## Reproducibility Checklist

- `OKX_API_KEY`
- `OKX_SECRET_KEY`
- `OKX_PASSPHRASE`
- `USDT_X402_*` or `PRIMARY_X402_*`
- `USDC_X402_*` or `SECONDARY_X402_*`
- `NEXT_PUBLIC_LANGGRAPH_API_BASE`
- `Privy` frontend keys

## Demo Success Checklist

- Preview loads
- Payment rail options render
- Premium unlock succeeds
- Agent log renders
- At least one X Layer tx hash is shown
- Share image exports
