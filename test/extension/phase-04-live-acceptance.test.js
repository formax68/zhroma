// @vitest-environment node
//
// Phase 4's browser acceptance record, bound to the CURRENT shipped bytes.
//
// This is the Phase 2/3 strict-acceptance validator applied to Phase 4, with
// three deliberate strengthenings:
//
//   1. The asset inventory is RECURSIVE and COMPLETE. Phase 3 hashed three
//      files; Phase 4 ships eleven across two directories, so a flat
//      three-asset binding would let a changed worker, popup or PNG ride along
//      under an unchanged content.js digest.
//   2. The three descriptor-less prohibition judgments are carried IN the
//      record as `flagged-unverified`, and `passed` is unreachable while any of
//      them is unresolved. A green automated suite cannot dispose of them.
//   3. The Phase 3 record is read from disk and its real counts are asserted,
//      so this phase's evidence cannot quietly restate a predecessor status
//      that nobody re-established.
//
// Everything here validates PREPARATION. A passing run of this file is not,
// and can never become, the human observation it is preparing for.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { validateWorkloadReport } from '../../scripts/run-tint-workload.js';

const root = new URL('../../', import.meta.url);
const phase = new URL('.planning/phases/04-honest-failure-and-an-off-switch/', root);
const priorPhase = new URL('.planning/phases/03-the-tint-survives-everything/', root);

// Seventeen stable IDs. Order is the acceptance walkthrough order; the validator
// requires the set, not the order.
//
// `english-regional-locale` was added by 04-11: the CR-01 repair means an
// English REGIONAL shell (en-GB, en-US, …) now tints instead of being told its
// language is unsupported, and that behaviour had no live-evidence slot at all.
// A shipped behaviour with no slot is the silent gap promotion rule 3 exists to
// prevent.
const REQUIRED_IDS = [
  'working-icon', 'blank-copy', 'missing-icon-hint', 'missing-settle-transition',
  'language-icon-copy', 'structure-copy', 'english-regional-locale',
  'off-clears', 'on-restores',
  'restart-off', 'restart-on', 'cross-tab-preference', 'frozen-resume',
  'nonreceiver-status', 'navigation-status', 'worker-restart', 'popup-keyboard',
];
const SCOPE = { language: 'English', html_lang: 'en', shell: 'current Agent Workspace', interface: 'light' };
const LANG_VARIANTS = ['en', 'en-*', 'non-English'];
// Three bespoke product prohibitions survived recall with no fabricated
// descriptor (04-SOURCE-AUDIT.md "Prohibition recall and precision"). They are
// carried, not closed.
const PROHIBITION_IDS = ['no-agent-blame', 're-enable-not-pressured', 'untested-is-not-consent'];
const PROHIBITION_STATUSES = ['flagged-unverified', 'reviewed-resolved'];
const TIMING_KEYS = [30, 200, 1000].flatMap((size) => ['enabled', 'disabled'].map((mode) => `${size}-${mode}`));
const TIMING_ASSETS = ['manifest.json', 'content.js', 'zhroma.css'];

const walk = (dir, base = '') => readdirSync(dir).flatMap((name) => {
  const path = `${dir}/${name}`;
  return statSync(path).isDirectory() ? walk(path, `${base}${name}/`) : [`${base}${name}`];
});
const extensionDir = fileURLToPath(new URL('extension', root));
// The complete packaged inventory, recursively. A new directory cannot hide a
// file from this and an extra file cannot hide inside one.
const SHIPPED = Object.fromEntries(walk(extensionDir).sort().map((name) => [name,
  createHash('sha256').update(readFileSync(`${extensionDir}/${name}`)).digest('hex')]));
const SHIPPED_NAMES = Object.keys(SHIPPED);

const contentSource = readFileSync(`${extensionDir}/content.js`, 'utf8');
const manifest = JSON.parse(readFileSync(`${extensionDir}/manifest.json`, 'utf8'));
const literal = (pattern, label) => {
  const match = contentSource.match(pattern);
  if (!match) throw new Error(`Final source setting could not be extracted: ${label}`);
  return match[1];
};
// Derived from the shipped bytes, never transcribed. A source edit that moves
// any of these makes an already-written record stale rather than silently true.
const settings = {
  settle_ms: Number(literal(/const SETTLE_MS = (\d+);/, 'SETTLE_MS')),
  preference_key: literal(/const PREFERENCE_KEY = '([^']+)';/, 'PREFERENCE_KEY'),
  preference_area: literal(/const PREFERENCE_AREA = '([^']+)';/, 'PREFERENCE_AREA'),
  minimum_chrome_version: manifest.minimum_chrome_version,
};

const performancePath = fileURLToPath(new URL('04-PERFORMANCE-SAMPLES.json', phase));
const loadPerformance = () => (existsSync(performancePath)
  ? JSON.parse(readFileSync(performancePath, 'utf8')) : null);

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
const sameKeys = (value, keys) => isObject(value)
  && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const requireEvidence = (condition, code) => { if (!condition) throw new Error(`PHASE04_ACCEPTANCE_REJECTED ${code}`); };

// Tokenize before JSON.parse can discard repeated members. Strings are opaque
// tokens; each object gets its own decoded-name set, including inside arrays.
function requireUniqueJsonMembers(json) {
  const tokens = /"(?:\\["\\/bfnrt]|\\u[0-9a-fA-F]{4}|[^"\\\u0000-\u001f])*"|[{}\[\]:,]|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[ \t\r\n]+/gy;
  const containers = [];
  let previous;
  let offset = 0;
  while (offset < json.length) {
    const match = tokens.exec(json);
    requireEvidence(match !== null, 'invalid-json');
    offset = tokens.lastIndex;
    const token = match[0];
    if (/^[ \t\r\n]/.test(token)) continue;
    if (token === '{') containers.push(new Set());
    else if (token === '[') containers.push(null);
    else if (token === '}' || token === ']') containers.pop();
    else if (token === ':') {
      const names = containers.at(-1);
      requireEvidence(names instanceof Set && previous?.startsWith('"'), 'invalid-json');
      const name = JSON.parse(previous);
      requireEvidence(!names.has(name), 'duplicate-json-member');
      names.add(name);
    }
    previous = token;
  }
}

export function parsePhase04Acceptance(markdown) {
  const records = [...markdown.matchAll(/^```json\r?\n([\s\S]*?)\r?\n```\s*$/gm)];
  requireEvidence(records.length === 1, 'single-record-required');
  requireUniqueJsonMembers(records[0][1]);
  let record;
  try { record = JSON.parse(records[0][1]); }
  catch { throw new Error('PHASE04_ACCEPTANCE_REJECTED invalid-json'); }
  requireEvidence(isObject(record), 'object-required');
  return record;
}

// The predecessor's real disposition, read from its own file. Phase 4 states
// Phase 3's status; it may not restate it into something better.
function priorSourceFacts() {
  const markdown = readFileSync(new URL('03-LIVE-ACCEPTANCE.md', priorPhase), 'utf8');
  const records = [...markdown.matchAll(/^```json\r?\n([\s\S]*?)\r?\n```\s*$/gm)];
  requireEvidence(records.length === 1, 'prior-single-record');
  const prior = JSON.parse(records[0][1]);
  const path = '.planning/phases/03-the-tint-survives-everything/03-LIVE-ACCEPTANCE.md';
  const git = (...args) => execFileSync('git', args, { cwd: fileURLToPath(root), encoding: 'utf8' }).trim();
  const observationRevision = git('log', '-1', '--format=%H', '--', path);
  requireEvidence(git('show', `${observationRevision}:${path}`) === markdown.trim(), 'prior-uncommitted-observations');
  const runtimeRevision = git('log', '-1', '--format=%H', observationRevision, '--', 'extension');
  for (const [name, hash] of Object.entries(prior.runtime_sha256)) {
    const bytes = execFileSync('git', ['show', `${runtimeRevision}:extension/${name}`], { cwd: fileURLToPath(root) });
    requireEvidence(createHash('sha256').update(bytes).digest('hex') === hash, 'prior-runtime-hashes');
  }
  return {
    phase: '03-the-tint-survives-everything',
    revision: runtimeRevision,
    observation_revision: observationRevision,
    status: prior.status,
    checks_passed: prior.checks.filter((row) => row.status === 'pass').length,
    checks_pending: prior.checks.filter((row) => row.status === 'pending').length,
    checks_failed: prior.checks.filter((row) => row.status === 'fail').length,
    verification: '28/34',
    uat_execution: 'skipped-by-user',
  };
}
const PRIOR = priorSourceFacts();

// RED seam: canonical documents historically had no promotion gate. Replaced
// after the false-completion counterexamples are measured below.
export function validateCanonicalPromotion() { return true; }

export function validatePhase04Acceptance(record, performance = loadPerformance(), { now = new Date(), timeZone = 'Asia/Nicosia' } = {}) {
  requireEvidence(now instanceof Date && Number.isFinite(now.getTime()), 'clock');
  const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const today = ['year', 'month', 'day'].map((p) => parts.find(({ type }) => type === p).value).join('-');
  const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value <= today;

  requireEvidence(sameKeys(record, ['schema_version', 'status', 'scope', 'source', 'settings',
    'loaded_from_repository', 'source_confirmed_on', 'environment', 'prior_source', 'checks',
    'flagged_unverified', 'limitations']), 'record-fields');
  requireEvidence(record.schema_version === 1 && ['human_needed', 'gaps_found', 'passed'].includes(record.status), 'schema-status');
  requireEvidence(sameKeys(record.scope, [...Object.keys(SCOPE), 'html_lang_variants'])
    && Object.entries(SCOPE).every(([key, value]) => record.scope[key] === value)
    && Array.isArray(record.scope.html_lang_variants)
    && record.scope.html_lang_variants.length === LANG_VARIANTS.length
    && LANG_VARIANTS.every((value, index) => record.scope.html_lang_variants[index] === value), 'scope');

  // Complete recursive asset binding: exact inventory, exact bytes.
  requireEvidence(sameKeys(record.source, ['inventory_count', 'assets']), 'source-fields');
  requireEvidence(record.source.inventory_count === SHIPPED_NAMES.length, 'inventory-count');
  requireEvidence(sameKeys(record.source.assets, SHIPPED_NAMES), 'asset-inventory');
  requireEvidence(SHIPPED_NAMES.every((name) => record.source.assets[name] === SHIPPED[name]), 'source-hashes');
  requireEvidence(sameKeys(record.settings, Object.keys(settings))
    && Object.entries(settings).every(([key, value]) => record.settings[key] === value), 'settings');

  requireEvidence(typeof record.loaded_from_repository === 'boolean', 'source-confirmation');
  requireEvidence(sameKeys(record.environment, ['browser', 'os', 'mounted_rows', 'interface_language', 'appearance']), 'environment');
  requireEvidence(sameKeys(record.prior_source, Object.keys(PRIOR))
    && Object.entries(PRIOR).every(([key, value]) => record.prior_source[key] === value), 'prior-source');

  if (record.loaded_from_repository) {
    requireEvidence(validDate(record.source_confirmed_on) && nonempty(record.environment.browser) && nonempty(record.environment.os)
      && Number.isInteger(record.environment.mounted_rows) && record.environment.mounted_rows >= 0
      && record.environment.interface_language === 'en' && record.environment.appearance === 'light', 'confirmed-environment');
  } else {
    requireEvidence(record.source_confirmed_on === null && Object.values(record.environment).every((value) => value === null), 'unconfirmed-environment');
  }

  requireEvidence(Array.isArray(record.checks) && record.checks.length === REQUIRED_IDS.length
    && REQUIRED_IDS.every((id) => record.checks.filter((row) => row?.id === id).length === 1), 'required-checks');
  for (const check of record.checks) {
    requireEvidence(sameKeys(check, ['id', 'status', 'evidence_kind', 'observed_on', 'evidence', 'language_context']), 'check-fields');
    requireEvidence(['pending', 'pass', 'fail'].includes(check.status), 'check-status');
    if (check.status === 'pending') {
      requireEvidence(check.evidence_kind === 'pending' && check.observed_on === null
        && check.evidence === null && check.language_context === null, 'pending-evidence');
      continue;
    }
    // Only an observed check may carry metadata, and only confirmed metadata.
    requireEvidence(record.loaded_from_repository && check.evidence_kind === 'live' && nonempty(check.evidence), 'live-source-evidence');
    requireEvidence(!/\b(synthetic|fixture|happy.dom|unit.test|vitest|simulated)\b/i.test(check.evidence), 'synthetic-is-not-live');
    requireEvidence(validDate(check.observed_on) && check.observed_on >= record.source_confirmed_on, 'observation-date');
    // Confidential-evidence handling (01-CONTEXT.md D-02/D-03): aggregate
    // outcomes only. A URL, an address or a long identifier is ticket-shaped.
    requireEvidence(!/https?:\/\/|@[\w.-]+\.\w{2,}|\b\d{6,}\b/.test(check.evidence), 'confidential-evidence');
    // Language context is a controlled tag, never free text, and belongs to
    // exactly two checks — the two whose whole subject IS the shell language.
    // `language-icon-copy` needs a tag that is NOT English; its opposite,
    // `english-regional-locale`, needs a tag that is English but is not the
    // bare `en` (a bare `en` is `working-icon`'s scope, not this check's).
    if (check.id === 'language-icon-copy') {
      requireEvidence(typeof check.language_context === 'string' && /^[a-z]{2}(-[a-z0-9]{2,8})*$/i.test(check.language_context)
        && !/^en(?:-|$)/i.test(check.language_context), 'language-context');
    } else if (check.id === 'english-regional-locale') {
      requireEvidence(typeof check.language_context === 'string'
        && /^en-[a-z0-9]{2,8}(?:-[a-z0-9]{2,8})*$/i.test(check.language_context), 'language-context');
    } else requireEvidence(check.language_context === null, 'language-context-scope');
  }

  requireEvidence(Array.isArray(record.flagged_unverified) && record.flagged_unverified.length === PROHIBITION_IDS.length
    && PROHIBITION_IDS.every((id) => record.flagged_unverified.filter((row) => row?.id === id).length === 1), 'prohibition-set');
  for (const item of record.flagged_unverified) {
    requireEvidence(sameKeys(item, ['id', 'statement', 'status', 'disposition']), 'prohibition-fields');
    requireEvidence(nonempty(item.statement) && nonempty(item.disposition), 'prohibition-text');
    requireEvidence(PROHIBITION_STATUSES.includes(item.status), 'prohibition-status');
  }

  requireEvidence(sameKeys(record.limitations, ['unresolved_observed_defects', 'unavailable_scenarios']), 'limitations');
  requireEvidence(Array.isArray(record.limitations.unresolved_observed_defects) && record.limitations.unresolved_observed_defects.every(nonempty), 'defects');
  requireEvidence(Array.isArray(record.limitations.unavailable_scenarios) && record.limitations.unavailable_scenarios.every((item) =>
    sameKeys(item, ['id', 'reason']) && REQUIRED_IDS.includes(item.id) && nonempty(item.reason)), 'unavailable');
  requireEvidence(new Set(record.limitations.unavailable_scenarios.map((item) => item.id)).size === record.limitations.unavailable_scenarios.length, 'duplicate-unavailable');
  for (const item of record.limitations.unavailable_scenarios) {
    requireEvidence(record.checks.find((row) => row.id === item.id).status === 'pending', 'unavailable-must-remain-pending');
  }

  // Timing is a separate verdict. Absent samples make the record incomplete,
  // never failed; failed samples make it a defect.
  let timingComplete = true;
  let performanceFailed = false;
  if (!performance) timingComplete = false;
  else {
    requireEvidence(sameKeys(performance.identity?.hashes, TIMING_ASSETS)
      && TIMING_ASSETS.every((name) => performance.identity.hashes[name] === SHIPPED[name]), 'performance-source');
    for (const key of TIMING_KEYS) {
      const run = performance.runs?.[key];
      if (!run) { timingComplete = false; continue; }
      const [size, mode] = key.split('-');
      requireEvidence(run.size === Number(size) && run.mode === mode, 'performance-scope');
      if (validateWorkloadReport(run) === 'gaps_found') performanceFailed = true;
    }
  }

  const defect = performanceFailed || record.checks.some((row) => row.status === 'fail')
    || record.limitations.unresolved_observed_defects.length > 0;
  const complete = record.loaded_from_repository
    && record.checks.every((row) => row.status === 'pass')
    && timingComplete
    && record.flagged_unverified.every((item) => item.status === 'reviewed-resolved');
  const expected = defect ? 'gaps_found' : complete ? 'passed' : 'human_needed';
  requireEvidence(record.status === expected, 'disposition');
  return expected;
}

// ---------------------------------------------------------------------------
// Hypothetical claims are confined to in-memory validation tests. Nothing
// below can promote the repository record.
// ---------------------------------------------------------------------------
const CLOCK = { now: new Date('2026-09-10T12:00:00Z'), timeZone: 'Asia/Nicosia' };

function example(complete = false) {
  return {
    schema_version: 1,
    status: complete ? 'passed' : 'human_needed',
    scope: { ...SCOPE, html_lang_variants: [...LANG_VARIANTS] },
    source: { inventory_count: SHIPPED_NAMES.length, assets: { ...SHIPPED } },
    settings: { ...settings },
    loaded_from_repository: complete,
    source_confirmed_on: complete ? '2026-09-10' : null,
    environment: complete
      ? { browser: 'Test browser', os: 'Test OS', mounted_rows: 30, interface_language: 'en', appearance: 'light' }
      : { browser: null, os: null, mounted_rows: null, interface_language: null, appearance: null },
    prior_source: { ...PRIOR },
    checks: REQUIRED_IDS.map((id) => ({
      id,
      status: complete ? 'pass' : 'pending',
      evidence_kind: complete ? 'live' : 'pending',
      observed_on: complete ? '2026-09-10' : null,
      evidence: complete ? 'In-memory validator example only' : null,
      language_context: complete && id === 'language-icon-copy' ? 'de'
        : complete && id === 'english-regional-locale' ? 'en-GB' : null,
    })),
    flagged_unverified: PROHIBITION_IDS.map((id) => ({
      id,
      statement: 'In-memory validator example only',
      status: complete ? 'reviewed-resolved' : 'flagged-unverified',
      disposition: 'In-memory validator example only',
    })),
    limitations: { unresolved_observed_defects: [], unavailable_scenarios: [] },
  };
}

function acceptedPerformance() {
  const result = { schema_version: 1, identity: { hashes: Object.fromEntries(TIMING_ASSETS.map((n) => [n, SHIPPED[n]])) }, runs: {} };
  for (const key of TIMING_KEYS) {
    const [size, mode] = key.split('-');
    const sample = mode === 'enabled'
      ? { segments: [{ category: 'observer', cpu: 0.2 }, { category: 'timer', cpu: 0.3 }], totalCpu: 0.5, callbacks: 2, passes: 1, writes: 1, latency: 2 }
      : { segments: [], totalCpu: 0, callbacks: 0, passes: 0, writes: 0, latency: 2 };
    result.runs[key] = {
      size: Number(size), mode, warmups: 10, measured: 100,
      operations: Object.fromEntries(['edit', 'reorder', 'body', 'table', 'invalid-repair', 'unrelated']
        .map((op) => [op, Array.from({ length: 100 }, () => structuredClone(sample))])),
    };
  }
  return result;
}

test('a complete honest pending record validates, and only a fully consistent live claim can pass', () => {
  expect(validatePhase04Acceptance(example(), acceptedPerformance(), CLOCK)).toBe('human_needed');
  expect(validatePhase04Acceptance(example(true), acceptedPerformance(), CLOCK)).toBe('passed');
});

test('all seventeen new live checks stay pending absent an actual observation', () => {
  const pending = example();
  expect(pending.checks).toHaveLength(17);
  expect(pending.checks.every((row) => row.status === 'pending')).toBe(true);
  expect(validatePhase04Acceptance(pending, acceptedPerformance(), CLOCK)).toBe('human_needed');
  // Absent timing samples cannot be papered over either.
  expect(validatePhase04Acceptance(pending, null, CLOCK)).toBe('human_needed');
});

test('primary English scope admits the exact ordered supplemental descriptors without claiming observations', () => {
  const record = example();
  record.scope.html_lang_variants = ['en', 'en-*', 'non-English'];
  expect(validatePhase04Acceptance(record, acceptedPerformance(), CLOCK)).toBe('human_needed');
});

test('English regional evidence cannot satisfy the non-English scenario', () => {
  const record = example(true);
  record.checks.find((row) => row.id === 'language-icon-copy').language_context = 'en-GB';
  expect(() => validatePhase04Acceptance(record, acceptedPerformance(), CLOCK)).toThrow(/language-context/);
});

const canonicalRequirements = () => readFileSync(new URL('.planning/REQUIREMENTS.md', root), 'utf8');
test.each(['checkbox', 'Complete'])('canonical promotion rejects a false %s without live evidence', (claim) => {
  const markdown = canonicalRequirements();
  const forged = claim === 'checkbox'
    ? markdown.replace('- [ ] **FAIL-01**:', '- [x] **FAIL-01**:')
    : markdown.replace(/(\| FAIL-01 \| Phase 4 \| )[^|]+/, '$1Complete ');
  expect(forged).not.toBe(markdown);
  expect(() => validateCanonicalPromotion(forged, example(), {
    codeReviewReady: true, securityReviewReady: true, technicalTestsPassed: true,
    historicResetAcknowledged: true,
  }, acceptedPerformance(), CLOCK)).toThrow(/canonical-promotion/);
});

test.each([
  ['forged pass with a still-pending check', (r) => { r.checks[3] = example().checks[3]; }],
  ['forged pass with an unresolved prohibition', (r) => { r.flagged_unverified[0].status = 'flagged-unverified'; }],
  ['forged pass with an unconfirmed source', (r) => { r.loaded_from_repository = false; }],
  ['missing check', (r) => r.checks.pop()],
  ['duplicated check ID', (r) => { r.checks[1].id = r.checks[0].id; }],
  ['extra check', (r) => r.checks.push({ ...r.checks[0], id: 'extra' })],
  ['missing prohibition', (r) => r.flagged_unverified.pop()],
  ['mixed asset hashes', (r) => { r.source.assets['content.js'] = 'aaf2596dd41e67b520d6accd9ff55ecf8ab525de0098571dc284c81773998dc2'; }],
  ['stale three-asset source binding', (r) => {
    r.source = { inventory_count: 3, assets: { 'manifest.json': SHIPPED['manifest.json'], 'content.js': SHIPPED['content.js'], 'zhroma.css': SHIPPED['zhroma.css'] } };
  }],
  ['missing packaged asset', (r) => { delete r.source.assets['icons/off.png']; r.source.inventory_count = 10; }],
  ['extra packaged asset', (r) => { r.source.assets['icons/extra.png'] = '0'.repeat(64); r.source.inventory_count = 12; }],
  ['stale derived settings', (r) => { r.settings.settle_ms = 250; }],
  ['restated prior-source status', (r) => { r.prior_source.status = 'passed'; }],
  ['laundered prior-source pending count', (r) => { r.prior_source.checks_pending = 0; r.prior_source.checks_passed = 20; }],
  ['future observation date', (r) => { r.checks[0].observed_on = '2026-09-11'; }],
  ['invalid observation date', (r) => { r.checks[0].observed_on = '2026-02-30'; }],
  ['pre-confirmation observation', (r) => { r.checks[0].observed_on = '2026-09-09'; }],
  ['synthetic evidence kind', (r) => { r.checks[0].evidence_kind = 'synthetic'; }],
  ['fixture result described as live', (r) => { r.checks[0].evidence = 'Simulated fixture result'; }],
  ['ticket URL in evidence', (r) => { r.checks[0].evidence = 'Observed at https://example.zendesk.com/agent/tickets/1'; }],
  ['ticket identifier in evidence', (r) => { r.checks[0].evidence = 'Observed on ticket 1048576'; }],
  ['free-text language context', (r) => { r.checks.find((c) => c.id === 'language-icon-copy').language_context = 'German account of the customer'; }],
  ['language context on an unrelated check', (r) => { r.checks[0].language_context = 'de'; }],
  // The English-regional check is the CR-01 repair's own slot: its whole point
  // is a shell that is English but is not the bare `en`, so both near-misses
  // must be refused rather than quietly admitted.
  ['bare en claimed as an English REGIONAL locale', (r) => { r.checks.find((c) => c.id === 'english-regional-locale').language_context = 'en'; }],
  ['a non-English tag claimed as an English regional locale', (r) => { r.checks.find((c) => c.id === 'english-regional-locale').language_context = 'de'; }],
  ['a near-miss primary subtag claimed as English', (r) => { r.checks.find((c) => c.id === 'english-regional-locale').language_context = 'eng-GB'; }],
  ['a missing language context on the English-regional check', (r) => { r.checks.find((c) => c.id === 'english-regional-locale').language_context = null; }],
  ['hidden defect', (r) => r.limitations.unresolved_observed_defects.push('Observed issue')],
  ['failed row claimed as passed', (r) => { r.checks[0].status = 'fail'; }],
  ['unavailable scenario claimed as observed', (r) => r.limitations.unavailable_scenarios.push({ id: 'restart-off', reason: 'Unavailable' })],
])('rejects %s while passed is claimed', (_name, change) => {
  const record = example(true);
  change(record);
  expect(() => validatePhase04Acceptance(record, acceptedPerformance(), CLOCK)).toThrow(/PHASE04_ACCEPTANCE_REJECTED/);
});

test.each(['missing-run', 'slow-sample', 'wrong-source', 'three-of-six', 'mislabelled-size'])('rejects a passed claim with %s timing evidence', (kind) => {
  const performance = acceptedPerformance();
  if (kind === 'missing-run') delete performance.runs['1000-enabled'];
  if (kind === 'slow-sample') { const s = performance.runs['30-enabled'].operations.edit[0]; s.segments[0].cpu += 20; s.totalCpu += 20; }
  if (kind === 'wrong-source') performance.identity.hashes['content.js'] = '0'.repeat(64);
  if (kind === 'three-of-six') for (const key of ['30-disabled', '200-disabled', '1000-disabled']) delete performance.runs[key];
  if (kind === 'mislabelled-size') performance.runs['1000-enabled'].size = 30;
  expect(() => validatePhase04Acceptance(example(true), performance, CLOCK)).toThrow();
});

test('a failed observation derives gaps_found and a deferred one stays pending', () => {
  const failed = example(true);
  failed.checks[0].status = 'fail';
  failed.status = 'gaps_found';
  expect(validatePhase04Acceptance(failed, acceptedPerformance(), CLOCK)).toBe('gaps_found');
  const deferred = example();
  deferred.limitations.unavailable_scenarios.push({ id: 'frozen-resume', reason: 'No safe context was available in this run' });
  expect(validatePhase04Acceptance(deferred, acceptedPerformance(), CLOCK)).toBe('human_needed');
});

test('parser rejects duplicate JSON members and more than one canonical record', () => {
  expect(() => parsePhase04Acceptance('```json\n{"schema_version":1,"schema_version":1}\n```')).toThrow(/duplicate-json-member/);
  const text = `\`\`\`json\n${JSON.stringify(example())}\n\`\`\``;
  expect(() => parsePhase04Acceptance(`${text}\n${text}`)).toThrow(/single-record-required/);
  expect(parsePhase04Acceptance(text)).toEqual(example());
});

test('the repository record binds to every current shipped byte and reports its actual status', () => {
  const markdown = readFileSync(new URL('04-LIVE-ACCEPTANCE.md', phase), 'utf8');
  const record = parsePhase04Acceptance(markdown);
  expect(Object.keys(record.source.assets).sort()).toEqual(SHIPPED_NAMES);
  expect(record.source.assets).toEqual(SHIPPED);
  expect(record.source.inventory_count).toBe(11);
  const status = validatePhase04Acceptance(record);
  process.stdout.write(`PHASE 04 LIVE ACCEPTANCE STATUS: ${status}\n`);
  expect(status).toBe(record.status);
});

test('the repository record carries all three prohibition judgments as flagged-unverified', () => {
  const record = parsePhase04Acceptance(readFileSync(new URL('04-LIVE-ACCEPTANCE.md', phase), 'utf8'));
  expect(record.flagged_unverified.map((item) => item.id).sort()).toEqual([...PROHIBITION_IDS].sort());
  expect(record.flagged_unverified.every((item) => item.status === 'flagged-unverified')).toBe(true);
  expect(record.status).not.toBe('passed');
});

test('the repository record preserves Phase 3 unchanged rather than laundering it', () => {
  const record = parsePhase04Acceptance(readFileSync(new URL('04-LIVE-ACCEPTANCE.md', phase), 'utf8'));
  // Read from Phase 3's own file, not from this record's claim about it.
  expect(PRIOR.status).toBe('human_needed');
  expect(PRIOR.checks_passed).toBe(11);
  expect(PRIOR.checks_pending).toBe(9);
  expect(PRIOR.checks_failed).toBe(0);
  expect(record.prior_source).toEqual(PRIOR);
  expect(record.prior_source.uat_execution).toBe('skipped-by-user');
});
