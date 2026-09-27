import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flowTop, landTurn, READING_LINE_OFFSET_PX, scrollerOf } from '../src/client/conversation-scroll.ts';

interface FakeBox {
  top: number;
  scrollTop: number;
  closest: (selector: string) => FakeBox | null;
  getBoundingClientRect: () => { top: number };
}

function box(top: number, extra: Partial<FakeBox> = {}): FakeBox {
  const node: FakeBox = {
    top,
    scrollTop: 0,
    closest: () => null,
    getBoundingClientRect: () => ({ top: node.top }),
    ...extra,
  };
  return node;
}

test('scrollerOf prefers the conversation scroll host over the reader root', () => {
  const host = box(40);
  const root = box(80, { closest: selector => selector === '[data-conversation-scroll]' ? host : null });
  assert.equal(scrollerOf(root as unknown as HTMLElement), host as unknown as HTMLElement);
});

test('scrollerOf falls back to the reader root when no host exists', () => {
  const root = box(0);
  assert.equal(scrollerOf(root as unknown as HTMLElement), root as unknown as HTMLElement);
});

test('landTurn writes only scrollport.scrollTop using the official reading-line offset', () => {
  const scrollport = box(100, { scrollTop: 50 });
  const row = box(300);
  landTurn(row as unknown as HTMLElement, scrollport as unknown as HTMLElement);
  assert.equal(flowTop(row as unknown as HTMLElement, scrollport as unknown as HTMLElement), 200);
  assert.equal(scrollport.scrollTop, 50 + 200 - READING_LINE_OFFSET_PX);
});

test('landTurn to the last row clamps naturally via the caller scrollport assignment', () => {
  const scrollport = box(0, { scrollTop: 900 });
  const row = box(40);
  landTurn(row as unknown as HTMLElement, scrollport as unknown as HTMLElement);
  assert.equal(scrollport.scrollTop, 900 + 40 - READING_LINE_OFFSET_PX);
});
