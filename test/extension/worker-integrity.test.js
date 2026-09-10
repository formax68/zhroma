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
  COPY, ICON, PACKAGED_ICON_PATHS, TAB_ID, asset, closeWindows, control, createWorld, flip, loadContent,
  loadPopup, loadWorker, settle, statusText,
} from './tracer-world.js';

afterEach(closeWindows);

// --- the two legal replies, and the rogue listener that produces neither ----

/** What a conforming top frame answers `get-status` with. */
const status = (over = {}) => ({ type: 'status', requestId: 0, diagnosis: 'working', reason: null, ...over });

/** What a conforming top frame answers `apply-preference` with. */
const applied = (over = {}) => ({
  type: 'applied', requestId: 0, applied: true, diagnosis: 'working', reason: null, ...over,
});

const legalStatus = (id) => status({ requestId: id });
const legalApplied = (id) => applied({ requestId: id });

/**
 * Push a listener onto the same per-tab list `loadContent` uses, so the worker's
 * `chrome.tabs.sendMessage` is answered by this test rather than by the real
 * content script. Either exchange may be left legal, which is how a test can
 * isolate one path while the other keeps behaving.
 */
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

// --- harness fidelity: the double refuses artwork Chrome would refuse -------

test('the action double refuses an icon path outside the packaged inventory, as Chrome does', async () => {
  const world = createWorld();
  // Chrome rejects `setIcon` for a path the package does not contain. Until the
  // double did the same, a bypassed pairing clause produced an actionLog entry
  // with an undefined icon instead of the review's stated impact — the write
  // failing, its `catch` swallowing the error, and the tab keeping the previous
  // claim about the view.
  await expect(world.workerChrome.action.setIcon({ tabId: TAB_ID, path: 'icons/not-packaged.png' }))
    .rejects.toThrow();
  await expect(world.workerChrome.action.setIcon({ tabId: TAB_ID, path: undefined }))
    .rejects.toThrow();
  // Nothing was recorded: a rejected native call never landed.
  expect(world.actionLog).toEqual([]);
  // Every packaged path is still accepted, so no existing test moves.
  for (const path of PACKAGED_ICON_PATHS) {
    await world.workerChrome.action.setIcon({ tabId: TAB_ID, path });
  }
  expect(world.actionLog.map((entry) => entry.icon)).toEqual([...PACKAGED_ICON_PATHS]);
  expect(world.forbidden).toEqual([]);
});

// --- WR-05: the finite protocol, encoded in five places, must agree ---------

// The maps are IIFE-local and not exported — D-06 forbids a build step, so
// there is no module boundary to import across. They are therefore parsed out
// of the shipped source with `matchAll`, following the icon-inventory idiom
// already in `toolbar-popup.test.js`. A refactor that changes how they are
// written would make the parse find fewer entries, so every parse below
// carries a MINIMUM COUNT: a silently-empty parse fails instead of passing
// vacuously (the WR-01 failure class, applied to this file's own assertions).

/** A single-line `const NAME = [...]` array literal, `null` members included. */
function arrayOf(source, name, minimum) {
  const match = source.match(new RegExp(`const ${name} = \\[([^\\]]*)\\];`));
  if (match === null) throw new Error(`array literal not found in shipped source: ${name}`);
  const members = [...match[1].matchAll(/'([^']*)'|\bnull\b/g)]
    .map(([token, quoted]) => (token === 'null' ? null : quoted));
  expect(members.length, `${name} parsed fewer members than the shipped source declares`)
    .toBeGreaterThanOrEqual(minimum);
  return members;
}

/** A `const NAME = { 'key': 'value', … }` map literal, single or double quoted. */
function mapOf(source, name, minimum) {
  const start = source.indexOf(`const ${name} = {`);
  if (start < 0) throw new Error(`map literal not found in shipped source: ${name}`);
  const end = source.indexOf('\n  };', start);
  if (end < 0) throw new Error(`map literal unterminated in shipped source: ${name}`);
  const entries = [...source.slice(start, end)
    .matchAll(/^ {4}'([^']+)':\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/gm)]
    .map(([, key, single, double]) => [key, single === undefined ? double : single]);
  expect(entries.length, `${name} parsed fewer entries than the shipped source declares`)
    .toBeGreaterThanOrEqual(minimum);
  return new Map(entries);
}

const scalarOf = (source, name) => {
  const match = source.match(new RegExp(`const ${name} = '([^']+)';`));
  if (match === null) throw new Error(`string constant not found in shipped source: ${name}`);
  return match[1];
};

const worker = () => asset('background.js');
const popupSource = () => asset('popup.js');

/** The status half of a `{diagnosis, reason}` key, and the reason half or null. */
const statusPart = (key) => key.split(':')[0];
const reasonPart = (key) => (key.includes(':') ? key.slice(key.indexOf(':') + 1) : null);

// The two values that describe what Zhroma is doing rather than what the view
// is. They are renderable and are deliberately NOT members of `DIAGNOSES`.
const OPERATIONAL = ['off', 'unavailable'];

test('the worker title map and the popup copy map have identical keys and identical text', () => {
  const titles = mapOf(worker(), 'TITLES', 8);
  const copy = mapOf(popupSource(), 'COPY', 8);
  // Named keys, never a bare boolean: taxonomy growth must produce an
  // actionable failure naming the pair that was only half-added.
  expect([...titles.keys()].filter((key) => !copy.has(key))).toEqual([]);
  expect([...copy.keys()].filter((key) => !titles.has(key))).toEqual([]);
  expect([...titles.keys()]
    .filter((key) => copy.has(key) && copy.get(key) !== titles.get(key))
    .map((key) => `${key}: toolbar "${titles.get(key)}" vs popup "${copy.get(key)}"`)).toEqual([]);
});

test('every renderable pair has an icon for its status, and every icon is packaged', () => {
  const titles = mapOf(worker(), 'TITLES', 8);
  const icons = mapOf(worker(), 'ICONS', 6);
  expect([...titles.keys()].filter((key) => !icons.has(statusPart(key)))).toEqual([]);
  // An icon for a status nothing can render is dead artwork; a title whose
  // status has no icon is the half-written toolbar FAIL-05 exists to prevent.
  expect([...icons.keys()].filter((status) => ![...titles.keys()].map(statusPart).includes(status))).toEqual([]);
  expect([...icons.entries()]
    .filter(([, path]) => !PACKAGED_ICON_PATHS.includes(path))
    .map(([status, path]) => `${status}: ${path}`)).toEqual([]);
});

test('every pair is built from the shipped finite sets, and the two encodings of those sets agree', () => {
  const titles = mapOf(worker(), 'TITLES', 8);
  const diagnoses = arrayOf(worker(), 'DIAGNOSES', 4);
  const reasons = arrayOf(worker(), 'REASONS', 4);
  const statuses = arrayOf(popupSource(), 'STATUSES', 6);
  const popupReasons = arrayOf(popupSource(), 'REASONS', 4);

  const renderable = [...diagnoses, ...OPERATIONAL];
  expect([...titles.keys()].filter((key) => !renderable.includes(statusPart(key)))).toEqual([]);
  expect([...titles.keys()].filter((key) => !reasons.includes(reasonPart(key)))).toEqual([]);
  // The popup's own set is the worker's diagnoses plus exactly the two
  // operational values, and nothing else.
  expect([...statuses].sort()).toEqual([...renderable].sort());
  expect(popupReasons).toEqual(reasons);
});

test('the tracer copy map is exactly the set of strings the product ships', () => {
  const shipped = new Set([
    ...mapOf(worker(), 'TITLES', 8).values(),
    ...mapOf(popupSource(), 'COPY', 8).values(),
    scalarOf(popupSource(), 'NOT_SAVED'),
    scalarOf(popupSource(), 'NOT_APPLIED'),
  ]);
  const doubled = new Set(Object.values(COPY));
  // Neither direction may drift: a string the product ships and the double
  // does not means a suite is asserting a retyped literal, and a string the
  // double carries and the product does not is copy nothing can produce.
  expect([...shipped].filter((text) => !doubled.has(text))).toEqual([]);
  expect([...doubled].filter((text) => !shipped.has(text))).toEqual([]);
});

test('an unpaired combination leaves a clean fallback, never a half-written toolbar', async () => {
  const world = createWorld();
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  await settle();
  // A legitimate prior state, so what follows is a state going stale rather
  // than a tab that never had one.
  expect(world.action()).toEqual({ icon: ICON.working, title: COPY.working });
  expect(content.document).toBeDefined();
  const before = world.actionLog.length;

  // The real document is replaced by one answering with a pair that has no
  // title. `missing` and `blank` are each members of their own finite set, so
  // the pairing clause is the only thing standing between this reply and a
  // rendered toolbar.
  world.silenceContent(TAB_ID);
  rogueContent(world, { onStatus: (id) => status({ requestId: id, diagnosis: 'missing', reason: 'blank' }) });
  world.activateTab(TAB_ID);
  await settle();
  await settle();

  expect(world.action()).toEqual({ icon: ICON.neutral, title: COPY.unavailable });
  expect(world.actionLog.length).toBeGreaterThan(before);
  // BOTH halves are needed, and the reason is the asymmetry in the two maps:
  // with the pairing clause deleted, ICONS still has an entry for `missing`
  // alone, so the artwork write SUCCEEDS and it is the TITLE that has no value.
  expect(world.actionLog.filter((entry) => 'title' in entry
    && (entry.title === undefined || entry.title === ''))).toEqual([]);
  expect(world.actionLog.filter((entry) => 'icon' in entry
    && !PACKAGED_ICON_PATHS.includes(entry.icon))).toEqual([]);
  expect(world.forbidden).toEqual([]);
});
