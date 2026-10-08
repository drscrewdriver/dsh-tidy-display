export type SettingsCopyKey = 'nav' | 'openTitle' | 'openDescription' | 'glassTitle' | 'glassDescription' | 'bubbleTitle' | 'bubbleDescription' | 'foldTitle' | 'foldDescription' | 'foldNone' | 'foldStandard' | 'foldSummary' | 'railTitle' | 'railDescription' | 'railSide' | 'railSideLeft' | 'railSideRight' | 'railStyle' | 'railStyleBar' | 'railStyleDot' | 'railRingTitle' | 'railRingDescription' | 'takeoverTitle' | 'takeoverDescription' | 'colorBarTitle' | 'colorAccentTitle' | 'colorAuto' | 'colorCustom' | 'skillTitle' | 'skillInstalled' | 'skillMissing' | 'skillPurpose' | 'skillPluginNote' | 'skillInstall' | 'skillRecheck' | 'skillChecking' | 'skillUnavailable';
export type SettingsCopy = Record<SettingsCopyKey, string>;
export declare const en: SettingsCopy;
export declare const zh: SettingsCopy;
export declare const fr: SettingsCopy;
export declare const de: SettingsCopy;
export declare const it: SettingsCopy;
export declare const ru: SettingsCopy;
export declare const es: SettingsCopy;
export declare const ja: SettingsCopy;
export declare const ko: SettingsCopy;
export type SettingsLanguage = 'zh' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'it' | 'ru' | 'es';
export declare function settingsLanguage(tag: string | undefined): SettingsLanguage;
export declare function settingsCopyFor(tag: string | undefined): SettingsCopy;
//# sourceMappingURL=settings-copy.d.ts.map