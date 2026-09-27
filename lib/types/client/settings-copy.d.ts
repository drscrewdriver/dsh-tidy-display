export type SettingsCopyKey = 'nav' | 'openTitle' | 'openDescription' | 'glassTitle' | 'glassDescription' | 'bubbleTitle' | 'bubbleDescription' | 'foldTitle' | 'foldDescription' | 'foldNone' | 'foldStandard' | 'foldSummary' | 'skillTitle' | 'skillInstalled' | 'skillMissing' | 'skillPurpose' | 'skillPluginNote' | 'skillInstall' | 'skillRecheck' | 'skillChecking' | 'skillUnavailable';
export type SettingsCopy = Record<SettingsCopyKey, string>;
export declare const en: SettingsCopy;
export declare const zh: SettingsCopy;
export declare function settingsLanguage(tag: string | undefined): 'zh' | 'en';
export declare function settingsCopyFor(tag: string | undefined): SettingsCopy;
//# sourceMappingURL=settings-copy.d.ts.map