import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canonicalJson,
  fenceIdentity,
  isDshUiLanguage,
  labelVerdict,
  looksLikeGenuiInProgress,
  normalizeFenceLanguage,
  resolveFenceKind,
} from '../src/client/native-fence/discover.js';

test('normalizeFenceLanguage canonicalizes the dsh-ui label', () => {
  assert.equal(normalizeFenceLanguage('dsh-ui'), 'dsh-ui');
  assert.equal(normalizeFenceLanguage('  dsh-ui  '), 'dsh-ui');
  assert.equal(normalizeFenceLanguage('DSH-UI'), 'dsh-ui');
  // 尾部标点手滑(真实会话一条消息 182 处的形态)
  assert.equal(normalizeFenceLanguage('dsh-ui>'), 'dsh-ui');
  assert.equal(normalizeFenceLanguage('dsh-ui`'), 'dsh-ui');
  assert.equal(normalizeFenceLanguage('dsh-ui】'), 'dsh-ui');
  // 真实语言名不受影响
  assert.equal(normalizeFenceLanguage('dsh-ui-widget'), 'dsh-ui-widget');
  assert.equal(normalizeFenceLanguage('json'), 'json');
});

test('isDshUiLanguage accepts aliases and rejects other languages', () => {
  assert.equal(isDshUiLanguage('dsh-ui'), true);
  assert.equal(isDshUiLanguage('dshui'), true);
  assert.equal(isDshUiLanguage('dsh-ui>'), true);
  assert.equal(isDshUiLanguage('json'), false);
  assert.equal(isDshUiLanguage(null), false);
  assert.equal(isDshUiLanguage(undefined), false);
});

test('labelVerdict routes banners: dsh-ui by label, known languages gated, generic words to content recognition', () => {
  assert.equal(labelVerdict('dsh-ui'), 'dsh-ui');
  assert.equal(labelVerdict('代码块'), 'generic');
  assert.equal(labelVerdict('Code'), 'generic');
  assert.equal(labelVerdict(''), 'generic');
  // 已知真实语言:内容识别不得接管普通代码块
  assert.equal(labelVerdict('json'), 'known');
  assert.equal(labelVerdict('python'), 'known');
  assert.equal(labelVerdict('ts'), 'known');
});

test('looksLikeGenuiInProgress fires only on spec-shaped JSON bodies', () => {
  assert.equal(looksLikeGenuiInProgress('{"items":[{"type":"table"}'), true);
  assert.equal(looksLikeGenuiInProgress('{"type":"stat","label":"x"'), true);
  assert.equal(looksLikeGenuiInProgress('{"title":"前 15 名","items":'), true);
  assert.equal(looksLikeGenuiInProgress('{"panel":true}'), true);
  // 普通代码/短文本/非对象绝不触发
  assert.equal(looksLikeGenuiInProgress('const x = {"a":1};'), false);
  assert.equal(looksLikeGenuiInProgress('{"a":1}'), false);
  assert.equal(looksLikeGenuiInProgress('{"it'), false);
  assert.equal(looksLikeGenuiInProgress('[1,2,3]'), false);
  assert.equal(looksLikeGenuiInProgress(''), false);
});

test('fenceIdentity keeps the genui dom identity scheme', () => {
  assert.equal(fenceIdentity('seq-42', 1), 'dom:seq-42:1');
  assert.equal(fenceIdentity('unknown', 3), 'dom:unknown:3');
});

test('canonicalJson is key-order-insensitive but array-order-sensitive', () => {
  // 守卫归一化会重排对象键序(真实事故:callout 的 tone 在 content 前被重排)——
  // 语义相等必须按规范化比较,否则同一份 spec 时而接管时而让位。
  const modelWritten = { type: 'callout', tone: 'success', content: 'x' };
  const guardNormalized = { type: 'callout', content: 'x', tone: 'success' };
  assert.equal(canonicalJson(modelWritten), canonicalJson(guardNormalized));
  // 数组顺序是语义(items/rows),不得排序
  assert.notEqual(canonicalJson({ items: [1, 2] }), canonicalJson({ items: [2, 1] }));
  // 需修复才合法的正文仍然可见差异(别名改写/字段增删都逃不过)
  assert.notEqual(canonicalJson({ type: 'table', headers: ['a'] }), canonicalJson({ type: 'table', columns: ['a'] }));
  assert.notEqual(canonicalJson({ type: 'callout', content: 'x' }), canonicalJson({ type: 'callout', content: 'x', extra: 1 }));
  assert.equal(canonicalJson({ b: 1, a: { d: [2, { c: 1 }] } }), '{"a":{"d":[2,{"c":1}]},"b":1}');
});

test('resolveFenceKind: labeled dsh-ui routes to the ui channel', () => {
  assert.equal(resolveFenceKind('{"items":[]}', 'dsh-ui', true), 'ui');
  assert.equal(resolveFenceKind('{"items":[{"type":"tab', 'dsh-ui', false), 'streaming-ui');
  assert.equal(resolveFenceKind('{"items":[]}', 'dsh-ui>', true), 'ui');
  assert.equal(resolveFenceKind('{"items":[]}', 'dshui', true), 'ui');
});

test('resolveFenceKind: labeled html only for vcp-root cards/pages, never ordinary html', () => {
  assert.equal(resolveFenceKind('<div id="vcp-root" style="x">…</div>', 'html', true), 'vcp');
  assert.equal(resolveFenceKind('<div id="vcp-root" style="x">…</div>', 'html', false), 'streaming-vcp');
  assert.equal(resolveFenceKind('<!doctype html><html><body>…', 'html', true), 'vcp');
  // 普通 ```html 代码块绝不劫持
  assert.equal(resolveFenceKind('<p>hello</p>', 'html', true), 'skip');
  assert.equal(resolveFenceKind('const x = "<div>",', 'html', true), 'skip');
});

test('resolveFenceKind: other known languages are never content-sniffed', () => {
  assert.equal(resolveFenceKind('<div id="vcp-root">…</div>', 'json', true), 'skip');
  assert.equal(resolveFenceKind('{"items":[]}', 'python', true), 'skip');
});

test('resolveFenceKind: unlabeled settles via vcp prefix, streams via shape', () => {
  assert.equal(resolveFenceKind('<div id="vcp-root" style="x">…</div>', null, true), 'vcp');
  assert.equal(resolveFenceKind('<div id="vcp-root" style="x">…</div>', null, false), 'streaming-vcp');
  assert.equal(resolveFenceKind('{"items":[{"type":"table"}', null, false), 'streaming-ui');
  // JSON 严格内容识别在通道层(需守卫,非纯),无标签 settle 的 JSON 在此 skip
  assert.equal(resolveFenceKind('{"items":[]}', null, true), 'skip');
  assert.equal(resolveFenceKind('plain prose paragraph', null, true), 'skip');
  // 流式半截 vcp 开标签未成型 → 不猜
  assert.equal(resolveFenceKind('<div id="vcp-r', null, false), 'skip');
});
