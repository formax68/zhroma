# Phase 03: The Tint Survives Everything - Pattern Map

**Mapped:** 2026-09-09
**Files analyzed:** 8 proposed new/modified files
**Analogs found:** 7 / 8 (five distinct tracked analogs)

## File Classification

Names marked proposed are planning suggestions, not existing files or locked module boundaries. Keep runtime responsibilities inside the existing classic-script closure. Supporting CSS, manifest and admitted fixtures are inputs, not planned edits.

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `extension/content.js` | controller | event-driven, transform | same file | exact |
| `test/extension/initial-tint.test.js` | test | event-driven | same file | exact |
| `test/extension/persistent-tint.test.js` (proposed) | test | event-driven | `test/extension/initial-tint.test.js` | exact |
| `test/extension/runtime-contract.test.js` | test | event-driven, transform | same file | exact |
| `test/extension/live-acceptance.test.js` | test | file-I/O, transform | same file | exact |
| `test/extension/phase-03-live-acceptance.test.js` (proposed) | test | file-I/O, transform | `test/extension/live-acceptance.test.js` | exact |
| `.planning/phases/03-the-tint-survives-everything/03-LIVE-ACCEPTANCE.md` (proposed) | model (evidence record) | file-I/O | `.planning/phases/02-first-tint-on-a-real-view/02-LIVE-ACCEPTANCE.md` | role-match |
| `.planning/phases/03-the-tint-survives-everything/03-PERFORMANCE.md` (proposed) | model (measurement record) | batch, file-I/O | none | no close analog |

The reproducible browser workload may require an additional development-only harness. Its path and execution mechanism remain planner discretion; no existing browser performance harness was established among these analogs. Do not add a runtime debug API or dependency to manufacture a match. If extracting shared test helpers or an evidence validator, explicitly add their new paths to the implementation plans; the source patterns below apply.

## Pattern Assignments

### `extension/content.js` (controller, event-driven / transform)

**Analog:** `extension/content.js`, tracked. Preserve the inspector's validation contract while replacing startup lifecycle and stale rollback behavior.

**Imports / encapsulation** (lines 1–5): no runtime imports, classic script, private closure, exact labels.

```js
(() => {
  'use strict';

  const PRIORITY_ATTRIBUTE = 'data-zhroma-priority';
  const PRIORITY_LABELS = new Set(['Urgent', 'High', 'Normal', 'Low']);
```

**Guard / ownership** (lines 25–32): DOM evidence is the guard, with no authentication or routing layer.

```js
if (document.documentElement.lang !== 'en' || window.top !== window) return result('unsafe');
const tables = [...document.querySelectorAll(TABLE)];
if (tables.length === 0) return result('waiting');
if (tables.length !== 1) return result('unsafe');
const table = tables[0];
if (!table.isConnected || table.ownerDocument !== document
  || table.parentElement?.closest('table, [role="table"]')
  || table.querySelector('table, [role="table"]')) return result('unsafe', table);
```

**Validation before writes** (lines 64–73): unknown non-empty values veto the table; blanks remain explicit nulls.

```js
if (!row.matches(ROW)) return result('unsafe', table);
const cells = [...row.children];
if (cells.some((cell) => malformedCell(cell, CELL)) || cells.length > headers.length) return result('unsafe', table);
if (cells.length < headers.length) { incomplete = true; continue; }
const priority = cells[indexes[0]].textContent.trim();
if (priority !== '' && !PRIORITY_LABELS.has(priority)) return result('unsafe', table);
entries.push({ row, priority: priority || null });
```

Preserve same-table head/body selection at lines 34–51 and group exclusion with topology validation at lines 55–62. Recompute ownership and column mapping from the current DOM after relevant changes.

**Idempotent write seed** (lines 88–91):

```js
const previous = row.getAttribute(PRIORITY_ATTRIBUTE);
if (previous === priority) continue;
changed.push({ row, previous });
row.setAttribute(PRIORITY_ATTRIBUTE, priority);
```

Retain unchanged-write suppression, but replace `if (priority === null) continue` at line 87 with owned-marker removal for blanks. Do not copy restoration of old priorities at lines 94–99 into ongoing reconciliation. Keep the per-row nested try/catch containment shape, removing all owned markers on invalidation or failed commit and continuing after individual removal failures. Explicitly release detached row references.

**Lifecycle anti-pattern to replace:** lines 104–149 dispose on safe/unsafe results and at 15 seconds, disconnect before writes, and reset a trailing timeout for each mutation. Implement persistent discovery, bounded coalescing without starvation, relevant-attribute and candidate-universe filtering, and idempotent visibility/pagehide/pageshow handling. Preserve quiet failure behavior; never permanently abandon recovery after ordinary unsupported markup.

### `test/extension/initial-tint.test.js` and proposed `test/extension/persistent-tint.test.js` (test, event-driven)

**Analog:** `test/extension/initial-tint.test.js`, tracked.

**Imports** (lines 1–7):

```js
// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { createContext, Script } from 'node:vm';
import { Window } from 'happy-dom';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { validateFixtureManifest } from '../../scripts/fixture-contract.js';
```

**Actual shipped-source execution** (lines 61–65):

```js
const context = createContext({ document, window, MutationObserver: StartupObserver, setTimeout, clearTimeout });
for (const path of manifest.content_scripts[0].js) new Script(asset(path), { filename: path }).runInContext(context);
return { document, window, observers, context,
  deliver(target = document.body, extra = {}) {
    for (const observer of observers) if (observer.active) observer.callback([{ type: 'childList', target, addedNodes: [], removedNodes: [], ...extra }]);
```

Copy the actual-source execution, not a reimplementation of detector logic. Extend observer instrumentation for realistic attribute/character-data records and multiple records per batch; retain a real MutationObserver path to catch self-generated feedback and delivery-order mistakes. The existing window setup at lines 30–48 disables resource loads/navigation and loads declared CSS. Fixture admission validation at lines 15–19 runs before tests.

**Cleanup** (lines 21–27):

```js
for (const window of windows.splice(0)) {
  window.dispatchEvent(new window.Event('pagehide'));
  await window.happyDOM.close();
}
vi.restoreAllMocks();
vi.useRealTimers();
```

**Assertions to change:** line 67 hardcodes a 100 ms settlement and line 68 requires every observer inactive. Their callers encode Phase 2 disposal. Replace with behavior: active recoverable controller while visible, no idle timer, at most one pending pass, paused work on hide, exactly one resumed controller. Keep cleanup assertions at explicit test teardown; do not require successful tint to dispose discovery.

**Failure/validation seed** (lines 86–95): inject an unknown final priority, spy on `Element.prototype.setAttribute`, and assert zero marker writes, even transiently. Extend this to previously tinted tables and assert removal of old markers. Existing synthetic variants at lines 145–182 supply malformed headers, spans, foreign ownership, competing tables and sibling-header decoys. Apply them after success and repair them afterward to establish cleanup plus recovery.

**Required persistent sequences:** late entry after 15 seconds; present/absent/present; sort retained nodes; body/table replacement; Next/Previous incomplete intervals; text-node changes; recognized/blank/unknown/repaired priorities; group conversion; moved/detached rows; ancestor language/role changes; competing candidate outside current table; unrelated and mixed mutation batches; continuous mutation load; self-write quiescence; visibility and restoration; partial write/removal faults; thirty-switch resource counts. Keep synthetic mutation cases distinct from observed live scrolling, which retained mounted rows.

### `test/extension/runtime-contract.test.js` (test, event-driven / transform)

**Analog:** same tracked file.

**Forbidden-channel sentinels** (lines 61–69):

```js
const forbiddenCalls = [];
const deny = (name) => function () { forbiddenCalls.push(name); throw new Error('Forbidden runtime channel'); };
const storage = new Proxy({}, { get(_target, name) { forbiddenCalls.push(`storage.${String(name)}`); throw new Error('Forbidden storage access'); } });
const sentinels = {
  fetch: deny('fetch'), XMLHttpRequest: deny('XHR'), WebSocket: deny('WebSocket'), EventSource: deny('EventSource'),
  Worker: deny('Worker'), SharedWorker: deny('SharedWorker'), Image: deny('Image'),
  localStorage: storage, sessionStorage: storage, indexedDB: storage, caches: storage,
  chrome: { storage }, browser: { storage }, navigator: { sendBeacon: deny('beacon') },
  console: { log: deny('console.log'), warn: deny('console.warn'), error: deny('console.error'), info: deny('console.info') },
};
```

Copy lines 71–87 to install sentinels on both window and VM globals, prohibit generated code, compare global keys and verify DOM preservation after removing owned markers. Exercise them across repeated transitions and resumes, not only startup.

Replace exact textual call counts at lines 97–98 (`setAttribute` twice, `removeAttribute` once) with behavioral assertions that writes target only `data-zhroma-priority`, preserve native attributes/content, and skip unchanged values. Keep the static classic-script/no-channel/no-layout checks at lines 90–96 as supporting inventory, not sole proof. Preserve the manifest contract at lines 40–51 and direct-cell CSS/native exclusion tests at lines 114–151.

### Historical `test/extension/live-acceptance.test.js` (test, file-I/O / transform)

**Analog:** same tracked file. The Phase 2 report must continue validating its actual accepted bytes after the current runtime changes.

**Strict hash validation** (lines 78–80):

```js
requireEvidence(sameKeys(record.runtime_sha256, ASSETS) && sameKeys(hashes, ASSETS)
  && ASSETS.every((name) => /^[a-f0-9]{64}$/.test(record.runtime_sha256[name])
    && record.runtime_sha256[name] === hashes[name]), 'source-hashes');
```

**Binding seam to replace** (lines 275–279):

```js
test('repository report is honest, current, and reports its actual acceptance status', () => {
  const record = parseLiveAcceptance(readFileSync(reportURL, 'utf8'));
  expect(validateLiveAcceptance(record, currentHashes)).toBe(record.status);
  for (const name of ['STARTUP_DEADLINE_MS', 'SETTLE_MS']) {
    expect(record.settings[name]).toBe(Number(asset('content.js').match(new RegExp(`const ${name} = (\\d+);`))[1]));
```

**Historical identity resolved by read-only Git check:** commit `6fc6161ceff56f6830e23072273676929fecd8e9` contains all three assets with hashes identical to the accepted report at lines 44–47:

| Historical asset | SHA-256 |
|---|---|
| `extension/manifest.json` | `0c959d71e71b34f5f5d4bc75ffc84f7838f09cc7f0db95d24ad605d45ca57ee6` |
| `extension/content.js` | `35051cca30a12217e121d270715b70616b3deeaca1e697b7904358516f29cd70` |
| `extension/zhroma.css` | `f5af38707480b2379d00343d36ec3a54b27ae79e95a09ad00a4538230c586b61` |

Verified with `git show <revision>:<path> | shasum -a 256`, independently of the current asset reader. The revision is a verified source identity, not a claim that acceptance occurred at that commit time. Load those immutable bytes for historical hashes, constants and palette. Planner chooses Git extraction versus checked-in verified historical bytes; the former must handle missing history explicitly, the latter must retain independently verified provenance. Never derive expected historical hashes from the report alone, silently fall back to current files, delete settings checks, or reset authentic past observations into acceptance of new source.

### Proposed `test/extension/phase-03-live-acceptance.test.js` (test, file-I/O / transform)

**Analog:** `test/extension/live-acceptance.test.js`, tracked. Reuse its strict parser and evidence consistency checks, but define Phase 3 required checks and current runtime settings separately from Phase 2.

**Disposition calculation** (lines 102–107):

```js
const hasDefect = record.checks.some((check) => check.status === 'fail')
  || record.limitations.unresolved_observed_defects.length > 0;
const complete = record.loaded_from_repository && record.checks.every((check) => check.status === 'pass');
const expected = hasDefect ? 'gaps_found' : complete ? 'passed' : 'human_needed';
requireEvidence(record.status === expected, 'disposition');
return record.status;
```

Copy single fenced record parsing and duplicate-member detection at lines 23–59, exact required-check inventory at lines 85–86, pending/live distinction and valid nonfuture local dates at lines 87–100. Preserve negative tests for stale hash, duplicate/missing/extra checks, false passed, synthetic evidence, unresolved defects and future dates. Synthetic validator fixtures at lines 110–127 remain in-memory test data and must never populate real acceptance artifacts.

Current Phase 3 validation must compare final current assets, not the historical revision. Reports should start pending with unconfirmed loaded source and remain `human_needed` until authentic acceptance; source changes invalidate current-source observations. A passing shape validator proves consistency, not that a human observed anything.

### Proposed `03-LIVE-ACCEPTANCE.md` (evidence model, file-I/O)

**Analog:** `.planning/phases/02-first-tint-on-a-real-view/02-LIVE-ACCEPTANCE.md`, tracked. Use its single canonical JSON record (lines 29–34), explicit source inventory (44–59), per-check status/evidence-kind/date/evidence fields (60–137), and separate limitations (139–146). Do not copy its passed values or historical observations into new Phase 3 rows.

**Record shape excerpt** (lines 35–43):

```json
{
  "schema_version": 1,
  "status": "passed",
  "scope": {
    "language": "English",
    "html_lang": "en",
    "shell": "current Agent Workspace",
    "interface": "light"
  },
```

The excerpt is historical only: the new record starts `human_needed`. Include explicit in-app entry, delayed entry, sort, refresh, switching, Next/Previous, scroll, grouped/sticky header, cleanup, non-view isolation, tab return, and available restoration checks. Record performance/memory outcomes as separately evidenced gates; unavailable live scenarios remain pending with an explanation. Preserve user-controlled login/MFA/sensitive navigation and sanitized aggregate outcomes only.

## Shared Patterns

- **Runtime guard and validation:** `extension/content.js:25–73`; apply current English/single-table/same-table ownership and exact-label validation to every reconciliation. No new auth middleware is relevant.
- **Contained errors:** `extension/content.js:93–100`; reuse independent per-row best-effort containment, changing stale restoration into cleanup. No ticket values in logs or error UI.
- **Source-equals-shipped tests:** `test/extension/initial-tint.test.js:61–62` and `test/extension/runtime-contract.test.js:73–77`; execute manifest-declared source in a VM. Do not export runtime internals merely for testing.
- **Admitted inputs:** fixture manifest validation at `test/extension/initial-tint.test.js:15–19`; mutate fresh in-memory copies. Keep admitted fixture bytes/checksums intact.
- **Privacy and native preservation:** `test/extension/runtime-contract.test.js:61–87`; extend sentinels and DOM comparisons over ongoing work. Static source scans supplement these behaviors.
- **Evidence is not execution:** `test/extension/live-acceptance.test.js:62–107`; consistency validation, offline correctness, live observations, memory measurements and independent security/goal review are different evidence classes.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| Proposed `03-PERFORMANCE.md` | model (measurement record) | batch, file-I/O | No close timing/heap measurement artifact in the five selected analogs; use the Phase 3 research workload protocol. |

Use 30/200/1000 synthetic browser rows, ten warmup batches, at least 100 measured batches per operation/size, median/p95/max and callback/pass/write counts. Include filtering, lookup, validation, cleanup and writes; separate scheduling latency. Gate 30-row typical median below 2 ms and maximum across the declared workload below 16 ms; record all samples without selectively excluding slow cases. Record browser/hardware/source/CPU settings. Trace extension-attributed forced layouts separately from later native rendering. Happy-dom elapsed time does not establish browser performance.

The live memory procedure compares post-GC resting snapshots around thirty user-controlled switches and an extension-disabled control. Preserve sanitized aggregate counts/retainer conclusions only, no live heap dumps or raw traces. Synthetic observer/reference counts cannot establish real browser garbage collection. Record the actual mounted live row count; 200/1000 synthetic rows do not enlarge the observed 30-row evidence.

## Metadata

**Analog search scope:** tracked `extension/`, `test/extension/`, `scripts/` inventory and Phase 2 planning artifacts. Stopped at five strong analogs.
**Files scanned for concrete excerpts:** five analogs (four JavaScript files and one acceptance record).
**Tracked-source gate:** `git ls-files` returned every analog above; historical assets additionally read from the immutable commit. No ignored runtime mirror is an analog.
**Project discovery:** no root `AGENTS.md` or project skill index was returned; `.claude/CLAUDE.md` constraints were checked. Current phase decisions override its older package, permission and palette suggestions.
**Tooling limitation:** this agent runtime exposes no filesystem Read/Write tool; read-only shell inspection and the dedicated patch tool were used. Only this pattern map was written.
**Pattern extraction date:** 2026-09-09. No implementation, tests, live browser work or commits performed by this mapper.
