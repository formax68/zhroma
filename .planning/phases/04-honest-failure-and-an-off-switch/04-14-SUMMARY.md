---
phase: 04-honest-failure-and-an-off-switch
plan: "14"
subsystem: testing
tags: [chrome-extension, mv3, service-worker, mutation-testing, vitest, happy-dom, serialization, tab-lifecycle]

# Dependency graph
requires:
  - phase: 04-08
    provides: bounded worker hops and the mutation-gate pattern (scripts/verify-mutation-kills.js, the test:mutants script)
  - phase: 04-11
    provides: the re-established acceptance record with all live evidence reset to pending
  - phase: 04-12
    provides: test/extension/toolbar-popup.test.js as shared ground, the per-tab project queue, and the deferred-write harness controls
  - phase: 04-13
    provides: the mutation registry at 22 entries, and the precedent that a mutant note records only the assertion it was measured to die on
provides:
  - An inversion test driven by genuinely interleaved deferred writes, so it now fails without the queue it is named for
  - The single-writer rule stated as an invariant — at no observation point are two preference writes in flight — rather than inferred from a final value
  - A named closed-tab test whose source-shape guard asserts the removal listener's registration and its map deletion as two separately failing halves
  - Two behavioural closed-tab facts: a neighbour tab's toolbar is untouched by a close, and a projection for a closed tab resolves without throwing and writes only the operational connection state, scoped to the dead tab
  - Three registered mutants taking the mutation gate from 22/22 to 25/25
affects: [phase-05-store-submission, any phase that touches the preference write path or the per-tab state map]

actuals:
  tokens: 2127
  tasks: 2
  commits: 2
plan_head_before: bf51e395c505f51686ed908a67a749916c89a683

tech-stack:
  added: []
  patterns:
    - "A concurrency rule is asserted as an invariant at every observation point, not as a consequence sampled once at the end"
    - "A guard that can only be expressed as a source-shape assertion says so in the test body, names the constraint that forces it, and states what it does not prove"
    - "Two halves of one mechanism are asserted separately whenever a mutant exists for each half, so neither can hide behind the other"

key-files:
  created:
    - test/mutants/worker-lifecycle.mutants.json
  modified:
    - test/extension/toolbar-popup.test.js
    - .planning/WINDOWS.md

key-decisions:
  - "The single-writer property is observed through pendingWriteCount() under deferred writes rather than through a reverse flush: it needs no new harness control (tracer-world.js is owned by 04-13 in this same wave), and it states the rule directly instead of inferring it from a final value that is identical with and without the queue"
  - "The closed-tab map deletion is guarded by a source-shape assertion and the test says so in its own body: the tabs map has no external observable, and exposing one would move a shipped byte and re-invalidate the acceptance binding 04-11 just re-established"
  - "The plan's truth that a projection for a closed tab 'neither throws nor paints' was MEASURED false for the paint half and is recorded as an unmet truth rather than asserted: the worker paints the operational connection state on the dead tab id, and the honest assertions replaced it"

patterns-established:
  - "Invariant-by-observer: a small observe() closure asserts the rule and records the value, so the mutant dies on the invariant rather than on an incidental end-state equality"
  - "A mutant pair per mechanism half (registration and body), each with the measured failing assertion quoted in its note"

requirements-completed: [CTRL-02, CTRL-03]

coverage:
  - id: D1
    description: "Two popups asking for opposite values commit in arrival order with the last request winning, proven with genuinely interleaved writes, and at no point are two preference writes in flight at once"
    requirement: "CTRL-02"
    verification:
      - kind: integration
        ref: "test/extension/toolbar-popup.test.js#two popups asking for opposite values are serialized, and neither inverts the other"
        status: pass
      - kind: other
        ref: "npm run test:mutants -- --only preference-serialization"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both halves of the closed-tab cleanup are load-bearing: removing the tab-removal listener and gutting its body are separately detected"
    requirement: "CTRL-03"
    verification:
      - kind: integration
        ref: "test/extension/toolbar-popup.test.js#a closed tab's per-tab state is released without disturbing its neighbour"
        status: pass
      - kind: other
        ref: "npm run test:mutants (tabs-onremoved-listener, tabs-onremoved-delete)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Closing one tab leaves another tab's recorded icon and title exactly as they were, and a projection for the closed tab resolves without throwing and writes against no living tab"
    requirement: "CTRL-03"
    verification:
      - kind: integration
        ref: "test/extension/toolbar-popup.test.js#a closed tab's per-tab state is released without disturbing its neighbour"
        status: pass
    human_judgment: false
  - id: D4
    description: "The whole registry is re-runnable and every registered mutant dies"
    verification:
      - kind: other
        ref: "npm run test:mutants -> MUTATION KILLS: 25/25 killed (exit 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The per-tab state map is actually bounded at runtime in a real browser session, rather than merely guarded by a source-shape assertion"
    requirement: "CTRL-03"
    verification: []
    human_judgment: true
    rationale: "The map has no external observable and exposing one would change a shipped byte and re-invalidate the acceptance binding. Only a measurement against a running worker — with a worker-side observable that does not exist — could establish boundedness; the shape guard kills the mutants but does not prove it."
  - id: D6
    description: "The preference converges correctly across processes in a real browser, including a genuine quit and reopen"
    requirement: "CTRL-02"
    verification: []
    human_judgment: true
    rationale: "The single-writer invariant is observed through the double's pending-write queue — a faithful model of a storage write that has not yet committed, not a measurement of Chrome's actual commit timing. The cross-tab-preference live check in 04-LIVE-ACCEPTANCE.md is the only evidence for this and is pending after 04-11's re-establishment; a browser quit and reopen is not reproducible in-process."

# Metrics
duration: 19 min
completed: 2026-09-10
status: complete
---

# Phase 04 Plan 14: Coverage for Single-Writer Serialization and Closed-Tab Cleanup Summary

**The inversion test now fails without the queue it is named for — single-writer stated as an invariant under deferred writes — and both halves of the closed-tab cleanup are separately fenced, taking the mutation gate to 25/25.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-09-10T17:47:00Z
- **Completed:** 2026-09-10T18:06:00Z
- **Tasks:** 2
- **Files modified:** 3 (2 in task commits, plus the WINDOWS ledger)

## Accomplishments

- **WR-06's headline defect is closed.** `two popups asking for opposite values are serialized, and neither inverts the other` was passing with `serializePreference` collapsed to a bare call. It is now constructed with `writeMode: 'deferred'` and dies on the mutant.
- **Single-writer is an invariant, not an inference.** An `observe()` closure asserts `pendingWriteCount() < 2` at each of three observation points and records the value; the recorded sequence is `[1, 1, 0]`.
- **Both halves of the closed-tab cleanup are separately fenced**, with the source-shape nature of that guard stated in the test body rather than glossed.
- **Three mutants registered and individually killed;** `npm run test:mutants` reports `MUTATION KILLS: 25/25 killed` and exits 0.
- **One plan truth was measured false and recorded as such** rather than being asserted anyway (see Deviations).

## Task Commits

1. **Task 1: Two writers, genuinely interleaved, and a cleanup that is guarded** — `264368e` (test)
2. **Task 2: Require the queue and both cleanup halves to be individually killed** — `b43664f` (test)

`commits: 2` in the frontmatter is MEASURED — `git rev-list --count bf51e39..HEAD` at SUMMARY-write time, before the docs commit exists.

## Files Created/Modified

- `test/extension/toolbar-popup.test.js` — the rewritten inversion test and the new closed-tab test (+84 lines net)
- `test/mutants/worker-lifecycle.mutants.json` — three mutants: `preference-serialization`, `tabs-onremoved-listener`, `tabs-onremoved-delete`
- `.planning/WINDOWS.md` — ledger entry 22 (`unmet-truth`), appended by hand

No file under `extension/` was touched. The acceptance byte binding 04-11 re-established is intact; `PHASE 04 LIVE ACCEPTANCE STATUS: human_needed` is unchanged, with seventeen checks pending.

## The measurements this plan was asked to record

### Pending-write counts, write log and stored value

World constructed with `writeMode: 'deferred'`. Both `change` events dispatched before either request can complete.

| Observation point | `pendingWriteCount()` | `writeLog` | `getStored('enabled')` |
|---|---|---|---|
| after both requests dispatched | **1** | `[{enabled:false}]` | `undefined` |
| after the first `flushWrites()` | **1** | `[{enabled:false},{enabled:true}]` | `false` |
| after the second `flushWrites()` | **0** | `[{enabled:false},{enabled:true}]` | `true` |

The second request's `set` is never called while the first is parked — that is the queue, observed directly. With `serializePreference` collapsed, the first observation reads **2**, which is what kills the mutant.

Final state: write log holds exactly the two desired values in arrival order with no third value and no inversion; the stored boolean is the second request's value; the second popup's checkbox reads `true`; the content script's markers are `['Urgent','High','Normal','Low']`; `world.forbidden` is empty.

### The two halves of the cleanup assertion

Parsed from `asset('background.js')` with the file's existing `matchAll` idiom:

1. **Registration half** — `chrome.tabs.onRemoved.addListener((tabId) => { … });` matches exactly once. Deleting the registration makes this fail with `expected [] to have a length of 1`.
2. **Body half** — the matched listener body contains `tabs.delete(tabId);`. Gutting the body while leaving the registration makes this fail with `expected '' to contain 'tabs.delete(tabId);'`.

Asserted separately so the two mutants produce distinguishable failures. Both are shape guards; neither demonstrates that the map is bounded at runtime, and the test body says so.

### Mutant ids and kill status

| id | Killed | Measured failing assertion |
|---|---|---|
| `preference-serialization` | yes (exit 1) | `2 preference writes in flight at once: expected 2 to be less than 2` — the invariant, at the first observation point |
| `tabs-onremoved-listener` | yes (exit 1) | `expected [] to have a length of 1` — the registration half |
| `tabs-onremoved-delete` | yes (exit 1) | `expected '' to contain 'tabs.delete(tabId);'` — the body half |

Each scratch run failed on a **test assertion**, with exactly one failing test out of 78 in the suite — not on a module load or a parse error. No entry names `test/extension/phase-04-live-acceptance.test.js`; no entry sets `count` above the default `1`.

### Run-wide totals

- **Eleven in-scope review findings** are now closed or carry a recorded disposition. This was the last plan of the gap-closure run.
- **Twenty-five mutants**, all killed: six from 04-08, four from 04-10, seven from 04-12, five from 04-13, three from here. `MUTATION KILLS: 25/25 killed`, exit 0, the word `SURVIVED` absent.
- **The acceptance record stands at `human_needed` with seventeen pending live checks**, exactly where 04-11 left it. Nothing in this plan moved a shipped byte, so nothing re-pointed that record.

## Decisions Made

- **Observe the property, do not infer it.** The review's fix note suggested a reverse flush; that needs a harness control on `tracer-world.js`, which 04-13 owns in this same wave. `pendingWriteCount()` under deferred writes discriminates the mutant with the controls that already exist and states the single-writer rule directly.
- **Assert the invariant inside the observer.** `observe()` asserts before it records, so the mutant dies on `expected 2 to be less than 2` rather than on a downstream sequence equality that happens to differ. That is the assertion quoted in the mutant's note.
- **Say what a shape guard is.** The closed-tab guard is source-shape because the map has no external observable; the alternative would move a shipped byte. The test body names the constraint and the limit, and both mutant notes repeat it.
- **Record a measured-false truth instead of asserting it.** See Deviations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's "a projection for a closed tab neither throws nor paints" is false for the paint half**

- **Found during:** Task 1 (before writing the assertion — measured with a throwaway probe, then deleted)
- **Issue:** `must_haves.truths[4]` and the task's `<behavior>` both state that projecting for a closed tab "adds no entry to `world.actionLog` for any tab". Measured against the shipped bytes, it adds **two**: `{tabId: 7, icon: 'icons/neutral.png'}` and `{tabId: 7, title: 'No readable view is connected'}`. After `chrome.tabs.onRemoved` releases the entry, `project()` mints a fresh generation through `stateFor`, `sendMessage` rejects for the closed tab, and `requestStatus`'s catch reports the connection fact — so `applyAction` writes the operational state against the dead tab id. The tracer's action double does not model Chrome refusing an action write for a closed tab.
- **Fix:** Asserted the honest form that the shipped code actually satisfies, and which still carries the property the truth was reaching for — the projection resolves without throwing; **every** write it makes is scoped to the closed tab id; those writes are the operational connection state (`icons/neutral.png` + `No readable view is connected`) and never a diagnosis about a view; and the living neighbour's recorded action is byte-for-byte unchanged across both the close and the projection.
- **Why not make the double refuse the write:** that would edit `test/extension/tracer-world.js`, which is outside this plan's `files_modified`, is owned by 04-13 one wave back, and is shared by three suites — a harness change in the last plan of the run, for a fidelity gain no assertion in scope needs.
- **Files modified:** `test/extension/toolbar-popup.test.js`, `.planning/WINDOWS.md` (ledger entry 22, `unmet-truth`)
- **Verification:** measured with a throwaway probe before the assertion was written; the deleted probe printed the exact two log entries quoted above. The committed test asserts the replacement form and passes.
- **Committed in:** `264368e` (Task 1 commit); ledger entry in the docs commit

---

**Total deviations:** 1 auto-fixed (1 bug — a plan claim contradicted by the shipped behaviour).
**Impact on plan:** No scope creep and no weakening of the mutants — `tabs-onremoved-listener` and `tabs-onremoved-delete` are killed by the source-shape halves, which are untouched by this. The affected assertion is behavioural colour around the guard, and its honest form is strictly more specific about what the worker does than the original wording was.

## Known Stubs

None. No placeholder, no `TODO`, no skipped test, and no unrun `<verify>` — all five plan-level verification commands were executed and are recorded below.

## Broken-windows ledger

`gsd-tools windows append` is still unusable on this project: it validates the whole ledger before writing and rejects the pre-existing entry 11 (`Ledger entry 11 has invalid kind: "accepted-risk"`). Entry **22** was therefore appended by hand — table row, JSON object and the three frontmatter counters (`open_count` 16 → 17, `total_count` 21 → 22, `last_updated`). No earlier entry was rewritten, and the pre-existing `total_count`/row-count drift was left alone, as every prior executor in this run left it.

## Verification

| # | Command | Result |
|---|---|---|
| 1 | `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension` | exit 0 — 13 files, 498 passed, 0 failed |
| 2 | `npm --prefix . run test:mutants` | `MUTATION KILLS: 25/25 killed`, exit 0, no `SURVIVED` |
| 3 | `npm test` | exit 0 — 17 files, 606 passed (605 before this plan, +1) |
| 4 | `env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm --prefix . run test:recon` | exit 0 — 606 passed |
| 5 | `… run … test/extension/phase-04-live-acceptance.test.js` | `PHASE 04 LIVE ACCEPTANCE STATUS: human_needed`, 42 passed |

Task-level: the target test is named in the verbose reporter output (`✓ … two popups asking for opposite values are serialized, and neither inverts the other`), and so is the new closed-tab test.

## TDD Gate Compliance

Task 1 carries `tdd="true"`. Recorded honestly rather than papered over, following 04-13's precedent:

- **There was no RED phase, and that is the fail-fast rule's prescribed outcome rather than a violation.** Both tests characterise behaviour the shipped worker already implements correctly — the queue is present, the removal listener is present and deletes. A RED run would have been an unexpected GREEN under `tdd.md` Fail-Fast Rule 1 ("the feature may already exist — investigate"). It does exist. Manufacturing a RED would have required breaking a shipped byte, which this plan forbids and which would have re-invalidated the acceptance binding.
- **The equivalent evidence is measured, not asserted.** Before Task 1 was committed, `serializePreference` was collapsed in an out-of-tree scratch copy and the suite went red on exactly one test, on the named invariant: `AssertionError: 2 preference writes in flight at once: expected 2 to be less than 2` (1 failed | 77 passed). The same was done for both cleanup mutants. That is the "fails without the mechanism" proof RED exists to produce, obtained without touching the working tree.
- **No `check tdd-red-evidence` record was filed, deliberately.** There is no genuine RED run to describe, and transcribing a synthetic one would be precisely the overclaim this plan's own prohibition forbids.
- No `feat(04-14)` or `refactor(04-14)` commit exists: this plan writes no production code and needed no cleanup. Both commits are `test(04-14)`.

## Issues Encountered

- The plan's `<precondition>` on Task 2 held: `scripts/verify-mutation-kills.js` and the `test:mutants` script are present from 04-08, and the gate was at 22/22 before this plan.
- Committed on `main`. `.planning/config.json` sets `git.branching_strategy: "none"`, every prior plan in this milestone landed on `main`, and the orchestrator dispatched this plan sequential-on-`main` deliberately. No config was changed to work around the protected-branch advisory.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **The gap-closure run is complete.** All eleven in-scope 04-REVIEW findings are closed or carry a recorded disposition; the mutation gate is at 25/25; the full suite is 606 green.
- **What remains for Phase 4 is human evidence, not work.** Seventeen live checks are pending against the current bytes, `ACK-04-01` is outstanding and awaiting the user, and two judgment residuals are recorded here as `human_judgment: true` (D5, D6) and in the ledger as entry 22.
- No blocker for the phase's code review, regression gate or verification pass.

## Self-Check: PASSED

- `test/mutants/worker-lifecycle.mutants.json` exists on disk; `test/extension/toolbar-popup.test.js` and `.planning/WINDOWS.md` exist and carry the changes.
- Both task commits resolve in `git log`: `264368e`, `b43664f`.
- `git diff --diff-filter=D HEAD~2 HEAD` lists no deletions.
- The only untracked paths (`.gsd/`, `.planning/milestone.lock`, `.planning/ui-reviews/`) pre-date this plan and are out of scope.

---
*Phase: 04-honest-failure-and-an-off-switch*
*Completed: 2026-09-10*
