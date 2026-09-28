# dsh-tidy-display

[中文](./README.md)

**Tidy Display** — a community plugin for DeepSeek Harness (DSH) **0.1.7** that merges the reading view and the message rail into one plugin: long sessions become scannable, navigable, and resumable.

> This project merges two popular DSH plugins:
> [dsh-better-display](https://github.com/aa2246740/dsh-better-display) (reading view, maintained via a fork) ×
> [dsh-tidychat](https://github.com/BananaSoldier01/dsh-tidychat) (message rail / smart history loading).
> The merge removes the DOM-contract conflict between them; credit and thanks to both.

## Features

### Reading view (from better-display)
- Running steps collapse into expandable summaries; final answers render as **message bubbles** (translucent plate + optional frosted glass that lets skinned wallpapers through)
- The reasoning card shares the same translucent plate; streaming thinking can auto-follow, pause, and expand
- Official bridge: tool views, feedback, deliverable cards, turnTail via official slots
- `` ```mcp-app `` fences mount as sandboxed interactive cards (`<iframe sandbox="allow-scripts allow-forms">`); skill pack in [`skills/generative-mcpapps/`](skills/generative-mcpapps/)
- Deliverables row, waiting clock, pending echo; native Chat / Trajectory, composer, model picker, tools, and approvals stay

### Message rail (from dsh-tidychat)
- Canvas navigation rail at the conversation edge: fish-eye hover with summaries, click-to-jump, current-turn highlight on scroll
- Styles **lines / dots**, position **left / right (mirrored)**
- **White sheen ring**: a soft sheen beneath the current and hovered marks keeps them readable over busy wallpapers
- **Colors**: mark color and accent color each offer Auto (theme-following with a 3:1 corrective fallback) / Custom (color picker + HEX/RGB text + alpha slider)
- **Take over the official rail**: hides the official right-edge TurnNavigator (hidden, not unmounted)
- Works in **both** the native Chat view and the reading view

### Settings
Everything lives under **Settings → 起子插件设置 → 整洁显示 (Tidy Display)**: rail (toggle / position / style / sheen / takeover / colors) + message bubbles / frosted glass / auto-fold / deliverable open mode. Persisted on `dsh.reader.v1`.

## Install

### DSH Studio desktop app (recommended)

Open **Settings → Plugins → Add plugin** and enter the package name (after the npm release):

```text
@drscrewdriver/dsh-tidy-display
```

### Web CLI

```sh
dsh plugin --profile web add @drscrewdriver/dsh-tidy-display
```

Local directory / tarball (development / local testing):

```sh
dsh plugin --profile web add ./dsh-tidy-display
dsh plugin --profile web add ./dsh-tidy-display-0.1.0.tgz
```

`dsh.bundle` is captured at boot: do **not** hand-write the same insert row into the profile's `cordis.patch.yml` (double mount). Remove an installed copy with `dsh plugin --profile web remove dsh-tidy-display`. For an already-running Web Host, reopen the Host once and reload.

## Development

```sh
pnpm install
npm run typecheck
npm run build      # emits lib/ (committed; the check-harness-compat gate needs a Harness checkout)
npm test
```

Targets DeepSeek Harness **0.1.7-rc.1+** (peer `>=0.1.7-rc.1 <0.1.8`). Display only — it does not change Agent execution, the SDK, or credentials. Node.js `^22.19.0 || >=24`. New sessions default to reading.

## Relationship to the originals

- The reading view is based on [aa2246740/dsh-better-display](https://github.com/aa2246740/dsh-better-display) (MIT) plus drscrewdriver fork enhancements (per-row host anchor contract, reasoning plate, answer bubbles)
- The rail / colors / smart loading are ported from [BananaSoldier01/dsh-tidychat](https://github.com/BananaSoldier01/dsh-tidychat) (MIT)
- Upstream improvements that do not conflict will be tracked over time

## License

Display and Markdown portions come from DeepSeek Harness (MIT). Motion references [Transitions.dev](https://transitions.dev/). This repository's code is [MIT](LICENSE).
