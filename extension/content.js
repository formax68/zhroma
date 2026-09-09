(() => {
  'use strict';

  const PRIORITY_ATTRIBUTE = 'data-zhroma-priority';
  const PRIORITY_LABELS = new Set(['Urgent', 'High', 'Normal', 'Low']);
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

  function inspectCandidateTable(document) {
    const result = (state, table = null, entries = []) => ({ state, table, entries });
    if (document.documentElement.lang !== 'en' || window.top !== window) return result('unsafe');
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
    if (indexes.length === 0) return result('waiting', table);

    const entries = [];
    let incomplete = false;
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
      const priority = cells[indexes[0]].textContent.trim();
      if (priority !== '' && !PRIORITY_LABELS.has(priority)) return result('unsafe', table);
      entries.push({ row, priority: priority || null });
    }
    if (incomplete || entries.length === 0) return result('waiting', table);
    return result(entries.some((entry) => entry.priority !== null) ? 'safe' : 'blank', table, entries);
  }

  function clearOwnedMarkers(keep = new Map()) {
    // Release even unremovable rows. A permanently broken native removal API
    // cannot guarantee paint cleanup; it must not also leak detached nodes.
    let complete = true;
    for (const row of ownedRows) {
      if (keep.has(row) && row.getAttribute(PRIORITY_ATTRIBUTE) === keep.get(row)) continue;
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
    // Never carry DOM interpretations across a timer boundary.
    const keep = new Map(snapshot.entries.filter(({ priority }) => priority !== null)
      .map(({ row, priority }) => [row, priority]));
    if (!clearOwnedMarkers(keep)) {
      clearOwnedMarkers();
      return;
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
    }
  }

  function reconcileCurrentTable() {
    reconcileTimer = null;
    if (!active) return;
    try {
      const snapshot = inspectCandidateTable(document);
      candidate = snapshot.table;
      if (snapshot.state === 'safe') commitSnapshot(snapshot);
      else clearOwnedMarkers();
    } catch { clearOwnedMarkers(); }
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
          if (ownedRows.has(target) && target.getAttribute(PRIORITY_ATTRIBUTE) !== expectedMarkers.get(target)) return true;
          continue;
        }
        if (target === document.documentElement && record.attributeName === 'lang') return true;
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

  function disposeController() {
    active = false;
    observer?.disconnect();
    clearTimeout(reconcileTimer);
    reconcileTimer = null;
    clearOwnedMarkers();
    candidate = null;
  }

  function startPersistentTint() {
    active = true;
    try {
      observer = new MutationObserver((records) => {
        if (!active) return;
        // Invalidate stale colours during observer delivery, before the browser
        // may paint. Only the deferred fresh pass can add positive markers.
        try {
          if (!mutationsAffectInterpretation(records)) return;
          const snapshot = inspectCandidateTable(document);
          candidate = snapshot.table;
          const keep = snapshot.state === 'safe'
            ? new Map(snapshot.entries.filter(({ priority }) => priority !== null)
              .map(({ row, priority }) => [row, priority])) : new Map();
          clearOwnedMarkers(keep);
        } catch { clearOwnedMarkers(); }
        scheduleReconcile();
      });
      observer.observe(document, { childList: true, characterData: true, subtree: true,
        attributes: true, attributeFilter: INTERPRETATION_ATTRIBUTES });
      window.addEventListener('pagehide', disposeController);
      scheduleReconcile();
    } catch { disposeController(); }
  }

  startPersistentTint();
})();
