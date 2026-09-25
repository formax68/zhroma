import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { sanitizeFixture, sha256 } from '../../scripts/sanitize-fixture.js';
import { REQUIRED_SCENARIOS, validateRecon2Fixtures } from '../../scripts/fixture-contract.js';
import { validateRuleColumnOutput } from '../../scripts/rule-column-contract.js';

const fixtureRoot = join(process.cwd(), 'test', 'fixtures');
const manifestPath = join(fixtureRoot, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const directories = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function ruleRoundTrip(bytes, boundary) {
  const directory = await mkdtemp(join(tmpdir(), 'zhroma-recon2-parity-'));
  directories.push(directory);
  const inputPath = join(directory, 'input.html');
  const outputPath = join(directory, 'output.html');
  const denylistPath = join(directory, 'denylist.txt');
  await writeFile(inputPath, bytes);
  await writeFile(
    denylistPath,
    '__synthetic_parity_token_not_a_private_denylist__\nself: Zq Parity Selfform\n',
  );
  const result = await sanitizeFixture({ inputPath, outputPath, denylistPath, mode: 'rule-columns', boundary });
  return { ...result, output: await readFile(outputPath) };
}

test('the v1 corpus is untouched and the recon2 corpus validates beside it', async () => {
  expect(manifest.fixtures.map((entry) => entry.scenario).sort()).toEqual([...REQUIRED_SCENARIOS].sort());
  expect(manifest.recon2Fixtures === undefined || Array.isArray(manifest.recon2Fixtures)).toBe(true);
  await expect(validateRecon2Fixtures(manifestPath)).resolves.toMatchObject({
    recon2FixtureCount: (manifest.recon2Fixtures ?? []).length,
  });
});

test('every admitted recon2 fixture keeps its checksum, grammar and byte-identical rule-mode round trip', async () => {
  for (const entry of manifest.recon2Fixtures ?? []) {
    const bytes = await readFile(join(fixtureRoot, entry.file));
    expect(entry.sanitizerMode).toBe('rule-columns');
    expect(sha256(bytes)).toBe(entry.sha256);
    expect(validateRuleColumnOutput(bytes.toString('utf8'), { boundary: entry.boundaryKind }))
      .toMatchObject({ boundary: entry.boundaryKind });
    const result = await ruleRoundTrip(bytes, entry.boundaryKind);
    expect(result.output).toEqual(bytes);
    expect(result.sha256).toBe(entry.sha256);
  }
});
