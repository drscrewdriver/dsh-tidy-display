import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { parseRgba } from './rail/colors.js';
import { bubblesOf, frostedGlassOf, type FoldIntensity } from './fold-intensity.js';
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
  hideOfficialNav?: boolean;
  railColor?: string;
  railColorCustom?: string;
  railColorLight?: string;
  railAccent?: string;
  railAccentCustom?: string;
  railAccentLight?: string;
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
    setHideOfficialNav?: (value: boolean) => void;
    setRailColor?: (value: string) => void;
    setRailColorCustom?: (value: string) => void;
    setRailColorLight?: (value: string) => void;
    setRailAccent?: (value: string) => void;
    setRailAccentCustom?: (value: string) => void;
    setRailAccentLight?: (value: string) => void;
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

function Chip({ on, swatch, onClick, children }: { on: boolean; swatch?: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} className={css.button}
      style={on ? { outline: '2px solid var(--dsw-alias-state-business-primary)', outlineOffset: 0 } : undefined}
      onClick={onClick}>
      {swatch !== undefined && (
        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: swatch, marginRight: 6, verticalAlign: 'middle', border: '1px solid rgba(128,128,128,.4)' }} />
      )}
      {children}
    </button>
  );
}

function rgbaToHex(value: string): string {
  const rgba = parseRgba(value);
  if (rgba === null) return '#3b82f6';
  return '#' + rgba.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('');
}

const cssColor = (rgb: readonly number[], a: number): string =>
  a >= 1
    ? '#' + rgb.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')
    : 'rgba(' + Math.round(rgb[0]) + ', ' + Math.round(rgb[1]) + ', ' + Math.round(rgb[2]) + ', ' + (Math.round(a * 1000) / 1000) + ')';

/**
 * 调色盘（同 tidychat 75743fd 的设计）：自动 / 自定义二选一。
 * 自定义 = 原生取色器（无极调色）+ HEX/RGB 文本 + 透明度滑杆，实时色块预览。
 */
function RailColorPicker(props: {
  title: string;
  mode: string;
  custom: string;
  autoLabel: string;
  customLabel: string;
  /** Localized slider label carrying a `{title}` placeholder, filled in here. */
  opacityLabel: string;
  setMode: (value: string) => void;
  setCustom: (value: string) => void;
}) {
  const customOn = props.mode === 'custom';
  const parsed = parseRgba(props.custom);
  const rgb: number[] = parsed === null ? [59, 130, 246] : [parsed[0], parsed[1], parsed[2]];
  const alpha = parsed === null ? 1 : parsed[3];
  const swatch = parsed !== null ? cssColor(rgb, alpha) : 'linear-gradient(135deg, #f87171, #60a5fa, #4ade80)';
  const inputStyle = { flex: 1, minWidth: 0, textAlign: 'left' as const, color: 'var(--dsw-alias-label-primary, inherit)' };
  return (
    <div className={css.rowText}>
      <div className={css.title}>{props.title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        <Chip on={!customOn} onClick={() => props.setMode('auto')}>{props.autoLabel}</Chip>
        <Chip on={customOn} swatch={swatch} onClick={() => props.setMode('custom')}>{props.customLabel}</Chip>
      </div>
      {customOn && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
          <input type="color" value={rgbaToHex(props.custom)} aria-label={props.title}
            style={{ width: 34, height: 26, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
            onChange={(event) => {
              const p = parseRgba(event.target.value);
              if (p !== null) props.setCustom(cssColor([p[0], p[1], p[2]], alpha));
            }} />
          <input type="text" className={css.button} value={props.custom} placeholder="#3b82f6 / rgb(59,130,246)" spellCheck={false}
            style={inputStyle}
            onChange={(event) => props.setCustom(event.target.value)} />
          <input type="range" min={0} max={100} step={1} value={Math.round(alpha * 100)} aria-label={props.opacityLabel.replace('{title}', props.title)}
            style={{ width: 90, accentColor: 'var(--dsw-alias-state-business-primary, #3b82f6)' }}
            onChange={(event) => props.setCustom(cssColor(rgb, Number(event.target.value) / 100))} />
          <span className={css.desc} style={{ minWidth: 34, textAlign: 'right' }}>{Math.round(alpha * 100)}%</span>
        </div>
      )}
    </div>
  );
}

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
  const takeover = snap.hideOfficialNav !== false;
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

      <div className={css.row}>
        <RailColorPicker
          title={text(props, copy, 'colorBarTitle')}
          mode={snap.railColor ?? 'auto'}
          custom={snap.railColorCustom ?? ''}
          autoLabel={text(props, copy, 'colorAuto')}
          customLabel={text(props, copy, 'colorCustom')}
          opacityLabel={text(props, copy, 'opacityLabel')}
          setMode={(v) => props.prefs.actions.setRailColor?.(v)}
          setCustom={(v) => props.prefs.actions.setRailColorCustom?.(v)}
        />
      </div>

      <div className={css.row}>
        <RailColorPicker
          title={text(props, copy, 'colorAccentTitle')}
          mode={snap.railAccent ?? 'auto'}
          custom={snap.railAccentCustom ?? ''}
          autoLabel={text(props, copy, 'colorAuto')}
          customLabel={text(props, copy, 'colorCustom')}
          opacityLabel={text(props, copy, 'opacityLabel')}
          setMode={(v) => props.prefs.actions.setRailAccent?.(v)}
          setCustom={(v) => props.prefs.actions.setRailAccentCustom?.(v)}
        />
      </div>

      <div className={css.row}>
        <div className={css.rowText}>
          <div className={css.title}>{text(props, copy, 'takeoverTitle')}</div>
          <div className={css.desc}>{text(props, copy, 'takeoverDescription')}</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={takeover}
          className={css.switch}
          data-on={takeover || undefined}
          data-tidy-display-takeover={takeover ? 'on' : 'off'}
          onClick={() => { props.prefs.actions.setHideOfficialNav?.(!takeover); }}
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
