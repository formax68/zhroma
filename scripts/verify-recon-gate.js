import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

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

    entries.push({ id, scope, status, fields });
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

  return { verdict, fields };
}

function parseScenarioList(value) {
  return value.split(',').map((scenario) => (
    scenario.replaceAll('`', '').trim()
  )).filter(Boolean);
}

function requireFinalEvidence(entries, admittedScenarios) {
  if (!Array.isArray(admittedScenarios)) {
    throw new Error('final mode requires admitted corpus scenarios');
  }
  const admitted = new Set(admittedScenarios);
  if (
    admitted.size !== 3
    || !admitted.has('priority-present-ungrouped')
    || !admitted.has('priority-absent')
    || !admitted.has('grouped-long')
  ) {
    throw new Error('final mode requires the complete admitted scenario matrix');
  }

  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const missing = REQUIRED_LIVE_EVIDENCE_IDS.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    throw new Error(`final ledger is missing required evidence: ${missing.join(', ')}`);
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
        throw new Error(
          `ledger entry ${entry.id} scenario ${scenario} is not bound to the admitted corpus`,
        );
      }
    }
  }

  return byId;
}

function positiveIntegerField(entry, field) {
  const value = entry.fields.get(field);
  return /^\d+$/u.test(value ?? '') && Number(value) > 0;
}

function collectBlockingPredicates(byId, verdictFields) {
  const blockers = [];
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

  if (mode === 'evidence') {
    return { entryCount: entries.length, verdict: null };
  }

  const { verdict, fields: verdictFields } = parseVerdict(markdown);
  const byId = requireFinalEvidence(entries, admittedScenarios);
  const blockers = collectBlockingPredicates(byId, verdictFields);
  if (verdict === 'proceed' && blockers.length > 0) {
    throw new Error(
      `proceed verdict conflicts with blocking predicate: ${blockers.join(', ')}`,
    );
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
      throw new Error(
        'Usage: verify-recon-gate.js evidence <ledger> | final <ledger> <manifest>',
      );
    }

    const markdown = await readFile(ledgerPath, 'utf8');
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
    process.stderr.write(`Recon ledger rejected: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
