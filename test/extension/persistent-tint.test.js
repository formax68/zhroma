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

function loadRuntimeFixture({ name, mutate, empty = false, realObserver = false, onDisconnect } = {}) {
  if (!vi.isFakeTimers()) vi.useFakeTimers();
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
    disconnect() { this.active = false; this.native?.disconnect(); onDisconnect?.(document); }
  }
  const context = createContext({ document, window, MutationObserver: StartupObserver, setTimeout, clearTimeout });
  for (const path of manifest.content_scripts[0].js) new Script(asset(path), { filename: path }).runInContext(context);
  return { document, window, observers, context,
    deliver(target = document.body, extra = {}) {
      for (const observer of observers) if (observer.active) observer.callback([{ type: 'childList', target, addedNodes: [], removedNodes: [], ...extra }]);
    },
    settled() { vi.advanceTimersByTime(100); },
    disposed() { expect(observers.filter((observer) => observer.active)).toHaveLength(1); expect(vi.getTimerCount()).toBe(0); },
  };
}

test.each([false, true])('late entry after 16000ms, removal and reentry use current source (real=%s)', async (realObserver) => {
  const r = loadRuntimeFixture({ empty: true, realObserver });
  vi.advanceTimersByTime(16000);
  r.document.body.innerHTML = fixture();
  if (realObserver) await new Promise((resolve) => r.window.setTimeout(resolve, 0));
  else r.deliver(r.document.body, { addedNodes: [r.document.querySelector('table')] });
  r.settled();
  expect(markers(r.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  const table = r.document.querySelector('table');
  const oldRows = rows(r.document);
  table.remove();
  if (realObserver) await new Promise((resolve) => r.window.setTimeout(resolve, 0));
  else r.deliver(r.document.body, { removedNodes: [table] });
  r.settled();
  expect(oldRows.map((row) => row.getAttribute('data-zhroma-priority'))).toEqual([null, null, null, null]);
  r.document.body.append(table);
  if (realObserver) await new Promise((resolve) => r.window.setTimeout(resolve, 0));
  else r.deliver(r.document.body, { addedNodes: [table] });
  r.settled();
  expect(markers(r.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  r.disposed();
});
