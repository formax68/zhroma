// Release verification CLI (05-04). Developer tooling only: nothing here ships
// inside the extension, makes a network call, or touches a runtime byte.
//
// `verify-release` answers "is this candidate still what it says it is, and
// what does its smoke evidence actually say?" — in that order, and fail-closed
// at every step:
//
//   1. The shipped tree still matches the candidate's recorded inventory.
//      A changed byte under `extension/` invalidates the candidate outright;
//      it does not get re-labelled.
//   2. The archive is re-proved from its own bytes: SHA-256 recomputed, central
//      directory re-read, contents re-extracted and compared file by file. The
//      record's claims are checked AGAINST that, never trusted in its place.
//   3. The run is resolved from `candidate.smoke_run`, validated strictly, and
//      its status is REPORTED rather than assumed. `--require-smoke` turns a
//      non-`smoke_passed` status into exit 1; without it, the honest status is
//      printed and the command succeeds.
//
// `RELEASE_EVIDENCE_OK` is printed only after all of that, and never alongside
// a failure. Failure is a finite machine-readable code on stderr with exit 1.
import { readFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  CANDIDATE_SCHEMA_VERSION,
  requireUniqueJsonMembers,
  validateReleaseArchive,
} from './package-release.js';
import {
  REPOSITORY_ROOT,
  compareReleaseSources,
  readReleaseSource,
  requireReleaseSourceShape,
} from './release-source.js';
import { parseReleaseRun, validateReleaseRun } from './release-evidence.js';

export class ReleaseVerifyError extends Error {
  constructor(code, options) {
    super(code, options);
    this.name = 'ReleaseVerifyError';
    this.code = code;
  }
}

const ERROR_CODE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const VERSION = /^\d{1,9}(?:\.\d{1,9}){0,3}$/u;
const GIT_REVISION = /^[0-9a-f]{40}$/u;

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const nonempty = (value) => typeof value === 'string' && value.trim() !== '';

function reject(condition, code, options) {
  if (!condition) throw new ReleaseVerifyError(code, options);
}

/** Repository-relative paths are resolved against the repository, not the cwd. */
const anchor = (path) => (isAbsolute(path) ? resolve(path) : resolve(REPOSITORY_ROOT, path));

export function readCandidateRecord(candidatePath) {
  let text;
  try {
    text = readFileSync(resolve(candidatePath), 'utf8');
  } catch (cause) {
    throw new ReleaseVerifyError('candidate-unreadable', { cause });
  }
  try {
    requireUniqueJsonMembers(text);
  } catch (cause) {
    reject(false, cause?.code === 'candidate-duplicate-member'
      ? 'candidate-duplicate-member' : 'candidate-invalid-json', { cause });
  }
  let record;
  try {
    record = JSON.parse(text);
  } catch (cause) {
    throw new ReleaseVerifyError('candidate-invalid-json', { cause });
  }
  reject(isObject(record), 'candidate-invalid-json');
  reject(record.schema_version === CANDIDATE_SCHEMA_VERSION, 'candidate-schema-unsupported');
  reject(typeof record.version === 'string' && VERSION.test(record.version), 'candidate-version-invalid');
  reject(nonempty(record.out_dir), 'candidate-out-dir-required');
  reject(nonempty(record.frozen_at), 'candidate-freeze-required');
  reject(GIT_REVISION.test(record.source_git_revision ?? ''), 'candidate-revision-invalid');
  reject(isObject(record.zip) && nonempty(record.zip.path) && SHA256.test(record.zip.sha256 ?? ''),
    'candidate-archive-invalid');
  reject(isObject(record.extracted) && nonempty(record.extracted.path), 'candidate-extracted-invalid');
  reject(Array.isArray(record.automated_checks), 'candidate-automated-checks-invalid');
  requireReleaseSourceShape(record.source, 'candidate-source-invalid');
  return record;
}

/**
 * Resolve which run this verification is about.
 *
 * `candidate.smoke_run` is the pointer of record. An explicit `--run` is
 * allowed only when it names that same file: a second opinion about which
 * evidence applies to a candidate is exactly the ambiguity this rejects.
 */
export function resolveRunPath(record, requested) {
  const pointer = record.smoke_run ?? null;
  reject(pointer === null || nonempty(pointer), 'candidate-run-pointer-invalid');
  if (requested === undefined || requested === null) {
    reject(pointer !== null, 'run-path-required');
    return anchor(pointer);
  }
  reject(nonempty(requested), 'run-path-required');
  const explicit = anchor(requested);
  reject(pointer === null || anchor(pointer) === explicit, 'run-pointer-conflict');
  return explicit;
}

export function verifyRelease(options) {
  reject(isObject(options), 'options-required');
  reject(nonempty(options.candidate), 'candidate-path-required');
  const record = readCandidateRecord(options.candidate);
  const outDir = anchor(record.out_dir);

  // A changed shipped byte invalidates the candidate. Say so here rather than
  // letting a stale archive quietly verify against its own stale record.
  try {
    compareReleaseSources(record.source, readReleaseSource());
  } catch (cause) {
    reject(false, 'shipped-source-stale', { cause });
  }

  // Recomputed from the archive's own bytes, then extracted and compared file
  // by file against the declared inventory.
  const archive = validateReleaseArchive(
    { path: join(outDir, record.zip.path), sha256: record.zip.sha256 },
    record.source,
    { extractDir: join(outDir, record.extracted.path) },
  );

  const runPath = resolveRunPath(record, options.run);
  let json;
  try {
    json = readFileSync(runPath, 'utf8');
  } catch (cause) {
    throw new ReleaseVerifyError('run-unreadable', { cause });
  }
  const run = parseReleaseRun(json);
  const status = validateReleaseRun(run, { candidate: record });

  // `--require-smoke` is the submission gate: pending or failed observations
  // are not a release, however clean the archive is.
  if (options.requireSmoke) reject(status === 'smoke_passed', 'smoke-not-observed');

  return Object.freeze({
    status,
    version: record.version,
    archive: archive.sha256,
    extracted: archive.extractedPath,
    runPath,
    run,
    candidate: record,
  });
}

export function parseArgs(argv) {
  reject(Array.isArray(argv), 'unknown-argument');
  const options = { requireSmoke: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const split = typeof argument === 'string' && argument.startsWith('--') ? argument.indexOf('=') : -1;
    const flag = split === -1 ? argument : argument.slice(0, split);
    const inline = split === -1 ? null : argument.slice(split + 1);
    const take = () => {
      const value = inline ?? argv[index += 1];
      reject(nonempty(value), 'argument-value-required');
      return value;
    };
    if (flag === '--candidate') options.candidate = take();
    else if (flag === '--run') options.run = take();
    else if (flag === '--require-smoke') {
      reject(inline === null, 'argument-value-required');
      options.requireSmoke = true;
    } else throw new ReleaseVerifyError('unknown-argument');
  }
  reject(nonempty(options.candidate), 'candidate-path-required');
  return options;
}

export async function runCli(argv = process.argv.slice(2)) {
  try {
    const result = verifyRelease(parseArgs(argv));
    process.stdout.write(`RELEASE_EVIDENCE_OK ${result.status}\n`);
  } catch (error) {
    const named = ['ReleaseVerifyError', 'ReleaseEvidenceError', 'ReleasePackageError', 'ReleaseSourceError']
      .includes(error?.name);
    const code = named && ERROR_CODE.test(error.code ?? '') ? error.code : 'unexpected-error';
    process.stderr.write(`RELEASE_EVIDENCE_REJECTED ${code}\n`);
    if (process.env.ZHROMA_RELEASE_DEBUG === '1') {
      process.stderr.write(`${error?.cause?.stack ?? error?.stack ?? String(error)}\n`);
    }
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
