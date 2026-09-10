---
phase: 04-honest-failure-and-an-off-switch
plan: "13"
subsystem: testing
tags: [chrome-extension, mv3, service-worker, mutation-testing, vitest, happy-dom, protocol-validation]

# Dependency graph
requires:
  - phase: 04-08
    provides: bounded worker hops and the mutation-gate pattern in extension/background.js
  - phase: 04-11
    provides: the re-established acceptance record with all live evidence reset to pending
  - phase: 04-12
    provides: test/extension/tracer-world.js harness controls (silenceContent, setResponseDelay) and the honest mechanism-level mutant precedent
provides:
  - One named test per clause of the worker's status and apply reply gates, reached with payloads the real content script cannot produce
  - One named test per clause of the popup's own validStatus / validPreference gates, on both the refresh and set-enabled paths
  - A structural completeness assertion over the five encodings of the finite {diagnosis, reason} protocol, with minimum-count guards against a vacuous parse
  - An action double that refuses an icon path outside the packaged inventory, as Chrome does
  - Five registered mutants that each must die, taking the mutation gate from 17/17 to 22/22
affects: [04-14, phase-05-store-submission, any phase that grows the diagnosis or reason taxonomy]

actuals:
  tokens: 12641
  tasks: 3
  commits: 5
plan_head_before: ca1b2dcc3e13e6929c18c23bf833c5bd7d72433c

tech-stack:
  added: []
  patterns:
    - "Hand-registered listener on the real per-tab seam: an illegal reply is produced by pushing onto the same contentListeners list loadContent uses, so the worker cannot tell the difference and no new harness mode is introduced"
    - "Minimum-count guard on every source parse: a matchAll that silently matches nothing fails instead of passing vacuously"
    - "A mutant note records the assertion it was MEASURED to die on, not the assertion it might have died on"

key-files:
  created:
    - test/extension/worker-integrity.test.js
    - test/mutants/worker-boundary.mutants.json
  modified:
    - test/extension/tracer-world.js

key-decisions:
  - "A refused apply reply reports the ratified connection line, not the not-applied line: popup.js checks status === 'unavailable' BEFORE !applied, so a reply the worker never accepted can never be presented as a document that answered and declined"
  - "The packaged-icon allowed set is READ FROM extension/icons/ rather than transcribed, so a shape added in a later phase cannot leave the double's check stale"
  - "The five encodings of the finite protocol are parsed out of source with matchAll (D-06 forbids a build step, so the maps are IIFE-local and unexportable), and every parse carries a minimum expected count"
  - "diagnosis-pairing's registry note states the assertion it was measured to die on — the toolbar deep-equality — and explicitly states that the no-valueless-title invariant in the same test is NOT what fires, because the equality precedes it"

patterns-established:
  - "Table-driven refusal suites: one { name, reply } row per gate clause, so a future clause is one row rather than a new test"
  - "Expected copy comes from the tracer's exported COPY and ICON maps, never a retyped literal, and the tracer map is itself asserted equal to the shipped string set in both directions"

requirements-completed: [FAIL-01, FAIL-02, FAIL-05]

coverage:
  - id: D1
    description: "Every clause of the worker's status-reply gate (shape, echoed request id, diagnosis membership, reason membership, type) is refused, and the tab reports the connection fact"
    requirement: "FAIL-01"
    verification:
      - kind: integration
        ref: "test/extension/worker-integrity.test.js#a status reply carrying %s is refused, and the tab reports the connection fact"
        status: pass
      - kind: other
        ref: "npm run test:mutants -- --only status-reply-gate"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every clause of the worker's apply-reply gate, including the non-boolean applied member and the echoed request id that is requestApply's only staleness key, yields no outcome"
    requirement: "FAIL-01"
    verification:
      - kind: integration
        ref: "test/extension/worker-integrity.test.js#an apply reply carrying %s is not an outcome, and the popup says so"
        status: pass
      - kind: other
        ref: "npm run test:mutants -- --only request-id-echo"
        status: pass
    human_judgment: false
  - id: D3
    description: "The popup's own validStatus / validPreference gate and its unknown-key copy fallback are load-bearing on both the refresh and set-enabled paths"
    requirement: "FAIL-01"
    verification:
      - kind: integration
        ref: "test/extension/worker-integrity.test.js#a set-enabled reply carrying an out-of-set status is refused, and the popup claims nothing"
        status: pass
      - kind: other
        ref: "npm run test:mutants -- --only popup-valid-gate"
        status: pass
      - kind: other
        ref: "npm run test:mutants -- --only popup-copy-fallback"
        status: pass
    human_judgment: false
  - id: D4
    description: "The five encodings of the finite {diagnosis, reason} protocol — DIAGNOSES, REASONS, ICONS, TITLES and the popup's COPY — are asserted complete and in agreement, with minimum-count guards against a vacuous parse"
    requirement: "FAIL-05"
    verification:
      - kind: unit
        ref: "test/extension/worker-integrity.test.js#the worker title map and the popup copy map have identical keys and identical text"
        status: pass
      - kind: unit
        ref: "test/extension/worker-integrity.test.js#every renderable pair has an icon for its status, and every icon is packaged"
        status: pass
      - kind: unit
        ref: "test/extension/worker-integrity.test.js#every pair is built from the shipped finite sets, and the two encodings of those sets agree"
        status: pass
      - kind: unit
        ref: "test/extension/worker-integrity.test.js#the tracer copy map is exactly the set of strings the product ships"
        status: pass
    human_judgment: false
  - id: D5
    description: "An unpaired combination reaching the worker produces a clean fallback — neutral artwork and the no-readable-view title — rather than one state's artwork under another state's title"
    requirement: "FAIL-05"
    verification:
      - kind: integration
        ref: "test/extension/worker-integrity.test.js#an unpaired combination leaves a clean fallback, never a half-written toolbar"
        status: pass
      - kind: other
        ref: "npm run test:mutants -- --only diagnosis-pairing"
        status: pass
    human_judgment: false
  - id: D6
    description: "The tracer's action double refuses an icon path outside the packaged inventory, exactly as Chrome does, with the allowed set derived from extension/icons/"
    verification:
      - kind: unit
        ref: "test/extension/worker-integrity.test.js#the action double refuses an icon path outside the packaged inventory, as Chrome does"
        status: pass
    human_judgment: false
  - id: D7
    description: "Whether the three packaged icon shapes are distinguishable at a glance in a real toolbar, and whether the connection line reads as an honest fallback to an agent"
    verification: []
    human_judgment: true
    rationale: "FAIL-05's glance property is a human perceptual judgment. Simulated delivery is not browser acceptance, and 04-11 reset every live check to pending against the current bytes."

# Metrics
duration: 21 min
completed: 2026-09-10
status: complete
---

# Phase 04 Plan 13: Worker Boundary Validation and Protocol Completeness Summary

**Twenty-five named tests that make every clause of the worker's and the popup's reply gates load-bearing in the removal direction, plus five mutants that each die on a named assertion — the mutation gate now reports 22/22.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-09-10T17:25:18Z
- **Completed:** 2026-09-10T17:46:00Z
- **Tasks:** 3
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- **WR-02 closed.** Deleting `reply.requestId === requestId`, replacing `requestStatus`'s whole shape-and-diagnosis gate with a constant, and deleting the popup's own validity clause each previously left the suite green. All three now turn it red, measured out of tree.
- **WR-05 closed.** The five places the finite `{diagnosis, reason}` protocol is encoded are asserted in agreement, and an unpaired combination is proven to produce a clean fallback rather than one state's artwork under another state's title.
- **Harness fidelity raised.** The action double now rejects artwork the package does not contain, so the review's stated impact — the `setIcon` rejection swallowed by `catch`, `setTitle` never reached — is reproducible rather than merely described.
- Suite: 580 → 605 tests, all passing. Mutation gate: 17/17 → 22/22 killed.

## Task Commits

1. **Task 1: One test per boundary clause** — `7450653` (test)
2. **Task 2 RED: failing test for packaged-icon-path validation** — `36af6de` (test)
3. **Task 2 GREEN: the double refuses unpackaged artwork** — `9e29e0b` (feat)
4. **Task 2: structural completeness and clean-fallback tests** — `5f2e001` (test)
5. **Task 3: five boundary mutants registered** — `30bc200` (test)

## Files Created/Modified

- `test/extension/worker-integrity.test.js` (new, 411 lines) — 25 tests: two table-driven refusal suites, five popup-gate tests, four structural-agreement tests, the clean-fallback behavioural test and the harness-fidelity test.
- `test/mutants/worker-boundary.mutants.json` (new) — five entries, each naming only `worker-integrity.test.js` in `suites`, each `count` at the default 1.
- `test/extension/tracer-world.js` (modified, +16/-1) — `PACKAGED_ICON_PATHS` read from `extension/icons/`; `workerChrome.action.setIcon` rejects a path outside it.

## The illegal reply shapes covered

Every one is produced by a hand-registered listener pushed onto the same per-tab `contentListeners` array `loadContent` uses. No new harness mode was added.

| Shape | Status path | Apply path |
|---|---|---|
| Request id that is not the one minted | yes | yes |
| Extra member beyond the four (status) / five (apply) named | yes | yes |
| Missing named member | yes | yes |
| Diagnosis outside the finite set | yes | yes |
| Reason outside the finite set | yes | yes |
| `type` member naming the other exchange | yes | yes |
| `applied` member that is not a boolean | n/a | yes |

Popup-side, driven through a worker-facing listener on the same seam the real service worker uses:

- out-of-set status on `popup-status` → connection line, switch out of service (nothing confirmed)
- preference that is neither boolean nor null on `popup-status` → connection line
- individually-valid but **unpaired** `{status, reason}` → connection line, switch stays in service
- out-of-set status on `set-enabled` → `NOT_SAVED`, control reverted to the last confirmed value and left operable
- non-boolean preference on `set-enabled` → same

**A refused apply is reported as the connection line, not the not-applied line.** `popup.js` tests `reply.status === 'unavailable'` before `!reply.applied`, so a reply the worker never accepted can never be presented as a document that answered and declined. This matches 04-12's ratified decision for the timeout path. A separate test asserts the preference is still persisted, because saving and applying are two facts.

## The agreements the completeness test asserts, and the minimums it pins

The maps are IIFE-local and unexportable (D-06 forbids a build step), so they are parsed out of the shipped source with `matchAll`, following the icon-inventory idiom already in `toolbar-popup.test.js`.

| Parsed from | Symbol | Minimum count pinned | Actual |
|---|---|---|---|
| `background.js` | `DIAGNOSES` | 4 | 4 |
| `background.js` | `REASONS` | 4 | 4 |
| `background.js` | `ICONS` | 6 | 6 |
| `background.js` | `TITLES` | 8 | 8 |
| `popup.js` | `STATUSES` | 6 | 6 |
| `popup.js` | `REASONS` | 4 | 4 |
| `popup.js` | `COPY` | 8 | 8 |

Agreements asserted:

1. `TITLES` and the popup's `COPY` have identical key sets — checked in both directions — and identical text for every shared key.
2. Every title key's status part has an `ICONS` entry, every `ICONS` key is a status part some title uses (no dead artwork), and every `ICONS` path is in the packaged inventory.
3. Every title key's status part is a member of `DIAGNOSES` or one of the two operational values (`off`, `unavailable`); every reason part is a member of `REASONS`.
4. The popup's `STATUSES` is exactly `DIAGNOSES` plus those two operational values; the popup's `REASONS` equals the worker's.
5. The tracer's exported `COPY` map is exactly the set of strings the product ships (`TITLES` values ∪ popup `COPY` values ∪ `NOT_SAVED` ∪ `NOT_APPLIED`) — asserted in **both** directions, so neither a shipped string missing from the double nor a double-only string can survive.

Every failure names the offending key: the assertions are `expect(offenders).toEqual([])` over filtered key lists, never a bare boolean.

## The icon-path allowed set the double now derives

`PACKAGED_ICON_PATHS` = `readdirSync(extension/icons/).sort().map(name => 'icons/' + name)` =
`['icons/missing.png', 'icons/neutral.png', 'icons/off.png', 'icons/unreadable.png', 'icons/working.png']`.

Derived, not transcribed, so a shape added in a later phase cannot leave the check stale. `setIcon` rejects anything outside it; the existing `actionAvailable` rejection path and the `actionLog` push for accepted calls are unchanged, and the full 497-test extension suite passes with no existing test moved.

## The five mutants, with the assertion each was measured to die on

Each was applied to a throwaway copy, checked with `node --check` (all five parse), and run against `worker-integrity.test.js` only. None names `phase-04-live-acceptance.test.js`; none uses a `count` above 1.

| Mutant | Verdict | Tests failed | The assertion it died on |
|---|---|---|---|
| `request-id-echo` | killed (exit 1) | 3 / 25 | `expected { icon: 'icons/working.png', … } to deeply equal { icon: 'icons/neutral.png', … }`, and `expected 'Tinting is off' to be 'No readable view is connected'` |
| `status-reply-gate` | killed (exit 1) | 7 / 25 | `expected { icon: 'icons/working.png', … } to deeply equal { icon: 'icons/neutral.png', … }`, plus `expected undefined to deeply equal …` and `expected { icon: 'icons/missing.png', … } …` |
| `diagnosis-pairing` | killed (exit 1) | 1 / 25 | `expected { icon: 'icons/missing.png', … } to deeply equal { icon: 'icons/neutral.png', … }` |
| `popup-valid-gate` | killed (exit 1) | 2 / 25 | `expected 'No readable view is connected' to be 'Zhroma could not save that setting'`, and `expected 'Priority tinting is working' to be 'Zhroma could not save that setting'` |
| `popup-copy-fallback` | killed (exit 1) | 1 / 25 | `expected '' to be 'No readable view is connected'` |

**What `diagnosis-pairing` does NOT prove, stated rather than glossed.** It was measured to die on the clean-fallback test's `world.action()` deep-equality, which carries both halves of the failure at once (`icons/missing.png` under an undefined title). The separate no-valueless-title invariant in the same test guards that second half and passes on unmutated source, but it is **not** the assertion that fires for this mutant, because the equality precedes it. The registry note says exactly that. This follows 04-12's precedent: a note may not claim a property it does not exercise.

**What `status-reply-gate` does NOT prove.** It fences `requestStatus`'s combined gate as a whole. The individual clauses inside `validDiagnosis` are fenced separately by `request-id-echo` and `diagnosis-pairing`; the `isExact` shape check and the two membership clauses have no mutant of their own and are covered only by the behavioural table.

**What `popup-valid-gate` does NOT prove.** It deletes the validity clause from `requestEnabled`'s gate only. `refresh`'s gate carries the same two clauses in the opposite source order and is therefore a distinct literal with no mutant of its own; its behaviour is covered by the two `popup-status` tests but is not individually fenced.

## Decisions Made

- **The refused-apply line is `unavailable`, not `NOT_APPLIED`.** Asserted from the shipped branch order rather than from the plan's wording, which called it "the ratified could-not-apply line". Producing `NOT_APPLIED` would claim the document answered and declined, which is a statement the worker has no evidence for.
- **`STATUS_REFUSALS` and `APPLY_REFUSALS` each carry a `type`-member row beyond the seven the plan named.** `validDiagnosis` checks `reply.type === type`, and that clause had no case; one extra row was cheaper than leaving it uncovered.
- **The tracer copy-map equality is asserted in both directions**, not just "the double covers the product". A double-only string is copy nothing can produce and is drift in the other direction.

## Deviations from Plan

None — plan executed as written. The one addition beyond the letter of the behaviour list (the `type`-member rows) is recorded under Decisions Made rather than as a deviation: it adds coverage, changes no shipped byte, and removes nothing the plan asked for.

## TDD Gate Compliance

The plan marks Tasks 1 and 2 `tdd="true"`. Recorded honestly rather than papered over:

- **Task 2's harness change ran a genuine RED → GREEN cycle.** The harness-fidelity test was written first and failed on the assertion `promise resolved "undefined" instead of rejecting` (exit 1, 20 tests, 19 pass, 1 fail). The record was verified with `gsd-tools check tdd-red-evidence` → `RED_EVIDENCE_OK` / `target_test_failed`, which authorized GREEN (`9e29e0b`). The TAP trailer was **transcribed** from that same run's real 19 `ok` / 1 `not ok` counts, because vitest's `tap-flat` reporter emits no `node:test` trailer; it was not invented and the run was not repeated to obtain a different number.
- **Task 1 had no RED phase, and this is the fail-fast rule's prescribed outcome, not a violation.** Its tests characterise behaviour the shipped worker and popup already implement correctly, so a RED run would have been an unexpected GREEN under `tdd.md`'s Fail-Fast Rule 1 — "the feature may already exist; investigate". It does exist. Manufacturing a RED would have required breaking shipped bytes, which this plan forbids.
- **The equivalent evidence is Task 3, and it is measured rather than asserted.** Each of the five mutants is a recorded run in which the shipped guard is absent and this suite goes red on a named assertion. That is the "fails without the implementation" proof RED exists to produce, obtained without touching a shipped byte in the working tree.
- No `refactor(04-13)` commit exists: no cleanup was warranted.

## Issues Encountered

- The plan's `requirements` field names FAIL-01, FAIL-02 and FAIL-05 and is copied verbatim into `requirements-completed`, but **this plan does not advance FAIL-02** (the 100 ms settle gate for missing-column certainty). Nothing here touches the settle path. FAIL-01 and FAIL-05 are genuinely advanced in the automated-evidence direction; all three remain `unresolved` in the deterministic edge probe's terms, as `<flagged_assumptions>` records, and FAIL-05's glance property remains a human judgment (D7 above).
- No shipped byte under `extension/` was touched, so `04-LIVE-ACCEPTANCE.md`'s byte binding is undisturbed and Phase 4 still carries zero live browser evidence against the current bytes (04-11's reset stands).
- `.planning/WINDOWS.md` was not appended to: this plan produced no stub, no skipped test, no unrun `<verify>` and no deviation. The known-broken `gsd-tools windows append` (it rejects the pre-existing entry 12) was therefore not exercised.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- WR-02 and WR-05 are closed in the automated-evidence direction. The taxonomy can now grow: adding a diagnosis or a reason that is only half-added to the five encodings fails a named test that prints the offending key.
- 04-14 is unblocked. `test/extension/tracer-world.js` gained one behaviour (`setIcon` rejects unpackaged artwork) that defaults to today's behaviour for every existing caller; any later plan sharing that file inherits it.
- Outstanding and unchanged by this plan: ACK-04-01 awaits the user, and every Phase 4 live check remains pending against the current bytes.

---
*Phase: 04-honest-failure-and-an-off-switch*
*Completed: 2026-09-10*

## Self-Check: PASSED

- `test/extension/worker-integrity.test.js` — present on disk
- `test/mutants/worker-boundary.mutants.json` — present on disk
- `test/extension/tracer-world.js` — present on disk, modified
- Commits `7450653`, `36af6de`, `9e29e0b`, `5f2e001`, `30bc200` — all present in git history
- `npm test` exit 0 (605 passed) · `test/extension` exit 0 (497 passed) · `test:mutants` exit 0 (22/22 killed) · `test:recon` with the fixture manifest exit 0
