// @vitest-environment node
//
// Upgrade-state proofs (07-07; COMPAT-02, COMPAT-03, DATA-01; D-04, D-27).
//
// An agent who had 0.1.0 installed, or a stranger installing fresh, must see
// and keep exactly what 0.1.0 gave them. Chrome delivers install, update and
// browser-start events whether or not Zhroma listens, and a service worker is
// restarted at Chrome's discretion. None of that may seed, migrate or rewrite
// storage: an absent key means its default, applied on read (D-04), and
// nothing new is stored until a setting really changes.
//
// Every assertion is about bytes that ship: the real worker, content script and
// popup run in the tracer world, and the storage double records every write.
// The real upgrade-in-place check on a Chrome profile is on the Phase 11
// release-candidate checklist (D-28).
import { afterEach, expect, test } from 'vitest';
import {
  COPY, EXTENSION_ID, ICON, POPUP_URL, bootAll, closeWindows, control, loadPopup, loadWorker, markers, settle,
  statusText,
} from './tracer-world.js';

const LABELS = ['Urgent', 'High', 'Normal', 'Low'];

afterEach(closeWindows);

const POPUP_SENDER = Object.freeze({ id: EXTENSION_ID, url: POPUP_URL });

/**
 * What Chrome does to an installed extension after the bytes change: the
 * lifecycle event, a profile start, then the worker is terminated and started
 * again (a restart is the COMPAT-03 idempotency edge). `restartCalls` is every
 * extension API the restarted worker called before anything asked it for
 * anything. A fresh popup is then opened against the restarted worker, so its
 * projection comes from the new epoch.
 */
async function liveThroughUpgrade(world, details) {
  await world.emitInstalled(details);
  await world.emitStartup();
  await settle();
  world.terminateWorker();
  const restarted = loadWorker(world);
  await settle();
  const restartCalls = world.apiLog.filter((entry) => entry.epoch === restarted.epochId).map((entry) => entry.method);
  const popup = loadPopup(world);
  await settle();
  await settle();
  return { popup, restartCalls };
}

// A restarted worker only registers its listeners: no read, no write, no query.
const LISTENERS_ONLY = [
  'chrome.runtime.onMessage.addListener', 'chrome.tabs.onActivated.addListener',
  'chrome.tabs.onUpdated.addListener', 'chrome.tabs.onRemoved.addListener',
];

// --- the tracer: a 0.1.0 agent who switched Zhroma off ---------------------------

test('a 0.1.0 install switched off stays off through the update, a startup and a worker restart, and nothing is written', async () => {
  const { world, content } = await bootAll({ stored: { enabled: false } });
  // Nothing listens for install or startup: the bytes that ship have no
  // lifecycle seeding to run (D-04).
  expect(world.installedListenerCount()).toBe(0);
  expect(world.startupListenerCount()).toBe(0);

  const { popup, restartCalls } = await liveThroughUpgrade(world, { reason: 'update', previousVersion: '0.1.0' });
  expect(restartCalls).toEqual(LISTENERS_ONLY);

  expect(world.writeLog).toEqual([]);
  expect(world.snapshot()).toEqual({ enabled: false });
  expect(world.storageKeys()).toEqual(['enabled']);
  expect(markers(content.document)).toEqual([]);
  expect(world.action()).toEqual({ icon: ICON.off, title: COPY.off });
  expect(statusText(popup.document)).toBe(COPY.off);
  expect(control(popup.document).checked).toBe(false);
  expect(world.installedListenerCount()).toBe(0);
  expect(world.startupListenerCount()).toBe(0);
  expect(world.forbidden).toEqual([]);

  // COMPAT-02: choosing the theme already in effect stores nothing new. The
  // storage still holds only what 0.1.0 wrote.
  const answer = await world.sendToWorker(
    { type: 'set-setting', requestId: 1, key: 'theme', value: 'zhroma-classic' }, POPUP_SENDER,
  );
  await settle();
  expect(answer).toEqual({ type: 'set-setting', requestId: 1, outcome: 'unchanged', revision: null });
  expect(world.writeLog).toEqual([]);
  expect(world.snapshot()).toEqual({ enabled: false });
  expect(world.storageKeys()).toEqual(['enabled']);
  expect(world.forbidden).toEqual([]);
});

// --- every upgrade state (D-27) ---------------------------------------------------

// A fresh install starts with nothing stored. An upgrade from 0.1.0 starts with
// exactly what 0.1.0 could have written: the one boolean, either way.
const STATES = [
  ['a fresh install with nothing stored', null, { reason: 'install' }],
  ['a 0.1.0 install switched off', { enabled: false }, { reason: 'update', previousVersion: '0.1.0' }],
  ['a 0.1.0 install switched on', { enabled: true }, { reason: 'update', previousVersion: '0.1.0' }],
];

test.each(STATES)('%s keeps exactly its storage through the lifecycle event, a startup and a worker restart', async (_name, stored, details) => {
  const start = stored ?? {};
  const bytes = JSON.stringify(start);
  const { world, content } = await bootAll({ stored });

  const { popup, restartCalls } = await liveThroughUpgrade(world, details);

  const enabled = start.enabled !== false;
  expect(world.writeLog).toEqual([]);
  expect(world.snapshot()).toEqual(start);
  expect(JSON.stringify(world.snapshot())).toBe(bytes);
  expect(world.storageKeys()).toEqual(Object.keys(start).sort());
  expect(markers(content.document)).toEqual(enabled ? LABELS : []);
  expect(world.action()).toEqual(enabled ? { icon: ICON.working, title: COPY.working } : { icon: ICON.off, title: COPY.off });
  expect(statusText(popup.document)).toBe(enabled ? COPY.working : COPY.off);
  expect(control(popup.document).checked).toBe(enabled);
  expect(restartCalls).toEqual(LISTENERS_ONLY);
  expect(world.installedListenerCount()).toBe(0);
  expect(world.startupListenerCount()).toBe(0);
  // DATA-01: sync, session and managed are recorded denies in every context,
  // so an empty list means none of them was touched.
  expect(world.forbidden).toEqual([]);

  // COMPAT-02: nothing new is stored until a setting really changes.
  const answer = await world.sendToWorker(
    { type: 'set-setting', requestId: 2, key: 'theme', value: 'zhroma-classic' }, POPUP_SENDER,
  );
  await settle();
  expect(answer).toEqual({ type: 'set-setting', requestId: 2, outcome: 'unchanged', revision: null });
  expect(world.writeLog).toEqual([]);
  expect(JSON.stringify(world.snapshot())).toBe(bytes);
  expect(world.forbidden).toEqual([]);
});

// --- unreadable stored themes on the upgrade path (D-08, COMPAT-04) ---------------

// Values a theme key could hold that no reader of this version accepts: storage
// corruption, a foreign write, or a newer Zhroma the agent downgraded from.
const UNREADABLE_THEMES = [
  ['null', null],
  ['an empty object', {}],
  ['a bare string', 'zhroma-classic'],
  ['a newer version', { v: 99, id: 'from-a-newer-version' }],
];

test.each(UNREADABLE_THEMES)('a stored theme of %s tints as 0.1.0 does through install, a startup and a restart, and storage is byte-identical', async (_name, theme) => {
  const start = { enabled: true, theme };
  const bytes = JSON.stringify(start);
  const { world, content } = await bootAll({ stored: structuredClone(start) });

  const { popup, restartCalls } = await liveThroughUpgrade(world, { reason: 'install' });

  expect(markers(content.document)).toEqual(LABELS);
  expect(world.action()).toEqual({ icon: ICON.working, title: COPY.working });
  expect(statusText(popup.document)).toBe(COPY.working);
  expect(world.writeLog).toEqual([]);
  expect(JSON.stringify(world.snapshot())).toBe(bytes);
  expect(world.storageKeys()).toEqual(['enabled', 'theme']);
  expect(restartCalls).toEqual(LISTENERS_ONLY);
  expect(world.installedListenerCount()).toBe(0);
  expect(world.startupListenerCount()).toBe(0);
  expect(world.forbidden).toEqual([]);
});
