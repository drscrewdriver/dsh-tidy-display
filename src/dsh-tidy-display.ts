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
export const TIDYDISPLAY_SETTINGS_NAMESPACE = 'tidy-display' as const;

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

export const RAIL_COLOR_KEYS = ['auto', 'custom'] as const;
export const RAIL_SIDE_KEYS = ['left', 'right'] as const;
export const RAIL_STYLE_KEYS = ['bar', 'dot'] as const;

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
export const inject: string[] = [];

export function apply(ctx: Context, config?: Config): void {
  ctx.inject(['settings'], (settingsCtx: unknown) => {
    const settings = (settingsCtx as { settings?: {
      installSection?: (...args: unknown[]) => unknown;
      register?: (...args: unknown[]) => unknown;
    } }).settings;
    if (typeof settings?.installSection === 'function') {
      settings.installSection(ctx, TIDYDISPLAY_SETTINGS_NAMESPACE, Config, config ?? {}, {
        setSource: () => {},
        onChange: () => {},
      });
    } else if (typeof settings?.register === 'function') {
      settings.register(TIDYDISPLAY_SETTINGS_NAMESPACE, Config, { base: config ?? {} });
    }
  });
}
