// @vitest-environment node
//
// The failure seams, driven through actual shipped bytes.
//
// Three properties this suite exists to keep honest, each of which passed
// 277/277 before it was written (04-REVIEW WR-03, WR-04, WR-10):
//
//   1. A top frame that receives a message and never answers must cost one
//      bounded wait, not the off switch. Every preference write chains behind
//      the pending task, so an unbounded await there leaves the switch
//      inoperative in EVERY tab until Chrome terminates the worker.
//   2. A storage read that fails while still delivering a values object is a
//      failure, never an absence. Both doubles used to model a rejected read as
//      `callback(undefined)`, so the observed dormancy came from the falsy path
//      and the `lastError` branches the source calls load-bearing had no
//      coverage in either process.
//   3. A contract violation inside the double must be RECORDED, not thrown:
//      the worker wraps every Chrome call in try/catch, so a thrown assertion
//      is swallowed by production code and laundered into `unavailable`.
//
// Nothing here reimplements the behaviour it tests. The deadline is read out of
// the shipped source rather than transcribed, so moving the constant moves the
// assertion with it.
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { createContext, Script } from 'node:vm';
import { afterEach, expect, test, vi } from 'vitest';
import { createChromeHarness } from './chrome-harness.js';
import {
  COPY, EXTENSION_ID, ICON, OTHER_TAB_ID, POPUP_URL, TAB_ID,
  asset, closeWindows, control, createWorld, fixture, inertWindow, loadContent, loadPopup, loadWorker,
  markers, settle, statusText, wait,
} from './tracer-world.js';

afterEach(async () => {
  vi.useRealTimers();
  await closeWindows();
});

// The shipped deadline, derived from the bytes that ship rather than copied
// into this file, exactly as `phase-04-live-acceptance.test.js` derives
// `SETTLE_MS`. A source edit that moves it moves every assertion below.
const workerSource = readFileSync(new URL('../../extension/background.js', import.meta.url), 'utf8');
const bound = () => {
  const match = workerSource.match(/const REQUEST_TIMEOUT_MS = (\d+);/);
  if (match === null) throw new Error('Final source setting could not be extracted: REQUEST_TIMEOUT_MS');
  return Number(match[1]);
};

// A test-local patience limit, deliberately NOT a copy of the shipped constant:
// it is the point past which "bounded" stops being a meaningful claim. The tie
// back to the shipped value is asserted separately, after the behaviour is.
const CEILING = 5000;
// The double's own port-close fallback must outlive that patience limit, or the
// double closes the channel first and the test proves nothing about the worker.
const PORT_CLOSE = CEILING + 1000;
const SLOW = 20000;

const POPUP_SENDER = Object.freeze({ id: EXTENSION_ID, url: POPUP_URL });
const TIMED_OUT = Symbol('timed out');

/** Resolve with the promise's value, or `TIMED_OUT`, plus the elapsed wall time. */
async function within(promise, limit) {
  const started = Date.now();
  const value = await Promise.race([promise, wait(limit).then(() => TIMED_OUT)]);
  return { value, elapsed: Date.now() - started };
}

/** Poll until the predicate holds; `null` means it never did within `limit`. */
async function until(predicate, limit = CEILING) {
  const started = Date.now();
  while (Date.now() - started < limit) {
    await settle(2);
    if (predicate()) return Date.now() - started;
    await wait(25);
  }
  return null;
}

/**
 * A top frame that RECEIVES the message and never answers: the listener claims
 * the channel with `true` and no `sendResponse` ever follows. Registered
 * through the exported content seam rather than a new harness mode, so this is
 * a frame the double already models, not a special case invented for a test.
 */
const silentFrame = (world, tabId = TAB_ID) => {
  world.contentChromeFor(tabId).runtime.onMessage.addListener(() => true);
};

// --- WR-04: the worker's two hops are bounded -------------------------------

test('a top frame that never answers apply-preference costs one bounded wait, not the off switch', async () => {
  const world = createWorld({ stored: { enabled: true }, portCloseMs: PORT_CLOSE });
  loadWorker(world);
  silentFrame(world);

  const { value: reply, elapsed } = await within(world.sendToWorker(
    { type: 'set-enabled', requestId: 1, enabled: false }, POPUP_SENDER), CEILING);

  // The switch answered at all: this is the whole of WR-04.
  expect(reply).not.toBe(TIMED_OUT);
  // Three facts, still reported as three facts. The write landed, storage says
  // so, and the document confirmed nothing — none is dressed up as another.
  expect(reply.saved).toBe(true);
  expect(reply.enabled).toBe(false);
  expect(reply.applied).toBe(false);
  expect(reply.status).toBe('unavailable');
  expect(world.getStored('enabled')).toBe(false);
  // Bounded by the SHIPPED constant, not by the double's port-close fallback.
  expect(elapsed).toBeLessThan(bound() * 2);
  expect(elapsed).toBeGreaterThanOrEqual(bound() - 200);
  expect(world.forbidden).toEqual([]);
}, SLOW);

test('a second set-enabled resolves too, so the switch stays operable rather than queueing behind a wedge', async () => {
  const world = createWorld({ stored: { enabled: true }, portCloseMs: PORT_CLOSE });
  loadWorker(world);
  silentFrame(world);

  const first = world.sendToWorker({ type: 'set-enabled', requestId: 1, enabled: false }, POPUP_SENDER);
  const second = world.sendToWorker({ type: 'set-enabled', requestId: 2, enabled: true }, POPUP_SENDER);
  const { value: replies, elapsed } = await within(Promise.all([first, second]), CEILING * 2);

  expect(replies).not.toBe(TIMED_OUT);
  expect(replies[0].saved).toBe(true);
  expect(replies[1].saved).toBe(true);
  expect(replies[1].applied).toBe(false);
  // Arrival order is preserved and the last request is the one that survives.
  expect(world.getStored('enabled')).toBe(true);
  expect(elapsed).toBeLessThan(bound() * 4);
  expect(world.forbidden).toEqual([]);
}, SLOW);

test('a top frame that never answers get-status is unavailable for that tab alone', async () => {
  const world = createWorld({ stored: { enabled: true }, portCloseMs: PORT_CLOSE });
  loadWorker(world);
  world.openTab(OTHER_TAB_ID);
  loadContent(world, { tabId: OTHER_TAB_ID });
  silentFrame(world);
  await settle();

  // Make the silent tab the current one, which is what asks the worker to
  // project it. The other tab already announced itself on load.
  world.activateTab(TAB_ID);
  const elapsed = await until(() => world.action(TAB_ID)?.title === COPY.unavailable);

  expect(elapsed).not.toBeNull();
  expect(elapsed).toBeLessThan(bound() * 2);
  // Operational, never a claim about the view: the neutral shape and the
  // no-readable-view line.
  expect(world.action(TAB_ID)).toEqual({ icon: ICON.neutral, title: COPY.unavailable });
  // A silent frame in one tab says nothing about any other tab.
  expect(world.action(OTHER_TAB_ID)).toEqual({ icon: ICON.working, title: COPY.working });
  expect(world.forbidden).toEqual([]);
}, SLOW);

test('the popup reports the honest ratified line when the frame never answered, and the switch is usable again', async () => {
  const world = createWorld({ stored: { enabled: true }, portCloseMs: PORT_CLOSE });
  loadWorker(world);
  silentFrame(world);
  const popup = loadPopup(world);

  // The opening projection is itself a bounded wait against a silent frame.
  expect(await until(() => statusText(popup.document) === COPY.unavailable)).not.toBeNull();
  const box = control(popup.document);
  expect(box.disabled).toBe(false);

  box.checked = false;
  box.dispatchEvent(new popup.window.Event('change', { bubbles: true }));
  // Completion is observable on the control: the round trip re-enables it and
  // moves it to the value storage actually reported.
  expect(await until(() => box.disabled === false && box.checked === false)).not.toBeNull();

  // Nothing was applied and nothing pretends otherwise. This is already-ratified
  // copy: no new string is minted for the timeout path.
  expect(statusText(popup.document)).toBe(COPY.unavailable);
  expect(world.getStored('enabled')).toBe(false);
  expect(world.forbidden).toEqual([]);
}, SLOW);

// --- WR-03: a failed read is never an absent key ----------------------------

/**
 * The inherited content-script path: the strict harness the tint suites drive,
 * with the shipped classic script evaluated in its own VM context.
 */
function loadContentWithHarness(preference) {
  vi.useFakeTimers();
  const window = inertWindow(fixture());
  const { document } = window;
  const harness = createChromeHarness(preference);
  const observers = [];
  class StartupObserver {
    constructor(callback) { this.callback = callback; this.active = false; observers.push(this); }
    observe() { this.active = true; }
    disconnect() { this.active = false; }
  }
  const context = createContext({
    document, window, chrome: harness.chrome, MutationObserver: StartupObserver, setTimeout, clearTimeout,
  });
  new Script(asset('content.js'), { filename: 'content.js' }).runInContext(context);
  // Chrome resolves the startup read only after the script has finished
  // evaluating, and the shipped script waits out its settle period before it
  // commits to anything.
  harness.flush();
  vi.advanceTimersByTime(100);
  return {
    document,
    harness,
    activeObservers: () => observers.filter((observer) => observer.active),
  };
}

test('a read that fails while still delivering values leaves the content script dormant', () => {
  // The control: the identical values object, delivered WITHOUT a last error,
  // does tint. So the only thing standing between a failed read and default-on
  // is the shipped `lastError` check.
  const working = loadContentWithHarness({ readMode: 'deferred' });
  expect(markers(working.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  working.harness.assertClean();

  const runtime = loadContentWithHarness({ readMode: 'rejected-with-values' });
  expect(markers(runtime.document)).toEqual([]);
  // Dormant, not merely untinted: nothing is left watching for a chance to act
  // on a value nothing confirmed.
  expect(runtime.activeObservers()).toHaveLength(0);
  vi.advanceTimersByTime(15000);
  expect(markers(runtime.document)).toEqual([]);
  runtime.harness.assertClean();
});

test('the harness still refuses a read mode it does not model', () => {
  expect(() => createChromeHarness({ readMode: 'optimistic' })).toThrow(/Unknown readMode/);
});

test('a read that fails while still delivering values leaves the worker preference unconfirmed', async () => {
  const world = createWorld({ stored: { enabled: true }, readMode: 'rejected-with-values' });
  loadWorker(world);
  const content = loadContent(world);
  await settle();

  const reply = await world.sendToWorker({ type: 'popup-status', requestId: 1 }, POPUP_SENDER);

  // `null` is unconfirmed. Reporting `true` here would be a storage error
  // tinting a view the agent may well have switched off.
  expect(reply.enabled).toBe(null);
  // The same failed-but-populated read in the other process, for the same
  // reason: zero markers, from the last-error branch and not the falsy one.
  expect(markers(content.document)).toEqual([]);
}, SLOW);

// --- WR-10: a contract violation is recorded, never thrown ------------------

test('a worker send with a wrong frameId is recorded as a forbidden channel instead of being swallowed', async () => {
  const world = createWorld();
  loadWorker(world);

  let promise;
  // The double must not throw: the worker calls this inside try/catch, so a
  // thrown assertion becomes a plausible-looking `unavailable` instead of a
  // red test.
  expect(() => { promise = world.workerChrome.tabs.sendMessage(TAB_ID, { type: 'get-status', requestId: 1 }, {}); })
    .not.toThrow();
  await expect(promise).rejects.toThrow();
  expect(world.forbidden).toEqual(['worker chrome.tabs.sendMessage frameId']);
});

test('a worker send that carries frameId 0 records nothing', async () => {
  const world = createWorld();
  loadWorker(world);
  loadContent(world);
  await settle();

  await world.workerChrome.tabs.sendMessage(TAB_ID, { type: 'get-status', requestId: 1 }, { frameId: 0 });

  expect(world.forbidden).toEqual([]);
});
