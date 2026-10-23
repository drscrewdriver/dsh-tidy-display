import { resolveWorkspacePath } from '@deepseek-ai/dsh-util-workspace-path';
import * as workspacePathPkg from '@deepseek-ai/dsh-util-workspace-path';
import { dirname } from './deliverables.js';
import { Reader } from './Reader.js';
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
import { ensureGenuiPlateCss } from './genui-plate.js';
import { NS, dictionaries, installTranslate, t } from './locales.js';
import { softSvc, safeSeat } from './soft-svc.js';
const officialFileAddressFor = workspacePathPkg.fileAddressFor;
async function openWorkspacePath(ctx, path) {
    const remote = softSvc(ctx, 'remote');
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
// Generation-neutral trio only: declaring an absent old-line service in the
// top-level list pends the whole client entry forever (web boot refuses to
// render). conversation/uiConversation/remote/remote.session ride softSvc.
export const inject = ['slots', 'sessions', 'locale'];
export function apply(ctx) {
    // One-shot global plate for GenUI inline fence cards; class-keyed, no slot
    // dependency, so it runs before any conversation renders.
    ensureGenuiPlateCss();
    // One registration activates all nine shipped languages; bind is resolved
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
    // 原生「对话」视图的轨挂载：轨语义按视图分流（2026-10-05 用户裁定）——
    // 阅读视图恒用本轨（官方 TurnNavigator 在阅读视图下不挂载）；对话视图由
    // 「接管官方消息轨」开关决定：开 = 本轨替换官方轨，关 = 官方轨（本轨让位，
    // 否则两条右缘轨重叠）。这里的 enabled 因此是 railEnabled && hideOfficialNav。
    function NativeRailView() {
        const snap = React.useSyncExternalStore(prefs.subscribe, () => prefs.getSnapshot());
        // The native chat view has no reactive hasMore hook (that lives in the
        // reader's session snapshot), so we sniff the host button. Two prior bugs
        // made the rail's top "load earlier" arrow fire only once: the pattern did
        // not match the host's in-flight label (正在加载更早 / Loading earlier), so
        // the arrow collapsed the instant loading began, and the sniff was
        // re-evaluated only on a prefs change — when the host later re-offered the
        // button the component never re-rendered, so the arrow never came back.
        // Fix: match both idle and in-flight labels, and drive a re-render with a
        // rAF-throttled MutationObserver scoped to the scroll container (or the
        // document before it mounts). loadOlder still only clicks an *enabled*
        // button, so a click during loading is a harmless no-op.
        const loadEarlierPattern = /^(加载更早|正在加载更早|载入更早|加载历史|Load earlier|Load older|Loading earlier|Loading older)/;
        const [, bump] = React.useReducer((x) => x + 1, 0);
        React.useEffect(() => {
            if (typeof MutationObserver === 'undefined')
                return;
            let raf = 0;
            const schedule = () => {
                if (raf !== 0)
                    return;
                raf = requestAnimationFrame(() => { raf = 0; bump(); });
            };
            const scope = document.querySelector('[data-conversation-scroll]') ?? document.documentElement;
            const mo = new MutationObserver(schedule);
            mo.observe(scope, { subtree: true, childList: true, characterData: true });
            return () => {
                if (raf !== 0)
                    cancelAnimationFrame(raf);
                mo.disconnect();
            };
        }, []);
        const buttons = [...document.querySelectorAll('button')];
        const earlier = (b) => loadEarlierPattern.test((b.textContent || '').trim());
        const hasMore = buttons.some((b) => earlier(b));
        const takeover = snap.hideOfficialNav !== false;
        return React.createElement(RailView, {
            enabled: snap.railEnabled !== false && takeover,
            side: snap.railSide === 'right' ? 'right' : 'left',
            style: snap.railStyle === 'dot' ? 'dot' : 'bar',
            ring: snap.railRing === true,
            hideOfficialNav: takeover,
            hasMore,
            loadOlder: () => {
                const btn = [...document.querySelectorAll('button')]
                    .find((b) => earlier(b) && !b.disabled);
                btn?.click();
            },
        });
    }
    safeSeat('conversation.session.header.utilities', () => ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({ name: 'conversation.session.header.utilities', id: 'tidy-display-nav' }, NativeRailView)));
    // The reader view declares official children (conversation.chat.turnTail ...)
    // whose contracts don't exist on 0.1.0/0.1.1 - the registration throws there;
    // the reader degrades with the line and the settings surfaces must survive.
    safeSeat('conversation.chat.node/reader', () => ctx.slots.inject('conversation.chat.node', function* () {
        yield ctx.slots.register({
            name: 'conversation.view',
            id: 'reader',
            // R1: 对话 (native chat) registers at order 0; 审批记录 (dsh-perm-gate) at
            // 20, with 轨迹 between. The reader used to sit at -5, which put the 阅读
            // tab to the LEFT of 对话. Positive order 1 lands the reader immediately
            // right of 对话 and before 轨迹, so the bar reads 对话 · 阅读 · …
            order: 1,
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
                    officialImageLoader: Object.assign((attachment) => softSvc(ctx, 'uiConversation')?.imageUrl?.(sessionId, attachment), { peek: (attachment) => softSvc(ctx, 'uiConversation')?.peekImageUrl?.(sessionId, attachment) }),
                    officialFileMentions: owner => ctx.get('chatFileMentions')?.forClosing(owner, sessionId),
                    officialPreviewFile: path => {
                        const cwd = ctx.sessions.list.getSnapshot().byId[sessionId]?.cwd;
                        const sidebar = ctx.get('sidebarRight');
                        if (!sidebar?.openResource)
                            throw new Error('文件预览面板不可用。');
                        sidebar.openResource((officialFileAddressFor ?? fileAddressFor)(sessionId, cwd, path));
                    },
                    officialHost: {
                        getSnapshot: () => softSvc(ctx, 'remote')?.$host ?? {},
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
                            const remote = softSvc(ctx, 'remote');
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
                            const conversation = softSvc(ctx, 'conversation');
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
    }));
}
//# sourceMappingURL=index.js.map