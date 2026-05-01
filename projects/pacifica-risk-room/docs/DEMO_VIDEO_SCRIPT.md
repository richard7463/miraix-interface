# Pacifica Risk Room Demo Script

## Length

`75-90` seconds

## Goal

Show that Pacifica Risk Room is a Pacifica-native analytics product, not a generic dashboard and not another bot.

## Script

### 1. Open on verdict

"This is Pacifica Risk Room, a real-time analytics and risk dashboard for Pacifica perpetuals."

"Instead of starting with charts, it starts with the operator verdict: how much room is left to add leverage, what carry is building, and where liquidation stress is showing up."

### 2. Show market pulse

"The market pulse board is built from Pacifica market data. For each watched perp, it shows mark, 24-hour move, open interest, volume, leverage ceiling, and a crowding score."

"This helps an operator see which Pacifica markets are crowded before taking the next trade."

### 3. Show liquidation radar

"Below that is the liquidation radar. It turns recent Pacifica trade flow into a stress feed, so liquidations and settlement prints are visible immediately instead of getting buried in raw trade history."

### 4. Show funding carry board

"On the right is the funding carry board. It converts Pacifica funding history into something more useful: next funding, carry cost per one thousand dollars of notional, and a recent funding curve."

"This makes crowded carry regimes obvious."

### 5. Show account replay

"When a Pacifica account id is entered, the room loads account equity, positions, open orders, and replay history. If no account is provided, the product falls back to sample account mode so the demo still proves the experience."

### 6. Show safe order plan

"At the bottom is the safe order plan. The point is not auto-trading. The point is giving a bounded next action: wait, probe, reduce, or hedge, with a leverage cap and size cap."

### 7. Close

"Pacifica Risk Room fits Analytics and Data because it turns Pacifica-native market and account data into a fast, operator-readable decision surface for perp risk."
