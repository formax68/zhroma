// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createContext, Script } from 'node:vm';
import { afterEach, expect, test } from 'vitest';
import { summarizeSamples, validateWorkloadReport, parseArguments, mergeReport } from '../../scripts/run-tint-workload.js';
import { closeWindows, inertWindow } from './tracer-world.js';
const sample = (observer = 0.2, timer = 0.3) => ({ segments: [{ category: 'observer', cpu: observer }, { category: 'timer', cpu: timer }], totalCpu: observer + timer, latency: 2, callbacks: 2, passes: 1, writes: 1 });
// A dormant run declares `runtime: 'loaded'`; enabled and disabled runs carry no
// `runtime` at all, which is exactly the historical shape Phase 3's samples have.
const run = (size = 30, mode = 'enabled') => ({ size, mode, ...(mode === 'dormant' ? { runtime: 'loaded' } : {}), warmups: 10, measured: 100, operations: Object.fromEntries(['edit', 'reorder', 'body', 'table', 'invalid-repair', 'unrelated'].map((name) => [name, Array.from({ length: 100 }, () => mode === 'enabled' ? sample() : { segments: [], totalCpu: 0, latency: 1, callbacks: 0, passes: 0, writes: 0 })])) });
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
// The second half of WR-09: a `disabled` run measures a page with NO extension,
// so it establishes nothing about the cost of the shipped off state. `dormant`
// is the run that loads the controller and stores a `false`, and the recorded
// evidence has to keep the two distinguishable.
test('a dormant run is accepted only when it proves the runtime was actually loaded', () => {
  expect(validateWorkloadReport(run(30, 'dormant'))).toBe('passed');
  const noisy = run(30, 'dormant'); noisy.operations.edit[0] = sample();
  expect(() => validateWorkloadReport(noisy)).toThrow(/dormant/i);
  const unloaded = { ...run(30, 'dormant'), runtime: 'absent' };
  expect(() => validateWorkloadReport(unloaded)).toThrow(/dormant/i);
  const undeclared = run(30, 'dormant'); delete undeclared.runtime;
  expect(() => validateWorkloadReport(undeclared)).toThrow(/dormant/i);
});
test('historical runs carrying no runtime field still validate exactly as before', () => {
  const disabled = run(30, 'disabled');
  expect(Object.hasOwn(disabled, 'runtime')).toBe(false);
  expect(validateWorkloadReport(disabled)).toBe('passed');
  const enabled = run();
  expect(Object.hasOwn(enabled, 'runtime')).toBe(false);
  expect(validateWorkloadReport(enabled)).toBe('passed');
});
test('a dormant run is extra evidence, never a seventh required run', () => {
  const identity = { hashes: { source: 'pinned' }, browser: 'fixed' };
  let report = mergeReport(null, identity, '30-dormant', run(30, 'dormant'));
  expect(report.timingStatus).toBe('incomplete');
  for (const size of [30, 200, 1000]) for (const mode of ['enabled', 'disabled']) report = mergeReport(report, identity, `${size}-${mode}`, run(size, mode));
  expect(report.timingStatus).toBe('passed');
  expect(Object.hasOwn(report.runs, '30-dormant')).toBe(true);
});
test('CLI validates sizes, modes, missing values and unsupported flags', () => {
  expect(parseArguments(['--size', '30', '--mode', 'enabled', '--smoke'])).toMatchObject({ size: 30, mode: 'enabled', smoke: true });
  for (const args of [['--size', '50'], ['--mode', 'maybe'], ['--output'], ['--unknown']]) expect(() => parseArguments(args)).toThrow();
});
// D-29: the same-session comparison times the working tree and the pinned
// 0.1.0 bytes, so which bytes a run serves is a CLI choice that must be as
// strict as size and mode: working by default, baseline on request, nothing else.
test('CLI --source defaults to working, accepts working or baseline, and refuses anything else', () => {
  expect(parseArguments([])).toMatchObject({ source: 'working' });
  expect(parseArguments(['--source', 'working'])).toMatchObject({ source: 'working' });
  expect(parseArguments(['--source', 'baseline', '--size', '30', '--mode', 'enabled'])).toMatchObject({ source: 'baseline', size: 30, mode: 'enabled' });
  expect(() => parseArguments(['--source', 'baseline', '--source', 'working'])).toThrow(/Duplicate flag --source/);
  expect(() => parseArguments(['--source'])).toThrow(/Missing value for --source/);
  expect(() => parseArguments(['--source', '--smoke'])).toThrow(/Missing value for --source/);
  for (const value of ['Baseline', 'head', '6d3ab0b', '']) expect(() => parseArguments(['--source', value])).toThrow();
  expect(() => parseArguments(['--source', 'baselinee'])).toThrow(/working or baseline/);
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
// 07-09: the Phase 4 adapter identifies the harness that measured its samples
// from Git alone and holds only the judging code to its committed text. That
// guard is only worth having if an edit to a judge actually changes the text
// it compares, and a runner missing a judge is refused rather than matched empty.
test('the pinned timing judge text moves with any judge edit and refuses a missing judge', async () => {
  const { timingJudgeSource } = await import('../../scripts/phase-04-source.js');
  const runner = readFileSync(new URL('../../scripts/run-tint-workload.js', import.meta.url), 'utf8');
  const judged = timingJudgeSource(runner);
  for (const name of ['summarizeSamples', 'validateWorkloadReport', 'mergeReport']) expect(judged).toContain(`export function ${name}(`);
  expect(judged).toContain("metrics.max >= 16 || (run.size === 30 && metrics.median >= 2)");
  expect(judged).not.toContain('parseArguments');
  expect(timingJudgeSource(runner.replace('metrics.median >= 2', 'metrics.median >= 3'))).not.toBe(judged);
  expect(timingJudgeSource(runner.replace("const OPERATIONS = ['edit',", "const OPERATIONS = ['typo',"))).not.toBe(judged);
  expect(timingJudgeSource(runner.replace('Refusing stale/mixed', 'Refusing mixed'))).not.toBe(judged);
  expect(() => timingJudgeSource(runner.replace('export function mergeReport(', 'function mergeReport('))).toThrow(/phase-04-timing-judge-missing/);
  expect(() => timingJudgeSource(runner.replace('const finite = ', 'const finiteNumber = '))).toThrow(/phase-04-timing-judge-missing/);
});
// 07-11 (WR-01, G-07-4a): the text equality above is only a tripwire. The
// historical verdict itself must come from the pinned judge code read from Git,
// executed in a fresh null-prototype context on JSON text parsed inside it, so
// nothing in this realm — the runner's top-level code, its imports, a patched
// built-in — can reach it. Three crafted runs straddle the budgets: `ok` passes,
// `slow` breaks the 16 ms max, `mixed` breaks the 2 ms size-30 median (3 ms).
const craftedRuns = () => {
  const slow = run(); slow.operations.edit[0] = sample(10, 8);
  const mixed = run();
  mixed.operations.edit = [...Array.from({ length: 40 }, () => sample(0.5, 0.5)), ...Array.from({ length: 60 }, () => sample(1.5, 1.5))];
  return { ok: run(), slow, mixed };
};
const HONEST = { ok: 'passed', slow: 'gaps_found', mixed: 'gaps_found' };
const RUNNER_URL = new URL('../../scripts/run-tint-workload.js', import.meta.url);
const recordedRuns = (path) => Object.entries(JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')).runs)
  .filter(([key]) => !key.endsWith('-profile')).map(([, recorded]) => recorded);
test('every recorded Phase 4 and Phase 3 timing run is judged by the pinned judge code in a fresh context', async () => {
  const { readPhase04Source, buildTimingJudges } = await import('../../scripts/phase-04-source.js');
  const { judges } = readPhase04Source();
  expect(typeof judges?.validateWorkloadReport).toBe('function');
  expect(typeof buildTimingJudges).toBe('function');
  const phase4 = recordedRuns('../../.planning/phases/04-honest-failure-and-an-off-switch/04-PERFORMANCE-SAMPLES.json');
  const phase3 = recordedRuns('../../.planning/phases/03-the-tint-survives-everything/03-PERFORMANCE-SAMPLES.json');
  expect(phase4).toHaveLength(7);
  expect(phase3).toHaveLength(6);
  for (const recorded of [...phase4, ...phase3]) expect(judges.validateWorkloadReport(JSON.stringify(recorded))).toBe('passed');
  for (const [name, crafted] of Object.entries(craftedRuns())) {
    const verdict = judges.validateWorkloadReport(JSON.stringify(crafted));
    expect(typeof verdict).toBe('string');
    expect(verdict).toBe(HONEST[name]);
    expect(validateWorkloadReport(crafted)).toBe(verdict);
  }
  expect(() => judges.validateWorkloadReport(run())).toThrow(/phase-04-timing-judge-input/);
  const runner = readFileSync(RUNNER_URL, 'utf8');
  expect(() => buildTimingJudges(runner.replace('export function mergeReport(', 'function mergeReport('))).toThrow(/phase-04-timing-judge-missing/);
});
// 07-11 negative controls (WR-01, M1-M5). Each mutant below is one statement
// OUTSIDE the judge slices. The text tripwire cannot see any of them, so the
// pinned judges must be immune by construction: only slice text ever runs, in
// a realm of its own, on inputs parsed inside it. Each control is also shown to
// be live — it really moves a verdict under the old arrangement — so a pass
// here is not a pass by a mutant that does nothing.
//
// Window rules for the realm patches: no `expect` inside a window (Vitest may
// use the patched built-ins), every patch restored in `finally`, a thrown call
// recorded as a distinct verdict, and no `await` inside a window.
const CODEGEN_OFF = { codeGeneration: { strings: false, wasm: false } };
const deExported = (slices) => slices.replace(/^export function /gmu, 'function ');
const insertAfterLine = (text, prefix, statement) => {
  const lines = text.split('\n'); lines.splice(lines.findIndex((line) => line.startsWith(prefix)) + 1, 0, statement); return lines.join('\n');
};
const insertBeforeLine = (text, prefix, statement) => {
  const lines = text.split('\n'); lines.splice(lines.findIndex((line) => line.startsWith(prefix)), 0, statement); return lines.join('\n');
};
const M1 = 'OPERATIONS.length = 0;';
const MUTANTS = [
  ['M1', M1, (text) => insertAfterLine(text, 'const finite = ', M1)],
  ['M2', 'Math.ceil = () => 1;', (text) => insertBeforeLine(text, 'export async function readServedAssets', 'Math.ceil = () => 1;')],
  ['M3', 'Array.prototype.sort = function () { return this; };', (text) => insertBeforeLine(text, 'export async function readServedAssets', 'Array.prototype.sort = function () { return this; };')],
  ['M4', 'Array.prototype.at = function () { return 99; };', (text) => insertBeforeLine(text, 'export async function readServedAssets', 'Array.prototype.at = function () { return 99; };')],
];
const verdictOf = (call) => { try { return call(); } catch (error) { return `threw ${String(error && error.message)}`; } };
const judgeEvery = (judge, inputs) => {
  const verdicts = {};
  for (const name of Object.keys(inputs)) verdicts[name] = verdictOf(() => judge(inputs[name]));
  return verdicts;
};
test.each(MUTANTS)('%s outside the judge slices is invisible to the text tripwire and never executed by the pinned judges', async (_id, statement, mutate) => {
  const { timingJudgeSource, buildTimingJudges } = await import('../../scripts/phase-04-source.js');
  const runner = readFileSync(RUNNER_URL, 'utf8');
  const mutant = mutate(runner);
  expect(mutant).not.toBe(runner);
  expect(mutant).toContain(`\n${statement}\n`);
  expect(timingJudgeSource(mutant)).toBe(timingJudgeSource(runner));
  const judges = buildTimingJudges(mutant);
  for (const [name, crafted] of Object.entries(craftedRuns())) expect(judges.validateWorkloadReport(JSON.stringify(crafted))).toBe(HONEST[name]);
});
test('M1 is live: the judge slices evaluated with OPERATIONS emptied pass runs that break the budgets', async () => {
  const { timingJudgeSource } = await import('../../scripts/phase-04-source.js');
  const slices = deExported(timingJudgeSource(readFileSync(RUNNER_URL, 'utf8')));
  const emptied = new Script(`${slices}\n${M1}\n;(json) => validateWorkloadReport(JSON.parse(json));\n`)
    .runInContext(createContext(Object.create(null), CODEGEN_OFF));
  const { slow, mixed } = craftedRuns();
  expect(emptied(JSON.stringify(slow))).toBe('passed');
  expect(emptied(JSON.stringify(mixed))).toBe('passed');
});
test('M2, M3 and M4 are live: a patched built-in moves the working-copy verdict and never a pinned verdict', async () => {
  const { readPhase04Source, timingJudgeSource } = await import('../../scripts/phase-04-source.js');
  const { judges } = readPhase04Source();
  const runs = craftedRuns();
  const texts = Object.fromEntries(Object.entries(runs).map(([name, crafted]) => [name, JSON.stringify(crafted)]));
  const working = (crafted) => validateWorkloadReport(crafted);
  const pinned = (text) => judges.validateWorkloadReport(text);
  // The reviewer's sketch: pinned slices in a null-prototype context, but the
  // bare in-context judge called with a HOST run object. That object's arrays
  // dispatch to this realm's Array.prototype, which is why runs cross as text.
  const sketch = new Script(`${deExported(timingJudgeSource(readFileSync(RUNNER_URL, 'utf8')))}\n;validateWorkloadReport;\n`)
    .runInContext(createContext(Object.create(null), CODEGEN_OFF));
  const seen = {};
  const originalCeil = Math.ceil;
  try {
    Math.ceil = () => 1;
    seen.M2 = { working: judgeEvery(working, runs), pinned: judgeEvery(pinned, texts) };
  } finally {
    Math.ceil = originalCeil;
  }
  const originalSort = Array.prototype.sort;
  try {
    Array.prototype.sort = function () { return this; };
    seen.M3 = { working: judgeEvery(working, runs), pinned: judgeEvery(pinned, texts) };
  } finally {
    Array.prototype.sort = originalSort;
  }
  const originalAt = Array.prototype.at;
  try {
    Array.prototype.at = function () { return 99; };
    seen.M4 = { working: judgeEvery(working, runs), pinned: judgeEvery(pinned, texts), sketch: verdictOf(() => sketch(runs.ok)) };
  } finally {
    Array.prototype.at = originalAt;
  }
  expect(seen.M2.working.mixed).toBe('passed');
  expect(seen.M3.working.slow).toBe('passed');
  expect(seen.M4.working.ok).toBe('gaps_found');
  expect(seen.M4.sketch).toBe('gaps_found');
  for (const id of ['M2', 'M3', 'M4']) expect(seen[id].pinned).toEqual(HONEST);
});
test('M5 is live: a planted Object.prototype.Math reaches a judge over an ordinary sandbox and never the pinned judges', async () => {
  const { readPhase04Source, timingJudgeSource } = await import('../../scripts/phase-04-source.js');
  const { judges } = readPhase04Source();
  // Exactly like buildTimingJudges, except that the sandbox is an ordinary `{}`.
  const ordinary = new Script(`${deExported(timingJudgeSource(readFileSync(RUNNER_URL, 'utf8')))}\n;({ validateWorkloadReport: (json) => validateWorkloadReport(JSON.parse(json)) });\n`)
    .runInContext(createContext({}, CODEGEN_OFF));
  const mixed = JSON.stringify(craftedRuns().mixed);
  let overOrdinary;
  let overPinned;
  try {
    Object.prototype.Math = { abs: Math.abs, ceil: () => 1 };
    overOrdinary = verdictOf(() => ordinary.validateWorkloadReport(mixed));
    overPinned = verdictOf(() => judges.validateWorkloadReport(mixed));
  } finally {
    delete Object.prototype.Math;
  }
  expect(overOrdinary).toBe('passed');
  expect(overPinned).toBe('gaps_found');
});
// 07-11 (WR-01): the historical verdicts are safe only while the live-acceptance
// validators keep calling the pinned judges. A later re-import of the runner
// would put its working-copy top-level code back into their module graph.
test('the Phase 4 and Phase 3 live-acceptance validators never re-import the timing runner', () => {
  for (const file of ['phase-04-live-acceptance.test.js', 'phase-03-live-acceptance.test.js']) {
    const text = readFileSync(new URL(file, import.meta.url), 'utf8');
    expect(text.split('\n').filter((line) => line.startsWith('import') && line.includes('run-tint-workload'))).toEqual([]);
    expect(text).toContain('judges.validateWorkloadReport(');
  }
});
