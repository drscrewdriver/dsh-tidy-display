export type SettingsCopyKey = 'nav' | 'railTitle' | 'railDescription' | 'railSide' | 'railSideLeft' | 'railSideRight' | 'railStyle' | 'railStyleBar' | 'railStyleDot' | 'railRingTitle' | 'railRingDescription' | 'takeoverTitle' | 'takeoverDescription' | 'colorBarTitle' | 'colorAccentTitle' | 'colorAuto' | 'colorCustom' | 'autoLoadTitle' | 'autoLoadDescription';
export type SettingsCopy = Record<SettingsCopyKey, string>;
export declare const en: SettingsCopy;
export declare const zh: SettingsCopy;
export declare function settingsLanguage(tag: string | undefined): 'zh' | 'en';
export declare function settingsCopyFor(tag: string | undefined): SettingsCopy;
//# sourceMappingURL=settings-copy.d.ts.map