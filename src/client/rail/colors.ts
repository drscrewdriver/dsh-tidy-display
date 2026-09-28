/**
 * Rail color chain, ported from dsh-tidychat (release/0.1.7).
 *
 * resolveNavColors → applyNavColors write the resolved colors into root CSS
 * variables; the canvas redraw reads the variables instead of recomputing.
 * Principles kept from tidychat:
 * - auto bar color respects the theme token (label-caption), switching to a
 *   corrective gray only when contrast vs the real background is under 3:1;
 * - auto accent follows the theme brand color;
 * - tip contrast correction is conservative: only opaque tip backgrounds
 *   (alpha ≥ 0.85) with failing contrast get corrected; translucent/glass
 *   skins keep token following.
 */

export interface RailColorConfig {
  navColor: string;
  navColorCustom: string;
  navColorLight: string;
  navAccent: string;
  navAccentCustom: string;
  navAccentLight: string;
}

export const NAV_HUE_KEYS = ['gray', 'black', 'white', 'blue', 'violet', 'cyan', 'green', 'orange', 'red'] as const;
export const NAV_HUE_LABELS: Record<string, string> = {
  gray: '灰', black: '黑', white: '白', blue: '蓝', violet: '紫', cyan: '青', green: '绿', orange: '橙', red: '红',
};
export const NAV_HUE_PREVIEW: Record<string, string> = {
  gray: '#9e9e9e', black: '#111111', white: '#f5f5f5', blue: '#3b82f6', violet: '#8b5cf6', cyan: '#06b6d4', green: '#22c55e', orange: '#f97316', red: '#ef4444',
};
export const NAV_LIGHT_KEYS = ['l1', 'l2', 'l3', 'l4', 'l5'] as const;
export const NAV_LIGHT_LABELS: Record<string, string> = { l1: '极浅', l2: '浅', l3: '中', l4: '深', l5: '极深' };

export const NAV_HUE_PALETTE: Record<string, [string, string, string, string, string]> = {
  gray: ['rgba(225,225,225,0.9)', 'rgba(190,190,190,0.78)', 'rgba(128,128,128,0.8)', 'rgba(70,70,70,0.85)', 'rgba(20,20,20,0.92)'],
  black: ['rgba(90,90,90,0.8)', 'rgba(60,60,60,0.85)', 'rgba(30,30,30,0.9)', 'rgba(12,12,12,0.94)', 'rgba(0,0,0,0.97)'],
  white: ['rgba(255,255,255,0.95)', 'rgba(250,250,250,0.9)', 'rgba(240,240,240,0.85)', 'rgba(225,225,225,0.8)', 'rgba(205,205,205,0.75)'],
  blue: ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1e40af'],
  violet: ['#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#5b21b6'],
  cyan: ['#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#155e75'],
  green: ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#166534'],
  orange: ['#fdba74', '#fb923c', '#f97316', '#ea580c', '#9a3412'],
  red: ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#991b1b'],
};
export const NAV_LIGHT_IDX: Record<string, number> = { l1: 0, l2: 1, l3: 2, l4: 3, l5: 4 };

export const hueColor = (hue: unknown, light: unknown, fallback: string): string => {
  if (typeof hue === 'string') {
    const palette = NAV_HUE_PALETTE[hue]
    if (palette !== undefined) return palette[NAV_LIGHT_IDX[typeof light === 'string' ? light : 'l3'] ?? 2]
  }
  return fallback
}

export const parseRgba = (s: string): [number, number, number, number] | null => {
  const t = (s ?? '').trim().toLowerCase()
  if (t === '') return null
  if (t === 'transparent') return [0, 0, 0, 0]
  const hex = /^#([0-9a-f]{3,8})$/.exec(t)
  if (hex !== null) {
    let h = hex[1]
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('')
    if (h.length === 6) h += 'ff'
    const n = parseInt(h, 16)
    return [(n >> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, Math.round(((n & 255) / 255) * 1000) / 1000]
  }
  const num = (x: string, base: number): number | null => {
    const v = x.trim()
    if (v === '') return null
    const p = v.endsWith('%') ? Number(v.slice(0, -1)) : Number(v)
    if (Number.isNaN(p)) return null
    if (base === 255 && v.endsWith('%')) return Math.round((p / 100) * 255)
    if (base === 1 && v.endsWith('%')) return p / 100
    return base === 1 ? p : Math.round(p)
  }
  const comma = /^rgba?\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)(?:\s*,\s*([\d.]+%?))?\s*\)$/.exec(t)
  if (comma !== null) {
    const r = num(comma[1], 255); const g = num(comma[2], 255); const b = num(comma[3], 255)
    const a = comma[4] !== undefined ? num(comma[4], 1) : 1
    if (r === null || g === null || b === null || a === null) return null
    return [r, g, b, a]
  }
  const space = /^rgba?\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)(?:\s*\/\s*([\d.]+%?))?\s*\)$/.exec(t)
  if (space !== null) {
    const r = num(space[1], 255); const g = num(space[2], 255); const b = num(space[3], 255)
    const a = space[4] !== undefined ? num(space[4], 1) : 1
    if (r === null || g === null || b === null || a === null) return null
    return [r, g, b, a]
  }
  return null
}

export const parseRgb = (s: string): [number, number, number] | null => {
  const a = parseRgba(s)
  return a === null ? null : [a[0], a[1], a[2]]
}

const findBackgroundRgb = (start: Element | null): [number, number, number] | null => {
  try {
    let el: Element | null = start
    while (el !== null) {
      const rgba = parseRgba(getComputedStyle(el).backgroundColor)
      if (rgba !== null && rgba[3] > 0) return [rgba[0], rgba[1], rgba[2]]
      el = el.parentElement
    }
  } catch { /* 兜底 */ }
  return null
}

const isDarkBackground = (start: Element | null): boolean => {
  const rgb = findBackgroundRgb(start)
  if (rgb !== null) return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] < 128
  try {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches) return true
  } catch { /* ignore */ }
  return false
}

export const contrastRatio = (a: [number, number, number], b: [number, number, number]): number => {
  const lum = (c: [number, number, number]): number => {
    const f = (v: number): number => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])
  }
  const la = lum(a)
  const lb = lum(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

export const validColor = (raw: unknown, fallback: string): string => {
  if (typeof raw !== 'string') return fallback
  const s = raw.trim()
  if (s === '') return fallback
  return parseRgba(s) !== null ? s : fallback
}

export const resolveNavColors = (cfg: RailColorConfig, start: Element | null): { bar: string; hot: string } => {
  const cs = getComputedStyle(document.documentElement)
  const brand = cs.getPropertyValue('--dsw-alias-state-business-primary').trim() || '#3b82f6'
  const caption = cs.getPropertyValue('--dsw-alias-label-caption').trim() || 'rgba(127,127,127,0.5)'
  const autoBar = (): string => {
    const captionRgb = parseRgb(caption)
    const bgRgb = findBackgroundRgb(start)
    if (captionRgb !== null && bgRgb !== null && contrastRatio(captionRgb, bgRgb) >= 3) return caption
    return isDarkBackground(start) ? 'rgba(226,226,226,0.85)' : 'rgba(80,80,80,0.78)'
  }
  const colorMode = cfg.navColor ?? 'auto'
  const bar = colorMode === 'auto' ? autoBar()
    : colorMode === 'custom' ? validColor(cfg.navColorCustom, autoBar())
    : hueColor(colorMode, cfg.navColorLight, caption)
  const accentMode = cfg.navAccent ?? 'auto'
  const hot = accentMode === 'auto' ? brand
    : accentMode === 'custom' ? validColor(cfg.navAccentCustom, brand)
    : hueColor(accentMode, cfg.navAccentLight, brand)
  return { bar, hot }
}

// 保守兜底（仅提示卡）：只有浮层背景不透明（alpha ≥ 0.85）且对比 <3:1 时才纠偏；
// 玻璃/半透明浮层一律清空变量、跟随主题 token。
const applyTipContrast = (): void => {
  const root = document.documentElement
  const cs = getComputedStyle(document.body)
  const tipBg = parseRgba(cs.getPropertyValue('--dsw-alias-bg-layer-3').trim())
  const update = (key: string, token: string): void => {
    if (tipBg === null || tipBg[3] < 0.85) { root.style.removeProperty(key); return }
    const rgb = parseRgb(token)
    const darkBg = 0.2126 * tipBg[0] + 0.7152 * tipBg[1] + 0.0722 * tipBg[2] < 128
    const corrected = darkBg ? 'rgba(235,235,235,0.92)' : 'rgba(55,55,55,0.92)'
    if (rgb === null || contrastRatio(rgb, [tipBg[0], tipBg[1], tipBg[2]]) >= 3) { root.style.removeProperty(key); return }
    if (root.style.getPropertyValue(key) !== corrected) root.style.setProperty(key, corrected)
  }
  update('--tidychat-nav-tip-text', cs.getPropertyValue('--dsw-alias-label-primary').trim() || '#222')
  update('--tidychat-nav-tip-head', cs.getPropertyValue('--dsw-alias-label-secondary').trim() || '#666')
}

export const applyNavColors = (cfg: RailColorConfig, start: Element | null): void => {
  const { bar, hot } = resolveNavColors(cfg, start)
  const root = document.documentElement
  if (root.style.getPropertyValue('--tidychat-nav-color') !== bar) root.style.setProperty('--tidychat-nav-color', bar)
  if (root.style.getPropertyValue('--tidychat-nav-color-hot') !== hot) root.style.setProperty('--tidychat-nav-color-hot', hot)
  applyTipContrast()
}

/**
 * Install the color pipeline once per client: reacts to store changes (the
 * settings card), theme switches (:root class/style/data-theme) and a slow
 * fallback interval (sidebar resize changes the resolved background). Writes
 * are guarded (value-equal) so the theme observer cannot loop.
 */
export function installRailColors(
  prefs: { subscribe: (fn: () => void) => () => void; getSnapshot: () => RailColorConfig },
  getStart: () => Element | null,
): () => void {
  const run = (): void => applyNavColors(prefs.getSnapshot(), getStart())
  run()
  const unsub = prefs.subscribe(() => run())
  let themeObs: MutationObserver | null = null
  if (typeof MutationObserver !== 'undefined') {
    themeObs = new MutationObserver(() => run())
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] })
  }
  const interval = setInterval(run, 5000)
  return () => {
    try { unsub() } catch { /* ignore */ }
    themeObs?.disconnect()
    clearInterval(interval)
  }
}
