import { defineStore } from '@deepseek-ai/dsh-client-store';
import type { EngineStoreHandle } from '@deepseek-ai/dsh-client-store';
import {
  FOLD_INTENSITY_DEFAULT,
  autoFoldFromIntensity,
  processOnlyFromIntensity,
  type FoldIntensity,
} from './fold-intensity.js';
import type { DeliverableOpenMode } from './open-file.js';

export interface ReaderState {
  expanded: Record<string, boolean>;
  motion: boolean;
  /** Derived from foldIntensity; kept so older persisted snapshots still read. */
  autoFold: boolean;
  /** Default stays the system app. `sidebar` is opt-in. */
  deliverableOpenMode: DeliverableOpenMode;
  /**
   * 0 = no auto-fold, 1 = current-main fold-on-next-reasoning (default),
   * 2 = process-summary mode from community PR #14.
   */
  foldIntensity: FoldIntensity;
  /** Translucent frosted chrome. Default off so opaque main chrome stays. */
  frostedGlass: boolean;
  /** Rounded answer bubbles. Default on; off lays answers flat on the page. */
  bubbles: boolean;
  /** Derived from foldIntensity === 2; kept for older #14 snapshots. */
  processOnly: boolean;
  /** Canvas message rail (ported from dsh-tidychat). */
  railEnabled: boolean;
  railSide: 'left' | 'right';
  railStyle: 'bar' | 'dot';
  /** White sheen beneath current/hover marks. */
  railRing: boolean;
  /**
   * Hide the official TurnNavigator via the takeover attribute. The official
   * rail still mounts even under the reader, so this stays a user-facing
   * switch (default on) — the merge did drop it once and the official rail
   * resurfaced next to ours.
   */
  hideOfficialNav: boolean;
}
type ReaderActions = {
  setExpanded: (draft: ReaderState, key: string, value: boolean) => void;
  resetExpanded: (draft: ReaderState) => void;
  setMotion: (draft: ReaderState, value: boolean) => void;
  setAutoFold: (draft: ReaderState, value: boolean) => void;
  setDeliverableOpenMode: (draft: ReaderState, value: DeliverableOpenMode) => void;
  setFoldIntensity: (draft: ReaderState, value: FoldIntensity) => void;
  setFrostedGlass: (draft: ReaderState, value: boolean) => void;
  setBubbles: (draft: ReaderState, value: boolean) => void;
  setRailEnabled: (draft: ReaderState, value: boolean) => void;
  setRailSide: (draft: ReaderState, value: 'left' | 'right') => void;
  setRailStyle: (draft: ReaderState, value: 'bar' | 'dot') => void;
  setRailRing: (draft: ReaderState, value: boolean) => void;
  setHideOfficialNav: (draft: ReaderState, value: boolean) => void;
};

function applyFoldIntensity(draft: ReaderState, value: FoldIntensity): void {
  draft.foldIntensity = value;
  draft.autoFold = autoFoldFromIntensity(value);
  draft.processOnly = processOnlyFromIntensity(value);
}

export function createReaderStore(): EngineStoreHandle<ReaderState, ReaderActions> {
  return defineStore({
    init: (): ReaderState => ({
      expanded: {},
      motion: true,
      autoFold: true,
      deliverableOpenMode: 'external',
      foldIntensity: FOLD_INTENSITY_DEFAULT,
      frostedGlass: false,
      bubbles: true,
      processOnly: false,
      railEnabled: true,
      railSide: 'left',
      railStyle: 'bar',
      // Default on: the sheen is the rail's wallpaper-legibility guarantee
      // (the user-facing requirement was "selectable AND visible").
      railRing: true,
      hideOfficialNav: true,
    }),
    persist: 'dsh.reader.v1',
    actions: {
      setExpanded: (draft, key: string, value: boolean) => { draft.expanded[key] = value; },
      resetExpanded: draft => { draft.expanded = {}; },
      setMotion: (draft, value: boolean) => { draft.motion = value; },
      setAutoFold: (draft, value: boolean) => {
        applyFoldIntensity(draft, value
          ? (draft.foldIntensity === 2 ? 2 : 1)
          : 0);
      },
      setDeliverableOpenMode: (draft, value: DeliverableOpenMode) => { draft.deliverableOpenMode = value; },
      setFoldIntensity: (draft, value: FoldIntensity) => { applyFoldIntensity(draft, value); },
      setFrostedGlass: (draft, value: boolean) => { draft.frostedGlass = value; },
      setBubbles: (draft, value: boolean) => { draft.bubbles = value; },
      setRailEnabled: (draft, value: boolean) => { draft.railEnabled = value; },
      setRailSide: (draft, value: 'left' | 'right') => { draft.railSide = value; },
      setRailStyle: (draft, value: 'bar' | 'dot') => { draft.railStyle = value; },
      setRailRing: (draft, value: boolean) => { draft.railRing = value; },
      setHideOfficialNav: (draft, value: boolean) => { draft.hideOfficialNav = value; },
    },
  });
}
