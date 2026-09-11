import { afterEach, expect, test } from 'vitest';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { adjudicate, validateRegistry, measure } from '../../scripts/verify-mutation-kills.js';

const roots = [];
const root = resolve('.');
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'mutation-control-'));
  roots.push(dir);
  for (const name of ['scripts', 'test/mutants', 'test/extension', 'extension', '.git']) mkdirSync(join(dir, name), { recursive: true });
  cpSync(join(root, 'scripts/verify-mutation-kills.js'), join(dir, 'scripts/verify-mutation-kills.js'));
  symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir');
  writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
  writeFileSync(join(dir, 'vitest.config.js'), 'export default {test:{include:["test/extension/*.test.js"]}};');
  writeFileSync(join(dir, 'extension/control.js'), 'export const value = 1;');
  writeFileSync(join(dir, 'test/extension/control.test.js'), `import {test,expect} from 'vitest'; import {value} from '../../extension/control.js'; test('intended control',()=>expect(value,'[control:intended]').toBe(1)); test('other control',()=>expect(1,'[control:other]').toBe(1));`);
  return dir;
}
function entry(overrides = {}) {
  return { id: 'control', file: 'extension/control.js', find: 'value = 1', replace: 'value = 2', count: 1, suites: ['test/extension/control.test.js'], note: 'real control', expected_failure: { suite: 'test/extension/control.test.js', test: 'intended control', assertion: '[control:intended]', kind: 'behavioral' }, ...overrides };
}
function cli(dir, item) {
  writeFileSync(join(dir, 'test/mutants/control.mutants.json'), JSON.stringify([item]));
  return spawnSync(process.execPath, ['scripts/verify-mutation-kills.js'], { cwd: dir, encoding: 'utf8', timeout: 30000 });
}
afterEach(() => { for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true }); });

test('missing suite cannot earn a kill from a failed real Vitest process', () => {
  const result = cli(fixture(), entry({ suites: ['test/extension/absent.test.js'] }));
  expect(result.status, '[gate:missing-suite-must-reject]').not.toBe(0);
  expect(result.stderr).toContain('MUTATION_GATE_REJECTED');
  expect(result.stdout).not.toContain('1/1 killed');
}, 40000);

test('real green baseline and intended assertion mutant earn one kill', () => {
  const result = cli(fixture(), entry());
  expect(result.status, result.stderr + result.stdout).toBe(0);
  expect(result.stdout).toContain('KILLED');
  expect(result.stdout).toContain('[control:intended]');
  expect(result.stdout).toContain('MUTATION KILLS: 1/1 killed');
}, 40000);

test('equivalent mutation survives the real green baseline', () => {
  const result = cli(fixture(), entry({ replace: 'value = (1)' }));
  expect(result.status).toBe(1);
  expect(result.stdout).toContain('SURVIVED');
}, 40000);

test.each([
  ['missing source', { file: 'extension/missing.js' }],
  ['traversal', { file: '../outside.js' }],
  ['absolute path', { file: '/tmp/outside.js' }],
  ['stale find', { find: 'absent literal' }],
  ['no-op replacement', { replace: 'value = 1' }],
  ['invalid count', { count: 0 }],
  ['empty find', { find: '' }],
  ['invalid metadata', { expected_failure: {} }],
])('%s is rejected before copy or mutation', (_name, change) => {
  expect(() => validateRegistry([entry(change)], fixture())).toThrow();
});

test.each(['file', 'suite'])('outside symlink %s is rejected without a write', (kind) => {
  const dir = fixture();
  const other = fixture();
  const path = kind === 'file' ? 'extension/link.js' : 'test/extension/link.test.js';
  symlinkSync(join(other, kind === 'file' ? 'extension/control.js' : 'test/extension/control.test.js'), join(dir, path));
  const change = kind === 'file' ? { file: path } : { suites: [path] };
  expect(() => validateRegistry([entry(change)], dir)).toThrow('file-outside-repository');
});

test.each([
  ['parse error', 'value = ;'],
  ['import error', "value = missingName"],
])('real %s cannot earn a kill', (_name, replace) => {
  const result = cli(fixture(), entry({ replace }));
  expect(result.status).toBe(1);
  expect(result.stdout).toContain('GATE_ERROR');
  expect(result.stdout).toContain('0/1 killed');
}, 40000);

test('a failing clean disposable baseline rejects before any mutation', () => {
  const dir = fixture();
  writeFileSync(join(dir, 'extension/control.js'), 'export const value = 0;');
  const result = cli(dir, entry({ find: 'value = 0' }));
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('MUTATION_GATE_REJECTED');
  expect(result.stdout).not.toContain('KILLED');
}, 40000);

test('a failure specific to the disposable copy also rejects the baseline', () => {
  const dir = fixture();
  writeFileSync(join(dir, 'test/extension/control.test.js'), "test('copy control',()=>expect(process.cwd().includes('zhroma-mutant-'),'[control:copy-only]').toBe(false));", { flag: 'a' });
  const original = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.config.js'], { cwd: dir, encoding: 'utf8', timeout: 30000 });
  expect(original.status, original.stderr).toBe(0);
  const result = cli(dir, entry());
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('MUTATION_GATE_REJECTED');
  expect(result.stdout).not.toContain('KILLED');
}, 40000);

test('a real unrelated assertion inside the target test cannot earn a kill', () => {
  const dir = fixture();
  writeFileSync(join(dir, 'test/extension/control.test.js'), "import {test,expect} from 'vitest'; import {value} from '../../extension/control.js'; test('intended control',()=>{expect(value,'[control:unrelated]').toBe(1);expect(value,'[control:intended]').toBe(1);});");
  const result = cli(dir, entry());
  expect(result.status).toBe(1);
  expect(result.stdout).toContain('intended-assertion-not-proven');
  expect(result.stdout).toContain('0/1 killed');
}, 40000);

test('a nonexistent exact test is rejected by its real baseline', () => {
  const dir = fixture();
  writeFileSync(join(dir, 'test/extension/control.test.js'), "if (false) test('nonexistent exact name',()=>{});", { flag: 'a' });
  const item = entry(); item.expected_failure.test = 'nonexistent exact name';
  const result = cli(dir, item);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('target-missing-or-duplicated');
}, 40000);

function reportRun() {
  return { processResult: { status: 1, signal: null }, health: { errors: 0, reason: 'failed' }, report: {
    success: false, numTotalTests: 1, numFailedTests: 1, numPassedTests: 0,
    testResults: [{ name: '/repo/test/extension/control.test.js', message: '', assertionResults: [
      { fullName: 'intended control', status: 'failed', failureMessages: ['AssertionError: [control:intended]: expected 2 to be 1'] },
    ] }],
  } };
}
test.each([
  ['spawn error', (r) => { r.processResult.error = { code: 'ENOENT' }; }],
  ['signal', (r) => { r.processResult.signal = 'SIGTERM'; }],
  ['timeout', (r) => { r.processResult.error = { code: 'ETIMEDOUT' }; r.processResult.status = null; }],
  ['missing report', (r) => { r.report = undefined; }],
  ['empty report', (r) => { r.report = {}; }],
  ['malformed report', (r) => { r.report = 'not json'; }],
  ['unhandled error', (r) => { r.health.errors = 1; }],
  ['cancelled run', (r) => { r.health.reason = 'interrupted'; }],
  ['suite load error', (r) => { r.report.testResults[0].message = 'SyntaxError'; }],
  ['unrelated assertion', (r) => { r.report.testResults[0].assertionResults[0].fullName = 'other control'; }],
  ['wrong assertion marker', (r) => { r.report.testResults[0].assertionResults[0].failureMessages = ['AssertionError: other assertion']; }],
  ['marker only in stack', (r) => { r.report.testResults[0].assertionResults[0].failureMessages = ['TypeError: crash\n[control:intended]']; }],
  ['target skipped', (r) => { r.report.testResults[0].assertionResults[0].status = 'pending'; }],
  ['additional unrelated failure', (r) => { r.report.numTotalTests = 2; r.report.numFailedTests = 2; r.report.testResults[0].assertionResults.push({ fullName: 'other control', status: 'failed', failureMessages: ['AssertionError: unrelated'] }); }],
])('%s is never intended assertion evidence', (_name, change) => {
  const run = reportRun(); change(run);
  expect(() => adjudicate(run, [entry().expected_failure], '/repo')).toThrow();
});

test('injected spawn failure cannot pass the disposable baseline', () => {
  expect(() => measure([entry()], fixture(), { spawn: () => ({ status: null, error: { code: 'ENOENT' } }) })).toThrow('process-failed');
});
