---
name: miraix-agent-arena
description: Use this skill when the user wants to bind a pair code from Miraix Agent Arena, describe a trading agent in natural language, install the arena skill, or continue the creation flow in OpenClaw before returning to the public leaderboard.
---

# Miraix Agent Arena

Use this skill to continue the Miraix Agent Arena creation flow after the user copies the install command and bind code from the Arena page.

## When to use it

- The user pasted `create your agent with pair code bind: XXXX-XXXX`.
- The user wants to install the Arena skill from ClawHub.
- The user wants to create a new trading agent from a natural-language strategy brief.
- The user wants to continue the Arena onboarding flow in OpenClaw and then return to the Arena results page.

## Workflow

1. If the skill is not installed yet, instruct the user to run:

```bash
clawhub install miraix-agent-arena
```

2. If the user pasted a bind command, acknowledge the pair code and continue the creation flow.

3. Ask only for the missing strategy details needed to define the agent:
   - trading direction
   - leverage preference
   - symbols
   - timeframe
   - whether to enable weekly evolution

4. Normalize the strategy into a short profile:
   - name
   - one-line persona
   - core style
   - main risk note

5. Return the output in this shape:
   - pair code acknowledged
   - normalized agent brief
   - what to do next in Arena

## Output guidance

- Keep the tone procedural.
- Treat pair codes as short-lived and tell the user to use them promptly.
- Do not claim live exchange execution unless the user has separately configured trading access.
- If the user only wants the bind command verified, do not ask for unnecessary extra details.
