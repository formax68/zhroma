import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { Window } from 'happy-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { sanitizeFixture, sha256 } from '../../scripts/sanitize-fixture.js';
import { validateSanitizedOutput, PRIORITY_LABELS } from '../../scripts/sanitized-output-contract.js';
import { validateRecon2Fixtures } from '../../scripts/fixture-contract.js';
import {
  DEFAULT_RULE_VOCABULARY,
  validateRuleColumnOutput,
} from '../../scripts/rule-column-contract.js';

const execFileAsync = promisify(execFile);
const repositoryRoot = process.cwd();
const sanitizerCli = join(repositoryRoot, 'scripts', 'sanitize-fixture.js');
const temporaryDirectories = [];

const vocabulary = DEFAULT_RULE_VOCABULARY;
function labelFor(kind) {
  return Object.keys(vocabulary.headerKinds).find((label) => vocabulary.headerKinds[label] === kind);
}
const LABELS = {
  priority: labelFor('PRIORITY'),
  person: labelFor('PERSON'),
  group: labelFor('GROUP'),
  status: labelFor('STATUS'),
  subject: labelFor('SUBJECT'),
};
const [STANDARD_STATUS, SECOND_STANDARD_STATUS] = vocabulary.statusValues;

const SELF_FORM = 'Selma Agentworth';
const PRIVATE_VALUES = Object.freeze({
  person: 'Private Personne',
  group: 'Internal Organisation',
  customStatus: 'Awaiting Vendor Reply',
  subjects: ['Tenant Subject One', 'Tenant Subject Two', 'Tenant Subject Three'],
  wrapperLabel: 'Private tickets view',
  selectAll: 'Select every ticket',
});
const denylistValues = [
  PRIVATE_VALUES.person,
  PRIVATE_VALUES.group,
  PRIVATE_VALUES.customStatus,
  ...PRIVATE_VALUES.subjects,
  PRIVATE_VALUES.wrapperLabel,
];
const PARITY_DENYLIST = '__synthetic_parity_token_not_a_private_denylist__\nself: Zq Parity Selfform\n';

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

const HEADERS = ['', LABELS.priority, LABELS.person, LABELS.group, LABELS.status, LABELS.subject];

function headerCell(label) {
  if (!label) {
    return `<th data-garden-id="tables.header_cell"><input type="checkbox" aria-label="${PRIVATE_VALUES.selectAll}"></th>`;
  }
  return `<th data-garden-id="tables.header_cell"><button type="button">${label}</button></th>`;
}

function ticketRow(cells) {
  return `<tr data-garden-id="tables.row" data-test-id="generic-table-row">${cells.map((cell) => (
    `<td data-garden-id="tables.cell">${cell}</td>`
  )).join('')}</tr>`;
}

function ruleCapture(rows = tracerRows()) {
  return `<div data-test-id="table-container" class="layout_hash" style="display: block" aria-label="${PRIVATE_VALUES.wrapperLabel}">
<table data-garden-id="tables.table" data-test-id="generic-table">
<thead data-garden-id="tables.head"><tr data-garden-id="tables.header_row">${HEADERS.map(headerCell).join('')}</tr></thead>
<tbody data-garden-id="tables.body">${rows.map(ticketRow).join('')}</tbody>
</table>
</div>`;
}

function tracerRows() {
  const checkbox = '<input type="checkbox" aria-label="Select ticket">';
  return [
    [checkbox, 'Urgent', `<span aria-label="${PRIVATE_VALUES.person}">${PRIVATE_VALUES.person}</span>`,
      PRIVATE_VALUES.group, STANDARD_STATUS, PRIVATE_VALUES.subjects[0]],
    [checkbox, 'High', PRIVATE_VALUES.person, PRIVATE_VALUES.group, PRIVATE_VALUES.customStatus,
      PRIVATE_VALUES.subjects[1]],
    [checkbox, 'Low', SELF_FORM, PRIVATE_VALUES.group, SECOND_STANDARD_STATUS,
      PRIVATE_VALUES.subjects[2]],
  ];
}

async function createCase(source = ruleCapture(), denylist = ruleDenylist()) {
  const directory = await mkdtemp(join(tmpdir(), 'zhroma-rule-sanitizer-'));
  temporaryDirectories.push(directory);

  const inputPath = join(directory, 'private-input.html');
  const outputPath = join(directory, 'sanitized-output.html');
  const denylistPath = join(directory, 'private-denylist.txt');
  await writeFile(inputPath, source, 'utf8');
  await writeFile(denylistPath, denylist, 'utf8');

  return { directory, inputPath, outputPath, denylistPath };
}

function ruleDenylist(extra = []) {
  return `${[...denylistValues, ...extra, `self: ${SELF_FORM}`].join('\n')}\n`;
}

async function expectRejected(options, code) {
  const original = await readFile(options.inputPath);
  await expect(sanitizeFixture(options)).rejects.toMatchObject({
    name: 'SanitizationError',
    code,
  });
  expect(await readFile(options.inputPath)).toEqual(original);
  await expect(readFile(options.outputPath, 'utf8')).rejects.toMatchObject({
    code: 'ENOENT',
  });
}

async function sanitizeRule(source, denylist) {
  const fixture = await createCase(source, denylist);
  await sanitizeFixture({ ...fixture, mode: 'rule-columns' });
  const output = await readFile(fixture.outputPath, 'utf8');
  return { fixture, output, document: parseDetached(output) };
}

function cellTexts(document, index) {
  return [...document.querySelectorAll('[data-garden-id="tables.row"]')]
    .map((row) => row.children[index].textContent);
}

function recon2Entry(file, bytes, overrides = {}) {
  return {
    scenario: 'rules-light-table',
    captureDate: '2026-09-25',
    workspace: { shell: 'current Agent Workspace', plan: 'unknown/not shared' },
    domBoundary: 'nearest complete table container',
    sanitizationMethod: 'Synthetic rule-columns tracer capture sanitised by scripts/sanitize-fixture.js',
    file,
    sha256: sha256(bytes),
    sanitizerMode: 'rule-columns',
    appearance: 'light',
    boundaryKind: 'table',
    ...overrides,
  };
}

async function writeManifest(manifest) {
  const directory = await mkdtemp(join(tmpdir(), 'zhroma-recon2-manifest-'));
  temporaryDirectories.push(directory);
  const manifestPath = join(directory, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest), 'utf8');
  return { directory, manifestPath };
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(temporaryDirectories.splice(0).map((directory) => (
    rm(directory, { recursive: true, force: true })
  )));
});

describe('rule-columns tracer', () => {
  test('admits a synthetic multi-column table end to end through the CLI, grammar and manifest', async () => {
    const fixture = await createCase();
    const result = await execFileAsync(process.execPath, [
      sanitizerCli,
      '--input', fixture.inputPath,
      '--output', fixture.outputPath,
      '--denylist', fixture.denylistPath,
      '--mode', 'rule-columns',
    ], { cwd: fixture.directory });
    const bytes = await readFile(fixture.outputPath);
    const output = bytes.toString('utf8');

    expect(result.stderr).toBe('');
    expect(result.stdout).toBe(`SANITIZE_FIXTURE_OK ${sha256(bytes)}\n`);

    const document = parseDetached(output);
    const headers = [...document.querySelectorAll('th')].map((cell) => cell.textContent);
    expect(headers).toEqual(HEADERS);
    expect(document.querySelector('th input')?.getAttribute('aria-label')).toBe('LABEL-001');
    expect(cellTexts(document, 1)).toEqual(['Urgent', 'High', 'Low']);
    expect(cellTexts(document, 2)).toEqual(['PERSON-001', 'PERSON-001', 'PERSON-SELF']);
    expect(document.querySelector('td span')?.getAttribute('aria-label')).toBe('PERSON-001');
    expect(cellTexts(document, 3)).toEqual(['GROUP-001', 'GROUP-001', 'GROUP-001']);
    expect(cellTexts(document, 4)).toEqual([STANDARD_STATUS, 'STATUS-001', SECOND_STANDARD_STATUS]);
    expect(cellTexts(document, 5)).toEqual(['SUBJECT-001', 'SUBJECT-002', 'SUBJECT-003']);
    expect(document.querySelector('[data-test-id="table-container"]')?.getAttribute('aria-label'))
      .toBe('TEXT-001');
    expect(document.querySelector('[data-test-id="table-container"]')?.hasAttribute('class')).toBe(false);
    expect(document.querySelector('[data-test-id="table-container"]')?.hasAttribute('style')).toBe(false);
    for (const value of [...denylistValues, SELF_FORM]) {
      expect(output).not.toContain(value);
    }

    expect(validateRuleColumnOutput(output)).toMatchObject({
      boundary: 'table',
      ticketRowCount: 3,
      tokenKinds: expect.objectContaining({ PERSON: 1, GROUP: 1, STATUS: 1, SUBJECT: 3, LABEL: 1 }),
    });

    const { directory, manifestPath } = await writeManifest({});
    await writeFile(join(directory, 'zendesk-recon2-light-columns.html'), bytes);
    await writeFile(manifestPath, JSON.stringify({
      recon2Fixtures: [recon2Entry('zendesk-recon2-light-columns.html', bytes)],
    }), 'utf8');
    await expect(validateRecon2Fixtures(manifestPath)).resolves.toEqual({
      recon2FixtureCount: 1,
      scenarios: ['rules-light-table'],
    });

    const repeat = await createCase(output, PARITY_DENYLIST);
    const repeated = await sanitizeFixture({ ...repeat, mode: 'rule-columns' });
    expect(await readFile(repeat.outputPath)).toEqual(bytes);
    expect(repeated.sha256).toBe(sha256(bytes));
  });

  test('the default mode on the same capture still yields only TEXT and ARIA stand-ins (D-10)', async () => {
    const fixture = await createCase(ruleCapture(), `${denylistValues.join('\n')}\n${SELF_FORM}\n`);
    await sanitizeFixture(fixture);
    const output = await readFile(fixture.outputPath, 'utf8');
    expect(validateSanitizedOutput(output)).toMatchObject({ tableCount: 1, ticketRowCount: 3 });
    const document = parseDetached(output);
    const walker = [...document.querySelectorAll('*')];
    for (const element of walker) {
      for (const attribute of element.attributes) {
        if (attribute.name === 'aria-label') expect(attribute.value).toMatch(/^ARIA-\d{3}$/u);
      }
      for (const node of element.childNodes) {
        const text = node.nodeType === 3 ? node.data.trim() : '';
        if (text && text !== LABELS.priority && !PRIORITY_LABELS.has(text)) {
          expect(text).toMatch(/^TEXT-\d{3}$/u);
        }
      }
    }
    expect(output).not.toMatch(/PERSON-|GROUP-|STATUS-|LABEL-/u);
    expect(output).not.toContain(STANDARD_STATUS);
  });
});

describe('rule-columns options and denylist', () => {
  test('rejects a rule-columns denylist without a self: line', async () => {
    const fixture = await createCase(ruleCapture(), `${denylistValues.join('\n')}\n`);
    await expectRejected({ ...fixture, mode: 'rule-columns' }, 'self-directive-required');
  });

  test('rejects an unknown mode value', async () => {
    const fixture = await createCase();
    await expectRejected({ ...fixture, mode: 'draft' }, 'mode-invalid');
  });

  test.each([
    ['a wrong --mode value', (f) => ['--input', f.inputPath, '--output', f.outputPath, '--denylist', f.denylistPath, '--mode', 'rule-column']],
    ['a duplicated --mode', (f) => ['--input', f.inputPath, '--output', f.outputPath, '--mode', 'rule-columns', '--mode', 'rule-columns']],
    ['seven arguments', (f) => ['--input', f.inputPath, '--output', f.outputPath, '--denylist', f.denylistPath, '--mode']],
  ])('the CLI rejects %s with the exact value-free line', async (_label, argumentsFor) => {
    const fixture = await createCase();
    await expect(execFileAsync(process.execPath, [sanitizerCli, ...argumentsFor(fixture)], {
      cwd: fixture.directory,
    })).rejects.toMatchObject({
      code: 1,
      stdout: '',
      stderr: 'SANITIZE_FIXTURE_REJECTED cli-arguments-invalid\n',
    });
    await expect(readFile(fixture.outputPath)).rejects.toMatchObject({ code: 'ENOENT' });
  });
});

describe('rule-columns column ownership and tokens', () => {
  test('tokenises a standard Status value that appears in a Group cell', async () => {
    const rows = tracerRows();
    rows[0][3] = STANDARD_STATUS;
    const { document } = await sanitizeRule(ruleCapture(rows), ruleDenylist());
    expect(cellTexts(document, 3)).toEqual(['GROUP-001', 'GROUP-002', 'GROUP-002']);
    expect(cellTexts(document, 4)[0]).toBe(STANDARD_STATUS);
  });

  test('NFD, NFC and NBSP spellings share a token while a case variant does not', async () => {
    const nfc = 'Équipe Nord';
    const rows = tracerRows();
    rows[0][3] = nfc;
    rows[1][3] = 'Équipe  Nord';
    rows[2][3] = nfc.toLocaleLowerCase('en-US');
    const { document } = await sanitizeRule(ruleCapture(rows), ruleDenylist([nfc]));
    expect(cellTexts(document, 3)).toEqual(['GROUP-001', 'GROUP-001', 'GROUP-002']);
  });

  test('an empty or whitespace-only cell stays empty', async () => {
    const rows = tracerRows();
    rows[0][5] = '';
    rows[1][5] = '   ';
    const { document, output } = await sanitizeRule(ruleCapture(rows), ruleDenylist());
    expect(cellTexts(document, 5)).toEqual(['', '   ', 'SUBJECT-001']);
    expect(validateRuleColumnOutput(output).tokenKinds.SUBJECT).toBe(1);
  });
});

describe('validateRecon2Fixtures', () => {
  test('returns a zero count when the manifest has no recon2Fixtures key', async () => {
    const { manifestPath } = await writeManifest({ fixtures: [] });
    await expect(validateRecon2Fixtures(manifestPath)).resolves.toEqual({
      recon2FixtureCount: 0,
      scenarios: [],
    });
  });

  test('rejects a recon2Fixtures value that is not an array', async () => {
    const { manifestPath } = await writeManifest({ recon2Fixtures: {} });
    await expect(validateRecon2Fixtures(manifestPath)).rejects.toMatchObject({
      code: 'rule-fixtures-array-required',
    });
  });
});
