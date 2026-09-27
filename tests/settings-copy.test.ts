import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { en, zh } from '../src/client/settings-copy.ts';
import { CONVENTIONAL_SKILL_ROOTS, GENERATIVE_MCPAPPS_SKILL } from '../src/skill-status.ts';
import { shortestInstallCommand } from '../src/client/skill-status.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** User-facing surfaces must never print home/profile absolutes. */
const LEAKED_ABSOLUTE_PATH = /\/Users\/|[A-Za-z]:\\|(?:^|[\s"'`])\/home\/|\$HOME\b|\$DSH_HOME\b|~\//;

function installGuidanceSurface(): string {
  return [
    ...Object.values(en),
    ...Object.values(zh),
    shortestInstallCommand({
      packPath: '/Users/cola/plugin/skills/generative-mcpapps',
      roots: [
        { source: 'user-dsh', path: '/Users/cola/.dsh/skills' },
        { source: 'user-agents', path: 'C:\\Users\\cola\\.agents\\skills' },
      ],
    }),
    ...CONVENTIONAL_SKILL_ROOTS,
  ].join('\n');
}

test('install guidance names only relative skill roots', () => {
  const surface = installGuidanceSurface();
  assert.match(surface, /\.dsh\/skills/);
  assert.match(surface, /\.agents\/skills/);
  assert.match(surface, new RegExp(GENERATIVE_MCPAPPS_SKILL));
  assert.doesNotMatch(surface, LEAKED_ABSOLUTE_PATH);
  assert.doesNotMatch(surface, /\/Users\//);
  assert.doesNotMatch(surface, /C:\\/);
});

test('Settings dictionaries mention conventional roots and the skill folder', () => {
  for (const copy of [en, zh]) {
    const blob = `${copy.skillInstall}\n${copy.skillUnavailable}`;
    assert.match(blob, /\.dsh\/skills/);
    assert.match(blob, /\.agents\/skills/);
    assert.match(blob, /generative-mcpapps/);
    assert.doesNotMatch(blob, LEAKED_ABSOLUTE_PATH);
  }
});

test('committed Settings UI copy and command stay relative', () => {
  const client = readFileSync(resolve(root, 'lib/client.js'), 'utf8');
  const section = readFileSync(resolve(root, 'src/client/SettingsSection.tsx'), 'utf8');
  assert.match(section, /CONVENTIONAL_SKILL_ROOTS/);
  assert.doesNotMatch(section, /root\.path/);
  assert.doesNotMatch(section, /shortestInstallCommand\(skill\)/);
  assert.match(client, /\.dsh\/skills/);
  assert.match(client, /\.agents\/skills/);
  assert.doesNotMatch(client, /mkdir -p "\$DSH_HOME\/skills"/);
  assert.doesNotMatch(client, /status\.packPath \?\?/);
  assert.doesNotMatch(client, /root\.source, ": ", root\.path/);
  assert.doesNotMatch(client, /\/Users\//);
  assert.doesNotMatch(client, /C:\\\\/);
});
