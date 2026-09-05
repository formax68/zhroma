import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { Window } from 'happy-dom';
import { afterEach, describe, expect, test } from 'vitest';

import {
  sanitizeFixture,
  SanitizationError,
  sha256,
} from '../../scripts/sanitize-fixture.js';

const execFileAsync = promisify(execFile);
const repositoryRoot = process.cwd();
const sanitizerCli = join(repositoryRoot, 'scripts', 'sanitize-fixture.js');
const temporaryDirectories = [];

const denylistValues = [
  'Private Person',
  'Internal Organization',
  'Tenant Subject',
];

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

function safeCapture() {
  return `
<div id="tenant-table" class="layout_hash" style="display: block" aria-label="Internal Organization tickets" data-test-id="table-container" role="region" aria-rowcount="4">
  <table data-garden-id="tables.table" data-test-id="ticket-table" role="table">
    <thead data-test-id="table-header">
      <tr role="row">
        <th scope="col" data-test-id="subject-header">Subject</th>
        <th scope="col" data-test-id="priority-header">Priority</th>
      </tr>
    </thead>
    <tbody>
      <tr data-test-id="ticket-row" role="row" aria-rowindex="1">
        <td data-test-id="subject-cell">Tenant Subject for Private Person</td>
        <td data-test-id="priority-cell">Urgent</td>
      </tr>
      <tr data-test-id="ticket-row" role="row" aria-rowindex="2">
        <td data-test-id="subject-cell">requester@example.invalid at Internal Organization</td>
        <td data-test-id="priority-cell">High</td>
      </tr>
      <tr data-test-id="ticket-row" role="row" aria-rowindex="3">
        <td data-test-id="subject-cell">Ticket 987654321012345</td>
        <td data-test-id="priority-cell">Normal</td>
      </tr>
      <tr data-test-id="ticket-row" role="row" aria-rowindex="4">
        <td data-test-id="subject-cell">QWxwaGEyM0JldGExOURlbHRhNDU2R2FtbWE=</td>
        <td data-test-id="priority-cell">Low</td>
      </tr>
    </tbody>
  </table>
</div>`;
}

async function createCase(source = safeCapture()) {
  const directory = await mkdtemp(join(tmpdir(), 'zhroma-sanitizer-'));
  temporaryDirectories.push(directory);

  const inputPath = join(directory, 'private-input.html');
  const outputPath = join(directory, 'sanitized-output.html');
  const denylistPath = join(directory, 'private-denylist.txt');
  await writeFile(inputPath, source, 'utf8');
  await writeFile(denylistPath, `${denylistValues.join('\n')}\n`, 'utf8');

  return { directory, inputPath, outputPath, denylistPath };
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

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => (
    rm(directory, { recursive: true, force: true })
  )));
});

describe('sanitizeFixture', () => {
  test('rejects a canonically decomposed denylist attribute before writing, including CLI', async () => {
    const fixture = await createCase(safeCapture().replace(
      'data-test-id="ticket-table"', 'data-test-id="Jose\u0301"',
    ));
    await writeFile(fixture.denylistPath, 'Jos\u00e9\n', 'utf8');
    await expectRejected(fixture, 'sensitive-residual');
    await expect(execFileAsync(process.execPath, [
      sanitizerCli, '--input', fixture.inputPath,
      '--output', fixture.outputPath, '--denylist', fixture.denylistPath,
    ])).rejects.toMatchObject({
      code: 1, stdout: '', stderr: 'SANITIZE_FIXTURE_REJECTED sensitive-residual\n',
    });
    await expect(readFile(fixture.outputPath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('creates a deterministic, separate, topology-preserving output', async () => {
    const first = await createCase();
    const second = await createCase();
    const original = await readFile(first.inputPath);

    const firstResult = await sanitizeFixture(first);
    const secondResult = await sanitizeFixture(second);
    const firstBytes = await readFile(first.outputPath);
    const secondBytes = await readFile(second.outputPath);

    expect(firstBytes.equals(secondBytes)).toBe(true);
    expect(await readFile(first.inputPath)).toEqual(original);
    expect(firstResult).toEqual({
      sha256: sha256(firstBytes),
      bytes: firstBytes.byteLength,
    });
    expect(secondResult.sha256).toBe(firstResult.sha256);

    const parsed = parseDetached(firstBytes.toString('utf8'));
    expect(parsed.querySelector('[data-test-id="table-container"]')).not.toBeNull();
    expect(parsed.querySelector('[data-garden-id="tables.table"]')).not.toBeNull();
    expect(parsed.querySelectorAll('[data-test-id="ticket-row"]')).toHaveLength(4);
    expect(parsed.querySelector('[role="region"]')?.getAttribute('aria-rowcount')).toBe('4');
    expect(parsed.querySelector('[role="region"]')?.getAttribute('aria-label')).toBe('ARIA-001');
    expect(parsed.querySelector('[role="region"]')?.hasAttribute('id')).toBe(false);
    expect(parsed.querySelector('[role="region"]')?.hasAttribute('class')).toBe(false);
    expect(parsed.querySelector('[role="region"]')?.hasAttribute('style')).toBe(false);
    expect(parsed.querySelector('th')?.getAttribute('scope')).toBe('col');

    const text = parsed.body.textContent;
    for (const priority of ['Urgent', 'High', 'Normal', 'Low']) {
      expect(text).toContain(priority);
    }
    expect(text).toContain('TEXT-001');
    expect(text).not.toMatch(/Subject|Priority|Tenant Subject|Private Person/i);
    expect(text).not.toMatch(/requester@example|Internal Organization|987654321012345/);
    expect(text).not.toContain('QWxwaGEyM0JldGExOURlbHRhNDU2R2FtbWE=');
  });

  test('preserves only exact standalone English priority labels', async () => {
    const fixture = await createCase(
      safeCapture().replace('Tenant Subject for Private Person', 'Urgent customer issue'),
    );

    await sanitizeFixture(fixture);
    const output = await readFile(fixture.outputPath, 'utf8');

    expect(output).not.toContain('Urgent customer issue');
    expect(output.match(/>Urgent</g)).toHaveLength(1);
    expect(output.match(/>High</g)).toHaveLength(1);
    expect(output.match(/>Normal</g)).toHaveLength(1);
    expect(output.match(/>Low</g)).toHaveLength(1);
  });

  test('rejects input from inside the Git worktree', async () => {
    const fixture = await createCase();

    await expectRejected({
      inputPath: join(repositoryRoot, 'test', 'recon', 'sensitive-patterns.js'),
      outputPath: fixture.outputPath,
      denylistPath: fixture.denylistPath,
    }, 'input-inside-worktree');
  });

  test('rejects an in-place output target without mutating the input', async () => {
    const fixture = await createCase();
    const original = await readFile(fixture.inputPath);

    await expect(sanitizeFixture({
      ...fixture,
      outputPath: fixture.inputPath,
    })).rejects.toMatchObject({ code: 'input-output-must-differ' });

    expect(await readFile(fixture.inputPath)).toEqual(original);
  });

  test('rejects missing and empty capture-specific denylists before writing', async () => {
    const missing = await createCase();
    await rm(missing.denylistPath);
    await expectRejected(missing, 'denylist-required');

    const empty = await createCase();
    await writeFile(empty.denylistPath, '  \n', 'utf8');
    await expectRejected(empty, 'denylist-required');
  });

  test('rejects an empty capture before parsing or writing', async () => {
    const fixture = await createCase('');
    await expectRejected(fixture, 'input-size-out-of-bounds');
  });

  test('does not overwrite an existing sanitized output', async () => {
    const fixture = await createCase();
    await writeFile(fixture.outputPath, 'existing-safe-output', 'utf8');

    await expect(sanitizeFixture(fixture)).rejects.toMatchObject({
      code: 'output-write-failed',
    });
    expect(await readFile(fixture.outputPath, 'utf8')).toBe('existing-safe-output');
  });

  test.each([
    ['forbidden-element', '<script>globalThis.compromised = true</script>'],
    ['forbidden-element', '<iframe title="foreign"></iframe>'],
    ['forbidden-element', '<frame title="legacy">'],
    ['inline-event-handler', '<button onclick="run()">Open</button>'],
    ['resource-bearing-attribute', '<img src="/avatar.png">'],
    ['resource-bearing-attribute', '<a href="#ticket">Ticket</a>'],
    ['resource-bearing-attribute', '<div style="background: url(/avatar.png)">Styled</div>'],
    ['unsafe-attribute', '<tr data-ticket-id="123"><td>Ticket</td><td>Low</td></tr>'],
  ])('rejects unsafe markup with %s and writes no output', async (code, unsafe) => {
    const fixture = await createCase(safeCapture().replace('</tbody>', `${unsafe}</tbody>`));
    await expectRejected(fixture, code);
  });

  test('rejects a sensitive value that survives in an otherwise allowed attribute', async () => {
    const fixture = await createCase(
      safeCapture().replace('data-test-id="ticket-table"', 'data-test-id="Private Person"'),
    );

    await expectRejected(fixture, 'sensitive-residual');
  });

  test.each([
    '<div data-test-id="wrapper">No table here</div>',
    `${safeCapture()}<div data-test-id="unrelated-root">Second root</div>`,
  ])('rejects an unbounded or incomplete table capture', async (source) => {
    const fixture = await createCase(source);
    await expectRejected(fixture, 'table-boundary-required');
  });

  test('rejects an app root containing unrelated sibling UI', async () => {
    const fixture = await createCase(`
      <main data-test-id="app-root">
        <aside data-test-id="private-nav">High</aside>
        ${safeCapture()}
      </main>
    `);

    await expectRejected(fixture, 'table-boundary-required');
  });

  test('rejects mixed table ownership instead of combining a header and row', async () => {
    const fixture = await createCase(`
      <div>
        <table data-test-id="row-table"><tbody><tr data-test-id="ticket-row"><td>Urgent</td></tr></tbody></table>
        <table data-test-id="header-table"><thead><tr><th>Priority</th></tr></thead></table>
      </div>
    `);

    await expectRejected(fixture, 'table-boundary-required');
  });

  test('rewrites textual ARIA, removes references, and preserves validated state', async () => {
    const textualAttributes = [
      'aria-braillelabel',
      'aria-brailleroledescription',
      'aria-colindextext',
      'aria-description',
      'aria-keyshortcuts',
      'aria-placeholder',
      'aria-roledescription',
      'aria-rowindextext',
      'aria-valuetext',
    ];
    const referenceAttributes = [
      'aria-activedescendant',
      'aria-controls',
      'aria-describedby',
      'aria-details',
      'aria-errormessage',
      'aria-flowto',
      'aria-labelledby',
      'aria-owns',
    ];
    const addedAttributes = [
      ...textualAttributes.map((name) => `${name}="High"`),
      ...referenceAttributes.map((name) => `${name}="private-heading"`),
      'aria-expanded="FALSE"',
    ].join(' ');
    const fixture = await createCase(safeCapture().replace(
      'aria-rowcount="4"',
      `aria-rowcount="4" ${addedAttributes}`,
    ));

    await sanitizeFixture(fixture);
    const parsed = parseDetached(await readFile(fixture.outputPath, 'utf8'));
    const root = parsed.querySelector('[data-test-id="table-container"]');

    for (const name of ['aria-label', ...textualAttributes]) {
      expect(root?.getAttribute(name)).toMatch(/^ARIA-\d{3}$/u);
    }
    for (const name of referenceAttributes) {
      expect(root?.hasAttribute(name)).toBe(false);
    }
    expect(root?.getAttribute('aria-expanded')).toBe('false');
    expect(root?.getAttribute('aria-rowcount')).toBe('4');
  });

  test.each([
    ['unsafe-aria-attribute', 'aria-private-note="Private Person"'],
    ['aria-attribute-invalid', 'aria-selected="Private Person"'],
  ])('rejects unclassified or invalid ARIA with %s', async (code, attribute) => {
    const fixture = await createCase(safeCapture().replace(
      'aria-rowcount="4"',
      `aria-rowcount="4" ${attribute}`,
    ));

    await expectRejected(fixture, code);
  });

  test('rejects an invalid numeric ARIA value', async () => {
    const fixture = await createCase(safeCapture().replace(
      'aria-rowcount="4"',
      'aria-rowcount="four"',
    ));

    await expectRejected(fixture, 'aria-attribute-invalid');
  });

  test('preserves Priority words only inside resolved ticket-row Priority cells', async () => {
    const source = safeCapture()
      .replace('aria-label="Internal Organization tickets"', 'aria-label="Normal"')
      .replace('Tenant Subject for Private Person', '<span>Urgent</span>')
      .replace('requester@example.invalid at Internal Organization', 'High')
      .replace(
        '<tr data-test-id="ticket-row" role="row" aria-rowindex="3">',
        '<tr data-test-id="group-row" role="row"><td colspan="2"><span>Normal</span></td></tr><tr data-test-id="ticket-row" role="row" aria-rowindex="3">',
      )
      .replace('Ticket 987654321012345', '<span>Low</span>');
    const fixture = await createCase(source);

    await sanitizeFixture(fixture);
    const parsed = parseDetached(await readFile(fixture.outputPath, 'utf8'));
    const ticketRows = [...parsed.querySelectorAll('[data-test-id="ticket-row"]')];

    expect(ticketRows.map((row) => row.children[1]?.textContent)).toEqual([
      'Urgent',
      'High',
      'Normal',
      'Low',
    ]);
    for (const row of ticketRows) {
      expect(row.children[0]?.textContent).not.toMatch(/^(Urgent|High|Normal|Low)$/u);
    }
    expect(parsed.querySelector('[data-test-id="group-row"]')?.textContent)
      .not.toMatch(/^(Urgent|High|Normal|Low)$/u);
    expect(parsed.querySelector('[data-test-id="table-container"]')?.getAttribute('aria-label'))
      .toMatch(/^ARIA-\d{3}$/u);

    const output = parsed.body.innerHTML;
    for (const priority of ['Urgent', 'High', 'Normal', 'Low']) {
      expect(output.match(new RegExp(`>${priority}<`, 'gu'))).toHaveLength(1);
    }
  });

  test('the CLI fails closed without printing paths or denylist values', async () => {
    const fixture = await createCase();
    const insideWorktree = join(repositoryRoot, 'test', 'recon', 'sensitive-patterns.js');

    let output = '';
    try {
      await execFileAsync(process.execPath, [
        sanitizerCli,
        '--input', insideWorktree,
        '--output', fixture.outputPath,
        '--denylist', fixture.denylistPath,
      ]);
      expect.fail('expected sanitizer CLI to fail');
    } catch (error) {
      output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
      expect(error.code).not.toBe(0);
    }

    expect(output).toContain('SANITIZE_FIXTURE_REJECTED input-inside-worktree');
    expect(output).not.toContain(insideWorktree);
    expect(output).not.toContain(fixture.outputPath);
    expect(output).not.toContain(fixture.denylistPath);
    for (const value of denylistValues) {
      expect(output).not.toContain(value);
    }
  });

  test('the CLI executes invalid invocations from outside the repository', async () => {
    const fixture = await createCase();

    let failure;
    try {
      await execFileAsync(process.execPath, [sanitizerCli, '--input'], {
        cwd: fixture.directory,
      });
      expect.fail('expected sanitizer CLI to reject invalid arguments');
    } catch (error) {
      failure = error;
    }

    expect(failure.code).not.toBe(0);
    expect(failure.stdout).toBe('');
    expect(failure.stderr).toBe('SANITIZE_FIXTURE_REJECTED cli-arguments-invalid\n');
    expect(failure.stderr).not.toContain(fixture.directory);
    await expect(readFile(fixture.outputPath, 'utf8')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  test('the CLI creates and checksums output from outside the repository', async () => {
    const fixture = await createCase();
    const original = await readFile(fixture.inputPath);

    const result = await execFileAsync(process.execPath, [
      sanitizerCli,
      '--input', fixture.inputPath,
      '--output', fixture.outputPath,
      '--denylist', fixture.denylistPath,
    ], { cwd: fixture.directory });
    const output = await readFile(fixture.outputPath);

    expect(result.stderr).toBe('');
    expect(result.stdout).toBe(`SANITIZE_FIXTURE_OK ${sha256(output)}\n`);
    expect(result.stdout).not.toContain(fixture.directory);
    expect(await readFile(fixture.inputPath)).toEqual(original);
  });

  test('the CLI rejects missing or duplicate flags without echoing arguments', async () => {
    const fixture = await createCase();

    await expect(execFileAsync(process.execPath, [
      sanitizerCli,
      '--input', fixture.inputPath,
      '--input', fixture.inputPath,
      '--output', fixture.outputPath,
      '--denylist', fixture.denylistPath,
    ])).rejects.toMatchObject({ code: expect.any(Number) });
    await expect(readFile(fixture.outputPath, 'utf8')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });
});

describe('sha256', () => {
  test('hashes exact bytes rather than a normalized string', () => {
    expect(sha256(Buffer.from('fixture\n'))).not.toBe(sha256(Buffer.from('fixture')));
    expect(sha256(Buffer.from('fixture\n'))).toMatch(/^[a-f0-9]{64}$/);
  });
});
