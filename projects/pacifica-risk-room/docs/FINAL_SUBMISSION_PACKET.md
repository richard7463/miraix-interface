# Pacifica Risk Room Final Submission Packet

## Recommended Track

`Analytics & Data`

Why this is the strongest fit:

- the product value is market intelligence, funding analysis, liquidation awareness, and account replay
- it helps traders make better decisions without requiring automatic execution
- it maps directly to the hackathon judging language around analytics, dashboards, and data products

## Project Name

Pacifica Risk Room

## One-Line Pitch

Pacifica Risk Room turns Pacifica perpetuals market and account data into a real-time risk, funding, liquidation, and replay dashboard.

## Short Summary

Pacifica Risk Room is a Pacifica-native analytics surface for perp traders. It combines market pulse, funding carry, liquidation radar, account replay, and a bounded order plan into one judge-ready experience. Instead of forcing users to inspect multiple tabs, it compresses Pacifica market and account data into a fast risk decision.

## Detailed Description

Perpetual traders usually have to piece together prices, positions, fills, funding, and liquidation context across multiple views. Pacifica Risk Room turns those fragmented signals into one operator surface built around the real question: is the account safe to add risk right now?

The product aggregates Pacifica market data, trade flow, funding history, and optional account data into a verdict-driven dashboard. It highlights crowded markets, surfaces liquidation stress, estimates near-term funding drag, replays account posture, and proposes a bounded next action such as wait, probe, reduce, or hedge. If a live Pacifica account id is not provided, the experience still works in explicit sample mode, which keeps the demo reliable while preserving live market context.

## What Makes It Innovative

- Pacifica-native instead of a generic exchange dashboard
- combines risk verdict, carry board, liquidation radar, and replay in one route
- converts raw exchange telemetry into operator-readable decisions
- remains demo-safe with live market data plus sample account fallback

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
2. Review the top-level risk verdict and market pulse.
3. Inspect liquidation radar and funding carry by market.
4. Optionally enter a Pacifica account id for live account review.
5. Review positions, open orders, replay history, and the bounded order plan.

## Judging Angle

### Innovation

The project reframes exchange data as a decision surface rather than a quote board.

### Technical Execution

It aggregates multiple Pacifica endpoints, computes derived risk metrics, handles fallback states, and renders the result in a single route.

### User Experience

The experience is verdict-first, readable in under a minute, and demo-stable with or without a live account id.

### Potential Impact

The product helps Pacifica traders reduce avoidable risk before they increase leverage.

### Presentation

README, screenshots, demo script, and submission answers are already prepared.

## Demo Flow

1. Open the route and show the top-level risk verdict.
2. Explain market pulse and crowding.
3. Show liquidation radar as the stress feed.
4. Show funding carry board and cost per `$1k` notional.
5. Enter an account id or explain sample mode.
6. End on the safe order plan and why this belongs in Analytics & Data.

## Links To Fill Before Final Submission

- Repository URL: `https://github.com/richard7463/miraix-interface/tree/codex/pacifica-risk-room/projects/pacifica-risk-room`
- Pull Request URL: `https://github.com/richard7463/miraix-interface/pull/1`
- Demo Video URL: `add your uploaded video link`
- Live Demo URL: `http://localhost:3000/pacifica-risk-room` or deployed URL if you ship it

## Files Included In This Submission Packet

- [`README.md`](../README.md)
- [`DEMO_VIDEO_SCRIPT.md`](./DEMO_VIDEO_SCRIPT.md)
- [`SUBMISSION_FORM_ANSWERS.md`](./SUBMISSION_FORM_ANSWERS.md)
- [`risk-room-hero.png`](./assets/risk-room-hero.png)
- [`risk-room-panels.png`](./assets/risk-room-panels.png)

## Final Checklist

- record or upload demo video
- replace repository and PR placeholders with real links
- add a live Pacifica account id during demo if available
- submit under `Analytics & Data`
