import { createElement, memo, useMemo } from 'react';
/**
 * RC2 composition adapter. Only public registry operations are used. We lend
 * registrations a Reader-owned seat, not a second implementation of their UI.
 * The platform still binds injection, hooks, locale, stores and boundaries.
 * Original entries, declarations and components are never changed.
 *
 * Child seats have unique names because RC2 declarations have one owner. The
 * sole component wrapper translates those names before delegating to the
 * framework-provided renderSlot. It does not implement a slot renderer.
 */
export const OFFICIAL_SLOTS = {
    actions: 'conversation.chat.assistant-actions',
    tools: 'tool.call.toolview',
    tail: 'conversation.chat.turnTail',
    nodes: 'conversation.chat.node',
    images: 'conversation.message.images',
};
export const OFFICIAL_SEATS = {
    actions: 'dsh-tidy-display.official.actions/conversation.chat.assistant-actions',
    tools: 'dsh-tidy-display.official.tools/tool.call.toolview',
    tail: 'dsh-tidy-display.official.tail/conversation.chat.turnTail',
    nodes: 'dsh-tidy-display.official.nodes/conversation.chat.node',
    images: 'dsh-tidy-display.official.images/conversation.message.images',
};
export const officialSeat = (family, source = OFFICIAL_SLOTS[family]) => `dsh-tidy-display.official.${family}/${source}`;
// Existing Reader presentations own these rows. All other node kinds, including
// future registrations, reach the official renderer through the fallback seat.
const READER_NODES = new Set(['user', 'steering', 'assistant-step', 'tool-call', 'turn-tail', 'turn-process']);
const EXPECTED = {
    actions: [{ kind: 'list', scope: 'session' }],
    tools: [{ kind: 'keyed', scope: 'session' }],
    // turnTail 是代际分叉点：0.1.2–0.1.5 宿主声明 chain/session，0.1.7 起改为
    // list/session。两代都按宿主实时 spec 绑定（回退值只服务 spec 缺席的宿主），
    // 白名单仅作漂移金丝雀——记录并继续，不再 throw：client entry 失败会触发
    // web-boot 门禁整页拒绝启动（0.1.2/0.1.5 砖化事故，2026-10-05）。
    tail: [{ kind: 'list', scope: 'session' }, { kind: 'chain', scope: 'session' }],
    nodes: [{ kind: 'keyed', scope: 'session' }],
    images: [{ kind: 'single', scope: 'session' }],
};
/**
 * Reader already presents produced paths with its copy/reveal actions. RC2's
 * official tail additionally owns explicit `present` artifacts. Leave those
 * cards, actions and state intact, and omit only the duplicate produced chips.
 * This changes a presentation prop, never the source match or session data.
 * Unrecognized shapes pass through intact for safe forward degradation.
 */
export function readerTailMatch(value, displayedPaths) {
    if (!value || typeof value !== 'object')
        return value;
    const match = value;
    const displayed = new Set(displayedPaths ?? []);
    return displayed.size > 0 && Array.isArray(match.produced) && Array.isArray(match.presented)
        ? { ...match, produced: match.produced.filter(path => !displayed.has(path)) }
        : value;
}
function tailPresentation(component) {
    const Original = component;
    return memo(function ReaderTailPresentation(props) {
        const matched = useMemo(() => readerTailMatch(props.matched, props.readerProducedPaths), [props.matched, props.readerProducedPaths]);
        return createElement(Original, { ...props, matched });
    });
}
export function officialChildren(slots) {
    return Object.fromEntries(Object.entries(OFFICIAL_SLOTS).map(([name, source]) => {
        const family = name;
        const spec = slots.spec(source);
        if (spec && !EXPECTED[family].some((expected) => expected.kind === spec.kind && expected.scope === spec.scope)) {
            // 金丝雀降级为告警：绑定宿主实时 spec 继续（throw 会杀死整个 client
            // entry 并触发 web-boot 门禁整页拒绝启动——0.1.2/0.1.5 砖化事故）。
            console.warn(`[dsh-tidy-display] official slot contract drift, binding live spec: ${source} (${spec.kind}/${spec.scope})`);
        }
        // In particular, retain conversation.chat.node's contextual turn-data hook.
        return [officialSeat(family), spec ?? EXPECTED[family][0]];
    }));
}
function translatedComponent(entry, names) {
    if (names.size === 0)
        return entry.component;
    const Original = entry.component;
    return memo(function OfficialSlotChildren(props) {
        const renders = useMemo(() => {
            const translate = (render) => (key, owner, options) => {
                const seat = names.get(key);
                if (!seat || !render)
                    throw new Error(`Undeclared official child slot: ${key}`);
                return render(seat, owner, options);
            };
            return {
                renderSlot: translate(props.renderSlot),
                ...(props.renderSlotChain ? { renderSlotChain: translate(props.renderSlotChain) } : {}),
            };
        }, [props.renderSlot, props.renderSlotChain]);
        return createElement(Original, { ...props, ...renders });
    });
}
/**
 * Mirror one elected contribution set incrementally. Unrelated additions do not
 * remount existing cards or recreate their subscriptions. A source unload/HMR
 * disposes the corresponding subtree and closures before its replacement.
 */
export function mirrorOfficialSlot(slots, source, target, namespace, accept = () => true) {
    const mounted = new Map();
    let stopped = false;
    const reconcile = () => {
        if (stopped)
            return;
        const entries = slots.entriesOfSlot(source).filter(accept);
        const wanted = new Set(entries);
        for (const [entry, dispose] of mounted) {
            if (wanted.has(entry))
                continue;
            dispose();
            mounted.delete(entry);
        }
        for (const entry of entries) {
            if (mounted.has(entry))
                continue;
            const names = new Map(Object.keys(entry.children ?? {}).map(key => [key, `${namespace}/${key}`]));
            const children = Object.fromEntries([...names].map(([key, seat]) => [seat, entry.children[key]]));
            const disposers = [];
            const dispose = () => { for (const stop of disposers.splice(0).reverse())
                stop(); };
            try {
                const { component: _component, options, children: _children, ...metadata } = entry;
                const presentation = source === OFFICIAL_SLOTS.tail && entry.locale === 'deliverables'
                    ? { ...entry, component: tailPresentation(entry.component) }
                    : entry;
                disposers.push(slots.register({
                    ...options, ...metadata, name: target,
                    ...(names.size ? { children } : {}),
                    registrant: `dsh-tidy-display → ${entry.registrant ?? source}`,
                }, translatedComponent(presentation, names)));
                for (const [key, seat] of names) {
                    disposers.push(mirrorOfficialSlot(slots, key, seat, namespace));
                }
                mounted.set(entry, dispose);
            }
            catch (error) {
                dispose();
                throw error;
            }
        }
    };
    const unsubscribe = slots.subscribe(source, reconcile);
    const dispose = () => {
        stopped = true;
        unsubscribe();
        for (const stop of [...mounted.values()].reverse())
            stop();
        mounted.clear();
    };
    try {
        reconcile();
    }
    catch (error) {
        dispose();
        throw error;
    }
    return dispose;
}
export function installOfficialSlots(ctx) {
    // The SlotMap overloads are for statically declared keys. Aliases are a
    // runtime composition, using exactly the public erased metadata contract.
    const slots = ctx.slots;
    const disposers = [];
    try {
        for (const [name, source] of Object.entries(OFFICIAL_SLOTS)) {
            const family = name;
            disposers.push(slots.inject(source, () => {
                const spec = slots.spec(source);
                const target = officialSeat(family);
                const declared = slots.spec(target);
                if (spec.kind !== declared?.kind || spec.scope !== declared.scope) {
                    throw new Error(`Official slot contract changed: ${source}`);
                }
                return mirrorOfficialSlot(slots, source, target, `dsh-tidy-display.official.${family}`, family === 'nodes' ? entry => !READER_NODES.has(entry.options.key ?? '') : undefined);
            }));
        }
    }
    catch (error) {
        for (const stop of disposers.reverse())
            stop();
        throw error;
    }
    return () => { for (const stop of disposers.splice(0).reverse())
        stop(); };
}
//# sourceMappingURL=official-slots.js.map