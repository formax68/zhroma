import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  copyFile,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import * as reconGate from '../../scripts/verify-recon-gate.js';

const EXPECTED_LIVE_IDS = [
  'shell-metadata',
  'top-document-reachability',
  'root-chain',
  'stable-identifiers',
  'header-topology',
  'priority-representation',
  'priority-absence',
  'ticket-vs-group-rows',
  'scrolling-and-recycling',
  'painting-element',
  'sticky-header-state',
  'interaction-and-sticky-states',
  'inert-attribute-survival',
  'english-language-signal',
  'current-host-coverage',
];
const ADMITTED_SCENARIOS = [
  'priority-present-ungrouped',
  'priority-absent',
  'grouped-long',
];
const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const GATE_SCRIPT = join(REPOSITORY_ROOT, 'scripts', 'verify-recon-gate.js');
const REPOSITORY_LEDGER = join(REPOSITORY_ROOT, 'SELECTORS.md');
const REPOSITORY_MANIFEST = join(
  REPOSITORY_ROOT,
  'test',
  'fixtures',
  'manifest.json',
);
const { verifyReconLedger } = reconGate;

function runGate(args, debug) {
  const env = { ...process.env };
  delete env.ZHROMA_RECON_DEBUG;
  if (debug !== undefined) env.ZHROMA_RECON_DEBUG = debug;
  return spawnSync(process.execPath, [GATE_SCRIPT, ...args], {
    cwd: REPOSITORY_ROOT, encoding: 'utf8', env,
  });
}



test('CLI emits stable codes without echoing an unknown status or duplicate id', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'zhroma-private-field-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const ledgerPath = join(directory, 'ledger.md');
  for (const [markdown, code] of [
    [completeEntry({ status: 'PRIVATE-STATUS-VALUE' }), 'entry-status-unrecognized'],
    [`${completeEntry({ id: 'private-person-id' })}\n${completeEntry({ id: 'private-person-id' })}`, 'entry-id-duplicate'],
  ]) {
    await writeFile(ledgerPath, markdown);
    const result = runGate(['evidence', ledgerPath]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, `RECON_GATE_REJECTED ${code}\n`);
    assert.doesNotMatch(result.stderr, /PRIVATE-STATUS-VALUE|private-person-id/);
  }
});

test('CLI rejects an unknown mode with a value-free argument code', () => {
  const result = runGate(['PRIVATE-MODE', REPOSITORY_LEDGER]);
  assert.equal(result.status, 1);
  assert.equal(result.stderr, 'RECON_GATE_REJECTED cli-arguments-invalid\n');
});

test('in-process failures are ReconGateError instances with a fixed message and code', () => {
  assert.equal(typeof reconGate.ReconGateError, 'function');
  assert.throws(() => verifyReconLedger('', { mode: 'evidence' }), (error) => (
    error instanceof reconGate.ReconGateError
    && error.code === 'ledger-markdown-required'
    && error.message === 'Recon ledger rejected'
  ));
});

const completeEntry = ({
  id = 'tracer-english-path',
  status = 'verified',
  scenario = 'synthetic-contract',
} = {}) => `## Ledger Entry: ${id}

- id: \`${id}\`
- question: Can a complete synthetic entry traverse the evidence gate?
- scope: \`English path\`
- status: \`${status}\`
- probe: \`document.querySelector('[data-synthetic="ticket-list"]') !== null\`
- evidence: Sanitized synthetic markup contains the expected test-only ticket-list marker.
- interpretation: The repository-side evidence contract is testable without asserting a live Zendesk fact.
- fallback: Block the gate and collect a complete, sanitized entry.
- scenario: \`${scenario}\`
`;

const withVerdict = (entries, verdict = 'proceed') => `${entries}
## Final Verdict

- verdict: \`${verdict}\`
- rationale: Synthetic contract exercise only; this is not a live Zendesk or Phase 1 conclusion.
`;

test('accepts a complete synthetic entry in evidence mode only', () => {
  const markdown = withVerdict(completeEntry());

  assert.deepEqual(verifyReconLedger(markdown, { mode: 'evidence' }), {
    entryCount: 1,
    verdict: null,
  });
  assert.throws(
    () => verifyReconLedger(markdown, {
      mode: 'final',
      admittedScenarios: ADMITTED_SCENARIOS,
    }),
    { name: 'ReconGateError', code: 'evidence-missing' },
  );
});

test('evidence mode accepts a complete terminal entry without a final verdict', () => {
  assert.deepEqual(verifyReconLedger(completeEntry(), { mode: 'evidence' }), {
    entryCount: 1,
    verdict: null,
  });
});

test('rejects missing required fields, unknown statuses, and absent scenarios', () => {
  const missingEvidence = completeEntry().replace(/^- evidence:.*\n/m, '');
  const unknownStatus = completeEntry({ status: 'pending' });
  const absentScenario = completeEntry({ scenario: '' });

  assert.throws(
    () => verifyReconLedger(missingEvidence, { mode: 'evidence' }),
    { name: 'ReconGateError', code: 'entry-field-missing' },
  );
  assert.throws(
    () => verifyReconLedger(unknownStatus, { mode: 'evidence' }),
    { name: 'ReconGateError', code: 'entry-status-unrecognized' },
  );
  assert.throws(
    () => verifyReconLedger(absentScenario, { mode: 'evidence' }),
    { name: 'ReconGateError', code: 'entry-field-missing' },
  );
});

test('rejects duplicate entry ids and entries whose heading disagrees with id', () => {
  const duplicate = `${completeEntry()}\n${completeEntry()}`;
  const mismatched = completeEntry().replace(
    '- id: `tracer-english-path`',
    '- id: `different-id`',
  );

  assert.throws(
    () => verifyReconLedger(duplicate, { mode: 'evidence' }),
    { name: 'ReconGateError', code: 'entry-id-duplicate' },
  );
  assert.throws(
    () => verifyReconLedger(mismatched, { mode: 'evidence' }),
    { name: 'ReconGateError', code: 'entry-heading-id-mismatch' },
  );
});

test('final mode requires one explicit recognized verdict', () => {
  const missing = completeEntry();
  const unknown = withVerdict(completeEntry(), 'maybe');
  const duplicate = `${withVerdict(completeEntry())}\n## Final Verdict\n\n- verdict: \`block\`\n- rationale: Duplicate.\n`;

  assert.throws(
    () => verifyReconLedger(missing, { mode: 'final' }),
    { name: 'ReconGateError', code: 'verdict-section-required' },
  );
  assert.throws(
    () => verifyReconLedger(unknown, { mode: 'final' }),
    { name: 'ReconGateError', code: 'verdict-unrecognized' },
  );
  assert.throws(
    () => verifyReconLedger(duplicate, { mode: 'final' }),
    { name: 'ReconGateError', code: 'verdict-section-required' },
  );
});

test('an unresolved English-path item fails evidence and final modes', () => {
  const unresolvedQuestion = `## Recon Question: live-dom-question

- id: \`live-dom-question\`
- question: What does the live DOM contain?
- scope: \`English path\`
- status: \`unresolved\`
- assumption: \`unresolved\`
- probe: \`document.querySelector('[data-live-probe]')\`
- evidence: Pending sanitized live evidence.
- interpretation: Pending live evidence.
- fallback: Block until the question has terminal evidence.
- scenario: \`priority-present-ungrouped\`
`;
  const markdown = withVerdict(`${completeEntry()}\n${unresolvedQuestion}`);

  assert.throws(
    () => verifyReconLedger(markdown, { mode: 'final' }),
    { name: 'ReconGateError', code: 'question-unresolved' },
  );
  assert.throws(
    () => verifyReconLedger(markdown, { mode: 'evidence' }),
    { name: 'ReconGateError', code: 'question-unresolved' },
  );
});

test('outside-scope status is reserved for explicitly non-English work', () => {
  const invalid = completeEntry({ status: 'outside English-only scope' });
  const valid = invalid.replace(
    '- scope: `English path`',
    '- scope: `Localization only`',
  );

  assert.throws(
    () => verifyReconLedger(invalid, { mode: 'evidence' }),
    { name: 'ReconGateError', code: 'entry-scope-status-conflict' },
  );
  assert.equal(
    verifyReconLedger(valid, { mode: 'evidence' }).entryCount,
    1,
  );
});

test('rejects an unsupported validator mode', () => {
  assert.throws(
    () => verifyReconLedger(completeEntry(), { mode: 'draft' }),
    { name: 'ReconGateError', code: 'mode-invalid' },
  );
});

test('repository ledger admits terminal evidence for every English-path question', async () => {
  const markdown = await readFile(
    new URL('../../SELECTORS.md', import.meta.url),
    'utf8',
  );

  assert.deepEqual(Object.keys(reconGate.REQUIRED_LIVE_EVIDENCE), EXPECTED_LIVE_IDS);

  for (const id of EXPECTED_LIVE_IDS) {
    const heading = `## Ledger Entry: ${id}`;
    const start = markdown.indexOf(heading);
    assert.notEqual(start, -1, `missing live evidence section ${id}`);
    const next = markdown.indexOf('\n## ', start + heading.length);
    const section = markdown.slice(start, next === -1 ? undefined : next);

    assert.match(section, /^- status: `(verified|disproved)`$/m);
    assert.doesNotMatch(section, /^- assumption: `unresolved`$/m);

    assert.match(section, /^- question: .+$/m);
    assert.match(section, /^- probe: .+$/m);
    assert.match(section, /^- evidence: .+$/m);
    assert.match(section, /^- interpretation: .+$/m);
    assert.match(section, /^- fallback: .+$/m);
    assert.match(section, /^- scenario: .+$/m);
  }

  assert.match(markdown, /^- state: interaction-evidence-complete$/m);
  assert.match(markdown, /^- post-action-state: interactions-complete$/m);
});

test('final mode binds the complete repository ledger to admitted scenarios', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');

  assert.deepEqual(verifyReconLedger(markdown, {
    mode: 'final',
    admittedScenarios: ADMITTED_SCENARIOS,
  }), {
    entryCount: 18,
    verdict: 'proceed',
  });

  const fabricatedScenario = markdown.replace(
    '- scenario: `priority-absent`\n\n## Ledger Entry: ticket-vs-group-rows',
    '- scenario: `fabricated-live-scenario`\n\n## Ledger Entry: ticket-vs-group-rows',
  );
  assert.throws(
    () => verifyReconLedger(fabricatedScenario, {
      mode: 'final',
      admittedScenarios: ADMITTED_SCENARIOS,
    }),
    { name: 'ReconGateError', code: 'proceed-conflicts-with-blockers' },
  );
});

test('final proceed fails closed when interaction paint evidence is not positive', async () => {
  const markdown = (await readFile(REPOSITORY_LEDGER, 'utf8'))
    .replace('- selected-row-count: `1`', '- selected-row-count: `0`')
    .replace('- verdict: `block`', '- verdict: `proceed`');

  assert.throws(
    () => verifyReconLedger(markdown, {
      mode: 'final',
      admittedScenarios: ADMITTED_SCENARIOS,
    }),
    { name: 'ReconGateError', code: 'proceed-conflicts-with-blockers' },
  );
});

test('CLI rejects omitted and extra arguments for evidence and final modes', () => {
  const missingManifest = spawnSync(
    process.execPath,
    [GATE_SCRIPT, 'final', REPOSITORY_LEDGER],
    { cwd: REPOSITORY_ROOT, encoding: 'utf8' },
  );
  const extraManifest = spawnSync(
    process.execPath,
    [GATE_SCRIPT, 'final', REPOSITORY_LEDGER, REPOSITORY_MANIFEST, 'extra'],
    { cwd: REPOSITORY_ROOT, encoding: 'utf8' },
  );
  const extraEvidence = spawnSync(
    process.execPath,
    [GATE_SCRIPT, 'evidence', REPOSITORY_LEDGER, REPOSITORY_MANIFEST],
    { cwd: REPOSITORY_ROOT, encoding: 'utf8' },
  );

  for (const result of [missingManifest, extraManifest, extraEvidence]) {
    assert.notEqual(result.status, 0);
    assert.equal(result.stderr, 'RECON_GATE_REJECTED cli-arguments-invalid\n');
  }
});

test('final CLI rejects active hash-matching fixtures through the shared validator', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'zhroma-unsafe-final-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const manifest = JSON.parse(await readFile(REPOSITORY_MANIFEST, 'utf8'));
  const activeMarkup = '<script>globalThis.compromised=true</script>';

  for (const entry of manifest.fixtures) {
    await writeFile(join(directory, entry.file), activeMarkup, 'utf8');
    entry.sha256 = createHash('sha256').update(activeMarkup).digest('hex');
  }
  const manifestPath = join(directory, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest), 'utf8');

  const result = spawnSync(
    process.execPath,
    [GATE_SCRIPT, 'final', REPOSITORY_LEDGER, manifestPath],
    { cwd: REPOSITORY_ROOT, encoding: 'utf8' },
  );
  assert.notEqual(result.status, 0);
  assert.equal(result.stderr, 'RECON_GATE_REJECTED unexpected-error\n');
});

test('final CLI rejects an in-corpus symlink to an external fixture', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'zhroma-symlink-final-'));
  const outsideDirectory = await mkdtemp(join(tmpdir(), 'zhroma-symlink-target-'));
  t.after(() => Promise.all([
    rm(directory, { recursive: true, force: true }),
    rm(outsideDirectory, { recursive: true, force: true }),
  ]));
  const manifest = JSON.parse(await readFile(REPOSITORY_MANIFEST, 'utf8'));

  for (const entry of manifest.fixtures) {
    await copyFile(
      join(dirname(REPOSITORY_MANIFEST), entry.file),
      join(directory, entry.file),
    );
  }
  const targetEntry = manifest.fixtures[0];
  const targetPath = join(outsideDirectory, targetEntry.file);
  await copyFile(
    join(dirname(REPOSITORY_MANIFEST), targetEntry.file),
    targetPath,
  );
  await rm(join(directory, targetEntry.file));
  await symlink(targetPath, join(directory, targetEntry.file));
  const manifestPath = join(directory, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest), 'utf8');

  const result = spawnSync(
    process.execPath,
    [GATE_SCRIPT, 'final', REPOSITORY_LEDGER, manifestPath],
    { cwd: REPOSITORY_ROOT, encoding: 'utf8' },
  );
  assert.notEqual(result.status, 0);
  assert.equal(result.stderr, 'RECON_GATE_REJECTED fixture-path-must-be-contained\n');
});

test('assumptions contract preserves seven rows with six gating proofs and one flagged exception', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  assert.equal((markdown.match(/^\| RECON-0[23] \| (?:adjacency|empty|ordering) \| resolved \| gating \|/gm) ?? []).length, 6);
  assert.match(markdown, /^\| RECON-01 \| unclassified \| unresolved \| non-gating \|/m);
  assert.match(markdown, /^- flagged-assumptions: `RECON-01\/unclassified`$/m);
});

function mutateEntry(markdown, id, transform) {
  const heading = `## Ledger Entry: ${id}\n`;
  const start = markdown.indexOf(heading);
  assert.notEqual(start, -1);
  const next = markdown.indexOf('\n## ', start + heading.length);
  const end = next === -1 ? markdown.length : next;
  return markdown.slice(0, start) + transform(markdown.slice(start, end)) + markdown.slice(end);
}

function finalCheck(markdown) {
  return verifyReconLedger(markdown, { mode: 'final', admittedScenarios: ADMITTED_SCENARIOS });
}





function expectBlockers(markdown, expected) {
  let caught;
  try { finalCheck(markdown); } catch (error) { caught = error; }
  assert.ok(caught instanceof reconGate.ReconGateError);
  assert.equal(caught.code, 'proceed-conflicts-with-blockers');
  for (const code of expected) assert.ok(caught.blockers.includes(code), code);
  return caught.blockers;
}



test('required evidence rejects inadmissible statuses and scenario sets', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  expectBlockers(mutateEntry(markdown, 'shell-metadata', s => s.replace(
    '- status: `verified`', '- status: `disproved`')), ['required-evidence-status-inadmissible']);
  for (const id of EXPECTED_LIVE_IDS) {
    expectBlockers(mutateEntry(markdown, id, s => s.replace(/^- scenario:.*$/m,
      '- scenario: `not-run-localization-only`')), ['required-evidence-scenario-mismatch']);
  }
});

test('required contracts exactly match recorded evidence including disproved findings', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  assert.deepEqual(Object.keys(reconGate.REQUIRED_LIVE_EVIDENCE), EXPECTED_LIVE_IDS);
  for (const id of EXPECTED_LIVE_IDS) {
    mutateEntry(markdown, id, section => {
      const field = name => section.match(new RegExp(`^- ${name}: (.*)$`, 'm'))[1].replaceAll('`', '');
      assert.deepEqual(reconGate.REQUIRED_LIVE_EVIDENCE[id], {
        scope: field('scope'), statuses: [field('status')], scenarios: field('scenario').split(',').map(s => s.trim()),
      });
      return section;
    });
  }
});

test('empty ledgers and blank required fields reject with stable codes', () => {
  assert.throws(() => verifyReconLedger('# Empty ledger', { mode: 'evidence' }), { code: 'ledger-entries-required' });
  assert.throws(() => verifyReconLedger(completeEntry().replace(/^- evidence:.*$/m, '- evidence: '),
    { mode: 'evidence' }), { code: 'entry-field-missing' });
});

test('blocker ordering does not depend on ledger section order', async () => {
  let markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  markdown = mutateEntry(markdown, 'shell-metadata', s => s.replace('- status: `verified`', '- status: `disproved`'));
  markdown = mutateEntry(markdown, 'painting-element', s => s.replace(/^- scenario:.*$/m, '- scenario: `not-run-localization-only`'));
  const before = expectBlockers(markdown, ['required-evidence-status-inadmissible', 'required-evidence-scenario-mismatch']);
  const sections = markdown.match(/^## Ledger Entry: [\s\S]*?(?=^## |$(?![\s\S]))/gm);
  const a = sections.find(s => s.startsWith('## Ledger Entry: shell-metadata\n'));
  const b = sections.find(s => s.startsWith('## Ledger Entry: painting-element\n'));
  const swapped = markdown.replace(a, 'SWAP-SECTION').replace(b, a).replace('SWAP-SECTION', b);
  assert.deepEqual(expectBlockers(swapped, before), before);
});


describe('final gate audit regressions', () => {
test('CLI never echoes a supplied private ledger path unless debug is exactly 1', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'zhroma-private-ledger-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const privatePath = join(directory, 'PRIVATE-PERSON-NAME-missing.md');
  for (const debug of [undefined, '', '0', 'true', '2']) {
    const result = runGate(['final', privatePath, REPOSITORY_MANIFEST], debug);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, 'RECON_GATE_REJECTED ledger-readable-required\n');
    assert.ok(!result.stderr.includes(privatePath));
    assert.ok(!result.stderr.includes('PRIVATE-PERSON-NAME'));
  }
  const debugResult = runGate(['final', privatePath, REPOSITORY_MANIFEST], '1');
  assert.equal(debugResult.status, 1);
  assert.ok(debugResult.stderr.startsWith('RECON_GATE_REJECTED ledger-readable-required\n'));
  assert.ok(debugResult.stderr.includes(privatePath));
});

test('final gate rejects arbitrary private paint', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  const mutated = mutateEntry(markdown, 'interaction-and-sticky-states', section => section
    .replace(/^- normal-paint:.*$/m, '- normal-paint: `PRIVATE-NORMAL`')
    .replace(/^- hover-paint:.*$/m, '- hover-paint: `PRIVATE-HOVER`')
    .replace(/^- selected-paint:.*$/m, '- selected-paint: `PRIVATE-SELECTED`'));
  expectBlockers(mutated, ['interaction-grammar-violated']);
});

test('final gate rejects paint differing only by whitespace and case', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  const mutated = mutateEntry(markdown, 'interaction-and-sticky-states', section => {
    const normal = section.match(/^- normal-paint: `(.*)`$/m)[1];
    return section.replace(/^- hover-paint:.*$/m,
      `- hover-paint: \`${normal.replaceAll(', ', ',  ').replaceAll('rgb', 'RGB')}\``);
  });
  expectBlockers(mutated, ['interaction-grammar-violated']);
});

test('required evidence cannot be relabeled as localization-only', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  for (const id of EXPECTED_LIVE_IDS) {
    const changed = mutateEntry(markdown, id, section => section
      .replace('- scope: `English path`', '- scope: `Localization only`')
      .replace(/^- status:.*$/m, '- status: `outside English-only scope`')
      .replace(/^- scenario:.*$/m, '- scenario: `not-run-localization-only`'));
    expectBlockers(changed, ['required-evidence-scope-mismatch']);
  }
});

test('CR-08: disproved identifiers with intact prose cannot authorize fallback', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  expectBlockers(mutateEntry(markdown, 'stable-identifiers', s => s.replace(
    '- status: `verified`', '- status: `disproved`')), ['selector-fallback-not-matrix-proven']);
});
test('CR-10: declared-input-unresolved blocks a gating row', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  expectBlockers(mutateAssumption(markdown, 'RECON-02', 'empty', cells => { cells[2] = 'unresolved'; }), ['declared-input-unresolved']);
});
});

function verdictField(markdown, name, value) {
  const line = `- ${name}: \`${value}\``;
  const pattern = new RegExp(`^- ${name}:.*$`, 'm');
  return pattern.test(markdown) ? markdown.replace(pattern, line)
    : markdown.replace('## Final Verdict\n', `## Final Verdict\n\n${line}\n`);
}

test('proven fallback requires an existing proof path', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  expectBlockers(verdictField(markdown, 'fallback-rung-1',
    'garden-pair | proven | test/recon/does-not-exist.js'), ['fallback-evidence-path-missing']);
});

test('verdict authorization enums and fallback states are closed', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  for (const field of ['closed-shadow-dom-state', 'garden-identifier-state', 'corpus-gates-state', 'interaction-gate-state']) {
    expectBlockers(verdictField(markdown, field, 'unknown'), ['verdict-field-not-structured']);
  }
  expectBlockers(verdictField(markdown, 'fallback-rung-3', 'structural | unknown | none'), ['verdict-field-not-structured']);
});

test('null-shadowRoot alone does not rule out a closed root', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  const changed = mutateEntry(markdown, 'root-chain', s => s.replace(/^- shadow-root-proof:.*$/m, '- shadow-root-proof: `null-shadowRoot`'));
  expectBlockers(changed, ['closed-root-not-ruled-out']);
});

function mutateAssumption(markdown, requirement, category, mutate) {
  const pattern = new RegExp(`^\\| ${requirement} \\| ${category} \\|.*$`, 'm');
  assert.match(markdown, pattern);
  return markdown.replace(pattern, line => {
    const cells = line.split('|').slice(1, -1).map(s => s.trim());
    // Before the schema migration, create the proposed shape for RED probes.
    if (cells.length === 4) cells.splice(3, 0, 'gating', '');
    mutate(cells);
    return '| ' + cells.join(' | ') + ' |';
  });
}

test('resolved gating rows need bound proof references', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  for (const evidence of ['', 'test/recon/missing.test.js#missing', 'test/recon/recon-gate.smoke.js#nonexistent-case']) {
    expectBlockers(mutateAssumption(markdown, 'RECON-02', 'empty', cells => {
      cells[2] = 'resolved'; cells[4] = evidence;
    }), ['declared-input-evidence-missing']);
  }
});

test('the non-gating assumption must be surfaced by exact name', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  expectBlockers(verdictField(markdown, 'flagged-assumptions', 'none'), ['flagged-assumption-not-surfaced']);
});

test('assumption section and table shape are required', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  const noSection = markdown.replace(/^## Spec-less Planning Assumptions[\s\S]*?(?=^## Final Verdict)/m, '');
  assert.throws(() => finalCheck(noSection), { code: 'assumption-table-required' });
  for (const mutation of [
    cells => { cells[3] = 'unknown'; },
    cells => { cells[2] = 'unknown'; },
  ]) assert.throws(() => finalCheck(mutateAssumption(markdown, 'RECON-02', 'empty', mutation)), { code: 'assumption-row-invalid' });
});

test('audit: private words inside CSS functions cannot satisfy paint evidence', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  for (const paint of [
    'row=color:color(private person),image:none|direct-cells=color:rgb(1,2,3),image:none|pane=color:rgb(4,5,6),image:none',
    'row=color:rgb(1,2,3),image:linear-gradient(private person)|direct-cells=color:rgb(1,2,3),image:none|pane=color:rgb(4,5,6),image:none',
  ]) expectBlockers(mutateEntry(markdown, 'interaction-and-sticky-states', s => s.replace(/^- normal-paint:.*$/m,
    `- normal-paint: \`${paint}\``)), ['interaction-grammar-violated']);
});

test('audit: existing unrelated test files cannot prove a fallback rung', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  for (const [number, id] of [[2, 'test-id-pair'], [3, 'structural']]) {
    let changed = verdictField(markdown, 'garden-identifier-state', 'absent');
    changed = verdictField(changed, `fallback-rung-${number}`, `${id} | proven | test/recon/dependency-approvals.smoke.js`);
    changed = verdictField(changed, 'selector-authorization', id);
    expectBlockers(changed, ['selector-fallback-not-matrix-proven']);
  }
});

test('audit: new verdict metadata uses closed identifiers and proof tokens', async () => {
  const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
  for (const [field, value] of [
    ['fallback-rung-3', 'structural | unproven | private person'],
    ['fallback-rung-3', 'structural | unproven | /private/capture'],
    ['flagged-assumptions', 'RECON-01/unclassified, private person'],
  ]) expectBlockers(verdictField(markdown, field, value), ['verdict-field-not-structured']);
});
