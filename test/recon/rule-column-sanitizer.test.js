import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { Window } from 'happy-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { symlink } from 'node:fs/promises';

import { sanitizeFixture, sha256 } from '../../scripts/sanitize-fixture.js';
import { validateSanitizedOutput, PRIORITY_LABELS } from '../../scripts/sanitized-output-contract.js';
import { validateRecon2Fixtures } from '../../scripts/fixture-contract.js';
import * as ruleContract from '../../scripts/rule-column-contract.js';
import {
  DEFAULT_RULE_VOCABULARY,
  RULE_TOKEN_KINDS,
  RESERVED_SELF_TOKENS,
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
  date: labelFor('DATE'),
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
  return `<div class="layout_hash" style="display: block" aria-label="${PRIVATE_VALUES.wrapperLabel}">
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
    expect(document.querySelector('body > div')?.getAttribute('aria-label'))
      .toBe('TEXT-001');
    expect(document.querySelector('body > div')?.hasAttribute('class')).toBe(false);
    expect(document.querySelector('body > div')?.hasAttribute('style')).toBe(false);
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

const V1_FIXTURES = [
  'zendesk-view-priority-present.html',
  'zendesk-view-priority-absent.html',
  'zendesk-view-grouped-long.html',
];
const SELF_ALT_FORM = 'S. Agentworth';

function identityCapture(inner = `<span>${SELF_FORM}</span><span>Profile menu</span>`) {
  return `<button type="button" class="avatar_hash" aria-label="${SELF_FORM}" aria-haspopup="menu" data-test-id="header-profile-button"><img data-test-id="avatar-image">${inner}</button>`;
}

function ruleDenylistWith({ plain = denylistValues, self = SELF_FORM, selfAlt } = {}) {
  const lines = [...plain];
  if (self !== undefined) lines.push(`self: ${self}`);
  if (selfAlt !== undefined) lines.push(`self-alt: ${selfAlt}`);
  return `${lines.join('\n')}\n`;
}

function structuralNames(markup) {
  const document = parseDetached(markup);
  const names = new Set();
  for (const element of document.body.querySelectorAll('*')) {
    names.add(element.localName.toLocaleLowerCase('en-US'));
    for (const attribute of element.attributes) {
      names.add(attribute.name.toLocaleLowerCase('en-US'));
      if (attribute.name === 'data-garden-id' || attribute.name === 'data-test-id') {
        names.add(attribute.value.toLocaleLowerCase('en-US'));
      }
    }
  }
  return names;
}

describe('identity-region boundary', () => {
  test('admits the smallest name-bearing subtree through the 10-argument CLI and maps the name to PERSON-SELF', async () => {
    const fixture = await createCase(identityCapture());
    const result = await execFileAsync(process.execPath, [
      sanitizerCli,
      '--input', fixture.inputPath,
      '--output', fixture.outputPath,
      '--denylist', fixture.denylistPath,
      '--mode', 'rule-columns',
      '--boundary', 'identity-region',
    ], { cwd: fixture.directory });
    const bytes = await readFile(fixture.outputPath);
    const output = bytes.toString('utf8');

    expect(result.stderr).toBe('');
    expect(result.stdout).toBe(`SANITIZE_FIXTURE_OK ${sha256(bytes)}\n`);
    const button = parseDetached(output).querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe('PERSON-SELF');
    expect([...button.querySelectorAll('span')].map((span) => span.textContent))
      .toEqual(['PERSON-SELF', 'TEXT-001']);
    expect(button?.hasAttribute('class')).toBe(false);
    expect(output).not.toContain(SELF_FORM);
    expect(validateRuleColumnOutput(output, { boundary: 'identity-region' })).toMatchObject({
      boundary: 'identity-region',
      ticketRowCount: 0,
    });

    const repeat = await createCase(output, PARITY_DENYLIST);
    await sanitizeFixture({ ...repeat, mode: 'rule-columns', boundary: 'identity-region' });
    expect(await readFile(repeat.outputPath)).toEqual(bytes);
  });

  test.each([
    ['a table', `<table><tbody><tr><td>${SELF_FORM}</td></tr></tbody></table>`],
    ['a row', `<div role="row">${SELF_FORM}</div>`],
    ['nav', `<nav>${SELF_FORM}</nav>`],
    ['header', `<header>${SELF_FORM}</header>`],
    ['main', `<main>${SELF_FORM}</main>`],
    ['aside', `<aside>${SELF_FORM}</aside>`],
    ['role navigation', `<div role="navigation">${SELF_FORM}</div>`],
    ['role banner', `<div role="banner">${SELF_FORM}</div>`],
    ['role menubar', `<div role="menubar">${SELF_FORM}</div>`],
    ['role tablist', `<div role="tablist">${SELF_FORM}</div>`],
  ])('rejects an identity region containing %s', async (_label, inner) => {
    const fixture = await createCase(identityCapture(inner));
    await expectRejected({ ...fixture, mode: 'rule-columns', boundary: 'identity-region' }, 'identity-boundary-required');
  });

  test.each([
    ['two root elements', `${identityCapture()}<span>Other</span>`],
    ['stray body text', `Stray ${identityCapture()}`],
    ['more than 40 elements', `<div><span>${SELF_FORM}</span>${'<span></span>'.repeat(39)}</div>`],
    ['no reserved self token', '<button type="button"><span>Someone Else Entirely</span></button>'],
  ])('rejects an identity region with %s', async (_label, source) => {
    const fixture = await createCase(source);
    await expectRejected({ ...fixture, mode: 'rule-columns', boundary: 'identity-region' }, 'identity-boundary-required');
  });

  test('admits exactly 40 elements', async () => {
    const fixture = await createCase(`<div><span>${SELF_FORM}</span>${'<span></span>'.repeat(38)}</div>`);
    await expect(sanitizeFixture({ ...fixture, mode: 'rule-columns', boundary: 'identity-region' }))
      .resolves.toMatchObject({ sha256: expect.stringMatching(/^[a-f0-9]{64}$/u) });
  });

  test('rejects an identity-region output without a reserved token in the validator', () => {
    expect(() => validateRuleColumnOutput('<button type="button"><span>TEXT-001</span></button>\n', {
      boundary: 'identity-region',
    })).toThrow(expect.objectContaining({ code: 'identity-boundary-required' }));
  });
});

describe('reserved self tokens', () => {
  test('keeps self and self-alt distinct and marks an embedded self form', async () => {
    const rows = tracerRows();
    rows[0][2] = `<span aria-label="Assigned to ${SELF_FORM}">${SELF_ALT_FORM}</span>`;
    rows[1][2] = SELF_FORM;
    const { document, output } = await sanitizeRule(
      ruleCapture(rows),
      ruleDenylistWith({ selfAlt: SELF_ALT_FORM }),
    );
    expect(cellTexts(document, 2)).toEqual(['PERSON-SELF-ALT', 'PERSON-SELF', 'PERSON-SELF']);
    expect(document.querySelector('td span')?.getAttribute('aria-label')).toBe('PERSON-SELF-EMBEDDED');
    expect(output).not.toContain(SELF_ALT_FORM);
    expect(output).not.toContain(SELF_FORM);
    expect(RESERVED_SELF_TOKENS).toEqual(['PERSON-SELF', 'PERSON-SELF-ALT', 'PERSON-SELF-EMBEDDED']);
  });

  test('maps the self form in the identity region while self-alt stays separate', async () => {
    const { output } = await sanitizeRuleBoundary(
      identityCapture(`<span>${SELF_ALT_FORM}</span>`),
      ruleDenylistWith({ selfAlt: SELF_ALT_FORM }),
      'identity-region',
    );
    const button = parseDetached(output).querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('PERSON-SELF');
    expect(button.querySelector('span').textContent).toBe('PERSON-SELF-ALT');
  });

  test.each([
    ['a second self-alt line', ruleDenylistWith({ selfAlt: SELF_ALT_FORM }).concat(`self-alt: ${SELF_ALT_FORM} Two\n`), 'self-directive-invalid'],
    ['an empty self-alt value', ruleDenylistWith().concat('self-alt:   \n'), 'self-directive-invalid'],
    ['an empty self value', ruleDenylistWith({ self: undefined }).concat('self:\n'), 'self-directive-required'],
    ['a repeated self line', ruleDenylistWith().concat(`self: ${SELF_FORM} Two\n`), 'self-directive-required'],
  ])('rejects %s before parsing', async (_label, denylist, code) => {
    const fixture = await createCase('<script>unsafe()</script>', denylist);
    await expectRejected({ ...fixture, mode: 'rule-columns' }, code);
  });
});

describe('denylist collisions', () => {
  test.each([
    ['self form Tab inside table', { self: 'Tab' }],
    ['self form Bo inside tbody', { self: 'Bo' }],
    ['plain row inside tables.row', { plain: [...denylistValues, 'row'] }],
    ['plain label inside aria-label', { plain: [...denylistValues, 'label'] }],
    ['plain Norm inside Normal', { plain: [...denylistValues, 'Norm'] }],
    ['plain person inside PERSON', { plain: [...denylistValues, 'person'] }],
    ['plain Pending', { plain: [...denylistValues, 'Pending'] }],
    ['self-alt form elf inside PERSON-SELF', { selfAlt: 'elf' }],
  ])('rejects %s before the capture is parsed', async (_label, parts) => {
    const fixture = await createCase('<script>unsafe()</script>', ruleDenylistWith(parts));
    await expectRejected({ ...fixture, mode: 'rule-columns' }, 'denylist-entry-collides');
  });

  test('accepts a two-letter self form that lies inside no collision word', async () => {
    const rows = tracerRows();
    rows[2][2] = 'Xu';
    const { document } = await sanitizeRule(ruleCapture(rows), ruleDenylistWith({ self: 'Xu' }));
    expect(cellTexts(document, 2)[2]).toBe('PERSON-SELF');
  });

  test('ruleVocabularyWords folds every token kind, reserved token and allowlisted value', () => {
    const words = ruleContract.ruleVocabularyWords?.(DEFAULT_RULE_VOCABULARY);
    expect(Array.isArray(words)).toBe(true);
    for (const expected of [...RULE_TOKEN_KINDS, ...RESERVED_SELF_TOKENS,
      ...Object.keys(vocabulary.headerKinds), ...vocabulary.statusValues, ...vocabulary.typeValues,
      ...PRIORITY_LABELS]) {
      expect(words).toContain(expected.toLocaleLowerCase('en-US'));
    }
  });

  test('RULE_STRUCTURAL_WORDS covers the v1 fixtures and the tracer output', async () => {
    const structural = ruleContract.RULE_STRUCTURAL_WORDS;
    expect(Array.isArray(structural)).toBe(true);
    expect(Object.isFrozen(structural)).toBe(true);
    const { output } = await sanitizeRule(ruleCapture(), ruleDenylist());
    const markups = [
      ...await Promise.all(V1_FIXTURES.map((file) => readFile(join(repositoryRoot, 'test', 'fixtures', file), 'utf8'))),
      output,
    ];
    for (const markup of markups) {
      for (const name of structuralNames(markup)) {
        expect(structural).toContain(name);
      }
    }
  });
});

describe('boundary options and CLI forms', () => {
  test('rejects a boundary without rule-columns mode and an unknown boundary', async () => {
    const fixture = await createCase();
    await expectRejected({ ...fixture, boundary: 'table' }, 'boundary-invalid');
    await expectRejected({ ...fixture, mode: 'rule-columns', boundary: 'grid' }, 'boundary-invalid');
  });

  test('the 10-argument CLI admits --boundary table', async () => {
    const fixture = await createCase();
    const result = await execFileAsync(process.execPath, [
      sanitizerCli, '--input', fixture.inputPath, '--output', fixture.outputPath,
      '--denylist', fixture.denylistPath, '--mode', 'rule-columns', '--boundary', 'table',
    ], { cwd: fixture.directory });
    expect(result.stdout).toBe(`SANITIZE_FIXTURE_OK ${sha256(await readFile(fixture.outputPath))}\n`);
  });

  test.each([
    ['--boundary without --mode', (f) => ['--input', f.inputPath, '--output', f.outputPath, '--denylist', f.denylistPath, '--boundary', 'table']],
    ['an unknown boundary value', (f) => ['--input', f.inputPath, '--output', f.outputPath, '--denylist', f.denylistPath, '--mode', 'rule-columns', '--boundary', 'region']],
    ['a duplicated --boundary', (f) => ['--input', f.inputPath, '--output', f.outputPath, '--mode', 'rule-columns', '--boundary', 'table', '--boundary', 'table']],
  ])('the CLI rejects %s with the exact value-free line', async (_label, argumentsFor) => {
    const fixture = await createCase();
    await expect(execFileAsync(process.execPath, [sanitizerCli, ...argumentsFor(fixture)], {
      cwd: fixture.directory,
    })).rejects.toMatchObject({
      code: 1,
      stdout: '',
      stderr: 'SANITIZE_FIXTURE_REJECTED cli-arguments-invalid\n',
    });
  });
});

async function sanitizeRuleBoundary(source, denylist, boundary) {
  const fixture = await createCase(source, denylist);
  await sanitizeFixture({ ...fixture, mode: 'rule-columns', boundary });
  return { fixture, output: await readFile(fixture.outputPath, 'utf8') };
}

const SYNTHETIC = Object.freeze({ dateTime: '2000-01-01T00:00:00Z', date: '2000-01-01' });
const PROBES = Object.freeze(['visually-hidden', 'display-none', 'text-truncated']);

function tableCapture(headers, rows) {
  return `<div><table data-garden-id="tables.table" data-test-id="generic-table"><thead data-garden-id="tables.head"><tr data-garden-id="tables.header_row">${headers.map(headerCell).join('')}</tr></thead><tbody data-garden-id="tables.body">${rows.map(ticketRow).join('')}</tbody></table></div>`;
}

function dateCapture(datetime) {
  return tableCapture(['', LABELS.priority, LABELS.date], [
    ['', 'High', `<time datetime="${datetime}">Yesterday at 10:03</time>`],
  ]);
}

function validRuleOutput() {
  return `<div><table data-garden-id="tables.table"><thead><tr data-garden-id="tables.header_row"><th>${LABELS.priority}</th><th>${LABELS.person}</th><th>${LABELS.group}</th><th>${LABELS.status}</th><th>${LABELS.date}</th></tr></thead><tbody><tr data-garden-id="tables.row"><td>Urgent</td><td><img alt="PERSON-001">PERSON-001</td><td>GROUP-001</td><td><span title="${STANDARD_STATUS}">${STANDARD_STATUS}</span></td><td><time datetime="${SYNTHETIC.dateTime}">DATE-001</time></td></tr><tr data-garden-id="tables.row"><td>Low</td><td>PERSON-SELF</td><td>GROUP-002</td><td>STATUS-001</td><td><time datetime="${SYNTHETIC.date}">DATE-002</time></td></tr></tbody></table></div>\n`;
}

describe('kept title, alt and datetime (D-13)', () => {
  test('keeps title and alt with the owning cell token and a standard Status title verbatim', async () => {
    const rows = tracerRows();
    rows[0][2] = `<img alt="${PRIVATE_VALUES.person}" data-test-id="avatar-image"><span>${PRIVATE_VALUES.person}</span>`;
    rows[0][4] = `<span title="${STANDARD_STATUS}">${STANDARD_STATUS}</span>`;
    rows[0][5] = `<span title="${PRIVATE_VALUES.subjects[0]}">${PRIVATE_VALUES.subjects[0]}</span>`;
    const { document, output } = await sanitizeRule(ruleCapture(rows), ruleDenylist());
    const first = document.querySelector('[data-garden-id="tables.row"]');
    expect(first.children[2].querySelector('img')?.getAttribute('alt')).toBe('PERSON-001');
    expect(first.children[2].textContent).toBe('PERSON-001');
    expect(first.children[4].querySelector('span')?.getAttribute('title')).toBe(STANDARD_STATUS);
    expect(first.children[5].querySelector('span')?.getAttribute('title')).toBe('SUBJECT-001');
    expect(first.children[5].textContent).toBe('SUBJECT-001');
    expect(validateRuleColumnOutput(output)).toMatchObject({ ticketRowCount: 3 });
  });

  test('keeps an identity-region avatar alt as PERSON-SELF', async () => {
    const { output } = await sanitizeRuleBoundary(
      identityCapture().replace('<img data-test-id="avatar-image">', `<img alt="${SELF_FORM}" data-test-id="avatar-image">`),
      ruleDenylist(),
      'identity-region',
    );
    expect(parseDetached(output).querySelector('img')?.getAttribute('alt')).toBe('PERSON-SELF');
  });

  test.each([
    ['2026-09-25T10:03:00Z', SYNTHETIC.dateTime],
    ['2026-09-25T10:03:00.000+02:00', SYNTHETIC.dateTime],
    ['2026-09-25T10:03', SYNTHETIC.dateTime],
    ['2026-09-25', SYNTHETIC.date],
  ])('replaces datetime %s with its synthetic class literal', async (datetime, expected) => {
    const { document, output } = await sanitizeRule(dateCapture(datetime), ruleDenylist());
    const time = document.querySelector('time');
    expect(time?.getAttribute('datetime')).toBe(expected);
    expect(time?.textContent).toBe('DATE-001');
    expect(ruleContract.SYNTHETIC_DATETIME).toEqual(SYNTHETIC);

    const repeat = await createCase(output, PARITY_DENYLIST);
    await sanitizeFixture({ ...repeat, mode: 'rule-columns' });
    expect(await readFile(repeat.outputPath, 'utf8')).toBe(output);
  });

  test.each(['yesterday', '25/09/2026'])('rejects an unrecognised datetime %s', async (datetime) => {
    const fixture = await createCase(dateCapture(datetime));
    await expectRejected({ ...fixture, mode: 'rule-columns' }, 'datetime-format-unrecognised');
  });
});

describe('identifier grammar, probe markers and removed attributes', () => {
  test.each([
    ['data-test-id', 'group-chip-42'],
    ['data-garden-id', 'tags.tag7'],
  ])('rejects a digit-bearing %s value', async (name, value) => {
    const rows = tracerRows();
    rows[0][3] = `<span ${name}="${value}">${PRIVATE_VALUES.group}</span>`;
    const fixture = await createCase(ruleCapture(rows));
    await expectRejected({ ...fixture, mode: 'rule-columns' }, 'identifier-value-invalid');
  });

  test('keeps digit-free identifiers such as tables.header_cell and tag-chip', async () => {
    const rows = tracerRows();
    rows[0][3] = `<span data-test-id="tag-chip">${PRIVATE_VALUES.group}</span>`;
    const { document } = await sanitizeRule(ruleCapture(rows), ruleDenylist());
    expect(document.querySelector('[data-test-id="tag-chip"]')?.textContent).toBe('GROUP-001');
    expect(document.querySelectorAll('[data-garden-id="tables.header_cell"]')).toHaveLength(HEADERS.length);
  });

  test('keeps the three probe markers and rejects any other value', async () => {
    expect(ruleContract.PROBE_MARKER_VALUES).toEqual(PROBES);
    const rows = tracerRows();
    rows[0][5] = PROBES.map((probe) => `<span data-zhroma-probe="${probe}">${PRIVATE_VALUES.subjects[0]}</span>`).join('');
    const { document } = await sanitizeRule(ruleCapture(rows), ruleDenylist());
    expect([...document.querySelectorAll('[data-zhroma-probe]')].map((node) => node.getAttribute('data-zhroma-probe')))
      .toEqual(PROBES);

    rows[0][5] = `<span data-zhroma-probe="capture">${PRIVATE_VALUES.subjects[0]}</span>`;
    const fixture = await createCase(ruleCapture(rows));
    await expectRejected({ ...fixture, mode: 'rule-columns' }, 'probe-marker-invalid');
  });

  test('removes class, style, id, name, value, placeholder and SVG geometry; unknown attributes reject', async () => {
    const rows = tracerRows();
    rows[0][5] = `<span id="subject-9" class="truncate_hash" style="color: red" name="subject" value="v" placeholder="p">${PRIVATE_VALUES.subjects[0]}</span><svg viewBox="0 0 16 16" width="16" height="16" focusable="false"><path d="M0 0L16 16" fill="currentColor" stroke="none"></path></svg>`;
    const { document } = await sanitizeRule(ruleCapture(rows), ruleDenylist());
    const span = document.querySelector('[data-garden-id="tables.row"]').children[5].querySelector('span');
    for (const name of ['id', 'class', 'style', 'name', 'value', 'placeholder']) {
      expect(span.hasAttribute(name)).toBe(false);
    }
    expect(document.querySelector('svg')?.attributes).toHaveLength(0);
    expect(document.querySelector('path')?.attributes).toHaveLength(0);

    rows[0][5] = `<span data-ticket-id="x">${PRIVATE_VALUES.subjects[0]}</span>`;
    const fixture = await createCase(ruleCapture(rows));
    await expectRejected({ ...fixture, mode: 'rule-columns' }, 'unsafe-attribute');
  });

  test('probe markers and synthetic dates are structural words, so colliding entries reject early', async () => {
    for (const word of [...PROBES, SYNTHETIC.dateTime, SYNTHETIC.date]) {
      expect(ruleContract.RULE_STRUCTURAL_WORDS).toContain(word.toLocaleLowerCase('en-US'));
    }
    for (const entry of ['hidden', '2000', 'truncated', 'isually']) {
      const fixture = await createCase('<script>unsafe()</script>', ruleDenylistWith({ plain: [...denylistValues, entry] }));
      await expectRejected({ ...fixture, mode: 'rule-columns' }, 'denylist-entry-collides');
    }
  });
});

describe('rule-columns output grammar', () => {
  test('accepts the canonical valid output', () => {
    expect(validateRuleColumnOutput(validRuleOutput())).toMatchObject({
      boundary: 'table',
      ticketRowCount: 2,
      tokenKinds: expect.objectContaining({ PERSON: 1, GROUP: 2, STATUS: 1, DATE: 2 }),
    });
  });

  test.each([
    ['a Status value inside a Group cell', (s) => s.replace('>GROUP-001<', `>${STANDARD_STATUS}<`), 'text-stand-in-required'],
    ['a residual raw word', (s) => s.replace('>GROUP-002<', '>Private Group<'), 'text-stand-in-required'],
    ['a kept title holding a raw value', (s) => s.replace('alt="PERSON-001"', `alt="${PRIVATE_VALUES.person}"`), 'text-stand-in-required'],
    ['a non-synthetic datetime', (s) => s.replace(`datetime="${SYNTHETIC.date}"`, 'datetime="2026-09-25"'), 'datetime-format-unrecognised'],
    ['a digit-bearing identifier', (s) => s.replace('<img ', '<img data-test-id="avatar-4521" '), 'identifier-value-invalid'],
    ['an invalid probe marker', (s) => s.replace('<img ', '<img data-zhroma-probe="capture" '), 'probe-marker-invalid'],
    ['a GROUP token inside a PERSON column', (s) => s.replace('>PERSON-SELF<', '>GROUP-001<'), 'token-kind-mismatch'],
    ['a reserved self token in a header cell', (s) => s.replace('<th>', '<th aria-label="PERSON-SELF">'), 'token-kind-mismatch'],
    ['a numbering gap', (s) => s.replaceAll('PERSON-001', 'PERSON-002'), 'token-numbering-invalid'],
    ['an HTML comment', (s) => s.replace('<table', '<!-- private --><table'), 'comment-must-be-absent'],
    ['a removed attribute', (s) => s.replace('<img ', '<img class="avatar_hash" '), 'unsafe-attribute'],
  ])('rejects %s with a stable code', (_label, mutate, code) => {
    expect(() => validateRuleColumnOutput(mutate(validRuleOutput()))).toThrow(expect.objectContaining({ code }));
  });
});

describe('v1 isolation and shared custody in rule-columns mode', () => {
  test('importing the rule module leaves every exported v1 Set with its original members', async () => {
    vi.resetModules();
    const v1 = await import('../../scripts/sanitized-output-contract.js');
    const snapshot = Object.fromEntries(Object.entries(v1)
      .filter(([, value]) => value instanceof Set)
      .map(([name, value]) => [name, [...value]]));
    expect(Object.keys(snapshot).length).toBeGreaterThanOrEqual(5);
    await import('../../scripts/rule-column-contract.js');
    await import('../../scripts/sanitize-fixture.js');
    for (const [name, members] of Object.entries(snapshot)) {
      expect([...v1[name]]).toEqual(members);
    }
    expect(v1.REMOVABLE_ATTRIBUTES.has('title')).toBe(true);
    expect(v1.REMOVABLE_ATTRIBUTES.has('alt')).toBe(true);
    expect(v1.REMOVABLE_ATTRIBUTES.has('datetime')).toBe(true);
    expect(v1.TEXTUAL_ARIA_ATTRIBUTES.has('title')).toBe(false);
  });

  test('rejects a denylist inside the worktree, directly or through a symlink', async () => {
    const fixture = await createCase();
    await expectRejected({ ...fixture, mode: 'rule-columns', denylistPath: join(repositoryRoot, 'package.json') }, 'denylist-inside-worktree');
    const linkPath = join(fixture.directory, 'denylist-link.txt');
    await symlink(join(repositoryRoot, 'package.json'), linkPath);
    await expectRejected({ ...fixture, mode: 'rule-columns', denylistPath: linkPath }, 'denylist-inside-worktree');
  });

  test('rejects a denylist aliasing the capture', async () => {
    const fixture = await createCase();
    await expectRejected({ ...fixture, mode: 'rule-columns', denylistPath: fixture.inputPath }, 'denylist-inside-worktree');
  });

  test('rejects input from inside the worktree', async () => {
    const fixture = await createCase();
    await expectRejected({
      ...fixture,
      mode: 'rule-columns',
      inputPath: join(repositoryRoot, 'scripts', 'sensitive-patterns.js'),
    }, 'input-inside-worktree');
  });

  test('never overwrites an existing output', async () => {
    const fixture = await createCase();
    await writeFile(fixture.outputPath, 'existing-safe-output', 'utf8');
    await expect(sanitizeFixture({ ...fixture, mode: 'rule-columns' })).rejects.toMatchObject({
      code: 'output-write-failed',
    });
    expect(await readFile(fixture.outputPath, 'utf8')).toBe('existing-safe-output');
  });
});
