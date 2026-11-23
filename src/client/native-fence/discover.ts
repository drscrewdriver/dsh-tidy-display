/**
 * Native-fence discovery helpers — pure functions, no DOM, so node tests
 * exercise them directly.
 *
 * Ported (MIT; credited in THIRD_PARTY_NOTICES.md) from
 * `@changfenhuang/dsh-genui` `src/shared/fence-language.ts` and
 * `src/client/dom-fence.tsx`, slimmed to the dsh-ui/vcp channels this plugin
 * runs in the native conversation view. The DOM-walking half of discovery
 * lives in `channel.ts`; everything whose input is a string or number sits
 * here.
 */
import { looksLikeVcpHtmlBlock } from '../segments/segment-decide.js'
import { stripFenceWrapper } from '../vcp/segmentation.js'

/** 围栏开头的 `dsh-ui` 标签可能被带上尾部标点(```dsh-ui> / ```dsh-ui` 这类手滑),
 * 也可能写成无连字符别名 `dshui`。这类标记在宿主 DOM/mdast 里原样保留,严格相等
 * 判断会让整条围栏静默退化成普通代码块。别名义与 Reader 的
 * segments/segment-decide.ts(`[^a-z-]` 剥除后认 `dshui`)对齐——双通道对同一
 * 围栏必须同判。只吸收**标签之后**的标点,`dsh-ui-something` 这类真实语言名不受影响。 */
const GENUI_LABEL_PATTERN = /^(dsh-ui|dshui)$/;
const GENUI_TRAILING_PUNCTUATION = /[>`"'.,;:)\]】」』]+$/;

/** Normalize a host fence-language label to the GenUI spelling. */
export function normalizeFenceLanguage(lang: string): string {
  const trimmed = lang.trim();
  if (GENUI_LABEL_PATTERN.test(trimmed.toLowerCase())) return 'dsh-ui';
  const stripped = trimmed.replace(GENUI_TRAILING_PUNCTUATION, '').trim().toLowerCase();
  if (GENUI_LABEL_PATTERN.test(stripped)) return 'dsh-ui';
  return lang;
}

/** True when the normalized label names the dsh-ui fence. */
export function isDshUiLanguage(lang: string | null | undefined): boolean {
  return typeof lang === 'string' && normalizeFenceLanguage(lang) === 'dsh-ui';
}

/**
 * Known real language identifiers — a closed set owned by the plugin. The
 * complement (empty labels and localized generic banner words like
 * `Code` / `代码块` / «Код») is unbounded, so the verdict inverts: only a
 * KNOWN label counts as "has a language"; everything else goes through
 * content recognition, keeping rendering identical across host locales
 * (genui issue #258).
 */
const KNOWN_LANGUAGE_LABELS = new Set([
  // 插件自有语言
  'dsh-ui',
  // 数据 / 标记 / 纯文本
  'json', 'json5', 'yaml', 'yml', 'toml', 'ini', 'xml', 'html', 'css', 'scss', 'sass', 'less',
  'markdown', 'md', 'text', 'txt', 'plain', 'plaintext', 'log', 'console', 'diff', 'patch',
  // 助手回复里常见的编程语言
  'js', 'jsx', 'javascript', 'ts', 'tsx', 'typescript', 'python', 'py', 'bash', 'sh', 'shell', 'zsh',
  'sql', 'graphql', 'gql', 'rust', 'go', 'golang', 'java', 'kotlin', 'kt', 'swift', 'scala', 'dart',
  'c', 'h', 'cpp', 'c++', 'cxx', 'cs', 'csharp', 'php', 'ruby', 'rb', 'perl', 'lua', 'r', 'matlab',
  'haskell', 'hs', 'elixir', 'ex', 'erlang', 'clojure', 'clj', 'groovy', 'objc', 'objective-c',
  'dockerfile', 'docker', 'makefile', 'make', 'cmake', 'protobuf', 'proto',
]);

/**
 * Verdict for a code-block banner label:
 * - `'dsh-ui'`  — takeover by label;
 * - `'known'`   — a real non-GenUI language; never content-sniffed;
 * - `'generic'` — empty or a localized banner word → content recognition decides.
 */
export function labelVerdict(label: string): 'dsh-ui' | 'known' | 'generic' {
  const normalized = normalizeFenceLanguage(label).toLowerCase();
  if (normalized.startsWith('dsh-ui')) return 'dsh-ui';
  if (normalized === 'dshui') return 'dsh-ui';
  if (KNOWN_LANGUAGE_LABELS.has(normalized)) return 'known';
  return 'generic';
}

/** 流式占位门:围栏体还是半张 dsh-ui spec。要求 spec 形状(带 items/type/title/panel
 *  的对象),流式中的 ```json 代码块不会被误接管。 */
export function looksLikeGenuiInProgress(raw: string): boolean {
  const text = raw.trimStart();
  if (text.length < 8 || !text.startsWith('{')) return false;
  return /"(items|type|title|panel)"\s*:/.test(text);
}

/**
 * Mermaid 图源识别——只用于**无标签/通用横幅**的块。
 *
 * 宿主对没有语法高亮的语言把横幅文字换成通用词(实测 `supportsHighlighting`
 * 为假的 mermaid 横幅显示 «代码块»/«Code»,原始 lang 不进 DOM),所以原生通道
 * 拿不到 `mermaid` 这个标签,只能认图源。第一行是图类型声明——这是 mermaid
 * 的语法硬约束,不是启发式猜测:
 *
 * - `graph`/`flowchart` 必须带方向(TB/TD/BT/RL/LR),单独一个 `graph` 不算;
 * - 其余关键字是各图类型的唯一入口(`sequenceDiagram`/`erDiagram`/`gantt`…);
 * - 允许开头的 YAML frontmatter(`---` 到闭合 `---`)与 `%%{init}%%` 指令行;
 * - 最短长度 12,单行 `pie` 这种碎片不进图。
 *
 * 已知真语言的围栏在 `resolveFenceKind` 里早就短路了,永远到不了这里——
 * 所以 `python`/`sh` 里出现 `graph` 也绝不被劫持。
 */
const MERMAID_HEAD = /^(?:graph|flowchart)\s+(?:TB|TD|BT|RL|LR)\b|^(?:sequenceDiagram|classDiagram(?:-v2)?|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|quadrantChart|xychart-beta|requirementDiagram|gitGraph|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|mindmap|timeline|zenuml|sankey-beta|packet-beta|block-beta|architecture-beta|kanban|radar-beta|treemap-beta)\b/;

export function looksLikeMermaidSource(raw: string): boolean {
  let text = String(raw ?? '').trim();
  if (text.length < 12) return false;
  // 前置 frontmatter / init 指令:逐段剥掉再认第一行。
  for (let guard = 0; guard < 4; guard += 1) {
    if (text.startsWith('%%{')) {
      const close = text.indexOf('}%%');
      if (close === -1) return false;
      text = text.slice(close + 3).trim();
      continue;
    }
    if (text.startsWith('---')) {
      const close = text.indexOf('\n---', 3);
      if (close === -1) return false;
      text = text.slice(close + 4).trim();
      continue;
    }
    break;
  }
  return MERMAID_HEAD.test(text);
}

/**
 * Stable source identity for a settled fence — genui's scheme
 * (`dom:<anchor>:<ordinal>`) kept verbatim so identities stay stable if a
 * future version ever needs to reconcile state across channels.
 */
export function fenceIdentity(anchorKey: string, ordinal: number): string {
  return `dom:${anchorKey}:${ordinal}`;
}

/**
 * Key-order-insensitive JSON serialization for semantic equality. Object keys
 * sort; array order stays semantic. The guard's normalization rebuilds
 * objects in its own canonical key order (e.g. a model-written
 * `{type, tone, content}` callout comes back `{type, content, tone}`), so
 * content recognition MUST compare canonically — a raw `JSON.stringify`
 * equality rejects semantically identical specs whose key order differs
 * (real-world miss: one ranking card rendered, the next fell back to a code
 * block because a callout carried `tone` before `content`).
 */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

/** 通道接管面——kind 决定挂载组件与流式语义。 */
export type FenceKind =
  | 'ui'            // settled dsh-ui → DshUiCard(全量解析,失败走校验折叠)
  | 'vcp'           // settled vcp 卡/页面 → VcpHtmlSegments(全量分段)
  | 'mermaid'       // settled ```mermaid → 引擎懒加载出图(失败退源码框)
  | 'streaming-ui'  // 流式 dsh-ui → 占位卡(与 Reader streaming 契约一致)
  | 'streaming-vcp' // 流式 vcp → 流式分段(pending 卡)
  | 'skip';

/** ```mermaid 横幅判定(大小写 + 尾部标点容错,与 dsh-ui 的别名口径同源)。
 *  只认显式标签:图源内容和普通代码没有互斥特征(`graph`/`class` 都是合法
 *  标识符),对无标签块做内容嗅探会把真代码劫持成报错图。 */
function isMermaidLabel(label: string): boolean {
  const stripped = label.trim().replace(GENUI_TRAILING_PUNCTUATION, '').trim().toLowerCase();
  return stripped === 'mermaid';
}

/**
 * 围栏接管判定——Reader(mdast 分发)与原生 DOM 通道共用同一语义来源。
 *
 * 横幅裁决先行(genui #258 口径,0.5.2 实测踩实):宿主对不认识的语言渲染
 * 本地化通用横幅(`代码块`/`Code`/«Код»…),这是呈现文案不是语义——generic
 * 判定落回内容识别;已知真语言(json/python/…)才短路不嗅探。
 *
 * - `dsh-ui`(含 `dshui` 别名/尾部标点)→ dsh-ui 通道;
 * - `html` → 围栏体剥壳后以 vcp-root 卡/整页文档开头才接管(普通 ```html
 *   代码块绝不劫持);
 * - `mermaid` → settle 后出图;流式期让位源码块(引擎每帧重渲 SVG 既贵又抖);
 * - 其他已知语言 → skip;
 * - generic/无标签 → settle 期认 vcp 前缀,流式期认 vcp 前缀与 dsh-ui JSON
 *   形状;JSON 的严格内容识别需要守卫(非纯),留在通道层。
 */
export function resolveFenceKind(body: string, label: string | null, settled: boolean): FenceKind {
  let effective: string | null = null;
  if (label !== null && label !== '') {
    const norm = normalizeFenceLanguage(label).toLowerCase();
    if (norm === 'dsh-ui' || norm === 'dshui') effective = 'dsh-ui';
    else if (norm === 'html') effective = 'html';
    else if (isMermaidLabel(label)) effective = 'mermaid';
    else if (labelVerdict(label) === 'known') return 'skip';
    // generic 横幅词 → effective 保持 null,内容判定接管决策
  }
  if (effective === 'dsh-ui') return settled ? 'ui' : 'streaming-ui';
  if (effective === 'mermaid') return settled ? 'mermaid' : 'skip';
  if (effective === 'html') {
    return looksLikeVcpHtmlBlock(stripFenceWrapper(body)) ? (settled ? 'vcp' : 'streaming-vcp') : 'skip';
  }
  const text = body.trimStart();
  if (looksLikeVcpHtmlBlock(text)) return settled ? 'vcp' : 'streaming-vcp';
  if (!settled && looksLikeGenuiInProgress(body)) return 'streaming-ui';
  return 'skip';
}
