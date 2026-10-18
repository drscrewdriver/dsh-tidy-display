# Glass 模式透明底修复方向（tidy-display）

> 症状：皮肤/glass 模式（`[data-reader-glass]`）下，① 工具卡内容面纯 `transparent` 无底板 → 文字直接压在壁纸上糊；② 官方输入泡 `.user` 不透明度偏低。
> 根因：这两处在 glass 分支里只设了"透"，没补"底板/毛玻璃/不透明度"。
> 落点文件：`src/client/Reader.module.css`
> 影响面：仅 `data-reader-glass` 分支，不碰默认不透明外观；`--dsw-alias-bg-base` 主题自适应，深色皮肤不会变白糊。

---

## ① 工具卡内容面（截图1：带"结果/输入/原始数据"tab 的卡）

**现状** `Reader.module.css:610-620`
```css
.root[data-reader-glass] .toolDetails,
.root[data-reader-glass] .notice,
.root[data-reader-glass] .unknown,
.root[data-reader-glass] .toolRaw,
.root[data-reader-glass] .systemPrompt,
.root[data-reader-glass] .compactionSummaryBox,
.root[data-reader-glass] .imageFrame,
.root[data-reader-glass] .imageDialog {
  background: transparent;   /* ← 只透不糊，无 plate 无 blur */
}
```

**改法**：换成"半透明底板 + 毛玻璃"，与 `.answer` 那套一致。
```css
.root[data-reader-glass] .toolDetails,
.root[data-reader-glass] .notice,
.root[data-reader-glass] .unknown,
.root[data-reader-glass] .toolRaw,
.root[data-reader-glass] .systemPrompt,
.root[data-reader-glass] .compactionSummaryBox,
.root[data-reader-glass] .imageFrame,
.root[data-reader-glass] .imageDialog {
  background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 55%, transparent);
  background-image: linear-gradient(rgba(127,127,127,.08), rgba(127,127,127,.08)); /* 防皮肤把 token 清零后塌成无底 */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```
- `55%` = "半透明但可读"起点：更透调低、更实调高。
- `.imageDialog`（模态）建议单独更高档（~80%），别和列表卡同值。

---

## ② 官方输入泡 `.user`（截图2：用户消息透明泡）

**现状** `Reader.module.css:598-603`
```css
.root[data-reader-glass] .user {
  background: color-mix(in srgb, var(--dsw-specific-bubble, rgba(0,0,0,.08)) 25%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(128,128,128,.3)) 30%, transparent);
}
```

**改法**：把 `25%` 提到 `~45%`，兜底值 `.08` 提到 `.14`（blur 不动）。
```css
.root[data-reader-glass] .user {
  background: color-mix(in srgb, var(--dsw-specific-bubble, rgba(0,0,0,.14)) 45%, transparent);
  /* backdrop-filter / border 保留 */
}
```

---

## 参考锚点（同文件里已有的正确范式）
- `.answer` 三层底板 + blur：`Reader.module.css:684-695`
- `.reasonCard` 共享洗色板：`706-715`
- `.processFrame > .toolActivity` 三层 plate（scrim + neutral tint + layer-1）：`732-744`
- 设计注释（为何要 background-image 兜底防 token 被清零）：`671-683`

## 待办
- [x] 改 ① L610-620（含 `.imageDialog` 单独高档）——`.attention` 与组同属透明内容面，一并补底板
- [x] 改 ② L599（25%→45%，兜底 .08→.14）
- [x] 备份 → 改 → CSS 构建校验（tsc + tsdown 通过，产物 `lib/client.js` 已核对 45%/55%/80% 三处）→ diff
  - 备份：`_tmp-backup-Reader.module.css-glassfix-20261018.css`（仓库根，不入 pack）
  - 注：完整 `npm run build` 的 check-harness-compat 门禁需 `rg` + harness 源码检出，本环境不可用，校验只跑了 tsc+tsdown

## 后续调整（2026-10-18，关联半透明开关）
- 新增单旋钮 `.root[data-reader-glass] { --reader-plate-wash: 35%; }`：半透明（毛玻璃）开关**开着**时，`.user` 泡、内容面组、`.imageDialog` 统一 35% 底板
- 开关**没开**时玻璃分支不生效，回落到不透明的宿主原生底（≥ 45% 实底，构造性满足），未改任何默认外观
- `.imageDialog` 原高档 80% 已并回同串选择器组共用旋钮；若模态在照片遮罩背景下显薄，给它单条更高的 `--reader-plate-wash` 覆盖即可
- 产物核对：`lib/client.js` 中 45/55/80 字面量已清零（仅剩两处本次修复面外的既有规则），旋钮定义×1 + var 引用×2 就位
