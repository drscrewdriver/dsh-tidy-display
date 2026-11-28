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
/**
 * Turn observation on or off. Called from the settings snapshot, so it must be
 * idempotent and cheap: the same value never re-registers the observer.
 */
export declare function setRenderTimingProbe(enabled: boolean): void;
export declare function isRenderTimingProbeEnabled(): boolean;
/**
 * Start timing one mermaid render. Returns the `stop` closure; with the probe
 * off it is the shared no-op and nothing at all is recorded.
 *
 * @param label render surface (`reader:` / `native:`) for attribution.
 * @param segKey stable per-position key — the repetition counter's identity.
 */
export declare function timeMermaidRender(label: string, segKey?: string): () => void;
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
export declare function renderTimingSnapshot(): RenderTimingSnapshot;
/** Test seam: wipe samples, counters and the observer between cases. */
export declare function resetRenderTiming(): void;
//# sourceMappingURL=render-timing.d.ts.map