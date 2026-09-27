/** Transitions.dev Reasoning stream, adapted to appended content, never a loop. */
export declare const REASON_HOLD = 840;
export declare const REASON_STEP = 500;
export declare const REASON_LINES = 2;
/** Ceiling on how much text one catch-up step may cover. */
export declare const REASON_MAX_LINES = 40;
/** Beat between catch-up steps, while the transcript is still well behind. */
export declare const REASON_CHASE_HOLD = 40;
export declare function reasoningTarget(top: number, contentHeight: number, viewportHeight: number, lineHeight: number, backlogLines?: number): number;
//# sourceMappingURL=reasoning-follow.d.ts.map