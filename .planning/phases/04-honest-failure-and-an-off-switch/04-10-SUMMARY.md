---
phase: 04-honest-failure-and-an-off-switch
plan: "10"
subsystem: ui
tags: [chrome-extension, mv3, popup, accessibility, focus-management, timeout, mutation-testing, vitest, happy-dom]

requires:
  - phase: 04-honest-failure-and-an-off-switch
    provides: "04-08's REQUEST_TIMEOUT_MS/bounded() worker hops, the tracer world's setPortCloseMs, and the out-of-tree mutation gate (scripts/verify-mutation-kills.js, npm run test:mutants)"
provides:
  - "lastConfirmed in extension/popup.js: the last value storage actually reported, which the control reverts to when a reply confirms nothing"
  - "An operable control after a failed save, so a retry needs no popup reopen"
  - "Unconditional focus restoration in end(), so a keyboard agent is not stranded in body"
  - "REQUEST_TIMEOUT_MS = 5000 and a Promise.race deadline inside ask(), bounding BOTH popup hops"
  - "A shipped-bytes assertion that the popup's deadline strictly exceeds the worker's, so the two copies cannot drift into an ordering that discards a real answer"
  - "test/extension/popup-recovery.test.js — 11 cases, including a platform-faithful focus model for happy-dom"
  - "test/mutants/popup-recovery.mutants.json — four mutants; the gate now reports 10/10"
affects: [04-11 acceptance re-binding and timing regeneration, 04-12, 04-13, 04-14]

actuals:
  tokens: 10347
  tasks: 3
  commits: 5
plan_head_before: 024f8d7d6a9dab1bf2cb003d53ce639107ee6f49

tech-stack:
  added: []
  patterns:
    - "Model the platform where the DOM double does not: happy-dom leaves activeElement on a control it has just disabled and will focus a disabled one, so the suite installs the browser's focus rules on the element under test — otherwise the assertion passes against the very defect it was written to catch"
    - "Two processes, two copies of one constant, and the ORDERING between them asserted from the shipped bytes: with no shared module (D-06 forbids a build step), a test that reads both sources is the only thing that can keep a nested deadline outside its caller's"
    - "A mutant is registered only after it has been measured killed; a mutation that survives is reported as survived and replaced with the clause that is actually load-bearing, never quietly kept"

key-files:
  created:
    - test/extension/popup-recovery.test.js
    - test/mutants/popup-recovery.mutants.json
  modified:
    - extension/popup.js
    - test/extension/toggle.test.js
    - .planning/WINDOWS.md

key-decisions:
  - "lastConfirmed is assigned in exactly one place — the branch where a reply delivered a boolean — so it can never hold a desired value; it is display state only and is never sent"
  - "defaultChecked is explicitly NOT the revert target: popup.html ships the checkbox unchecked, so reverting to it after a failed attempt to turn tinting ON would display an unconfirmed OFF"
  - "With nothing ever confirmed the failed-save path keeps today's disable-and-show-nothing behaviour, because there is genuinely no position to return to; the initial-refresh path is unchanged"
  - "The popup's REQUEST_TIMEOUT_MS is 5000, STRICTLY GREATER than the worker's 2000 rather than equal to it: answering the popup can cost the worker a full bounded wait of its own, and an equal deadline discarded that honest reply along with the confirmed preference it carried"
  - "The deadline resolves null, so both callers reuse the gate they already have for an unusable reply — no new branch, no new reported state, no new copy"
  - "popup-focus-guard mutates the focus restoration itself: reinstating the disabled-state guard was MEASURED as SURVIVED, because the corrected ordering re-enables the control before end() runs"
  - "The previously passed popup-keyboard live observation does not carry forward"

patterns-established:
  - "Platform-faithful focus model for happy-dom: blur as the control becomes disabled (not after — an already-disabled control is no longer focusable), and make focus() a no-op while disabled"
  - "Deadline ordering across processes is a test, not a comment: bound() and workerBound() both read their shipped source with a regex and the test asserts the inequality"

requirements-completed: [CTRL-02, CTRL-03, CTRL-04]

coverage:
  - id: D1
    description: "After a failed save the switch shows the last value storage actually confirmed — not the position the click moved it to — on all three unsuccessful reply shapes: illegible, saved:false, and enabled:null"
    requirement: "CTRL-04"
    verification:
      - kind: integration
        ref: "test/extension/popup-recovery.test.js#an illegible reply returns the switch to the last confirmed value and leaves it operable"
        status: pass
      - kind: integration
        ref: "test/extension/popup-recovery.test.js#a reply reporting the save failed returns the switch to the value storage still holds"
        status: pass
      - kind: integration
        ref: "test/extension/popup-recovery.test.js#a reply reporting the preference unconfirmed returns the switch to the last confirmed value"
        status: pass
      - kind: other
        ref: "npm run test:mutants -- --only popup-no-revert"
        status: pass
    human_judgment: false
  - id: D2
    description: "After a failed save the switch is still operable: it is enabled, and a second change issues a new request rather than being dropped into a dead control"
    requirement: "CTRL-02"
    verification:
      - kind: integration
        ref: "test/extension/popup-recovery.test.js#a second change after a failed save issues a new request, so the switch is not dead"
        status: pass
      - kind: other
        ref: "npm run test:mutants -- --only popup-stays-disabled"
        status: pass
    human_judgment: false
  - id: D3
    description: "A keyboard agent who operated the switch has focus returned to it after a failed save, instead of being dropped into the document body with no recovery"
    requirement: "CTRL-02"
    verification:
      - kind: integration
        ref: "test/extension/popup-recovery.test.js#a keyboard agent gets the switch back after a failed save"
        status: pass
      - kind: other
        ref: "npm run test:mutants -- --only popup-focus-guard"
        status: pass
    human_judgment: false
  - id: D4
    description: "A worker that receives the request and never answers costs the popup one bounded wait and then reports the ratified could-not-save line with the control usable, on set-enabled; and the non-committal connection line with the control out of service, on the opening refresh"
    requirement: "CTRL-02"
    verification:
      - kind: integration
        ref: "test/extension/popup-recovery.test.js#a worker that never answers set-enabled costs one bounded wait and the ratified line"
        status: pass
      - kind: integration
        ref: "test/extension/popup-recovery.test.js#a worker that never answers the opening refresh leaves the control out of service"
        status: pass
      - kind: other
        ref: "npm run test:mutants -- --only popup-ask-unbounded"
        status: pass
    human_judgment: false
  - id: D5
    description: "The popup's deadline strictly exceeds the worker's, so the popup cannot cut off an honest worker reply that was itself waiting out a bounded hop — the 'switch is usable again' property 04-08 established survives"
    verification:
      - kind: unit
        ref: "test/extension/popup-recovery.test.js#the popup waits longer than the worker is allowed to, so it cannot cut off a real answer"
        status: pass
      - kind: integration
        ref: "test/extension/failure-seam.test.js#the popup reports the honest ratified line when the frame never answered, and the switch is usable again"
        status: pass
    human_judgment: false
  - id: D6
    description: "No new user-visible string: the failure copy remains the two operational lines ratified at the Phase 4 checkpoint, each occurring exactly once, and COPY is untouched"
    requirement: "CTRL-04"
    verification:
      - kind: other
        ref: "grep -c 'Zhroma could not save that setting' extension/popup.js == 1 && grep -c 'Setting saved, but this view did not update' extension/popup.js == 1"
        status: pass
      - kind: integration
        ref: "test/extension/toolbar-popup.test.js#shipped JavaScript carries no colour value and builds no page markup"
        status: pass
    human_judgment: false
  - id: D7
    description: "The success path is unchanged in every respect, including the one-request-at-a-time drop of a click arriving mid-flight, and the initial-refresh path is deliberately untouched"
    requirement: "CTRL-03"
    verification:
      - kind: integration
        ref: "test/extension/popup-recovery.test.js#a successful save is unchanged, including the click that arrives while one is in flight"
        status: pass
      - kind: integration
        ref: "test/extension/popup-recovery.test.js#with nothing ever confirmed a failed save shows no position and keeps the control out of service"
        status: pass
      - kind: integration
        ref: "test/extension/popup-recovery.test.js#a worker that answers normally is not slowed by the deadline"
        status: pass
    human_judgment: false
  - id: D8
    description: "Each of the four new popup guards is load-bearing: the gate reports MUTATION KILLS: 10/10 killed and exits 0, with no mutant naming the acceptance byte pin"
    verification:
      - kind: other
        ref: "npm --prefix . run test:mutants"
        status: pass
    human_judgment: false
  - id: D9
    description: "Whether a real agent whose save just failed reads the reverted switch plus the could-not-save line as honest rather than confusing, and whether a real keyboard user actually recovers focus in Chrome"
    verification: []
    human_judgment: true
    rationale: "popup-keyboard (04-UAT.md test 17) passed against the pre-repair bytes; this plan changes the popup's focus behaviour, so that observation does not carry forward. The happy-dom focus model is a faithful model, not the browser, and CTRL-02/03/04 all remain unresolved in the plan's flagged assumptions for the same reason."

duration: 19 min
completed: 2026-09-10
status: complete
---

# Phase 04 Plan 10: A Truthful, Usable Switch After a Failed Save Summary

**After a failed save the popup now returns the checkbox to the last value storage actually confirmed, leaves the control enabled, hands focus back to the keyboard, and bounds its own request at a deadline deliberately larger than the worker's — four new mutants pin each guard and the gate reports 10/10.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-09-10T15:50:52Z
- **Completed:** 2026-09-10T16:10:30Z
- **Tasks:** 3
- **Files modified:** 4 (2 created, 2 modified) plus the WINDOWS ledger

## Accomplishments

- **WR-07 is closed.** The `change` event moves `control.checked` before the request is sent, so "leave the control exactly where the agent last saw it" left it at a position nothing confirmed — an unchecked box beside "Zhroma could not save that setting". A module-level `lastConfirmed`, assigned only where a reply delivers a boolean, is now the revert target; the control stays **enabled** so a retry is possible; and `end()` restores focus unconditionally, so a keyboard agent is no longer dropped into `body`.
- **WR-04's popup half is closed.** `ask()` had no bound at all, so a worker that accepted the message and never answered never even reached the failure path. It now races the send against a shipped deadline that resolves `null`, which both callers already refuse — no new branch, no new state, no new copy.
- **A cross-process ordering defect was found and fixed while closing it.** At the plan's named 2000 ms the popup's deadline ties the worker's, and the popup's fires first — discarding the worker's honest reply *and* the confirmed preference it carried, which regressed `failure-seam.test.js`'s "the switch is usable again". The shipped value is 5000 and the inequality is now a test over both sources.
- **The activeElement assertion was made meaningful.** happy-dom leaves `activeElement` on a control it has just disabled and will focus a disabled one, so a naive focus test passes against the exact defect WR-07 reports. The suite installs the platform's rules on the element instead.
- **Four mutants, all measured before being registered.** `MUTATION KILLS: 10/10 killed`, exit 0.

## Failure-branch behaviour, per unsuccessful reply shape

Baseline for all three: storage confirmed `enabled: true`, the agent turns tinting **off**.

| Reply shape | How it is reached | Checkbox after | Control after | Status line |
|---|---|---|---|---|
| Illegible (fails `isExact`) | a popup-facing reply missing keys | **checked** (`lastConfirmed`) | **enabled** | `Zhroma could not save that setting` |
| Legible, `saved: false` | `world.setWriteMode('rejected')` | **checked** (storage still reports `true`) | **enabled** | `Zhroma could not save that setting` |
| Legible, `enabled: null` | `world.setReadMode('rejected')` | **checked** (`lastConfirmed`) | **enabled** | `Zhroma could not save that setting` |
| Nothing ever confirmed | no reply has delivered a boolean | **untouched** — no position shown | **disabled** | `Zhroma could not save that setting` |

The last row is the deliberate scope boundary: `defaultChecked` is not an acceptable revert target, because `popup.html` ships the checkbox unchecked and reverting to it after a failed attempt to turn tinting **on** would display an unconfirmed **off** — the same defect in the other direction.

## Shipped deadline

`extension/popup.js`: `const REQUEST_TIMEOUT_MS = 5000;`

Five seconds, not the two the plan named, and the difference is load-bearing rather than cosmetic — see deviation 1. Both popup hops (`refresh()` and `requestEnabled()`) go through the single bounded `ask()`; the timer is cleared in a `finally`, so a popup that got its answer is not held open by a timer with nothing to say.

## Mutant table

`npm --prefix . run test:mutants` → `MUTATION KILLS: 10/10 killed`, exit 0. No entry names `test/extension/phase-04-live-acceptance.test.js`.

| id | file | mutation | status | killed by |
|---|---|---|---|---|
| `popup-ask-unbounded` | `extension/popup.js` | drop the deadline race from `ask()`, leaving the bare await | **killed** | `popup-recovery.test.js` |
| `popup-no-revert` | `extension/popup.js` | delete `control.checked = lastConfirmed` on the unconfirmed branch | **killed** | `popup-recovery.test.js` |
| `popup-stays-disabled` | `extension/popup.js` | force the control disabled on the unconfirmed branch | **killed** | `popup-recovery.test.js` |
| `popup-focus-guard` | `extension/popup.js` | delete the focus restoration in `end()` | **killed** | `popup-recovery.test.js` |

The six mutants inherited from 04-08 are unaffected and still killed.

## Task Commits

1. **Task 1 RED — failing recovery suite** — `0fbde6c` (test)
2. **Task 1 GREEN — truthful, usable switch** — `272c074` (feat)
3. **Task 2 RED — failing unbounded-request cases** — `2b614f4` (test)
4. **Task 2 GREEN — bound the popup hop** — `11eded7` (feat)
5. **Task 3 — the four mutants** — `b4f454d` (feat)

Both RED runs were classified `RED_EVIDENCE_OK` / `target_test_failed` by `gsd-tools check tdd-red-evidence` (4 of 7 failing, then 3 of 10). No REFACTOR commit: neither implementation had a cleanup that did not also change behaviour.

## Measured test counts

`node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension`:

```
Test Files  1 failed | 11 passed (12)
     Tests  1 failed | 461 passed (462)
```

`npm test` (recon smokes + the full vitest run): `1 failed | 569 passed (570)`, against a starting baseline of `1 failed | 558 passed (559)` — eleven new cases, no other movement.

The single failure is `phase-04-live-acceptance.test.js > the repository record binds to every current shipped byte and reports its actual status`. This plan changed `extension/popup.js`, one of the eleven shipped assets. That is the expected intermediate state under 04-VALIDATION.md promotion rule 3, already recorded as WINDOWS entry 13; re-binding is 04-11's work and `04-LIVE-ACCEPTANCE.md` was **not** edited here.

**This was the last plan in the run that changes a shipped byte.** The eleven-asset inventory is now final and 04-11 can re-establish the record and regenerate the timing samples against it.

## Files Created/Modified

- `extension/popup.js` — `lastConfirmed`, the reverting unconfirmed branch, unconditional focus restoration, `outstanding` cleared before the revert, `REQUEST_TIMEOUT_MS` and the `Promise.race` deadline in `ask()`
- `test/extension/popup-recovery.test.js` — new; 11 cases plus the platform focus model and the two shipped-constant extractors
- `test/mutants/popup-recovery.mutants.json` — new; the four-mutant registry
- `test/extension/toggle.test.js` — one assertion rewritten from the defect to the corrected contract (deviation 3)
- `.planning/WINDOWS.md` — entries 16, 17, 18 appended by hand (deviation 4)

## Decisions Made

Recorded in `key-decisions` above. The two that matter most: `lastConfirmed` is written in exactly one place, so it can never hold a value nobody confirmed; and the popup's deadline is defined by its ORDERING against the worker's, not by a number chosen in isolation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The popup's `REQUEST_TIMEOUT_MS` ships at 5000, not the 2000 the plan named**

- **Found during:** Task 2 (GREEN)
- **Issue:** With both processes at 2000, the popup's deadline ties the worker's — and the popup's timer starts first, so it always wins. Answering `popup-status` can cost the worker a full bounded wait of its own (a silent top frame makes `get-status` run to the worker's own deadline), so the popup discarded the worker's honest reply microseconds before it arrived, together with the confirmed preference it carried. `failure-seam.test.js > the popup reports the honest ratified line when the frame never answered, and the switch is usable again` went red on `box.disabled` — i.e. the plan's value regressed exactly the property 04-08 added its bound to protect. Task 2's first acceptance criterion (`const REQUEST_TIMEOUT_MS = 2000;`) is therefore unsatisfiable without breaking a shipped guarantee.
- **Fix:** Shipped `5000`, and made the relationship load-bearing rather than a comment: a new test reads both `extension/popup.js` and `extension/background.js` with a regex and asserts the popup's deadline is strictly greater than the worker's. The substance of the criterion — a shipped, extractable, `Promise.race`-enforced deadline in `ask()` — holds unchanged.
- **Files modified:** `extension/popup.js`, `test/extension/popup-recovery.test.js`
- **Verification:** `failure-seam.test.js` back to 9 passed; `popup-recovery.test.js > the popup waits longer than the worker is allowed to, so it cannot cut off a real answer` passes; the timing tests read the shipped value rather than transcribing it, so they adapted with no edit.
- **Committed in:** `11eded7`
- **Recorded:** WINDOWS entry 16.

**2. [Rule 1 - Bug] `popup-focus-guard` mutates the focus restoration, not the disabled-state guard the plan named**

- **Found during:** Task 3
- **Issue:** The plan specifies the mutation as "reinstate the disabled-state condition on focus restoration in `end`". It is not killable, because it is not reachable: Task 1's corrected ordering clears `outstanding` and re-enables the control *before* `end()` runs, so `!control.disabled` is true on every failure path that has a confirmed value, and on the nothing-ever-confirmed path focusing a disabled control is a no-op in the browser anyway. Registering it would have claimed a kill the gate could not honestly deliver.
- **Fix:** Measured it rather than assumed it — a throwaway registry entry with exactly that mutation reported `popup-focus-guard-asnamed: SURVIVED (exit 0)`, `MUTATION KILLS: 0/1 killed`. The registered `popup-focus-guard` therefore deletes the restoration itself (`if (hadFocus) control.focus();`), which is the clause that is actually load-bearing on that seam. Removing the redundant guard from the source is still the right change and is still made — it is hygiene that decouples focus from the disabled state, not a behaviour the gate can pin.
- **Files modified:** `test/mutants/popup-recovery.mutants.json`
- **Verification:** `npm run test:mutants -- --only popup-focus-guard` → killed; the full gate reports 10/10.
- **Committed in:** `b4f454d`
- **Recorded:** WINDOWS entry 17.

**3. [Rule 1 - Bug] `toggle.test.js` asserted the defect WR-07 reports**

- **Found during:** Task 1 (GREEN)
- **Issue:** `a rejected read after a write refuses to claim a preference it could not confirm` asserted `control.disabled === true` after a failed save — "the switch is taken out of service" — which is precisely the behaviour the review found wrong and this plan reverses. `toggle.test.js` is not in the plan's `files_modified`, but Task 1's own acceptance criteria require that suite to exit 0.
- **Fix:** Rewrote the assertion to the corrected contract — the switch returns to the last confirmed value (`checked === true`) and stays operable (`disabled === false`) — keeping the test's name and its intent, and citing WR-07 in the comment. No other test in the repository asserted the old behaviour.
- **Files modified:** `test/extension/toggle.test.js`
- **Verification:** `toolbar-popup.test.js`, `toggle.test.js`, `runtime-contract.test.js` → 109 passed.
- **Committed in:** `272c074`
- **Recorded:** WINDOWS entry 18.

**4. [Rule 3 - Blocking] `gsd-tools windows append` still cannot write to this ledger**

- **Found during:** close-out
- **Issue:** Unchanged from 04-08: the command validates the whole ledger first and rejects the pre-existing `accepted-risk` entry as an invalid kind (`Error: Ledger entry 11 has invalid kind: "accepted-risk"`).
- **Fix:** Appended entries 16, 17 and 18 by hand to both the table and the JSON block, and updated `open_count` (10 → 13) and `total_count` (15 → 18). Earlier entries were left exactly as found, including the pre-existing `fixed_count` mismatch that 04-08 also declined to rewrite.
- **Files modified:** `.planning/WINDOWS.md`
- **Verification:** the JSON block parses and contains ids 1–18 with no duplicates; 13 open.

---

**Total deviations:** 4 auto-fixed (3 bugs, 1 blocking).
**Impact on plan:** No scope creep. Deviation 1 changes one constant's value and adds one assertion in service of the property the plan set out to protect; deviations 2 and 3 correct claims the plan made about test artefacts, both with measured evidence; deviation 4 is bookkeeping forced by a tool defect. Every task's `<done>` statement holds as written.

## Issues Encountered

- **happy-dom is not a browser about focus.** It leaves `activeElement` on a control it has just disabled and will happily focus a disabled one. A first pass at the keyboard test therefore passed against the unfixed source. The suite now models the platform on the element — blur *as* the control becomes disabled (doing it after is too late; an already-disabled element is no longer focusable, which is why the first attempt at the model silently did nothing), and `focus()` a no-op while disabled. Without that model the `activeElement` assertion is worthless and `popup-focus-guard` would have been killed for a reason that does not hold in Chrome.
- **`world.traffic` records replies too.** An early request count was double what it should have been because `traffic` carries both `to-worker` requests and `response` entries; the helper now filters on direction. No product behaviour was involved.
- **RED-evidence format.** As in 04-08, `gsd-tools check tdd-red-evidence` parses `node --test` TAP, which needs `# tests / # pass / # fail` summary lines that vitest's `tap-flat` reporter does not emit. Both records were built from the real `tap-flat` output with those three lines appended, transcribed from the `ok` / `not ok` counts of that same run.

## Known Stubs

None.

## Live acceptance: `popup-keyboard` does not carry forward

`popup-keyboard` is recorded in `04-LIVE-ACCEPTANCE.md` (04-UAT.md test 17) as a **passed** live observation taken against the pre-repair bytes. **This plan changes the popup's focus behaviour, so that observation does not carry forward.** It must be reset to `pending` by 04-11 along with the other thirteen, and the automated `activeElement` assertion added here is explicitly **not** a substitute for it: it is an assertion against a modelled platform, not an observation of Chrome. WR-07's own impact note anticipated this — "`popup-keyboard` is still a pending human check, so this will be judged by a person against the code as it stands."

## Threat Flags

None. The plan's `<threat_model>` covers every surface touched. `T-04G-13` (a control asserting a preference nothing confirmed) and `T-04G-14` (the unbounded wait plus the dead control) are both mitigated and each is now pinned by mutants; `T-04G-15` holds unchanged — `lastConfirmed` is display state only, never sent, and only ever assigned from a value storage reported back; `T-04G-16` holds — no string was added, and both ratified lines still occur exactly once. The popup still reads and writes no storage, builds no markup, renders no page-derived content and makes no network call.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The eleven-asset inventory is final for this run. 04-11 can re-establish `04-LIVE-ACCEPTANCE.md` against the current bytes and regenerate the timing samples, and must reset `popup-keyboard` to `pending`.
- `npm run test:mutants` reports 10/10, discharging the precondition 04-12, 04-13 and 04-14 each declare.
- WR-04 is now closed across 04-08 (worker hops) and this plan (popup hop). The optional `readPreference(done)` drop guard in `extension/content.js` remains deferred and recorded.
- One deliberate residual: the popup's deadline and the worker's are two copies of one idea in two files. There is no build step to share them (D-06), so the ordering is held by a test rather than by the type system. If a future plan changes either constant, that test is what will catch it.

---
*Phase: 04-honest-failure-and-an-off-switch*
*Completed: 2026-09-10*

## Self-Check: PASSED

- Both created files exist on disk (`test/extension/popup-recovery.test.js`, `test/mutants/popup-recovery.mutants.json`), as do both modified sources.
- All five task commits (`0fbde6c`, `272c074`, `2b614f4`, `11eded7`, `b4f454d`) are present in the log; `git rev-list --count 024f8d7..HEAD` measured **5**.
- Every task-level `<acceptance_criteria>` re-run and passing, except Task 2's first bullet (`const REQUEST_TIMEOUT_MS = 2000;`) which is documented as deviation 1 and shipped as `5000`.
- Plan-level `<verification>` re-run: `test/extension` reports exactly one failing test and it is the acceptance byte pin; `MUTATION KILLS: 10/10 killed` (exit 0); `extension/popup.js` contains `lastConfirmed`, `REQUEST_TIMEOUT_MS` and `Promise.race(`; both ratified failure strings occur exactly once; `activeElement` still matches.
