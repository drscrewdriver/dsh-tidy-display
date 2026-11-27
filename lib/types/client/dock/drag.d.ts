/**
 * Dock drag clamp — pure geometry for the bottom-right capsule row.
 *
 * The row is draggable in BOTH directions. Upward travel is capped at 1.5 row
 * heights above the shipped position; downward travel is capped at the lower
 * bound the caller measures (the row may slide down until it touches the bottom
 * edge of the viewport, so it is never dragged out of sight). Downward travel is
 * never negative-allowed to vanish: an unusable lower bound degrades to the
 * shipped position. Kept dependency-free and DOM-free so both limits are
 * unit-testable without a browser.
 */
/** Maximum upward travel, as a multiple of the row height. */
export declare const DOCK_MAX_LIFT = 1.5;
/** Fallback downward travel when the caller has no viewport measurement. */
export declare const DOCK_MAX_DROP = 1.5;
/**
 * Clamp a raw drag offset into the dock's allowed vertical travel.
 *
 * @param dy - candidate offset since drag start (negative = upward).
 * @param rowHeight - measured height of the capsule row in CSS pixels.
 * @param maxDownOffset - lower bound (positive or zero): how far below the
 *   shipped position the row may sit. Callers pass the measured room under the
 *   row (viewport bottom minus the row's resting bottom edge); it defaults to a
 *   symmetric {@link DOCK_MAX_DROP} row heights.
 * @returns an offset in [-1.5 * rowHeight, +maxDownOffset]; 0 for an invalid height.
 */
export declare function clampDockOffset(dy: number, rowHeight: number, maxDownOffset?: number): number;
/** Pointer travel in pixels before a press becomes a drag (vs. a click). */
export declare const DRAG_THRESHOLD_PX = 4;
//# sourceMappingURL=drag.d.ts.map