// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { expect, test } from 'vitest';
import { createChromeHarness } from './chrome-harness.js';

test('bounded Chrome harness drain reports reentrant deliveries', () => {
  // The supervisor stays finite even when the implementation under test spins
  // synchronously. A child timeout is a failing assertion, never success.
  const source = `import {createChromeHarness} from ${JSON.stringify(new URL('./chrome-harness.js', import.meta.url).href)};
    const h=createChromeHarness();
    const again=()=>h.chrome.storage.local.get({enabled:true},again);
    again();
    try { h.flush(); } catch (error) {
      if (error.message === 'Chrome harness delivery limit exceeded') process.exit(0);
      throw error;
    }
    process.exit(2);`;
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    encoding: 'utf8', timeout: 2000, maxBuffer: 65536,
  });
  expect(run.status, '[harness:bounded-drain]').toBe(0);
  expect(run.signal).toBe(null);
  expect(run.error).toBeUndefined();
});

test('finite Chrome delivery generations retain FIFO order', () => {
  const h = createChromeHarness();
  const seen = [];
  h.chrome.storage.local.get({ enabled: true }, () => {
    seen.push('first');
    h.chrome.storage.local.get({ enabled: true }, () => seen.push('third'));
  });
  h.chrome.storage.local.get({ enabled: true }, () => seen.push('second'));
  expect(h.flush()).toBe(3);
  expect(seen).toEqual(['first', 'second', 'third']);
  expect(h.pendingCount()).toBe(0);
  h.assertClean();
});

test('delivery cap leaves undispatched callbacks available for a later flush', () => {
  const h = createChromeHarness();
  const seen = [];
  for (let i = 0; i < 4; i++) h.chrome.storage.local.get({ enabled: true }, () => seen.push(i));
  expect(() => h.flush(2), '[harness:delivery-cap]').toThrow('Chrome harness delivery limit exceeded');
  expect(seen).toEqual([0, 1]);
  expect(h.pendingCount()).toBe(2);
  expect(h.flush(2)).toBe(2);
  expect(seen).toEqual([0, 1, 2, 3]);
});

test('invalid delivery caps fail before any callback runs', () => {
  for (const cap of [0, -1, 1.5, Infinity, NaN, '2']) {
    const h = createChromeHarness();
    let delivered = false;
    h.chrome.storage.local.get({ enabled: true }, () => { delivered = true; });
    expect(() => h.flush(cap)).toThrow('Invalid Chrome harness delivery limit');
    expect(delivered).toBe(false);
    expect(h.pendingCount()).toBe(1);
  }
});
