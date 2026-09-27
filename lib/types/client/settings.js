import { settingsCopyFor, zh, en } from './settings-copy.js';
import { SettingsSection } from './SettingsSection.js';
import { firstSessionId, skillsFromListResult } from './skill-status.js';
function languageTag(ctx) {
    const locale = (ctx.get?.('locale') ?? ctx.locale);
    const snap = locale?.getSnapshot?.();
    return snap?.locale ?? snap?.language
        ?? (typeof document !== 'undefined' ? document.documentElement.lang : undefined)
        ?? (typeof navigator !== 'undefined' ? navigator.language : undefined);
}
function createSkillProbe(ctx) {
    return {
        fetchHostStatus: async () => {
            const sessions = ctx.sessions;
            const snap = sessions?.list?.getSnapshot?.();
            const id = firstSessionId(snap);
            const cwd = id && snap?.byId ? snap.byId[id]?.cwd : undefined;
            const url = cwd
                ? `/better-display/skill-status?cwd=${encodeURIComponent(cwd)}`
                : '/better-display/skill-status';
            const res = await fetch(url);
            if (!res.ok)
                return undefined;
            return await res.json();
        },
        listRemoteSkills: async () => {
            const remote = ctx.remote;
            const skills = remote?.skills
                ?? ctx.get?.('remote.skills')
                ?? (ctx.get?.('remote')?.skills);
            const sessions = ctx.sessions;
            const sessionId = firstSessionId(sessions?.list?.getSnapshot?.());
            if (!skills?.list || !sessionId)
                return undefined;
            return skillsFromListResult(await skills.list({ sessionId }));
        },
    };
}
export function installBetterDisplaySettings(ctx, prefs) {
    const locale = (ctx.get?.('locale') ?? ctx.locale);
    if (locale?.register) {
        ctx.effect(() => locale.register('better-display', { zh, en }), 'dsh-better-display: settings copy');
    }
    const checkSkill = createSkillProbe(ctx);
    const injected = () => ({
        prefs,
        copy: settingsCopyFor(languageTag(ctx)),
        languageTag: languageTag(ctx),
        checkSkill,
    });
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'better-display',
        order: 40,
        label: () => locale?.bind?.('better-display')?.('nav') || settingsCopyFor(languageTag(ctx)).nav,
        locale: locale?.bind ? 'better-display' : undefined,
        inject: injected,
    }, SettingsSection));
}
//# sourceMappingURL=settings.js.map