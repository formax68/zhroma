// Preserve actual Vitest assertion outcomes as node:test TAP for GSD's
// node-TAP-only RED validator. This adapter never invents a failing result.
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run',
  '--config', 'vitest.config.js', '--reporter=json', ...process.argv.slice(2)], { encoding: 'utf8' });
const report = JSON.parse(result.stdout);
assert(report.numTotalTests > 0, 'Vitest must discover tests');
for (const suite of report.testResults) for (const entry of suite.assertionResults) {
  test(entry.fullName.trim(), () => assert.equal(entry.status, 'passed', entry.failureMessages.join('\n')));
}
