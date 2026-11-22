import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Context } from '@deepseek-ai/cordis';
import { scanGenerativeMcpappsStatus } from './skill-roots.js';
import { skillsFromListResult, toPublicSkillStatus } from './skill-status.js';
import { buildSegmentTeaching, PROTOCOL_DEFAULTS, type ProtocolSwitches } from './protocol-teaching.js';

export { Config, READER_CONFIG_FIELDS } from './config.js';
export type { ReaderConfig, ReaderConfigField } from './config.js';

declare module '@deepseek-ai/cordis' {
  interface Context {
    webServer?: {
      register: (route: {
        kind: 'exact' | 'prefix';
        path: string;
        handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
      }) => () => void;
    };
    systemPrompt?: {
      section: (options: {
        name: string;
        order?: number;
        text: string | (() => string);
      }) => () => void;
      getSectionOrder?: (key: string) => number | undefined;
    };
  }
}

// Module id must equal the npm package name (the id the host mounts the
// client bundle under), or the host cannot mount the client bundle and the
// whole plugin silently fails to activate — the fork.4 regression this
// constant pins down.
export const name = 'dsh-tidy-display';
// systemPrompt 在全部支持宿主线上可用(raw-html-v2 以同款 inject 在 21 格
// farm 矩阵实测);声明为硬依赖与 dsh 生态惯例一致。
export const inject = ['webServer', 'systemPrompt'];

function writeJson(res: ServerResponse, status: number, body: unknown): void {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

function skillLister(ctx: Context): (() => Promise<readonly { readonly name?: string }[] | undefined>) | undefined {
  const skills = ctx.get?.('skills') as { list?: (options?: object) => Promise<unknown> } | undefined;
  if (typeof skills?.list !== 'function') return undefined;
  return async () => skillsFromListResult(await skills.list!({}));
}

// ---- 协议教学状态(dock 面板 → POST /tidy-display/protocol-state 持久化) ----

const PROTOCOL_STATE_FILE = join(
  process.env.DSH_HOME || join(process.env.HOME || process.env.USERPROFILE || '', '.dsh'),
  'dsh-tidy-display-protocol.json',
);

async function loadProtocolSwitches(): Promise<ProtocolSwitches> {
  try {
    const raw = await fs.readFile(PROTOCOL_STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ProtocolSwitches>;
    return {
      dshUi: parsed.dshUi !== false,
      vcp: parsed.vcp !== false,
    };
  } catch {
    return { ...PROTOCOL_DEFAULTS };
  }
}

async function persistProtocolSwitches(switches: ProtocolSwitches): Promise<void> {
  await fs.mkdir(dirname(PROTOCOL_STATE_FILE), { recursive: true });
  await fs.writeFile(
    PROTOCOL_STATE_FILE,
    JSON.stringify({ ...switches, updatedAt: new Date().toISOString() }, null, 2) + '\n',
    'utf8',
  );
}

// ---- 静态资产路由(MIME 白名单 + 防穿越 + 缓存头;坑:(kind,path) 重复注册抛错) ----

const VENDOR_MIME: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
};

/** 剥路由前缀并防穿越;非法请求返回 null。 */
function resolveStaticRequest(url: string | undefined, prefix: string, root: string): string | null {
  const path = (url ?? '').split('?')[0] ?? '';
  if (!path.startsWith(prefix + '/')) return null;
  let rel: string;
  try {
    rel = decodeURIComponent(path.slice(prefix.length + 1));
  } catch {
    return null;
  }
  if (!rel || rel.includes('..') || rel.includes('/') || rel.includes('\\')) return null;
  const file = resolve(root, rel);
  if (!file.startsWith(root + sep) && file !== root) return null;
  return file;
}

async function serveStatic(req: IncomingMessage, res: ServerResponse, prefix: string, root: string): Promise<boolean> {
  const file = resolveStaticRequest(req.url, prefix, root);
  if (!file) return false;
  const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
  const mime = VENDOR_MIME[ext];
  if (!mime || !existsSync(file)) {
    res.statusCode = ext && VENDOR_MIME[ext] ? 404 : 403;
    res.end();
    return true;
  }
  const body = await fs.readFile(file);
  // 引擎文件内容稳定:短缓存 + ETag 重验证(长度指纹,够用于单文件资产)
  const etag = `"${body.length.toString(16)}"`;
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('ETag', etag);
  if (req.headers['if-none-match'] === etag) {
    res.statusCode = 304;
    res.end();
    return true;
  }
  res.statusCode = 200;
  res.end(body);
  return true;
}

/** 本插件 assets/vendor 目录(引擎等自携资产)。 */
function ownVendorRoot(): string {
  // 构建产物 lib/dsh-tidy-display.js → 包根/assets/vendor;src 直挂时 src/../assets/vendor 同样成立
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'vendor');
}

/** genui 懒引擎资产目录(<pkg>/lib/assets,经依赖解析定位)。找不到返回 null。 */
function genuiAssetsRoot(): string | null {
  try {
    const require = createRequire(import.meta.url);
    const pkgJson = require.resolve('@changfenhuang/dsh-genui/package.json');
    const root = resolve(dirname(pkgJson), 'lib', 'assets');
    return existsSync(root) ? root : null;
  } catch {
    return null;
  }
}

export function apply(ctx: Context): void {
  console.log('[my-plugins/dsh-tidy-display] loaded');

  const systemPrompt = ctx.get?.('systemPrompt') as Context['systemPrompt'];
  // 教学缓存刷新器:POST /protocol-state 落盘后调用,下一回合 text() 读新状态。
  let refreshTeaching: (() => void) | undefined;
  if (systemPrompt && typeof systemPrompt.section === 'function') {
    // 统一协议教学:替代 raw-html-v2 与 genui 各自注入的两套(部分矛盾的)教学。
    // text() 按协议开关动态拼装(下一回合生效);order 沿宿主结构化输出槽位。
    let cachedSwitches: ProtocolSwitches | null = null;
    void loadProtocolSwitches().then((s) => { cachedSwitches = s; }).catch(() => {});
    const order = typeof systemPrompt.getSectionOrder === 'function'
      ? (systemPrompt.getSectionOrder('STRUCTURED_OUTPUT') ?? 200)
      : 200;
    ctx.effect(() => {
      const dispose = systemPrompt.section({
        name: 'dsh-tidy-display:segments',
        order,
        text: () => buildSegmentTeaching(cachedSwitches ?? { ...PROTOCOL_DEFAULTS }),
      });
      refreshTeaching = () => {
        void loadProtocolSwitches().then((s) => { cachedSwitches = s; }).catch(() => {});
      };
      return dispose;
    }, 'dsh-tidy-display: segment protocol teaching section');
  }

  if (ctx.webServer) {
    ctx.effect(() => {
      const disposeReveal = ctx.webServer!.register({
        kind: 'exact',
        path: '/tidy-display/reveal',
        handler: async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end();
            return;
          }
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const targetPath = typeof data.path === 'string' ? data.path.trim() : '';
              if (!targetPath) {
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: 'Empty path' }));
                return;
              }

              if (process.platform === 'darwin') {
                // Exact file reveal in macOS Finder with selection highlight
                spawn('open', ['-R', targetPath], { detached: true, stdio: 'ignore' });
              } else if (process.platform === 'win32') {
                // Exact file selection in Windows Explorer
                spawn('explorer.exe', [`/select,${targetPath}`], { detached: true, stdio: 'ignore' });
              } else {
                spawn('xdg-open', [targetPath], { detached: true, stdio: 'ignore' });
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: String(err) }));
            }
          });
        },
      });
      const disposeSkill = ctx.webServer!.register({
        kind: 'exact',
        path: '/tidy-display/skill-status',
        handler: async (req, res) => {
          if (req.method !== 'GET') {
            res.statusCode = 405;
            res.end();
            return;
          }
          try {
            const url = new URL(req.url ?? '', 'http://127.0.0.1');
            const cwd = url.searchParams.get('cwd') ?? undefined;
            const status = await scanGenerativeMcpappsStatus({
              cwd,
              listSkills: skillLister(ctx),
            });
            writeJson(res, 200, toPublicSkillStatus(status));
          } catch (err) {
            writeJson(res, 500, { ok: false, error: String(err) });
          }
        },
      });

      // 协议开关状态(教学端):GET 读 / POST 写并刷新教学缓存
      const disposeProtocol = ctx.webServer!.register({
        kind: 'exact',
        path: '/tidy-display/protocol-state',
        handler: async (req, res) => {
          if (req.method === 'GET') {
            writeJson(res, 200, { ok: true, ...(await loadProtocolSwitches()) });
            return;
          }
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end();
            return;
          }
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body) as Partial<ProtocolSwitches>;
              const next: ProtocolSwitches = {
                dshUi: data.dshUi !== false,
                vcp: data.vcp !== false,
              };
              await persistProtocolSwitches(next);
              refreshTeaching?.();
              writeJson(res, 200, { ok: true, ...next });
            } catch (err) {
              writeJson(res, 400, { ok: false, error: String(err) });
            }
          });
        },
      });

      // 引擎等自携静态资产(单文件名,防穿越)
      const vendorRoot = ownVendorRoot();
      const disposeVendor = ctx.webServer!.register({
        kind: 'prefix',
        path: '/tidy-display/vendor',
        handler: async (req, res) => {
          await serveStatic(req, res, '/tidy-display/vendor', vendorRoot);
        },
      });

      // genui 懒引擎资产(echarts/mermaid/three/maplibre IIFE);依赖缺失时
      // 注册空路由保持 (kind,path) 名位,请求一律 404(客户端走 fallback)。
      const genuiRoot = genuiAssetsRoot();
      const disposeGenui = ctx.webServer!.register({
        kind: 'prefix',
        path: '/tidy-display/assets/genui',
        handler: async (req, res) => {
          if (!genuiRoot) {
            res.statusCode = 404;
            res.end();
            return;
          }
          await serveStatic(req, res, '/tidy-display/assets/genui', genuiRoot);
        },
      });

      return () => {
        disposeReveal();
        disposeSkill();
        disposeProtocol();
        disposeVendor();
        disposeGenui();
      };
    }, 'dsh-tidy-display: reveal, skill-status, protocol-state and static routes');
  }
}
