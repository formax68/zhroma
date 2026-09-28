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
import { readFileSync, readdirSync } from 'node:fs';
import { URL } from 'node:url';
import { createContext, Script } from 'node:vm';
import { Window } from 'happy-dom';

const root = new URL('../../extension/', import.meta.url);
export const asset = (name) => readFileSync(new URL(name, root), 'utf8');
export const extensionRoot = root;

export const EXTENSION_ID = 'zhromatracercontextidnotarealone';
export const POPUP_PATH = 'popup.html';
export const POPUP_URL = `chrome-extension://${EXTENSION_ID}/${POPUP_PATH}`;
// The document a content script runs in, as Chrome reports it on `sender.url`.
// A synthetic tenant, never a real one (D-17): the worker admits a content
// message only from a `https` Zendesk agent document.
export const CONTENT_URL = 'https://acme.zendesk.com/agent/filters/1';
export const TAB_ID = 7;
export const OTHER_TAB_ID = 9;
// The packaged options page (D-18). With `open_in_tab: true` it is a top-frame
// tab document, so the sender Chrome reports for it carries a tab, unlike the
// popup's: that difference is what the worker's D-17 checks must survive.
export const OPTIONS_PATH = 'options.html';
export const OPTIONS_URL = `chrome-extension://${EXTENSION_ID}/${OPTIONS_PATH}`;
export const optionsSender = (tabId = OTHER_TAB_ID) => ({
  id: EXTENSION_ID, url: OPTIONS_URL, tab: { id: tabId }, frameId: 0, documentId: 'options-document',
});
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
  unknown: 'Zhroma could not confirm that setting',
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

// Every artwork the store package actually contains, READ FROM THE DIRECTORY
// rather than transcribed: a shape added in a later phase must not be able to
// leave this inventory stale, which is the same defect class the transcribed
// `find` literal of a mutation entry can carry. Chrome rejects `setIcon` for a
// path the package does not contain, so the double refuses one too — without
// that, a status with no packaged artwork records an `actionLog` entry naming
// `undefined` and the platform's real failure mode is never reproduced.
export const PACKAGED_ICON_PATHS = readdirSync(new URL('icons/', root)).sort().map((name) => `icons/${name}`);
const PACKAGED_ICONS = new Set(PACKAGED_ICON_PATHS);

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

export function createWorld({
  stored = null, readMode = 'immediate', writeMode = 'immediate', replyDelays = [], responseDelays = [],
  portCloseMs = 500, settingsReadMode = 'immediate',
} = {}) {
  const forbidden = [];
  const traffic = [];
  const actionLog = [];
  const actionAttempts = [];
  const apiLog = [];
  const epochs = [];
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
  const pendingCallbacks = [];
  const holds = new Set();
  const held = new Map();
  const ownerReadModes = new Map();
  const physicalWrites = new Set();
  const writeObservations = [];
  const stageNames = ['worker-read', 'content-read', 'worker-settings-read', 'content-settings-read', 'query', 'icon', 'title',
    'popup-response', 'content-response'];
  function schedule(stage, work, tabId) {
    const key = holds.has(`${stage}:${tabId}`) ? `${stage}:${tabId}` : stage;
    if (!holds.has(key)) { work(); return; }
    if (!held.has(key)) held.set(key, []);
    held.get(key).push(work);
  }
  function checkMode(mode, allowed) {
    if (!allowed.includes(mode)) throw new Error(`Unknown harness mode: ${mode}`);
    return mode;
  }
  const readModes = ['immediate', 'deferred', 'rejected', 'rejected-with-values', 'throws', 'malformed'];
  const writeModes = ['immediate', 'deferred', 'callback-held', 'rejected', 'throws'];
  // The settings read is a SEPARATE seam from the preference read (07-04, A6):
  // an array-form `get` has its own mode, its own deferred queue and its own
  // stages, so every v1 assertion about preference reads keeps counting only
  // preference reads. `hang` models a read whose callback never arrives.
  const settingsReadModes = ['immediate', 'deferred', 'rejected', 'rejected-with-values', 'throws', 'hang'];
  checkMode(readMode, readModes); checkMode(writeMode, writeModes); checkMode(settingsReadMode, settingsReadModes);
  const pendingSettingsReads = [];
  const ownerSettingsReadModes = new Map();
  const settingsReads = { worker: 0, content: 0 };
  let currentSettingsReadMode = settingsReadMode;
  const writeLog = [];
  const tabs = [{ id: TAB_ID, active: true, currentWindow: true }];
  const replyQueue = [...replyDelays];
  // Two different slownesses, and the difference is the whole point of WR-01.
  // `replyDelays` defers DELIVERY, so the document computes its answer late and
  // therefore answers with FRESH data — nothing stale is ever in flight.
  // `responseDelays` defers THE ANSWER: the document answers on time and the
  // payload it produced goes stale while it travels. Only the second one can
  // construct a superseded reply, which is what the worker's generation guards
  // and its per-tab queue exist to discard.
  const responseQueue = [...responseDelays];
  const tabsEvents = { activated: [], updated: [], removed: [] };
  const disconnected = new Set();
  let actionAvailable = true;
  let queryAvailable = true;
  let currentWriteMode = writeMode;
  let currentReadMode = readMode;
  // How long a listener that answered `true` may hold the channel before Chrome
  // reports the port closed. Configurable because a frame that accepts a
  // message and never answers is only modellable if the double's own fallback
  // outlives the deadline the shipped worker is being tested against.
  let currentPortCloseMs = portCloseMs;
  // Applied when the `responseDelays` queue is exhausted, so a hold can be
  // switched on at the moment a test needs one rather than counted out from
  // construction time. Zero keeps today's behaviour for every existing caller.
  let currentResponseDelay = 0;
  // How long `chrome.action.setIcon` takes to resolve. Zero by default: only a
  // test that needs a generation bump BETWEEN the two action writes turns it up.
  let currentActionDelay = 0;

  const deny = (name) => function () { forbidden.push(name); throw new Error('Forbidden runtime channel'); };
  const denyStore = (name) => new Proxy({}, { get() { forbidden.push(name); throw new Error('Forbidden store access'); } });
  const record = (direction, payload) => { traffic.push({ direction, at: Date.now(), payload: structuredClone(payload) }); return payload; };

  // Deliver exactly like Chrome: asynchronously, resolving only when a listener
  // answers, rejecting when nothing is listening or the channel closes unused.
  function deliver(listeners, message, sender, delay = 0, responseDelay = 0) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (listeners.length === 0) { reject(new Error('Could not establish connection. Receiving end does not exist.')); return; }
        let settled = false;
        let asyncPending = false;
        const sendResponse = (value) => {
          if (settled) return;
          // Mark settled and CAPTURE the payload now, before the delay: the
          // exchange really is answered at this instant, so the port-close
          // fallback must not fire, and the value released later must be the
          // one the listener produced HERE. Recomputing it after the delay
          // would hand back fresh data and reconstruct the vacuity WR-01 found.
          settled = true;
          record('response', value);
          const captured = structuredClone(value);
          // Both extension pages answer like the popup; only documents on the
          // vendor host are content.
          const stage = sender.url === POPUP_URL || sender.url === OPTIONS_URL ? 'popup-response' : 'content-response';
          schedule(stage, () => {
            if (responseDelay > 0) setTimeout(() => { resolve(captured); }, responseDelay);
            else resolve(captured);
          });
        };
        for (const listener of listeners) {
          const result = listener(structuredClone(message), structuredClone(sender), sendResponse);
          if (result === true) asyncPending = true;
        }
        if (!settled && !asyncPending) reject(new Error('The message port closed before a response was received.'));
        else if (!settled) setTimeout(() => { if (!settled) reject(new Error('The message port closed before a response was received.')); }, currentPortCloseMs);
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
        const sender = { id: EXTENSION_ID, url: CONTENT_URL, frameId: 0, documentId: `${DOCUMENT_ID}-${tabId}`, tab: { id: tabId } };
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
    const kind = owner === 'worker' ? 'worker' : 'content';
    // Only the local area exists for Zhroma (DATA-01, D-03). Touching sync,
    // session or managed is recorded like any other forbidden channel.
    const areas = {
      sync: denyStore(`${kind} chrome.storage.sync`),
      session: denyStore(`${kind} chrome.storage.session`),
      managed: denyStore(`${kind} chrome.storage.managed`),
    };
    function getSettings(keys, callback) {
      const mode = ownerSettingsReadModes.get(kind) ?? currentSettingsReadMode;
      settingsReads[kind] += 1;
      if (mode === 'throws') throw new Error('Storage unavailable');
      // Only the keys storage actually holds, cloned: a caller must never be
      // able to reach into the stored object.
      const values = {};
      for (const key of keys) if (storage.has(key)) values[key] = structuredClone(storage.get(key));
      const resolveRead = () => {
        if (mode === 'rejected' || mode === 'rejected-with-values') {
          chromeObject.runtime.lastError = { message: 'Storage read failed' };
          callback(mode === 'rejected' ? undefined : values);
          chromeObject.runtime.lastError = undefined;
          return;
        }
        callback(values);
      };
      if (mode === 'hang') return;
      if (mode === 'deferred') pendingSettingsReads.push(resolveRead);
      else setTimeout(() => schedule(`${kind}-settings-read`, resolveRead), 0);
    }
    const local = {
      get(defaults, callback) {
        if (Array.isArray(defaults)) { getSettings(defaults, callback); return; }
        const mode = ownerReadModes.get(owner === 'worker' ? 'worker' : 'content') ?? currentReadMode;
        const values = {};
        for (const key of Object.keys(defaults)) values[key] = storage.has(key) ? storage.get(key) : defaults[key];
        const resolveRead = () => {
          if (mode === 'rejected') {
            chromeObject.runtime.lastError = { message: 'Storage read failed' };
            callback(undefined);
            chromeObject.runtime.lastError = undefined;
            return;
          }
          // A read that failed while still delivering the fully-resolved values
          // object. Chrome does this on quota and IO paths, and it is the only
          // shape in which the shipped `lastError` check is load-bearing: with
          // `undefined` the falsy-values path produces the same dormancy, so
          // deleting the check changes nothing (04-REVIEW WR-03).
          if (mode === 'rejected-with-values') {
            chromeObject.runtime.lastError = { message: 'Storage read failed' };
            callback(values);
            chromeObject.runtime.lastError = undefined;
            return;
          }
          callback(mode === 'malformed' ? { enabled: 'invalid' } : values);
        };
        if (mode === 'deferred') pendingReads.push(resolveRead);
        else if (mode === 'throws') throw new Error('Storage unavailable');
        else setTimeout(() => schedule(owner === 'worker' ? 'worker-read' : 'content-read', resolveRead), 0);
      },
    };
    if (!writable) {
      // A content script that tried to write the preference would be a second
      // writer, which is exactly what the serialized worker exists to prevent.
      local.set = function () { forbidden.push('content chrome.storage.local.set'); throw new Error('Forbidden storage write'); };
      local.remove = function () { forbidden.push('content chrome.storage.local.remove'); throw new Error('Forbidden storage write'); };
      return { onChanged: { addListener }, local, ...areas };
    }
    local.set = function set(items, callback) {
      writeLog.push(structuredClone(items));
      const mode = currentWriteMode;
      if (mode === 'throws') throw new Error('Storage unavailable');
      const operation = {};
      physicalWrites.add(operation);
      writeObservations.push(physicalWrites.size);
      const finish = () => {
        physicalWrites.delete(operation);
        writeObservations.push(physicalWrites.size);
        if (mode === 'rejected') chromeObject.runtime.lastError = { message: 'Storage write failed' };
        if (typeof callback === 'function') callback();
        chromeObject.runtime.lastError = undefined;
      };
      const commit = () => {
        if (mode === 'rejected') { finish(); return; }
        const changes = {};
        for (const [key, value] of Object.entries(items)) {
          const had = storage.has(key);
          const oldValue = storage.get(key);
          // Chrome stores a copy and announces only a real change. Comparing
          // serialisations is identical to `===` for the boolean, and also
          // right for the object-valued settings (07-04).
          if (had && JSON.stringify(oldValue) === JSON.stringify(value)) continue;
          storage.set(key, structuredClone(value));
          changes[key] = had ? { oldValue, newValue: value } : { newValue: value };
        }
        if (mode === 'callback-held' || mode === 'deferred') pendingCallbacks.push(finish);
        else finish();
        if (Object.keys(changes).length > 0) announceChange(changes);
      };
      if (mode === 'deferred') pendingWrites.push(commit);
      else setTimeout(commit, 0);
    };
    return { onChanged: { addListener }, local, ...areas };
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
      query(options = {}) {
        if (!queryAvailable) return Promise.reject(new Error('Tabs unavailable'));
        const captured = tabs.filter((tab) => (!options.active || tab.active)
          && (!options.currentWindow || tab.currentWindow)).map((tab) => ({ ...tab }));
        return new Promise((resolve) => schedule('query', () => resolve(captured)));
      },
      sendMessage(tabId, message, options) {
        record('to-content', message);
        // RECORDED, never thrown. The worker calls this inside try/catch, so a
        // thrown assertion is swallowed by production code and laundered into
        // a plausible-looking `unavailable` instead of failing the suite
        // (04-REVIEW WR-10). Suites already assert `forbidden` is empty, which
        // is the same route `chrome-harness.js` uses.
        const targeted = options !== null && typeof options === 'object' && !Array.isArray(options)
          && Object.keys(options).length === 1 && options.frameId === 0;
        if (!targeted) forbidden.push('worker chrome.tabs.sendMessage frameId');
        if (disconnected.has(tabId) || !tabs.some((tab) => tab.id === tabId)) {
          return Promise.reject(new Error('Could not establish connection. Receiving end does not exist.'));
        }
        return deliver(
          listenersFor(tabId), message, { id: EXTENSION_ID },
          replyQueue.length > 0 ? replyQueue.shift() : 0,
          responseQueue.length > 0 ? responseQueue.shift() : currentResponseDelay,
        );
      },
    },
    action: {
      setIcon({ tabId, path }) {
        actionAttempts.push({ tabId, icon: path });
        const targetTab = tabs.find((tab) => tab.id === tabId);
        if (!targetTab) return Promise.reject(new Error('No tab with id'));
        if (!actionAvailable) return Promise.reject(new Error('Action unavailable'));
        // Chrome refuses artwork the package does not contain, and the refusal
        // is what makes the review's stated impact reachable: the worker's
        // `catch` swallows it, `setTitle` is never reached, and the tab keeps
        // its previous claim about the view.
        if (!PACKAGED_ICONS.has(path)) return Promise.reject(new Error('Icon path is not packaged'));
        const land = () => {
          if (!tabs.includes(targetTab)) return false;
          actions.set(tabId, { ...actions.get(tabId), icon: path });
          actionLog.push({ tabId, icon: path });
          return true;
        };
        // The write still happens — a native call already issued cannot be
        // recalled — it just lands late, which is what opens the window
        // between the icon and the title that `applyAction` guards.
        if (currentActionDelay > 0) {
          const delay = currentActionDelay;
          return new Promise((resolve, reject) => { setTimeout(() => { if (land()) resolve(); else reject(new Error('No tab with id')); }, delay); });
        }
        return new Promise((resolve, reject) => schedule('icon', () => {
          if (land()) resolve(); else reject(new Error('No tab with id'));
        }, tabId));
      },
      setTitle({ tabId, title }) {
        actionAttempts.push({ tabId, title });
        const targetTab = tabs.find((tab) => tab.id === tabId);
        if (!targetTab) return Promise.reject(new Error('No tab with id'));
        if (!actionAvailable) return Promise.reject(new Error('Action unavailable'));
        return new Promise((resolve, reject) => schedule('title', () => {
          if (!tabs.includes(targetTab)) { reject(new Error('No tab with id')); return; }
          actions.set(tabId, { ...actions.get(tabId), title });
          actionLog.push({ tabId, title });
          resolve();
        }, tabId));
      },
    },
  };
  workerChrome.runtime.lastError = undefined;
  workerChrome.storage = storageFor(workerChrome, { writable: true, owner: 'worker' });

  return {
    contentChrome, contentChromeFor, workerChrome, popupChrome, forbidden, traffic, actions, actionLog, actionAttempts, apiLog, tabsEvents,
    beginWorkerEpoch() {
      const epoch = { id: epochs.length + 1, alive: true, timers: new Set(), maps: [] };
      epochs.push(epoch);
      const proxy = (object, path = 'chrome') => new Proxy(object, {
        get(target, key) {
          const value = target[key];
          if (typeof value === 'function') return (...args) => {
            apiLog.push({ epoch: epoch.id, alive: epoch.alive, method: `${path}.${String(key)}`, at: Date.now() });
            if (!epoch.alive) { forbidden.push('dead worker API dispatch'); return new Promise(() => {}); }
            const result = value.apply(target, args.map((arg) => typeof arg === 'function'
              ? (...values) => { if (epoch.alive) return arg(...values); return undefined; } : arg));
            if (result && typeof result.then === 'function') return new Promise((resolve, reject) => {
              result.then((answer) => { if (epoch.alive) resolve(answer); }, (error) => { if (epoch.alive) reject(error); });
            });
            return result;
          };
          return value !== null && typeof value === 'object' ? proxy(value, `${path}.${String(key)}`) : value;
        },
      });
      class WorkerMap extends Map {
        constructor(...args) { super(...args); epoch.maps.push(this); }
      }
      return {
        id: epoch.id, chrome: proxy(workerChrome), Map: WorkerMap,
        setTimeout(callback, ms) {
          if (!epoch.alive) return undefined;
          const timer = setTimeout(() => { epoch.timers.delete(timer); if (epoch.alive) callback(); }, ms);
          epoch.timers.add(timer); return timer;
        },
        clearTimeout(timer) { epoch.timers.delete(timer); clearTimeout(timer); },
      };
    },
    retainedWorkerEntries: () => epochs.filter((epoch) => epoch.alive).reduce((n, epoch) =>
      n + epoch.maps.reduce((count, map) => count + map.size, 0), 0),
    deny, denyStore,
    action: (tabId = TAB_ID) => actions.get(tabId),
    flushReads() { for (const read of pendingReads.splice(0)) read(); },
    pendingReadCount: () => pendingReads.length,
    flushSettingsReads() { for (const read of pendingSettingsReads.splice(0)) read(); },
    pendingSettingsReadCount: () => pendingSettingsReads.length,
    /** Settings reads issued so far by `worker` or `content`, or by both. */
    settingsReadCount: (owner) => (owner === undefined ? settingsReads.worker + settingsReads.content
      : settingsReads[checkMode(owner, ['worker', 'content'])]),
    setSettingsReadMode(mode, owner) {
      checkMode(mode, settingsReadModes);
      if (owner) ownerSettingsReadModes.set(checkMode(owner, ['worker', 'content']), mode); else currentSettingsReadMode = mode;
    },
    flushWrites() { for (const write of pendingWrites.splice(0)) write(); for (const callback of pendingCallbacks.splice(0)) callback(); },
    commitWrites() { for (const write of pendingWrites.splice(0)) write(); },
    releaseWriteCallbacks() { for (const callback of pendingCallbacks.splice(0)) callback(); },
    physicalWriteCount: () => physicalWrites.size,
    writeObservations,
    hold(stage, tabId) { checkMode(stage, stageNames); holds.add(tabId === undefined ? stage : `${stage}:${tabId}`); },
    unhold(stage, tabId) { checkMode(stage, stageNames); holds.delete(tabId === undefined ? stage : `${stage}:${tabId}`); },
    release(stage, tabId) { checkMode(stage, stageNames); for (const work of (held.get(tabId === undefined ? stage : `${stage}:${tabId}`) ?? []).splice(0)) work(); },
    pending(stage, tabId) { checkMode(stage, stageNames); return (held.get(tabId === undefined ? stage : `${stage}:${tabId}`) ?? []).length; },
    pendingWriteCount: () => pendingWrites.length,
    writeLog,
    setStored(key, value) { storage.set(key, value); },
    getStored: (key) => (storage.has(key) ? storage.get(key) : undefined),
    /** Everything persisted, as a plain object — the browser's on-disk state. */
    snapshot: () => Object.fromEntries(storage),
    storageKeys: () => [...storage.keys()].sort(),
    setReadMode(mode, owner) { checkMode(mode, readModes); if (owner) ownerReadModes.set(checkMode(owner, ['worker', 'content']), mode); else currentReadMode = mode; },
    setWriteMode(mode) { currentWriteMode = checkMode(mode, writeModes); },
    /** Hold an accepted-but-unanswered channel open for `ms` before closing it. */
    setPortCloseMs(ms) { currentPortCloseMs = ms; },
    disconnectContent(tabId = TAB_ID) { disconnected.add(tabId); listenersFor(tabId).splice(0); },
    /**
     * Silence a tab's listeners WITHOUT marking the tab disconnected, so
     * `workerChrome.tabs.sendMessage` still proceeds into `deliver` and the
     * no-receiver rejection is produced inside the delayed callback rather
     * than synchronously. That is the only way a LATE rejection is reachable,
     * which is what `requestStatus`'s catch-branch guard is about.
     *
     * The list is REBOUND rather than spliced: a delivery already in flight
     * holds the old array and must keep finding it empty, while a document
     * that attaches afterwards is reachable again — a frame that went away
     * and was replaced, not a tab that closed.
     */
    silenceContent(tabId = TAB_ID) { contentListeners.set(tabId, []); },
    /** Hold every subsequent reply for `ms` after the listener produced it. */
    setResponseDelay(ms) { currentResponseDelay = ms; },
    /** Make `chrome.action.setIcon` resolve after `ms`, landing its write then. */
    setActionDelay(ms) { currentActionDelay = ms; },
    openTab(tabId) { disconnected.delete(tabId); tabs.push({ id: tabId, active: false, currentWindow: true }); },
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
      for (const epoch of epochs) {
        epoch.alive = false;
        for (const timer of epoch.timers) clearTimeout(timer);
        epoch.timers.clear();
      }
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

// The one global the shared classic scripts add, in the content world and the
// worker alike (07-03, D-13). Every other name a shipped script declares stays
// inside its IIFE.
export const NAMESPACE = 'Zhroma';

// Every top-level packaged script the worker could import, READ FROM THE
// DIRECTORY rather than transcribed, for the same reason as the icon list: a
// shared file added later must not leave the admitted set stale. The worker
// itself is never an import.
const packagedImports = () => readdirSync(root).filter((name) => name.endsWith('.js') && name !== 'background.js').sort();

/**
 * Load the content world the way Chrome does: every file in the manifest's
 * `content_scripts[0].js`, in order, into one isolated context. `before` is
 * taken before the first script runs.
 */
export function loadContent(world, {
  html = fixture(), tabId = TAB_ID, scripts = JSON.parse(asset('manifest.json')).content_scripts[0].js,
} = {}) {
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
  for (const path of scripts) new Script(asset(path), { filename: path }).runInContext(context);
  return { window, document, context, before };
}

/**
 * Load the worker in a fresh epoch. `importScripts` is admitted the way Chrome
 * admits it: synchronously, and only for packaged top-level scripts, each
 * evaluated into the worker's own context. Any other argument is recorded as a
 * forbidden channel and throws. `imports: 'throws'` models a failed import: an
 * admitted call throws a plain Error and records nothing.
 */
export function loadWorker(world, { imports = 'admit' } = {}) {
  if (!['admit', 'throws'].includes(imports)) throw new Error(`Unknown import mode: ${imports}`);
  const epoch = world.beginWorkerEpoch();
  const admitted = packagedImports();
  let context;
  function importScripts(...paths) {
    for (const path of paths) {
      if (typeof path !== 'string' || !admitted.includes(path)) {
        world.forbidden.push(`importScripts ${String(path)}`);
        throw new Error('Forbidden import');
      }
    }
    if (imports === 'throws') throw new Error('importScripts failed');
    for (const path of paths) new Script(asset(path), { filename: path }).runInContext(context);
  }
  const sentinels = {
    fetch: world.deny('fetch'), XMLHttpRequest: world.deny('XHR'), WebSocket: world.deny('WebSocket'),
    EventSource: world.deny('EventSource'),
    importScripts, localStorage: world.denyStore('localStorage'),
    indexedDB: world.denyStore('indexedDB'), caches: world.denyStore('caches'),
    console: { log: world.deny('console.log'), warn: world.deny('console.warn'), error: world.deny('console.error'), info: world.deny('console.info') },
  };
  context = createContext({ ...sentinels, chrome: epoch.chrome,
    setTimeout: epoch.setTimeout, clearTimeout: epoch.clearTimeout, Promise, Object, JSON, Map: epoch.Map, Number, Array, Date,
    // Chrome's service worker has URL; a bare vm context does not (D-17).
    URL,
  }, { codeGeneration: { strings: false, wasm: false } });
  const before = Object.keys(context);
  new Script(asset('background.js'), { filename: 'background.js' }).runInContext(context);
  return { context, before, epochId: epoch.id };
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
