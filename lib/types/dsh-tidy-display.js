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
import z from 'schemastery';
/** Settings namespace (browser half binds the same namespace). */
export const TIDYDISPLAY_SETTINGS_NAMESPACE = 'tidy-display';
export const RAIL_COLOR_KEYS = ['auto', 'custom'];
export const RAIL_SIDE_KEYS = ['left', 'right'];
export const RAIL_STYLE_KEYS = ['bar', 'dot'];
export const Config = z.object({
    railEnabled: z.boolean().default(true),
    railSide: z.union(RAIL_SIDE_KEYS).default('left'),
    railStyle: z.union(RAIL_STYLE_KEYS).default('bar'),
    railRing: z.boolean().default(true),
    hideOfficialNav: z.boolean().default(true),
    railColor: z.union(RAIL_COLOR_KEYS).default('auto'),
    railColorCustom: z.string().default(''),
    railAccent: z.union(RAIL_COLOR_KEYS).default('auto'),
    railAccentCustom: z.string().default(''),
    autoLoad: z.boolean().default(true),
});
// Module id must equal the profile entry id (the scoped package name), or the
// host cannot mount the client bundle and the whole plugin silently fails.
export const name = '@drscrewdriver/dsh-tidy-display';
export const inject = [];
export function apply(ctx, config) {
    ctx.inject(['settings'], (settingsCtx) => {
        const settings = settingsCtx.settings;
        if (typeof settings?.installSection === 'function') {
            settings.installSection(ctx, TIDYDISPLAY_SETTINGS_NAMESPACE, Config, config ?? {}, {
                setSource: () => { },
                onChange: () => { },
            });
        }
        else if (typeof settings?.register === 'function') {
            settings.register(TIDYDISPLAY_SETTINGS_NAMESPACE, Config, { base: config ?? {} });
        }
    });
}
//# sourceMappingURL=dsh-tidy-display.js.map