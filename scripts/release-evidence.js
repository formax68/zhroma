// Release smoke evidence (05-04). Developer tooling only: nothing here ships
// inside the extension, makes a network call, or touches a runtime byte.
//
// RED SKELETON — the API surface exists so the failing tests fail on their own
// assertions rather than on module resolution. The validation behaviour lands
// in the GREEN commit.
import { readBaseline } from './phase-04-source.js';

export class ReleaseEvidenceError extends Error {
  constructor(code, options) {
    super(code, options);
    this.name = 'ReleaseEvidenceError';
    this.code = code;
  }
}

export const RUN_SCHEMA_VERSION = 1;

/** The eight checks a release smoke run must carry an observation for. */
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

/** Contexts that may genuinely be unavailable; recorded conditionally, never assumed. */
export const OPTIONAL_SMOKE_IDS = Object.freeze(['missing-column']);

export const CHECK_STATUSES = Object.freeze(['pending', 'pass', 'fail']);
export const RUN_STATUSES = Object.freeze(['human_needed', 'gaps_found', 'smoke_passed']);

/** The predecessor limits a Phase 5 run must restate, read from the pinned baseline. */
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

export function parseReleaseRun(json) {
  return JSON.parse(json);
}

export function validateReleaseRun(record) {
  return record?.status ?? 'human_needed';
}
