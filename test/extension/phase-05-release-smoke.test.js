// @vitest-environment node
//
// Phase 5's release smoke evidence, bound to the exact packaged bytes.
//
// The question this file exists to answer is not "did the release tooling run
// without error?" — 05-01 already answers that — but "can a maintainer tell a
// PREPARED release record apart from a FAILED one and from a genuinely
// SMOKE-PASSED one?". A green archive check is not an observation, and nothing
// in here can become one: every test below validates the SHAPE and the BINDING
// of a claim, never the claim itself.
//
// Three rules drive the whole suite:
//
//   1. A pass must be attached to a load. `loaded_from_extracted`, a complete
//      observed environment, an observer and observation text are all
//      preconditions for any non-pending status — so "we ran the tests, it's
//      fine" cannot be written down as an observation.
//   2. A pass must be attached to THESE bytes. The run restates the candidate's
//      archive hash and its complete source inventory, and a mismatch against
//      the real candidate is stale evidence, not a passing run.
//   3. A pass must be attached to a TIME after the freeze. An observation dated
//      before the candidate was frozen described different bytes.
//
// D-15 rides along as data: the run restates Phase 3 and Phase 4 exactly as
// 05-BASELINE.json records them, and any other restatement is refused.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, expect, test } from 'vitest';

import {
  REQUIRED_SMOKE_IDS,
  expectedPredecessorLimits,
  parseReleaseRun,
  validateReleaseRun,
} from '../../scripts/release-evidence.js';
import { packageRelease } from '../../scripts/package-release.js';

const root = new URL('../../', import.meta.url);
const repositoryRoot = fileURLToPath(root);
const checklistPath = fileURLToPath(
  new URL('.planning/phases/05-published/05-RELEASE-CHECKLIST.md', root),
);
const verifyScript = fileURLToPath(new URL('scripts/verify-release.js', root));

// Read as text-or-nothing so a missing deliverable fails the assertion that
// describes it, rather than tearing down the whole file with a load error.
const checklist = () => (existsSync(checklistPath) ? readFileSync(checklistPath, 'utf8') : '');

const FROZEN_AT = '2026-09-11T10:00:00Z';
const STARTED_AT = '2026-09-11T10:05:00Z';
const OBSERVED_AT = '2026-09-11T10:30:00Z';
const FINISHED_AT = '2026-09-11T11:00:00Z';
const CLOCK = { now: new Date('2026-09-11T12:00:00Z') };

const REVISION = 'a'.repeat(40);
const clone = (value) => JSON.parse(JSON.stringify(value));

// A synthetic candidate identity. It is deliberately NOT the real candidate:
// these tests validate the schema, and a schema test that needed the real
// release would be untestable before the release exists.
function exampleSource() {
  const assets = [
    { name: 'manifest.json', size: 700, sha256: '1'.repeat(64) },
    { name: 'content.js', size: 9000, sha256: '2'.repeat(64) },
  ];
  return { assets, digest: digestOfAssets(assets) };
}

function digestOfAssets(assets) {
  return createHash('sha256')
    .update(assets.map((asset) => `${asset.sha256}  extension/${asset.name}\n`).join(''))
    .digest('hex');
}

function exampleCandidate() {
  return {
    version: '0.1.0',
    frozen_at: FROZEN_AT,
    source_git_revision: REVISION,
    zip: { path: 'zhroma-0.1.0.zip', sha256: '3'.repeat(64) },
    source: exampleSource(),
    extracted: { path: '/tmp/zhroma-release-rc-01/zhroma-0.1.0' },
  };
}

function exampleEnvironment(observed) {
  return observed
    ? {
      browser: 'Google Chrome 153.0.8010.37',
      os: 'macOS 27.0',
      locale: 'en-GB',
      appearance: 'light',
      view_state: 'unmodified-supported-view',
      fresh_install_preference: true,
      loaded_directory: '/tmp/zhroma-release-rc-01/zhroma-0.1.0',
      loaded_version: '0.1.0',
      active_candidate_copies: 1,
    }
    : {
      browser: null,
      os: null,
      locale: null,
      appearance: null,
      view_state: null,
      fresh_install_preference: null,
      loaded_directory: null,
      loaded_version: null,
      active_candidate_copies: null,
    };
}

/**
 * A run record. `observed: false` is the PREPARED shape — every required check
 * pending, nothing claimed. `observed: true` is the fully-observed shape.
 */
function exampleRun(observed = false) {
  return {
    schema_version: 1,
    run_id: 'rc-01',
    status: observed ? 'smoke_passed' : 'human_needed',
    started_at: STARTED_AT,
    finished_at: observed ? FINISHED_AT : null,
    candidate: exampleCandidate(),
    loaded_from_extracted: observed,
    environment: exampleEnvironment(observed),
    checks: REQUIRED_SMOKE_IDS.map((id) => ({
      id,
      status: observed ? 'pass' : 'pending',
      observed_at: observed ? OBSERVED_AT : null,
      observation: observed ? 'In-memory validator example only' : null,
      observer: observed ? 'maintainer' : null,
    })),
    unavailable: [{ id: 'missing-column', reason: 'No safe Priority-less view exists in this tenant' }],
    automated_checks: [
      { id: 'default-suite', command: 'npm test', result: 'pass', ran_at: STARTED_AT },
    ],
    predecessor_limits: expectedPredecessorLimits(),
  };
}

const findCheck = (run, id) => run.checks.find((check) => check.id === id);

// ---------------------------------------------------------------------------
// The check set
// ---------------------------------------------------------------------------

test('the eight required release smoke checks are stable and named', () => {
  expect(REQUIRED_SMOKE_IDS).toEqual([
    'candidate-loaded',
    'default-tint',
    'toolbar-popup',
    'off-clears',
    'on-restores',
    'safe-transition',
    'restart-preference',
    'extension-errors-channels',
  ]);
  expect(new Set(REQUIRED_SMOKE_IDS).size).toBe(8);
});

// ---------------------------------------------------------------------------
// The three dispositions
// ---------------------------------------------------------------------------

test('a prepared run with every required observation pending validates as human_needed', () => {
  expect(validateReleaseRun(exampleRun(false), CLOCK)).toBe('human_needed');
});

test('a genuinely failed check yields gaps_found rather than human_needed', () => {
  const run = exampleRun(true);
  findCheck(run, 'off-clears').status = 'fail';
  findCheck(run, 'off-clears').observation = 'Switching off left two rows tinted until reload';
  run.status = 'gaps_found';
  expect(validateReleaseRun(run, CLOCK)).toBe('gaps_found');
});

test('only a complete set of observed checks yields smoke_passed', () => {
  expect(validateReleaseRun(exampleRun(true), CLOCK)).toBe('smoke_passed');
});

test('smoke_passed is unreachable while the run is unfinished', () => {
  const run = exampleRun(true);
  run.finished_at = null;
  run.status = 'smoke_passed';
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/run-disposition/);
});

// ---------------------------------------------------------------------------
// A pass must be attached to a time after the freeze
// ---------------------------------------------------------------------------

test('an observation dated before the candidate freeze is rejected as stale', () => {
  const run = exampleRun(true);
  findCheck(run, 'default-tint').observed_at = '2026-09-11T09:00:00Z';
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/observation-timing/);
});

test('an observation dated in the future is rejected', () => {
  const run = exampleRun(true);
  findCheck(run, 'default-tint').observed_at = '2026-09-12T09:00:00Z';
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/observation-timing/);
});

test('a candidate frozen after the run started is rejected', () => {
  const run = exampleRun(false);
  run.candidate.frozen_at = '2026-09-11T10:06:00Z';
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/candidate-freeze-order/);
});

// ---------------------------------------------------------------------------
// A pass must be attached to a load
// ---------------------------------------------------------------------------

test('an asserted pass without observation text is rejected', () => {
  const run = exampleRun(true);
  findCheck(run, 'toolbar-popup').observation = '   ';
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/observation-required/);
});

test('an asserted pass without a named observer is rejected', () => {
  const run = exampleRun(true);
  findCheck(run, 'toolbar-popup').observer = null;
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/observation-required/);
});

test('an asserted pass without a confirmed load of the extracted candidate is rejected', () => {
  const run = exampleRun(true);
  run.loaded_from_extracted = false;
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/observation-without-load|unloaded-environment/);
});

test('an unloaded run must carry a wholly empty environment', () => {
  const run = exampleRun(false);
  run.environment.browser = 'Google Chrome 153.0.8010.37';
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/unloaded-environment/);
});

test('an observed run must record the actual browser, OS and locale', () => {
  const run = exampleRun(true);
  run.environment.os = '';
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/observed-environment/);
});

test('an observed run must be a supported English light-interface view', () => {
  const dark = exampleRun(true);
  dark.environment.appearance = 'dark';
  expect(() => validateReleaseRun(dark, CLOCK)).toThrow(/observed-environment/);

  const localized = exampleRun(true);
  localized.environment.locale = 'de';
  expect(() => validateReleaseRun(localized, CLOCK)).toThrow(/observed-environment/);
});

test('candidate-loaded must name the actual extracted directory, version and one active copy', () => {
  const elsewhere = exampleRun(true);
  elsewhere.environment.loaded_directory = '/tmp/some-other-copy';
  expect(() => validateReleaseRun(elsewhere, CLOCK)).toThrow(/observed-environment/);

  const stale = exampleRun(true);
  stale.environment.loaded_version = '0.0.9';
  expect(() => validateReleaseRun(stale, CLOCK)).toThrow(/observed-environment/);

  const duplicated = exampleRun(true);
  duplicated.environment.active_candidate_copies = 2;
  expect(() => validateReleaseRun(duplicated, CLOCK)).toThrow(/observed-environment/);
});

test('default-tint cannot pass without a genuinely fresh install preference', () => {
  const run = exampleRun(true);
  run.environment.fresh_install_preference = false;
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/default-tint-requires-fresh-preference/);
});

// ---------------------------------------------------------------------------
// A pass must be an observation, not a transcription
// ---------------------------------------------------------------------------

test('synthetic evidence is refused as a live observation', () => {
  for (const text of [
    'Verified by the happy-dom fixture',
    'The vitest suite covers this',
    'Simulated in the synthetic Chrome harness',
  ]) {
    const run = exampleRun(true);
    findCheck(run, 'safe-transition').observation = text;
    expect(() => validateReleaseRun(run, CLOCK)).toThrow(/synthetic-is-not-live/);
  }
});

test('confidential-looking evidence is refused', () => {
  for (const text of [
    'Checked on https://acme.zendesk.com/agent/filters/123',
    'Reported by agent@acme.example.com',
    'Ticket 4820991 stayed tinted',
  ]) {
    const run = exampleRun(true);
    findCheck(run, 'safe-transition').observation = text;
    expect(() => validateReleaseRun(run, CLOCK)).toThrow(/confidential-evidence/);
  }
});

test('an automated command result cannot stand in for a required human observation', () => {
  const run = exampleRun(false);
  run.automated_checks.push({
    id: 'default-tint',
    command: 'node node_modules/vitest/vitest.mjs run',
    result: 'pass',
    ran_at: STARTED_AT,
  });
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/automated-is-not-observation/);
});

// ---------------------------------------------------------------------------
// Malformed and incomplete records
// ---------------------------------------------------------------------------

test('duplicate JSON members are refused before JSON.parse can discard one', () => {
  const json = JSON.stringify(exampleRun(false), null, 2)
    .replace('"run_id": "rc-01"', '"run_id": "rc-01",\n  "run_id": "rc-02"');
  expect(() => parseReleaseRun(json)).toThrow(/run-duplicate-member/);
});

test('a run that is not a single JSON object is refused', () => {
  expect(() => parseReleaseRun('[]')).toThrow(/run-object-required/);
  expect(() => parseReleaseRun('{')).toThrow(/run-invalid-json/);
  expect(() => parseReleaseRun('')).toThrow(/run-invalid-json/);
  expect(() => parseReleaseRun(null)).toThrow(/run-invalid-json/);
});

test('null, empty and non-object records are refused', () => {
  for (const value of [null, undefined, '', 0, [], 'rc-01']) {
    expect(() => validateReleaseRun(value, CLOCK)).toThrow(/run-object-required/);
  }
});

test('a duplicate check id is refused', () => {
  const run = exampleRun(false);
  run.checks.push(clone(findCheck(run, 'default-tint')));
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/required-checks/);
});

test('an unknown check id is refused', () => {
  const run = exampleRun(false);
  run.checks.push({ id: 'looks-nice', status: 'pass', observed_at: null, observation: null, observer: null });
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/unknown-check/);
});

test('a missing required check is refused', () => {
  const run = exampleRun(false);
  run.checks = run.checks.filter((check) => check.id !== 'restart-preference');
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/required-checks/);
});

test('an unknown check status is refused', () => {
  for (const status of ['skipped', 'waived', 'deferred', 'n/a', 'PASS', true]) {
    const run = exampleRun(false);
    findCheck(run, 'off-clears').status = status;
    expect(() => validateReleaseRun(run, CLOCK)).toThrow(/check-status/);
  }
});

test('a pending check may not carry evidence', () => {
  const run = exampleRun(false);
  findCheck(run, 'off-clears').observation = 'Looked fine last phase';
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/pending-evidence/);
});

test('an unexpected or missing top-level field is refused', () => {
  const extra = exampleRun(false);
  extra.notes = 'looked good';
  expect(() => validateReleaseRun(extra, CLOCK)).toThrow(/run-fields/);

  const missing = exampleRun(false);
  delete missing.predecessor_limits;
  expect(() => validateReleaseRun(missing, CLOCK)).toThrow(/run-fields/);
});

// ---------------------------------------------------------------------------
// The conditional missing-column context
// ---------------------------------------------------------------------------

test('an unavailable optional context stays pending with a stated reason', () => {
  const run = exampleRun(true);
  run.checks.push({
    id: 'missing-column',
    status: 'pending',
    observed_at: null,
    observation: null,
    observer: null,
  });
  expect(validateReleaseRun(run, CLOCK)).toBe('smoke_passed');
});

test('an unavailable optional context may never be recorded as a pass', () => {
  const run = exampleRun(true);
  run.checks.push({
    id: 'missing-column',
    status: 'pass',
    observed_at: OBSERVED_AT,
    observation: 'A Priority-less view explained itself correctly',
    observer: 'maintainer',
  });
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/unavailable-must-remain-pending/);
});

test('an observed optional context needs no unavailability reason', () => {
  const run = exampleRun(true);
  run.unavailable = [];
  run.checks.push({
    id: 'missing-column',
    status: 'pass',
    observed_at: OBSERVED_AT,
    observation: 'A Priority-less view explained itself correctly',
    observer: 'maintainer',
  });
  expect(validateReleaseRun(run, CLOCK)).toBe('smoke_passed');
});

test('an optional context that is neither observed nor explained is refused', () => {
  const run = exampleRun(true);
  run.unavailable = [];
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/optional-check-unaccounted/);
});

test('an unavailability reason must be stated, not implied', () => {
  const run = exampleRun(false);
  run.unavailable = [{ id: 'missing-column', reason: '  ' }];
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/unavailable/);
});

// ---------------------------------------------------------------------------
// Predecessor limits (D-15)
// ---------------------------------------------------------------------------

test('the run restates Phase 3 and Phase 4 exactly as the pinned baseline records them', () => {
  const limits = expectedPredecessorLimits();
  expect(limits.phase_03).toMatchObject({
    status: 'human_needed',
    checks_passed: 11,
    checks_pending: 9,
    uat_execution: 'skipped-by-user',
  });
  expect(limits.phase_04).toMatchObject({
    status: 'human_needed',
    checks_passed: 14,
    checks_pending: 3,
    pending_ids: ['language-icon-copy', 'structure-copy', 'english-regional-locale'],
  });
});

test('a predecessor status improved by the release run is refused', () => {
  for (const mutate of [
    (limits) => { limits.phase_04.status = 'passed'; },
    (limits) => { limits.phase_04.checks_passed = 17; limits.phase_04.checks_pending = 0; },
    (limits) => { limits.phase_04.pending_ids = ['structure-copy']; },
    (limits) => { limits.phase_03.checks_pending = 0; limits.phase_03.checks_passed = 20; },
    (limits) => { limits.phase_03.uat_execution = 'completed'; },
  ]) {
    const run = exampleRun(true);
    mutate(run.predecessor_limits);
    expect(() => validateReleaseRun(run, CLOCK)).toThrow(/predecessor-limits/);
  }
});

// ---------------------------------------------------------------------------
// Binding to the actual candidate
// ---------------------------------------------------------------------------

test('a run whose archive hash differs from the actual candidate is stale', () => {
  const candidate = exampleCandidate();
  const run = exampleRun(true);
  run.candidate.zip.sha256 = '4'.repeat(64);
  expect(() => validateReleaseRun(run, { ...CLOCK, candidate }))
    .toThrow(/candidate-archive-hash-stale/);
});

test('a run whose source inventory differs from the actual candidate is stale', () => {
  const candidate = exampleCandidate();
  const run = exampleRun(true);
  run.candidate.source.assets[1].sha256 = '5'.repeat(64);
  run.candidate.source.digest = digestOfAssets(run.candidate.source.assets);
  expect(() => validateReleaseRun(run, { ...CLOCK, candidate }))
    .toThrow(/candidate-source-stale/);
});

test('a run whose source digest does not cover its own inventory is refused', () => {
  const run = exampleRun(true);
  run.candidate.source.digest = '6'.repeat(64);
  expect(() => validateReleaseRun(run, CLOCK)).toThrow(/candidate-source-invalid|source-digest-unbound/);
});

test('a run that matches the actual candidate exactly is accepted', () => {
  const candidate = exampleCandidate();
  expect(validateReleaseRun(exampleRun(true), { ...CLOCK, candidate })).toBe('smoke_passed');
});

// ---------------------------------------------------------------------------
// The manual checklist
// ---------------------------------------------------------------------------

test('the checklist names every required check by its stable id', () => {
  const text = checklist();
  for (const id of REQUIRED_SMOKE_IDS) expect(text).toContain(id);
  expect(text).toContain('missing-column');
});

test('the checklist states that it repeats before every submission, including unchanged bytes', () => {
  const text = checklist();
  expect(text).toMatch(/before every submission/i);
  expect(text).toMatch(/unchanged/i);
});

test('the checklist states the exact candidate identity a run is bound to', () => {
  const text = checklist();
  expect(text).toMatch(/SHA-?256/i);
  expect(text).toMatch(/extracted/i);
  expect(text).toContain('release/candidate.json');
});

test('the checklist keeps the missing-column context conditional and user-controlled steps explicit', () => {
  const text = checklist();
  expect(text).toMatch(/only if/i);
  expect(text).toMatch(/restart/i);
  expect(text).toMatch(/do not|never/i);
});

// ---------------------------------------------------------------------------
// The verify-release CLI, against a really packaged candidate
// ---------------------------------------------------------------------------

const temporaries = [];
afterAll(() => {
  for (const path of temporaries) rmSync(path, { recursive: true, force: true });
});

function realCandidate() {
  const outDir = mkdtempSync(join(tmpdir(), 'zhroma-release-smoke-'));
  temporaries.push(outDir);
  rmSync(outDir, { recursive: true, force: true });
  const packaged = packageRelease({ outDir });
  const candidate = {
    ...packaged.candidate,
    out_dir: outDir,
    source_git_revision: execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repositoryRoot, encoding: 'utf8',
    }).trim(),
    frozen_at: FROZEN_AT,
    smoke_run: null,
    automated_checks: [
      { id: 'release-package', command: 'node scripts/package-release.js', result: 'pass', ran_at: STARTED_AT },
    ],
  };
  return { outDir, candidate, packaged };
}

function writeRun(outDir, candidate, observed) {
  const run = exampleRun(observed);
  run.candidate = {
    version: candidate.version,
    frozen_at: candidate.frozen_at,
    source_git_revision: candidate.source_git_revision,
    zip: { path: candidate.zip.path, sha256: candidate.zip.sha256 },
    source: clone(candidate.source),
    extracted: { path: join(outDir, candidate.extracted.path) },
  };
  if (observed) {
    run.environment.loaded_directory = run.candidate.extracted.path;
  }
  const runPath = join(outDir, 'rc-01.json');
  writeFileSync(runPath, `${JSON.stringify(run, null, 2)}\n`);
  return runPath;
}

function runVerify(args) {
  const result = execFileSync('node', [verifyScript, ...args], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return result;
}

function runVerifyExpectingFailure(args) {
  try {
    execFileSync('node', [verifyScript, ...args], {
      cwd: repositoryRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    return { status: error.status, stderr: String(error.stderr ?? '') };
  }
  return { status: 0, stderr: '' };
}

test('verify-release reports the honest human_needed status of a prepared run', () => {
  const { outDir, candidate } = realCandidate();
  const runPath = writeRun(outDir, candidate, false);
  candidate.smoke_run = runPath;
  const candidatePath = join(outDir, 'release-candidate.json');
  writeFileSync(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`);

  const stdout = runVerify(['--candidate', candidatePath]);
  expect(stdout).toMatch(/^RELEASE_EVIDENCE_OK human_needed$/m);
});

test('verify-release refuses to call a prepared run smoke-passed under --require-smoke', () => {
  const { outDir, candidate } = realCandidate();
  const runPath = writeRun(outDir, candidate, false);
  candidate.smoke_run = runPath;
  const candidatePath = join(outDir, 'release-candidate.json');
  writeFileSync(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`);

  const failure = runVerifyExpectingFailure(['--candidate', candidatePath, '--require-smoke']);
  expect(failure.status).toBe(1);
  expect(failure.stderr).toMatch(/RELEASE_EVIDENCE_REJECTED smoke-not-observed/);
});

test('verify-release resolves the run from the candidate pointer and refuses a conflicting --run', () => {
  const { outDir, candidate } = realCandidate();
  const runPath = writeRun(outDir, candidate, false);
  candidate.smoke_run = runPath;
  const candidatePath = join(outDir, 'release-candidate.json');
  writeFileSync(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`);

  expect(runVerify(['--candidate', candidatePath, '--run', runPath]))
    .toMatch(/RELEASE_EVIDENCE_OK human_needed/);

  const other = join(outDir, 'rc-02.json');
  writeFileSync(other, readFileSync(runPath, 'utf8'));
  const failure = runVerifyExpectingFailure(['--candidate', candidatePath, '--run', other]);
  expect(failure.status).toBe(1);
  expect(failure.stderr).toMatch(/RELEASE_EVIDENCE_REJECTED run-pointer-conflict/);
});

test('verify-release refuses a candidate whose archive no longer matches its record', () => {
  const { outDir, candidate, packaged } = realCandidate();
  const runPath = writeRun(outDir, candidate, false);
  candidate.smoke_run = runPath;
  candidate.zip = { ...candidate.zip, sha256: '7'.repeat(64) };
  const candidatePath = join(outDir, 'release-candidate.json');
  writeFileSync(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`);
  expect(existsSync(packaged.archive)).toBe(true);

  const failure = runVerifyExpectingFailure(['--candidate', candidatePath]);
  expect(failure.status).toBe(1);
  expect(failure.stderr).toMatch(/RELEASE_EVIDENCE_REJECTED archive-hash-mismatch/);
});

test('verify-release refuses a candidate with no smoke run at all', () => {
  const { outDir, candidate } = realCandidate();
  const candidatePath = join(outDir, 'release-candidate.json');
  writeFileSync(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`);

  const failure = runVerifyExpectingFailure(['--candidate', candidatePath]);
  expect(failure.status).toBe(1);
  expect(failure.stderr).toMatch(/RELEASE_EVIDENCE_REJECTED run-path-required/);
});
