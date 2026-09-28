# Checklist

## Must Pass（本轮：README 声明）
- [ ] README.md / README.en.md 新增「来源与致谢」节：实时显示来源（bd 上游+fork）、消息轨来源（tidychat 上游+compat 线），全部带可查证链接（仓库/PR/commit）
- [ ] 「原版 better-display 的不足」三条齐全：①消息/思考无底框（主题/壁纸下可读性差）→ fork 气泡+思考衬底；②阅读视图丢行级锚点 → 生态插件静默失效（PR #41）；③TimelineRail 无鱼眼摘要/跳转/配色
- [ ] 「原版 tidychat 的不足」三条齐全：①折叠手术与宿主原生折叠重叠；②0.2.10 及更早 0.1.2 宿主轨从未渲染（0.3.0 修复）；③与 bd 阅读视图双向冲突
- [ ] 「宿主兼容性」节：能力矩阵（0.1.7 / 0.1.2-alpha.2~0.1.6 / 0.1.0-rc.7~0.1.2-alpha.1）+ 版本指路表 + 「截至 2026-09-28」时效标注
- [ ] 口吻检查：只有事实与链接，无贬损措辞；对两个上游均有致谢
- [ ] 双语结构逐节对齐；git push 后 GitHub 渲染正常

## Should Pass
- [ ] 规划四件套 + 归档说明在仓库可见（docs/plans/2026-09-28-merge/）
- [ ] PR #41 合并后回访更新声明第 ② 条（记入 tasks 后续）

## 旧宿主 legacy 线（本轮只规划，实施时启用）
- [ ] compat/legacy 分支：rail-only 裁剪清单按 tasks Phase L 执行
- [ ] 0.1.5 / 0.1.2 / 0.1.1 宿主实测：轨渲染、柔光、配色、autoLoad、installSection/register 设置面
- [ ] dist-tag 发布（dsh-0.1.5 / dsh-0.1.2 / dsh-0.1.1）+ README 版本表更新
