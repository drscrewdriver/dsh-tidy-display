# Cloud agent rules

These rules are mandatory for every Cloud Agent turn in this repository. Soft wording elsewhere does not override them.

## Model

- Only use Grok 4.6 (`cursor-grok-4.6-*`).
- Prefer Grok or Composer only. Composer is the only fallback if Grok is unavailable.
- Never Claude, Sonnet, Opus, GPT, or Gemini — including via Task, subagents, or "just this one helper".
- Subagents inherit the parent model (`model: inherit`). Do not pass a `model` argument.

## Task / computer use / browser

- Do not spawn the Task tool, computerUse, or browser/subagent browsers unless the user explicitly required that path for this turn.
- Default to local tools: Read, Grep, Glob, Shell, and in-repo tests.
- Do not use browser automation to work around a missing Host, skin, or MCP server.

## Scope

- One repo: `dsh-tidy-display` only.
- Subtract first. Reuse Reader / conversation DOM. Do not invent production architecture.
- Never rewrite Reader to rehost native ChatView.

## Hooks

`.cursor/hooks.json` + `.cursor/hooks/block-other-models.sh` deny Claude/Sonnet/Opus/GPT/Gemini and computerUse/browser at `subagentStart`. Do not weaken or bypass those hooks.
