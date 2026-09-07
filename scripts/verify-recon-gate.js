import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { assessInteractionEvidence, InteractionEvidenceError } from './interaction-evidence.js';

import { validateFixtureManifest } from './fixture-contract.js';

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
const SYNTHETIC_SCENARIOS = new Set(['synthetic-contract']);
const LOCALIZATION_SCENARIOS = new Set(['not-run-localization-only']);
const LEDGER_TO_MANIFEST_SCENARIO = Object.freeze({
  'priority-present-grouped-long': 'grouped-long',
  'priority-present-ungrouped': 'priority-present-ungrouped',
  'priority-absent': 'priority-absent',
});

export const REQUIRED_LIVE_EVIDENCE_IDS = Object.freeze([
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
]);

export class ReconGateError extends Error {
  constructor(code, options) {
    super('Recon ledger rejected', options);
    this.name = 'ReconGateError';
    this.code = code;
  }
}

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

function parseFields(body) {
  const fields = new Map();

  for (const match of body.matchAll(FIELD_LINE)) {
    const [, name, rawValue] = match;
    if (fields.has(name)) {
      throw new ReconGateError('entry-field-duplicate');
    }
    fields.set(name, unwrapCode(rawValue));
  }

  return fields;
}

function parseEntries(markdown) {
  const sections = collectSections(markdown, ENTRY_HEADING);

  if (sections.length === 0) {
    throw new ReconGateError('ledger-entries-required');
  }

  const ids = new Set();
  const entries = [];

  for (const section of sections) {
    const fields = parseFields(section.body);

    for (const field of REQUIRED_ENTRY_FIELDS) {
      if (!fields.get(field)) {
        throw new ReconGateError('entry-field-missing');
      }
    }

    const id = fields.get('id');
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
      throw new ReconGateError('entry-id-invalid');
    }
    if (section.heading !== id) {
      throw new ReconGateError('entry-heading-id-mismatch');
    }
    if (ids.has(id)) {
      throw new ReconGateError('entry-id-duplicate');
    }
    ids.add(id);

    const status = fields.get('status');
    if (!TERMINAL_STATUSES.has(status)) {
      throw new ReconGateError('entry-status-unrecognized');
    }

    const scope = fields.get('scope');
    if (scope === 'English path' && status === 'outside English-only scope') {
      throw new ReconGateError('entry-scope-status-conflict');
    }
    if (scope !== 'English path' && status !== 'outside English-only scope') {
      throw new ReconGateError('entry-scope-status-conflict');
    }

    entries.push({ id, scope, status, fields });
  }

  return entries;
}

function parseOpenQuestions(markdown) {
  const sections = collectSections(markdown, QUESTION_HEADING);
  const ids = new Set();

  return sections.map((section) => {
    const fields = parseFields(section.body);

    for (const field of REQUIRED_QUESTION_FIELDS) {
      if (!fields.get(field)) {
        throw new ReconGateError('question-field-missing');
      }
    }

    const id = fields.get('id');
    if (section.heading !== id) {
      throw new ReconGateError('question-heading-id-mismatch');
    }
    if (ids.has(id)) {
      throw new ReconGateError('question-id-duplicate');
    }
    ids.add(id);

    if (fields.get('scope') !== 'English path') {
      throw new ReconGateError('question-scope-invalid');
    }
    if (fields.get('status') !== 'unresolved' || fields.get('assumption') !== 'unresolved') {
      throw new ReconGateError('question-unresolved');
    }

    return id;
  });
}

function parseVerdict(markdown) {
  const headings = [...markdown.matchAll(VERDICT_HEADING)];
  const sections = collectSections(markdown, VERDICT_HEADING);
  if (sections.length !== 1) {
    throw new ReconGateError('verdict-section-required');
  }
  const afterVerdictHeading = markdown.slice(
    headings[0].index + headings[0][0].length,
  );
  if (/^##\s+/m.test(afterVerdictHeading)) {
    throw new ReconGateError('verdict-not-final-section');
  }

  const fields = parseFields(sections[0].body);
  const verdict = fields.get('verdict');
  if (!verdict) {
    throw new ReconGateError('verdict-field-missing');
  }
  if (!VERDICTS.has(verdict)) {
    throw new ReconGateError('verdict-unrecognized');
  }
  if (!fields.get('rationale')) {
    throw new ReconGateError('verdict-field-missing');
  }

  return { verdict, fields };
}

function parseScenarioList(value) {
  return value.split(',').map((scenario) => (
    scenario.replaceAll('`', '').trim()
  )).filter(Boolean);
}

function requireFinalEvidence(entries, admittedScenarios) {
  if (!Array.isArray(admittedScenarios)) {
    throw new ReconGateError('admitted-scenarios-required');
  }
  const admitted = new Set(admittedScenarios);
  if (
    admitted.size !== 3
    || !admitted.has('priority-present-ungrouped')
    || !admitted.has('priority-absent')
    || !admitted.has('grouped-long')
  ) {
    throw new ReconGateError('scenario-matrix-required');
  }

  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const missing = REQUIRED_LIVE_EVIDENCE_IDS.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    throw new ReconGateError('evidence-missing');
  }

  for (const entry of entries) {
    const scenarios = parseScenarioList(entry.fields.get('scenario'));
    for (const scenario of scenarios) {
      if (entry.id === 'tracer-english-path' && SYNTHETIC_SCENARIOS.has(scenario)) {
        continue;
      }
      if (entry.scope !== 'English path' && LOCALIZATION_SCENARIOS.has(scenario)) {
        continue;
      }
      const manifestScenario = LEDGER_TO_MANIFEST_SCENARIO[scenario];
      if (!manifestScenario || !admitted.has(manifestScenario)) {
        throw new ReconGateError('scenario-not-admitted');
      }
    }
  }

  return byId;
}

function positiveIntegerField(entry, field) {
  const value = entry.fields.get(field);
  return /^\d+$/u.test(value ?? '') && Number(value) > 0;
}

function collectBlockingPredicates(byId, verdictFields, markdown) {
  const blockers = [];
  try {
    assessInteractionEvidence(markdown);
  } catch (error) {
    if (!(error instanceof InteractionEvidenceError)) throw error;
    blockers.push('interaction-grammar-violated');
  }
  const interaction = byId.get('interaction-and-sticky-states');
  const paintSummaries = [
    interaction?.fields.get('normal-paint'),
    interaction?.fields.get('hover-paint'),
    interaction?.fields.get('selected-paint'),
  ];
  if (
    interaction?.status !== 'verified'
    || !positiveIntegerField(interaction, 'selected-row-count')
    || !positiveIntegerField(interaction, 'hovered-row-count')
    || paintSummaries.some((summary) => !summary)
    || new Set(paintSummaries).size !== paintSummaries.length
    || interaction?.fields.get('interaction-owner') !== 'user'
    || !['row', 'cell'].includes(interaction?.fields.get('actual-paint-owner'))
  ) {
    blockers.push('interaction-evidence-incomplete');
  }

  const rootChain = byId.get('root-chain');
  if (
    rootChain?.status !== 'verified'
    || !rootChain.fields.get('evidence')?.includes('[{ type: "Document" }]')
    || !rootChain.fields.get('interpretation')?.includes('No open or closed ShadowRoot')
    || !verdictFields.get('closed-shadow-dom')?.startsWith('No.')
  ) {
    blockers.push('closed-root-not-ruled-out');
  }

  const identifiers = byId.get('stable-identifiers');
  const identifiersPresent = identifiers?.status === 'verified'
    && identifiers.fields.get('evidence')?.includes('data-garden-id="tables.table"')
    && identifiers.fields.get('evidence')?.includes('data-test-id="generic-table"');
  const fallbackMatrixProven = verdictFields.get('ranked-fallback')
    ?.includes('complete three-scenario corpus');
  if (
    !identifiersPresent
    && !fallbackMatrixProven
  ) {
    blockers.push('selector-fallback-not-matrix-proven');
  }

  if (!verdictFields.get('corpus-gates')?.startsWith('Passed')) {
    blockers.push('corpus-disposition-incomplete');
  }
  if (verdictFields.get('prohibition-dispositions') !== 'passed') {
    blockers.push('human-dispositions-incomplete');
  }

  return blockers;
}

/**
 * Validate the deterministic SELECTORS.md evidence-ledger contract.
 *
 * `evidence` validates all ledger entries without requiring a verdict.
 * `final` additionally requires exactly one explicit proceed/block verdict.
 */
export function verifyReconLedger(markdown, { mode, admittedScenarios } = {}) {
  if (mode !== 'evidence' && mode !== 'final') {
    throw new ReconGateError('mode-invalid');
  }
  if (typeof markdown !== 'string' || markdown.trim() === '') {
    throw new ReconGateError('ledger-markdown-required');
  }

  const entries = parseEntries(markdown);
  const openQuestions = parseOpenQuestions(markdown);

  if (openQuestions.length > 0) {
    throw new ReconGateError('question-unresolved');
  }

  if (mode === 'evidence') {
    return { entryCount: entries.length, verdict: null };
  }

  const { verdict, fields: verdictFields } = parseVerdict(markdown);
  const byId = requireFinalEvidence(entries, admittedScenarios);
  const blockers = collectBlockingPredicates(byId, verdictFields, markdown);
  if (verdict === 'proceed' && blockers.length > 0) {
    throw new ReconGateError('proceed-conflicts-with-blockers');
  }

  return { entryCount: entries.length, verdict };
}

async function runCli() {
  try {
    const args = process.argv.slice(2);
    const [mode, ledgerPath, manifestPath] = args;
    if (
      (mode === 'evidence' && args.length !== 2)
      || (mode === 'final' && args.length !== 3)
      || (mode !== 'evidence' && mode !== 'final')
    ) {
      throw new ReconGateError('cli-arguments-invalid');
    }

    let markdown;
    try {
      markdown = await readFile(ledgerPath, 'utf8');
    } catch (cause) {
      throw new ReconGateError('ledger-readable-required', { cause });
    }
    if (mode === 'evidence') {
      const result = verifyReconLedger(markdown, { mode });
      process.stdout.write(`EVIDENCE READY: ${result.entryCount} terminal entries\n`);
      return;
    }

    const corpus = await validateFixtureManifest(manifestPath, {
      requireCompleteScenarioMatrix: true,
    });
    const result = verifyReconLedger(markdown, {
      mode,
      admittedScenarios: corpus.scenarios,
    });
    process.stdout.write(`FINAL VERDICT: ${result.verdict}\n`);
  } catch (error) {
    const code = (error instanceof ReconGateError || error?.name === 'FixtureContractError')
      && /^[a-z]+(?:-[a-z]+)*$/u.test(error.code ?? '')
      ? error.code
      : 'unexpected-error';
    process.stderr.write(`RECON_GATE_REJECTED ${code}\n`);
    if (process.env.ZHROMA_RECON_DEBUG === '1') {
      process.stderr.write(`${error?.cause?.stack ?? error?.stack ?? String(error)}\n`);
    }
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
