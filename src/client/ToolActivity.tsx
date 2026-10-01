import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ToolCallBlock, ToolResultNode } from '@deepseek-ai/dsh-client-ui-conversation/client';
import type { DiffHunk, ReadBlockLine, SearchFileGroup } from '@deepseek-ai/dsh-client-ui-primitives';
import { DiffBlock, DisclosureRow, JsonTree, ReadBlock, SearchBlock, TerminalBlock, WebBlock,
  IconApiOutlineRegular, IconBrowseOutlineRegular, IconEditOutlineRegular, IconSearchOutlineRegular, IconSkillOutlineRegular, IconSparkleRegular } from '@deepseek-ai/dsh-client-ui-primitives';
import { Blocks, contentBlocks } from './Blocks.js';
import { OfficialTool } from './OfficialContent.js';
import { ProcessFragment } from './motion.js';
import { activityPhase, activitySummary, callDiffHunks, diffTotals, executionFacts, objectValue } from './tool-activity.js';
import type { ToolActivityEntry, ToolCategory, ToolPhase } from './tool-activity.js';
import type { BlockRenderProps } from './types.js';
import { classifyTool, toolRowModel, VARIANT_TITLES } from './native/tool-call-model.js';
import { McpAppFrame, StreamingMcpAppPlaceholder } from './McpAppFrame.js';
import { diffBlockLabels, jsonTreeLabels, readBlockLabels, searchBlockLabels, terminalBlockLabels, webBlockLabels } from './primitive-labels.js';
import { t } from './locales.js';
import css from './Reader.module.css';

// Phase labels resolve at render time, so a language switch reaches cards that
// are already mounted; only the key lives here, the copy lives in locales.ts.
const PHASE_KEYS: Record<ToolPhase, string> = { preparing: 'tool.phase.preparing', running: 'tool.phase.running', returned: 'tool.phase.returned', succeeded: 'tool.phase.succeeded', failed: 'tool.phase.failed', interrupted: 'tool.phase.interrupted' };
const ICONS = { write: IconEditOutlineRegular, read: IconBrowseOutlineRegular, terminal: IconApiOutlineRegular, search: IconSearchOutlineRegular, web: IconSearchOutlineRegular, code: IconApiOutlineRegular, other: IconSparkleRegular } satisfies Record<ToolCategory, unknown>;
const number = new Intl.NumberFormat('zh-CN');
const language = (path: string | undefined) => path?.split('.').at(-1);
const duration = (ms: number) => ms < 1000 ? t('tool.ms', { n: Math.round(ms) }) : t('tool.sec', { n: (ms / 1000).toFixed(ms < 10000 ? 1 : 0) });

function generatedInput(content: string, target: string | undefined, preparing: boolean) {
  const lines = content.split('\n').map((text, index) => ({ number: index + 1, text }));
  const visible = preparing ? lines.slice(-12) : lines.slice(0, 1600);
  return <div data-reader-tool-file><p className={css.toolDetailNote}>{preparing ? t('tool.generatingInput') : t('tool.inputFileContent')}{!preparing && lines.length > visible.length ? t('tool.previewTruncated') : ''}</p>
    <ReadBlock label={target ?? t('tool.fileContent')} lang={language(target)} lines={visible} totalLines={lines.length} maxLines={16} labels={readBlockLabels} />
  </div>;
}

function InputView({ model, preparing, fillComposer }: { model: ReturnType<typeof activitySummary>; preparing: boolean; fillComposer: BlockRenderProps['fillComposer'] }) {
  if ((model.name === 'render_ui' || model.name === 'show_widget') && typeof model.args?.html === 'string') {
    return preparing
      ? <StreamingMcpAppPlaceholder title={typeof model.args.title === 'string' ? (model.args.title as string) : undefined} />
      : <McpAppFrame html={model.args.html as string} title={typeof model.args.title === 'string' ? (model.args.title as string) : undefined} fillComposer={fillComposer} />;
  }
  if (model.content) return generatedInput(model.content, model.target, preparing);
  if (model.command) return <div data-reader-tool-terminal><p className={css.toolDetailNote}>{preparing ? t('tool.generatingCommand') : t('tool.submittedCommand')}</p><TerminalBlock command={model.command} cwd={model.cwd} labels={terminalBlockLabels} /></div>;
  return <JsonTree data={model.args} label={preparing ? t('tool.receivedFields') : t('tool.input')} labels={jsonTreeLabels} />;
}

function readLines(value: unknown): ReadBlockLine[] | null {
  if (!Array.isArray(value)) return null;
  const lines: ReadBlockLine[] = [];
  for (const item of value) {
    const row = objectValue(item);
    if (typeof row?.number !== 'number' || !Number.isInteger(row.number) || typeof row.text !== 'string') return null;
    lines.push({ number: row.number, text: row.text });
  }
  return lines;
}

/** A step past this reads as slow rather than merely in progress. */
const SLOW_TOOL_MS = 10_000;

function diffHunks(value: unknown): DiffHunk[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const diffs: DiffHunk[] = [];
  for (const item of value) {
    const row = objectValue(item);
    if (typeof row?.path !== 'string' || (row.oldText !== null && typeof row.oldText !== 'string') || typeof row.newText !== 'string') return null;
    diffs.push({ path: row.path, oldText: row.oldText, newText: row.newText });
  }
  return diffs;
}

function searchFiles(value: unknown): SearchFileGroup[] | null {
  if (!Array.isArray(value)) return null;
  const files: SearchFileGroup[] = [];
  for (const item of value) {
    const row = objectValue(item);
    if (typeof row?.path !== 'string' || !Array.isArray(row.matches)) return null;
    const matches: { lineNumber: number; line: string }[] = [];
    for (const itemMatch of row.matches) {
      const match = objectValue(itemMatch);
      if (typeof match?.lineNumber !== 'number' || !Number.isInteger(match.lineNumber) || typeof match.line !== 'string') return null;
      matches.push({ lineNumber: match.lineNumber, line: match.line });
    }
    files.push({ path: row.path, matches });
  }
  return files;
}

function ResultView(props: BlockRenderProps & { entry: ToolActivityEntry; model: ReturnType<typeof activitySummary>; phase: ToolPhase }) {
  const { official, entry, model } = props;
  const fallback = <ResultFallback {...props} />;
  if (!official || !entry.block || model.name === 'render_ui' || model.name === 'show_widget') return fallback;
  return <OfficialTool {...props} official={official} block={entry.block} toolName={model.name} cwd={props.cwd ?? model.cwd} fallback={fallback} />;
}

function ResultFallback({ entry, model, phase, ...render }: BlockRenderProps & { entry: ToolActivityEntry; model: ReturnType<typeof activitySummary>; phase: ToolPhase }) {
  if ((model.name === 'render_ui' || model.name === 'show_widget') && typeof model.args?.html === 'string') {
    return <McpAppFrame html={model.args.html as string} title={typeof model.args.title === 'string' ? (model.args.title as string) : undefined} fillComposer={render.fillComposer} />;
  }
  const block = entry.block;
  if (!block || !('kind' in block)) return <>
    <p className={css.toolDetailNote}>{phase === 'interrupted' ? t('tool.interruptedNoResult') : phase === 'preparing' ? t('tool.preparingNote') : t('tool.waitingResult')}</p>
    <InputView model={model} preparing={phase === 'preparing'} fillComposer={render.fillComposer} />
  </>;
  const meta = objectValue(block.meta);
  const text = block.content.filter(item => item.type === 'text').map(item => item.text).join('\n');
  if (phase === 'interrupted') return <><p className={css.toolDetailNote}>{t('tool.cancelled')}</p><InputView model={model} preparing={false} fillComposer={render.fillComposer} /><pre className={css.toolRaw}>{text}</pre></>;

  if (model.category === 'terminal') {
    const facts = executionFacts(block);
    const output = text.replace(/\n\[(?:exit code: \d+|killed by signal: [^\]\n]+)\]$/, '');
    return <div data-reader-tool-terminal><TerminalBlock command={model.command ?? model.name} cwd={model.cwd}
      output={output} exitCode={facts.exitCode} signal={facts.signal} maxLines={18} labels={terminalBlockLabels} /></div>;
  }
  const lines = readLines(meta?.lines);
  if (model.category === 'read' && typeof meta?.path === 'string' && typeof meta.totalLines === 'number' && lines) return <div data-reader-tool-file><ReadBlock label={meta.path} lang={typeof meta.lang === 'string' ? meta.lang : undefined} lines={lines} totalLines={meta.totalLines} maxLines={18} labels={readBlockLabels} /></div>;
  // The host's own hunks when it sent them; otherwise derive them from the call's
  // arguments, which is also what the official row does while a write is pending.
  // Both the counts and this card read the same source, so they cannot disagree.
  const diffs = diffHunks(meta?.diffs) ?? callDiffHunks(block, model.args, model.name);
  if (diffs.length) return <div data-reader-tool-diff><DiffBlock diffs={diffs} maxLines={18} labels={diffBlockLabels} /></div>;
  if (model.category === 'search' && typeof meta?.total === 'number' && typeof meta.truncated === 'boolean') {
    if (meta.shape === 'paths' && Array.isArray(meta.paths) && meta.paths.every((path): path is string => typeof path === 'string')) return <div data-reader-tool-search><SearchBlock kind="paths" paths={meta.paths} total={meta.total} truncated={meta.truncated} maxLines={18} labels={searchBlockLabels} /></div>;
    const files = searchFiles(meta.files);
    if (meta.shape === 'matches' && files) return <div data-reader-tool-search><SearchBlock kind="matches" files={files} total={meta.total} truncated={meta.truncated} maxLines={18} labels={searchBlockLabels} /></div>;
  }
  if (model.category === 'web' && typeof meta?.truncated === 'boolean') {
    if (model.name === 'web_fetch' && typeof meta.url === 'string' && typeof meta.statusCode === 'number') return <div data-reader-tool-web><WebBlock kind="fetch" url={meta.url} statusCode={meta.statusCode} truncated={meta.truncated} labels={webBlockLabels} /></div>;
    if (model.name === 'web_search' && Array.isArray(meta.sources)) {
      const sources = meta.sources.flatMap(source => {
        const item = objectValue(source);
        return typeof item?.url === 'string' ? [{ url: item.url, ...(typeof item.title === 'string' ? { title: item.title } : {}), ...(typeof item.snippet === 'string' ? { snippet: item.snippet } : {}), ...(typeof item.publishedAt === 'string' ? { publishedAt: item.publishedAt } : {}) }] : [];
      });
      if (sources.length === meta.sources.length) return <div data-reader-tool-web><WebBlock kind="search" sources={sources} answer={typeof meta.answer === 'string' ? meta.answer : undefined} truncated={meta.truncated} labels={webBlockLabels} /></div>;
    }
  }
  // A trace/export may omit wire presentation. Keep the generated input clearly
  // labelled; it is not proof of an applied diff or a successful file mutation.
  if (model.category === 'write' && model.content && !block.isError) return <>
    <p className={css.toolDetailNote}>{t('tool.writeReturned')}</p>
    {generatedInput(model.content, model.target, false)}
  </>;
  const content: ToolResultNode['content'] = block.content;
  // A code interpreter's product is its result, not prose. Without this branch
  // the output fell through to the generic document path below, which emits it
  // as reader answer text — so a run_code card sat in the transcript outside
  // every fold, the exact block the reader wanted to be able to close.
  if (model.category === 'code') {
    const output = content.filter(item => item.type === 'text').map(item => item.text).join('\n');
    const facts = executionFacts(block);
    if (output.trim()) return <div data-reader-tool-code>
      <TerminalBlock command={model.command ?? model.name} cwd={model.cwd} output={output}
        exitCode={facts.exitCode} signal={facts.signal} maxLines={18} labels={terminalBlockLabels} />
    </div>;
    return <p className={css.toolDetailNote}>{t('tool.codeNoOutput')}</p>;
  }
  if (content.some(item => item.type === 'text')) return <div className={css.toolDocument}><Blocks {...render} blocks={contentBlocks(content).filter(item => item.kind === 'text')} source="tool" /></div>;
  if (content.length) return <p className={css.toolDetailNote}>{t('tool.mediaElsewhere')}</p>;
  return <p className={css.toolDetailNote}>{t('tool.noContent')}</p>;
}

/** One occurrence, keyed by call id all the way from generation to result. */
export const ToolActivity = memo(function ToolActivityView({ entry, motion, turnClosed, onRead, depth = 0, ...render }: BlockRenderProps & {
  entry: ToolActivityEntry; motion: boolean; turnClosed: boolean; onRead: () => void; depth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'result' | 'input' | 'raw'>('result');
  const control = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(false);
  const detailId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const model = useMemo(() => activitySummary(entry), [entry.block, entry.draft]);
  const phase = activityPhase(entry, turnClosed);
  const heldPreview = useRef({ entry, model, phase });
  if (!selected) heldPreview.current = { entry, model, phase };
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
  const [liveMs, setLiveMs] = useState<number | null>(null);
  const openedAt = useRef<number | null>(null);
  useEffect(() => {
    if (!running) { openedAt.current = null; setLiveMs(null); return; }
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
  const tabs = [['result', phase === 'preparing' ? t('tool.tab.preview') : t('tool.tab.result')], ['input', t('tool.tab.input')], ['raw', t('tool.tab.raw')]] as const;
  const activate = (index: number) => { const item = tabs[(index + tabs.length) % tabs.length]!; setTab(item[0]); tabRefs.current[(index + tabs.length) % tabs.length]?.focus(); };
  if (depth > 6) return <p className={css.meta}>{t('tool.deepNested')}</p>;
  return <div ref={element => { control.current = element?.querySelector<HTMLElement>('[data-disclosure-row]') ?? null; }} className={css.toolActivity} data-reader-tool-call={entry.callId} data-tool-phase={phase} data-tool-args-length={model.raw.length} data-tool-category={model.category} data-expanded={open} data-ud-check="reader-tool-activity">
    <DisclosureRow icon={<Icon size={14} />} title={rowTitle} open={open} expandable expandOnRowClick keepContentWhenOpen
      onToggle={() => { onRead(); setOpen(value => !value); }} rowClassName={css.nativeToolRow}
      collapsedContent={<><span className={css.rowSeparator} aria-hidden /><span className={css.nativeToolSummary} title={rowSummary} data-reader-tool-summary
        {...(running ? { 'data-running': '' } : {})}>{rowSummary}</span>
        {shownMs !== null && <span className={css.toolElapsed} data-reader-tool-elapsed
          {...(shownMs >= SLOW_TOOL_MS ? { 'data-slow': '' } : {})}>
          {(shownMs / 1000).toFixed(shownMs < 10000 ? 1 : 0)}s</span>}
        {diff && <span className={css.diffStat} data-reader-diff-stat>
          {diff.added > 0 && <span className={css.diffAdded}>+{number.format(diff.added)}</span>}
          {diff.removed > 0 && <span className={css.diffRemoved}>-{number.format(diff.removed)}</span>}
        </span>}
        {showState && <span className={css.toolState} data-phase={phase}>{t(PHASE_KEYS[phase])}</span>}</>} />
    <ProcessFragment open={open} motion={motion} onRead={onRead} returnFocusTo={control} nodeKey={`${entry.key}:detail`} framed>
      <div id={detailId} className={css.toolDetails}>
        <div className={css.toolLedger} aria-live="off">
          <span>{t('tool.ledger')} · <span className={css.toolEngine}>{model.name}</span></span>
          <span data-reader-tool-progress>{phase === 'preparing' ? t('tool.receivedChars', { n: number.format(model.raw.length) }) : phase === 'running' ? t('tool.submittedWaiting') : phase === 'interrupted' ? t('tool.stoppedInputKept') : elapsed !== null ? t('tool.executedFor', { duration: duration(elapsed) }) : t('tool.resultRecorded')}</span>
          {facts.exitCode !== undefined && <span>{t('tool.exitCode', { code: facts.exitCode })}</span>}
          {facts.signal && <span>{t('tool.signal', { signal: facts.signal })}</span>}
        </div>
        <div className={css.toolTabs} role="tablist" aria-label={t('tool.tabsAria', { title: model.title })} onKeyDown={event => {
          const index = tabs.findIndex(item => item[0] === tab);
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); activate(index + (event.key === 'ArrowRight' ? 1 : -1)); }
          else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); activate(event.key === 'Home' ? 0 : tabs.length - 1); }
        }}>{tabs.map(([id, title], index) => <button key={id} ref={element => { tabRefs.current[index] = element; }} type="button" role="tab" id={`${detailId}-${id}`} aria-selected={tab === id} aria-controls={`${detailId}-panel`} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)}>{title}</button>)}</div>
        <div ref={panel} id={`${detailId}-panel`} className={css.toolPanel} role="tabpanel" aria-labelledby={`${detailId}-${tab}`} tabIndex={0}>
          {selected && <p className={css.toolDetailNote}>{t('tool.selectionPaused')}</p>}
          {tab === 'result' && <ResultView {...render} {...preview} />}
          {tab === 'input' && <><InputView model={preview.model} preparing={preview.phase === 'preparing'} fillComposer={render.fillComposer} /><details className={css.detail}><summary>{t('tool.allInputFields')}</summary><JsonTree data={preview.model.args} label={t('tool.inputFields')} labels={jsonTreeLabels} /></details></>}
          {tab === 'raw' && <><p className={css.toolDetailNote}>{t('tool.rawNote')}</p><h4 className={css.toolRawLabel}>{t('tool.input')}</h4><pre className={css.toolRaw}>{preview.model.raw || t('tool.inputNotArrived')}</pre>{rawResult && <><h4 className={css.toolRawLabel}>{t('tool.result')}</h4><pre className={css.toolRaw}>{rawResult}</pre></>}</>}
        </div>
      </div>
    </ProcessFragment>
    {!!block?.subCalls.length && <div className={css.toolChildren} aria-label={t('tool.subCalls')}>{block.subCalls.map((child, index) => <ToolActivity key={child.callId} {...render}
      entry={{ kind: 'tool', key: `reader-tool:${child.callId}`, callId: child.callId, step: entry.step, order: index, block: child }}
      motion={motion} turnClosed={turnClosed} onRead={onRead} depth={depth + 1} />)}</div>}
  </div>;
}, (previous, next) => previous.entry.callId === next.entry.callId && previous.entry.block === next.entry.block
  && previous.entry.draft === next.entry.draft && previous.entry.step === next.entry.step
  && previous.motion === next.motion && previous.turnClosed === next.turnClosed && previous.depth === next.depth
  && previous.onRead === next.onRead && previous.renderSlotChain === next.renderSlotChain && previous.loadImage === next.loadImage && previous.fillComposer === next.fillComposer
  && previous.official === next.official && previous.cwd === next.cwd && previous.openFile === next.openFile);

/** Rich media (images, MCP widgets) rendered outside the folded tool ledger. */
export function ToolMedia({ block, depth = 0, ...render }: BlockRenderProps & { block: ToolCallBlock; depth?: number }) {
  if (depth > 6) return null;
  const settled = 'kind' in block;
  const visible = settled ? contentBlocks(block.content).filter(item => item.kind === 'image' || item.kind === 'other') : [];
  return <>
    {visible.length > 0 && <Blocks {...render} blocks={visible} source="tool" />}
    {block.subCalls.map(child => <ToolMedia key={child.callId} {...render} block={child} depth={depth + 1} />)}
  </>;
}
