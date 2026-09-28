export type SettingsCopyKey = 'nav' | 'openTitle' | 'openDescription' | 'glassTitle' | 'glassDescription' | 'bubbleTitle' | 'bubbleDescription' | 'foldTitle' | 'foldDescription' | 'foldNone' | 'foldStandard' | 'foldSummary' | 'railTitle' | 'railDescription' | 'railSide' | 'railSideLeft' | 'railSideRight' | 'railStyle' | 'railStyleBar' | 'railStyleDot' | 'railRingTitle' | 'railRingDescription' | 'takeoverTitle' | 'takeoverDescription' | 'colorBarTitle' | 'colorAccentTitle' | 'colorAuto' | 'colorCustom' | 'skillTitle' | 'skillInstalled' | 'skillMissing' | 'skillPurpose' | 'skillPluginNote' | 'skillInstall' | 'skillRecheck' | 'skillChecking' | 'skillUnavailable';
export type SettingsCopy = Record<SettingsCopyKey, string>;
export declare const en: SettingsCopy;
export declare const zh: SettingsCopy;
export declare function settingsLanguage(tag: string | undefined): 'zh' | 'en';
export declare function settingsCopyFor(tag: string | undefined): SettingsCopy;
//# sourceMappingURL=settings-copy.d.ts.map