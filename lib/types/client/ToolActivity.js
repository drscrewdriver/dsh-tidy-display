import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { DiffBlock, DisclosureRow, JsonTree, ReadBlock, SearchBlock, TerminalBlock, WebBlock, IconApiOutlineRegular, IconBrowseOutlineRegular, IconEditOutlineRegular, IconSearchOutlineRegular, IconSkillOutlineRegular, IconSparkleRegular } from '@deepseek-ai/dsh-client-ui-primitives';
import { Blocks, contentBlocks } from './Blocks.js';
import { OfficialTool } from './OfficialContent.js';
import { ProcessFragment } from './motion.js';
import { activityPhase, activitySummary, callDiffHunks, diffTotals, executionFacts, objectValue } from './tool-activity.js';
import { classifyTool, toolRowModel, VARIANT_TITLES } from './native/tool-call-model.js';
import { McpAppFrame, StreamingMcpAppPlaceholder } from './McpAppFrame.js';
import { diffBlockLabels, jsonTreeLabels, readBlockLabels, searchBlockLabels, terminalBlockLabels, webBlockLabels } from './primitive-labels.js';
import { t } from './locales.js';
import css from './Reader.module.css';
// Phase labels resolve at render time, so a language switch reaches cards that
// are already mounted; only the key lives here, the copy lives in locales.ts.
const PHASE_KEYS = { preparing: 'tool.phase.preparing', running: 'tool.phase.running', returned: 'tool.phase.returned', succeeded: 'tool.phase.succeeded', failed: 'tool.phase.failed', interrupted: 'tool.phase.interrupted' };
const ICONS = { write: IconEditOutlineRegular, read: IconBrowseOutlineRegular, terminal: IconApiOutlineRegular, search: IconSearchOutlineRegular, web: IconSearchOutlineRegular, code: IconApiOutlineRegular, other: IconSparkleRegular };
const number = new Intl.NumberFormat('zh-CN');
const language = (path) => path?.split('.').at(-1);
const duration = (ms) => ms < 1000 ? t('tool.ms', { n: Math.round(ms) }) : t('tool.sec', { n: (ms / 1000).toFixed(ms < 10000 ? 1 : 0) });
function generatedInput(content, target, preparing) {
    const lines = content.split('\n').map((text, index) => ({ number: index + 1, text }));
    const visible = preparing ? lines.slice(-12) : lines.slice(0, 1600);
    return _jsxs("div", { "data-reader-tool-file": true, children: [_jsxs("p", { className: css.toolDetailNote, children: [preparing ? t('tool.generatingInput') : t('tool.inputFileContent'), !preparing && lines.length > visible.length ? t('tool.previewTruncated') : ''] }), _jsx(ReadBlock, { label: target ?? t('tool.fileContent'), lang: language(target), lines: visible, totalLines: lines.length, maxLines: 16, labels: readBlockLabels })] });
}
function InputView({ model, preparing, fillComposer }) {
    if ((model.name === 'render_ui' || model.name === 'show_widget') && typeof model.args?.html === 'string') {
        return preparing
            ? _jsx(StreamingMcpAppPlaceholder, { title: typeof model.args.title === 'string' ? model.args.title : undefined })
            : _jsx(McpAppFrame, { html: model.args.html, title: typeof model.args.title === 'string' ? model.args.title : undefined, fillComposer: fillComposer });
    }
    if (model.content)
        return generatedInput(model.content, model.target, preparing);
    if (model.command)
        return _jsxs("div", { "data-reader-tool-terminal": true, children: [_jsx("p", { className: css.toolDetailNote, children: preparing ? t('tool.generatingCommand') : t('tool.submittedCommand') }), _jsx(TerminalBlock, { command: model.command, cwd: model.cwd, labels: terminalBlockLabels })] });
    return _jsx(JsonTree, { data: model.args, label: preparing ? t('tool.receivedFields') : t('tool.input'), labels: jsonTreeLabels });
}
function readLines(value) {
    if (!Array.isArray(value))
        return null;
    const lines = [];
    for (const item of value) {
        const row = objectValue(item);
        if (typeof row?.number !== 'number' || !Number.isInteger(row.number) || typeof row.text !== 'string')
            return null;
        lines.push({ number: row.number, text: row.text });
    }
    return lines;
}
/** A step past this reads as slow rather than merely in progress. */
const SLOW_TOOL_MS = 10_000;
function diffHunks(value) {
    if (!Array.isArray(value) || value.length === 0)
        return null;
    const diffs = [];
    for (const item of value) {
        const row = objectValue(item);
        if (typeof row?.path !== 'string' || (row.oldText !== null && typeof row.oldText !== 'string') || typeof row.newText !== 'string')
            return null;
        diffs.push({ path: row.path, oldText: row.oldText, newText: row.newText });
    }
    return diffs;
}
function searchFiles(value) {
    if (!Array.isArray(value))
        return null;
    const files = [];
    for (const item of value) {
        const row = objectValue(item);
        if (typeof row?.path !== 'string' || !Array.isArray(row.matches))
            return null;
        const matches = [];
        for (const itemMatch of row.matches) {
            const match = objectValue(itemMatch);
            if (typeof match?.lineNumber !== 'number' || !Number.isInteger(match.lineNumber) || typeof match.line !== 'string')
                return null;
            matches.push({ lineNumber: match.lineNumber, line: match.line });
        }
        files.push({ path: row.path, matches });
    }
    return files;
}
function ResultView(props) {
    const { official, entry, model } = props;
    const fallback = _jsx(ResultFallback, { ...props });
    if (!official || !entry.block || model.name === 'render_ui' || model.name === 'show_widget')
        return fallback;
    return _jsx(OfficialTool, { ...props, official: official, block: entry.block, toolName: model.name, cwd: props.cwd ?? model.cwd, fallback: fallback });
}
function ResultFallback({ entry, model, phase, ...render }) {
    if ((model.name === 'render_ui' || model.name === 'show_widget') && typeof model.args?.html === 'string') {
        return _jsx(McpAppFrame, { html: model.args.html, title: typeof model.args.title === 'string' ? model.args.title : undefined, fillComposer: render.fillComposer });
    }
    const block = entry.block;
    if (!block || !('kind' in block))
        return _jsxs(_Fragment, { children: [_jsx("p", { className: css.toolDetailNote, children: phase === 'interrupted' ? t('tool.interruptedNoResult') : phase === 'preparing' ? t('tool.preparingNote') : t('tool.waitingResult') }), _jsx(InputView, { model: model, preparing: phase === 'preparing', fillComposer: render.fillComposer })] });
    const meta = objectValue(block.meta);
    const text = block.content.filter(item => item.type === 'text').map(item => item.text).join('\n');
    if (phase === 'interrupted')
        return _jsxs(_Fragment, { children: [_jsx("p", { className: css.toolDetailNote, children: t('tool.cancelled') }), _jsx(InputView, { model: model, preparing: false, fillComposer: render.fillComposer }), _jsx("pre", { className: css.toolRaw, children: text })] });
    if (model.category === 'terminal') {
        const facts = executionFacts(block);
        const output = text.replace(/\n\[(?:exit code: \d+|killed by signal: [^\]\n]+)\]$/, '');
        return _jsx("div", { "data-reader-tool-terminal": true, children: _jsx(TerminalBlock, { command: model.command ?? model.name, cwd: model.cwd, output: output, exitCode: facts.exitCode, signal: facts.signal, maxLines: 18, labels: terminalBlockLabels }) });
    }
    const lines = readLines(meta?.lines);
    if (model.category === 'read' && typeof meta?.path === 'string' && typeof meta.totalLines === 'number' && lines)
        return _jsx("div", { "data-reader-tool-file": true, children: _jsx(ReadBlock, { label: meta.path, lang: typeof meta.lang === 'string' ? meta.lang : undefined, lines: lines, totalLines: meta.totalLines, maxLines: 18, labels: readBlockLabels }) });
    // The host's own hunks when it sent them; otherwise derive them from the call's
    // arguments, which is also what the official row does while a write is pending.
    // Both the counts and this card read the same source, so they cannot disagree.
    const diffs = diffHunks(meta?.diffs) ?? callDiffHunks(block, model.args, model.name);
    if (diffs.length)
        return _jsx("div", { "data-reader-tool-diff": true, children: _jsx(DiffBlock, { diffs: diffs, maxLines: 18, labels: diffBlockLabels }) });
    if (model.category === 'search' && typeof meta?.total === 'number' && typeof meta.truncated === 'boolean') {
        if (meta.shape === 'paths' && Array.isArray(meta.paths) && meta.paths.every((path) => typeof path === 'string'))
            return _jsx("div", { "data-reader-tool-search": true, children: _jsx(SearchBlock, { kind: "paths", paths: meta.paths, total: meta.total, truncated: meta.truncated, maxLines: 18, labels: searchBlockLabels }) });
        const files = searchFiles(meta.files);
        if (meta.shape === 'matches' && files)
            return _jsx("div", { "data-reader-tool-search": true, children: _jsx(SearchBlock, { kind: "matches", files: files, total: meta.total, truncated: meta.truncated, maxLines: 18, labels: searchBlockLabels }) });
    }
    if (model.category === 'web' && typeof meta?.truncated === 'boolean') {
        if (model.name === 'web_fetch' && typeof meta.url === 'string' && typeof meta.statusCode === 'number')
            return _jsx("div", { "data-reader-tool-web": true, children: _jsx(WebBlock, { kind: "fetch", url: meta.url, statusCode: meta.statusCode, truncated: meta.truncated, labels: webBlockLabels }) });
        if (model.name === 'web_search' && Array.isArray(meta.sources)) {
            const sources = meta.sources.flatMap(source => {
                const item = objectValue(source);
                return typeof item?.url === 'string' ? [{ url: item.url, ...(typeof item.title === 'string' ? { title: item.title } : {}), ...(typeof item.snippet === 'string' ? { snippet: item.snippet } : {}), ...(typeof item.publishedAt === 'string' ? { publishedAt: item.publishedAt } : {}) }] : [];
            });
            if (sources.length === meta.sources.length)
                return _jsx("div", { "data-reader-tool-web": true, children: _jsx(WebBlock, { kind: "search", sources: sources, answer: typeof meta.answer === 'string' ? meta.answer : undefined, truncated: meta.truncated, labels: webBlockLabels }) });
        }
    }
    // A trace/export may omit wire presentation. Keep the generated input clearly
    // labelled; it is not proof of an applied diff or a successful file mutation.
    if (model.category === 'write' && model.content && !block.isError)
        return _jsxs(_Fragment, { children: [_jsx("p", { className: css.toolDetailNote, children: t('tool.writeReturned') }), generatedInput(model.content, model.target, false)] });
    const content = block.content;
    // A code interpreter's product is its result, not prose. Without this branch
    // the output fell through to the generic document path below, which emits it
    // as reader answer text — so a run_code card sat in the transcript outside
    // every fold, the exact block the reader wanted to be able to close.
    if (model.category === 'code') {
        const output = content.filter(item => item.type === 'text').map(item => item.text).join('\n');
        const facts = executionFacts(block);
        if (output.trim())
            return _jsx("div", { "data-reader-tool-code": true, children: _jsx(TerminalBlock, { command: model.command ?? model.name, cwd: model.cwd, output: output, exitCode: facts.exitCode, signal: facts.signal, maxLines: 18, labels: terminalBlockLabels }) });
        return _jsx("p", { className: css.toolDetailNote, children: t('tool.codeNoOutput') });
    }
    if (content.some(item => item.type === 'text'))
        return _jsx("div", { className: css.toolDocument, children: _jsx(Blocks, { ...render, blocks: contentBlocks(content).filter(item => item.kind === 'text'), source: "tool" }) });
    if (content.length)
        return _jsx("p", { className: css.toolDetailNote, children: t('tool.mediaElsewhere') });
    return _jsx("p", { className: css.toolDetailNote, children: t('tool.noContent') });
}
/** One occurrence, keyed by call id all the way from generation to result. */
export const ToolActivity = memo(function ToolActivityView({ entry, motion, turnClosed, onRead, depth = 0, ...render }) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('result');
    const control = useRef(null);
    const panel = useRef(null);
    const [selected, setSelected] = useState(false);
    const detailId = useId();
    const tabRefs = useRef([]);
    const model = useMemo(() => activitySummary(entry), [entry.block, entry.draft]);
    const phase = activityPhase(entry, turnClosed);
    const heldPreview = useRef({ entry, model, phase });
    if (!selected)
        heldPreview.current = { entry, model, phase };
    const preview = heldPreview.current;
    useEffect(() => {
        const track = () => {
            const selection = document.getSelection();
            setSelected(!!selection && !selection.isCollapsed && !!selection.anchorNode && !!panel.current?.contains(selection.anchorNode));
        };
        document.addEventListener('selectionchange', track);
        return () => document.removeEventListener('selectionchange', track);
    }, []);
    const facts = executionFacts(entry.block);
    const Icon = model.name === 'skill' ? IconSkillOutlineRegular : ICONS[model.category];
    const block = entry.block;
    const native = block ? toolRowModel(model.name, block) : null;
    const skillName = typeof model.args?.name === 'string' ? model.args.name.split('\n')[0] : model.raw.split('\n')[0];
    const rowTitle = model.name === 'skill' ? 'Skill' : native?.title ?? VARIANT_TITLES[classifyTool(model.name)];
    const rowSummary = phase === 'interrupted' ? t('tool.stoppedKept') : model.name === 'skill' ? skillName : native?.errorSummary ?? native?.summary
        ?? (classifyTool(model.name) === 'others' ? `${model.name} · ${model.target ?? model.title}` : model.target ?? model.title);
    // Files that changed get the same +/- line counts the official tool row shows,
    // read straight from the diff the host attached to the result.
    const diff = useMemo(() => diffTotals(block, model.args, model.name), [block, model.args, model.name]);
    // The changed lines ride in the row's own expansion, the way the official tool
    // row shows them — one disclosure, not a second floating widget.
    const showState = phase === 'preparing' || phase === 'running' || phase === 'failed' || phase === 'interrupted';
    const running = phase === 'preparing' || phase === 'running';
    // A step that has not returned yet counts its own seconds, so a long command
    // reads as progress rather than as a stall. The clock is idle-rendered off the
    // row's own call time, and disappears the moment the result arrives.
    const [liveMs, setLiveMs] = useState(null);
    const openedAt = useRef(null);
    useEffect(() => {
        if (!running) {
            openedAt.current = null;
            setLiveMs(null);
            return;
        }
        const stamped = block && 'kind' in block && block.callTime != null ? block.callTime : null;
        const base = stamped ?? (openedAt.current ??= Date.now());
        const tick = () => setLiveMs(Math.max(0, Date.now() - base));
        tick();
        const timer = setInterval(tick, 200);
        return () => clearInterval(timer);
    }, [running, block]);
    const elapsed = block && 'kind' in block && block.callTime != null ? Math.max(0, block.time - block.callTime) : null;
    // A step that ran long keeps showing how long it took after it returns: the
    // number is the point of the readout. A fast step shows nothing once it is done.
    const shownMs = liveMs ?? (elapsed !== null && elapsed >= SLOW_TOOL_MS ? elapsed : null);
    const rawResult = useMemo(() => {
        const value = preview.entry.block;
        return value && 'kind' in value ? JSON.stringify({ content: value.content, isError: value.isError, meta: value.meta }, null, 2) : '';
    }, [preview.entry.block]);
    const tabs = [['result', phase === 'preparing' ? t('tool.tab.preview') : t('tool.tab.result')], ['input', t('tool.tab.input')], ['raw', t('tool.tab.raw')]];
    const activate = (index) => { const item = tabs[(index + tabs.length) % tabs.length]; setTab(item[0]); tabRefs.current[(index + tabs.length) % tabs.length]?.focus(); };
    if (depth > 6)
        return _jsx("p", { className: css.meta, children: t('tool.deepNested') });
    return _jsxs("div", { ref: element => { control.current = element?.querySelector('[data-disclosure-row]') ?? null; }, className: css.toolActivity, "data-reader-tool-call": entry.callId, "data-tool-phase": phase, "data-tool-args-length": model.raw.length, "data-tool-category": model.category, "data-expanded": open, "data-ud-check": "reader-tool-activity", children: [_jsx(DisclosureRow, { icon: _jsx(Icon, { size: 14 }), title: rowTitle, open: open, expandable: true, expandOnRowClick: true, keepContentWhenOpen: true, onToggle: () => { onRead(); setOpen(value => !value); }, rowClassName: css.nativeToolRow, collapsedContent: _jsxs(_Fragment, { children: [_jsx("span", { className: css.rowSeparator, "aria-hidden": true }), _jsx("span", { className: css.nativeToolSummary, title: rowSummary, "data-reader-tool-summary": true, ...(running ? { 'data-running': '' } : {}), children: rowSummary }), shownMs !== null && _jsxs("span", { className: css.toolElapsed, "data-reader-tool-elapsed": true, ...(shownMs >= SLOW_TOOL_MS ? { 'data-slow': '' } : {}), children: [(shownMs / 1000).toFixed(shownMs < 10000 ? 1 : 0), "s"] }), diff && _jsxs("span", { className: css.diffStat, "data-reader-diff-stat": true, children: [diff.added > 0 && _jsxs("span", { className: css.diffAdded, children: ["+", number.format(diff.added)] }), diff.removed > 0 && _jsxs("span", { className: css.diffRemoved, children: ["-", number.format(diff.removed)] })] }), showState && _jsx("span", { className: css.toolState, "data-phase": phase, children: t(PHASE_KEYS[phase]) })] }) }), _jsx(ProcessFragment, { open: open, motion: motion, onRead: onRead, returnFocusTo: control, nodeKey: `${entry.key}:detail`, framed: true, children: _jsxs("div", { id: detailId, className: css.toolDetails, children: [_jsxs("div", { className: css.toolLedger, "aria-live": "off", children: [_jsxs("span", { children: [t('tool.ledger'), " \u00B7 ", _jsx("span", { className: css.toolEngine, children: model.name })] }), _jsx("span", { "data-reader-tool-progress": true, children: phase === 'preparing' ? t('tool.receivedChars', { n: number.format(model.raw.length) }) : phase === 'running' ? t('tool.submittedWaiting') : phase === 'interrupted' ? t('tool.stoppedInputKept') : elapsed !== null ? t('tool.executedFor', { duration: duration(elapsed) }) : t('tool.resultRecorded') }), facts.exitCode !== undefined && _jsx("span", { children: t('tool.exitCode', { code: facts.exitCode }) }), facts.signal && _jsx("span", { children: t('tool.signal', { signal: facts.signal }) })] }), _jsx("div", { className: css.toolTabs, role: "tablist", "aria-label": t('tool.tabsAria', { title: model.title }), onKeyDown: event => {
                                const index = tabs.findIndex(item => item[0] === tab);
                                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                                    event.preventDefault();
                                    activate(index + (event.key === 'ArrowRight' ? 1 : -1));
                                }
                                else if (event.key === 'Home' || event.key === 'End') {
                                    event.preventDefault();
                                    activate(event.key === 'Home' ? 0 : tabs.length - 1);
                                }
                            }, children: tabs.map(([id, title], index) => _jsx("button", { ref: element => { tabRefs.current[index] = element; }, type: "button", role: "tab", id: `${detailId}-${id}`, "aria-selected": tab === id, "aria-controls": `${detailId}-panel`, tabIndex: tab === id ? 0 : -1, onClick: () => setTab(id), children: title }, id)) }), _jsxs("div", { ref: panel, id: `${detailId}-panel`, className: css.toolPanel, role: "tabpanel", "aria-labelledby": `${detailId}-${tab}`, tabIndex: 0, children: [selected && _jsx("p", { className: css.toolDetailNote, children: t('tool.selectionPaused') }), tab === 'result' && _jsx(ResultView, { ...render, ...preview }), tab === 'input' && _jsxs(_Fragment, { children: [_jsx(InputView, { model: preview.model, preparing: preview.phase === 'preparing', fillComposer: render.fillComposer }), _jsxs("details", { className: css.detail, children: [_jsx("summary", { children: t('tool.allInputFields') }), _jsx(JsonTree, { data: preview.model.args, label: t('tool.inputFields'), labels: jsonTreeLabels })] })] }), tab === 'raw' && _jsxs(_Fragment, { children: [_jsx("p", { className: css.toolDetailNote, children: t('tool.rawNote') }), _jsx("h4", { className: css.toolRawLabel, children: t('tool.input') }), _jsx("pre", { className: css.toolRaw, children: preview.model.raw || t('tool.inputNotArrived') }), rawResult && _jsxs(_Fragment, { children: [_jsx("h4", { className: css.toolRawLabel, children: t('tool.result') }), _jsx("pre", { className: css.toolRaw, children: rawResult })] })] })] })] }) }), !!block?.subCalls.length && _jsx("div", { className: css.toolChildren, "aria-label": t('tool.subCalls'), children: block.subCalls.map((child, index) => _jsx(ToolActivity, { ...render, entry: { kind: 'tool', key: `reader-tool:${child.callId}`, callId: child.callId, step: entry.step, order: index, block: child }, motion: motion, turnClosed: turnClosed, onRead: onRead, depth: depth + 1 }, child.callId)) })] });
}, (previous, next) => previous.entry.callId === next.entry.callId && previous.entry.block === next.entry.block
    && previous.entry.draft === next.entry.draft && previous.entry.step === next.entry.step
    && previous.motion === next.motion && previous.turnClosed === next.turnClosed && previous.depth === next.depth
    && previous.onRead === next.onRead && previous.renderSlotChain === next.renderSlotChain && previous.loadImage === next.loadImage && previous.fillComposer === next.fillComposer
    && previous.official === next.official && previous.cwd === next.cwd && previous.openFile === next.openFile);
/** Rich media (images, MCP widgets) rendered outside the folded tool ledger. */
export function ToolMedia({ block, depth = 0, ...render }) {
    if (depth > 6)
        return null;
    const settled = 'kind' in block;
    const visible = settled ? contentBlocks(block.content).filter(item => item.kind === 'image' || item.kind === 'other') : [];
    return _jsxs(_Fragment, { children: [visible.length > 0 && _jsx(Blocks, { ...render, blocks: visible, source: "tool" }), block.subCalls.map(child => _jsx(ToolMedia, { ...render, block: child, depth: depth + 1 }, child.callId))] });
}
//# sourceMappingURL=ToolActivity.js.map