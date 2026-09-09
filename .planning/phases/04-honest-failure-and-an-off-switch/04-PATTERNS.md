# Phase 4: Honest Failure and an Off Switch - Pattern Map

**Mapped:** 2026-09-09
**Files analyzed:** 14 candidate files/asset groups
**Analogs found:** 9 / 14 (five distinct tracked source analogs)

Names for new files below are planning suggestions, not existing files. Icon count, toolbar vocabulary, toggle scope/storage area, and popup help boundary remain subject to the context's decision checkpoint. Phase 3 remains `human_needed` (28/34 truths); this map does not attest its pending live checks or restart UAT.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `extension/content.js` (modify) | controller | event-driven / transform | same file | exact |
| `extension/manifest.json` (modify) | config | transform | same file | exact |
| `extension/background.js` (new suggested name) | service | event-driven / request-response | none | none |
| `extension/popup.html` (new) | component | request-response | none | none |
| `extension/popup.js` (new) | controller | event-driven / request-response | none | none |
| `extension/popup.css` (new, if required) | component | transform | none | none |
| `extension/icons/*` (new asset group) | config | file-I/O | none | none |
| `test/extension/diagnosis.test.js` (new suggested name) | test | event-driven | `test/extension/persistent-tint.test.js` | exact |
| `test/extension/toggle.test.js` (new suggested name) | test | event-driven | `test/extension/persistent-tint.test.js` | exact |
| `test/extension/toolbar-popup.test.js` (new suggested name) | test | request-response | `test/extension/runtime-contract.test.js` | role-match |
| `test/extension/runtime-contract.test.js` (modify) | test | event-driven | same file | exact |
| `test/extension/persistent-tint.test.js` (modify harness) | test | event-driven | same file | exact |
| `test/extension/phase-03-live-acceptance.test.js` (historical binding) | test | file-I/O | `test/extension/live-acceptance.test.js` | exact |
| `test/extension/phase-04-live-acceptance.test.js` (new suggested name) | test | file-I/O | `test/extension/live-acceptance.test.js` | exact |

`initial-tint.test.js` and the performance harness may require compatible Chrome mocks if their execution seam changes; that is a conditional harness edit using the same runtime-contract pattern below. Preserve their existing behavioral assertions. No `vitest.config.js` edit is required for new tests matching `test/extension/*.test.js`. Do not modify the admitted three fixtures or `extension/zhroma.css` for this phase. New synthetic cases can be constructed in tests. Phase 4 live acceptance/UAT documents are separate evidence artifacts, not shipped source.

## Pattern Assignments

### `extension/content.js` — controller, event-driven / transform

**Analog:** `extension/content.js`; no imports: classic isolated IIFE, lines 1–5:

```js
(() => {
  'use strict';

  const PRIORITY_ATTRIBUTE = 'data-zhroma-priority';
  const PRIORITY_LABELS = new Set(['Urgent', 'High', 'Normal', 'Low']);
```

**Guard and validation:** lines 23–32 validate exact English, top frame, one connected non-nested table; lines 34–73 validate direct topology and exact trimmed labels. Preserve validation, but split unsupported-language from structural failure and operational waiting. The following existing branch (lines 43–51) is the seam to replace, not missing-column proof:

```js
const headers = [...headerRows[0].children];
const malformedCell = (cell, selector) => !cell.matches(selector)
  || cell.colSpan !== 1 || cell.rowSpan !== 1
  || cell.querySelector('tr, td, th, [role="row"], [role="cell"], [role="columnheader"]');
if (headers.some((cell) => malformedCell(cell, HEADER_CELL))) return result('unsafe', table);
if (headers.length === 0) return result('waiting', table);
const indexes = headers.flatMap((cell, index) => cell.textContent.trim() === 'Priority' ? [index] : []);
if (indexes.length > 1) return result('unsafe', table);
if (indexes.length === 0) return result('waiting', table);
```

Missing diagnosis needs shared body validation, at least one width-matched ticket row and a fresh settled observation. Blank priorities map to working with the dedicated popup nuance. Never carry a DOM snapshot across a timer or messaging await.

**Core lifecycle:** lines 181–189:

```js
function pauseController() {
  active = false;
  observer?.disconnect();
  clearTimeout(reconcileTimer);
  reconcileTimer = null;
  adoptCopiedMarkers(document);
  clearOwnedMarkers();
  candidate = null;
}
```

Reuse ownership teardown, but propagate cleanup outcome and add separate preference/visibility state. Gate every resume path (lines 191–207, 234–237) on confirmed preference; visibility must not undo user-off. Cancel the new settle timer here too.

**Error handling:** `clearOwnedMarkers` lines 87–107 makes one bounded removal retry, releases strong references, and returns a boolean. `commitSnapshot` lines 110–128 rolls back failed writes but currently returns no success outcome. Change that contract before announcing working or acknowledging successful off. Keep catches silent: no page UI or console output.

### `extension/manifest.json` — config, transform

**Analog:** same file, lines 5–12:

```json
"permissions": ["storage"],
"content_scripts": [{
  "matches": ["https://*.zendesk.com/agent/*"],
  "js": ["content.js"],
  "css": ["zhroma.css"],
  "run_at": "document_idle",
  "world": "ISOLATED",
  "all_frames": false
```

Add packaged action/popup/icon/background declarations without adding permissions or host_permissions. Update the exact manifest and asset inventory assertions together. No build step, remote assets, or source transformation.

### Diagnosis, toggle and persistent runtime tests — test, event-driven

**Analog:** `test/extension/persistent-tint.test.js`. Imports at lines 1–7 use Node built-ins, Vitest and happy-dom; scripts are executed from repository bytes. Use its fixture loader, fake/native observer duality (lines 30–75), and lifecycle cleanup (lines 21–28).

**Concrete actual-source execution and timer assertions**, lines 66–74:

```js
const context = createContext({ document, window, MutationObserver: StartupObserver, setTimeout, clearTimeout,
  ...(instrumentCollections ? { Set: TrackedSet } : {}) });
for (const path of manifest.content_scripts[0].js) new Script(asset(path), { filename: path }).runInContext(context);
return { document, window, observers, context, collections, windowListeners, documentListeners,
  deliver(target = document.body, extra = {}) {
    for (const observer of observers) if (observer.active) observer.callback([{ type: 'childList', target, addedNodes: [], removedNodes: [], ...extra }]);
  },
  settled() { vi.advanceTimersByTime(100); },
  disposed() { expect(observers.filter((observer) => observer.active)).toHaveLength(1); expect(vi.getTimerCount()).toBe(0); },
```

Adapt the VM context to strict Chrome mocks and asynchronous startup. Do not mechanically retain the one-active-observer assertion while off/hidden: assert zero there. Use timer boundaries around the proposed 100 ms settle period, then verify zero at rest. Reuse the visibility/bfcache stress structure at lines 345–368 to prove stored false survives every lifecycle path. Add deferred storage responses and explicit desired-value toggles; never replace source execution with a test-only implementation.

### Toolbar/popup tests and runtime contract — test, request-response / event-driven

**Analog:** `test/extension/runtime-contract.test.js`. Node VM imports are lines 1–7; disabled network/navigation happy-dom setup is lines 28–37; exact packaging assertions are lines 40–51.

**Forbidden-channel and source sandbox pattern**, lines 61–75 (excerpt):

```js
const forbiddenCalls = [];
const deny = (name) => function () { forbiddenCalls.push(name); throw new Error('Forbidden runtime channel'); };
```

```js
const context = createContext({ ...sentinels, document, window,
  MutationObserver: window.MutationObserver, setTimeout, clearTimeout,
}, { codeGeneration: { strings: false, wasm: false } });
```

Retain the surrounding sentinels for network, console, web storage, IndexedDB and caches. Replace only the blanket Chrome storage denial with exact one-boolean storage and bounded message mocks. Test worker and popup in separate contexts, with deferred replies, worker recreation, stale generations, tab changes/closure, no receiver, malformed sender/schema, and read/write failure. Existing mocks are a harness pattern, not an existing browser messaging implementation.

**Quiescence and privacy assertions**, lines 78–81:

```js
vi.advanceTimersByTime(15000);
expect(forbiddenCalls).toEqual([]);
expect(Object.keys(context)).toEqual(initialGlobals);
expect(vi.getTimerCount()).toBe(0);
```

Preserve content-script no-page-construction/no-JS-palette checks at lines 109–117. Give the static popup its own output contract (fixed text via textContent, labelled switch); do not weaken the Zendesk page restriction to accommodate popup HTML. Recursively pin packaged icon assets and reject remote resource references.

### Historical Phase 3 binding and new Phase 4 evidence test — test, file-I/O

**Analog:** `test/extension/live-acceptance.test.js`. Imports at lines 1–6 include Node crypto/fs/child_process and Vitest. Historical source retrieval at lines 13–24:

```js
const historicalRevision = '6fc6161ceff56f6830e23072273676929fecd8e9';
const asset = (name) => {
  try {
    return execFileSync('git', ['show', `${historicalRevision}:extension/${name}`], {
      cwd: new URL('../../', import.meta.url), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    throw new Error(`Restore historical commit ${historicalRevision} locally to validate Phase 2 evidence`);
  }
};
```

For Phase 3, resolve and independently verify its own baseline revision and hashes; do not copy the Phase 2 SHA or rewrite historical outcomes. Keep missing commit failure explicit. For new Phase 4 evidence, hash every shipped asset including popup, worker and icons from current bytes, and require new-source live observations. The validator's lines 35–39 provide exact-key object validation; lines 69–77 enforce one JSON record and reject duplicate members. Lines 91–98 distinguish human_needed/gaps_found/passed and bind asset hashes. Offline consistency validation cannot establish that a person observed an icon or toggle.

## Shared Patterns

### Ownership and fresh interpretation

**Source:** `extension/content.js` lines 110–124, 146–179, 209–232. **Apply to:** diagnosis, off/on, quiet-period invalidation.

```js
const keep = new Map(snapshot.entries.filter(({ priority }) => priority !== null)
  .map(({ row, priority }) => [row, priority]));
```

Keep DOM entries private to the synchronous controller. Expose only finite diagnosis/reason and operational primitives, never rows, text, URLs or raw errors. Existing self-marker suppression must also suppress settle-window churn.

### Authentication/trust boundaries

No login, authentication middleware or existing Chrome sender guard exists. Preserve the content English/top-frame guard; add separately tested extension ID, top-frame and exact schema guards using 04-RESEARCH.md. Do not confuse the table guard with message authorization. Per-tab identity comes from Chrome metadata rather than payload fields.

### Errors, resources and tests

Use silent bounded cleanup, no retry loop, one pending reconciliation/confirmation path and zero idle timers. Storage absence alone defaults on; failure remains unconfirmed. Preserve package versions and actual-source tests. New worker/popup behavior needs strict asynchronous mocks and separate human visual evidence.

## No Analog Found

| File | Role | Data Flow | Reason / planner guidance |
|---|---|---|---|
| `extension/background.js` | service | event-driven / request-response | First Chrome worker/action/storage coordination surface; use research messaging, generation checks and reconstructible state patterns |
| `extension/popup.html` | component | request-response | First packaged extension UI; static native markup; status plus one switch |
| `extension/popup.js` | controller | event-driven / request-response | First popup controller; research bounded handshake and confirmed desired-value writes |
| `extension/popup.css` | component | transform | Tint stylesheet is not a popup layout analog; keep styles packaged and outside JavaScript |
| `extension/icons/*` | config | file-I/O | No tracked artwork exists; treatment and off/neutral meanings require decision checkpoint |

Do not invent analogs from developer tools or gitignored runtime mirrors. Popup and worker filenames can change during planning without changing these responsibilities.

## Metadata

**Analog search scope:** tracked `extension/`, `test/extension/`, plus test-discovery configuration.
**Inventory:** 10 extension/test source files plus `vitest.config.js`; five strong analogs selected and read.
**Tracked-source check:** `git ls-files extension test/extension vitest.config.js` returned every source analog named above. No runtime mirror path is used.
**Project instructions inventory:** root AGENTS.md and project `.agents/skills` / `.codex/skills` absent; research records the configured `.claude/CLAUDE.md` guidance and current constraints.
**Pattern extraction date:** 2026-09-09.
**Scope of this run:** Only this pattern map was written; no production edits, package installation, commit, UAT or acceptance change.
