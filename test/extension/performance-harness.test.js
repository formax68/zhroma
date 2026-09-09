// @vitest-environment node
import { expect, test } from 'vitest';
import { summarizeSamples, validateWorkloadReport, parseArguments } from '../../scripts/run-tint-workload.js';
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
