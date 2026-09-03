import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { verifyReconLedger } from '../../scripts/verify-recon-gate.js';

const REQUIRED_LIVE_IDS = [
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
  'interaction-and-sticky-states',
  'inert-attribute-survival',
  'english-language-signal',
  'current-host-coverage',
];

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

test('accepts a complete synthetic entry in evidence and final modes', () => {
  const markdown = withVerdict(completeEntry());

  assert.deepEqual(verifyReconLedger(markdown, { mode: 'evidence' }), {
    entryCount: 1,
    verdict: null,
  });
  assert.deepEqual(verifyReconLedger(markdown, { mode: 'final' }), {
    entryCount: 1,
    verdict: 'proceed',
  });
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
    /missing required field: evidence/,
  );
  assert.throws(
    () => verifyReconLedger(unknownStatus, { mode: 'evidence' }),
    /unrecognized status: pending/,
  );
  assert.throws(
    () => verifyReconLedger(absentScenario, { mode: 'evidence' }),
    /missing required field: scenario/,
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
    /duplicate entry id: tracer-english-path/,
  );
  assert.throws(
    () => verifyReconLedger(mismatched, { mode: 'evidence' }),
    /heading and id field disagree/,
  );
});

test('final mode requires one explicit recognized verdict', () => {
  const missing = completeEntry();
  const unknown = withVerdict(completeEntry(), 'maybe');
  const duplicate = `${withVerdict(completeEntry())}\n## Final Verdict\n\n- verdict: \`block\`\n- rationale: Duplicate.\n`;

  assert.throws(
    () => verifyReconLedger(missing, { mode: 'final' }),
    /exactly one Final Verdict section/,
  );
  assert.throws(
    () => verifyReconLedger(unknown, { mode: 'final' }),
    /unrecognized verdict: maybe/,
  );
  assert.throws(
    () => verifyReconLedger(duplicate, { mode: 'final' }),
    /exactly one Final Verdict section/,
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
    /English-path question remains unresolved: live-dom-question/,
  );
  assert.throws(
    () => verifyReconLedger(markdown, { mode: 'evidence' }),
    /English-path question remains unresolved: live-dom-question/,
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
    /English-path entry cannot be outside English-only scope/,
  );
  assert.equal(
    verifyReconLedger(valid, { mode: 'evidence' }).entryCount,
    1,
  );
});

test('rejects an unsupported validator mode', () => {
  assert.throws(
    () => verifyReconLedger(completeEntry(), { mode: 'draft' }),
    /mode must be evidence or final/,
  );
});

test('repository ledger admits terminal evidence for every English-path question', async () => {
  const markdown = await readFile(
    new URL('../../SELECTORS.md', import.meta.url),
    'utf8',
  );

  for (const id of REQUIRED_LIVE_IDS) {
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

test('all seven spec-less planning probes remain visibly unresolved', async () => {
  const markdown = await readFile(
    new URL('../../SELECTORS.md', import.meta.url),
    'utf8',
  );
  const unresolvedRows = markdown.match(
    /^\| RECON-(?:01|02|03) \| (?:unclassified|adjacency|empty|ordering) \| unresolved \|/gm,
  );

  assert.equal(unresolvedRows?.length, 7);
});
