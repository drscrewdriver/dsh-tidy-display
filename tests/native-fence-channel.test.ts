import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const channel = readFileSync(resolve(root, 'src/client/native-fence/channel.ts'), 'utf8');

test('native fence channel mounts the replacement BEFORE hiding the stock block', () => {
  // issue #19 guard: every failure path between createRoot and the hide must
  // restore/remove, and the hide itself must come after a successful render.
  const mountIdx = channel.indexOf('function mountBlock(block: HTMLElement): void {');
  assert.ok(mountIdx > 0, 'mountBlock exists');
  const body = channel.slice(mountIdx, channel.indexOf('\n  }\n', mountIdx));
  const renderIdx = body.indexOf('renderMount(block, mount, raw, settled');
  const hideIdx = body.indexOf("block.style.display = 'none'");
  assert.ok(renderIdx > 0 && hideIdx > renderIdx, 'render precedes hide inside mountBlock');
});

test('native fence channel never reaches into the Reader subtrees or genui mounts', () => {
  // Coexistence contract: the Reader's mdast pipeline owns fences there, and
  // genui's own channel keeps its blocks.
  assert.match(channel, /\[data-reader-answer\]/);
  assert.match(channel, /\[data-reader-turn\]/);
  assert.match(channel, /\[data-genui-rendered\]/);
  assert.match(channel, /genui-dom-fence/);
});

test('native fence channel keys interaction state away from the Reader', () => {
  // DshUiCard composes `${channel}:${segKey}`; the native channel passes the
  // `native` surface so persisted GenuiBlock state never crosses views.
  assert.match(channel, /channel: 'native'/);
  const card = readFileSync(resolve(root, 'src/client/segments/DshUiCard.tsx'), 'utf8');
  assert.match(card, /channel = 'reader'/);
  assert.match(card, /stateKey=\{`\$\{channel\}:\$\{segKey\}`\}/);
});

test('native fence channel gates on segmentCards through the install seam', () => {
  const index = readFileSync(resolve(root, 'src/client/index.tsx'), 'utf8');
  assert.match(index, /installNativeFenceChannel\(\{ getEnabled: \(\) => segmentPrefsSnapshot\(\)\.segmentCards \}\)/);
  assert.match(index, /channel\.setEnabled\(segmentPrefsSnapshot\(\)\.segmentCards\)/);
  assert.match(channel, /disposed \|\| !running \|\| !getEnabled\(\)/);
});

test('native fence channel mounts VCP segments through the shared face', () => {
  // 双视图同一份分段渲染: Reader 的 VcpHtmlSegments 被 native 通道复用
  const render = readFileSync(resolve(root, 'src/client/markdown/render.tsx'), 'utf8');
  assert.match(render, /export function VcpHtmlSegments/);
  assert.match(channel, /import \{ VcpHtmlSegments \} from '\.\.\/markdown\/render\.js'/);
  // kind 分支:ui/streaming-ui 走 DshUiCard,vcp/streaming-vcp 走 VcpHtmlSegments
  assert.match(channel, /kind === 'ui' \|\| kind === 'streaming-ui'/);
  assert.match(channel, /createElement\(VcpHtmlSegments, \{/);
});

test('escaped-text fallback keeps the text-only gate and code-context exclusion', () => {
  assert.match(channel, /function findEscapedVcpContainers/);
  assert.match(channel, /!isTextOnlyContainer\(block\) \|\| block\.closest\(CODE_CONTEXT\) !== null/);
  // 转义文本分支只认 vcp 前缀,不嗅探 JSON(判定在通道 decide,不在 discover)
  assert.match(channel, /if \(textCandidates\.has\(block\)\) return resolveFenceKind\(raw, null, settled\)/);
  const discover = readFileSync(resolve(root, 'src/client/native-fence/discover.ts'), 'utf8');
  assert.match(discover, /export function resolveFenceKind\(body: string, label: string \| null, settled: boolean\)/);
});
