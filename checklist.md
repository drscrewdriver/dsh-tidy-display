# Checklist

## Must Pass（每条兼容分支的发布门）
- [ ] `npx tsc -p tsconfig.json --noEmit` 零错误
- [ ] `npx eslint .` 零错误（eslint.config.mjs 沿用 main）
- [ ] `node --import tsx/esm --test tests/*.test.ts` 全绿（兼容子集：stock-install / rail-colors / rail-store / legacy-settings-schema）
- [ ] `npx tsc -p tsconfig.json && npx tsdown` 构建成功，`lib/dsh-tidy-display.js` + `lib/client.js` 入库，client.js 内 `id: "@drscrewdriver/dsh-tidy-display"`
- [ ] src 内无 reader 面残留（`grep -r "Reader\|McpApp\|official-slots" src/` 无命中）；无 `.volatile()`（`grep -r volatile src/` 无命中）；无 `@deepseek-ai/schemastery`
- [ ] package.json：peer 仅 `@deepseek-ai/dsh-settings`（按线范围）+ `react ^18.2.0`；deps 仅 `schemastery ^3.18.0`；`dsh.client.inject` = `["@deepseek-ai/dsh-client-store", "@deepseek-ai/dsh-client-ui-settings"]`
- [ ] 宿主半探测链：`installSection` 存在则走之，否则 `register`，两者皆无静默跳过（插件仍加载）
- [ ] 消息轨在原生对话视图渲染：横线/圆点切换、左右镜像、白色柔光外圈、鱼眼悬停摘要、点击跳转、当前轮高亮
- [ ] 配色链：auto 跟随主题对比度纠偏；自定义取色器 + HEX/RGB 文本 + 透明度滑杆实时生效
- [ ] autoLoad：出现「加载更早 / Load earlier / Load older」按钮时按 Governor 时间预算自动点击，长会话全量纳入轨
- [ ] README.md / README.en.md：该线安装一行式（tag）、兼容矩阵行、已知限制（0.1.5 接管待实测 / 0.1.3-0.1.4 未实测 / 0.1.1 无接管）
- [ ] tag `v0.1.0-dsh0.1.x` 打在线首提交上并推送

## Should Pass
- [ ] 0.1.5-rc.2 宿主实测：轨渲染 + 设置卡 + autoLoad（本机有该宿主则必做）
- [ ] 0.1.2-rc.1 宿主实测：同上 + 接管开关生效
- [ ] 0.1.1 宿主实测：register 表单可改值并即时生效
- [ ] 主线 README 兼容矩阵从「规划支持」改为「compat/0.1.x 分支（已支持）」并链接 tag
- [ ] CHANGELOG.md 记录三线发布
