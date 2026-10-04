/**
 * hosts.mjs —— 宿主版本枚举的**唯一事实源**。
 *
 * 迁移基线：improve-dsh-plugins/enum-peer-migration/INDEX.md §A；
 * 枚举口径（2026-10-04 用户指令，沿 dsh-date-wrapper P0 试点先例）：
 * **起步即全量收入 npm 上六条线（0.1.0/0.1.1/0.1.2/0.1.5/0.1.7/0.2.0）的全部 rc**
 * （2026-10-04 对 @deepseek-ai/dsh 及全部 12 个 peer 子包逐一 npm 实测；0.1.3-alpha.2
 * 与 0.1.6-alpha.1/2 为未成线 alpha，不入列），由本地隔离矩阵逐格验证后**删红留绿**；
 * 矩阵结论落 `.compat-results/`。
 * 升级流程：本数组加版本 → `node scripts/sync-hosts.mjs --write` → 矩阵绿 → 发版。
 *
 * 本数组与由它生成的声明写点（package.json peerDependencies 的 12 个 dsh-* 项 /
 * package.json engines.dsh / 各 README 的 host-compat 管理块）**禁止手改**，
 * 由 sync-hosts.mjs 校验/下发。cordis 与 react 例外（见 cordisRange 注释）。
 */

/** 全部声明支持的宿主 rc（冻结；新增只在此处追加）。 */
export const supportedHosts = Object.freeze([
  // 0.1.0 线（5 个 rc）
  '0.1.0-rc.2',
  '0.1.0-rc.3',
  '0.1.0-rc.6',
  '0.1.0-rc.7',
  '0.1.0-rc.8',
  // 0.1.1 线（2 个 rc）
  '0.1.1-rc.1',
  '0.1.1-rc.2',
  // 0.1.2 线（1 个 rc）
  '0.1.2-rc.1',
  // 0.1.5 线（3 个 rc）
  '0.1.5-rc.1',
  '0.1.5-rc.2',
  '0.1.5-rc.3',
  // 0.1.7 线（2 个 rc）
  '0.1.7-rc.1',
  '0.1.7-rc.2',
  // 0.2.0 线（2 个 rc）
  '0.2.0-rc.1',
  '0.2.0-rc.2',
])

/** peerDependencies / engines.dsh 共用的枚举串（精确枚举无暗坑，INDEX §B）。 */
export const peerRange = supportedHosts.join(' || ')

/** 本地开发与矩阵默认宿主（devDependencies 若引入宿主包一律钉这里）。 */
export const developmentHost = '0.2.0-rc.2'

/**
 * peer 闸指向的宿主子包（本插件消费的全部宿主面：peerDependencies 里的 12 个
 * `@deepseek-ai/dsh-*` 项；`cordis` 与 `react` 不在其中——见各自注释）。
 *
 * 机制事实（2026-10-04 对宿主 app-boot/src/plugin-compatibility.ts 逐行核实，
 * 0.1.7-rc.2 源码）：宿主 peer 闸把**每一个** dsh-* peer 的范围拿去匹配
 * **宿主运行时版本**（semver.satisfies + includePrerelease），既不按包名跳过、
 * 也不按子包自身版本比对——因此若像 arrowkey-nav 那样按“包存在线”拆分范围，
 * 0.1.0/0.1.1 宿主会因 client-store 等项的窄枚举被整体拒载。要覆盖全部 15 rc，
 * 12 项 peer 必须都携带**全量枚举**；“某子包在老线不存在”由矩阵的运行时断言
 * （client inject / 路由探针）裁决，不由声明面预判。
 */
export const hostPeerPackages = Object.freeze([
  '@deepseek-ai/dsh-api-session-controller',
  '@deepseek-ai/dsh-attachment',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-chat',
  '@deepseek-ai/dsh-client-ui-conversation',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-renderer',
  '@deepseek-ai/dsh-client-ui-session',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-tool',
  '@deepseek-ai/dsh-session',
  '@deepseek-ai/dsh-util-workspace-path',
])

/**
 * cordis 的 peer：宿主 0.1.7+ 线依赖 cordis ~4.0.4，更早线锁 ~4.0.2（INDEX §A
 * 铁律），故放宽为 ^4.0.2 横跨两代——cordis 版本不随宿主 rc 逐版发布，不适用
 * 枚举法。react 为上游生态 peer，保持 ^18.2.0 不动。
 */
export const cordisRange = '^4.0.2'
