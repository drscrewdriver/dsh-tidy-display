import { t } from './locales.js';
/**
 * Labels handed to the official content primitives.
 *
 * Every plain string is a getter on purpose: the primitive components keep the
 * object identity around, so resolving through `t()` at property-read time is
 * what lets a mid-session language switch take effect on the next render
 * instead of freezing the copy at module load.
 */
export const markdownLabels = {
    code: { get copyLabel() { return t('common.copy'); }, get copiedLabel() { return t('common.copied'); } },
    get footnotes() { return t('md.footnotes'); },
};
export const readBlockLabels = {
    get codeLabel() { return t('read.code'); },
    get wrapLabel() { return t('read.wrap'); },
    get unwrapLabel() { return t('read.unwrap'); },
    window: (shown, total) => t('read.window', { shown, total }),
    get copy() { return t('common.copy'); },
    get copied() { return t('common.copied'); },
    get collapseAria() { return t('read.collapseAria'); },
    expandAria: hidden => t('common.expandLines', { n: hidden }),
    get collapse() { return t('common.collapse'); },
    expand: hidden => t('common.expandLines', { n: hidden }),
};
export const terminalBlockLabels = {
    signal: signal => t('tool.signal', { signal }),
    exitCode: code => t('tool.exitCode', { code }),
    get noExitCode() { return t('term.noExitCode'); },
    get running() { return t('tool.phase.running'); },
    get failed() { return t('tool.phase.failed'); },
    get done() { return t('tool.phase.succeeded'); },
    get copy() { return t('common.copy'); },
    get copied() { return t('common.copied'); },
    get noOutput() { return t('term.noOutput'); },
    get collapseAria() { return t('term.collapseAria'); },
    get collapse() { return t('common.collapse'); },
    expandAria: hidden => t('common.expandLines', { n: hidden }),
    expand: hidden => t('common.expandLines', { n: hidden }),
};
export const diffBlockLabels = {
    get codeLabel() { return t('read.code'); },
    get wrapLabel() { return t('read.wrap'); },
    get unwrapLabel() { return t('read.unwrap'); },
    get copy() { return t('common.copy'); },
    get copied() { return t('common.copied'); },
    get collapseAria() { return t('diff.collapseAria'); },
    get collapse() { return t('common.collapse'); },
    expandAria: hidden => t('common.expandLines', { n: hidden }),
    expand: hidden => t('common.expandLines', { n: hidden }),
};
export const searchBlockLabels = {
    pathsSummary: (shown, total, truncated) => `${t('search.paths', { shown, total })}${truncated ? t('search.truncated') : ''}`,
    matchesSummary: (shown, total, files, truncated) => `${t('search.matches', { shown, total, files })}${truncated ? t('search.truncated') : ''}`,
    get copy() { return t('common.copy'); },
    get copied() { return t('common.copied'); },
    get noResults() { return t('search.noResults'); },
    get collapseAria() { return t('search.collapseAria'); },
    get collapse() { return t('common.collapse'); },
    expandAria: hidden => t('common.expandLines', { n: hidden }),
    expand: hidden => t('common.expandLines', { n: hidden }),
};
export const webBlockLabels = {
    get noResults() { return t('search.noResults'); },
    get sourcesTruncated() { return t('web.sourcesTruncated'); },
    http: 'HTTP',
    get contentTruncated() { return t('web.contentTruncated'); },
    markdown: markdownLabels,
};
export const jsonTreeLabels = {
    get copyValue() { return t('json.copyValue'); },
    get copyJson() { return t('json.copyJson'); },
    get copyPath() { return t('json.copyPath'); },
    get copyPrettyJson() { return t('json.copyPretty'); },
    get copyCompactJson() { return t('json.copyCompact'); },
    get copied() { return t('common.copied'); },
    get copyFailed() { return t('json.copyFailed'); },
    get collapseNode() { return t('json.collapseNode'); },
    get expandNode() { return t('json.expandNode'); },
    copyButtonTitle: action => action,
};
export const truncatedJsonLabel = (total) => t('json.truncated', { total });
//# sourceMappingURL=primitive-labels.js.map