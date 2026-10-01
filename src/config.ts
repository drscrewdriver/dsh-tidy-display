import z from '@deepseek-ai/schemastery';
import { READER_CONFIG_FIELDS, type ReaderConfig, type ReaderConfigField } from './reader-prefs.js';

/**
 * Entry configuration for `tidy-display` — the global reader preferences that
 * used to live only in the client-store persist key `dsh.reader.v1`.
 *
 * On harness lines whose schemastery ships `.volatile()` (0.1.7+) every field
 * is marked live-editable: the harness's settings describe projects them as the
 * entry's config form (namespace = entry id `tidy-display`), and preference
 * edits commit volatile-only without remounting the entry. On older lines the
 * modifier is absent and the marks are skipped (feature-detect, the dsh-context
 * convention) — the schema then acts as plain entry config and the client keeps
 * reading/writing the persist key.
 *
 * Derived store fields (`autoFold`, `processOnly` both derive from
 * `foldIntensity`) and session-scoped state (`expanded`) deliberately have no
 * config field: the canonical source is `foldIntensity`, and `expanded` is
 * per-message UI state, not a preference.
 */

/** Mark a field live-editable where the harness schemastery has the modifier. */
function volatileField(field: z): z {
	const volatile = (field as unknown as { volatile?: unknown }).volatile;
	return typeof volatile === 'function' ? (volatile.call(field) as z) : field;
}

function bool(field: z): z {
	return volatileField(field);
}

/** The entry `config:` validator and the config-form generation's served schema. */
export const Config = z.object({
	motion: bool(z.boolean().default(true)),
	foldIntensity: volatileField(z.union([0, 1, 2]).default(1)),
	frostedGlass: bool(z.boolean().default(false)),
	bubbles: bool(z.boolean().default(true)),
	deliverableOpenMode: volatileField(z.union(['external', 'sidebar']).default('external')),
	railEnabled: bool(z.boolean().default(true)),
	railSide: volatileField(z.union(['left', 'right']).default('left')),
	railStyle: volatileField(z.union(['bar', 'dot']).default('bar')),
	railRing: bool(z.boolean().default(true)),
	hideOfficialNav: bool(z.boolean().default(true)),
	railColor: volatileField(z.union(['auto', 'hue', 'custom']).default('auto')),
	railColorCustom: volatileField(z.string().default('')),
	railColorLight: volatileField(z.string().default('l3')),
	railAccent: volatileField(z.union(['auto', 'hue', 'custom']).default('auto')),
	railAccentCustom: volatileField(z.string().default('')),
	railAccentLight: volatileField(z.string().default('l3')),
}) as unknown as z<ReaderConfig>;

export { READER_CONFIG_FIELDS };
export type { ReaderConfig, ReaderConfigField };
