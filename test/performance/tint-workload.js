(() => {
  'use strict';
  const nativeTimer = window.setTimeout.bind(window);
  const nativeClear = window.clearTimeout.bind(window);
  const NativeObserver = window.MutationObserver;
  const nativeSet = Element.prototype.setAttribute;
  const nativeRemove = Element.prototype.removeAttribute;
  const nativeAdd = EventTarget.prototype.addEventListener;
  const pending = new Set();
  const observers = new Set();
  const params = new URLSearchParams(location.search);
  const size = Number(params.get('size'));
  const enabled = params.get('mode') === 'enabled';
  const profiled = params.get('profile') === 'true';
  const labels = ['Urgent', 'High', 'Normal', 'Low'];
  let segments = []; let writes = 0; let depth = 0; let sequence = 0;
  let registering = false; let template; let priorityIndex;
  const view = document.querySelector('#view');
  const delay = () => new Promise((resolve) => nativeTimer(resolve, 0));
  // Test-only preference/status seam. This developer page is not the extension:
  // Chrome hands `chrome.*` to a real content script, so the page has to supply
  // it here. It exposes exactly the shipped seam — one {enabled: boolean}
  // storage.local read, storage.onChanged, runtime.onMessage and the finite
  // status hint — and nothing else, so what is measured is the shipped code
  // path rather than a fallback. No such object ships; the packaged inventory
  // is pinned by runtime-contract.test.js and toolbar-popup.test.js.
  let confirmPreference;
  const preferenceConfirmed = new Promise((resolve) => { confirmPreference = resolve; });
  function installPreferenceSeam() {
    const storageListeners = [];
    const seam = {
      runtime: {
        id: 'zhroma-workload-runtime',
        lastError: undefined,
        onMessage: { addListener() {} },
        // No service worker is loaded here, so a status hint reaches no
        // receiver — reported exactly the way Chrome reports it.
        sendMessage(message, callback) {
          if (typeof callback !== 'function') return undefined;
          nativeTimer(() => {
            seam.runtime.lastError = { message: 'Could not establish connection. Receiving end does not exist.' };
            try { callback(undefined); } finally { seam.runtime.lastError = undefined; }
          }, 0);
          return undefined;
        },
      },
      storage: {
        onChanged: { addListener(listener) { storageListeners.push(listener); } },
        local: {
          // Asynchronous, exactly like Chrome: never resolved inside the call,
          // and only an absent key is filled by the caller's default.
          get(defaults, callback) { nativeTimer(() => { callback({ ...defaults }); confirmPreference(); }, 0); },
        },
      },
    };
    Object.defineProperty(window, 'chrome', { value: seam, writable: true, configurable: true });
  }
  function timed(category, callback, receiver, args) {
    const start = performance.now(); depth++;
    const mark = `zhroma-callback-${sequence++}`;
    if (profiled) performance.mark(`${mark}-start`);
    try { return callback.apply(receiver, args); }
    finally {
      depth--;
      const cpu = performance.now() - start;
      segments.push({ category, cpu });
      if (profiled) {
        performance.measure(mark, `${mark}-start`);
        performance.clearMarks(`${mark}-start`); performance.clearMeasures(mark);
      }
    }
  }
  window.MutationObserver = class {
    constructor(callback) { this.native = new NativeObserver((...args) => timed('observer', callback, this, args)); }
    observe(...args) { observers.add(this); return this.native.observe(...args); }
    disconnect() { observers.delete(this); this.native.disconnect(); }
    takeRecords() { return this.native.takeRecords(); }
  };
  window.setTimeout = (callback, milliseconds, ...args) => {
    const id = nativeTimer(() => { pending.delete(id); timed('timer', callback, window, args); }, milliseconds);
    pending.add(id); return id;
  };
  window.clearTimeout = (id) => { pending.delete(id); return nativeClear(id); };
  EventTarget.prototype.addEventListener = function (name, callback, options) {
    const wrapped = registering && ['visibilitychange', 'pagehide', 'pageshow'].includes(name)
      ? function (...args) { return timed('lifecycle', callback, this, args); } : callback;
    return nativeAdd.call(this, name, wrapped, options);
  };
  Element.prototype.setAttribute = function (...args) { if (depth && args[0] === 'data-zhroma-priority') writes++; return nativeSet.apply(this, args); };
  Element.prototype.removeAttribute = function (...args) { if (depth && args[0] === 'data-zhroma-priority') writes++; return nativeRemove.apply(this, args); };
  async function settle() {
    const deadline = performance.now() + 5000;
    let quiet = 0; let last = -1;
    while (quiet < 2) {
      await delay();
      if (performance.now() > deadline) throw new Error('Unbounded extension work or timeout');
      quiet = pending.size === 0 && segments.length === last ? quiet + 1 : 0;
      last = segments.length;
    }
  }
  function buildSyntheticTable() {
    const table = template.cloneNode(true);
    const body = table.querySelector('tbody'); const seed = body.firstElementChild.cloneNode(true);
    body.replaceChildren();
    for (let i = 0; i < size; i++) {
      const row = seed.cloneNode(true);
      [...row.children].forEach((cell, index) => { cell.textContent = index === priorityIndex ? labels[i % 4] : 'Synthetic'; });
      row.removeAttribute('data-zhroma-priority'); body.append(row);
    }
    return table;
  }
  function verify(unsafe = false) {
    const table = view.querySelector('table'); const tickets = [...table.querySelector('tbody').children];
    if (tickets.length !== size || tickets.some((row) => row.children.length !== 16)) throw new Error('Synthetic topology mismatch');
    for (const row of tickets) {
      const expected = enabled && !unsafe ? row.children[priorityIndex].textContent : null;
      if (row.getAttribute('data-zhroma-priority') !== expected) throw new Error('Incorrect settled priority marker');
    }
    if (pending.size !== 0 || observers.size !== (enabled ? 1 : 0)) throw new Error('Resource bound mismatch');
  }
  async function measureBatch(operation) {
    await settle(); segments = []; writes = 0;
    const start = performance.now();
    let table = view.querySelector('table'); let body = table.querySelector('tbody');
    if (operation === 'edit') {
      const cell = body.firstElementChild.children[priorityIndex]; cell.firstChild.data = cell.textContent === 'Urgent' ? 'Low' : 'Urgent';
    } else if (operation === 'reorder') body.prepend(body.lastElementChild);
    else if (operation === 'body') body.replaceWith(buildSyntheticTable().querySelector('tbody'));
    else if (operation === 'table') table.replaceWith(buildSyntheticTable());
    else if (operation === 'unrelated') document.querySelector('#unrelated').firstChild.data = `Synthetic ${sequence}`;
    else if (operation === 'invalid-repair') {
      let cell = body.lastElementChild.children[priorityIndex];
      const previous = cell.textContent; cell.firstChild.data = 'Unknown';
      await settle(); verify(true); cell.firstChild.data = previous; cell = null;
    } else throw new Error('Unknown operation');
    table = null; body = null;
    await settle();
    const latency = performance.now() - start;
    verify();
    return { segments: [...segments], totalCpu: segments.reduce((sum, part) => sum + part.cpu, 0), latency,
      callbacks: segments.length, passes: segments.filter((part) => part.category === 'timer').length, writes };
  }
  const ready = (async () => {
    const text = await (await fetch('/test/fixtures/zendesk-view-priority-present.html')).text();
    const parsed = new DOMParser().parseFromString(text, 'text/html');
    template = parsed.querySelector('table').cloneNode(true);
    priorityIndex = [...template.querySelector('thead tr').children].findIndex((cell) => cell.textContent.trim() === 'Priority');
    if (priorityIndex < 0) throw new Error('Missing admitted Priority header');
    // Retain only a clean construction template, never old measured tables.
    template.querySelector('tbody').replaceChildren(template.querySelector('tbody tr').cloneNode(true));
    view.append(buildSyntheticTable());
    if (enabled) {
      installPreferenceSeam();
      await new Promise((resolve, reject) => {
        const script = document.createElement('script'); script.src = '/extension/content.js';
        script.onload = () => { registering = false; resolve(); }; script.onerror = () => reject(new Error('Runtime load failed'));
        registering = true; document.head.append(script);
      });
      // The controller only runs once the preference is confirmed. Measuring
      // before that would time an extension that is deliberately dormant.
      await preferenceConfirmed;
    }
    // Disabled mode installs no seam and loads no runtime, so the control is
    // genuinely disabled rather than merely switched off.
    await settle(); verify();
  })();
  window.tintWorkload = {
    async run({ smoke = false, profile = false } = {}) {
      await ready;
      const operations = {}; const names = smoke ? ['edit'] : ['edit', 'reorder', 'body', 'table', 'invalid-repair', 'unrelated'];
      for (const name of names) {
        for (let i = 0; i < (smoke || profile ? 0 : 10); i++) await measureBatch(name);
        operations[name] = [];
        for (let i = 0; i < (smoke || profile ? 1 : 100); i++) operations[name].push(await measureBatch(name));
      }
      if (smoke && enabled) {
        const cell = view.querySelector('tbody tr').children[priorityIndex];
        if (getComputedStyle(cell).backgroundColor === 'rgba(0, 0, 0, 0)') throw new Error('Declared CSS did not paint');
      }
      return { size, mode: enabled ? 'enabled' : 'disabled', warmups: smoke || profile ? 0 : 10, measured: smoke || profile ? 1 : 100,
        operations, resources: { observers: observers.size, pendingTimers: pending.size }, cellsPerRow: 16 };
    },
    async switches() { await ready; for (let i = 0; i < 30; i++) await measureBatch('table'); segments = []; return { switches: 30, observers: observers.size, pendingTimers: pending.size }; },
    async resting() { await ready; await settle(); segments = []; return { observers: observers.size, pendingTimers: pending.size }; },
  };
})();
