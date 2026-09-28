// Release source inventory (05-01). Developer tooling only: nothing here ships
// inside the extension, and nothing here is imported by extension runtime code.
//
// The single question this module answers is "which exact bytes are we about to
// publish?". It enumerates the complete shipped tree, refuses anything that is
// not a declared regular file, and reduces the result to one aggregate digest
// using the convention the Phase 4 acceptance record already established.
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export class ReleaseSourceError extends Error {
  constructor(code, options) {
    super(code, options);
    this.name = 'ReleaseSourceError';
    this.code = code;
  }
}

/**
 * The complete packaged inventory, pinned explicitly rather than discovered.
 * A discovered inventory cannot distinguish "a new asset was shipped" from
 * "a stray file leaked into the package"; an explicit one must be edited, in a
 * reviewed commit, before a new byte can reach the store.
 */
export const RELEASE_FILES = Object.freeze([
  'background.js',
  'content.js',
  // 05-03: the store's required 128px brand icon. It is a packaged byte, so it
  // belongs here in the same reviewed commit that added it — and it is
  // deliberately NOT one of the five diagnostic status icons the worker
  // projects, which keep their own meanings unchanged.
  'icons/brand.png',
  'icons/missing.png',
  'icons/neutral.png',
  'icons/off.png',
  'icons/unreadable.png',
  'icons/working.png',
  'manifest.json',
  // 07-03: the static options stub (D-18). The manifest's options_ui names it,
  // so it is a packaged byte. It has no script, so nothing else joins it.
  'options.html',
  'popup.html',
  'popup.js',
  // 07-03: the shared settings module (D-13). It is listed first in the
  // content script list and imported first by the worker, so it ships.
  'zhroma-settings.js',
  'zhroma.css',
]);

/** The prefix the aggregate digest lines carry, independent of where the tree is read from. */
export const DIGEST_PREFIX = 'extension/';

export const REPOSITORY_ROOT = realpathSync(fileURLToPath(new URL('..', import.meta.url)));
export const DEFAULT_SOURCE_DIRECTORY = join(REPOSITORY_ROOT, 'extension');

const SHA256 = /^[0-9a-f]{64}$/u;

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

function reject(condition, code, options) {
  if (!condition) throw new ReleaseSourceError(code, options);
}

/**
 * Every regular file under `root`, recursively, as sorted relative names.
 * A symlink is refused rather than followed: following one would let a file
 * outside the reviewed tree be packaged under a reviewed name.
 */
function enumerate(root, relativePrefix = '') {
  const directory = relativePrefix === '' ? root : join(root, relativePrefix);
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch (cause) {
    throw new ReleaseSourceError('source-directory-unreadable', { cause });
  }
  const found = [];
  for (const entry of entries) {
    const name = relativePrefix === '' ? entry.name : `${relativePrefix}/${entry.name}`;
    reject(!entry.isSymbolicLink(), 'symlink-entry');
    if (entry.isDirectory()) {
      found.push(...enumerate(root, name));
      continue;
    }
    reject(entry.isFile(), 'nonregular-entry');
    found.push(name);
  }
  return found;
}

/**
 * Read a complete release source tree.
 *
 * Returns `{ directory, assets, digest }` where `assets` is sorted by relative
 * name and carries the exact `size` and `sha256` of every file. Ordering is
 * derived from the names, never from filesystem enumeration order, so the same
 * bytes always reduce to the same digest.
 */
export function readReleaseSource(directory = DEFAULT_SOURCE_DIRECTORY, options = {}) {
  reject(isObject(options), 'options-required');
  reject(typeof directory === 'string' && directory.trim() !== '', 'source-directory-required');
  const expected = options.expected ?? RELEASE_FILES;
  reject(Array.isArray(expected) && expected.length > 0
    && expected.every((name) => typeof name === 'string' && name !== ''), 'expected-inventory-required');

  const root = resolve(directory);
  let rootStats;
  try {
    rootStats = lstatSync(root);
  } catch (cause) {
    throw new ReleaseSourceError('source-directory-required', { cause });
  }
  reject(rootStats.isDirectory(), 'source-directory-required');

  const found = enumerate(root).sort();
  const expectedNames = [...expected].sort();
  const expectedSet = new Set(expectedNames);
  reject(expectedSet.size === expectedNames.length, 'expected-inventory-required');
  for (const name of found) reject(expectedSet.has(name), 'unexpected-asset');
  const foundSet = new Set(found);
  for (const name of expectedNames) reject(foundSet.has(name), 'missing-asset');

  const assets = found.map((name) => {
    const path = join(root, name);
    const stats = lstatSync(path);
    // Defence in depth: the directory walk already refused non-files, and the
    // file it hands over here must still be the same regular file.
    reject(stats.isFile(), 'nonregular-entry');
    const bytes = readFileSync(path);
    reject(bytes.length === stats.size, 'asset-size-unstable');
    return Object.freeze({
      name,
      size: stats.size,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
  });

  return Object.freeze({ directory: root, assets: Object.freeze(assets), digest: digestOf(assets) });
}

/** The aggregate digest: per-file hash, two spaces, packaged relative name, newline. */
export function digestOf(assets) {
  return createHash('sha256').update(assets
    .map((asset) => `${asset.sha256}  ${DIGEST_PREFIX}${asset.name}\n`).join('')).digest('hex');
}

/**
 * Validate the shape of a source record that did not come from `readReleaseSource`
 * — a parsed candidate record, for instance. Null, empty and partially populated
 * records are refused rather than treated as "nothing differs".
 */
export function requireReleaseSourceShape(source, code = 'source-required') {
  reject(isObject(source), code);
  reject(Array.isArray(source.assets) && source.assets.length > 0, code);
  reject(typeof source.digest === 'string' && SHA256.test(source.digest), code);
  const names = new Set();
  for (const asset of source.assets) {
    reject(isObject(asset), code);
    reject(typeof asset.name === 'string' && asset.name !== '', code);
    reject(Number.isSafeInteger(asset.size) && asset.size >= 0, code);
    reject(typeof asset.sha256 === 'string' && SHA256.test(asset.sha256), code);
    reject(!names.has(asset.name), 'duplicate-asset');
    names.add(asset.name);
  }
  reject(source.digest === digestOf(source.assets), 'source-digest-unbound');
  return source;
}

/**
 * Compare two source records field by field.
 *
 * Identity is per name: two files with identical bytes under different names are
 * two different inventory entries, and a matching aggregate digest is checked
 * last, never instead of the per-file comparison.
 */
export function compareReleaseSources(expected, actual) {
  const left = requireReleaseSourceShape(expected, 'expected-source-required');
  const right = requireReleaseSourceShape(actual, 'actual-source-required');
  reject(left.assets.length === right.assets.length, 'asset-count-mismatch');
  for (let index = 0; index < left.assets.length; index += 1) {
    const a = left.assets[index];
    const b = right.assets[index];
    reject(a.name === b.name, 'asset-name-mismatch');
    reject(a.size === b.size, 'asset-size-mismatch');
    reject(a.sha256 === b.sha256, 'asset-hash-mismatch');
  }
  reject(left.digest === right.digest, 'source-digest-mismatch');
  return true;
}
