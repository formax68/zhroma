// Release packaging and archive validation (05-01). Developer tooling only:
// nothing here ships inside the extension, makes a network call, or transforms
// a runtime byte. It reads the reviewed source tree, asks the installed
// archiver to store exactly those files, and then proves the claim by asking
// the installed extractor to put them back on disk somewhere else and comparing
// every byte.
//
// Failure is always a finite, machine-readable code on stderr with exit 1.
// Diagnostics name codes and paths, never file contents.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  DEFAULT_SOURCE_DIRECTORY,
  REPOSITORY_ROOT,
  compareReleaseSources,
  readReleaseSource,
  requireReleaseSourceShape,
} from './release-source.js';

export class ReleasePackageError extends Error {
  constructor(code, options) {
    super(code, options);
    this.name = 'ReleasePackageError';
    this.code = code;
  }
}

export const CANDIDATE_SCHEMA_VERSION = 1;
export const CANDIDATE_FILENAME = 'candidate.json';

const SHA256 = /^[0-9a-f]{64}$/u;
const VERSION = /^\d{1,9}(?:\.\d{1,9}){0,3}$/u;
const ERROR_CODE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const CENTRAL_HEADER_LENGTH = 46;
const EOCD_LENGTH = 22;
const TOOL_TIMEOUT_MS = 120_000;

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

function reject(condition, code, options) {
  if (!condition) throw new ReleasePackageError(code, options);
}

/** Resolve through symlinks as far as the path already exists, so containment checks cannot be evaded. */
function realOf(target) {
  let current = resolve(target);
  const trail = [];
  for (;;) {
    try {
      return join(realpathSync(current), ...trail);
    } catch {
      const parent = dirname(current);
      if (parent === current) return resolve(target);
      trail.unshift(basename(current));
      current = parent;
    }
  }
}

/** Is `child` the same path as, or inside, `parent`? Boundary-safe: a sibling prefix is not inside. */
function contains(parent, child) {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function runTool(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    shell: false,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: TOOL_TIMEOUT_MS,
  });
  reject(!result.error, `${command}-unavailable`, { cause: result.error });
  reject(result.status === 0, `${command}-failed`);
  return result;
}

export function releaseNames(version) {
  reject(typeof version === 'string' && VERSION.test(version), 'manifest-version-invalid');
  return Object.freeze({
    archive: `zhroma-${version}.zip`,
    extracted: `zhroma-${version}`,
    candidate: CANDIDATE_FILENAME,
  });
}

export function readManifestVersion(sourceDirectory) {
  let text;
  try {
    text = readFileSync(join(resolve(sourceDirectory), 'manifest.json'), 'utf8');
  } catch (cause) {
    throw new ReleasePackageError('manifest-unreadable', { cause });
  }
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch (cause) {
    throw new ReleasePackageError('manifest-invalid-json', { cause });
  }
  reject(isObject(manifest), 'manifest-invalid-json');
  const version = manifest.version;
  reject(typeof version === 'string' && VERSION.test(version), 'manifest-version-invalid');
  return version;
}

/**
 * Refuse a JSON document that names the same member twice. `JSON.parse` keeps
 * the last one silently, so a record could otherwise carry one hash for a
 * casual reader and a different hash for a validator.
 */
export function requireUniqueJsonMembers(json) {
  const tokens = /"(?:\\["\\/bfnrt]|\\u[0-9a-fA-F]{4}|[^"\\\u0000-\u001f])*"|[{}[\]:,]|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[ \t\r\n]+/gy;
  const containers = [];
  let previous;
  let offset = 0;
  while (offset < json.length) {
    const match = tokens.exec(json);
    reject(match !== null, 'candidate-invalid-json');
    offset = tokens.lastIndex;
    const token = match[0];
    if (/^[ \t\r\n]/u.test(token)) continue;
    if (token === '{') containers.push(new Set());
    else if (token === '[') containers.push(null);
    else if (token === '}' || token === ']') containers.pop();
    else if (token === ':') {
      const names = containers.at(-1);
      reject(names instanceof Set && previous?.startsWith('"'), 'candidate-invalid-json');
      const name = JSON.parse(previous);
      reject(!names.has(name), 'candidate-duplicate-member');
      names.add(name);
    }
    previous = token;
  }
}

function entryKind(externalAttributes, hostSystem, name) {
  const mode = hostSystem === 3 ? (externalAttributes >>> 16) & 0xffff : 0;
  const format = mode & 0xf000;
  if (format === 0xa000) return 'symlink';
  if (format === 0x4000 || name.endsWith('/') || (externalAttributes & 0x10) !== 0) return 'directory';
  if (format === 0x8000 || format === 0) return 'file';
  return 'other';
}

/**
 * Read the archive's central directory with Node built-ins.
 *
 * The point is to know the names, types and declared sizes of every entry
 * BEFORE any extractor is allowed to write to disk. A preflight that parsed a
 * text listing printed by the extractor would be trusting the very tool it is
 * meant to check.
 */
export function readArchiveEntries(buffer) {
  reject(Buffer.isBuffer(buffer) && buffer.length >= EOCD_LENGTH, 'archive-unreadable');
  let eocd = -1;
  const floor = Math.max(0, buffer.length - EOCD_LENGTH - 0xffff);
  for (let offset = buffer.length - EOCD_LENGTH; offset >= floor; offset -= 1) {
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) {
      eocd = offset;
      break;
    }
  }
  reject(eocd >= 0, 'archive-end-record-missing');
  const total = buffer.readUInt16LE(eocd + 10);
  const directorySize = buffer.readUInt32LE(eocd + 12);
  const directoryStart = buffer.readUInt32LE(eocd + 16);
  reject(total !== 0xffff && directorySize !== 0xffffffff && directoryStart !== 0xffffffff,
    'archive-zip64-unsupported');
  reject(directoryStart + directorySize <= buffer.length, 'archive-truncated');

  const entries = [];
  let offset = directoryStart;
  const end = directoryStart + directorySize;
  for (let index = 0; index < total; index += 1) {
    reject(offset + CENTRAL_HEADER_LENGTH <= end, 'archive-truncated');
    reject(buffer.readUInt32LE(offset) === CENTRAL_SIGNATURE, 'archive-central-directory-invalid');
    const hostSystem = buffer.readUInt8(offset + 5);
    const flags = buffer.readUInt16LE(offset + 8);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const externalAttributes = buffer.readUInt32LE(offset + 38);
    const next = offset + CENTRAL_HEADER_LENGTH + nameLength + extraLength + commentLength;
    reject(next <= end, 'archive-truncated');
    reject((flags & 0x0001) === 0, 'archive-encrypted-entry');
    const name = buffer
      .subarray(offset + CENTRAL_HEADER_LENGTH, offset + CENTRAL_HEADER_LENGTH + nameLength)
      .toString('utf8');
    entries.push(Object.freeze({
      name,
      size: uncompressedSize,
      kind: entryKind(externalAttributes, hostSystem, name),
    }));
    offset = next;
  }
  reject(offset === end, 'archive-central-directory-invalid');
  return entries;
}

/** Refuse any entry name that could place a file outside the directory we chose for it. */
export function assertSafeEntryName(name) {
  reject(typeof name === 'string' && name !== '', 'archive-entry-name-invalid');
  // eslint-disable-next-line no-control-regex
  reject(!/[\u0000-\u001f]/u.test(name), 'archive-entry-name-invalid');
  reject(!name.includes('\\'), 'archive-backslash-entry');
  reject(!name.startsWith('/') && !/^[A-Za-z]:/u.test(name), 'archive-absolute-entry');
  for (const segment of name.split('/')) {
    reject(segment !== '' && segment !== '.' && segment !== '..', 'archive-traversal-entry');
  }
  return name;
}

/**
 * Every archive entry must be a declared, uniquely named, regular file of the
 * declared length, with the manifest at the archive root. Checked in that order
 * so an unsafe or duplicated name is refused on its own terms rather than being
 * reported as merely "unexpected".
 */
export function assertArchiveMatchesSource(entries, source) {
  reject(Array.isArray(entries) && entries.length > 0, 'archive-empty');
  const expected = requireReleaseSourceShape(source, 'source-required');
  const seen = new Set();
  for (const entry of entries) {
    assertSafeEntryName(entry.name);
    reject(entry.kind !== 'symlink', 'archive-symlink-entry');
    reject(entry.kind === 'file', 'archive-nonregular-entry');
    reject(!seen.has(entry.name), 'archive-duplicate-entry');
    seen.add(entry.name);
  }
  const sizes = new Map(expected.assets.map((asset) => [asset.name, asset.size]));
  for (const entry of entries) reject(sizes.has(entry.name), 'archive-unexpected-entry');
  for (const asset of expected.assets) reject(seen.has(asset.name), 'archive-missing-entry');
  for (const entry of entries) reject(entry.size === sizes.get(entry.name), 'archive-size-mismatch');
  reject(seen.has('manifest.json'), 'archive-manifest-root-required');
  return entries;
}

/**
 * Prove an archive against a source tree.
 *
 * The archive hash is recomputed from the archive's own bytes, never read from
 * a record. The archive is then extracted -- into `extractDir` when that
 * directory does not yet exist, otherwise into a private temporary directory --
 * and the extracted tree is read back through the same complete-inventory
 * reader the source went through. When `extractDir` already exists it is ALSO
 * compared, so a previously extracted candidate is re-proved rather than
 * assumed.
 */
export function validateReleaseArchive(archive, source, options = {}) {
  reject(isObject(options), 'options-required');
  const archivePath = typeof archive === 'string'
    ? archive
    : (isObject(archive) && typeof archive.path === 'string' ? archive.path : null);
  reject(typeof archivePath === 'string' && archivePath.trim() !== '', 'archive-path-required');
  const expectedHash = isObject(archive) && archive.sha256 !== undefined ? archive.sha256 : options.sha256;

  const resolved = resolve(archivePath);
  let bytes;
  try {
    bytes = readFileSync(resolved);
  } catch (cause) {
    throw new ReleasePackageError('archive-unreadable', { cause });
  }
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (expectedHash !== undefined && expectedHash !== null) {
    reject(typeof expectedHash === 'string' && SHA256.test(expectedHash), 'archive-hash-invalid');
    reject(expectedHash === sha256, 'archive-hash-mismatch');
  }

  const expected = requireReleaseSourceShape(source, 'source-required');
  const entries = readArchiveEntries(bytes);
  assertArchiveMatchesSource(entries, expected);

  const inventory = expected.assets.map((asset) => asset.name);
  const target = typeof options.extractDir === 'string' && options.extractDir.trim() !== ''
    ? resolve(options.extractDir)
    : null;
  const reuse = target !== null && existsSync(target);
  const fresh = target !== null && !reuse ? target : mkdtempSync(join(tmpdir(), 'zhroma-release-verify-'));
  // The private temporary directory is ours to delete; a caller-owned
  // extraction root that we populated for them is not.
  const ownsFresh = fresh !== target;
  try {
    mkdirSync(fresh, { recursive: true });
    reject(readdirSync(fresh).length === 0, 'extract-directory-not-empty');
    // `-n` never overwrites: the destination is ours and empty, so an overwrite
    // attempt could only mean the archive named the same path twice.
    runTool('unzip', ['-qq', '-n', resolved, '-d', fresh]);
    compareReleaseSources(expected, readReleaseSource(fresh, { expected: inventory }));
    if (reuse) compareReleaseSources(expected, readReleaseSource(target, { expected: inventory }));
    return Object.freeze({ sha256, entries, extractedPath: reuse ? target : fresh });
  } finally {
    if (ownsFresh) rmSync(fresh, { recursive: true, force: true });
  }
}

/**
 * Read and re-prove an existing candidate at `outDir` against `source`.
 * Recomputes the archive hash and the extracted bytes; the record's own claims
 * are then checked against those recomputed facts, never trusted in their place.
 */
export function validateReleaseCandidate(options = {}) {
  reject(isObject(options), 'options-required');
  reject(typeof options.outDir === 'string' && options.outDir.trim() !== '', 'out-dir-required');
  const outDir = resolve(options.outDir);
  const expected = requireReleaseSourceShape(options.source, 'source-required');
  const version = options.version;
  const names = releaseNames(version);

  let text;
  try {
    text = readFileSync(join(outDir, names.candidate), 'utf8');
  } catch (cause) {
    throw new ReleasePackageError('candidate-unreadable', { cause });
  }
  requireUniqueJsonMembers(text);
  let record;
  try {
    record = JSON.parse(text);
  } catch (cause) {
    throw new ReleasePackageError('candidate-invalid-json', { cause });
  }
  reject(isObject(record), 'candidate-invalid-json');
  reject(record.schema_version === CANDIDATE_SCHEMA_VERSION, 'candidate-schema-unsupported');
  reject(record.version === version, 'candidate-version-mismatch');
  reject(isObject(record.zip) && record.zip.path === names.archive, 'candidate-archive-path-mismatch');
  reject(isObject(record.extracted) && record.extracted.path === names.extracted,
    'candidate-extracted-path-mismatch');
  compareReleaseSources(expected, requireReleaseSourceShape(record.source, 'candidate-source-invalid'));

  const validation = validateReleaseArchive(join(outDir, names.archive), expected,
    { extractDir: join(outDir, names.extracted) });
  reject(typeof record.zip.sha256 === 'string' && SHA256.test(record.zip.sha256),
    'candidate-archive-hash-invalid');
  reject(record.zip.sha256 === validation.sha256, 'candidate-archive-hash-mismatch');

  return Object.freeze({
    code: 'RELEASE_PACKAGE_OK',
    reused: true,
    version,
    outDir,
    archive: join(outDir, names.archive),
    extracted: join(outDir, names.extracted),
    candidatePath: join(outDir, names.candidate),
    candidate: record,
  });
}

/**
 * Build (or re-prove) a release candidate.
 *
 * Work happens in an exclusive temporary directory inside the output location
 * and is moved into place by rename, with the candidate record moved LAST -- an
 * interrupted run therefore leaves no complete-looking candidate behind. An
 * output location that already holds any part of a candidate is never
 * overwritten: it either validates against the requested source and is reused,
 * or the run fails with `output-conflict` and the existing evidence is left
 * exactly as it was found.
 */
export function packageRelease(options = {}) {
  reject(isObject(options), 'options-required');
  const sourceDir = resolve(String(options.sourceDir ?? DEFAULT_SOURCE_DIRECTORY));
  reject(typeof options.outDir === 'string' && options.outDir.trim() !== '', 'out-dir-required');
  const outDir = resolve(options.outDir);

  const realSource = realOf(sourceDir);
  const realOut = realOf(outDir);
  reject(!contains(realSource, realOut), 'out-dir-inside-source');
  reject(!contains(REPOSITORY_ROOT, realOut), 'out-dir-inside-repository');

  const source = readReleaseSource(sourceDir);
  const version = readManifestVersion(sourceDir);
  const names = releaseNames(version);

  mkdirSync(outDir, { recursive: true });
  const occupied = [names.archive, names.extracted, names.candidate]
    .some((name) => existsSync(join(outDir, name)));
  if (occupied) {
    try {
      return validateReleaseCandidate({ outDir, version, source });
    } catch (cause) {
      throw new ReleasePackageError('output-conflict', { cause });
    }
  }

  const work = mkdtempSync(join(outDir, '.zhroma-release-work-'));
  try {
    const archivePath = join(work, names.archive);
    // Explicit relative names from the source root: the manifest lands at the
    // archive root, and no directory entry or undeclared file can ride along.
    runTool('zip', ['-X', '-q', archivePath, ...source.assets.map((asset) => asset.name)], { cwd: sourceDir });
    const validation = validateReleaseArchive(archivePath, source, { extractDir: join(work, names.extracted) });
    const candidate = {
      schema_version: CANDIDATE_SCHEMA_VERSION,
      version,
      source: {
        assets: source.assets.map((asset) => ({ name: asset.name, size: asset.size, sha256: asset.sha256 })),
        digest: source.digest,
      },
      zip: { path: names.archive, sha256: validation.sha256 },
      extracted: { path: names.extracted },
    };
    writeFileSync(join(work, names.candidate), `${JSON.stringify(candidate, null, 2)}\n`);
    renameSync(join(work, names.extracted), join(outDir, names.extracted));
    renameSync(archivePath, join(outDir, names.archive));
    // Last, so a run interrupted mid-move cannot look finished.
    renameSync(join(work, names.candidate), join(outDir, names.candidate));
    return Object.freeze({
      code: 'RELEASE_PACKAGE_OK',
      reused: false,
      version,
      outDir,
      archive: join(outDir, names.archive),
      extracted: join(outDir, names.extracted),
      candidatePath: join(outDir, names.candidate),
      candidate,
    });
  } finally {
    // Only the directory this run created is ever removed.
    rmSync(work, { recursive: true, force: true });
  }
}

function parseArgs(argv) {
  reject(Array.isArray(argv), 'unknown-argument');
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const split = typeof argument === 'string' && argument.startsWith('--') ? argument.indexOf('=') : -1;
    const flag = split === -1 ? argument : argument.slice(0, split);
    const inline = split === -1 ? null : argument.slice(split + 1);
    const take = () => {
      const value = inline ?? argv[index += 1];
      reject(typeof value === 'string' && value.trim() !== '', 'argument-value-required');
      return value;
    };
    if (flag === '--out-dir') options.outDir = take();
    else if (flag === '--source-dir') options.sourceDir = take();
    else throw new ReleasePackageError('unknown-argument');
  }
  reject(typeof options.outDir === 'string', 'out-dir-required');
  return options;
}

export async function runCli(argv = process.argv.slice(2)) {
  try {
    const result = packageRelease(parseArgs(argv));
    process.stdout.write(
      `RELEASE_PACKAGE_OK ${result.version} ${result.candidate.zip.sha256}${result.reused ? ' reused' : ''}\n`,
    );
  } catch (error) {
    const named = error?.name === 'ReleasePackageError' || error?.name === 'ReleaseSourceError';
    const code = named && ERROR_CODE.test(error.code ?? '') ? error.code : 'unexpected-error';
    process.stderr.write(`RELEASE_REJECTED ${code}\n`);
    if (process.env.ZHROMA_RELEASE_DEBUG === '1') {
      process.stderr.write(`${error?.cause?.stack ?? error?.stack ?? String(error)}\n`);
    }
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
