import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

import { Window } from 'happy-dom';

import { scanSensitiveContent } from './sensitive-patterns.js';

const ADMISSION_DENYLIST = Object.freeze([
  '__private_capture_values_were_removed_before_admission__',
]);
const EXPECTED_PRIORITIES = Object.freeze(['Urgent', 'High', 'Normal', 'Low']);

export const REQUIRED_SCENARIOS = Object.freeze([
  'priority-present-ungrouped',
  'priority-absent',
  'grouped-long',
]);

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

function query(root, selector, code) {
  try {
    return root.querySelector(selector);
  } catch {
    throw contractError(code);
  }
}

function queryAll(root, selector, code) {
  try {
    return [...root.querySelectorAll(selector)];
  } catch {
    throw contractError(code);
  }
}

function requireNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function requireIntegerArray(value) {
  return Array.isArray(value) && value.every(requireNonNegativeInteger);
}

function ownedByTable(node, ticketTable) {
  return node.closest('table, [role="table"]') === ticketTable;
}

function assertStructure(entry, document, ticketTable, headerRow) {
  const structure = entry.structure;
  if (
    !structure
    || !requireNonNegativeInteger(structure.headerCellCount)
    || !requireNonNegativeInteger(structure.ticketRowCount)
    || !requireIntegerArray(structure.ticketRowWidths)
    || !requireNonNegativeInteger(structure.groupRowCount)
    || !requireIntegerArray(structure.groupRowPositions)
    || !(
      structure.priorityIndex === null
      || requireNonNegativeInteger(structure.priorityIndex)
    )
    || structure.stickyHeaderRelationship !== 'same-table'
  ) {
    throw contractError('scenario-structure-required');
  }

  const ticketRows = queryAll(
    document,
    requireNonEmptyString(entry.selectors.ticketRow, 'ticket-row-selector-required'),
    'ticket-row-selector-invalid',
  ).filter((row) => ownedByTable(row, ticketTable));
  const groupRows = queryAll(
    document,
    requireNonEmptyString(entry.selectors.groupRow, 'group-row-selector-required'),
    'group-row-selector-invalid',
  ).filter((row) => ownedByTable(row, ticketTable));
  const scrollContainer = query(
    document,
    requireNonEmptyString(
      entry.selectors.scrollContainer,
      'scroll-container-selector-required',
    ),
    'scroll-container-selector-invalid',
  );

  if (headerRow.children.length !== structure.headerCellCount) {
    throw contractError('header-cell-count-mismatch');
  }
  if (ticketRows.length !== structure.ticketRowCount) {
    throw contractError('ticket-row-count-mismatch');
  }

  const ticketRowWidths = ticketRows.map((row) => row.children.length);
  if (JSON.stringify(ticketRowWidths) !== JSON.stringify(structure.ticketRowWidths)) {
    throw contractError('ticket-row-widths-mismatch');
  }
  if (groupRows.length !== structure.groupRowCount) {
    throw contractError('group-row-count-mismatch');
  }

  const groupRowPositions = groupRows.map((row) => (
    [...row.parentElement.children].indexOf(row)
  ));
  if (JSON.stringify(groupRowPositions) !== JSON.stringify(structure.groupRowPositions)) {
    throw contractError('group-row-positions-mismatch');
  }

  if (
    entry.scenario === 'priority-absent'
      ? structure.priorityIndex !== null
      : !requireNonNegativeInteger(structure.priorityIndex)
        || structure.priorityIndex >= structure.headerCellCount
  ) {
    throw contractError('priority-index-mismatch');
  }

  if (
    scrollContainer === null
    || !scrollContainer.contains(ticketTable)
    || !ticketTable.contains(headerRow)
  ) {
    throw contractError('sticky-scroll-relationship-mismatch');
  }
}

function assertScenario(entry, document, ticketTable, headerRow) {
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
    const groupRow = purposeNodes.get('group-row');
    const duplicateHeader = purposeNodes.get('duplicate-or-sticky-header');
    const scrollContainer = purposeNodes.get('scroll-container');
    const sameTableStickyHeader = duplicateHeader === ticketTable
      && ticketTable.contains(headerRow);
    if (
      !groupRow
      || !duplicateHeader
      || !scrollContainer
      || !scrollContainer.contains(ticketTable)
      || !sameTableStickyHeader
      || !ownedByTable(groupRow, ticketTable)
    ) {
      throw contractError('grouped-long-topology-mismatch');
    }
  }

  assertStructure(entry, document, ticketTable, headerRow);
}

function pathIsContained(parent, child) {
  const fromParent = relative(parent, child);
  return fromParent !== '..'
    && !fromParent.startsWith(`..${sep}`)
    && !isAbsolute(fromParent);
}

async function safeRelativeFixturePath(manifestDirectory, file) {
  requireNonEmptyString(file, 'fixture-file-required');
  if (isAbsolute(file) || file.split(/[\\/]/u).includes('..')) {
    throw contractError('fixture-path-must-be-relative');
  }

  const fixturePath = resolve(manifestDirectory, file);
  if (!pathIsContained(manifestDirectory, fixturePath)) {
    throw contractError('fixture-path-must-be-contained');
  }

  let canonicalManifestDirectory;
  let canonicalFixturePath;
  try {
    [canonicalManifestDirectory, canonicalFixturePath] = await Promise.all([
      realpath(manifestDirectory),
      realpath(fixturePath),
    ]);
  } catch {
    throw contractError('fixture-readable-required');
  }
  if (!pathIsContained(canonicalManifestDirectory, canonicalFixturePath)) {
    throw contractError('fixture-path-must-be-contained');
  }
  return canonicalFixturePath;
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

    const fixturePath = await safeRelativeFixturePath(manifestDirectory, entry.file);
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

    const markup = bytes.toString('utf8');
    scanSensitiveContent(markup, { denylist: ADMISSION_DENYLIST });

    const detachedDocument = parseDetached(markup);
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
    if (headerRow === null || !ownedByTable(headerRow, ticketTable)) {
      throw contractError('declared-header-row-not-found');
    }

    assertScenario(entry, detachedDocument, ticketTable, headerRow);
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
