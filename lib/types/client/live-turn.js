import { assistantSegments, hasVisibleBody } from './projection.js';
import { activitySummary, stringValue } from './tool-activity.js';
export function liveFoldEnabled(boundary) {
    return boundary.status === 'open';
}
export function foldSummary(steps) {
    let reasoning = 0;
    let body = 0;
    let tool = 0;
    let extra = 0;
    for (const step of steps) {
        if (step.kind === 'reasoning')
            reasoning += 1;
        else if (step.kind === 'body')
            body += 1;
        else if (step.kind === 'tool')
            tool += 1;
        else if (step.kind !== 'user')
            extra += 1;
    }
    const parts = [];
    if (reasoning)
        parts.push(`思考×${reasoning}`);
    if (body)
        parts.push(`输出×${body}`);
    if (tool)
        parts.push(`工具×${tool}`);
    if (extra)
        parts.push(`记录×${extra}`);
    return parts.join(' · ') || '此前步骤';
}
/** One chain: fold only when a new reasoning step has prior body/tool/reasoning. */
export function splitChain(chain) {
    const lastReasoning = chain.findLastIndex(step => step.kind === 'reasoning');
    if (lastReasoning < 0)
        return { fold: null, open: chain };
    const prior = chain.slice(0, lastReasoning);
    if (!prior.length)
        return { fold: null, open: chain };
    const trigger = prior.some(step => step.kind === 'reasoning' || step.kind === 'body' || step.kind === 'tool');
    if (!trigger)
        return { fold: null, open: chain };
    return { fold: prior, open: chain.slice(lastReasoning) };
}
function skipReasoning(part) {
    return part.kind === 'reasoning' && !part.blocks.some(block => block.kind === 'reasoning' && block.text.trim() !== '');
}
function skipBody(part) {
    return part.kind === 'body' && !hasVisibleBody(part.blocks);
}
function stepsFromAssistant(nodeKey, data, toolsByCallId, consumed) {
    const marks = [];
    for (const part of assistantSegments(data.blocks)) {
        if (skipReasoning(part) || skipBody(part))
            continue;
        marks.push({
            at: part.start,
            step: {
                kind: part.kind,
                key: `${nodeKey}:${part.kind}:${part.start}`,
                nodeKey,
                start: part.start,
                blocks: part.blocks,
                step: data.step,
            },
        });
    }
    data.blocks.forEach((block, index) => {
        if (block.kind !== 'tool-call' || !block.callId)
            return;
        const tool = toolsByCallId.get(block.callId);
        if (!tool || consumed.has(tool.callId))
            return;
        consumed.add(tool.callId);
        marks.push({ at: index, step: { kind: 'tool', key: tool.key, entry: tool } });
    });
    marks.sort((left, right) => left.at - right.at || left.step.key.localeCompare(right.step.key));
    return marks.map(mark => mark.step);
}
/** Expand readerFlow into source-ordered live steps using existing block boundaries. */
export function segmentLiveTurn(flow, get) {
    const steps = [];
    const consumed = new Set();
    const toolsByCallId = new Map();
    for (const entry of flow) {
        if (entry.kind === 'tool')
            toolsByCallId.set(entry.callId, entry);
    }
    for (const entry of flow) {
        if (entry.kind === 'tool') {
            if (!consumed.has(entry.callId)) {
                steps.push({ kind: 'tool', key: entry.key, entry });
                consumed.add(entry.callId);
            }
            continue;
        }
        const node = get(entry.nodeKey);
        if (!node || node.visibility === 'hidden' || node.kind === 'turn-tail')
            continue;
        if (node.kind === 'user' || node.kind === 'steering') {
            steps.push({ kind: 'user', key: entry.key, nodeKey: entry.nodeKey });
            continue;
        }
        if (node.kind === 'assistant-step') {
            steps.push(...stepsFromAssistant(entry.nodeKey, node.data, toolsByCallId, consumed));
            continue;
        }
        steps.push({ kind: 'other', key: entry.key, nodeKey: entry.nodeKey });
    }
    return steps;
}
/** One finished tool call, described by what it actually did. */
function toolSummary(entry) {
    const info = activitySummary(entry);
    const clip = (value, max = 38) => {
        if (!value)
            return undefined;
        const flat = value.replace(/\s+/gu, ' ').trim();
        if (!flat)
            return undefined;
        return flat.length > max ? flat.slice(0, max - 1) + '\u2026' : flat;
    };
    const base = info.target ? clip(info.target.split(/[/\\]/u).at(-1), 28) : undefined;
    const said = clip(stringValue(info.args, 'description'), 40);
    switch (info.category) {
        case 'read': return '读取 ' + (base ?? '文件');
        case 'write': return clip(info.title, 40) ?? '写入文件';
        case 'terminal': {
            const cmd = clip(info.command, 32);
            return said ?? (cmd ? '运行 ' + cmd : '运行命令');
        }
        case 'search': {
            const needle = clip(stringValue(info.args, 'pattern', 'query'), 26);
            return info.name === 'glob' ? '查找 ' + (needle ?? '文件') : '搜索 ' + (needle ?? '内容');
        }
        case 'web': {
            const query = clip(info.target, 30);
            return (info.name === 'web_search' ? '搜索网页' : '读取网页') + (query ? ' ' + query : '');
        }
        default: {
            // Schema-less tools (run_code and friends) describe themselves in an
            // argument rather than a known field: prefer the model's own
            // description, then the first meaningful line of the code it ran.
            if (said)
                return said;
            const code = stringValue(info.args, 'code', 'source', 'script');
            if (code) {
                const line = code.split('\n').map(part => part.trim())
                    .find(part => part && !/^[)\]}]/.test(part) && !/^(\/\/|\*|\/\*|#)/.test(part));
                if (line)
                    return clip(line.replace(/\s+/gu, ' '), 44) ?? '运行代码';
            }
            return clip(info.title ?? info.name, 32) ?? '工具调用';
        }
    }
}
export function presentLiveTurn(steps, boundary, autoFold = true) {
    const live = autoFold && liveFoldEnabled(boundary);
    const items = [];
    let chain = [];
    const flush = () => {
        if (!chain.length)
            return;
        if (!live) {
            for (const step of chain)
                items.push({ kind: 'open', key: step.key, step });
            chain = [];
            return;
        }
        const { fold, open } = splitChain(chain);
        if (fold?.length) {
            items.push({ kind: 'fold', key: `live-fold:${chain[0].key}`, steps: fold, summary: foldSummary(fold) });
        }
        for (const step of open)
            items.push({ kind: 'open', key: step.key, step });
        chain = [];
    };
    for (const step of steps) {
        if (step.kind === 'user') {
            flush();
            items.push({ kind: 'user', key: step.key, step });
        }
        else {
            chain.push(step);
        }
    }
    flush();
    return items;
}
//# sourceMappingURL=live-turn.js.map