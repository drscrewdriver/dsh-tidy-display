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