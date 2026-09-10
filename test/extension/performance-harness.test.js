// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createContext, Script } from 'node:vm';
import { afterEach, expect, test } from 'vitest';
import { summarizeSamples, validateWorkloadReport, parseArguments, mergeReport } from '../../scripts/run-tint-workload.js';
import { closeWindows, inertWindow } from './tracer-world.js';
const sample = (observer = 0.2, timer = 0.3) => ({ segments: [{ category: 'observer', cpu: observer }, { category: 'timer', cpu: timer }], totalCpu: observer + timer, latency: 2, callbacks: 2, passes: 1, writes: 1 });
const run = (size = 30, mode = 'enabled') => ({ size, mode, warmups: 10, measured: 100, operations: Object.fromEntries(['edit', 'reorder', 'body', 'table', 'invalid-repair', 'unrelated'].map((name) => [name, Array.from({ length: 100 }, () => mode === 'enabled' ? sample() : { segments: [], totalCpu: 0, latency: 1, callbacks: 0, passes: 0, writes: 0 })])) });
test('sums observer and timer CPU, reports all quantiles and distinct latency', () => {
  expect(summarizeSamples([sample(1, 2), sample(2, 3), sample(3, 4)])).toMatchObject({ count: 3, median: 5, p95: 7, max: 7, latencyMedian: 2 });
});
test.each([[], [{ ...sample(), totalCpu: 0.1 }], [{ ...sample(), callbacks: 1 }], [{ ...sample(), segments: [{ category: 'timer', cpu: NaN }] }]])('rejects incomplete/incorrect measurements', (samples) => { expect(() => summarizeSamples(samples)).toThrow(); });
test('exact complete workload passes; missing, disabled callbacks and breached budgets fail', () => {
  expect(validateWorkloadReport(run())).toBe('passed');
  const missing = run(); missing.operations.edit.pop(); expect(() => validateWorkloadReport(missing)).toThrow();
  const partial = run(); delete partial.operations.table; expect(() => validateWorkloadReport(partial)).toThrow();
  const slow = run(); slow.operations.edit[0] = sample(10, 8); expect(validateWorkloadReport(slow)).toBe('gaps_found');
  const typical = run(); typical.operations.edit = Array.from({ length: 100 }, () => sample(1, 1)); expect(validateWorkloadReport(typical)).toBe('gaps_found');
  const disabled = run(30, 'disabled'); disabled.operations.edit[0] = sample(); expect(() => validateWorkloadReport(disabled)).toThrow();
});
test('CLI validates sizes, modes, missing values and unsupported flags', () => {
  expect(parseArguments(['--size', '30', '--mode', 'enabled', '--smoke'])).toMatchObject({ size: 30, mode: 'enabled', smoke: true });
  for (const args of [['--size', '50'], ['--mode', 'maybe'], ['--output'], ['--unknown']]) expect(() => parseArguments(args)).toThrow();
});
test('CLI accepts the dormant mode and still refuses a near-miss of a real one', () => {
  expect(parseArguments(['--mode', 'dormant'])).toMatchObject({ mode: 'dormant' });
  expect(() => parseArguments(['--mode', 'enabledd'])).toThrow(/dormant/);
});
// WR-09: the page derived its mode from `params.get('mode') === 'enabled'`, so a
// typo silently meant *disabled* — which installs no seam, loads no runtime and
// measures nothing, while still reporting `passed`. The page must therefore
// refuse a bad parameter itself, not merely be protected by the CLI that is one
// of several ways it is reached.
const workloadPage = readFileSync(new URL('../performance/tint-workload.js', import.meta.url), 'utf8');
function evaluateWorkloadPage(search) {
  const window = inertWindow('<div id="view"></div><div id="unrelated">Synthetic</div>');
  // `location` is read as a bare global by the page, so a plain object with a
  // `search` property is the whole navigation surface it needs.
  const context = createContext({
    window, document: window.document, location: { search },
    URLSearchParams, DOMParser: window.DOMParser, Element: window.Element, EventTarget: window.EventTarget,
    performance: window.performance,
    // Never settles, so the page's `ready` IIFE cannot reject and nothing is
    // fetched: this test is about parameter validation, not measurement.
    fetch: () => new Promise(() => {}),
    Promise, Set, Error, Number, Object, JSON, Boolean, Array, String,
  }, { codeGeneration: { strings: false, wasm: false } });
  new Script(workloadPage, { filename: 'tint-workload.js' }).runInContext(context);
  return context;
}
afterEach(async () => { await closeWindows(); });
test.each([
  ['?size=30&mode=enabledd', 'enabledd'],
  ['?size=30', 'null'],
  ['?mode=enabled', 'null'],
  ['?size=0&mode=enabled', '0'],
  ['?size=-1&mode=enabled', '-1'],
  ['?size=abc&mode=enabled', 'abc'],
  ['?size=30.5&mode=enabled', '30.5'],
])('a mis-invoked workload page throws before measuring anything (%s)', (search, offending) => {
  expect(() => evaluateWorkloadPage(search)).toThrow(new RegExp(offending.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
test.each(['enabled', 'disabled', 'dormant'])('the workload page accepts mode %s', (mode) => {
  const context = evaluateWorkloadPage(`?size=30&mode=${mode}`);
  expect(typeof context.window.tintWorkload.run).toBe('function');
});
test('combined acceptance requires every enabled and disabled size with identical source/environment', () => {
  const identity = { hashes: { source: 'pinned' }, browser: 'fixed' };
  let report = mergeReport(null, identity, '30-disabled', run(30, 'disabled'));
  expect(report.timingStatus).toBe('incomplete');
  expect(() => mergeReport(report, { ...identity, browser: 'changed' }, '30-enabled', run())).toThrow(/stale\/mixed/);
  expect(() => mergeReport(report, identity, '30-disabled', run(30, 'disabled'))).toThrow(/already exists/);
  for (const size of [30, 200, 1000]) for (const mode of ['enabled', 'disabled']) {
    if (size === 30 && mode === 'disabled') continue;
    report = mergeReport(report, identity, `${size}-${mode}`, run(size, mode));
  }
  expect(report.timingStatus).toBe('passed');
});
