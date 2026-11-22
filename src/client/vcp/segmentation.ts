/**
 * VCP text segmentation — ported from dsh-raw-html-v2 lib/client.js 2463-2688
 * (which itself is the React-ized port of v1 v6-inject.js balancing logic).
 *
 * Pure string functions with zero external dependencies. `splitVcpText` cuts one
 * assistant text into segments: md prose, closed `vcp-root` card HTML, a streaming
 * `pending` tail (open tag seen, card not closed yet), and full `page` HTML
 * documents (<!DOCTYPE html>…</html>). `splitMermaidFence` additionally lifts
 * ```mermaid fences out of md segments as engine-ready HTML.
 *
 * Port notes (vs upstream):
 * - The two /g regexes (PAGE_OPEN_RE, MERMAID_FENCE_RE) become per-call literals
 *   here. Upstream reused module-level state with manual `lastIndex` resets; fresh
 *   literals keep identical matching semantics without shared mutable state.
 * - `hasScriptTag` is a tidy-display addition: sandbox routing for cards whose
 *   HTML carries <script> (we never eval in the page — see bootstrap/plan §5).
 */

export type VcpSegment =
  | { type: 'md'; text: string }
  | { type: 'vcp'; html: string }
  | { type: 'pending'; text: string }
  | { type: 'page'; html?: string; text?: string }
  | { type: 'mermaid'; html: string }

/** 标签级扫描:从 html 的 openEnd 起配平 <div>…</div> 嵌套,返回闭合点;未闭合 end=-1。
 *  depth 初始 1:根 <div id="vcp-root"> 的开标签在 openEnd 之前,已计入一层。 */
function scanVcpDiv(html: string, openEnd: number): { start: number; end: number } {
  let depth = 1
  let i = openEnd
  const len = html.length
  while (i < len) {
    const lt = html.indexOf('<', i)
    if (lt === -1) break
    if (html.startsWith('<!--', lt)) {
      const ce = html.indexOf('-->', lt + 4)
      if (ce === -1) break
      i = ce + 3
      continue
    }
    const gt = html.indexOf('>', lt + 1)
    if (gt === -1) break
    const raw = html.slice(lt, gt + 1)
    const name = /^<\s*\/?\s*([a-zA-Z][a-zA-Z0-9-]*)/.exec(raw)
    const isClose = /^<\s*\//.test(raw)
    const selfClose = /\/\s*>$/.test(raw) || /^<\s*(?:!|meta|link|br|hr|img|input|source|area|base|col|embed|track|wbr)\b/i.test(raw)
    if (name && !isClose && !selfClose) {
      const nm = name[1].toLowerCase()
      if (nm === 'div') depth += 1
      else if (/^(script|style|textarea|title)$/.test(nm)) {
        // 跳过 RAW 文本元素(其内容里的 </div> 不是标签)
        const closer = html.toLowerCase().indexOf('</' + nm + '>', gt + 1)
        if (closer === -1) break
        i = closer + nm.length + 3
        continue
      }
    } else if (isClose && name) {
      if (name[1].toLowerCase() === 'div') {
        depth -= 1
        if (depth <= 0) return { start: -1, end: gt + 1 }
      }
    }
    i = gt + 1
  }
  return { start: -1, end: -1 }
}

/** 找 <div … id="vcp-root" …> 开标签(属性顺序任意),要求位于行首(行首到标签起点
 *  只允许空白/制表)——markdown 说明文字/行内提及的字样不是卡片,不得误切。 */
function findVcpOpen(text: string, from: number): { start: number; end: number } | null {
  const re = /<div\b[^>]*?\bid\s*=\s*["']vcp-root["'][^>]*>/gi
  re.lastIndex = from
  let m: RegExpExecArray | null = null
  while ((m = re.exec(text))) {
    const lineStart = text.lastIndexOf('\n', m.index - 1) + 1
    if (/^[ \t]*$/.test(text.slice(lineStart, m.index))) {
      return { start: m.index, end: re.lastIndex }
    }
    // 行内/说明文字中的字样 → 跳过继续找
  }
  return null
}

/** 紧跟闭合点之后(允许空白)吞并同属卡片的 <style>/<script> 兄弟块;未闭合的也吞到
 *  文尾(流式半截交给引擎 RAWTEXT 跨帧续接),保证 script 不落 md 段被转义显示。 */
function swallowTrailingRaw(text: string, end: number): number {
  let pos = end
  while (pos < text.length) {
    let i = pos
    while (i < text.length && /\s/.test(text[i])) i++
    const m = /^<(style|script)\b[\s\S]*?(?:<\/\1>|$)/i.exec(text.slice(i))
    if (!m || m[0].length === 0) return pos
    pos = i + m[0].length
  }
  return pos
}

/** 整页 HTML 起点:<!DOCTYPE html> / <html …>,须行首出现(前导换行归 md 段)。 */
function findPageOpen(text: string, from: number): { start: number; tagEnd: number } | null {
  const re = /(?:^|[\r\n]{1,2})(<!doctype\s+html\b[^>]*>|<html\b[^>]*>)/gi
  re.lastIndex = from
  const m = re.exec(text)
  if (!m) return null
  const tag = m[1] || m[2]
  return { start: m.index + m[0].length - tag.length, tagEnd: m.index + m[0].length }
}

/** 页面闭合点:</html>(未闭合返回 -1,流式中途)。 */
function scanPageEnd(text: string, after: number): number {
  const m = /<\/html\s*>/i.exec(text.slice(after))
  return m ? after + m.index + m[0].length : -1
}

/** 页面样式脱敏:style 内独立 html/body 选择器 → .vcp-page-host(防全局污染)。 */
export function scopePageCss(html: string): string {
  return String(html || '').replace(/<style\b[^>]*>([\s\S]*?)(?:<\/style>|$)/gi, (all, css: string) => {
    const fixed = css.replace(/(^|[,}\s>])(html|body)(?=[\s,.#:>\[{])/gi, '$1.vcp-page-host')
    return fixed === css ? all : all.replace(css, fixed)
  })
}

/** md 段里的 ```mermaid 围栏 → 转 <pre><code class="language-mermaid"> 喂引擎
 *  (code 带 class——引擎 pre>code 分支为实测成功路径)。 */
export function splitMermaidFence(md: string): Array<{ type: 'md'; text: string } | { type: 'mermaid'; html: string }> {
  const out: Array<{ type: 'md'; text: string } | { type: 'mermaid'; html: string }> = []
  const t = String(md || '')
  const re = /(^|\n)[ \t]*```[ \t]*mermaid[ \t]*\n([\s\S]*?)\n[ \t]*```[ \t]*(?=\n|$)/gi
  let last = 0
  let m: RegExpExecArray | null = null
  while ((m = re.exec(t))) {
    const start = m.index + m[1].length
    if (start > last) out.push({ type: 'md', text: t.slice(last, start) })
    const esc = m[2].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    out.push({ type: 'mermaid', html: '<pre><code class="language-mermaid">' + esc + '</code></pre>' })
    last = m.index + m[0].length
  }
  if (last < t.length) out.push({ type: 'md', text: t.slice(last) })
  return out
}

/** 剥离 v1 锚点对齐的「纯围栏包装」:```html\n <卡> \n``` 时围栏行不进 md。 */
export function stripFenceWrapper(md: string): string {
  let t = String(md || '')
  t = t.replace(/^[ \t]*```[^\n]*\n+/, '')
  t = t.replace(/\n[ \t]*```[ \t]*\n?$/, '')
  return t
}

/** F1:剥掉 md 尾部「未完成开标签」(<div id="vcp-r…),防流式起始闪一帧源码;
 *  仅剥字母开头的未闭合标签样尾巴,不误伤 'a < b';多层半截循环剥,上限 8 层。 */
export function trimTrailingOpenTag(s: string): string {
  let out = String(s || '')
  let guard = 0
  while (guard++ < 8) {
    const lt = out.lastIndexOf('<')
    if (lt === -1) break
    if (out.indexOf('>', lt) !== -1) break
    if (!/^<[a-zA-Z]/.test(out.slice(lt))) break
    out = out.slice(0, lt)
  }
  return out
}

/** 把一条 assistant text 切成段:vcp=闭合卡;pending=已开未闭合(流式);
 *  page=整页 HTML(未闭合则 text 存半截);md 段顺带剥围栏包装与未完成开标签。 */
export function splitVcpText(text: string): VcpSegment[] {
  const out: VcpSegment[] = []
  const t = String(text || '')
  let pos = 0
  let mdStart = 0
  while (pos < t.length) {
    const openV = findVcpOpen(t, pos)
    const openP = findPageOpen(t, pos)
    const useP = openP !== null && (openV === null || openP.start < openV.start)
    if (!openV && !openP) break
    const start = useP ? openP!.start : openV!.start
    if (start > mdStart) {
      const mdSeg = trimTrailingOpenTag(stripFenceWrapper(t.slice(mdStart, start)))
      if (mdSeg) out.push({ type: 'md', text: mdSeg })
    }
    if (useP) {
      const pEnd = scanPageEnd(t, openP!.tagEnd)
      if (pEnd === -1) {
        out.push({ type: 'page', text: t.slice(start) })
        mdStart = t.length
        break
      }
      out.push({ type: 'page', html: t.slice(start, pEnd) })
      mdStart = pEnd
      pos = pEnd
      continue
    }
    const scan = scanVcpDiv(t, openV!.end)
    if (scan.end === -1) {
      // 未闭合:id 完整出现而未闭合 → pending 尾巴,不再切分其后内容
      out.push({ type: 'pending', text: t.slice(openV!.start) })
      mdStart = t.length
      break
    }
    const end = swallowTrailingRaw(t, scan.end)
    out.push({ type: 'vcp', html: t.slice(openV!.start, end) })
    mdStart = end
    pos = end
  }
  if (mdStart < t.length) {
    const tailMd = trimTrailingOpenTag(stripFenceWrapper(t.slice(mdStart)))
    if (tailMd) out.push({ type: 'md', text: tailMd })
  }
  return out
}

/** tidy-display 新增:卡 HTML 是否携带 <script>(含流式未闭合)——此类卡改走
 *  McpAppFrame 沙箱 iframe,永不进主页面执行(计划 §决策「沙箱 iframe 承接」)。
 *  转义后的 &lt;script 不会命中;裸 <script(含未闭合半截)即判真。 */
export function hasScriptTag(html: string): boolean {
  return /<script[\s>]/i.test(String(html || ''))
}
