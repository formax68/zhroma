import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const ENTRY_HEADING = /^## Ledger Entry:\s*(.+?)\s*$/gm;
const QUESTION_HEADING = /^## Recon Question:\s*(.+?)\s*$/gm;
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

const REQUIRED_QUESTION_FIELDS = Object.freeze([
  'id',
  'question',
  'scope',
  'status',
  'assumption',
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
const REQUIRED_FIXTURE_SCENARIOS = Object.freeze([
  'priority-present-ungrouped',
  'priority-absent',
  'grouped-long',
]);

function unwrapCode(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function collectSections(markdown, headingPattern) {
  const matches = [...markdown.matchAll(headingPattern)];
  return matches.map((match) => {
    const bodyStart = match.index + match[0].length;
    const remaining = markdown.slice(bodyStart);
    const nextHeadingOffset = remaining.search(/^##\s+/m);
    const bodyEnd = nextHeadingOffset === -1
      ? markdown.length
      : bodyStart + nextHeadingOffset;

    return {
      heading: match[1]?.trim() ?? null,
      body: markdown.slice(bodyStart, bodyEnd),
    };
  });
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
  const sections = collectSections(markdown, ENTRY_HEADING);

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

function parseOpenQuestions(markdown) {
  const sections = collectSections(markdown, QUESTION_HEADING);
  const ids = new Set();

  return sections.map((section) => {
    const label = `recon question ${section.heading}`;
    const fields = parseFields(section.body, label);

    for (const field of REQUIRED_QUESTION_FIELDS) {
      if (!fields.get(field)) {
        throw new Error(`${label} is missing required field: ${field}`);
      }
    }

    const id = fields.get('id');
    if (section.heading !== id) {
      throw new Error(`${label} heading and id field disagree`);
    }
    if (ids.has(id)) {
      throw new Error(`duplicate recon question id: ${id}`);
    }
    ids.add(id);

    if (fields.get('scope') !== 'English path') {
      throw new Error(`${label} must use English path scope`);
    }
    if (fields.get('status') !== 'unresolved' || fields.get('assumption') !== 'unresolved') {
      throw new Error(`${label} must remain visibly unresolved until evidence admission`);
    }

    return id;
  });
}

function parseVerdict(markdown) {
  const headings = [...markdown.matchAll(VERDICT_HEADING)];
  const sections = collectSections(markdown, VERDICT_HEADING);
  if (sections.length !== 1) {
    throw new Error('final mode requires exactly one Final Verdict section');
  }
  const afterVerdictHeading = markdown.slice(
    headings[0].index + headings[0][0].length,
  );
  if (/^##\s+/m.test(afterVerdictHeading)) {
    throw new Error('Final Verdict must be the final level-two section');
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
  const openQuestions = parseOpenQuestions(markdown);

  if (openQuestions.length > 0) {
    throw new Error(
      `English-path question remains unresolved: ${openQuestions.join(', ')}`,
    );
  }

  const verdict = mode === 'final' ? parseVerdict(markdown) : null;

  return { entryCount: entries.length, verdict };
}

async function verifyManifestBytes(manifestPath) {
  const absoluteManifestPath = resolve(manifestPath);
  const manifestDirectory = dirname(absoluteManifestPath);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(absoluteManifestPath, 'utf8'));
  } catch {
    throw new Error('fixture manifest must be readable JSON');
  }

  if (!Array.isArray(manifest.fixtures) || manifest.fixtures.length !== 3) {
    throw new Error('fixture manifest must enumerate exactly three fixtures');
  }

  const scenarios = new Set();
  for (const entry of manifest.fixtures) {
    if (
      typeof entry?.scenario !== 'string'
      || typeof entry?.file !== 'string'
      || typeof entry?.sha256 !== 'string'
      || isAbsolute(entry.file)
      || entry.file.split(/[\\/]/u).includes('..')
    ) {
      throw new Error('fixture manifest entry is incomplete or unsafe');
    }

    const fixturePath = resolve(manifestDirectory, entry.file);
    const fromManifest = relative(manifestDirectory, fixturePath);
    if (fromManifest === '..' || fromManifest.startsWith(`..${sep}`)) {
      throw new Error('fixture manifest path escapes its directory');
    }

    const bytes = await readFile(fixturePath);
    const actualHash = createHash('sha256').update(bytes).digest('hex');
    if (actualHash !== entry.sha256) {
      throw new Error(`fixture checksum mismatch for scenario: ${entry.scenario}`);
    }
    scenarios.add(entry.scenario);
  }

  if (
    scenarios.size !== REQUIRED_FIXTURE_SCENARIOS.length
    || REQUIRED_FIXTURE_SCENARIOS.some((scenario) => !scenarios.has(scenario))
  ) {
    throw new Error('fixture manifest does not contain the complete scenario matrix');
  }
}

async function runCli() {
  const [, , mode, ledgerPath = 'SELECTORS.md', manifestPath] = process.argv;
  try {
    const markdown = await readFile(ledgerPath, 'utf8');
    const result = verifyReconLedger(markdown, { mode });
    if (mode === 'evidence') {
      process.stdout.write(`EVIDENCE READY: ${result.entryCount} terminal entries\n`);
      return;
    }

    if (manifestPath) {
      await verifyManifestBytes(manifestPath);
    }
    process.stdout.write(`FINAL VERDICT: ${result.verdict}\n`);
  } catch (error) {
    process.stderr.write(`Recon ledger rejected: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
