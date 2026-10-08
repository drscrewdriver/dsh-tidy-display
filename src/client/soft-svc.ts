/**
 * Generation-neutral service soft-read.
 *
 * Two old-line traps live here: (1) the strict ctx proxy THROWS on undeclared
 * service property reads, and (2) declaring an absent service in the plugin's
 * top-level `inject` list pends the whole client entry forever — web boot then
 * refuses to render ("1 entry did not activate", 0.1.1-rc.2 measured
 * 2026-10-08 with the conversation/uiConversation/remote family). Only the
 * generation-neutral trio ('slots', 'sessions', 'locale') may be injected;
 * everything else must be read through this helper.
 */
export function softSvc(ctx: unknown, name: string): any {
  const c = ctx as { get?: (n: string) => unknown } & Record<string, unknown>
  try {
    const prop = c[name]
    if (prop !== undefined && prop !== null) return prop
  } catch { /* strict proxy: undeclared service read */ }
  try {
    return typeof c.get === 'function' ? c.get(name) : undefined
  } catch { return undefined }
}

/**
 * Per-seat guard (the perm-gate/preset-manager discipline): one slot whose
 * contract the host line doesn't know throws at inject-activation time, and
 * an uncaught throw fails the WHOLE loader entry — the shell then shows the
 * "Failed to load plugins" error page (0.1.1-rc.2 measured 2026-10-08 with
 * conversation.chat.turnTail). Every seat registration rides this.
 */
export function safeSeat(tag: string, fn: () => void): void {
  try {
    fn()
  } catch (e) {
    console.warn(`[dsh-tidy-display] seat '${tag}' unavailable on this host line:`, e)
  }
}
