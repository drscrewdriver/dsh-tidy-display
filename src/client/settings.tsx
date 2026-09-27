import type { Context } from '@deepseek-ai/cordis';
import type {} from './settings-slots.js';
import { settingsCopyFor, zh, en } from './settings-copy.js';
import { SettingsSection, type BetterDisplaySettingsInjected, type OpenPrefs } from './SettingsSection.js';
import { firstSessionId, skillsFromListResult, type SkillStatusProbe } from './skill-status.js';
import type { HostSkillStatus } from '../skill-status.js';

interface LocaleFace {
  register?: (ns: string, dicts: { zh: unknown; en: unknown }) => () => void;
  bind?: (ns: string) => (key: string) => string;
  getSnapshot?: () => { locale?: string; language?: string };
}

interface RemoteSkillsFace {
  list?: (arg: { sessionId: string }, signal?: AbortSignal) => Promise<unknown>;
}

function languageTag(ctx: Context): string | undefined {
  const locale = (ctx.get?.('locale') ?? (ctx as unknown as { locale?: LocaleFace }).locale) as LocaleFace | undefined;
  const snap = locale?.getSnapshot?.();
  return snap?.locale ?? snap?.language
    ?? (typeof document !== 'undefined' ? document.documentElement.lang : undefined)
    ?? (typeof navigator !== 'undefined' ? navigator.language : undefined);
}

function createSkillProbe(ctx: Context): SkillStatusProbe {
  return {
    fetchHostStatus: async () => {
      const sessions = ctx.sessions as { list?: { getSnapshot?: () => { byId?: Record<string, { cwd?: string }> } } } | undefined;
      const snap = sessions?.list?.getSnapshot?.();
      const id = firstSessionId(snap);
      const cwd = id && snap?.byId ? snap.byId[id]?.cwd : undefined;
      const url = cwd
        ? `/tidy-display/skill-status?cwd=${encodeURIComponent(cwd)}`
        : '/tidy-display/skill-status';
      const res = await fetch(url);
      if (!res.ok) return undefined;
      return await res.json() as HostSkillStatus;
    },
    listRemoteSkills: async () => {
      const remote = ctx.remote as unknown as { skills?: RemoteSkillsFace } | undefined;
      const skills = remote?.skills
        ?? (ctx.get?.('remote.skills') as RemoteSkillsFace | undefined)
        ?? ((ctx.get?.('remote') as { skills?: RemoteSkillsFace } | undefined)?.skills);
      const sessions = ctx.sessions as { list?: { getSnapshot?: () => { ids?: string[]; byId?: Record<string, unknown> } } } | undefined;
      const sessionId = firstSessionId(sessions?.list?.getSnapshot?.());
      if (!skills?.list || !sessionId) return undefined;
      return skillsFromListResult(await skills.list({ sessionId }));
    },
  };
}

export function installBetterDisplaySettings(ctx: Context, prefs: OpenPrefs): void {
  const locale = (ctx.get?.('locale') ?? (ctx as unknown as { locale?: LocaleFace }).locale) as LocaleFace | undefined;
  if (locale?.register) {
    ctx.effect(() => locale.register!('tidy-display', { zh, en }), 'dsh-tidy-display: settings copy');
  }
  const checkSkill = createSkillProbe(ctx);
  const injected = (): BetterDisplaySettingsInjected => ({
    prefs,
    copy: settingsCopyFor(languageTag(ctx)),
    languageTag: languageTag(ctx),
    checkSkill,
  });
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'tidy-display',
    order: 40,
    label: () => locale?.bind?.('tidy-display')?.('nav') || settingsCopyFor(languageTag(ctx)).nav,
    locale: locale?.bind ? 'tidy-display' : undefined,
    inject: injected,
  }, SettingsSection));
}
