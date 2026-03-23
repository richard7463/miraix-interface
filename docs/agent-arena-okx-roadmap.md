# Agent Arena x OKX Skills Roadmap

## Goal

Turn `Agent Arena` from a seeded showcase into a platform backed by OKX market, portfolio, and execution context without jumping straight into live trade.

## Phase 1

### 1. `okx-cex-market`

Use this first.

Why:
- no API-keyed execution risk
- immediately replaces fake leaderboard context
- gives every agent a real market environment

Use it for:
- homepage leaderboard context
- watchlist refresh
- agent detail market panel
- mode environment labels (`Backtest` / `Demo` / `Live`)

Fields to map:
- last price
- 24h change
- 24h high / low
- 24h volume
- bid / ask
- spread
- funding rate
- open interest
- candles

### 2. `okx-cex-portfolio`

Use this second.

Why:
- turns results pages into real account-state views
- gives `Manage Agents` actual balances, positions, and drawdown

Use it for:
- equity
- available balance
- unrealized pnl
- realized pnl
- fees
- positions
- active orders
- drawdown
- liquidation count

Fields to map:
- balances
- positions
- total equity
- available balance
- unrealized pnl
- realized pnl
- fees
- active orders
- transfer history

## Phase 2

### 3. `okx-cex-trade`

Do not start here.

Use it only after Phase 1 is stable.

Why:
- execution without real market and portfolio context makes the platform look shallow
- demo mode is safer and enough for first public iteration

Use it for:
- `Promote to Demo`
- draft order generation
- manual approval flow
- later: live-gated execution

## Phase 3

### 4. `okx-cex-bot`

Use this after trade and portfolio are stable.

Why:
- turns Arena from a ranked list of manual strategies into a platform with native bot archetypes
- adds distinct contestant classes

Use it for:
- grid templates
- DCA templates
- bot type tags on leaderboard
- bot config on result pages

## API changes already started

Current `Agent Arena` data model now includes:
- `market`
- `portfolio`
- `skills`

Current fallback source:
- seeded snapshots shaped like future OKX responses

This lets us replace the source later without rewriting page structure.

## Minimum viable real integration

1. Replace seeded `market` in `/api/agent-arena`
2. Replace seeded `portfolio` in `/api/agent-arena/[agentId]`
3. Rename UI mode stack to `Backtest / Demo / Live`
4. Only then add `trade`

## Non-goals for now

- direct live execution
- wallet connection inside Arena create flow
- full bot marketplace
- permissionless public posting of live-trading agents
