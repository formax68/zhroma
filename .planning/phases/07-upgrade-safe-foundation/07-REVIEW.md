---
phase: 07-upgrade-safe-foundation
reviewed: 2026-09-28T11:46:43Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - DEPENDENCY-APPROVALS.md
  - extension/background.js
  - extension/content.js
  - extension/manifest.json
  - extension/options.html
  - extension/zhroma-settings.js
  - package.json
  - scripts/baseline-source.js
  - scripts/phase-04-source.js
  - scripts/release-source.js
  - scripts/run-tint-workload.js
  - test/extension/chrome-harness.js
  - test/extension/frozen-contract.test.js
  - test/extension/parity.test.js
  - test/extension/performance-harness.test.js
  - test/extension/release-package.test.js
  - test/extension/runtime-contract.test.js
  - test/extension/settings-module.test.js
  - test/extension/settings-queue.test.js
  - test/extension/settings-reader.test.js
  - test/extension/toolbar-popup.test.js
  - test/extension/tracer-world.js
  - test/extension/upgrade-storage.test.js
  - test/mutants/settings-foundation.mutants.json
  - test/performance/tint-workload.js
  - tsconfig.json
  - tsconfig.v1.json
  - types/zhroma.d.ts
findings:
  critical: 0
  warning: 6
  info: 5
  total: 11
status: issues_found
---

# Phase 7: Code Review Report

**Reviewed:** 2026-09-28T11:46:43Z
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

I reviewed the Phase 7 diff (`c80c3cb^..HEAD`): the shared settings module, the worker settings queue and the D-17 sender checks, the content-script settings reader and its gate, the options stub, the baseline and Phase 4 source adapters, the timing-harness changes, and the new and changed tests. `npm test` passes: tsc (both configs), 112 node tests and 1441 vitest tests.

The `enabled` path is not byte-identical to 0.1.0. `runnable()` gained `settingsReady`, the storage listener became `onStorageChanged`, and `fromContent` gained `isAgentDocument(sender.url)`. D-09 and D-17 call for these changes. One of them has a behaviour cost that no test catches (WR-02).

The 07-09 narrowing of `scripts/phase-04-source.js` protects the historical Phase 4 verdict against edits *inside* the judge functions. It does not protect against top-level code elsewhere in `scripts/run-tint-workload.js` that changes how those functions behave at run time. I demonstrated two bypasses (WR-01).

The settings module is careful about untrusted stored input. It has four defects that stay hidden with today's one exact-match `theme` key and will surface with the Phase 9/10 keys that D-15 says must need no queue or reader change (WR-03 to WR-05, IN-02). Every behavioural finding below was reproduced with a scratch script against the current bytes.

## Warnings

### WR-01: The Phase 4 judge-text pin can be bypassed by top-level code outside the pinned slices

**File:** `scripts/phase-04-source.js:137-168, 229-231` (guarded file: `scripts/run-tint-workload.js`)

**Issue:** Before 2441c64, `run-tint-workload.js` had to be byte-identical on disk to its pinned blob. Now `timingJudgeSource()` compares only these text slices:
- the first line of `OPERATIONS`, `requireValue` and `finite`;
- the three `export function` bodies.

Everything else in the file can change without tripping the guard, and some of that code changes what the judges return. `phase-04-live-acceptance.test.js:350` and `phase-03-live-acceptance.test.js:126` both import `validateWorkloadReport` from the working copy.

Two bypasses, both reproduced (`timingJudgeSource(mutated) === timingJudgeSource(original)` returned `true` for each):
- Insert `OPERATIONS.length = 0;` after `const finite = ...` (line 20). `OPERATIONS` is a mutable array, so the per-operation loop in `validateWorkloadReport` runs zero times. The function then returns `'passed'` for any run that has six operation keys, including one over budget.
- Insert `Math.ceil = () => 1;` before `readServedAssets`. `quantile()` then always picks the first sorted sample, so the median check `metrics.median >= 2` compares against the minimum.

The same goes for side effects in the modules the runner imports (`./fixture-contract.js`, `./baseline-source.js`), which are evaluated before the judges run. The old whole-file pin already missed those imports, but it did catch any in-file edit.

For today's bytes the narrowing is sound: no such statement exists, and the pinned and working judge texts are equal. But the guard's stated purpose ("must not be able to move, invalidate or quietly re-earn a human observation") is no longer enforced. Only a textual subset is enforced. The negative controls in `performance-harness.test.js:127-139` only exercise edits inside the slices.

**Fix:** Judge the historical samples with the pinned code itself, not with the working copy. The extracted slices are self-contained (no imports), so they can run in a fresh VM context:

```js
// scripts/phase-04-source.js
import { createContext, Script } from 'node:vm';
export function pinnedJudges(baseline) {
  const text = timingJudgeSource(blob(baseline.observation_revision, TIMING_JUDGE_PATH).toString('utf8'))
    .replace(/^export function /gmu, 'function ');
  // A fresh context: the working copy's module state and patched built-ins cannot reach it.
  return new Script(`${text}\n;({ summarizeSamples, validateWorkloadReport, mergeReport })`)
    .runInContext(createContext({}));
}
// readPhase04Source(): expose `judges: pinnedJudges(baseline)` in the frozen result,
// and have phase-04-live-acceptance.test.js (and phase-03) call OBSERVED_SOURCE.judges.validateWorkloadReport
// instead of importing it from ../../scripts/run-tint-workload.js.
```

Keep the text-equality check as an extra tripwire. Then the verdict no longer depends on anything in the working copy.

### WR-02: `apply-preference` acknowledges `applied: true` while the settings gate is still holding the tint back

**File:** `extension/content.js:373-375, 446-461, 512-517`

**Issue:** `applyPreference(value, generation, true)` calls `syncController(true)`. While `settingsReady` is false, `runnable()` returns false, so `syncController` calls `pauseController()`, which returns `true` when there are no markers to clear. `applyPreference` then returns `preferenceReady && settled`, which is `true`.

The page replies `{ applied: true, diagnosis: 'neutral' }` even though the stored preference is `enabled: true` and not a single row is tinted. `openSettingsGate()` later calls `syncController()` without `immediate` and never re-answers.

Reproduced: stored `enabled: true`, a settings read that hangs, preference read delivered, then an `apply-preference` request. The reply was `{"applied":true,"diagnosis":"neutral"}` with 0 tinted rows, and 4 rows were tinted after the 500 ms gate timeout.

The worker (`background.js:267-280`) takes `applied: true` as proof that the work completed and re-queries the status (`neutral`). So during the gate window the popup and toolbar show an on switch with a neutral page. In 0.1.0 the same request tinted synchronously and answered `working`.

The window is small in practice: the two reads are issued back to back and normally land in order. It is real whenever the settings read is slow or hangs, which is exactly the case D-09's time bound exists for.

This is a change to the D-02 apply handshake that the parity harness cannot see, because `parity.test.js` has no `apply-preference` step.

**Fix:** Do not acknowledge an enabled preference as applied until the gate has opened. Either defer the `done` callback until `openSettingsGate()` runs an immediate pass, or report honestly:

```js
// applyPreference
const settled = syncController(immediate);
if (!statusAnnounced) { statusAnnounced = true; announceStatus(); }
return preferenceReady && settled && (!preferenceEnabled || settingsReady);
```

Also add a parity or handshake test with `settingsReadMode: 'hang'` that sends `apply-preference` before the timeout.

### WR-03: `equal()` compares the raw requested value, not its parsed form, so a no-op save writes and bumps the CAS revision

**File:** `extension/zhroma-settings.js:406-408, 528`

**Issue:** The queue skips a write when `registry.equal(key, current.value, value)` is true. `equal` runs `fields()` on each side and compares the JSON. `current.value` is a parsed value, but `value` is the raw request, so for any key whose `parse` normalises (trims, sorts, drops defaults) the two never compare equal. `encode()` then parses `value` and writes the stored form that is already there.

Reproduced with a cas key whose `parse` trims: stored `{v:1, rev:3, name:'b'}`, request `' b '` with revision 3. The reply was `saved` with revision 4, and the queue wrote `{v:1,rev:4,name:'b'}`.

That breaks D-11 ("Choosing the value already in effect writes nothing"). For CAS keys it is worse: the needless revision bump makes the other window's next save a spurious `conflict`, and D-16 exists to make that case (rules edited from two windows) work.

The shipped `theme` parse is an exact match, so there is no impact today. D-15 requires the next keys to work with no queue change.

**Fix:** Compare parsed values:

```js
// perform()
const wanted = registry.parseValue(key, value);
if (current.status !== 'unreadable' && wanted !== undefined && registry.equal(key, current.value, wanted)) { answer(job, 'unchanged'); return; }
```

Or make `equal` parse both sides through `parseValue` itself.

### WR-04: A CAS stored form with a missing or corrupt `rev` resolves as `stored`, not `unreadable`

**File:** `extension/zhroma-settings.js:342, 356`

**Issue:** `const rev = entry.cas && isPositiveInteger(current.rev) ? current.rev : 0;` silently swaps an absent, non-numeric or negative `rev` for 0. `ownCopy` then strips `rev` before `parse`, so the corruption is invisible to the entry's validator.

Reproduced: `{v:1,name:'x'}`, `{v:1,rev:'garbage',name:'x'}` and `{v:1,rev:-5,name:'x'}` all resolve to `{status:'stored', revision:0}`.

`encode()` always writes a positive `rev`, so the read side accepts forms the write side never produces. That contradicts the "What is written must be exactly what a read accepts" invariant at line 396 and D-08's "fails validation → unreadable". It also means any requester holding revision 0 can win a CAS race against a corrupt record, which it could not do against the intact record.

**Fix:**

```js
if (entry.cas && !isPositiveInteger(current.rev)) return unreadable;
const rev = entry.cas ? current.rev : 0;
```

Consider also refusing a migration step whose output changes or drops `rev`.

### WR-05: `defaultValue` is shared by reference and never frozen, despite "private copies"

**File:** `extension/zhroma-settings.js:217-218, 256, 324-325, 414`; consumer `extension/content.js:79, 496`

**Issue:** `define()` says it builds "a frozen registry over private copies". But `record.defaultValue` is the caller's object, and `defaultOf()` and every `'default'` or `'unreadable'` resolution return that same reference. `resolved()` freezes only the wrapper.

Reproduced with an object default `{list: []}`: `registry.defaultOf('rules').list.push('injected')` made every later `resolve(..., false).value` return `{"list":["injected"]}`, and `Object.isFrozen(value)` was `false`.

That default was validated once, at define time. A later mutation (for example a Phase 9 reader editing "its" rules array in place) goes around validation and changes the default for every consumer in that context, including `settingsState` in `content.js`.

**Fix:** Deep-freeze the default in `define()`, or re-derive a fresh value for each resolution:

```js
const deepFreeze = (v) => { if (v && typeof v === 'object') { Object.values(v).forEach(deepFreeze); Object.freeze(v); } return v; };
// define(): defaultValue: deepFreeze(structuredClone(entry.defaultValue)),
```

`structuredClone` is available in both the worker and the content world.

### WR-06: The frozen-contract network and remote patterns can be evaded, and the file can never be edited

**File:** `test/extension/frozen-contract.test.js:69-71, 95`

**Issue:** The header says "Later phases never edit this file", so any gap in these patterns is permanent. The patterns match call syntax only. Each of these gets past them:
- `fetch.call(null, u)`, `Reflect.apply(fetch, …)`, `window['fetch'](u)` and `const f = fetch; f(u)` all evade `NETWORK_CALL`, because it needs the identifier followed directly by `(`.
- A scheme-relative URL in a content script, such as `new Image().src = '//t.example/p.gif'`, evades `REMOTE_REFERENCE`, which needs `https?:` or `wss?:`. From a content script this resolves against the Zendesk page's `https:` origin, so it is a real network request that also leaks data.
- `const { sync } = chrome.storage` and `const s = chrome.storage; s.sync` evade `SYNC_AREA`. The versioned Chrome API allowlist in `runtime-contract.test.js` would catch the destructuring, but that pin is designed to be restated.

**Fix:** Tighten the patterns once, before the file is treated as frozen:
- strip comments, then ban the bare identifiers (`/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|WebTransport|RTCPeerConnection)\b/u`);
- ban quoted scheme-relative URLs (`/['"`]\/\/[^/\s]/u`) in scripts and pages;
- ban `\bsync\b` next to `storage` in any form.

For each new pattern, add a negative control that uses the evasions above.

## Info

### IN-01: A hung settings read leaves every status at `'default'`, not `'unreadable'`

**File:** `extension/content.js:18-21, 536`

**Issue:** The timeout path calls only `openSettingsGate()`, so `settingsState` keeps its initial `status: 'default'`. The comment and D-08 both say a hung or failed read counts as failed, which `landSettings(null, …)` records as `'unreadable'`. Phase 8 will show wording from this status (D-12), so a hung read would show as "nothing stored".

**Fix:** In the timer callback, do what `landSettings(null, generations)` does for keys whose generation has not moved, then open the gate.

### IN-02: A stored CAS revision at `Number.MAX_SAFE_INTEGER` makes that key unsaveable

**File:** `extension/zhroma-settings.js:529-531`

**Issue:** `current.revision + 1` is not a safe integer, so `encode()` returns undefined and every save answers `rejected` until the key is reset. Reproduced with `rev: 9007199254740991`.

**Fix:** Treat revisions at or above an upper bound (for example `2**31`) as unreadable in `inspect`, so that saving over them is allowed.

### IN-03: With the module loaded, a `set-setting` for an unregistered key gets no reply at all

**File:** `extension/background.js:106`

**Issue:** `settingsRequest` returns false for an unknown key, so the message falls through to `return undefined` and the requester waits for the port to close. Without the module, the same request is answered `failed` (line 165). The queue's own contract answers `rejected` for this case.

**Fix:** Admit any well-shaped `set-setting` from a trusted sender, and let `settingsQueue.admit` answer `rejected` for an unknown key.

### IN-04: The dependency approvals do not list the transitive packages the two approved packages brought in

**File:** `DEPENDENCY-APPROVALS.md:9-10, 32`

**Issue:** `package-lock.json` gained 22 `@typescript/typescript-<platform>` native-binary packages plus `@types/filesystem`, `@types/filewriter` and `@types/har-format`. One native binary now runs on every `npm test`. D-23 says "No other dependency is added in Phase 7", and the record does not say these came with the approved packages.

**Fix:** Add one line saying which transitive packages the approved versions pulled in, and that they are dev-only and never shipped.

### IN-05: The `typecheck` script duplicates the two tsc commands inside `test:recon`

**File:** `package.json:11-12`

**Issue:** The same two tsc commands appear in two scripts, so a later change to one can miss the other.

**Fix:** `"test:recon": "npm run typecheck && node --test … && node node_modules/vitest/vitest.mjs run --config vitest.config.js"`.

---

_Reviewed: 2026-09-28T11:46:43Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
