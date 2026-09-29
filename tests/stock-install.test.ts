import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  main: string;
  scripts?: { prepare?: string };
  exports: Record<string, { default?: string } | string>;
  files: string[];
  dsh: { bundle?: { patch?: string } };
};

test('declares dsh.bundle.patch so official add joins the profile layer stack', () => {
  assert.equal(pkg.dsh.bundle?.patch, './cordis.patch.yml');
  assert.equal(existsSync(resolve(root, 'cordis.patch.yml')), true);
  const patch = readFileSync(resolve(root, 'cordis.patch.yml'), 'utf8');
  assert.match(patch, /id: tidy-display/);
  assert.match(patch, new RegExp(`name: ["']${pkg.name}["']`));
  assert.equal(pkg.files.includes('cordis.patch.yml'), true);
});

test('commits compiled lib entries and does not require a prepare script', () => {
  assert.equal(pkg.scripts?.prepare, undefined);
  assert.equal(pkg.main, 'lib/dsh-tidy-display.js');
  const client = pkg.exports['./client'];
  assert.equal(typeof client === 'object' && client !== null ? client.default : client, './lib/client.js');
  assert.equal(existsSync(resolve(root, 'lib/dsh-tidy-display.js')), true);
  assert.equal(existsSync(resolve(root, 'lib/client.js')), true);
  const clientJs = readFileSync(resolve(root, 'lib/client.js'), 'utf8');
  assert.match(clientJs, /window\.__ModuleLoader__\.load/);
  assert.match(clientJs, new RegExp(`id:\\s*"${pkg.name}"`));
  assert.match(clientJs, /dsh-family\.tab/);
  assert.match(clientJs, /deliverableOpenMode/);
  assert.match(clientJs, /frostedGlass/);
  assert.match(clientJs, /foldIntensity/);
  assert.match(clientJs, /setFrostedGlass/);
  assert.match(clientJs, /setFoldIntensity/);
  assert.match(clientJs, /data-reader-glass/);
  assert.match(clientJs, /modeFromSnapshot/);
  assert.match(clientJs, /str_replace_editor/);
  assert.doesNotMatch(clientJs, /只折叠过程/);
  assert.match(clientJs, /\.dsh\/skills/);
  assert.doesNotMatch(clientJs, /submission\.images\.length/);
});

test('README leads with the official stock one-liner and names pnpm', () => {
  for (const name of ['README.md', 'README.en.md']) {
    const text = readFileSync(resolve(root, name), 'utf8');
    assert.match(text, /dsh plugin --profile web add github:drscrewdriver\/dsh-tidy-display/);
    assert.match(text, /pnpm/);
    assert.doesNotMatch(text, /activate-new-client/);
    assert.doesNotMatch(text, /my-plugins/);
    assert.doesNotMatch(text, /DSHX_HARNESS/);
  }
});
