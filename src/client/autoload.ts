/**
 * Smart AutoLoad Governor, ported from dsh-tidychat (compat/0.1.5 line).
 *
 * Internal budget is TIME, not row counts, so the behavior is self-consistent
 * across machines: keep clicking the host "load earlier" button until the
 * per-page processing cost (measured after each settled batch) exceeds a soft
 * budget twice-ish or the hard budget once — then pause with a hint instead of
 * wedging the tab.
 *
 * Adaptations vs the tidychat original:
 * - no fold surgery / divider to measure; the measured scan is the rail
 *   refresh notification (`onSettle`), which is the real per-page cost here;
 * - session scoping is replaced by scroll-container identity: when the host
 *   swaps the conversation column, the governor resets (old async callbacks
 *   are fenced out by a generation counter, same as the original).
 */

export const SOFT_BUDGET_MS = 30;
export const HARD_BUDGET_MS = 50;
const CONSECUTIVE_SLOW_LIMIT = 3;
const SETTLE_QUIET_MS = 300;
const SETTLE_TIMEOUT_MS = 8000;
const IDLE_FALLBACK_MS = 50;
const NULL_RETRY_LIMIT = 15;
const NULL_RETRY_DELAY_MS = 2000;

export type GovernorStatus = 'idle' | 'loading' | 'settling' | 'paused' | 'done';

export interface AutoLoadState {
  generation: number;
  status: GovernorStatus;
  consecutiveSlow: number;
  nullStreak: number;
}

export interface AutoLoadOptions {
  /** Conversation scroll container (identity changes reset the governor). */
  getRoot: () => Element | null;
  /** Master switch (settings), polled every cycle. */
  isEnabled: () => boolean;
  /** Rail refresh after each settled page; its duration is the measured cost. */
  onSettle?: () => void;
}

const isLoadOlderButton = (b: Element): boolean => {
  const t = (b.textContent || '').trim();
  // Conversation-specific labels only; generic "load more" is excluded on
  // purpose so other lists with the same words never get clicked.
  return t === '加载更早' || t === 'Load earlier' || t === 'Load older';
};

export function findLoadOlderButton(): HTMLButtonElement | null {
  for (const b of document.querySelectorAll('button')) {
    if (isLoadOlderButton(b)) return b as HTMLButtonElement;
  }
  return null;
}

const countAnchors = (): number => document.querySelectorAll('[data-chat-anchor-key]').length;

export function startAutoLoad(opts: AutoLoadOptions): () => void {
  const st: AutoLoadState = { generation: 0, status: 'idle', consecutiveSlow: 0, nullStreak: 0 };
  let root: Element | null = null;
  let disposed = false;
  const disposers: Array<() => void> = [];
  const track = (dispose: () => void): (() => void) => {
    disposers.push(dispose);
    return () => {
      const i = disposers.indexOf(dispose);
      if (i >= 0) disposers.splice(i, 1);
    };
  };

  const showPausedHint = (): void => {
    if (document.querySelector('[data-tidy-display-autoload-hint]') !== null) return;
    const btn = findLoadOlderButton();
    if (btn === null || btn.parentElement === null) return;
    const hint = document.createElement('span');
    hint.setAttribute('data-tidy-display-autoload-hint', '1');
    hint.className = 'tidy-display-autoload-hint';
    hint.textContent = '为保持流畅，已暂停自动加载更早历史；可手动继续';
    btn.parentElement.insertBefore(hint, btn.nextSibling);
  };

  const pause = (): void => {
    st.status = 'paused';
    st.generation += 1;
    showPausedHint();
  };

  const measuredSettle = (): number => {
    const t0 = performance.now();
    try { opts.onSettle?.(); } catch { /* ignore */ }
    return performance.now() - t0;
  };

  function scheduleNext(): void {
    if (disposed || !opts.isEnabled()) return;
    if (st.status !== 'idle') return;
    const gen = ++st.generation;
    const run = (): void => {
      if (disposed || st.generation !== gen || st.status !== 'idle') return;
      loadOnePage(gen);
    };
    let off: () => void = () => {};
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => { off(); run(); }, { timeout: 2000 });
      off = track(() => w.cancelIdleCallback?.(id));
    } else {
      const id = setTimeout(() => { off(); run(); }, IDLE_FALLBACK_MS);
      off = track(() => clearTimeout(id));
    }
  }

  function loadOnePage(gen: number): void {
    if (disposed || !opts.isEnabled()) return;
    if (st.generation !== gen || st.status !== 'idle') return;
    const btn = findLoadOlderButton();
    if (btn === null) {
      // Button not there yet (session still loading, hasMore unknown) or no
      // earlier history. Bounded retries before declaring done, so a slow
      // first paint is never misread as "no more history".
      if (st.nullStreak >= NULL_RETRY_LIMIT) { st.status = 'done'; return; }
      st.nullStreak += 1;
      st.status = 'idle';
      const id = setTimeout(() => { scheduleNext(); }, NULL_RETRY_DELAY_MS);
      track(() => clearTimeout(id));
      return;
    }
    st.nullStreak = 0;
    if (btn.disabled) {
      st.status = 'idle';
      const id = setTimeout(() => { scheduleNext(); }, NULL_RETRY_DELAY_MS);
      track(() => clearTimeout(id));
      return;
    }
    st.status = 'loading';
    const before = countAnchors();
    // Observe + arm the timeout BEFORE clicking, so synchronous DOM changes
    // triggered by the click cannot escape the settle observer.
    settleThenMeasure(gen, before);
    try { btn.click(); } catch { /* ignore */ }
  }

  function settleThenMeasure(gen: number, before: number): void {
    st.status = 'settling';
    let quietTimer: ReturnType<typeof setTimeout> | null = null;
    let settleTimeout: ReturnType<typeof setTimeout> | null = null;
    let obs: MutationObserver | null = null;
    let finished = false;
    const finish = (isTimeout: boolean): void => {
      if (finished) return;
      finished = true;
      if (quietTimer !== null) clearTimeout(quietTimer);
      if (settleTimeout !== null) clearTimeout(settleTimeout);
      obs?.disconnect();
      if (disposed) return;
      if (st.generation !== gen || st.status !== 'settling') return;
      const after = countAnchors();
      const grew = after > before;
      const stillHasButton = findLoadOlderButton() !== null;
      const scanMs = measuredSettle();
      // Timeout, or no growth with the button still present = failed or
      // spinning batch; pausing beats an automatic retry loop.
      if (isTimeout || (!grew && stillHasButton)) { pause(); return; }
      if (scanMs >= HARD_BUDGET_MS) { pause(); return; }
      if (scanMs >= SOFT_BUDGET_MS) {
        st.consecutiveSlow += 1;
        if (st.consecutiveSlow >= CONSECUTIVE_SLOW_LIMIT) { pause(); return; }
      } else {
        st.consecutiveSlow = 0;
      }
      st.status = 'idle';
      scheduleNext();
    };
    obs = new MutationObserver(() => {
      if (quietTimer !== null) clearTimeout(quietTimer);
      quietTimer = setTimeout(() => finish(false), SETTLE_QUIET_MS);
    });
    obs.observe(document.body, { childList: true, subtree: true });
    settleTimeout = setTimeout(() => finish(true), SETTLE_TIMEOUT_MS);
  }

  // Root identity watch: when the host swaps the conversation column, the
  // governor restarts from idle for the new container.
  const rootObs = new MutationObserver(() => {
    const cur = opts.getRoot();
    if (cur === root) return;
    root = cur;
    st.generation += 1;
    st.status = 'idle';
    st.nullStreak = 0;
    if (root !== null) scheduleNext();
  });
  rootObs.observe(document.body, { childList: true, subtree: true });
  root = opts.getRoot();
  scheduleNext();

  return () => {
    disposed = true;
    st.generation += 1;
    rootObs.disconnect();
    for (const d of disposers.splice(0)) { try { d(); } catch { /* ignore */ } }
  };
}
