/**
 * vc/hp shims — ported from dsh-raw-html-v2 lib/client.js 2700-2788.
 *
 * The engine (vcp-engine-v1.js) is a self-contained IIFE whose free symbols are
 * `vc` (DOM node → React element with safety filtering), `hp` (CSS string →
 * camelCase object) and `f` ({Fragment, jsx}) — injected at bootstrap time via
 * `new Function('vc','hp','f', src)`.
 *
 * Port notes (vs upstream):
 * - The trusted-mode branch is REMOVED by design: tidy-display never provides
 *   `window.__vcpTrusted`, so `on*` handlers other than the `onclick="input('…')"`
 *   bridge are always stripped (upstream strips them too in the default path).
 * - `window.__dshInput` stays the composer-fill bridge; the tidy card component
 *   installs it from `ComposerFillContext` (see vcp/input-bridge.ts).
 */
import { type ReactNode } from 'react';
/** vc 用:内联 style 安全过滤(与 v1 宿主 vc 同规则)。 */
export declare function vcpFilterStyle(sv: string): string;
/** hp:CSS 声明串 → camelCase 对象(引擎 parseOpen/属性转换用)。 */
export declare function vcpHpShim(s: string): Record<string, string>;
export declare function vcpAllowHref(v: string): boolean;
export declare function vcpAllowSrc(v: string): boolean;
declare global {
    interface Window {
        __dshInput?: (text: string) => void;
    }
}
/** vc:DOM 节点 → React 元素(安全过滤 + onclick 桥 window.__dshInput)。
 *  script/object/embed 一律丢弃;iframe 仅放行 https/http/相对 src。 */
export declare function vcpVcShim(node: Node | null | undefined, key: string | number | null): ReactNode;
/** 字体 url 路径兼容:url('/fonts/…') → url('/tidy-display/fonts/…')(v1 协议旧路径
 *  兜底归一;幂等——tidy 路由前缀不会被 /fonts/ 规则命中)。 */
export declare function vcpFontUrlCompat(html: string): string;
//# sourceMappingURL=shims.d.ts.map