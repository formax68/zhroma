import { createHash } from 'node:crypto';
import {
  access,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, test, vi } from 'vitest';
import { DOMParser } from 'happy-dom';

import {
  REQUIRED_SCENARIOS,
  validateFixtureManifest,
} from '../../scripts/fixture-contract.js';
import {
  SensitiveFixtureError,
} from '../../scripts/sensitive-patterns.js';

const ADMISSION_DENYLIST = Object.freeze([
  '__private_capture_values_were_removed_before_admission__',
]);
const EXPECTED_PRIORITIES = Object.freeze(['Urgent', 'High', 'Normal', 'Low']);
const temporaryDirectories = [];

function priorityPresentFixture() {
  return `<div data-test-id="table-container"><table data-test-id="ticket-table" role="table"><thead><tr data-test-id="header-row"><th data-test-id="header-cell">TEXT-001</th></tr></thead><tbody>${EXPECTED_PRIORITIES.map((priority) => `<tr data-test-id="ticket-row"><td data-test-id="priority-cell">${priority}</td></tr>`).join('')}</tbody></table></div>`;
}

function priorityAbsentFixture() {
  return '<div data-test-id="table-container"><table data-test-id="ticket-table" role="table"><thead><tr data-test-id="header-row"><th data-test-id="header-cell">TEXT-001</th></tr></thead><tbody><tr data-test-id="ticket-row"><td>TEXT-002</td></tr></tbody></table></div>';
}

function groupedLongFixture() {
  return '<div data-test-id="table-container" role="region"><table data-test-id="ticket-table" role="table"><thead><tr data-test-id="header-row"><th data-test-id="header-cell">TEXT-001</th></tr></thead><tbody><tr data-test-id="group-row"><th>TEXT-002</th></tr><tr data-test-id="ticket-row"><td data-test-id="priority-cell">Urgent</td></tr></tbody></table></div>';
}

function assertionsFor(scenario) {
  if (scenario === 'priority-present-ungrouped') {
    return [{
      kind: 'exact-text-values',
      purpose: 'priority-values',
      selector: '[data-test-id="priority-cell"]',
      values: [...EXPECTED_PRIORITIES],
    }];
  }
  if (scenario === 'priority-absent') {
    return [{
      kind: 'selector-absent',
      purpose: 'priority-column-absent',
      selector: '[data-test-id="priority-header"]',
    }];
  }
  return [
    {
      kind: 'selector-present',
      purpose: 'group-row',
      selector: '[data-test-id="group-row"]',
    },
    {
      kind: 'selector-present',
      purpose: 'duplicate-or-sticky-header',
      selector: '[data-test-id="ticket-table"]',
    },
    {
      kind: 'selector-present',
      purpose: 'scroll-container',
      selector: '[data-test-id="table-container"]',
    },
  ];
}

async function createCorpus() {
  const directory = await mkdtemp(join(tmpdir(), 'zhroma-corpus-'));
  temporaryDirectories.push(directory);

  const scenarios = [
    ['priority-present-ungrouped', 'priority-present.html', priorityPresentFixture()],
    ['priority-absent', 'priority-absent.html', priorityAbsentFixture()],
    ['grouped-long', 'grouped-long.html', groupedLongFixture()],
  ];
  const fixtures = [];

  for (const [scenario, file, markup] of scenarios) {
    await writeFile(join(directory, file), markup, 'utf8');
    fixtures.push({
      scenario,
      captureDate: '2026-09-03',
      workspace: {
        shell: 'current Agent Workspace',
        plan: 'unknown/not shared',
      },
      domBoundary: 'nearest complete table container',
      sanitizationMethod: 'scripts/sanitize-fixture.js',
      file,
      sha256: createHash('sha256').update(Buffer.from(markup)).digest('hex'),
      selectors: {
        ticketTable: '[data-test-id="ticket-table"]',
        headerRow: '[data-test-id="header-row"]',
        headerCell: '[data-test-id="header-cell"]',
        ticketRow: '[data-test-id="ticket-row"]',
        groupRow: '[data-test-id="group-row"]',
        scrollContainer: '[data-test-id="table-container"]',
      },
      structure: {
        headerCellCount: 1,
        ticketRowCount: scenario === 'priority-present-ungrouped' ? 4 : 1,
        ticketRowWidths: scenario === 'priority-present-ungrouped'
          ? [1, 1, 1, 1]
          : [1],
        groupRowCount: scenario === 'grouped-long' ? 1 : 0,
        groupRowPositions: scenario === 'grouped-long' ? [0] : [],
        priorityIndex: scenario === 'priority-absent' ? null : 0,
        stickyHeaderRelationship: 'same-table',
      },
      assertions: assertionsFor(scenario),
    });
  }

  const manifestPath = join(directory, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify({ fixtures }, null, 2), 'utf8');
  return { directory, manifestPath, fixtures };
}

async function rewriteManifest(manifestPath, mutate) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  mutate(manifest);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(temporaryDirectories.splice(0).map((directory) => (
    rm(directory, { recursive: true, force: true })
  )));
});

describe('fixture corpus contract', () => {
  test('normalizes a canonical generic-rule hit and scans before any detached parse', async () => {
    const corpus = await createCorpus();
    // Kelvin sign canonically decomposes to ASCII K. No new generic rule is needed.
    const unsafe = '<div>\u212a@example.invalid</div>';
    await writeFile(join(corpus.directory, corpus.fixtures[0].file), unsafe, 'utf8');
    await rewriteManifest(corpus.manifestPath, (manifest) => {
      manifest.fixtures[0].sha256 = createHash('sha256').update(unsafe).digest('hex');
    });
    const parseSpy = vi.spyOn(DOMParser.prototype, 'parseFromString');
    await expect(validateFixtureManifest(corpus.manifestPath)).rejects.toMatchObject({
      name: 'SensitiveFixtureError',
      findings: [{ category: 'email', code: 'email-address' }],
    });
    expect(parseSpy).not.toHaveBeenCalled();
  });

  test('validates exact bytes, provenance, selectors, and all scenario invariants', async () => {
    const corpus = await createCorpus();
    const activeDocumentMarkup = document.documentElement.outerHTML;

    await expect(validateFixtureManifest(corpus.manifestPath, {
      requireCompleteScenarioMatrix: true,
    })).resolves.toEqual({
      fixtureCount: 3,
      scenarios: [...REQUIRED_SCENARIOS],
    });

    expect(document.documentElement.outerHTML).toBe(activeDocumentMarkup);
  });

  test('rejects an empty manifest instead of passing vacuously', async () => {
    const corpus = await createCorpus();
    await writeFile(corpus.manifestPath, '{"fixtures":[]}', 'utf8');

    await expect(validateFixtureManifest(corpus.manifestPath)).rejects.toMatchObject({
      code: 'manifest-fixtures-required',
    });
  });

  test('rejects checksum drift over the exact final bytes', async () => {
    const corpus = await createCorpus();
    await writeFile(
      join(corpus.directory, corpus.fixtures[0].file),
      `${priorityPresentFixture()}\n`,
      'utf8',
    );

    await expect(validateFixtureManifest(corpus.manifestPath)).rejects.toMatchObject({
      code: 'fixture-checksum-mismatch',
    });
  });

  test('runs the sensitive scan before detached parsing or resource loading', async () => {
    const corpus = await createCorpus();
    const unsafe = '<div><img src="https://assets.example.invalid/private.png"><table data-test-id="ticket-table"><tr data-test-id="header-row"><th>TEXT-001</th></tr></table></div>';
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await writeFile(join(corpus.directory, corpus.fixtures[0].file), unsafe, 'utf8');
    await rewriteManifest(corpus.manifestPath, (manifest) => {
      manifest.fixtures[0].sha256 = createHash('sha256').update(unsafe).digest('hex');
    });

    await expect(validateFixtureManifest(corpus.manifestPath)).rejects.toBeInstanceOf(
      SensitiveFixtureError,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('rejects missing table and header selectors', async () => {
    const corpus = await createCorpus();
    await rewriteManifest(corpus.manifestPath, (manifest) => {
      manifest.fixtures[0].selectors.ticketTable = '[data-test-id="missing"]';
    });
    await expect(validateFixtureManifest(corpus.manifestPath)).rejects.toMatchObject({
      code: 'declared-ticket-table-not-found',
    });

    const second = await createCorpus();
    await rewriteManifest(second.manifestPath, (manifest) => {
      manifest.fixtures[0].selectors.headerRow = '[data-test-id="missing"]';
    });
    await expect(validateFixtureManifest(second.manifestPath)).rejects.toMatchObject({
      code: 'declared-header-row-not-found',
    });
  });

  test('rejects absent, false, or incomplete scenario assertions', async () => {
    const absent = await createCorpus();
    await rewriteManifest(absent.manifestPath, (manifest) => {
      manifest.fixtures[0].assertions = [];
    });
    await expect(validateFixtureManifest(absent.manifestPath)).rejects.toMatchObject({
      code: 'scenario-assertions-required',
    });

    const falseAssertion = await createCorpus();
    await rewriteManifest(falseAssertion.manifestPath, (manifest) => {
      manifest.fixtures[1].assertions[0].selector = '[data-test-id="header-cell"]';
    });
    await expect(validateFixtureManifest(falseAssertion.manifestPath)).rejects.toMatchObject({
      code: 'declared-selector-must-be-absent',
    });

    const incomplete = await createCorpus();
    await rewriteManifest(incomplete.manifestPath, (manifest) => {
      manifest.fixtures[2].assertions = manifest.fixtures[2].assertions.slice(0, 1);
    });
    await expect(validateFixtureManifest(incomplete.manifestPath)).rejects.toMatchObject({
      code: 'scenario-invariant-missing',
    });
  });

  test('rejects incomplete or inaccurate structural scenario facts', async () => {
    const incomplete = await createCorpus();
    delete incomplete.fixtures[0].structure.ticketRowWidths;
    await rewriteManifest(incomplete.manifestPath, (manifest) => {
      delete manifest.fixtures[0].structure.ticketRowWidths;
    });
    await expect(validateFixtureManifest(incomplete.manifestPath)).rejects.toMatchObject({
      code: 'scenario-structure-required',
    });

    const wrongWidth = await createCorpus();
    await rewriteManifest(wrongWidth.manifestPath, (manifest) => {
      manifest.fixtures[0].structure.ticketRowWidths = [2, 2, 2, 2];
    });
    await expect(validateFixtureManifest(wrongWidth.manifestPath)).rejects.toMatchObject({
      code: 'ticket-row-widths-mismatch',
    });

    const wrongGroupPosition = await createCorpus();
    await rewriteManifest(wrongGroupPosition.manifestPath, (manifest) => {
      manifest.fixtures[2].structure.groupRowPositions = [1];
    });
    await expect(validateFixtureManifest(wrongGroupPosition.manifestPath)).rejects.toMatchObject({
      code: 'group-row-positions-mismatch',
    });

    const wrongPriorityIndex = await createCorpus();
    await rewriteManifest(wrongPriorityIndex.manifestPath, (manifest) => {
      manifest.fixtures[0].structure.priorityIndex = null;
    });
    await expect(validateFixtureManifest(wrongPriorityIndex.manifestPath)).rejects.toMatchObject({
      code: 'priority-index-mismatch',
    });
  });

  test('rejects path traversal and duplicate fixture provenance', async () => {
    const traversal = await createCorpus();
    await rewriteManifest(traversal.manifestPath, (manifest) => {
      manifest.fixtures[0].file = '../outside.html';
    });
    await expect(validateFixtureManifest(traversal.manifestPath)).rejects.toMatchObject({
      code: 'fixture-path-must-be-relative',
    });

    const duplicate = await createCorpus();
    await rewriteManifest(duplicate.manifestPath, (manifest) => {
      manifest.fixtures.push({ ...manifest.fixtures[0] });
    });
    await expect(validateFixtureManifest(duplicate.manifestPath)).rejects.toMatchObject({
      code: 'fixture-entry-duplicate',
    });
  });

  test('rejects an in-corpus symlink whose canonical target is outside the corpus', async () => {
    const corpus = await createCorpus();
    const outsideDirectory = await mkdtemp(join(tmpdir(), 'zhroma-corpus-outside-'));
    temporaryDirectories.push(outsideDirectory);
    const outsidePath = join(outsideDirectory, 'external.html');
    const linkedFixturePath = join(corpus.directory, corpus.fixtures[0].file);

    await writeFile(outsidePath, priorityPresentFixture(), 'utf8');
    await rm(linkedFixturePath);
    await symlink(outsidePath, linkedFixturePath);

    await expect(validateFixtureManifest(corpus.manifestPath)).rejects.toMatchObject({
      code: 'fixture-path-must-be-contained',
    });
  });

  test('requires the complete three-scenario matrix when requested', async () => {
    const corpus = await createCorpus();
    await rewriteManifest(corpus.manifestPath, (manifest) => {
      manifest.fixtures.pop();
    });

    await expect(validateFixtureManifest(corpus.manifestPath, {
      requireCompleteScenarioMatrix: true,
    })).rejects.toMatchObject({
      code: 'complete-scenario-matrix-required',
    });
  });
});

const selectedManifest = process.env.GSD_FIXTURE_MANIFEST
  ?? resolve('test/fixtures/manifest.json');

test('the selected admitted corpus satisfies the complete non-vacuous contract', async () => {
  await access(resolve(selectedManifest));
  const result = await validateFixtureManifest(selectedManifest, {
    requireCompleteScenarioMatrix: true,
  });
  expect(result.fixtureCount).toBe(3);
});
