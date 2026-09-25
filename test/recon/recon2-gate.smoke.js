import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import * as reconGate from '../../scripts/verify-recon-gate.js';
import { sanitizeFixture, sha256 } from '../../scripts/sanitize-fixture.js';

const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const GATE_SCRIPT = join(REPOSITORY_ROOT, 'scripts', 'verify-recon-gate.js');
const REPOSITORY_LEDGER = join(REPOSITORY_ROOT, 'SELECTORS.md');
const PHASE_ONE_SCENARIOS = ['priority-present-ungrouped', 'priority-absent', 'grouped-long'];
const ALL_RECON_TWO_SCENARIOS = ['rules-light-table', 'rules-identity-region', 'rules-dark-table'];
const EXPECTED_RECON_TWO_IDS = [
  'dark-mode-signal',
  'dark-mode-switch-mutation',
  'dark-native-states',
  'dark-table-topology',
  'identity-location',
  'identity-vs-assignee',
  'referenced-cell-representation',
  'header-label-uniqueness',
];
const TAGS_FALLBACK = 'Phase 9: Tags rules resolve no header, so RULE-07 keeps them inactive, and RULE-F2 stays deferred.';

function runGate(args, debug) {
  const env = { ...process.env };
  delete env.ZHROMA_RECON_DEBUG;
  if (debug !== undefined) env.ZHROMA_RECON_DEBUG = debug;
  return spawnSync(process.execPath, [GATE_SCRIPT, ...args], {
    cwd: REPOSITORY_ROOT, encoding: 'utf8', env,
  });
}

function completeSpec() {
  return {
    entries: {
      'dark-mode-signal': {
        status: 'verified',
        scenario: 'appearance-matrix',
        fallback: 'Phase 8 is blocked if Appearance is not offered; with no marker and no readable surface Phase 8 falls back to light (DARK-05).',
        fields: {
          'dark-mode-offered': 'yes',
          'dark-branch': 'document-marker',
          'os-auto-used': 'no',
          'zhroma-off': 'yes',
          'cell-light-os-light': 'effective light, marker light',
          'cell-light-os-dark': 'effective light, marker light',
          'cell-dark-os-light': 'effective dark, marker dark',
          'cell-dark-os-dark': 'effective dark, marker dark',
          'cell-match-os-light': 'effective light, marker light',
          'cell-match-os-dark': 'effective dark, marker dark',
        },
      },
      'dark-mode-switch-mutation': {
        status: 'verified',
        scenario: 'appearance-matrix',
        fallback: 'Phase 8 re-reads the signal on every observed mutation and on load.',
        fields: {
          'switch-light-to-dark': 'attribute-or-class-swap',
          'switch-dark-to-light': 'attribute-or-class-swap',
          'switch-os-under-match': 'cssom-only',
        },
      },
      'dark-native-states': {
        status: 'verified',
        scenario: 'dark-rule-view',
        fallback: 'Phase 8 keeps translucent tints so native states stay visible.',
        fields: {
          'zhroma-off': 'yes',
          'hover-selection-observed': 'yes',
          'focus-observed': 'yes',
        },
      },
      'dark-table-topology': {
        status: 'verified',
        scenario: 'dark-rule-view',
        fallback: 'Phase 8 is blocked if the Garden identifiers differ in dark mode.',
        fields: {
          'garden-identifiers': 'hold',
          'root-terminus': 'Document',
        },
      },
      'identity-location': {
        status: 'verified',
        scenario: 'light-rule-view',
        fallback: 'Phase 10 relies on a typed name (IDENT-03) if no name renders.',
        fields: {
          'identity-source': 'top-bar-at-load',
          'identity-carrier': 'aria-label',
          'identity-form': 'full',
          'assignee-cell-renders': 'text',
        },
      },
      'identity-vs-assignee': {
        status: 'verified',
        scenario: 'light-rule-view',
        fallback: 'Phase 10 relies on a typed name (IDENT-03) if the forms are not comparable.',
        fields: {
          equal: 'true',
          'difference-kind': 'identical',
        },
      },
      'referenced-cell-representation': {
        status: 'verified',
        scenario: 'light-rule-view',
        fallback: 'Phase 9 treats an unreadable cell as not matching; the Tags fallback is recorded below.',
        fields: {
          'assignee-cell': 'text in a span',
          'requester-cell': 'text in a span',
          'group-cell': 'plain text',
          'status-cell': 'badge with text',
          'type-cell': 'plain text',
          'subject-cell': 'truncated text',
          'date-cell': 'time element with relative text',
          'custom-field-cell': 'plain text',
          'empty-placeholders': 'dash in empty cells',
          'tags-column': 'not-offered',
          'tags-fallback': TAGS_FALLBACK,
          'date-text-class': 'relative',
          'date-machine-value': 'title',
          vocabulary: 'confirmed-from-session',
        },
      },
      'header-label-uniqueness': {
        status: 'verified',
        scenario: 'light-rule-view',
        fallback: 'Phase 10 disambiguates duplicate labels by column position.',
        fields: {
          'duplicate-in-view': 'no',
          'duplicate-custom-titles': 'unknown',
          'standard-header-labels': 'Priority, Assignee, Requester, Group, Status, Type, Subject, Updated',
        },
      },
    },
    verdict: {
      'recon2-verdict': 'proceed',
      'blocked-consumers': 'none',
      'fixture-light-table': 'admitted',
      'fixture-identity-region': 'admitted',
      'fixture-dark-table': 'admitted',
      rationale: 'Synthetic Recon 2 contract exercise only; this is not a live Zendesk conclusion.',
    },
  };
}

function fieldLines(fields) {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `- ${name}: \`${value}\``)
    .join('\n');
}

function recon2Entry(id, {
  status = 'verified',
  scenario = 'light-rule-view',
  fallback = 'Phase 9 treats the fact as unreadable.',
  scope = 'English path',
  fields = {},
} = {}) {
  return `## Recon 2 Entry: ${id}

- id: \`${id}\`
- question: Does the synthetic Recon 2 entry traverse the gate?
- scope: \`${scope}\`
- status: \`${status}\`
- probe: \`({ htmlLang: document.documentElement.lang || null })\`
- evidence: Synthetic structural evidence for the contract exercise.
- interpretation: Synthetic interpretation that asserts no live Zendesk fact.
- fallback: ${fallback}
- scenario: \`${scenario}\`
${fieldLines(fields)}
`;
}

function withRecon2Verdict(entries, verdict) {
  return `${entries}
## Recon 2 Verdict

${fieldLines(verdict)}
`;
}

function recon2Block(spec = completeSpec()) {
  const entries = Object.entries(spec.entries)
    .map(([id, entry]) => recon2Entry(id, entry))
    .join('\n');
  return spec.verdict === null ? entries : withRecon2Verdict(entries, spec.verdict);
}

function mutateRecon2Entry(markdown, id, transform) {
  const heading = `## Recon 2 Entry: ${id}\n`;
  const start = markdown.indexOf(heading);
  assert.notEqual(start, -1);
  const next = markdown.indexOf('\n## ', start + heading.length);
  const end = next === -1 ? markdown.length : next;
  return markdown.slice(0, start) + transform(markdown.slice(start, end)) + markdown.slice(end);
}

function variant(mutate) {
  const spec = completeSpec();
  mutate(spec);
  return spec;
}

function darkNotOffered(spec) {
  const entries = spec.entries;
  Object.assign(entries['dark-mode-signal'], {
    status: 'not observed',
    fallback: 'Phase 8 is blocked because Appearance is not offered on this tenant.',
  });
  for (const cell of Object.keys(entries['dark-mode-signal'].fields).filter((name) => name.startsWith('cell-'))) {
    entries['dark-mode-signal'].fields[cell] = undefined;
  }
  Object.assign(entries['dark-mode-signal'].fields, {
    'dark-mode-offered': 'no',
    'dark-branch': 'not-offered',
  });
  Object.assign(entries['dark-mode-switch-mutation'], {
    status: 'not observed',
    fallback: 'Phase 8 is blocked because Appearance is not offered.',
  });
  Object.assign(entries['dark-mode-switch-mutation'].fields, {
    'switch-light-to-dark': 'not-observed',
    'switch-dark-to-light': 'not-observed',
    'switch-os-under-match': 'not-observed',
  });
  Object.assign(entries['dark-native-states'], {
    status: 'not observed',
    fallback: 'Phase 8 is blocked because Appearance is not offered.',
  });
  Object.assign(entries['dark-native-states'].fields, {
    'hover-selection-observed': 'no',
    'focus-observed': 'no',
    'focus-fallback': 'Phase 8 keeps the native focus ring untouched.',
  });
  Object.assign(entries['dark-table-topology'], {
    status: 'not observed',
    fallback: 'Phase 8 is blocked because Appearance is not offered.',
  });
  Object.assign(entries['dark-table-topology'].fields, {
    'garden-identifiers': 'not-observed',
    'root-terminus': 'not-observed',
  });
  Object.assign(spec.verdict, {
    'recon2-verdict': 'block',
    'blocked-consumers': 'phase-8',
    'fixture-dark-table': 'not-required',
  });
}

function identityNotFound(spec) {
  Object.assign(spec.entries['identity-location'], {
    status: 'not observed',
    fallback: 'Phase 10 relies on a typed name (IDENT-03).',
  });
  Object.assign(spec.entries['identity-location'].fields, {
    'identity-source': 'not-found',
    'identity-carrier': 'not-found',
    'identity-form': 'not-found',
  });
  Object.assign(spec.entries['identity-vs-assignee'], {
    status: 'not observed',
    fallback: 'Phase 10 relies on a typed name (IDENT-03).',
  });
  Object.assign(spec.entries['identity-vs-assignee'].fields, {
    equal: 'false',
    'difference-kind': 'not-comparable',
  });
  spec.verdict['fixture-identity-region'] = 'not-required';
}

function check(spec, admitted = ALL_RECON_TWO_SCENARIOS) {
  return reconGate.verifyRecon2Ledger(recon2Block(spec), { admittedRecon2Scenarios: admitted });
}

function expectCode(action, code) {
  assert.throws(action, (error) => {
    assert.ok(error instanceof reconGate.ReconGateError, 'expected a ReconGateError');
    assert.equal(error.code, code);
    assert.equal(error.message, 'Recon ledger rejected');
    return true;
  });
}

function withoutRecon2Block(markdown) {
  const start = markdown.search(/^## Recon 2 /m);
  if (start === -1) return markdown;
  const rest = markdown.slice(start);
  const end = rest.search(/^## (?!Recon 2 )/m);
  return markdown.slice(0, start) + (end === -1 ? '' : rest.slice(end));
}

function insertBeforeAssumptions(markdown, block) {
  const clean = withoutRecon2Block(markdown);
  const anchor = '## Spec-less Planning Assumptions';
  const index = clean.indexOf(anchor);
  assert.notEqual(index, -1);
  return `${clean.slice(0, index)}${block}\n${clean.slice(index)}`;
}

describe('Recon 2 gate exports', () => {
  test('exports verifyRecon2Ledger and the eight required ids in order', () => {
    assert.equal(typeof reconGate.verifyRecon2Ledger, 'function');
    assert.deepEqual([...reconGate.RECON2_REQUIRED_IDS], EXPECTED_RECON_TWO_IDS);
    assert.ok(Object.isFrozen(reconGate.RECON2_REQUIRED_IDS));
  });
});

describe('Recon 2 verdict derivation', () => {
  test('a complete synthetic ledger with every fixture admitted proceeds', () => {
    assert.deepEqual(check(completeSpec()), {
      entryCount: 8,
      verdict: 'proceed',
      blockedConsumers: 'none',
    });
  });

  test('dark mode not offered requires block with phase-8 and only the light and identity fixtures', () => {
    assert.deepEqual(check(variant(darkNotOffered), ['rules-light-table', 'rules-identity-region']), {
      entryCount: 8,
      verdict: 'block',
      blockedConsumers: 'phase-8',
    });
    expectCode(() => check(variant((spec) => {
      darkNotOffered(spec);
      spec.verdict['recon2-verdict'] = 'proceed';
      spec.verdict['blocked-consumers'] = 'none';
    }), ['rules-light-table', 'rules-identity-region']), 'recon-two-verdict-inconsistent');
    expectCode(() => check(variant((spec) => {
      darkNotOffered(spec);
      spec.verdict['blocked-consumers'] = 'none';
    }), ['rules-light-table', 'rules-identity-region']), 'recon-two-verdict-inconsistent');
  });

  test('Garden identifiers that differ in dark mode require block and drop the dark-table fixture', () => {
    const differ = (spec) => {
      spec.entries['dark-table-topology'].status = 'disproved';
      spec.entries['dark-table-topology'].fields['garden-identifiers'] = 'differ';
      spec.verdict['recon2-verdict'] = 'block';
      spec.verdict['blocked-consumers'] = 'phase-8';
      spec.verdict['fixture-dark-table'] = 'not-required';
    };
    assert.deepEqual(check(variant(differ), ['rules-light-table', 'rules-identity-region']), {
      entryCount: 8,
      verdict: 'block',
      blockedConsumers: 'phase-8',
    });
    expectCode(() => check(variant((spec) => {
      differ(spec);
      spec.verdict['recon2-verdict'] = 'proceed';
      spec.verdict['blocked-consumers'] = 'none';
    }), ['rules-light-table', 'rules-identity-region']), 'recon-two-verdict-inconsistent');
  });

  test('a complete ledger recording block without a blocking fact is inconsistent', () => {
    expectCode(() => check(variant((spec) => {
      spec.verdict['recon2-verdict'] = 'block';
      spec.verdict['blocked-consumers'] = 'phase-8';
    })), 'recon-two-verdict-inconsistent');
  });
});

describe('Recon 2 fixture outcomes', () => {
  const rejectedLight = (overrides = {}) => (spec) => {
    Object.assign(spec.verdict, {
      'fixture-light-table': 'rejected',
      'fixture-light-table-code': 'sensitive-residual',
      'fixture-light-table-fallback': 'Phase 9 derives cell shapes from the ledger entries alone.',
      ...overrides,
    });
  };
  const withoutLight = ['rules-identity-region', 'rules-dark-table'];

  test('a light-table admission rejected after its repair round keeps the verdict', () => {
    assert.deepEqual(check(variant(rejectedLight()), withoutLight), {
      entryCount: 8,
      verdict: 'proceed',
      blockedConsumers: 'none',
    });
  });

  test('a rejected fixture needs a fallback naming its consuming phase', () => {
    expectCode(() => check(variant(rejectedLight({
      'fixture-light-table-fallback': 'Phase 8 derives cell shapes from the ledger.',
    })), withoutLight), 'recon-two-fallback-missing');
    expectCode(() => check(variant(rejectedLight({
      'fixture-light-table-fallback': undefined,
    })), withoutLight), 'recon-two-fallback-missing');
  });

  test('a rejected fixture code must be letters and hyphens only', () => {
    for (const code of ['sensitive residual', 'sensitive-residual-two2', 'Sensitive-residual', undefined]) {
      expectCode(() => check(variant(rejectedLight({ 'fixture-light-table-code': code })), withoutLight),
        'recon-two-field-not-structured');
    }
  });

  test('a rejected fixture that is also admitted is inconsistent', () => {
    expectCode(() => check(variant(rejectedLight())), 'recon-two-fields-inconsistent');
  });

  test('not-required is accepted only for an ineligible scenario', () => {
    expectCode(() => check(variant((spec) => {
      spec.verdict['fixture-light-table'] = 'not-required';
    }), withoutLight), 'recon-two-fields-inconsistent');
    expectCode(() => check(variant((spec) => {
      spec.verdict['fixture-dark-table'] = 'not-required';
    }), ['rules-light-table', 'rules-identity-region']), 'recon-two-fields-inconsistent');
    expectCode(() => check(variant((spec) => {
      darkNotOffered(spec);
      spec.verdict['fixture-dark-table'] = 'admitted';
    })), 'recon-two-fields-inconsistent');
  });

  test('an admitted scenario whose fixture field is not admitted is inconsistent', () => {
    expectCode(() => check(variant(darkNotOffered)), 'recon-two-fields-inconsistent');
  });

  test('a pending or unknown fixture field under a resolved verdict is rejected', () => {
    expectCode(() => check(variant((spec) => {
      spec.verdict['fixture-identity-region'] = 'pending';
    })), 'recon-two-verdict-unresolved');
    expectCode(() => check(variant((spec) => {
      spec.verdict['fixture-identity-region'] = undefined;
    })), 'recon-two-verdict-unresolved');
    expectCode(() => check(variant((spec) => {
      spec.verdict['fixture-identity-region'] = 'maybe';
    })), 'recon-two-field-not-structured');
  });

  test('an admitted fixture field needs its scenario in the admitted corpus', () => {
    expectCode(() => check(completeSpec(), ['rules-light-table', 'rules-identity-region']),
      'recon-two-fixture-missing');
    expectCode(() => check(completeSpec(), ['rules-identity-region', 'rules-dark-table']),
      'recon-two-fixture-missing');
    expectCode(() => check(completeSpec(), []), 'recon-two-fixture-missing');
  });
});

describe('Recon 2 identity facts', () => {
  test('no name rendered anywhere drops the identity-region fixture', () => {
    assert.deepEqual(check(variant(identityNotFound), ['rules-light-table', 'rules-dark-table']), {
      entryCount: 8,
      verdict: 'proceed',
      blockedConsumers: 'none',
    });
  });

  test('no name rendered anywhere needs a Phase 10 fallback', () => {
    expectCode(() => check(variant((spec) => {
      identityNotFound(spec);
      spec.entries['identity-location'].fallback = 'Phase 9 relies on something else.';
    }), ['rules-light-table', 'rules-dark-table']), 'recon-two-fallback-missing');
  });

  test('not-found identity with an identical difference kind is inconsistent', () => {
    expectCode(() => check(variant((spec) => {
      identityNotFound(spec);
      spec.entries['identity-vs-assignee'].fields.equal = 'true';
      spec.entries['identity-vs-assignee'].fields['difference-kind'] = 'identical';
    }), ['rules-light-table', 'rules-dark-table']), 'recon-two-fields-inconsistent');
  });

  test('equal true with a prefix difference is inconsistent', () => {
    expectCode(() => check(variant((spec) => {
      spec.entries['identity-vs-assignee'].fields['difference-kind'] = 'prefix';
    })), 'recon-two-fields-inconsistent');
    expectCode(() => check(variant((spec) => {
      spec.entries['identity-vs-assignee'].fields.equal = 'false';
    })), 'recon-two-fields-inconsistent');
  });

  test('identity fields are not-found together or not at all', () => {
    expectCode(() => check(variant((spec) => {
      spec.entries['identity-location'].fields['identity-form'] = 'not-found';
    })), 'recon-two-fields-inconsistent');
  });
});

describe('Recon 2 dark-mode facts', () => {
  test('Zhroma must be off and the OS never on Auto', () => {
    expectCode(() => check(variant((spec) => {
      spec.entries['dark-mode-signal'].fields['zhroma-off'] = 'no';
    })), 'recon-two-fields-inconsistent');
    expectCode(() => check(variant((spec) => {
      spec.entries['dark-mode-signal'].fields['os-auto-used'] = 'yes';
    })), 'recon-two-fields-inconsistent');
    expectCode(() => check(variant((spec) => {
      spec.entries['dark-native-states'].fields['zhroma-off'] = 'no';
    })), 'recon-two-fields-inconsistent');
  });

  test('an offered dark mode needs all six appearance cells', () => {
    expectCode(() => check(variant((spec) => {
      spec.entries['dark-mode-signal'].fields['cell-match-os-dark'] = undefined;
    })), 'recon-two-field-not-structured');
    expectCode(() => check(variant((spec) => {
      spec.entries['dark-mode-signal'].fields['cell-dark-os-light'] = 'pending';
    })), 'recon-two-field-not-structured');
    expectCode(() => check(variant((spec) => {
      spec.entries['dark-mode-signal'].fields['cell-dark-os-light'] = 'not-observed';
    })), 'recon-two-fields-inconsistent');
  });

  test('the offered flag and the not-offered branch agree', () => {
    expectCode(() => check(variant((spec) => {
      spec.entries['dark-mode-signal'].fields['dark-branch'] = 'not-offered';
    })), 'recon-two-fields-inconsistent');
  });

  test('a not-observed switch forces a not observed status', () => {
    expectCode(() => check(variant((spec) => {
      spec.entries['dark-mode-switch-mutation'].fields['switch-os-under-match'] = 'not-observed';
    })), 'recon-two-fields-inconsistent');
  });

  test('unobserved focus needs a Phase 8 focus fallback', () => {
    expectCode(() => check(variant((spec) => {
      spec.entries['dark-native-states'].fields['focus-observed'] = 'no';
    })), 'recon-two-fallback-missing');
    assert.equal(check(variant((spec) => {
      spec.entries['dark-native-states'].fields['focus-observed'] = 'no';
      spec.entries['dark-native-states'].fields['focus-fallback'] = 'Phase 8 leaves the native focus ring untouched.';
    })).verdict, 'proceed');
  });

  test('Garden identifiers that hold require a Document root', () => {
    expectCode(() => check(variant((spec) => {
      spec.entries['dark-table-topology'].fields['root-terminus'] = 'ShadowRoot';
    })), 'recon-two-fields-inconsistent');
  });
});

describe('Recon 2 Tags decision', () => {
  test('not-offered Tags need a fallback naming RULE-07 and RULE-F2', () => {
    for (const fallback of [undefined, 'Phase 9 keeps Tags inactive under RULE-07.', 'RULE-F2 stays deferred.']) {
      expectCode(() => check(variant((spec) => {
        spec.entries['referenced-cell-representation'].fields['tags-fallback'] = fallback;
      })), 'recon-two-fields-inconsistent');
    }
  });

  test('an observed Tags column needs its cell shape', () => {
    expectCode(() => check(variant((spec) => {
      spec.entries['referenced-cell-representation'].fields['tags-column'] = 'observed';
    })), 'recon-two-fields-inconsistent');
    assert.equal(check(variant((spec) => {
      spec.entries['referenced-cell-representation'].fields['tags-column'] = 'observed';
      spec.entries['referenced-cell-representation'].fields['tags-cell'] = 'chips with text';
      spec.entries['referenced-cell-representation'].fields['tags-fallback'] = undefined;
    })).verdict, 'proceed');
  });
});

describe('Recon 2 entry registration', () => {
  test('an empty ledger or a ledger with no Recon 2 entries is rejected', () => {
    expectCode(() => reconGate.verifyRecon2Ledger(''), 'recon-two-ledger-required');
    expectCode(() => reconGate.verifyRecon2Ledger('# Ledger only'), 'recon-two-entries-required');
  });

  test('a pending status is unresolved', () => {
    expectCode(() => check(variant((spec) => {
      spec.entries['header-label-uniqueness'].status = 'pending';
    })), 'recon-two-status-unresolved');
    expectCode(() => check(variant((spec) => {
      spec.entries['dark-mode-signal'].status = 'outside English-only scope';
    })), 'recon-two-status-unresolved');
  });

  test('a not observed entry needs a fallback naming Phase 8, 9 or 10', () => {
    expectCode(() => check(variant((spec) => {
      spec.entries['header-label-uniqueness'].status = 'not observed';
      spec.entries['header-label-uniqueness'].fallback = 'Record the labels in a later session.';
    })), 'recon-two-fallback-missing');
    expectCode(() => check(variant((spec) => {
      spec.entries['header-label-uniqueness'].status = 'not observed';
      spec.entries['header-label-uniqueness'].fallback = 'Phase 11 records the labels.';
    })), 'recon-two-fallback-missing');
  });

  test('an invalid enum value is not structured', () => {
    expectCode(() => check(variant((spec) => {
      spec.entries['dark-mode-signal'].fields['dark-branch'] = 'guessed';
    })), 'recon-two-field-not-structured');
    expectCode(() => check(variant((spec) => {
      spec.entries['referenced-cell-representation'].fields.vocabulary = 'assumed';
    })), 'recon-two-field-not-structured');
    expectCode(() => check(variant((spec) => {
      spec.entries['referenced-cell-representation'].fields['group-cell'] = undefined;
    })), 'recon-two-field-not-structured');
  });

  test('a missing id, an unknown id and a duplicate id are rejected', () => {
    expectCode(() => check(variant((spec) => {
      delete spec.entries['header-label-uniqueness'];
    })), 'recon-two-entry-missing');
    expectCode(() => check(variant((spec) => {
      spec.entries['private-person-id'] = { status: 'verified', fields: {} };
    })), 'recon-two-entry-unknown');
    const duplicated = recon2Block().replace('## Recon 2 Verdict',
      `${recon2Entry('header-label-uniqueness', completeSpec().entries['header-label-uniqueness'])}\n## Recon 2 Verdict`);
    expectCode(() => reconGate.verifyRecon2Ledger(duplicated, { admittedRecon2Scenarios: ALL_RECON_TWO_SCENARIOS }),
      'entry-id-duplicate');
  });

  test('reused Phase 1 shape codes and a non-array corpus are rejected', () => {
    const blankEvidence = mutateRecon2Entry(recon2Block(), 'identity-location',
      (section) => section.replace(/^- evidence:.*$/m, '- evidence: '));
    expectCode(() => reconGate.verifyRecon2Ledger(blankEvidence), 'entry-field-missing');
    const invalidId = recon2Block().replace('## Recon 2 Entry: identity-location\n\n- id: `identity-location`',
      '## Recon 2 Entry: Identity_Location\n\n- id: `Identity_Location`');
    expectCode(() => reconGate.verifyRecon2Ledger(invalidId), 'entry-id-invalid');
    expectCode(() => reconGate.verifyRecon2Ledger(recon2Block(), { admittedRecon2Scenarios: 'rules-light-table' }),
      'admitted-scenarios-required');
  });

  test('a scope other than English path is rejected', () => {
    expectCode(() => check(variant((spec) => {
      spec.entries['identity-location'].scope = 'Localization only';
    })), 'recon-two-scope-invalid');
  });

  test('an entry whose heading disagrees with its id is rejected', () => {
    const markdown = mutateRecon2Entry(recon2Block(), 'identity-location',
      (section) => section.replace('- id: `identity-location`', '- id: `identity-vs-assignee`'));
    expectCode(() => reconGate.verifyRecon2Ledger(markdown, { admittedRecon2Scenarios: ALL_RECON_TWO_SCENARIOS }),
      'entry-heading-id-mismatch');
  });

  test('a pending verdict is unresolved and a missing verdict is required', () => {
    expectCode(() => check(variant((spec) => {
      Object.assign(spec.verdict, {
        'recon2-verdict': 'pending',
        'blocked-consumers': 'pending',
        'fixture-light-table': 'pending',
        'fixture-identity-region': 'pending',
        'fixture-dark-table': 'pending',
      });
    })), 'recon-two-verdict-unresolved');
    expectCode(() => check(variant((spec) => {
      spec.verdict['blocked-consumers'] = 'pending';
    })), 'recon-two-verdict-unresolved');
    expectCode(() => check(variant((spec) => {
      spec.verdict.rationale = undefined;
    })), 'recon-two-verdict-unresolved');
    expectCode(() => check(variant((spec) => {
      spec.verdict = null;
    })), 'recon-two-verdict-required');
    expectCode(() => reconGate.verifyRecon2Ledger(`${recon2Block()}\n## Recon 2 Verdict\n\n- recon2-verdict: \`proceed\`\n`,
      { admittedRecon2Scenarios: ALL_RECON_TWO_SCENARIOS }), 'recon-two-verdict-required');
  });

  test('an entirely pending scaffold rejects on its first unresolved status', () => {
    const scaffold = withRecon2Verdict(EXPECTED_RECON_TWO_IDS.map((id) => recon2Entry(id, {
      status: 'pending',
      fallback: 'Phase 8, 9 or 10 names the fallback.',
    })).join('\n'), {
      'recon2-verdict': 'pending',
      'blocked-consumers': 'pending',
      rationale: 'Pending the live session.',
    });
    expectCode(() => reconGate.verifyRecon2Ledger(scaffold), 'recon-two-status-unresolved');
  });
});

describe('Recon 2 block safety and placement', () => {
  test('sensitive content anywhere in the Recon 2 block is rejected before entries are parsed', () => {
    for (const planted of ['agent.person@example.com', 'acme.zendesk.com', 'https:', 'seen at //example.test']) {
      const markdown = mutateRecon2Entry(recon2Block(), 'identity-location',
        (section) => section.replace('Synthetic structural evidence', `Synthetic structural evidence ${planted}`));
      expectCode(() => reconGate.verifyRecon2Ledger(markdown, { admittedRecon2Scenarios: ALL_RECON_TWO_SCENARIOS }),
        'recon-two-ledger-sensitive-content');
    }
    const verdictLeak = recon2Block().replace('this is not a live Zendesk conclusion', 'seen on acme.zendesk.com');
    expectCode(() => reconGate.verifyRecon2Ledger(verdictLeak, { admittedRecon2Scenarios: ALL_RECON_TWO_SCENARIOS }),
      'recon-two-ledger-sensitive-content');
    const unknownLeak = recon2Block(variant((spec) => {
      spec.entries['private-person-id'] = { status: 'pending', fallback: 'mail agent.person@example.com', fields: {} };
    }));
    expectCode(() => reconGate.verifyRecon2Ledger(unknownLeak), 'recon-two-ledger-sensitive-content');
  });

  test('text after the Recon 2 block is not scanned as part of it', () => {
    const markdown = `${recon2Block()}\n## Other Section\n\nSeen at acme.zendesk.com in Phase 1.\n`;
    assert.equal(reconGate.verifyRecon2Ledger(markdown, { admittedRecon2Scenarios: ALL_RECON_TWO_SCENARIOS }).verdict,
      'proceed');
  });

  test('a Recon 2 heading after Spec-less Planning Assumptions or the Final Verdict is misplaced', async () => {
    const real = withoutRecon2Block(await readFile(REPOSITORY_LEDGER, 'utf8'));
    const afterAssumptions = real.replace('## Final Verdict', `${recon2Block()}\n## Final Verdict`);
    expectCode(() => reconGate.verifyRecon2Ledger(afterAssumptions, { admittedRecon2Scenarios: ALL_RECON_TWO_SCENARIOS }),
      'recon-two-block-misplaced');
    const afterFinal = `${real}\n${recon2Block()}`;
    expectCode(() => reconGate.verifyRecon2Ledger(afterFinal, { admittedRecon2Scenarios: ALL_RECON_TWO_SCENARIOS }),
      'recon-two-block-misplaced');
    const splitBlock = insertBeforeAssumptions(real, recon2Block())
      .replace('## Final Verdict', '## Recon 2 Session Handoff\n\n- session-state: `late`\n\n## Final Verdict');
    expectCode(() => reconGate.verifyRecon2Ledger(splitBlock, { admittedRecon2Scenarios: ALL_RECON_TWO_SCENARIOS }),
      'recon-two-block-misplaced');
    const detached = `${recon2Block()}\n## Other Section\n\nUnscanned prose.\n\n## Recon 2 Session Handoff\n\n- session-state: \`late\`\n`;
    expectCode(() => reconGate.verifyRecon2Ledger(detached, { admittedRecon2Scenarios: ALL_RECON_TWO_SCENARIOS }),
      'recon-two-block-misplaced');
  });
});

describe('the registered Recon 2 block in SELECTORS.md', () => {
  test('registers the handoff, the eight entries in order and the verdict before the Phase 1 assumptions', async () => {
    const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
    const headings = [...markdown.matchAll(/^## Recon 2 (Session Handoff|Entry: (\S+)|Verdict)$/gm)];
    assert.deepEqual(headings.map((match) => match[2] ?? match[1]), [
      'Session Handoff', ...EXPECTED_RECON_TWO_IDS, 'Verdict',
    ]);
    const assumptions = markdown.indexOf('## Spec-less Planning Assumptions');
    assert.ok(headings.every((match) => match.index < assumptions));
    assert.match(markdown, /^- session-state: `[a-z0-9-]+`$/m);
    assert.match(markdown, /^- next-step: `(?:\d|admission)`$/m);
  });

  test('the real ledger rejects with recon-two-status-unresolved while any Recon 2 status is pending', async () => {
    const markdown = await readFile(REPOSITORY_LEDGER, 'utf8');
    const block = markdown.slice(markdown.indexOf('## Recon 2 '), markdown.indexOf('## Spec-less Planning Assumptions'));
    if (!/^- status: `pending`$/m.test(block)) return;
    expectCode(() => reconGate.verifyRecon2Ledger(markdown, { admittedRecon2Scenarios: [] }),
      'recon-two-status-unresolved');
    const result = runGate(['recon2', REPOSITORY_LEDGER, join(REPOSITORY_ROOT, 'test', 'fixtures', 'manifest.json')]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, 'RECON_GATE_REJECTED recon-two-status-unresolved\n');
  });
});

describe('Phase 1 non-regression', () => {
  test('the Phase 1 final gate is unchanged with a complete Recon 2 block in the real ledger', async () => {
    const markdown = insertBeforeAssumptions(await readFile(REPOSITORY_LEDGER, 'utf8'), recon2Block());
    assert.deepEqual(reconGate.verifyReconLedger(markdown, {
      mode: 'final',
      admittedScenarios: PHASE_ONE_SCENARIOS,
    }), { entryCount: 18, verdict: 'proceed' });
    assert.deepEqual(reconGate.verifyReconLedger(markdown, { mode: 'evidence' }), {
      entryCount: 18,
      verdict: null,
    });
    assert.deepEqual(reconGate.verifyRecon2Ledger(markdown, { admittedRecon2Scenarios: ALL_RECON_TWO_SCENARIOS }), {
      entryCount: 8,
      verdict: 'proceed',
      blockedConsumers: 'none',
    });
  });
});

const SELF_FORM = 'Selma Agentworth';
const PRIVATE_PERSON = 'Private Personne';
const PRIVATE_GROUP = 'Internal Organisation';
const PRIVATE_SUBJECTS = ['Tenant Subject One', 'Tenant Subject Two'];

function tableCapture() {
  const header = (label) => `<th data-garden-id="tables.header_cell"><button type="button">${label}</button></th>`;
  const row = (cells) => `<tr data-garden-id="tables.row" data-test-id="generic-table-row">${cells.map((cell) => (
    `<td data-garden-id="tables.cell">${cell}</td>`
  )).join('')}</tr>`;
  return `<div>
<table data-garden-id="tables.table" data-test-id="generic-table">
<thead data-garden-id="tables.head"><tr data-garden-id="tables.header_row">${['Priority', 'Assignee', 'Group', 'Status', 'Subject'].map(header).join('')}</tr></thead>
<tbody data-garden-id="tables.body">${[
  ['Urgent', SELF_FORM, PRIVATE_GROUP, 'Open', PRIVATE_SUBJECTS[0]],
  ['Low', PRIVATE_PERSON, PRIVATE_GROUP, 'New', PRIVATE_SUBJECTS[1]],
].map(row).join('')}</tbody>
</table>
</div>`;
}

function identityCapture() {
  return `<button type="button" aria-label="${SELF_FORM}" data-test-id="header-profile-button"><img data-test-id="avatar-image"><span>${SELF_FORM}</span></button>`;
}

async function admittedCorpus(directory, scenarios) {
  const privateDirectory = join(directory, 'private');
  const corpusDirectory = join(directory, 'corpus');
  await mkdir(privateDirectory);
  await mkdir(corpusDirectory);
  const denylistPath = join(privateDirectory, 'denylist.txt');
  await writeFile(denylistPath, `${[PRIVATE_PERSON, PRIVATE_GROUP, ...PRIVATE_SUBJECTS, `self: ${SELF_FORM}`].join('\n')}\n`);
  const shapes = {
    'rules-light-table': { capture: tableCapture(), appearance: 'light', boundaryKind: 'table' },
    'rules-identity-region': { capture: identityCapture(), appearance: 'light', boundaryKind: 'identity-region' },
    'rules-dark-table': { capture: tableCapture(), appearance: 'dark', boundaryKind: 'table' },
  };
  const recon2Fixtures = [];
  for (const scenario of scenarios) {
    const shape = shapes[scenario];
    const inputPath = join(privateDirectory, `${scenario}.private.html`);
    const file = `${scenario}.html`;
    const outputPath = join(corpusDirectory, file);
    await writeFile(inputPath, shape.capture);
    await sanitizeFixture({
      inputPath,
      outputPath,
      denylistPath,
      mode: 'rule-columns',
      ...(shape.boundaryKind === 'identity-region' ? { boundary: 'identity-region' } : {}),
    });
    recon2Fixtures.push({
      scenario,
      captureDate: '2026-09-25',
      workspace: { shell: 'current Agent Workspace', plan: 'unknown/not shared' },
      domBoundary: 'synthetic smoke-test boundary',
      sanitizationMethod: 'Synthetic capture sanitised by scripts/sanitize-fixture.js in rule-columns mode',
      file,
      sha256: sha256(await readFile(outputPath)),
      sanitizerMode: 'rule-columns',
      appearance: shape.appearance,
      boundaryKind: shape.boundaryKind,
    });
  }
  const manifestPath = join(corpusDirectory, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify({ recon2Fixtures }, null, 2));
  return manifestPath;
}

describe('recon2 CLI', () => {
  test('recon2 needs exactly a ledger and a manifest', () => {
    for (const args of [['recon2', REPOSITORY_LEDGER], ['recon2', REPOSITORY_LEDGER, 'manifest.json', 'extra']]) {
      const result = runGate(args);
      assert.equal(result.status, 1);
      assert.equal(result.stdout, '');
      assert.equal(result.stderr, 'RECON_GATE_REJECTED cli-arguments-invalid\n');
    }
    const unknownMode = runGate(['PRIVATE-MODE', REPOSITORY_LEDGER]);
    assert.equal(unknownMode.status, 1);
    assert.equal(unknownMode.stderr, 'RECON_GATE_REJECTED cli-arguments-invalid\n');
    assert.doesNotMatch(unknownMode.stderr, /PRIVATE-MODE/);
  });

  test('prints the Recon 2 verdict for complete ledgers and rule-columns fixtures', async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'zhroma-recon-two-cli-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const full = join(directory, 'full');
    await mkdir(full);
    const fullManifest = await admittedCorpus(full, ALL_RECON_TWO_SCENARIOS);
    const proceedLedger = join(directory, 'proceed-ledger.md');
    await writeFile(proceedLedger, recon2Block());
    const proceed = runGate(['recon2', proceedLedger, fullManifest]);
    assert.equal(proceed.stderr, '');
    assert.equal(proceed.status, 0);
    assert.equal(proceed.stdout, 'RECON 2 VERDICT: proceed\n');

    const lightOnly = join(directory, 'light-and-identity');
    await mkdir(lightOnly);
    const partialManifest = await admittedCorpus(lightOnly, ['rules-light-table', 'rules-identity-region']);
    const blockLedger = join(directory, 'block-ledger.md');
    await writeFile(blockLedger, recon2Block(variant(darkNotOffered)));
    const block = runGate(['recon2', blockLedger, partialManifest]);
    assert.equal(block.stderr, '');
    assert.equal(block.status, 0);
    assert.equal(block.stdout, 'RECON 2 VERDICT: block\n');
  });

  test('rejects a pending scaffold and private words with value-free codes only', async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'zhroma-recon-two-private-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const manifestPath = join(directory, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify({ recon2Fixtures: [] }));
    const ledgerPath = join(directory, 'ledger.md');
    for (const [markdown, code] of [
      [recon2Block(variant((spec) => {
        spec.entries['private-person-name'] = { status: 'verified', fields: {} };
      })), 'recon-two-entry-unknown'],
      [recon2Block(variant((spec) => {
        spec.entries['dark-mode-signal'].status = 'PRIVATE-STATUS-VALUE';
      })), 'recon-two-status-unresolved'],
      [recon2Block(variant((spec) => {
        for (const entry of Object.values(spec.entries)) entry.status = 'pending';
      })), 'recon-two-status-unresolved'],
    ]) {
      await writeFile(ledgerPath, markdown);
      const result = runGate(['recon2', ledgerPath, manifestPath]);
      assert.equal(result.status, 1);
      assert.equal(result.stdout, '');
      assert.equal(result.stderr, `RECON_GATE_REJECTED ${code}\n`);
      assert.doesNotMatch(result.stderr, /private-person-name|PRIVATE-STATUS-VALUE/);
    }
    const missingLedger = runGate(['recon2', join(directory, 'PRIVATE-PERSON-missing.md'), manifestPath]);
    assert.equal(missingLedger.stderr, 'RECON_GATE_REJECTED ledger-readable-required\n');
  });
});
