import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  deliverableOpenModeOf,
  fileAddressFor,
  isFolderOpenPath,
  modeFromSnapshot,
  openDeliverableFile,
  resolveOpenWorkspacePath,
} from '../src/client/open-file.ts';

test('index still routes opens through #13 open-mode, not a forced sidebar', () => {
  const index = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../src/client/index.tsx'), 'utf8');
  assert.match(index, /modeFromSnapshot\(prefs\)/);
  assert.match(index, /openDeliverableFile/);
  assert.doesNotMatch(index, /openOnDesktop/);
  assert.doesNotMatch(index, /sidebarRight\.openResource!\(address\)/);
});

test('deliverable open mode defaults to external', () => {
  assert.equal(deliverableOpenModeOf(undefined), 'external');
  assert.equal(deliverableOpenModeOf('external'), 'external');
  assert.equal(deliverableOpenModeOf('sidebar'), 'sidebar');
  assert.equal(deliverableOpenModeOf('other'), 'external');
  assert.equal(modeFromSnapshot(undefined), 'external');
  assert.equal(modeFromSnapshot({ getSnapshot: () => ({}) }), 'external');
});

test('folder affordances stay on the OS path', () => {
  assert.equal(isFolderOpenPath('.'), true);
  assert.equal(isFolderOpenPath(''), true);
  assert.equal(isFolderOpenPath('src/a.ts'), false);
});

test('fileAddressFor matches official session-scoped grammar', () => {
  assert.equal(
    fileAddressFor('s1', '/repo', 'src/client/Reader.tsx'),
    'dsh-resource://file/session/s1/src/client/Reader.tsx',
  );
  assert.equal(
    fileAddressFor('s1', '/repo', '/repo/src/a.ts'),
    'dsh-resource://file/session/s1/src/a.ts',
  );
  assert.equal(
    fileAddressFor('id with space', undefined, 'notes and more.md'),
    'dsh-resource://file/session/id%20with%20space/notes%20and%20more.md',
  );
});

test('sidebar mode opens the right-panel address; external uses the system opener', async () => {
  const opened: string[] = [];
  const sidebar: string[] = [];
  const resolve = (cwd: string | undefined, path: string) => `${cwd ?? ''}/${path}`;

  assert.equal(await openDeliverableFile({
    path: 'a.ts',
    mode: 'external',
    sessionId: 's1',
    cwd: '/repo',
    resolveWorkspacePath: resolve,
    openExternal: async (path) => { opened.push(path); },
    openSidebar: (address) => { sidebar.push(address); },
  }), 'external');
  assert.deepEqual(opened, ['/repo/a.ts']);
  assert.deepEqual(sidebar, []);

  assert.equal(await openDeliverableFile({
    path: 'a.ts',
    mode: 'sidebar',
    sessionId: 's1',
    cwd: '/repo',
    resolveWorkspacePath: resolve,
    openExternal: async (path) => { opened.push(path); },
    openSidebar: (address) => { sidebar.push(address); },
  }), 'sidebar');
  assert.deepEqual(sidebar, ['dsh-resource://file/session/s1/a.ts']);
  assert.deepEqual(opened, ['/repo/a.ts']);
});

test('missing Sidebar API warns and falls back to the system opener', async () => {
  const warnings: string[] = [];
  const opened: string[] = [];
  assert.equal(await openDeliverableFile({
    path: 'a.ts',
    mode: 'sidebar',
    sessionId: 's1',
    cwd: '/repo',
    resolveWorkspacePath: (_cwd, path) => path,
    openExternal: async (path) => { opened.push(path); },
    warn: (message) => { warnings.push(message); },
  }), 'external');
  assert.deepEqual(opened, ['a.ts']);
  assert.match(warnings[0] ?? '', /sidebarRight.openResource is not available/);
});

test('workspace folder clicks stay external even when sidebar mode is on', async () => {
  const sidebar: string[] = [];
  const opened: string[] = [];
  assert.equal(await openDeliverableFile({
    path: '.',
    mode: 'sidebar',
    sessionId: 's1',
    cwd: '/repo',
    resolveWorkspacePath: (cwd, path) => `${cwd}/${path}`,
    openExternal: async (path) => { opened.push(path); },
    openSidebar: (address) => { sidebar.push(address); },
  }), 'external');
  assert.deepEqual(opened, ['/repo']);
  assert.deepEqual(sidebar, []);
  assert.equal(resolveOpenWorkspacePath('/repo', '.', (cwd, path) => `${cwd}/${path}`), '/repo');
});
