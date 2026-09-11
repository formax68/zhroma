// Test-only strict Chrome harness for the inherited runtime suites.
//
// Nothing in this file ships. The extension package contains no test double and
// no `chrome` fallback: `test/extension/toolbar-popup.test.js` pins the packaged
// inventory, and `runtime-contract.test.js` pins it again recursively.
//
// The harness models exactly the seams the shipped content script uses:
//   * chrome.storage.local.get({enabled: true}, callback)
//   * chrome.storage.onChanged.addListener(listener)
//   * chrome.runtime.onMessage.addListener(listener)
//   * chrome.runtime.sendMessage({type: 'status-invalidated'}, callback?)
//   * chrome.runtime.id, chrome.runtime.lastError
//
// Everything else — another API namespace, another method, another storage
// area, another storage key, another message shape, a non-function listener —
// is a violation. A violation is both recorded and thrown, because the shipped
// script wraps every Chrome call in try/catch: throwing alone would be
// swallowed, so `assertClean()` is what actually fails the suite.
//
// Delivery is strictly asynchronous in the sense that matters here: a read is
// NEVER resolved inside the `get` call. It is queued and released by `flush()`,
// so a suite can observe the real pre-confirmation state — the shipped script
// running with an unconfirmed preference — before deciding to confirm it.

/** The one contract shared by this harness and the 04-02 tracer's fake Chrome. */
export const PREFERENCE_CONTRACT = Object.freeze({
  key: 'enabled',
  area: 'local',
  defaults: Object.freeze({ enabled: true }),
  statusMessage: Object.freeze({ type: 'status-invalidated' }),
  statusRequestType: 'get-status',
  // Exactly three product diagnoses (FAIL-01) plus one operational value.
  // `neutral` describes what the extension is doing, never what the view is.
  diagnoses: Object.freeze(['working', 'missing', 'cannot-read', 'neutral']),
  reasons: Object.freeze(['blank', 'unsupported-language', 'structure', null]),
  maxRequestId: 1000000,
});

export const HARNESS_EXTENSION_ID = 'zhromaharnesscontextidnotarealone';

const ABSENT = Symbol('absent');

/**
 * `rejected-with-values` is the Chrome path that makes the shipped `lastError`
 * check load-bearing: the callback receives a fully-populated values object
 * AND a set last error. Modelling a failed read as `callback(undefined)` alone
 * lets the falsy-values path produce the dormancy, so deleting the check
 * changes nothing observable (04-REVIEW WR-03).
 *
 * @param {{stored?: unknown, readMode?: 'deferred'|'rejected'|'rejected-with-values'|'throws', extensionId?: string}} [options]
 */
export function createChromeHarness({ stored = ABSENT, readMode = 'deferred', extensionId = HARNESS_EXTENSION_ID } = {}) {
  if (!['deferred', 'rejected', 'rejected-with-values', 'throws'].includes(readMode)) throw new Error(`Unknown readMode ${readMode}`);
  const violations = [];
  const messages = [];
  const storageListeners = [];
  const messageListeners = [];
  const pending = [];
  let storedValue = stored;
  let reads = 0;

  const fail = (what) => {
    violations.push(what);
    throw new Error(`Unpermitted Chrome usage: ${what}`);
  };

  // Only the named members exist. Symbol probes (host inspection, cloning
  // protocols) resolve to undefined rather than counting as shipped usage.
  const strict = (path, members) => new Proxy(members, {
    get(target, property) {
      if (typeof property === 'symbol') return undefined;
      if (!Object.hasOwn(target, property)) fail(`${path}.${property}`);
      return target[property];
    },
    set(_target, property) { return fail(`${path}.${String(property)} =`); },
    defineProperty(_target, property) { return fail(`defineProperty ${path}.${String(property)}`); },
    deleteProperty(_target, property) { return fail(`delete ${path}.${String(property)}`); },
    has(target, property) { return Object.hasOwn(target, property); },
    ownKeys(target) { return Reflect.ownKeys(target); },
  });

  const runtimeMembers = {
    id: extensionId,
    lastError: undefined,
    onMessage: null,
    sendMessage: null,
  };

  // `payload` is what Chrome hands the callback alongside the error. It
  // defaults to `undefined`, which is the shape every existing call site
  // already relied on.
  const withLastError = (message, callback, payload = undefined) => {
    runtimeMembers.lastError = { message };
    try { callback(payload); } finally { runtimeMembers.lastError = undefined; }
  };

  runtimeMembers.onMessage = strict('chrome.runtime.onMessage', {
    addListener(listener) {
      if (typeof listener !== 'function') fail('chrome.runtime.onMessage.addListener(non-function)');
      messageListeners.push(listener);
    },
  });

  runtimeMembers.sendMessage = function sendMessage(message, callback) {
    const keys = message === null || typeof message !== 'object' || Array.isArray(message)
      ? null : Object.keys(message);
    if (keys === null || keys.length !== 1 || keys[0] !== 'type'
      || message.type !== PREFERENCE_CONTRACT.statusMessage.type) {
      fail(`chrome.runtime.sendMessage(${JSON.stringify(message) ?? String(message)})`);
    }
    messages.push({ type: message.type });
    if (callback === undefined) return undefined;
    if (typeof callback !== 'function') fail('chrome.runtime.sendMessage(non-function callback)');
    // No worker is loaded in these suites, so Chrome reports the closed port
    // on the queue — never inside the call.
    pending.push(() => withLastError('Could not establish connection. Receiving end does not exist.', callback));
    return undefined;
  };

  const localMembers = {
    get(defaults, callback) {
      const keys = defaults === null || typeof defaults !== 'object' || Array.isArray(defaults)
        ? null : Object.keys(defaults);
      if (keys === null || keys.length !== 1 || keys[0] !== PREFERENCE_CONTRACT.key
        || defaults[PREFERENCE_CONTRACT.key] !== true) {
        fail(`chrome.storage.local.get(${JSON.stringify(defaults) ?? String(defaults)})`);
      }
      if (typeof callback !== 'function') fail('chrome.storage.local.get(non-function callback)');
      reads += 1;
      if (readMode === 'throws') throw new Error('Storage unavailable');
      pending.push(() => {
        if (readMode === 'rejected') { withLastError('Storage read failed', callback); return; }
        // Only an absent key is filled by the caller's default.
        const values = { [PREFERENCE_CONTRACT.key]: storedValue === ABSENT ? defaults[PREFERENCE_CONTRACT.key] : storedValue };
        // The failed-but-populated read: the values object the immediate path
        // would have delivered, plus a set last error. The only thing standing
        // between this and default-on is the shipped `lastError` check.
        if (readMode === 'rejected-with-values') { withLastError('Storage read failed', callback, values); return; }
        callback(values);
      });
    },
  };

  const storageMembers = {
    onChanged: strict('chrome.storage.onChanged', {
      addListener(listener) {
        if (typeof listener !== 'function') fail('chrome.storage.onChanged.addListener(non-function)');
        storageListeners.push(listener);
      },
    }),
    local: strict('chrome.storage.local', localMembers),
  };

  const chrome = strict('chrome', {
    runtime: strict('chrome.runtime', runtimeMembers),
    storage: strict('chrome.storage', storageMembers),
  });

  return {
    chrome,
    violations,
    messages,
    readCount: () => reads,
    pendingCount: () => pending.length,
    storageListenerCount: () => storageListeners.length,
    messageListenerCount: () => messageListeners.length,
    /** Release every queued Chrome delivery, in the order Chrome queued it. */
    flush(maxDeliveries = 1000) {
      if (!Number.isInteger(maxDeliveries) || maxDeliveries < 1) throw new Error('Invalid Chrome harness delivery limit');
      let released = 0;
      // Drain finite generations in FIFO order; preserve undispatched work
      // when a reentrant callback exceeds this flush's delivery budget.
      while (pending.length > 0) {
        if (released >= maxDeliveries) throw new Error('Chrome harness delivery limit exceeded');
        const deliver = pending.shift();
        deliver();
        released += 1;
      }
      return released;
    },
    setStored(value) { storedValue = value; },
    clearStored() { storedValue = ABSENT; },
    emitChange(changes, area = PREFERENCE_CONTRACT.area) {
      for (const listener of storageListeners.slice()) listener(changes, area);
    },
    /** Ask the content script for its status exactly as the packaged worker does. */
    requestStatus({ requestId = 1, sender = { id: extensionId } } = {}) {
      const replies = [];
      for (const listener of messageListeners.slice()) {
        listener({ type: PREFERENCE_CONTRACT.statusRequestType, requestId }, sender, (value) => replies.push(value));
      }
      return replies[0];
    },
    assertClean() {
      if (violations.length > 0) throw new Error(`Unpermitted Chrome usage: ${violations.join(', ')}`);
    },
  };
}
