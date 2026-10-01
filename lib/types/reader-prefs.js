/**
 * Reader preference metadata shared by the host Config schema and the client
 * bridge — deliberately free of schemastery (and of any host-only import) so
 * the client bundle can use it verbatim.
 */
/** Config field names — the volatile projection's key set (lockstep with the schema). */
export const READER_CONFIG_FIELDS = [
    'motion',
    'foldIntensity',
    'frostedGlass',
    'bubbles',
    'deliverableOpenMode',
    'railEnabled',
    'railSide',
    'railStyle',
    'railRing',
    'hideOfficialNav',
    'railColor',
    'railColorCustom',
    'railColorLight',
    'railAccent',
    'railAccentCustom',
    'railAccentLight',
];
/** Defaults mirror `createReaderStore().init` — the migration's "non-default" test. */
export const READER_CONFIG_DEFAULTS = {
    motion: true,
    foldIntensity: 1,
    frostedGlass: false,
    bubbles: true,
    deliverableOpenMode: 'external',
    railEnabled: true,
    railSide: 'left',
    railStyle: 'bar',
    railRing: true,
    hideOfficialNav: true,
    railColor: 'auto',
    railColorCustom: '',
    railColorLight: 'l3',
    railAccent: 'auto',
    railAccentCustom: '',
    railAccentLight: 'l3',
};
//# sourceMappingURL=reader-prefs.js.map