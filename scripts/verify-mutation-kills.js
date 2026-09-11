// Developer-only disposable-source mutation verification. A process failure is
// never enough: the baseline, exact test identity and assertion must agree.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export class MutationGateError extends Error {
  constructor(code, detail = '') { super(`${code}${detail ? `: ${detail}` : ''}`); this.code = code; }
}
const requireValue = (ok, code, detail) => { if (!ok) throw new MutationGateError(code, detail); };
const contained = (root, path) => { const rel = relative(root, path); return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel); };
function safeFile(root, path) {
  requireValue(typeof path === 'string' && path.length > 0 && !isAbsolute(path)
    && !path.split(/[\\/]/).some((part) => part === '..' || part === '.')
    && !path.includes('\\') && !path.startsWith('-'), 'unsafe-path');
  const canonicalRoot = realpathSync(root);
  let canonical;
  try { canonical = realpathSync(resolve(root, path)); } catch { throw new MutationGateError('file-missing', path); }
  requireValue(contained(canonicalRoot, canonical) && statSync(canonical).isFile(), 'file-outside-repository', path);
  // Even an internal source symlink could point back to the real tree after copying.
  requireValue(canonical === resolve(canonicalRoot, path), 'symlink-file-rejected', path);
  requireValue(!path.split('/').some((part) => ['.git', 'node_modules'].includes(part)), 'linked-tree-target-rejected', path);
  return canonical;
}
export function loadRegistry(repositoryRoot = REPOSITORY_ROOT) {
  const dir = join(repositoryRoot, 'test/mutants');
  let names;
  try { names = readdirSync(dir).filter((name) => name.endsWith('.mutants.json')).sort(); }
  catch { throw new MutationGateError('registry-directory-required'); }
  requireValue(names.length > 0, 'registry-empty');
  return names.flatMap((name) => {
    let entries;
    try { entries = JSON.parse(readFileSync(safeFile(repositoryRoot, `test/mutants/${name}`), 'utf8')); }
    catch (error) { if (error instanceof MutationGateError) throw error; throw new MutationGateError('registry-unparseable', name); }
    requireValue(Array.isArray(entries) && entries.length > 0, 'registry-empty-or-invalid', name);
    return entries.map((entry) => ({ ...entry, registry: name }));
  });
}
export function assertFindCounts(entries, repositoryRoot = REPOSITORY_ROOT) {
  for (const entry of entries) {
    const source = readFileSync(safeFile(repositoryRoot, entry.file), 'utf8');
    const found = source.split(entry.find).length - 1;
    requireValue(found === (entry.count ?? 1), 'mutant-find-count-mismatch', `${entry.id} expected ${entry.count ?? 1}, found ${found}`);
  }
}
export function validateRegistry(entries, repositoryRoot = REPOSITORY_ROOT) {
  requireValue(Array.isArray(entries) && entries.length > 0, 'registry-empty');
  const seen = new Set();
  for (const entry of entries) {
    requireValue(entry && typeof entry === 'object' && !Array.isArray(entry), 'entry-invalid');
    requireValue(typeof entry.id === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(entry.id), 'entry-id-invalid');
    requireValue(!seen.has(entry.id), 'entry-id-duplicated', entry.id); seen.add(entry.id);
    requireValue(typeof entry.find === 'string' && entry.find.length > 0 && typeof entry.replace === 'string'
      && entry.find !== entry.replace, 'entry-mutation-invalid', entry.id);
    requireValue(Number.isInteger(entry.count ?? 1) && (entry.count ?? 1) > 0, 'entry-count-invalid', entry.id);
    requireValue(typeof entry.note === 'string' && entry.note.length > 0, 'entry-note-required', entry.id);
    safeFile(repositoryRoot, entry.file);
    requireValue(Array.isArray(entry.suites) && entry.suites.length > 0 && new Set(entry.suites).size === entry.suites.length, 'entry-suites-invalid', entry.id);
    for (const suite of entry.suites) safeFile(repositoryRoot, suite);
    const target = entry.expected_failure;
    requireValue(target && Object.keys(target).sort().join(',') === 'assertion,kind,suite,test'
      && ['suite', 'test', 'assertion'].every((key) => typeof target[key] === 'string' && target[key].trim().length > 0)
      && ['behavioral', 'source-shape'].includes(target.kind), 'expected-failure-invalid', entry.id);
    requireValue(entry.suites.includes(target.suite), 'target-suite-not-selected', entry.id);
    requireValue(!/(?:mutation-(?:gate|registry)|phase-04-live-acceptance)\.test\.js$/.test(target.suite), 'forbidden-target-suite', entry.id);
    const testSource = readFileSync(safeFile(repositoryRoot, target.suite), 'utf8');
    requireValue(testSource.includes(target.assertion), 'assertion-marker-missing', entry.id);
  }
  assertFindCounts(entries, repositoryRoot);
  return entries;
}
function buildCopy(root) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'zhroma-mutant-')));
  try {
    cpSync(root, dir, { recursive: true, filter: (path) => !['.git', 'node_modules', '.gsd'].includes(relative(root, path).split(sep)[0]) });
    for (const name of ['node_modules', '.git']) if (existsSync(join(root, name))) symlinkSync(realpathSync(join(root, name)), join(dir, name), 'dir');
    return dir;
  } catch (error) { rmSync(dir, { recursive: true, force: true }); throw error; }
}
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function execute(dir, suites, names, spawn = spawnSync, timeout = 600000) {
  const reportPath = join(dir, '.mutation-report.json');
  const healthPath = join(dir, '.mutation-health.json');
  const reporterPath = join(dir, '.mutation-health-reporter.mjs');
  writeFileSync(reporterPath, `import {writeFileSync} from 'node:fs'; export default class {onTestRunEnd(modules,errors,reason){writeFileSync(${JSON.stringify(healthPath)},JSON.stringify({errors:errors.length,reason}));}}`);
  const args = ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.config.js', ...suites,
    '--reporter=json', `--outputFile=${reportPath}`, `--reporter=${reporterPath}`];
  if (names) args.push('--testNamePattern', `^(?:${names.map(escapeRegex).join('|')})$`);
  const processResult = spawn(process.execPath, args, { cwd: dir, encoding: 'utf8', timeout, maxBuffer: 8 * 1024 * 1024 });
  let report, health;
  try { report = JSON.parse(readFileSync(reportPath, 'utf8')); health = JSON.parse(readFileSync(healthPath, 'utf8')); } catch { /* rejected below */ }
  return { processResult, report, health };
}
function inspectRun(run, dir) {
  const { processResult: process, report, health } = run;
  requireValue(process && !process.error && !process.signal && [0, 1].includes(process.status), 'process-failed');
  requireValue(health && health.errors === 0 && ['passed', 'failed'].includes(health.reason), 'runner-errors');
  requireValue(report && typeof report.success === 'boolean' && Array.isArray(report.testResults)
    && Number.isInteger(report.numTotalTests) && report.numTotalTests > 0, 'report-invalid');
  const assertions = [];
  for (const suite of report.testResults) {
    requireValue(typeof suite.name === 'string' && contained(dir, suite.name) && Array.isArray(suite.assertionResults)
      && !suite.message && suite.assertionResults.length > 0, 'suite-load-failure');
    for (const assertion of suite.assertionResults) {
      requireValue(typeof assertion.fullName === 'string' && ['passed', 'failed', 'pending', 'skipped', 'todo'].includes(assertion.status)
        && Array.isArray(assertion.failureMessages), 'assertion-report-invalid');
      assertions.push({ ...assertion, suite: relative(dir, suite.name) });
    }
  }
  const failed = assertions.filter((item) => item.status === 'failed');
  const passed = assertions.filter((item) => item.status === 'passed');
  requireValue(assertions.length === report.numTotalTests && failed.length === report.numFailedTests
    && passed.length === report.numPassedTests && passed.length + failed.length > 0, 'report-count-mismatch');
  requireValue((process.status === 0) === report.success && (failed.length === 0) === report.success, 'report-outcome-mismatch');
  return { assertions, failed };
}
export function adjudicate(run, targets, dir, baseline = false) {
  const { assertions, failed } = inspectRun(run, dir);
  const matching = targets.map((target) => assertions.filter((item) => item.suite === target.suite && item.fullName === target.test));
  requireValue(matching.every((items) => items.length === 1), 'target-missing-or-duplicated');
  if (baseline) {
    requireValue(run.processResult.status === 0 && matching.every(([item]) => item.status === 'passed'), 'baseline-failed');
    return { verdict: 'BASELINE_GREEN' };
  }
  requireValue(matching.every(([item]) => ['passed', 'failed'].includes(item.status)), 'target-not-executed');
  if (run.processResult.status === 0) return { verdict: 'SURVIVED' };
  requireValue(failed.every((item) => targets.some((target) => item.suite === target.suite && item.fullName === target.test)), 'unrelated-assertion-failed');
  const target = targets[0];
  const item = matching[0][0];
  requireValue(item.status === 'failed' && item.failureMessages.length > 0
    && item.failureMessages.every((message) => typeof message === 'string' && message.startsWith('AssertionError:') && message.split('\n')[0].includes(target.assertion)), 'intended-assertion-not-proven');
  return { verdict: 'KILLED', evidence: { ...target, message: item.failureMessages[0].split('\n')[0] } };
}
export function measure(entries, repositoryRoot = REPOSITORY_ROOT, options = {}) {
  validateRegistry(entries, repositoryRoot);
  let baselineDir;
  try {
    baselineDir = buildCopy(repositoryRoot);
    adjudicate(execute(baselineDir, [...new Set(entries.flatMap((entry) => entry.suites))], null, options.spawn, options.timeout),
      entries.map((entry) => entry.expected_failure), baselineDir, true);
  } finally { if (baselineDir) rmSync(baselineDir, { recursive: true, force: true }); }
  return entries.map((entry) => {
    let dir;
    let result;
    try {
      dir = buildCopy(repositoryRoot);
      const path = safeFile(dir, entry.file);
      writeFileSync(path, readFileSync(path, 'utf8').split(entry.find).join(entry.replace));
      result = adjudicate(execute(dir, entry.suites, [entry.expected_failure.test], options.spawn, options.timeout), [entry.expected_failure], dir);
    } catch (error) { result = { verdict: 'GATE_ERROR', code: error.code ?? 'unexpected-error' }; }
    finally { if (dir) rmSync(dir, { recursive: true, force: true }); }
    const measured = { id: entry.id, ...result };
    options.onResult?.(measured);
    return measured;
  });
}
export function runCli(argv = process.argv.slice(2), repositoryRoot = REPOSITORY_ROOT) {
  try {
    requireValue(argv.length === 0 || (argv.length === 2 && argv[0] === '--only'), 'arguments-invalid');
    const registry = loadRegistry(repositoryRoot);
    const entries = argv.length ? registry.filter((entry) => entry.id === argv[1]) : registry;
    requireValue(entries.length > 0, 'only-id-unknown');
    const results = measure(entries, repositoryRoot, { onResult: (result) => process.stdout.write(`${JSON.stringify(result)}\n`) });
    const killed = results.filter((result) => result.verdict === 'KILLED').length;
    process.stdout.write(`MUTATION KILLS: ${killed}/${entries.length} killed\n`);
    return killed === entries.length ? 0 : 1;
  } catch (error) { process.stderr.write(`MUTATION_GATE_REJECTED ${error.code ?? 'unexpected-error'}\n`); return 1; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = runCli();
