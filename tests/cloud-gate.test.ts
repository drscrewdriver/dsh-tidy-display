import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accessSync, constants, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('cloud hard-gate files are committed and ban other models / computer use', () => {
  const hooks = JSON.parse(readFileSync(resolve(root, '.cursor/hooks.json'), 'utf8')) as {
    hooks: { subagentStart: { command: string }[] };
  };
  assert.equal(hooks.hooks.subagentStart[0]?.command, '.cursor/hooks/block-other-models.sh');

  const script = resolve(root, '.cursor/hooks/block-other-models.sh');
  accessSync(script, constants.X_OK);
  const hook = readFileSync(script, 'utf8');
  assert.match(hook, /computeruse|computerUse/);
  assert.match(hook, /browser/);
  assert.match(hook, /claude|sonnet|opus/);

  const worker = readFileSync(resolve(root, '.cursor/agents/worker.md'), 'utf8');
  assert.match(worker, /model: inherit/);
  assert.match(worker, /force-default-model: true/);

  const cloud = readFileSync(resolve(root, '.cursor/CLOUD.md'), 'utf8');
  assert.match(cloud, /Only use Grok 4\.6/);
  assert.match(cloud, /Never Claude, Sonnet, Opus, GPT, or Gemini/);
  assert.match(cloud, /model: inherit/);
  assert.match(cloud, /Do not spawn the Task tool, computerUse, or browser/);
  assert.match(cloud, /Composer is the only fallback/);
  assert.match(cloud, /Do not pass a `model` argument/);
  assert.match(cloud, /Prefer Grok or Composer only/);
});
