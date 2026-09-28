/**
 * Rail color chain, ported from dsh-tidychat (release/0.1.7).
 *
 * resolveNavColors → applyNavColors write the resolved colors into root CSS
 * variables; the canvas redraw reads the variables instead of recomputing.
 * Principles kept from tidychat:
 * - auto bar color respects the theme token (label-caption), switching to a
 *   corrective gray only when contrast vs the real background is under 3:1;
 * - auto accent follows the theme brand color;
 * - tip contrast correction is conservative: only opaque tip backgrounds
 *   (alpha ≥ 0.85) with failing contrast get corrected; translucent/glass
 *   skins keep token following.
 */
export interface RailColorConfig {
    navColor: string;
    navColorCustom: string;
    navColorLight: string;
    navAccent: string;
    navAccentCustom: string;
    navAccentLight: string;
}
export declare const NAV_HUE_KEYS: readonly ["gray", "black", "white", "blue", "violet", "cyan", "green", "orange", "red"];
export declare const NAV_HUE_LABELS: Record<string, string>;
export declare const NAV_HUE_PREVIEW: Record<string, string>;
export declare const NAV_LIGHT_KEYS: readonly ["l1", "l2", "l3", "l4", "l5"];
export declare const NAV_LIGHT_LABELS: Record<string, string>;
export declare const NAV_HUE_PALETTE: Record<string, [string, string, string, string, string]>;
export declare const NAV_LIGHT_IDX: Record<string, number>;
export declare const hueColor: (hue: unknown, light: unknown, fallback: string) => string;
export declare const parseRgba: (s: string) => [number, number, number, number] | null;
export declare const parseRgb: (s: string) => [number, number, number] | null;
export declare const contrastRatio: (a: [number, number, number], b: [number, number, number]) => number;
export declare const validColor: (raw: unknown, fallback: string) => string;
export declare const resolveNavColors: (cfg: RailColorConfig, start: Element | null) => {
    bar: string;
    hot: string;
};
export declare const applyNavColors: (cfg: RailColorConfig, start: Element | null) => void;
/**
 * Install the color pipeline once per client: reacts to store changes (the
 * settings card), theme switches (:root class/style/data-theme) and a slow
 * fallback interval (sidebar resize changes the resolved background). Writes
 * are guarded (value-equal) so the theme observer cannot loop.
 */
export declare function installRailColors(prefs: {
    subscribe: (fn: () => void) => () => void;
    getSnapshot: () => RailColorConfig;
}, getStart: () => Element | null): () => void;
//# sourceMappingURL=colors.d.ts.map