# Checklist

## Must Pass
- [ ] `pnpm typecheck` 零错误；`npm run build` 产物齐全（lib/dsh-tidy-display.js + lib/client.js）
- [ ] 宿主 0.1.7-rc.2 激活：设置 → 插件出现「Tidy Display」卡（模块 id 三处一致，不重蹈 fork.4 静默失活）
- [ ] 阅读视图全功能回归：过程/思考/回答渲染、自动折叠、思考衬底、消息气泡、玻璃模式、交付物行、等待时钟、官方工具桥接
- [ ] 消息轨（阅读视图）：横线/圆点两样式渲染正常；鱼眼悬停 + 摘要卡 + 点击跳转 + 滚动当前轮高亮
- [ ] 消息轨（原生对话视图，如保留）：经 `conversation.session.header.utilities` 槽正常渲染
- [ ] 白色柔光外圈：横线胶囊光斑 / 圆点正圆光斑，当前轮浓悬停轮淡，开关生效
- [ ] 未加载轮次占位：长会话新开时轨显示 outline 全覆盖占位，点击经 loadThrough 加载后落位为实点，无错位
- [ ] 末尾插队（steering）会话：圆点数 = DOM 行数，尾部点击不失效
- [ ] 智能加载更早历史：空闲期自动逐页加载、响应下降自动暂停、手动可续
- [ ] 诊断报告：轮数口径与轨一致，能生成报告
- [ ] 官方 TurnNavigator 不再出现（阅读视图），无"双轨并存"
- [ ] 明暗主题 × 玻璃皮肤：轨配色 auto 跟随正确，柔光在明暗壁纸下均为"半透明光泽"而非硬框

## Should Pass
- [ ] 长会话（50+ 轮）滚动性能与内存对比双插件方案不劣化（canvas 单轨应更优）
- [ ] 设置卡：轨配置与 bd 原配置同卡分区展示，volatile 表单即时生效
- [ ] 老用户迁移：装有 tidychat 的 settings.yaml 键被新插件直接读取（键名未改）
- [ ] `npm pack` 产物 files 白名单正确，`prepublishOnly` 构建通过
