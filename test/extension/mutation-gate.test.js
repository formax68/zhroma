import { afterEach, expect, test } from 'vitest';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

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
