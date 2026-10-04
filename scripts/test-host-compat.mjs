/**
 * test-host-compat.mjs —— 本地隔离矩阵执行体（improve-dsh-plugins/enum-peer-migration
 * /INDEX.md §E：`_wt` 工作树 + 离线 tgz 的 CI 前身）。
 *
 * 骨架沿 dsh-date-wrapper P0 试点定型版；沙箱加固（传递 dsh-* 全量钉版）与
 * HTTP 探针回读沿 dsh-paste-dock 执行体。每格 = 一个宿主 rc：
 *   1. tgz 缓存（`pnpm pack @deepseek-ai/dsh@<version>` → `.compat-results/host-tgz/`）；
 *   2. 沙箱安装：宿主 tgz + **钉宿主自己的 Cordis 线**（INDEX §A 铁律：cordis 本体 +
 *      group/hmr/include/loader/timer 五件，按宿主线 4.0.2/4.0.4 分档，经
 *      pnpm-workspace.yaml overrides）+ `.pnpmfile.cjs` 把全部传递 `@deepseek-ai/dsh*`
 *      钉到宿主版本（防混装）。pnpm `--ignore-scripts`。
 *   3. 插件 tgz（lib/ 已入库，pack 无需构建）经**宿主 CLI 自建 profile** 装入：
 *      `dsh plugin --profile web add <tgz>` —— peer 闸（app-boot
 *      evaluatePluginCompatibility，逐 dsh-* peer 对宿主运行时版本 semver 匹配）
 *      在这一步咬合，add 日志可判 plugin-blocked。
 *   4. 引导形态协商：A 形 `--profile web --port 0 --no-open`（0.1.0-rc.8+），
 *      老线回退 C 形裸启动（默认端口，可能弹浏览器）。
 *   5. HTTP 探针（带 landing 会话 cookie）：
 *        GET  /tidy-display/skill-status   → 200 + JSON（scanGenerativeMcpappsStatus）
 *        POST /tidy-display/reveal {path:''} → 400 {ok:false,error:'Empty path'}
 *      （空路径探针不弹资源管理器窗口，纯语义验证路由与 handler 挂载）
 *   6. 日志断言：正向签名 `[my-plugins/dsh-tidy-display] loaded`；反向签名
 *      挂载/审计/重名/兼容拦截。
 *
 * 指纹门禁说明：本插件 18 文件哈希基线针对宿主 **monorepo 源码**，npm 发布包只带
 * lib/ 无 src/ ——矩阵格无法从沙箱采集指纹（需逐版本 monorepo 检出，CI 化事项）。
 * 故本执行体以**行为冒烟**为验收（spec §6 口径：指纹回答"宿主改没改"，冒烟回答
 * "插件还能不能用"）。
 *
 * 归因（日志签名）：
 *   - ready + 探针全过 + 无签名            → green
 *   - /requires the Cordis HMR service/    → host-blocked（宿主引导墙，非插件问题）
 *   - /is incompatible with dsh/（add 或 boot）→ plugin-blocked（peer 闸拒入/拒挂）
 *   - 挂载/审计/重名签名                   → plugin-blocked（notes 注明）
 *
 * 产物：`.compat-results/<version>/{install.log, plugin-add.log, boot-<X>.log,
 * result.json}` + 汇总 `results.json` + 绿名单 `verified.json`
 * （sync-hosts.mjs 据此写 README 的 Runtime-verified 行）。沙箱在系统临时目录：
 * 绿格即弃，红/错误格保留（路径见 result.json 的 sandbox 字段，--keep 全留）。
 *
 * 用法：
 *   node scripts/test-host-compat.mjs                     # 全量（hosts.mjs 枚举）
 *   node scripts/test-host-compat.mjs --only 0.2.0-rc.2   # 单格复跑
 *   node scripts/test-host-compat.mjs --keep              # 全部保留 sandbox 便于复查
 *   node scripts/test-host-compat.mjs --force             # 忽略已有结论强制重跑
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { supportedHosts } from './hosts.mjs'

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const RESULTS = path.join(ROOT, '.compat-results')
const MATRIX = path.join(RESULTS, 'matrix')
const TGZ_CACHE = path.join(RESULTS, 'host-tgz')
const WIN32 = process.platform === 'win32'
const PNPM = WIN32 ? 'pnpm.cmd' : 'pnpm'
const NPM = WIN32 ? 'npm.cmd' : 'npm'
const INSTALL_ARGS = ['install', '--ignore-scripts', '--prefer-offline', '--loglevel=error']
const REGISTRY = '--registry=https://registry.npmjs.org/'

/** INDEX §A 铁律：cordis-plugin-* 钉宿主自己的 Cordis 线（映射表与 date-wrapper/paste-dock 执行体一致）。 */
function cordisPin(hostVersion) {
  const [triplet] = hostVersion.split('-')
  const [maj, min, patch] = triplet.split('.').map(Number)
  return [maj, min, patch] >= [0, 1, 7] ? '4.0.4' : '4.0.2'
}
const CORDIS_PLUGIN_PINS = {
  '4.0.2': {
    '@deepseek-ai/cordis-plugin-group': '1.0.2',
    '@deepseek-ai/cordis-plugin-hmr': '1.0.17',
    '@deepseek-ai/cordis-plugin-include': '1.0.7',
    '@deepseek-ai/cordis-plugin-loader': '1.0.3',
    '@deepseek-ai/cordis-plugin-timer': '1.1.4',
  },
  '4.0.4': {
    '@deepseek-ai/cordis-plugin-group': '1.0.4',
    '@deepseek-ai/cordis-plugin-hmr': '1.0.19',
    '@deepseek-ai/cordis-plugin-include': '1.0.9',
    '@deepseek-ai/cordis-plugin-loader': '1.0.5',
    '@deepseek-ai/cordis-plugin-timer': '1.1.6',
  },
}

// pnpm 的通配 override 不保证匹配传递依赖；解析每个包时统一官方版本。
function pinHostDependencies(pkg, version) {
  const pinned = { ...pkg }
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    if (!pkg[field]) continue
    pinned[field] = Object.fromEntries(
      Object.entries(pkg[field]).map(([name, range]) => [
        name,
        name === '@deepseek-ai/dsh' || name.startsWith('@deepseek-ai/dsh-') ? version : range,
      ]),
    )
  }
  return pinned
}

const args = process.argv.slice(2)
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined
const keep = args.includes('--keep')
const force = args.includes('--force')
const bootTimeoutSec = args.includes('--timeout') ? Number(args[args.indexOf('--timeout') + 1]) : 90
const versions = only ? [only] : [...supportedHosts]

/** 顺序跑外部命令，非零退出/超时均带尾巴抛错。（win32 的 pnpm.cmd 必须经 shell 启动） */
function run(cwd, cmd, cmdArgs, label, limitMs = 15 * 60_000, env = process.env) {
  const r = spawnSync(cmd, cmdArgs, { cwd, encoding: 'utf8', shell: WIN32, windowsHide: true, timeout: limitMs, env })
  if (r.error?.code === 'ETIMEDOUT' || r.signal === 'SIGTERM') {
    throw new Error(`${label} 超时（>${Math.round(limitMs / 60_000)}min）`)
  }
  if (r.status !== 0) {
    throw new Error(
      `${label} 失败（exit ${r.status}${r.error ? `，${r.error.code ?? r.error.message}` : ''}）\nstdout: ${(r.stdout ?? '').slice(-600)}\nstderr: ${(r.stderr ?? '').slice(-600)}`,
    )
  }
  return r
}

async function ensureTgz(version) {
  await mkdir(TGZ_CACHE, { recursive: true })
  const dest = path.join(TGZ_CACHE, `deepseek-ai-dsh-${version}.tgz`)
  if (existsSync(dest)) return dest
  console.log(`       pack host ${version}`)
  // npm 而非 pnpm：本仓 pnpm-workspace.yaml 无 packages 字段，pnpm pack 会被
  // workspace 解析绊倒（date-wrapper 无此文件故未踩）；npm pack 不读 workspace。
  await run(TGZ_CACHE, NPM, ['pack', `@deepseek-ai/dsh@${version}`, '--pack-destination', TGZ_CACHE, '--registry=https://registry.npmjs.org/', '--loglevel=error'], `npm pack host ${version}`)
  return dest
}

/** 就绪横幅（宽松：老版本横幅不一定带 dsh 前缀）。 */
const READY_RE = /https?:\/\/(127\.0\.0\.1|localhost):/
const HMR_WALL_RE = /requires the Cordis HMR service/
const COMPAT_BLOCK_RE = /is incompatible with dsh/
const AUDIT_RE = /startup audit|failed to mount|mount error|failed to start/i
const DUP_RE = /already (been )?registered|duplicate|conflict/i
const LOADED_RE = /\[my-plugins\/dsh-tidy-display\] loaded/

/** 无头启动一次，返回 { outcome, log, child }；就绪/退出/超时先到先得。
 * 不在此处杀进程：HTTP 探针要在宿主存活窗口内跑（runCell 探完再 stopHost）。 */
async function bootOnce(binJs, cwd, env, extraArgs, timeoutSec) {
  const child = spawn(process.execPath, [binJs, ...extraArgs], { cwd, env, windowsHide: true })
  let log = ''
  child.stdout.on('data', (d) => { log += d })
  child.stderr.on('data', (d) => { log += d })
  const exited = new Promise((resolve) => child.on('exit', (code) => resolve({ exited: true, code })))
  const timer = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), timeoutSec * 1000))
  const ready = (async () => {
    while (!READY_RE.test(log)) await new Promise((r) => setTimeout(r, 400))
    await new Promise((r) => setTimeout(r, 1200)) // 留给插件挂载/审计日志冲刷
    return { ready: true }
  })()
  const outcome = await Promise.race([exited, timer, ready])
  return { outcome, log, child }
}

/** 杀宿主进程树（win32 用 taskkill /T 连子进程）。 */
async function stopHost(child) {
  if (!child || child.exitCode !== null) return
  if (WIN32) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true })
  else child.kill('SIGKILL')
  await new Promise((r) => setTimeout(r, 300)) // 杀树后给日志冲刷留时间
}

/** HTTP 探针：landing 取会话 cookie，打两条插件路由。返回 { checks, errors }。 */
async function probeRoutes(url) {
  const checks = {}
  const errors = []
  const landing = await fetch(url, { redirect: 'manual' })
  const cookie = landing.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ')
  const headers = cookie ? { cookie } : {}
  try {
    const res = await fetch(new URL('/tidy-display/skill-status', url), {
      headers, signal: AbortSignal.timeout(20_000),
    })
    const text = await res.text()
    checks.skillStatus = res.status === 200
    if (res.status === 200) {
      try { checks.skillStatusJson = typeof JSON.parse(text) === 'object' } catch { checks.skillStatusJson = false }
    } else {
      errors.push(`skill-status ${res.status}: ${text.slice(0, 200)}`)
    }
  } catch (e) {
    checks.skillStatus = false
    errors.push(`skill-status fetch: ${String(e?.message ?? e).slice(0, 200)}`)
  }
  try {
    const res = await fetch(new URL('/tidy-display/reveal', url), {
      method: 'POST', headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ path: '' }), signal: AbortSignal.timeout(20_000),
    })
    const text = await res.text()
    checks.revealEmptyPath = res.status === 400 && /Empty path/.test(text)
    if (!checks.revealEmptyPath) errors.push(`reveal empty-path ${res.status}: ${text.slice(0, 200)}`)
  } catch (e) {
    checks.revealEmptyPath = false
    errors.push(`reveal fetch: ${String(e?.message ?? e).slice(0, 200)}`)
  }
  return { checks, errors }
}

async function runCell(version) {
  // 沙箱放系统临时目录（paste-dock 布局），证据目录留在仓内 .compat-results/。
  // 教训（2026-10-04 首跑实证）：沙箱嵌在仓内时，corepack pnpm 垫片按 cwd 向上
  // 走查 packageManager pin 解析到 pnpm 9.x，宿主 CLI 的内部 `pnpm add` 在
  // profile workspace 根触发 ERR_PNPM_ADDING_TO_ROOT；TEMP 下无 pin → corepack
  // 默认 pnpm 12.x，与 paste-dock 全绿矩阵一致。
  const cell = path.join(MATRIX, version)
  await mkdir(cell, { recursive: true })
  const sandboxRoot = await mkdtemp(path.join(tmpdir(), `dsh-tidy-display-compat-${version}-`))
  const sandbox = path.join(sandboxRoot, 'sandbox')
  const homeDir = path.join(sandbox, 'home')
  const userProfile = path.join(sandbox, 'user')
  const workspace = path.join(sandbox, 'workspace')
  for (const dir of [sandbox, userProfile, workspace]) await mkdir(dir, { recursive: true })
  const env = { ...process.env, DSH_HOME: homeDir, USERPROFILE: userProfile }
  const checks = { version, notes: [], sandbox }

  // 1-2. 宿主 tgz + 钉线安装（overrides 钉 cordis 五件套；pnpmfile 钉全部传递 dsh-*）
  const hostTgz = await ensureTgz(version)
  const cordis = cordisPin(version)
  if (!existsSync(path.join(sandbox, 'node_modules', '@deepseek-ai', 'dsh', 'package.json'))) {
    await writeFile(path.join(sandbox, 'package.json'), JSON.stringify({
      name: 'dsh-host-cell',
      private: true,
      dependencies: { '@deepseek-ai/dsh': pathToFileURL(hostTgz).href },
    }, null, 2))
    await writeFile(path.join(sandbox, 'pnpm-workspace.yaml'), `packages:\n  - .\nautoInstallPeers: true\nstrictPeerDependencies: false\noverrides:\n${Object.entries({ '@deepseek-ai/cordis': cordis, ...CORDIS_PLUGIN_PINS[cordis] }).map(([n, v]) => `  '${n}': '${v}'`).join('\n')}\n`)
    await writeFile(path.join(sandbox, '.pnpmfile.cjs'), `const pinHostDependencies = ${pinHostDependencies.toString()};\nmodule.exports = { hooks: { readPackage: (pkg) => pinHostDependencies(pkg, ${JSON.stringify(version)}) } };\n`, 'utf8')
    console.log(`       install host ${version}（cordis 线 ${cordis}）…`)
    const installLog = run(sandbox, PNPM, INSTALL_ARGS, `install host ${version}`)
    await writeFile(path.join(cell, 'install.log'), installLog.stdout ?? '')
  }
  checks.hostInstalled = JSON.parse(await readFile(path.join(sandbox, 'node_modules', '@deepseek-ai', 'dsh', 'package.json'), 'utf8')).version === version
  if (!checks.hostInstalled) throw new Error(`宿主安装版本与格子不符: ${version}`)
  const binJs = path.join(sandbox, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')

  // 3. 打插件包（lib 已入库，pack 无构建；npm pack 理由同 ensureTgz）→ 宿主 CLI 自建 profile 并装入（peer 闸咬合）
  await run(ROOT, NPM, ['pack', '--pack-destination', cell, '--loglevel=error'], 'npm pack plugin')
  const packed = (await readdir(cell)).find((f) => /^dsh-tidy-display-.*\.tgz$/.test(f))
  if (!packed) throw new Error('插件 tgz 打包失败')
  const pluginTgz = path.join(cell, packed)
  const addRun = spawnSync(process.execPath, [binJs, 'plugin', '--profile', 'web', 'add', pluginTgz, REGISTRY], {
    cwd: sandbox, encoding: 'utf8', shell: false, windowsHide: true, timeout: 10 * 60_000, env,
  })
  const addLog = `${addRun.stdout ?? ''}${addRun.stderr ?? ''}`
  await writeFile(path.join(cell, 'plugin-add.log'), addLog)
  checks.pluginAdded = addRun.status === 0
  if (!checks.pluginAdded) {
    if (COMPAT_BLOCK_RE.test(addLog)) {
      checks.verdict = 'plugin-blocked'
      checks.notes.push('plugin add 阶段 peer 闸拒绝')
      await writeResult(cell, checks)
      return checks
    }
    throw new Error(`dsh plugin add 失败（exit ${addRun.status}）\n${addLog.slice(-600)}`)
  }

  // 4. 引导形态协商：A 形（--port 0 --no-open，0.1.0-rc.8+）→ C 形（裸启动）
  const shapes = [
    ['A', ['--profile', 'web', '--port', '0', '--no-open']],
    ['C', ['--profile', 'web']],
  ]
  let last = { outcome: {}, log: '', child: undefined }
  let shapeUsed
  for (const [shape, extra] of shapes) {
    last = await bootOnce(binJs, workspace, env, extra, bootTimeoutSec)
    shapeUsed = shape
    await writeFile(path.join(cell, `boot-${shape}.log`), last.log)
    if (last.outcome.ready || HMR_WALL_RE.test(last.log) || COMPAT_BLOCK_RE.test(last.log)) break
    await stopHost(last.child)
    if (shape === 'C') break
    checks.notes.push(`A 形旗标不被 ${version} 接受，回退 C 形`)
  }
  const bootLog = last.log

  // 5. 归因（日志签名）
  checks.booted = Boolean(last.outcome.ready)
  checks.bootShape = shapeUsed
  if (!checks.booted) {
    await stopHost(last.child)
    if (HMR_WALL_RE.test(bootLog)) {
      checks.verdict = 'host-blocked'
      checks.notes.push('宿主 hmr 引导墙（date-wrapper 基座对照亦然）——宿主侧问题，非插件不兼容')
    } else if (COMPAT_BLOCK_RE.test(bootLog)) {
      checks.verdict = 'plugin-blocked'
      checks.notes.push('boot 阶段 peer 闸拦截')
    } else {
      checks.verdict = 'plugin-blocked'
      checks.notes.push(`未就绪且无已知签名（${last.outcome.exited ? `exit ${last.outcome.code}` : '超时'}），见 boot 日志`)
    }
    await writeResult(cell, checks)
    return checks
  }
  checks.noMountError = !AUDIT_RE.test(bootLog)
  checks.noDupContext = !bootLog.split('\n').some((line) => /tidy-display/.test(line) && DUP_RE.test(line))
  checks.noCompatBlock = !COMPAT_BLOCK_RE.test(bootLog)
  checks.loadedLogPresent = LOADED_RE.test(bootLog)
  if (!checks.noMountError) checks.notes.push('挂载/审计错误签名')
  if (!checks.noDupContext) checks.notes.push('疑似重名注册签名')
  if (!checks.loadedLogPresent) checks.notes.push('宿主日志无插件 apply 正向签名（inject 未满足或挂载失活）')

  // 6. HTTP 探针（宿主存活窗口内：就绪 URL 从横幅取；--port 0 时是随机端口真实地址）
  try {
    const match = bootLog.match(/http:\/\/(?:127\.0\.0\.1|localhost):\d+/)
    if (!match) {
      checks.routesProbed = false
      checks.notes.push('横幅无可解析 URL，路由探针跳过')
    } else {
      const { checks: routeChecks, errors } = await probeRoutes(match[0])
      Object.assign(checks, routeChecks)
      checks.routesProbed = true
      if (errors.length) checks.notes.push(...errors)
    }
  } finally {
    await stopHost(last.child)
  }

  checks.green =
    checks.noMountError && checks.noDupContext && checks.noCompatBlock && checks.loadedLogPresent &&
    checks.skillStatus === true && checks.revealEmptyPath === true
  checks.verdict = checks.green ? 'green' : 'plugin-blocked'
  await writeResult(cell, checks)
  return checks
}

async function writeResult(cell, checks) {
  await writeFile(path.join(cell, 'result.json'), JSON.stringify(checks, null, 2) + '\n')
}

// ── 主流程 ───────────────────────────────────────────────────────────────────
await mkdir(MATRIX, { recursive: true })
const results = []
for (const version of versions) {
  const cellResult = path.join(MATRIX, version, 'result.json')
  if (!force && existsSync(cellResult)) {
    const prev = JSON.parse(await readFile(cellResult, 'utf8'))
    if (prev.green || prev.verdict === 'host-blocked') {
      console.log(`skip   ${version}（已有结论 ${prev.verdict}，--force 重跑）`)
      results.push(prev)
      continue
    }
  }
  process.stdout.write(`cell   ${version} … `)
  try {
    const checks = await runCell(version)
    console.log(`${checks.verdict.toUpperCase()}${checks.notes.length ? `（${checks.notes.join('；')}）` : ''}`)
    results.push(checks)
  } catch (error) {
    console.log('ERROR')
    const checks = { version, verdict: 'error', green: false, error: String(error.message ?? error) }
    results.push(checks)
    await mkdir(path.join(MATRIX, version), { recursive: true })
    await writeResult(path.join(MATRIX, version), checks)
  }
  // 绿格即弃沙箱；红/错误格保留 TEMP 沙箱供复查（路径在 result.json 的 sandbox 字段）
  const last = results.at(-1)
  if (last?.green && last.sandbox && !keep) {
    await rm(path.dirname(last.sandbox), { recursive: true, force: true, maxRetries: 3, retryDelay: 500 }).catch(() => {})
  }
}

const verified = results.filter((r) => r.green).map((r) => r.version)
const pluginBlocked = results.filter((r) => r.verdict === 'plugin-blocked').map((r) => r.version)
const hostBlocked = results.filter((r) => r.verdict === 'host-blocked').map((r) => r.version)
await writeFile(path.join(RESULTS, 'results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2) + '\n')
await writeFile(path.join(RESULTS, 'verified.json'), JSON.stringify({ generatedAt: new Date().toISOString(), verified, pluginBlocked, hostBlocked }, null, 2) + '\n')
console.log(`\n绿 ${verified.length}/${results.length}: ${verified.join(', ') || '（无）'}`)
if (pluginBlocked.length) console.log(`插件不兼容 ${pluginBlocked.length}: ${pluginBlocked.join(', ')}`)
if (hostBlocked.length) console.log(`宿主阻塞（不可判定）${hostBlocked.length}: ${hostBlocked.join(', ')}`)
if (!only) console.log('下一步：node scripts/sync-hosts.mjs --write  # 把 verified 清单下发七语 README')
