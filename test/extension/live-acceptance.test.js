// @vitest-environment node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { describe, expect, test } from 'vitest';

const ASSETS = ['manifest.json', 'content.js', 'zhroma.css'];
const REQUIRED_IDS = ['initial-load', 'urgent', 'high', 'normal', 'low', 'native-hover',
  'native-selection-inset', 'unread-bold', 'focus-click', 'reordered-reload', 'source-identity'];
const SCOPE = { language: 'English', html_lang: 'en', shell: 'current Agent Workspace', interface: 'light' };
const asset = (name) => readFileSync(new URL(`../../extension/${name}`, import.meta.url), 'utf8');
const currentHashes = Object.fromEntries(ASSETS.map((name) => [name,
  createHash('sha256').update(asset(name)).digest('hex')]));
const reportURL = new URL('../../.planning/phases/02-first-tint-on-a-real-view/02-LIVE-ACCEPTANCE.md', import.meta.url);

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
const sameKeys = (value, keys) => isObject(value)
  && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const requireEvidence = (condition, code) => { if (!condition) throw new Error(`LIVE_ACCEPTANCE_REJECTED ${code}`); };

function parseLiveAcceptance(markdown) {
  const records = [...markdown.matchAll(/^```json\r?\n([\s\S]*?)\r?\n```\s*$/gm)];
  requireEvidence(records.length === 1, 'single-record-required');
  let record;
  try { record = JSON.parse(records[0][1]); }
  catch { throw new Error('LIVE_ACCEPTANCE_REJECTED invalid-json'); }
  requireEvidence(isObject(record), 'object-required');
  return record;
}

// Validates declared evidence consistency, never whether a person really saw it.
function validateLiveAcceptance(record, hashes) {
  requireEvidence(isObject(record) && record.schema_version === 1, 'schema');
  requireEvidence(['human_needed', 'gaps_found', 'passed'].includes(record.status), 'status');
  requireEvidence(sameKeys(record.scope, Object.keys(SCOPE))
    && Object.entries(SCOPE).every(([key, value]) => record.scope[key] === value), 'scope');
  requireEvidence(typeof record.loaded_from_repository === 'boolean', 'directory-confirmation');
  requireEvidence(sameKeys(record.runtime_sha256, ASSETS) && sameKeys(hashes, ASSETS)
    && ASSETS.every((name) => /^[a-f0-9]{64}$/.test(record.runtime_sha256[name])
      && record.runtime_sha256[name] === hashes[name]), 'source-hashes');
  requireEvidence(isObject(record.settings), 'settings');
  requireEvidence(isObject(record.limitations)
    && Array.isArray(record.limitations.unresolved_observed_defects)
    && record.limitations.unresolved_observed_defects.every(nonempty), 'defect-inventory');
  requireEvidence(Array.isArray(record.checks) && record.checks.length === REQUIRED_IDS.length
    && REQUIRED_IDS.every((id) => record.checks.filter((check) => isObject(check) && check.id === id).length === 1), 'required-checks');
  for (const check of record.checks) {
    requireEvidence(sameKeys(check, ['id', 'status', 'evidence_kind', 'observed_on', 'evidence']), 'check-fields');
    requireEvidence(['pending', 'pass', 'fail'].includes(check.status)
      && ['pending', 'live', 'synthetic'].includes(check.evidence_kind), 'check-enums');
    if (check.status === 'pending') {
      requireEvidence(check.evidence_kind === 'pending' && check.observed_on === '' && check.evidence === '', 'pending-evidence');
    } else {
      requireEvidence(check.evidence_kind === 'live' && nonempty(check.evidence), 'live-observation');
      requireEvidence(typeof check.observed_on === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(check.observed_on)
        && Number.isFinite(Date.parse(check.observed_on))
        && new Date(check.observed_on).toISOString().slice(0, 10) === check.observed_on, 'observation-date');
      requireEvidence(record.loaded_from_repository, 'observed-source-unconfirmed');
    }
  }
  const hasDefect = record.checks.some((check) => check.status === 'fail')
    || record.limitations.unresolved_observed_defects.length > 0;
  const complete = record.loaded_from_repository && record.checks.every((check) => check.status === 'pass');
  const expected = hasDefect ? 'gaps_found' : complete ? 'passed' : 'human_needed';
  requireEvidence(record.status === expected, 'disposition');
  return record.status;
}

// SYNTHETIC TEST DATA ONLY. These in-memory claims exercise validation; they are
// never written to the acceptance report and never represent a human observation.
function syntheticReport({ complete = false } = {}) {
  return {
    schema_version: 1,
    status: complete ? 'passed' : 'human_needed',
    scope: { ...SCOPE },
    runtime_sha256: { ...currentHashes },
    loaded_from_repository: complete,
    settings: { STARTUP_DEADLINE_MS: 15000, SETTLE_MS: 100, palette: {
      Urgent: 'rgb(220 38 38 / 0.14)', High: 'rgb(234 88 12 / 0.12)',
      Normal: 'rgb(202 138 4 / 0.09)', Low: 'rgb(22 163 74 / 0.08)',
    } },
    checks: REQUIRED_IDS.map((id) => ({ id, status: complete ? 'pass' : 'pending',
      evidence_kind: complete ? 'live' : 'pending', observed_on: complete ? '2026-09-08' : '',
      evidence: complete ? `SYNTHETIC TEST DATA: example completed ${id} claim, not an observation.` : '' })),
    limitations: { unresolved_observed_defects: [] },
  };
}

describe('live evidence disposition (synthetic test data only)', () => {
  test('admits a pending prepared record only as human_needed', () => {
    expect(validateLiveAcceptance(syntheticReport(), currentHashes)).toBe('human_needed');
  });
  test('admits a complete claimed-live shape for validator testing only', () => {
    expect(validateLiveAcceptance(syntheticReport({ complete: true }), currentHashes)).toBe('passed');
  });
  test.each([
    ['pending check', (r) => { Object.assign(r.checks[0], { status: 'pending', evidence_kind: 'pending', observed_on: '', evidence: '' }); }],
    ['failed check', (r) => { r.checks[0].status = 'fail'; }],
    ['missing row', (r) => { r.checks.pop(); }],
    ['duplicate row', (r) => { r.checks[1] = { ...r.checks[0] }; }],
    ['extra row', (r) => { r.checks.push({ ...r.checks[0], id: 'extra' }); }],
    ['fixture-only claim', (r) => { r.checks[0].evidence_kind = 'fixture'; }],
    ['synthetic evidence', (r) => { r.checks[0].evidence_kind = 'synthetic'; }],
    ['empty observation', (r) => { r.checks[0].evidence = '  '; }],
    ['empty date', (r) => { r.checks[0].observed_on = ''; }],
    ['invalid calendar date', (r) => { r.checks[0].observed_on = '2026-02-30'; }],
    ['unconfirmed directory', (r) => { r.loaded_from_repository = false; }],
    ['truthy directory string', (r) => { r.loaded_from_repository = 'true'; }],
    ['stale source hash', (r) => { r.runtime_sha256['content.js'] = 'a'.repeat(64); }],
    ['missing source hash', (r) => { delete r.runtime_sha256['manifest.json']; }],
    ['extra source hash', (r) => { r.runtime_sha256['other.js'] = 'b'.repeat(64); }],
    ['unsupported scope', (r) => { r.scope.interface = 'dark'; }],
    ['missing scope', (r) => { delete r.scope.shell; }],
    ['unresolved observed defect', (r) => { r.limitations.unresolved_observed_defects.push('SYNTHETIC TEST DATA: missed initial batch'); }],
    ['missing defect inventory', (r) => { delete r.limitations.unresolved_observed_defects; }],
    ['unsupported schema', (r) => { r.schema_version = 2; }],
    ['unknown check status', (r) => { r.checks[0].status = 'verified'; }],
    ['missing check list', (r) => { delete r.checks; }],
  ])('rejects false passed: %s', (_name, mutate) => {
    const record = syntheticReport({ complete: true });
    mutate(record);
    expect(() => validateLiveAcceptance(record, currentHashes)).toThrow();
  });
  test('observed failure takes precedence over remaining pending evidence', () => {
    const record = syntheticReport();
    record.status = 'gaps_found'; record.loaded_from_repository = true;
    Object.assign(record.checks[0], { status: 'fail', evidence_kind: 'live', observed_on: '2026-09-08',
      evidence: 'SYNTHETIC TEST DATA: initial batch missed.' });
    expect(validateLiveAcceptance(record, currentHashes)).toBe('gaps_found');
    record.status = 'human_needed';
    expect(() => validateLiveAcceptance(record, currentHashes)).toThrow();
  });
  test('an unresolved observed defect cannot be hidden by all-pass rows', () => {
    const record = syntheticReport({ complete: true });
    record.limitations.unresolved_observed_defects.push('SYNTHETIC TEST DATA: unresolved visual defect.');
    record.status = 'gaps_found';
    expect(validateLiveAcceptance(record, currentHashes)).toBe('gaps_found');
  });
  test('partial live evidence stays human_needed', () => {
    const record = syntheticReport();
    record.loaded_from_repository = true;
    record.checks[0] = syntheticReport({ complete: true }).checks[0];
    expect(validateLiveAcceptance(record, currentHashes)).toBe('human_needed');
  });
  test.each(['passed', 'gaps_found', 'complete'])('rejects unsupported pending disposition %s', (status) => {
    const record = syntheticReport(); record.status = status;
    expect(() => validateLiveAcceptance(record, currentHashes)).toThrow();
  });
  test('rejects a pending row retaining stale observations', () => {
    const record = syntheticReport(); record.checks[0].evidence = 'SYNTHETIC TEST DATA: old observation';
    expect(() => validateLiveAcceptance(record, currentHashes)).toThrow();
  });
  test('rejects stale identity even while the report is pending', () => {
    const record = syntheticReport(); record.runtime_sha256['zhroma.css'] = 'a'.repeat(64);
    expect(() => validateLiveAcceptance(record, currentHashes)).toThrow();
  });
});

describe('single fenced JSON record', () => {
  const markdown = () => `# Phase 02 Live Acceptance\n\n\`\`\`json\n${JSON.stringify(syntheticReport())}\n\`\`\`\n`;
  test('parses one fenced object', () => { expect(parseLiveAcceptance(markdown())).toEqual(syntheticReport()); });
  test('rejects multiple competing records', () => { expect(() => parseLiveAcceptance(markdown() + markdown())).toThrow(); });
  test.each(['no record', '```json\n{invalid}\n```', '```json\n[]\n```', '```json\nnull\n```'])('rejects malformed record %s', (input) => {
    expect(() => parseLiveAcceptance(input)).toThrow();
  });
});

test('repository report is honest, current, and reports its actual acceptance status', () => {
  const record = parseLiveAcceptance(readFileSync(reportURL, 'utf8'));
  expect(validateLiveAcceptance(record, currentHashes)).toBe(record.status);
  for (const name of ['STARTUP_DEADLINE_MS', 'SETTLE_MS']) {
    expect(record.settings[name]).toBe(Number(asset('content.js').match(new RegExp(`const ${name} = (\\d+);`))[1]));
  }
  const cssPalette = Object.fromEntries([...asset('zhroma.css').matchAll(/data-zhroma-priority="(Urgent|High|Normal|Low)"[^{]*\{\s*background-color:\s*([^;]+);/g)]
    .map((match) => [match[1], match[2]]));
  expect(record.settings.palette).toEqual(cssPalette);
  expect(Object.keys(cssPalette).sort()).toEqual(['High', 'Low', 'Normal', 'Urgent']);
  expect(record.checks.every((check) => !/SYNTHETIC TEST DATA/.test(check.evidence))).toBe(true);
  process.stdout.write(`LIVE ACCEPTANCE STATUS: ${record.status}\n`);
});
