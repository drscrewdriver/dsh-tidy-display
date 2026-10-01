/**
 * Community-plugin SlotMap merge for Settings pages.
 * Official plugins import `@deepseek-ai/dsh-client-ui-settings/client` instead.
 * Shape matches that package's `settings.section` (list / root / close).
 */
import type { SettingsCopyKey } from './settings-copy.js';
export interface SettingsSectionOwnerProps {
    /** Close the settings panel (the shell owns the open state). */
    close: () => void;
}
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        'settings.section': {
            kind: 'list';
            scope: 'root';
            owner: SettingsSectionOwnerProps;
        };
        /**
         * 「起子插件设置」family tab ledger, declared by the dsh-session-guard
         * family hub. Every drscrewdriver-family plugin registers one tab here
         * (id + order for tab ordering, inject = card props) instead of owning a
         * standalone settings.section.
         */
        'dsh-family.tab': {
            kind: 'list';
            scope: 'root';
            owner: Record<string, unknown>;
        };
        /**
         * Plugins-page configuration card (official ui-plugin-manager contract):
         * keyed by the bundle's package name, rendered on the bundle's page with
         * `{ view: 'page', form }` owner props. This plugin ignores the page's
         * `form` (its namespace is the entry id `tidy-display`, not the package
         * name) and renders over the shared OpenPrefs face instead.
         */
        'plugins.bundle.config': {
            kind: 'keyed';
            scope: 'root';
            owner: Record<string, unknown>;
        };
    }
    interface LocaleNamespaceMap {
        'tidy-display': SettingsCopyKey;
    }
}
//# sourceMappingURL=settings-slots.d.ts.map