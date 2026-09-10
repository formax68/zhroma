(() => {
  'use strict';

  // A disposable adapter, never a database. Every listener is registered
  // synchronously at top level so a woken worker cannot miss an event, and all
  // per-tab state is reconstructible from a fresh handshake after termination.

  const POPUP_PATH = 'popup.html';
  const MAX_REQUEST_ID = 1000000;
  const DIAGNOSES = ['working', 'neutral'];
  const REASONS = ['blank', null];

  const ICONS = {
    working: 'icons/working.png',
    neutral: 'icons/neutral.png',
    unavailable: 'icons/neutral.png',
  };

  // Explanatory titles, never shape or colour alone. Fixed copy, no page input.
  const TITLES = {
    'working': 'Priority tinting is working',
    'working:blank': 'Priority column found. These tickets have no priority values set',
    'neutral': 'Checking this view',
    'unavailable': 'No readable view is connected',
  };

  const tabs = new Map();
  let requestCounter = 0;

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

  // Identity comes from Chrome's own sender metadata. A payload-supplied tab
  // id, frame or document is never trusted, and never even read.
  const fromContent = (sender) => isObject(sender)
    && sender.id === chrome.runtime.id
    && sender.frameId === 0
    && typeof sender.documentId === 'string' && sender.documentId.length > 0
    && isObject(sender.tab) && Number.isInteger(sender.tab.id);

  const fromPopup = (sender) => isObject(sender)
    && sender.id === chrome.runtime.id
    && sender.tab === undefined
    && sender.url === chrome.runtime.getURL(POPUP_PATH);

  const unavailable = (requestId) => ({ type: 'popup-status', requestId, status: 'unavailable', reason: null });

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
      || reply.type !== 'status' || reply.requestId !== requestId
      || !DIAGNOSES.includes(reply.diagnosis) || !REASONS.includes(reply.reason)) {
      return { status: 'unavailable', reason: null };
    }
    return { status: reply.diagnosis, reason: reply.reason };
  }

  async function applyAction(tabId, result, generation) {
    // Always tab-scoped. A global diagnostic would leak one tab's state onto
    // every other tab, including tabs this extension never ran in.
    const key = result.reason === null ? result.status : `${result.status}:${result.reason}`;
    try {
      await chrome.action.setIcon({ tabId, path: ICONS[result.status] });
      if (generationOf(tabId) !== generation) return;
      await chrome.action.setTitle({ tabId, title: TITLES[key] ?? TITLES[result.status] });
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
      await applyAction(tabId, result, generation);
    }).catch(() => {});
    return state.queue;
  }

  async function popupStatus(requestId) {
    let tab;
    try {
      const found = await chrome.tabs.query({ active: true, currentWindow: true });
      tab = Array.isArray(found) ? found[0] : undefined;
    } catch { return unavailable(requestId); }
    if (!isObject(tab) || !Number.isInteger(tab.id)) return unavailable(requestId);
    const generation = invalidate(tab.id);
    const result = await requestStatus(tab.id, generation);
    if (result === null || generationOf(tab.id) !== generation) return unavailable(requestId);
    await applyAction(tab.id, result, generation);
    return { type: 'popup-status', requestId, status: result.status, reason: result.reason };
  }

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
