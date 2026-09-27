import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, memo, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { getHostTheme, getCssTokens, extractHtmlTitle, ensureHtmlDocument, formatReceiptPrompt, fillComposerDom, } from './mcp-app.js';
import css from './McpAppFrame.module.css';
export const ComposerFillContext = createContext(undefined);
export function useComposerFill() {
    return useContext(ComposerFillContext);
}
export const McpAppFrame = memo(function McpAppFrame({ html, title: initialTitle, initialHeight = 240, fillComposer: fillComposerProp, }) {
    const fillComposerFromContext = useComposerFill();
    const writeComposer = useMemo(() => fillComposerProp ?? fillComposerFromContext ?? fillComposerDom, [fillComposerProp, fillComposerFromContext]);
    const iframeRef = useRef(null);
    const lastParamsRef = useRef({});
    const [height, setHeight] = useState(() => Math.max(60, Math.min(2400, initialHeight)));
    const [ready, setReady] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [lastPrompt, setLastPrompt] = useState(null);
    const [reloadNonce, setReloadNonce] = useState(0);
    const frameId = useId();
    const title = useMemo(() => {
        return initialTitle || extractHtmlTitle(html) || '交互式 MCP App';
    }, [initialTitle, html]);
    // Capture the host theme ONCE for the initial srcDoc. Live theme switches
    // are delivered via postMessage (broadcastTheme), so the srcDoc identity
    // stays stable and the iframe never reloads (which would wipe user state
    // such as checked boxes or selected tabs).
    const [initialTheme] = useState(getHostTheme);
    const preparedHtml = useMemo(() => ensureHtmlDocument(html, initialTheme), [html, initialTheme]);
    const fillComposer = useCallback((params) => {
        const prompt = formatReceiptPrompt(params, title);
        setLastPrompt(prompt);
        try {
            if (writeComposer(prompt))
                return true;
            // Composer refused: leave the prompt visible in the receipt bar and
            // stash a clipboard copy as a fallback.
            try {
                void navigator.clipboard?.writeText(prompt);
            }
            catch {
                // Clipboard unavailable; the visible receipt text remains copyable.
            }
        }
        catch {
            // Ignore DOM query errors in non-browser environments
        }
        return false;
    }, [title, writeComposer]);
    const handleUserSubmit = useCallback((params) => {
        lastParamsRef.current = params;
        let summary = '';
        if (typeof params.choice === 'string') {
            const desc = typeof params.desc === 'string' ? ` (${params.desc})` : '';
            summary = `选择: ${params.choice}${desc}`;
        }
        else if (typeof params.action === 'string') {
            summary = `操作: ${params.action}${params.payload ? ` (${JSON.stringify(params.payload)})` : ''}`;
        }
        else if (typeof params.selectedVariant === 'string') {
            summary = `方案: ${params.selectedVariant}`;
        }
        else {
            summary = JSON.stringify(params);
        }
        setReceipt(summary);
        // Populate DSH composer with natural prompt and trigger React input state
        fillComposer(params);
    }, [fillComposer]);
    useEffect(() => {
        const handleMessage = (event) => {
            const iframe = iframeRef.current;
            if (!iframe || event.source !== iframe.contentWindow)
                return;
            const data = event.data;
            if (!data || typeof data !== 'object')
                return;
            // Protocol SEP-1865 JSON-RPC 2.0
            const currentTheme = getHostTheme();
            const cssTokens = getCssTokens(currentTheme);
            // 1. ui/initialize (View -> Host)
            if (data.method === 'ui/initialize') {
                const response = {
                    jsonrpc: '2.0',
                    id: data.id,
                    result: {
                        protocolVersion: '2026-01-26',
                        hostContext: {
                            theme: currentTheme,
                            locale: 'zh-CN',
                            styles: {
                                variables: cssTokens,
                            },
                        },
                    },
                };
                iframe.contentWindow?.postMessage(response, '*');
                setReady(true);
                return;
            }
            // 2. ui/ready or initialized notification
            if (data.method === 'ui/ready' || data.method === 'ui/notifications/initialized') {
                setReady(true);
                return;
            }
            // 3. ui/resize
            if (data.method === 'ui/resize' && data.params?.height) {
                const h = Number(data.params.height);
                if (Number.isFinite(h) && h > 0) {
                    setHeight(Math.max(60, Math.min(2400, Math.round(h))));
                }
                return;
            }
            // 4. ui/submit or ui/update-model-context
            if (data.method === 'ui/submit' || data.method === 'ui/update-model-context') {
                const params = data.params || {};
                handleUserSubmit(params);
                return;
            }
        };
        window.addEventListener('message', handleMessage);
        // Broadcast live theme changes to running iframe
        const broadcastTheme = () => {
            const newTheme = getHostTheme();
            const tokens = getCssTokens(newTheme);
            iframeRef.current?.contentWindow?.postMessage({
                jsonrpc: '2.0',
                method: 'ui/notifications/host-context-changed',
                params: {
                    theme: newTheme,
                    styles: { variables: tokens },
                },
            }, '*');
        };
        let observer = null;
        if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
            observer = new MutationObserver(broadcastTheme);
            if (document.body) {
                observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme', 'class', 'style', 'data-theme'] });
            }
            if (document.documentElement) {
                observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
            }
        }
        const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
        media?.addEventListener?.('change', broadcastTheme);
        return () => {
            window.removeEventListener('message', handleMessage);
            observer?.disconnect();
            media?.removeEventListener?.('change', broadcastTheme);
        };
    }, [handleUserSubmit]);
    const handleFrameLoad = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe)
            return;
        // Proactive Host -> View initialize notification for boilerplate compatibility
        const currentTheme = getHostTheme();
        const cssTokens = getCssTokens(currentTheme);
        iframe.contentWindow?.postMessage({
            jsonrpc: '2.0',
            method: 'ui/initialize',
            params: {
                theme: currentTheme,
                locale: 'zh-CN',
                styles: {
                    variables: cssTokens,
                },
            },
        }, '*');
        setReady(true);
    }, []);
    const handleReload = useCallback(() => {
        setReloadNonce(n => n + 1);
        setReady(false);
        setReceipt(null);
    }, []);
    return (_jsxs("div", { className: css.card, "data-mcp-app-card": true, "data-testid": "mcp-app-card", children: [_jsxs("div", { className: css.header, children: [_jsxs("div", { className: css.titleArea, children: [_jsx("span", { className: css.icon, "aria-hidden": "true", children: _jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }), _jsx("path", { d: "M3 9h18" }), _jsx("path", { d: "M9 21V9" })] }) }), _jsx("span", { className: css.title, title: title, children: title })] }), _jsx("div", { className: css.actions, children: _jsx("button", { type: "button", className: css.iconBtn, onClick: handleReload, title: "\u91CD\u7F6E\u7EC4\u4EF6\u72B6\u6001", "aria-label": "\u91CD\u7F6E\u7EC4\u4EF6\u72B6\u6001", children: _jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }), _jsx("path", { d: "M3 3v5h5" }), _jsx("path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" }), _jsx("path", { d: "M16 16h5v5" })] }) }) })] }), _jsx("div", { className: css.iframeWrapper, style: { height: `${height}px` }, children: _jsx("iframe", { ref: iframeRef, className: css.iframe, title: title, srcDoc: preparedHtml, sandbox: "allow-scripts allow-forms", referrerPolicy: "no-referrer", onLoad: handleFrameLoad }, `${frameId}-${reloadNonce}`) }), receipt && (_jsxs("div", { className: css.receipt, "data-testid": "mcp-app-receipt", children: [_jsxs("span", { className: css.receiptSummary, children: [_jsx("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("polyline", { points: "20 6 9 17 4 12" }) }), _jsxs("span", { children: ["\u5DF2\u5C31\u7EEA\uFF1A", receipt] })] }), lastPrompt && (_jsx("div", { className: css.receiptPrompt, title: lastPrompt, children: lastPrompt })), _jsx("div", { className: css.receiptHint, children: _jsxs("button", { type: "button", className: css.sendKbd, title: "\u628A\u8FD9\u6761\u7ED3\u679C\u91CD\u65B0\u586B\u5165\u8F93\u5165\u6846\uFF0C\u7136\u540E\u56DE\u8F66\u53D1\u9001", onClick: () => {
                                fillComposer(lastParamsRef.current);
                            }, children: [_jsx("span", { children: "\u586B\u5165\u8F93\u5165\u6846" }), _jsx("kbd", { children: "\u21B5" })] }) })] }))] }));
});
/**
 * Markdown code-fence mount point: picks the session composer writer from
 * React context (provided by Blocks) without changing the markdown
 * pipeline's signatures.
 */
export function McpAppCodeBlock({ html, title, initialHeight }) {
    const fillComposer = useComposerFill();
    return _jsx(McpAppFrame, { html: html, title: title, initialHeight: initialHeight, fillComposer: fillComposer });
}
export function StreamingMcpAppPlaceholder({ title }) {
    return (_jsxs("div", { className: css.streamingPlaceholder, children: [_jsx("span", { className: css.pulseDot, "aria-hidden": "true" }), _jsxs("span", { children: ["\u6B63\u5728\u751F\u6210\u4EA4\u4E92\u7EC4\u4EF6", title ? `（${title}）` : '', "..."] })] }));
}
//# sourceMappingURL=McpAppFrame.js.map