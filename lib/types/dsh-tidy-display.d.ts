/**
 * dsh-tidy-display host half (legacy compat lines): registers the
 * `tidy-display` settings namespace and schema so the host settings panel can
 * edit rail prefs. Actual features live in the browser half (exports "./client").
 *
 * The settings seam differs across legacy hosts:
 * - 0.1.2-rc.1+: ctx.settings.installSection(owner, ns, schema, entry, hooks)
 * - 0.1.0-rc.7 / 0.1.1-rc.x: ctx.settings.register(ns, schema, { base })
 * Both are imperative and probeable: installSection wins when present, register
 * is the fallback; if neither exists the plugin still loads (no settings UI).
 * The 0.1.7 declarative seam (configForms / .volatile()) is intentionally
 * absent — see spec.md for why one build cannot serve both eras.
 */
import type { Context } from '@deepseek-ai/cordis';
import z from 'schemastery';
/** Settings namespace (browser half binds the same namespace). */
export declare const TIDYDISPLAY_SETTINGS_NAMESPACE: "tidy-display";
/** Plugin config (message-rail subset). */
export interface Config {
    /** Canvas message rail at the conversation edge. */
    railEnabled?: boolean;
    /** Rail edge: left (default) / right (mirrored). */
    railSide?: string;
    /** Rail style: bar (default) / dot. */
    railStyle?: string;
    /** White sheen beneath current/hover marks. */
    railRing?: boolean;
    /** Hide the official TurnNavigator (0.1.2+; no-op where absent). */
    hideOfficialNav?: boolean;
    /** Mark color mode: auto (theme-aware) / custom (railColorCustom). */
    railColor?: string;
    /** Custom mark color: any CSS color, e.g. #3b82f6 / rgb(59,130,246) / rgba(…,0.85). */
    railColorCustom?: string;
    /** Accent color mode: auto (theme brand) / custom (railAccentCustom). */
    railAccent?: string;
    /** Custom accent color. */
    railAccentCustom?: string;
    /** Auto-click the host "load earlier" button under the Governor budget. */
    autoLoad?: boolean;
}
export declare const RAIL_COLOR_KEYS: readonly ["auto", "custom"];
export declare const RAIL_SIDE_KEYS: readonly ["left", "right"];
export declare const RAIL_STYLE_KEYS: readonly ["bar", "dot"];
export declare const Config: z<Schemastery.ObjectS<{
    railEnabled: z<boolean, boolean>;
    railSide: z<"left" | "right", "left" | "right">;
    railStyle: z<"bar" | "dot", "bar" | "dot">;
    railRing: z<boolean, boolean>;
    hideOfficialNav: z<boolean, boolean>;
    railColor: z<"auto" | "custom", "auto" | "custom">;
    railColorCustom: z<string, string>;
    railAccent: z<"auto" | "custom", "auto" | "custom">;
    railAccentCustom: z<string, string>;
    autoLoad: z<boolean, boolean>;
}>, Schemastery.ObjectT<{
    railEnabled: z<boolean, boolean>;
    railSide: z<"left" | "right", "left" | "right">;
    railStyle: z<"bar" | "dot", "bar" | "dot">;
    railRing: z<boolean, boolean>;
    hideOfficialNav: z<boolean, boolean>;
    railColor: z<"auto" | "custom", "auto" | "custom">;
    railColorCustom: z<string, string>;
    railAccent: z<"auto" | "custom", "auto" | "custom">;
    railAccentCustom: z<string, string>;
    autoLoad: z<boolean, boolean>;
}>>;
export declare const name = "@drscrewdriver/dsh-tidy-display";
export declare const inject: string[];
export declare function apply(ctx: Context, config?: Config): void;
//# sourceMappingURL=dsh-tidy-display.d.ts.map