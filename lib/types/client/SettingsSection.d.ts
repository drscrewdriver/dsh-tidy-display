import { type FoldIntensity } from './fold-intensity.js';
import { type DeliverableOpenMode } from './open-file.js';
import { type SettingsCopy, type SettingsCopyKey } from './settings-copy.js';
import { type SkillStatusProbe } from './skill-status.js';
export interface ReaderPrefsSnapshot {
    deliverableOpenMode?: DeliverableOpenMode;
    frostedGlass?: boolean;
    bubbles?: boolean;
    foldIntensity?: FoldIntensity;
    autoFold?: boolean;
    processOnly?: boolean;
    railEnabled?: boolean;
    railSide?: 'left' | 'right';
    railStyle?: 'bar' | 'dot';
    railRing?: boolean;
    hideOfficialNav?: boolean;
    railColor?: string;
    railColorCustom?: string;
    railColorLight?: string;
    railAccent?: string;
    railAccentCustom?: string;
    railAccentLight?: string;
}
export interface OpenPrefs {
    getSnapshot: () => ReaderPrefsSnapshot;
    subscribe: (fn: () => void) => () => void;
    actions: {
        setDeliverableOpenMode: (value: DeliverableOpenMode) => void;
        setFrostedGlass: (value: boolean) => void;
        setBubbles?: (value: boolean) => void;
        setFoldIntensity?: (value: FoldIntensity) => void;
        setAutoFold?: (value: boolean) => void;
        setRailEnabled?: (value: boolean) => void;
        setRailSide?: (value: 'left' | 'right') => void;
        setRailStyle?: (value: 'bar' | 'dot') => void;
        setRailRing?: (value: boolean) => void;
        setHideOfficialNav?: (value: boolean) => void;
        setRailColor?: (value: string) => void;
        setRailColorCustom?: (value: string) => void;
        setRailColorLight?: (value: string) => void;
        setRailAccent?: (value: string) => void;
        setRailAccentCustom?: (value: string) => void;
        setRailAccentLight?: (value: string) => void;
    };
}
export interface BetterDisplaySettingsInjected {
    prefs: OpenPrefs;
    copy?: SettingsCopy;
    languageTag?: string;
    checkSkill: SkillStatusProbe;
}
type SettingsProps = BetterDisplaySettingsInjected & {
    /** Official settings.section owner share; unused here. */
    close?: () => void;
    t?: (key: SettingsCopyKey) => string;
};
export declare function SettingsSection(props: SettingsProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=SettingsSection.d.ts.map