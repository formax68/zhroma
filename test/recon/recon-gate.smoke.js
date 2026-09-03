import assert from 'node:assert/strict';
import { test } from 'node:test';

import { verifyReconLedger } from '../../scripts/verify-recon-gate.js';

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

test('an unresolved English-path item cannot produce proceed', () => {
  const markdown = withVerdict(completeEntry({ status: 'unresolved' }));

  assert.throws(
    () => verifyReconLedger(markdown, { mode: 'final' }),
    /unrecognized status: unresolved/,
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
