export class InteractionEvidenceError extends Error {
  constructor(code) {
    super('Interaction evidence rejected');
    this.name = 'InteractionEvidenceError';
    this.code = code;
  }
}

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
  throw new InteractionEvidenceError(code);
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

export function assessInteractionEvidence(markdown) {
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
  if (new Set(paints.map(paint => paint.toLowerCase().replace(/\s+/g, ' ').replace(/\s*([(),|:=])\s*/g, '$1'))).size !== paints.length) {
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

