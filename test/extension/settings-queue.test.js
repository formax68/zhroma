// @vitest-environment node
//
// The worker settings queue (07-04, D-05, D-11, D-13, D-14, D-16).
//
// The worker is the single, serial, validated writer of every setting other
// than the off switch. These tests drive the shipped bytes: the worker through
// the tracer world, and the pure queue factory from zhroma-settings.js loaded
// into a bare context with test-only keys the shipped registry does not have.
import { afterEach, expect, test, vi } from 'vitest';
import { EXTENSION_ID, POPUP_URL, closeWindows, createWorld, loadContent, loadWorker, settle } from './tracer-world.js';

afterEach(async () => { vi.useRealTimers(); await closeWindows(); });

const POPUP_SENDER = Object.freeze({ id: EXTENSION_ID, url: POPUP_URL });
const CLASSIC = 'zhroma-classic';
const STORED_CLASSIC = Object.freeze({ v: 1, id: CLASSIC });
const themeMessage = (requestId, value = CLASSIC) => ({ type: 'set-setting', requestId, key: 'theme', value });
const reply = (requestId, outcome, revision = null) => ({ type: 'set-setting', requestId, outcome, revision });

async function boot(options) {
  const world = createWorld(options);
  loadWorker(world);
  loadContent(world);
  await settle();
  return world;
}

// --- the tracer: a theme choice from the popup reaches storage.local -----------

test('a theme choice from the popup over an unreadable stored theme is validated, written once to storage.local and announced', async () => {
  const world = await boot({ stored: { enabled: true, theme: { v: 99, id: 'from-a-newer-version' } } });
  const announced = [];
  world.workerChrome.storage.onChanged.addListener((changes, areaName) => { announced.push({ changes, areaName }); });

  const answer = await world.sendToWorker(themeMessage(1), POPUP_SENDER);
  await settle();

  expect(answer).toEqual(reply(1, 'saved'));
  expect(world.getStored('theme')).toEqual(STORED_CLASSIC);
  expect(world.writeLog).toEqual([{ theme: STORED_CLASSIC }]);
  expect(announced).toEqual([{
    changes: { theme: { oldValue: { v: 99, id: 'from-a-newer-version' }, newValue: STORED_CLASSIC } }, areaName: 'local',
  }]);
  expect(world.getStored('enabled')).toBe(true);
  expect(world.forbidden).toEqual([]);
});

test('re-selecting Classic on a fresh install writes nothing and answers unchanged (D-11)', async () => {
  const world = await boot();
  const answer = await world.sendToWorker(themeMessage(2), POPUP_SENDER);
  await settle();
  expect(answer).toEqual(reply(2, 'unchanged'));
  expect(world.writeLog).toEqual([]);
  expect(world.storageKeys()).toEqual([]);
  expect(world.forbidden).toEqual([]);
});

test('re-selecting Classic over a stored Classic writes nothing and answers unchanged (D-11)', async () => {
  const world = await boot({ stored: { theme: { v: 1, id: CLASSIC } } });
  const answer = await world.sendToWorker(themeMessage(3), POPUP_SENDER);
  await settle();
  expect(answer).toEqual(reply(3, 'unchanged'));
  expect(world.writeLog).toEqual([]);
  expect(world.snapshot()).toEqual({ theme: STORED_CLASSIC });
  expect(world.forbidden).toEqual([]);
});
