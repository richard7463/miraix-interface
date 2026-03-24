# Miraix Agent Arena Submission Kit

## Submission Name

`Miraix Agent Arena`

## One-Line Positioning

`Miraix Agent Arena` lets anyone create an OKX trading agent with natural language, send it into a demo-first validation arena, and then decide whether that agent deserves promotion.

## Core Story

- The user does not create a bot inside a web form
- The user installs the Arena skill, binds a pair code, and finishes creation inside OpenClaw
- The Arena page becomes the public control surface:
  - leaderboard
  - results page
  - market context
  - portfolio state
  - execution proof
  - lifecycle management

One sentence:

`Create in agent chat -> validate in arena -> review for promotion`

## Why This Fits OKX Second Phase

### 1. Integration

- The platform is framed around `OKX Agent Trade Kit`, not generic market widgets
- The first two live skill phases are:
  - `okx-cex-market`
  - `okx-cex-portfolio`
- The promotion path is explicitly designed for:
  - `okx-cex-trade` in demo mode first
  - `okx-cex-bot` as a later contestant type

### 2. Utility

- Non-quant users can create a trading agent through natural language
- The system does not stop at “strategy generation”
- It keeps a public scoreboard, operator identity, result pages, and promotion logic
- It turns a chat flow into a reusable product loop

### 3. Innovation

- This is not one trading bot
- This is a platform for generating, validating, ranking, and promoting many bots
- It introduces a `demo-first promotion committee` instead of defaulting every agent to execution
- It separates:
  - creation
  - public evaluation
  - promotion review
  - live lock

### 4. Reproducibility

- Clear page entry: `/agent-arena`
- Clear creation flow:
  - install skill
  - copy bind code
  - continue in OpenClaw
- Public list page
- Public result page
- Visible skill rollout and promotion status

## Product Structure

### Home

- `Create Agents`
- `My Agents`
- public leaderboard
- reality split: ranking vs proof
- season prize pool concept
- compact agent table

### Create Flow

Step 1:

```bash
clawhub install miraix-agent-arena
```

Step 2:

```text
create your agent with pair code bind: XXXX-XXXX
```

The actual strategy dialogue continues in OpenClaw.  
The Arena remains the place where the agent comes back for ranking and review.

### Reality Split

- `leaderboard / scorecard`
  - simulation-assisted ranking layer
- `detail / submission pages`
  - real OKX demo orders, fills, runner snapshots, and runtime events when a dedicated runner is active

This distinction should be explicit in the product, in the video, and in the submission copy.

### Result Page

Each agent has:

- name
- persona
- creator
- public PnL
- equity curve
- current positions
- OKX market context
- OKX portfolio snapshot
- promotion committee result
- blockers
- next action
- execution evidence
- demo routing draft

## Private Readiness

To turn the current fallback portfolio and execution panels into real OKX-backed data, configure:

```bash
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_PASSPHRASE=
OKX_DEMO_TRADING=true
```

Recommended competition posture:

- keep `OKX_DEMO_TRADING=true`
- do not route live execution
- show that the platform is `demo-first`
- let the jury see:
  - live market candles
  - portfolio snapshots
  - recent orders
  - recent fills
  - a blocked / allowed demo routing decision

This is important for scoring because it proves the Arena is not only a visual leaderboard. It is a promotion and execution-gating system.

## Promotion System

This is the part that makes the product stronger than a flat leaderboard.

Promotion states:

- `sandbox`
- `demo-candidate`
- `demo-running`
- `promotion-review`
- `live-locked`

The Arena does not treat every profitable strategy as immediately executable.

It evaluates:

- PnL
- ROI
- discipline
- blowup history
- drawdown
- win rate
- risk-adjusted score

That score produces:

- whether the agent can move from sandbox to demo
- whether the agent stays demo-only
- whether it can enter promotion review
- whether live execution should remain locked

## Why This Is Better Than A Simple Bot Factory

- A simple bot factory only creates bots
- A leaderboard-only site only ranks bots
- `Miraix Agent Arena` creates a full system:
  - creation
  - public comparison
  - results
  - evaluation
  - promotion control

It is closer to an `AI trading operator management layer` than a single demo page.

## Three-Step Reproducibility Path

1. Install the skill:

```bash
clawhub install miraix-agent-arena
```

2. Bind the pair code:

```text
create your agent with pair code bind: XXXX-XXXX
```

3. Open the submitted detail page and inspect:

- latest order id
- latest fill id
- runner snapshots
- execution evidence

## Demo Script

Keep this to `45-60 seconds`.

1. Open `/agent-arena`
2. Show:
   - `Create Agents`
   - `My Agents`
   - the reality split
   - the monthly season prize concept
3. Open `Create Agents`
4. Show:
   - `clawhub install miraix-agent-arena`
   - pair code bind command
5. Open the submission page
6. Pause on:
   - real evidence chain
   - latest order id
   - latest fill id
   - runner snapshots
7. Open the full agent detail page
8. End on:
   - execution evidence
   - recent orders
   - recent fills
   - the message that ranking is simulation-assisted while proof is real

## Recording Shot List

### Shot 1

Homepage:

- project title
- `Create Agents`
- `My Agents`
- reality split
- season prize concept

### Shot 2

Create modal:

- Step 1 install command
- Step 2 bind code
- explain that creation continues in OpenClaw

### Shot 3

Submission page:

- real evidence chain
- latest order id
- latest fill id
- runner snapshots

### Shot 4

Detail page:

- execution evidence
- recent orders
- recent fills
- runner-backed account state

## Judge Mapping

### Integration

- `okx-cex-market` is represented as the first live data phase
- `okx-cex-portfolio` is represented as the second live data phase
- `okx-cex-trade` is intentionally demo-first, not recklessly enabled
- `okx-cex-bot` is planned as a future contestant class

### Utility

- Users can create agents from natural language without a quant workflow
- The platform gives those agents a persistent evaluation surface
- It organizes many agents, not just one strategy demo

### Innovation

- Public arena + natural-language creation + promotion committee
- Execution is not assumed; it is gated
- The system focuses on whether an agent deserves promotion, not only whether it made money once

### Reproducibility

- One entry page
- One clear creation flow
- One public result path
- One visible promotion system

## Voiceover Draft

```text
This is Miraix Agent Arena.

Instead of building one AI trading bot, we built a platform where anyone can create their own OKX trading agent with natural language.

The creation flow does not happen in a long web form.
The user installs the Arena skill, binds a pair code, and finishes the strategy dialogue inside OpenClaw.

Then the agent comes back here.

The Arena gives each agent a public result page, a leaderboard position, market context, portfolio context, and a promotion status.

The important point is that profitable does not automatically mean promotable.

Every agent is evaluated through a demo-first promotion system:
sandbox, demo candidate, demo running, promotion review, and live locked.

So this is not just a bot factory.
It is a system for creating, ranking, validating, and reviewing AI trading agents.
```

## X Post Draft

```text
We built Miraix Agent Arena.

Anyone can create an OKX trading agent with natural language, bind it through OpenClaw, and bring it back into a public arena for ranking and promotion review.

What makes it different:
- not just one bot
- not just one backtest
- not just a leaderboard

Each agent gets:
- a public result page
- market context
- portfolio context
- promotion status
- blockers and next action

And the system stays demo-first:
sandbox -> demo candidate -> demo running -> promotion review -> live locked

The goal is not to let every AI trade immediately.
The goal is to decide which agents actually deserve promotion.
```

## OpenClaw Prompt

```text
Please use $miraix-agent-arena to create a new OKX trading agent.

Pair code:
create your agent with pair code bind: XXXX-XXXX

I want:
- direction: trend following
- leverage: 8x to 12x
- symbols: BTC-USDT, ETH-USDT
- timeframe: 15m and 1h
- weekly evolution: enabled

Give me:
1. normalized strategy brief
2. one-line persona
3. main risk note
4. what I should do next in the Arena
```
