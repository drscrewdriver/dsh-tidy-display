import { resolveWorkspacePath } from '@deepseek-ai/dsh-util-workspace-path';
import * as workspacePathPkg from '@deepseek-ai/dsh-util-workspace-path';
import { dirname } from './deliverables.js';
import { Reader } from './Reader.js';
import { NS, dictionaries, installTranslate, t } from './locales.js';
import { createReaderStore } from './store.js';
import { installReaderEntry } from './entry.js';
import { installBetterDisplaySettings } from './settings.js';
import { installConfigBridge } from './config-bridge.js';
import { RailView } from './rail/RailView.js';
import { installRailColors } from './rail/colors.js';
import { fillComposerDom } from './mcp-app.js';
import { fileAddressFor, modeFromSnapshot, openDeliverableFile } from './open-file.js';
import * as React from 'react';
import { installOfficialSlots, officialChildren } from './official-slots.js';
const officialFileAddressFor = workspacePathPkg.fileAddressFor;
async function openWorkspacePath(ctx, path) {
    const remote = ctx.remote;
    const remoteSession = remote?.session
        ?? ctx.get?.('remote.session')
        ?? (ctx.get?.('remote')?.session);
    if (remoteSession?.openWorkspacePath) {
        const result = await remoteSession.openWorkspacePath({ path });
        if (!result?.ok) {
            console.warn('[dsh-tidy-display] openWorkspacePath failed:', result?.error?.message);
        }
    }
    else {
        console.warn('[dsh-tidy-display] remote.session is not available');
    }
}
export { McpAppFrame } from './McpAppFrame.js';
export const name = 'dsh-tidy-display-client';
export const inject = ['slots', 'sessions', 'conversation', 'uiConversation', 'remote', 'remote.session', 'locale'];
export function apply(ctx) {
    // One registration activates all nine shipped languages; `bind` is resolved
    // lazily and cached, so helper modules can translate at render time too.
    const locale = (ctx.get?.('locale') ?? ctx.locale);
    if (locale?.register) {
        ctx.effect(() => locale.register(NS, dictionaries), 'dsh-tidy-display: dictionaries');
    }
    let bound;
    installTranslate(locale?.bind
        ? (key) => {
            try {
                bound ??= locale.bind(NS);
                return bound?.(key) ?? key;
            }
            catch {
                return key;
            }
        }
        : null);
    const store = createReaderStore();
    // conversation.view is session-scoped, so session persist keys are
    // `dsh.reader.v1.<sessionId>`. One root instance keeps glass, fold
    // intensity, and open-mode on the unsuffixed `dsh.reader.v1` key.
    const prefs = store.create();
    installBetterDisplaySettings(ctx, prefs);
    installConfigBridge(ctx, prefs);
    installRailColors({
        subscribe: prefs.subscribe,
        getSnapshot: () => {
            const s = prefs.getSnapshot();
            return {
                navColor: s.railColor,
                navColorCustom: s.railColorCustom,
                navColorLight: s.railColorLight,
                navAccent: s.railAccent,
                navAccentCustom: s.railAccentCustom,
                navAccentLight: s.railAccentLight,
            };
        },
    }, () => document.querySelector('[data-conversation-scroll]'));
    // 原生「对话」视图的轨挂载：视图选择按会话记忆，老会话常停在对话视图——
    // 轨若只挂阅读视图，这些会话就没有轨。两个视图都挂（同 tidychat 的 utilities 槽位）。
    function NativeRailView() {
        const snap = React.useSyncExternalStore(prefs.subscribe, () => prefs.getSnapshot());
        const loadEarlierPattern = /^(加载更早|Load earlier|Load older)/;
        const hasMore = [...document.querySelectorAll('button')]
            .some((b) => loadEarlierPattern.test((b.textContent || '').trim()));
        return React.createElement(RailView, {
            enabled: snap.railEnabled !== false,
            side: snap.railSide === 'right' ? 'right' : 'left',
            style: snap.railStyle === 'dot' ? 'dot' : 'bar',
            ring: snap.railRing === true,
            hideOfficialNav: snap.hideOfficialNav !== false,
            hasMore,
            loadOlder: () => {
                const btn = [...document.querySelectorAll('button')]
                    .find((b) => loadEarlierPattern.test((b.textContent || '').trim()));
                btn?.click();
            },
        });
    }
    ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({ name: 'conversation.session.header.utilities', id: 'tidy-display-nav' }, NativeRailView));
    ctx.slots.inject('conversation.chat.node', function* () {
        yield ctx.slots.register({
            name: 'conversation.view',
            id: 'reader',
            order: -5,
            label: () => t('view.reader'),
            locale: 'chat',
            children: {
                'dsh-tidy-display.block': { kind: 'chain', scope: 'session' },
                ...officialChildren(ctx.slots),
            },
            store,
            inject: (sessionId) => {
                const session = () => {
                    const current = ctx.sessions.binding(sessionId)?.session;
                    if (!current)
                        throw new Error('阅读页对应的会话已关闭。');
                    return current;
                };
                return {
                    openPrefs: prefs,
                    officialImageLoader: Object.assign((attachment) => ctx.uiConversation.imageUrl(sessionId, attachment), { peek: (attachment) => ctx.uiConversation.peekImageUrl(sessionId, attachment) }),
                    officialFileMentions: owner => ctx.get('chatFileMentions')?.forClosing(owner, sessionId),
                    officialPreviewFile: path => {
                        const cwd = ctx.sessions.list.getSnapshot().byId[sessionId]?.cwd;
                        const sidebar = ctx.get('sidebarRight');
                        if (!sidebar?.openResource)
                            throw new Error('文件预览面板不可用。');
                        sidebar.openResource((officialFileAddressFor ?? fileAddressFor)(sessionId, cwd, path));
                    },
                    officialHost: {
                        getSnapshot: () => ctx.remote.$host,
                        subscribe: listener => ctx.on('connection/reset', listener),
                    },
                    loadOlder: async () => { await session().loadOlder(); },
                    loadImage: async (attachment) => {
                        const receipt = await session().readAttachment(attachment.attachmentId);
                        if (!receipt.ok)
                            throw new Error(receipt.error.message);
                        return { data: Uint8Array.from(receipt.value.data), mediaType: receipt.value.attachment.mediaType };
                    },
                    openFile: async (path, options) => {
                        try {
                            const cwd = ctx.sessions?.list?.getSnapshot?.()?.byId[sessionId]?.cwd;
                            const sidebar = (ctx.get?.('sidebarRight')
                                ?? ctx.sidebarRight);
                            await openDeliverableFile({
                                path,
                                mode: modeFromSnapshot(prefs),
                                sessionId,
                                cwd,
                                resolveWorkspacePath,
                                openExternal: async (absolutePath) => { await openWorkspacePath(ctx, absolutePath); },
                                openSidebar: typeof sidebar?.openResource === 'function'
                                    ? (address) => { sidebar.openResource(address, options?.line === undefined ? undefined : { params: { line: options.line } }); }
                                    : undefined,
                                fileAddressFor: officialFileAddressFor ?? fileAddressFor,
                                warn: (message, extra) => { console.warn(message, extra); },
                            });
                        }
                        catch (error) {
                            console.warn('[dsh-tidy-display] openFile error:', error);
                        }
                    },
                    revealFile: async (path) => {
                        try {
                            const cwd = ctx.sessions?.list?.getSnapshot?.()?.byId[sessionId]?.cwd;
                            const targetPath = resolveWorkspacePath(cwd, path);
                            // 1. Try dedicated host endpoint for native file highlighting (open -R / explorer /select)
                            try {
                                const res = await fetch('/tidy-display/reveal', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ path: targetPath }),
                                });
                                if (res.ok) {
                                    const data = await res.json();
                                    if (data.ok)
                                        return;
                                }
                            }
                            catch {
                                // Server endpoint not yet available, fallback to directory open
                            }
                            // 2. Fallback to official opener with parent directory
                            const parentDir = dirname(targetPath);
                            const remote = ctx.remote;
                            const remoteSession = remote?.session
                                ?? ctx.get?.('remote.session');
                            if (remoteSession?.openWorkspacePath) {
                                await remoteSession.openWorkspacePath({ path: parentDir });
                            }
                        }
                        catch (error) {
                            console.warn('[dsh-tidy-display] revealFile error:', error);
                        }
                    },
                    forkAt: (seq) => {
                        // A missing anchor would silently fork the whole session instead of
                        // the intended turn prefix, so refuse it loudly rather than guessing.
                        if (typeof seq !== 'number' || !Number.isFinite(seq)) {
                            console.warn('[dsh-tidy-display] fork refused: missing anchor seq');
                            return;
                        }
                        try {
                            const sessionsApi = ctx.sessions;
                            if (sessionsApi?.fork) {
                                sessionsApi.fork({ sessionId, atSeq: seq, increaseTitle: true })
                                    .then(childId => { sessionsApi.open?.(childId); })
                                    .catch(err => { console.warn('[dsh-tidy-display] fork failed:', err); });
                            }
                        }
                        catch (error) {
                            console.warn('[dsh-tidy-display] forkAt error:', error);
                        }
                    },
                    loadThrough: async (seq) => {
                        try {
                            const current = session();
                            if (typeof current?.loadThrough === 'function') {
                                await current.loadThrough(seq);
                            }
                            else {
                                await session().loadOlder();
                            }
                        }
                        catch (error) {
                            console.warn('[dsh-tidy-display] loadThrough error:', error);
                        }
                    },
                    fillComposer: (text) => {
                        // Sanctioned path: the conversation input shell owns the Lexical
                        // editor, so setDraft lands in the draft store deterministically.
                        try {
                            const conversation = ctx.conversation;
                            const shell = conversation?.input?.shell?.(sessionId);
                            if (shell && typeof shell.setDraft === 'function') {
                                shell.setDraft(text);
                                return true;
                            }
                        }
                        catch {
                            // Fall through to the DOM path below.
                        }
                        try {
                            return fillComposerDom(text);
                        }
                        catch {
                            return false;
                        }
                    },
                };
            },
        }, Reader);
        yield installOfficialSlots(ctx);
        yield installReaderEntry(ctx);
    });
}
//# sourceMappingURL=index.js.map