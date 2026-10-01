import type { Context } from '@deepseek-ai/cordis';
import { READER_CONFIG_DEFAULTS, READER_CONFIG_FIELDS, type ReaderConfig, type ReaderConfigField } from '../reader-prefs.js';

/**
 * Two-way bridge between the entry config (namespace = entry id `tidy-display`,
 * the volatile fields of `src/config.ts`) and the reader root store (persist key
 * `dsh.reader.v1`).
 *
 * Direction 1 (preference edits): every writer — the family-tab card, the
 * Plugins-page card, the reader chrome — acts on the store; the bridge pushes
 * changed fields into the config form. Volatile-only commits never remount.
 *
 * Direction 2 (config edits from elsewhere — profile patch hand-edits, another
 * device): form snapshots apply back into the store.
 *
 * Migration: per field, an absent config value adopts the store's non-default
 * value once, on the first ready snapshot. Idempotent — an override (even one
 * equal to the default) is never touched again.
 */

/** Minimal structural face of the configForms service (avoid a hard peer). */
interface ConfigFormsFace {
	get?<T = unknown>(entryId: string): ConfigFormFace<T> | undefined;
	whileServed?(namespaces: readonly string[], register: () => void): () => void;
}

interface ConfigFormFace<T = unknown> {
	getSnapshot(): { status: 'loading' | 'ready' | 'unavailable'; value: Partial<T> | undefined; writable: boolean };
	subscribe(listener: () => void): () => void;
	set(field: string, value: unknown): Promise<boolean>;
}

/** Store-facing slice the bridge needs (baked actions + snapshot source). */
interface PrefsFace {
	getSnapshot(): Record<string, unknown>;
	subscribe(fn: () => void): () => void;
	actions: Record<string, ((value: never) => void) | undefined>;
}
function configFormsOf(ctx: Context): ConfigFormsFace | undefined {
	const forms = (ctx as unknown as { get?: (name: string) => unknown }).get?.('configForms') as ConfigFormsFace | undefined;
	if (forms && typeof forms.get === 'function') return forms;
	return undefined;
}

export function installConfigBridge(ctx: Context, prefs: PrefsFace): void {
	const forms = configFormsOf(ctx);
	if (!forms) return; // legacy host: the persist key stays the only copy

	const lastKnown = new Map<string, unknown>();
	const disposers: Array<() => void> = [];

	const push = (field: ReaderConfigField, value: unknown, form: ConfigFormFace): void => {
		lastKnown.set(field, value);
		void form.set(field, value).catch(() => {});
	};

	const applyField = (field: ReaderConfigField, value: unknown): void => {
		const set = prefs.actions[`set${field[0]!.toUpperCase()}${field.slice(1)}`];
		set?.(value as never);
	};

	const attach = (form: ConfigFormFace): void => {
		// store → config
		disposers.push(prefs.subscribe(() => {
			const snap = form.getSnapshot();
			if (snap.status !== 'ready' || !snap.writable) return;
			const store = prefs.getSnapshot();
			for (const field of READER_CONFIG_FIELDS) {
				const value = store[field];
				if (value === undefined || Object.is(value, lastKnown.get(field))) continue;
				push(field, value, form);
			}
		}));
		const drain = (): void => {
			const snap = form.getSnapshot();
			if (snap.status !== 'ready') return;
			const store = prefs.getSnapshot();
			for (const field of READER_CONFIG_FIELDS) {
				const configValue = (snap.value as Partial<ReaderConfig> | undefined)?.[field];
				if (configValue === undefined) {
					// migration: an absent config field adopts a non-default store value once
					const storeValue = store[field];
					if (snap.writable && storeValue !== undefined && !Object.is(storeValue, READER_CONFIG_DEFAULTS[field]) && !lastKnown.has(field)) {
						push(field, storeValue, form);
					} else if (storeValue !== undefined && !lastKnown.has(field)) {
						// default-valued absent field: pin it so later unrelated store
						// changes don't sweep the default into the config section
						lastKnown.set(field, storeValue);
					}
					continue;
				}
				if (Object.is(configValue, lastKnown.get(field))) continue;
				lastKnown.set(field, configValue);
				if (!Object.is(configValue, store[field])) applyField(field, configValue);
			}
		};
		// config → store
		disposers.push(form.subscribe(drain));
		drain(); // in case the form was already ready before this attach
	};

	const form = forms.get?.<ReaderConfig>('tidy-display');
	if (form) attach(form);
	// attach later when the host starts serving the namespace
	if (typeof forms.whileServed === 'function') {
		disposers.push(forms.whileServed(['tidy-display'], () => {
			if (!form) {
				const again = forms.get?.<ReaderConfig>('tidy-display');
				if (again) attach(again);
			}
		}));
	}
	ctx.effect(() => () => {
		for (const off of disposers) {
			try { off(); } catch { /* already gone */ }
		}
	});
}
