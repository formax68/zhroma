import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const ENTRY_HEADING = /^## Ledger Entry:\s*(.+?)\s*$/gm;
const VERDICT_HEADING = /^## Final Verdict\s*$/gm;
const FIELD_LINE = /^- ([a-z][a-z-]*):\s*(.*)$/gm;

const REQUIRED_ENTRY_FIELDS = Object.freeze([
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

const TERMINAL_STATUSES = new Set([
  'verified',
  'disproved',
  'outside English-only scope',
]);

const VERDICTS = new Set(['proceed', 'block']);

function unwrapCode(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function collectSections(markdown, headingPattern) {
  const matches = [...markdown.matchAll(headingPattern)];
  return matches.map((match, index) => ({
    heading: match[1]?.trim() ?? null,
    body: markdown.slice(
      match.index + match[0].length,
      matches[index + 1]?.index ?? markdown.length,
    ),
  }));
}

function parseFields(body, label) {
  const fields = new Map();

  for (const match of body.matchAll(FIELD_LINE)) {
    const [, name, rawValue] = match;
    if (fields.has(name)) {
      throw new Error(`${label} has duplicate field: ${name}`);
    }
    fields.set(name, unwrapCode(rawValue));
  }

  return fields;
}

function parseEntries(markdown) {
  const verdictStart = markdown.search(VERDICT_HEADING);
  const ledgerText = verdictStart === -1 ? markdown : markdown.slice(0, verdictStart);
  const sections = collectSections(ledgerText, ENTRY_HEADING);

  if (sections.length === 0) {
    throw new Error('ledger must contain at least one Ledger Entry section');
  }

  const ids = new Set();
  const entries = [];

  for (const section of sections) {
    const label = `ledger entry ${section.heading}`;
    const fields = parseFields(section.body, label);

    for (const field of REQUIRED_ENTRY_FIELDS) {
      if (!fields.get(field)) {
        throw new Error(`${label} is missing required field: ${field}`);
      }
    }

    const id = fields.get('id');
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
      throw new Error(`${label} has invalid id: ${id}`);
    }
    if (section.heading !== id) {
      throw new Error(`${label} heading and id field disagree`);
    }
    if (ids.has(id)) {
      throw new Error(`duplicate entry id: ${id}`);
    }
    ids.add(id);

    const status = fields.get('status');
    if (!TERMINAL_STATUSES.has(status)) {
      throw new Error(`${label} has unrecognized status: ${status}`);
    }

    const scope = fields.get('scope');
    if (scope === 'English path' && status === 'outside English-only scope') {
      throw new Error(`${label}: English-path entry cannot be outside English-only scope`);
    }
    if (scope !== 'English path' && status !== 'outside English-only scope') {
      throw new Error(`${label}: non-English entry must be outside English-only scope`);
    }

    entries.push({ id, scope, status });
  }

  return entries;
}

function parseVerdict(markdown) {
  const sections = collectSections(markdown, VERDICT_HEADING);
  if (sections.length !== 1) {
    throw new Error('final mode requires exactly one Final Verdict section');
  }

  const fields = parseFields(sections[0].body, 'Final Verdict');
  const verdict = fields.get('verdict');
  if (!verdict) {
    throw new Error('Final Verdict is missing required field: verdict');
  }
  if (!VERDICTS.has(verdict)) {
    throw new Error(`Final Verdict has unrecognized verdict: ${verdict}`);
  }
  if (!fields.get('rationale')) {
    throw new Error('Final Verdict is missing required field: rationale');
  }

  return verdict;
}

/**
 * Validate the deterministic SELECTORS.md evidence-ledger contract.
 *
 * `evidence` validates all ledger entries without requiring a verdict.
 * `final` additionally requires exactly one explicit proceed/block verdict.
 */
export function verifyReconLedger(markdown, { mode } = {}) {
  if (mode !== 'evidence' && mode !== 'final') {
    throw new Error('mode must be evidence or final');
  }
  if (typeof markdown !== 'string' || markdown.trim() === '') {
    throw new Error('ledger markdown must be a non-empty string');
  }

  const entries = parseEntries(markdown);
  const unresolvedEnglish = entries.filter(
    (entry) => entry.scope === 'English path' && !TERMINAL_STATUSES.has(entry.status),
  );
  if (unresolvedEnglish.length > 0) {
    throw new Error(
      `English-path entries are unresolved: ${unresolvedEnglish.map(({ id }) => id).join(', ')}`,
    );
  }

  const verdict = mode === 'final' ? parseVerdict(markdown) : null;
  if (verdict === 'proceed' && unresolvedEnglish.length > 0) {
    throw new Error('proceed is forbidden while an English-path entry is unresolved');
  }

  return { entryCount: entries.length, verdict };
}

async function runCli() {
  const [, , mode, ledgerPath = 'SELECTORS.md'] = process.argv;
  try {
    const markdown = await readFile(ledgerPath, 'utf8');
    const result = verifyReconLedger(markdown, { mode });
    process.stdout.write(
      `Recon ledger valid: ${result.entryCount} entries; verdict=${result.verdict ?? 'not-required'}\n`,
    );
  } catch (error) {
    process.stderr.write(`Recon ledger rejected: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
