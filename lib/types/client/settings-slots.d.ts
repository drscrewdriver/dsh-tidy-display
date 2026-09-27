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
    }
    interface LocaleNamespaceMap {
        'tidy-display': SettingsCopyKey;
    }
}
//# sourceMappingURL=settings-slots.d.ts.map