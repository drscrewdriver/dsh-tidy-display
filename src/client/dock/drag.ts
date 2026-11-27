/**
 * Dock drag clamp — pure geometry for the bottom-right capsule row.
 *
 * The whole capsule row may be dragged up by at most 1.5 row heights, and never
 * below its shipped position (dy = 0). Kept dependency-free and DOM-free so the
 * limit is unit-testable without a browser.
 */

/** Maximum upward travel, as a multiple of the row height. */
export const DOCK_MAX_LIFT = 1.5

/**
 * Clamp a raw pointer delta into the dock's allowed vertical travel.
 *
 * @param dy - raw pointer movement since drag start (negative = upward).
 * @param rowHeight - measured height of the capsule row in CSS pixels.
 * @returns a non-positive offset in [-1.5 * rowHeight, 0]; 0 for an invalid height.
 */
export function clampDockOffset(dy: number, rowHeight: number): number {
  if (!(rowHeight > 0)) return 0
  const upper = -DOCK_MAX_LIFT * rowHeight
  return Math.max(upper, Math.min(0, dy))
}

/** Pointer travel in pixels before a press becomes a drag (vs. a click). */
export const DRAG_THRESHOLD_PX = 4
