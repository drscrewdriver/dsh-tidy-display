# Tasks

## Phase R（本轮）：README 诚实声明 + 兼容性章节
- [ ] task_R1: README.md 在功能清单前插入「来源与致谢」+「原版的不足与本项目的修复」+「宿主兼容性（能力矩阵）」三节（内容按 spec §R1/R2，链接按 findings 锚点表）
- [ ] task_R2: README.en.md 逐节对齐翻译
- [ ] task_R3: 提交 + 推送 main；GitHub 渲染目检

## Phase L（规划，待真实需求后实施）：legacy 反向适配线
- [ ] task_L0: 建 compat/legacy 分支（自 main 裁剪）
- [ ] task_L1: 删除 reader 面：Reader.tsx、ChoreographedFlow/Blocks/ReasoningCard/…、official-slots、entry.tsx、McpAppFrame、waiting-clock 等 bd 专属模块；package.json 去掉 bd 独有 peer
- [ ] task_L2: 保留 rail/RailView.tsx + rail/colors.ts（原生锚点路径为主，data-reader-key 回退可留可删）
- [ ] task_L3: 回移植设置层：tidychat ≤0.3.1 的 installSection（0.1.2-alpha.2~0.1.6）+ settings.plugin.item register（0.1.0-rc.7~0.1.2-alpha.1）双路径 + 对应 schema（去 .volatile()）
- [ ] task_L4: 回移植 autoLoad Governor（tidychat release/0.1.7 历史）+ findLoadOlderButton 接入
- [ ] task_L5: 构建产物 + peer range 校正；0.1.5 / 0.1.2 / 0.1.1 三宿主实测（checklist 旧宿主段）
- [ ] task_L6: dist-tag 发布 dsh-0.1.5 / dsh-0.1.2 / dsh-0.1.1；README 版本表更新；CHANGELOG 记录
