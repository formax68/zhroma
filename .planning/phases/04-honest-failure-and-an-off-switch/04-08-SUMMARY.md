---
phase: 04-honest-failure-and-an-off-switch
plan: "08"
subsystem: infra
tags: [chrome-extension, mv3, service-worker, mutation-testing, vitest, test-doubles, timeout]

requires:
  - phase: 04-honest-failure-and-an-off-switch
    provides: "The service worker's projection and preference machinery from 04-04/04-05, the tracer world and the strict Chrome harness"
provides:
  - "REQUEST_TIMEOUT_MS = 2000 and a Promise.race deadline helper bounding both chrome.tabs.sendMessage hops in extension/background.js"
  - "portCloseMs / setPortCloseMs on the tracer world, so a frame that accepts a message and never answers is modellable for longer than the production deadline"
  - "readMode 'rejected-with-values' in BOTH doubles: a failed read that still delivers the values object, which is the only shape in which the shipped lastError checks are load-bearing"
  - "A recorded forbidden-channel name 'worker chrome.tabs.sendMessage frameId' replacing an expect() the worker's try/catch was swallowing"
  - "npm run test:mutants — a re-runnable out-of-tree mutation gate with a six-mutant registry, all six killed"
affects: [04-10 popup hop bound, 04-11 acceptance re-binding, 04-12, 04-13, 04-14 (all four declare test:mutants as a precondition)]

actuals:
  tokens: 17412
  tasks: 3
  commits: 4
plan_head_before: db844d8714a0c14315f6ab806bd48a59d1943407

tech-stack:
  added: []
  patterns:
    - "Bound a cross-process hop by resolving with null rather than a new sentinel: null is not an object, so the existing isExact gate already converts it into the outcome the caller has for an unusable reply — no new branch, no new reported state, no new copy"
    - "A test double records contract violations on an asserted-empty array instead of throwing: production code wraps every platform call in try/catch, so a thrown assertion is swallowed and laundered into a plausible result"
    - "Mutation kills are a committed, re-runnable command with a JSON registry, not a claim in a review document; a stale find literal is a loud failure rather than a silent skip"

key-files:
  created:
    - test/extension/failure-seam.test.js
    - scripts/verify-mutation-kills.js
    - test/mutants/failure-seam.mutants.json
  modified:
    - extension/background.js
    - test/extension/tracer-world.js
    - test/extension/chrome-harness.js
    - package.json
    - .planning/WINDOWS.md

key-decisions:
  - "The deadline resolves with null rather than a dedicated TIMED_OUT sentinel, so both call sites reuse the gate they already have for an unusable reply and the timeout path mints no new state and no new copy"
  - "A rejection still propagates through the deadline helper, so both existing try/catch blocks (and requestStatus's generation recheck on the error path) behave exactly as before"
  - "serializePreference is deliberately NOT separately bounded: bounding the two hops is what drains the queue, and a second bound on the queue itself would hide a real ordering bug"
  - "A timed-out apply reports the ratified 'No readable view is connected' line, not 'Setting saved, but this view did not update' — the plan's acceptance criterion named the wrong ratified string (see Deviations)"
  - "phase-04-live-acceptance.test.js appears in NO mutant's suites: while its byte pin is red every mutant would report killed for the wrong reason"
  - "test:mutants is a separate command, never folded into test or test:recon, because each mutant runs real suites in a fresh repository copy"

patterns-established:
  - "Shipped-constant extraction: a timing test reads REQUEST_TIMEOUT_MS out of extension/background.js with a regex (the way phase-04-live-acceptance extracts SETTLE_MS) and asserts a separate test-local patience ceiling first, so the behavioural failure is visible before the tie to the constant"
  - "Positive control beside a dormancy assertion: the identical values object delivered WITHOUT a last error must tint, so the only difference between the two cases is the guard under test"
  - "Out-of-tree mutation: build the copy in mkdtemp, symlink node_modules AND .git (history-bound suites read pinned assets with git show), remove the copy in a finally"

requirements-completed: [FAIL-05, CTRL-02, CTRL-03]

coverage:
  - id: D1
    description: "A top frame that receives apply-preference and never answers costs one bounded wait rather than the off switch: set-enabled resolves with saved:true, applied:false inside the shipped REQUEST_TIMEOUT_MS, and a second request issued alongside it resolves too instead of queueing behind a wedge"
    requirement: "CTRL-02"
    verification:
      - kind: integration
        ref: "test/extension/failure-seam.test.js#a top frame that never answers apply-preference costs one bounded wait, not the off switch"
        status: pass
      - kind: integration
        ref: "test/extension/failure-seam.test.js#a second set-enabled resolves too, so the switch stays operable rather than queueing behind a wedge"
        status: pass
      - kind: other
        ref: "npm run test:mutants --only worker-apply-unbounded"
        status: pass
    human_judgment: false
  - id: D2
    description: "A top frame that never answers get-status projects the neutral shape and the no-readable-view line for that tab alone, within the bound, leaving every other tab's toolbar untouched"
    requirement: "FAIL-05"
    verification:
      - kind: integration
        ref: "test/extension/failure-seam.test.js#a top frame that never answers get-status is unavailable for that tab alone"
        status: pass
      - kind: other
        ref: "npm run test:mutants --only worker-status-unbounded"
        status: pass
    human_judgment: false
  - id: D3
    description: "The popup reports an already-ratified honest line for a frame that never answered and the switch is usable again afterwards — no new copy is minted for the timeout path"
    requirement: "CTRL-02"
    verification:
      - kind: integration
        ref: "test/extension/failure-seam.test.js#the popup reports the honest ratified line when the frame never answered, and the switch is usable again"
        status: pass
    human_judgment: false
  - id: D4
    description: "A storage read that fails while still delivering a defaults object leaves the content script dormant (zero markers, zero active observers) and the worker's preference unconfirmed (enabled: null) — a failure is never read as absence in either process"
    requirement: "CTRL-03"
    verification:
      - kind: integration
        ref: "test/extension/failure-seam.test.js#a read that fails while still delivering values leaves the content script dormant"
        status: pass
      - kind: integration
        ref: "test/extension/failure-seam.test.js#a read that fails while still delivering values leaves the worker preference unconfirmed"
        status: pass
      - kind: other
        ref: "npm run test:mutants --only worker-lasterror / --only content-lasterror"
        status: pass
    human_judgment: false
  - id: D5
    description: "A worker-to-content send with a missing or wrong frameId appends the named entry 'worker chrome.tabs.sendMessage frameId' to the recorded-violation channel and does not throw, so a contract violation is a red test instead of a plausible-looking unavailable"
    requirement: "FAIL-05"
    verification:
      - kind: integration
        ref: "test/extension/failure-seam.test.js#a worker send with a wrong frameId is recorded as a forbidden channel instead of being swallowed"
        status: pass
      - kind: integration
        ref: "test/extension/failure-seam.test.js#a worker send that carries frameId 0 records nothing"
        status: pass
      - kind: other
        ref: "npm run test:mutants --only worker-status-frameid / --only worker-apply-frameid"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every mutant this plan names is killed by a re-runnable gate, and each is killed by a NAMED behavioural test rather than by the byte pin: npm run test:mutants reports MUTATION KILLS: 6/6 killed and exits 0"
    verification:
      - kind: other
        ref: "npm --prefix . run test:mutants"
        status: pass
    human_judgment: false
  - id: D7
    description: "The bound introduces no behaviour change when the frame answers normally: 436 of 437 tests in test/extension pass, the single failure being the acceptance byte pin owned by 04-11"
    verification:
      - kind: integration
        ref: "node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension"
        status: pass
    human_judgment: false
  - id: D8
    description: "Whether an agent whose top frame has genuinely stopped answering experiences the two-second wait as acceptable, and whether the resulting toolbar and popup read as honest rather than broken, in a real browser"
    verification: []
    human_judgment: true
    rationale: "A real unresponsive Zendesk document cannot be produced in-process; the simulated frame proves the worker's behaviour, not the agent's experience of it. CTRL-02 and CTRL-03 both remain unresolved in the plan's flagged assumptions for exactly this reason."

duration: 16 min
completed: 2026-09-10
status: complete
---

# Phase 04 Plan 08: Bounded worker hops, load-bearing lastError branches and a runnable mutation gate Summary

**Both `chrome.tabs.sendMessage` hops in the service worker are now bounded by a shipped `REQUEST_TIMEOUT_MS = 2000`, both test doubles can deliver a failed-but-populated storage read so the `lastError` branches are finally load-bearing, the tracer records `frameId` violations instead of throwing them into production code's `catch`, and `npm run test:mutants` reports 6/6 mutants killed.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-09-10T15:16:00Z
- **Completed:** 2026-09-10T15:32:00Z
- **Tasks:** 3
- **Files modified:** 7 (3 created, 4 modified) plus the WINDOWS ledger

## Accomplishments

- **WR-04's worker half is closed.** `setEnabled` awaited `requestApply` with no bound and `requestApply` awaited `chrome.tabs.sendMessage` with no bound, so one top frame that received `apply-preference` and never answered left the off switch inoperative **in every tab** — every subsequent write chains behind the pending task in `serializePreference` — until Chrome terminated the worker. Both hops are now raced against a 2 s deadline that resolves `null`.
- **WR-03 is closed.** Both doubles modelled a rejected read as `callback(undefined)`, so the observed dormancy came from the falsy-values path and deleting either shipped `lastError` check left 277/277 passing. `readMode: 'rejected-with-values'` now delivers the values object *and* a set `lastError`, and each deletion is now killed by a named test.
- **WR-10 is closed.** `expect(options).toEqual({ frameId: 0 })` ran inside a function the worker calls within `try`/`catch`, so a real contract violation was swallowed by production code and converted into `unavailable`. The violation is now recorded on the existing `forbidden` array; the `vitest` import is gone from `tracer-world.js`, so the double cannot regress to throwing.
- **"The mutant is dead" is now a command.** `npm run test:mutants` builds a throwaway copy of the repository per mutant, applies one literal single-clause edit, runs the named suites there and requires failure.

## Task Commits

1. **Task 1 RED — failing failure-seam suite** — `ddd32ce` (test)
2. **Task 1 GREEN — bound both worker hops** — `fe93e77` (feat)
3. **Task 2 GREEN — load-bearing lastError, recorded frameId violations** — `dbb5880` (feat)
4. **Task 3 — the mutation gate** — `66a9884` (feat)

No REFACTOR commit: neither implementation had an obvious cleanup that did not also change behaviour.

## Shipped constant

`extension/background.js`: `const REQUEST_TIMEOUT_MS = 2000;`

The deadline helper resolves with `null` rather than a dedicated sentinel. `isObject(null)` is false, so `isExact` already refuses it, and the existing gates convert it into `{ status: 'unavailable', reason: null }` in `requestStatus` and into `null` in `requestApply`. A rejection still propagates, so both `try`/`catch` blocks, both `frameId: 0` options, `requestApply`'s deliberate absence of a `generationOf` call and `requestStatus`'s two generation rechecks are untouched.

## Mutant table

`npm --prefix . run test:mutants` → `MUTATION KILLS: 6/6 killed`, exit 0. Each mutant was additionally re-run with the TAP reporter to confirm **which** tests kill it — none is killed by the byte pin.

| id | file | mutation | status | killed by |
|---|---|---|---|---|
| `worker-lasterror` | `extension/background.js` | delete the last-error early return in `readPreference` | **killed** | 1 named test |
| `content-lasterror` | `extension/content.js` | delete the last-error early return in `readPreference`'s storage callback | **killed** | 2 named tests |
| `worker-status-unbounded` | `extension/background.js` | remove the deadline wrapper from the `get-status` send | **killed** | 2 named tests |
| `worker-apply-unbounded` | `extension/background.js` | remove the deadline wrapper from the `apply-preference` send | **killed** | 3 named tests |
| `worker-status-frameid` | `extension/background.js` | drop the options argument from the `get-status` send | **killed** | 14 named tests |
| `worker-apply-frameid` | `extension/background.js` | drop the options argument from the `apply-preference` send | **killed** | 6 named tests |

`content-lasterror` names `extension/content.js` in the registry only — the file is not modified by this plan, so there is no conflict with 04-07.

## Forbidden-channel name

Exact string pushed onto `world.forbidden`: **`worker chrome.tabs.sendMessage frameId`**

Recorded when `options` is not an object whose only member is `frameId === 0`. The double does not throw, so the worker's `try`/`catch` cannot swallow it; suites already assert `world.forbidden` is empty.

## Measured `test/extension` counts

`node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension`:

```
Test Files  1 failed | 10 passed (11)
     Tests  1 failed | 436 passed (437)
```

The single failure is `phase-04-live-acceptance.test.js > the repository record binds to every current shipped byte and reports its actual status` — this plan changed `extension/background.js`, one of the eleven shipped assets. That is the expected intermediate state under 04-VALIDATION.md promotion rule 3, already recorded as WINDOWS entry 13, and re-binding is 04-11's work. `04-LIVE-ACCEPTANCE.md` was **not** edited here.

Task-level suites, all clean:

- `failure-seam.test.js` — 9 passed
- `toolbar-popup.test.js`, `toggle.test.js`, `diagnosis.test.js`, `runtime-contract.test.js` — 138 passed
- `failure-seam`, `initial-tint`, `persistent-tint`, `toolbar-popup` — 237 passed

## Files Created/Modified

- `extension/background.js` — `REQUEST_TIMEOUT_MS`, the `bounded()` deadline helper, and both sends wrapped in it
- `test/extension/tracer-world.js` — `portCloseMs` option + `setPortCloseMs` control, the `'rejected-with-values'` read branch, the recorded `frameId` violation, and the removal of the now-unused `vitest` import
- `test/extension/chrome-harness.js` — `'rejected-with-values'` in the `readMode` allowlist and an optional payload argument on `withLastError` (defaulting to `undefined`, so both existing call sites are unchanged)
- `test/extension/failure-seam.test.js` — new, 9 cases across the three seams
- `scripts/verify-mutation-kills.js` — new, the out-of-tree gate; `--only <id>` for iterating on one mutant
- `test/mutants/failure-seam.mutants.json` — new, the six-mutant registry
- `package.json` — `"test:mutants": "node scripts/verify-mutation-kills.js"`, deliberately not wired into `test` or `test:recon`
- `.planning/WINDOWS.md` — entry 14 (the copy-string deviation below)

## Decisions Made

Recorded in `key-decisions` above. The load-bearing one is that the timeout path mints nothing: no sentinel, no branch, no state, no copy. The whole fix is one constant, one helper and two call-site wrappers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The timeout path reports "No readable view is connected", not "Setting saved, but this view did not update"**

- **Found during:** Task 1
- **Issue:** Task 1's `<behavior>` and fourth `<acceptance_criteria>` bullet both say a never-answering `apply-preference` frame should produce the ratified *not-applied* line. It cannot, and the plan's own `<action>` is why: a timed-out apply makes `requestApply` return `null`, so `setEnabled` builds `{ status: 'unavailable', reason: null }`, and `popup.js` evaluates `reply.status === 'unavailable'` **before** `!reply.applied`. The not-applied line is unreachable on this path. Producing it would require the worker to report a status the document never gave it — i.e. inventing a diagnosis — which contradicts the same `<action>`'s "no new branch and no new reported state" and the phase's whole premise.
- **Fix:** Implemented the mechanism the `<action>` prescribes and asserted the line it actually produces: `COPY.unavailable` — itself part of the 04-01 decided set, so the substance of the criterion (an already-ratified honest line, no new string) holds. `saved: true` and `applied: false` are asserted directly on the worker's reply, as the criterion requires.
- **Files modified:** `test/extension/failure-seam.test.js`
- **Verification:** `failure-seam.test.js > the popup reports the honest ratified line when the frame never answered, and the switch is usable again` passes; `extension/popup.js` is untouched and no string was added anywhere.
- **Committed in:** `ddd32ce` (test) / `fe93e77` (feat)
- **Recorded:** WINDOWS entry 14.

**2. [Rule 3 - Blocking] `gsd-tools windows append` cannot write to this ledger**

- **Found during:** close-out
- **Issue:** The command validates the whole ledger before appending and rejects pre-existing entry 12 (`kind: "accepted-risk"`) as an invalid kind, so no entry can be appended by tool.
- **Fix:** Appended entry 14 by hand to both the table and the JSON block, and corrected the stale `total_count` (`11` → `14`) and `open_count` (`8` → `9`) in the frontmatter so the new entry is countable. Entries 12 and 13 were left exactly as found — including the pre-existing facts that neither has a table row and that `fixed_count` (3) does not match the four `fixed` entries in the JSON. Those are not this plan's to rewrite.
- **Files modified:** `.planning/WINDOWS.md`
- **Verification:** the JSON block parses and contains ids 1–14 with no duplicates.

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking).
**Impact on plan:** No scope creep. Deviation 1 changes which already-ratified string is asserted, not the mechanism or any shipped byte; deviation 2 is bookkeeping forced by a tool defect.

## Issues Encountered

- **RED-evidence format.** `gsd-tools check tdd-red-evidence` parses `node --test` TAP, which needs `# tests / # pass / # fail` summary lines that vitest's `tap-flat` reporter does not emit. Both RED records were built from the real `tap-flat` output with those three summary lines appended, transcribed from the `ok` / `not ok` counts of that same run. Both classified `RED_EVIDENCE_OK` / `target_test_failed`. The counts are a faithful restatement of the run, not a substitute for it.
- **Modelling a silent frame.** Registering a never-answering listener alongside the real content script proves nothing — the content script answers, so the channel settles. The four bound tests therefore run the worker against a tab whose *only* listener claims the channel with `true` and never responds, with `setPortCloseMs` raised above the test's patience ceiling so the double's own port-close cannot beat the production deadline to the answer.

## Threat Flags

None. The plan's `<threat_model>` covers every surface touched. `T-04G-04` (DoS via the wedged preference writer) and `T-04G-05` (frameId spoofing) are both mitigated and each is now pinned by two mutants; `T-04G-06` (a failed read read as absence) is pinned by two more; `T-04G-08` (the gate's temp copies) is mitigated as specified — `.git` and `node_modules` are symlinked rather than copied, the copy is removed in a `finally`, and the gate prints only mutant ids, exit statuses and notes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `npm run test:mutants` exists and reports 6/6, discharging the `<precondition>` that 04-10, 04-12, 04-13 and 04-14 each declare against this task.
- WR-04's **popup** half (`ask()` in `extension/popup.js`) is still open and is 04-10's, Task 1. Neither half alone closes WR-04.
- The optional `readPreference(done)` drop guard in `extension/content.js` remains deferred and recorded (see the plan's review-dispositions ledger): the user-visible symptom is fully closed by this bound plus 04-10's, so a dropped callback now costs one bounded wait and an honest message rather than a permanent wedge.
- The acceptance byte pin is red because `extension/background.js` changed. 04-11 re-binds it. `04-LIVE-ACCEPTANCE.md` must not be re-pointed before then.

---
*Phase: 04-honest-failure-and-an-off-switch*
*Completed: 2026-09-10*

## Self-Check: PASSED

- All three created files exist on disk.
- All four task commits (`ddd32ce`, `fe93e77`, `dbb5880`, `66a9884`) are present in the log.
- All task-level `<acceptance_criteria>` re-run and passing, except the copy-string criterion documented as deviation 1.
- Plan-level `<verification>` re-run: `MUTATION KILLS: 6/6 killed` (exit 0); `test/extension` reports exactly one failing test and it is the acceptance byte pin; `REQUEST_TIMEOUT_MS` and `Promise.race(` present in `extension/background.js`; `tracer-world.js` no longer imports or calls `expect`; both doubles accept `readMode: 'rejected-with-values'`.
