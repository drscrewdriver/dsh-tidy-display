import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  main: string;
  scripts?: { prepare?: string };
  exports: Record<string, { default?: string } | string>;
  files: string[];
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  dsh: { bundle?: { patch?: string }; client?: { inject?: string[] } };
};

test('declares dsh.bundle.patch so official add joins the profile layer stack', () => {
  assert.equal(pkg.dsh.bundle?.patch, './cordis.patch.yml');
  const patch = readFileSync(resolve(root, 'cordis.patch.yml'), 'utf8');
  assert.match(patch, /id: tidy-display/);
  assert.match(patch, /name: ["']@drscrewdriver\/dsh-tidy-display["']/);
  assert.equal(pkg.files.includes('cordis.patch.yml'), true);
});

test('legacy dependency set: schemastery dep, per-line peers, legacy client inject', () => {
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['schemastery']);
  assert.deepEqual(Object.keys(pkg.peerDependencies).sort(), ['@deepseek-ai/dsh-settings', 'react']);
  // 0.1.2 line: the installSection seam exists, the session surface is pre-V3.
  assert.match(pkg.peerDependencies['@deepseek-ai/dsh-settings'], /^>=0\.1\.2-alpha\.2 <0\.1\.5-alpha\.1$/);
  assert.deepEqual(pkg.dsh.client?.inject, [
    '@deepseek-ai/dsh-client-store',
    '@deepseek-ai/dsh-client-ui-settings',
  ]);
});

test('commits compiled lib entries without reader-face or 0.1.7-only seams', () => {
  assert.equal(pkg.scripts?.prepare, undefined);
  assert.equal(pkg.main, 'lib/dsh-tidy-display.js');
  const client = pkg.exports['./client'];
  assert.equal(typeof client === 'object' && client !== null ? client.default : client, './lib/client.js');
  const clientJs = readFileSync(resolve(root, 'lib/client.js'), 'utf8');
  assert.match(clientJs, /window\.__ModuleLoader__\.load/);
  assert.match(clientJs, /id:\s*"@drscrewdriver\/dsh-tidy-display"/);
  assert.match(clientJs, /settings\.plugins\.tab/);
  assert.match(clientJs, /dsh\.reader\.v1/);
  assert.match(clientJs, /加载更早/);
  assert.match(clientJs, /data-chat-anchor-key/);
  assert.doesNotMatch(clientJs, /volatile\(/);
  assert.doesNotMatch(clientJs, /McpAppFrame/);
  assert.doesNotMatch(clientJs, /frostedGlass/);
  const hostJs = readFileSync(resolve(root, 'lib/dsh-tidy-display.js'), 'utf8');
  assert.match(hostJs, /tidy-display/);
  assert.match(hostJs, /installSection/);
  assert.match(hostJs, /register/);
  assert.doesNotMatch(hostJs, /\.volatile/);
  assert.doesNotMatch(hostJs, /@deepseek-ai\/schemastery/);
});

test('README leads with the legacy install one-liner and the compat scope', () => {
  for (const name of ['README.md', 'README.en.md']) {
    const text = readFileSync(resolve(root, name), 'utf8');
    assert.match(text, /dsh plugin --profile web add github:drscrewdriver\/dsh-tidy-display#v0\.1\.0-dsh0\.1\.2/);
    assert.match(text, /pnpm/);
    assert.doesNotMatch(text, /阅读视图/);
    assert.doesNotMatch(text, /reading view/);
  }
});
