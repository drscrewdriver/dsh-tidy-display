import * as React from 'react';
import { type SettingsCopyKey } from './settings-copy.js';
/**
 * Legacy settings card, ported from dsh-tidychat (settings.plugins.tab seat,
 * imperative settings era). Writes go through the bound settings scope; when
 * the scope is missing the card renders read-only defaults.
 */
export interface LegacySettingsValue {
    railEnabled: boolean;
    railSide: string;
    railStyle: string;
    railRing: boolean;
    hideOfficialNav: boolean;
    railColor: string;
    railColorCustom: string;
    railAccent: string;
    railAccentCustom: string;
    autoLoad: boolean;
}
export interface LegacySettingsCardProps {
    value: LegacySettingsValue;
    writable: boolean;
    hasTakeover: boolean;
    onToggle: (field: keyof LegacySettingsValue) => void;
    onSet: (field: string, value: unknown) => void;
    langTag: string | undefined;
}
export declare function ensureCardCss(): void;
export declare function LegacySettingsCard(props: LegacySettingsCardProps): React.ReactElement;
export type { SettingsCopyKey };
//# sourceMappingURL=LegacySettingsCard.d.ts.map