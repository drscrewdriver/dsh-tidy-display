/**
 * Reader preference metadata shared by the host Config schema and the client
 * bridge — deliberately free of schemastery (and of any host-only import) so
 * the client bundle can use it verbatim.
 */

/** Resolved shape cordis hands to `apply`; raw patch values may be partial. */
export interface ReaderConfig {
	motion: boolean;
	foldIntensity: 0 | 1 | 2;
	frostedGlass: boolean;
	bubbles: boolean;
	deliverableOpenMode: 'external' | 'sidebar';
	railEnabled: boolean;
	railSide: 'left' | 'right';
	railStyle: 'bar' | 'dot';
	railRing: boolean;
	hideOfficialNav: boolean;
	railColor: string;
	railColorCustom: string;
	railColorLight: string;
	railAccent: string;
	railAccentCustom: string;
	railAccentLight: string;
}

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
] as const satisfies readonly (keyof ReaderConfig)[];

export type ReaderConfigField = (typeof READER_CONFIG_FIELDS)[number];

/** Defaults mirror `createReaderStore().init` — the migration's "non-default" test. */
export const READER_CONFIG_DEFAULTS: Record<ReaderConfigField, unknown> = {
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
