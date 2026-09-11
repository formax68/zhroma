// @vitest-environment node
// Joint outcomes through shipped worker/content/popup contexts. Synthetic only.
import { afterEach, expect, test, vi } from 'vitest';
import {
  COPY, TAB_ID, TICKET_TOKENS, closeWindows, control, createWorld, flip,
  loadContent, loadPopup, loadWorker, markers, settle, statusText,
} from './tracer-world.js';

afterEach(async () => { vi.useRealTimers(); await closeWindows(); });
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

// Fake time controls native hops independently; the port fallback is deliberately
// later than both shipped deadlines. Assertions inspect the actual worker answer.
async function timedBoot(initial) {
  vi.useFakeTimers();
  const world = createWorld({ stored: { enabled: initial }, portCloseMs: 20000 });
  loadWorker(world);
  const content = loadContent(world);
  await vi.advanceTimersByTimeAsync(250);
  const popup = loadPopup(world);
  await vi.advanceTimersByTimeAsync(50);
  return { world, content, popup };
}
function change(popup, value) {
  control(popup.document).checked = value;
  control(popup.document).dispatchEvent(new popup.window.Event('change'));
}
const answered = (world, type = 'set-enabled') => world.traffic.filter((entry) =>
  entry.direction === 'response' && entry.payload.type === type);

test('admission overflow in an opposite popup never confirms an obsolete position', async () => {
  const { world, popup } = await timedBoot(true);
  const opposite = loadPopup(world);
  await vi.advanceTimersByTimeAsync(50);
  world.setWriteMode('deferred');
  change(popup, false);
  const burst = Array.from({ length: 31 }, (_, i) => world.popupChrome.runtime.sendMessage({
    type: 'set-enabled', requestId: 100 + i, enabled: Boolean(i % 2),
  }));
  await vi.advanceTimersByTimeAsync(10);
  const arrival = Date.now();
  change(opposite, false);
  await vi.advanceTimersByTimeAsync(10);
  const overflow = answered(world).find((entry) => entry.at >= arrival);
  expect(overflow?.payload, '[outcome:admission-overflow]').toMatchObject({ saved: false, enabled: null });
  expect(control(opposite.document).indeterminate, '[outcome:pending-write-invalidates-old-confirmation]').toBe(true);
  expect(control(opposite.document).disabled).toBe(true);
  await vi.advanceTimersByTimeAsync(4010);
  const replies = await Promise.all(burst);
  expect(replies.every((reply) => reply.saved === false)).toBe(true);
  world.flushWrites(); world.setWriteMode('immediate');
  await vi.advanceTimersByTimeAsync(50);
  expect(world.writeLog, '[outcome:expired-request-dispatch]').toEqual([{ enabled: false }]);
  opposite.window.dispatchEvent(new opposite.window.Event('focus'));
  await vi.advanceTimersByTimeAsync(50);
  change(opposite, true);
  await vi.advanceTimersByTimeAsync(100);
  expect(world.snapshot()).toEqual({ enabled: true });
  expect(Math.max(...world.writeObservations), '[outcome:physical-write-overlap]').toBe(1);
});

test('opening refresh excludes changes and captured late reply cannot overwrite fresh recovery', async () => {
  const { world } = await timedBoot(true);
  world.hold('popup-response');
  const popup = loadPopup(world);
  await vi.advanceTimersByTimeAsync(50);
  change(popup, false);
  popup.window.dispatchEvent(new popup.window.Event('focus'));
  await vi.advanceTimersByTimeAsync(50);
  expect(world.writeLog, '[outcome:opening-refresh-excludes-change]').toEqual([]);
  await vi.advanceTimersByTimeAsync(5000);
  expect(statusText(popup.document)).toBe(COPY.unknown);
  world.unhold('popup-response');
  popup.window.dispatchEvent(new popup.window.Event('focus'));
  await vi.advanceTimersByTimeAsync(50);
  change(popup, false);
  await vi.advanceTimersByTimeAsync(100);
  world.release('popup-response');
  await vi.advanceTimersByTimeAsync(50);
  expect(control(popup.document).checked, '[outcome:stale-refresh-overwrite]').toBe(false);
  expect(statusText(popup.document)).toBe(COPY.off);
  expect(world.snapshot()).toEqual({ enabled: false });
});

test('a captured old change response cannot replace a newer popup result', async () => {
  const { world, popup } = await timedBoot(true);
  world.hold('popup-response');
  change(popup, false);
  await vi.advanceTimersByTimeAsync(5010);
  expect(answered(world)[0].payload.saved).toBe(true);
  expect(statusText(popup.document), '[outcome:transport-is-unknown]').toBe(COPY.unknown);
  world.unhold('popup-response');
  popup.window.dispatchEvent(new popup.window.Event('focus'));
  await vi.advanceTimersByTimeAsync(50);
  change(popup, true);
  await vi.advanceTimersByTimeAsync(100);
  world.release('popup-response');
  await vi.advanceTimersByTimeAsync(50);
  expect(statusText(popup.document), '[outcome:late-change-overwrite]').toBe(COPY.working);
  expect(control(popup.document).checked).toBe(true);
});

test('sequential waits spend one arrival budget rather than renewing every hop', async () => {
  const { world, popup } = await timedBoot(true);
  world.hold('worker-read'); world.hold('query');
  const start = Date.now();
  change(popup, false);
  await vi.advanceTimersByTimeAsync(1800);
  world.unhold('worker-read'); world.release('worker-read');
  await vi.advanceTimersByTimeAsync(1800);
  world.unhold('query'); world.release('query');
  world.hold('content-response');
  await vi.advanceTimersByTimeAsync(410);
  const response = answered(world)[0];
  expect(response.at - start, '[outcome:sequential-budget]').toBeLessThanOrEqual(4001);
  expect(response.payload).toMatchObject({ saved: true, enabled: false, applied: false });
  expect(control(popup.document).checked).toBe(false);
  expect(control(popup.document).disabled).toBe(false);
  world.unhold('content-response'); world.release('content-response');
  await vi.advanceTimersByTimeAsync(22000);
  expect(vi.getTimerCount()).toBe(0);
});

test('healthy arrival burst stores each explicit value in order without overlap', async () => {
  const { world } = await timedBoot(true);
  const values = [false, true, false, false, true, false];
  const requests = values.map((enabled, i) => world.popupChrome.runtime.sendMessage({
    type: 'set-enabled', requestId: 100 + i, enabled,
  }));
  await vi.advanceTimersByTimeAsync(500);
  const replies = await Promise.all(requests);
  expect(replies.map((reply) => reply.requestId)).toEqual(values.map((_, i) => 100 + i));
  expect(replies.every((reply) => reply.saved)).toBe(true);
  expect(world.writeLog, '[outcome:arrival-order]').toEqual(values.map((enabled) => ({ enabled })));
  expect(world.snapshot()).toEqual({ enabled: false });
  expect(Math.max(...world.writeObservations), '[outcome:physical-write-overlap]').toBe(1);
});

for (const initial of [true, false]) for (const write of ['immediate', 'rejected', 'throws', 'deferred']) {
  for (const read of ['immediate', 'rejected', 'rejected-with-values', 'malformed', 'deferred']) {
    for (const apply of ['success', 'negative', 'invalid', 'silent']) {
      test(`joint table ${initial} write=${write} read=${read} apply=${apply}`, async () => {
        const { world, popup, content } = await timedBoot(initial);
        world.setWriteMode(write);
        world.setReadMode(read, 'worker');
        const send = world.workerChrome.tabs.sendMessage.bind(world.workerChrome.tabs);
        world.workerChrome.tabs.sendMessage = (...args) => {
          const response = send(...args);
          if (args[1].type !== 'apply-preference') return response;
          if (apply === 'silent') { response.catch(() => {}); return new Promise(() => {}); }
          return response.then((reply) => apply === 'negative' ? { ...reply, applied: false }
            : apply === 'invalid' ? { ...reply, requestId: -1 } : reply);
        };
        change(popup, !initial);
        await vi.advanceTimersByTimeAsync(4010);
        const reply = answered(world)[0]?.payload;
        const saved = write === 'deferred' ? null : write === 'immediate';
        const persisted = saved === true ? !initial : initial;
        const readable = read === 'immediate' && saved !== null;
        const applied = saved !== null && read !== 'deferred' && apply === 'success';
        expect(reply, '[outcome:joint-table-fields]').toMatchObject({ saved,
          enabled: readable ? persisted : null, applied });
        expect(world.snapshot()).toEqual({ enabled: persisted });
        expect(markers(content.document)).toEqual(persisted ? tinted : []);
        const box = control(popup.document);
        const mixed = saved === null || (saved === false && !readable);
        expect(box.indeterminate, '[outcome:joint-table-certainty]').toBe(mixed);
        expect(box.disabled).toBe(mixed);
        if (!mixed) expect(box.checked, '[outcome:confirmed-write-checkbox]').toBe(persisted);
        const copy = saved === null ? COPY.unknown : saved === false ? COPY.notSaved
          : read === 'deferred' || ['silent', 'invalid'].includes(apply) ? COPY.unavailable
          : apply === 'negative' ? COPY.notApplied : persisted ? COPY.working : COPY.off;
        expect(statusText(popup.document), '[outcome:joint-table-copy]').toBe(copy);
        world.setReadMode('immediate', 'worker'); world.flushReads(); world.flushWrites();
        await vi.advanceTimersByTimeAsync(22000);
        expect(world.forbidden).toEqual([]);
        expect(Math.max(...world.writeObservations, 0), '[outcome:physical-write-overlap]').toBeLessThanOrEqual(1);
        expect(vi.getTimerCount()).toBe(0);
      });
    }
  }
}

for (const initial of [true, false]) {
  for (const stage of ['worker-read', 'query', 'icon', 'title']) {
    test(`absolute admission deadline from ${initial} with independently parked ${stage}`, async () => {
      const { world, popup } = await timedBoot(initial);
      world.hold(stage);
      const start = Date.now();
      if (stage === 'icon' || stage === 'title') popup.window.dispatchEvent(new popup.window.Event('focus'));
      else change(popup, !initial);
      await vi.advanceTimersByTimeAsync(4010);
      const responses = answered(world, stage === 'icon' || stage === 'title' ? 'popup-status' : 'set-enabled')
        .filter((entry) => entry.at >= start);
      expect(responses.length, `[outcome:deadline-${stage}-${initial}]`).toBeGreaterThan(0);
      expect(responses[0].at - start, '[outcome:operation-wide-deadline]').toBeLessThanOrEqual(4001);
      if (stage === 'worker-read' || stage === 'query') {
        expect(responses[0].payload.saved).toBe(true);
        expect(control(popup.document).checked, '[outcome:confirmed-write-checkbox]').toBe(!initial);
        expect(control(popup.document).disabled).toBe(false);
      }
      world.unhold(stage); world.release(stage);
      await vi.advanceTimersByTimeAsync(22000);
      expect(world.forbidden).toEqual([]);
      expect(vi.getTimerCount(), '[outcome:timer-drain]').toBe(0);
    });
  }
  for (const mode of ['deferred', 'callback-held']) {
    test(`native ${mode} from ${initial} remains unknown through expiry and fresh recovery`, async () => {
      const { world, popup } = await timedBoot(initial);
      world.setWriteMode(mode);
      const start = Date.now();
      change(popup, !initial);
      await vi.advanceTimersByTimeAsync(10);
      const queued = world.popupChrome.runtime.sendMessage({ type: 'set-enabled', requestId: 999, enabled: initial });
      await vi.advanceTimersByTimeAsync(4010);
      expect(answered(world)[0]?.payload.saved, '[outcome:false-timeout-failure]').toBe(null);
      expect(answered(world)[0].at - start).toBeLessThanOrEqual(4001);
      expect(await queued).toMatchObject({ saved: false, enabled: null });
      expect(world.writeLog, '[outcome:expired-request-dispatch]').toHaveLength(1);
      expect(Math.max(...world.writeObservations), '[outcome:physical-write-overlap]').toBe(1);
      expect(statusText(popup.document)).toBe(COPY.unknown);
      expect(control(popup.document).indeterminate).toBe(true);
      expect(control(popup.document).disabled).toBe(true);
      expect(world.snapshot()).toEqual({ enabled: mode === 'deferred' ? initial : !initial });
      const reopened = loadPopup(world);
      await vi.advanceTimersByTimeAsync(50);
      expect(control(reopened.document).indeterminate, '[outcome:pending-reopen-mixed]').toBe(true);
      world.commitWrites();
      await vi.advanceTimersByTimeAsync(50);
      reopened.window.dispatchEvent(new reopened.window.Event('focus'));
      await vi.advanceTimersByTimeAsync(50);
      expect(control(reopened.document).indeterminate, '[outcome:commit-is-not-callback]').toBe(true);
      world.releaseWriteCallbacks(); world.setWriteMode('immediate');
      await vi.advanceTimersByTimeAsync(50);
      reopened.window.dispatchEvent(new reopened.window.Event('focus'));
      await vi.advanceTimersByTimeAsync(50);
      expect(control(reopened.document).checked).toBe(!initial);
      expect(control(reopened.document).disabled).toBe(false);
      change(reopened, initial);
      await vi.advanceTimersByTimeAsync(100);
      expect(world.snapshot()).toEqual({ enabled: initial });
      expect(world.writeLog).toEqual([{ enabled: !initial }, { enabled: initial }]);
      await vi.advanceTimersByTimeAsync(22000);
      expect(world.forbidden).toEqual([]);
      expect(vi.getTimerCount()).toBe(0);
    });
  }
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
  test(`confirmed write from ${initial} with unreadable worker read and successful application`, async () => {
    const state = await boot(initial);
    state.world.workerChrome.storage.local.get = (_defaults, callback) => callback({ enabled: 'invalid' });
    await flip(state.popup, !initial);
    expect(replyFor(state.world)).toMatchObject({ saved: true, enabled: null, applied: true });
    expect(observe(state), '[preference:acknowledged-operation]').toEqual({
      stored: { enabled: !initial }, checked: !initial, disabled: false,
      indeterminate: false, text: initial ? COPY.off : COPY.working,
      markers: initial ? [] : tinted, focused: true,
    });
  });

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
