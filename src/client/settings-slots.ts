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
    'settings.section': { kind: 'list'; scope: 'root'; owner: SettingsSectionOwnerProps };
    /**
     * 「起子插件设置」family tab ledger, declared by the dsh-session-guard
     * family hub. Every drscrewdriver-family plugin registers one tab here
     * (id + order for tab ordering, inject = card props) instead of owning a
     * standalone settings.section.
     */
    'dsh-family.tab': { kind: 'list'; scope: 'root'; owner: Record<string, unknown> };
  }
  interface LocaleNamespaceMap {
    'tidy-display': SettingsCopyKey;
  }
}
