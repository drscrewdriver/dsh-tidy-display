import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { bubblesOf, foldIntensityOf, frostedGlassOf, type FoldIntensity } from './fold-intensity.js';
import { deliverableOpenModeOf, type DeliverableOpenMode } from './open-file.js';
import { settingsCopyFor, type SettingsCopy, type SettingsCopyKey } from './settings-copy.js';
import { CONVENTIONAL_SKILL_ROOTS, detectGenerativeMcpappsSkill, shortestInstallCommand, type SkillStatusProbe, type SkillStatusSnapshot } from './skill-status.js';
import css from './SettingsSection.module.css';

export interface ReaderPrefsSnapshot {
  deliverableOpenMode?: DeliverableOpenMode;
  frostedGlass?: boolean;
  bubbles?: boolean;
  foldIntensity?: FoldIntensity;
  autoFold?: boolean;
  processOnly?: boolean;
  railEnabled?: boolean;
  railSide?: 'left' | 'right';
  railStyle?: 'bar' | 'dot';
  railRing?: boolean;
}

export interface OpenPrefs {
  getSnapshot: () => ReaderPrefsSnapshot;
  subscribe: (fn: () => void) => () => void;
  actions: {
    setDeliverableOpenMode: (value: DeliverableOpenMode) => void;
    setFrostedGlass: (value: boolean) => void;
    setBubbles?: (value: boolean) => void;
    setFoldIntensity?: (value: FoldIntensity) => void;
    setAutoFold?: (value: boolean) => void;
    setRailEnabled?: (value: boolean) => void;
    setRailSide?: (value: 'left' | 'right') => void;
    setRailStyle?: (value: 'bar' | 'dot') => void;
    setRailRing?: (value: boolean) => void;
  };
}

export interface BetterDisplaySettingsInjected {
  prefs: OpenPrefs;
  copy?: SettingsCopy;
  languageTag?: string;
  checkSkill: SkillStatusProbe;
}

type SettingsProps = BetterDisplaySettingsInjected & {
  /** Official settings.section owner share; unused here. */
  close?: () => void;
  t?: (key: SettingsCopyKey) => string;
};

function text(props: SettingsProps, copy: SettingsCopy, key: keyof SettingsCopy): string {
  if (typeof props.t === 'function') {
    try {
      const value = props.t(key);
      if (typeof value === 'string' && value.length > 0 && value !== key) return value;
    } catch {
      // Fall through to the bundled dictionaries.
    }
  }
  return copy[key];
}

const FOLD_STOPS: { value: FoldIntensity; key: 'foldNone' | 'foldStandard' | 'foldSummary' }[] = [
  { value: 0, key: 'foldNone' },
  { value: 1, key: 'foldStandard' },
  { value: 2, key: 'foldSummary' },
];

export function SettingsSection(props: SettingsProps) {
  const copy = props.copy ?? settingsCopyFor(props.languageTag);
  const snap = useSyncExternalStore(
    props.prefs.subscribe,
    () => props.prefs.getSnapshot() ?? ({} as ReaderPrefsSnapshot),
    () => ({} as ReaderPrefsSnapshot),
  );
  const mode = deliverableOpenModeOf(snap.deliverableOpenMode);
  const glass = frostedGlassOf(snap);
  const bubbles = bubblesOf(snap);
  const autoFold = snap.autoFold !== false && snap.foldIntensity !== 0;
  const railOn = snap.railEnabled !== false;
  const railSide = snap.railSide === 'right' ? 'right' : 'left';
  const railStyle = snap.railStyle === 'dot' ? 'dot' : 'bar';
  const railRing = snap.railRing === true;
  const setMode = (value: DeliverableOpenMode) => {
    props.prefs.actions.setDeliverableOpenMode(value);
  };
  const on = mode === 'sidebar';
  const [skill, setSkill] = useState<SkillStatusSnapshot | undefined>();
  const [checking, setChecking] = useState(false);

  const recheck = useCallback(async () => {
    setChecking(true);
    try {
      setSkill(await detectGenerativeMcpappsSkill(props.checkSkill));
    } catch {
      setSkill({
        name: 'generative-mcpapps',
        installed: false,
        via: null,
        roots: [],
        hostReached: false,
      });
    } finally {
      setChecking(false);
    }
  }, [props.checkSkill]);

  useEffect(() => { void recheck(); }, [recheck]);

  return (
    <div className={css.section} data-tidy-display-settings>
      <div className={css.row}>
        <div className={css.rowText}>
          <div className={css.title}>{text(props, copy, 'openTitle')}</div>
          <div className={css.desc}>{text(props, copy, 'openDescription')}</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          className={css.switch}
          data-on={on || undefined}
          data-tidy-display-open-mode={mode}
          onClick={() => { setMode(on ? 'external' : 'sidebar'); }}
        />
      </div>

      <div className={css.row}>
        <div className={css.rowText}>
          <div className={css.title}>{text(props, copy, 'glassTitle')}</div>
          <div className={css.desc}>{text(props, copy, 'glassDescription')}</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={glass}
          className={css.switch}
          data-on={glass || undefined}
          data-tidy-display-glass={glass ? 'on' : 'off'}
          onClick={() => { props.prefs.actions.setFrostedGlass(!glass); }}
        />
      </div>

      <div className={css.row}>
        <div className={css.rowText}>
          <div className={css.title}>{text(props, copy, 'bubbleTitle')}</div>
          <div className={css.desc}>{text(props, copy, 'bubbleDescription')}</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={bubbles}
          className={css.switch}
          data-on={bubbles || undefined}
          data-tidy-display-bubbles={bubbles ? 'on' : 'off'}
          onClick={() => { props.prefs.actions.setBubbles?.(!bubbles); }}
        />
      </div>

      <div className={css.row}>
        <div className={css.rowText}>
          <div className={css.title}>{text(props, copy, 'foldTitle')}</div>
          <div className={css.desc}>{text(props, copy, 'foldDescription')}</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoFold}
          className={css.switch}
          data-on={autoFold || undefined}
          data-tidy-display-auto-fold={autoFold ? 'on' : 'off'}
          onClick={() => {
            props.prefs.actions.setAutoFold?.(!autoFold);
            props.prefs.actions.setFoldIntensity?.(!autoFold ? 1 : 0);
          }}
        />
      </div>

      <div className={css.row}>
        <div className={css.rowText}>
          <div className={css.title}>{text(props, copy, 'railTitle')}</div>
          <div className={css.desc}>{text(props, copy, 'railDescription')}</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={railOn}
          className={css.switch}
          data-on={railOn || undefined}
          data-tidy-display-rail={railOn ? 'on' : 'off'}
          onClick={() => { props.prefs.actions.setRailEnabled?.(!railOn); }}
        />
      </div>

      <div className={css.row}>
        <div className={css.rowText}>
          <div className={css.title}>{text(props, copy, 'railSide')}</div>
        </div>
        <div className={css.actions}>
          <button type="button" className={css.button} aria-pressed={railSide === 'left'}
            onClick={() => { props.prefs.actions.setRailSide?.('left'); }}>
            {text(props, copy, 'railSideLeft')}
          </button>
          <button type="button" className={css.button} aria-pressed={railSide === 'right'}
            onClick={() => { props.prefs.actions.setRailSide?.('right'); }}>
            {text(props, copy, 'railSideRight')}
          </button>
        </div>
      </div>

      <div className={css.row}>
        <div className={css.rowText}>
          <div className={css.title}>{text(props, copy, 'railStyle')}</div>
        </div>
        <div className={css.actions}>
          <button type="button" className={css.button} aria-pressed={railStyle === 'bar'}
            onClick={() => { props.prefs.actions.setRailStyle?.('bar'); }}>
            {text(props, copy, 'railStyleBar')}
          </button>
          <button type="button" className={css.button} aria-pressed={railStyle === 'dot'}
            onClick={() => { props.prefs.actions.setRailStyle?.('dot'); }}>
            {text(props, copy, 'railStyleDot')}
          </button>
        </div>
      </div>

      <div className={css.row}>
        <div className={css.rowText}>
          <div className={css.title}>{text(props, copy, 'railRingTitle')}</div>
          <div className={css.desc}>{text(props, copy, 'railRingDescription')}</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={railRing}
          className={css.switch}
          data-on={railRing || undefined}
          data-tidy-display-rail-ring={railRing ? 'on' : 'off'}
          onClick={() => { props.prefs.actions.setRailRing?.(!railRing); }}
        />
      </div>

      <section className={css.block} data-tidy-display-skill={skill?.installed ? 'installed' : 'missing'}>
        <div className={css.title}>{text(props, copy, 'skillTitle')}</div>
        <div className={css.status}>
          <span className={css.badge} data-ok={skill?.installed || undefined}>
            {skill?.installed ? text(props, copy, 'skillInstalled') : text(props, copy, 'skillMissing')}
          </span>
        </div>
        <p className={css.desc}>{text(props, copy, 'skillPurpose')}</p>
        <p className={css.desc}>{text(props, copy, 'skillPluginNote')}</p>
        {skill && !skill.installed ? (
          <>
            <p className={css.desc}>{skill.hostReached ? text(props, copy, 'skillInstall') : text(props, copy, 'skillUnavailable')}</p>
            <pre className={css.pre}>{shortestInstallCommand()}</pre>
            <ul className={css.roots} data-tidy-display-skill-roots>
              {CONVENTIONAL_SKILL_ROOTS.map(root => (
                <li key={root}>{root}</li>
              ))}
            </ul>
          </>
        ) : null}
        <div className={css.actions}>
          <button type="button" className={css.button} disabled={checking} onClick={() => { void recheck(); }}>
            {checking ? text(props, copy, 'skillChecking') : text(props, copy, 'skillRecheck')}
          </button>
        </div>
      </section>
    </div>
  );
}
