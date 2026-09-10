// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { createContext, Script } from 'node:vm';
import { Window } from 'happy-dom';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { validateFixtureManifest } from '../../scripts/fixture-contract.js';
import { createChromeHarness } from './chrome-harness.js';

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

// `preference` configures the strict Chrome harness; `confirmPreference: false`
// leaves the startup read in flight, which is the shipped script's real
// pre-confirmation state rather than a state this harness invents.
function loadRuntimeFixture({ name, mutate, empty = false, realObserver = false, onDisconnect, preference, confirmPreference = true } = {}) {
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
  const harness = createChromeHarness(preference);
  const context = createContext({ document, window, chrome: harness.chrome, MutationObserver: StartupObserver, setTimeout, clearTimeout });
  for (const path of manifest.content_scripts[0].js) new Script(asset(path), { filename: path }).runInContext(context);
  // Chrome resolves the startup read only after the script has finished
  // evaluating. Nothing may be painted before that reply lands.
  if (confirmPreference) harness.flush();
  return { document, window, observers, context, harness,
    deliver(target = document.body, extra = {}) {
      for (const observer of observers) if (observer.active) observer.callback([{ type: 'childList', target, addedNodes: [], removedNodes: [], ...extra }]);
    },
    settled() { harness.flush(); vi.advanceTimersByTime(100); },
    disposed() {
      harness.assertClean();
      expect(observers.filter((observer) => observer.active)).toHaveLength(1);
      expect(vi.getTimerCount()).toBe(0);
    },
    // An unconfirmed or refused preference must leave no observer running and
    // no timer pending — dormant, not merely untinted.
    dormant() {
      harness.assertClean();
      expect(observers.filter((observer) => observer.active)).toHaveLength(0);
      expect(vi.getTimerCount()).toBe(0);
    },
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

test('Priority-absent fixture stays unchanged and discovery remains available', () => {
  const runtime = loadRuntimeFixture({ name: 'priority-absent' });
  const before = runtime.document.body.innerHTML;
  vi.advanceTimersByTime(15000);
  expect(runtime.document.body.innerHTML).toBe(before);
  runtime.disposed();
});

// Every variant below is synthetic and changes only a fresh admitted copy in memory.
test.each([0, 8, 15])('Priority column moved to index %i preserves each mapping', (index) => {
  const runtime = loadRuntimeFixture({ mutate(document) {
    for (const row of [document.querySelector('thead > tr'), ...rows(document)]) {
      const cell = row.children[6];
      cell.remove();
      row.insertBefore(cell, row.children[index] ?? null);
    }
  } });
  runtime.settled();
  expect(markers(runtime.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  runtime.disposed();
});

test.each([
  ['single row', ['High'], ['High']],
  ['adjacent duplicates', ['Urgent', 'Urgent', 'Low', 'Low'], ['Urgent', 'Urgent', 'Low', 'Low']],
  ['mixed blanks', ['', 'High', ' \t\n', 'Low'], [null, 'High', null, 'Low']],
  ['trim only', ['\n Urgent\t', '\u00a0High ', ' Normal\n', '\tLow '], ['Urgent', 'High', 'Normal', 'Low']],
  ['all blank', ['', ' ', '\t', '\n'], [null, null, null, null]],
  ['zero rows', [], []],
])('%s keeps exact values and row identity/order', (_name, labels, expected) => {
  const runtime = loadRuntimeFixture({ mutate(document) {
    rows(document).forEach((row, index) => {
      if (index >= labels.length) row.remove();
      else row.children[6].textContent = labels[index];
    });
  } });
  const before = rows(runtime.document);
  runtime.settled();
  expect(markers(runtime.document)).toEqual(expected);
  expect(rows(runtime.document)).toEqual(before);
  if (expected.every((value) => value === null)) {
    expect(runtime.observers[0].active).toBe(true);
    vi.advanceTimersByTime(14900);
  }
  runtime.disposed();
});

const invalidVariants = [
  ...['urgent', 'URGENT', 'Very High', 'Low priority', 'Hіgh', 'Élevée'].map((value) => [value, (d) => { rows(d).at(-1).children[6].textContent = value; }]),
  ...['', 'en-US', 'fr'].map((lang) => [`lang ${lang}`, (d) => { d.documentElement.lang = lang; }]),
  ['duplicate Priority', (d) => { d.querySelector('th').textContent = 'Priority'; }],
  ['missing Priority', (d) => { d.querySelector('thead tr').children[6].textContent = 'Something'; }],
  ['missing final cell', (d) => rows(d).at(-1).lastElementChild.remove()],
  ['extra non-cell child', (d) => rows(d).at(-1).append(d.createElement('div'))],
  ['colspan before Priority', (d) => { rows(d)[0].children[0].colSpan = 2; }],
  ['rowspan', (d) => { rows(d)[0].children[0].rowSpan = 2; }],
  ['header span', (d) => { d.querySelector('th').colSpan = 2; }],
  ['nested unrelated cell', (d) => rows(d)[0].children[1].append(d.createElement('td'))],
  ['nested table', (d) => rows(d)[0].children[1].append(d.createElement('table'))],
  ['foreign ownership', (d) => d.body.firstElementChild.setAttribute('role', 'table')],
  ['competing tables', (d) => d.body.append(d.querySelector('table').cloneNode(true))],
  ['multiple heads', (d) => d.querySelector('table').append(d.querySelector('thead').cloneNode(true))],
  ['multiple bodies', (d) => d.querySelector('table').append(d.querySelector('tbody').cloneNode(true))],
  ['multiple header rows', (d) => d.querySelector('thead').append(d.querySelector('thead tr').cloneNode(true))],
  ['unexplained body row', (d) => d.querySelector('tbody').append(d.createElement('tr'))],
  ...['table', 'thead', 'tbody', 'thead tr', 'th', 'tbody tr', 'td'].map((selector) => [`removed Garden ${selector}`, (d) => d.querySelector(selector).removeAttribute('data-garden-id')]),
  ['sibling decoy header', (d) => {
    const head = d.querySelector('thead');
    head.remove();
    const decoy = d.createElement('table');
    decoy.append(head);
    d.body.append(decoy);
  }],
];

test.each(invalidVariants)('refuses synthetic %s with zero writes even transiently', (_name, mutate) => {
  let writes;
  const runtime = loadRuntimeFixture({ mutate(document, window) {
    mutate(document);
    writes = vi.spyOn(window.Element.prototype, 'setAttribute');
  } });
  vi.advanceTimersByTime(15000);
  expect(runtime.document.querySelectorAll('[data-zhroma-priority]')).toHaveLength(0);
  expect(writes.mock.calls.filter(([name]) => name === 'data-zhroma-priority')).toEqual([]);
  runtime.disposed();
});

test('decoy subject, ARIA and icon labels never supply a missing Priority value', () => {
  const runtime = loadRuntimeFixture({ mutate(document) {
    for (const row of rows(document)) {
      row.children[6].textContent = '';
      row.children[6].setAttribute('aria-label', 'Urgent');
      row.children[5].textContent = 'High';
      row.querySelector('svg').setAttribute('aria-label', 'Low');
    }
  } });
  vi.advanceTimersByTime(15000);
  expect(markers(runtime.document)).toEqual([null, null, null, null]);
  runtime.disposed();
});

test('original grouped-long redacted unknown values conservatively refuse tinting', () => {
  const runtime = loadRuntimeFixture({ name: 'grouped-long' });
  runtime.settled();
  expect(markers(runtime.document)).toEqual(Array(12).fill(null));
  runtime.disposed();
});

test('synthetic known priorities on grouped-long topology preserve group/header/wrapper boundaries', () => {
  const runtime = loadRuntimeFixture({ name: 'grouped-long', mutate(document) {
    rows(document).forEach((row, index) => { row.children[6].textContent = index < 6 ? 'Low' : 'Normal'; });
  } });
  const group = runtime.document.querySelector('[data-garden-id="tables.group_row"]');
  const groupBefore = group.outerHTML;
  runtime.settled();
  expect(markers(runtime.document)).toEqual(['Low', 'Low', 'Low', 'Low', 'Low', 'Low', 'Normal', 'Normal', 'Normal', 'Normal', 'Normal', 'Normal']);
  expect(group.outerHTML).toBe(groupBefore);
  expect(runtime.document.querySelectorAll('thead [data-zhroma-priority], div[data-zhroma-priority]')).toHaveLength(0);
  runtime.disposed();
});

test('nested foreign row inside a group invalidates the complete candidate', () => {
  let writes;
  const runtime = loadRuntimeFixture({ name: 'grouped-long', mutate(document, window) {
    rows(document).forEach((row) => { row.children[6].textContent = 'Low'; });
    document.querySelector('[data-garden-id="tables.group_row"] td').append(rows(document)[0].cloneNode(true));
    writes = vi.spyOn(window.Element.prototype, 'setAttribute');
  } });
  runtime.settled();
  expect(runtime.document.querySelectorAll('[data-zhroma-priority]')).toHaveLength(0);
  expect(writes.mock.calls.filter(([name]) => name === 'data-zhroma-priority')).toEqual([]);
  runtime.disposed();
});

test('only marker attributes change; all nodes, Unicode text, native styles and listeners survive', () => {
  const clicked = vi.fn();
  const runtime = loadRuntimeFixture({ mutate(document) {
    rows(document)[0].className = 'native unread';
    rows(document)[0].setAttribute('aria-selected', 'true');
    rows(document)[0].style.cssText = 'font-weight: 700; background-color: white';
    rows(document)[0].children[0].style.boxShadow = 'inset 2px 0 black';
    rows(document)[0].children[5].textContent = 'Καλημέρα café 🧭';
    rows(document)[0].querySelector('button').addEventListener('click', clicked);
  } });
  const allNodes = [];
  const visit = (node) => { allNodes.push(node); for (const child of node.childNodes) visit(child); };
  visit(runtime.document.body);
  const before = allNodes.map((node) => ({ node, children: [...node.childNodes], text: node.textContent,
    attributes: node.nodeType === 1 ? [...node.attributes].map((a) => [a.name, a.value]) : null }));
  runtime.settled();
  for (const entry of before) {
    expect([...entry.node.childNodes]).toEqual(entry.children);
    expect(entry.node.textContent).toBe(entry.text);
    if (entry.attributes) expect([...entry.node.attributes].filter((a) => a.name !== 'data-zhroma-priority').map((a) => [a.name, a.value])).toEqual(entry.attributes);
  }
  rows(runtime.document)[0].querySelector('button').click();
  expect(clicked).toHaveBeenCalledOnce();
  runtime.disposed();
});

test('write interruption clears attempted markers while preserving unrelated attributes', () => {
  const runtime = loadRuntimeFixture({ mutate(document, window) {
    const ticketRows = rows(document);
    ticketRows[0].setAttribute('data-zhroma-priority', 'old-owned-value');
    ticketRows[1].setAttribute('data-unrelated', 'keep');
    const native = window.Element.prototype.setAttribute;
    let writes = 0;
    vi.spyOn(window.Element.prototype, 'setAttribute').mockImplementation(function (name, value) {
      if (name === 'data-zhroma-priority' && ++writes === 2) throw new Error('synthetic failure');
      return native.call(this, name, value);
    });
  } });
  runtime.settled();
  expect(markers(runtime.document)).toEqual([null, null, null, null]);
  expect(rows(runtime.document)[1].getAttribute('data-unrelated')).toBe('keep');
  runtime.disposed();
});

test('identical owned markers are retained without rewriting', () => {
  let writes;
  const runtime = loadRuntimeFixture({ mutate(document, window) {
    rows(document)[0].setAttribute('data-zhroma-priority', 'Urgent');
    writes = vi.spyOn(rows(document)[0], 'setAttribute');
  } });
  runtime.settled();
  expect(writes).not.toHaveBeenCalled();
  expect(markers(runtime.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
});

test('late table, head, cell and text batches settle together before tint', () => {
  const runtime = loadRuntimeFixture({ empty: true });
  runtime.settled();
  runtime.document.body.innerHTML = fixture();
  const table = runtime.document.querySelector('table');
  const head = table.querySelector('thead');
  const cell = rows(runtime.document).at(-1).lastElementChild;
  head.remove(); cell.remove();
  for (const row of rows(runtime.document)) row.children[6].textContent = '';
  runtime.deliver(runtime.document.body, { addedNodes: [table] }); runtime.settled();
  table.prepend(head); runtime.deliver(table); runtime.settled();
  rows(runtime.document).at(-1).append(cell); runtime.deliver(table); runtime.settled();
  expect(markers(runtime.document)).toEqual([null, null, null, null]);
  ['Urgent', 'High', 'Normal', 'Low'].forEach((value, i) => { rows(runtime.document)[i].children[6].textContent = value; });
  runtime.deliver(table, { type: 'characterData' });
  expect(markers(runtime.document)).toEqual([null, null, null, null]);
  runtime.settled();
  expect(markers(runtime.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  runtime.disposed();
});

test('unknown last row arriving during quiet interval prevents any initial tint', () => {
  const runtime = loadRuntimeFixture();

  const last = rows(runtime.document).at(-1).cloneNode(true);
  last.children[6].textContent = 'Unknown';
  runtime.document.querySelector('tbody').append(last);
  const writes = vi.spyOn(runtime.window.Element.prototype, 'setAttribute');
  runtime.deliver(last.parentElement, { addedNodes: [last] });
  vi.advanceTimersByTime(99);
  expect(runtime.observers[0].active).toBe(true);
  vi.advanceTimersByTime(1);
  expect(writes.mock.calls.filter(([name]) => name === 'data-zhroma-priority')).toEqual([]);
  runtime.disposed();
});

test.each([true, false])('persistent discovery remains idle between perpetual churn batches (empty=%s)', (empty) => {
  const runtime = loadRuntimeFixture({ empty, mutate(document) {
    for (const row of rows(document)) row.children[6].textContent = '';
  } });
  for (let count = 0; count < 300; count++) {
    runtime.deliver(runtime.document.body);
    vi.advanceTimersByTime(50);
  }
  expect(runtime.document.querySelectorAll('[data-zhroma-priority]')).toHaveLength(0);
  runtime.disposed();
});

test('unrelated churn cannot delay a bound safe candidate', () => {
  const runtime = loadRuntimeFixture();
  vi.advanceTimersByTime(50);
  runtime.deliver(runtime.document.body);
  vi.advanceTimersByTime(50);
  expect(markers(runtime.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  runtime.disposed();
});

test('pagehide stops observation and releases owned markers and pending work', () => {
  const runtime = loadRuntimeFixture();
  runtime.settled();
  runtime.window.dispatchEvent(new runtime.window.Event('pagehide'));
  expect(runtime.observers.every((observer) => !observer.active)).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
  expect(markers(runtime.document)).toEqual([null, null, null, null]);
});

test('inspection error stays quiet and recovers on a later mutation', () => {
  const runtime = loadRuntimeFixture();
  const spy = vi.spyOn(runtime.document, 'querySelectorAll').mockImplementation(() => { throw new Error('synthetic'); });
  runtime.settled();
  spy.mockRestore();
  runtime.deliver(runtime.document.querySelector('table')); runtime.settled();
  expect(markers(runtime.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  runtime.disposed();
});

test('separate fresh documents stamp independently without coordination', () => {
  const first = loadRuntimeFixture();
  const second = loadRuntimeFixture({ mutate(document) { rows(document).at(-1).children[6].textContent = 'Unknown'; } });
  first.settled();
  expect(markers(first.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(markers(second.document)).toEqual([null, null, null, null]);
  first.disposed(); second.disposed();
});

test('real happy-dom MutationObserver delivers delayed document insertion', async () => {
  const runtime = loadRuntimeFixture({ empty: true, realObserver: true });
  runtime.settled();
  runtime.document.body.innerHTML = fixture();
  // Native observer scheduling is owned by the inert window, not Vitest's clock.
  await new Promise((resolve) => runtime.window.setTimeout(resolve, 0));
  runtime.settled();
  expect(markers(runtime.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(runtime.observers[0].options).toEqual({ childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['data-garden-id', 'data-test-id', 'role', 'colspan', 'rowspan', 'lang', 'data-zhroma-priority'] });
  runtime.disposed();
});

// --- preference readiness gates the very first paint ------------------------

test('an in-flight startup read leaves the controller dormant, then tints once it lands', () => {
  const runtime = loadRuntimeFixture({ confirmPreference: false });
  expect(runtime.harness.readCount()).toBe(1);
  expect(runtime.harness.pendingCount()).toBe(1);
  // The reply is still queued in Chrome, so there is nothing to be right about
  // yet: no observer, no timer, no marker, no guess.
  vi.advanceTimersByTime(15000);
  expect(markers(runtime.document)).toEqual([null, null, null, null]);
  runtime.dormant();
  runtime.settled();
  expect(markers(runtime.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  runtime.disposed();
});

test.each([
  ['a rejected read', { readMode: 'rejected' }],
  ['a throwing storage API', { readMode: 'throws' }],
  ['a stored false', { stored: false }],
  ['a non-boolean stored value', { stored: 'true' }],
  ['a null stored value', { stored: null }],
])('%s stays dormant: no marker is ever written and every timer drains', (_name, preference) => {
  let writes;
  const runtime = loadRuntimeFixture({ preference, mutate(_document, window) {
    writes = vi.spyOn(window.Element.prototype, 'setAttribute');
  } });
  vi.advanceTimersByTime(15000);
  expect(markers(runtime.document)).toEqual([null, null, null, null]);
  expect(writes.mock.calls.filter(([name]) => name === 'data-zhroma-priority')).toEqual([]);
  runtime.dormant();
});

test('a preference confirmed only by a later change event still reaches the first paint', () => {
  const runtime = loadRuntimeFixture({ preference: { stored: false } });
  runtime.settled();
  expect(markers(runtime.document)).toEqual([null, null, null, null]);
  runtime.dormant();
  runtime.harness.emitChange({ enabled: { oldValue: false, newValue: true } });
  runtime.settled();
  expect(markers(runtime.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  runtime.disposed();
});
