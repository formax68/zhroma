// @vitest-environment node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { validateWorkloadReport } from '../../scripts/run-tint-workload.js';

const ASSETS = ['manifest.json', 'content.js', 'zhroma.css'];
const REQUIRED_IDS = ['in-app-entry', 'delayed-entry', 'sort', 'refresh', 'view-switch', 'pagination-next', 'pagination-previous', 'scroll', 'grouped-sticky', 'native-states', 'failure-cleanup', 'ticket-isolation', 'dashboard-isolation', 'admin-isolation', 'tab-return', 'document-restoration', 'live-responsiveness', 'live-pass-budget', 'live-forced-layout', 'live-thirty-switch-memory'];
const SCOPE = { language: 'English', html_lang: 'en', shell: 'current Agent Workspace', interface: 'light' };
// Phase 3's observations were made against these bytes, not against whatever
// extension/ contains today. Read the pinned revision and never fall back to
// the working tree: a later phase must not be able to move this evidence by
// editing source. Resolution and digests are recorded in 04-BASELINE.md.
const HISTORICAL_REVISION = '382cc881334aa7edf2103150bd8fe663236b6357';
const HISTORICAL_HASHES = {
  'manifest.json': '0c959d71e71b34f5f5d4bc75ffc84f7838f09cc7f0db95d24ad605d45ca57ee6',
  'content.js': 'aaf2596dd41e67b520d6accd9ff55ecf8ab525de0098571dc284c81773998dc2',
  'zhroma.css': 'f5af38707480b2379d00343d36ec3a54b27ae79e95a09ad00a4538230c586b61',
};
const asset = (name) => {
  try {
    return execFileSync('git', ['show', `${HISTORICAL_REVISION}:extension/${name}`], {
      cwd: fileURLToPath(new URL('../../', import.meta.url)),
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 20 * 1024 * 1024,
    });
  } catch {
    throw new Error(`Restore historical commit ${HISTORICAL_REVISION} locally to validate Phase 3 evidence`);
  }
};
const hashes = Object.fromEntries(ASSETS.map((name) => [name, createHash('sha256').update(asset(name)).digest('hex')]));
const source = asset('content.js');
const delayMatch = source.match(/setTimeout\(reconcileCurrentTable, (\d+)\)/);
if (!delayMatch) throw new Error('Final scheduler setting could not be extracted');
const settings = { reconcile_delay_ms: Number(delayMatch[1]), startup_deadline_ms: source.includes('STARTUP_DEADLINE_MS') ? 'unexpected' : null };
const phase = new URL('../../.planning/phases/03-the-tint-survives-everything/', import.meta.url);
const performanceRecord = JSON.parse(readFileSync(new URL('03-PERFORMANCE-SAMPLES.json', phase), 'utf8'));
const CLOCK = { now: new Date('2026-09-09T12:00:00Z'), timeZone: 'Asia/Nicosia' };

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
const sameKeys = (value, keys) => isObject(value)
  && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const requireEvidence = (condition, code) => { if (!condition) throw new Error(`PHASE03_ACCEPTANCE_REJECTED ${code}`); };

// Tokenize before JSON.parse can discard repeated members. Strings are opaque
// tokens; each object gets its own decoded-name set, including inside arrays.
// JSON.parse below remains responsible for the complete JSON grammar.
function requireUniqueJsonMembers(json) {
  const tokens = /"(?:\\["\\/bfnrt]|\\u[0-9a-fA-F]{4}|[^"\\\u0000-\u001f])*"|[{}\[\]:,]|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[ \t\r\n]+/gy;
  const containers = [];
  let previous;
  let offset = 0;
  while (offset < json.length) {
    const match = tokens.exec(json);
    requireEvidence(match !== null, 'invalid-json');
    offset = tokens.lastIndex;
    const token = match[0];
    if (/^[ \t\r\n]/.test(token)) continue;
    if (token === '{') containers.push(new Set());
    else if (token === '[') containers.push(null);
    else if (token === '}' || token === ']') containers.pop();
    else if (token === ':') {
      const names = containers.at(-1);
      requireEvidence(names instanceof Set && previous?.startsWith('"'), 'invalid-json');
      const name = JSON.parse(previous);
      requireEvidence(!names.has(name), 'duplicate-json-member');
      names.add(name);
    }
    previous = token;
  }
}

function parsePhase03Acceptance(markdown) {
  const records = [...markdown.matchAll(/^```json\r?\n([\s\S]*?)\r?\n```\s*$/gm)];
  requireEvidence(records.length === 1, 'single-record-required');
  requireUniqueJsonMembers(records[0][1]);
  let record;
  try { record = JSON.parse(records[0][1]); }
  catch { throw new Error('PHASE03_ACCEPTANCE_REJECTED invalid-json'); }
  requireEvidence(isObject(record), 'object-required');
  return record;
}


function validatePhase03Acceptance(record, performance = performanceRecord, { now = new Date(), timeZone = 'Asia/Nicosia' } = {}) {
  requireEvidence(now instanceof Date && Number.isFinite(now.getTime()), 'clock');
  const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const today = ['year', 'month', 'day'].map((p) => parts.find(({ type }) => type === p).value).join('-');
  const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value <= today;
  requireEvidence(sameKeys(record, ['schema_version', 'status', 'scope', 'runtime_sha256', 'settings', 'loaded_from_repository', 'source_confirmed_on', 'environment', 'checks', 'limitations']), 'record-fields');
  requireEvidence(record.schema_version === 1 && ['human_needed', 'gaps_found', 'passed'].includes(record.status), 'schema-status');
  requireEvidence(sameKeys(record.scope, Object.keys(SCOPE)) && Object.entries(SCOPE).every(([key, value]) => record.scope[key] === value), 'scope');
  requireEvidence(sameKeys(record.runtime_sha256, ASSETS) && ASSETS.every((name) => record.runtime_sha256[name] === hashes[name]), 'source-hashes');
  requireEvidence(sameKeys(record.settings, Object.keys(settings)) && Object.entries(settings).every(([key, value]) => record.settings[key] === value), 'settings');
  requireEvidence(typeof record.loaded_from_repository === 'boolean', 'source-confirmation');
  requireEvidence(sameKeys(record.environment, ['browser', 'os', 'mounted_rows']), 'environment');
  requireEvidence(sameKeys(record.limitations, ['unresolved_observed_defects', 'unavailable_scenarios']), 'limitations');
  requireEvidence(Array.isArray(record.limitations.unresolved_observed_defects) && record.limitations.unresolved_observed_defects.every(nonempty), 'defects');
  requireEvidence(Array.isArray(record.limitations.unavailable_scenarios) && record.limitations.unavailable_scenarios.every((item) => sameKeys(item, ['id', 'reason']) && REQUIRED_IDS.includes(item.id) && nonempty(item.reason)), 'unavailable');
  requireEvidence(new Set(record.limitations.unavailable_scenarios.map((item) => item.id)).size === record.limitations.unavailable_scenarios.length, 'duplicate-unavailable');
  if (record.loaded_from_repository) {
    requireEvidence(validDate(record.source_confirmed_on) && nonempty(record.environment.browser) && nonempty(record.environment.os)
      && Number.isInteger(record.environment.mounted_rows) && record.environment.mounted_rows >= 0, 'confirmed-environment');
  } else requireEvidence(record.source_confirmed_on === null && Object.values(record.environment).every((value) => value === null), 'unconfirmed-environment');
  requireEvidence(Array.isArray(record.checks) && record.checks.length === 20 && REQUIRED_IDS.every((id) => record.checks.filter((row) => row?.id === id).length === 1), 'required-checks');
  for (const check of record.checks) {
    requireEvidence(sameKeys(check, ['id', 'status', 'evidence_kind', 'observed_on', 'evidence']), 'check-fields');
    requireEvidence(['pending', 'pass', 'fail'].includes(check.status), 'check-status');
    if (check.status === 'pending') requireEvidence(check.evidence_kind === 'pending' && check.observed_on === null && check.evidence === null, 'pending-evidence');
    else {
      requireEvidence(record.loaded_from_repository && check.evidence_kind === 'live' && nonempty(check.evidence), 'live-source-evidence');
      requireEvidence(!/\b(synthetic|fixture|happy.dom|unit.test)\b/i.test(check.evidence), 'synthetic-is-not-live');
      requireEvidence(validDate(check.observed_on) && check.observed_on >= record.source_confirmed_on, 'observation-date');
    }
  }
  for (const item of record.limitations.unavailable_scenarios) requireEvidence(record.checks.find((row) => row.id === item.id).status === 'pending', 'unavailable-must-remain-pending');
  requireEvidence(sameKeys(performance.identity?.hashes, ASSETS) && ASSETS.every((name) => performance.identity.hashes[name] === hashes[name]), 'performance-source');
  let timingComplete = true; let performanceFailed = false;
  for (const size of [30, 200, 1000]) for (const mode of ['enabled', 'disabled']) {
    const run = performance.runs?.[`${size}-${mode}`];
    if (!run) { timingComplete = false; continue; }
    requireEvidence(run.size === size && run.mode === mode, 'performance-scope');
    const outcome = validateWorkloadReport(run);
    if (outcome === 'gaps_found') performanceFailed = true;
  }
  let profilesComplete = true;
  for (const mode of ['enabled', 'disabled']) {
    const run = performance.runs?.[`30-${mode}-profile`];
    if (!run || run.status !== 'passed' || run.switches !== 30 || run.pendingTimers !== 0 || run.observers !== (mode === 'enabled' ? 1 : 0)) profilesComplete = false;
    if (run?.status === 'gaps_found') performanceFailed = true;
    for (const kind of ['layout', 'retention']) {
      if (run?.[kind]?.status !== 'passed') profilesComplete = false;
      if (run?.[kind]?.status === 'gaps_found') performanceFailed = true;
    }
    if (run?.layout?.attributedForcedLayouts !== 0 || run?.retention?.attributedDetachedGrowth !== 0) profilesComplete = false;
    if (run?.layout?.attributedForcedLayouts > 0 || run?.retention?.attributedDetachedGrowth > 0) performanceFailed = true;
  }
  const defect = performanceFailed || record.checks.some((row) => row.status === 'fail') || record.limitations.unresolved_observed_defects.length > 0;
  const complete = record.loaded_from_repository && record.checks.every((row) => row.status === 'pass') && timingComplete && profilesComplete;
  const expected = defect ? 'gaps_found' : complete ? 'passed' : 'human_needed';
  requireEvidence(record.status === expected, 'disposition');
  return expected;
}

// Hypothetical claims are confined to in-memory validation tests.
function example(complete = false) {
  return { schema_version: 1, status: complete ? 'passed' : 'human_needed', scope: { ...SCOPE }, runtime_sha256: { ...hashes }, settings: { ...settings },
    loaded_from_repository: complete, source_confirmed_on: complete ? '2026-09-09' : null,
    environment: complete ? { browser: 'Test browser', os: 'Test OS', mounted_rows: 30 } : { browser: null, os: null, mounted_rows: null },
    checks: REQUIRED_IDS.map((id) => ({ id, status: complete ? 'pass' : 'pending', evidence_kind: complete ? 'live' : 'pending', observed_on: complete ? '2026-09-09' : null, evidence: complete ? 'In-memory validator example only' : null })),
    limitations: { unresolved_observed_defects: [], unavailable_scenarios: [] } };
}
function acceptedPerformance() {
  // Hypothetical success must not depend on whether a real measurement passed.
  // Keep examples in memory; only the repository test consumes actual samples.
  const result = { identity: { hashes: { ...hashes } }, runs: {} };
  for (const size of [30, 200, 1000]) for (const mode of ['enabled', 'disabled']) {
    const sample = mode === 'enabled'
      ? { segments: [{ category: 'observer', cpu: 0.2 }, { category: 'timer', cpu: 0.3 }], totalCpu: 0.5, callbacks: 2, passes: 1, writes: 1, latency: 2 }
      : { segments: [], totalCpu: 0, callbacks: 0, passes: 0, writes: 0, latency: 2 };
    result.runs[`${size}-${mode}`] = { size, mode, warmups: 10, measured: 100,
      operations: Object.fromEntries(['edit', 'reorder', 'body', 'table', 'invalid-repair', 'unrelated']
        .map((op) => [op, Array.from({ length: 100 }, () => structuredClone(sample))])) };
  }
  for (const mode of ['enabled', 'disabled']) {
    result.runs[`30-${mode}-profile`] = { status: 'passed', switches: 30, pendingTimers: 0, observers: mode === 'enabled' ? 1 : 0,
      layout: { status: 'passed', attributedForcedLayouts: 0 }, retention: { status: 'passed', attributedDetachedGrowth: 0 } };
  }
  return result;
}

test('pending checks are valid preparation and only complete consistent live/performance claims can pass', () => {
  expect(validatePhase03Acceptance(example(), acceptedPerformance(), CLOCK)).toBe('human_needed');
  expect(validatePhase03Acceptance(example(true), acceptedPerformance(), CLOCK)).toBe('passed');
});
test.each([
  ['duplicate ID', (r) => { r.checks[1].id = r.checks[0].id; }],
  ['missing ID', (r) => r.checks.pop()], ['extra ID', (r) => r.checks.push({ ...r.checks[0], id: 'extra' })],
  ['wrong hash', (r) => { r.runtime_sha256['content.js'] = '0'.repeat(64); }],
  ['stale settings', (r) => { r.settings.reconcile_delay_ms = 100; }],
  ['future date', (r) => { r.checks[0].observed_on = '2026-09-10'; }],
  ['invalid date', (r) => { r.checks[0].observed_on = '2026-02-30'; }],
  ['pre-confirmation observation', (r) => { r.checks[0].observed_on = '2026-09-08'; }],
  ['synthetic kind', (r) => { r.checks[0].evidence_kind = 'synthetic'; }],
  ['synthetic described as live', (r) => { r.checks[0].evidence = 'Synthetic fixture result'; }],
  ['unconfirmed source', (r) => { r.loaded_from_repository = false; }],
  ['hidden defect', (r) => r.limitations.unresolved_observed_defects.push('Observed issue')],
  ['failed row', (r) => { r.checks[0].status = 'fail'; }],
  ['pending row', (r) => { r.checks[0] = example().checks[0]; }],
  ['unavailable passed restoration', (r) => r.limitations.unavailable_scenarios.push({ id: 'document-restoration', reason: 'Unavailable' })],
])('rejects %s while passed is claimed', (_name, change) => {
  const r = example(true); change(r); expect(() => validatePhase03Acceptance(r, acceptedPerformance(), CLOCK)).toThrow();
});
test.each(['missing-run', 'slow-sample', 'wrong-source', 'missing-layout', 'missing-retention', 'positive-retention', 'disabled-only', 'mislabelled-size'])('rejects false pass with %s performance', (kind) => {
  const p = acceptedPerformance();
  if (kind === 'missing-run') delete p.runs['1000-enabled'];
  if (kind === 'slow-sample') { const s = p.runs['1000-enabled'].operations.edit[0]; s.segments[0].cpu += 20; s.totalCpu += 20; }
  if (kind === 'wrong-source') p.identity.hashes['content.js'] = '0'.repeat(64);
  if (kind === 'missing-layout') p.runs['30-enabled-profile'].layout.status = 'human_needed';
  if (kind === 'missing-retention') delete p.runs['30-enabled-profile'].retention;
  if (kind === 'positive-retention') p.runs['30-enabled-profile'].retention.attributedDetachedGrowth = 1;
  if (kind === 'disabled-only') for (const size of [30,200,1000]) delete p.runs[`${size}-enabled`];
  if (kind === 'mislabelled-size') p.runs['1000-enabled'].size = 30;
  expect(() => validatePhase03Acceptance(example(true), p, CLOCK)).toThrow();
});
test('failed live results derive gaps_found; unavailable required scenarios stay pending', () => {
  const r = example(true); r.checks[0].status = 'fail'; r.status = 'gaps_found';
  expect(validatePhase03Acceptance(r, acceptedPerformance(), CLOCK)).toBe('gaps_found');
  const pending = example(); pending.limitations.unavailable_scenarios.push({ id: 'document-restoration', reason: 'Not available in this run' });
  expect(validatePhase03Acceptance(pending, acceptedPerformance(), CLOCK)).toBe('human_needed');
});
test('parser rejects duplicate JSON members and multiple canonical records', () => {
  expect(() => parsePhase03Acceptance('```json\n{"schema_version":1,"schema_version":1}\n```')).toThrow(/duplicate/);
  const text = '```json\n' + JSON.stringify(example()) + '\n```';
  expect(() => parsePhase03Acceptance(text + '\n' + text)).toThrow(/single-record/);
  expect(parsePhase03Acceptance(text)).toEqual(example());
});
test('repository record reports its actual final-source acceptance status', () => {
  const r = parsePhase03Acceptance(readFileSync(new URL('03-LIVE-ACCEPTANCE.md', phase), 'utf8'));
  const status = validatePhase03Acceptance(r);
  process.stdout.write(`PHASE 03 LIVE ACCEPTANCE STATUS: ${status}\n`);
  expect(status).toBe(r.status);
});

test('the record stays bound to its own historical runtime bytes and outcomes, not to current source', () => {
  // Independently pinned in 04-BASELINE.md so a future edit to extension/ can
  // neither invalidate nor silently re-validate a human observation.
  expect(hashes).toEqual(HISTORICAL_HASHES);
  const current = Object.fromEntries(ASSETS.map((name) => [name,
    createHash('sha256').update(readFileSync(new URL(`../../extension/${name}`, import.meta.url))).digest('hex')]));
  const record = parsePhase03Acceptance(readFileSync(new URL('03-LIVE-ACCEPTANCE.md', phase), 'utf8'));
  expect(record.runtime_sha256).toEqual(HISTORICAL_HASHES);
  // The evidence must keep validating even once Phase 4 has changed the bytes.
  if (JSON.stringify(current) !== JSON.stringify(HISTORICAL_HASHES)) {
    expect(validatePhase03Acceptance(record)).toBe('human_needed');
  }
  expect(record.status).toBe('human_needed');
  expect(record.checks.filter((row) => row.status === 'pass')).toHaveLength(11);
  expect(record.checks.filter((row) => row.status === 'pending')).toHaveLength(9);
  expect(record.checks.filter((row) => row.status === 'fail')).toHaveLength(0);
});

test('a missing historical revision fails loudly instead of falling back to current bytes', () => {
  const source = readFileSync(new URL(import.meta.url), 'utf8');
  expect(source).toMatch(/Restore historical commit \$\{HISTORICAL_REVISION\} locally/);
  expect(source).not.toMatch(/catch\s*\{\s*return readFileSync/);
  expect(() => execFileSync('git', ['show', `${'0'.repeat(40)}:extension/content.js`], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)), stdio: ['ignore', 'pipe', 'pipe'],
  })).toThrow();
});

test('pre-repair live observations and performance samples remain byte-exact historical evidence', () => {
  const revision = 'e2eb7bab92deb04d1ad5ec1156973426ab0e0e8f';
  const phasePath = '.planning/phases/03-the-tint-survives-everything/';
  const historical = new URL('history/2026-09-09-before-runtime-repair/', phase);
  const gitBytes = (path) => execFileSync('git', ['show', `${revision}:${path}`], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)), maxBuffer: 20 * 1024 * 1024,
  });
  for (const name of ['03-LIVE-ACCEPTANCE.md', '03-PERFORMANCE.md', '03-PERFORMANCE-SAMPLES.json']) {
    expect(readFileSync(new URL(name, historical)).equals(gitBytes(phasePath + name))).toBe(true);
  }
  const previous = parsePhase03Acceptance(readFileSync(new URL('03-LIVE-ACCEPTANCE.md', historical), 'utf8'));
  for (const name of ASSETS) expect(previous.runtime_sha256[name]).toBe(createHash('sha256').update(gitBytes(`extension/${name}`)).digest('hex'));
  expect(previous.checks.filter((row) => row.status === 'pass')).toHaveLength(16);
  expect(previous.checks.filter((row) => row.status === 'pending')).toHaveLength(4);
  expect(() => validatePhase03Acceptance(previous)).toThrow(/source-hashes/);
});
