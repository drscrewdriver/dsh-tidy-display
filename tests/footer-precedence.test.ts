import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(resolve(root, 'src/client/Reader.module.css'), 'utf8');
const bundle = readFileSync(resolve(root, 'lib/client.js'), 'utf8');

/**
 * Host ConversationRoot owns the footer band: `.composerSeat` is `position:
 * sticky; bottom: 0; z-index: 7`, its own markdown code banner is 6 and the
 * floating controls are 8. A scrolling reader clamps every turn-level sticky
 * lane down into that band (the lane stops at its containing block's bottom,
 * which passes behind the input card), so a lane at 7 or above paints the
 * reader's own opaque plate over the composer. Everything the reader pins
 * inside the transcript therefore has to stay strictly below 7.
 */
const HOST_FOOTER_Z = 7;

/** Lanes a scroll can clamp into the footer band. */
const CLAMPED_LANES = [
  '.turnProcessSticky',
  '.liveFoldContainer',
  '.flowCell[data-flow-summary]',
  '.closedProcessSummary',
];

/** The one lane allowed at 7: it pins to the scrollport's first lane and can never reach the band. */
const TOP_LANE = '.toolbar';

function mergedDeclarations(source: string, selector: string, { hashed = false } = {}): Map<string, string> {
  const declarations = new Map<string, string>();
  const body = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const rule = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = rule.exec(body)) !== null) {
    const selectors = match[1]!.split(',').map(part => part.trim());
    const wanted = hashed
      ? selectors.some(part => part.endsWith(selector) || part.endsWith(selector.replace(/^\./, '')))
      : selectors.includes(selector);
    if (!wanted) continue;
    for (const declaration of match[2]!.split(';')) {
      const separator = declaration.indexOf(':');
      if (separator < 0) continue;
      const property = declaration.slice(0, separator).trim();
      const value = declaration.slice(separator + 1).trim();
      if (property) declarations.set(property, value);
    }
  }
  return declarations;
}

/** Minified CSS inside the committed bundle keeps the hashed prefix on each class. */
function bundledDeclarations(className: string): Map<string, string> {
  const declarations = new Map<string, string>();
  const rule = new RegExp(`(?:^|[.,}])[.#]?[\\w-]*${className}\\{([^{}]*)\\}`, 'g');
  let match: RegExpExecArray | null;
  while ((match = rule.exec(bundle)) !== null) {
    for (const declaration of match[1]!.split(';')) {
      const separator = declaration.indexOf(':');
      if (separator < 0) continue;
      declarations.set(declaration.slice(0, separator).trim(), declaration.slice(separator + 1).trim());
    }
  }
  return declarations;
}

/** Turn-level rows are content: they scroll with the transcript and never pin. */
const FLOW_ROWS = ['.turnProcessSticky', '.flowCell[data-flow-summary]', '.closedProcessSummary'];

test('turn-level rows scroll in flow — only the toolbar lane may pin', () => {
  for (const lane of FLOW_ROWS) {
    const declarations = mergedDeclarations(css, lane);
    const position = declarations.get('position');
    assert.ok(
      position !== 'sticky' && position !== 'fixed',
      `${lane} must scroll with the transcript, not pin (got position: ${position})`,
    );
    assert.equal(declarations.get('top'), undefined, `${lane} must not declare a pin offset`);
  }
});

test('clamped reader lanes stay strictly below the host footer band', () => {
  for (const lane of CLAMPED_LANES) {
    const declarations = mergedDeclarations(css, lane);
    const zIndex = declarations.get('z-index');
    if (zIndex === undefined) continue; // flow rows no longer declare a lane z-index
    assert.ok(
      Number(zIndex) < HOST_FOOTER_Z,
      `${lane} must stay below the host composer seat (z-index ${HOST_FOOTER_Z}), got ${zIndex}`,
    );
  }
});

test('the top toolbar lane stays at 7 and pins to the scrollport top', () => {
  const declarations = mergedDeclarations(css, TOP_LANE);
  assert.equal(declarations.get('z-index'), String(HOST_FOOTER_Z));
  assert.equal(declarations.get('top'), '0');
});

test('the live status row and the closed summary row do not pin', () => {
  for (const lane of FLOW_ROWS) {
    assert.notEqual(mergedDeclarations(css, lane).get('position'), 'sticky', `${lane} must not be sticky`);
  }
});

test('skin mode does not reintroduce a lane above the footer band', () => {
  for (const lane of CLAMPED_LANES) {
    const zIndex = mergedDeclarations(css, `.root[data-reader-glass] ${lane}`).get('z-index');
    if (zIndex === undefined || zIndex === 'auto') continue;
    assert.ok(
      Number(zIndex) < HOST_FOOTER_Z,
      `glass override for ${lane} must not lift above ${HOST_FOOTER_Z}, got ${zIndex}`,
    );
  }
  assert.equal(
    mergedDeclarations(css, '.root[data-reader-glass] .toolbar').get('z-index'),
    undefined,
    'the toolbar keeps its single ladder value in both modes',
  );
});

test('the committed client bundle carries the same lane ladder', () => {
  const statusRow = bundledDeclarations('turnProcessSticky');
  assert.notEqual(statusRow.get('position'), 'sticky', 'turnProcessSticky must not pin in lib/client.js either');
  const liveFold = bundledDeclarations('liveFoldContainer');
  assert.ok(liveFold.get('z-index'), 'liveFoldContainer is present in the built bundle');
  assert.ok(
    Number(liveFold.get('z-index')) < HOST_FOOTER_Z,
    `liveFoldContainer in lib/client.js must stay below ${HOST_FOOTER_Z}, got ${liveFold.get('z-index')}`,
  );
  assert.equal(bundledDeclarations('toolbar').get('z-index'), String(HOST_FOOTER_Z));
});
