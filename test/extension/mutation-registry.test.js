import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { loadRegistry, validateRegistry } from '../../scripts/verify-mutation-kills.js';

const roots = [];
afterEach(() => { for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true }); });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'registry-control-')); roots.push(root);
  mkdirSync(join(root, 'test/mutants'), { recursive: true });
  writeFileSync(join(root, 'source.js'), 'export const value = 1;');
  writeFileSync(join(root, 'suite.test.js'), "test('intended target',()=>expect(value,'[registry:intended]').toBe(1));");
  return root;
}
const item = () => ({ id: 'control', file: 'source.js', find: 'value = 1', replace: 'value = 2', suites: ['suite.test.js'], note: 'control', expected_failure: { suite: 'suite.test.js', test: 'intended target', assertion: '[registry:intended]', kind: 'behavioral' } });

test('every discovered registry validates current source, suites and declared assertion markers', () => {
  const entries = loadRegistry(resolve('.'));
  expect(validateRegistry(entries, resolve('.'))).toHaveLength(entries.length);
});

test('current outcome and locale counterexamples are present in default discovery', () => {
  const ids = loadRegistry(resolve('.')).map((entry) => entry.id);
  expect(ids, '[registry:outcome-counterexamples-required]').toEqual(expect.arrayContaining([
    'confirmed-write-revert', 'write-timeout-as-failure', 'timeout-releases-writer',
    'expired-request-dispatch', 'popup-stale-refresh', 'whole-request-deadline', 'malformed-english-blame',
  ]));
});

test.each([
  ['renamed suite', (entry) => { entry.suites = ['renamed.test.js']; }],
  ['stale source literal', (entry) => { entry.find = 'old implementation'; }],
  ['invalid expected failure', (entry) => { entry.expected_failure.kind = 'exit-code'; }],
  ['missing assertion marker', (entry) => { entry.expected_failure.assertion = '[absent:marker]'; }],
  ['undeclared test name', (entry) => { entry.expected_failure.test = 'a name absent from test source'; }],
])('%s is rejected by the shared validator', (_name, change) => {
  const entry = item(); change(entry);
  expect(() => validateRegistry([entry], fixture()), '[registry:source-identity-required]').toThrow();
});
test('empty registry file is rejected', () => {
  const root = fixture(); writeFileSync(join(root, 'test/mutants/control.mutants.json'), '[]');
  expect(() => loadRegistry(root)).toThrow('registry-empty');
});
test('duplicate IDs across registry files are rejected', () => {
  const root = fixture();
  for (const name of ['one', 'two']) writeFileSync(join(root, `test/mutants/${name}.mutants.json`), JSON.stringify([item()]));
  expect(() => validateRegistry(loadRegistry(root), root)).toThrow('entry-id-duplicated');
});
