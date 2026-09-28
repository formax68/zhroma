// @vitest-environment node
//
// The worker settings queue (07-04, D-05, D-11, D-13, D-14, D-16).
//
// The worker is the single, serial, validated writer of every setting other
// than the off switch. These tests drive the shipped bytes: the worker through
// the tracer world, and the pure queue factory from zhroma-settings.js loaded
// into a bare context with test-only keys the shipped registry does not have.
import { createContext, Script } from 'node:vm';
import { afterEach, expect, test, vi } from 'vitest';
import {
  EXTENSION_ID, NAMESPACE, POPUP_URL, asset, closeWindows, createWorld, loadContent, loadWorker, settle,
} from './tracer-world.js';

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

// --- the pure queue, with test-only keys (D-16) --------------------------------

const SOURCE = asset('zhroma-settings.js');
function loadSettings() {
  const context = createContext({}, { codeGeneration: { strings: false, wasm: false } });
  new Script(SOURCE, { filename: 'zhroma-settings.js' }).runInContext(context);
  return context[NAMESPACE].settings;
}
const onlyKey = (payload, name) => Object.keys(payload).length === 1 && Object.hasOwn(payload, name);
// A last-writer-wins key with two valid values; 'a' is its default.
const SAMPLE = Object.freeze({
  key: 'sample', version: 1, cas: false, maxBytes: 64, defaultValue: 'a',
  parse: (payload) => (onlyKey(payload, 'id') && ['a', 'b'].includes(payload.id) ? payload.id : undefined),
  fields: (value) => ({ id: value }), migrations: {},
});
// A compare-and-swap key holding free text under a small size cap.
const DRAFT = Object.freeze({
  key: 'draft', version: 1, cas: true, maxBytes: 64, defaultValue: '',
  parse: (payload) => (onlyKey(payload, 'text') && typeof payload.text === 'string' ? payload.text : undefined),
  fields: (value) => ({ text: value }), migrations: {},
});
const TIMEOUT = 1000;
const copy = (value) => JSON.parse(JSON.stringify(value));

// A hand-driven rig: storage, reads and writes the test settles itself, a
// manual clock, and a record of every reply and of concurrent physical writes.
function rig({ stored = {}, holdReads = false, holdWrites = false, maxPending = 32, read, write } = {}) {
  const settings = loadSettings();
  const registry = settings.define([...settings.ENTRIES, SAMPLE, DRAFT]);
  const store = new Map(Object.entries(stored));
  const readLog = [];
  const writeLog = [];
  const heldReads = [];
  const heldWrites = [];
  const concurrency = [];
  const replies = [];
  const admitted = [];
  let inFlight = 0;
  let clock = 0;
  const timers = new Set();
  const doRead = read ?? ((key) => new Promise((resolve) => {
    readLog.push(key);
    const finish = () => resolve({ ok: true, present: store.has(key), raw: store.has(key) ? copy(store.get(key)) : undefined });
    if (holdReads) heldReads.push(finish); else finish();
  }));
  const doWrite = write ?? ((key, stored) => new Promise((resolve) => {
    writeLog.push({ [key]: copy(stored) });
    inFlight += 1;
    concurrency.push(inFlight);
    const finish = (ok = true) => { inFlight -= 1; if (ok) store.set(key, copy(stored)); resolve(ok); };
    if (holdWrites) heldWrites.push(finish); else finish();
  }));
  const queue = settings.createQueue({
    registry, read: doRead, write: doWrite, timeoutMs: TIMEOUT, maxPending,
    setTimer: (callback, ms) => { const timer = { at: clock + ms, callback }; timers.add(timer); return timer; },
    clearTimer: (timer) => { timers.delete(timer); },
    now: () => clock,
  });
  return {
    settings, queue, store, readLog, writeLog, concurrency, replies,
    admit(request) {
      admitted.push(request.requestId);
      queue.admit(request, (answer) => { replies.push(copy(answer)); });
    },
    advance(ms) {
      clock += ms;
      for (const timer of [...timers].sort((a, b) => a.at - b.at)) {
        if (timer.at <= clock && timers.delete(timer)) timer.callback();
      }
    },
    releaseRead() { heldReads.shift()(); },
    releaseWrite(ok = true) { heldWrites.shift()(ok); },
    heldWriteCount: () => heldWrites.length,
    heldReadCount: () => heldReads.length,
    /** Exactly one reply per admitted request, whatever else happened. */
    assertOneReplyEach() {
      expect(replies.map((answer) => answer.requestId).sort((a, b) => a - b)).toEqual([...admitted].sort((a, b) => a - b));
    },
  };
}
const sample = (requestId, value) => ({ requestId, key: 'sample', value });
const draft = (requestId, value, revision) => ({ requestId, key: 'draft', value, revision });
const storedSample = (id) => ({ v: 1, id });
const storedDraft = (rev, text) => ({ v: 1, rev, text });

test('the shipped module exposes the six outcomes and a queue factory', () => {
  const settings = loadSettings();
  expect([...settings.OUTCOMES]).toEqual(['saved', 'unchanged', 'rejected', 'conflict', 'failed', 'unknown']);
  expect(Object.isFrozen(settings.OUTCOMES)).toBe(true);
  expect(typeof settings.createQueue).toBe('function');
  // The shipped registry still has only theme: the test keys are injected.
  expect([...settings.registry.keys]).toEqual(['theme']);
});

test('three back-to-back writes are applied in arrival order with no overlapping physical write', async () => {
  const world = rig({ holdWrites: true });
  world.admit(sample(1, 'b'));
  world.admit(sample(2, 'a'));
  world.admit(sample(3, 'b'));
  await settle();
  expect(Math.max(...world.concurrency), '[mutant:settings-queue-serial]').toBe(1);
  expect(world.heldWriteCount()).toBe(1);
  for (let index = 0; index < 3; index += 1) {
    world.releaseWrite();
    await settle();
    expect(Math.max(...world.concurrency), '[mutant:settings-queue-serial]').toBe(1);
  }
  expect(world.writeLog).toEqual([{ sample: storedSample('b') }, { sample: storedSample('a') }, { sample: storedSample('b') }]);
  expect(world.replies).toEqual([reply(1, 'saved'), reply(2, 'saved'), reply(3, 'saved')]);
  expect(world.store.get('sample')).toEqual(storedSample('b'));
  world.assertOneReplyEach();
});

test('the next job waits for the previous physical write even after that requester was answered unknown', async () => {
  const world = rig({ holdWrites: true });
  world.admit(sample(1, 'b'));
  await settle();
  world.advance(600);
  world.admit(sample(2, 'a'));
  await settle();
  // The first job's deadline passes while its write is in flight.
  world.advance(400);
  await settle();
  // Nothing else may touch storage while the issued write owns the writer.
  expect(world.readLog, '[mutant:settings-writer-ownership]').toEqual(['sample']);
  expect(world.replies, '[mutant:settings-writer-ownership]').toEqual([reply(1, 'unknown')]);
  expect(world.heldWriteCount()).toBe(1);
  // The write lands after its requester stopped listening; only then does the
  // second job read, and it sees what landed.
  world.releaseWrite();
  await settle();
  expect(world.readLog).toEqual(['sample', 'sample']);
  expect(world.heldWriteCount()).toBe(1);
  world.releaseWrite();
  await settle();
  expect(world.replies).toEqual([reply(1, 'unknown'), reply(2, 'saved')]);
  expect(world.writeLog).toEqual([{ sample: storedSample('b') }, { sample: storedSample('a') }]);
  expect(Math.max(...world.concurrency)).toBe(1);
  world.assertOneReplyEach();
});

test('the value already in effect writes nothing, and switching back to the default writes it explicitly (D-11)', async () => {
  const absent = rig();
  absent.admit(sample(1, 'a'));
  await settle();
  expect(absent.replies, '[mutant:settings-skip-unchanged]').toEqual([reply(1, 'unchanged')]);
  expect(absent.writeLog, '[mutant:settings-skip-unchanged]').toEqual([]);
  expect(absent.store.has('sample')).toBe(false);

  const same = rig({ stored: { sample: storedSample('b') } });
  same.admit(sample(2, 'b'));
  await settle();
  expect(same.replies, '[mutant:settings-skip-unchanged]').toEqual([reply(2, 'unchanged')]);
  expect(same.writeLog, '[mutant:settings-skip-unchanged]').toEqual([]);

  const back = rig({ stored: { sample: storedSample('b') } });
  back.admit(sample(3, 'a'));
  await settle();
  expect(back.replies).toEqual([reply(3, 'saved')]);
  expect(back.writeLog).toEqual([{ sample: storedSample('a') }]);
  expect(back.store.get('sample')).toEqual(storedSample('a'));
  for (const each of [absent, same, back]) each.assertOneReplyEach();
});

test('a chosen value is saved over an unreadable stored value, even when its id matches (D-08)', async () => {
  const world = rig({ stored: { sample: { v: 99, id: 'b' } } });
  world.admit(sample(1, 'b'));
  await settle();
  expect(world.replies).toEqual([reply(1, 'saved')]);
  expect(world.writeLog).toEqual([{ sample: storedSample('b') }]);
  const other = rig({ stored: { sample: 'not an object' } });
  other.admit(sample(2, 'a'));
  await settle();
  expect(other.replies).toEqual([reply(2, 'saved')]);
  expect(other.writeLog).toEqual([{ sample: storedSample('a') }]);
  world.assertOneReplyEach();
  other.assertOneReplyEach();
});

test('a cas key saves with revision + 1 only when the request holds the stored revision (D-16)', async () => {
  const fresh = rig();
  fresh.admit(draft(1, 'x', 0));
  await settle();
  expect(fresh.replies).toEqual([reply(1, 'saved', 1)]);
  expect(fresh.writeLog).toEqual([{ draft: storedDraft(1, 'x') }]);

  const current = rig({ stored: { draft: storedDraft(4, 'x') } });
  current.admit(draft(2, 'y', 4));
  await settle();
  expect(current.replies).toEqual([reply(2, 'saved', 5)]);
  expect(current.store.get('draft')).toEqual(storedDraft(5, 'y'));

  const stale = rig({ stored: { draft: storedDraft(4, 'x') } });
  stale.admit(draft(3, 'y', 3));
  await settle();
  expect(stale.replies, '[mutant:settings-cas-compare]').toEqual([reply(3, 'conflict', 4)]);
  expect(stale.writeLog, '[mutant:settings-cas-compare]').toEqual([]);
  expect(stale.store.get('draft')).toEqual(storedDraft(4, 'x'));
  for (const each of [fresh, current, stale]) each.assertOneReplyEach();
});

test('of two writers holding the same revision, the first saves and the second conflicts', async () => {
  const world = rig({ stored: { draft: storedDraft(4, 'x') } });
  world.admit(draft(1, 'from window one', 4));
  world.admit(draft(2, 'from window two', 4));
  await settle();
  expect(world.replies, '[mutant:settings-cas-compare]').toEqual([reply(1, 'saved', 5), reply(2, 'conflict', 5)]);
  expect(world.writeLog).toEqual([{ draft: storedDraft(5, 'from window one') }]);
  world.assertOneReplyEach();
});

test.each([
  ['a value the key does not accept', sample(1, 'c')],
  ['a value of the wrong type', sample(1, 42)],
  ['a stored form over the size cap', draft(1, 'x'.repeat(80), 0)],
  ['a cas key without a revision', { requestId: 1, key: 'draft', value: 'x' }],
  ['a cas key with a negative revision', draft(1, 'x', -1)],
  ['a last-writer-wins key carrying a revision', { requestId: 1, key: 'sample', value: 'b', revision: 0 }],
  ['an unregistered key', { requestId: 1, key: 'rules', value: [] }],
])('%s is rejected at once, without reading or writing', async (_name, request) => {
  const world = rig();
  world.admit(request);
  expect(world.replies.map((answer) => answer.outcome)).toEqual(['rejected']);
  await settle();
  expect(world.readLog).toEqual([]);
  expect(world.writeLog).toEqual([]);
  expect(world.replies).toHaveLength(1);
  world.assertOneReplyEach();
});

test('a failed read answers failed and never writes, whether it reports failure, rejects or throws', async () => {
  for (const read of [
    () => Promise.resolve({ ok: false }),
    () => Promise.reject(new Error('read failed')),
    () => { throw new Error('read threw'); },
    () => Promise.resolve(undefined),
  ]) {
    const world = rig({ read });
    world.admit(sample(1, 'b'));
    await settle();
    expect(world.replies).toEqual([reply(1, 'failed')]);
    expect(world.writeLog).toEqual([]);
    world.assertOneReplyEach();
  }
});

test('a failed write answers failed and leaves storage as it was, and the queue moves on', async () => {
  const world = rig({ holdWrites: true, stored: { sample: storedSample('b') } });
  world.admit(sample(1, 'a'));
  world.admit(sample(2, 'a'));
  await settle();
  world.releaseWrite(false);
  await settle();
  expect(world.replies).toEqual([reply(1, 'failed')]);
  expect(world.store.get('sample')).toEqual(storedSample('b'));
  // The second request still sees 'b' in effect and writes 'a' itself.
  world.releaseWrite();
  await settle();
  expect(world.replies).toEqual([reply(1, 'failed'), reply(2, 'saved')]);
  expect(world.store.get('sample')).toEqual(storedSample('a'));
  world.assertOneReplyEach();
});

test('a full queue answers failed at once, without reading or writing', async () => {
  const world = rig({ holdReads: true, maxPending: 2 });
  world.admit(sample(1, 'b'));
  world.admit(sample(2, 'b'));
  world.admit(sample(3, 'b'));
  expect(world.replies).toEqual([reply(3, 'failed')]);
  expect(world.queue.size()).toBe(2);
  await settle();
  expect(world.readLog).toEqual(['sample']);
  world.releaseRead();
  await settle();
  world.releaseRead();
  await settle();
  expect(world.replies).toEqual([reply(3, 'failed'), reply(1, 'saved'), reply(2, 'unchanged')]);
  expect(world.writeLog).toEqual([{ sample: storedSample('b') }]);
  expect(world.queue.size()).toBe(0);
  world.assertOneReplyEach();
});

test('at the deadline a job still queued and a job whose read is in flight answer failed and never write', async () => {
  const world = rig({ holdReads: true });
  world.admit(sample(1, 'b'));
  world.admit(sample(2, 'b'));
  await settle();
  expect(world.heldReadCount()).toBe(1);
  world.advance(TIMEOUT);
  await settle();
  expect(world.replies).toEqual([reply(1, 'failed'), reply(2, 'failed')]);
  // The read that was in flight lands after its deadline: nothing is written.
  world.releaseRead();
  await settle();
  expect(world.writeLog).toEqual([]);
  expect(world.store.has('sample')).toBe(false);
  expect(world.queue.size()).toBe(0);
  expect(world.replies).toHaveLength(2);
  world.assertOneReplyEach();
});

test('a requester whose channel throws does not stop the queue', async () => {
  const world = rig();
  world.queue.admit(sample(1, 'b'), () => { throw new Error('port closed'); });
  world.admit(sample(2, 'a'));
  await settle();
  expect(world.writeLog).toEqual([{ sample: storedSample('b') }, { sample: storedSample('a') }]);
  expect(world.replies).toEqual([reply(2, 'saved')]);
});

test('createQueue refuses options it cannot run with', () => {
  const settings = loadSettings();
  const good = { registry: settings.registry, read: () => {}, write: () => {}, timeoutMs: 1, maxPending: 1,
    setTimer: () => {}, clearTimer: () => {}, now: () => 0 };
  expect(() => settings.createQueue(good)).not.toThrow();
  for (const change of [{ registry: null }, { read: 1 }, { write: undefined }, { timeoutMs: 0 }, { maxPending: 1.5 },
    { setTimer: 'x' }, { clearTimer: null }, { now: 0 }]) {
    expect(() => settings.createQueue({ ...good, ...change })).toThrow(/Zhroma settings: /);
  }
  expect(() => settings.createQueue(null)).toThrow(/Zhroma settings: /);
});

// --- the worker: local only, serial, and the v1 shapes untouched ---------------

test('after a sequence of settings operations only storage.local was written, one key per write (DATA-01)', async () => {
  const world = await boot();
  const answers = [];
  answers.push(await world.sendToWorker(themeMessage(1), POPUP_SENDER));
  world.setStored('theme', { v: 1, id: 'from-a-newer-version' });
  answers.push(await world.sendToWorker(themeMessage(2), POPUP_SENDER));
  answers.push(await world.sendToWorker(themeMessage(3), POPUP_SENDER));
  answers.push(await world.sendToWorker(themeMessage(4, 'dracula'), POPUP_SENDER));
  await settle();
  expect(world.forbidden, '[mutant:settings-local-area]').toEqual([]);
  expect(answers).toEqual([reply(1, 'unchanged'), reply(2, 'saved'), reply(3, 'unchanged'), reply(4, 'rejected')]);
  expect(world.writeLog).toEqual([{ theme: STORED_CLASSIC }]);
  for (const entry of world.writeLog) expect(Object.keys(entry)).toHaveLength(1);
  expect(world.snapshot()).toEqual({ theme: STORED_CLASSIC });
  // The recorded area denies exist and were never reached.
  for (const area of ['sync', 'session', 'managed']) {
    expect(() => world.workerChrome.storage[area].get).toThrow();
    world.forbidden.splice(0);
  }
  expect(world.forbidden).toEqual([]);
});

test('two theme writes sent back to back through the worker never overlap a physical write', async () => {
  const world = await boot({ stored: { theme: { v: 1, id: 'from-a-newer-version' } } });
  world.setWriteMode('deferred');
  const first = world.sendToWorker(themeMessage(1), POPUP_SENDER);
  const second = world.sendToWorker(themeMessage(2), POPUP_SENDER);
  await settle();
  expect(world.pendingWriteCount()).toBe(1);
  world.flushWrites();
  await settle();
  world.flushWrites();
  await settle();
  expect(await Promise.all([first, second])).toEqual([reply(1, 'saved'), reply(2, 'unchanged')]);
  expect(world.writeLog).toEqual([{ theme: STORED_CLASSIC }]);
  expect(Math.max(...world.writeObservations)).toBe(1);
  expect(world.forbidden).toEqual([]);
});

test('interleaved off-switch and settings requests both succeed, and enabled writes stay the one boolean', async () => {
  const world = await boot({ stored: { theme: { v: 1, id: 'from-a-newer-version' } } });
  const off = world.sendToWorker({ type: 'set-enabled', requestId: 1, enabled: false }, POPUP_SENDER);
  const theme = world.sendToWorker(themeMessage(2), POPUP_SENDER);
  const on = world.sendToWorker({ type: 'set-enabled', requestId: 3, enabled: true }, POPUP_SENDER);
  const [offReply, themeReply, onReply] = await Promise.all([off, theme, on]);
  await settle();
  expect(offReply).toMatchObject({ type: 'set-enabled', requestId: 1, saved: true, enabled: false });
  expect(onReply).toMatchObject({ type: 'set-enabled', requestId: 3, saved: true, enabled: true });
  expect(themeReply).toEqual(reply(2, 'saved'));
  expect(world.writeLog.filter((entry) => Object.hasOwn(entry, 'enabled'))).toEqual([{ enabled: false }, { enabled: true }]);
  expect(world.writeLog.filter((entry) => !Object.hasOwn(entry, 'enabled'))).toEqual([{ theme: STORED_CLASSIC }]);
  expect(world.snapshot()).toEqual({ enabled: true, theme: STORED_CLASSIC });
  expect(world.forbidden).toEqual([]);
});

test.each([
  ['a theme message carrying a revision', { ...themeMessage(1), revision: 0 }, POPUP_SENDER],
  ['an unregistered key', { type: 'set-setting', requestId: 1, key: 'rules', value: [] }, POPUP_SENDER],
  ['an extra member', { ...themeMessage(1), extra: true }, POPUP_SENDER],
  ['a request id out of range', themeMessage(0), POPUP_SENDER],
  ['a content-script sender', themeMessage(1), { id: EXTENSION_ID, frameId: 0, documentId: 'document-alpha-7', tab: { id: 7 } }],
  ['a foreign extension carrying the popup URL', themeMessage(1), { id: 'another-extension-id', url: POPUP_URL }],
])('%s gets no reply and writes nothing', async (_name, message, sender) => {
  const world = await boot({ stored: { theme: { v: 99, id: 'from-a-newer-version' } } });
  const answer = await world.sendToWorker(message, sender);
  await settle();
  expect(answer).toBeInstanceOf(Error);
  expect(world.writeLog).toEqual([]);
  expect(world.getStored('theme')).toEqual({ v: 99, id: 'from-a-newer-version' });
  expect(world.forbidden).toEqual([]);
});

test('with the settings module missing, a theme request is answered failed at once and the off switch still saves', async () => {
  const world = createWorld();
  loadWorker(world, { imports: 'throws' });
  loadContent(world);
  await settle();
  expect(await world.sendToWorker(themeMessage(1), POPUP_SENDER)).toEqual(reply(1, 'failed'));
  const off = await world.sendToWorker({ type: 'set-enabled', requestId: 2, enabled: false }, POPUP_SENDER);
  expect(off).toMatchObject({ type: 'set-enabled', requestId: 2, saved: true, enabled: false });
  expect(world.writeLog).toEqual([{ enabled: false }]);
  expect(world.forbidden).toEqual([]);
});
