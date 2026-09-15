import { accessSync, realpathSync, statSync, readFileSync } from 'node:fs';
import { relative, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { assessInteractionEvidence, InteractionEvidenceError } from './interaction-evidence.js';

import { validateFixtureManifest } from './fixture-contract.js';

const REPOSITORY_ROOT = realpathSync(fileURLToPath(new URL('..', import.meta.url)));

const ENTRY_HEADING = /^## Ledger Entry:\s*(.+?)\s*$/gm;
const QUESTION_HEADING = /^## Recon Question:\s*(.+?)\s*$/gm;
const VERDICT_HEADING = /^## Final Verdict\s*$/gm;
const FIELD_LINE = /^- ([a-z][a-z0-9-]*):\s*(.*)$/gm;

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

export const REQUIRED_LIVE_EVIDENCE = Object.freeze(Object.fromEntries(
  Object.entries({
  "shell-metadata": {
    "scope": "English path",
    "statuses": [
      "verified"
    ],
    "scenarios": [
      "priority-present-grouped-long",
      "priority-present-ungrouped",
      "priority-absent"
    ]
  },
  "top-document-reachability": {
    "scope": "English path",
    "statuses": [
      "verified"
    ],
    "scenarios": [
      "priority-present-grouped-long",
      "priority-present-ungrouped",
      "priority-absent"
    ]
  },
  "root-chain": {
    "scope": "English path",
    "statuses": [
      "verified"
    ],
    "scenarios": [
      "priority-present-grouped-long",
      "priority-present-ungrouped",
      "priority-absent"
    ]
  },
  "stable-identifiers": {
    "scope": "English path",
    "statuses": [
      "verified"
    ],
    "scenarios": [
      "priority-present-grouped-long",
      "priority-present-ungrouped",
      "priority-absent"
    ]
  },
  "header-topology": {
    "scope": "English path",
    "statuses": [
      "disproved"
    ],
    "scenarios": [
      "priority-present-grouped-long",
      "priority-present-ungrouped",
      "priority-absent"
    ]
  },
  "priority-representation": {
    "scope": "English path",
    "statuses": [
      "verified"
    ],
    "scenarios": [
      "priority-present-grouped-long",
      "priority-present-ungrouped"
    ]
  },
  "priority-absence": {
    "scope": "English path",
    "statuses": [
      "verified"
    ],
    "scenarios": [
      "priority-absent"
    ]
  },
  "ticket-vs-group-rows": {
    "scope": "English path",
    "statuses": [
      "verified"
    ],
    "scenarios": [
      "priority-present-grouped-long",
      "priority-present-ungrouped",
      "priority-absent"
    ]
  },
  "scrolling-and-recycling": {
    "scope": "English path",
    "statuses": [
      "disproved"
    ],
    "scenarios": [
      "priority-present-grouped-long"
    ]
  },
  "painting-element": {
    "scope": "English path",
    "statuses": [
      "verified"
    ],
    "scenarios": [
      "priority-present-grouped-long"
    ]
  },
  "sticky-header-state": {
    "scope": "English path",
    "statuses": [
      "verified"
    ],
    "scenarios": [
      "priority-present-grouped-long",
      "priority-present-ungrouped",
      "priority-absent"
    ]
  },
  "interaction-and-sticky-states": {
    "scope": "English path",
    "statuses": [
      "verified"
    ],
    "scenarios": [
      "priority-present-grouped-long"
    ]
  },
  "inert-attribute-survival": {
    "scope": "English path",
    "statuses": [
      "disproved"
    ],
    "scenarios": [
      "priority-present-grouped-long"
    ]
  },
  "english-language-signal": {
    "scope": "English path",
    "statuses": [
      "verified"
    ],
    "scenarios": [
      "priority-present-grouped-long",
      "priority-present-ungrouped",
      "priority-absent"
    ]
  },
  "current-host-coverage": {
    "scope": "English path",
    "statuses": [
      "verified"
    ],
    "scenarios": [
      "priority-present-grouped-long",
      "priority-present-ungrouped",
      "priority-absent"
    ]
  }
}).map(([id, contract]) => [id, Object.freeze({
    ...contract, statuses: Object.freeze(contract.statuses), scenarios: Object.freeze(contract.scenarios),
  })]),
));

const BLOCKER_ORDER = Object.freeze([
  "required-evidence-scope-mismatch",
  "required-evidence-status-inadmissible",
  "required-evidence-scenario-mismatch",
  "interaction-grammar-violated",
  "interaction-evidence-incomplete",
  "closed-root-not-ruled-out",
  "selector-fallback-not-matrix-proven",
  "corpus-disposition-incomplete",
  "human-dispositions-incomplete",
  "verdict-field-not-structured",
  "fallback-evidence-path-missing",
  "declared-input-unresolved",
  "declared-input-evidence-missing",
  "flagged-assumption-not-surfaced"
]);

export class ReconGateError extends Error {
  constructor(code, options) {
    super('Recon ledger rejected', options);
    this.name = 'ReconGateError';
    this.code = code;
    this.blockers = Object.freeze([...(options?.blockers ?? [])]);
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
  const missing = Object.keys(REQUIRED_LIVE_EVIDENCE).filter((id) => !byId.has(id));
  if (missing.length > 0) {
    throw new ReconGateError('evidence-missing');
  }

  const blockers = [];
  for (const entry of entries) {
    const contract = REQUIRED_LIVE_EVIDENCE[entry.id];
    if (contract && entry.scope !== contract.scope) {
      blockers.push('required-evidence-scope-mismatch');
      continue;
    }
    if (contract && !contract.statuses.includes(entry.status)) {
      blockers.push('required-evidence-status-inadmissible');
    }
    const scenarios = parseScenarioList(entry.fields.get('scenario'));
    if (contract && (scenarios.length !== contract.scenarios.length
      || new Set(scenarios).size !== scenarios.length
      || contract.scenarios.some(scenario => !scenarios.includes(scenario)))) {
      blockers.push('required-evidence-scenario-mismatch');
      continue;
    }
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

  return { byId, blockers };
}

function positiveIntegerField(entry, field) {
  const value = entry.fields.get(field);
  return /^\d+$/u.test(value ?? '') && Number(value) > 0;
}

const ASSUMPTION_PROOFS = Object.freeze({
  "RECON-02/adjacency": [
    "test/recon/fixture-contract.test.js#fixture-canonical-duplicate",
    "test/recon/sensitive-patterns.smoke.js#NFD content against NFC denylist"
  ],
  "RECON-02/empty": [
    "test/recon/fixture-contract.test.js#manifest-object-required"
  ],
  "RECON-02/ordering": [
    "test/recon/sensitive-patterns.smoke.js#deduplicates overlapping matches and returns findings in stable order",
    "test/recon/recon-gate.smoke.js#blocker ordering does not depend on ledger section order"
  ],
  "RECON-03/adjacency": [
    "test/recon/fixture-contract.test.js#binds the absence selector to the declared table and header topology",
    "test/recon/sanitized-output-contract.test.js#two tables"
  ],
  "RECON-03/empty": [
    "test/recon/recon-gate.smoke.js#empty ledgers and blank required fields reject with stable codes"
  ],
  "RECON-03/ordering": [
    "test/recon/recon-gate.smoke.js#blocker ordering does not depend on ledger section order"
  ]
});

function parseAssumptionRows(markdown) {
  const sections = collectSections(markdown, /^## Spec-less Planning Assumptions\s*$/gm);
  if (sections.length !== 1) throw new ReconGateError('assumption-table-required');
  const lines = sections[0].body.split('\n').filter(line => line.trim().startsWith('|'));
  if (lines.length < 3) throw new ReconGateError('assumption-table-required');
  const cells = line => line.trim().split('|').slice(1, -1).map(s => s.trim());
  if (cells(lines[0]).join(',') !== 'Requirement,Category,Status,Gating,Evidence,Probe'
    || cells(lines[1]).length !== 6 || cells(lines[1]).some(s => !/^:?-{3,}:?$/.test(s))) {
    throw new ReconGateError('assumption-row-invalid');
  }
  const seen = new Set();
  const rows = lines.slice(2).map(line => {
    const values = cells(line);
    const [requirement, category, status, gating, evidence, probe] = values;
    const id = `${requirement}/${category}`;
    const expectedGating = id === 'RECON-01/unclassified' ? 'non-gating' : 'gating';
    if (values.length !== 6 || (!Object.hasOwn(ASSUMPTION_PROOFS, id) && id !== 'RECON-01/unclassified')
      || seen.has(id) || !['resolved', 'unresolved'].includes(status)
      || gating !== expectedGating || !probe) throw new ReconGateError('assumption-row-invalid');
    seen.add(id);
    return { id, status, gating, evidence };
  });
  if (seen.size !== 7) throw new ReconGateError('assumption-row-invalid');
  return rows;
}

function assumptionBlockers(markdown, verdictFields) {
  const blockers = [];
  const flagged = (verdictFields.get('flagged-assumptions') ?? '').split(',').map(s => s.trim());
  if (flagged.length !== 1 || !['none', 'RECON-01/unclassified'].includes(flagged[0])) {
    blockers.push('verdict-field-not-structured');
  }
  for (const row of parseAssumptionRows(markdown)) {
    if (row.gating === 'non-gating') {
      if (!flagged.includes(row.id)) blockers.push('flagged-assumption-not-surfaced');
      continue;
    }
    if (row.status === 'unresolved') {
      blockers.push('declared-input-unresolved');
      continue;
    }
    const references = row.evidence.split(';').map(s => s.trim());
    const expected = ASSUMPTION_PROOFS[row.id];
    if (references.length !== expected.length || expected.some(ref => !references.includes(ref))
      || references.some(ref => {
        const [path, anchor] = ref.split('#');
        return !existingProof(path) || !anchor || !readFileSync(resolve(REPOSITORY_ROOT, path), 'utf8').includes(anchor);
      })) blockers.push('declared-input-evidence-missing');
  }
  return blockers;
}

// Only a strategy with an admitted, validator-owned proof contract may authorize.
// No test-id-pair or structural proof has been admitted; an existing file alone
// cannot promote either strategy to proven.
const FALLBACK_PROOFS = Object.freeze({
  'garden-pair': Object.freeze({
    path: 'test/recon/fixture-contract.test.js',
    case: 'validates exact bytes, provenance, selectors, and all scenario invariants',
  }),
});

function fallbackProof(id, proof) {
  const contract = FALLBACK_PROOFS[id];
  return !!contract && proof === contract.path && existingProof(proof)
    && readFileSync(resolve(REPOSITORY_ROOT, proof), 'utf8').includes(contract.case);
}

function existingProof(proof) {
  // Only canonical repository test files can serve as proof references.
  if (!/^test\/recon\/[a-z0-9-]+\.(?:test|smoke)\.js$/.test(proof)) return false;
  try {
    const path = realpathSync(resolve(REPOSITORY_ROOT, proof));
    const relativePath = relative(REPOSITORY_ROOT, path);
    if (isAbsolute(relativePath) || relativePath.startsWith('..')) return false;
    accessSync(path);
    return statSync(path).isFile();
  } catch {
    return false;
  }
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
    || !['row', 'direct-cells'].includes(interaction?.fields.get('actual-paint-owner'))
  ) {
    blockers.push('interaction-evidence-incomplete');
  }

  const enums = {
    'closed-shadow-dom-state': ['ruled-out', 'present', 'inconclusive'],
    'garden-identifier-state': ['present', 'absent'],
    'corpus-gates-state': ['passed', 'failed'],
    'interaction-gate-state': ['passed', 'failed'],
  };
  for (const [field, allowed] of Object.entries(enums)) {
    if (!allowed.includes(verdictFields.get(field))) blockers.push('verdict-field-not-structured');
  }
  if (verdictFields.get('interaction-gate-state') !== 'passed') {
    blockers.push('interaction-evidence-incomplete');
  }
  const rootChain = byId.get('root-chain');
  const reachability = byId.get('top-document-reachability');
  if (
    rootChain?.status !== 'verified'
    || reachability?.status !== 'verified'
    || rootChain?.fields.get('root-terminus') !== 'Document'
    || rootChain?.fields.get('shadow-root-proof') !== 'root-chain-plus-top-document-reachability'
    || verdictFields.get('closed-shadow-dom-state') !== 'ruled-out'
  ) blockers.push('closed-root-not-ruled-out');

  const identifiersPresent = byId.get('stable-identifiers')?.status === 'verified'
    && verdictFields.get('garden-identifier-state') === 'present';
  const rungIds = ['garden-pair', 'test-id-pair', 'structural'];
  const proven = [];
  for (const [index, id] of rungIds.entries()) {
    const parts = (verdictFields.get(`fallback-rung-${index + 1}`) ?? '').split('|').map(s => s.trim());
    const [identifier, state, proof] = parts;
    if (parts.length !== 3 || identifier !== id || !['proven', 'unproven', 'disproved'].includes(state) || !proof) {
      blockers.push('verdict-field-not-structured');
      continue;
    }
    if (state !== 'proven') {
      if (proof !== 'none') blockers.push('verdict-field-not-structured');
      continue;
    }
    if (!fallbackProof(id, proof)) {
      blockers.push('fallback-evidence-path-missing');
      continue;
    }
    // The Garden rung is the same evidence as stable-identifiers; it cannot
    // independently rescue a disproved observation of those identifiers.
    if (id !== 'garden-pair' || identifiersPresent) proven.push(id);
  }
  const authorization = identifiersPresent ? 'garden-pair' : proven[0];
  if (!authorization) blockers.push('selector-fallback-not-matrix-proven');
  if (verdictFields.get('selector-authorization') !== (authorization ?? 'none')) {
    blockers.push('verdict-field-not-structured');
  }
  if (verdictFields.get('corpus-gates-state') !== 'passed') {
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
  const { byId, blockers: evidenceBlockers } = requireFinalEvidence(entries, admittedScenarios);
  const found = new Set([...evidenceBlockers, ...collectBlockingPredicates(byId, verdictFields, markdown), ...assumptionBlockers(markdown, verdictFields)]);
  const blockers = BLOCKER_ORDER.filter(code => found.has(code));
  if (verdict === 'proceed' && blockers.length > 0) {
    throw new ReconGateError('proceed-conflicts-with-blockers', { blockers });
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
