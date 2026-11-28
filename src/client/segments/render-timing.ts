/**
 * Mermaid render timing — observation only, deliberately.
 *
 * Upstream `omdsh-dev/dsh-genui#443` reports one mermaid diagram blocking the
 * main thread for 4,615 ms, with the root cause traced to forced synchronous
 * layout under **241 stylesheets**. This plugin renders through the same
 * `GenuiBlock` path but injects exactly one plate stylesheet
 * (`genui-plate.ts`, class-keyed, guarded by an `injected` flag), so the
 * reported cause probably does not apply here.
 *
 * Hence: measure first, optimise later, and only if the numbers say so.
 * Shipping a "fix" for a cost we have never observed would be guesswork with
 * a permanent maintenance bill.
 *
 * Cost model — the whole module is inert until the probe is switched on:
 * - off (default): `timeMermaidRender` returns the shared no-op, no marks are
 *   written and no `PerformanceObserver` is registered;
 * - on: one `performance.mark` pair per render plus one `measure`, and a
 *   long-task observer registered once (absent API → silent degradation to
 *   marks/measures only, never a throw).
 *
 * Repetition signal: `plolpl789/dsh-raw-html-v2#7` describes a mermaid
 * sequence diagram that "expands forever", i.e. the same segment re-rendering
 * in a loop. `repeats` counts renders of a `segKey` that already rendered, so
 * a re-entry loop shows up as a number instead of a user report.
 */

/** One completed render measurement. */
interface RenderSample {
  label: string;
  durationMs: number;
}

/** Long-task entries: `>50 ms` blocking stretches reported by the browser. */
interface LongTaskSample {
  durationMs: number;
}

const samples: RenderSample[] = [];
/** How many times each `segKey` has rendered; >1 means a re-render. */
const rendersByKey = new Map<string, number>();
const longTasks: LongTaskSample[] = [];

/** Bounded so a long session cannot grow the probe without limit. */
const MAX_SAMPLES = 500;
const MAX_LONG_TASKS = 200;
/** User Timing entries accumulate in the browser too; trim past this count. */
const MAX_MARKS = 400;

let probeEnabled = false;
let observer: PerformanceObserver | null = null;
let markSeq = 0;

const NOOP = (): void => {};

function performanceApi(): Performance | undefined {
  return typeof performance === 'undefined' ? undefined : performance;
}

/** Long-task observation is Chromium-only; probe instead of assuming. */
function supportsLongTask(): boolean {
  const api = performanceApi();
  if (!api || typeof PerformanceObserver !== 'function') return false;
  const supported = (PerformanceObserver as unknown as { supportedEntryTypes?: string[] }).supportedEntryTypes;
  return Array.isArray(supported) && supported.includes('longtask');
}

function ensureObserver(): void {
  if (observer !== null || !probeEnabled) return;
  if (!supportsLongTask()) return; // silent degradation: marks/measures still work
  try {
    const created = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        longTasks.push({ durationMs: entry.duration });
        if (longTasks.length > MAX_LONG_TASKS) longTasks.shift();
      }
    });
    created.observe({ entryTypes: ['longtask'] });
    observer = created;
  } catch {
    observer = null; // host refused the entry type — stay on marks only
  }
}

function dropObserver(): void {
  if (observer === null) return;
  try { observer.disconnect(); } catch { /* already gone */ }
  observer = null;
}

/**
 * Turn observation on or off. Called from the settings snapshot, so it must be
 * idempotent and cheap: the same value never re-registers the observer.
 */
export function setRenderTimingProbe(enabled: boolean): void {
  if (probeEnabled === enabled) return;
  probeEnabled = enabled;
  if (enabled) ensureObserver();
  else dropObserver();
}

export function isRenderTimingProbeEnabled(): boolean {
  return probeEnabled;
}

function trimMarks(api: Performance): void {
  const marks = api.getEntriesByType('mark');
  if (marks.length <= MAX_MARKS) return;
  for (const mark of marks.slice(0, marks.length - MAX_MARKS)) {
    try { api.clearMarks(mark.name); } catch { /* ignore */ }
  }
}

/**
 * Start timing one mermaid render. Returns the `stop` closure; with the probe
 * off it is the shared no-op and nothing at all is recorded.
 *
 * @param label render surface (`reader:` / `native:`) for attribution.
 * @param segKey stable per-position key — the repetition counter's identity.
 */
export function timeMermaidRender(label: string, segKey?: string): () => void {
  if (!probeEnabled) return NOOP;
  const api = performanceApi();
  if (!api || typeof api.mark !== 'function') return NOOP;

  markSeq += 1;
  const start = `dsh-tidy-display:mermaid:${markSeq}:start`;
  const end = `dsh-tidy-display:mermaid:${markSeq}:end`;
  try { api.mark(start); } catch { return NOOP; }

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    let durationMs: number;
    try {
      api.mark(end);
      api.measure(`dsh-tidy-display:mermaid:${markSeq}`, start, end);
      durationMs = api.getEntriesByName(`dsh-tidy-display:mermaid:${markSeq}`, 'measure')[0]?.duration ?? 0;
    } catch {
      durationMs = 0;
    }
    samples.push({ label, durationMs });
    if (samples.length > MAX_SAMPLES) samples.shift();
    if (segKey !== undefined) rendersByKey.set(segKey, (rendersByKey.get(segKey) ?? 0) + 1);
    try { api.clearMarks(start); api.clearMarks(end); } catch { /* ignore */ }
    trimMarks(api);
  };
}

function percentile(sorted: number[], fraction: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(fraction * sorted.length) - 1));
  return sorted[index] ?? 0;
}

/** Aggregate view for the settings diagnostics panel. */
export interface RenderTimingSnapshot {
  count: number;
  p50: number;
  p95: number;
  maxMs: number;
  /** Renders of a `segKey` beyond its first — a re-entry loop, if it grows. */
  repeats: number;
  /** Blocking stretches over 50 ms seen while the probe was on. */
  longTasks: number;
  /** Longest blocking stretch observed, in ms. */
  longestTaskMs: number;
}

export function renderTimingSnapshot(): RenderTimingSnapshot {
  const durations = samples.map(sample => sample.durationMs).sort((a, b) => a - b);
  let repeats = 0;
  for (const count of rendersByKey.values()) repeats += Math.max(0, count - 1);
  return {
    count: samples.length,
    p50: percentile(durations, 0.5),
    p95: percentile(durations, 0.95),
    maxMs: durations.length === 0 ? 0 : (durations[durations.length - 1] ?? 0),
    repeats,
    longTasks: longTasks.length,
    longestTaskMs: longTasks.reduce((max, task) => Math.max(max, task.durationMs), 0),
  };
}

/** Test seam: wipe samples, counters and the observer between cases. */
export function resetRenderTiming(): void {
  samples.length = 0;
  rendersByKey.clear();
  longTasks.length = 0;
  dropObserver();
  probeEnabled = false;
}
