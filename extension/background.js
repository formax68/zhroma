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
  // One writer, one queue. Two popups asking for opposite values are applied in
  // arrival order, and the last request is the one that survives.
  let preferenceQueue = Promise.resolve();

  const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const isExact = (value, keys) => isObject(value)
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
  const isRequestId = (value) => Number.isInteger(value) && value >= 1 && value <= MAX_REQUEST_ID;
  const nextRequestId = () => { requestCounter = requestCounter % MAX_REQUEST_ID + 1; return requestCounter; };

  function stateFor(tabId) {
    let state = tabs.get(tabId);
    if (state === undefined) {
      state = { generation: 0, queue: Promise.resolve() };
      tabs.set(tabId, state);
    }
    return state;
  }

  const invalidate = (tabId) => { const state = stateFor(tabId); state.generation += 1; return state.generation; };
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

  function serializePreference(task) {
    const run = preferenceQueue.then(task, task);
    preferenceQueue = run.then(() => {}, () => {});
    return run;
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

  async function activeTab() {
    try {
      const found = await chrome.tabs.query({ active: true, currentWindow: true });
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

  async function requestStatus(tabId, generation) {
    // A content push is only a hint. Every projection is preceded by a fresh
    // top-frame reply, and a documentId never proves the document is current.
    const requestId = nextRequestId();
    let reply;
    try {
      reply = await chrome.tabs.sendMessage(tabId, { type: 'get-status', requestId }, { frameId: 0 });
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
  // that had just been done. The echoed requestId is this reply's own
  // staleness guard, and painting stays generation-guarded in `project`.
  async function requestApply(tabId) {
    const requestId = nextRequestId();
    let reply;
    try {
      reply = await chrome.tabs.sendMessage(tabId, { type: 'apply-preference', requestId }, { frameId: 0 });
    } catch { return null; }
    if (!isExact(reply, ['type', 'requestId', 'applied', 'diagnosis', 'reason'])
      || typeof reply.applied !== 'boolean'
      || !validDiagnosis(reply, requestId, 'applied')) return null;
    return { applied: reply.applied, status: reply.diagnosis, reason: reply.reason };
  }

  async function applyAction(tabId, result, generation) {
    // Always tab-scoped. A global diagnostic would leak one tab's state onto
    // every other tab, including tabs this extension never ran in.
    const key = statusKey(result.status, result.reason);
    try {
      await chrome.action.setIcon({ tabId, path: ICONS[result.status] });
      if (generationOf(tabId) !== generation) return;
      await chrome.action.setTitle({ tabId, title: TITLES[key] });
    } catch { /* the tab closed or the action is unavailable */ }
  }

  function project(tabId) {
    const generation = invalidate(tabId);
    const state = stateFor(tabId);
    // Serialized per tab so a slow earlier reply cannot repaint over a later
    // one, with the generation rechecked after every await.
    state.queue = state.queue.then(async () => {
      const result = await requestStatus(tabId, generation);
      if (result === null || generationOf(tabId) !== generation) return;
      // The preference is re-read rather than remembered: the worker holds no
      // state that survives its own termination.
      const enabled = await readPreference();
      if (generationOf(tabId) !== generation) return;
      await applyAction(tabId, operational(result, enabled), generation);
    }).catch(() => {});
    return state.queue;
  }

  async function popupStatus(requestId) {
    const tab = await activeTab();
    if (tab === null) return unavailable(requestId, await readPreference());
    const generation = invalidate(tab.id);
    const result = await requestStatus(tab.id, generation);
    const enabled = await readPreference();
    if (result === null || generationOf(tab.id) !== generation) return unavailable(requestId, enabled);
    const projected = operational(result, enabled);
    await applyAction(tab.id, projected, generation);
    return { type: 'popup-status', requestId, status: projected.status, reason: projected.reason, enabled };
  }

  async function setEnabled(requestId, desired) {
    // Persistence and application are two facts, reported as two facts. They
    // cannot be one transaction across processes, so nothing here pretends
    // they are: `saved` is the write, `enabled` is what storage reports back,
    // and `applied` is what the current document confirmed it actually did.
    const saved = await writePreference(desired);
    const enabled = await readPreference();
    const tab = await activeTab();
    if (tab === null) {
      return { type: 'set-enabled', requestId, saved, enabled, applied: false, status: 'unavailable', reason: null };
    }
    const outcome = await requestApply(tab.id);
    const result = outcome === null
      ? { status: 'unavailable', reason: null }
      : { status: outcome.status, reason: outcome.reason };
    const projected = operational(result, enabled);
    // Repaint through the ordinary per-tab projection rather than writing the
    // action here, so a preference change can never paint over a newer status.
    project(tab.id);
    return {
      type: 'set-enabled', requestId, saved, enabled,
      applied: outcome !== null && outcome.applied,
      status: projected.status, reason: projected.reason,
    };
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
      const done = () => sendResponse({ type: 'status-invalidated', accepted: true });
      project(sender.tab.id).then(done, done);
      return true;
    }
    if (isExact(message, ['type', 'requestId']) && message.type === 'popup-status'
      && isRequestId(message.requestId) && fromPopup(sender)) {
      popupStatus(message.requestId).then(sendResponse, () => sendResponse(unavailable(message.requestId)));
      return true;
    }
    if (isExact(message, ['type', 'requestId', 'enabled']) && message.type === 'set-enabled'
      && isRequestId(message.requestId) && typeof message.enabled === 'boolean' && fromPopup(sender)) {
      const requestId = message.requestId;
      const desired = message.enabled;
      serializePreference(() => setEnabled(requestId, desired)).then(sendResponse, () => sendResponse({
        type: 'set-enabled', requestId, saved: false, enabled: null,
        applied: false, status: 'unavailable', reason: null,
      }));
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
    project(tabId);
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    tabs.delete(tabId);
  });
})();
