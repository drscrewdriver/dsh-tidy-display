/**
 * Plugin-owned i18n dictionaries for the Tidy Display reader UI.
 *
 * The settings panel ships its own vocabulary in `settings-copy.ts` under the
 * `tidy-display` namespace; this module owns the *conversation* surface (the
 * reading view, the message rail, tool cards, metrics chips) under the plugin
 * namespace `dsh-tidy-display`, registered through the DSH `locale` service.
 *
 * `zh` is the key-set source of truth — it holds the copy the components used
 * before i18n existed — and every other language is typed as
 * `Record<TidyKey, string>`, so a missing or extra key is a COMPILE error
 * instead of a runtime fallback to a raw key.
 */
/** The namespace owned by this plugin. */
export declare const NS = "dsh-tidy-display";
/** Simplified Chinese dictionary — the key-set source of truth. */
export declare const zh: {
    'common.copy': string;
    'common.copied': string;
    'common.collapse': string;
    'common.expand': string;
    'common.expandLines': string;
    'view.reader': string;
    'reader.fallbackError': string;
    'reader.stopped': string;
    'reader.steering': string;
    'reader.turnError': string;
    'reader.maxTokens': string;
    'reader.retryNotice': string;
    'reader.commandError': string;
    'reader.commandRecordFallback': string;
    'reader.unknownNode': string;
    'reader.viewInChat': string;
    'reader.rawRecord': string;
    'reader.systemPrompt': string;
    'reader.modelRetryRecord': string;
    'reader.commandRecord': string;
    'reader.sessionError': string;
    'reader.loading': string;
    'reader.deepDiving': string;
    'reader.jumpBottom': string;
    'reader.pendingQuestion': string;
    'reader.pendingConfirm': string;
    'reader.pendingHint': string;
    'reader.blockError': string;
    'reader.unknownBlock': string;
    'reader.rawContent': string;
    'reader.toolArgs': string;
    'reader.copyFailed': string;
    'reader.copyAnswer': string;
    'reader.forkAria': string;
    'reader.forkTitle': string;
    'reader.copyMessage': string;
    'reader.blockErrorDetail': string;
    'image.zoom': string;
    'image.zoomNamed': string;
    'image.alt': string;
    'image.altPending': string;
    'image.error': string;
    'image.loading': string;
    'image.retry': string;
    'image.preview': string;
    'image.close': string;
    'status.process': string;
    'status.elapsedSec': string;
    'status.elapsedMin': string;
    'status.awaitUser': string;
    'status.subagents': string;
    'status.usingTool': string;
    'status.thinking': string;
    'status.outputting': string;
    'status.preparingReply': string;
    'status.processing': string;
    'compaction.label': string;
    'compaction.items': string;
    'compaction.tokens': string;
    'compaction.itemsTokens': string;
    'compaction.titleCollapse': string;
    'compaction.titleExpand': string;
    'compaction.toggleCollapse': string;
    'compaction.toggleExpand': string;
    'compaction.summaryHeader': string;
    'compaction.errorTitle': string;
    'deliverables.label': string;
    'deliverables.more': string;
    'deliverables.workspaceTitle': string;
    'deliverables.workspaceOpened': string;
    'deliverables.showInFolder': string;
    'deliverables.openSidebar': string;
    'deliverables.openExternal': string;
    'deliverables.openedSidebar': string;
    'deliverables.openedExternal': string;
    'deliverables.fileActions': string;
    'deliverables.revealTitle': string;
    'deliverables.revealAria': string;
    'deliverables.copyPath': string;
    'deliverables.openPath': string;
    'toolbar.autoFoldTitle': string;
    'toolbar.autoFoldOn': string;
    'toolbar.autoFoldOff': string;
    'history.loading': string;
    'history.load': string;
    'history.error': string;
    'tool.phase.preparing': string;
    'tool.phase.running': string;
    'tool.phase.returned': string;
    'tool.phase.succeeded': string;
    'tool.phase.failed': string;
    'tool.phase.interrupted': string;
    'tool.generatingInput': string;
    'tool.inputFileContent': string;
    'tool.previewTruncated': string;
    'tool.fileContent': string;
    'tool.generatingCommand': string;
    'tool.submittedCommand': string;
    'tool.receivedFields': string;
    'tool.input': string;
    'tool.interruptedNoResult': string;
    'tool.preparingNote': string;
    'tool.waitingResult': string;
    'tool.cancelled': string;
    'tool.writeReturned': string;
    'tool.codeNoOutput': string;
    'tool.mediaElsewhere': string;
    'tool.noContent': string;
    'tool.stoppedKept': string;
    'tool.tab.preview': string;
    'tool.tab.result': string;
    'tool.tab.input': string;
    'tool.tab.raw': string;
    'tool.deepNested': string;
    'tool.ledger': string;
    'tool.receivedChars': string;
    'tool.submittedWaiting': string;
    'tool.stoppedInputKept': string;
    'tool.executedFor': string;
    'tool.resultRecorded': string;
    'tool.exitCode': string;
    'tool.signal': string;
    'tool.tabsAria': string;
    'tool.selectionPaused': string;
    'tool.allInputFields': string;
    'tool.inputFields': string;
    'tool.rawNote': string;
    'tool.result': string;
    'tool.inputNotArrived': string;
    'tool.subCalls': string;
    'tool.ms': string;
    'tool.sec': string;
    'tool.verbWrite': string;
    'tool.verbEdit': string;
    'tool.verbRead': string;
    'tool.titleEditPatch': string;
    'tool.titleWriteFile': string;
    'tool.titleEditFile': string;
    'tool.titleReadFile': string;
    'tool.runCommand': string;
    'tool.findFiles': string;
    'tool.searchContent': string;
    'tool.webSearch': string;
    'tool.webFetch': string;
    'tool.runCode': string;
    'tool.preparingFile': string;
    'tool.preparingCommand': string;
    'tool.preparingInput': string;
    'reason.label': string;
    'reason.step': string;
    'reason.region': string;
    'reason.regionScrollable': string;
    'reason.pauseAria': string;
    'reason.resumeAria': string;
    'reason.selectionHint': string;
    'reason.pause': string;
    'reason.follow': string;
    'reason.manualReading': string;
    'reason.scrollableReading': string;
    'reason.collapseAria': string;
    'reason.expandAria': string;
    'reason.expandRead': string;
    'disclosure.process': string;
    'disclosure.collapseAria': string;
    'disclosure.expandAria': string;
    'fold.previous': string;
    'fold.processDetail': string;
    'fold.reasoning': string;
    'fold.body': string;
    'fold.tool': string;
    'fold.record': string;
    'turn.aborted': string;
    'turn.blocked': string;
    'turn.maxTokens': string;
    'turn.error': string;
    'turn.unknown': string;
    'metrics.tokensTitle': string;
    'metrics.usage': string;
    'metrics.timingTitle': string;
    'metrics.dialogAria': string;
    'metrics.header': string;
    'metrics.timingSection': string;
    'metrics.totalTime': string;
    'metrics.tps': string;
    'metrics.ttft': string;
    'metrics.tokenSection': string;
    'metrics.total': string;
    'metrics.input': string;
    'metrics.cacheHit': string;
    'metrics.cacheRead': string;
    'metrics.output': string;
    'metrics.thinkingTokens': string;
    'time.seconds': string;
    'time.minutesSeconds': string;
    'time.ranFor': string;
    'time.overtime': string;
    'date.monthDay': string;
    'date.yearMonthDay': string;
    'rail.olderHead': string;
    'rail.olderTip': string;
    'rail.aria': string;
    'diff.linesAria': string;
    'mcp.defaultTitle': string;
    'mcp.receiptChoice': string;
    'mcp.receiptAction': string;
    'mcp.receiptVariant': string;
    'mcp.reset': string;
    'mcp.ready': string;
    'mcp.fillHint': string;
    'mcp.fillButton': string;
    'mcp.generating': string;
    'mcp.generatingNamed': string;
    'md.copyCode': string;
    'md.footnotes': string;
    'read.code': string;
    'read.wrap': string;
    'read.unwrap': string;
    'read.window': string;
    'read.collapseAria': string;
    'term.noExitCode': string;
    'term.noOutput': string;
    'term.collapseAria': string;
    'diff.collapseAria': string;
    'search.paths': string;
    'search.matches': string;
    'search.truncated': string;
    'search.noResults': string;
    'search.collapseAria': string;
    'web.sourcesTruncated': string;
    'web.contentTruncated': string;
    'json.truncated': string;
    'json.copyValue': string;
    'json.copyJson': string;
    'json.copyPath': string;
    'json.copyPretty': string;
    'json.copyCompact': string;
    'json.copyFailed': string;
    'json.collapseNode': string;
    'json.expandNode': string;
};
/** The key union: what a `t('…')` call may name inside this namespace. */
export type TidyKey = keyof typeof zh;
/** English dictionary, checked complete against the zh key set. */
export declare const en: Record<TidyKey, string>;
/** Japanese dictionary, checked complete against the zh key set. */
export declare const ja: Record<TidyKey, string>;
/** Korean dictionary, checked complete against the zh key set. */
export declare const ko: Record<TidyKey, string>;
/** French dictionary, checked complete against the zh key set. */
export declare const fr: Record<TidyKey, string>;
/** German dictionary, checked complete against the zh key set. */
export declare const de: Record<TidyKey, string>;
/** Italian dictionary, checked complete against the zh key set. */
export declare const it: Record<TidyKey, string>;
/** Russian dictionary, checked complete against the zh key set. */
export declare const ru: Record<TidyKey, string>;
/** Spanish dictionary, checked complete against the zh key set. */
export declare const es: Record<TidyKey, string>;
/** All languages this plugin ships, in one call to the host locale service. */
export declare const dictionaries: Record<string, Record<string, string>>;
/** Install the host-backed lookup; `null` unbinds it (tests, SSR, early boot). */
export declare function installTranslate(fn: ((key: string) => string) | null): void;
/**
 * Translate `key` inside {@link NS}, interpolating `{placeholder}` params.
 *
 * Fallback chain: active locale → the `zh` source copy → the raw key. Falling
 * back to `zh` (instead of the key) keeps every string readable — and keeps the
 * existing unit tests, which assert the Chinese copy — green when no locale
 * service is installed.
 */
export declare function t(key: string, params?: Record<string, string | number>): string;
//# sourceMappingURL=locales.d.ts.map