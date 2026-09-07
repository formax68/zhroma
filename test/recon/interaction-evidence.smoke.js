import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { assessInteractionEvidence, InteractionEvidenceError } from '../../scripts/interaction-evidence.js';

const ENTRY_ID = 'interaction-and-sticky-states';

const positiveEntry = `## Ledger Entry: interaction-and-sticky-states

- id: \`interaction-and-sticky-states\`
- question: Did the user-controlled interaction seam yield hover and selected-row computed-paint evidence sufficient to validate the proposed translucent tint?
- scope: \`English path\`
- status: \`verified\`
- probe: \`rows.filter(row => row.matches(':hover'))\`
- evidence: Sanitized computed paint from genuine normal, hovered, and selected ticket rows in one table.
- interpretation: Native interaction paint is distinct and its owner is recorded without tenant content.
- fallback: Block Phase 2 if any required state or paint summary is absent.
- selected-row-count: \`1\`
- hovered-row-count: \`1\`
- normal-paint: \`row=color:rgba(0,0,0,0),image:none|direct-cells=color:rgba(0,0,0,0),image:none|pane=color:rgb(255,255,255),image:none\`
- hover-paint: \`row=color:rgba(0,0,0,0),image:none|direct-cells=color:rgb(245,245,245),image:none|pane=color:rgb(255,255,255),image:none\`
- selected-paint: \`row=color:rgba(0,0,0,0),image:none|direct-cells=color:rgb(230,240,255),image:none|pane=color:rgb(255,255,255),image:none\`
- actual-paint-owner: \`direct-cells\`
- interaction-owner: \`user\`
- scenario: \`priority-present-grouped-long\`
`;

const blockedEntry = `## Ledger Entry: interaction-and-sticky-states

- id: \`interaction-and-sticky-states\`
- question: Did the user-controlled interaction seam yield hover and selected-row computed-paint evidence sufficient to validate the proposed translucent tint?
- scope: \`English path\`
- status: \`disproved\`
- probe: \`rows.filter(row => row.matches(':hover'))\`
- evidence: The prior inspection returned 0 selected rows and 0 hovered rows; selectedPaint was null and hoveredPaint was null.
- interpretation: The prior seam did not establish native interaction paint.
- fallback: Keep Phase 2 blocked until positive sanitized interaction evidence is admitted.
- scenario: \`priority-present-grouped-long\`
`;

test('keeps a zero-row observation as an explicit interaction block', () => {
  assert.deepEqual(assessInteractionEvidence(blockedEntry), {
    id: ENTRY_ID,
    status: 'disproved',
    verdict: 'block',
    reason: 'interaction-evidence-unavailable',
  });
});

test('admits the repository interaction evidence after the human gate', async () => {
  const markdown = await readFile(
    new URL('../../SELECTORS.md', import.meta.url),
    'utf8',
  );

  assert.deepEqual(assessInteractionEvidence(markdown), {
    id: ENTRY_ID,
    status: 'verified',
    verdict: 'evidence-ready',
    scenario: 'priority-present-grouped-long',
    selectedRowCount: 1,
    hoveredRowCount: 1,
    actualPaintOwner: 'row',
  });
});

test('admits positive, scenario-bound normal, hover, and selected paint evidence', () => {
  assert.deepEqual(assessInteractionEvidence(positiveEntry), {
    id: ENTRY_ID,
    status: 'verified',
    verdict: 'evidence-ready',
    scenario: 'priority-present-grouped-long',
    selectedRowCount: 1,
    hoveredRowCount: 1,
    actualPaintOwner: 'direct-cells',
  });
});

test('rejects verified evidence without positive counts or distinct paint observations', () => {
  const cases = [
    positiveEntry.replace('- selected-row-count: `1`', '- selected-row-count: `0`'),
    positiveEntry.replace('- hovered-row-count: `1`', '- hovered-row-count: `0`'),
    positiveEntry.replace(
      /^- selected-paint:.*$/m,
      positiveEntry.match(/^- normal-paint:.*$/m)[0].replace('normal-paint', 'selected-paint'),
    ),
  ];

  for (const markdown of cases) {
    assert.throws(
      () => assessInteractionEvidence(markdown),
      error => error instanceof InteractionEvidenceError && ['positive-count-required', 'paint-observations-not-distinct'].includes(error.code),
    );
  }
});

test('rejects incomplete or wrongly attributed verified evidence', () => {
  const cases = [
    positiveEntry.replace(/^- actual-paint-owner:.*\n/m, ''),
    positiveEntry.replace(
      '- scenario: `priority-present-grouped-long`',
      '- scenario: `another-view`',
    ),
    positiveEntry.replace('- interaction-owner: `user`', '- interaction-owner: `agent`'),
    positiveEntry.replace('- scope: `English path`', '- scope: `Localization only`'),
  ];

  for (const markdown of cases) {
    assert.throws(
      () => assessInteractionEvidence(markdown),
      error => error instanceof InteractionEvidenceError && ['missing-field', 'scenario-not-admitted', 'user-control-required', 'scope-not-admitted'].includes(error.code),
    );
  }
});

test('fails closed on raw or unexpected evidence without echoing sensitive values', () => {
  const secretValues = [
    ['ticket-id', 'TICKET-987654'],
    ['person', 'PRIVATE-PERSON-NAME'],
    ['organization', 'PRIVATE-ORGANIZATION'],
    ['tenant', 'PRIVATE-TENANT'],
    ['account', 'PRIVATE-ACCOUNT'],
    ['raw-capture', '/private/capture/location'],
  ];

  for (const [field, value] of secretValues) {
    assert.throws(
      () => assessInteractionEvidence(`${positiveEntry}- ${field}: \`${value}\`\n`),
      (error) => {
        assert.equal(error.code, 'unexpected-field');
        assert.doesNotMatch(error.message, new RegExp(value.replaceAll('/', '\\/')));
        return true;
      },
    );
  }

  const paintWithRawValue = positiveEntry.replace(
    'direct-cells=color:rgb(245,245,245),image:none',
    'direct-cells=color:PRIVATE-PERSON-NAME,image:none',
  );
  assert.throws(
    () => assessInteractionEvidence(paintWithRawValue),
    (error) => {
      assert.equal(error.code, 'paint-summary-invalid');
      assert.doesNotMatch(error.message, /PRIVATE-PERSON-NAME/);
      return true;
    },
  );
});

test('does not accept host.shadowRoot === null as Shadow DOM proof', () => {
  const invalid = positiveEntry.replace(
    "rows.filter(row => row.matches(':hover'))",
    'host.shadowRoot === null',
  );

  assert.throws(
    () => assessInteractionEvidence(invalid),
    { name: 'InteractionEvidenceError', code: 'invalid-shadow-proof' },
  );
});

test('parses only the named interaction ledger section', () => {
  const unrelated = `## Ledger Entry: shell-metadata

- id: \`shell-metadata\`
- status: \`verified\`
- ticket-id: \`RAW-TICKET-VALUE\`
`;

  assert.equal(
    assessInteractionEvidence(`${unrelated}\n${positiveEntry}`).verdict,
    'evidence-ready',
  );
});

test('canonicalizes whitespace and case before paint distinctness', () => {
  const normal = positiveEntry.match(/^- normal-paint: `(.*)`$/m)[1];
  const changed = positiveEntry.replace(/^- hover-paint:.*$/m,
    `- hover-paint: \`${normal.replace(/,(?=[0-9])/g, ',  ').replaceAll('rgb', 'RGB')}\``);
  assert.throws(() => assessInteractionEvidence(changed), {
    name: 'InteractionEvidenceError', code: 'paint-observations-not-distinct',
  });
});
