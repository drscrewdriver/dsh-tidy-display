/**
 * dsh-tidy-display 的首次使用引导文案（3 步）。
 *
 * 与 `guide.tsx`（生成副本）分文件：副本会被 `_tools/guide-kit/sync.mjs` 覆盖。
 * 术语取自本插件自己的两套字典：`locales.ts`（阅读面）与 `settings-copy.ts`（设置面）。
 */
import type { GuideLocale, GuideStep } from './guide.tsx'

export const TIDY_DISPLAY_GUIDE_STEPS: Partial<Record<GuideLocale, readonly GuideStep[]>> = {
  zh: [
    {
      title: '阅读视图才是它的主战场',
      body: '打开任意会话，在视图切换里选「阅读」：消息气泡、毛玻璃、分段卡片都在这里生效；消息轨在对话视图和阅读视图两侧都画，不用来回切。',
    },
    {
      title: '过程折叠：先会关，再说要不要关',
      body: '阅读视图顶部工具栏有「自动折叠开/关」，与设置里的「自动折叠过程」是同一份状态。想核对完整过程，关掉它再展开「此前步骤」，比去翻原始记录快。',
    },
    {
      title: '围栏卡片渲染不出来时看这里',
      body: 'dsh-ui 组件围栏、mermaid、mcp-app 与 vcp-root 卡片都由阅读视图按段分发渲染；渲染失败的卡片折叠成标题栏，展开就能看源码。mcp-app 卡片本身不依赖 generative-mcpapps 技能——装它只是让模型自己想到用 MCP Apps。',
    },
  ],
  en: [
    {
      title: 'The reading view is where it lives',
      body: 'Open any session and pick "Reading" in the view switcher: message bubbles, frosted glass and segmented cards apply there. The message rail draws in both Chat and Reading, so no back-and-forth switching.',
    },
    {
      title: 'Process folding: know how to turn it off',
      body: 'The reading view toolbar has an auto-fold toggle (Auto-fold on / off), and Settings → "Auto-fold process" is the same state. To check the full process, turn it off and expand "Earlier steps" rather than opening the raw records.',
    },
    {
      title: 'When a fence card will not render',
      body: 'dsh-ui component fences, mermaid, mcp-app and vcp-root cards are dispatched per segment by the reading view; a card that fails to render collapses to a title bar — expand it to read the source. mcp-app cards do not require the generative-mcpapps skill: installing it only lets the model reach for MCP Apps on its own.',
    },
  ],
}
