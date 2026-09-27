import type { ChatNodeKind } from '@deepseek-ai/dsh-client-ui-chat/client';

export interface WaitingAnchor { key: string; time: number | null }
type InputNode = { kind: string; data: unknown };
type Submission = { requestId: string; time?: number; placement?: string };
const timestamp = (value: number | undefined): number | null => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

/**
 * Chat-layer kinds that hand the turn back to the model unconditionally.
 *
 * These are `ChatNodeDataMap` keys, NOT conversation-layer `ConversationNode` kinds.
 * The two layers name the same idea differently: a returned tool is `tool-result`
 * in the conversation contract, but the row the reader sees is the `tool-call` node.
 * A name copied from the wrong layer silently disables the branch it guards, so
 * the `satisfies` below makes the compiler reject any name that is not a real kind.
 */
export const WAIT_AFTER = new Set<ChatNodeKind>(['context', 'model-retry']);

/**
 * Every chat-kind the handover logic reasons about, checked against the host's own
 * kind union at compile time. Adding a name here that the host does not register
 * fails `tsc` instead of failing silently at runtime.
 */
export const HANDOVER_KINDS = [
  'user', 'steering', 'context', 'model-retry', 'tool-call', 'command',
] as const satisfies readonly ChatNodeKind[];

/**
 * Mirrors the host's `isSettledTool`: a running call has no `kind`, a settled one
 * carries `kind: 'tool-result'`. Kept local so this module stays dependency-free,
 * and pinned by a test against the host's own helper contract.
 */
function toolSettled(data: unknown): boolean {
  const root = (data as { root?: unknown } | undefined)?.root;
  return typeof root === 'object' && root !== null && (root as { kind?: unknown }).kind === 'tool-result';
}

/** A command that is still executing has no outcome yet; only a settled one hands over. */
function commandSettled(data: unknown): boolean {
  return (data as { outcome?: unknown } | undefined)?.outcome != null;
}

/**
 * Does this node leave the model on the hook for the next move?
 *
 * A tool or command that is *still running* is not a wait — the tool is the one
 * working. Only its returned form hands control back, which is exactly the moment
 * the model can stall.
 */
export function handsBackToModel(node: InputNode): boolean {
  if (node.kind === 'user' || node.kind === 'steering') return true;
  if (node.kind === 'tool-call') return toolSettled(node.data);
  if (node.kind === 'command') return commandSettled(node.data);
  return WAIT_AFTER.has(node.kind as ChatNodeKind);
}

/**
 * The moment the current wait began.
 *
 * This is the time of the **last** node that handed control to the model — a
 * returned tool, an injected context, or the user's own message. Anchoring on the
 * user's message alone made the readout count the entire turn, so a wait that had
 * only just begun showed the minutes the tools had already spent.
 */
export function waitingAnchor(order: readonly string[], get: (key: string) => InputNode | undefined, pending: readonly Submission[] = []): WaitingAnchor {
  let anchor: WaitingAnchor = { key: 'unresolved', time: null };
  for (let i = order.length - 1; i >= 0; i--) {
    const node = get(order[i]);
    if (!node) continue;
    if (!handsBackToModel(node)) continue;
    const time = node.data && typeof node.data === 'object' && 'time' in node.data && typeof node.data.time === 'number' ? node.data.time : undefined;
    anchor = { key: order[i], time: timestamp(time) };
    break;
  }
  for (let i = pending.length - 1; i >= 0; i--) {
    const input = pending[i];
    if (input.placement === 'queued') continue;
    const time = timestamp(input.time);
    if (time === null || anchor.time === null || time >= anchor.time) return { key: `pending:${input.requestId}`, time };
    break;
  }
  return anchor;
}
