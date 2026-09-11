// @vitest-environment node
// Joint outcomes through shipped worker/content/popup contexts. Synthetic only.
import { afterEach, expect, test } from 'vitest';
import {
  COPY, TAB_ID, TICKET_TOKENS, closeWindows, control, createWorld, flip,
  loadContent, loadPopup, loadWorker, markers, settle, statusText,
} from './tracer-world.js';

afterEach(closeWindows);
const tinted = ['Urgent', 'High', 'Normal', 'Low'];

async function boot(initial) {
  const world = createWorld({ stored: { enabled: initial } });
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  const popup = loadPopup(world);
  await settle();
  control(popup.document).focus();
  return { world, content, popup };
}

function observe({ world, content, popup }) {
  const box = control(popup.document);
  return {
    stored: world.snapshot(), checked: box.checked, disabled: box.disabled,
    indeterminate: box.indeterminate, text: statusText(popup.document),
    markers: markers(content.document), focused: popup.document.activeElement === box,
  };
}

function replyFor(world) {
  const requests = world.traffic.filter(({ direction, payload }) =>
    direction === 'to-worker' && payload.type === 'set-enabled');
  expect(requests).toHaveLength(1);
  const replies = world.traffic.filter(({ direction, payload }) =>
    direction === 'response' && payload.type === 'set-enabled');
  expect(replies).toHaveLength(1);
  expect(replies[0].payload.requestId).toBe(requests[0].payload.requestId);
  expect(world.writeLog).toEqual([{ enabled: requests[0].payload.enabled }]);
  expect(world.forbidden).toEqual([]);
  const wire = JSON.stringify({ traffic: world.traffic, writes: world.writeLog });
  for (const token of TICKET_TOKENS) expect(wire).not.toContain(token);
  return replies[0].payload;
}

for (const initial of [true, false]) {
  for (const mode of ['rejected', 'rejected-with-values', 'throws', 'malformed']) {
    test(`confirmed write from ${initial} survives ${mode} read-back`, async () => {
      const state = await boot(initial);
      const { world } = state;
      if (mode === 'malformed') {
        // Independently malformed API results, without changing persisted bytes.
        for (const chrome of [world.workerChrome, world.contentChrome]) {
          chrome.storage.local.get = (_defaults, callback) => callback({ enabled: 'invalid' });
        }
      } else world.setReadMode(mode);
      await flip(state.popup, !initial);
      expect(replyFor(world)).toMatchObject({ saved: true, enabled: null, applied: false });
      expect(observe(state), '[preference:confirmed-write]').toEqual({
        stored: { enabled: !initial }, checked: !initial, disabled: false,
        indeterminate: false, text: COPY.notApplied, markers: [], focused: true,
      });
    });
  }

  test(`fresh opposite boolean takes precedence over acknowledged intent from ${initial}`, async () => {
    const state = await boot(initial);
    const { world } = state;
    const get = world.workerChrome.storage.local.get.bind(world.workerChrome.storage.local);
    let changed = false;
    world.workerChrome.storage.local.get = (defaults, callback) => {
      // A later physical value (e.g. another worker epoch) before read-back.
      if (!changed) { changed = true; world.setStored('enabled', initial); }
      get(defaults, callback);
    };
    await flip(state.popup, !initial);
    expect(replyFor(world)).toMatchObject({ saved: true, enabled: initial, applied: true });
    expect(observe(state)).toEqual({
      stored: { enabled: initial }, checked: initial, disabled: false,
      indeterminate: false, text: initial ? COPY.working : COPY.off,
      markers: initial ? tinted : [], focused: true,
    });
  });

  for (const mode of ['rejected', 'throws']) {
    test(`definitive ${mode} write from ${initial} preserves preference and retry`, async () => {
      const state = await boot(initial);
      const { world } = state;
      world.setWriteMode(mode);
      await flip(state.popup, !initial);
      expect(replyFor(world)).toMatchObject({ saved: false, enabled: initial });
      expect(observe(state)).toEqual({
        stored: { enabled: initial }, checked: initial, disabled: false,
        indeterminate: false, text: COPY.notSaved,
        markers: initial ? tinted : [], focused: true,
      });
      world.setWriteMode('immediate');
      await flip(state.popup, !initial);
      expect(observe(state)).toEqual({
        stored: { enabled: !initial }, checked: !initial, disabled: false,
        indeterminate: false, text: initial ? COPY.off : COPY.working,
        markers: initial ? [] : tinted, focused: true,
      });
      expect(world.forbidden).toEqual([]);
    });
  }

  for (const mode of ['absent', 'invalid']) {
    test(`saved preference from ${initial} remains visible with ${mode} application reply`, async () => {
      const state = await boot(initial);
      const { world } = state;
      if (mode === 'absent') world.disconnectContent(TAB_ID);
      else {
        const send = world.workerChrome.tabs.sendMessage.bind(world.workerChrome.tabs);
        world.workerChrome.tabs.sendMessage = async (...args) => {
          const answer = await send(...args);
          return args[1].type === 'apply-preference' ? { ...answer, requestId: -1 } : answer;
        };
      }
      await flip(state.popup, !initial);
      expect(replyFor(world)).toMatchObject({ saved: true, enabled: !initial, applied: false, status: 'unavailable' });
      expect(observe(state)).toEqual({
        stored: { enabled: !initial }, checked: !initial, disabled: false,
        indeterminate: false, text: COPY.unavailable,
        markers: initial ? [] : tinted, focused: true,
      });
    });
  }
}
