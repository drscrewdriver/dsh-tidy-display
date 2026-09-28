import * as React from 'react';
import { parseRgba } from './rail/colors.js';
import { settingsCopyFor, type SettingsCopy, type SettingsCopyKey } from './settings-copy.js';

/**
 * Legacy settings card, ported from dsh-tidychat (settings.plugin.item seat,
 * imperative settings era). Writes go through the bound settings scope; when
 * the scope is missing the card renders read-only defaults.
 */

export interface LegacySettingsValue {
  railEnabled: boolean;
  railSide: string;
  railStyle: string;
  railRing: boolean;
  railColor: string;
  railColorCustom: string;
  railAccent: string;
  railAccentCustom: string;
  autoLoad: boolean;
}

export interface LegacySettingsCardProps {
  value: LegacySettingsValue;
  writable: boolean;
  onToggle: (field: keyof LegacySettingsValue) => void;
  onSet: (field: string, value: unknown) => void;
  langTag: string | undefined;
}

let cssInjected = false;

export function ensureCardCss(): void {
  if (cssInjected) return;
  cssInjected = true;
  const style = document.createElement('style');
  style.setAttribute('data-tidy-display-card-css', '1');
  // Ported from the tidychat settings card (class prefix renamed).
  style.textContent = [
    '.td-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s;}',
    '.td-card:hover{border-color:var(--dsw-alias-label-dimmed);}',
    '.td-card-open{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed);}',
    '.td-card-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:transparent;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex;}',
    '.td-card-headtext{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex;}',
    '.td-card-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4;}',
    '.td-card-desc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5;}',
    '.td-card-chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s;}',
    '.td-card-chevron-open{transform:rotate(180deg);}',
    '.td-card-body{padding:4px 16px 12px;}',
    '.td-field{flex-direction:column;gap:6px;padding:12px 0;display:flex;}',
    '.td-field+.td-field{border-top:1px solid var(--dsw-alias-border-l2);}',
    '.td-field-head{align-items:center;gap:8px;display:flex;}',
    '.td-field-label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:1.5;}',
    '.td-field-hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5;}',
    '.td-switch{appearance:none;border:none;cursor:pointer;flex:none;width:34px;height:20px;border-radius:999px;padding:0;background:var(--dsw-alias-label-dimmed,rgba(127,127,127,0.4));position:relative;transition:background .16s;}',
    '.td-switch::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .16s;}',
    '.td-switch-on{background:var(--dsw-alias-brand-primary,#3b82f6);}',
    '.td-switch-on::after{transform:translateX(14px);}',
    '.td-color-sub{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px;}',
    '.td-color-sub-label{font-size:12px;color:var(--dsw-alias-label-tertiary,#999);flex:none;min-width:30px;}',
    '.td-color-chips{display:flex;flex-wrap:wrap;align-items:center;gap:6px;}',
    '.td-chip{appearance:none;display:inline-flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,0.4));background:transparent;color:var(--dsw-alias-label-secondary,#666);border-radius:999px;padding:3px 10px;}',
    '.td-chip:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,0.1));}',
    '.td-chip-on{border-color:var(--dsw-alias-state-business-primary,#3b82f6);color:var(--dsw-alias-label-primary,#222);background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,0.12));}',
    '.td-chip-dot{width:11px;height:11px;border-radius:50%;border:1px solid rgba(128,128,128,0.35);flex:none;}',
    '.td-picker{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:8px;}',
    '.td-color-input{appearance:none;width:34px;height:26px;padding:0;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,0.4));border-radius:6px;background:transparent;cursor:pointer;flex:none;}',
    '.td-color-input::-webkit-color-swatch-wrapper{padding:2px;}',
    '.td-color-input::-webkit-color-swatch{border:none;border-radius:4px;}',
    '.td-hex-input{appearance:none;flex:1 1 140px;min-width:110px;font-size:12px;font-family:var(--ds-font-family-code,monospace);color:var(--dsw-alias-label-primary,#222);background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,0.08));border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,0.4));border-radius:6px;padding:4px 8px;}',
    '.td-hex-input:focus{outline:1.5px solid var(--dsw-alias-button-info-fill,#3b82f6);outline-offset:1px;}',
    '.td-alpha-input{appearance:none;flex:1 1 90px;min-width:80px;height:4px;border-radius:999px;background:var(--dsw-alias-border-l2,rgba(128,128,128,0.4));cursor:pointer;}',
    '.td-alpha-input::-webkit-slider-thumb{appearance:none;width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-state-business-primary,#3b82f6);border:none;}',
    '.td-alpha-label{font-size:12px;color:var(--dsw-alias-label-tertiary,#999);min-width:34px;text-align:right;}',
  ].join('\n');
  document.head.appendChild(style);
}

const hex6Of = (rgb: readonly number[]): string =>
  '#' + rgb.slice(0, 3).map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('');

const cssColor = (rgb: readonly number[], a: number): string =>
  a >= 1
    ? hex6Of(rgb)
    : 'rgba(' + Math.round(rgb[0]) + ', ' + Math.round(rgb[1]) + ', ' + Math.round(rgb[2]) + ', ' + (Math.round(a * 1000) / 1000) + ')';

const chipRow = (
  opts: ReadonlyArray<{ key: string; label: string; preview?: string }>,
  selected: string,
  onClick: (key: string) => void,
  disabled: boolean,
): React.ReactElement =>
  React.createElement('div', { className: 'td-color-chips' },
    opts.map((o) => React.createElement('button', {
      key: o.key,
      type: 'button',
      title: o.label,
      'aria-pressed': selected === o.key,
      className: 'td-chip' + (selected === o.key ? ' td-chip-on' : ''),
      disabled,
      onClick: () => onClick(o.key),
    },
      o.preview !== undefined ? React.createElement('span', { className: 'td-chip-dot', style: { background: o.preview } }) : null,
      o.label,
    )),
  );

const colorField = (
  label: string,
  modeField: string,
  customField: string,
  mode: string,
  custom: string,
  autoPreview: string,
  hint: string,
  writable: boolean,
  onSet: (field: string, value: unknown) => void,
): React.ReactElement => {
  const customOn = mode === 'custom';
  const parsed = parseRgba(String(custom ?? ''));
  const rgb: number[] = parsed === null ? [59, 130, 246] : [parsed[0], parsed[1], parsed[2]];
  const alpha = parsed === null ? 1 : parsed[3];
  const swatch = parsed !== null ? cssColor(rgb, alpha) : 'linear-gradient(135deg, #f87171, #60a5fa, #4ade80)';
  return React.createElement('div', { key: modeField, className: 'td-field' },
    React.createElement('div', { className: 'td-field-head' },
      React.createElement('span', { className: 'td-field-label' }, label),
    ),
    React.createElement('div', { className: 'td-color-sub' },
      React.createElement('span', { className: 'td-color-sub-label' }, '模式'),
      chipRow([
        { key: 'auto', label: '自动', preview: autoPreview },
        { key: 'custom', label: '自定义', preview: swatch },
      ], customOn ? 'custom' : 'auto', (k) => onSet(modeField, k), !writable),
    ),
    customOn ? React.createElement('div', { className: 'td-picker' },
      React.createElement('input', {
        type: 'color', className: 'td-color-input', value: hex6Of(rgb), disabled: !writable,
        'aria-label': label + ' 取色',
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          const p = parseRgba(String(e.target.value));
          if (p !== null) onSet(customField, cssColor([p[0], p[1], p[2]], alpha));
        },
      }),
      React.createElement('input', {
        type: 'text', className: 'td-hex-input', value: String(custom ?? ''), disabled: !writable,
        placeholder: '#3b82f6 / rgb(59,130,246)', spellCheck: false,
        'aria-label': label + ' 颜色值',
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => onSet(customField, String(e.target.value)),
      }),
      React.createElement('input', {
        type: 'range', className: 'td-alpha-input', min: 0, max: 100, step: 1,
        value: Math.round(alpha * 100), disabled: !writable,
        'aria-label': label + ' 透明度',
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => onSet(customField, cssColor(rgb, Number(e.target.value) / 100)),
      }),
      React.createElement('span', { className: 'td-alpha-label' }, Math.round(alpha * 100) + '%'),
    ) : null,
    React.createElement('p', { className: 'td-field-hint' }, hint),
  );
};

const toggleField = (
  label: string,
  hint: string,
  on: boolean,
  disabled: boolean,
  onToggle: () => void,
): React.ReactElement =>
  React.createElement('div', { className: 'td-field' },
    React.createElement('div', { className: 'td-field-head' },
      React.createElement('span', { className: 'td-field-label' }, label),
      React.createElement('button', {
        type: 'button',
        className: 'td-switch' + (on ? ' td-switch-on' : ''),
        role: 'switch',
        'aria-checked': on,
        disabled,
        onClick: onToggle,
      }),
    ),
    React.createElement('p', { className: 'td-field-hint' }, hint),
  );

export function LegacySettingsCard(props: LegacySettingsCardProps): React.ReactElement {
  const { value, writable, onToggle, onSet, langTag } = props;
  const copy: SettingsCopy = settingsCopyFor(langTag);
  const [open, setOpen] = React.useState(false);
  const chevron = React.createElement('svg', {
    className: 'td-card-chevron' + (open ? ' td-card-chevron-open' : ''),
    viewBox: '0 0 14 14', width: 14, height: 14, fill: 'none',
  }, React.createElement('path', { d: 'M3.5 5.5L7 9l3.5-3.5', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }));
  // keyed slot panel context (settings.plugin.item) is not a list — the card root is a div.
  return React.createElement('div', { className: 'td-card' + (open ? ' td-card-open' : '') },
    React.createElement('button', {
      type: 'button',
      className: 'td-card-header',
      'aria-expanded': open,
      onClick: () => setOpen(!open),
    },
      React.createElement('span', { className: 'td-card-headtext' },
        React.createElement('span', { className: 'td-card-name' }, '整洁显示 tidy-display'),
        React.createElement('span', { className: 'td-card-desc' }, copy.railDescription),
      ),
      chevron,
    ),
    open ? React.createElement('div', { className: 'td-card-body' },
      toggleField(copy.railTitle, copy.railDescription, value.railEnabled === true, !writable, () => onToggle('railEnabled')),
      React.createElement('div', { className: 'td-field' },
        React.createElement('div', { className: 'td-field-head' },
          React.createElement('span', { className: 'td-field-label' }, copy.railSide),
        ),
        chipRow([
          { key: 'left', label: copy.railSideLeft },
          { key: 'right', label: copy.railSideRight },
        ], String(value.railSide ?? 'left'), (k) => onSet('railSide', k), !writable),
      ),
      React.createElement('div', { className: 'td-field' },
        React.createElement('div', { className: 'td-field-head' },
          React.createElement('span', { className: 'td-field-label' }, copy.railStyle),
        ),
        chipRow([
          { key: 'bar', label: copy.railStyleBar },
          { key: 'dot', label: copy.railStyleDot },
        ], String(value.railStyle ?? 'bar'), (k) => onSet('railStyle', k), !writable),
      ),
      toggleField(copy.railRingTitle, copy.railRingDescription, value.railRing === true, !writable, () => onToggle('railRing')),
      colorField(copy.colorBarTitle, 'railColor', 'railColorCustom', String(value.railColor ?? 'auto'), String(value.railColorCustom ?? ''), 'currentColor', '自动 = 跟随主题，对比不足自动纠偏；自定义 = 取色器 / HEX·RGB / 透明度。', writable, onSet),
      colorField(copy.colorAccentTitle, 'railAccent', 'railAccentCustom', String(value.railAccent ?? 'auto'), String(value.railAccentCustom ?? ''), 'currentColor', '强调色作用于当前轮与悬停轮的标记。', writable, onSet),
      toggleField(copy.autoLoadTitle, copy.autoLoadDescription, value.autoLoad === true, !writable, () => onToggle('autoLoad')),
    ) : null,
  );
}

export type { SettingsCopyKey };
