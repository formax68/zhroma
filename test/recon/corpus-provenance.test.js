import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Window } from 'happy-dom';
import { afterEach, expect, test } from 'vitest';
import { sanitizeFixture, sha256 } from '../../scripts/sanitize-fixture.js';
import { REQUIRED_SCENARIOS } from '../../scripts/fixture-contract.js';
import { validateSanitizedOutput, PRIORITY_LABELS, PRIORITY_HEADER_LABEL } from '../../scripts/sanitized-output-contract.js';

const fixtureRoot = new URL('../fixtures/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', fixtureRoot), 'utf8'));
const directories = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function roundTrip(bytes) {
  const directory = await mkdtemp(join(tmpdir(), 'zhroma-parity-'));
  directories.push(directory);
  const inputPath = join(directory, 'input.html');
  const outputPath = join(directory, 'output.html');
  const denylistPath = join(directory, 'denylist.txt');
  await writeFile(inputPath, bytes);
  await writeFile(denylistPath, '__synthetic_parity_token_not_a_private_denylist__');
  const result = await sanitizeFixture({ inputPath, outputPath, denylistPath });
  return { ...result, output: await readFile(outputPath) };
}

test('provenance coverage includes exactly the admitted scenario matrix', () => {
  expect(manifest.fixtures.map((entry) => entry.scenario).sort()).toEqual([...REQUIRED_SCENARIOS].sort());
});

for (const entry of manifest.fixtures) {
  test(`${entry.scenario}: committed bytes satisfy the shared grammar and provenance declaration`, async () => {
    const bytes = await readFile(new URL(entry.file, fixtureRoot));
    expect(validateSanitizedOutput(bytes.toString())).toMatchObject({ tableCount: 1 });
    expect(sha256(bytes)).toBe(entry.sha256);
    expect(entry.sanitizationMethod).toMatch(/Re-admitted.*previously sanitized repository bytes/);
    expect(entry.sanitizationMethod).toContain('not a fresh live capture');
  });

  test(`${entry.scenario}: re-sanitization preserves exact bytes and manifest hash`, async () => {
    const bytes = await readFile(new URL(entry.file, fixtureRoot));
    const result = await roundTrip(bytes);
    expect(result.output).toEqual(bytes);
    expect(result.sha256).toBe(entry.sha256);
  });

  test(`${entry.scenario}: Priority header and values match the declared presence or absence`, async () => {
    const bytes = await readFile(new URL(entry.file, fixtureRoot));
    const isolated = new Window({ settings: { enableJavaScriptEvaluation: false, disableJavaScriptFileLoading: true, disableCSSFileLoading: true, enableImageFileLoading: false } });
    const document = new isolated.DOMParser().parseFromString(bytes.toString(), 'text/html');
    const header = document.querySelector(entry.selectors.headerRow);
    if (entry.structure.priorityIndex === null) {
      expect(entry.priorityHeaderIndex).toBeNull();
      expect(header.children).toHaveLength(6);
      expect([...header.children].some((cell) => cell.textContent.trim() === PRIORITY_HEADER_LABEL)).toBe(false);
      expect([...document.querySelectorAll('*')].some((node) => !node.childElementCount && PRIORITY_LABELS.has(node.textContent.trim()))).toBe(false);
    } else {
      expect(entry.priorityHeaderIndex).toBe(6);
      expect(header.children[6].textContent.trim()).toBe(PRIORITY_HEADER_LABEL);
      if (entry.scenario === 'priority-present-ungrouped') {
        expect([...document.querySelectorAll(entry.selectors.ticketRow)].map((row) => row.children[6].textContent.trim())).toEqual([...PRIORITY_LABELS]);
      }
    }
  });
}

test('a mutated stand-in fails exact parity and hash agreement', async () => {
  const entry = manifest.fixtures[0];
  const bytes = await readFile(new URL(entry.file, fixtureRoot));
  const mutated = Buffer.from(bytes.toString().replace('TEXT-001', 'TEXT-001x'));
  const result = await roundTrip(mutated);
  expect(result.output).not.toEqual(mutated);
  expect(sha256(mutated)).not.toBe(entry.sha256);
});
