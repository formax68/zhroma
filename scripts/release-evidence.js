// Release smoke evidence (05-04). Developer tooling only: nothing here ships
// inside the extension, makes a network call, or touches a runtime byte.
//
// This module answers one question: "is this release record a PREPARED run, a
// FAILED run, or a genuinely OBSERVED one?" — and it answers it without ever
// being able to create an observation. Everything below is a refusal: a claim
// that is not bound to a load, to these exact candidate bytes and to a moment
// after the freeze is not evidence, and is rejected rather than downgraded.
//
// Three bindings make a `pass` mean something:
//
//   1. To a LOAD. `loaded_from_extracted`, the complete observed environment,
//      an observer and observation text are preconditions for any non-pending
//      status. A green test run cannot be written down here.
//   2. To THESE BYTES. The run restates the candidate's archive SHA-256 and its
//      complete per-file source inventory; a mismatch against the real
//      candidate is stale evidence, never a passing run.
//   3. To a TIME AFTER THE FREEZE. An observation dated before the candidate
//      was frozen described different bytes, and one dated in the future did
//      not happen.
//
// D-15 rides along as data rather than prose: the run must restate Phase 3 and
// Phase 4 exactly as `05-BASELINE.json` pinned them, so a release run cannot
// quietly improve a predecessor it never re-observed.
import { compareReleaseSources, requireReleaseSourceShape } from './release-source.js';
import { requireUniqueJsonMembers } from './package-release.js';
import { readBaseline } from './phase-04-source.js';

export class ReleaseEvidenceError extends Error {
  constructor(code, options) {
    super(code, options);
    this.name = 'ReleaseEvidenceError';
    this.code = code;
  }
}

export const RUN_SCHEMA_VERSION = 1;

/**
 * The eight checks a release smoke run must carry an observation for. Stable
 * ids: a record written against one set and validated against another would be
 * unreadable, so these are pinned and only change in a reviewed commit.
 */
export const REQUIRED_SMOKE_IDS = Object.freeze([
  'candidate-loaded',
  'default-tint',
  'toolbar-popup',
  'off-clears',
  'on-restores',
  'safe-transition',
  'restart-preference',
  'extension-errors-channels',
]);

/**
 * Contexts that may genuinely be unavailable. A Priority-less view has to
 * already exist and be safe to open; inventing one would mean editing a real
 * saved view. So this is conditional: observed when the context exists,
 * otherwise pending with a stated reason — never a pass either way.
 */
export const OPTIONAL_SMOKE_IDS = Object.freeze(['missing-column']);

export const CHECK_STATUSES = Object.freeze(['pending', 'pass', 'fail']);
export const RUN_STATUSES = Object.freeze(['human_needed', 'gaps_found', 'smoke_passed']);

const ALL_SMOKE_IDS = Object.freeze([...REQUIRED_SMOKE_IDS, ...OPTIONAL_SMOKE_IDS]);

const RUN_FIELDS = Object.freeze([
  'schema_version', 'run_id', 'status', 'started_at', 'finished_at', 'candidate',
  'loaded_from_extracted', 'environment', 'checks', 'unavailable', 'automated_checks',
  'predecessor_limits',
]);
const CANDIDATE_FIELDS = Object.freeze([
  'version', 'frozen_at', 'source_git_revision', 'zip', 'source', 'extracted',
]);
const ENVIRONMENT_FIELDS = Object.freeze([
  'browser', 'os', 'locale', 'appearance', 'view_state', 'fresh_install_preference',
  'loaded_directory', 'loaded_version', 'active_candidate_copies',
]);
const CHECK_FIELDS = Object.freeze(['id', 'status', 'observed_at', 'observation', 'observer']);
const AUTOMATED_FIELDS = Object.freeze(['id', 'command', 'result', 'ran_at']);

const RUN_ID = /^rc-\d{2}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const GIT_REVISION = /^[0-9a-f]{40}$/u;
const VERSION = /^\d{1,9}(?:\.\d{1,9}){0,3}$/u;
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u;
// A green suite, a fixture and a simulation are all things this project can
// produce on demand. None of them is somebody looking at a browser.
const SYNTHETIC = /\b(synthetic|fixture|happy.?dom|unit.?test|vitest|simulat(?:ed|ion)|mock(?:ed)?|stub(?:bed)?)\b/iu;
// Aggregate outcomes only: a URL, an address or a long identifier is
// ticket-shaped, and ticket data never leaves the browser (D-13).
const CONFIDENTIAL = /https?:\/\/|@[\w.-]+\.\w{2,}|\b\d{6,}\b/u;
// The observed view must be an English shell: `en`, or an English regional tag.
const ENGLISH_TAG = /^en(?:-[A-Za-z0-9]{1,8})*$/u;

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const nonempty = (value) => typeof value === 'string' && value.trim() !== '';
const sameKeys = (value, keys) => isObject(value)
  && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));

function reject(condition, code, options) {
  if (!condition) throw new ReleaseEvidenceError(code, options);
}

/** Epoch milliseconds for a strict UTC instant, or null if the value is not one. */
function instant(value) {
  if (typeof value !== 'string' || !INSTANT.test(value)) return null;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  return ms;
}

/** Structural equality that does not care about key insertion order. */
function deepEqual(left, right) {
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length
      && left.every((item, index) => deepEqual(item, right[index]));
  }
  if (isObject(left) || isObject(right)) {
    if (!isObject(left) || !isObject(right)) return false;
    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length
      && keys.every((key) => Object.hasOwn(right, key) && deepEqual(left[key], right[key]));
  }
  return Object.is(left, right);
}

function englishTag(value) {
  if (typeof value !== 'string' || !ENGLISH_TAG.test(value)) return false;
  try {
    return Intl.getCanonicalLocales(value).length === 1;
  } catch {
    return false;
  }
}

/**
 * The predecessor limits a Phase 5 run must restate, read from the pinned
 * Phase 4 baseline rather than transcribed. D-15 is therefore enforced against
 * the same file the Phase 4 acceptance validator is pinned to: a run cannot
 * state a better predecessor status than the one actually recorded, and
 * improving the baseline would break the Phase 4 suite first.
 */
export function expectedPredecessorLimits(baseline = readBaseline()) {
  return {
    phase_03: {
      phase: baseline.prior_phase.phase,
      status: baseline.prior_phase.status,
      checks_passed: baseline.prior_phase.checks_passed,
      checks_pending: baseline.prior_phase.checks_pending,
      checks_failed: baseline.prior_phase.checks_failed,
      uat_execution: baseline.prior_phase.uat_execution,
    },
    phase_04: {
      phase: baseline.phase,
      status: baseline.observed.status,
      checks_passed: baseline.observed.checks_passed,
      checks_pending: baseline.observed.checks_pending,
      checks_failed: baseline.observed.checks_failed,
      pending_ids: [...baseline.observed.pending_ids],
    },
  };
}

/**
 * Parse a standalone run document.
 *
 * Duplicate members are refused BEFORE `JSON.parse` can silently keep the last
 * one — otherwise a record could carry one hash for a casual reader and a
 * different hash for the validator.
 */
export function parseReleaseRun(json) {
  reject(typeof json === 'string' && json.trim() !== '', 'run-invalid-json');
  try {
    requireUniqueJsonMembers(json);
  } catch (cause) {
    reject(false, cause?.code === 'candidate-duplicate-member' ? 'run-duplicate-member' : 'run-invalid-json',
      { cause });
  }
  let record;
  try {
    record = JSON.parse(json);
  } catch (cause) {
    throw new ReleaseEvidenceError('run-invalid-json', { cause });
  }
  reject(isObject(record), 'run-object-required');
  return record;
}

function validateCandidateIdentity(record, actual) {
  reject(sameKeys(record.candidate, CANDIDATE_FIELDS), 'candidate-fields');
  const candidate = record.candidate;
  reject(typeof candidate.version === 'string' && VERSION.test(candidate.version), 'candidate-version-invalid');
  reject(GIT_REVISION.test(candidate.source_git_revision ?? ''), 'candidate-revision-invalid');
  reject(sameKeys(candidate.zip, ['path', 'sha256']) && nonempty(candidate.zip.path)
    && SHA256.test(candidate.zip.sha256 ?? ''), 'candidate-archive-invalid');
  reject(sameKeys(candidate.extracted, ['path']) && nonempty(candidate.extracted.path),
    'candidate-extracted-invalid');
  requireReleaseSourceShape(candidate.source, 'candidate-source-invalid');

  if (actual === undefined || actual === null) return;
  reject(isObject(actual), 'candidate-required');
  reject(candidate.version === actual.version, 'candidate-version-mismatch');
  reject(isObject(actual.zip) && candidate.zip.sha256 === actual.zip.sha256,
    'candidate-archive-hash-stale');
  try {
    compareReleaseSources(requireReleaseSourceShape(actual.source, 'candidate-required'), candidate.source);
  } catch (cause) {
    reject(false, 'candidate-source-stale', { cause });
  }
}

function validateEnvironment(record) {
  reject(sameKeys(record.environment, ENVIRONMENT_FIELDS), 'environment-fields');
  const environment = record.environment;
  if (!record.loaded_from_extracted) {
    reject(Object.values(environment).every((value) => value === null), 'unloaded-environment');
    return;
  }
  reject(nonempty(environment.browser) && nonempty(environment.os), 'observed-environment');
  reject(englishTag(environment.locale), 'observed-environment');
  reject(environment.appearance === 'light', 'observed-environment');
  reject(environment.view_state === 'unmodified-supported-view', 'observed-environment');
  reject(typeof environment.fresh_install_preference === 'boolean', 'observed-environment');
  // The candidate-loaded check's whole subject: which directory Chrome is
  // actually running, at which version, and that there is exactly one of it.
  reject(environment.loaded_directory === record.candidate.extracted.path, 'observed-environment');
  reject(environment.loaded_version === record.candidate.version, 'observed-environment');
  reject(environment.active_candidate_copies === 1, 'observed-environment');
}

function validateChecks(record, bounds) {
  reject(Array.isArray(record.checks) && record.checks.length > 0, 'required-checks');
  for (const check of record.checks) reject(sameKeys(check, CHECK_FIELDS), 'check-fields');
  for (const check of record.checks) reject(ALL_SMOKE_IDS.includes(check.id), 'unknown-check');
  for (const id of REQUIRED_SMOKE_IDS) {
    reject(record.checks.filter((check) => check.id === id).length === 1, 'required-checks');
  }
  reject(new Set(record.checks.map((check) => check.id)).size === record.checks.length, 'duplicate-check');

  for (const check of record.checks) {
    reject(CHECK_STATUSES.includes(check.status), 'check-status');
    if (check.status === 'pending') {
      reject(check.observed_at === null && check.observation === null && check.observer === null,
        'pending-evidence');
      continue;
    }
    // Only a confirmed load can carry an outcome: "the suite was green" is not
    // a thing anybody saw in a browser.
    reject(record.loaded_from_extracted, 'observation-without-load');
    reject(nonempty(check.observation) && nonempty(check.observer), 'observation-required');
    const observed = instant(check.observed_at);
    reject(observed !== null && observed >= bounds.frozen && observed >= bounds.started
      && observed <= bounds.now && (bounds.finished === null || observed <= bounds.finished),
      'observation-timing');
    reject(!SYNTHETIC.test(check.observation), 'synthetic-is-not-live');
    reject(!CONFIDENTIAL.test(check.observation), 'confidential-evidence');
    if (check.id === 'default-tint' && check.status === 'pass') {
      // Default tinting is what a stranger sees on install. A profile that has
      // already been switched on cannot demonstrate it.
      reject(record.environment.fresh_install_preference === true,
        'default-tint-requires-fresh-preference');
    }
  }
}

function validateUnavailable(record) {
  reject(Array.isArray(record.unavailable), 'unavailable');
  for (const item of record.unavailable) {
    reject(sameKeys(item, ['id', 'reason']), 'unavailable');
    reject(ALL_SMOKE_IDS.includes(item.id), 'unavailable');
    reject(nonempty(item.reason), 'unavailable');
  }
  reject(new Set(record.unavailable.map((item) => item.id)).size === record.unavailable.length,
    'unavailable');
  const byId = new Map(record.checks.map((check) => [check.id, check]));
  for (const item of record.unavailable) {
    const check = byId.get(item.id);
    reject(check === undefined || check.status === 'pending', 'unavailable-must-remain-pending');
  }
  // A conditional context is either observed or explained. Silence is the one
  // answer that is not allowed, because silence reads as "fine".
  const explained = new Set(record.unavailable.map((item) => item.id));
  for (const id of OPTIONAL_SMOKE_IDS) {
    const check = byId.get(id);
    reject((check !== undefined && check.status !== 'pending') || explained.has(id),
      'optional-check-unaccounted');
  }
}

function validateAutomatedChecks(record, bounds) {
  reject(Array.isArray(record.automated_checks) && record.automated_checks.length > 0,
    'automated-checks');
  for (const entry of record.automated_checks) {
    reject(sameKeys(entry, AUTOMATED_FIELDS), 'automated-checks');
    reject(nonempty(entry.id) && nonempty(entry.command), 'automated-checks');
    reject(['pass', 'fail'].includes(entry.result), 'automated-checks');
    const ran = instant(entry.ran_at);
    reject(ran !== null && ran <= bounds.now, 'automated-checks');
    // The prohibition, made mechanical: a command result may never occupy the
    // slot of a human observation, however green it was.
    reject(!ALL_SMOKE_IDS.includes(entry.id), 'automated-is-not-observation');
  }
  reject(new Set(record.automated_checks.map((entry) => entry.id)).size === record.automated_checks.length,
    'automated-checks');
}

/**
 * Validate a release run and return its computed status.
 *
 * `options.candidate` is the actual candidate record; when supplied, the run's
 * restated archive hash and source inventory are checked against it, so a run
 * written for earlier bytes is stale rather than merely out of date.
 */
export function validateReleaseRun(record, options = {}) {
  reject(isObject(options), 'options-required');
  reject(isObject(record), 'run-object-required');
  reject(sameKeys(record, RUN_FIELDS), 'run-fields');
  reject(record.schema_version === RUN_SCHEMA_VERSION, 'run-schema-unsupported');
  reject(typeof record.run_id === 'string' && RUN_ID.test(record.run_id), 'run-id-invalid');
  reject(RUN_STATUSES.includes(record.status), 'run-status-invalid');

  const now = options.now instanceof Date && Number.isFinite(options.now.getTime())
    ? options.now.getTime() : Date.now();
  const started = instant(record.started_at);
  const finished = record.finished_at === null ? null : instant(record.finished_at);
  reject(started !== null && started <= now, 'run-timestamps');
  reject(record.finished_at === null || (finished !== null && finished >= started && finished <= now),
    'run-timestamps');

  validateCandidateIdentity(record, options.candidate);
  const frozen = instant(record.candidate.frozen_at);
  reject(frozen !== null && frozen <= now, 'candidate-freeze-invalid');
  // The freeze precedes the run by definition: a candidate frozen after the run
  // started is not the thing the run was looking at.
  reject(frozen <= started, 'candidate-freeze-order');

  reject(typeof record.loaded_from_extracted === 'boolean', 'load-confirmation');
  validateEnvironment(record);
  validateChecks(record, { now, started, finished, frozen });
  validateUnavailable(record);
  validateAutomatedChecks(record, { now });

  reject(deepEqual(record.predecessor_limits, expectedPredecessorLimits(options.baseline)),
    'predecessor-limits');

  const failed = record.checks.some((check) => check.status === 'fail');
  const observed = record.loaded_from_extracted && finished !== null
    && REQUIRED_SMOKE_IDS.every((id) => record.checks.find((check) => check.id === id).status === 'pass');
  const expected = failed ? 'gaps_found' : observed ? 'smoke_passed' : 'human_needed';
  reject(record.status === expected, 'run-disposition');
  return expected;
}
