// @vitest-environment node
//
// Differential 0.1.0 parity harness (07-01, COMPAT-01, D-07, D-24).
//
// The 0.1.0 side is never read from the working tree. It comes only from the
// pinned Git blobs `scripts/baseline-source.js` serves, and that module refuses
// to serve them unless they match `release/candidate.json` byte for byte. The
// working side is whatever `extension/` holds today. Each side builds its page
// from ITS OWN manifest, so a later phase that adds a content script is run
// exactly as Chrome would run it.
//
// Three observables are compared at every step: the row markers, the
// `get-status` diagnosis and reason, and the computed background of every
// cell. This file must stay green in every later phase.
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { createContext, Script } from 'node:vm';
import { Window } from 'happy-dom';
import { beforeAll, expect, test, vi } from 'vitest';
import { validateFixtureManifest } from '../../scripts/fixture-contract.js';
import { BASELINE_REVISION, BaselineSourceError, readBaselineSource } from '../../scripts/baseline-source.js';
import { createChromeHarness } from './chrome-harness.js';

const fixture = (name) => readFileSync(new URL(`../fixtures/zendesk-view-${name}.html`, import.meta.url), 'utf8');
const candidate = () => JSON.parse(readFileSync(new URL('../../release/candidate.json', import.meta.url), 'utf8'));
const rows = (document) => [...document.querySelectorAll('tbody > tr[data-test-id="generic-table-row"]')];

const baseline = readBaselineSource();

/** A side is a named source provider: `read(path)` returns the text of a packaged file. */
const baselineSide = Object.freeze({
  name: `0.1.0 (${BASELINE_REVISION.slice(0, 7)})`,
  read: (path) => {
    if (!Object.hasOwn(baseline.files, path)) throw new Error(`No baseline blob for ${path}`);
    return baseline.files[path].toString('utf8');
  },
});
const workingRead = (path) => readFileSync(new URL(`../../extension/${path}`, import.meta.url), 'utf8');
const workingSide = Object.freeze({ name: 'working tree', read: workingRead });

beforeAll(async () => {
  expect((await validateFixtureManifest(fileURLToPath(new URL('../fixtures/manifest.json', import.meta.url)), {
    requireCompleteScenarioMatrix: true,
  })).fixtureCount).toBe(3);
});

// Copied from persistent-tint.test.js (never imported): an inert Window, the
// manifest-driven CSS and JS injection, a manual observer and `settled()`.
function loadPage(side, scenario, state) {
  const window = new Window({ settings: {
    enableJavaScriptEvaluation: false,
    disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true,
    enableImageFileLoading: false,
    navigation: { disableMainFrameNavigation: true, disableChildFrameNavigation: true, disableChildPageNavigation: true },
  } });
  const { document } = window;
  Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
  document.documentElement.lang = scenario.lang ?? 'en';
  document.body.innerHTML = fixture(scenario.fixture);
  scenario.mutate?.(document, window);
  const manifest = JSON.parse(side.read('manifest.json'));
  for (const path of manifest.content_scripts[0].css) {
    const style = document.createElement('style');
    style.textContent = side.read(path);
    document.head.append(style);
  }
  const observers = [];
  class StartupObserver {
    constructor(callback) { this.callback = callback; this.active = false; observers.push(this); }
    observe(target, options) { this.active = true; this.options = options; }
    disconnect() { this.active = false; }
  }
  const harness = createChromeHarness(state.preference);
  const context = createContext({ document, window, chrome: harness.chrome, MutationObserver: StartupObserver, setTimeout, clearTimeout });
  for (const path of manifest.content_scripts[0].js) new Script(side.read(path), { filename: path }).runInContext(context);
  return {
    document, window, harness, fixture, scratch: {},
    deliver(target = document.body, extra = {}) {
      for (const observer of observers) if (observer.active) observer.callback([{ type: 'childList', target, addedNodes: [], removedNodes: [], ...extra }]);
    },
    settled() { harness.flush(); vi.advanceTimersByTime(100); },
  };
}

function snapshot(page) {
  const { document, window, harness } = page;
  const status = harness.requestStatus();
  return {
    markers: [...document.querySelectorAll('tr')].map((row) => row.getAttribute('data-zhroma-priority')),
    status: status === undefined ? null : { diagnosis: status.diagnosis, reason: status.reason },
    backgrounds: [...document.querySelectorAll('td, th')].map((cell) => window.getComputedStyle(cell).backgroundColor),
  };
}

/** One snapshot after load plus `settled()`, then one after each scenario step. */
async function trace(side, scenario, state) {
  vi.useFakeTimers();
  let page;
  try {
    page = loadPage(side, scenario, state);
    page.settled();
    const steps = [snapshot(page)];
    for (const step of scenario.steps) {
      step(page);
      steps.push(snapshot(page));
    }
    page.harness.assertClean();
    return steps;
  } finally {
    if (page) {
      page.window.dispatchEvent(new page.window.Event('pagehide'));
      await page.window.happyDOM.close();
    }
    vi.useRealTimers();
  }
}

// An untinted cell's computed background, measured rather than assumed, so the
// non-vacuity checks cannot be satisfied by a harness that computes nothing.
const tinted = (value) => typeof value === 'string' && value !== '' && value !== 'transparent'
  && value !== 'rgba(0, 0, 0, 0)';

// --- the matrix (D-24) -------------------------------------------------------
//
// Both lists are plain arrays so a later plan can append a state or a scenario
// without editing the loop. Case names are `<scenario> under <state>` and must
// stay stable: later mutants may target them.

const STATES = [
  { name: 'fresh install', preference: {} },
  { name: 'upgraded, off', preference: { stored: false } },
  { name: 'upgraded, on', preference: { stored: true } },
  // Stored-theme states (07-06, D-09, COMPAT-04). The 0.1.0 side never issues
  // the settings read, so each compares 0.1.0 with the working tree under that
  // stored-theme condition.
  { name: 'theme stored Classic', preference: { stored: true, settingsStored: { theme: { v: 1, id: 'zhroma-classic' } } } },
  { name: 'theme unreadable (newer version)', preference: { settingsStored: { theme: { v: 99, id: 'from-a-newer-version' } } } },
  { name: 'settings read fails', preference: { settingsReadMode: 'rejected' } },
];

const PRIORITY = 6;
const setPriority = (row, value) => { row.children[PRIORITY].textContent = value; };
// Long enough for a missing-column claim to settle after the reconcile pass.
const quiet = (p) => { vi.advanceTimersByTime(200); p.harness.flush(); };

// A Next/Previous/refresh replacement arrives through incomplete markup first
// and is completed afterwards (copied from persistent-tint.test.js L197-211).
const replacement = (selector) => [
  (p) => {
    const target = p.document.querySelector(selector);
    const copy = target.cloneNode(true);
    for (const row of copy.querySelectorAll('[data-zhroma-priority]')) row.removeAttribute('data-zhroma-priority');
    const last = copy.querySelector('tbody tr:last-child, tr:last-child');
    const cell = last.lastElementChild; cell.remove();
    p.scratch.last = last; p.scratch.cell = cell;
    target.replaceWith(copy);
    p.deliver(copy.parentNode, { removedNodes: [target], addedNodes: [copy] }); p.settled();
  },
  (p) => {
    p.scratch.last.append(p.scratch.cell);
    p.deliver(p.scratch.last, { addedNodes: [p.scratch.cell] }); p.settled();
  },
];

const SCENARIOS = [
  ...['priority-present', 'priority-absent', 'grouped-long'].map((name) => ({
    name: `startup on ${name}`, fixture: name, steps: [quiet],
  })),
  { name: 'Next', fixture: 'priority-present', steps: replacement('tbody') },
  { name: 'Previous', fixture: 'priority-present', steps: replacement('tbody') },
  { name: 'refresh body', fixture: 'priority-present', steps: replacement('tbody') },
  { name: 'refresh table', fixture: 'priority-present', steps: replacement('table') },
  {
    // persistent-tint.test.js L213-231
    name: 'group insert and reorder', fixture: 'grouped-long',
    mutate(d) { rows(d).forEach((row) => setPriority(row, 'Low')); },
    steps: [
      (p) => {
        const body = p.document.querySelector('tbody');
        const group = body.querySelector('[data-garden-id="tables.group_row"]');
        const tickets = rows(p.document); p.scratch.tickets = tickets;
        body.prepend(group.cloneNode(true)); body.append(group); body.prepend(tickets.at(-1));
        p.deliver(body); p.settled();
      },
      (p) => {
        const [first] = p.scratch.tickets;
        first.setAttribute('data-garden-id', 'tables.group_row');
        first.setAttribute('data-test-id', 'generic-table-rows-group-by');
        p.deliver(p.document.querySelector('tbody')); p.settled();
      },
    ],
  },
  {
    // persistent-tint.test.js L232-242
    name: 'empty, group-only and single ticket', fixture: 'grouped-long',
    mutate(d) { rows(d).forEach((row) => setPriority(row, 'High')); },
    steps: [
      (p) => {
        const tickets = rows(p.document); p.scratch.tickets = tickets;
        const body = p.document.querySelector('tbody');
        tickets.forEach((row) => row.remove()); p.deliver(body, { removedNodes: tickets }); p.settled();
      },
      (p) => { const body = p.document.querySelector('tbody'); body.replaceChildren(); p.deliver(body); p.settled(); },
      (p) => {
        const body = p.document.querySelector('tbody');
        body.append(p.scratch.tickets[0]); p.deliver(body, { addedNodes: [p.scratch.tickets[0]] }); p.settled();
      },
    ],
  },
  {
    // persistent-tint.test.js L243-258: the COMPAT-04 ordering edge, rows that
    // share a priority in a sorted view.
    name: 'sort with equal priorities', fixture: 'priority-present',
    mutate(d) { setPriority(rows(d)[1], 'Urgent'); },
    steps: [
      (p) => {
        const tickets = rows(p.document); const body = p.document.querySelector('tbody');
        body.prepend(tickets[1]); p.deliver(body);
        body.prepend(tickets[3]);
        for (const row of [p.document.querySelector('thead tr'), ...rows(p.document)]) row.prepend(row.children[PRIORITY]);
        p.deliver(body); p.settled();
      },
      (p) => { p.deliver(p.document.querySelector('tbody')); p.settled(); },
    ],
  },
  {
    // persistent-tint.test.js L259-277
    name: 'rapid present/absent/present', fixture: 'priority-present',
    steps: [
      (p) => {
        for (let i = 0; i < 3; i++) {
          const old = p.document.querySelector('table'); p.document.body.replaceChildren();
          p.deliver(p.document.body, { removedNodes: [old] });
          p.document.body.innerHTML = p.fixture('priority-present');
          p.deliver(p.document.body, { addedNodes: [p.document.querySelector('table')] });
        }
        setPriority(rows(p.document)[0], 'Normal');
        p.settled();
      },
      (p) => { for (let i = 0; i < 5; i++) { p.deliver(p.document.querySelector('tbody')); p.settled(); } },
    ],
  },
  {
    // persistent-tint.test.js L278-292
    name: 'row recycling on scroll', fixture: 'priority-present',
    steps: [
      (p) => {
        const ticket = rows(p.document)[0]; p.scratch.ticket = ticket;
        ticket.style.transform = 'translateY(-1000px)'; p.deliver(ticket); p.settled();
      },
      (p) => {
        const inserted = p.scratch.ticket.cloneNode(true); p.scratch.inserted = inserted;
        inserted.removeAttribute('data-zhroma-priority'); setPriority(inserted, 'Low');
        p.document.querySelector('tbody').append(inserted);
        p.deliver(inserted.parentNode, { addedNodes: [inserted] }); p.settled();
      },
      (p) => { setPriority(p.scratch.inserted, 'High'); p.deliver(p.scratch.inserted); p.settled(); },
      (p) => {
        const { inserted } = p.scratch; const from = inserted.parentNode;
        p.document.body.append(inserted); inserted.removeAttribute('data-test-id');
        p.deliver(from, { removedNodes: [inserted] }); p.settled();
      },
    ],
  },
  {
    name: 'view switch', fixture: 'priority-present',
    steps: ['priority-absent', 'priority-present'].map((next) => (p) => {
      const old = p.document.querySelector('table');
      p.document.body.innerHTML = p.fixture(next);
      p.deliver(p.document.body, { removedNodes: [old], addedNodes: [p.document.querySelector('table')] });
      p.settled(); quiet(p);
    }),
  },
  {
    name: 'unknown priority value', fixture: 'priority-present',
    steps: [
      (p) => { const row = rows(p.document)[0]; setPriority(row, 'Unknown'); p.deliver(row); p.settled(); },
      (p) => { const row = rows(p.document)[0]; setPriority(row, 'Urgent'); p.deliver(row); p.settled(); },
    ],
  },
  {
    name: 'non-English shell', fixture: 'priority-present', lang: 'fr',
    steps: [
      quiet,
      (p) => {
        p.document.documentElement.lang = 'en';
        p.deliver(p.document.documentElement, { type: 'attributes', attributeName: 'lang' }); p.settled();
      },
    ],
  },
  {
    // CR-01: a supported English regional shell tints and survives a re-render.
    name: 'English regional shell', fixture: 'priority-present', lang: 'en-GB',
    steps: [(p) => { p.deliver(p.document.querySelector('tbody')); p.settled(); }],
  },
  {
    // persistent-tint.test.js L510-523 and toolbar-popup.test.js L762-799
    name: 'visibility and bfcache', fixture: 'priority-present',
    steps: [
      (p) => { p.document.hidden = true; p.document.dispatchEvent(new p.window.Event('visibilitychange')); p.settled(); },
      (p) => { p.document.hidden = false; p.document.dispatchEvent(new p.window.Event('visibilitychange')); p.settled(); },
      (p) => { p.window.dispatchEvent(new p.window.Event('pagehide')); p.settled(); },
      (p) => {
        const restored = new p.window.Event('pageshow');
        Object.defineProperty(restored, 'persisted', { value: true });
        p.window.dispatchEvent(restored); p.settled();
      },
    ],
  },
  {
    // The Phase 4 switch, driven through a storage change.
    name: 'off and on', fixture: 'priority-present',
    steps: [
      (p) => { p.harness.setStored(false); p.harness.emitChange({ enabled: { oldValue: true, newValue: false } }); p.settled(); },
      (p) => { p.harness.setStored(true); p.harness.emitChange({ enabled: { oldValue: false, newValue: true } }); p.settled(); },
    ],
  },
];

const STARTUP_PRESENT = { name: 'startup', fixture: 'priority-present', steps: [] };
const FRESH_INSTALL = STATES[0];

test('the pinned 0.1.0 blobs are exactly the twelve assets the candidate record names', () => {
  const record = candidate();
  expect(baseline.revision).toBe(BASELINE_REVISION);
  expect(record.source_git_revision).toBe(BASELINE_REVISION);
  expect(baseline.names).toEqual(record.source.assets.map((asset) => asset.name).sort());
  expect(baseline.names).toHaveLength(12);
  expect(baseline.digest).toBe(record.source.digest);
  expect(baseline.manifest.content_scripts[0].js).toEqual(['content.js']);
});

test.each([
  ['baseline-revision-mismatch', 'a different revision', (record) => {
    record.source_git_revision = '0000000000000000000000000000000000000000';
  }],
  ['baseline-asset-mismatch', 'a wrong asset hash', (record) => {
    const asset = record.source.assets.find((entry) => entry.name === 'zhroma.css');
    asset.sha256 = asset.sha256.replace(/^./u, (c) => (c === '0' ? '1' : '0'));
  }],
  ['baseline-inventory-mismatch', 'an extra asset name', (record) => {
    record.source.assets.push({ name: 'extra.js', size: 1, sha256: 'a'.repeat(64) });
  }],
  ['baseline-digest-mismatch', 'a wrong aggregate digest', (record) => {
    record.source.digest = 'b'.repeat(64);
  }],
  ['baseline-candidate-invalid', 'a non-object record', () => 'not a record'],
])('the baseline reader refuses %s (%s)', (code, _label, tamper) => {
  const record = candidate();
  const replaced = tamper(record);
  const tampered = replaced === undefined ? record : replaced;
  let error;
  try { readBaselineSource({ candidate: tampered }); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(BaselineSourceError);
  expect(error.code).toBe(`BASELINE_SOURCE_REJECTED ${code}`);
  // The untampered record is still accepted: the control rejects the tamper, not everything.
  expect(readBaselineSource({ candidate: candidate() }).digest).toBe(baseline.digest);
});

test('startup parity: the present fixture paints identically from the 0.1.0 blobs and the working tree', async () => {
  const expected = await trace(baselineSide, STARTUP_PRESENT, FRESH_INSTALL);
  const actual = await trace(workingSide, STARTUP_PRESENT, FRESH_INSTALL);
  expect(actual).toEqual(expected);
  expect(expected.flatMap((step) => step.markers).some((value) => value !== null)).toBe(true);
  expect(expected.flatMap((step) => step.backgrounds).some(tinted)).toBe(true);
  expect(expected[0].status).toEqual({ diagnosis: 'working', reason: null });
});

test('the matrix is the D-24 set: eighteen scenarios under three upgrade states and three stored-theme states', () => {
  expect(STATES.map((state) => state.name)).toEqual(['fresh install', 'upgraded, off', 'upgraded, on',
    'theme stored Classic', 'theme unreadable (newer version)', 'settings read fails']);
  expect(SCENARIOS).toHaveLength(18);
  expect(new Set(SCENARIOS.map((scenario) => scenario.name)).size).toBe(SCENARIOS.length);
});

const MATRIX = SCENARIOS.flatMap((scenario) => STATES.map((state) => [scenario.name, state.name, scenario, state]));

test.each(MATRIX)('%s under %s', async (_scenarioName, _stateName, scenario, state) => {
  const expected = await trace(baselineSide, scenario, state);
  const actual = await trace(workingSide, scenario, state);
  expect(actual).toEqual(expected);
});

test('the baseline traces are not vacuous: they tint, paint and reach every product diagnosis', async () => {
  const steps = [];
  for (const state of STATES.filter((entry) => entry.name !== 'upgraded, off')) {
    for (const scenario of SCENARIOS) steps.push(...await trace(baselineSide, scenario, state));
  }
  expect(steps.flatMap((step) => step.markers).some((value) => value !== null)).toBe(true);
  expect(steps.flatMap((step) => step.backgrounds).some(tinted)).toBe(true);
  const diagnoses = new Set(steps.map((step) => step.status?.diagnosis));
  for (const diagnosis of ['working', 'missing', 'cannot-read']) expect(diagnoses).toContain(diagnosis);
});

// --- negative controls: the harness must see a real difference ---------------

const modified = (name, path, edit) => {
  const original = workingRead(path);
  const changed = edit(original);
  // Guard the control itself: an edit that matches nothing proves nothing.
  expect(changed).not.toBe(original);
  return { name, read: (file) => (file === path ? changed : workingRead(file)) };
};

test('negative control: a one-character palette change is reported as a difference', async () => {
  const side = modified('palette 0.13', 'zhroma.css', (css) => css.replace('0.14', '0.13'));
  const expected = await trace(baselineSide, STARTUP_PRESENT, FRESH_INSTALL);
  const actual = await trace(side, STARTUP_PRESENT, FRESH_INSTALL);
  expect(actual).not.toEqual(expected);
  expect(actual.map((step) => step.markers)).toEqual(expected.map((step) => step.markers));
  expect(actual.map((step) => step.backgrounds)).not.toEqual(expected.map((step) => step.backgrounds));
});

test('negative control: a detector that no longer recognises Low is reported as a difference', async () => {
  const side = modified('no Low', 'content.js',
    (source) => source.replace("new Set(['Urgent', 'High', 'Normal', 'Low'])", "new Set(['Urgent', 'High', 'Normal'])"));
  const expected = await trace(baselineSide, STARTUP_PRESENT, FRESH_INSTALL);
  const actual = await trace(side, STARTUP_PRESENT, FRESH_INSTALL);
  expect(actual).not.toEqual(expected);
  expect(actual.map((step) => step.markers)).not.toEqual(expected.map((step) => step.markers));
});
