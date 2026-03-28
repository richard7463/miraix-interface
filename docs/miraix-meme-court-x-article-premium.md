# Miraix Meme Court

**Three agents. One wallet. One disciplined meme trade.**

Miraix Meme Court is a Bitget Wallet Track submission built around one narrow idea:
do not let a Solana meme trade touch the wallet until it has survived discovery, veto, and execution review.

Most meme trading products optimize for speed.
They surface a hot token, show some momentum, and push the user toward action.

We took the opposite approach.

Miraix Meme Court is not trying to generate more ideas.
It is trying to reject weak ideas before the user signs anything.

## 1. Product Positioning: Not Another Meme Bot

The problem in meme trading is not lack of information.

There is already too much information:

- ranked pairs
- trending symbols
- whale activity
- market noise
- copy-trading chatter

What users usually do not have is a disciplined decision structure.

A token may be trending, but that does not mean it is safe enough.
A chart may look strong, but that does not mean the holder structure is clean enough.
A route may exist, but that does not mean the position size is sane.

That is the gap Miraix Meme Court is built for.

It compresses the flow into one product loop:

- Scout finds candidates
- Rug Court rejects weak setups
- Trader prepares one approved trade
- the wallet reviews an unsigned payload before signing

The goal is not “AI tells you what to buy.”
The goal is “the system narrows the market to one trade worth reviewing.”

## 2. Why Three Agents Instead of One

This was the first design decision that mattered.

Most AI trading products still behave like a single-agent system.
One model reads market data, emits a recommendation, and also tries to explain why the recommendation is acceptable.

That structure has three weaknesses.

**First, strategy and risk are mixed together.**
When the same system proposes the trade and judges the trade, there is no real internal constraint.

**Second, the decision is hard to audit.**
The user sees the conclusion, but not the disagreement or the veto logic that should have happened before execution.

**Third, execution readiness is often separate from the actual decision.**
A token can look attractive in text while still being a poor candidate once liquidity, route quality, and position discipline are considered.

Miraix Meme Court splits those responsibilities into three explicit layers.

## 3. The Three-Agent Structure

**Scout Agent**

Scout is responsible for market discovery.
It pulls ranked Solana meme candidates and compresses them into a shortlist worth reviewing.

Scout does not decide whether a trade is safe.
Its job is to reduce noise.

**Risk Agent / Rug Court**

Risk Agent is the core differentiator.
This is the layer that can kill a trade.

Rug Court screens each candidate against the conditions that actually matter for a meme trade:

- safety posture
- liquidity quality
- holder concentration
- developer quality
- whether the setup still fits the selected desk style

If the evidence is weak, the candidate is banned.
If the evidence is borderline, the candidate stays on watch.
Only a surviving candidate is allowed to reach Trader.

**Trader Agent**

Trader does not get a bag of options.
Trader gets one job:
take the cleanest surviving setup and package it into a wallet-sized action.

That includes:

- position size
- invalidation
- exit ladder
- execution readiness
- unsigned payload preparation path

This matters because the product is not a recommendation feed.
It is a trade preparation system with explicit constraint layers.

## 4. Why “Rug Court” Matters

Discovery by itself is not a product.

Anyone can surface a list of hot meme coins.
That does not make the result useful.

The real product moment is when the system says:

“No, this one does not deserve wallet access.”

That is why we made Rug Court the center of the experience.

The product does not try to impress the user with ten ideas.
It tries to earn trust by rejecting bad ones.

In practice, that means the user can see:

- which names were shortlisted
- which names were vetoed
- which name survived
- why the final trade was allowed through

That is a much stronger product story than a generic chat interface wrapped around market data.

## 5. Why This Fits Bitget Wallet Track

Bitget is not a decorative integration in this project.
It sits on the critical path.

The system depends on Bitget-linked capabilities for:

- ranked market discovery
- safety screening
- quote readiness
- payload preparation
- order lifecycle visibility

If those rails disappear, the product collapses from a trading agent into a static shell.

That is the standard we wanted for this track.

Not “we called one sponsor API.”
Not “we put a wallet button on a page.”

But a product where the sponsor stack materially determines whether the workflow is real.

## 6. Why We Only Approve One Trade

This was another deliberate product choice.

Most trading interfaces try to create value by increasing output:
more symbols, more alerts, more opportunities, more action.

Miraix Meme Court goes the other way.

It is designed to produce less output, but higher-quality output:

- one shortlist
- one court process
- one approved trade
- one wallet review step

That makes the experience easier to understand for both users and judges.

It also makes the risk posture much more coherent.

Instead of pretending the user can act on ten different meme opportunities at once, the system narrows the field and forces discipline into the interface.

## 7. Human-in-the-Loop Is Part of the Product

We did not want a black-box “AI auto-trades for you” story.

The product is explicitly human-in-the-loop.

The system can:

- shortlist the market
- judge candidates
- prepare the trade
- generate the unsigned payload path

But the wallet still gets the final review moment before signing.

That is important for two reasons.

First, it keeps the system legible.
The user can see the size, route, invalidation, and payload step before committing.

Second, it matches the actual reality of better agent systems.
The strongest agent products are not the ones that remove all review.
They are the ones that make the final human decision smaller, cleaner, and easier to trust.

## 8. Demo Flow

The judge flow is intentionally short.

1. Set the wallet, budget, risk mode, and desk style
2. Run Scout and Rug Court
3. Inspect the shortlist and veto decisions
4. Open the one approved trade
5. Prepare the unsigned payload for wallet review

That is enough to show the full product idea:
discover, veto, then execute.

## 9. Reproducibility and Reviewability

A good submission should not require the reviewer to guess how the system works.

So the product surface is built to make the logic visible:

- the shortlist is visible
- the Rug Court outcome is visible
- the approved trade is visible
- the execution readiness state is visible
- the payload preparation step is visible

This matters because “multi-agent” is often only claimed at the architecture level.

In Miraix Meme Court, the point is not just that the backend has multiple roles.
The point is that the user can see those roles expressed in the product.

## 10. Why This Project Stands Out

There are many ways to build an AI trading demo.

You can build a chatbot.
You can build a ranking page.
You can build a fast signal feed.
You can build a copy-trading wrapper.

We chose a narrower and more opinionated direction:

build a meme trading agent whose main job is not to hype the next trade, but to refuse weak trades before they reach the wallet.

That is the product we think is worth submitting.

## 11. How To Install And Use It

Miraix Meme Court is also packaged as a ClawHub skill.

Install it with:

- `clawhub install miraix-meme-court`

Then run it with a prompt like:

- `Use $miraix-meme-court to run Meme Court for 100 USDC, balanced risk, momentum style, and return one approved Solana meme trade.`
- `Use $miraix-meme-court on wallet AYY3Bi6NSwH3F9Q5cy5xN9ZqRgnNYhm6TMkTwVBRVGeq with degen risk and shadow style.`
- `Use $miraix-meme-court to prepare the approved trade if live payload generation is available.`

The skill returns the same core structure shown in the product:

- Scout shortlist
- Rug Court verdicts
- one approved trade
- execution readiness
- payload status

For the visual product flow, open:

- `/meme-court`

One honest implementation detail matters:
if live Bitget market access is unavailable in the current environment, Meme Court still runs in preview mode and returns the full decision flow, but unsigned payload generation may remain unavailable until live execution access is restored.

## Links

- GitHub: https://github.com/richard7463/miraix-interface
- ClawHub skill: `miraix-meme-court`
- Product route: `/meme-court`
- Demo video: attached in the submission thread

Miraix Meme Court is not trying to be a general-purpose assistant.
It is a focused Solana meme trading agent built around one clear logic:

**discover, veto, then execute.**
