# dsh-tidy-display (legacy 0.1.1 line)

[中文](./README.md)

**Tidy Display · message-rail subset** for DeepSeek Harness (DSH) **0.1.0-rc.7 ~ 0.1.2-alpha.1**. Brings the canvas navigation rail to legacy hosts: long sessions become scannable, jumpable, and fully loadable.

> This is a compat branch of [@drscrewdriver/dsh-tidy-display](https://github.com/drscrewdriver/dsh-tidy-display) (the 0.1.7 line) carrying **the message-rail capabilities only**. On 0.1.7-rc.1+ install the main line; on 0.1.2-alpha.2~0.1.4.x use the [`compat/0.1.2`](https://github.com/drscrewdriver/dsh-tidy-display/tree/compat/0.1.2) line (tag `v0.1.0-dsh0.1.2`); on 0.1.5-alpha.1~0.1.6 use `compat/0.1.5` (tag `v0.1.0-dsh0.1.5`).
> The rail is ported from [dsh-tidychat](https://github.com/BananaSoldier01/dsh-tidychat) (canvas rail, fish-eye hover, color chain, smart loading are its work; the white sheen and the slider palette are compat-line enhancements here). Thanks to its author.

## Features

- Canvas navigation rail at the conversation edge: fish-eye hover with summaries, click to jump, current-turn highlight
- Style **lines / dots**, position **left / right edge (mirrored)**
- **White sheen ring** beneath current/hover marks, keeping them readable over busy wallpapers
- **Palette**: mark color / accent color, each "auto (theme-aware with contrast correction) / custom (color picker + HEX/RGB text + alpha slider)"
- **Smart history loading**: auto-clicks the host "load earlier" button under a time budget, pausing automatically under performance pressure
- Works on the native chat view only; the 0.1.7 reading face is **not** part of this branch (it is bound to 0.1.7 host slot contracts and cannot be carried back)

## Install

### DSH Studio desktop app

Open **Settings → Plugins → Add plugin** and enter:

```text
github:drscrewdriver/dsh-tidy-display#v0.1.0-dsh0.1.1
```

### Web CLI

```sh
dsh plugin --profile web add github:drscrewdriver/dsh-tidy-display#v0.1.0-dsh0.1.1
```

After the npm publish a dist-tag works too: `dsh plugin --profile web add @drscrewdriver/dsh-tidy-display` (the `dsh-0.1.1` tag). Reopen the Host once and hard-refresh the page after installing (bundles are read at boot).

## Settings

**Settings → Plugins → 整洁显示** (the plugins config card (`settings.plugin.item`)): rail on/off, position, style, sheen, mark color, accent color, smart loading (no takeover switch: this host range has no official rail). Values go to the `tidy-display` namespace and apply immediately.

## Compatibility notes

- Targets **0.1.0-rc.7 ~ 0.1.2-alpha.1**
- 0.1.0-rc.6 and earlier are out of scope (use dsh-tidychat 0.1.0)
- Display only; Agent execution, the SDK, and credentials are untouched. Node.js `^22.19.0 || >=24`

## Development

```sh
pnpm install
npm run typecheck
npm run lint
npm test
npm run build      # lib/ artifacts are committed
```

Gates: typecheck + eslint + test (rail subset) + build, all green before tagging.

## License

This repository is [MIT](LICENSE). The rail algorithms and looks come from dsh-tidychat (MIT); thanks to its author.
