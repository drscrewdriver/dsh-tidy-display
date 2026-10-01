import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component, Fragment, memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { JsonBlock, MarkdownText, writeClipboard } from '@deepseek-ai/dsh-client-ui-primitives';
import { ComposerFillContext, McpAppFrame } from './McpAppFrame.js';
import { formatMessageClock } from './message-chrome.js';
import { markdownLabels, truncatedJsonLabel } from './primitive-labels.js';
import { t } from './locales.js';
import { useStreamingText } from './streaming.js';
import { MotionMarkdown, MotionPlainText } from './word-motion.js';
import css from './Reader.module.css';
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
export class BlockBoundary extends Component {
    state = { failed: false, detail: '' };
    // Temporary diagnostic: surface the reason inline so a recurrence is reportable
    // without a console. Remove once the reported block crash is identified.
    static getDerivedStateFromError(error) {
        const err = error;
        return { failed: true, detail: String(err?.message ?? error).slice(0, 160) };
    }
    render() {
        return this.state.failed
            ? _jsxs("div", { className: css.notice, children: [t('reader.blockError'), _jsx("span", { "data-reader-block-error": true, style: { opacity: .65 }, children: t('reader.blockErrorDetail', { detail: this.state.detail }) })] })
            : this.props.children;
    }
}
export const ImageBlock = memo(function ImageBlock({ attachment, loadImage }) {
    const [attempt, setAttempt] = useState(0);
    const [url, setUrl] = useState(null);
    const [error, setError] = useState(false);
    const [decoded, setDecoded] = useState(false);
    const dialog = useRef(null);
    const opener = useRef(null);
    useEffect(() => {
        let active = true;
        let owned = null;
        const timeout = setTimeout(() => { if (active) {
            setError(true);
            active = false;
        } }, 20000);
        setError(false);
        setDecoded(false);
        setUrl(null);
        void loadImage(attachment).then(result => {
            if (!active)
                return;
            clearTimeout(timeout);
            if (!IMAGE_TYPES.has(result.mediaType))
                throw new Error('Unsupported image media type');
            const bytes = Uint8Array.from(result.data);
            owned = URL.createObjectURL(new Blob([bytes.buffer], { type: result.mediaType }));
            setUrl(owned);
        }).catch(() => { clearTimeout(timeout); if (active)
            setError(true); });
        return () => { active = false; clearTimeout(timeout); if (owned)
            URL.revokeObjectURL(owned); };
    }, [attachment.attachmentId, attempt, loadImage]);
    const width = Number.isFinite(attachment.width) && attachment.width > 0 ? attachment.width : 4;
    const height = Number.isFinite(attachment.height) && attachment.height > 0 ? attachment.height : 3;
    return _jsxs("figure", { className: css.imageFigure, "data-reader-image": true, "data-image-state": error ? 'error' : decoded ? 'ready' : 'loading', children: [_jsxs("div", { className: css.imageFrame, style: { aspectRatio: `${width} / ${height}` }, children: [!error && url && _jsx("button", { ref: opener, type: "button", className: css.imageOpen, "aria-label": attachment.name ? t('image.zoomNamed', { name: attachment.name }) : t('image.zoom'), onClick: () => dialog.current?.showModal(), children: _jsx("img", { src: url, alt: attachment.name ?? t('image.alt'), width: width, height: height, onLoad: () => setDecoded(true), onError: () => setError(true), "data-ready": decoded }) }), (!decoded || error) && _jsxs("div", { className: css.imagePlaceholder, children: [_jsx("span", { children: error ? t('image.error') : t('image.loading') }), error && _jsx("button", { type: "button", className: css.textButton, onClick: () => setAttempt(value => value + 1), children: t('image.retry') })] })] }), attachment.name && _jsx("figcaption", { children: attachment.name }), _jsxs("dialog", { ref: dialog, className: css.imageDialog, "aria-label": t('image.preview'), onClose: () => opener.current?.focus(), onClick: event => { if (event.target === dialog.current)
                    dialog.current?.close(); }, children: [_jsx("button", { type: "button", autoFocus: true, className: css.dialogClose, "aria-label": t('image.close'), onClick: () => dialog.current?.close(), children: "\u00D7" }), url && _jsx("img", { src: url, alt: attachment.name ?? t('image.alt') })] })] });
});
export function contentBlocks(content) {
    return content.map(block => {
        if (block.type === 'text')
            return { kind: 'text', text: block.text };
        if (block.type === 'image')
            return { kind: 'image', attachment: block.attachment };
        return { kind: 'other', block };
    });
}
function ReadingMarkdown({ text, streaming, holdFormatting, startedAt, interrupted = false, liveText = false, kind = 'body', fileMentions }) {
    const root = useRef(null);
    const presentation = useStreamingText(text, streaming, { startedAt, interrupted: interrupted || !liveText, selected: holdFormatting });
    // Native Markdown changes block keys for its full final parse. Keep the last
    // committed mode while this answer is selected, then finish formatting on
    // deselection. Business status and the source text still update normally.
    const committedMode = useRef(streaming);
    const effectiveMode = holdFormatting ? committedMode.current : presentation.formatStreaming;
    useLayoutEffect(() => { committedMode.current = effectiveMode; }, [effectiveMode]);
    return _jsx("div", { ref: root, className: css.readingText, "data-reader-text": true, "data-reader-text-kind": kind, "data-received-length": text.length, "data-shown-length": presentation.text.length, "data-presentation-pending": presentation.pending || undefined, "data-motion-style": "opacity-blur", "data-ud-motion": "reader-text-arrival", "data-ud-motion-type": "reveal", "data-ud-motion-no-flash": "true", children: _jsx(MotionMarkdown, { text: presentation.text, streaming: effectiveMode, enabled: liveText && presentation.reveal && effectiveMode, revision: presentation.revision, fileMentions: fileMentions }) });
}
function ReadingReasoning({ text, streaming, holdFormatting, startedAt, interrupted = false, liveText = false }) {
    const presentation = useStreamingText(text, streaming, { startedAt, interrupted: interrupted || !liveText, selected: holdFormatting });
    return _jsx("div", { className: css.readingText, "data-reader-text": true, "data-reader-text-kind": "reasoning", "data-received-length": text.length, "data-shown-length": presentation.text.length, "data-presentation-pending": presentation.pending || undefined, "data-motion-style": "opacity-blur", "data-ud-motion": "reader-text-arrival", "data-ud-motion-type": "reveal", "data-ud-motion-no-flash": "true", children: _jsx(MotionPlainText, { text: presentation.text, enabled: liveText && presentation.reveal, revision: presentation.revision }) });
}
function fallback(block, streaming, source, loadImage, fillComposer, holdFormatting, presentation, fileMentions) {
    switch (block.kind) {
        case 'text': return source === 'user' ? _jsx(MarkdownText, { text: block.text, labels: markdownLabels }) : _jsx(ReadingMarkdown, { text: block.text, streaming: streaming, holdFormatting: holdFormatting, ...presentation, fileMentions: fileMentions });
        case 'image': return _jsx(ImageBlock, { attachment: block.attachment, loadImage: loadImage });
        case 'reasoning': return _jsx(ReadingReasoning, { text: block.text, streaming: streaming, holdFormatting: holdFormatting, ...presentation });
        case 'tool-call': return _jsx(JsonBlock, { label: t('reader.toolArgs', { name: block.name }), payload: block.argsRaw, truncatedLabel: truncatedJsonLabel });
        case 'other': {
            const raw = block.block;
            if (raw && typeof raw === 'object') {
                const item = raw;
                if ((item.type === 'mcp-app' || item.type === 'mcpapp' || item.type === 'ui') && typeof item.html === 'string') {
                    return _jsx(McpAppFrame, { html: item.html, title: typeof item.title === 'string' ? item.title : undefined, fillComposer: fillComposer });
                }
            }
            return _jsxs("div", { className: css.unknown, children: [_jsx("p", { children: t('reader.unknownBlock') }), _jsx(JsonBlock, { label: t('reader.rawContent'), payload: block.block, truncatedLabel: truncatedJsonLabel })] });
        }
    }
}
export const Blocks = memo(function Blocks({ blocks, streaming = false, source = 'assistant', holdFormatting = false, startedAt, interrupted, liveText, renderSlotChain, loadImage, fillComposer, fileMentions }) {
    return _jsx(ComposerFillContext.Provider, { value: fillComposer, children: _jsx("div", { className: css.blocks, "data-streaming": streaming || undefined, children: blocks.map((block, index) => _jsx(BlockBoundary, { children: _jsx(Fragment, { children: renderSlotChain('dsh-tidy-display.block', { block, streaming, source }, { fallback: fallback(block, streaming, source, loadImage, fillComposer, holdFormatting, { startedAt, interrupted, liveText }, fileMentions) }) }) }, block.kind === 'image' ? `image:${block.attachment.attachmentId}:${index}` : `${index}:${block.kind}`)) }) });
});
import { TurnMetrics } from './TurnMetrics.js';
function CopyGlyph() {
    return _jsxs("svg", { viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", children: [_jsx("rect", { x: "5", y: "5", width: "8", height: "8", rx: "1.5" }), _jsx("path", { d: "M3 10H2.8A.8.8 0 0 1 2 9.2V2.8a.8.8 0 0 1 .8-.8h6.4a.8.8 0 0 1 .8.8V3" })] });
}
function useCopyReceipt() {
    const [receipt, setReceipt] = useState('');
    const timer = useRef(null);
    useEffect(() => () => { if (timer.current)
        clearTimeout(timer.current); }, []);
    const copy = async (text) => {
        const accepted = await writeClipboard(text);
        setReceipt(accepted ? t('common.copied') : t('reader.copyFailed'));
        if (timer.current)
            clearTimeout(timer.current);
        timer.current = setTimeout(() => setReceipt(''), 2000);
    };
    return { receipt, copy };
}
function MessageClock({ time }) {
    return _jsx("time", { className: css.messageClock, dateTime: new Date(time).toISOString(), children: formatMessageClock(time) });
}
export function CopyAnswer({ blocks, onFork, metrics, extraActions }) {
    const { receipt, copy } = useCopyReceipt();
    const text = blocks.filter((block) => block.kind === 'text').map(block => block.text).join('\n\n');
    const endedAt = metrics?.endedAt;
    const hasMetrics = metrics !== undefined && (metrics.usage !== undefined || metrics.runMs !== undefined || endedAt !== undefined);
    if (!text.trim() && !onFork && !hasMetrics)
        return null;
    return _jsxs("div", { className: css.answerActions, children: [text.trim() !== '' && (_jsx("button", { type: "button", className: css.iconButton, "aria-label": t('reader.copyAnswer'), title: t('reader.copyAnswer'), onClick: () => { void copy(text); }, children: _jsx(CopyGlyph, {}) })), extraActions, onFork && (_jsx("button", { type: "button", className: css.iconButton, "aria-label": t('reader.forkAria'), title: t('reader.forkTitle'), onClick: onFork, children: _jsxs("svg", { viewBox: "0 0 16 16", width: "14", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "1.2", children: [_jsx("circle", { cx: "4.5", cy: "3.5", r: "1.8" }), _jsx("circle", { cx: "4.5", cy: "12.5", r: "1.8" }), _jsx("circle", { cx: "11.5", cy: "5.5", r: "1.8" }), _jsx("path", { d: "M4.5 5.5v5M4.5 8c2.5 0 4.5-1 7-2.5", strokeLinecap: "round" })] }) })), metrics && _jsx(TurnMetrics, { usage: metrics.usage, runMs: metrics.runMs, tokensPerSecond: metrics.tokensPerSecond, ttftMs: metrics.ttftMs }), endedAt !== undefined && _jsx(MessageClock, { time: endedAt }), _jsx("span", { role: "status", className: css.meta, children: receipt })] });
}
export function UserMessageActions({ text, time }) {
    const { receipt, copy } = useCopyReceipt();
    const hasText = text.trim() !== '';
    if (!hasText && time === undefined)
        return null;
    return _jsxs("div", { className: css.userActions, children: [time !== undefined && _jsx(MessageClock, { time: time }), hasText && (_jsx("button", { type: "button", className: css.iconButton, "aria-label": t('reader.copyMessage'), title: t('reader.copyMessage'), onClick: () => { void copy(text); }, children: _jsx(CopyGlyph, {}) })), _jsx("span", { role: "status", className: css.meta, children: receipt })] });
}
//# sourceMappingURL=Blocks.js.map