// @vitest-environment node
//
// The popup's failed-save recovery path, driven through actual shipped bytes.
//
// 04-REVIEW WR-07: the `change` event has already moved `control.checked` to
// the desired value before the request is sent, so on an unconfirmed reply
// "leave the control exactly where the agent last saw it" leaves it at a
// position NOTHING confirmed — an unchecked box beside "Zhroma could not save
// that setting". The control then goes permanently inert for the life of the
// popup and a keyboard agent is dropped into `body` with no recovery.
//
// Every assertion below is about bytes that ship: the real `popup.js` runs in
// its own VM context against the strict fake Chrome from `tracer-world.js`.
// Nothing here reimplements popup behaviour, and no new copy is expected on
// any path — `COPY.notSaved` is the string the user ratified at the Phase 4
// checkpoint (WINDOWS entry 11).
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { afterEach, expect, test } from 'vitest';
import {
  COPY, bootAll, closeWindows, control, createWorld, flip, loadPopup, settle, statusText, wait,
} from './tracer-world.js';

afterEach(closeWindows);

// The shipped deadline, derived from the bytes that ship rather than copied
// into this file, exactly as `failure-seam.test.js` derives the worker's. A
// source edit that moves it moves every assertion below.
const popupSource = readFileSync(new URL('../../extension/popup.js', import.meta.url), 'utf8');
const bound = () => {
  const match = popupSource.match(/const REQUEST_TIMEOUT_MS = (\d+);/);
  if (match === null) throw new Error('Final source setting could not be extracted: REQUEST_TIMEOUT_MS');
  return Number(match[1]);
};

/** The worker's own deadline, read from its shipped bytes for the same reason. */
const workerSource = readFileSync(new URL('../../extension/background.js', import.meta.url), 'utf8');
const workerBound = () => {
  const match = workerSource.match(/const REQUEST_TIMEOUT_MS = (\d+);/);
  if (match === null) throw new Error('Final source setting could not be extracted: REQUEST_TIMEOUT_MS');
  return Number(match[1]);
};

// A test-local patience limit, deliberately NOT a copy of the shipped
// constant: it is the point past which "bounded" stops being a meaningful
// claim. The tie back to the shipped value is asserted separately.
const CEILING = 9000;
// The double's own port-close fallback must outlive that limit, or the double
// closes the channel first and the test proves nothing about the popup.
const PORT_CLOSE = CEILING + 1000;
const SLOW = 20000;

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

/** A reply that never comes: the listener claims the channel and stays silent. */
const WEDGE = Symbol('wedged');

/**
 * A worker-facing listener registered on the same seam the real service worker
 * uses, so the popup cannot tell the difference. It answers `popup-status`
 * with a legible, shape-valid reply — which is how a confirmed value comes to
 * exist at all — and hands `set-enabled` to the caller, whose reply may be
 * deliberately illegible.
 */
function fakeWorker(world, { enabled = true, status = 'working', reason = null, setEnabled = () => WEDGE } = {}) {
  world.workerChrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'popup-status') {
      sendResponse({ type: 'popup-status', requestId: message.requestId, status, reason, enabled });
      return true;
    }
    if (message.type !== 'set-enabled') return false;
    const reply = setEnabled(message);
    if (reply === WEDGE) return true;
    sendResponse(reply);
    return true;
  });
}

/** A reply the popup's shape gate must refuse: three of the seven keys are absent. */
const illegible = ({ requestId }) => ({ type: 'set-enabled', requestId, saved: true, enabled: false });

/**
 * happy-dom does not implement the platform's focus rules for disabled
 * controls: it leaves `activeElement` on a control that has just been
 * disabled, and it will happily focus a disabled one. A real browser blurs a
 * control the moment it becomes disabled, and refuses to focus it while it
 * stays disabled.
 *
 * Without this model an `activeElement` assertion proves nothing here — it
 * would pass against the very defect WR-07 reports. Modelled on the element
 * rather than in the source under test, exactly as the fake Chrome models the
 * platform everywhere else in this suite.
 */
function modelPlatformFocus(popup) {
  const box = control(popup.document);
  let owner = Object.getPrototypeOf(box);
  let descriptor = null;
  while (owner !== null && descriptor === null) {
    descriptor = Object.getOwnPropertyDescriptor(owner, 'disabled');
    owner = Object.getPrototypeOf(owner);
  }
  if (descriptor === null) throw new Error('happy-dom no longer defines a disabled accessor');
  const nativeFocus = box.focus.bind(box);
  Object.defineProperty(box, 'disabled', {
    configurable: true,
    get() { return descriptor.get.call(box); },
    set(value) {
      // Blurred as it becomes disabled, not after: a control that is already
      // disabled is no longer focusable, so the order is the platform's.
      if (value === true && popup.document.activeElement === box) box.blur();
      descriptor.set.call(box, value);
    },
  });
  Object.defineProperty(box, 'focus', {
    configurable: true,
    value() { if (box.disabled !== true) nativeFocus(); },
  });
  return box;
}

/** Requests the popup actually sent — `traffic` also records every reply. */
const sentEnables = (world) => world.traffic
  .filter(({ direction, payload }) => direction === 'to-worker' && payload && payload.type === 'set-enabled');

// --- WR-07: the failed save leaves a truthful, usable switch ----------------

test('an illegible reply returns the switch to the last confirmed value and leaves it operable', async () => {
  const world = createWorld();
  fakeWorker(world, { enabled: true, setEnabled: illegible });
  const popup = loadPopup(world);
  await settle();
  const box = control(popup.document);
  expect(box.checked).toBe(true);
  expect(box.disabled).toBe(false);

  await flip(popup, false);

  // The agent moved the switch and nothing confirmed the move, so what is
  // shown is the last value storage actually reported — not the position the
  // click left behind, which would contradict the copy beside it.
  expect(box.checked).toBe(true);
  expect(statusText(popup.document)).toBe(COPY.notSaved);
  expect(box.disabled).toBe(false);
  expect(world.forbidden).toEqual([]);
});

test('a reply reporting the save failed returns the switch to the value storage still holds', async () => {
  const { world, popup } = await bootAll({ stored: { enabled: true } });
  const box = control(popup.document);
  world.setWriteMode('rejected');

  await flip(popup, false);

  expect(box.checked).toBe(true);
  expect(box.disabled).toBe(false);
  expect(statusText(popup.document)).toBe(COPY.notSaved);
  expect(world.getStored('enabled')).toBe(true);
});

test('a reply reporting the preference unconfirmed returns the switch to the last confirmed value', async () => {
  const { world, popup } = await bootAll({ stored: { enabled: true } });
  const box = control(popup.document);
  world.setReadMode('rejected');

  await flip(popup, false);

  // Storage answered nothing, so nothing may be displayed as confirmed: the
  // switch returns to the last value a read actually delivered, and the copy
  // says plainly that the setting was not saved.
  expect(box.checked).toBe(true);
  expect(box.disabled).toBe(false);
  expect(statusText(popup.document)).toBe(COPY.notSaved);
});

test('a second change after a failed save issues a new request, so the switch is not dead', async () => {
  const world = createWorld();
  let attempts = 0;
  fakeWorker(world, {
    enabled: true,
    setEnabled: (message) => {
      attempts += 1;
      if (attempts === 1) return illegible(message);
      return {
        type: 'set-enabled', requestId: message.requestId, saved: true, enabled: message.enabled,
        applied: true, status: message.enabled ? 'working' : 'off', reason: null,
      };
    },
  });
  const popup = loadPopup(world);
  await settle();
  const box = control(popup.document);

  await flip(popup, false);
  expect(statusText(popup.document)).toBe(COPY.notSaved);
  // Operable is what makes a retry possible at all.
  expect(box.disabled).toBe(false);

  await flip(popup, false);

  expect(attempts).toBe(2);
  expect(sentEnables(world)).toHaveLength(2);
  expect(box.checked).toBe(false);
  expect(statusText(popup.document)).toBe(COPY.off);
});

test('a keyboard agent gets the switch back after a failed save', async () => {
  const world = createWorld();
  fakeWorker(world, { enabled: true, setEnabled: illegible });
  const popup = loadPopup(world);
  const box = modelPlatformFocus(popup);
  await settle();
  box.focus();
  expect(popup.document.activeElement).toBe(box);

  await flip(popup, false);

  // The round trip disabled the switch, which took focus away. It is handed
  // back rather than left in `body` with no way to retry from the keyboard.
  expect(popup.document.activeElement).toBe(box);
  expect(box.disabled).toBe(false);
  expect(statusText(popup.document)).toBe(COPY.notSaved);
});

test('with nothing ever confirmed a failed save shows no position and keeps the control out of service', async () => {
  // No worker is listening at all, so no reply ever delivers a boolean.
  const world = createWorld();
  const popup = loadPopup(world);
  await settle();
  const box = control(popup.document);
  expect(statusText(popup.document)).toBe(COPY.unavailable);
  expect(box.disabled).toBe(true);

  await flip(popup, true);

  // There is no confirmed position to return to, so none is shown. Reverting
  // to `defaultChecked` here would display an unconfirmed OFF after an attempt
  // to turn tinting ON — the same defect in the other direction.
  expect(box.checked).toBe(true);
  expect(box.disabled).toBe(true);
  expect(statusText(popup.document)).toBe(COPY.notSaved);
});

test('a successful save is unchanged, including the click that arrives while one is in flight', async () => {
  const { world, popup } = await bootAll({ stored: { enabled: true } });
  const box = control(popup.document);

  box.checked = false;
  box.dispatchEvent(new popup.window.Event('change', { bubbles: true }));
  // One request at a time: a click arriving while the last is still in flight
  // is dropped rather than queued behind it.
  box.checked = true;
  box.dispatchEvent(new popup.window.Event('change', { bubbles: true }));
  await settle();
  await settle();

  const requests = sentEnables(world);
  expect(requests).toHaveLength(1);
  expect(requests[0].payload.enabled).toBe(false);
  expect(world.getStored('enabled')).toBe(false);
  expect(box.checked).toBe(false);
  expect(box.disabled).toBe(false);
  expect(statusText(popup.document)).toBe(COPY.off);
  expect(world.forbidden).toEqual([]);
});

// --- WR-04, the popup hop: a silent worker costs one bounded wait ----------

test('the popup waits longer than the worker is allowed to, so it cannot cut off a real answer', () => {
  // Answering the popup can cost the worker a full bounded wait of its own: a
  // silent top frame makes `get-status` and `apply-preference` each run to the
  // worker's deadline. A popup deadline at or below the worker's would discard
  // the honest reply — and the confirmed preference it carries — just before
  // it arrived, leaving the switch disabled exactly where 04-08 made it
  // usable. Two processes, two copies of the constant, one ordering; this is
  // where that ordering is enforced.
  expect(bound()).toBeGreaterThan(workerBound());
});

test('a worker that never answers set-enabled costs one bounded wait and the ratified line', async () => {
  const world = createWorld({ portCloseMs: PORT_CLOSE });
  // The status reply lands, so a confirmed value exists; the write request is
  // received and never answered.
  fakeWorker(world, { enabled: true, setEnabled: () => WEDGE });
  const popup = loadPopup(world);
  await settle();
  const box = control(popup.document);
  expect(box.checked).toBe(true);

  box.checked = false;
  box.dispatchEvent(new popup.window.Event('change', { bubbles: true }));
  const elapsed = await until(() => statusText(popup.document) === COPY.notSaved);

  // The switch answered at all: this is the whole of WR-04's popup half.
  expect(elapsed).not.toBeNull();
  // Bounded by the SHIPPED constant, not by the double's port-close fallback.
  expect(elapsed).toBeGreaterThanOrEqual(bound() - 200);
  expect(elapsed).toBeLessThan(bound() * 2);
  // The timeout reaches the corrected failure path: no new copy, no new state.
  expect(box.checked).toBe(true);
  expect(box.disabled).toBe(false);
  expect(world.forbidden).toEqual([]);
}, SLOW);

test('a worker that never answers the opening refresh leaves the control out of service', async () => {
  const world = createWorld({ portCloseMs: PORT_CLOSE });
  // Every request is received and none is ever answered.
  world.workerChrome.runtime.onMessage.addListener(() => true);
  const popup = loadPopup(world);

  const elapsed = await until(() => statusText(popup.document) === COPY.unavailable);

  expect(elapsed).not.toBeNull();
  expect(elapsed).toBeLessThan(bound() * 2);
  // Nothing was confirmed, so no position is shown and no write may originate
  // from an unknown baseline.
  expect(control(popup.document).disabled).toBe(true);
  expect(world.forbidden).toEqual([]);
}, SLOW);

test('a worker that answers normally is not slowed by the deadline', async () => {
  const { world, popup } = await bootAll({ stored: { enabled: true } });
  const box = control(popup.document);
  expect(statusText(popup.document)).toBe(COPY.working);
  expect(box.checked).toBe(true);
  expect(box.disabled).toBe(false);

  const started = Date.now();
  await flip(popup, false);
  const elapsed = Date.now() - started;

  // A normal round trip settles well inside the deadline, so the bound adds
  // latency to nothing that was already answering.
  expect(elapsed).toBeLessThan(bound() / 2);
  expect(statusText(popup.document)).toBe(COPY.off);
  expect(box.checked).toBe(false);
  expect(box.disabled).toBe(false);
  expect(world.forbidden).toEqual([]);
}, SLOW);
