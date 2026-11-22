/**
 * Native-fence discovery helpers — pure functions, no DOM, so node tests
 * exercise them directly.
 *
 * Ported (MIT; credited in THIRD_PARTY_NOTICES.md) from
 * `@changfenhuang/dsh-genui` `src/shared/fence-language.ts` and
 * `src/client/dom-fence.tsx`, slimmed to the dsh-ui-only channel this plugin
 * runs in the native conversation view. The DOM-walking half of discovery
 * lives in `channel.ts`; everything whose input is a string or number sits
 * here.
 */

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

/** Streaming placeholder gate: the body is a dsh-ui spec still arriving.
 * Requires the shape of a spec (an object carrying items/type/title/panel) so
 * a streaming ```json code block never gets taken over. */
export function looksLikeGenuiInProgress(raw: string): boolean {
  const text = raw.trimStart();
  if (text.length < 8 || !text.startsWith('{')) return false;
  return /"(items|type|title|panel)"\s*:/.test(text);
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
