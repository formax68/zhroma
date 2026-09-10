// @vitest-environment node
//
// The worker's and the popup's PAYLOAD validation, driven through actual
// shipped bytes.
//
// 04-REVIEW WR-02: the sender-identity gates are pinned by named negative
// tests, but the clauses those tests reach THROUGH were not. Deleting
// `reply.requestId === requestId`, replacing `requestStatus`'s whole
// shape-and-diagnosis gate with a constant, deleting the pairing clause, and
// deleting the popup's own `validStatus` / `validPreference` gate each left the
// suite green. The suite caught the wrong guard being ADDED and never the right
// one being taken AWAY.
//
// The real `extension/content.js` cannot produce an out-of-set diagnosis, an
// unpaired pair or a wrong request id — that is the point of it. Every illegal
// reply below is therefore produced by a HAND-REGISTERED listener on the same
// seam the real script uses, so the code under test cannot tell the difference.
// No new harness mode is introduced for it.
//
// This file covers the VALIDATION clauses. It does not duplicate
// `toolbar-popup.test.js` (the honest-projection and staleness properties) or
// `popup-recovery.test.js` (the `NOT_SAVED` / `NOT_APPLIED` branches and the
// one-request-at-a-time guard); those suites reach these clauses through.
import { afterEach, expect, test } from 'vitest';
import {
  COPY, ICON, TAB_ID, closeWindows, control, createWorld, flip, loadPopup, loadWorker, settle, statusText,
} from './tracer-world.js';

afterEach(closeWindows);

// --- the two legal replies, and the rogue listener that produces neither ----

/** What a conforming top frame answers `get-status` with. */
const status = (over = {}) => ({ type: 'status', requestId: 0, diagnosis: 'working', reason: null, ...over });

/** What a conforming top frame answers `apply-preference` with. */
const applied = (over = {}) => ({
  type: 'applied', requestId: 0, applied: true, diagnosis: 'working', reason: null, ...over,
});

/**
 * Push a listener onto the same per-tab list `loadContent` uses, so the worker's
 * `chrome.tabs.sendMessage` is answered by this test rather than by the real
 * content script. Either exchange may be left legal, which is how a test can
 * isolate one path while the other keeps behaving.
 */
const legalStatus = (id) => status({ requestId: id });
const legalApplied = (id) => applied({ requestId: id });

function rogueContent(world, { tabId = TAB_ID, onStatus = legalStatus, onApply = legalApplied } = {}) {
  world.contentChromeFor(tabId).runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'get-status') { sendResponse(onStatus(message.requestId)); return true; }
    if (message.type === 'apply-preference') { sendResponse(onApply(message.requestId)); return true; }
    return false;
  });
}

/**
 * A worker-facing listener on the same seam the real service worker uses, so
 * the popup cannot tell the difference. `popup-status` is answered from the
 * arguments; `set-enabled` is handed to the caller, whose reply may be
 * deliberately illegible. Mirrors `popup-recovery.test.js`'s `fakeWorker`.
 */
function fakeWorker(world, { replyStatus = 'working', reason = null, enabled = true, onSetEnabled = null } = {}) {
  world.workerChrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'popup-status') {
      sendResponse({ type: 'popup-status', requestId: message.requestId, status: replyStatus, reason, enabled });
      return true;
    }
    if (message.type !== 'set-enabled') return false;
    sendResponse(onSetEnabled === null
      ? {
        type: 'set-enabled', requestId: message.requestId, saved: true,
        enabled: message.enabled, applied: true, status: replyStatus, reason,
      }
      : onSetEnabled(message));
    return true;
  });
}

// --- the status path --------------------------------------------------------

// Each entry is one clause of `isExact` + `validDiagnosis`, exercised on its
// own. Adding a clause later means adding one row, not a new test.
const STATUS_REFUSALS = [
  ['a request id that is not the one minted', (id) => status({ requestId: id + 1 })],
  ['an extra member beyond the four the gate names', (id) => status({ requestId: id, extra: 1 })],
  ['a missing member', (id) => ({ type: 'status', requestId: id, diagnosis: 'working' })],
  ['a diagnosis outside the finite set', (id) => status({ requestId: id, diagnosis: 'broken' })],
  ['a reason outside the finite set', (id) => status({ requestId: id, reason: 'because' })],
  ['a type member naming the other exchange', (id) => status({ requestId: id, type: 'applied' })],
];

test.each(STATUS_REFUSALS)(
  'a status reply carrying %s is refused, and the tab reports the connection fact',
  async (_name, reply) => {
    const world = createWorld();
    loadWorker(world);
    rogueContent(world, { onStatus: reply });
    world.activateTab(TAB_ID);
    await settle();
    await settle();
    // Neutral artwork and the no-readable-view title: an operational fact about
    // the connection, never a claim about the view (D-04).
    expect(world.action()).toEqual({ icon: ICON.neutral, title: COPY.unavailable });
    const popup = loadPopup(world);
    await settle();
    await settle();
    expect(statusText(popup.document)).toBe(COPY.unavailable);
    expect(world.forbidden).toEqual([]);
  },
);

// --- the apply path ---------------------------------------------------------

// The echoed request id is `requestApply`'s ONLY staleness key: the reply is
// deliberately not generation-guarded, because applying a preference publishes
// a new status and would invalidate the generation the caller is holding.
const APPLY_REFUSALS = [
  ['a request id that is not the one minted', (id) => applied({ requestId: id + 1 })],
  ['an extra member beyond the five the gate names', (id) => applied({ requestId: id, extra: 1 })],
  ['a missing member', (id) => ({ type: 'applied', requestId: id, applied: true, diagnosis: 'working' })],
  ['a diagnosis outside the finite set', (id) => applied({ requestId: id, diagnosis: 'broken' })],
  ['a reason outside the finite set', (id) => applied({ requestId: id, reason: 'because' })],
  ['an applied member that is not a boolean', (id) => applied({ requestId: id, applied: 'yes' })],
  ['a type member naming the other exchange', (id) => applied({ requestId: id, type: 'status' })],
];

test.each(APPLY_REFUSALS)(
  'an apply reply carrying %s is not an outcome, and the popup says so',
  async (_name, reply) => {
    const world = createWorld();
    loadWorker(world);
    // `get-status` stays legal, so the popup starts from a real working state
    // and only the apply exchange is under test.
    rogueContent(world, { onApply: reply });
    const popup = loadPopup(world);
    await settle();
    await settle();
    expect(statusText(popup.document)).toBe(COPY.working);

    await flip(popup, false);
    // The worker refused the reply, so it has no outcome to report and says
    // `unavailable` — the ratified connection line. It does NOT report the
    // not-applied line, which would claim the document answered and declined.
    expect(statusText(popup.document)).toBe(COPY.unavailable);
    expect(world.forbidden).toEqual([]);
  },
);

test('a refused apply reply still persists the preference, because saving is a separate fact', async () => {
  const world = createWorld();
  loadWorker(world);
  rogueContent(world, { onApply: (id) => applied({ requestId: id + 1 }) });
  const popup = loadPopup(world);
  await settle();
  await settle();
  await flip(popup, false);
  // Persistence and application are two facts, reported as two facts: the write
  // happened even though no document confirmed it applied.
  expect(world.getStored('enabled')).toBe(false);
  expect(statusText(popup.document)).toBe(COPY.unavailable);
  expect(world.forbidden).toEqual([]);
});

// --- the popup's own gate, the mirror-image defence -------------------------

test('a worker reply carrying an out-of-set status makes the popup report the connection fact', async () => {
  const world = createWorld();
  fakeWorker(world, { replyStatus: 'broken' });
  const popup = loadPopup(world);
  await settle();
  await settle();
  expect(statusText(popup.document)).toBe(COPY.unavailable);
  // Nothing legible came back, so nothing has been confirmed and the switch has
  // no position to offer.
  expect(control(popup.document).disabled).toBe(true);
  expect(world.forbidden).toEqual([]);
});

test('a worker reply whose preference is neither a boolean nor null is refused by the popup', async () => {
  const world = createWorld();
  fakeWorker(world, { enabled: 'true' });
  const popup = loadPopup(world);
  await settle();
  await settle();
  expect(statusText(popup.document)).toBe(COPY.unavailable);
  expect(control(popup.document).disabled).toBe(true);
  expect(world.forbidden).toEqual([]);
});

test('a legible reply whose status and reason are individually valid but unpaired renders the connection fact', async () => {
  const world = createWorld();
  // `missing` and `blank` are each members of their own finite set, so every
  // membership clause passes; the PAIR has no copy, which is the only thing
  // standing between the agent and an invented diagnosis.
  fakeWorker(world, { replyStatus: 'missing', reason: 'blank' });
  const popup = loadPopup(world);
  await settle();
  await settle();
  expect(statusText(popup.document)).toBe(COPY.unavailable);
  // The preference was legible, so the switch stays in service.
  expect(control(popup.document).disabled).toBe(false);
  expect(world.forbidden).toEqual([]);
});

test('a set-enabled reply carrying an out-of-set status is refused, and the popup claims nothing', async () => {
  const world = createWorld();
  fakeWorker(world, {
    onSetEnabled: (message) => ({
      type: 'set-enabled', requestId: message.requestId, saved: true,
      enabled: message.enabled, applied: true, status: 'broken', reason: null,
    }),
  });
  const popup = loadPopup(world);
  await settle();
  await settle();
  expect(statusText(popup.document)).toBe(COPY.working);

  await flip(popup, false);
  // Nothing legible came back, so nothing may be claimed in either direction.
  expect(statusText(popup.document)).toBe(COPY.notSaved);
  // Reverted to the last value storage actually confirmed, and left operable.
  expect(control(popup.document).checked).toBe(true);
  expect(control(popup.document).disabled).toBe(false);
  expect(world.forbidden).toEqual([]);
});

test('a set-enabled reply whose preference is not a boolean is refused, and the popup claims nothing', async () => {
  const world = createWorld();
  fakeWorker(world, {
    onSetEnabled: (message) => ({
      type: 'set-enabled', requestId: message.requestId, saved: true,
      enabled: 'false', applied: true, status: 'working', reason: null,
    }),
  });
  const popup = loadPopup(world);
  await settle();
  await settle();
  expect(statusText(popup.document)).toBe(COPY.working);

  await flip(popup, false);
  expect(statusText(popup.document)).toBe(COPY.notSaved);
  expect(control(popup.document).checked).toBe(true);
  expect(world.forbidden).toEqual([]);
});
