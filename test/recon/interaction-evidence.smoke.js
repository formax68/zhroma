import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const ENTRY_ID = 'interaction-and-sticky-states';

const STANDARD_FIELDS = Object.freeze([
  'id',
  'question',
  'scope',
  'status',
  'probe',
  'evidence',
  'interpretation',
  'fallback',
  'scenario',
]);

const POSITIVE_FIELDS = Object.freeze([
  'selected-row-count',
  'hovered-row-count',
  'normal-paint',
  'hover-paint',
  'selected-paint',
  'actual-paint-owner',
  'interaction-owner',
]);

const ALLOWED_FIELDS = new Set([...STANDARD_FIELDS, ...POSITIVE_FIELDS]);
const PAINT_OWNER = /^(?:row|direct-cells|pane|mixed)$/;
const COLOR = String.raw`(?:transparent|rgba?\([0-9.,% /+-]+\)|color\([a-z0-9.,% /+-]+\)|#[0-9a-f]{3,8})`;
const IMAGE = String.raw`(?:none|(?:linear|radial)-gradient\([a-z0-9#.,%() /+-]+\))`;
const PAINT_SUMMARY = new RegExp(
  String.raw`^row=color:${COLOR},image:${IMAGE}\|direct-cells=color:${COLOR},image:${IMAGE}\|pane=color:${COLOR},image:${IMAGE}$`,
  'i',
);

function reject(code) {
  throw new Error(`interaction evidence rejected: ${code}`);
}

function unwrap(value) {
  return value.startsWith('`') && value.endsWith('`')
    ? value.slice(1, -1)
    : value;
}

function namedEntry(markdown) {
  if (typeof markdown !== 'string') {
    reject('markdown-string-required');
  }

  const heading = `## Ledger Entry: ${ENTRY_ID}`;
  const start = markdown.indexOf(heading);
  if (start === -1) {
    reject('missing-entry');
  }

  const next = markdown.indexOf('\n## ', start + heading.length);
  return markdown.slice(start, next === -1 ? undefined : next);
}

function parseFields(section) {
  const fields = new Map();
  for (const match of section.matchAll(/^- ([a-z0-9-]+): (.+)$/gm)) {
    const [, name, rawValue] = match;
    if (!ALLOWED_FIELDS.has(name)) {
      reject('unexpected-field');
    }
    if (fields.has(name)) {
      reject('duplicate-field');
    }
    fields.set(name, unwrap(rawValue.trim()));
  }
  return fields;
}

function requireFields(fields, names) {
  if (names.some((name) => !fields.has(name) || fields.get(name) === '')) {
    reject('missing-field');
  }
}

function positiveCount(fields, name) {
  const value = fields.get(name);
  if (!/^[1-9]\d*$/.test(value)) {
    reject('positive-count-required');
  }
  return Number(value);
}

function assessInteractionEvidence(markdown) {
  const section = namedEntry(markdown);
  const fields = parseFields(section);
  requireFields(fields, STANDARD_FIELDS);

  if (fields.get('id') !== ENTRY_ID) {
    reject('entry-id-mismatch');
  }
  if (fields.get('scope') !== 'English path') {
    reject('scope-not-admitted');
  }
  if (/\.shadowRoot\s*={2,3}\s*null/.test(fields.get('probe'))) {
    reject('invalid-shadow-proof');
  }

  if (fields.get('status') === 'disproved') {
    const evidence = fields.get('evidence');
    if (
      !/\b0 selected rows\b/.test(evidence)
      || !/\b0 hovered rows\b/.test(evidence)
      || !/selectedPaint[^.]*\bnull\b/.test(evidence)
      || !/hoveredPaint[^.]*\bnull\b/.test(evidence)
      || !/\bblock(?:ed)?\b/i.test(fields.get('fallback'))
    ) {
      reject('blocked-evidence-incomplete');
    }

    return {
      id: ENTRY_ID,
      status: 'disproved',
      verdict: 'block',
      reason: 'interaction-evidence-unavailable',
    };
  }

  if (fields.get('status') !== 'verified') {
    reject('status-not-terminal');
  }

  requireFields(fields, POSITIVE_FIELDS);
  if (fields.get('scenario') !== 'priority-present-grouped-long') {
    reject('scenario-not-admitted');
  }
  if (fields.get('interaction-owner') !== 'user') {
    reject('user-control-required');
  }

  const selectedRowCount = positiveCount(fields, 'selected-row-count');
  const hoveredRowCount = positiveCount(fields, 'hovered-row-count');
  const paints = [
    fields.get('normal-paint'),
    fields.get('hover-paint'),
    fields.get('selected-paint'),
  ];
  if (paints.some((paint) => !PAINT_SUMMARY.test(paint))) {
    reject('paint-summary-invalid');
  }
  if (new Set(paints).size !== paints.length) {
    reject('paint-observations-not-distinct');
  }
  if (!PAINT_OWNER.test(fields.get('actual-paint-owner'))) {
    reject('paint-owner-invalid');
  }

  return {
    id: ENTRY_ID,
    status: 'verified',
    verdict: 'evidence-ready',
    scenario: fields.get('scenario'),
    selectedRowCount,
    hoveredRowCount,
    actualPaintOwner: fields.get('actual-paint-owner'),
  };
}

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

test('keeps the current zero-row observation as an explicit interaction block', async () => {
  const markdown = await readFile(
    new URL('../../SELECTORS.md', import.meta.url),
    'utf8',
  );

  assert.deepEqual(assessInteractionEvidence(markdown), {
    id: ENTRY_ID,
    status: 'disproved',
    verdict: 'block',
    reason: 'interaction-evidence-unavailable',
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
      /interaction evidence rejected: (positive-count-required|paint-observations-not-distinct)/,
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
      /interaction evidence rejected: (missing-field|scenario-not-admitted|user-control-required|scope-not-admitted)/,
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
        assert.equal(error.message, 'interaction evidence rejected: unexpected-field');
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
      assert.equal(error.message, 'interaction evidence rejected: paint-summary-invalid');
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
    /interaction evidence rejected: invalid-shadow-proof/,
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
