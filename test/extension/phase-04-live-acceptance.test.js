// @vitest-environment node
//
// Phase 4's browser acceptance record, bound to the bytes it was OBSERVED
// against.
//
// Until Phase 5 those bytes were also the current ones, and this file read them
// straight from `extension/`. Phase 5 changes shipped bytes on purpose — a
// store title, a short description and a 128px brand icon — so the source input
// moved to `scripts/phase-04-source.js`, which serves the exact Git blobs at
// the pinned observation revision and refuses to fall back to the working tree.
// The observations did not change; what they are compared against is now stated
// explicitly instead of being whatever `extension/` happens to hold today.
//
// This is the Phase 2/3 strict-acceptance validator applied to Phase 4, with
// three deliberate strengthenings:
//
//   1. The asset inventory is RECURSIVE and COMPLETE. Phase 3 hashed three
//      files; Phase 4 shipped eleven across two directories, so a flat
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
import { BASELINE_PATH, readBaseline, readPhase04Source, readWorkingCopy } from '../../scripts/phase-04-source.js';

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
const TIMING_KEYS = [...[30, 200, 1000].flatMap((size) => ['enabled', 'disabled'].map((mode) => `${size}-${mode}`)), '30-dormant'];
const TIMING_ASSETS = ['manifest.json', 'content.js', 'zhroma.css'];

const walk = (dir, base = '') => readdirSync(dir).flatMap((name) => {
  const path = `${dir}/${name}`;
  return statSync(path).isDirectory() ? walk(path, `${base}${name}/`) : [`${base}${name}`];
});
const extensionDir = fileURLToPath(new URL('extension', root));

// The observed packaged inventory, complete and recursive, read from the pinned
// Git revision rather than from disk. A new directory cannot hide a file from
// it, an extra file cannot hide inside one, and — the Phase 5 addition — a
// later edit to `extension/` cannot move it at all.
const OBSERVED_SOURCE = readPhase04Source();
const OBSERVED = OBSERVED_SOURCE.assets;
const OBSERVED_NAMES = OBSERVED_SOURCE.names;
const OBSERVED_DIGEST = OBSERVED_SOURCE.digest;
const TIMING_HARNESS = OBSERVED_SOURCE.timingHarnessHash;

const contentSource = OBSERVED_SOURCE.contentSource;
const manifest = OBSERVED_SOURCE.manifest;
const literal = (pattern, label) => {
  const match = contentSource.match(pattern);
  if (!match) throw new Error(`Final source setting could not be extracted: ${label}`);
  return match[1];
};
// Derived from the observed bytes, never transcribed. A source edit that moves
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
const validLanguageTag = (value) => {
  if (typeof value !== 'string' || !/^[a-z]{2,8}(?:-[a-z0-9]{1,8})*$/i.test(value)) return false;
  try { return Intl.getCanonicalLocales(value).length === 1; } catch { return false; }
};

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
  requireEvidence(sameKeys(prior.runtime_sha256, TIMING_ASSETS), 'prior-runtime-inventory');
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

// Only explicit current evidence can support canonical completion. Old SUMMARY
// metadata is deliberately not an input. This pure guard never writes files.
const REQUIREMENT_CHECKS = {
  'FAIL-01': ['working-icon', 'blank-copy', 'missing-icon-hint', 'language-icon-copy', 'structure-copy', 'navigation-status', 'english-regional-locale'],
  'FAIL-02': ['missing-icon-hint', 'missing-settle-transition'],
  'FAIL-03': ['language-icon-copy', 'structure-copy', 'english-regional-locale'],
  'FAIL-05': ['working-icon', 'missing-icon-hint', 'language-icon-copy', 'structure-copy', 'navigation-status', 'worker-restart'],
  'CTRL-02': ['off-clears', 'on-restores', 'popup-keyboard'],
  'CTRL-03': ['restart-off', 'restart-on', 'cross-tab-preference', 'frozen-resume', 'worker-restart'],
  'CTRL-04': ['off-clears', 'on-restores', 'nonreceiver-status'],
};
export function validateCanonicalPromotion(markdown, record, readiness, performance, clock) {
  const status = validatePhase04Acceptance(record, performance, clock);
  requireEvidence(typeof markdown === 'string' && isObject(readiness), 'canonical-promotion-input');
  const technicalReady = readiness.codeReviewReady === true && readiness.securityReviewReady === true
    && readiness.technicalTestsPassed === true;
  for (const [id, checks] of Object.entries(REQUIREMENT_CHECKS)) {
    const boxes = [...markdown.matchAll(new RegExp(`^- \\[([ xX])\\] \\*\\*${id}\\*\\*:`, 'gm'))];
    const rows = [...markdown.matchAll(new RegExp(`^\\| ${id} \\| Phase 4 \\| ([^|]+)\\|\\s*$`, 'gm'))];
    requireEvidence(boxes.length === 1 && rows.length === 1, 'canonical-promotion-document');
    const canonicalStatus = rows[0][1].trim();
    requireEvidence(['Pending', 'Gaps Found', 'Complete'].includes(canonicalStatus), 'canonical-promotion-status');
    const checked = boxes[0][1].toLowerCase() === 'x';
    if (!checked && canonicalStatus !== 'Complete') continue;
    const observed = checks.every((checkId) => record.checks.find((row) => row.id === checkId)?.status === 'pass');
    requireEvidence(technicalReady && status !== 'gaps_found' && record.loaded_from_repository
      && performance && TIMING_KEYS.every((key) => performance.runs?.[key])
      && observed && readiness.historicResetAcknowledged === true
      && record.flagged_unverified.every((item) => item.status === 'reviewed-resolved'), `canonical-promotion-${id}`);
    requireEvidence(checked && canonicalStatus === 'Complete', `canonical-promotion-inconsistent-${id}`);
  }
  return true;
}

export function technicalReviewReadiness(code, security, validation) {
  const frontmatter = (markdown) => markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] ?? '';
  // Count all occurrences before validating values. Counting only values that
  // already match the expected shape would hide a contradictory invalid value.
  const field = (markdown, key) => {
    const matches = [...frontmatter(markdown).matchAll(new RegExp(
      `^[ \\t]*(?:${key}|"${key}"|'${key}')[ \\t]*:[ \\t]*([^\\r\\n]*)$`, 'gm'))];
    return matches.length === 1 ? matches[0][1].trim() : null;
  };
  const matchesReviewedRuntime = (markdown) => {
    const digest = field(markdown, 'runtime_digest');
    const revision = field(markdown, 'reviewed_revision');
    if (digest !== OBSERVED_DIGEST || !/^[a-f0-9]{40}$/.test(revision ?? '')) return false;
    try {
      const options = { cwd: fileURLToPath(root), stdio: ['ignore', 'pipe', 'pipe'] };
      const names = execFileSync('git', ['ls-tree', '-r', '--name-only', revision, '--', 'extension'], options)
        .toString().trim().split('\n').sort();
      if (JSON.stringify(names) !== JSON.stringify(OBSERVED_NAMES.map((name) => `extension/${name}`))) return false;
      return OBSERVED_NAMES.every((name) => createHash('sha256').update(execFileSync('git',
        ['show', `${revision}:extension/${name}`], options)).digest('hex') === OBSERVED[name]);
    } catch { return false; }
  };
  return {
    codeReviewReady: matchesReviewedRuntime(code) && field(code, 'runtime_blockers') === '0'
      && field(code, 'technical_verdict') === 'clear_for_04_20_evidence_work',
    securityReviewReady: matchesReviewedRuntime(security) && field(security, 'technical_threats_open') === '0',
    technicalTestsPassed: field(validation, 'technical_tests') === 'passed',
    historicResetAcknowledged: field(validation, 'historic_reset_acknowledgement') === 'acknowledged',
  };
}

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
  requireEvidence(record.source.inventory_count === OBSERVED_NAMES.length, 'inventory-count');
  requireEvidence(sameKeys(record.source.assets, OBSERVED_NAMES), 'asset-inventory');
  requireEvidence(OBSERVED_NAMES.every((name) => record.source.assets[name] === OBSERVED[name]), 'source-hashes');
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
      requireEvidence(validLanguageTag(check.language_context)
        && !/^en(?:-|$)/i.test(check.language_context), 'language-context');
    } else if (check.id === 'english-regional-locale') {
      requireEvidence(validLanguageTag(check.language_context)
        && /^en-/i.test(check.language_context), 'language-context');
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
      && TIMING_ASSETS.every((name) => performance.identity.hashes[name] === OBSERVED[name]), 'performance-source');
    requireEvidence(performance.identity.harnessHash === TIMING_HARNESS, 'performance-harness');
    for (const key of TIMING_KEYS) {
      const run = performance.runs?.[key];
      if (!run) { timingComplete = false; continue; }
      const [size, mode] = key.split('-');
      requireEvidence(run.size === Number(size) && run.mode === mode, 'performance-scope');
      requireEvidence(run.runtime === (mode === 'disabled' ? 'absent' : 'loaded'), 'performance-runtime');
      if (mode === 'dormant') requireEvidence(run.resources?.observers === 0
        && run.resources?.pendingTimers === 0, 'performance-dormant-resources');
      // The verdict comes from the pinned Phase 4 judge code, read from Git and run in its own context (WR-01).
      if (OBSERVED_SOURCE.judges.validateWorkloadReport(JSON.stringify(run)) === 'gaps_found') performanceFailed = true;
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
    source: { inventory_count: OBSERVED_NAMES.length, assets: { ...OBSERVED } },
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
  const result = { schema_version: 1, identity: { hashes: Object.fromEntries(TIMING_ASSETS.map((n) => [n, OBSERVED[n]])), harnessHash: TIMING_HARNESS }, runs: {} };
  for (const key of TIMING_KEYS) {
    const [size, mode] = key.split('-');
    const sample = mode === 'enabled'
      ? { segments: [{ category: 'observer', cpu: 0.2 }, { category: 'timer', cpu: 0.3 }], totalCpu: 0.5, callbacks: 2, passes: 1, writes: 1, latency: 2 }
      : { segments: [], totalCpu: 0, callbacks: 0, passes: 0, writes: 0, latency: 2 };
    result.runs[key] = {
      size: Number(size), mode, runtime: mode === 'disabled' ? 'absent' : 'loaded',
      resources: { observers: mode === 'enabled' ? 1 : 0, pendingTimers: 0 }, warmups: 10, measured: 100,
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

// v1 requirements were archived at the v1.0 milestone close; the archive is
// the canonical record for the Phase 4 IDs.
const canonicalRequirements = () => readFileSync(new URL('.planning/milestones/v1.0-REQUIREMENTS.md', root), 'utf8');
const hypotheticalRequirements = (markdown = canonicalRequirements()) => {
  for (const id of Object.keys(REQUIREMENT_CHECKS)) {
    markdown = markdown.replace(new RegExp(`^- \\[[ xX]\\] (\\*\\*${id}\\*\\*:)`, 'm'), '- [ ] $1')
      .replace(new RegExp(`^\\| ${id} \\| Phase 4 \\| [^|]+\\|`, 'm'), `| ${id} | Phase 4 | Pending |`);
  }
  return markdown;
};
test.each(['checkbox', 'Complete'])('canonical promotion rejects a false %s without live evidence', (claim) => {
  const markdown = hypotheticalRequirements();
  const forged = claim === 'checkbox'
    ? markdown.replace('- [ ] **FAIL-01**:', '- [x] **FAIL-01**:')
    : markdown.replace(/(\| FAIL-01 \| Phase 4 \| )[^|]+/, '$1Complete ');
  expect(forged).not.toBe(markdown);
  expect(() => validateCanonicalPromotion(forged, example(), {
    codeReviewReady: true, securityReviewReady: true, technicalTestsPassed: true,
    historicResetAcknowledged: true,
  }, acceptedPerformance(), CLOCK)).toThrow(/canonical-promotion/);
});

test.each(['en', 'EN', 'en-GB', 'EN-us', 'En-gb'])('rejects English tag %s in the non-English scenario', (tag) => {
  const record = example(true);
  record.checks.find((row) => row.id === 'language-icon-copy').language_context = tag;
  expect(() => validatePhase04Acceptance(record, acceptedPerformance(), CLOCK)).toThrow(/language-context/);
});
test.each(['en-GB', 'EN-us', 'En-gb', 'en-Latn-US', 'en-US-u-ca-gregory'])('accepts genuine regional English tag %s only in its own scenario', (tag) => {
  const record = example(true);
  record.checks.find((row) => row.id === 'english-regional-locale').language_context = tag;
  expect(validatePhase04Acceptance(record, acceptedPerformance(), CLOCK)).toBe('passed');
});
test.each([null, ['en'], ['en', 'non-English', 'en-*'], ['en', 'en-*', 'non-English', 'fr']])('rejects an inexact ordered scope descriptor list %j', (variants) => {
  const record = example(); record.scope.html_lang_variants = variants;
  expect(() => validatePhase04Acceptance(record, acceptedPerformance(), CLOCK)).toThrow(/scope/);
});

const ready = { codeReviewReady: true, securityReviewReady: true, technicalTestsPassed: true, historicResetAcknowledged: true };
const promote = (markdown, id) => markdown.replace(`- [ ] **${id}**:`, `- [x] **${id}**:`)
  .replace(new RegExp(`(\\| ${id} \\| Phase 4 \\| )[^|]+`), '$1Complete ');
// Independent behavioral oracle: do not derive these expected observations
// from the implementation mapping, or an omitted entry would erase its test.
test.each([
  ['FAIL-01', ['working-icon', 'blank-copy', 'missing-icon-hint', 'language-icon-copy', 'structure-copy', 'navigation-status', 'english-regional-locale']],
  ['FAIL-02', ['missing-icon-hint', 'missing-settle-transition']],
  ['FAIL-03', ['language-icon-copy', 'structure-copy', 'english-regional-locale']],
  ['FAIL-05', ['working-icon', 'missing-icon-hint', 'language-icon-copy', 'structure-copy', 'navigation-status', 'worker-restart']],
  ['CTRL-02', ['off-clears', 'on-restores', 'popup-keyboard']],
  ['CTRL-03', ['restart-off', 'restart-on', 'cross-tab-preference', 'frozen-resume', 'worker-restart']],
  ['CTRL-04', ['off-clears', 'on-restores', 'nonreceiver-status']],
])('canonical promotion requires every mapped observation for %s', (id, checks) => {
  const markdown = promote(hypotheticalRequirements(), id);
  expect(validateCanonicalPromotion(markdown, example(true), ready, acceptedPerformance(), CLOCK)).toBe(true);
  for (const checkId of checks) {
    const record = example(true); record.status = 'human_needed';
    record.checks[record.checks.findIndex((row) => row.id === checkId)] = example().checks.find((row) => row.id === checkId);
    expect(() => validateCanonicalPromotion(markdown, record, ready, acceptedPerformance(), CLOCK), checkId).toThrow(/canonical-promotion/);
  }
});
test.each(Object.keys(ready))('canonical promotion requires explicit %s readiness', (key) => {
  const markdown = promote(hypotheticalRequirements(), 'CTRL-02');
  expect(() => validateCanonicalPromotion(markdown, example(true), { ...ready, [key]: false }, acceptedPerformance(), CLOCK)).toThrow(/canonical-promotion/);
});
test('canonical Pending and Gaps Found remain legal without review or observations and ignore historical summaries', () => {
  const markdown = `${hypotheticalRequirements()}\nOld SUMMARY: requirements-completed: [FAIL-01, CTRL-02]\n`;
  expect(validateCanonicalPromotion(markdown, example(), {}, acceptedPerformance(), CLOCK)).toBe(true);
  expect(validateCanonicalPromotion(markdown.replace('| FAIL-01 | Phase 4 | Pending |',
    '| FAIL-01 | Phase 4 | Gaps Found |'), example(), {}, acceptedPerformance(), CLOCK)).toBe(true);
});
test('actual canonical requirements cannot be promoted by bookkeeping without current evidence', () => {
  const record = parsePhase04Acceptance(readFileSync(new URL('04-LIVE-ACCEPTANCE.md', phase), 'utf8'));
  const code = readFileSync(new URL('04-REVIEW.md', phase), 'utf8');
  const security = readFileSync(new URL('04-SECURITY.md', phase), 'utf8');
  const validation = readFileSync(new URL('04-VALIDATION.md', phase), 'utf8');
  const reviewReadiness = technicalReviewReadiness(code, security, validation);
  expect(validateCanonicalPromotion(canonicalRequirements(), record, reviewReadiness, loadPerformance())).toBe(true);
});

test.each(['FAIL-01', 'FAIL-05'])('review gap: %s cannot be Complete while unreadable states are unobserved', (id) => {
  const record = example(true); record.status = 'human_needed';
  for (const checkId of ['language-icon-copy', 'structure-copy']) {
    record.checks[record.checks.findIndex((row) => row.id === checkId)] = example().checks.find((row) => row.id === checkId);
  }
  expect(() => validateCanonicalPromotion(promote(hypotheticalRequirements(), id), record, ready, acceptedPerformance(), CLOCK)).toThrow(/canonical-promotion/);
});
test.each(['runtime_digest', 'reviewed_revision'])('review gap: stale %s cannot satisfy technical readiness', (field) => {
  const stale = (name) => readFileSync(new URL(name, phase), 'utf8')
    .replace(new RegExp(`^${field}: .+$`, 'm'), `${field}: ${'0'.repeat(field === 'runtime_digest' ? 64 : 40)}`);
  const result = technicalReviewReadiness(stale('04-REVIEW.md'), stale('04-SECURITY.md'), '');
  expect(result.codeReviewReady).toBe(false);
  expect(result.securityReviewReady).toBe(false);
});
test('technical readiness accepts both independently reviewed current inventories', () => {
  const result = technicalReviewReadiness(readFileSync(new URL('04-REVIEW.md', phase), 'utf8'),
    readFileSync(new URL('04-SECURITY.md', phase), 'utf8'), '---\nhistoric_reset_acknowledgement: outstanding\n---\n');
  expect(result.codeReviewReady).toBe(true);
  expect(result.securityReviewReady).toBe(true);
  expect(result.historicResetAcknowledged).toBe(false);
  expect(technicalReviewReadiness('', '', '---\nhistoric_reset_acknowledgement: acknowledged\n---\n')
    .historicResetAcknowledged).toBe(true);
});
test.each([
  ['code', 'runtime_blockers', '1'], ['code', 'technical_verdict', 'blocked'],
  ['code', 'runtime_digest', 'invalid'], ['code', 'reviewed_revision', 'invalid'],
  ['security', 'technical_threats_open', '1'], ['security', 'runtime_digest', 'invalid'],
  ['security', 'reviewed_revision', 'invalid'],
])('review metadata gap: duplicate %s %s cannot certify readiness', (which, key, value) => {
  const code = readFileSync(new URL('04-REVIEW.md', phase), 'utf8');
  const security = readFileSync(new URL('04-SECURITY.md', phase), 'utf8');
  const duplicate = (text) => text.replace('\n---\n', `\n${key}: ${value}\n---\n`);
  const result = technicalReviewReadiness(which === 'code' ? duplicate(code) : code,
    which === 'security' ? duplicate(security) : security, '');
  expect(result[which === 'code' ? 'codeReviewReady' : 'securityReviewReady']).toBe(false);
});
test.each(['technical_tests', 'historic_reset_acknowledgement'])('review metadata gap: duplicate %s cannot grant readiness', (key) => {
  const value = key === 'technical_tests' ? 'passed' : 'acknowledged';
  const result = technicalReviewReadiness('', '', `---\n${key}: ${value}\n"${key}": invalid\n---\n`);
  expect(result[key === 'technical_tests' ? 'technicalTestsPassed' : 'historicResetAcknowledged']).toBe(false);
});
test.each(['en-12', 'en-GB-GB'])('review gap: malformed %s is not genuine regional English evidence', (tag) => {
  const record = example(true);
  record.checks.find((row) => row.id === 'english-regional-locale').language_context = tag;
  expect(() => validatePhase04Acceptance(record, acceptedPerformance(), CLOCK)).toThrow(/language-context/);
});
test('review gap: hypothetical baseline remains pending after legitimate canonical promotion', () => {
  const promoted = promote(hypotheticalRequirements(), 'FAIL-01');
  const normalized = hypotheticalRequirements(promoted);
  expect(normalized).toContain('- [ ] **FAIL-01**:');
  expect(normalized).toContain('| FAIL-01 | Phase 4 | Pending |');
});

test.each(['harness', 'dormant-missing', 'dormant-absent', 'dormant-resources'])('rejects stale or false %s timing evidence', (kind) => {
  const performance = acceptedPerformance();
  if (kind === 'harness') performance.identity.harnessHash = '0'.repeat(64);
  if (kind === 'dormant-missing') delete performance.runs['30-dormant'];
  if (kind === 'dormant-absent') performance.runs['30-dormant'].runtime = 'absent';
  if (kind === 'dormant-resources') performance.runs['30-dormant'].resources.observers = 1;
  expect(() => validatePhase04Acceptance(example(true), performance, CLOCK)).toThrow();
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
    r.source = { inventory_count: 3, assets: { 'manifest.json': OBSERVED['manifest.json'], 'content.js': OBSERVED['content.js'], 'zhroma.css': OBSERVED['zhroma.css'] } };
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
  expect(Object.keys(record.source.assets).sort()).toEqual(OBSERVED_NAMES);
  expect(record.source.assets).toEqual(OBSERVED);
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

// ---------------------------------------------------------------------------
// Historical evidence continuity (05-03).
//
// Phase 5 deliberately changes shipped bytes — a store title, a short
// description and a 128px brand icon. Phase 4's observations were made on the
// bytes that existed when a human sat in front of Chrome, and they must keep
// validating against exactly those bytes. The baseline below is the pinned
// identity of that evidence; the adapter is the only way this file reaches it,
// and it never falls back to the working tree.
// ---------------------------------------------------------------------------
const BASELINE = JSON.parse(readFileSync(new URL(BASELINE_PATH, root), 'utf8'));

const currentTree = () => {
  const names = walk(extensionDir).sort();
  return Object.fromEntries(names.map((name) => [name,
    createHash('sha256').update(readFileSync(`${extensionDir}/${name}`)).digest('hex')]));
};

test('the adapter serves the committed Phase 4 bytes, and the baseline is their pinned identity', () => {
  const historical = readPhase04Source();
  expect(historical.observation_revision).toBe(BASELINE.observation_revision);
  expect(historical.runtime_revision).toBe(BASELINE.runtime_revision);
  expect(historical.names).toEqual(Object.keys(BASELINE.assets).sort());
  expect(historical.names).toHaveLength(11);
  expect(historical.assets).toEqual(BASELINE.assets);
  expect(historical.digest).toBe(BASELINE.digest);
  // The digest the two independent Phase 4 technical reviews recorded.
  expect(historical.digest).toBe('46090012ab1a8ebd265273c327b214afbed0321a2fa149ab801ce8c205891065');
  expect(historical.timingHarnessHash).toBe(BASELINE.timing_harness_sha256);
  expect(historical.manifest.version).toBe('0.1.0');
  expect(historical.contentSource).toMatch(/const PREFERENCE_KEY = 'enabled';/);
  // The validator that produced the original verdict is identified, not trusted
  // to still be on disk unchanged.
  expect(readBaseline().validator_sha256).toBe(BASELINE.validator_sha256);
});

test.each([
  ['a rewritten asset hash', (b) => { b.assets['content.js'] = '0'.repeat(64); }],
  ['a dropped asset', (b) => { delete b.assets['icons/off.png']; b.inventory_count = 10; }],
  ['an invented asset', (b) => { b.assets['icons/brand.png'] = '0'.repeat(64); b.inventory_count = 12; }],
  ['a restated inventory count', (b) => { b.inventory_count = 12; }],
  ['a rewritten aggregate digest', (b) => { b.digest = '0'.repeat(64); }],
  ['an unknown runtime revision', (b) => { b.runtime_revision = '0'.repeat(40); }],
  ['an unknown observation revision', (b) => { b.observation_revision = '0'.repeat(40); }],
  ['a rewritten observation hash', (b) => { b.evidence_hashes[b.observation_path] = '0'.repeat(64); }],
  ['a rewritten predecessor evidence hash', (b) => {
    b.evidence_hashes['.planning/phases/03-the-tint-survives-everything/03-LIVE-ACCEPTANCE.md'] = '0'.repeat(64);
  }],
  ['a rewritten timing harness hash', (b) => { b.timing_harness_sha256 = '0'.repeat(64); }],
  ['a missing field', (b) => { delete b.digest; }],
])('baseline tampering — %s — is refused rather than absorbed', (_name, change) => {
  const baseline = JSON.parse(JSON.stringify(BASELINE));
  change(baseline);
  expect(() => readPhase04Source({ baseline })).toThrow(/PHASE04_SOURCE_REJECTED/);
});

test('a missing historical revision fails loudly instead of falling back to the working tree', () => {
  const adapter = readFileSync(new URL('scripts/phase-04-source.js', root), 'utf8');
  // No silent degradation to whatever `extension/` happens to hold today.
  expect(adapter).not.toMatch(/catch\s*\{\s*return readFileSync/);
  expect(adapter).not.toMatch(/\|\|\s*readFileSync/);
  // Exactly one disk read exists in the adapter, and it is guarded: the shipped
  // runtime tree is refused outright rather than merely avoided by convention.
  expect([...adapter.matchAll(/readFileSync\(/g)]).toHaveLength(1);
  expect(() => readWorkingCopy('extension/manifest.json')).toThrow(/phase-04-runtime-source-read/);
  expect(() => readWorkingCopy('extension/icons/brand.png')).toThrow(/phase-04-runtime-source-read/);
  expect(readWorkingCopy(BASELINE_PATH)).toBeInstanceOf(Buffer);
  const baseline = { ...JSON.parse(JSON.stringify(BASELINE)), runtime_revision: '0'.repeat(40) };
  expect(() => readPhase04Source({ baseline })).toThrow(/PHASE04_SOURCE_REJECTED phase-04-missing-revision/);
});

test('the recorded Phase 4 verdict keeps its fourteen passes and its three named pending checks', () => {
  const record = parsePhase04Acceptance(readFileSync(new URL('04-LIVE-ACCEPTANCE.md', phase), 'utf8'));
  expect(record.status).toBe('human_needed');
  expect(record.checks.filter((row) => row.status === 'pass')).toHaveLength(14);
  expect(record.checks.filter((row) => row.status === 'fail')).toHaveLength(0);
  expect(record.checks.filter((row) => row.status === 'pending').map((row) => row.id).sort())
    .toEqual(['english-regional-locale', 'language-icon-copy', 'structure-copy']);
  expect(BASELINE.observed).toEqual({
    status: 'human_needed', checks_passed: 14, checks_pending: 3, checks_failed: 0,
    pending_ids: ['language-icon-copy', 'structure-copy', 'english-regional-locale'],
  });
});

test('a later change to the current runtime cannot receive Phase 4 approval', () => {
  const historical = readPhase04Source();
  const current = currentTree();
  const record = parsePhase04Acceptance(readFileSync(new URL('04-LIVE-ACCEPTANCE.md', phase), 'utf8'));
  // Whatever extension/ holds now, the record is bound to the observed bytes.
  expect(record.source.assets).toEqual(historical.assets);
  expect(validatePhase04Acceptance(record)).toBe('human_needed');
  // A record that swapped in the current tree is refused by the same validator,
  // whether the change is a new file or an edited one.
  const forged = structuredClone(record);
  forged.source = { inventory_count: Object.keys(current).length + 1, assets: { ...current, 'icons/brand.png': '0'.repeat(64) } };
  expect(() => validatePhase04Acceptance(forged)).toThrow(/PHASE04_ACCEPTANCE_REJECTED/);
  const edited = structuredClone(record);
  edited.source.assets['manifest.json'] = createHash('sha256').update('a future manifest').digest('hex');
  expect(() => validatePhase04Acceptance(edited)).toThrow(/PHASE04_ACCEPTANCE_REJECTED source-hashes/);
});
