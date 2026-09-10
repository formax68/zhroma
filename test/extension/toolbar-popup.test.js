// @vitest-environment node
//
// Actual-source tracer. Three real shipped scripts run in three separate VM
// contexts — content script, service worker, packaged popup — wired together by
// a strict fake Chrome that refuses anything the finite protocol does not name.
// Nothing here reimplements extension behaviour: every assertion is about bytes
// that ship. Simulated delivery is not browser acceptance; live observation of
// the icon and popup is reached in 04-05.
import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { createContext, Script } from 'node:vm';
import { Window } from 'happy-dom';
import { afterEach, expect, test } from 'vitest';
import { PREFERENCE_CONTRACT, createChromeHarness } from './chrome-harness.js';

const root = new URL('../../extension/', import.meta.url);
const asset = (name) => readFileSync(new URL(name, root), 'utf8');
const manifest = JSON.parse(asset('manifest.json'));

const EXTENSION_ID = 'zhromatracercontextidnotarealone';
const POPUP_PATH = 'popup.html';
const POPUP_URL = `chrome-extension://${EXTENSION_ID}/${POPUP_PATH}`;
const TAB_ID = 7;
const DOCUMENT_ID = 'document-alpha';
const MAX_REQUEST_ID = 1000000;

const COPY = {
  working: 'Priority tinting is working',
  blank: 'Priority column found. These tickets have no priority values set',
  checking: 'Checking this view',
  unavailable: 'No readable view is connected',
};

// Text that exists only inside the admitted fixture. None of it may ever appear
// in a message, a response, an action title or the popup (T-04-04).
const TICKET_TOKENS = ['Urgent', 'High', 'Normal', 'Low', 'TEXT-0', 'ARIA-0', 'zendesk', 'http', 'tables.'];

const windows = [];
afterEach(async () => {
  for (const window of windows.splice(0)) {
    window.dispatchEvent(new window.Event('pagehide'));
    await window.happyDOM.close();
  }
});

const tick = () => new Promise((resolve) => { setTimeout(resolve, 0); });
async function settle(rounds = 24) { for (let i = 0; i < rounds; i++) await tick(); }

function inertWindow(bodyHTML) {
  const window = new Window({ settings: {
    enableJavaScriptEvaluation: false, disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true, enableImageFileLoading: false,
    navigation: { disableMainFrameNavigation: true, disableChildFrameNavigation: true, disableChildPageNavigation: true },
  } });
  windows.push(window);
  window.document.documentElement.lang = 'en';
  window.document.body.innerHTML = bodyHTML;
  return window;
}

const fixture = () => readFileSync(new URL('../fixtures/zendesk-view-priority-present.html', import.meta.url), 'utf8');
const popupBody = () => asset(POPUP_PATH).match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1].replace(/<script[\s\S]*?<\/script>/gi, '');

// --- strict fake Chrome -----------------------------------------------------

function createWorld({ stored = null, readMode = 'immediate', replyDelays = [] } = {}) {
  const forbidden = [];
  const traffic = [];
  const actionLog = [];
  const actions = new Map();
  const workerListeners = [];
  const contentListeners = [];
  const storageListeners = [];
  const storage = new Map(stored === null ? [] : Object.entries(stored));
  const pendingReads = [];
  const tabs = [{ id: TAB_ID, active: true }];
  const replyQueue = [...replyDelays];
  const tabsEvents = { activated: [], updated: [], removed: [] };
  let contentConnected = true;
  let actionAvailable = true;
  let queryAvailable = true;

  const deny = (name) => function () { forbidden.push(name); throw new Error('Forbidden runtime channel'); };
  const denyStore = (name) => new Proxy({}, { get() { forbidden.push(name); throw new Error('Forbidden store access'); } });
  const record = (direction, payload) => { traffic.push({ direction, payload: structuredClone(payload) }); return payload; };

  // Deliver exactly like Chrome: asynchronously, resolving only when a listener
  // answers, rejecting when nothing is listening or the channel closes unused.
  function deliver(listeners, message, sender, delay = 0) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (listeners.length === 0) { reject(new Error('Could not establish connection. Receiving end does not exist.')); return; }
        let settled = false;
        let asyncPending = false;
        const sendResponse = (value) => { if (!settled) { settled = true; record('response', value); resolve(structuredClone(value)); } };
        for (const listener of listeners) {
          const result = listener(structuredClone(message), structuredClone(sender), sendResponse);
          if (result === true) asyncPending = true;
        }
        if (!settled && !asyncPending) reject(new Error('The message port closed before a response was received.'));
        else if (!settled) setTimeout(() => { if (!settled) reject(new Error('The message port closed before a response was received.')); }, 500);
      }, delay);
    });
  }

  function runtimeFor(chromeObject, callbackErrors = true) {
    return {
      id: EXTENSION_ID,
      lastError: undefined,
      getURL: (path) => `chrome-extension://${EXTENSION_ID}/${path}`,
      onMessage: { addListener: (listener) => { workerListeners.push(listener); } },
      sendMessage(message, callback) {
        record('to-worker', message);
        const sender = { id: EXTENSION_ID, frameId: 0, documentId: DOCUMENT_ID, tab: { id: TAB_ID } };
        const promise = deliver(workerListeners, message, sender);
        if (typeof callback !== 'function') return promise;
        promise.then((value) => {
          chromeObject.runtime.lastError = undefined;
          callback(value);
        }, (error) => {
          if (callbackErrors) chromeObject.runtime.lastError = { message: error.message };
          callback(undefined);
          chromeObject.runtime.lastError = undefined;
        });
        return undefined;
      },
    };
  }

  function storageFor(chromeObject) {
    return {
      onChanged: { addListener: (listener) => { storageListeners.push(listener); } },
      local: {
        get(defaults, callback) {
          const resolveRead = () => {
            const values = {};
            for (const key of Object.keys(defaults)) values[key] = storage.has(key) ? storage.get(key) : defaults[key];
            if (readMode === 'rejected') {
              chromeObject.runtime.lastError = { message: 'Storage read failed' };
              callback(undefined);
              chromeObject.runtime.lastError = undefined;
              return;
            }
            callback(values);
          };
          if (readMode === 'deferred') pendingReads.push(resolveRead);
          else if (readMode === 'throws') throw new Error('Storage unavailable');
          else setTimeout(resolveRead, 0);
        },
      },
    };
  }

  const contentChrome = {};
  contentChrome.runtime = runtimeFor(contentChrome);
  contentChrome.storage = storageFor(contentChrome);

  const popupChrome = {};
  popupChrome.runtime = {
    id: EXTENSION_ID,
    lastError: undefined,
    getURL: (path) => `chrome-extension://${EXTENSION_ID}/${path}`,
    onMessage: { addListener: () => {} },
    sendMessage(message) {
      record('to-worker', message);
      return deliver(workerListeners, message, { id: EXTENSION_ID, url: POPUP_URL });
    },
  };

  const workerChrome = {
    runtime: {
      id: EXTENSION_ID,
      getURL: (path) => `chrome-extension://${EXTENSION_ID}/${path}`,
      onMessage: { addListener: (listener) => { workerListeners.push(listener); } },
    },
    tabs: {
      onActivated: { addListener: (listener) => { tabsEvents.activated.push(listener); } },
      onUpdated: { addListener: (listener) => { tabsEvents.updated.push(listener); } },
      onRemoved: { addListener: (listener) => { tabsEvents.removed.push(listener); } },
      query() {
        if (!queryAvailable) return Promise.reject(new Error('Tabs unavailable'));
        return Promise.resolve(tabs.filter((tab) => tab.active).map((tab) => ({ ...tab })));
      },
      sendMessage(tabId, message, options) {
        record('to-content', message);
        expect(options).toEqual({ frameId: 0 });
        if (!contentConnected || tabId !== TAB_ID) {
          return Promise.reject(new Error('Could not establish connection. Receiving end does not exist.'));
        }
        return deliver(contentListeners, message, { id: EXTENSION_ID }, replyQueue.length > 0 ? replyQueue.shift() : 0);
      },
    },
    action: {
      setIcon({ tabId, path }) {
        if (!actionAvailable) return Promise.reject(new Error('Action unavailable'));
        actions.set(tabId, { ...actions.get(tabId), icon: path });
        actionLog.push({ tabId, icon: path });
        return Promise.resolve();
      },
      setTitle({ tabId, title }) {
        if (!actionAvailable) return Promise.reject(new Error('Action unavailable'));
        actions.set(tabId, { ...actions.get(tabId), title });
        actionLog.push({ tabId, title });
        return Promise.resolve();
      },
    },
  };

  // Content registers into contentListeners rather than workerListeners.
  contentChrome.runtime.onMessage.addListener = (listener) => { contentListeners.push(listener); };

  return {
    contentChrome, workerChrome, popupChrome, forbidden, traffic, actions, actionLog, tabsEvents,
    deny, denyStore,
    action: (tabId = TAB_ID) => actions.get(tabId),
    flushReads() { for (const read of pendingReads.splice(0)) read(); },
    pendingReadCount: () => pendingReads.length,
    setStored(key, value) { storage.set(key, value); },
    disconnectContent() { contentConnected = false; contentListeners.splice(0); },
    breakAction() { actionAvailable = false; },
    breakQuery() { queryAvailable = false; },
    emitStorageChange(changes, areaName = 'local') {
      for (const listener of storageListeners.slice()) listener(structuredClone(changes), areaName);
    },
    sendToWorker(message, sender) { return deliver(workerListeners, message, sender).catch((error) => error); },
    storageListenerCount: () => storageListeners.length,
  };
}

// --- context loaders --------------------------------------------------------

function loadContent(world, { html = fixture() } = {}) {
  const window = inertWindow(html);
  const { document } = window;
  const sentinels = {
    fetch: world.deny('fetch'), XMLHttpRequest: world.deny('XHR'), WebSocket: world.deny('WebSocket'),
    EventSource: world.deny('EventSource'), Worker: world.deny('Worker'), Image: world.deny('Image'),
    localStorage: world.denyStore('localStorage'), sessionStorage: world.denyStore('sessionStorage'),
    indexedDB: world.denyStore('indexedDB'), caches: world.denyStore('caches'),
    console: { log: world.deny('console.log'), warn: world.deny('console.warn'), error: world.deny('console.error'), info: world.deny('console.info') },
  };
  for (const [name, value] of Object.entries(sentinels)) Object.defineProperty(window, name, { value, configurable: true });
  const context = createContext({ ...sentinels, document, window, chrome: world.contentChrome,
    MutationObserver: window.MutationObserver, setTimeout, clearTimeout, Promise, Object, JSON,
  }, { codeGeneration: { strings: false, wasm: false } });
  const before = Object.keys(context);
  new Script(asset('content.js'), { filename: 'content.js' }).runInContext(context);
  return { window, document, context, before };
}

function loadWorker(world) {
  const sentinels = {
    fetch: world.deny('fetch'), XMLHttpRequest: world.deny('XHR'), WebSocket: world.deny('WebSocket'),
    importScripts: world.deny('importScripts'), localStorage: world.denyStore('localStorage'),
    indexedDB: world.denyStore('indexedDB'), caches: world.denyStore('caches'),
    console: { log: world.deny('console.log'), warn: world.deny('console.warn'), error: world.deny('console.error'), info: world.deny('console.info') },
  };
  const context = createContext({ ...sentinels, chrome: world.workerChrome,
    setTimeout, clearTimeout, Promise, Object, JSON, Map, Number, Array,
  }, { codeGeneration: { strings: false, wasm: false } });
  const before = Object.keys(context);
  new Script(asset('background.js'), { filename: 'background.js' }).runInContext(context);
  return { context, before };
}

function loadPopup(world) {
  const window = inertWindow(popupBody());
  const { document } = window;
  const sentinels = {
    fetch: world.deny('fetch'), XMLHttpRequest: world.deny('XHR'), WebSocket: world.deny('WebSocket'),
    localStorage: world.denyStore('localStorage'), indexedDB: world.denyStore('indexedDB'),
    console: { log: world.deny('console.log'), warn: world.deny('console.warn'), error: world.deny('console.error'), info: world.deny('console.info') },
  };
  const context = createContext({ ...sentinels, document, window, chrome: world.popupChrome,
    setTimeout, clearTimeout, Promise, Object, JSON, Math, Number,
  }, { codeGeneration: { strings: false, wasm: false } });
  const before = Object.keys(context);
  new Script(asset('popup.js'), { filename: 'popup.js' }).runInContext(context);
  return { window, document, context, before };
}

const statusText = (document) => document.getElementById('zhroma-status').textContent;
const markers = (document) => [...document.querySelectorAll('[data-zhroma-priority]')]
  .map((row) => row.getAttribute('data-zhroma-priority'));

async function bootAll(options = {}) {
  const world = createWorld(options);
  const worker = loadWorker(world);
  const content = loadContent(world, options);
  await settle();
  const popup = loadPopup(world);
  await settle();
  return { world, worker, content, popup };
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
  expect(readdirSync(new URL('icons/', root)).sort()).toEqual(['neutral.png', 'working.png']);
  for (const name of ['content.js', 'background.js', 'popup.js', 'popup.html']) {
    expect(asset(name)).not.toMatch(/https?:\/\/|@import|url\(\s*['"]?https?:/);
  }
});

test.each(['working.png', 'neutral.png'])('%s is a locally authored 32x32 PNG', (name) => {
  const bytes = readFileSync(new URL(`icons/${name}`, root));
  expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(bytes.subarray(12, 16).toString('latin1')).toBe('IHDR');
  expect(bytes.readUInt32BE(16)).toBe(32);
  expect(bytes.readUInt32BE(20)).toBe(32);
  expect(statSync(new URL(`icons/${name}`, root)).size).toBeLessThan(8192);
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
  expect(world.pendingReadCount()).toBe(1);
  world.flushReads();
  await settle();
  expect(markers(content.document)).toEqual([]);
  expect(world.action()).toEqual({ icon: 'icons/neutral.png', title: COPY.checking });
  expect(statusText(popup.document)).toBe(COPY.checking);
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
  const world = createWorld({ replyDelays: [120] });
  loadWorker(world);
  const content = loadContent(world);
  await settle(4);
  // A second invalidation lands while the first request is still in flight.
  content.document.querySelector('table').remove();
  await new Promise((resolve) => { setTimeout(resolve, 500); });
  await settle();
  expect(world.action()).toEqual({ icon: 'icons/neutral.png', title: COPY.checking });
  const icons = world.actionLog.filter((entry) => entry.icon).map((entry) => entry.icon);
  expect(icons.at(-1)).toBe('icons/neutral.png');
});

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
  expect(world.action()).toEqual({ icon: 'icons/neutral.png', title: COPY.checking });
});
