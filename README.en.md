# dsh-tidy-display

[简体中文](README.md) | [English](README.en.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Italiano](README.it.md) | [Русский](README.ru.md) | [Español](README.es.md)

**Tidy Display** — a community plugin for DeepSeek Harness (DSH) **0.1.7** that merges the reading view and the message rail into one plugin: long sessions become scannable, navigable, and resumable.

> This project merges two popular DSH plugins:
> [dsh-better-display](https://github.com/aa2246740/dsh-better-display) (reading view, maintained via a fork) ×
> [dsh-tidychat](https://github.com/BananaSoldier01/dsh-tidychat) (message rail / smart history loading).
> The merge removes the DOM-contract conflict between them; credit and thanks to both.

## Provenance & credits (stated as-is)

**The live reading view** comes from [dsh-better-display](https://github.com/aa2246740/dsh-better-display): upstream aa2246740's streaming render, process folding choreography, and official bridging, enhanced by the drscrewdriver fork. This project did not rewrite its rendering or motion pipeline.

**The message rail** comes from [dsh-tidychat](https://github.com/BananaSoldier01/dsh-tidychat): the canvas rail, fish-eye hover, color chain, and smart history loading are ports, enhanced by the drscrewdriver compat line (white sheen, steering parity, DOM single source of truth).

### Original better-display shortcomings, fixed by this project / the fork

1. **No plate behind messages or thinking** — final answers and reasoning text sit directly on the page background; readability suffers under skins, wallpapers, and dark themes. → The fork added the official `--dsw-alias-bg-layer-1` translucent bubble plate for answers and the same plate for the reasoning card (commits `fa3a795`, `94d59c7`).
2. **The reading view drops the host per-row anchors** — `data-chat-anchor-key` / `data-chat-flow-kind` are not emitted on message rows, so third-party plugins that rely on them as their DOM source of truth (e.g. the tidychat rail) resolve zero rows and **fail silently** under the reader. → Fix submitted upstream as [aa2246740/dsh-better-display#41](https://github.com/aa2246740/dsh-better-display/pull/41); the merged project carries the same fix.
3. Its TimelineRail is a single official-outline rail — no fish-eye summaries, no click-to-jump, no colors.

### Original dsh-tidychat shortcomings, and why the merge happened

1. Fold / divider are DOM surgery overlapping the host's native folding (0.1.2+), forcing a manual either/or.
2. v0.2.10 and earlier misread the snapshot on DSH 0.1.2 hosts — the rail resolved zero turns and **never actually rendered** (fixed in v0.3.0; see its repo's `docs/RAIL-ROOT-CAUSE-ANALYSIS.md`).
3. It conflicted with the better-display reading view **in both directions**: tidychat's surgery could not reach the reader's rows, and the reader's dropped anchors in turn crippled the rail — the direct motivation for this merge.

Thanks to both upstreams and their authors (aa2246740, BananaSoldier01) — this project stands on their shoulders. Upstream improvements that do not conflict will be tracked over time.

## Host compatibility

| DSH host | Reading view | Message rail | Settings |
|---|---|---|---|
| 0.2.0-rc.1+ (this line, `compat/0.2.0`) | ✅ | ✅ (both views) | 起子插件设置 → 整洁显示 |
| 0.1.7-rc.1+ (main line) | ✅ | ✅ (both views) | 起子插件设置 → 整洁显示 |
| 0.1.5-alpha.1 ~ 0.1.6 (incl. 0.1.5) | ❌ | ✅ (`compat/0.1.5` line, tag `v0.1.0-dsh0.1.5`) | plugin config card |
| 0.1.2-alpha.2 ~ 0.1.4.x | ❌ | ✅ (`compat/0.1.2` line, tag `v0.1.0-dsh0.1.2`) | plugin config card |
| 0.1.0-rc.7 ~ 0.1.2-alpha.1 (incl. 0.1.1) | ❌ | ✅ (`compat/0.1.1` line, tag `v0.1.0-dsh0.1.1`) | plugin config card |

- The reading view is bound to the host slot contract, pinned per line (this line pins 0.2.0-rc.2; main pins 0.1.7-rc.2 — the host had breaking changes across 0.1.7-rc.1 → rc.2 → 0.2.0); it will not be backported.
- The legacy backport of the rail subset (rail + sheen + colors + smart loading) **has shipped**: it lives on three compat branches, install one-liner e.g. `dsh plugin --profile web add github:drscrewdriver/dsh-tidy-display#v0.1.0-dsh0.1.5`; npm dist-tags `dsh-0.1.5` / `dsh-0.1.2` / `dsh-0.1.1` follow the publish. The 0.1.5-line official-rail takeover is to-be-verified; 0.1.3/0.1.4 ride the `compat/0.1.2` line untested.
- The 0.2.0 line (this branch): install via `dsh plugin --profile web add github:drscrewdriver/dsh-tidy-display#v0.2.0-dsh0.2.0`; after the npm publish the dist-tag works: `dsh plugin --profile web add dsh-tidy-display@dsh-0.2.0`.
- 0.1.0-rc.6 and earlier are out of scope (use dsh-tidychat 0.1.0).
- Matrix as of 2026-09-30 (tidy-display v0.2.0 / better-display 0.3.3-fork.5 / tidychat 0.3.4 line).

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

> ⚠️ **Mutually exclusive with `dsh-better-display` and `@bananasoldier01/dsh-tidychat`**: all three register a `reader` view (same id, same priority) in the `conversation.view` list slot. Running them together fails activation on a duplicate registration (client reports `entry did not activate` and the page sticks on the plugin-load failure screen). Uninstall or disable them before enabling this plugin.

### DSH Studio desktop app (recommended)

Open **Settings → Plugins → Add plugin** and enter the package name:

```text
dsh-tidy-display
```

### Web CLI

Published on npm — install by the bare name:

```sh
dsh plugin --profile web add dsh-tidy-display
```

The GitHub address works too (pre-0.1.7 compat lines install by tag, see the matrix above):

```sh
dsh plugin --profile web add github:drscrewdriver/dsh-tidy-display
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

Targets DeepSeek Harness **0.2.0-rc.1+** (peer `>=0.2.0-rc.1 <0.2.1-0`). Display only — it does not change Agent execution, the SDK, or credentials. Node.js `^22.19.0 || >=24`. New sessions default to reading.

## Relationship to the originals

See "[Provenance & credits](#provenance--credits-stated-as-is)" at the top — upstream improvements that do not conflict will be tracked over time.

## License

Display and Markdown portions come from DeepSeek Harness (MIT). Motion references [Transitions.dev](https://transitions.dev/). This repository's code is [MIT](LICENSE).
