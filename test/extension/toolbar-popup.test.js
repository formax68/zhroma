// @vitest-environment node
//
// Actual-source tracer. Three real shipped scripts run in three separate VM
// contexts — content script, service worker, packaged popup — wired together by
// a strict fake Chrome that refuses anything the finite protocol does not name.
// Nothing here reimplements extension behaviour: every assertion is about bytes
// that ship. Simulated delivery is not browser acceptance; live observation of
// the icon and popup is reached in 04-05.
//
// The world itself now lives in `tracer-world.js` so `toggle.test.js` drives
// the same double rather than a second, quietly divergent one. Every assertion
// below is unchanged by that move.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { createContext, Script } from 'node:vm';
import { afterEach, expect, test, vi } from 'vitest';
import { PREFERENCE_CONTRACT, createChromeHarness } from './chrome-harness.js';
import {
  CONFIRMED, COPY, DOCUMENT_ID, EXTENSION_ID, ICON, MAX_REQUEST_ID, OTHER_TAB_ID, POPUP_PATH, POPUP_URL,
  TAB_ID, TICKET_TOKENS, asset, bootAll, closeWindows, control, createWorld, extensionRoot as root, fixture,
  flip, inertWindow, loadContent, loadPopup, loadWorker, markers, settle, statusText, wait,
} from './tracer-world.js';

const manifest = JSON.parse(asset('manifest.json'));

afterEach(async () => { vi.useRealTimers(); await closeWindows(); });

async function timedTabs() {
  vi.useFakeTimers();
  const world = createWorld({ stored: { enabled: true }, portCloseMs: 20000 });
  const worker = loadWorker(world);
  world.openTab(OTHER_TAB_ID);
  const content = loadContent(world);
  loadContent(world, { tabId: OTHER_TAB_ID });
  await vi.advanceTimersByTimeAsync(250);
  return { world, worker, content };
}

for (const stage of ['icon', 'title']) {
  test(`late native ${stage} preserves exclusion and reconciles newest projection`, async () => {
    const { world, content } = await timedTabs();
    world.hold(stage, TAB_ID);
    const start = world.actionAttempts.length;
    world.activateTab(TAB_ID);
    await vi.advanceTimersByTimeAsync(30);
    expect(world.pending(stage, TAB_ID)).toBe(1);
    content.document.querySelector('table').remove();
    await vi.advanceTimersByTimeAsync(4200);
    const waitingPopup = loadPopup(world);
    await vi.advanceTimersByTimeAsync(4010);
    expect(control(waitingPopup.document).disabled, '[outcome:action-does-not-wedge-popup]').toBe(true);
    for (let i = 0; i < 40; i++) world.activateTab(TAB_ID);
    await vi.advanceTimersByTimeAsync(4200);
    expect(world.pending(stage, TAB_ID), `[outcome:native-${stage}-exclusion]`).toBe(1);
    expect(world.actionAttempts.slice(start).filter((entry) => stage in entry)).toHaveLength(1);
    world.activateTab(OTHER_TAB_ID);
    const popup = loadPopup(world);
    await vi.advanceTimersByTimeAsync(100);
    expect(statusText(popup.document)).toBe(COPY.working);
    expect(world.action(OTHER_TAB_ID)).toEqual({ icon: ICON.working, title: COPY.working });
    world.unhold(stage, TAB_ID); world.release(stage, TAB_ID);
    await vi.advanceTimersByTimeAsync(100);
    expect(world.action(TAB_ID), `[outcome:late-${stage}-reconciled]`).toEqual({ icon: ICON.neutral, title: COPY.checking });
    await vi.advanceTimersByTimeAsync(22000);
    expect(vi.getTimerCount()).toBe(0);
    expect(world.forbidden).toEqual([]);
  });
}

for (const stage of ['worker-read', 'content-response']) {
  test(`event projection recovers from parked ${stage} without popup or restart`, async () => {
    const { world, content } = await timedTabs();
    world.hold(stage);
    world.activateTab(TAB_ID);
    await vi.advanceTimersByTimeAsync(30);
    expect(world.pending(stage)).toBeGreaterThan(0);
    world.unhold(stage);
    content.document.querySelector('table').remove();
    await vi.advanceTimersByTimeAsync(4200);
    expect(world.action(TAB_ID), `[outcome:event-budget-${stage}]`).toEqual({ icon: ICON.neutral, title: COPY.checking });
    world.release(stage);
    await vi.advanceTimersByTimeAsync(22000);
    expect(world.action(TAB_ID)).toEqual({ icon: ICON.neutral, title: COPY.checking });
    expect(vi.getTimerCount()).toBe(0);
  });
}

for (const stage of ['query', 'worker-read', 'content-response', 'icon', 'title']) {
  test(`closure during held ${stage} releases entries and forbids stale follow-on paint`, async () => {
    const { world } = await timedTabs();
    world.hold(stage);
    world.activateTab(TAB_ID);
    await vi.advanceTimersByTimeAsync(30);
    const before = world.actionLog.length;
    world.closeTab(TAB_ID);
    expect(world.retainedWorkerEntries(), '[mutant:tabs-onremoved-listener]').toBe(1);
    world.unhold(stage); world.release(stage);
    await vi.advanceTimersByTimeAsync(4200);
    world.activateTab(TAB_ID);
    await vi.advanceTimersByTimeAsync(100);
    expect(world.retainedWorkerEntries(), '[outcome:closed-tab-retention]').toBe(1);
    expect(world.actionLog.slice(before), '[outcome:closed-tab-committed-paint]').toEqual([]);
    expect(world.action(OTHER_TAB_ID)).toEqual({ icon: ICON.working, title: COPY.working });
    expect(world.forbidden).toEqual([]);
  });
}

test('repeated create-close cycles and reused ids cannot retain or resurrect a dead tab', async () => {
  const { world } = await timedTabs();
  for (let i = 0; i < 30; i++) {
    world.openTab(30);
    world.activateTab(30);
    await vi.advanceTimersByTimeAsync(20);
    world.closeTab(30);
    expect(world.retainedWorkerEntries(), '[mutant:tabs-onremoved-delete]').toBe(2);
    world.activateTab(30);
    await vi.advanceTimersByTimeAsync(20);
    expect(world.retainedWorkerEntries(), '[outcome:repeated-close-retention]').toBe(2);
  }
  world.openTab(30);
  loadContent(world, { tabId: 30 });
  world.activateTab(30);
  await vi.advanceTimersByTimeAsync(250);
  expect(world.action(30)).toEqual({ icon: ICON.working, title: COPY.working });
});

for (const native of ['write', 'icon', 'title']) {
  test(`terminated worker preserves native ${native} but never executes dead JavaScript`, async () => {
    const { world, worker, content } = await timedTabs();
    if (native === 'write') {
      world.setWriteMode('deferred');
      world.popupChrome.runtime.sendMessage({ type: 'set-enabled', requestId: 777, enabled: false }).catch(() => {});
    } else {
      world.hold(native, TAB_ID);
      world.activateTab(TAB_ID);
    }
    await vi.advanceTimersByTimeAsync(30);
    const calls = world.apiLog.filter((entry) => entry.epoch === worker.epochId).length;
    world.terminateWorker();
    loadWorker(world);
    if (native === 'write') { world.commitWrites(); world.releaseWriteCallbacks(); }
    else {
      content.document.querySelector('table').remove();
      world.unhold(native, TAB_ID); world.release(native, TAB_ID);
    }
    await vi.advanceTimersByTimeAsync(100);
    expect(world.apiLog.filter((entry) => entry.epoch === worker.epochId), '[outcome:dead-epoch-api-dispatch]').toHaveLength(calls);
    if (native === 'write') expect(world.snapshot(), '[outcome:old-native-commit-visible]').toEqual({ enabled: false });
    else expect(world.actionLog.some((entry) => native in entry)).toBe(true);
    world.activateTab(TAB_ID);
    const popup = loadPopup(world);
    await vi.advanceTimersByTimeAsync(100);
    expect(statusText(popup.document)).toBe(native === 'write' ? COPY.off : COPY.checking);
    expect(world.forbidden).toEqual([]);
    await vi.advanceTimersByTimeAsync(22000);
    expect(vi.getTimerCount()).toBe(0);
  });
}

// --- packaging --------------------------------------------------------------

test('the manifest adds action, popup, worker and icons without widening the permission surface', () => {
  expect(manifest.permissions).toEqual(['storage']);
  expect(Object.hasOwn(manifest, 'host_permissions')).toBe(false);
  expect(Object.hasOwn(manifest, 'optional_permissions')).toBe(false);
  expect(Object.hasOwn(manifest, 'optional_host_permissions')).toBe(false);
  expect(manifest.content_scripts).toEqual([{
    matches: ['https://*.zendesk.com/agent/*'], js: ['content.js'], css: ['zhroma.css'],
    run_at: 'document_idle', world: 'ISOLATED', all_frames: false,
  }]);
  expect(manifest.minimum_chrome_version).toBe('106');
  expect(manifest.action.default_popup).toBe(POPUP_PATH);
  expect(manifest.background).toEqual({ service_worker: 'background.js' });
  expect(Object.values(manifest.action.default_icon)).toEqual(['icons/neutral.png']);
  expect(Object.values(manifest.icons)).toEqual(['icons/neutral.png']);
});

test('every packaged asset the manifest names exists locally and no remote resource is referenced', () => {
  const declared = [
    ...manifest.content_scripts[0].js, ...manifest.content_scripts[0].css,
    manifest.action.default_popup, manifest.background.service_worker,
    ...Object.values(manifest.action.default_icon), ...Object.values(manifest.icons),
  ];
  for (const name of declared) {
    expect(name).toMatch(/^[a-z]+\/?[a-z-]*\.(js|css|html|png)$/);
    expect(realpathSync(new URL(name, root))).toBe(fileURLToPath(new URL(name, root)));
  }
  expect(readdirSync(root).sort()).toEqual(['background.js', 'content.js', 'icons', 'manifest.json', 'popup.html', 'popup.js', 'zhroma.css']);
  expect(readdirSync(new URL('icons/', root)).sort())
    .toEqual(['missing.png', 'neutral.png', 'off.png', 'unreadable.png', 'working.png']);
  // Every icon the worker can project must be packaged: an icon set at runtime
  // is not declared in the manifest, so the inventory is the only thing that
  // can prove it will exist in the store package.
  const projected = [...asset('background.js').matchAll(/'(icons\/[a-z]+\.png)'/g)].map(([, path]) => path);
  expect(new Set(projected).size).toBe(5);
  for (const path of new Set(projected)) expect(realpathSync(new URL(path, root))).toBe(fileURLToPath(new URL(path, root)));
  for (const name of ['content.js', 'background.js', 'popup.js', 'popup.html']) {
    expect(asset(name)).not.toMatch(/https?:\/\/|@import|url\(\s*['"]?https?:/);
  }
});

const ICON_FILES = ['working.png', 'missing.png', 'unreadable.png', 'neutral.png', 'off.png'];

test.each(ICON_FILES)('%s is a locally authored 32x32 PNG', (name) => {
  const bytes = readFileSync(new URL(`icons/${name}`, root));
  expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(bytes.subarray(12, 16).toString('latin1')).toBe('IHDR');
  expect(bytes.readUInt32BE(16)).toBe(32);
  expect(bytes.readUInt32BE(20)).toBe(32);
  expect(statSync(new URL(`icons/${name}`, root)).size).toBeLessThan(8192);
});

test('the five icons are five different images, so shape can carry the meaning', () => {
  // FAIL-05 asks the agent to tell the states apart from the toolbar alone.
  // Byte-distinctness is the automatable floor; whether a person recognises a
  // column-plus from a question mark at 16px is a human check in 04-05.
  const digests = ICON_FILES.map((name) => createHash('sha256')
    .update(readFileSync(new URL(`icons/${name}`, root))).digest('hex'));
  expect(new Set(digests).size).toBe(5);
});

test('shipped JavaScript carries no colour value and builds no page markup', () => {
  for (const name of ['content.js', 'background.js', 'popup.js']) {
    const source = asset(name);
    expect(source).not.toMatch(/#[\da-f]{3,8}\b|rgba?\s*\(|hsla?\s*\(/i);
    expect(source).not.toMatch(/innerHTML|outerHTML\s*=|insertAdjacentHTML|document\.write|createElement|cssText|adoptedStyleSheets|\.style\b/);
    expect(source).not.toMatch(/\b(eval|Function|fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB)\s*[.(]/);
    expect(() => new Script(source)).not.toThrow();
  }
  expect(asset(POPUP_PATH)).not.toMatch(/<script(?![^>]*\ssrc=)/i);
});

// --- the supported-view tracer ---------------------------------------------

test('actual extension bytes tint the admitted supported view and report working to the action and the popup', async () => {
  const { world, content, popup } = await bootAll();

  expect(markers(content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(world.action()).toEqual({ icon: 'icons/working.png', title: COPY.working });
  expect(statusText(popup.document)).toBe(COPY.working);
  expect(world.forbidden).toEqual([]);
});

test('a valid absent-key read is the only default-on path, and it registers the change listener first', async () => {
  const { world, content } = await bootAll({ stored: null });
  // The listener must already exist by the time the read can resolve, or a
  // preference written during startup is silently lost (T-04-05).
  expect(world.storageListenerCount()).toBe(1);
  expect(markers(content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
});

test('a stored false leaves zero markers and never flashes tint during an asynchronous startup', async () => {
  const { world, content, popup } = await bootAll({ stored: { enabled: false }, readMode: 'deferred' });
  // Startup is still in flight: nothing may be painted on the strength of a
  // guess about what the preference will turn out to be.
  expect(markers(content.document)).toEqual([]);
  // Two readers are in flight and neither has resolved: the content script's
  // startup read, and the worker's on-demand read for the popup projection.
  // 04-04 made the worker read the preference per projection rather than
  // remember it, which is the second one.
  expect(world.pendingReadCount()).toBe(2);
  world.flushReads();
  await settle();
  expect(markers(content.document)).toEqual([]);
  // A confirmed stored false is an operational state the extension can name,
  // not the "still looking" state. 04-04 replaced the placeholder `checking`
  // projection here with the decided off copy.
  expect(world.action()).toEqual({ icon: ICON.off, title: COPY.off });
  expect(statusText(popup.document)).toBe(COPY.off);
});

test.each([
  ['a rejected read', { readMode: 'rejected' }],
  ['a throwing storage API', { readMode: 'throws' }],
  ['a non-boolean stored value', { stored: { enabled: 'false' } }],
  ['a null stored value', { stored: { enabled: null } }],
])('%s is a failure, never absence, and leaves zero markers', async (_name, options) => {
  const { world, content } = await bootAll(options);
  expect(markers(content.document)).toEqual([]);
  expect(world.action()?.icon ?? 'icons/neutral.png').toBe('icons/neutral.png');
});

test('a late enabling read cannot override a newer stored false', async () => {
  const world = createWorld({ stored: null, readMode: 'deferred' });
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  world.emitStorageChange({ enabled: { oldValue: true, newValue: false } });
  await settle();
  world.flushReads();
  await settle();
  expect(markers(content.document)).toEqual([]);
});

test('an unrelated key or a foreign storage area never changes the preference', async () => {
  const { world, content } = await bootAll();
  world.emitStorageChange({ somethingElse: { newValue: false } });
  world.emitStorageChange({ enabled: { newValue: false } }, 'sync');
  await settle();
  expect(markers(content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(world.action()).toEqual({ icon: 'icons/working.png', title: COPY.working });
});

test('a Priority column with no values set reports working with the blank reason', async () => {
  const html = fixture();
  const world = createWorld();
  loadWorker(world);
  const content = loadContent(world, { html });
  for (const row of content.document.querySelectorAll('tbody > tr')) row.children[6].textContent = '';
  await settle();
  const popup = loadPopup(world);
  await settle();
  expect(markers(content.document)).toEqual([]);
  expect(world.action()).toEqual({ icon: 'icons/working.png', title: COPY.blank });
  expect(statusText(popup.document)).toBe(COPY.blank);
});

test('a view whose table cannot be read is neutral, never a positive diagnosis', async () => {
  const world = createWorld();
  loadWorker(world);
  const content = loadContent(world, { html: '<main><p>No table here yet</p></main>' });
  await settle();
  const popup = loadPopup(world);
  await settle();
  expect(markers(content.document)).toEqual([]);
  expect(world.action()).toEqual({ icon: 'icons/neutral.png', title: COPY.checking });
  expect(statusText(popup.document)).toBe(COPY.checking);
});


test('a genuinely Priority-less view reaches the popup as the add-a-column hint, and only after it settles', async () => {
  const world = createWorld();
  loadWorker(world);
  const content = loadContent(world);
  content.document.querySelector('thead tr').children[6].textContent = 'Other';
  await settle();
  // Before the quiet window elapses the extension has evidence but not
  // certainty, and says so: neutral, never an accusation.
  const early = loadPopup(world);
  await settle();
  expect(statusText(early.document)).toBe(COPY.checking);
  await new Promise((resolve) => { setTimeout(resolve, CONFIRMED); });
  await settle();
  expect(world.action()).toEqual({ icon: ICON.missing, title: COPY.missing });
  const popup = loadPopup(world);
  await settle();
  expect(statusText(popup.document)).toBe(COPY.missing);
  expect(markers(content.document)).toEqual([]);
  expect(world.forbidden).toEqual([]);
});

test('an unsupported interface language reaches the popup as a language message, never a missing column', async () => {
  const world = createWorld();
  loadWorker(world);
  const content = loadContent(world);
  content.document.documentElement.lang = 'fr';
  await settle();
  await new Promise((resolve) => { setTimeout(resolve, CONFIRMED); });
  await settle();
  const popup = loadPopup(world);
  await settle();
  expect(statusText(popup.document)).toBe(COPY.language);
  expect(world.action()).toEqual({ icon: ICON.unreadable, title: COPY.language });
  expect(JSON.stringify(world.traffic)).not.toContain('fr');
});

test('a structurally unreadable English view is told so, and is never blamed on its language', async () => {
  const world = createWorld();
  loadWorker(world);
  const content = loadContent(world);
  content.document.querySelectorAll('tbody > tr')[2].children[6].textContent = 'Critical';
  await settle();
  await new Promise((resolve) => { setTimeout(resolve, CONFIRMED); });
  await settle();
  const popup = loadPopup(world);
  await settle();
  expect(statusText(popup.document)).toBe(COPY.structure);
  expect(world.action()).toEqual({ icon: ICON.unreadable, title: COPY.structure });
  expect(markers(content.document)).toEqual([]);
});

test('no receiver reads as unavailable and never as a diagnosis about the view', async () => {
  const { world, popup } = await bootAll();
  world.disconnectContent();
  loadPopup(world);
  await settle();
  const second = loadPopup(world);
  await settle();
  expect(statusText(second.document)).toBe(COPY.unavailable);
  expect(world.action()).toEqual({ icon: 'icons/neutral.png', title: COPY.unavailable });
  expect(statusText(popup.document)).toBe(COPY.working);
});

// --- trust boundary ---------------------------------------------------------

test.each([
  ['a foreign extension id', { id: 'someotherextensionidentifier000', frameId: 0, documentId: DOCUMENT_ID, tab: { id: TAB_ID } }],
  ['a subframe', { id: EXTENSION_ID, frameId: 3, documentId: DOCUMENT_ID, tab: { id: TAB_ID } }],
  ['a missing document identity', { id: EXTENSION_ID, frameId: 0, tab: { id: TAB_ID } }],
  ['an empty document identity', { id: EXTENSION_ID, frameId: 0, documentId: '', tab: { id: TAB_ID } }],
  ['no tab at all', { id: EXTENSION_ID, frameId: 0, documentId: DOCUMENT_ID }],
  ['a payload-selected tab', { id: EXTENSION_ID, frameId: 0, documentId: DOCUMENT_ID, tab: { id: '7' } }],
])('the worker refuses a content invalidation from %s', async (_name, sender) => {
  const { world } = await bootAll();
  const before = world.actionLog.length;
  await world.sendToWorker({ type: 'status-invalidated' }, sender);
  await settle();
  expect(world.actionLog.length).toBe(before);
});

test.each([
  ['an unknown type', { type: 'set-status' }],
  ['an extra key', { type: 'status-invalidated', tabId: TAB_ID }],
  ['ticket content', { type: 'status-invalidated', priority: 'Urgent' }],
  ['a non-object', 'status-invalidated'],
])('the worker refuses a malformed content message carrying %s', async (_name, message) => {
  const { world } = await bootAll();
  const before = world.actionLog.length;
  await world.sendToWorker(message, { id: EXTENSION_ID, frameId: 0, documentId: DOCUMENT_ID, tab: { id: TAB_ID } });
  await settle();
  expect(world.actionLog.length).toBe(before);
});

test.each([
  ['a content script rather than the packaged popup', { id: EXTENSION_ID, frameId: 0, documentId: DOCUMENT_ID, tab: { id: TAB_ID } }],
  ['a page pretending to be the popup', { id: EXTENSION_ID, url: 'https://example.zendesk.com/agent/popup.html' }],
  ['a foreign extension', { id: 'someotherextensionidentifier000', url: POPUP_URL }],
])('the worker refuses a popup request from %s', async (_name, sender) => {
  const { world } = await bootAll();
  const outcome = await world.sendToWorker({ type: 'popup-status', requestId: 1 }, sender);
  expect(outcome).toBeInstanceOf(Error);
});

test.each([
  ['a fractional request id', 1.5], ['a negative request id', -1], ['a zero request id', 0],
  ['an out-of-band request id', MAX_REQUEST_ID + 1], ['a string request id', '1'],
])('the worker refuses a popup request with %s', async (_name, requestId) => {
  const { world } = await bootAll();
  const outcome = await world.sendToWorker({ type: 'popup-status', requestId }, { id: EXTENSION_ID, url: POPUP_URL });
  expect(outcome).toBeInstanceOf(Error);
});

test('the content script answers only the packaged worker, never another content script', async () => {
  const world = createWorld();
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  const direct = await world.workerChrome.tabs.sendMessage(TAB_ID, { type: 'get-status', requestId: 1 }, { frameId: 0 });
  expect(direct).toEqual({ type: 'status', requestId: 1, diagnosis: 'working', reason: null });
  expect(markers(content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
});

test('no ticket value, DOM, URL or raw error crosses any message boundary', async () => {
  const { world } = await bootAll();
  expect(world.traffic.length).toBeGreaterThan(0);
  const wire = JSON.stringify(world.traffic);
  for (const token of TICKET_TOKENS) expect(wire).not.toContain(token);
  for (const { direction, payload } of world.traffic) {
    if (payload === undefined) continue;
    expect(typeof payload).toBe('object');
    for (const value of Object.values(payload)) {
      expect(['string', 'number', 'boolean', 'object']).toContain(typeof value);
      if (typeof value === 'object') expect(value).toBeNull();
    }
    expect(direction).toBeTruthy();
  }
  const titles = world.actionLog.filter((entry) => entry.title).map((entry) => entry.title);
  expect(new Set(titles).size).toBeGreaterThan(0);
  for (const title of titles) expect(Object.values(COPY)).toContain(title);
});

// --- staleness and lifecycle ------------------------------------------------

test('a slow earlier reply cannot repaint over a newer projection', async () => {
  // A DELIVERY delay (`replyDelays`) cannot construct this hazard: it defers the
  // listener invocation, so the content script computes its answer AFTER the DOM
  // change and replies with the new status — nothing stale is ever in flight. A
  // RESPONSE delay holds the answer the listener already produced, so the payload
  // released late is genuinely the superseded one (04-REVIEW WR-01).
  const world = createWorld({ responseDelays: [120] });
  loadWorker(world);
  const content = loadContent(world);
  await settle(4);
  // A second invalidation lands while the first reply is still in flight.
  content.document.querySelector('table').remove();
  await new Promise((resolve) => { setTimeout(resolve, 500); });
  await settle();
  expect(world.action()).toEqual({ icon: ICON.neutral, title: COPY.checking });
  // Fails if either `project` recheck is removed: the superseded working reply
  // would reach `applyAction` and paint an artwork the view no longer earns.
  expect(world.actionLog.filter((entry) => entry.icon === ICON.working || entry.title === COPY.working)).toEqual([]);
  // Fails if the per-tab queue is collapsed: two concurrent projections let the
  // held stale reply land last.
  const icons = world.actionLog.filter((entry) => entry.icon).map((entry) => entry.icon);
  expect(icons.at(-1)).toBe(ICON.neutral);
  expect(world.forbidden).toEqual([]);
}, 15000);

// One test per generation-guarded site in the worker. Each constructs the
// specific hazard that site exists to refuse, so the property is named rather
// than inferred from a passing suite (04-REVIEW WR-01).

test('a rejection that belongs to a superseded projection never paints the connection line', async () => {
  const world = createWorld({ replyDelays: [300] });
  loadWorker(world);
  loadContent(world);
  await settle(4);
  expect(world.action()).toBeUndefined();
  // The frame that was going to answer is gone, but the TAB is not
  // disconnected: the send proceeds into delivery and the no-receiver
  // rejection is produced inside the delayed callback. That is the only way a
  // LATE rejection is reachable, and it is what makes the catch-branch guard
  // able to matter at all.
  world.silenceContent(TAB_ID);
  const reread = loadContent(world, { tabId: TAB_ID });
  await wait(600);
  await settle();
  expect(markers(reread.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(world.action()).toEqual({ icon: ICON.working, title: COPY.working });
  // The superseded rejection is an operational fact about a connection that no
  // longer exists. It must never be reported about the document now in front
  // of the agent.
  expect(world.actionLog.filter((entry) => entry.title === COPY.unavailable)).toEqual([]);
  expect(world.forbidden).toEqual([]);
}, 15000);

test('a superseded status reply is discarded before the preference is ever read', async () => {
  const world = createWorld({ responseDelays: [120] });
  loadWorker(world);
  const content = loadContent(world);
  await settle(4);
  // From here every preference read is held, so the reads a projection issues
  // are countable. The content script's own startup read has already landed.
  world.setReadMode('deferred');
  content.document.querySelector('table').remove();
  await wait(500);
  await settle();
  // The superseded projection stopped at the status recheck: it never reached
  // `readPreference`, so exactly one read — the current projection's — is held.
  expect(world.pendingReadCount()).toBe(1);
  world.flushReads();
  await settle();
  // One flush is enough precisely because only one projection got that far.
  expect(world.pendingReadCount()).toBe(0);
  expect(world.action()).toEqual({ icon: ICON.neutral, title: COPY.checking });
  expect(world.forbidden).toEqual([]);
}, 15000);

test('a preference read that lands after a newer invalidation never paints the superseded status', async () => {
  const world = createWorld();
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  expect(world.action()).toEqual({ icon: ICON.working, title: COPY.working });
  const mark = world.actionLog.length;
  world.setReadMode('deferred');
  world.activateTab(TAB_ID);
  await settle();
  expect(world.pendingReadCount()).toBe(1);
  // The table goes while the preference read for the working projection is
  // still in flight.
  content.document.querySelector('table').remove();
  await settle();
  world.setReadMode('immediate');
  world.flushReads();
  await wait(500);
  await settle();
  const after = world.actionLog.slice(mark);
  expect(after.filter((entry) => entry.icon === ICON.working || entry.title === COPY.working)).toEqual([]);
  expect(world.action()).toEqual({ icon: ICON.neutral, title: COPY.checking });
  expect(world.forbidden).toEqual([]);
}, 15000);

test('a generation bump between the icon and the title write stops the superseded title', async () => {
  const world = createWorld();
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  expect(world.action()).toEqual({ icon: ICON.working, title: COPY.working });
  const mark = world.actionLog.length;
  // The icon write is held, so an invalidation can land between the two writes
  // of a single `applyAction`.
  world.setActionDelay(200);
  world.activateTab(TAB_ID);
  await settle();
  content.document.querySelector('table').remove();
  await wait(700);
  world.setActionDelay(0);
  await wait(300);
  await settle();
  const after = world.actionLog.slice(mark);
  // The icon write was already issued and lands; the title is the write that
  // must be refused, because a title is the sentence the agent reads.
  expect(after.filter((entry) => entry.title === COPY.working)).toEqual([]);
  expect(world.action().title).toBe(COPY.checking);
  expect(world.forbidden).toEqual([]);
}, 15000);

test('a superseded popup projection reports the connection line and still shows the confirmed preference', async () => {
  const world = createWorld({ stored: { enabled: true } });
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  world.setResponseDelay(200);
  const popup = loadPopup(world);
  await settle(4);
  // A newer invalidation supersedes the popup's own projection while its
  // status reply is still in flight.
  content.document.querySelector('table').remove();
  await wait(800);
  world.setResponseDelay(0);
  await settle();
  expect(statusText(popup.document)).toBe(COPY.unavailable);
  // The connection is what went missing, not the preference: the switch still
  // shows the value storage confirmed, and stays operable.
  expect(control(popup.document).checked).toBe(true);
  expect(control(popup.document).disabled).toBe(false);
  expect(world.forbidden).toEqual([]);
}, 15000);

test("a held stale reply for one tab never writes to another tab's toolbar", async () => {
  const world = createWorld();
  loadWorker(world);
  world.openTab(OTHER_TAB_ID);
  const first = loadContent(world, { tabId: TAB_ID });
  loadContent(world, { tabId: OTHER_TAB_ID });
  await settle();
  await wait(CONFIRMED);
  await settle();
  expect(world.action(TAB_ID)).toEqual({ icon: ICON.working, title: COPY.working });
  expect(world.action(OTHER_TAB_ID)).toEqual({ icon: ICON.working, title: COPY.working });
  const mark = world.actionLog.length;
  world.setResponseDelay(200);
  world.activateTab(TAB_ID);
  await settle();
  first.document.querySelector('table').remove();
  await wait(800);
  world.setResponseDelay(0);
  await settle();
  const after = world.actionLog.slice(mark);
  // Every write carries the tab it belongs to, so a cross-tab paint is visible
  // rather than inferred.
  expect(after.filter((entry) => entry.tabId === OTHER_TAB_ID)).toEqual([]);
  expect(world.action(OTHER_TAB_ID)).toEqual({ icon: ICON.working, title: COPY.working });
  expect(world.action(TAB_ID)).toEqual({ icon: ICON.neutral, title: COPY.checking });
  expect(world.forbidden).toEqual([]);
}, 15000);

test('losing the readable table withdraws the working status without touching the page', async () => {
  const { world, content } = await bootAll();
  const table = content.document.querySelector('table');
  table.setAttribute('data-garden-id', 'tables.other');
  await settle();
  expect(markers(content.document)).toEqual([]);
  expect(world.action()).toEqual({ icon: 'icons/neutral.png', title: COPY.checking });
  const popup = loadPopup(world);
  await settle();
  expect(statusText(popup.document)).toBe(COPY.checking);
});

test('hiding and restoring the document does not disturb a confirmed preference', async () => {
  const { world, content } = await bootAll();
  const { window, document } = content;
  for (let i = 0; i < 3; i++) {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new window.Event('visibilitychange'));
    await settle(4);
    expect(markers(document)).toEqual([]);
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new window.Event('visibilitychange'));
    await settle(4);
    expect(markers(document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  }
  window.dispatchEvent(new window.Event('pagehide'));
  await settle(4);
  expect(markers(document)).toEqual([]);
  window.dispatchEvent(new window.Event('pageshow'));
  await settle();
  expect(markers(document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(world.action()).toEqual({ icon: 'icons/working.png', title: COPY.working });
});

test('a stored false survives every lifecycle path and is never undone by a visibility pause', async () => {
  const world = createWorld({ stored: { enabled: false } });
  loadWorker(world);
  const { window, document } = loadContent(world);
  await settle();
  for (const event of ['pagehide', 'pageshow', 'pagehide', 'pageshow']) {
    window.dispatchEvent(new window.Event(event));
    await settle(4);
    expect(markers(document)).toEqual([]);
  }
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  document.dispatchEvent(new window.Event('visibilitychange'));
  await settle();
  expect(markers(document)).toEqual([]);
});

test('tab activation requeries rather than trusting a cached projection, and closure releases state', async () => {
  const { world } = await bootAll();
  const before = world.actionLog.length;
  for (const listener of world.tabsEvents.activated) listener({ tabId: TAB_ID, windowId: 1 });
  await settle();
  expect(world.actionLog.length).toBeGreaterThan(before);
  expect(world.action()).toEqual({ icon: 'icons/working.png', title: COPY.working });
  for (const listener of world.tabsEvents.updated) listener(TAB_ID, { status: 'complete' }, { id: TAB_ID });
  await settle();
  expect(world.action()).toEqual({ icon: 'icons/working.png', title: COPY.working });
  for (const listener of world.tabsEvents.removed) listener(TAB_ID, { windowId: 1, isWindowClosing: false });
  await settle();
  expect(world.forbidden).toEqual([]);
});

test('a rejected action or tab query degrades quietly rather than throwing across the worker', async () => {
  const world = createWorld();
  loadWorker(world);
  loadContent(world);
  world.breakAction();
  await settle();
  world.breakQuery();
  const popup = loadPopup(world);
  await settle();
  expect(statusText(popup.document)).toBe(COPY.unavailable);
  expect(world.forbidden).toEqual([]);
});

// --- per-tab projection ------------------------------------------------------

/** Two tabs, deliberately in different states, both fully settled. */
async function twoTabWorld() {
  const world = createWorld();
  loadWorker(world);
  world.openTab(OTHER_TAB_ID);
  const working = loadContent(world, { tabId: TAB_ID });
  const missing = loadContent(world, { tabId: OTHER_TAB_ID });
  missing.document.querySelector('thead tr').children[6].textContent = 'Other';
  await settle();
  await new Promise((resolve) => { setTimeout(resolve, CONFIRMED); });
  await settle();
  return { world, working, missing };
}

test('two tabs with different diagnoses hold different toolbar states at the same time', async () => {
  const { world } = await twoTabWorld();
  expect(world.action(TAB_ID)).toEqual({ icon: ICON.working, title: COPY.working });
  expect(world.action(OTHER_TAB_ID)).toEqual({ icon: ICON.missing, title: COPY.missing });
  // Neither tab's result was ever projected globally onto the other.
  for (const entry of world.actionLog) expect([TAB_ID, OTHER_TAB_ID]).toContain(entry.tabId);
});

test('the popup answers about the active tab, and a window with no current tab is unavailable', async () => {
  const { world } = await twoTabWorld();
  world.activateTab(OTHER_TAB_ID);
  await settle();
  const onMissing = loadPopup(world);
  await settle();
  expect(statusText(onMissing.document)).toBe(COPY.missing);
  world.activateTab(TAB_ID);
  await settle();
  const onWorking = loadPopup(world);
  await settle();
  expect(statusText(onWorking.document)).toBe(COPY.working);
  // No tab of the focused window: an operational fact about the connection,
  // never a claim that the tab is outside Zendesk.
  world.leaveWindow();
  const orphan = loadPopup(world);
  await settle();
  expect(statusText(orphan.document)).toBe(COPY.unavailable);
});

test('a recreated worker reconstructs from a fresh handshake, never from a remembered diagnosis', async () => {
  const world = createWorld();
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  expect(world.action()).toEqual({ icon: ICON.working, title: COPY.working });
  // The worker is terminated and the view changes while nothing is listening.
  world.terminateWorker();
  content.document.querySelector('thead tr').children[6].textContent = 'Other';
  await settle();
  loadWorker(world);
  world.activateTab(TAB_ID);
  await new Promise((resolve) => { setTimeout(resolve, CONFIRMED); });
  await settle();
  expect(world.action()).toEqual({ icon: ICON.missing, title: COPY.missing });
  // The worker is still not a database. It now reads and writes the one
  // persisted boolean (04-04 made it the single writer), and that is the whole
  // extent of its persistence: no diagnosis, no per-tab value, no revision and
  // no install-time or startup-time seeding of state it could later trust.
  expect(asset('background.js')).not.toMatch(/onInstalled|onStartup/);
  expect(asset('background.js')).not.toMatch(/chrome\.storage\.(sync|session|managed)/);
  expect([...asset('background.js').matchAll(/chrome\.storage\.local\.(\w+)/g)]
    .map(([, member]) => member).sort()).toEqual(['get', 'set']);
  // The only thing the single writer can write is the one boolean, under the
  // one key. `toggle.test.js` proves the same thing from the write log.
  expect([...asset('background.js').matchAll(/chrome\.storage\.local\.set\(([^,]+),/g)]
    .map(([, argument]) => argument.trim())).toEqual(['{ [PREFERENCE_KEY]: enabled }']);
});

test('a tab closed while its status request is in flight can no longer be painted by that reply', async () => {
  const world = createWorld({ replyDelays: [300] });
  loadWorker(world);
  loadContent(world);
  await settle(4);
  expect(world.action()).toBeUndefined();
  world.closeTab(TAB_ID);
  await new Promise((resolve) => { setTimeout(resolve, 500); });
  await settle();
  const painted = world.actionLog.filter((entry) => entry.icon === ICON.working || entry.title === COPY.working);
  expect(painted).toEqual([]);
  expect(world.forbidden).toEqual([]);
});

test('a failed action write is never remembered as success and a later projection still lands', async () => {
  const world = createWorld();
  loadWorker(world);
  loadContent(world);
  world.breakAction();
  await settle();
  expect(world.action()).toBeUndefined();
  world.repairAction();
  world.activateTab(TAB_ID);
  await settle();
  expect(world.action()).toEqual({ icon: ICON.working, title: COPY.working });
  expect(world.forbidden).toEqual([]);
});

test('a navigation event only invalidates and requeries; it never reads the URL it carries', async () => {
  const world = createWorld();
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  content.document.querySelector('thead tr').children[6].textContent = 'Other';
  for (const listener of world.tabsEvents.updated) {
    listener(TAB_ID, { status: 'loading', url: 'https://example.zendesk.com/agent/filters/1' }, { id: TAB_ID });
  }
  await new Promise((resolve) => { setTimeout(resolve, CONFIRMED); });
  await settle();
  expect(world.action()).toEqual({ icon: ICON.missing, title: COPY.missing });
  // D-09: mutation stays the discovery mechanism. No route detection.
  expect(asset('background.js')).not.toContain('changeInfo.url');
  expect(asset('background.js')).not.toMatch(/zendesk|agent\/|webNavigation|history/);
});

test('neither the worker nor the popup nor the content script leaks a global', async () => {
  const world = createWorld();
  const worker = loadWorker(world);
  const content = loadContent(world);
  await settle();
  const popup = loadPopup(world);
  await settle();
  for (const loaded of [worker, content, popup]) {
    expect(Object.keys(loaded.context)).toEqual(loaded.before);
  }
});

test('the popup renders fixed copy through textContent for every reachable status', async () => {
  const source = asset('popup.js');
  for (const copy of Object.values(COPY)) expect(source).toContain(copy);
  expect(source).toMatch(/textContent\s*=/);
  const html = asset(POPUP_PATH);
  expect(html).toMatch(/<script\s+src="popup\.js"><\/script>/);
  expect(html).toMatch(/id="zhroma-status"/);
  expect(html).toMatch(/<h1/);
  // The popup must never claim the tab is definitively outside Zendesk.
  expect(`${source}${html}`).not.toMatch(/not a zendesk|outside zendesk|wrong site/i);
});

// --- one contract, two independent test doubles -----------------------------

test('the tracer world and the strict inherited-suite harness drive one preference and status contract', async () => {
  // Two test doubles now model the same seam: this file's `createWorld`, which
  // wires three real contexts together, and `chrome-harness.js`, which the
  // inherited runtime suites use. If they drift, one of them is testing an
  // extension that does not exist. Both are anchored to the shipped literals.
  const source = asset('content.js');
  expect(source).toContain(`PREFERENCE_KEY = '${PREFERENCE_CONTRACT.key}'`);
  expect(source).toContain(`PREFERENCE_AREA = '${PREFERENCE_CONTRACT.area}'`);
  expect(source).toContain(`MAX_REQUEST_ID = ${PREFERENCE_CONTRACT.maxRequestId}`);
  expect(source).toContain(`'${PREFERENCE_CONTRACT.statusMessage.type}'`);
  expect(asset('background.js')).toContain(`'${PREFERENCE_CONTRACT.statusRequestType}'`);

  // The taxonomy is part of the shared contract, not an incidental literal.
  // Exactly three product diagnoses (FAIL-01) plus the operational `neutral`,
  // and every one of them present in all three shipped contexts.
  expect(PREFERENCE_CONTRACT.diagnoses).toEqual(['working', 'missing', 'cannot-read', 'neutral']);
  expect(PREFERENCE_CONTRACT.reasons).toEqual(['blank', 'unsupported-language', 'structure', null]);
  for (const value of [...PREFERENCE_CONTRACT.diagnoses, ...PREFERENCE_CONTRACT.reasons]) {
    if (value === null) continue;
    for (const name of ['content.js', 'background.js']) expect(asset(name), `${name} ${value}`).toContain(`'${value}'`);
  }

  // Same bytes, same admitted fixture, same absent-key default — driven this
  // time through the strict harness, which refuses any Chrome surface beyond
  // the seam and records a violation rather than silently tolerating one.
  const harness = createChromeHarness();
  const window = inertWindow(fixture());
  const context = createContext({ document: window.document, window, chrome: harness.chrome,
    MutationObserver: window.MutationObserver, setTimeout, clearTimeout });
  new Script(asset('content.js'), { filename: 'content.js' }).runInContext(context);
  harness.flush();
  await settle();
  expect(markers(window.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(harness.requestStatus()).toEqual({ type: 'status', requestId: 1, diagnosis: 'working', reason: null });
  // Every crossing is the same finite hint — the startup announcement and the
  // transition to working — and carries nothing else.
  expect(harness.messages.length).toBeGreaterThan(0);
  expect([...new Set(harness.messages.map((message) => JSON.stringify(message)))])
    .toEqual([JSON.stringify(PREFERENCE_CONTRACT.statusMessage)]);
  harness.assertClean();

  // And the packaged worker and popup turn exactly that reply into the decided
  // copy, so the harness's expectation is the product's behaviour.
  const { world, content, popup } = await bootAll();
  expect(markers(content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(world.action()).toEqual({ icon: 'icons/working.png', title: COPY.working });
  expect(statusText(popup.document)).toBe(COPY.working);
});

test('a stored false reaches the same dormant state through both doubles', async () => {
  const harness = createChromeHarness({ stored: false });
  const window = inertWindow(fixture());
  const context = createContext({ document: window.document, window, chrome: harness.chrome,
    MutationObserver: window.MutationObserver, setTimeout, clearTimeout });
  new Script(asset('content.js'), { filename: 'content.js' }).runInContext(context);
  harness.flush();
  await settle();
  expect(markers(window.document)).toEqual([]);
  expect(harness.requestStatus()).toEqual({ type: 'status', requestId: 1, diagnosis: 'neutral', reason: null });
  harness.assertClean();

  const { world, content } = await bootAll({ stored: { enabled: false } });
  expect(markers(content.document)).toEqual([]);
  expect(world.action()).toEqual({ icon: ICON.off, title: COPY.off });
});

// --- the off state, its races and its faults (04-04) ------------------------

/** Two tabs, deliberately in different states, both tinted and settled. */
async function twoTintedTabs() {
  const world = createWorld();
  loadWorker(world);
  world.openTab(OTHER_TAB_ID);
  const first = loadContent(world, { tabId: TAB_ID });
  const second = loadContent(world, { tabId: OTHER_TAB_ID });
  await settle();
  const popup = loadPopup(world);
  await settle();
  return { world, first, second, popup };
}

test('off is projected as its own packaged shape and never as the add-a-column hint', async () => {
  const { world } = await twoTabWorld();
  // Stand on the tab whose Priority column genuinely IS missing, so the copy
  // being suppressed is copy the extension would otherwise be right to show.
  world.activateTab(OTHER_TAB_ID);
  await settle();
  const onMissing = loadPopup(world);
  await settle();
  expect(statusText(onMissing.document)).toBe(COPY.missing);
  expect(world.action(OTHER_TAB_ID)).toEqual({ icon: ICON.missing, title: COPY.missing });

  await flip(onMissing, false);

  // That tab is no longer told to add a column: off is an operational state,
  // and while it is on there is no diagnosis to act on. Three diagnoses stay
  // exactly three.
  expect(world.action(OTHER_TAB_ID)).toEqual({ icon: ICON.off, title: COPY.off });
  expect(statusText(onMissing.document)).toBe(COPY.off);
  world.activateTab(TAB_ID);
  await settle();
  expect(world.action(TAB_ID)).toEqual({ icon: ICON.off, title: COPY.off });
  const titles = world.actionLog.filter((entry) => entry.title).map((entry) => entry.title);
  expect(titles.at(-1)).toBe(COPY.off);
  expect(titles.filter((title) => title === COPY.missing).length).toBeGreaterThan(0);
  const afterOff = loadPopup(world);
  await settle();
  expect(statusText(afterOff.document)).toBe(COPY.off);
});

test('a background tab converges through onChanged without ever being messaged', async () => {
  const { world, first, second, popup } = await twoTintedTabs();
  expect(markers(first.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(markers(second.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);

  await flip(popup, false);

  // The current tab acknowledged; the other runnable tab converged on the
  // change event alone. Exactly one apply request was ever sent.
  expect(markers(first.document)).toEqual([]);
  expect(markers(second.document)).toEqual([]);
  const applies = world.traffic.filter(({ payload }) => payload && payload.type === 'apply-preference');
  expect(applies).toHaveLength(1);
});

test('a frozen tab applies the preference when it is resumed, and not before', async () => {
  const { world, second, popup } = await twoTintedTabs();
  // A frozen tab keeps its rendered DOM and cannot run a handler or a timer
  // until it is unfrozen. Delivery is asynchronous and this is the honest
  // limit of the decided global preference: no atomic application everywhere.
  world.freezeTab(OTHER_TAB_ID);

  await flip(popup, false);
  expect(markers(second.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);

  world.thawTab(OTHER_TAB_ID);
  second.window.dispatchEvent(new second.window.Event('pageshow'));
  await settle();
  // On resume it re-reads storage rather than trusting the value it froze with.
  expect(markers(second.document)).toEqual([]);
  expect(world.forbidden).toEqual([]);
});

test('two popups asking for opposite values are serialized, and neither inverts the other', async () => {
  // Deferred writes are what make this test load-bearing. Under IMMEDIATE
  // write mode both tasks commit in arrival order whether or not the queue
  // exists, so the final stored value cannot tell a serialized worker from an
  // unserialized one — the test passed with `serializePreference` collapsed to
  // a bare call (04-REVIEW WR-06). With the first write parked unresolved, a
  // collapsed queue is visible directly, as a SECOND write in flight.
  const world = createWorld({ writeMode: 'deferred' });
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  const first = loadPopup(world);
  const second = loadPopup(world);
  await settle();

  // The single-writer rule as an INVARIANT, checked at every point it can be
  // observed rather than inferred once from a final value: at no moment are
  // two preference writes in flight together.
  const inFlight = [];
  const observe = () => {
    const pending = world.pendingWriteCount();
    expect(pending, `${pending} preference writes in flight at once`).toBeLessThan(2);
    inFlight.push(pending);
  };

  // Both requests are issued before either can complete.
  const a = control(first.document);
  a.checked = false;
  a.dispatchEvent(new first.window.Event('change', { bubbles: true }));
  const b = control(second.document);
  b.checked = true;
  b.dispatchEvent(new second.window.Event('change', { bubbles: true }));
  await settle();
  await settle();

  // The first request's write is parked mid-flight; the second is chained
  // behind it and has not touched storage at all.
  observe();
  expect(world.writeLog).toEqual([{ enabled: false }]);
  expect(world.getStored('enabled')).toBeUndefined();

  // Flushing commits the first value and releases the second request, whose
  // write takes the one slot the first has just vacated.
  world.flushWrites();
  await settle();
  await settle();
  observe();
  expect(world.getStored('enabled')).toBe(false);

  world.flushWrites();
  await settle();
  await settle();
  observe();

  // Exactly the two desired values, in arrival order. Never a third value, and
  // never an inversion of a stale reading. The last request is the survivor.
  expect(inFlight).toEqual([1, 1, 0]);
  expect(world.writeLog).toEqual([{ enabled: false }, { enabled: true }]);
  expect(world.getStored('enabled')).toBe(true);
  expect(control(second.document).checked).toBe(true);
  expect(markers(content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(world.forbidden).toEqual([]);
});

test("a closed tab's per-tab state is released without disturbing its neighbour", async () => {
  // HALF OF THIS IS A SHAPE GUARD, AND IT SAYS SO RATHER THAN PRETENDING
  // OTHERWISE. The `tabs` map has no external observable: `stateFor` mints a
  // fresh entry for an unknown id, so a leaked entry and a released one are
  // indistinguishable from outside the worker — a reused id gets a generation
  // no held reply matches either way. Exposing a count would change a shipped
  // byte and re-invalidate the acceptance binding 04-11 re-established, so the
  // release is guarded by reading the shipped source, the same idiom this file
  // already uses for the storage-method allowlist and the icon inventory. It
  // kills the mutant; it does not prove the map is bounded at runtime.
  const removals = [...asset('background.js')
    .matchAll(/chrome\.tabs\.onRemoved\.addListener\(\((\w+)\) => \{([\s\S]*?)\n {2}\}\);/g)];
  // Two halves, asserted separately on purpose: deleting the registration and
  // gutting its body are different mutants and must fail distinguishably.
  expect(removals).toHaveLength(1);
  const [, parameter, listenerBody] = removals[0];
  expect(listenerBody).toContain(`tabs.delete(${parameter});`);

  const { world } = await twoTabWorld();
  const neighbour = { ...world.action(OTHER_TAB_ID) };
  const beforeClose = world.actionLog.length;
  world.closeTab(TAB_ID);
  await settle();
  // Releasing one tab's state leaves the other tab's toolbar exactly as it was.
  expect(world.action(OTHER_TAB_ID)).toEqual(neighbour);
  expect(world.actionLog.length).toBe(beforeClose);

  // A projection for the tab that is gone resolves rather than throwing. What
  // it writes is the operational connection fact, on the dead tab alone: never
  // a diagnosis about a view, and never a write against a living neighbour.
  // (The double does not model Chrome refusing an action write for a closed
  // tab, so the write is observed here rather than absent.)
  const beforeProjection = world.actionLog.length;
  world.activateTab(TAB_ID);
  await settle();
  await wait(CONFIRMED);
  await settle();
  const projected = world.actionLog.slice(beforeProjection);
  expect(projected.map((entry) => entry.tabId)).toEqual(projected.map(() => TAB_ID));
  expect(projected.filter((entry) => entry.icon)).toEqual([{ tabId: TAB_ID, icon: ICON.neutral }]);
  expect(projected.filter((entry) => entry.title)).toEqual([{ tabId: TAB_ID, title: COPY.unavailable }]);
  expect(world.action(OTHER_TAB_ID)).toEqual(neighbour);
  expect(world.forbidden).toEqual([]);
});

test('a worker stopped and recreated after an off serves the persisted value, not a memory of it', async () => {
  const { world, popup } = await bootAll();
  await flip(popup, false);
  world.terminateWorker();
  loadWorker(world);
  world.activateTab(TAB_ID);
  await settle();
  expect(world.action(TAB_ID)).toEqual({ icon: ICON.off, title: COPY.off });
  const reopened = loadPopup(world);
  await settle();
  expect(control(reopened.document).checked).toBe(false);
  expect(statusText(reopened.document)).toBe(COPY.off);
});

test('a popup abandoned mid-write does not corrupt the preference', async () => {
  const world = createWorld({ writeMode: 'deferred' });
  loadWorker(world);
  loadContent(world);
  await settle();
  const popup = loadPopup(world);
  await settle();
  const box = control(popup.document);
  box.checked = false;
  box.dispatchEvent(new popup.window.Event('change', { bubbles: true }));
  await settle(2);
  // The agent closes the popup while the write is still in flight; its reply
  // now has nowhere to land.
  world.setWriteMode('immediate');
  world.flushWrites();
  await settle();
  await settle();
  expect(world.snapshot()).toEqual({ enabled: false });
  const reopened = loadPopup(world);
  await settle();
  expect(control(reopened.document).checked).toBe(false);
});

test('a transient native cleanup failure still reaches the intended state', async () => {
  const { world, content, popup } = await bootAll();
  for (const row of content.document.querySelectorAll('[data-zhroma-priority]')) {
    const native = row.removeAttribute.bind(row);
    let failed = false;
    Object.defineProperty(row, 'removeAttribute', {
      configurable: true,
      value(name) {
        // One transient host failure, then the bounded retry succeeds.
        if (!failed) { failed = true; throw new Error('Transient attribute failure'); }
        return native(name);
      },
    });
  }
  await flip(popup, false);
  expect(markers(content.document)).toEqual([]);
  // Recovered inside the bounded retry, so this genuinely is a cleared tint
  // and is reported as one.
  expect(statusText(popup.document)).toBe(COPY.off);
});

test('every toolbar write is tab-scoped, through every off and on path', async () => {
  const { world, popup } = await twoTintedTabs();
  await flip(popup, false);
  world.activateTab(OTHER_TAB_ID);
  await settle();
  await flip(popup, true);
  world.activateTab(TAB_ID);
  await settle();
  expect(world.actionLog.length).toBeGreaterThan(0);
  for (const entry of world.actionLog) {
    expect([TAB_ID, OTHER_TAB_ID], JSON.stringify(entry)).toContain(entry.tabId);
  }
});

test('the popup and worker contexts survive every failure path without logging or transmitting', async () => {
  const { world, popup } = await bootAll();
  world.setWriteMode('rejected');
  await flip(popup, false);
  world.setWriteMode('immediate');
  world.setReadMode('rejected');
  await flip(popup, false);
  world.setReadMode('immediate');
  world.breakAction();
  await flip(popup, true);
  world.repairAction();
  world.breakQuery();
  await flip(popup, false);
  // Not one console call, network attempt or web-storage touch on any failure
  // path, in any of the three contexts.
  expect(world.forbidden).toEqual([]);
  const wire = JSON.stringify({ traffic: world.traffic, writes: world.writeLog });
  for (const token of TICKET_TOKENS) expect(wire, token).not.toContain(token);
  for (const token of ['Storage write failed', 'Storage read failed', 'Action unavailable', 'Tabs unavailable']) {
    expect(wire, token).not.toContain(token);
  }
});

test('the popup gives its single switch default focus and names itself meaningfully', async () => {
  const { popup } = await bootAll();
  const box = control(popup.document);
  // The only control on the panel is the default focus, so the switch is
  // operable from the keyboard the moment the popup opens.
  expect(popup.document.activeElement).toBe(box);
  const html = asset(POPUP_PATH);
  expect(html).toMatch(/<title>[^<]*Zhroma[^<]*<\/title>/);
  expect(html).toMatch(/<title>[^<]{10,}<\/title>/);
  expect(html).toMatch(/<h1[^>]*>Zhroma<\/h1>/);
  // A polite live region, so a status change is announced without the popup
  // having to shout it on every render.
  expect(html).toMatch(/id="zhroma-status"[^>]*role="status"|role="status"[^>]*id="zhroma-status"/);
  expect(asset('popup.js')).toMatch(/activeElement/);
  // Still no options page, no outbound link and no page overlay (D-03, D-11).
  expect(html).not.toMatch(/<a\s|options|href=/i);
  expect(asset('popup.js')).not.toMatch(/window\.open|location\s*=|chrome\.runtime\.openOptionsPage/);
});

test('the whole off and on cycle goes quiet: nothing repaints once it has settled', async () => {
  const { world, popup } = await bootAll();
  await flip(popup, false);
  await flip(popup, true);
  await wait(CONFIRMED + 100);
  await settle();
  const settled = world.actionLog.length;
  await wait(CONFIRMED + 100);
  await settle();
  expect(world.actionLog.length).toBe(settled);
  expect(world.forbidden).toEqual([]);
});
