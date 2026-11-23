/**
 * Mermaid fence takeover tests — the two decision surfaces that must agree:
 * `resolveFenceKind` (banner path, Reader + native channel) and
 * `looksLikeMermaidSource` (content path, native channel only — the host
 * replaces an unrecognized banner with a generic word, so the label is gone).
 *
 * The core contract is asymmetric on purpose: a **known** language banner is
 * never content-sniffed, so mermaid recognition can never hijack real code;
 * and a mermaid source never satisfies the dsh-ui JSON shape, so the two
 * content gates stay mutually exclusive.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { looksLikeMermaidSource, resolveFenceKind } from '../src/client/native-fence/discover.js';
import { isMermaidFence, normalizeSegmentLang } from '../src/client/segments/segment-decide.js';

const FLOW = 'graph LR\n  A[开始] --> B{判断}\n  B -->|是| C[渲染]';
const SEQ = 'sequenceDiagram\n  A->>B: hi';
const PIE = 'pie title 占比\n  "a" : 40';

test('isMermaidFence: 标签归一大写/尾标点,拒绝普通语言', () => {
  assert.equal(isMermaidFence('mermaid'), true);
  assert.equal(isMermaidFence('MERMAID'), true);
  assert.equal(isMermaidFence(' Mermaid '), true);
  // normalizeSegmentLang 剥非字母/连字符:'mermaid>' → 'mermaid'
  assert.equal(isMermaidFence('mermaid>'), true);
  assert.equal(isMermaidFence('js'), false);
  assert.equal(isMermaidFence('dsh-ui'), false);
  assert.equal(isMermaidFence(undefined), false);
  assert.equal(normalizeSegmentLang('mermaid>'), 'mermaid');
});

test('resolveFenceKind: mermaid 横幅 settle 出图,流式让位源码块', () => {
  assert.equal(resolveFenceKind(FLOW, 'mermaid', true), 'mermaid');
  assert.equal(resolveFenceKind(SEQ, 'mermaid>', true), 'mermaid');
  assert.equal(resolveFenceKind(FLOW, 'MERMAID', true), 'mermaid');
  // 流式期不换图:引擎每帧重渲 SVG 既贵又抖
  assert.equal(resolveFenceKind(FLOW, 'mermaid', false), 'skip');
});

test('resolveFenceKind: known 真语言永不因图源形状被劫持', () => {
  // mermaid 源码落在 python/js 围栏里(注释/变量名恰好像图类型)必须照旧 skip
  assert.equal(resolveFenceKind(FLOW, 'python', true), 'skip');
  assert.equal(resolveFenceKind(FLOW, 'js', true), 'skip');
  assert.equal(resolveFenceKind(FLOW, 'text', true), 'skip');
  // generic/无标签也不会被 resolveFenceKind 认成 mermaid(留给通道层内容识别)
  assert.equal(resolveFenceKind(FLOW, '代码块', true), 'skip');
  assert.equal(resolveFenceKind(FLOW, null, true), 'skip');
});

test('resolveFenceKind: mermaid 不吃掉 dsh-ui / vcp 的既有判定', () => {
  assert.equal(resolveFenceKind('{"items":[]}', 'dsh-ui', true), 'ui');
  assert.equal(resolveFenceKind('<div id="vcp-root" style="x">…</div>', 'html', true), 'vcp');
  // 图源不是 JSON spec,也不是 vcp 前缀
  assert.equal(resolveFenceKind(FLOW, 'html', true), 'skip');
});

test('looksLikeMermaidSource: 各图类型首行声明', () => {
  for (const src of [FLOW, SEQ, PIE,
    'flowchart TD\n  A --> B',
    'classDiagram\n  A <|-- B',
    'stateDiagram-v2\n  [*] --> A',
    'erDiagram\n  A ||--o{ B : has',
    'gantt\n  title 排期',
    'gitGraph\n  commit',
    'mindmap\n  root',
    'timeline\n  title 时间线',
    'quadrantChart\n  x-axis a b',
    'xychart-beta\n  bar [1,2]',
  ]) {
    assert.equal(looksLikeMermaidSource(src), true, src.split('\n')[0] ?? src);
  }
});

test('looksLikeMermaidSource: 剥 frontmatter / init 指令后仍认', () => {
  assert.equal(looksLikeMermaidSource('---\ntitle: 图\n---\ngraph LR\n  A-->B'), true);
  assert.equal(looksLikeMermaidSource('%%{init: {"theme":"dark"}}%%\ngraph TD\n  A-->B'), true);
});

test('looksLikeMermaidSource: 普通代码与碎片不误判', () => {
  // 单独一个 graph 不是合法图(必须带方向)
  assert.equal(looksLikeMermaidSource('graph\n  A-->B'), false);
  assert.equal(looksLikeMermaidSource('graphFromNode(x)\nreturn y'), false);
  // 太短
  assert.equal(looksLikeMermaidSource('pie'), false);
  assert.equal(looksLikeMermaidSource(''), false);
  // 真代码
  assert.equal(looksLikeMermaidSource('const graph = buildGraph()\nrender(graph)'), false);
  assert.equal(looksLikeMermaidSource('def classify(x):\n    return x'), false);
  assert.equal(looksLikeMermaidSource('{"items":[]}'), false);
  assert.equal(looksLikeMermaidSource('<div id="vcp-root"></div>'), false);
  // 未闭合 frontmatter / init 不猜
  assert.equal(looksLikeMermaidSource('---\ntitle: 图\ngraph LR\n A-->B'), false);
  assert.equal(looksLikeMermaidSource('%%{init: {}}%'), false);
});

test('looksLikeMermaidSource 与 dsh-ui JSON 形状互斥', () => {
  const spec = '{"items":[{"type":"mermaid","code":"graph LR"}]}';
  assert.equal(looksLikeMermaidSource(spec), false);
  // 反向:图源不可能是合法 spec 顶层
  assert.ok(!FLOW.trimStart().startsWith('{'));
});
