// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, test } from 'vitest';
import { RELEASE_FILES, compareReleaseSources, digestOf, readReleaseSource } from '../../scripts/release-source.js';
import { packageRelease, readArchiveEntries, readManifestVersion, validateReleaseArchive } from '../../scripts/package-release.js';

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
  // 07-03: fourteen packaged files since D-13 (zhroma-settings.js) and D-18 (options.html).
  expect(source.assets).toHaveLength(14);
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
  expect(validation.entries).toHaveLength(14);
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
    'options.html', 'popup.html', 'popup.js', 'zhroma-settings.js', 'zhroma.css']);
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

// --- Task 2: the controls that must fail closed -----------------------------
// Every case below starts from a real archive or a real source tree and breaks
// exactly one thing. A happy-path round trip that cannot tell these apart is
// not evidence of anything.

function runZip(args, cwd) {
  const result = spawnSync('zip', args, { cwd, encoding: 'utf8' });
  expect(result.status).toBe(0);
}

function sourceCopy(label) {
  const directory = join(workspace(label), 'extension');
  cpSync(extensionDirectory, directory, { recursive: true });
  return directory;
}

// A single-entry archive whose stored name is rewritten in place. The
// placeholder is the same length as the hostile name, so both the local header
// and the central directory copy are replaced without moving any offset.
// Rewrite a stored entry name in place. Both copies of the name -- local
// header and central directory -- are the same length, so no offset moves.
function rewriteStoredName(archive, from, to) {
  const bytes = readFileSync(archive);
  const needle = Buffer.from(from, 'utf8');
  const replacement = Buffer.from(to, 'utf8');
  expect(replacement.length).toBe(needle.length);
  let replaced = 0;
  for (let index = 0; index <= bytes.length - needle.length; index += 1) {
    if (bytes.subarray(index, index + needle.length).equals(needle)) {
      replacement.copy(bytes, index);
      replaced += 1;
      index += needle.length - 1;
    }
  }
  expect(replaced).toBe(2);
  writeFileSync(archive, bytes);
  return archive;
}

function craftedArchive(label, entryName) {
  const directory = workspace(label);
  const placeholder = 'p'.repeat(entryName.length);
  writeFileSync(join(directory, placeholder), '{}');
  const archive = join(directory, 'crafted.zip');
  runZip(['-X', '-q', archive, placeholder], directory);
  return rewriteStoredName(archive, placeholder, entryName);
}

test('refuses an archive larger than the declared inventory could justify before reading it', () => {
  const source = readReleaseSource(extensionDirectory);
  const ceiling = source.assets.reduce((total, asset) => total + asset.size, 0) + 1024 * 1024;
  const oversized = join(workspace('oversized'), 'huge.zip');
  writeFileSync(oversized, Buffer.alloc(ceiling + 1));

  expect(() => validateReleaseArchive(oversized, source)).toThrow(/archive-too-large/);

  const honest = packageRelease({ outDir: workspace('oversized-out') });
  expect(statSync(honest.archive).size).toBeLessThanOrEqual(ceiling);
});

test('treats a leftover exclusive work directory as an occupied output', () => {
  const out = workspace('stale-work');
  const stale = join(out, '.zhroma-release-work-abc123');
  mkdirSync(stale, { recursive: true });

  expect(() => packageRelease({ outDir: out })).toThrow(/output-conflict/);
  // Only directories this run created are ever removed.
  expect(readdirSync(out)).toEqual(['.zhroma-release-work-abc123']);
});

test('rejects a changed asset byte even when every length is identical', () => {
  const changed = sourceCopy('changed-png');
  const icon = join(changed, 'icons/neutral.png');
  const bytes = readFileSync(icon);
  bytes[bytes.length - 1] ^= 0xff;
  writeFileSync(icon, bytes);

  const honest = packageRelease({ outDir: workspace('changed-png-out') });
  const tampered = readReleaseSource(changed);
  expect(tampered.assets.find((a) => a.name === 'icons/neutral.png').size)
    .toBe(readReleaseSource(extensionDirectory).assets.find((a) => a.name === 'icons/neutral.png').size);
  expect(() => validateReleaseArchive(honest.archive, tampered)).toThrow(/asset-hash-mismatch/);
});

test('rejects an extra nested file, a missing asset, an empty tree and a manifest-only tree', () => {
  const extra = sourceCopy('extra');
  mkdirSync(join(extra, 'vendor'), { recursive: true });
  writeFileSync(join(extra, 'vendor/extra.js'), '');
  expect(() => readReleaseSource(extra)).toThrow(/unexpected-asset/);

  const incomplete = sourceCopy('incomplete');
  rmSync(join(incomplete, 'popup.js'));
  expect(() => readReleaseSource(incomplete)).toThrow(/missing-asset/);

  expect(() => readReleaseSource(workspace('empty-tree'))).toThrow(/missing-asset/);

  const manifestOnly = join(workspace('manifest-only'), 'extension');
  mkdirSync(manifestOnly, { recursive: true });
  cpSync(join(extensionDirectory, 'manifest.json'), join(manifestOnly, 'manifest.json'));
  expect(() => readReleaseSource(manifestOnly)).toThrow(/missing-asset/);
});

test('refuses to follow a symlink in the source tree', () => {
  const linked = sourceCopy('symlink-source');
  rmSync(join(linked, 'popup.js'));
  symlinkSync(join(extensionDirectory, 'popup.js'), join(linked, 'popup.js'));

  expect(() => readReleaseSource(linked)).toThrow(/symlink-entry/);
});

test('refuses a symlink entry inside an archive', () => {
  const directory = workspace('symlink-archive');
  const tree = join(directory, 'extension');
  cpSync(extensionDirectory, tree, { recursive: true });
  rmSync(join(tree, 'popup.js'));
  symlinkSync('../../../../etc/hosts', join(tree, 'popup.js'));
  const archive = join(directory, 'symlink.zip');
  runZip(['-X', '-q', '--symlinks', archive, ...RELEASE_FILES], tree);

  expect(() => validateReleaseArchive(archive, readReleaseSource(extensionDirectory)))
    .toThrow(/archive-symlink-entry/);
});

test.each([
  ['../escape.json', 'archive-traversal-entry'],
  ['/etc/rogue.jsn', 'archive-absolute-entry'],
  ['icons\\rogue.png', 'archive-backslash-entry'],
])('refuses the hostile entry name %s and writes nothing', (entryName, code) => {
  const archive = craftedArchive(`hostile-${code}`, entryName);
  const target = join(workspace(`hostile-${code}-out`), 'extracted');

  expect(() => validateReleaseArchive(archive, readReleaseSource(extensionDirectory), { extractDir: target }))
    .toThrow(new RegExp(code));
  expect(existsSync(target)).toBe(false);
});

// The archiver refuses to store one name twice, so the duplicate has to be
// forged the way a hostile uploader would: rewrite the stored name afterwards.
test('refuses duplicate entry names', () => {
  const directory = workspace('duplicate');
  writeFileSync(join(directory, 'first.json'), '{}');
  writeFileSync(join(directory, 'secnd.json'), '{}');
  const archive = join(directory, 'duplicate.zip');
  runZip(['-X', '-q', archive, 'first.json', 'secnd.json'], directory);
  rewriteStoredName(archive, 'secnd.json', 'first.json');

  expect(readArchiveEntries(readFileSync(archive)).map((entry) => entry.name))
    .toEqual(['first.json', 'first.json']);
  expect(() => validateReleaseArchive(archive, readReleaseSource(extensionDirectory)))
    .toThrow(/archive-duplicate-entry/);
});

test('refuses an archive packaged from the wrong root or carrying directory entries', () => {
  const source = readReleaseSource(extensionDirectory);

  const nested = workspace('wrong-root');
  cpSync(extensionDirectory, join(nested, 'extension'), { recursive: true });
  const wrongRoot = join(nested, 'wrong-root.zip');
  runZip(['-X', '-q', wrongRoot, ...RELEASE_FILES.map((name) => `extension/${name}`)], nested);
  expect(() => validateReleaseArchive(wrongRoot, source)).toThrow(/archive-unexpected-entry/);

  const directoryEntries = workspace('directory-entries');
  const tree = join(directoryEntries, 'extension');
  cpSync(extensionDirectory, tree, { recursive: true });
  const withDirectories = join(directoryEntries, 'directories.zip');
  runZip(['-X', '-q', '-r', withDirectories, 'icons', 'background.js', 'content.js', 'manifest.json',
    'options.html', 'popup.html', 'popup.js', 'zhroma-settings.js', 'zhroma.css'], tree);
  expect(() => validateReleaseArchive(withDirectories, source)).toThrow(/archive-nonregular-entry/);
});

test('refuses a stale archive held against a changed manifest', () => {
  const honest = packageRelease({ outDir: workspace('stale-out') });
  const changed = sourceCopy('stale-source');
  const manifest = JSON.parse(readFileSync(join(changed, 'manifest.json'), 'utf8'));
  manifest.version = '0.2.0';
  writeFileSync(join(changed, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  expect(readManifestVersion(changed)).toBe('0.2.0');
  expect(() => validateReleaseArchive(honest.archive, readReleaseSource(changed)))
    .toThrow(/archive-size-mismatch|asset-hash-mismatch/);
});

test('refuses null, empty and partially populated source records', () => {
  const source = readReleaseSource(extensionDirectory);
  const honest = packageRelease({ outDir: workspace('null-inputs') });

  expect(() => compareReleaseSources(null, source)).toThrow(/expected-source-required/);
  expect(() => compareReleaseSources(source, null)).toThrow(/actual-source-required/);
  expect(() => compareReleaseSources(source, { assets: [], digest: source.digest }))
    .toThrow(/actual-source-required/);
  expect(() => compareReleaseSources(source, { assets: source.assets })).toThrow(/actual-source-required/);
  // A digest that does not follow from the assets it claims to summarise.
  expect(() => validateReleaseArchive(honest.archive, { assets: source.assets, digest: '0'.repeat(64) }))
    .toThrow(/source-digest-unbound/);
  expect(() => validateReleaseArchive(null, source)).toThrow(/archive-path-required/);
  expect(() => validateReleaseArchive(honest.archive, null)).toThrow(/source-required/);
});

test('keeps identically-hashed files under different names distinct', () => {
  const sha256 = createHash('sha256').update('{}').digest('hex');
  const build = (names) => {
    const assets = names.map((name) => ({ name, size: 2, sha256 }));
    return { assets, digest: digestOf(assets) };
  };

  expect(() => compareReleaseSources(build(['a.js', 'b.js']), build(['b.js', 'a.js'])))
    .toThrow(/asset-name-mismatch/);
  expect(build(['a.js', 'b.js']).digest).not.toBe(build(['b.js', 'a.js']).digest);
});

test('derives an identical inventory regardless of filesystem discovery order', () => {
  const forward = join(workspace('order-forward'), 'extension');
  const reverse = join(workspace('order-reverse'), 'extension');
  for (const directory of [forward, reverse]) mkdirSync(join(directory, 'icons'), { recursive: true });
  for (const name of RELEASE_FILES) cpSync(join(extensionDirectory, name), join(forward, name));
  for (const name of [...RELEASE_FILES].reverse()) cpSync(join(extensionDirectory, name), join(reverse, name));

  expect(readReleaseSource(forward).assets).toEqual(readReleaseSource(reverse).assets);
  expect(readReleaseSource(forward).digest).toBe(readReleaseSource(extensionDirectory).digest);
});

test('reports a finite rejection code without echoing any packaged bytes', () => {
  const broken = sourceCopy('diagnostics');
  writeFileSync(join(broken, 'vendor.js'), 'SECRET-TICKET-SUBJECT');
  const result = spawnSync(process.execPath, [join(repositoryRoot, 'scripts/package-release.js'),
    '--source-dir', broken, '--out-dir', join(workspace('diagnostics-out'), 'candidate')], { encoding: 'utf8' });

  expect(result.status).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr).toBe('RELEASE_REJECTED unexpected-asset\n');
  expect(result.stderr).not.toContain('SECRET');
});
