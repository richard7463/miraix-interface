# Binance Agent Firewall Submission Kit

## One-Line Positioning

`Binance Agent Firewall` judges whether an AI trading prompt is safe enough to touch a Binance account before it gets real execution power.

## Core Story

- `Miraix` turns a natural-language agent prompt into a permission graph and execution plan
- `Binance public market data` provides live ticker, order book depth, and intraday candle context
- `Binance market universe scan` ranks the selected symbols against the broader Binance spot universe
- `Firewall logic` outputs `Pass / Warn / Block`, then rewrites the prompt into a fenced execution policy and probation profile

One sentence:

`Prompt intent -> Binance live context -> execution firewall`

## Why This Is Not A Normal Dashboard

- It does not just show prices; it judges whether an AI operator should be allowed near account permissions
- It treats permissions, leverage, sizing, confirmation, and volatility as one system
- It compares symbols against the Binance market universe and classifies them into `ALLOW / WATCH / BLOCK`
- It outputs a safer prompt, not only a prettier warning

## Demo Script

1. Open `/binance-agent-firewall`
2. Load the `危险合约型` example
3. Highlight:
   - watchlist
   - dangerous prompt
4. Click `Run Firewall`
5. Pause on:
   - `BLOCK`
   - safety score
   - the top finding
6. Scroll to:
   - Binance live market proof
   - Binance native layer
   - permission matrix
   - guardrails
7. Copy the safe prompt
8. Download the share card

## Recording Shot List

### Shot 1

Open the hero section and keep the frame on:

- title
- examples
- strategy textarea

### Shot 2

Run the dangerous prompt and pause on:

- `Pass / Warn / Block`
- score bubble
- watchlist pills

### Shot 3

Scroll through:

- live Binance evidence
- permission matrix
- guardrail stack

### Shot 4

Pause on the safe prompt rewrite.

### Shot 5

End on the share card.

## Scoring Alignment

### Integration

- Binance spot market universe scan
- Binance spot ticker
- Binance order book depth
- Binance 1h UI klines
- Futures funding as best-effort enrichment

### Utility

- Solves a real user fear: AI prompt quality is easy to fake, bad account permissions are not
- Gives direct next steps instead of abstract warnings
- Converts a prompt into an account-level operating policy

### Innovation

- Reframes the agent from `chat advisor` to `execution probation officer`
- Turns market data into safety policy, not just narrative commentary
- Adds symbol-level probation based on where each token sits inside Binance's own market universe

### Reproducibility

- No private API keys required for the main demo
- Prompt in, verdict out
- Share card, copy, rules, and probation workflow are all visible in one page

## Submission Copy

```text
We built Binance Agent Firewall.

Instead of asking an AI trading agent what to buy, we ask a harder question first:
Should this agent be allowed to touch a Binance account at all?

The product takes a natural-language trading prompt, parses its required permissions and execution style, then combines that with live Binance market data:
- Binance spot market universe
- 24h ticker
- order book depth
- intraday volatility
- futures funding when available

From there it returns:
- Pass / Warn / Block
- a safety score
- an ALLOW / WATCH / BLOCK symbol probation layer
- a permission matrix
- a guardrail stack
- a rewritten safe prompt

This is not another dashboard.
It is an execution firewall for AI operators.
```

## X Post Draft

```text
We built Binance Agent Firewall.

Paste an AI trading prompt, and it tells you whether that agent should be allowed near your Binance account:

- Pass / Warn / Block
- live Binance market proof
- permission matrix
- guardrails
- safe prompt rewrite

The goal is not “better chat”.
The goal is making sure the AI trader does not become the incident.
```

## Visual Checklist

- Show the dangerous prompt first
- Show the verdict immediately after analysis
- Show that Binance data is live
- Show the permission matrix
- Show the rewritten safe prompt
- End on the share card
