/** Real Reader interaction regression, isolated from the user's Host and data. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const harness = process.env.DSHX_HARNESS;
if (!harness) throw new Error('Set DSHX_HARNESS to the target checkout.');
const require = createRequire(join(root, 'package.json'));
const webRequire = createRequire(join(harness, 'packages/client/web/package.json'));
const { build } = await import(pathToFileURL(createRequire(require.resolve('tsx')).resolve('esbuild')).href);
const { launchPinnedChromium } = await import(pathToFileURL(join(homedir(), '.codex/playwright-runtime/runtime.mjs')).href);
const out = join(root, '.evidence/auto-fold');
await mkdir(out, { recursive: true });
await build({
  entryPoints: [join(root, 'tests/browser-auto-fold.tsx')], outfile: join(out, 'fixture.js'),
  bundle: true, platform: 'browser', format: 'esm', jsx: 'automatic',
  alias: {
    '@deepseek-ai/dsh-client-ui-primitives': join(harness, 'packages/client/ui-primitives/src/index.ts'),
    react: dirname(require.resolve('react/package.json')), 'react-dom': dirname(webRequire.resolve('react-dom/package.json')),
  },
  loader: { '.woff2': 'dataurl', '.woff': 'dataurl', '.ttf': 'dataurl', '.svg': 'dataurl' },
});
const server = createServer(async (req, res) => {
  const file = req.url === '/fixture.js' ? 'fixture.js' : req.url === '/fixture.css' ? 'fixture.css' : null;
  if (file) { res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'text/css'); res.end(await readFile(join(out, file))); return; }
  if (req.url !== '/') { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', 'text/html');
  res.end('<!doctype html><html lang="zh"><meta charset="utf-8"><link rel="stylesheet" href="/fixture.css"><style>body{margin:0;font:14px/1.6 system-ui;--dsw-alias-label-primary:#222;--dsw-alias-label-secondary:#666;--dsw-alias-label-tertiary:#888;--dsw-alias-bg-base:#fff;--dsw-alias-border-l2:#ddd}button{cursor:pointer}</style><div id="app"></div><script type="module" src="/fixture.js"></script></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
const results = [];
try {
  browser = await launchPinnedChromium();
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, reducedMotion });
    page.setDefaultTimeout(4000);
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const closed = page.locator('[data-reader-turn="1"]');
    const live = page.locator('[data-reader-turn="2"]');
    const completedThought = closed.getByText('已完成思考 0', { exact: true });
    const oldLiveThought = live.getByText('进行中思考 0', { exact: true });
    const latestThought = live.getByText('进行中思考 1', { exact: true });
    const toggle = () => page.getByRole('button', { name: /^自动折叠[开关]$/ }).click();
    await page.getByRole('button', { name: '自动折叠开', exact: true }).waitFor();
    await latestThought.waitFor();
    assert.equal(await completedThought.count(), 0);

    // Reading while auto-fold is off used to persist a manual expansion forever.
    await toggle();
    await completedThought.click();
    assert.ok(Object.values(await page.evaluate(() => window.autoFoldFixture.state().expanded)).includes(true));
    await toggle();
    await completedThought.waitFor({ state: 'hidden' });
    await latestThought.waitFor();
    await closed.getByText('最终回答始终保留', { exact: true }).waitFor();

    // A prior-steps disclosure has its own state, separate from the store.
    await live.getByRole('button', { name: '展开此前步骤', exact: true }).click();
    await oldLiveThought.waitFor();
    await toggle();
    await toggle();
    await oldLiveThought.waitFor({ state: 'hidden' });
    await latestThought.waitFor();

    // Fresh manual choices still work after automatic folding is restored.
    await closed.getByRole('button', { name: '展开思考与过程', exact: true }).click();
    await completedThought.waitFor();
    await page.evaluate(() => window.autoFoldFixture.preference(false));
    await page.getByRole('button', { name: '自动折叠关', exact: true }).waitFor();
    await page.evaluate(() => window.autoFoldFixture.preference(true));
    await completedThought.waitFor({ state: 'hidden' });

    // Active text selection still protects reading until the user clears it.
    await toggle();
    await completedThought.evaluate(async element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      document.getSelection().removeAllRanges();
      document.getSelection().addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
      await new Promise(requestAnimationFrame);
    });
    await page.evaluate(() => window.autoFoldFixture.preference(true));
    await page.getByRole('button', { name: '自动折叠开', exact: true }).waitFor();
    await closed.getByRole('button', { name: '收起思考与过程', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.getSelection().toString()), '已完成思考 0');
    await page.evaluate(() => document.getSelection().removeAllRanges());
    await completedThought.waitFor({ state: 'hidden' });

    // Rapid reversal must settle with automatic folding enabled.
    for (let i = 0; i < 6; i++) await toggle();
    await completedThought.waitFor({ state: 'hidden' });
    await oldLiveThought.waitFor({ state: 'hidden' });
    await latestThought.waitFor();
    assert.deepEqual(errors, []);
    assert.equal(await page.getByText('此内容暂时无法展示', { exact: false }).count(), 0);
    await page.screenshot({ path: join(out, `${reducedMotion}.png`) });
    results.push({ reducedMotion, passed: true, paths: ['read-while-off', 'prior-steps-override', 'new-manual-choice', 'settings-toggle', 'active-selection', 'rapid-reversal', 'latest-and-final-content'] });
    await page.close();
  }
  await writeFile(join(out, 'result.json'), JSON.stringify({ passed: true, results }, null, 2));
  console.log(JSON.stringify({ passed: true, results }));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
