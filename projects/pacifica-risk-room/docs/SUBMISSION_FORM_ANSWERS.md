# Pacifica Risk Room Submission Answers

## Project Name

Pacifica Risk Room

## Track

Analytics & Data

## One-Line Description

Pacifica Risk Room turns Pacifica perpetuals market and account data into a real-time risk, funding, liquidation, and replay dashboard.

## What Problem Does It Solve

Perp traders often have prices, positions, and fills scattered across multiple views, but no single place that answers the actual risk question:

- which markets are crowded
- where liquidation stress is appearing
- how much funding will cost
- whether the account has room to add more leverage

Pacifica Risk Room compresses those answers into one operator surface.

## What Makes It Innovative

- It is Pacifica-native instead of a generic exchange terminal.
- It combines market pulse, liquidation radar, funding carry, account replay, and bounded order guidance in one route.
- It stays demo-ready even without a live account by using explicit sample account mode while still pulling live Pacifica market data.

## Pacifica APIs Used

- `GET /info`
- `GET /info/prices`
- `GET /trades?symbol=...`
- `GET /funding_rate/history?symbol=...`
- `GET /account?account=...`
- `GET /positions?account=...`
- `GET /orders?account=...`
- `GET /trades/history?account=...`
- `GET /positions/history?account=...`
- `GET /portfolio?account=...&time_range=1d`

## User Flow

1. Open Pacifica Risk Room.
2. Review the market pulse, liquidation radar, and carry board.
3. Optionally enter a Pacifica account id for live account review.
4. Inspect positions, open orders, replay history, and the risk verdict.
5. Use the safe order plan to decide whether to wait, probe, reduce, or hedge.

## Why It Fits This Track

The project does not optimize for auto-execution.

It optimizes for:

- market intelligence
- PnL and posture replay
- funding and liquidation analytics
- operator-readable decision support

That maps directly to Analytics & Data.

## Short Demo Summary

The demo opens on the risk verdict, then walks through:

- market pulse
- liquidation radar
- funding carry board
- live or sample account replay
- safe order plan

## Future Expansion

- live WebSocket streaming for push-based updates
- saved trader profiles and watchlists
- alerting for funding spikes and liquidation clusters
- builder-flow handoff for approved order plans
