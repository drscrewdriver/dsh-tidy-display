# Findings

## 架构决策
- **诚实声明放在 README 顶部而非「关于」角落**：fork 的核心价值主张就是"修了上游的两个真实缺陷"（可读性、生态契约），藏着掖着反而可疑；awesome-dsh-plugin 收录审核也看来源说明。
- **双向不足都写**：只写 bd 的不足、不写 tidychat 的问题，会被上游作者视为拉踩；tidychat 的 0.1.2 取数 bug 有其仓库根因文档背书，写出来反而证明合并项目的取数链路（DOM 单一事实源 + 事件增强）经过双端教训沉淀。
- **反向适配选「分线发布」而非「运行时探测」**：tidychat README 的结论是实证过的——0.1.7 把 `installSection`/`register` 一并移除、`.volatile()` 是 0.1.7 独有方法（旧宿主调用即抛错、插件加载失败），一份产物无法同时兼容 0.1.6 与 0.1.7。运行时探测需要把两套 API 都打进包且保证旧宿主加载时不碰 `.volatile()`，收益（单一包名）远小于风险（加载失败 = 全插件不可用）。
- **legacy 线裁剪而非复用 tidychat 原包**：tidychat 上游停在 0.3.1 旧宿主维护线，缺白色柔光（0.3.4 产物在 release/0.1.7）、缺调色盘透明度滑杆的 legacy 形态、缺 steering 同视在旧宿主的验证。从本项目裁剪 = 旧宿主用户直接拿到最新轨能力。
- **旧宿主无需 data-reader-key 回退**：0.1.0-rc.7~0.1.6 没有 bd 阅读视图（无法安装），消息行永远是原生 ChatView 渲染，`data-chat-anchor-key` 天然完整。回退路径只在 0.1.7 + 第三方渲染器替换者场景有意义。

## 技术选型
- **legacy 设置层**：回移植 tidychat ≤0.3.1 的 `installSection(ctx, ns, schema, entry, hooks)`（0.1.2-alpha.2~0.1.6）与 `settings.plugin.item` register（0.1.0-rc.7~0.1.2-alpha.1，keyed 槽 `key` 字段）双路径，代码在 tidychat `release/0.1.7` 分支的 git 历史可考（其 0.3.1 及更早 tag）。
- **legacy autoLoad**：Governor 本体与宿主无关（时间预算制），只有 `loadOnePage` 的"点宿主加载按钮"接入点——旧宿主同样有「加载更早」按钮，照 tidychat `findLoadOlderButton` 的按钮文本匹配即可。
- **legacy 发布形态**：同包名 + dist-tag（`dsh-0.1.5`/`dsh-0.1.2`/`dsh-0.1.1`），README 版本表指路——与 tidychat 的 `dsh-0.1.2` tag 惯例一致，避免 `-legacy` 后缀造成的"过期分支"观感。
- **README 声明的可查证锚点**：气泡=bd fork `fa3a795`/`94d59c7`；锚点修复=aa2246740/dsh-better-display#41（fork 侧实现在 `c785c4a`，等价 diff 见 refer-bd-pr 分支 `f14eaba`）；思考衬底=本仓库 `c785c4a`；柔光/配色=tidychat `cad8ef0` + 本仓库 `93a80c9`/`4b0d88d`；tidychat 0.1.2 取数 bug=其仓库 `docs/RAIL-ROOT-CAUSE-ANALYSIS.md`。

## 约束与依赖
- bd changelog 实证 rc.1→rc.2 都有 breaking（0.3.1 修 rc.1 throw、0.3.3 收 rc.2）——宿主小版本间的 reader 兼容是持续负担，下放旧宿主在工程上不可行。
- 0.1.0-rc.6 及更早：白名单补丁时代（tidychat 0.1.0），明确不支持，README 指路 tidychat。
- legacy 线如实施，构建同样受 `check-harness-compat` 门约束（需要对应版本 Harness 源码检出做哈希比对）——发版机需要配置或按 bd 的 vendored adapter 模式处理。

## 风险识别
- **上游观感**：声明章节写"不足"可能引起 aa2246740 / BananaSoldier01 不适。缓解：口吻 = 事实 + 链接 + 致谢 + PR #41 这种"向上游贡献修复"的姿态；且 PR #41 合并后该条不足自然消失，声明同步更新。
- **能力矩阵的时效性**：bd/tidychat 上游继续演化，矩阵会过期。缓解：矩阵标注"截至 2026-09-28，对应版本号"。
- **legacy 线维护承诺**：一旦发 legacy tag，旧宿主用户会期待跟进。缓解：本轮只规划不实施；实施时在 README 写明"安全修复级别维护"。
