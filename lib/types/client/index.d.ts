import type { Context } from '@deepseek-ai/cordis';
/**
 * Legacy (pre-0.1.7) client half: message-rail subset only.
 *
 * - Mounts the canvas rail beside the native conversation column (no host
 *   slots involved — the utilities seat is a 0.1.7 contract).
 * - Rail prefs come from the `tidy-display` settings namespace (bound via the
 *   legacy settings face) and are mirrored into the rail store.
 * - autoLoad runs the tidychat Governor against the host "load earlier"
 *   button; every settled page nudges the rail to re-measure.
 */
export declare const name = "dsh-tidy-display-client";
export declare const inject: string[];
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map