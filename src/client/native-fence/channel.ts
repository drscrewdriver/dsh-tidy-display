/**
 * Native conversation-view fence channel — DOM takeover of ```dsh-ui fences
 * rendered by the HOST's own markdown pipeline in the native 对话 view.
 *
 * The Reader renders dsh-ui fences through its own mdast pipeline
 * (markdown/render.tsx → DshUiCard). The native view is the host's closed
 * renderer — no official code-block hook exists — so this channel ports the
 * ecosystem-proven takeover (MIT; credited in THIRD_PARTY_NOTICES.md) from
 * `@changfenhuang/dsh-genui` `src/client/dom-fence.tsx`, slimmed to dsh-ui:
 *
 * - MutationObserver on body + 1s backstop sweep + row-rotation net;
 * - discovery: stable `.md-code-block` surfaces plus a structural
 *   `label+pre` backstop, and — for unlabeled blocks (the host hides unknown
 *   languages and localizes the banner) — content recognition through the
 *   embed guard at settle;
 * - "mount FIRST, hide AFTER": the stock block is hidden only once a mounted
 *   replacement stands next to it; every failure path restores the original
 *   code block (issue #19 guard);
 * - pre-paint surgery repair re-attaches containers and re-hides blocks the
 *   host's React re-render dislodged, and re-appends content wiped from our
 *   container;
 * - streaming: a spec-shaped body swaps to the same streaming placeholder
 *   card the Reader shows — one render path, one chrome. Settle re-evaluates
 *   and RESTORES the stock block when an unlabeled body turns out not to be
 *   a spec; labeled bodies that fail the parse land in DshUiCard's visible
 *   校验失败 fold (source preserved — never a bare JSON dump);
 * - identity `dom:<anchor-key>:<ordinal>` (genui's scheme) keys interaction
 *   state through DshUiCard's stateKey with the `native:` prefix;
 * - coexistence: blocks already taken by genui's own channel and the
 *   Reader's subtrees are skipped; the `segmentCards` pref gates the whole
 *   channel (flip → full teardown with stock blocks restored).
 *
 * Security posture: only this plugin's browser bundle mounts React roots,
 * the model can only author fence text, and unrenderable bodies keep their
 * host form (labeled ones inside the fold's source view).
 */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { processGenuiSpec } from '@changfenhuang/dsh-genui/embed'
import { DshUiCard } from '../segments/DshUiCard.js'
import { fenceIdentity, labelVerdict, looksLikeGenuiInProgress } from './discover.js'

/** Marker attribute set on blocks this channel has taken over (own namespace —
 * never touch genui's marker, and vice versa). */
const PROCESSED = 'data-tidy-fence-rendered'
/** Container class for the plugin-owned root (styled by genui-plate). */
const CONTAINER_CLASS = 'tidy-dom-fence'
/** Stable host code-block surfaces (genui's selector set — proven on this host). */
const CODE_BLOCK_SELECTORS = '.md-code-block, .code-block, .code-block-small'
/** Subtrees a takeover never reaches: our own mounts, genui's mounts, the
 * Reader (its mdast pipeline owns fences there), the dock, reasoning and tool
 * rows, and plugin panels. */
const SURFACE_EXCLUDES = [
  `.${CONTAINER_CLASS}`,
  '.genui-dom-fence',
  '.genui-dom-fence-diagnostic',
  '[data-genui-rendered]',
  '[data-reader-answer]',
  '[data-reader-turn]',
  '[data-tidy-render-dock-root]',
  '[data-chat-group-part="reasoning"]',
  '[data-tool]',
  '[data-plugin-panel]',
  '[data-panel-conversation]',
].join(', ')
/** Mutation scopes that cannot contain a fence — skipped before any scan. */
const IGNORED_MUTATION_SCOPE = `${SURFACE_EXCLUDES}, [data-composer-seat], [data-composer-input]`
/** Host attributes discovery/settledness depends on. */
const FENCE_ATTRIBUTES = [
  'data-streaming', 'class', 'data-code-block-content', 'data-code-block-banner',
  'data-chat-anchor-key', 'data-chat-flow-key', 'data-chat-flow-kind', 'data-chat-node-key',
  'data-chat-group-part',
]
/** Slow sweep interval — the observer catches everything, this is the 1s
 * belt-and-braces pass (history loads, missed attribute batches). */
const SWEEP_MS = 1000
/** Cooperative per-sweep budget (ms). Work yields between candidates, not
 * inside a subtree scan; deferred scans run to completion later. */
const SWEEP_BUDGET_MS = 8
/** Rows re-checked per rotation pass, and how many slow ticks apart those
 * passes run — covers host re-classings the observer's filter can miss. */
const ROTATION_ROWS = 24
const ROTATION_TICKS = 5
/** Upper bound on nodes awaiting discovery (a re-render storm is picked up
 * by rotation instead of starving the frame). */
const DIRTY_TARGET_LIMIT = 512
/** Contexts a fence can appear in: a code body, a surface class, or a
 * surface's content holder. Prose and layout changes fail this gate. */
const CODE_CONTEXT = `pre, ${CODE_BLOCK_SELECTORS}, [data-code-block-content]`
/** Max ancestors walked from a `<pre>` to its fence surface root. */
const SURFACE_HOPS = 4
/** Block-level content that never belongs to a code-block surface — a real
 * fence surface is "banner chrome + ONE code body"; a message-level container
 * carrying a dsh-ui label must NOT be taken over (hiding it hides the whole
 * answer — genui issue #19). */
const BLOCK_CONTENT_SELECTOR = 'p, ul, ol, dl, table, h1, h2, h3, h4, h5, h6, blockquote, hr, img, figure'
/** The streaming marker on the host's assistant markdown root (absent = settled). */
const STREAMING = '[data-streaming]'
/** Stable per-message row anchors, with the fallback chain for render paths
 * that omit the React key. */
const FLOW_ROW = '[data-chat-flow-key], [data-chat-flow-kind]'

interface Mount {
  root: Root
  container: HTMLElement
  block: HTMLElement
  lastRaw: string
  lastSettled: boolean
}

export interface NativeFenceChannel {
  setEnabled(on: boolean): void
  dispose(): void
}

/** 已知真实代码块内容语义标记或类名的最近包装节点(单次扫描内缓存祖先判定)。 */
function closestCodeBlockSurface(element: Element | null, owners?: WeakMap<Element, Element | null>): Element | null {
  const visited: Element[] = []
  let owner: Element | null = null
  for (let current = element; current !== null; current = current.parentElement) {
    if (owners?.has(current)) {
      owner = owners.get(current) ?? null
      break
    }
    visited.push(current)
    if (current.matches(CODE_BLOCK_SELECTORS)
      || [...current.children].some(child => child.hasAttribute('data-code-block-content'))) {
      owner = current
      break
    }
  }
  for (const current of visited) owners?.set(current, owner)
  return owner
}

/** Does this element look like a single code-block surface rather than a
 * message container? The only allowed non-code content is banner chrome. */
function isPlausibleFenceSurface(candidate: Element): boolean {
  const pres = candidate.querySelectorAll('pre')
  if (pres.length > 1) return false
  const pre = pres[0] ?? null
  for (const el of candidate.querySelectorAll(BLOCK_CONTENT_SELECTOR)) {
    if (pre !== null && pre.contains(el)) continue
    return false
  }
  return true
}

/** The banner's language: 'dsh-ui' when a leaf element outside the code body
 * labels the block exactly `dsh-ui` (the only structural invariants across
 * hosts are "a leaf holds exactly the lang text" and "it lives outside the
 * code body" — a fence whose CODE contains the text `dsh-ui` must not
 * self-identify through its body, and a container of several blocks must not
 * identify through a nested block's label — genui issues #13/#258). */
function infostringOf(block: Element): boolean {
  const pre = block.querySelector('pre')
  for (const el of block.querySelectorAll('*')) {
    if (el.childElementCount !== 0) continue
    const verdict = labelVerdict(el.textContent?.trim() ?? '')
    if (verdict !== 'dsh-ui') continue
    if (pre !== null && pre.contains(el)) continue
    const owner = closestCodeBlockSurface(el)
    if (owner !== null && owner !== block) continue
    return true
  }
  return false
}

/** 读取宿主代码块中的围栏正文(pre 内全部文本)。 */
function rawOf(block: Element): string {
  const pre = block.querySelector('pre')
  if (pre === null) return ''
  let text = ''
  for (const node of pre.childNodes) {
    text += node.textContent ?? ''
  }
  return text
}

/** Settled gate: no streaming marker on any ancestor. */
function isSettled(block: Element): boolean {
  return block.closest(STREAMING) === null
}

/** Walk up from a `<pre>` to its fence surface root — the ancestor within
 * `SURFACE_HOPS` that carries the dsh-ui banner AND the pre. */
function surfaceOf(pre: HTMLElement, scope: ParentNode = document): HTMLElement | null {
  let el: HTMLElement | null = pre.parentElement
  for (let hops = 0; el !== null && el !== scope && hops < SURFACE_HOPS; hops += 1, el = el.parentElement) {
    if (!infostringOf(el)) continue
    if (!isPlausibleFenceSurface(el)) return null
    return el
  }
  return null
}

/** The gate every surface candidate passes, whichever path found it. */
function surfaceRejection(candidate: Element, owners?: WeakMap<Element, Element | null>): 'nested' | 'plugin-owned' | 'implausible' | null {
  if (closestCodeBlockSurface(candidate.parentElement, owners) !== null) return 'nested'
  if (candidate.closest(SURFACE_EXCLUDES) !== null) return 'plugin-owned'
  if (!isPlausibleFenceSurface(candidate)) return 'implausible'
  return null
}

/** Known real code-block surfaces under `scope`, in DOM order. */
function codeBlockSurfaces(scope: ParentNode): HTMLElement[] {
  const surfaces = new Set(scope.querySelectorAll<HTMLElement>(CODE_BLOCK_SELECTORS))
  for (const content of scope.querySelectorAll<HTMLElement>('[data-code-block-content]')) {
    if (content.parentElement !== null) surfaces.add(content.parentElement)
  }
  return [...surfaces].sort((left, right) => left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
}

/**
 * Every dsh-ui fence surface under `scope`, in DOM order — selector pass
 * first (cheap, ordered), then the structural sweep: every `<pre>` whose
 * ancestor labels itself `dsh-ui`. The label + `<pre>` + plausibility gates
 * make the structural pass false-positive-free.
 */
function findFenceCandidates(scope: ParentNode, includeScope = false): HTMLElement[] {
  const self = includeScope && scope instanceof Element ? scope : null
  const surfaceOwners = new WeakMap<Element, Element | null>()
  const seen = new Set<HTMLElement>()
  const out: HTMLElement[] = []
  const surfaces = codeBlockSurfaces(scope)
  if (self !== null && (self.matches(CODE_BLOCK_SELECTORS)
    || [...self.children].some(child => child.hasAttribute('data-code-block-content')))) {
    surfaces.unshift(self as HTMLElement)
  }
  for (const el of surfaces) {
    if (seen.has(el)) continue
    if (surfaceRejection(el, surfaceOwners) !== null) continue
    out.push(el)
    seen.add(el)
  }
  const pres = [...scope.querySelectorAll<HTMLElement>('pre')]
  if (self !== null && self.tagName === 'PRE') pres.unshift(self as HTMLElement)
  const surfaceScope: ParentNode = self === null ? scope : self.parentElement ?? self
  for (const pre of pres) {
    // `<pre>` bodies inside a known surface were handled by the selector
    // pass; walking up from them again would climb past their own surface
    // into a shared container and mislabel it (genui issue #13).
    if (closestCodeBlockSurface(pre, surfaceOwners) !== null
      || pre.closest(SURFACE_EXCLUDES) !== null) continue
    const surface = surfaceOf(pre, surfaceScope)
    if (surface === null || seen.has(surface)) continue
    out.push(surface)
    seen.add(surface)
  }
  return out.sort((left, right) => left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
}

/** The owning conversation row (stable per-message identity, fallback chain
 * for render paths that omit the row anchor). */
function rowOf(block: Element): Element {
  return block.closest('[data-chat-anchor-key]') ?? block.closest(FLOW_ROW) ?? block
}

/**
 * Strict content recognition for an UNLABELED settled block: only a body that
 * parses AND survives the embed guard without any repair/normalization is
 * adopted — an ordinary ```json block that merely looks spec-shaped must stay
 * a code block (genui's canonical-equality strictness).
 */
function contentRecognized(raw: string): boolean {
  try {
    let value: unknown = JSON.parse(raw)
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value)
      } catch {
        return false
      }
    }
    if (value === null || typeof value !== 'object') return false
    const record = value as Record<string, unknown>
    let candidate: Record<string, unknown>
    if (Array.isArray(value)) {
      if (value.length === 0) return false
      candidate = { items: value }
    } else if (record.items !== undefined) {
      candidate = record
    } else if (typeof record.type === 'string' && record.type !== '') {
      candidate = { items: [value] }
    } else {
      return false
    }
    const { spec } = processGenuiSpec(candidate)
    if (!spec) return false
    return JSON.stringify(spec) === JSON.stringify(candidate)
  } catch {
    return false
  }
}

/** Install the channel. Returns a controller; `setEnabled` starts/stops the
 * observer without losing the pref subscription, `dispose` tears everything
 * down and restores every stock block. */
export function installNativeFenceChannel(options: {
  /** Reactive gate — checked at every sweep entry and on toggle. */
  getEnabled: () => boolean
}): NativeFenceChannel {
  const { getEnabled } = options

  const mounts = new Map<HTMLElement, Mount>()
  const containerBlocks = new Map<HTMLElement, HTMLElement>()
  const dirtyTargets = new Map<Node, boolean>()
  const pendingCandidates = new Set<Element>()
  const queuedCandidates = new Set<Element>()
  const deferredScans = new WeakSet<Node>()
  /** Mounts the observer marked for pre-paint surgery this batch. */
  const repairBlocks = new Set<HTMLElement>()
  const warned = new WeakSet<Element>()
  let rotationNext = 0
  let disposed = false
  let running = false
  let observer: MutationObserver | null = null
  let interval: number | null = null
  let rafId: number | null = null
  let slowTicks = 0

  function warnOnce(block: Element, message: string): void {
    if (warned.has(block)) return
    warned.add(block)
    console.warn(`[dsh-tidy-display] ${message}`)
  }

  /** Takeover decision for one candidate. */
  function decide(block: Element, raw: string, settled: boolean): 'card' | 'streaming' | 'skip' {
    if (raw.trim() === '') return 'skip'
    if (infostringOf(block)) return settled ? 'card' : 'streaming'
    // Unlabeled (host hid the language or localized the banner): content
    // decides — spec shape during streaming, strict recognition at settle.
    if (!settled) return looksLikeGenuiInProgress(raw) ? 'streaming' : 'skip'
    return contentRecognized(raw) ? 'card' : 'skip'
  }

  /** Stable one-based ordinal among settled dsh-ui fences in this row. */
  function ordinalInRow(row: Element, block: Element): number {
    let index = 0
    for (const candidate of findFenceCandidates(row)) {
      if (!isSettled(candidate)) continue
      if (!infostringOf(candidate) && !contentRecognized(rawOf(candidate))) continue
      index += 1
      if (candidate === block) return index
    }
    return index + 1
  }

  function identityOf(block: Element): string {
    const row = rowOf(block)
    const anchorKey = row.getAttribute('data-chat-anchor-key') ?? 'unknown'
    return fenceIdentity(anchorKey, ordinalInRow(row, block))
  }

  function unmountBlock(block: HTMLElement): void {
    const mount = mounts.get(block)
    if (mount === undefined) return
    mounts.delete(block)
    containerBlocks.delete(mount.container)
    try {
      mount.root.unmount()
    } catch {
      // The host's re-render already invalidated the tree; removing the
      // container below is the recovery.
    }
    mount.container.remove()
    block.style.display = ''
    block.removeAttribute(PROCESSED)
  }

  /** Render (or refresh) one takeover. `mount` present = re-render in place. */
  function renderMount(block: HTMLElement, mount: Mount, raw: string, settled: boolean): void {
    const node = createElement(DshUiCard, {
      raw,
      streaming: !settled,
      segKey: identityOf(block),
      channel: 'native',
    })
    mount.root.render(node)
    mount.lastRaw = raw
    mount.lastSettled = settled
  }

  /** Fresh container + fresh root for a mount whose container the host wiped
   * (the old root's fiber bookkeeping points at removed nodes). */
  function rebuildMount(block: HTMLElement, mount: Mount, raw: string, settled: boolean): void {
    try {
      mount.root.unmount()
    } catch {
      // The host's wipe already invalidated the tree; the fresh root below is
      // the recovery, not the old one.
    }
    const fresh = document.createElement('div')
    fresh.className = CONTAINER_CLASS
    containerBlocks.delete(mount.container)
    mount.container.remove()
    block.after(fresh)
    try {
      const freshRoot = createRoot(fresh)
      mount.root = freshRoot
      mount.container = fresh
      containerBlocks.set(fresh, block)
      renderMount(block, mount, raw, settled)
    } catch (error) {
      fresh.remove()
      block.style.display = ''
      block.removeAttribute(PROCESSED)
      mounts.delete(block)
      warnOnce(block, `failed to rebuild a wiped fence mount (${error instanceof Error ? error.message : String(error)}); restoring the stock code block`)
    }
  }

  function mountBlock(block: HTMLElement): void {
    if (block.hasAttribute(PROCESSED)) return
    const settled = isSettled(block)
    const raw = rawOf(block)
    const decision = decide(block, raw, settled)
    if (decision === 'skip') return
    // Mount FIRST, hide AFTER (issue #19): the stock block is only ever
    // hidden once a successfully mounted replacement stands next to it.
    const container = document.createElement('div')
    container.className = CONTAINER_CLASS
    block.after(container)
    let root: Root
    try {
      root = createRoot(container)
    } catch (error) {
      container.remove()
      warnOnce(block, `failed to create a React root for a dsh-ui fence (${error instanceof Error ? error.message : String(error)}); keeping the stock code block visible`)
      return
    }
    const mount: Mount = { root, container, block, lastRaw: raw, lastSettled: settled }
    try {
      renderMount(block, mount, raw, settled)
    } catch (error) {
      try {
        root.unmount()
      } catch {
        // Best-effort cleanup; removing the container below restores the DOM.
      }
      container.remove()
      warnOnce(block, `failed to mount a dsh-ui fence (${error instanceof Error ? error.message : String(error)}); keeping the stock code block visible`)
      return
    }
    block.style.display = 'none'
    block.setAttribute(PROCESSED, '')
    mounts.set(block, mount)
    containerBlocks.set(container, block)
  }

  /** Pre-paint repair: the host's React re-renders can wipe our foreign
   * container or reset the hide. Re-apply the surgery in the observer
   * microtask (before paint) so raw JSON never flashes between chunks. */
  function repairSurgery(blocks: Iterable<HTMLElement>): void {
    for (const block of blocks) {
      const mount = mounts.get(block)
      if (mount === undefined) continue
      // The host replaced the row: drop the mount NOW (removes the orphan
      // container); the new block is re-discovered by discovery.
      if (!block.isConnected) {
        unmountBlock(block)
        continue
      }
      // Re-attach the container BEFORE re-hiding (never hide the original
      // while no mounted replacement stands next to it).
      if (mount.container.parentElement !== block.parentElement
        || mount.container.previousElementSibling !== block) {
        block.after(mount.container)
      }
      if (!mount.container.isConnected) {
        // Insertion failed (pathological host re-parent): surrender the
        // takeover rather than leave the block hidden with no replacement.
        block.style.display = ''
        block.removeAttribute(PROCESSED)
        mounts.delete(block)
        containerBlocks.delete(mount.container)
        try {
          mount.root.unmount()
        } catch {
          // Best-effort; the detached container gets removed below.
        }
        mount.container.remove()
        warnOnce(block, 'dsh-ui replacement container could not be re-attached after a host re-render; restoring the stock code block')
        continue
      }
      if (block.style.display !== 'none') block.style.display = 'none'
      if (!block.hasAttribute(PROCESSED)) block.setAttribute(PROCESSED, '')
    }
  }

  /** Sweep: mount maintenance (growth / settle transition / wipes), surgery
   * repair, then discovery + takeover of queued candidates. */
  function sweep(full = false): void {
    if (disposed || !running || !getEnabled()) return
    // 1. Maintenance of known mounts.
    for (const block of Array.from(mounts.keys())) {
      const mount = mounts.get(block)
      if (mount === undefined) continue
      if (!block.isConnected) {
        unmountBlock(block)
        continue
      }
      const raw = rawOf(block)
      const settled = isSettled(block)
      const contentWiped = mount.container.childElementCount === 0
      if (raw === mount.lastRaw && settled === mount.lastSettled && !contentWiped) continue
      // Re-decide with the current body: settle can promote a streaming
      // placeholder to a card, or RESTORE an unlabeled block that turned out
      // not to be a spec (never an error fold for content we guessed at).
      const decision = decide(block, raw, settled)
      if (decision === 'skip') {
        unmountBlock(block)
        continue
      }
      if (contentWiped) {
        rebuildMount(block, mount, raw, settled)
        continue
      }
      try {
        renderMount(block, mount, raw, settled)
      } catch (error) {
        unmountBlock(block)
        warnOnce(block, `failed to re-render a dsh-ui fence (${error instanceof Error ? error.message : String(error)}); restoring the stock code block`)
      }
    }
    // 2. Pre-paint surgery for mounts the host dislodged this frame.
    repairSurgery(Array.from(mounts.keys()))
    // 3. Discovery + takeover, inside the sweep budget.
    const deadline = performance.now() + SWEEP_BUDGET_MS
    if (full) enqueueScopeScan(document.body)
    resolveDirtyTargets(deadline)
    drainCandidates(deadline)
    keepDraining()
  }

  function enqueueCandidate(block: Element | null | undefined): void {
    if (block === null || block === undefined) return
    if (block.hasAttribute(PROCESSED) || queuedCandidates.has(block)) return
    queuedCandidates.add(block)
    pendingCandidates.add(block)
  }

  /** Turn one changed node into fence candidates, scoped to the change. */
  function enqueueMutationTarget(target: Node, structural: boolean, deadline: number): void {
    const element = target instanceof Element ? target : target.parentElement
    if (element === null) return
    if (element.closest(SURFACE_EXCLUDES) !== null) return
    const context = element.closest(CODE_CONTEXT)
    if (context !== null) {
      // The outermost surface the node sits in — the same candidate a full
      // scan would pick — plus the structural backstop for unknown classes.
      let surface = closestCodeBlockSurface(context) as HTMLElement | null
      while (surface !== null) {
        const parent = closestCodeBlockSurface(surface.parentElement)
        if (parent === null) break
        surface = parent as HTMLElement | null
      }
      if (surface !== null && surfaceRejection(surface) === null) enqueueCandidate(surface)
      const pre = element.closest<HTMLElement>('pre')
      if (pre !== null) {
        const labeled = surfaceOf(pre)
        if (labeled !== null && surfaceRejection(labeled) === null) enqueueCandidate(labeled)
      }
    }
    if (!structural) return
    // A changed node can carry a fence it is not inside yet: a row or wrapper
    // that arrived whole (history load, session switch).
    if (performance.now() >= deadline) {
      deferredScans.add(target)
      dirtyTargets.set(target, structural)
      return
    }
    const candidates = findFenceCandidates(element, true)
    // Newest first: a transcript-sized target queues the whole conversation
    // at once, and the tail in view has to mount before the scrollback.
    for (let index = candidates.length - 1; index >= 0; index -= 1) enqueueCandidate(candidates[index])
  }

  function resolveDirtyTargets(deadline: number): void {
    for (const [target, structural] of dirtyTargets) {
      if (performance.now() >= deadline) return
      dirtyTargets.delete(target)
      if (!target.isConnected) continue
      const force = deferredScans.delete(target)
      enqueueMutationTarget(target, structural, force ? Number.POSITIVE_INFINITY : deadline)
    }
  }

  function drainCandidates(deadline: number): void {
    for (const block of pendingCandidates) {
      if (performance.now() >= deadline) return
      pendingCandidates.delete(block)
      queuedCandidates.delete(block)
      if (!block.isConnected) continue
      // Discovery is not a lease: reapply the same local gates immediately
      // before first takeover.
      if (!(block instanceof HTMLElement)) continue
      if (surfaceRejection(block) !== null) continue
      mountBlock(block)
    }
  }

  function keepDraining(): void {
    if (pendingCandidates.size > 0 || dirtyTargets.size > 0) schedule()
  }

  /** Record a changed node. Cheap by design: discovery belongs to the sweep. */
  function markDirty(node: Node, structural: boolean): void {
    if (disposed) return
    const element = node instanceof Element ? node : node.parentElement
    if (element === null) return
    if (element.closest(IGNORED_MUTATION_SCOPE) !== null) return
    const known = dirtyTargets.get(node)
    if (known === undefined) {
      if (dirtyTargets.size >= DIRTY_TARGET_LIMIT) return
      dirtyTargets.set(node, structural)
      return
    }
    if (structural && !known) dirtyTargets.set(node, true)
  }

  /** Belt-and-braces pass for changes the observer cannot see, in slices. */
  function rotationSweep(deadline: number): void {
    const rows = document.querySelectorAll<HTMLElement>(FLOW_ROW)
    const total = rows.length
    if (total === 0) return
    const step = Math.min(ROTATION_ROWS, total)
    let visited = 0
    for (let offset = 0; offset < step; offset += 1) {
      if (performance.now() >= deadline) break
      // Walk backwards from the transcript tail: the newest row is the one in
      // view while a fence is being written.
      const row = rows[total - 1 - ((rotationNext + offset) % total)]
      if (row === undefined) continue
      for (const candidate of findFenceCandidates(row)) enqueueCandidate(candidate)
      visited = offset + 1
    }
    rotationNext = (rotationNext + visited) % total
  }

  /** Mark existing roots owning a changed node, without scanning unrelated
   * blocks (walking parents also covers unknown-class surfaces). */
  function markOwnedAncestors(node: Node | null): void {
    for (let current = node; current !== null; current = current.parentNode) {
      if (!(current instanceof HTMLElement)) continue
      const block = containerBlocks.get(current) ?? current
      if (mounts.has(block)) repairBlocks.add(block)
    }
  }

  const schedule = (): void => {
    if (disposed || !running || rafId !== null) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      sweep()
    })
  }

  /** Full-scope candidate scan (slow-tick backstop; the observer handles the
   * incremental cases). Newest last — drain is FIFO per sweep budget and the
   * initial scan enqueues in reverse to mount the in-view tail first. */
  function enqueueScopeScan(scope: Node): void {
    if (!(scope instanceof Element)) return
    if (scope.closest(IGNORED_MUTATION_SCOPE) !== null) return
    const candidates = findFenceCandidates(scope, true)
    for (let index = candidates.length - 1; index >= 0; index -= 1) enqueueCandidate(candidates[index])
  }

  function start(): void {
    if (disposed || running) return
    running = true
    observer = new MutationObserver(records => {
      // A container the host emptied is repair work wherever it sits, and the
      // removal is the only record that carries it: re-append our own nodes
      // first so raw JSON never flashes before paint.
      for (const record of [...records].reverse()) {
        if (record.removedNodes.length === 0 || record.target.childNodes.length > 0) continue
        const owner = containerBlocks.get(record.target as HTMLElement)
        const mount = owner === undefined ? undefined : mounts.get(owner)
        if (mount !== undefined && mount.container === record.target) {
          mount.container.append(...record.removedNodes)
        }
      }
      for (const record of records) {
        const element = record.target instanceof Element ? record.target : record.target.parentElement
        if (element !== null && element.closest(IGNORED_MUTATION_SCOPE) !== null) continue
        if (record.type === 'attributes' && record.attributeName !== 'class') {
          // Membership-changing host metadata applies to the whole subtree.
          markDirty(record.target, true)
          continue
        }
        markOwnedAncestors(record.target)
        if (record.type === 'characterData') {
          markDirty(record.target, false)
          continue
        }
        if (record.type === 'childList') {
          if (element !== null && (element.tagName === 'SPAN' || element.closest(CODE_CONTEXT) !== null)) {
            markDirty(record.target, false)
          }
          markOwnedAncestors(record.previousSibling)
          markOwnedAncestors(record.nextSibling)
          for (const node of record.addedNodes) markDirty(node, true)
          continue
        }
        markDirty(record.target, true)
      }
      // Pre-paint surgery stays synchronous, but only for affected roots.
      if (repairBlocks.size > 0) {
        repairSurgery(Array.from(repairBlocks))
        repairBlocks.clear()
      }
      schedule()
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: FENCE_ATTRIBUTES,
      // React streams tokens as text-node updates: without characterData the
      // observer would only fire on structural changes and miss body growth.
      characterData: true,
    })
    interval = window.setInterval(() => {
      if (disposed || !running) return
      sweep(true)
      slowTicks += 1
      if (slowTicks % ROTATION_TICKS === 0) rotationSweep(performance.now() + SWEEP_BUDGET_MS)
      keepDraining()
    }, SWEEP_MS)
    // Initial scan: the transcript is already on screen and no mutation will
    // fire for it. Newest first, so what is in view mounts first.
    const initial = findFenceCandidates(document.body)
    for (let index = initial.length - 1; index >= 0; index -= 1) enqueueCandidate(initial[index])
    sweep()
  }

  function stop(): void {
    if (!running) return
    running = false
    observer?.disconnect()
    observer = null
    if (interval !== null) {
      window.clearInterval(interval)
      interval = null
    }
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    dirtyTargets.clear()
    pendingCandidates.clear()
    queuedCandidates.clear()
    repairBlocks.clear()
    for (const block of Array.from(mounts.keys())) unmountBlock(block)
    containerBlocks.clear()
  }

  return {
    setEnabled(on: boolean): void {
      if (disposed) return
      if (on && !running) start()
      else if (!on && running) stop()
    },
    dispose(): void {
      if (disposed) return
      disposed = true
      stop()
    },
  }
}
