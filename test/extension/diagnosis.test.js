// @vitest-environment node
//
// D-01 certainty tests. Every case runs the actual shipped `content.js` bytes
// against a synthetic table built in memory, driven by the strict Chrome
// harness. Nothing here reimplements the diagnosis: the assertions are about
// what the shipped script reports over the finite status protocol.
//
// The question this file exists to answer is narrow and load-bearing: when may
// the extension say "this view has no Priority column"? D-01 says only when a
// well-formed header row with no `Priority` cell, at least one width-matched
// ticket row, and a quiet settle period all hold at the same time. Every other
// shape of incomplete evidence — an absent table, a partial mount, an empty or
// group-only body, a malformed cell, an unsupported shell — must read neutral
// or cannot-read, never a missing-column claim.
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { createContext, Script } from 'node:vm';
import { Window } from 'happy-dom';
import { afterEach, expect, test, vi } from 'vitest';
import { createChromeHarness } from './chrome-harness.js';

const asset = (name) => readFileSync(new URL(`../../extension/${name}`, import.meta.url), 'utf8');

/** The settle period the shipped script waits out before a missing claim. */
const SETTLE_MS = 100;

const windows = [];
afterEach(async () => {
  for (const window of windows.splice(0)) {
    window.dispatchEvent(new window.Event('pagehide'));
    await window.happyDOM.close();
  }
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// --- synthetic table construction -------------------------------------------
// These are not the admitted fixtures and must never be confused with them:
// they are minimal shapes that isolate one D-01 predicate each. The admitted
// corpus is exercised by initial-tint, persistent-tint and runtime-contract.

const th = (text) => `<th data-garden-id="tables.header_cell">${text}</th>`;
const td = (text, attributes = '') => `<td data-garden-id="tables.cell"${attributes}>${text}</td>`;
const ticketRow = (cells) => `<tr data-garden-id="tables.row" data-test-id="generic-table-row">${cells.map((cell) => td(cell)).join('')}</tr>`;
const groupRow = (span) => '<tr data-garden-id="tables.group_row" data-test-id="generic-table-rows-group-by">'
  + `${td('Group', ` colspan="${span}"`)}</tr>`;

const PLAIN_HEADERS = ['Subject', 'Requester', 'Status'];
const PRIORITY_HEADERS = ['Subject', 'Priority', 'Status'];

function view({ headers = PLAIN_HEADERS, body = '' } = {}) {
  return '<div><table data-garden-id="tables.table" data-test-id="generic-table">'
    + '<thead data-garden-id="tables.head" data-test-id="generic-table-head">'
    + `<tr data-garden-id="tables.header_row">${headers.map(th).join('')}</tr></thead>`
    + `<tbody data-garden-id="tables.body" data-test-id="generic-table-body">${body}</tbody>`
    + '</table></div>';
}

/** A well-formed Priority-absent view: header witness + one width-matched row. */
const missingColumnView = () => view({ body: ticketRow(['One', 'Someone', 'Open']) });

// --- runtime loader ----------------------------------------------------------

function load({ html = missingColumnView(), lang = 'en', preference, confirmPreference = true } = {}) {
  if (!vi.isFakeTimers()) vi.useFakeTimers();
  const window = new Window({ settings: {
    enableJavaScriptEvaluation: false, disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true, enableImageFileLoading: false,
    navigation: { disableMainFrameNavigation: true, disableChildFrameNavigation: true, disableChildPageNavigation: true },
  } });
  windows.push(window);
  const { document } = window;
  document.documentElement.lang = lang;
  document.body.innerHTML = html;
  const observers = [];
  class Observer {
    constructor(callback) { this.callback = callback; this.active = false; observers.push(this); }
    observe() { this.active = true; }
    disconnect() { this.active = false; }
  }
  const harness = createChromeHarness(preference);
  const context = createContext({ document, window, chrome: harness.chrome,
    MutationObserver: Observer, setTimeout, clearTimeout });
  new Script(asset('content.js'), { filename: 'content.js' }).runInContext(context);
  // Chrome resolves the startup read only after the script finished evaluating.
  if (confirmPreference) harness.flush();
  const runtime = {
    document, window, harness, observers,
    /** Deliver an interpretation-affecting observer record, as Chrome would. */
    deliver(target = document.querySelector('table') ?? document.body, extra = {}) {
      for (const observer of observers) {
        if (observer.active) observer.callback([{ type: 'childList', target, addedNodes: [], removedNodes: [], ...extra }]);
      }
    },
    /** Swap the whole view and report it exactly as a real subtree replacement. */
    replaceView(next) {
      const removedNodes = [...document.body.children];
      document.body.innerHTML = next;
      runtime.deliver(document.body, { removedNodes, addedNodes: [...document.body.children] });
    },
    advance(ms) { harness.flush(); vi.advanceTimersByTime(ms); },
    status() { return runtime.harness.requestStatus(); },
    markers() {
      return [...document.querySelectorAll('[data-zhroma-priority]')]
        .map((row) => row.getAttribute('data-zhroma-priority'));
    },
    atRest() {
      harness.assertClean();
      expect(vi.getTimerCount()).toBe(0);
    },
  };
  return runtime;
}

const diagnosis = (runtime) => {
  const reply = runtime.status();
  return { diagnosis: reply?.diagnosis, reason: reply?.reason };
};

const MISSING = { diagnosis: 'missing', reason: null };
const NEUTRAL = { diagnosis: 'neutral', reason: null };
const WORKING = { diagnosis: 'working', reason: null };
const BLANK = { diagnosis: 'working', reason: 'blank' };
const STRUCTURE = { diagnosis: 'cannot-read', reason: 'structure' };
const LANGUAGE = { diagnosis: 'cannot-read', reason: 'unsupported-language' };

// --- the quiet window --------------------------------------------------------

test('a missing Priority column is neutral at 99 ms and claimed only once 100 ms of quiet has passed', () => {
  const runtime = load();
  runtime.advance(SETTLE_MS - 1);
  expect(diagnosis(runtime)).toEqual(NEUTRAL);
  runtime.advance(1);
  expect(diagnosis(runtime)).toEqual(MISSING);
  runtime.atRest();
});

test('a relevant change inside the window restarts the quiet period rather than confirming early', () => {
  const runtime = load();
  runtime.advance(SETTLE_MS - 1);
  // A perfectly ordinary relevant change: a second ticket row arrives.
  runtime.replaceView(view({ body: ticketRow(['One', 'Someone', 'Open']) + ticketRow(['Two', 'Someone', 'Open']) }));
  expect(diagnosis(runtime)).toEqual(NEUTRAL);
  // The original timer expires here. It must not confirm: a change landed
  // inside its window, so the window it measured is no longer quiet.
  runtime.advance(SETTLE_MS);
  expect(diagnosis(runtime)).toEqual(NEUTRAL);
  runtime.advance(1);
  expect(diagnosis(runtime)).toEqual(MISSING);
  runtime.atRest();
});

test('a confirmed missing claim is withdrawn in the same turn a relevant change lands', () => {
  const runtime = load();
  runtime.advance(SETTLE_MS);
  expect(diagnosis(runtime)).toEqual(MISSING);
  // No timer may run between the mutation and the withdrawal.
  runtime.deliver();
  expect(diagnosis(runtime)).toEqual(NEUTRAL);
  runtime.advance(SETTLE_MS);
  expect(diagnosis(runtime)).toEqual(MISSING);
  runtime.atRest();
});

test('a Priority column that arrives during the quiet window is working, never a missing claim', () => {
  const runtime = load();
  const seen = [];
  runtime.advance(50);
  seen.push(diagnosis(runtime));
  runtime.replaceView(view({ headers: PRIORITY_HEADERS, body: ticketRow(['One', 'Urgent', 'Open']) }));
  runtime.advance(15000);
  seen.push(diagnosis(runtime));
  expect(seen).toEqual([NEUTRAL, WORKING]);
  expect(runtime.markers()).toEqual(['Urgent']);
  runtime.atRest();
});

test('the candidate table being replaced wholesale cannot carry a stale claim across the timer', () => {
  const runtime = load();
  runtime.advance(SETTLE_MS);
  expect(diagnosis(runtime)).toEqual(MISSING);
  runtime.replaceView('<main><p>Loading</p></main>');
  expect(diagnosis(runtime)).toEqual(NEUTRAL);
  runtime.advance(15000);
  expect(diagnosis(runtime)).toEqual(NEUTRAL);
  runtime.atRest();
});

test('a finite burst of relevant changes keeps at most one confirmation timer pending and drains to zero', () => {
  const runtime = load();
  for (let i = 0; i < 30; i++) {
    runtime.deliver();
    runtime.advance(20);
    // One reconcile pass and at most one confirmation timer, never a queue.
    expect(vi.getTimerCount()).toBeLessThanOrEqual(1);
    expect(diagnosis(runtime)).toEqual(NEUTRAL);
  }
  runtime.advance(15000);
  expect(diagnosis(runtime)).toEqual(MISSING);
  runtime.atRest();
});

test('a self-written marker record does not extend the quiet window', () => {
  // The missing view carries no markers at all, so a marker record on this DOM
  // is exactly the self-write shape the controller must ignore.
  const runtime = load();
  runtime.advance(50);
  runtime.deliver(runtime.document.querySelector('tbody > tr'), {
    type: 'attributes', attributeName: 'data-zhroma-priority',
  });
  runtime.advance(50);
  expect(diagnosis(runtime)).toEqual(MISSING);
  runtime.atRest();
});

// --- everything that is NOT a missing column ---------------------------------

test.each([
  ['an absent table', '<main><p>No table yet</p></main>'],
  ['an empty body', view({ body: '' })],
  ['a group-only body', view({ body: groupRow(3) })],
  ['a partially mounted row', view({ body: ticketRow(['One', 'Someone']) })],
  ['a body whose rows are all narrower than the header', view({ body: ticketRow(['One']) + ticketRow(['Two']) })],
])('%s stays neutral forever and never becomes a missing claim', (_name, html) => {
  const runtime = load({ html });
  const before = runtime.document.body.innerHTML;
  runtime.advance(15000);
  expect(diagnosis(runtime)).toEqual(NEUTRAL);
  expect(runtime.document.body.innerHTML).toBe(before);
  runtime.atRest();
});

test('a zero-cell header row is neutral, not proof that the column is missing', () => {
  const runtime = load({ html: view({ headers: [], body: ticketRow([]) }) });
  runtime.advance(15000);
  expect(diagnosis(runtime)).toEqual(NEUTRAL);
  runtime.atRest();
});

test('a malformed row arriving after a witness is structural cannot-read, never missing', () => {
  const runtime = load();
  runtime.advance(SETTLE_MS);
  expect(diagnosis(runtime)).toEqual(MISSING);
  runtime.replaceView(view({ body: ticketRow(['One', 'Someone', 'Open'])
    + `<tr data-garden-id="tables.row" data-test-id="generic-table-row">${td('Two', ' rowspan="2"')}${td('Someone')}${td('Open')}</tr>` }));
  expect(diagnosis(runtime)).toEqual(STRUCTURE);
  runtime.advance(15000);
  expect(diagnosis(runtime)).toEqual(STRUCTURE);
  runtime.atRest();
});

test('two candidate tables are structural cannot-read, never missing', () => {
  const runtime = load({ html: missingColumnView() + missingColumnView() });
  runtime.advance(15000);
  expect(diagnosis(runtime)).toEqual(STRUCTURE);
  runtime.atRest();
});

test('a duplicated Priority header is structural cannot-read, never missing', () => {
  const runtime = load({ html: view({
    headers: ['Priority', 'Subject', 'Priority'], body: ticketRow(['Urgent', 'One', 'Low']),
  }) });
  runtime.advance(15000);
  expect(diagnosis(runtime)).toEqual(STRUCTURE);
  expect(runtime.markers()).toEqual([]);
  runtime.atRest();
});

test('an unrecognized non-empty priority value is structural cannot-read, never missing', () => {
  const runtime = load({ html: view({
    headers: PRIORITY_HEADERS, body: ticketRow(['One', 'Critical', 'Open']),
  }) });
  runtime.advance(15000);
  expect(diagnosis(runtime)).toEqual(STRUCTURE);
  expect(runtime.markers()).toEqual([]);
  runtime.atRest();
});

test('a Priority column whose every value is empty is working with the blank reason', () => {
  const runtime = load({ html: view({
    headers: PRIORITY_HEADERS, body: ticketRow(['One', '', 'Open']) + ticketRow(['Two', '', 'Open']),
  }) });
  runtime.advance(15000);
  expect(diagnosis(runtime)).toEqual(BLANK);
  expect(runtime.markers()).toEqual([]);
  runtime.atRest();
});

// --- the language boundary (D-04, D-08) --------------------------------------

test('a non-English shell is cannot-read with the unsupported-language reason', () => {
  const runtime = load({ lang: 'fr' });
  runtime.advance(15000);
  expect(diagnosis(runtime)).toEqual(LANGUAGE);
  runtime.atRest();
});

test.each([
  ['an absent lang attribute', ''],
  ['a whitespace-only lang attribute', '   '],
])('%s is generic cannot-read and never names a language', (_name, lang) => {
  const runtime = load({ lang });
  runtime.advance(15000);
  expect(diagnosis(runtime)).toEqual(STRUCTURE);
  runtime.atRest();
});

test('an English view that broke structurally is never told its language is unsupported', () => {
  const runtime = load({ lang: 'en', html: missingColumnView() + missingColumnView() });
  runtime.advance(15000);
  expect(diagnosis(runtime).reason).toBe('structure');
  runtime.atRest();
});

test('no language string, DOM text or raw error ever reaches the status reply', () => {
  for (const lang of ['fr', 'de-CH', 'ja']) {
    const runtime = load({ lang, html: view({ headers: ['Priorité'], body: ticketRow(['Urgente']) }) });
    runtime.advance(15000);
    const reply = runtime.status();
    const wire = JSON.stringify(reply);
    for (const token of [lang, 'Priorité', 'Urgente', 'tables.', 'Error']) expect(wire).not.toContain(token);
    expect(reply).toEqual({ type: 'status', requestId: 1, diagnosis: 'cannot-read', reason: 'unsupported-language' });
    runtime.atRest();
  }
});

// --- the page stays untouched in every diagnosis (D-03) ----------------------

test.each([
  ['missing', missingColumnView()],
  ['structure', missingColumnView() + missingColumnView()],
  ['waiting', view({ body: '' })],
])('the %s diagnosis writes no diagnostic markup into the page', (_name, html) => {
  const runtime = load({ html });
  const before = runtime.document.body.innerHTML;
  runtime.advance(15000);
  runtime.deliver();
  runtime.advance(15000);
  expect(runtime.document.body.innerHTML).toBe(before);
  expect(runtime.markers()).toEqual([]);
  runtime.atRest();
});

test('an unconfirmed preference reports neutral and arms no confirmation timer at all', () => {
  const runtime = load({ confirmPreference: false });
  // The startup read is still in flight, so the controller is dormant. A view
  // it has never been allowed to inspect can never be accused of anything.
  vi.advanceTimersByTime(15000);
  expect(diagnosis(runtime)).toEqual(NEUTRAL);
  expect(runtime.observers.filter((observer) => observer.active)).toHaveLength(0);
  runtime.atRest();
});

test('a stored false leaves a missing view neutral and never claims a missing column', () => {
  const runtime = load({ preference: { stored: false } });
  runtime.advance(15000);
  expect(diagnosis(runtime)).toEqual(NEUTRAL);
  expect(runtime.observers.filter((observer) => observer.active)).toHaveLength(0);
  runtime.atRest();
});

test('pausing the document cancels a pending confirmation instead of claiming through it', () => {
  const runtime = load();
  runtime.advance(50);
  runtime.window.dispatchEvent(new runtime.window.Event('pagehide'));
  expect(diagnosis(runtime)).toEqual(NEUTRAL);
  runtime.advance(15000);
  expect(diagnosis(runtime)).toEqual(NEUTRAL);
  runtime.atRest();
  runtime.window.dispatchEvent(new runtime.window.Event('pageshow'));
  runtime.advance(15000);
  expect(diagnosis(runtime)).toEqual(MISSING);
  runtime.atRest();
});
