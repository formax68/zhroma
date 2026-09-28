// 0.1.0 baseline source reader (07-01). Developer tooling only: nothing here
// ships inside the extension, and nothing here is imported by extension
// runtime code.
//
// Phase 7 onward must prove that the page still paints exactly what 0.1.0
// painted (COMPAT-01, D-07, D-24). A proof like that is only as good as its
// baseline, and the one way to quietly move a baseline is to read it from the
// working tree, which is the very thing under test.
//
// So the 0.1.0 side is read from Git and nowhere else: the literal revision
// below, which `release/candidate.json` records as the bytes submitted to the
// store as 0.1.0. Every identity is cross-checked in both directions:
//   * the literal revision must equal the candidate record's revision, so
//     rewriting either one alone fails;
//   * the tracked inventory at that revision must equal the candidate's asset
//     names exactly;
//   * every blob must hash to the candidate's per-asset sha256;
//   * the candidate's aggregate digest must be the digest of its own assets.
//
// There is no fallback. Any mismatch is a rejection, never a degradation to
// "whatever `extension/` contains today". The only working-copy file this
// module reads is `release/candidate.json`; it reads nothing under
// `extension/` and nothing under `.planning/`.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digestOf } from './release-source.js';

export class BaselineSourceError extends Error {
  constructor(code, options) {
    super(code, options);
    this.name = 'BaselineSourceError';
    this.code = code;
  }
}

/** The rc-01 source revision, submitted as 0.1.0. Pinned here AND in the candidate record. */
export const BASELINE_REVISION = '6d3ab0b10e9419a5c1077e59e468977c00d59d4a';
export const CANDIDATE_PATH = 'release/candidate.json';
export const REPOSITORY_ROOT = fileURLToPath(new URL('..', import.meta.url));
/** The prefix the tracked paths and the aggregate digest lines carry. */
export const DIGEST_PREFIX = 'extension/';

const SHA256 = /^[0-9a-f]{64}$/u;
const REVISION = /^[0-9a-f]{40}$/u;
const NAME = /^[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)*$/u;

function reject(condition, code, options) {
  if (!condition) throw new BaselineSourceError(`BASELINE_SOURCE_REJECTED ${code}`, options);
}

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function git(args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', args, {
      cwd: REPOSITORY_ROOT, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024,
    });
  } catch (cause) {
    if (allowFailure) return null;
    throw new BaselineSourceError('BASELINE_SOURCE_REJECTED baseline-missing-revision', { cause });
  }
}

/** Bytes of `path` exactly as committed at `revision`. Absence is a rejection. */
function blob(revision, path) {
  const bytes = git(['show', `${revision}:${path}`], { allowFailure: true });
  reject(bytes !== null, 'baseline-missing-revision');
  return bytes;
}

/** The candidate record as committed in the working copy, parsed but not yet trusted. */
function readCandidate() {
  let text;
  try {
    text = readFileSync(join(REPOSITORY_ROOT, CANDIDATE_PATH), 'utf8');
  } catch (cause) {
    throw new BaselineSourceError('BASELINE_SOURCE_REJECTED baseline-candidate-invalid', { cause });
  }
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new BaselineSourceError('BASELINE_SOURCE_REJECTED baseline-candidate-invalid', { cause });
  }
}

function requireCandidateShape(candidate) {
  reject(isObject(candidate), 'baseline-candidate-invalid');
  reject(typeof candidate.source_git_revision === 'string' && REVISION.test(candidate.source_git_revision),
    'baseline-candidate-invalid');
  reject(isObject(candidate.source), 'baseline-candidate-invalid');
  const { assets, digest } = candidate.source;
  reject(Array.isArray(assets) && assets.length > 0, 'baseline-candidate-invalid');
  for (const asset of assets) {
    reject(isObject(asset), 'baseline-candidate-invalid');
    reject(typeof asset.name === 'string' && NAME.test(asset.name), 'baseline-candidate-invalid');
    reject(Number.isInteger(asset.size) && asset.size >= 0, 'baseline-candidate-invalid');
    reject(typeof asset.sha256 === 'string' && SHA256.test(asset.sha256), 'baseline-candidate-invalid');
  }
  reject(new Set(assets.map((asset) => asset.name)).size === assets.length, 'baseline-candidate-invalid');
  reject(typeof digest === 'string' && SHA256.test(digest), 'baseline-candidate-invalid');
}

let cached = null;

/**
 * The 0.1.0 extension source, read from pinned Git blobs.
 *
 * @param {{ candidate?: unknown }} [options] `candidate` overrides the parsed
 *   `release/candidate.json`. It is the tampering seam the negative controls
 *   exercise; it can only make the checks fail, never substitute bytes, because
 *   the bytes always come from the literal BASELINE_REVISION. An override is
 *   never cached.
 * @returns {Readonly<{ revision: string, names: readonly string[],
 *   files: Readonly<Record<string, Buffer>>, manifest: any, digest: string }>}
 */
export function readBaselineSource(options = {}) {
  const override = Object.hasOwn(options, 'candidate');
  if (!override && cached) return cached;
  const candidate = override ? options.candidate : readCandidate();
  requireCandidateShape(candidate);

  reject(candidate.source_git_revision === BASELINE_REVISION, 'baseline-revision-mismatch');
  reject(git(['cat-file', '-e', `${BASELINE_REVISION}^{commit}`], { allowFailure: true }) !== null,
    'baseline-missing-revision');

  const assets = [...candidate.source.assets].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const names = assets.map((asset) => asset.name);
  const tracked = git(['ls-tree', '-r', '--name-only', BASELINE_REVISION, '--', 'extension'],
    { allowFailure: true });
  reject(tracked !== null, 'baseline-missing-revision');
  const trackedNames = tracked.toString('utf8').split('\n').filter(Boolean).sort();
  reject(trackedNames.length === names.length
    && names.every((name, index) => trackedNames[index] === `${DIGEST_PREFIX}${name}`),
  'baseline-inventory-mismatch');

  const files = {};
  for (const asset of assets) {
    const bytes = blob(BASELINE_REVISION, `${DIGEST_PREFIX}${asset.name}`);
    reject(bytes.length === asset.size && sha256(bytes) === asset.sha256, 'baseline-asset-mismatch');
    files[asset.name] = bytes;
  }

  const digest = digestOf(assets);
  reject(digest === candidate.source.digest, 'baseline-digest-mismatch');

  let manifest;
  try { manifest = JSON.parse(files['manifest.json'].toString('utf8')); }
  catch (cause) { throw new BaselineSourceError('BASELINE_SOURCE_REJECTED baseline-asset-mismatch', { cause }); }

  const result = Object.freeze({
    revision: BASELINE_REVISION,
    names: Object.freeze(names),
    files: Object.freeze(files),
    manifest,
    digest,
  });
  if (!override) cached = result;
  return result;
}
