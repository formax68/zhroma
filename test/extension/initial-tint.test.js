// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { createContext, Script } from 'node:vm';
import { Window } from 'happy-dom';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { validateFixtureManifest } from '../../scripts/fixture-contract.js';

const windows = [];
const asset = (name) => readFileSync(new URL(`../../extension/${name}`, import.meta.url), 'utf8');
const fixture = (name = 'priority-present') => readFileSync(new URL(`../fixtures/zendesk-view-${name}.html`, import.meta.url), 'utf8');
const rows = (document) => [...document.querySelectorAll('tbody > tr[data-test-id="generic-table-row"]')];
const markers = (document) => rows(document).map((row) => row.getAttribute('data-zhroma-priority'));

beforeAll(async () => {
  expect((await validateFixtureManifest(fileURLToPath(new URL('../fixtures/manifest.json', import.meta.url)), {
    requireCompleteScenarioMatrix: true,
  })).fixtureCount).toBe(3);
});

afterEach(async () => {
  for (const window of windows.splice(0)) {
    window.dispatchEvent(new window.Event('pagehide'));
    await window.happyDOM.close();
  }
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function loadRuntimeFixture({ name, mutate, empty = false, realObserver = false } = {}) {
  vi.useFakeTimers();
  const window = new Window({ settings: {
    enableJavaScriptEvaluation: false,
    disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true,
    enableImageFileLoading: false,
    navigation: { disableMainFrameNavigation: true, disableChildFrameNavigation: true, disableChildPageNavigation: true },
  } });
  windows.push(window);
  const { document } = window;
  document.documentElement.lang = 'en';
  document.body.innerHTML = empty ? '' : fixture(name);
  mutate?.(document, window);
  const manifest = JSON.parse(asset('manifest.json'));
  for (const path of manifest.content_scripts[0].css) {
    const style = document.createElement('style');
    style.textContent = asset(path);
    document.head.append(style);
  }
  const observers = [];
  class StartupObserver {
    constructor(callback) {
      this.callback = callback;
      this.active = false;
      this.native = realObserver ? new window.MutationObserver(callback) : null;
      observers.push(this);
    }
    observe(target, options) { this.active = true; this.options = options; this.native?.observe(target, options); }
    disconnect() { this.active = false; this.native?.disconnect(); }
  }
  const context = createContext({ document, window, MutationObserver: StartupObserver, setTimeout, clearTimeout });
  for (const path of manifest.content_scripts[0].js) new Script(asset(path), { filename: path }).runInContext(context);
  return { document, window, observers, context,
    deliver(target = document.body, extra = {}) {
      for (const observer of observers) if (observer.active) observer.callback([{ type: 'childList', target, addedNodes: [], removedNodes: [], ...extra }]);
    },
    settled() { vi.advanceTimersByTime(100); },
    disposed() { expect(observers.every((observer) => !observer.active)).toBe(true); expect(vi.getTimerCount()).toBe(0); },
  };
}

test('actual classic script and declared CSS tint the four admitted canonical rows', () => {
  const runtime = loadRuntimeFixture();
  expect(markers(runtime.document)).toEqual([null, null, null, null]);
  runtime.settled();
  expect(markers(runtime.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  const rules = [...runtime.document.styleSheets[0].cssRules];
  expect(rules).toHaveLength(4);
  rows(runtime.document).forEach((row, index) => {
    for (const cell of row.children) expect(cell.matches(rules[index].selectorText)).toBe(true);
  });
  expect(Object.keys(runtime.context)).not.toContain('inspectCandidateTable');
  runtime.disposed();
});

test('unknown final row refuses the entire candidate before any marker write', () => {
  let writes;
  const runtime = loadRuntimeFixture({ mutate(document, window) {
    rows(document).at(-1).children[6].textContent = 'Unrecognized';
    writes = vi.spyOn(window.Element.prototype, 'setAttribute');
  } });
  runtime.settled();
  expect(markers(runtime.document)).toEqual([null, null, null, null]);
  expect(writes.mock.calls.filter(([name]) => name === 'data-zhroma-priority')).toEqual([]);
  runtime.disposed();
});

test('Priority-absent fixture stays unchanged and expires without a marker', () => {
  const runtime = loadRuntimeFixture({ name: 'priority-absent' });
  const before = runtime.document.body.innerHTML;
  vi.advanceTimersByTime(15000);
  expect(runtime.document.body.innerHTML).toBe(before);
  runtime.disposed();
});
