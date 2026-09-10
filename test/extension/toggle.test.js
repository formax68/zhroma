// @vitest-environment node
//
// The off switch, driven through actual shipped bytes. The popup document, the
// service worker and the content script each run in their own VM context and
// talk only through the strict fake Chrome in `tracer-world.js`; nothing here
// reimplements the toggle it is testing.
//
// Simulated delivery is not browser acceptance. A real browser restart, a real
// popup click and the visible disappearance of the tint remain human checks in
// 04-05.
import { afterEach, expect, test } from 'vitest';
import {
  COPY, TAB_ID, TICKET_TOKENS, asset, bootAll, closeWindows, control, createWorld, fixture, loadContent, loadPopup,
  loadWorker, markers, settle, statusText, wait,
} from './tracer-world.js';

afterEach(closeWindows);

/** Operate the switch the way a person does: change the control, let it fire. */
async function flip(popup, value) {
  const box = control(popup.document);
  box.checked = value;
  box.dispatchEvent(new popup.window.Event('change', { bubbles: true }));
  await settle();
  await settle();
}

/** Boot a world with a popup already open on the active tab. */
async function withPopup(options = {}) {
  const booted = await bootAll(options);
  return booted;
}

// --- the switch itself ------------------------------------------------------

test('the popup carries exactly one switch, labelled with the decided text, and it defaults on', async () => {
  const { popup } = await withPopup();
  const { document } = popup;
  const box = control(document);
  // D-11: a status panel plus ONE switch. Not an options page.
  expect(document.querySelectorAll('input')).toHaveLength(1);
  expect(document.querySelectorAll('select, textarea, button, a')).toHaveLength(0);
  expect(box.type).toBe('checkbox');
  const label = document.querySelector('label');
  expect(label.textContent.trim()).toBe('Enable priority tinting');
  // Native labelling, so keyboard and screen-reader behaviour is the browser's.
  expect(label.contains(box) || label.getAttribute('for') === box.id).toBe(true);
  // An absent key means true (the decided global-local default).
  expect(box.checked).toBe(true);
  expect(box.disabled).toBe(false);
  expect(statusText(document)).toBe(COPY.working);
});

test('the switch is inert until the preference has actually been read', async () => {
  const world = createWorld({ stored: null, readMode: 'deferred' });
  loadWorker(world);
  loadContent(world);
  await settle();
  const popup = loadPopup(world);
  // Nothing has confirmed the preference yet, so the popup offers no position
  // to act on and claims no diagnosis.
  expect(control(popup.document).disabled).toBe(true);
  expect(statusText(popup.document)).toBe(COPY.checking);
  world.setReadMode('immediate');
  world.flushReads();
  await settle();
});

// --- CTRL-02 / CTRL-04: off and on, without a refresh -----------------------

test('switching off clears the current view without a reload and persists exactly one boolean', async () => {
  const { world, content, popup } = await withPopup();
  expect(markers(content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  const before = content.document.querySelectorAll('tbody > tr').length;

  await flip(popup, false);

  // No navigation, no reload, no re-render: the same document, minus our marks.
  expect(markers(content.document)).toEqual([]);
  expect(content.document.querySelectorAll('tbody > tr')).toHaveLength(before);
  expect(world.storageKeys()).toEqual(['enabled']);
  expect(world.getStored('enabled')).toBe(false);
  // Exactly one boolean was ever written, and never anything alongside it.
  for (const written of world.writeLog) expect(written).toEqual({ enabled: expect.any(Boolean) });
  expect(control(popup.document).checked).toBe(false);
  expect(statusText(popup.document)).toBe(COPY.off);
  expect(world.forbidden).toEqual([]);
});

test('switching back on restores tint for priorities that changed while it was off', async () => {
  const { world, content, popup } = await withPopup();
  await flip(popup, false);
  expect(markers(content.document)).toEqual([]);

  // The agent keeps working while tinting is off; the view moves on.
  const rows = [...content.document.querySelectorAll('tbody > tr')];
  rows[0].children[6].textContent = 'Low';
  rows[3].children[6].textContent = 'Urgent';
  await settle();
  expect(markers(content.document)).toEqual([]);

  await flip(popup, true);

  // Re-enabling reconciles the CURRENT DOM, not the snapshot it went dark with.
  expect(markers(content.document)).toEqual(['Low', 'High', 'Normal', 'Urgent']);
  expect(world.getStored('enabled')).toBe(true);
  expect(statusText(popup.document)).toBe(COPY.working);
  expect(world.forbidden).toEqual([]);
});

test('the popup sends the value the agent asked for, never an inversion of a stale reading', async () => {
  const { world, popup } = await withPopup();
  await flip(popup, false);
  // A second request for the SAME value is idempotent, not a toggle back on.
  await flip(popup, false);
  await flip(popup, false);
  expect(world.getStored('enabled')).toBe(false);
  for (const written of world.writeLog) expect(written).toEqual({ enabled: false });
});

// --- CTRL-03: persistence across a restart ----------------------------------

test('exactly one enabled key round-trips false and true across a simulated browser restart', async () => {
  const first = await withPopup();
  await flip(first.popup, false);
  const offDisk = first.world.snapshot();
  expect(offDisk).toEqual({ enabled: false });

  // Everything is gone: worker globals, content contexts, the popup document.
  // Only the persisted boolean survives, exactly as a browser restart leaves it.
  const restarted = await bootAll({ stored: offDisk });
  expect(markers(restarted.content.document)).toEqual([]);
  expect(control(restarted.popup.document).checked).toBe(false);
  expect(statusText(restarted.popup.document)).toBe(COPY.off);

  await flip(restarted.popup, true);
  const onDisk = restarted.world.snapshot();
  expect(onDisk).toEqual({ enabled: true });

  const again = await bootAll({ stored: onDisk });
  expect(markers(again.content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(control(again.popup.document).checked).toBe(true);
});

test('a stale startup read cannot re-enable a view the agent has switched off', async () => {
  const world = createWorld({ stored: null, readMode: 'deferred' });
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  expect(world.pendingReadCount()).toBe(1);

  // The popup and the worker operate normally while the content script's own
  // startup read is still in flight.
  world.setReadMode('immediate');
  const popup = loadPopup(world);
  await settle();
  await flip(popup, false);
  expect(world.getStored('enabled')).toBe(false);

  // Now the original default-on read finally lands. It is older than the write
  // and must lose.
  world.flushReads();
  await settle();
  expect(markers(content.document)).toEqual([]);
  expect(world.getStored('enabled')).toBe(false);
});

// --- D-10: the persistent off is not the temporary pause --------------------

test('a user off survives every lifecycle path, and a resume never turns tinting back on', async () => {
  const { world, content, popup } = await withPopup();
  await flip(popup, false);
  const { window, document } = content;

  for (let i = 0; i < 3; i++) {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new window.Event('visibilitychange'));
    await settle(4);
    expect(markers(document)).toEqual([]);
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new window.Event('visibilitychange'));
    await settle(4);
    expect(markers(document)).toEqual([]);
    window.dispatchEvent(new window.Event('pagehide'));
    await settle(4);
    expect(markers(document)).toEqual([]);
    window.dispatchEvent(new window.Event('pageshow'));
    await settle(4);
    expect(markers(document)).toEqual([]);
  }
  expect(world.getStored('enabled')).toBe(false);
  expect(world.forbidden).toEqual([]);
});

test('a temporary pause never turns a stored on into an off, in either direction', async () => {
  const { content, popup, world } = await withPopup();
  const { window, document } = content;
  // On, paused, resumed: the tint comes back without anyone touching storage.
  window.dispatchEvent(new window.Event('pagehide'));
  await settle(4);
  expect(markers(document)).toEqual([]);
  window.dispatchEvent(new window.Event('pageshow'));
  await settle();
  expect(markers(document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(world.writeLog).toEqual([]);

  // Switched off while the document is suspended: resuming honours the new
  // preference rather than the state it froze with.
  window.dispatchEvent(new window.Event('pagehide'));
  await settle(4);
  await flip(popup, false);
  window.dispatchEvent(new window.Event('pageshow'));
  await settle();
  expect(markers(document)).toEqual([]);

  // And switched back on while suspended: resuming restores it.
  await flip(popup, true);
  window.dispatchEvent(new window.Event('pagehide'));
  await settle(4);
  window.dispatchEvent(new window.Event('pageshow'));
  await settle();
  expect(markers(document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
});

// --- honest failure ---------------------------------------------------------

test('a rejected write is reported honestly and the control returns to the value storage still holds', async () => {
  const { world, content, popup } = await withPopup();
  world.setWriteMode('rejected');

  await flip(popup, false);

  expect(statusText(popup.document)).toBe(COPY.notSaved);
  // Nothing was persisted, so nothing may be claimed. The control shows the
  // value storage actually reports, never an invented one.
  expect(world.getStored('enabled')).toBeUndefined();
  expect(control(popup.document).checked).toBe(true);
  expect(markers(content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(world.forbidden).toEqual([]);
});

test('a rejected read after a write refuses to claim a preference it could not confirm', async () => {
  const { world, popup } = await withPopup();
  world.setReadMode('rejected');
  await flip(popup, false);
  expect(statusText(popup.document)).toBe(COPY.notSaved);
  // Unconfirmed is not a position: the switch is taken out of service rather
  // than shown at a value nothing has read back.
  expect(control(popup.document).disabled).toBe(true);
});

test('a permanent marker-removal fault reports application failure, never a cleared tint', async () => {
  const { world, content, popup } = await withPopup();
  for (const row of content.document.querySelectorAll('[data-zhroma-priority]')) {
    Object.defineProperty(row, 'removeAttribute', {
      configurable: true,
      value() { throw new Error('Native attribute removal is unavailable'); },
    });
  }

  await flip(popup, false);

  // The preference genuinely persisted; the page genuinely did not change. Both
  // facts are reported, and neither is dressed up as the other.
  expect(world.getStored('enabled')).toBe(false);
  expect(markers(content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(statusText(popup.document)).toBe(COPY.notApplied);
  expect(control(popup.document).checked).toBe(false);
});

test('no receiver reports the connection while still displaying the true preference', async () => {
  const { world, popup } = await withPopup();
  world.disconnectContent(TAB_ID);
  await flip(popup, false);
  // An operational fact about the connection, never a claim about the view and
  // never a claim that the tab is outside Zendesk.
  expect(statusText(popup.document)).toBe(COPY.unavailable);
  expect(world.getStored('enabled')).toBe(false);
  expect(control(popup.document).checked).toBe(false);
});

// --- input discipline -------------------------------------------------------

test('a repeat request is refused while one is outstanding, and the agent keeps their focus', async () => {
  const { world, popup } = await withPopup({ writeMode: 'deferred' });
  const box = control(popup.document);
  box.focus();
  expect(popup.document.activeElement).toBe(box);

  box.checked = false;
  box.dispatchEvent(new popup.window.Event('change', { bubbles: true }));
  await settle(2);
  expect(box.disabled).toBe(true);
  expect(world.pendingWriteCount()).toBe(1);

  // A second change while the first is in flight must not queue a second write.
  box.checked = true;
  box.dispatchEvent(new popup.window.Event('change', { bubbles: true }));
  await settle(2);
  expect(world.writeLog).toEqual([{ enabled: false }]);

  world.setWriteMode('immediate');
  world.flushWrites();
  await settle();
  await settle();
  expect(box.disabled).toBe(false);
  expect(box.checked).toBe(false);
  expect(popup.document.activeElement).toBe(box);
});

test('closing and reopening the popup reconstructs the switch from storage, not from memory', async () => {
  const { world, popup } = await withPopup();
  await flip(popup, false);
  const reopened = loadPopup(world);
  await settle();
  expect(control(reopened.document).checked).toBe(false);
  expect(statusText(reopened.document)).toBe(COPY.off);
});

// --- the single-writer rule -------------------------------------------------

test('the worker is the only writer: the content script and the popup never touch storage', async () => {
  const { world, popup } = await withPopup();
  await flip(popup, false);
  await flip(popup, true);
  // `tracer-world.js` records a content-side or popup-side storage touch as a
  // forbidden channel, exactly as it records a fetch.
  expect(world.forbidden).toEqual([]);
  expect(asset('popup.js')).not.toContain('chrome.storage');
  expect(asset('content.js')).not.toMatch(/chrome\.storage\.local\.(set|remove|clear)/);
  expect(asset('background.js')).not.toMatch(/chrome\.storage\.(sync|session|managed)/);
});

test('the whole off and on cycle leaves the persisted state a single boolean and no diagnostic residue', async () => {
  const { world, content, popup } = await withPopup();
  for (const value of [false, true, false, true]) await flip(popup, value);
  await wait(250);
  await settle();
  expect(world.snapshot()).toEqual({ enabled: true });
  expect(markers(content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  // No ticket value, DOM text or error string ever reached storage or the wire.
  const wire = JSON.stringify({ traffic: world.traffic, writes: world.writeLog });
  for (const token of TICKET_TOKENS) expect(wire, token).not.toContain(token);
});

test('the content script applies the persisted value rather than any value pushed at it', async () => {
  const world = createWorld();
  loadWorker(world);
  const content = loadContent(world, { html: fixture() });
  await settle();
  expect(markers(content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  // A spoofed apply request carries no desired value at all, so it cannot set
  // one: the content script re-reads storage and finds the tint still on.
  const reply = await world.workerChrome.tabs.sendMessage(
    TAB_ID, { type: 'apply-preference', requestId: 1 }, { frameId: 0 },
  );
  expect(reply).toEqual({ type: 'applied', requestId: 1, applied: true, diagnosis: 'working', reason: null });
  expect(markers(content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(asset('content.js')).not.toMatch(/message\.enabled|message\.value/);
});
