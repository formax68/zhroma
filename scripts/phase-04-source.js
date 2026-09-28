// Phase 4 historical source adapter (05-03). Developer tooling only: nothing
// here ships inside the extension, and nothing here is imported by extension
// runtime code.
//
// Phase 4's live acceptance was observed by a human sitting in front of Chrome,
// against the bytes `extension/` held at that moment. Phase 5 deliberately
// changes some of those bytes — a store title, a short description and a 128px
// brand icon. That change must not be able to move, invalidate or quietly
// re-earn a human observation that was made before it.
//
// So this module is the only way the Phase 4 acceptance validator reaches its
// source, and it reaches it through Git: the pinned observation revision, the
// runtime revision at or before it, and the exact blobs at that revision. Every
// identity is cross-checked against `.planning/phases/05-published/05-BASELINE.json`,
// which was derived from those same commits before any shipped byte moved.
//
// There is no fallback. A missing revision, a rewritten baseline, an inventory
// that no longer matches or an altered evidence document is a rejection, never
// a silent degradation to "whatever the working tree contains today" — that
// degradation is precisely the laundering this adapter exists to prevent.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export class Phase04SourceError extends Error {
  constructor(code, options) {
    super(code, options);
    this.name = 'Phase04SourceError';
    this.code = code;
  }
}

export const REPOSITORY_ROOT = fileURLToPath(new URL('..', import.meta.url));
export const BASELINE_PATH = '.planning/phases/05-published/05-BASELINE.json';
/** The prefix the aggregate digest lines carry, matching the Phase 4 convention. */
export const DIGEST_PREFIX = 'extension/';

const SHA256 = /^[0-9a-f]{64}$/u;
const REVISION = /^[0-9a-f]{40}$/u;

function reject(condition, code, options) {
  if (!condition) throw new Phase04SourceError(`PHASE04_SOURCE_REJECTED ${code}`, options);
}

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/**
 * Bytes of a repository file as it exists in the working copy.
 *
 * Guarded: the shipped runtime tree is off limits. Historical evidence is what
 * this module serves, and the single way to serve today's runtime bytes by
 * accident is to read them from disk, so that read is refused outright rather
 * than merely avoided by convention.
 */
export function readWorkingCopy(repositoryRelativePath) {
  reject(typeof repositoryRelativePath === 'string' && repositoryRelativePath.length > 0,
    'phase-04-invalid-path');
  reject(!repositoryRelativePath.startsWith(DIGEST_PREFIX), 'phase-04-runtime-source-read');
  try {
    return readFileSync(join(REPOSITORY_ROOT, repositoryRelativePath));
  } catch (cause) {
    throw new Phase04SourceError('PHASE04_SOURCE_REJECTED phase-04-missing-evidence-file', { cause });
  }
}

function git(args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', args, {
      cwd: REPOSITORY_ROOT, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024,
    });
  } catch (cause) {
    if (allowFailure) return null;
    throw new Phase04SourceError('PHASE04_SOURCE_REJECTED phase-04-missing-revision', { cause });
  }
}

/** Bytes of `path` exactly as committed at `revision`. Absence is a rejection. */
function blob(revision, path) {
  const bytes = git(['show', `${revision}:${path}`], { allowFailure: true });
  reject(bytes !== null, 'phase-04-missing-revision');
  return bytes;
}

/** The pinned baseline, read from disk and shape-checked before anything trusts it. */
export function readBaseline() {
  let parsed;
  try {
    parsed = JSON.parse(readWorkingCopy(BASELINE_PATH).toString('utf8'));
  } catch (cause) {
    if (cause instanceof Phase04SourceError) throw cause;
    throw new Phase04SourceError('PHASE04_SOURCE_REJECTED phase-04-invalid-baseline', { cause });
  }
  return parsed;
}

function requireBaselineShape(baseline) {
  reject(isObject(baseline), 'phase-04-invalid-baseline');
  reject(baseline.schema_version === 1, 'phase-04-baseline-schema');
  for (const key of ['observation_revision', 'runtime_revision']) {
    reject(REVISION.test(baseline[key] ?? ''), `phase-04-baseline-${key.replace(/_/gu, '-')}`);
  }
  reject(typeof baseline.observation_path === 'string' && baseline.observation_path.length > 0,
    'phase-04-baseline-observation-path');
  reject(isObject(baseline.assets) && Object.keys(baseline.assets).length > 0, 'phase-04-baseline-assets');
  for (const hash of Object.values(baseline.assets)) reject(SHA256.test(hash ?? ''), 'phase-04-baseline-assets');
  reject(baseline.inventory_count === Object.keys(baseline.assets).length, 'phase-04-baseline-inventory-count');
  reject(SHA256.test(baseline.digest ?? ''), 'phase-04-baseline-digest');
  reject(SHA256.test(baseline.validator_sha256 ?? ''), 'phase-04-baseline-validator');
  reject(typeof baseline.validator_path === 'string' && baseline.validator_path.length > 0,
    'phase-04-baseline-validator');
  reject(SHA256.test(baseline.timing_harness_sha256 ?? ''), 'phase-04-baseline-timing-harness');
  reject(Array.isArray(baseline.timing_harness_files) && baseline.timing_harness_files.length > 0,
    'phase-04-baseline-timing-harness');
  reject(isObject(baseline.timing_harness_hashes)
    && baseline.timing_harness_files.every((path) => SHA256.test(baseline.timing_harness_hashes[path] ?? '')),
  'phase-04-baseline-timing-harness');
  reject(isObject(baseline.evidence_hashes)
    && Object.values(baseline.evidence_hashes).every((hash) => SHA256.test(hash ?? '')),
  'phase-04-baseline-evidence');
  reject(Object.hasOwn(baseline.evidence_hashes, baseline.observation_path), 'phase-04-baseline-evidence');
}

/**
 * Confirm that a file the validator will read from disk is still byte-identical
 * to the pinned evidence, and that the pinned evidence is still what was
 * committed at the observation revision. Both directions matter: the first
 * catches an edited document, the second catches an edited baseline.
 */
function requirePinnedEvidence(baseline, path, expected) {
  reject(sha256(blob(baseline.observation_revision, path)) === expected, 'phase-04-evidence-mismatch');
  reject(sha256(readWorkingCopy(path)) === expected, 'phase-04-evidence-uncommitted');
}

/** The runner file whose exported judges decide the historical timing verdicts. */
export const TIMING_JUDGE_PATH = 'scripts/run-tint-workload.js';
const JUDGE_LINES = ['const OPERATIONS = ', 'const requireValue = ', 'const finite = '];
const JUDGE_FUNCTIONS = ['summarizeSamples', 'validateWorkloadReport', 'mergeReport'];

/**
 * The exact source text of the code that judges timing samples: the operation
 * list, the two helpers the judges call, and the three exported judges. Each
 * function runs from its `export function` line up to the next top-level
 * declaration. A missing or repeated piece is a rejection, never an empty match.
 *
 * @param {string} text The runner source.
 * @returns {string}
 */
export function timingJudgeSource(text) {
  const lines = text.split('\n');
  const parts = [];
  for (const prefix of JUDGE_LINES) {
    const found = lines.filter((line) => line.startsWith(prefix));
    reject(found.length === 1, 'phase-04-timing-judge-missing');
    parts.push(found[0]);
  }
  for (const name of JUDGE_FUNCTIONS) {
    const start = lines.findIndex((line) => line.startsWith(`export function ${name}(`));
    reject(start >= 0 && lines.filter((line) => line.startsWith(`export function ${name}(`)).length === 1,
      'phase-04-timing-judge-missing');
    let end = start + 1;
    while (end < lines.length && !/^(export |async function |function |const |let |if \()/u.test(lines[end])) end++;
    parts.push(lines.slice(start, end).join('\n'));
  }
  return parts.join('\n');
}

let cached = null;

/**
 * The Phase 4 runtime source as it was observed, read from Git.
 *
 * @param {{ baseline?: object }} [options] `baseline` overrides the on-disk
 *   pin. It is the tampering seam the controls exercise; it can only ever make
 *   the checks stricter or make them fail, never substitute different bytes.
 */
export function readPhase04Source(options = {}) {
  const override = Object.hasOwn(options, 'baseline');
  if (!override && cached) return cached;
  const baseline = override ? options.baseline : readBaseline();
  requireBaselineShape(baseline);

  const names = Object.keys(baseline.assets).sort();
  const tracked = git(['ls-tree', '-r', '--name-only', baseline.runtime_revision, '--', 'extension'],
    { allowFailure: true });
  reject(tracked !== null, 'phase-04-missing-revision');
  const trackedNames = tracked.toString('utf8').trim().split('\n').filter(Boolean).sort();
  reject(trackedNames.length === names.length
    && names.every((name, index) => trackedNames[index] === `${DIGEST_PREFIX}${name}`),
  'phase-04-inventory-mismatch');

  const files = {};
  for (const name of names) {
    const bytes = blob(baseline.runtime_revision, `${DIGEST_PREFIX}${name}`);
    reject(sha256(bytes) === baseline.assets[name], 'phase-04-asset-mismatch');
    files[name] = bytes;
  }
  const digest = sha256(names.map((name) => `${baseline.assets[name]}  ${DIGEST_PREFIX}${name}\n`).join(''));
  reject(digest === baseline.digest, 'phase-04-digest-mismatch');

  // The validator that produced the original verdict is identified from Git
  // alone. It is deliberately NOT compared against the working copy: this plan
  // is editing it, and a record of which validator ran is not a claim that the
  // same file is still on disk unchanged.
  reject(sha256(blob(baseline.observation_revision, baseline.validator_path)) === baseline.validator_sha256,
    'phase-04-validator-mismatch');

  for (const [path, expected] of Object.entries(baseline.evidence_hashes)) {
    requirePinnedEvidence(baseline, path, expected);
  }

  // The harness that measured the Phase 4 samples is identified from Git
  // alone, like the validator above: Phase 7 (07-09, D-29) extends the working
  // copy of both harness files to serve the manifest's scripts and the pinned
  // 0.1.0 bytes, and a record of which harness measured is not a claim that
  // the same files are still on disk unchanged. What the working copy still
  // decides is the historical verdict, through the judges imported from it, so
  // exactly that code is held to its committed text instead.
  const harness = createHash('sha256');
  for (const path of baseline.timing_harness_files) {
    const bytes = blob(baseline.observation_revision, path);
    reject(sha256(bytes) === baseline.timing_harness_hashes[path], 'phase-04-evidence-mismatch');
    harness.update(bytes);
  }
  const timingHarnessHash = harness.digest('hex');
  reject(timingHarnessHash === baseline.timing_harness_sha256, 'phase-04-timing-harness-mismatch');
  reject(baseline.timing_harness_files.includes(TIMING_JUDGE_PATH), 'phase-04-timing-judge-missing');
  reject(timingJudgeSource(blob(baseline.observation_revision, TIMING_JUDGE_PATH).toString('utf8'))
    === timingJudgeSource(readWorkingCopy(TIMING_JUDGE_PATH).toString('utf8')), 'phase-04-timing-judge-changed');

  let manifest;
  try { manifest = JSON.parse(files['manifest.json'].toString('utf8')); }
  catch (cause) { throw new Phase04SourceError('PHASE04_SOURCE_REJECTED phase-04-invalid-manifest', { cause }); }

  const result = Object.freeze({
    baseline,
    observation_revision: baseline.observation_revision,
    runtime_revision: baseline.runtime_revision,
    observation_path: baseline.observation_path,
    names,
    assets: { ...baseline.assets },
    digest,
    files,
    manifest,
    contentSource: files['content.js'].toString('utf8'),
    timingHarnessHash,
    evidenceHashes: { ...baseline.evidence_hashes },
  });
  if (!override) cached = result;
  return result;
}
