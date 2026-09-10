// Test-only actual-source tracer world.
//
// Nothing in this file ships. It wires the three real shipped scripts —
// content script, service worker, packaged popup — into three separate VM
// contexts joined by a strict fake Chrome that refuses anything the finite
// protocol does not name. It reimplements no extension behaviour: every
// caller's assertions are about bytes that ship.
//
// Extracted from `toolbar-popup.test.js` so `toggle.test.js` can drive the
// same world rather than growing a second, quietly divergent double. The
// packaged inventory is pinned recursively in `runtime-contract.test.js`, so
// this file cannot leak into the store zip.
//
// Storage is deliberately asymmetric and that asymmetry is a contract, not a
// convenience: the WORKER may write the one boolean, and the CONTENT SCRIPT
// may not. A content-side `set` is recorded as a forbidden channel exactly
// like a `fetch` would be, so the single-writer rule is enforced by the double
// rather than merely intended by the source.
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { createContext, Script } from 'node:vm';
import { Window } from 'happy-dom';
import { expect } from 'vitest';

const root = new URL('../../extension/', import.meta.url);
export const asset = (name) => readFileSync(new URL(name, root), 'utf8');
export const extensionRoot = root;

export const EXTENSION_ID = 'zhromatracercontextidnotarealone';
export const POPUP_PATH = 'popup.html';
export const POPUP_URL = `chrome-extension://${EXTENSION_ID}/${POPUP_PATH}`;
export const TAB_ID = 7;
export const OTHER_TAB_ID = 9;
export const DOCUMENT_ID = 'document-alpha';
export const MAX_REQUEST_ID = 1000000;

// Three product diagnoses (working, missing, cannot-read) plus the operational
// values. `missing` is the only copy that ever asks the agent to add a column,
// and D-04 splits cannot-read into two truthful branches. `off` and the two
// failure lines describe what Zhroma is doing or failed to do; none of them is
// a fourth diagnosis about the view.
export const COPY = {
  working: 'Priority tinting is working',
  blank: 'Priority column found. These tickets have no priority values set',
  missing: 'Add a Priority column to this view to use tinting',
  language: 'This interface language is not supported',
  structure: "Zhroma cannot read this view's ticket table",
  checking: 'Checking this view',
  unavailable: 'No readable view is connected',
  off: 'Tinting is off',
  notSaved: 'Zhroma could not save that setting',
  notApplied: 'Setting saved, but this view did not update',
};

// Five decided shape treatments. Three product diagnoses map to three distinct
// shapes; neutral and off are the operational ones.
export const ICON = {
  working: 'icons/working.png',
  missing: 'icons/missing.png',
  unreadable: 'icons/unreadable.png',
  neutral: 'icons/neutral.png',
  off: 'icons/off.png',
};

// Text that exists only inside the admitted fixture. None of it may ever appear
// in a message, a response, an action title or the popup (T-04-04).
export const TICKET_TOKENS = ['Urgent', 'High', 'Normal', 'Low', 'TEXT-0', 'ARIA-0', 'zendesk', 'http', 'tables.'];

export const fixture = () => readFileSync(new URL('../fixtures/zendesk-view-priority-present.html', import.meta.url), 'utf8');
export const popupBody = () => asset(POPUP_PATH).match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1].replace(/<script[\s\S]*?<\/script>/gi, '');

const windows = [];

/** Close every window this module opened. Call from the suite's afterEach. */
export async function closeWindows() {
  for (const window of windows.splice(0)) {
    window.dispatchEvent(new window.Event('pagehide'));
    await window.happyDOM.close();
  }
}

export const tick = () => new Promise((resolve) => { setTimeout(resolve, 0); });
export async function settle(rounds = 24) { for (let i = 0; i < rounds; i++) await tick(); }
export const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

// The settle period the shipped script waits out before a missing claim, plus
// enough real time for the confirmation and its projection to land.
export const CONFIRMED = 200;

export function inertWindow(bodyHTML) {
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

// --- strict fake Chrome -----------------------------------------------------

export function createWorld({ stored = null, readMode = 'immediate', writeMode = 'immediate', replyDelays = [] } = {}) {
  const forbidden = [];
  const traffic = [];
  const actionLog = [];
  const actions = new Map();
  let workerListeners = [];
  // One listener list per tab: a browser has more than one tab, and a per-tab
  // projection that is only ever exercised with one tab proves nothing.
  const contentListeners = new Map();
  const listenersFor = (tabId) => {
    if (!contentListeners.has(tabId)) contentListeners.set(tabId, []);
    return contentListeners.get(tabId);
  };
  // Tracked per owning context, not as one flat list, so a single tab can be
  // frozen while its siblings stay runnable. A frozen tab genuinely cannot run
  // a handler — modelling it by "delivering anyway" would prove the opposite
  // of what the frozen-tab case is meant to establish.
  const storageListeners = [];
  const frozen = new Set();
  const storage = new Map(stored === null ? [] : Object.entries(stored));
  const pendingReads = [];
  const pendingWrites = [];
  const writeLog = [];
  const tabs = [{ id: TAB_ID, active: true, currentWindow: true }];
  const replyQueue = [...replyDelays];
  const tabsEvents = { activated: [], updated: [], removed: [] };
  const disconnected = new Set();
  let actionAvailable = true;
  let queryAvailable = true;
  let currentWriteMode = writeMode;
  let currentReadMode = readMode;

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

  function runtimeFor(chromeObject, tabId = TAB_ID, callbackErrors = true) {
    return {
      id: EXTENSION_ID,
      lastError: undefined,
      getURL: (path) => `chrome-extension://${EXTENSION_ID}/${path}`,
      onMessage: { addListener: (listener) => { listenersFor(tabId).push(listener); } },
      sendMessage(message, callback) {
        record('to-worker', message);
        const sender = { id: EXTENSION_ID, frameId: 0, documentId: `${DOCUMENT_ID}-${tabId}`, tab: { id: tabId } };
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

  /** Fire storage.onChanged exactly as Chrome does after a committed write. */
  function announceChange(changes, areaName = 'local') {
    for (const entry of storageListeners.slice()) {
      if (frozen.has(entry.owner)) continue;
      entry.listener(structuredClone(changes), areaName);
    }
  }

  function storageFor(chromeObject, { writable = false, owner = 'unknown' } = {}) {
    const addListener = (listener) => { storageListeners.push({ owner, listener }); };
    const local = {
      get(defaults, callback) {
        const resolveRead = () => {
          const values = {};
          for (const key of Object.keys(defaults)) values[key] = storage.has(key) ? storage.get(key) : defaults[key];
          if (currentReadMode === 'rejected') {
            chromeObject.runtime.lastError = { message: 'Storage read failed' };
            callback(undefined);
            chromeObject.runtime.lastError = undefined;
            return;
          }
          callback(values);
        };
        if (currentReadMode === 'deferred') pendingReads.push(resolveRead);
        else if (currentReadMode === 'throws') throw new Error('Storage unavailable');
        else setTimeout(resolveRead, 0);
      },
    };
    if (!writable) {
      // A content script that tried to write the preference would be a second
      // writer, which is exactly what the serialized worker exists to prevent.
      local.set = function () { forbidden.push('content chrome.storage.local.set'); throw new Error('Forbidden storage write'); };
      local.remove = function () { forbidden.push('content chrome.storage.local.remove'); throw new Error('Forbidden storage write'); };
      return { onChanged: { addListener }, local };
    }
    local.set = function set(items, callback) {
      writeLog.push(structuredClone(items));
      const commit = () => {
        if (currentWriteMode === 'rejected') {
          chromeObject.runtime.lastError = { message: 'Storage write failed' };
          if (typeof callback === 'function') callback();
          chromeObject.runtime.lastError = undefined;
          return;
        }
        const changes = {};
        for (const [key, value] of Object.entries(items)) {
          const had = storage.has(key);
          const oldValue = storage.get(key);
          if (had && oldValue === value) continue;
          storage.set(key, value);
          changes[key] = had ? { oldValue, newValue: value } : { newValue: value };
        }
        if (typeof callback === 'function') callback();
        if (Object.keys(changes).length > 0) announceChange(changes);
      };
      if (currentWriteMode === 'deferred') pendingWrites.push(commit);
      else if (currentWriteMode === 'throws') throw new Error('Storage unavailable');
      else setTimeout(commit, 0);
    };
    return { onChanged: { addListener }, local };
  }

  const contentChromes = new Map();
  function contentChromeFor(tabId) {
    if (contentChromes.has(tabId)) return contentChromes.get(tabId);
    const object = {};
    object.runtime = runtimeFor(object, tabId);
    object.storage = storageFor(object, { owner: tabId });
    contentChromes.set(tabId, object);
    return object;
  }
  const contentChrome = contentChromeFor(TAB_ID);

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
  // The popup has no storage of its own: the worker is the single writer and
  // the single authority, so a popup-side store would be a second source of
  // truth. Touching one is a forbidden channel.
  popupChrome.storage = denyStore('popup chrome.storage');

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
        return Promise.resolve(tabs.filter((tab) => tab.active && tab.currentWindow).map((tab) => ({ ...tab })));
      },
      sendMessage(tabId, message, options) {
        record('to-content', message);
        expect(options).toEqual({ frameId: 0 });
        if (disconnected.has(tabId) || !tabs.some((tab) => tab.id === tabId)) {
          return Promise.reject(new Error('Could not establish connection. Receiving end does not exist.'));
        }
        return deliver(listenersFor(tabId), message, { id: EXTENSION_ID }, replyQueue.length > 0 ? replyQueue.shift() : 0);
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
  workerChrome.runtime.lastError = undefined;
  workerChrome.storage = storageFor(workerChrome, { writable: true, owner: 'worker' });

  return {
    contentChrome, contentChromeFor, workerChrome, popupChrome, forbidden, traffic, actions, actionLog, tabsEvents,
    deny, denyStore,
    action: (tabId = TAB_ID) => actions.get(tabId),
    flushReads() { for (const read of pendingReads.splice(0)) read(); },
    pendingReadCount: () => pendingReads.length,
    flushWrites() { for (const write of pendingWrites.splice(0)) write(); },
    pendingWriteCount: () => pendingWrites.length,
    writeLog,
    setStored(key, value) { storage.set(key, value); },
    getStored: (key) => (storage.has(key) ? storage.get(key) : undefined),
    /** Everything persisted, as a plain object — the browser's on-disk state. */
    snapshot: () => Object.fromEntries(storage),
    storageKeys: () => [...storage.keys()].sort(),
    setReadMode(mode) { currentReadMode = mode; },
    setWriteMode(mode) { currentWriteMode = mode; },
    disconnectContent(tabId = TAB_ID) { disconnected.add(tabId); listenersFor(tabId).splice(0); },
    openTab(tabId) { tabs.push({ id: tabId, active: false, currentWindow: true }); },
    activateTab(tabId) {
      for (const tab of tabs) tab.active = tab.id === tabId;
      for (const listener of tabsEvents.activated.slice()) listener({ tabId, windowId: 1 });
    },
    /** Move the focused window elsewhere: no tab of this window is current. */
    leaveWindow() { for (const tab of tabs) tab.currentWindow = false; },
    closeTab(tabId) {
      const index = tabs.findIndex((tab) => tab.id === tabId);
      if (index >= 0) tabs.splice(index, 1);
      disconnected.add(tabId);
      listenersFor(tabId).splice(0);
      for (const listener of tabsEvents.removed.slice()) listener(tabId, { windowId: 1, isWindowClosing: false });
    },
    /** Terminate the worker: every global it held is gone, as Chrome does. */
    terminateWorker() {
      workerListeners = [];
      tabsEvents.activated.splice(0); tabsEvents.updated.splice(0); tabsEvents.removed.splice(0);
    },
    breakAction() { actionAvailable = false; },
    repairAction() { actionAvailable = true; },
    breakQuery() { queryAvailable = false; },
    emitStorageChange(changes, areaName = 'local') { announceChange(changes, areaName); },
    /** A frozen tab cannot execute handlers or timers until it is resumed. */
    freezeTab(tabId) { frozen.add(tabId); },
    thawTab(tabId) { frozen.delete(tabId); },
    sendToWorker(message, sender) { return deliver(workerListeners, message, sender).catch((error) => error); },
    storageListenerCount: () => storageListeners.length,
  };
}

// --- context loaders --------------------------------------------------------

export function loadContent(world, { html = fixture(), tabId = TAB_ID } = {}) {
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
  const context = createContext({ ...sentinels, document, window, chrome: world.contentChromeFor(tabId),
    MutationObserver: window.MutationObserver, setTimeout, clearTimeout, Promise, Object, JSON,
  }, { codeGeneration: { strings: false, wasm: false } });
  const before = Object.keys(context);
  new Script(asset('content.js'), { filename: 'content.js' }).runInContext(context);
  return { window, document, context, before };
}

export function loadWorker(world) {
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

export function loadPopup(world) {
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

export const statusText = (document) => document.getElementById('zhroma-status').textContent;
export const markers = (document) => [...document.querySelectorAll('[data-zhroma-priority]')]
  .map((row) => row.getAttribute('data-zhroma-priority'));
/** The single decided switch, found the way an agent's screen reader would. */
export const control = (document) => document.getElementById('zhroma-enabled');

/** Operate the switch the way a person does: change the control, let it fire. */
export async function flip(popup, value) {
  const box = control(popup.document);
  box.checked = value;
  box.dispatchEvent(new popup.window.Event('change', { bubbles: true }));
  await settle();
  await settle();
}

export async function bootAll(options = {}) {
  const world = createWorld(options);
  const worker = loadWorker(world);
  const content = loadContent(world, options);
  await settle();
  const popup = loadPopup(world);
  await settle();
  await settle();
  return { world, worker, content, popup };
}
