export const en = {
    nav: '整洁显示',
    railTitle: 'Message rail',
    railDescription: 'On by default: a canvas navigation rail at the conversation edge — fish-eye hover with summaries, click to jump, current-turn highlight.',
    railSide: 'Rail position',
    railSideLeft: 'Left edge',
    railSideRight: 'Right edge (mirrored)',
    railStyle: 'Rail style',
    railStyleBar: 'Lines',
    railStyleDot: 'Dots',
    railRingTitle: 'Rail sheen',
    railRingDescription: 'On by default: a soft white sheen laid beneath the current and hovered marks, keeping them readable over busy wallpapers.',
    takeoverTitle: 'Take over the official rail',
    takeoverDescription: 'On by default: the official right-edge TurnNavigator is hidden (hidden, not unmounted) so this rail is the only one. Turn off to see both. On DSH 0.1.5 the official rail is hardcoded in ChatView — if hiding fails, turn this off.',
    colorBarTitle: 'Mark color',
    colorAccentTitle: 'Accent color',
    colorAuto: 'Auto',
    colorCustom: 'Custom',
    autoLoadTitle: 'Smart history loading',
    autoLoadDescription: 'On by default: auto-clicks the host "load earlier" button under a time budget so long sessions become fully navigable.',
};
export const zh = {
    nav: '整洁显示',
    railTitle: '消息轨',
    railDescription: '默认开启：会话区边缘的 canvas 导航轨——鱼眼悬停看摘要、点击跳转、当前轮高亮。',
    railSide: '显示位置',
    railSideLeft: '左缘',
    railSideRight: '右缘（镜像）',
    railStyle: '显示样式',
    railStyleBar: '横线',
    railStyleDot: '圆点',
    railRingTitle: '外圈柔光',
    railRingDescription: '默认开启：在当前轮与悬停轮的标记底下垫一层白色柔光，复杂壁纸上也能看清标记。',
    takeoverTitle: '接管官方消息轨',
    takeoverDescription: '默认开启：隐藏官方右缘 TurnNavigator（隐藏而非卸载），只保留本轨。关闭后两条轨并存。DSH 0.1.5 的官方轨硬编码在 ChatView 里，若隐藏无效请关闭此开关。',
    colorBarTitle: '标记色',
    colorAccentTitle: '强调色',
    colorAuto: '自动',
    colorCustom: '自定义',
    autoLoadTitle: '智能历史加载',
    autoLoadDescription: '默认开启：按时间预算自动点击宿主的「加载更早」按钮，长会话也能全量纳入定位轨。',
};
export function settingsLanguage(tag) {
    return (tag ?? '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}
export function settingsCopyFor(tag) {
    return settingsLanguage(tag) === 'zh' ? zh : en;
}
//# sourceMappingURL=settings-copy.js.map