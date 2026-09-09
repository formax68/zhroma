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

function loadRuntimeFixture({ name, mutate, empty = false, realObserver = false, onDisconnect, hidden = false, instrumentCollections = false } = {}) {
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
  Object.defineProperty(document, 'hidden', { value: hidden, writable: true, configurable: true });
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
  const collections = [];
  class TrackedSet extends Set { constructor(values) { super(values); collections.push(this); } }
  const windowListeners = vi.spyOn(window, 'addEventListener');
  const documentListeners = vi.spyOn(document, 'addEventListener');
  const context = createContext({ document, window, MutationObserver: StartupObserver, setTimeout, clearTimeout,
    ...(instrumentCollections ? { Set: TrackedSet } : {}) });
  for (const path of manifest.content_scripts[0].js) new Script(asset(path), { filename: path }).runInContext(context);
  return { document, window, observers, context, collections, windowListeners, documentListeners,
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


test.each(invalidVariants)('unsafe transition %s clears all owned rows before positive writes, then repairs', (_name, mutate) => {
  const r = loadRuntimeFixture(); r.settled();
  const old = rows(r.document);
  mutate(r.document);
  const writes = vi.spyOn(r.window.Element.prototype, 'setAttribute');
  r.deliver(r.document.body, { addedNodes: [...r.document.body.children] });
  expect(old.map((row) => row.getAttribute('data-zhroma-priority'))).toEqual([null, null, null, null]);
  r.settled();
  expect(writes.mock.calls.filter(([name]) => name === 'data-zhroma-priority')).toEqual([]);
  r.document.documentElement.lang = 'en';
  r.document.body.innerHTML = fixture();
  r.deliver(r.document.body, { addedNodes: [...r.document.body.children] }); r.settled();
  expect(markers(r.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
});

test('retained text, cell replacement, blank, unknown and repaired values follow current Priority', () => {
  const r = loadRuntimeFixture(); r.settled();
  const row = rows(r.document)[0]; const cell = row.children[6];
  cell.firstChild.data = 'Low';
  r.deliver(cell.firstChild, { type: 'characterData' });
  expect(row.hasAttribute('data-zhroma-priority')).toBe(false);
  r.settled(); expect(markers(r.document)[0]).toBe('Low');
  for (const value of ['', 'Unknown', 'Normal']) {
    const replacement = cell.cloneNode(true); replacement.textContent = value;
    row.children[6].replaceWith(replacement);
    r.deliver(row, { addedNodes: [replacement] }); r.settled();
    expect(markers(r.document)).toEqual(value === 'Unknown' ? [null, null, null, null] : [value || null, 'High', 'Normal', 'Low']);
  }
  for (const ticket of rows(r.document)) ticket.children[6].textContent = '';
  r.deliver(r.document.querySelector('tbody')); r.settled();
  expect(markers(r.document)).toEqual([null, null, null, null]);
  row.children[6].textContent = 'Urgent'; r.deliver(row); r.settled();
  expect(markers(r.document)).toEqual(['Urgent', null, null, null]);
});

test.each(['Next', 'Previous', 'refresh body', 'refresh table'])('%s replaces through incomplete markup and clears departed rows', (operation) => {
  const r = loadRuntimeFixture(); r.settled();
  const old = rows(r.document);
  const target = r.document.querySelector(operation === 'refresh table' ? 'table' : 'tbody');
  const replacement = target.cloneNode(true);
  for (const row of replacement.querySelectorAll('[data-zhroma-priority]')) row.removeAttribute('data-zhroma-priority');
  const last = replacement.querySelector('tbody tr:last-child, tr:last-child');
  const cell = last.lastElementChild; cell.remove();
  target.replaceWith(replacement);
  r.deliver(replacement.parentNode, { removedNodes: [target], addedNodes: [replacement] }); r.settled();
  expect(old.every((row) => !row.hasAttribute('data-zhroma-priority'))).toBe(true);
  expect(markers(r.document).every((value) => value === null)).toBe(true);
  last.append(cell); r.deliver(last, { addedNodes: [cell] }); r.settled();
  expect(markers(r.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
});

test('E02 E04 group adjacency/insertion/reordering and ticket conversion preserve native order', () => {
  const r = loadRuntimeFixture({ name: 'grouped-long', mutate(d) { rows(d).forEach((row) => { row.children[6].textContent = 'Low'; }); } });
  r.settled(); const body = r.document.querySelector('tbody');
  const group = body.querySelector('[data-garden-id="tables.group_row"]');
  const tickets = rows(r.document); const extra = group.cloneNode(true);
  body.prepend(extra); body.append(group); body.prepend(tickets.at(-1));
  r.deliver(body); r.settled();
  expect([...body.children][0]).toBe(tickets.at(-1));
  expect(rows(r.document)).toHaveLength(12);
  expect(markers(r.document)).toEqual(Array(12).fill('Low'));
  expect(group.hasAttribute('data-zhroma-priority')).toBe(false);
  expect(extra.hasAttribute('data-zhroma-priority')).toBe(false);
  tickets[0].setAttribute('data-garden-id', 'tables.group_row');
  tickets[0].setAttribute('data-test-id', 'generic-table-rows-group-by');
  r.deliver(body); r.settled();
  expect(tickets[0].hasAttribute('data-zhroma-priority')).toBe(false);
  expect(markers(r.document)).toEqual(Array(11).fill('Low'));
});

test('E03 E06 empty, group-only and single-ticket recovery remove obsolete ownership', () => {
  const r = loadRuntimeFixture({ name: 'grouped-long', mutate(d) { rows(d).forEach((row) => { row.children[6].textContent = 'High'; }); } });
  r.settled(); const tickets = rows(r.document); const body = r.document.querySelector('tbody');
  tickets.forEach((row) => row.remove()); r.deliver(body, { removedNodes: tickets }); r.settled();
  expect(tickets.every((row) => !row.hasAttribute('data-zhroma-priority'))).toBe(true);
  expect(r.document.querySelectorAll('[data-zhroma-priority]')).toHaveLength(0);
  body.replaceChildren(); r.deliver(body); r.settled();
  body.append(tickets[0]); r.deliver(body, { addedNodes: [tickets[0]] }); r.settled();
  expect(markers(r.document)).toEqual(['High']);
});

test('E05 E07 E08 E09 sorting equal priorities and headers uses current order, idempotently', () => {
  const r = loadRuntimeFixture({ mutate(d) { rows(d)[1].children[6].textContent = 'Urgent'; } });
  r.settled(); const tickets = rows(r.document); const body = r.document.querySelector('tbody');
  const writes = vi.spyOn(r.window.Element.prototype, 'setAttribute');
  body.prepend(tickets[1]); r.deliver(body);
  // Supersede queued work, including the current header mapping.
  body.prepend(tickets[3]);
  for (const row of [r.document.querySelector('thead tr'), ...rows(r.document)]) row.prepend(row.children[6]);
  r.deliver(body); r.settled();
  expect(rows(r.document)).toEqual([tickets[3], tickets[1], tickets[0], tickets[2]]);
  expect(markers(r.document)).toEqual(['Low', 'Urgent', 'Urgent', 'Normal']);
  expect(writes.mock.calls.filter(([name]) => name === 'data-zhroma-priority')).toEqual([]);
  r.deliver(body); r.settled();
  expect(writes.mock.calls.filter(([name]) => name === 'data-zhroma-priority')).toEqual([]);
});

test('E10 E11 E12 E13 refresh and rapid present/absent/present converge without stale snapshots', () => {
  const r = loadRuntimeFixture(); r.settled(); const departed = [];
  for (let i = 0; i < 3; i++) {
    departed.push(...rows(r.document));
    const old = r.document.querySelector('table'); r.document.body.replaceChildren();
    r.deliver(r.document.body, { removedNodes: [old] });
    r.document.body.innerHTML = fixture();
    r.deliver(r.document.body, { addedNodes: [r.document.querySelector('table')] });
  }
  rows(r.document)[0].children[6].textContent = 'Normal';
  r.settled();
  expect(markers(r.document)).toEqual(['Normal', 'High', 'Normal', 'Low']);
  expect(departed.every((row) => !row.hasAttribute('data-zhroma-priority'))).toBe(true);
  const writes = vi.spyOn(r.window.Element.prototype, 'setAttribute');
  for (let i = 0; i < 5; i++) { r.deliver(r.document.querySelector('tbody')); r.settled(); }
  expect(writes.mock.calls.filter(([name]) => name === 'data-zhroma-priority')).toEqual([]);
  r.disposed();
});

test('mounted offscreen rows, synthetic insertion/recycling and moved rows stay individually owned', () => {
  const r = loadRuntimeFixture(); r.settled(); const ticket = rows(r.document)[0];
  ticket.style.transform = 'translateY(-1000px)'; r.deliver(ticket); r.settled();
  expect(ticket.getAttribute('data-zhroma-priority')).toBe('Urgent');
  const inserted = ticket.cloneNode(true); inserted.removeAttribute('data-zhroma-priority');
  inserted.children[6].textContent = 'Low'; r.document.querySelector('tbody').append(inserted);
  r.deliver(inserted.parentNode, { addedNodes: [inserted] }); r.settled();
  expect(markers(r.document)).toEqual(['Urgent', 'High', 'Normal', 'Low', 'Low']);
  inserted.children[6].textContent = 'High'; r.deliver(inserted); r.settled();
  expect(inserted.getAttribute('data-zhroma-priority')).toBe('High');
  const from = inserted.parentNode; r.document.body.append(inserted);
  inserted.removeAttribute('data-test-id'); r.deliver(from, { removedNodes: [inserted] }); r.settled();
  expect(inserted.hasAttribute('data-zhroma-priority')).toBe(false);
  expect(markers(r.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
});

test.each([false, true])('partial write plus removal failure continues cleanup (permanent=%s)', (permanent) => {
  const r = loadRuntimeFixture(); r.settled(); const tickets = rows(r.document);
  const nativeSet = r.window.Element.prototype.setAttribute;
  const nativeRemove = r.window.Element.prototype.removeAttribute;
  let failed = false;
  vi.spyOn(r.window.Element.prototype, 'setAttribute').mockImplementation(function (name, value) {
    nativeSet.call(this, name, value);
    if (name === 'data-zhroma-priority' && this === tickets[1]) throw new Error('write after mutation');
  });
  vi.spyOn(r.window.Element.prototype, 'removeAttribute').mockImplementation(function (name) {
    if (name === 'data-zhroma-priority' && this === tickets[0] && (permanent || !failed)) {
      failed = true; throw new Error('native removal failure');
    }
    return nativeRemove.call(this, name);
  });
  tickets[1].children[6].textContent = 'Low'; r.deliver(tickets[1]); r.settled();
  expect(tickets.slice(1).every((row) => !row.hasAttribute('data-zhroma-priority'))).toBe(true);
  // Permanent native removal failure is a platform limit, never a cleanup pass.
  expect(tickets[0].hasAttribute('data-zhroma-priority')).toBe(permanent);
  vi.restoreAllMocks(); r.deliver(r.document.querySelector('tbody')); r.settled();
  expect(markers(r.document)).toEqual(['Urgent', 'Low', 'Normal', 'Low']);
});

test.each([
  ['lang', (d) => d.documentElement, 'fr'],
  ['role', (d) => d.body.firstElementChild, 'table'],
  ['data-garden-id', (d) => d.querySelector('table'), 'other'],
  ['data-test-id', (d) => d.querySelector('tbody tr'), 'other'],
  ['colspan', (d) => d.querySelector('td'), '2'],
  ['rowspan', (d) => d.querySelector('th'), '2'],
])('native observer reacts to validation attribute %s and recovers', async (attributeName, target, invalid) => {
  const r = loadRuntimeFixture({ realObserver: true }); r.settled();
  const node = target(r.document); const old = node.getAttribute(attributeName);
  node.setAttribute(attributeName, invalid);
  await new Promise((resolve) => r.window.setTimeout(resolve, 0)); r.settled();
  expect(r.document.querySelectorAll('[data-zhroma-priority]')).toHaveLength(0);
  if (old === null) node.removeAttribute(attributeName); else node.setAttribute(attributeName, old);
  await new Promise((resolve) => r.window.setTimeout(resolve, 0)); r.settled();
  expect(markers(r.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
});

test('unrelated sibling churn performs zero table scans, writes or scheduled work', () => {
  const r = loadRuntimeFixture(); r.settled();
  const aside = r.document.createElement('aside'); aside.textContent = 'outside'; r.document.body.append(aside);
  const scan = vi.spyOn(r.document, 'querySelectorAll');
  const writes = vi.spyOn(r.window.Element.prototype, 'setAttribute');
  for (let i = 0; i < 30; i++) {
    r.deliver(aside.firstChild, { type: 'characterData' });
    r.deliver(aside, { type: 'attributes', attributeName: 'class' });
    r.deliver(r.document.body, { addedNodes: [aside] });
  }
  expect(scan).not.toHaveBeenCalled();
  expect(writes).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
});

test('mixed self-marker and external records retain invalidation; host marker stripping recovers', () => {
  const r = loadRuntimeFixture(); r.settled(); const ticket = rows(r.document)[0];
  ticket.removeAttribute('data-zhroma-priority');
  r.deliver(ticket, { type: 'attributes', attributeName: 'data-zhroma-priority' }); r.settled();
  expect(ticket.getAttribute('data-zhroma-priority')).toBe('Urgent');
  ticket.children[6].textContent = 'Low';
  r.observers[0].callback([
    { type: 'attributes', target: ticket, attributeName: 'data-zhroma-priority' },
    { type: 'characterData', target: ticket.children[6].firstChild },
  ]);
  r.settled(); expect(ticket.getAttribute('data-zhroma-priority')).toBe('Low');
});

test('sustained relevant turns make progress with one non-resetting pending pass', () => {
  const r = loadRuntimeFixture(); r.settled(); const ticket = rows(r.document)[0];
  for (let turn = 0; turn < 20; turn++) {
    const value = turn % 2 ? 'High' : 'Low'; ticket.children[6].textContent = value;
    for (let burst = 0; burst < 20; burst++) {
      r.deliver(ticket.children[6].firstChild, { type: 'characterData' });
      expect(vi.getTimerCount()).toBe(1);
    }
    vi.runOnlyPendingTimers();
    expect(ticket.getAttribute('data-zhroma-priority')).toBe(value);
    expect(vi.getTimerCount()).toBe(0);
  }
});


test.each([false, true])('hidden startup and repeated visibility/restoration use one current controller (initial hidden=%s)', (hidden) => {
  const r = loadRuntimeFixture({ hidden });
  if (hidden) {
    expect(r.observers.filter((o) => o.active)).toHaveLength(0); expect(vi.getTimerCount()).toBe(0);
    r.document.hidden = false; r.document.dispatchEvent(new r.window.Event('visibilitychange'));
  }
  r.settled(); expect(markers(r.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  for (let i = 0; i < 3; i++) {
    r.document.hidden = true; r.document.dispatchEvent(new r.window.Event('visibilitychange'));
    expect(r.observers.filter((o) => o.active)).toHaveLength(0); expect(vi.getTimerCount()).toBe(0);
    expect(markers(r.document)).toEqual([null, null, null, null]);
    rows(r.document)[0].children[6].textContent = 'Low';
    r.document.hidden = false; r.document.dispatchEvent(new r.window.Event('visibilitychange'));
    const restored = new r.window.Event('pageshow'); Object.defineProperty(restored, 'persisted', { value: true });
    r.window.dispatchEvent(restored); r.window.dispatchEvent(restored); r.settled();
    expect(markers(r.document)).toEqual(['Low', 'High', 'Normal', 'Low']); r.disposed();
    r.window.dispatchEvent(new r.window.Event('pagehide'));
    expect(r.observers.filter((o) => o.active)).toHaveLength(0);
    r.window.dispatchEvent(restored); r.settled(); r.disposed();
  }
  expect(r.observers).toHaveLength(1);
  expect(r.windowListeners.mock.calls.map(([name]) => name)).toEqual(['pagehide', 'pageshow']);
  expect(r.documentListeners.mock.calls.map(([name]) => name)).toEqual(['visibilitychange']);
});

test('thirty switches release strong owned references and preserve non-view native content and interaction', () => {
  const r = loadRuntimeFixture({ instrumentCollections: true }); r.settled();
  const owned = r.collections.find((set) => [...set].some((value) => value?.nodeType === 1));
  expect(owned.size).toBe(4);
  for (let i = 0; i < 30; i++) {
    const old = r.document.querySelector('table'); const oldRows = rows(r.document);
    r.document.body.innerHTML = '<main><button>Native action</button><p>Non-view surface</p></main>';
    const before = r.document.body.innerHTML; const clicked = vi.fn(); const button = r.document.querySelector('button');
    button.addEventListener('click', clicked); button.focus();
    r.deliver(r.document.body, { removedNodes: [old] }); r.settled();
    expect(owned.size).toBe(0);
    expect(oldRows.every((row) => !row.hasAttribute('data-zhroma-priority'))).toBe(true);
    expect(r.document.body.innerHTML).toBe(before); expect(r.document.activeElement).toBe(button);
    button.click(); expect(clicked).toHaveBeenCalledOnce();
    r.window.dispatchEvent(new r.window.Event('pagehide')); expect(owned.size).toBe(0);
    r.document.body.innerHTML = fixture(); r.window.dispatchEvent(new r.window.Event('pageshow')); r.settled();
    expect(owned.size).toBe(4); expect([...owned].every((row) => row.isConnected)).toBe(true); r.disposed();
  }
  expect(r.observers).toHaveLength(1);
  expect(r.windowListeners.mock.calls).toHaveLength(2); expect(r.documentListeners.mock.calls).toHaveLength(1);
  r.window.dispatchEvent(new r.window.Event('pagehide')); expect(owned.size).toBe(0); expect(vi.getTimerCount()).toBe(0);
});

test('native observer self-writes reach quiescence with zero idle timers', async () => {
  const r = loadRuntimeFixture({ realObserver: true }); r.settled();
  await new Promise((resolve) => r.window.setTimeout(resolve, 0));
  const scans = vi.spyOn(r.document, 'querySelectorAll');
  await new Promise((resolve) => r.window.setTimeout(resolve, 0));
  expect(scans).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
});
