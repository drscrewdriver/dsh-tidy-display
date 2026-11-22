import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  fenceIdentity,
  isDshUiLanguage,
  labelVerdict,
  looksLikeGenuiInProgress,
  normalizeFenceLanguage,
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
