import { test } from 'node:test';
import assert from 'node:assert/strict';
import { callDiffHunks, DIFF_FALLBACK_TOOLS, diffTotals } from '../src/client/tool-activity.ts';
import type { ToolCallBlock } from '@deepseek-ai/dsh-client-ui-conversation/client';

test('diff argument fallback is whitelisted to write/edit/str_replace_editor', () => {
  assert.deepEqual([...DIFF_FALLBACK_TOOLS], ['write', 'edit', 'str_replace_editor']);
});

test('meta.diffs wins; memory-like content fields do not invent counts', () => {
  const fromMeta = callDiffHunks({
    kind: 'tool-result',
    callId: 'w1',
    time: 1,
    callTime: 0,
    content: [],
    isError: false,
    meta: { diffs: [{ path: 'a.ts', oldText: 'old\n', newText: 'new\nline\n' }] },
    call: { name: 'write', argsRaw: '{"path":"a.ts","content":"ignored"}' },
    subCalls: [],
  } as unknown as ToolCallBlock, { path: 'a.ts', content: 'ignored' }, 'write');
  assert.equal(fromMeta.length, 1);
  assert.equal(fromMeta[0]?.path, 'a.ts');

  const note = callDiffHunks(undefined, { content: 'line1\nline2\nline3\nline4\nline5' }, 'memory_note_pre');
  assert.deepEqual(note, []);
  assert.equal(diffTotals(undefined, { content: 'a\nb\nc' }, 'memory_note_pre'), null);
});

test('write/edit/str_replace_editor fall back to arguments; parent rolls up subCalls', () => {
  const write = callDiffHunks(undefined, { path: 'src/a.ts', content: 'one\ntwo\n' }, 'write');
  assert.equal(write.length, 1);
  assert.equal(write[0]?.path, 'src/a.ts');

  const parent = callDiffHunks({
    kind: 'tool-result',
    callId: 'run',
    time: 1,
    callTime: 0,
    content: [],
    isError: false,
    meta: {},
    call: { name: 'run_code', argsRaw: '{}' },
    subCalls: [{
      kind: 'tool-result',
      callId: 'child',
      time: 1,
      callTime: 0,
      content: [],
      isError: false,
      meta: {},
      call: { name: 'edit', argsRaw: '{"path":"nested.ts","old_string":"a\\n","new_string":"b\\nc\\n"}' },
      subCalls: [],
    }],
  } as unknown as ToolCallBlock, {}, 'run_code');
  assert.equal(parent.some(hunk => hunk.path === 'nested.ts'), true);
});
