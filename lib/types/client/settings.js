import { settingsCopyFor, zh, en, ja, ko, fr, de, it, ru, es } from './settings-copy.js';
import { softSvc, safeSeat } from './soft-svc.js';
import { SettingsSection } from './SettingsSection.js';
import { installPluginConfigCard } from './config-card.js';
import { firstSessionId, skillsFromListResult } from './skill-status.js';
import { claimFamilyHostIfOrphaned } from './family-host.js';
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
                ? `/tidy-display/skill-status?cwd=${encodeURIComponent(cwd)}`
                : '/tidy-display/skill-status';
            const res = await fetch(url);
            if (!res.ok)
                return undefined;
            return await res.json();
        },
        listRemoteSkills: async () => {
            const remote = softSvc(ctx, 'remote');
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
        ctx.effect(() => locale.register('tidy-display', { zh, en, ja, ko, fr, de, it, ru, es }), 'dsh-tidy-display: settings copy');
    }
    const checkSkill = createSkillProbe(ctx);
    const injected = () => ({
        prefs,
        copy: settingsCopyFor(languageTag(ctx)),
        languageTag: languageTag(ctx),
        checkSkill,
    });
    // 探针：宿主执行过本工厂 == 有人声明了 `dsh-family.tab`（插件侧唯一合法的
    // 「容器在不在」判据：槽门面不暴露 spec 查询）。
    let familyTabHeld = false;
    safeSeat('dsh-family.tab', () => ctx.slots.inject('dsh-family.tab', () => {
        familyTabHeld = true;
        return ctx.slots.register({
            name: 'dsh-family.tab',
            id: 'tidy-display',
            order: 60,
            label: () => locale?.bind?.('tidy-display')?.('nav') || settingsCopyFor(languageTag(ctx)).nav,
            locale: locale?.bind ? 'tidy-display' : undefined,
            inject: injected,
        }, SettingsSection);
    }));
    // 家族容器兜底：owner 全部让位/声明失败时上面的 inject 静默等待，本卡整轮启动
    // 不可见且不报错。到分级时刻仍无人持有则自己上位（declare-or-withdraw）。
    ctx.effect(() => claimFamilyHostIfOrphaned(ctx.slots, () => familyTabHeld, () => '起子插件设置', '[dsh-tidy-display]'), 'dsh-tidy-display: family host backstop');
    safeSeat('plugins.bundle.config/row.config', () => installPluginConfigCard(ctx, injected));
}
//# sourceMappingURL=settings.js.map