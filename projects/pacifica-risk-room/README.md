# Pacifica Risk Room

![Hero](docs/assets/risk-room-hero.png)

![Track](https://img.shields.io/badge/Track-Analytics%20%26%20Data-0f766e)
![Platform](https://img.shields.io/badge/Platform-Pacifica%20Perps-111827)
![Surface](https://img.shields.io/badge/Surface-Risk%20Room-c2410c)
![Mode](https://img.shields.io/badge/Modes-Live%20Market%20%7C%20Sample%20Account-2563eb)
![Refresh](https://img.shields.io/badge/Refresh-20s%20auto--refresh-0ea5e9)

Real-time risk, funding, liquidation, and account replay intelligence for Pacifica perpetuals.

## 30-Second Pitch

Pacifica Risk Room is an operator dashboard for Pacifica perps.

It is not another chart page and not another trading bot.

Its job is to turn Pacifica market and account data into a faster risk decision:

- which markets are crowded
- where liquidation stress is appearing
- how much next funding could cost
- whether a trader has room to add risk
- what a bounded next order should look like

The product combines:

- market pulse for a Pacifica watchlist
- liquidation radar from Pacifica recent trades
- funding carry board from Pacifica funding history
- live account review when a Pacifica account id is provided
- sample account fallback for demo continuity
- safe order plan with leverage and size caps

## For Judges

| Item | Evidence |
| --- | --- |
| Track | `Analytics & Data` |
| Product route | [`app/pacifica-risk-room/page.tsx`](../../app/pacifica-risk-room/page.tsx) |
| API route | [`app/api/pacifica-risk-room/route.ts`](../../app/api/pacifica-risk-room/route.ts) |
| Risk engine | [`lib/pacificaRiskRoom.ts`](../../lib/pacificaRiskRoom.ts) |
| README | [`projects/pacifica-risk-room/README.md`](README.md) |
| Demo script | [`docs/DEMO_VIDEO_SCRIPT.md`](docs/DEMO_VIDEO_SCRIPT.md) |
| Submission answers | [`docs/SUBMISSION_FORM_ANSWERS.md`](docs/SUBMISSION_FORM_ANSWERS.md) |
| Pacifica APIs used | `GET /info`, `GET /info/prices`, `GET /trades`, `GET /funding_rate/history`, `GET /account`, `GET /positions`, `GET /orders`, `GET /trades/history`, `GET /positions/history`, `GET /portfolio` |

## Scorecard

| Judging criteria | Evidence in this project |
| --- | --- |
| Innovation | Not a generic quote board. Pacifica Risk Room turns perps-specific carry, liquidation stress, margin usage, and safe execution boundaries into one operator view. |
| Technical execution | Live Pacifica REST aggregation, fallback handling, derived risk engine, account replay, and judge-ready route are all implemented. |
| User experience | One-page path: verdict first, then market pulse, funding carry, liquidation radar, account replay, and bounded order plan. |
| Potential impact | Pacifica traders need faster answers before they add leverage, not just after a liquidation happens. |
| Presentation | README, screenshots, demo script, and submission answers are included. |

## Proof Snapshot

This repository verifies the following implementation facts directly from code:

| Verified fact | Source |
| --- | --- |
| Default watchlist includes `BTC`, `ETH`, `SOL`, `XRP`, `HYPE`, and `PUMP` | [`lib/pacificaRiskRoom.ts`](../../lib/pacificaRiskRoom.ts) |
| Market data is fetched from Pacifica `info` and `info/prices` endpoints | [`app/api/pacifica-risk-room/route.ts`](../../app/api/pacifica-risk-room/route.ts) |
| Liquidation radar is built from Pacifica `trades` | [`app/api/pacifica-risk-room/route.ts`](../../app/api/pacifica-risk-room/route.ts) |
| Funding board is built from Pacifica `funding_rate/history` | [`app/api/pacifica-risk-room/route.ts`](../../app/api/pacifica-risk-room/route.ts) |
| Account review uses Pacifica `account`, `positions`, `orders`, `trades/history`, `positions/history`, and `portfolio` | [`app/api/pacifica-risk-room/route.ts`](../../app/api/pacifica-risk-room/route.ts) |
| Auto-refresh cadence is `20` seconds | [`components/PacificaRiskRoom/PacificaRiskRoomPage.tsx`](../../components/PacificaRiskRoom/PacificaRiskRoomPage.tsx) |
| Sample account fallback is built in for demo continuity | [`lib/pacificaRiskRoom.ts`](../../lib/pacificaRiskRoom.ts) |

## Screenshots

| Hero | Risk verdict and carry board |
| --- | --- |
| ![Hero](docs/assets/risk-room-hero.png) | ![Panels](docs/assets/risk-room-panels.png) |

## Architecture

```mermaid
graph TD
  A["Trader or Judge"] --> B["/pacifica-risk-room"]
  B --> C["/api/pacifica-risk-room"]
  C --> D["Pacifica REST /info"]
  C --> E["Pacifica REST /info/prices"]
  C --> F["Pacifica REST /trades"]
  C --> G["Pacifica REST /funding_rate/history"]
  C --> H["Optional account endpoints"]
  C --> I["Risk engine"]
  I --> J["Market pulse"]
  I --> K["Liquidation radar"]
  I --> L["Funding carry board"]
  I --> M["Account replay"]
  I --> N["Safe order plan"]
  J --> B
  K --> B
  L --> B
  M --> B
  N --> B
```

## Runtime Sequence

```mermaid
sequenceDiagram
  participant User
  participant Page as Pacifica Risk Room
  participant API as /api/pacifica-risk-room
  participant Pacifica as Pacifica REST
  User->>Page: Open route or submit account id
  Page->>API: Request watchlist and optional account review
  API->>Pacifica: Fetch market, funding, trades, and optional account endpoints
  Pacifica-->>API: Return raw Pacifica data
  API->>API: Build risk score, liquidation radar, carry board, and safe plan
  API-->>Page: Return one aggregated payload
  Page-->>User: Show verdict, replay, funding board, and order guidance
```

## What Makes It Different

| Generic dashboard | Pacifica Risk Room |
| --- | --- |
| Shows prices and maybe a PnL number | Shows a risk verdict tied to margin usage, liquidation distance, funding drag, and market crowding |
| Requires multiple tabs to inspect liquidation stress | Pulls liquidation and outsized trade prints into one radar |
| Makes funding feel like an isolated stat | Converts funding into carry cost per `$1k` notional |
| Breaks when no live account is configured | Keeps demo continuity with an explicit sample account mode |
| Leaves execution sizing implicit | Produces a safe order plan with leverage cap and size cap |

## Product Surface

### 1. Market Pulse

- mark, oracle, mid
- 24h move
- open interest
- 24h volume
- leverage ceiling
- crowding score

### 2. Liquidation Radar

- recent liquidation or settlement prints
- notional sizing
- severity classification
- time ordering for stress awareness

### 3. Funding Carry Board

- next funding per market
- carry cost per `$1k`
- impact spread
- recent funding curve

### 4. Account Replay

- equity
- available capital
- margin used
- open positions
- open orders
- recent fills
- recent closed positions

### 5. Safe Order Plan

- action: `wait`, `probe`, `reduce`, `hedge`
- leverage cap
- size cap
- order type
- invalidation note

## Repository Map

| Path | Purpose |
| --- | --- |
| [`app/pacifica-risk-room/page.tsx`](../../app/pacifica-risk-room/page.tsx) | Route entry and metadata |
| [`components/PacificaRiskRoom/PacificaRiskRoomPage.tsx`](../../components/PacificaRiskRoom/PacificaRiskRoomPage.tsx) | Main judge-facing product surface |
| [`app/api/pacifica-risk-room/route.ts`](../../app/api/pacifica-risk-room/route.ts) | Pacifica REST aggregation and payload assembly |
| [`lib/pacificaRiskRoom.ts`](../../lib/pacificaRiskRoom.ts) | Types, parsers, sample data, and risk engine |
| [`projects/pacifica-risk-room/docs`](docs) | Submission materials |

## Pacifica Integration

Pacifica Risk Room uses Pacifica-native data instead of generic exchange abstractions:

- `GET /info`: instrument specs such as tick size, lot size, max leverage, and min order size
- `GET /info/prices`: mark, oracle, open interest, 24h volume, current and next funding
- `GET /trades?symbol=...`: recent fills, liquidation events, and settlement prints
- `GET /funding_rate/history?symbol=...`: funding curve and impact spread analysis
- `GET /account?account=...`: account equity and spendable balance
- `GET /positions?account=...`: live position posture
- `GET /orders?account=...`: open orders
- `GET /trades/history?account=...`: recent replay feed
- `GET /positions/history?account=...`: recently closed positions
- `GET /portfolio?account=...&time_range=1d`: equity replay line

## Local Run

From the repository root:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000/pacifica-risk-room
```

## Submission Package

- README: this file
- Demo route: `/pacifica-risk-room`
- Demo script: [`docs/DEMO_VIDEO_SCRIPT.md`](docs/DEMO_VIDEO_SCRIPT.md)
- Submission answers: [`docs/SUBMISSION_FORM_ANSWERS.md`](docs/SUBMISSION_FORM_ANSWERS.md)

## Why This Track

This project belongs in `Analytics & Data` because the product value is not automatic execution.

The value is turning Pacifica market and account data into:

- market intelligence
- risk dashboards
- PnL and posture replay
- operator-ready decision support
