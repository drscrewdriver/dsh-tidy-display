/** Transitions.dev Reasoning stream, adapted to appended content, never a loop. */
export const REASON_HOLD = 840;
export const REASON_STEP = 500;
export const REASON_LINES = 2;
/** Ceiling on how much text one catch-up step may cover. */
export const REASON_MAX_LINES = 40;
/** Beat between catch-up steps, while the transcript is still well behind. */
export const REASON_CHASE_HOLD = 40;

export function reasoningTarget(
  top: number,
  contentHeight: number,
  viewportHeight: number,
  lineHeight: number,
  backlogLines = 0,
): number {
  const end = Math.max(0, contentHeight - viewportHeight);
  const current = Math.min(end, Math.max(0, top));
  // `backlogLines` is how far the newest text sits below what is painted. The
  // reference step size is a reading pace: two lines, then a hold. That pace is
  // far slower than a fast model writes, so the viewport used to crawl behind in
  // fixed hops no matter how quickly the text arrived. Covering the backlog in
  // one step keeps the newest line with the text instead; a model that writes at
  // or below the reading pace still leaves the backlog at two lines, unchanged.
  const lines = Math.max(REASON_LINES, Math.min(REASON_MAX_LINES, Math.ceil(backlogLines)));
  return Math.min(end, current + Math.max(1, lineHeight) * lines);
}

