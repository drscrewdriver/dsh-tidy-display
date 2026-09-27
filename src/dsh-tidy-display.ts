import { spawn } from 'node:child_process';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Context } from '@deepseek-ai/cordis';
import { scanGenerativeMcpappsStatus } from './skill-roots.js';
import { skillsFromListResult, toPublicSkillStatus } from './skill-status.js';

declare module '@deepseek-ai/cordis' {
  interface Context {
    webServer?: {
      register: (route: {
        kind: 'exact' | 'prefix';
        path: string;
        handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
      }) => () => void;
    };
  }
}

// Module id must equal the profile entry id (the scoped package name), or the
// host cannot mount the client bundle and the whole plugin silently fails to
// activate — the fork.4 regression this constant pins down.
export const name = '@drscrewdriver/dsh-tidy-display';
export const inject = ['webServer'];

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

export function apply(ctx: Context): void {
  console.log('[my-plugins/dsh-tidy-display] loaded');

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
      return () => {
        disposeReveal();
        disposeSkill();
      };
    }, 'dsh-tidy-display: reveal and skill-status routes');
  }
}
