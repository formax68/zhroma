// The shared settings module loads first, so every later shared file and the
// worker below can rely on it. The load is guarded: the off switch and the
// toolbar never depend on the settings module, so a failed load leaves this
// worker running exactly as it did without one.
try {
  importScripts('zhroma-settings.js');
} catch {
  // Deliberately empty: the worker keeps running without the module.
}

(() => {
  'use strict';

  // A disposable adapter, never a database. Every listener is registered
  // synchronously at top level so a woken worker cannot miss an event, and all
  // per-tab state is reconstructible from a fresh handshake after termination.
  //
  // It is also the SINGLE writer of the one persisted boolean. The content
  // script and the popup only ever read it back through this worker, so two
  // popups cannot race each other into an inverted preference.

  const POPUP_PATH = 'popup.html';
  const MAX_REQUEST_ID = 1000000;
  // A hop into a document is bounded. A top frame that receives a message and
  // never answers must cost one wait, not the off switch: every preference
  // write chains behind the pending task below, so an unbounded await here
  // would leave the switch inoperative in EVERY tab until Chrome terminated
  // the worker.
  const REQUEST_TIMEOUT_MS = 2000;
  const WORKER_REQUEST_TIMEOUT_MS = 4000;
  const MAX_PENDING_PREFERENCES = 32;
  const PREFERENCE_KEY = 'enabled';
  // Exactly three product diagnoses (FAIL-01). `neutral`, `off` and the
  // worker-only `unavailable` describe what the extension is doing, not what
  // the view is, and are never a fourth diagnosis.
  const DIAGNOSES = ['working', 'missing', 'cannot-read', 'neutral'];
  const REASONS = ['blank', 'unsupported-language', 'structure', null];

  // One packaged shape per diagnosis: a check, a column with a plus, and a
  // question mark. Shape carries the meaning and the title says it in words —
  // colour is never the only difference.
  const ICONS = {
    'working': 'icons/working.png',
    'missing': 'icons/missing.png',
    'cannot-read': 'icons/unreadable.png',
    // Operational, not a diagnosis: the extension is still looking, or it
    // could not reach a document. Never a claim about the tab.
    'neutral': 'icons/neutral.png',
    'unavailable': 'icons/neutral.png',
    // Also operational, and the fifth decided shape: a power symbol. The agent
    // switched it off, which is a fact about Zhroma, not about the view.
    'off': 'icons/off.png',
  };

  // Explanatory titles, never shape or colour alone. Fixed copy, no page input.
  // The key is the whole {diagnosis, reason} pair, so an unpaired combination
  // is not renderable rather than silently falling back to a weaker message.
  const TITLES = {
    'working': 'Priority tinting is working',
    'working:blank': 'Priority column found. These tickets have no priority values set',
    'missing': 'Add a Priority column to this view to use tinting',
    'cannot-read:unsupported-language': 'This interface language is not supported',
    'cannot-read:structure': "Zhroma cannot read this view's ticket table",
    'neutral': 'Checking this view',
    'off': 'Tinting is off',
    'unavailable': 'No readable view is connected',
  };

  const statusKey = (status, reason) => (reason === null ? status : `${status}:${reason}`);

  const tabs = new Map();
  let requestCounter = 0;
  let projectionCounter = 0;
  // One writer, one queue. Two popups asking for opposite values are applied in
  // arrival order, and the last request is the one that survives.
  const preferenceQueue = [];
  let activePreference = null;
  let pendingWrite = null;
  // An issued write invalidates every earlier captured preference, even if its
  // callback settles before a waiting popup resumes. This is epoch-local only.
  let writeEpoch = 0;

  const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const isExact = (value, keys) => isObject(value)
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
  const isRequestId = (value) => Number.isInteger(value) && value >= 1 && value <= MAX_REQUEST_ID;
  const nextRequestId = () => { requestCounter = requestCounter % MAX_REQUEST_ID + 1; return requestCounter; };

  // Resolve with `null` when the deadline wins, and let a rejection through
  // untouched so the caller's own catch still sees a genuine send failure.
  // `null` is deliberate rather than a new sentinel: it is not an object, so
  // `isExact` already refuses it and both call sites convert it into the
  // outcome they already have for an unusable reply. No new branch, no new
  // reported state, no new copy.
  function bounded(start, expires, cap = WORKER_REQUEST_TIMEOUT_MS) {
    const remaining = Math.min(cap, expires - Date.now());
    if (remaining <= 0) return Promise.resolve(null);
    let timer;
    const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve(null), remaining); });
    let native;
    try { native = start(); } catch (error) { clearTimeout(timer); return Promise.reject(error); }
    return Promise.race([native, timeout]).finally(() => clearTimeout(timer));
  }

  function stateFor(tabId) {
    let state = tabs.get(tabId);
    if (state === undefined) {
      state = { generation: 0, lifetime: 0, pending: null, observing: false, actionPending: null, actionRunning: false, reconcile: false };
      tabs.set(tabId, state);
    }
    return state;
  }

  const invalidate = (tabId) => { const state = stateFor(tabId); state.generation = ++projectionCounter; return state.generation; };
  const generationOf = (tabId) => (tabs.has(tabId) ? tabs.get(tabId).generation : -1);

  // --- the one persisted boolean --------------------------------------------

  // Reads answer with the value storage actually holds, never with the value
  // anyone hoped for. `null` means unconfirmed — a failure, never absence.
  function readPreference() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get({ [PREFERENCE_KEY]: true }, (values) => {
          if (chrome.runtime.lastError) { resolve(null); return; }
          const value = isObject(values) ? values[PREFERENCE_KEY] : undefined;
          resolve(typeof value === 'boolean' ? value : null);
        });
      } catch { resolve(null); }
    });
  }

  // Exactly one key, exactly one boolean, exactly one area (D-06). No
  // revision, no timestamp, no per-tab value and no diagnosis is ever written.
  function writePreference(enabled) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.set({ [PREFERENCE_KEY]: enabled }, () => {
          resolve(!chrome.runtime.lastError);
        });
      } catch { resolve(false); }
    });
  }

  function preferenceReply(job) {
    return {
      type: 'set-enabled', requestId: job.requestId, saved: job.saved,
      enabled: pendingWrite !== null ? null : job.enabled,
      applied: job.applied, status: job.status, reason: job.reason,
    };
  }

  function admitPreference(requestId, desired, sendResponse) {
    const job = { requestId, desired, expires: Date.now() + WORKER_REQUEST_TIMEOUT_MS,
      saved: false, enabled: null, applied: false, status: 'unavailable', reason: null,
      expired: false, answered: false, raw: null };
    if (preferenceQueue.length + (activePreference === null ? 0 : 1) >= MAX_PENDING_PREFERENCES) {
      sendResponse(preferenceReply(job));
      return;
    }
    job.answer = () => {
      if (job.answered) return;
      job.answered = true;
      clearTimeout(job.timer);
      sendResponse(preferenceReply(job));
    };
    job.timer = setTimeout(() => {
      job.expired = true;
      const index = preferenceQueue.indexOf(job);
      if (index >= 0) preferenceQueue.splice(index, 1);
      job.answer();
    }, WORKER_REQUEST_TIMEOUT_MS);
    preferenceQueue.push(job);
    drainPreferences();
  }

  async function drainPreferences() {
    if (activePreference !== null) return;
    const job = preferenceQueue.shift();
    if (job === undefined) return;
    activePreference = job;
    try {
      if (!job.expired && Date.now() < job.expires) await setEnabled(job);
    } finally {
      job.answer();
      // Observation expiry is not cancellation. This raw callback exclusively
      // owns the writer even after its requester has already received null.
      if (job.raw !== null) await job.raw;
      activePreference = null;
      drainPreferences();
    }
  }

  // Off is an operational state, never a fourth diagnosis: while it is on, the
  // agent is never told to add a Priority column. A tab that answered nothing
  // keeps reporting the connection, because a global preference says nothing
  // about whether this particular view could be read.
  function operational(result, enabled) {
    if (result.status === 'unavailable') return result;
    if (enabled === false) return { status: 'off', reason: null };
    return result;
  }

  async function activeTab(expires) {
    try {
      const found = await bounded(() => chrome.tabs.query({ active: true, currentWindow: true }), expires);
      const tab = Array.isArray(found) ? found[0] : undefined;
      return isObject(tab) && Number.isInteger(tab.id) ? tab : null;
    } catch { return null; }
  }

  const unavailable = (requestId, enabled = null) => ({
    type: 'popup-status', requestId, status: 'unavailable', reason: null, enabled,
  });

  function validDiagnosis(reply, requestId, type) {
    return reply.type === type && reply.requestId === requestId
      && DIAGNOSES.includes(reply.diagnosis) && REASONS.includes(reply.reason)
      // An unpaired diagnosis and reason is not a state this extension can be
      // in; treat it as a broken connection rather than guessing which half to
      // believe.
      && Object.hasOwn(TITLES, statusKey(reply.diagnosis, reply.reason));
  }

  async function requestStatus(tabId, generation, expires) {
    // A content push is only a hint. Every projection is preceded by a fresh
    // top-frame reply, and a documentId never proves the document is current.
    const requestId = nextRequestId();
    let reply;
    try {
      reply = await bounded(() => chrome.tabs.sendMessage(tabId, { type: 'get-status', requestId }, { frameId: 0 }), expires, REQUEST_TIMEOUT_MS);
    } catch {
      // No receiver, a navigating tab or a reloaded extension. Unavailable is
      // an operational fact about the connection, never a claim about the view.
      return generationOf(tabId) === generation ? { status: 'unavailable', reason: null } : null;
    }
    if (generationOf(tabId) !== generation) return null;
    if (!isExact(reply, ['type', 'requestId', 'diagnosis', 'reason'])
      || !validDiagnosis(reply, requestId, 'status')) {
      return { status: 'unavailable', reason: null };
    }
    return { status: reply.diagnosis, reason: reply.reason };
  }

  // Ask the current top frame to re-read the persisted value and apply it, and
  // wait for the answer. The request carries NO desired value: the document
  // reads storage itself, so a spoofed or replayed request cannot set one.
  //
  // Deliberately NOT guarded by the per-tab projection generation. That
  // generation orders TOOLBAR PAINTS, and applying a preference makes the
  // document publish a new status, which invalidates the generation the caller
  // is holding — so reusing it here would throw away a true answer about work
  // that had just been done. The echoed requestId binds the operation; a
  // separate document lifetime rejects navigation/closure during its await.
  async function requestApply(tabId, expires) {
    const state = stateFor(tabId);
    const lifetime = state.lifetime;
    const requestId = nextRequestId();
    let reply;
    try {
      reply = await bounded(() => chrome.tabs.sendMessage(tabId, { type: 'apply-preference', requestId }, { frameId: 0 }), expires, REQUEST_TIMEOUT_MS);
    } catch { return null; }
    if (tabs.get(tabId) !== state || state.lifetime !== lifetime) return null;
    if (!isExact(reply, ['type', 'requestId', 'applied', 'diagnosis', 'reason'])
      || typeof reply.applied !== 'boolean'
      || !validDiagnosis(reply, requestId, 'applied')) return null;
    if (reply.applied) {
      // The acknowledgement proves work completed, not that its captured view
      // diagnosis survived a later same-document mutation. Reobserve under the
      // original admission deadline; own-apply invalidation is already past.
      // A queued own-apply invalidation may arrive during the first handshake.
      // Permit one fresh retry, never an unbounded observer or renewed budget.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const generation = generationOf(tabId);
        const current = await requestStatus(tabId, generation, expires);
        if (tabs.get(tabId) !== state || state.lifetime !== lifetime) return null;
        if (current === null) continue;
        if (current.status === 'unavailable') return null;
        return { applied: true, status: current.status, reason: current.reason };
      }
      return null;
    }
    return { applied: reply.applied, status: reply.diagnosis, reason: reply.reason };
  }

  const owns = (tabId, state, generation) => tabs.get(tabId) === state && state.generation === generation;

  function reconcileIfNeeded(tabId, state) {
    if (tabs.get(tabId) === state && state.reconcile && !state.observing
      && !state.actionRunning && state.actionPending === null && state.pending === null) project(tabId);
  }

  async function liveTab(tabId, expires) {
    try {
      // Only identity is consumed. No URL, title, or tabs permission is needed.
      const found = await bounded(() => chrome.tabs.query({}), expires);
      return Array.isArray(found) && found.some((tab) => tab.id === tabId);
    } catch { return false; }
  }

  function applyAction(tabId, result, generation, expires) {
    const state = tabs.get(tabId);
    if (state === undefined || !owns(tabId, state, generation) || Date.now() >= expires) return Promise.resolve();
    return new Promise((resolve) => {
      // One native operation and one latest candidate per tab. Superseded
      // callers stop observing; they never release the native operation.
      if (state.actionPending !== null) state.actionPending.resolve();
      state.actionPending = { result, generation, expires, resolve };
      drainActions(tabId, state);
    });
  }

  async function drainActions(tabId, state) {
    if (state.actionRunning || tabs.get(tabId) !== state) return;
    const work = state.actionPending;
    if (work === null) return;
    state.actionPending = null;
    state.actionRunning = true;
    try {
      if (!owns(tabId, state, work.generation) || Date.now() >= work.expires) return;
      await chrome.action.setIcon({ tabId, path: ICONS[work.result.status] });
      if (!owns(tabId, state, work.generation) || Date.now() >= work.expires) return;
      await chrome.action.setTitle({ tabId, title: TITLES[statusKey(work.result.status, work.result.reason)] });
    } catch { /* a closed tab or unavailable native action is not a diagnosis */ }
    finally {
      state.actionRunning = false;
      work.resolve();
      if (tabs.get(tabId) === state) {
        if (!owns(tabId, state, work.generation) || Date.now() >= work.expires) state.reconcile = true;
        if (state.actionPending !== null) drainActions(tabId, state);
        reconcileIfNeeded(tabId, state);
      }
    }
  }

  function project(tabId) {
    const state = stateFor(tabId);
    const generation = invalidate(tabId);
    state.reconcile = false;
    // Coalescing retains only the latest scheduling deadline. Reads and status
    // replies may be abandoned; a native action keeps its separate ownership.
    state.pending = { generation, expires: Date.now() + WORKER_REQUEST_TIMEOUT_MS };
    drainProjections(tabId, state);
  }

  async function drainProjections(tabId, state) {
    if (state.observing) return;
    state.observing = true;
    try {
      while (tabs.get(tabId) === state && state.pending !== null) {
        const { generation, expires } = state.pending;
        state.pending = null;
        if (!await liveTab(tabId, expires)) {
          // Losing an observation cannot discard a physical action owner.
          if (owns(tabId, state, generation) && !state.actionRunning) tabs.delete(tabId);
          continue;
        }
        if (!owns(tabId, state, generation)) continue;
        const result = await requestStatus(tabId, generation, expires);
        if (result === null || !owns(tabId, state, generation)) continue;
        const enabled = await bounded(readPreference, expires);
        if (!owns(tabId, state, generation) || Date.now() >= expires) continue;
        await bounded(() => applyAction(tabId, operational(result, enabled), generation, expires), expires);
      }
    } finally {
      state.observing = false;
      reconcileIfNeeded(tabId, state);
    }
  }

  async function popupStatus(requestId, expires) {
    const preferenceEpoch = writeEpoch;
    const confirmed = (value) => pendingWrite !== null || preferenceEpoch !== writeEpoch ? null : value;
    const tab = await activeTab(expires);
    if (tab === null) return unavailable(requestId, confirmed(pendingWrite !== null ? null : await bounded(readPreference, expires)));
    if (!await liveTab(tab.id, expires)) return unavailable(requestId, confirmed(pendingWrite !== null ? null : await bounded(readPreference, expires)));
    const generation = invalidate(tab.id);
    const result = await requestStatus(tab.id, generation, expires);
    const enabled = pendingWrite !== null ? null : await bounded(readPreference, expires);
    if (preferenceEpoch !== writeEpoch) return unavailable(requestId);
    if (result === null || generationOf(tab.id) !== generation) return unavailable(requestId, pendingWrite !== null ? null : enabled);
    const projected = operational(result, enabled);
    await bounded(() => applyAction(tab.id, projected, generation, expires), expires);
    if (preferenceEpoch !== writeEpoch) return unavailable(requestId);
    if (generationOf(tab.id) !== generation) return unavailable(requestId, pendingWrite !== null ? null : enabled);
    return { type: 'popup-status', requestId, status: projected.status, reason: projected.reason,
      enabled: pendingWrite !== null ? null : enabled };
  }

  async function setEnabled(job) {
    job.saved = null;
    writeEpoch += 1;
    const raw = writePreference(job.desired);
    pendingWrite = raw;
    job.raw = raw.then((saved) => {
      if (pendingWrite === raw) pendingWrite = null;
      job.saved = saved;
      return saved;
    });
    await bounded(() => job.raw, job.expires);
    if (job.expired || Date.now() >= job.expires) return;
    job.enabled = await bounded(readPreference, job.expires);
    const tab = await activeTab(job.expires);
    if (tab === null) return;
    const outcome = await requestApply(tab.id, job.expires);
    const result = outcome === null ? { status: 'unavailable', reason: null }
      : { status: outcome.status, reason: outcome.reason };
    const projected = operational(result, job.enabled === null && job.saved === true ? job.desired : job.enabled);
    job.applied = outcome !== null && outcome.applied;
    job.status = projected.status;
    job.reason = projected.reason;
    project(tab.id);
  }

  // --- settings (07-04) -------------------------------------------------------

  // Every setting other than the off switch is written here and only here,
  // through one serial queue (D-05, D-13). It is separate from the preference
  // queue above, which stays exactly as it shipped (D-02). Null when the shared
  // module failed to load: settings then fail, and nothing else changes.
  const settingsApi = globalThis.Zhroma?.settings ?? null;
  const MAX_PENDING_SETTINGS = 32;

  // The one settings read. `ok: false` means the read failed, never absence.
  function readSetting(key) {
    return new Promise((resolve) => {
      const unconfirmed = () => resolve({ ok: false });
      try {
        chrome.storage.local.get([key], (values) => {
          if (chrome.runtime.lastError || !isObject(values)) unconfirmed();
          else resolve({ ok: true, present: Object.hasOwn(values, key), raw: values[key] });
        });
      } catch { unconfirmed(); }
    });
  }

  // The one settings write: one key, one validated stored form, one area. Never
  // sync, session or managed, and never anything the agent did not choose.
  function writeSetting(key, stored) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.set({ [key]: stored }, () => { resolve(!chrome.runtime.lastError); });
      } catch { resolve(false); }
    });
  }

  const settingsQueue = settingsApi === null ? null : settingsApi.createQueue({
    registry: settingsApi.registry, read: readSetting, write: writeSetting,
    timeoutMs: WORKER_REQUEST_TIMEOUT_MS, maxPending: MAX_PENDING_SETTINGS,
    setTimer: (callback, ms) => setTimeout(callback, ms), clearTimer: (handle) => clearTimeout(handle),
    now: () => Date.now(),
  });

  // Exact shape only: `revision` is present exactly for a cas key, as a
  // non-negative safe integer. Without the module no key is known, so only the
  // outer shape can be recognised, and it is answered as a failure.
  function settingsRequest(message) {
    if (!isObject(message) || message.type !== 'set-setting' || !isRequestId(message.requestId)) return false;
    if (settingsApi === null) {
      return isExact(message, ['type', 'requestId', 'key', 'value']) || isExact(message, ['type', 'requestId', 'key', 'value', 'revision']);
    }
    if (!settingsApi.registry.has(message.key)) return false;
    if (!settingsApi.registry.cas(message.key)) return isExact(message, ['type', 'requestId', 'key', 'value']);
    return isExact(message, ['type', 'requestId', 'key', 'value', 'revision'])
      && Number.isSafeInteger(message.revision) && message.revision >= 0;
  }

  const fromContent = (sender) => isObject(sender)
    && sender.id === chrome.runtime.id
    && sender.frameId === 0
    && typeof sender.documentId === 'string' && sender.documentId.length > 0
    && isObject(sender.tab) && Number.isInteger(sender.tab.id);

  const fromPopup = (sender) => isObject(sender)
    && sender.id === chrome.runtime.id
    && sender.tab === undefined
    && sender.url === chrome.runtime.getURL(POPUP_PATH);

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (isExact(message, ['type']) && message.type === 'status-invalidated' && fromContent(sender)) {
      project(sender.tab.id);
      sendResponse({ type: 'status-invalidated', accepted: true });
      return undefined;
    }
    if (isExact(message, ['type', 'requestId']) && message.type === 'popup-status'
      && isRequestId(message.requestId) && fromPopup(sender)) {
      const expires = Date.now() + WORKER_REQUEST_TIMEOUT_MS;
      bounded(() => popupStatus(message.requestId, expires), expires)
        .then((reply) => sendResponse(reply ?? unavailable(message.requestId)), () => sendResponse(unavailable(message.requestId)));
      return true;
    }
    if (isExact(message, ['type', 'requestId', 'enabled']) && message.type === 'set-enabled'
      && isRequestId(message.requestId) && typeof message.enabled === 'boolean' && fromPopup(sender)) {
      const requestId = message.requestId;
      const desired = message.enabled;
      admitPreference(requestId, desired, sendResponse);
      return true;
    }
    if (settingsRequest(message) && fromPopup(sender)) {
      if (settingsQueue === null) {
        sendResponse({ type: 'set-setting', requestId: message.requestId, outcome: 'failed', revision: null });
        return undefined;
      }
      const { requestId, key, value, revision } = message;
      settingsQueue.admit(Object.hasOwn(message, 'revision') ? { requestId, key, value, revision } : { requestId, key, value }, sendResponse);
      return true;
    }
    return undefined;
  });

  // Navigation and activation only invalidate and requery. Nothing here parses
  // a URL or detects a route: DOM mutation remains the discovery mechanism.
  chrome.tabs.onActivated.addListener((info) => {
    if (isObject(info) && Number.isInteger(info.tabId)) project(info.tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (!Number.isInteger(tabId) || !isObject(changeInfo)) return;
    if (changeInfo.status !== 'loading' && changeInfo.status !== 'complete') return;
    if (changeInfo.status === 'loading') stateFor(tabId).lifetime += 1;
    project(tabId);
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    const state = tabs.get(tabId);
    if (state !== undefined) {
      state.pending = null;
      if (state.actionPending !== null) state.actionPending.resolve();
      state.actionPending = null;
    }
    tabs.delete(tabId);
  });
})();
