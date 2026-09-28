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
    document, window, harness, fixture,
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

const STARTUP_PRESENT = { name: 'startup', fixture: 'priority-present', steps: [] };
const FRESH_INSTALL = { name: 'fresh install', preference: {} };

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
