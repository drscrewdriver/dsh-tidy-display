# Tasks

> 链式分支：全部裁剪/回移植工作在 Phase C0（compat/0.1.5）完成，C1/C2 只带增量。每步后跑 `npx tsc -p tsconfig.json --noEmit`，每个 Phase 末跑完整四门（tsc / eslint / test / build）。

## Phase C0：compat/0.1.5 基线（裁剪 + 回移植全量）
- [ ] task_C0.1: `git checkout -b compat/0.1.5 main`；删除 reader 面文件（精确清单 = spec「裁剪清单」所列 src/client/*.tsx|ts + tests 对应文件 + `skills/`；保留 `src/client/rail/`、`store.ts`、`settings-copy.ts`）。交付物：裁剪后 `src/` 只含 rail 子集；验证：`grep -r "Reader\|McpApp\|official-slots\|volatile" src/ tests/` 零命中
- [ ] task_C0.2: 重写 `src/client/store.ts` 为 rail prefs 子集（railEnabled/railSide/railStyle/railRing/hideOfficialNav/railColor/railColorCustom/railColorLight/railAccent/railAccentCustom/railAccentLight + set actions + `createReaderStore` 改名 `createRailStore`，persist key 保留 `dsh.reader.v1` 兼容旧数据）。验证：`npx tsc --noEmit`
- [ ] task_C0.3: 重写 `src/client/index.tsx` 为 legacy bootstrap——删除 `dsh-family.tab`/utilities 槽位挂载，改为：`ensureRailCss()` 注入 → MutationObserver 守护找 `[data-conversation-scroll]` → 旁挂自建容器 `div` → `createRoot().render(<RailView …/>)`；prefs 从 `settingsScope.getSnapshot()` 读写 `tidy-display` 命名空间。验证：tsc 零错误
- [ ] task_C0.4: 新建 `src/client/autoload.ts`——移植 tidychat `compat/0.1.5:src/client/index.ts` L556+ Governor（status: idle/loading/settling/paused/done，时间预算）+ L935-958 `findLoadOlderButton`（'加载更早'/'Load earlier'/'Load older'），导出 `startAutoLoad(getRoot, opts): () => void`。验证：tsc 零错误
- [ ] task_C0.5: 新建 `src/client/LegacySettingsCard.tsx`——移植 tidychat `release/0.1.7:src/client/index.ts` L2191-2255 的 chipRow/colorField/字段布局（显示位置/显示样式/外圈/标记色/强调色/接管/自动加载开关），文案走 `settings-copy.ts`；挂 `settings.plugins.tab` 槽位。验证：tsc 零错误
- [ ] task_C0.6: 重写 `src/index.ts`（宿主半）——`import z from 'schemastery'`（unscoped），schema 含全部 rail 键（布尔/枚举，无 `.volatile()`）；`apply` 内用 tidychat compat/0.1.5 L83-99 探测式注册（`installSection(ctx, 'tidy-display', Config, entry, { setSource, onChange })` → `register('tidy-display', Config, { base })` → 皆无则跳过）；`export const TIDYDISPLAY_SETTINGS_NAMESPACE = 'tidy-display'`。验证：tsc 零错误 + `grep volatile src/` 零命中
- [ ] task_C0.7: `package.json`——deps `{ "schemastery": "^3.18.0" }`；peer 删 14 个 0.1.7 包，改 `{"@deepseek-ai/dsh-settings": "^0.1.5-rc.2", "react": "^18.2.0"}`；`dsh.client.inject = ["@deepseek-ai/dsh-client-store", "@deepseek-ai/dsh-client-ui-settings"]`；`exports`/`dsh.bundle.patch`/`files` 结构不变；devDeps 保留 tsdown/typescript/tsx/eslint 套件。验证：`pnpm install` 成功
- [ ] task_C0.8: `tsdown.config.ts` 确认双入口不变（host entry + externalClientBundle client）；`cordis.patch.yml` 不变（id: tidy-display）。验证：`npx tsdown` 产出 `lib/dsh-tidy-display.js` + `lib/client.js`
- [ ] task_C0.9: 重建测试子集——`tests/stock-install.test.ts`（peer/inject/无 volatile 断言 + README 一行式 `#v0.1.0-dsh0.1.5`）、`tests/rail-colors.test.ts`（自 tidychat 327e9d1 移植，同一函数集）、`tests/rail-store.test.ts`（prefs 默认值 + set actions）、`tests/legacy-settings-schema.test.ts`（schema 可构建、含全部 rail 键、无 volatile）。验证：`node --import tsx/esm --test tests/*.test.ts` 全绿
- [ ] task_C0.10: eslint.config.mjs 沿用；`npx eslint .` 清零（含 scripts/tools globals 段）。验证：lint 零错误
- [ ] task_C0.11: README.md / README.en.md——「本分支 = DSH 0.1.5-alpha.1+~0.1.6 消息轨子集」开头段 + 安装一行式 + 0.1.5 接管待实测标注；CHANGELOG 条目。验证：`npm test`（stock-install README 断言）绿
- [ ] task_C0.12: 四门全绿 → 提交 → `git tag v0.1.0-dsh0.1.5` → 推送分支 + tag（SSH 抖动用重试循环）。验证：`git ls-remote --heads --tags origin` 可见

## Phase C1：compat/0.1.2（增量）
- [ ] task_C1.1: `git checkout -b compat/0.1.2 compat/0.1.5`；package.json peer 改 `"@deepseek-ai/dsh-settings": ">=0.1.2-alpha.2 <0.1.5-alpha.1"`。验证：tsc + build 绿
- [ ] task_C1.2: README 双语该线段（0.1.2-alpha.2~0.1.4.x；0.1.3/0.1.4 标注「理论可用、未实测」；接管开关保留）；stock-install README 断言同步。验证：`npm test` 绿
- [ ] task_C1.3: 四门全绿 → 提交 → `git tag v0.1.0-dsh0.1.2` → 推送

## Phase C2：compat/0.1.1（增量）
- [ ] task_C2.1: `git checkout -b compat/0.1.1 compat/0.1.2`；peer 改 `">=0.1.0-rc.7 <0.1.2-alpha.2"`；设置改 register 优先（installSection 探测可留作无害分支）；移除接管开关 UI + `hideOfficialNav` 字段（store/schema/卡片/文案四处）；设置卡不挂 `settings.plugins.tab`（槽位未验证），仅 register schema 表单（颜色为预设枚举）。验证：`grep -r "hideOfficialNav" src/` 零命中
- [ ] task_C2.2: README 双语该线段（0.1.0-rc.7~0.1.2-alpha.1；无官方轨故无接管；设置走宿主旧表单）；stock-install 断言同步。验证：`npm test` 绿
- [ ] task_C2.3: 四门全绿 → 提交 → `git tag v0.1.0-dsh0.1.1` → 推送

## Phase C3：实测与收尾
- [ ] task_C3.1: 三宿主冒烟（有哪个宿主做哪个）：`dsh plugin --profile web add github:drscrewdriver/dsh-tidy-display#v0.1.0-dsh0.1.x` → 重开 Host → 硬刷新 → 按 checklist「Must Pass」轨/配色/autoLoad 逐项过。无宿主则记录「未实测」
- [ ] task_C3.2: main 分支 README 兼容矩阵「规划支持」→「compat/0.1.x 分支已支持」+ tag 链接；CHANGELOG 汇总；四门绿 → 提交推送 main
- [ ] task_C3.3: npm 发布后补 dist-tag：`npm dist-tag add @drscrewdriver/dsh-tidy-display@0.1.0 dsh-0.1.5`（×3 线）；README 安装段加 npm 包名形式（依赖 npm publish，另行触发）
