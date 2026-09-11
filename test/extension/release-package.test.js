// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, test } from 'vitest';
import { RELEASE_FILES, compareReleaseSources, readReleaseSource } from '../../scripts/release-source.js';
import { packageRelease, validateReleaseArchive } from '../../scripts/package-release.js';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const extensionDirectory = join(repositoryRoot, 'extension');
const owned = [];

// Every temporary tree is created under the OS temporary root, never inside the
// repository: the packager refuses to write generated artifacts into Git source,
// and the tests must exercise it the way a maintainer really runs it.
function workspace(label) {
  const directory = mkdtempSync(join(tmpdir(), `zhroma-${label}-`));
  owned.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of owned.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function archiveNames(archive) {
  const listing = spawnSync('unzip', ['-Z1', archive], { encoding: 'utf8' });
  expect(listing.status).toBe(0);
  return listing.stdout.split('\n').filter(Boolean).sort();
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

// The tracer: a real ZIP built by the installed archiver from the real
// extension, extracted by the installed extractor into a directory that did
// not exist a moment ago, compared byte for byte. Nothing here is mocked, so
// nothing here can pass while the actual release path is broken.
test('packages the real extension into a release ZIP whose extracted bytes equal every source byte', () => {
  const out = workspace('round-trip');
  const result = packageRelease({ outDir: out });

  expect(result.code).toBe('RELEASE_PACKAGE_OK');
  expect(result.version).toBe('0.1.0');
  expect(readdirSync(out).sort()).toEqual(['candidate.json', 'zhroma-0.1.0', 'zhroma-0.1.0.zip']);

  const archive = join(out, 'zhroma-0.1.0.zip');
  expect(archiveNames(archive)).toEqual([...RELEASE_FILES].sort());
  expect(archiveNames(archive)).toContain('manifest.json');

  const extracted = join(out, 'zhroma-0.1.0');
  const source = readReleaseSource(extensionDirectory);
  expect(compareReleaseSources(source, readReleaseSource(extracted))).toBe(true);
  for (const name of RELEASE_FILES) {
    expect(readFileSync(join(extracted, name))).toEqual(readFileSync(join(extensionDirectory, name)));
  }
});

test('reads the complete eleven-file release source inventory with sizes, hashes and an aggregate digest', () => {
  const source = readReleaseSource(extensionDirectory);

  expect(source.assets.map((asset) => asset.name)).toEqual([...RELEASE_FILES].sort());
  expect(source.assets).toHaveLength(11);
  for (const asset of source.assets) {
    expect(asset.size).toBe(statSync(join(extensionDirectory, asset.name)).size);
    expect(asset.sha256).toBe(sha256File(join(extensionDirectory, asset.name)));
  }
  // The aggregate convention already used by the Phase 4 acceptance record:
  // per-file hash, two spaces, the packaged relative name, one newline.
  expect(source.digest).toBe(createHash('sha256').update(source.assets
    .map((asset) => `${asset.sha256}  extension/${asset.name}\n`).join('')).digest('hex'));
});

test('labels the release from the extension manifest version, never the development package version', () => {
  const out = workspace('version');
  const result = packageRelease({ outDir: out });

  expect(result.version).toBe(JSON.parse(readFileSync(join(extensionDirectory, 'manifest.json'), 'utf8')).version);
  expect(result.version).not.toBe(JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8')).version);
  expect(result.candidate.zip.path).toBe('zhroma-0.1.0.zip');
});

test('records the archive hash separately from the source digest and re-derives both on validation', () => {
  const out = workspace('candidate');
  const result = packageRelease({ outDir: out });
  const candidate = JSON.parse(readFileSync(join(out, 'candidate.json'), 'utf8'));

  expect(candidate.schema_version).toBe(1);
  expect(candidate.version).toBe('0.1.0');
  expect(candidate.source.digest).toMatch(/^[0-9a-f]{64}$/);
  expect(candidate.zip.sha256).toMatch(/^[0-9a-f]{64}$/);
  expect(candidate.zip.sha256).not.toBe(candidate.source.digest);
  expect(candidate.zip.sha256).toBe(sha256File(join(out, 'zhroma-0.1.0.zip')));
  expect(candidate.extracted.path).toBe('zhroma-0.1.0');
  expect(candidate.source.assets.map((asset) => asset.name)).toEqual([...RELEASE_FILES].sort());

  const validation = validateReleaseArchive(join(out, 'zhroma-0.1.0.zip'), readReleaseSource(extensionDirectory));
  expect(validation.sha256).toBe(candidate.zip.sha256);
  expect(validation.entries).toHaveLength(11);
});

// Two archives of identical source bytes can differ as archives. A matching
// source digest must therefore never approve a different ZIP.
test('an equal source digest does not approve a different archive', () => {
  const restamped = join(workspace('restamped'), 'extension');
  cpSync(extensionDirectory, restamped, { recursive: true });
  const stamp = new Date('2020-02-02T02:02:02Z');
  for (const name of RELEASE_FILES) utimesSync(join(restamped, name), stamp, stamp);

  const first = packageRelease({ outDir: workspace('digest-a') });
  const second = packageRelease({ sourceDir: restamped, outDir: workspace('digest-b') });

  expect(second.candidate.source.digest).toBe(first.candidate.source.digest);
  expect(second.candidate.zip.sha256).not.toBe(first.candidate.zip.sha256);
  expect(() => validateReleaseArchive({ path: first.archive, sha256: second.candidate.zip.sha256 },
    readReleaseSource(extensionDirectory))).toThrow(/archive-hash-mismatch/);
});

test('refuses to write generated artifacts into the extension source or the repository tree', () => {
  expect(() => packageRelease({ outDir: join(extensionDirectory, 'release') })).toThrow(/out-dir-inside-source/);
  expect(() => packageRelease({ outDir: join(repositoryRoot, 'release') })).toThrow(/out-dir-inside-repository/);
  expect(() => packageRelease({})).toThrow(/out-dir-required/);
  // An import must not be able to produce an archive as a side effect.
  expect(readdirSync(extensionDirectory).sort()).toEqual(['background.js', 'content.js', 'icons', 'manifest.json',
    'popup.html', 'popup.js', 'zhroma.css']);
});

test('reuses an output location only when its existing contents independently validate', () => {
  const out = workspace('reuse');
  const first = packageRelease({ outDir: out });
  const reused = packageRelease({ outDir: out });

  expect(reused.reused).toBe(true);
  expect(reused.candidate.zip.sha256).toBe(first.candidate.zip.sha256);

  writeFileSync(join(out, 'zhroma-0.1.0', 'popup.js'), 'tampered');
  expect(() => packageRelease({ outDir: out })).toThrow(/output-conflict/);
  // The refusal must leave the existing evidence exactly as it was found.
  expect(readFileSync(join(out, 'zhroma-0.1.0', 'popup.js'), 'utf8')).toBe('tampered');
  expect(sha256File(join(out, 'zhroma-0.1.0.zip'))).toBe(first.candidate.zip.sha256);
});

test('treats an interrupted output as a conflict rather than a finished candidate', () => {
  const out = workspace('interrupted');
  const complete = packageRelease({ outDir: out });
  rmSync(join(out, 'candidate.json'));

  expect(() => packageRelease({ outDir: out })).toThrow(/output-conflict/);
  expect(sha256File(join(out, 'zhroma-0.1.0.zip'))).toBe(complete.candidate.zip.sha256);

  const partial = workspace('partial');
  mkdirSync(join(partial, 'zhroma-0.1.0'), { recursive: true });
  expect(() => packageRelease({ outDir: partial })).toThrow(/output-conflict/);
});
