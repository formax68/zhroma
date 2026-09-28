(() => {
  'use strict';

  const PRIORITY_ATTRIBUTE = 'data-zhroma-priority';
  const PRIORITY_LABELS = new Set(['Urgent', 'High', 'Normal', 'Low']);
  const PREFERENCE_KEY = 'enabled';
  const LANGUAGE_PRIMARY = 'en';
  const LANGUAGE_PREFIX = 'en-';
  const PREFERENCE_AREA = 'local';
  const MAX_REQUEST_ID = 1000000;
  // The quiet period a Priority-less candidate must survive before the
  // extension will say the column is missing (D-01, third condition). It is a
  // deliberate operational threshold, not a claim that Zendesk has finished
  // rendering: 100 ms is an order of magnitude above the measured reconcile
  // pass and far below the delay at which an agent would read the toolbar, so
  // it costs a brief neutral state and buys never accusing a mid-mount view.
  const SETTLE_MS = 100;
  // The longest a settings read may hold the first tint back (D-09). A hung
  // read then counts as failed: every setting is its default and tinting goes
  // ahead under the off switch alone.
  const SETTINGS_READ_TIMEOUT_MS = 500;
  const TABLE = 'table[data-garden-id="tables.table"][data-test-id="generic-table"]';
  const HEAD = 'thead[data-garden-id="tables.head"][data-test-id="generic-table-head"]';
  const BODY = 'tbody[data-garden-id="tables.body"][data-test-id="generic-table-body"]';
  const HEADER_ROW = 'tr[data-garden-id="tables.header_row"]';
  const HEADER_CELL = 'th[data-garden-id="tables.header_cell"]';
  const ROW = 'tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]';
  const GROUP = 'tr[data-garden-id="tables.group_row"][data-test-id="generic-table-rows-group-by"]';
  const CELL = 'td[data-garden-id="tables.cell"]';
  const INTERPRETATION_ATTRIBUTES = ['data-garden-id', 'data-test-id', 'role', 'colspan', 'rowspan', 'lang', PRIORITY_ATTRIBUTE];

  let observer = null;
  let reconcileTimer = null;
  let active = false;
  let candidate = null;
  const ownedRows = new Set();
  const expectedMarkers = new WeakMap();

  // Preference readiness, the preference itself, document visibility and
  // pagehide suspension are four independent inputs. Only their conjunction may
  // run the controller, so a tab switch or a bfcache round trip can never undo
  // a stored preference, and a stored preference can never resume a hidden or
  // suspended document.
  let preferenceReady = false;
  let preferenceEnabled = false;
  let preferenceGeneration = 0;
  let suspended = false;

  // The only thing this document ever tells the rest of the extension. Finite
  // values; never a row, a cell value, a language string, a URL or an error.
  let statusDiagnosis = 'neutral';
  let statusReason = null;
  let statusAnnounced = false;

  // Missing-column certainty. `changeRevision` counts interpretation-affecting
  // mutations; a confirmation is only ever published when the revision that
  // armed the timer is still current at its callback, so a change inside the
  // window can never be settled through.
  let changeRevision = 0;
  let confirmTimer = null;
  let confirmRevision = -1;
  let missingConfirmed = false;

  // Settings (D-09, D-13). The shared module is read once. When it did not
  // load, every setting is its default and the gate is already open, so this
  // file loaded on its own behaves exactly as 0.1.0 did. Settings never leave
  // this isolated world: nothing here sends, stores or shows them (DATA-01).
  const settingsApi = globalThis.Zhroma?.settings ?? null;
  let settingsReady = settingsApi === null;
  let settingsTimer = null;
  // One generation per key: a change event bumps its key, so a read issued
  // before the change cannot overwrite the value the change delivered.
  const settingsGenerations = new Map();
  // One frozen { value, status } per key. `status` is an internal finite fact
  // (D-12) and is never shown or sent.
  const settingsState = new Map();
  for (const key of settingsApi === null ? [] : settingsApi.registry.keys) {
    settingsGenerations.set(key, 0);
    settingsState.set(key, Object.freeze({ value: settingsApi.registry.defaultOf(key), status: 'default' }));
  }

  function inspectCandidateTable(document) {
    const result = (state, table = null, entries = []) => ({ state, table, entries });
    // A subframe is unreadable, never a language claim: its shell is not the
    // agent's interface language and naming one would be an invention.
    if (window.top !== window) return result('unsafe');
    const shellLanguage = document.documentElement.lang;
    // The supported shell is the English language FAMILY, not the single tag
    // `en`: every `en-*` regional locale renders the same priority labels, so
    // refusing them told an English agent their own language was the problem
    // (CR-01). The raw value is compared untrimmed, which is exactly what the
    // stylesheet's `[lang|="en" i]` does, so the two encodings cannot drift.
    const lower = shellLanguage.toLowerCase();
    if (lower !== LANGUAGE_PRIMARY && !lower.startsWith(LANGUAGE_PREFIX)) {
      // Only a shell that actually declares another language may be reported
      // as an unsupported language (D-04). The declared value itself is never
      // read out, transmitted or interpolated — the reason is a fixed token.
      // Normalize only to choose the refusal reason. Malformed English shell
      // metadata is not proof of another language and must remain untinted.
      const reasonLanguage = lower.trim().replace(/_/g, '-');
      const englishReason = reasonLanguage === LANGUAGE_PRIMARY || reasonLanguage.startsWith(LANGUAGE_PREFIX);
      return result(reasonLanguage === '' || englishReason ? 'unsafe' : 'unsupported');
    }
    const tables = [...document.querySelectorAll(TABLE)];
    if (tables.length === 0) return result('waiting');
    if (tables.length !== 1) return result('unsafe');
    const table = tables[0];
    if (!table.isConnected || table.ownerDocument !== document
      || table.parentElement?.closest('table, [role="table"]')
      || table.querySelector('table, [role="table"]')) return result('unsafe', table);

    const parts = [...table.children];
    const heads = parts.filter((part) => part.matches(HEAD));
    const bodies = parts.filter((part) => part.matches(BODY));
    if (parts.some((part) => !part.matches(`${HEAD}, ${BODY}`))
      || heads.length > 1 || bodies.length > 1) return result('unsafe', table);
    if (heads.length === 0 || bodies.length === 0) return result('waiting', table);
    const headerRows = [...heads[0].children];
    if (headerRows.length > 1 || headerRows.some((row) => !row.matches(HEADER_ROW))) return result('unsafe', table);
    if (headerRows.length === 0) return result('waiting', table);
    const headers = [...headerRows[0].children];
    const malformedCell = (cell, selector) => !cell.matches(selector)
      || cell.colSpan !== 1 || cell.rowSpan !== 1
      || cell.querySelector('tr, td, th, [role="row"], [role="cell"], [role="columnheader"]');
    if (headers.some((cell) => malformedCell(cell, HEADER_CELL))) return result('unsafe', table);
    if (headers.length === 0) return result('waiting', table);
    const indexes = headers.flatMap((cell, index) => cell.textContent.trim() === 'Priority' ? [index] : []);
    if (indexes.length > 1) return result('unsafe', table);
    // D-01 requires the WHOLE table to be validated before the Priority index
    // is branched on: an absent header is only evidence of a missing column
    // once the body has also proved the table is genuinely rendered. The old
    // early return here is what made `waiting` cover seven unrelated
    // situations, only one of which was a missing column.
    const priorityIndex = indexes.length === 1 ? indexes[0] : -1;

    const entries = [];
    let incomplete = false;
    let witnessed = false;
    for (const row of bodies[0].children) {
      if (row.matches(GROUP)) {
        // Group paint is host-owned, but exclusion must not hide foreign topology.
        const groupCells = [...row.children];
        if (groupCells.length === 0 || groupCells.some((cell) => !cell.matches(CELL)
          || cell.rowSpan !== 1 || cell.colSpan < 1 || cell.colSpan > headers.length
          || cell.querySelector('tr, td, th, [role="row"], [role="cell"], [role="columnheader"]'))) return result('unsafe', table);
        continue;
      }
      if (!row.matches(ROW)) return result('unsafe', table);
      const cells = [...row.children];
      if (cells.some((cell) => malformedCell(cell, CELL)) || cells.length > headers.length) return result('unsafe', table);
      if (cells.length < headers.length) { incomplete = true; continue; }
      // A direct ticket row exactly as wide as the header is the rendered-table
      // witness D-01's second condition asks for.
      witnessed = true;
      if (priorityIndex === -1) continue;
      const priority = cells[priorityIndex].textContent.trim();
      if (priority !== '' && !PRIORITY_LABELS.has(priority)) return result('unsafe', table);
      entries.push({ row, priority: priority || null });
    }
    // A partial mount, an empty body and a group-only body are all indistinguishable
    // from a table that has not finished arriving. They stay conservative.
    if (incomplete || !witnessed) return result('waiting', table);
    if (priorityIndex === -1) return result('missing', table);
    return result(entries.some((entry) => entry.priority !== null) ? 'safe' : 'blank', table, entries);
  }

  function adoptCopiedMarkers(root) {
    // Host cloning/serialization copies our reserved attribute onto identities
    // we have never tracked. Discover them at entry and in added subtrees,
    // never use their values as input to priority detection.
    if (root.nodeType !== 1 && root.nodeType !== 9) return false;
    let found = false;
    if (root.nodeType === 1 && root.hasAttribute(PRIORITY_ATTRIBUTE)) { ownedRows.add(root); found = true; }
    for (const row of root.querySelectorAll(`[${PRIORITY_ATTRIBUTE}]`)) { ownedRows.add(row); found = true; }
    return found;
  }

  function clearOwnedMarkers(keep = new Map()) {
    // Release even unremovable rows. A permanently broken native removal API
    // cannot guarantee paint cleanup; it must not also leak detached nodes.
    let complete = true;
    for (const row of ownedRows) {
      if (keep.has(row) && row.getAttribute(PRIORITY_ATTRIBUTE) === keep.get(row)) {
        expectedMarkers.set(row, keep.get(row));
        continue;
      }
      try {
        if (row.hasAttribute(PRIORITY_ATTRIBUTE)) row.removeAttribute(PRIORITY_ATTRIBUTE);
      } catch {
        // One bounded retry handles a transient host failure. Never retain a
        // failed row indefinitely or schedule a retry loop against the page.
        try { row.removeAttribute(PRIORITY_ATTRIBUTE); }
        catch { complete = false; }
      }
      ownedRows.delete(row);
      expectedMarkers.delete(row);
    }
    return complete;
  }

  function commitSnapshot(snapshot) {
    // The snapshot is inspected and committed in the same synchronous turn.
    // Never carry DOM interpretations across a timer or messaging boundary.
    // Returns whether the page actually reached the intended state: a rolled
    // back write must never be reported to the agent as working.
    const keep = new Map(snapshot.entries.filter(({ priority }) => priority !== null)
      .map(({ row, priority }) => [row, priority]));
    if (!clearOwnedMarkers(keep)) {
      clearOwnedMarkers();
      return false;
    }
    try {
      for (const { row, priority } of snapshot.entries) {
        if (priority === null) continue;
        ownedRows.add(row); // Include even a write that mutates and then throws.
        expectedMarkers.set(row, priority);
        if (row.getAttribute(PRIORITY_ATTRIBUTE) !== priority) row.setAttribute(PRIORITY_ATTRIBUTE, priority);
      }
    } catch {
      clearOwnedMarkers();
      return false;
    }
    return true;
  }

  function announceStatus() {
    // An invalidation hint and nothing more: the worker must fetch a fresh
    // top-frame reply before it projects anything. No receiver, a reloaded
    // extension or an unavailable runtime are all silent no-ops.
    try {
      chrome.runtime.sendMessage({ type: 'status-invalidated' }, () => { void chrome.runtime.lastError; });
    } catch { /* the extension context is gone; the page is unaffected */ }
  }

  function publishStatus(diagnosis, reason) {
    if (statusAnnounced && diagnosis === statusDiagnosis && reason === statusReason) return;
    statusDiagnosis = diagnosis;
    statusReason = reason;
    statusAnnounced = true;
    announceStatus();
  }

  // Three product diagnoses and one operational value. An unconfirmed missing
  // candidate deliberately maps to neutral: only the settle callback, having
  // re-established every D-01 condition from the current DOM, may publish a
  // missing-column claim.
  function statusForState(state) {
    if (state === 'safe') return ['working', null];
    // A Priority column that is present and unambiguous but carries no values
    // is working, distinguished only by the blank reason (D-02).
    if (state === 'blank') return ['working', 'blank'];
    if (state === 'unsupported') return ['cannot-read', 'unsupported-language'];
    if (state === 'unsafe') return ['cannot-read', 'structure'];
    return ['neutral', null];
  }

  function cancelConfirmation() {
    if (confirmTimer !== null) { clearTimeout(confirmTimer); confirmTimer = null; }
    missingConfirmed = false;
  }

  function invalidateConfirmation() {
    // Synchronous withdrawal: the claim goes away in the same turn its
    // evidence is disturbed, before the browser may paint or a timer may run.
    changeRevision += 1;
    if (missingConfirmed) {
      missingConfirmed = false;
      publishStatus('neutral', null);
    }
  }

  function armConfirmation() {
    // At most one pending confirmation, ever. A candidate that is already
    // confirmed needs no timer, and a second timer would be a queue.
    if (missingConfirmed || confirmTimer !== null) return;
    confirmRevision = changeRevision;
    confirmTimer = setTimeout(confirmMissingColumn, SETTLE_MS);
  }

  function confirmMissingColumn() {
    confirmTimer = null;
    if (!active) return;
    try {
      // Inspect the CURRENT document. No snapshot, row or index survives the
      // timer boundary; eligibility is re-established from scratch.
      const fresh = inspectCandidateTable(document);
      candidate = fresh.table;
      if (fresh.state !== 'missing') return; // eligibility lost; the reconcile pass owns the new state
      if (changeRevision !== confirmRevision) { armConfirmation(); return; }
      missingConfirmed = true;
      publishStatus('missing', null);
    } catch {
      cancelConfirmation();
      clearOwnedMarkers();
      publishStatus('neutral', null);
    }
  }

  // Returns whether the page actually reached the state the current inputs
  // call for. The caller may be an acknowledgement the agent will read, so a
  // failed marker write or a failed removal must never be reported as done.
  function reconcileCurrentTable() {
    reconcileTimer = null;
    if (!active) return false;
    try {
      const snapshot = inspectCandidateTable(document);
      candidate = snapshot.table;
      if (snapshot.state === 'safe' || snapshot.state === 'blank') {
        cancelConfirmation();
        const [diagnosis, reason] = statusForState(snapshot.state);
        // A rolled back write never reports as working: the agent is told the
        // page reached the intended state only when it actually did.
        if (commitSnapshot(snapshot)) { publishStatus(diagnosis, reason); return true; }
        publishStatus('neutral', null);
        return false;
      }
      const cleared = clearOwnedMarkers();
      if (snapshot.state === 'missing') {
        if (!missingConfirmed) { publishStatus('neutral', null); armConfirmation(); }
        return cleared;
      }
      cancelConfirmation();
      const [diagnosis, reason] = statusForState(snapshot.state);
      publishStatus(diagnosis, reason);
      return cleared;
    } catch {
      cancelConfirmation();
      clearOwnedMarkers();
      publishStatus('neutral', null);
      return false;
    }
  }

  function scheduleReconcile() {
    if (active && reconcileTimer === null) reconcileTimer = setTimeout(reconcileCurrentTable, 0);
  }

  function mutationsAffectInterpretation(records) {
    const hasCandidate = (node) => node.nodeType === 1
      && (node.matches(TABLE) || node.querySelector(TABLE));
    for (const record of records) {
      const { target } = record;
      if (record.type === 'attributes') {
        if (!INTERPRETATION_ATTRIBUTES.includes(record.attributeName)) continue;
        if (record.attributeName === PRIORITY_ATTRIBUTE) {
          const expected = ownedRows.has(target) ? expectedMarkers.get(target) : null;
          if (target.getAttribute(PRIORITY_ATTRIBUTE) !== expected) {
            ownedRows.add(target);
            return true;
          }
          continue;
        }
        if (target === document.documentElement && record.attributeName === 'lang') return true;
        // A table that lost an identifier can resolve ambiguity even though
        // there is no retained candidate and its final selector no longer matches.
        if (target.localName === 'table'
          && ['data-garden-id', 'data-test-id'].includes(record.attributeName)) return true;
        if (candidate && (candidate.contains(target) || target.contains(candidate))) return true;
        // Identifier/ancestor edits can create a competing table anywhere.
        if (hasCandidate(target) || target.closest?.(TABLE)) return true;
      } else if (record.type === 'characterData') {
        if (candidate?.contains(target) || target.parentElement?.closest(TABLE)) return true;
      } else if (record.type === 'childList') {
        if (candidate?.contains(target) || target.closest?.(TABLE)) return true;
        for (const node of [...record.addedNodes, ...record.removedNodes]) {
          if (hasCandidate(node) || (candidate && node.contains(candidate))) return true;
        }
      }
    }
    return false;
  }

  function runnable() {
    return preferenceReady && preferenceEnabled && settingsReady && !suspended && !document.hidden;
  }

  // Teardown returns whether ownership was actually released. A permanently
  // broken native removal API is a real failure and is propagated as one
  // rather than swallowed, because the popup will report it to the agent.
  function pauseController() {
    active = false;
    observer?.disconnect();
    clearTimeout(reconcileTimer);
    reconcileTimer = null;
    // A paused controller cannot see the page, so it cannot keep a claim about
    // it alive or settle one that was in flight.
    cancelConfirmation();
    adoptCopiedMarkers(document);
    const complete = clearOwnedMarkers();
    candidate = null;
    publishStatus('neutral', null);
    return complete;
  }

  function resumeController() {
    // Never resume on visibility alone: the preference must be confirmed too.
    if (!runnable()) return pauseController();
    try {
      if (!active) {
        adoptCopiedMarkers(document);
        observer.observe(document, { childList: true, characterData: true, subtree: true,
          attributes: true, attributeFilter: INTERPRETATION_ATTRIBUTES });
        active = true;
      }
      scheduleReconcile();
      return true;
    } catch { pauseController(); return false; }
  }

  // `immediate` is for a transition somebody is waiting on an answer about:
  // the fresh pass runs in this turn instead of on the deferred timer, so the
  // acknowledgement describes a page that has already been updated. Every
  // other caller keeps the deferred pass unchanged.
  function syncController(immediate = false) {
    if (!runnable()) return pauseController();
    if (!resumeController() || !immediate) return active;
    if (reconcileTimer !== null) { clearTimeout(reconcileTimer); reconcileTimer = null; }
    return reconcileCurrentTable();
  }

  function onVisibilityChange() {
    syncController();
  }

  function onPageHide() {
    suspended = true;
    pauseController();
  }

  function onPageShow() {
    // A restored document re-reads the preference rather than trusting the
    // value it was frozen with, and stays untinted until that read confirms.
    preferenceReady = false;
    suspended = false;
    syncController();
    readPreference();
    // The settings gate stays open: a restored document re-reads its settings
    // without waiting on them.
    readSettings();
  }

  // Returns whether this document now reflects the value it was handed. A
  // superseded generation, an unreadable preference or a failed teardown all
  // answer false, because none of them left the page where the preference says
  // it should be.
  function applyPreference(value, generation, immediate = false) {
    // A newer read or a change event has already spoken; drop this reply.
    if (generation !== preferenceGeneration) return false;
    if (typeof value === 'boolean') {
      preferenceReady = true;
      preferenceEnabled = value;
    } else {
      // A rejected read or a non-boolean value is a failure, never absence.
      // Unconfirmed stays untinted rather than defaulting to on.
      preferenceReady = false;
      preferenceEnabled = false;
    }
    const settled = syncController(immediate);
    if (!statusAnnounced) { statusAnnounced = true; announceStatus(); }
    return preferenceReady && settled;
  }

  // `done`, when supplied, makes this an acknowledged read: the fresh pass runs
  // synchronously and the callback reports whether the page actually reached
  // the persisted state. Called without it, the behaviour is unchanged.
  function readPreference(done) {
    preferenceGeneration += 1;
    const generation = preferenceGeneration;
    const finish = (value) => {
      const applied = applyPreference(value, generation, done !== undefined);
      if (done !== undefined) done(applied);
    };
    try {
      chrome.storage.local.get({ [PREFERENCE_KEY]: true }, (values) => {
        // Only an absent key is filled by the default, so a present but
        // non-boolean value is still distinguishable from absence here.
        if (chrome.runtime.lastError) { finish(null); return; }
        finish(values ? values[PREFERENCE_KEY] : null);
      });
    } catch { finish(null); }
  }

  function onPreferenceChanged(changes, areaName) {
    if (areaName !== PREFERENCE_AREA) return;
    if (changes === null || typeof changes !== 'object' || !Object.hasOwn(changes, PREFERENCE_KEY)) return;
    preferenceGeneration += 1;
    const change = changes[PREFERENCE_KEY];
    // A removed key restores the documented default; anything else non-boolean
    // is corrupt data and must not be read as absence.
    const value = change !== null && typeof change === 'object' && Object.hasOwn(change, 'newValue')
      ? change.newValue : true;
    applyPreference(value, preferenceGeneration);
  }

  function unreadableSetting(key) {
    return Object.freeze({ value: settingsApi.registry.defaultOf(key), status: 'unreadable' });
  }

  // `holder[field]` is the stored value when `holder` owns `field`; otherwise
  // the key is absent and resolves to its default. Anything that throws on the
  // way is unreadable (D-08). Nothing here writes, repairs or deletes.
  function resolveSetting(key, holder, field) {
    try {
      const present = holder !== null && typeof holder === 'object' && Object.hasOwn(holder, field);
      const { value, status } = settingsApi.registry.resolve(key, present, present ? holder[field] : undefined);
      return Object.freeze({ value, status });
    } catch { return unreadableSetting(key); }
  }

  // Opens once. Before the preference has landed there is nothing to run, and
  // syncing then would announce a status 0.1.0 never announced at that point.
  function openSettingsGate() {
    if (settingsTimer !== null) { clearTimeout(settingsTimer); settingsTimer = null; }
    if (settingsReady) return;
    settingsReady = true;
    if (preferenceReady) syncController();
  }

  // `values` is null for a failed read: every key is then its default,
  // unreadable. Success or failure, the gate opens (D-09).
  function landSettings(values, generations) {
    try {
      for (const key of settingsApi.registry.keys) {
        if (settingsGenerations.get(key) !== generations.get(key)) continue;
        settingsState.set(key, values !== null && typeof values === 'object'
          ? resolveSetting(key, values, key) : unreadableSetting(key));
      }
    } catch { /* a settings fault never holds the tint back */ }
    openSettingsGate();
  }

  function readSettings() {
    if (settingsApi === null) return;
    const generations = new Map(settingsGenerations);
    if (!settingsReady && settingsTimer === null) {
      settingsTimer = setTimeout(() => { settingsTimer = null; openSettingsGate(); }, SETTINGS_READ_TIMEOUT_MS);
    }
    try {
      chrome.storage.local.get([...settingsApi.registry.keys], (values) => {
        landSettings(chrome.runtime.lastError ? null : values, generations);
      });
    } catch { landSettings(null, generations); }
  }

  function isRequest(message, type) {
    return message !== null && typeof message === 'object' && !Array.isArray(message)
      && Object.keys(message).length === 2
      && message.type === type
      && Number.isInteger(message.requestId)
      && message.requestId >= 1 && message.requestId <= MAX_REQUEST_ID;
  }

  function onRuntimeMessage(message, sender, sendResponse) {
    // Only the packaged worker may ask. A sender carrying a tab is another
    // content script, never the worker, and is refused outright.
    if (sender === null || typeof sender !== 'object') return undefined;
    if (sender.id !== chrome.runtime.id || sender.tab !== undefined) return undefined;
    if (isRequest(message, 'get-status')) {
      sendResponse({
        type: 'status',
        requestId: message.requestId,
        diagnosis: statusDiagnosis,
        reason: statusReason,
      });
      return undefined;
    }
    if (isRequest(message, 'apply-preference')) {
      // The request carries no desired value and none is ever accepted from
      // it: this document re-reads the persisted boolean itself, so a spoofed
      // or replayed request cannot set a preference. The reply is deferred
      // until the read has landed and the page has been brought into line.
      const requestId = message.requestId;
      readPreference((applied) => {
        sendResponse({
          type: 'applied',
          requestId,
          applied,
          diagnosis: statusDiagnosis,
          reason: statusReason,
        });
      });
      return true;
    }
    return undefined;
  }

  function startPersistentTint() {
    try {
      observer = new MutationObserver((records) => {
        if (!active) return;
        // Invalidate stale colours during observer delivery, before the browser
        // may paint. Only the deferred fresh pass can add positive markers.
        try {
          let copiedMarkers = false;
          for (const record of records) {
            if (record.type === 'childList') for (const node of record.addedNodes) {
              if (adoptCopiedMarkers(node)) copiedMarkers = true;
            }
            if (record.type === 'attributes' && record.attributeName === PRIORITY_ATTRIBUTE
              && record.target.hasAttribute(PRIORITY_ATTRIBUTE)) ownedRows.add(record.target);
          }
          const relevant = mutationsAffectInterpretation(records);
          if (!relevant && !copiedMarkers) return;
          // A self-written marker or an unrelated record must not extend the
          // quiet window; only an interpretation-affecting change does.
          if (relevant) invalidateConfirmation();
          const snapshot = inspectCandidateTable(document);
          candidate = snapshot.table;
          const readable = snapshot.state === 'safe' || snapshot.state === 'blank';
          const keep = snapshot.state === 'safe'
            ? new Map(snapshot.entries.filter(({ priority }) => priority !== null)
              .map(({ row, priority }) => [row, priority])) : new Map();
          clearOwnedMarkers(keep);
          // Withdraw a working claim in the same turn the evidence for it went
          // away; only the deferred fresh pass may restore it.
          if (!readable) {
            const [diagnosis, reason] = statusForState(snapshot.state);
            publishStatus(diagnosis, reason);
          }
        } catch { cancelConfirmation(); clearOwnedMarkers(); publishStatus('neutral', null); }
        scheduleReconcile();
      });
      window.addEventListener('pagehide', onPageHide);
      window.addEventListener('pageshow', onPageShow);
      document.addEventListener('visibilitychange', onVisibilityChange);
      // Register the change listener before starting the read, so a preference
      // written between the two cannot be lost, and use a read generation so a
      // slow earlier reply cannot overwrite a newer change.
      chrome.storage.onChanged.addListener(onPreferenceChanged);
      chrome.runtime.onMessage.addListener(onRuntimeMessage);
      readSettings();
      readPreference();
    } catch { pauseController(); }
  }

  startPersistentTint();
})();
