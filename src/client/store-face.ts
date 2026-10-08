/**
 * Line-neutral access face for `@deepseek-ai/dsh-client-store`.
 *
 * The module is materialized on 0.1.2+ hosts only — on 0.1.0/0.1.1 the
 * loader's client-module table lacks it, and a top-level import fails the
 * whole loader entry ("client-modules: require(\"@deepseek-ai/dsh-client-store\")
 * missed the module table", 0.1.1-rc.2 measured 2026-10-08 — the HARNESS
 * error page takes down every plugin, not just ours).
 *
 * Therefore the host module is require()d LAZILY inside try/catch (the
 * bundler keeps external require calls in place in the CJS bundle — the
 * mcp-registry `declare function require` pattern), and lines without the
 * module fall back to the local engine below, faithful to the host
 * contract (lib/types/contract.d.ts): `defineStore` → `{spec, create}` with
 * instances `{actions, getSnapshot, subscribe, clearPersisted}`, actions as
 * draft transforms, `persist` key (optionally session-suffixed) riding
 * localStorage — which is exactly where the host engine persists browser
 * stores too. `createSnapshotStore` is the bare writable snapshot cell.
 *
 * Consumption note: the settings card reads the instance through plain
 * `useSyncExternalStore(prefs.subscribe, prefs.getSnapshot)` — no host
 * render machinery involved — so the fallback covers it completely. The
 * reader view's `useStore` selector hook is bound by the host's slot
 * machinery from the declared handle on modern lines; on old lines that
 * machinery is absent by design and the reader degrades with the line,
 * which is out of scope here.
 */
declare function require(id: string): any

/** Minimal structural face of the host module (avoid a hard type dependency). */
export interface SnapshotStoreLike<T> {
  getSnapshot(): T
  subscribe(fn: () => void): () => void
  update(mutator: (draft: T) => void): void
  set(next: T): void
}

export interface StoreInstanceLike<T, A> {
  readonly actions: A
  getSnapshot(): T
  subscribe(fn: () => void): () => void
  clearPersisted(): void
}

export interface StoreHandleLike<T, A> {
  readonly spec: {
    init: () => T
    persist?: string
    actions: Record<string, (draft: T, ...params: any[]) => void>
  }
  create(scopeKey?: string): StoreInstanceLike<T, A>
}

function fallbackCreateSnapshotStore<T>(initial: T): SnapshotStoreLike<T> {
  let value: T = initial
  const listeners = new Set<() => void>()
  const notify = (): void => { for (const l of [...listeners]) l() }
  return {
    getSnapshot: () => value,
    subscribe(fn) { listeners.add(fn); return () => { listeners.delete(fn) } },
    update(mutator) {
      const draft = structuredClone(value)
      mutator(draft)
      value = draft
      notify()
    },
    set(next) { value = next; notify() },
  }
}

function fallbackDefineStore<T extends object, A extends Record<string, (draft: T, ...params: any[]) => void>>(
  spec: { init: () => T; persist?: string; actions: A },
): StoreHandleLike<T, A> {
  return {
    spec,
    create(scopeKey?: string): StoreInstanceLike<T, A> {
      let state: T = spec.init()
      const listeners = new Set<() => void>()
      const persistKey = spec.persist ? (scopeKey ? `${spec.persist}.${scopeKey}` : spec.persist) : undefined
      if (persistKey) {
        try {
          const raw = localStorage.getItem(persistKey)
          if (raw) state = { ...state, ...(JSON.parse(raw) as Partial<T>) }
        } catch { /* corrupted persisted value → fresh state */ }
      }
      const commit = (): void => {
        if (persistKey) {
          try { localStorage.setItem(persistKey, JSON.stringify(state)) } catch { /* quota/private mode → session-only */ }
        }
        for (const l of [...listeners]) l()
      }
      const actions = {} as A
      for (const [name, fn] of Object.entries(spec.actions)) {
        ;(actions as Record<string, unknown>)[name] = (...params: unknown[]): void => {
          const draft = structuredClone(state)
          ;(fn as (draft: T, ...p: unknown[]) => void)(draft, ...params)
          state = draft
          commit()
        }
      }
      return {
        actions,
        getSnapshot: () => state,
        subscribe(fn) { listeners.add(fn); return () => { listeners.delete(fn) } },
        clearPersisted(): void {
          if (persistKey) {
            try { localStorage.removeItem(persistKey) } catch { /* ignore */ }
          }
        },
      }
    },
  }
}

function loadHostModule(): { defineStore: typeof fallbackDefineStore; createSnapshotStore: typeof fallbackCreateSnapshotStore } | undefined {
  try {
    const mod = require('@deepseek-ai/dsh-client-store')
    if (mod && typeof mod.defineStore === 'function' && typeof mod.createSnapshotStore === 'function') return mod
  } catch { /* old line: module not materialized */ }
  return undefined
}

const hostModule = loadHostModule()

export const defineStore: typeof fallbackDefineStore = hostModule ? hostModule.defineStore : fallbackDefineStore
export const createSnapshotStore: typeof fallbackCreateSnapshotStore = hostModule ? hostModule.createSnapshotStore : fallbackCreateSnapshotStore
