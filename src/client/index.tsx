import type { Context } from '@deepseek-ai/cordis';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { createRailStore } from './store.js';
import { RailView } from './rail/RailView.js';
import { installRailColors } from './rail/colors.js';
import { findLoadOlderButton, startAutoLoad } from './autoload.js';
import { ensureCardCss, LegacySettingsCard, type LegacySettingsValue } from './LegacySettingsCard.js';

/**
 * Legacy (pre-0.1.7) client half: message-rail subset only.
 *
 * - Mounts the canvas rail beside the native conversation column (no host
 *   slots involved — the utilities seat is a 0.1.7 contract).
 * - Rail prefs come from the `tidy-display` settings namespace (bound via the
 *   legacy settings face) and are mirrored into the rail store.
 * - autoLoad runs the tidychat Governor against the host "load earlier"
 *   button; every settled page nudges the rail to re-measure.
 */

export const name = 'dsh-tidy-display-client';
export const inject = ['slots', 'sessions'];

const findScrollContainer = (): Element | null => document.querySelector('[data-conversation-scroll]');

interface SettingsScopeFace {
  getSnapshot?: () => { status?: string; value?: Record<string, unknown> } | null | undefined;
  subscribe?: (listener: () => void) => () => void;
  set?: (field: string, value: unknown) => Promise<void> | void;
}

export function apply(ctx: Context): void {
  const store = createRailStore();
  const prefs = store.create();

  // Legacy settings face (tidychat compat pattern): webUiSettings on 0.1.2+,
  // settingsScope as the older alias. Missing face → read-only defaults.
  let settingsScope: SettingsScopeFace | null = null;
  const settingsFace = (ctx as unknown as { get?: (name: string) => unknown }).get?.('webUiSettings')
    ?? (ctx as unknown as { get?: (name: string) => unknown }).get?.('settingsScope');
  if (settingsFace !== undefined && settingsFace !== null && typeof (settingsFace as { bind?: unknown }).bind === 'function') {
    try {
      settingsScope = (settingsFace as { bind: (o: { namespace: string }) => SettingsScopeFace })
        .bind({ namespace: 'tidy-display' });
    } catch { settingsScope = null; }
  }

  const readConfig = (): void => {
    try {
      const snap = settingsScope?.getSnapshot?.();
      const v = snap?.value;
      if (v === null || v === undefined) return;
      // Apply only real changes: actions clone state, so a blind loop would
      // spin the external-store subscribers forever.
      const cur = prefs.getSnapshot();
      const railEnabled = typeof v.railEnabled === 'boolean' ? v.railEnabled : true;
      if (cur.railEnabled !== railEnabled) prefs.actions.setRailEnabled(railEnabled);
      const railSide = v.railSide === 'right' ? 'right' : 'left';
      if (cur.railSide !== railSide) prefs.actions.setRailSide(railSide);
      const railStyle = v.railStyle === 'dot' ? 'dot' : 'bar';
      if (cur.railStyle !== railStyle) prefs.actions.setRailStyle(railStyle);
      const railRing = v.railRing !== false;
      if (cur.railRing !== railRing) prefs.actions.setRailRing(railRing);
      const hideOfficialNav = v.hideOfficialNav !== false;
      if (cur.hideOfficialNav !== hideOfficialNav) prefs.actions.setHideOfficialNav(hideOfficialNav);
      const railColor = typeof v.railColor === 'string' ? v.railColor : 'auto';
      if (cur.railColor !== railColor) prefs.actions.setRailColor(railColor);
      const railColorCustom = typeof v.railColorCustom === 'string' ? v.railColorCustom : '';
      if (cur.railColorCustom !== railColorCustom) prefs.actions.setRailColorCustom(railColorCustom);
      const railAccent = typeof v.railAccent === 'string' ? v.railAccent : 'auto';
      if (cur.railAccent !== railAccent) prefs.actions.setRailAccent(railAccent);
      const railAccentCustom = typeof v.railAccentCustom === 'string' ? v.railAccentCustom : '';
      if (cur.railAccentCustom !== railAccentCustom) prefs.actions.setRailAccentCustom(railAccentCustom);
      const autoLoad = v.autoLoad !== false;
      if (cur.autoLoad !== autoLoad) prefs.actions.setAutoLoad(autoLoad);
    } catch { /* keep defaults */ }
  };
  if (settingsScope !== null) {
    try { settingsScope.subscribe?.(() => readConfig()); } catch { /* polling not available */ }
    readConfig();
  }

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
  }, findScrollContainer);

  // Rail host: mounts beside whatever container the host currently shows.
  // RailView is position:fixed, so the attach point only needs to exist;
  // a signature-guarded MutationObserver nudges remeasure when rows change.
  let bumpRail: () => void = () => {};
  function RailHost(): React.ReactElement {
    const snap = React.useSyncExternalStore(prefs.subscribe, () => prefs.getSnapshot());
    const [, setBump] = React.useState(0);
    React.useEffect(() => {
      let raf = 0;
      let lastSig = '';
      const signature = (): string => {
        const c = findScrollContainer();
        return c === null ? '' : String(c.scrollHeight) + ':' + String(document.querySelectorAll('[data-chat-anchor-key]').length);
      };
      lastSig = signature();
      const obs = new MutationObserver(() => {
        if (raf !== 0) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const s = signature();
          if (s !== lastSig) { lastSig = s; setBump((b) => b + 1); }
        });
      });
      obs.observe(document.body, { childList: true, subtree: true });
      bumpRail = () => { lastSig = signature(); setBump((b) => b + 1); };
      return () => { obs.disconnect(); if (raf !== 0) cancelAnimationFrame(raf); };
    }, []);
    const hasMore = findLoadOlderButton() !== null;
    return React.createElement(RailView, {
      enabled: snap.railEnabled !== false,
      side: snap.railSide === 'right' ? 'right' : 'left',
      style: snap.railStyle === 'dot' ? 'dot' : 'bar',
      ring: snap.railRing === true,
      hideOfficialNav: snap.hideOfficialNav !== false,
      hasMore,
      loadOlder: () => { findLoadOlderButton()?.click(); },
    });
  }

  const disposeRail = mountRail();

  function mountRail(): () => void {
    ensureCardCss();
    const host = document.createElement('div');
    host.setAttribute('data-tidy-display-rail-host', '1');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(RailHost));
    const stopAutoLoad = startAutoLoad({
      getRoot: findScrollContainer,
      isEnabled: () => prefs.getSnapshot().autoLoad !== false,
      onSettle: () => bumpRail(),
    });
    return () => {
      stopAutoLoad();
      root.unmount();
      host.remove();
    };
  }

  // Settings card in the keyed plugins seat (settings.plugin.item, rc.7+; tidychat-provided).
  const slots = (ctx as unknown as {
    slots?: {
      inject?: (name: string, cb: () => unknown) => void;
      register?: (options: Record<string, unknown>, component: unknown) => unknown;
    };
  }).slots;
  if (slots?.inject !== undefined && slots?.register !== undefined) {
    slots.inject('settings.plugin.item', () => slots.register?.(
      { name: 'settings.plugin.item', key: 'tidy-display', order: 100, inject: () => ({}) },
      function SettingsTab(): React.ReactElement {
        React.useSyncExternalStore(prefs.subscribe, () => prefs.getSnapshot());
        const snap = prefs.getSnapshot();
        ensureCardCss();
        const value: LegacySettingsValue = {
          railEnabled: snap.railEnabled,
          railSide: snap.railSide,
          railStyle: snap.railStyle,
          railRing: snap.railRing,
          hideOfficialNav: snap.hideOfficialNav,
          railColor: snap.railColor,
          railColorCustom: snap.railColorCustom,
          railAccent: snap.railAccent,
          railAccentCustom: snap.railAccentCustom,
          autoLoad: snap.autoLoad,
        };
        const onToggle = (field: keyof LegacySettingsValue): void => {
          if (settingsScope?.set === undefined) return;
          void Promise.resolve(settingsScope.set(field, value[field] !== true)).catch(() => {});
        };
        const onSet = (field: string, v: unknown): void => {
          if (settingsScope?.set === undefined) return;
          void Promise.resolve(settingsScope.set(field, v)).catch(() => {});
        };
        const langTag = typeof document !== 'undefined' ? document.documentElement.lang : undefined;
        return React.createElement(LegacySettingsCard, {
          value, writable: settingsScope !== null, hasTakeover: true, onToggle, onSet, langTag,
        });
      },
    ));
  }

  ctx.effect(() => () => { disposeRail(); });
}
