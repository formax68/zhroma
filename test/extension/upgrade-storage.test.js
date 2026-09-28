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

afterEach(closeWindows);

const POPUP_SENDER = Object.freeze({ id: EXTENSION_ID, url: POPUP_URL });

/**
 * What Chrome does to an installed extension after the bytes change: the
 * lifecycle event, a profile start, then the worker is terminated and started
 * again (a restart is the COMPAT-03 idempotency edge). A fresh popup is opened
 * against the restarted worker so its projection comes from the new epoch.
 */
async function liveThroughUpgrade(world, details) {
  await world.emitInstalled(details);
  await world.emitStartup();
  await settle();
  world.terminateWorker();
  loadWorker(world);
  await settle();
  const popup = loadPopup(world);
  await settle();
  await settle();
  return popup;
}

// --- the tracer: a 0.1.0 agent who switched Zhroma off ---------------------------

test('a 0.1.0 install switched off stays off through the update, a startup and a worker restart, and nothing is written', async () => {
  const { world, content } = await bootAll({ stored: { enabled: false } });
  // Nothing listens for install or startup: the bytes that ship have no
  // lifecycle seeding to run (D-04).
  expect(world.installedListenerCount()).toBe(0);
  expect(world.startupListenerCount()).toBe(0);

  const popup = await liveThroughUpgrade(world, { reason: 'update', previousVersion: '0.1.0' });

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
