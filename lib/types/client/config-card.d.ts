import type { Context } from '@deepseek-ai/cordis';
import type { BetterDisplaySettingsInjected } from './SettingsSection.js';
/**
 * The Plugins-page configuration card (`plugins.bundle.config`, keyed by the
 * package name `dsh-tidy-display`): renders the SAME settings section as the
 * family tab, over the same OpenPrefs face — both surfaces stay one source of
 * truth, and the config-bridge commits edits into the entry's volatile config.
 *
 * The page hands its own `form` prop (keyed by package name), but this entry's
 * namespace is the entry id `tidy-display` ≠ package name, so the page's handle
 * would never resolve; the card renders from prefs instead and the bridge owns
 * the config writes.
 */
export declare function installPluginConfigCard(ctx: Context, injected: () => BetterDisplaySettingsInjected): void;
//# sourceMappingURL=config-card.d.ts.map