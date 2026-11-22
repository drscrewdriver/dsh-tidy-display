/**
 * VCP engine render core — ported from dsh-raw-html-v2 lib/client.js
 * 2799-2908 (VcpRootFontGuard / vcpSettleMemo / vcpEngineRender) plus
 * vcpPageRender (:2913-2931) and scopePageCss (segmentation.ts).
 *
 * Feed card HTML (closed or streaming half) to the engine on window.__vcpStable;
 * the engine produces React elements with streaming increments, per-message
 * scoping, font locking and self-healing. This layer only transports
 * "segment → engine" and never rewrites render logic.
 *
 * Port notes (vs upstream):
 * - Font URL compat normalizes /fonts/ → /tidy-display/fonts/ (upstream used
 *   /fonts-v2/); the plugin's own font route serves whatever assets exist, and
 *   a missing route degrades to the system font chain (graceful, per findings).
 * - Debug frame logging stays throttled at 500ms.
 */
import { type ReactNode } from 'react';
/** 根容器字体 DOM 锁定:display:contents 守卫包住引擎产物,ref 挂载时(每帧 commit
 *  幂等)对根容器 setProperty('font-family', …, 'important')——流式与 settle 后一致
 *  执行,根字体即时生效、永不回退、零结构干扰。 */
export declare function VcpRootFontGuard(props: {
    children?: ReactNode;
}): ReactNode;
/** 卡 HTML(闭合或流式半截)→ React 元素:喂 v1 引擎;引擎未就绪给轻量占位。 */
export declare function vcpEngineRender(html: string, streaming: boolean, key?: string | number | null): ReactNode;
/** 整页 HTML 渲染:style 内 html/body 脱敏为 .vcp-page-host 后喂引擎;外层 frame
 *  (限高滚动)+ host(承接页面级样式,防 body{…} 全局污染)。 */
export declare function vcpPageRender(rawHtml: string, streaming: boolean, key?: string | number | null): ReactNode;
/** 清空 settle memo(卡结构变化/内存压力时可用)。 */
export declare function clearVcpSettleMemo(): void;
//# sourceMappingURL=render.d.ts.map