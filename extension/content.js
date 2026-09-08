(() => {
  'use strict';

  const PRIORITY_ATTRIBUTE = 'data-zhroma-priority';
  const PRIORITY_LABELS = new Set(['Urgent', 'High', 'Normal', 'Low']);
  const STARTUP_DEADLINE_MS = 15000;
  const SETTLE_MS = 100;
  const TABLE = 'table[data-garden-id="tables.table"][data-test-id="generic-table"]';
  const HEAD = 'thead[data-garden-id="tables.head"][data-test-id="generic-table-head"]';
  const BODY = 'tbody[data-garden-id="tables.body"][data-test-id="generic-table-body"]';
  const HEADER_ROW = 'tr[data-garden-id="tables.header_row"]';
  const HEADER_CELL = 'th[data-garden-id="tables.header_cell"]';
  const ROW = 'tr[data-garden-id="tables.row"][data-test-id="generic-table-row"]';
  const GROUP = 'tr[data-garden-id="tables.group_row"][data-test-id="generic-table-rows-group-by"]';
  const CELL = 'td[data-garden-id="tables.cell"]';

  let observer = null;
  let deadlineTimer = null;
  let settleTimer = null;
  let candidate = null;
  let active = false;

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
      if (row.matches(GROUP)) continue;
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

  function commitSnapshot(snapshot) {
    // Revalidate after disconnect, immediately before writes. No asynchronous gap.
    const current = inspectCandidateTable(document);
    if (current.state !== 'safe' || current.table !== snapshot.table
      || current.entries.length !== snapshot.entries.length
      || current.entries.some((entry, index) => entry.row !== snapshot.entries[index].row
        || entry.priority !== snapshot.entries[index].priority
        || !entry.row.isConnected || entry.row.closest(TABLE) !== current.table)) return;
    const changed = [];
    try {
      for (const { row, priority } of current.entries) {
        if (priority === null) continue;
        const previous = row.getAttribute(PRIORITY_ATTRIBUTE);
        if (previous === priority) continue;
        changed.push({ row, previous });
        row.setAttribute(PRIORITY_ATTRIBUTE, priority);
      }
    } catch {
      // Best effort per attribute: one failed restoration must not skip the rest.
      for (const { row, previous } of changed.reverse()) {
        try {
          if (previous === null) row.removeAttribute(PRIORITY_ATTRIBUTE);
          else row.setAttribute(PRIORITY_ATTRIBUTE, previous);
        } catch { /* Contain host DOM failures without exposing ticket values. */ }
      }
    }
  }

  function disposeStartup() {
    active = false;
    observer?.disconnect();
    observer = null;
    clearTimeout(deadlineTimer);
    clearTimeout(settleTimer);
    deadlineTimer = null;
    settleTimer = null;
    candidate = null;
    window.removeEventListener('pagehide', disposeStartup);
  }

  function startInitialTint(document) {
    active = true;
    const check = () => {
      if (!active) return;
      settleTimer = null;
      try {
        const snapshot = inspectCandidateTable(document);
        candidate = snapshot.table;
        if (snapshot.state === 'safe' || snapshot.state === 'unsafe') {
          disposeStartup();
          if (snapshot.state === 'safe') commitSnapshot(snapshot);
        }
      } catch { disposeStartup(); }
    };
    const schedule = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(check, SETTLE_MS);
    };
    try {
      observer = new MutationObserver((records) => {
        if (!active) return;
        try {
          if (!candidate || !candidate.isConnected || records.some((record) => candidate.contains(record.target))) schedule();
        } catch { disposeStartup(); }
      });
      observer.observe(document, { childList: true, characterData: true, subtree: true });
      deadlineTimer = setTimeout(disposeStartup, STARTUP_DEADLINE_MS);
      window.addEventListener('pagehide', disposeStartup);
      candidate = inspectCandidateTable(document).table;
      schedule();
    } catch { disposeStartup(); }
  }

  startInitialTint(document);
})();
