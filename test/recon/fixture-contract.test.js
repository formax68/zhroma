import { createHash } from 'node:crypto';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import { Window } from 'happy-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';

import {
  scanSensitiveContent,
  SensitiveFixtureError,
} from './sensitive-patterns.js';

const ADMISSION_DENYLIST = Object.freeze([
  '__private_capture_values_were_removed_before_admission__',
]);
const EXPECTED_PRIORITIES = Object.freeze(['Urgent', 'High', 'Normal', 'Low']);
const REQUIRED_SCENARIOS = Object.freeze([
  'priority-present-ungrouped',
  'priority-absent',
  'grouped-long',
]);
const temporaryDirectories = [];

function parseDetached(markup) {
  const isolatedWindow = new Window({
    settings: {
      enableJavaScriptEvaluation: false,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
      enableImageFileLoading: false,
      navigation: {
        disableMainFrameNavigation: true,
        disableChildFrameNavigation: true,
        disableChildPageNavigation: true,
      },
    },
  });
  return new isolatedWindow.DOMParser().parseFromString(markup, 'text/html');
}

function contractError(code) {
  const error = new Error(`Fixture corpus contract rejected: ${code}`);
  error.name = 'FixtureContractError';
  error.code = code;
  return error;
}

function requireNonEmptyString(value, code) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw contractError(code);
  }
  return value;
}

function query(document, selector, code) {
  try {
    return document.querySelector(selector);
  } catch {
    throw contractError(code);
  }
}

function queryAll(document, selector, code) {
  try {
    return [...document.querySelectorAll(selector)];
  } catch {
    throw contractError(code);
  }
}

function assertScenario(entry, document) {
  if (!Array.isArray(entry.assertions) || entry.assertions.length === 0) {
    throw contractError('scenario-assertions-required');
  }

  const purposes = new Set();
  const purposeNodes = new Map();
  for (const assertion of entry.assertions) {
    const purpose = requireNonEmptyString(
      assertion?.purpose,
      'assertion-purpose-required',
    );
    const selector = requireNonEmptyString(
      assertion?.selector,
      'assertion-selector-required',
    );
    purposes.add(purpose);

    if (assertion.kind === 'selector-present') {
      const selectedNode = query(document, selector, 'assertion-selector-invalid');
      if (selectedNode === null) {
        throw contractError('declared-selector-not-found');
      }
      purposeNodes.set(purpose, selectedNode);
      continue;
    }

    if (assertion.kind === 'selector-absent') {
      if (query(document, selector, 'assertion-selector-invalid') !== null) {
        throw contractError('declared-selector-must-be-absent');
      }
      continue;
    }

    if (assertion.kind === 'exact-text-values') {
      if (!Array.isArray(assertion.values) || assertion.values.length === 0) {
        throw contractError('assertion-values-required');
      }
      const actual = new Set(queryAll(
        document,
        selector,
        'assertion-selector-invalid',
      ).map((node) => node.textContent.trim()));
      const expected = new Set(assertion.values);
      if (
        actual.size !== expected.size
        || [...actual].some((value) => !expected.has(value))
      ) {
        throw contractError('declared-text-values-mismatch');
      }
      continue;
    }

    throw contractError('assertion-kind-unsupported');
  }

  const requiredPurposes = {
    'priority-present-ungrouped': ['priority-values'],
    'priority-absent': ['priority-column-absent'],
    'grouped-long': ['group-row', 'duplicate-or-sticky-header', 'scroll-container'],
  }[entry.scenario];

  if (!requiredPurposes) {
    throw contractError('scenario-unsupported');
  }
  if (requiredPurposes.some((purpose) => !purposes.has(purpose))) {
    throw contractError('scenario-invariant-missing');
  }

  if (entry.scenario === 'priority-present-ungrouped') {
    const priorityAssertion = entry.assertions.find(
      ({ purpose }) => purpose === 'priority-values',
    );
    if (
      priorityAssertion.kind !== 'exact-text-values'
      || JSON.stringify(priorityAssertion.values) !== JSON.stringify(EXPECTED_PRIORITIES)
    ) {
      throw contractError('canonical-priorities-required');
    }
  }

  if (entry.scenario === 'priority-absent') {
    const priorityTextSurvives = queryAll(document, '*', 'priority-absence-query-failed')
      .some((node) => (
        node.childElementCount === 0
        && EXPECTED_PRIORITIES.includes(node.textContent.trim())
      ));
    if (priorityTextSurvives) {
      throw contractError('priority-value-must-be-absent');
    }
  }

  if (entry.scenario === 'grouped-long') {
    const ticketTable = query(
      document,
      entry.selectors.ticketTable,
      'ticket-table-selector-invalid',
    );
    const headerRow = query(
      document,
      entry.selectors.headerRow,
      'header-row-selector-invalid',
    );
    const groupRow = purposeNodes.get('group-row');
    const duplicateHeader = purposeNodes.get('duplicate-or-sticky-header');
    const scrollContainer = purposeNodes.get('scroll-container');
    const sameTableStickyHeader = duplicateHeader === ticketTable
      && ticketTable.contains(headerRow);
    const separateDuplicateHeader = duplicateHeader !== ticketTable
      && scrollContainer?.contains(duplicateHeader)
      && duplicateHeader.contains(headerRow);
    if (
      !groupRow
      || !duplicateHeader
      || !scrollContainer
      || !scrollContainer.contains(ticketTable)
      || !(sameTableStickyHeader || separateDuplicateHeader)
      || groupRow.closest('table, [role="table"]') !== ticketTable
    ) {
      throw contractError('grouped-long-topology-mismatch');
    }
  }
}

function safeRelativeFixturePath(manifestDirectory, file) {
  requireNonEmptyString(file, 'fixture-file-required');
  if (isAbsolute(file) || file.split(/[\\/]/u).includes('..')) {
    throw contractError('fixture-path-must-be-relative');
  }

  const fixturePath = resolve(manifestDirectory, file);
  const fromManifest = relative(manifestDirectory, fixturePath);
  if (fromManifest === '..' || fromManifest.startsWith(`..${sep}`)) {
    throw contractError('fixture-path-must-be-contained');
  }
  return fixturePath;
}

export async function validateFixtureManifest(manifestPath, options = {}) {
  const absoluteManifestPath = resolve(manifestPath);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(absoluteManifestPath, 'utf8'));
  } catch {
    throw contractError('manifest-readable-json-required');
  }

  if (!Array.isArray(manifest.fixtures) || manifest.fixtures.length === 0) {
    throw contractError('manifest-fixtures-required');
  }

  const manifestDirectory = dirname(absoluteManifestPath);
  const seenFiles = new Set();
  const seenScenarios = new Set();

  for (const entry of manifest.fixtures) {
    requireNonEmptyString(entry?.scenario, 'scenario-required');
    requireNonEmptyString(entry?.captureDate, 'capture-date-required');
    requireNonEmptyString(entry?.workspace?.shell, 'workspace-shell-required');
    requireNonEmptyString(entry?.workspace?.plan, 'workspace-plan-required');
    requireNonEmptyString(entry?.domBoundary, 'dom-boundary-required');
    requireNonEmptyString(entry?.sanitizationMethod, 'sanitization-method-required');
    requireNonEmptyString(entry?.sha256, 'sha256-required');
    requireNonEmptyString(entry?.selectors?.ticketTable, 'ticket-table-selector-required');
    requireNonEmptyString(entry?.selectors?.headerRow, 'header-row-selector-required');

    const parsedCaptureDate = new Date(`${entry.captureDate}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/u.test(entry.captureDate)
      || Number.isNaN(parsedCaptureDate.valueOf())
      || parsedCaptureDate.toISOString().slice(0, 10) !== entry.captureDate
    ) {
      throw contractError('capture-date-invalid');
    }
    if (!/^[a-f0-9]{64}$/u.test(entry.sha256)) {
      throw contractError('sha256-invalid');
    }
    if (seenFiles.has(entry.file) || seenScenarios.has(entry.scenario)) {
      throw contractError('fixture-entry-duplicate');
    }
    seenFiles.add(entry.file);
    seenScenarios.add(entry.scenario);

    const fixturePath = safeRelativeFixturePath(manifestDirectory, entry.file);
    let bytes;
    try {
      bytes = await readFile(fixturePath);
    } catch {
      throw contractError('fixture-readable-required');
    }

    const actualHash = createHash('sha256').update(bytes).digest('hex');
    if (actualHash !== entry.sha256) {
      throw contractError('fixture-checksum-mismatch');
    }

    scanSensitiveContent(bytes.toString('utf8'), {
      denylist: ADMISSION_DENYLIST,
    });

    const detachedDocument = parseDetached(bytes.toString('utf8'));
    if (!detachedDocument || detachedDocument === globalThis.document) {
      throw contractError('detached-document-required');
    }

    const ticketTable = query(
      detachedDocument,
      entry.selectors.ticketTable,
      'ticket-table-selector-invalid',
    );
    const headerRow = query(
      detachedDocument,
      entry.selectors.headerRow,
      'header-row-selector-invalid',
    );
    if (
      ticketTable === null
      || !(
        ticketTable.localName === 'table'
        || ticketTable.getAttribute('role') === 'table'
      )
    ) {
      throw contractError('declared-ticket-table-not-found');
    }
    if (headerRow === null) {
      throw contractError('declared-header-row-not-found');
    }

    assertScenario(entry, detachedDocument);
  }

  if (options.requireCompleteScenarioMatrix) {
    if (
      seenScenarios.size !== REQUIRED_SCENARIOS.length
      || REQUIRED_SCENARIOS.some((scenario) => !seenScenarios.has(scenario))
    ) {
      throw contractError('complete-scenario-matrix-required');
    }
  }

  return {
    fixtureCount: manifest.fixtures.length,
    scenarios: [...seenScenarios],
  };
}

function priorityPresentFixture() {
  return `<div data-test-id="table-container"><table data-test-id="ticket-table" role="table"><thead><tr data-test-id="header-row"><th data-test-id="priority-header">TEXT-001</th></tr></thead><tbody>${EXPECTED_PRIORITIES.map((priority) => `<tr data-test-id="ticket-row"><td data-test-id="priority-cell">${priority}</td></tr>`).join('')}</tbody></table></div>`;
}

function priorityAbsentFixture() {
  return '<div data-test-id="table-container"><table data-test-id="ticket-table" role="table"><thead><tr data-test-id="header-row"><th data-test-id="subject-header">TEXT-001</th></tr></thead><tbody><tr data-test-id="ticket-row"><td>TEXT-002</td></tr></tbody></table></div>';
}

function groupedLongFixture() {
  return '<div data-test-id="scroll-container" role="region"><table data-test-id="ticket-table" role="table"><thead><tr data-test-id="header-row"><th>TEXT-001</th></tr></thead><tbody><tr data-test-id="group-row"><th>TEXT-002</th></tr><tr data-test-id="ticket-row"><td>Urgent</td></tr></tbody></table></div>';
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
      selector: '[data-test-id="scroll-container"]',
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
      manifest.fixtures[1].assertions[0].selector = '[data-test-id="subject-header"]';
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

const selectedManifest = process.env.GSD_FIXTURE_MANIFEST;
if (selectedManifest) {
  test('the selected admitted corpus satisfies the complete non-vacuous contract', async () => {
    await access(resolve(selectedManifest));
    const result = await validateFixtureManifest(selectedManifest, {
      requireCompleteScenarioMatrix: true,
    });
    expect(result.fixtureCount).toBe(3);
  });
}
