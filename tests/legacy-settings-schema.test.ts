import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Config, TIDYDISPLAY_SETTINGS_NAMESPACE } from '../src/dsh-tidy-display.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('settings namespace is the lowercase-hyphen string legacy hosts register', () => {
  assert.equal(TIDYDISPLAY_SETTINGS_NAMESPACE, 'tidy-display');
});

test('schema evaluates with every rail key and the documented defaults', () => {
  const value = Config({}) as Record<string, unknown>;
  assert.equal(value.railEnabled, true);
  assert.equal(value.railSide, 'left');
  assert.equal(value.railStyle, 'bar');
  assert.equal(value.railRing, true);
  assert.equal(value.railColor, 'auto');
  assert.equal(value.railColorCustom, '');
  assert.equal(value.railAccent, 'auto');
  assert.equal(value.railAccentCustom, '');
  assert.equal(value.autoLoad, true);
});

test('schema validates enum fields and rejects unknown rail sides', () => {
  const good = Config({ railSide: 'right', railStyle: 'dot', railColor: 'custom' }) as Record<string, unknown>;
  assert.equal(good.railSide, 'right');
  assert.equal(good.railStyle, 'dot');
  assert.equal(good.railColor, 'custom');
  assert.throws(() => Config({ railSide: 'up' }));
});

test('host half carries no 0.1.7-only declarative seam', () => {
  const src = readFileSync(resolve(root, 'src/dsh-tidy-display.ts'), 'utf8');
  // Strip block comments: the docs mention the 0.1.7 seam to explain its absence.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(code, /\.volatile/);
  assert.doesNotMatch(code, /@deepseek-ai\/schemastery/);
  assert.doesNotMatch(code, /configForms/);
  // The probe chain: installSection first, register as fallback.
  assert.match(code, /installSection/);
  assert.match(code, /register\(/);
  // 0.1.1 line: no official TurnNavigator exists, so no takeover field.
  assert.doesNotMatch(code, /hideOfficialNav/);
  // 0.1.7-only web routes (reveal / skill-status) stay on main.
  assert.doesNotMatch(code, /tidy-display\/reveal/);
});
